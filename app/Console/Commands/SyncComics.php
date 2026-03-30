<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use App\Models\Comic;
use App\Models\Shelf;
use App\Models\Setting;
use App\Jobs\ProcessComicAIJob;
use App\Jobs\GenerateThumbnailJob;
use App\Services\LoggingService;

class SyncComics extends Command
{
    protected $signature = 'app:sync-comics
                            {--dry-run : Show what would change without writing to DB}
                            {--truncate : Truncate the comics table before scanning}
                            {--skip-visual-hash : Skip perceptual hashing (faster, less duplicate detection)}
                            {--force-rehash : Recompute visual hashes even if already present}';

    protected $description = 'Scan base directory and sync comics to database';

    // --- In-memory caches ---------------------------------------------------
    private array $shelfCache    = [];   // "parentId:nameLower" => Shelf
    private array $shelfPivotSet = [];   // "comicId:shelfId"    => true

    // --- Batch accumulators -------------------------------------------------
    private array $toSave          = [];   // Comic models pending save
    private array $toSyncShelves   = [];   // Comic models and shelf IDs pending pivot sync
    private array $toDispatchAI    = [];   // Comic IDs pending AI job
    private array $toDispatchThumb = []; // Comic models pending thumbnail job

    private const SAVE_CHUNK    = 50;
    private const THUMB_CHUNK   = 20;   // parallel pdftoppm processes

    public function handle(): int
    {
        $startTime = microtime(true);

        $baseDir  = rtrim(config('comics.base_dir'), '/');
        $thumbDir = rtrim(config('comics.thumb_dir'), '/');
        $dryRun   = $this->option('dry-run');

        if (!is_dir($baseDir)) {
            $this->error("Base directory does not exist: $baseDir");
            return 1;
        }

        $this->info("Scanning $baseDir..." . ($dryRun ? ' [DRY RUN]' : ''));
        if ($this->option('truncate') && !$dryRun) {
            $this->warn("Truncating comics table...");
            Schema::disableForeignKeyConstraints();
            DB::table('comic_shelf')->truncate();
            DB::table('comic_user')->truncate();
            Comic::truncate();
            Schema::enableForeignKeyConstraints();
        }

        // -- 1. Preload existing comics --------------------------------------
        $existingComics = Comic::withTrashed()
            ->get([
                'id',
                'path',
                'filename',
                'thumbnail',
                'md5_hash',
                'visual_hash',
                'pages_count',
                'file_size',
                'published_date'
            ])
            ->keyBy('path');

        // Fast lookup maps
        $visualHashMap = $existingComics
            ->filter(fn($c) => !empty($c->visual_hash))
            ->keyBy('visual_hash');

        $md5HashMap = $existingComics
            ->filter(fn($c) => !empty($c->md5_hash))
            ->keyBy('md5_hash');

        // -- 2. Preload shelf pivot data to avoid redundant syncWithoutDetaching --
        $this->preloadShelfPivots($existingComics->pluck('id')->filter()->all());

        // -- 3. Collect PDF files --------------------------------------------
        $files = collect(File::allFiles($baseDir))
            ->filter(fn($f) => strtolower($f->getExtension()) === 'pdf');

        $this->info("Found {$files->count()} PDF files.");

        $counts = ['total' => 0, 'new' => 0, 'updated' => 0, 'skipped' => 0, 'removed' => 0];
        $processedPaths = [];

        $aiEnabled = Setting::get('ai_enabled') == '1';

        $bar = $this->output->createProgressBar($files->count());
        $bar->start();

        // -- 4. Main loop ----------------------------------------------------
        foreach ($files as $file) {
            $absolutePath = $file->getRealPath();
            $relativePath = ltrim(str_replace($baseDir, '', $absolutePath), '/');
            $filename     = $file->getFilename();
            $title        = $this->cleanTitle($file->getFilenameWithoutExtension());

            // Resolve shelf hierarchy (cached)
            $deepestShelfId = $this->resolveShelfHierarchy(
                dirname($relativePath),
                $dryRun
            );

            $comic = $existingComics->get($relativePath);
            $isNew = false;

            if (!$comic) {
                // -- Fast-path duplicate: partial MD5 ----------------------
                $partialHash = Comic::getPartialHash($absolutePath);
                if ($partialHash && $dup = $md5HashMap->get($partialHash)) {
                    $this->warnOnce("Duplicate recorded (md5): $filename <- [{$dup->filename}]", $bar);
                    $comic = new Comic([
                        'path'        => $relativePath,
                        'is_approved' => false, // New duplicates are unapproved
                        'is_hidden'   => true,    // New duplicates are hidden
                    ]);
                    $comic->md5_hash    = $partialHash;
                    $comic->visual_hash = $dup->visual_hash;
                    $comic->thumbnail   = $dup->thumbnail;
                    $comic->pages_count = $dup->pages_count;
                    $isNew = true;
                }

                if (!$isNew) {
                    // -- Slow-path duplicate: perceptual hash ------------------
                    $visualHash = null;
                    if (!$this->option('skip-visual-hash')) {
                        $visualHash = Comic::getVisualHash($absolutePath);
                        if ($visualHash) {
                            $dup = $this->findSimilarHash($visualHash, $visualHashMap);
                            if ($dup) {
                                $this->warnOnce("Duplicate recorded (visual): $filename <- [{$dup->filename}]", $bar);
                                $comic = new Comic([
                                    'path'        => $relativePath,
                                    'is_approved' => false,
                                    'is_hidden'   => true,
                                ]);
                                $comic->visual_hash = $visualHash;
                                $comic->md5_hash    = $partialHash;
                                $comic->thumbnail   = $dup->thumbnail;
                                $comic->pages_count = $dup->pages_count;
                                $isNew = true;
                            }
                            if (!$isNew) {
                                $visualHashMap->put($visualHash, new Comic(['filename' => $filename]));
                            }
                        }
                    }
                }

                if (!$isNew) {
                    // -- Genuinely new -----------------------------------------
                    $comic             = new Comic(['path' => $relativePath, 'is_approved' => true]);
                    $comic->visual_hash = $visualHash;
                    $comic->md5_hash    = $partialHash;

                    if ($partialHash) $md5HashMap->put($partialHash, $comic);
                    $isNew = true;
                }
            } else {
                // -- Restore soft-deleted comic if file reappeared ---------
                if ($comic->trashed()) {
                    if (!$dryRun) $comic->restore();
                    $isNew = true;
                }

                // -- Backfill visual_hash lazily ---------------------------
                if (empty($comic->visual_hash) || $this->option('force-rehash')) {
                    if (!$this->option('skip-visual-hash')) {
                        // Skip re-render if file size is unchanged
                        $currentSize = filesize($absolutePath);
                        if ($this->option('force-rehash') || $comic->file_size !== $currentSize) {
                            $comic->visual_hash = Comic::getVisualHash($absolutePath);
                            if ($comic->visual_hash) {
                                $visualHashMap->put($comic->visual_hash, $comic);
                            }
                        }
                    }
                }
            }

            // -- Fill scalar fields ----------------------------------------
            $comic->fill([
                'title'    => $title,
                'filename' => $filename,
            ]);

            $comic->file_size = filesize($absolutePath);

            // Pages count (skip if already set and file unchanged)
            if (!$comic->pages_count || $comic->isDirty('file_size')) {
                $comic->pages_count = Comic::getPageCount($absolutePath);
            }

            // published date
            $publishedDate = Comic::parseDateFromFilename($filename)
                ?? Comic::parseDateFromFilename($title);
            if ($publishedDate) {
                $comic->published_date = $publishedDate;
            }

            // Extract metadata from filename (Series, Author, Index)
            $meta = $this->parseMetadataFromFilename($filename);
            if (empty($comic->author)) $comic->author = $meta['author'];
            if (empty($comic->series)) $comic->series = $meta['series'];
            if (is_null($comic->series_index)) $comic->series_index = $meta['series_index'];

            // Thumbnail - verify existing, then search patterns, then queue generation
            if ($comic->thumbnail && !file_exists($thumbDir . '/' . $comic->thumbnail)) {
                $comic->thumbnail = null;
            }
            if (!$comic->thumbnail) {
                $comic->thumbnail = $this->getThumbnail($absolutePath, $thumbDir);
            }

            // -- Persist ---------------------------------------------------
            if ($comic->isDirty() || $isNew) {
                if (!$dryRun) {
                    $this->toSave[] = ['comic' => $comic, 'isNew' => $isNew, 'aiEnabled' => $aiEnabled];

                    // Always collect shelf ID if we have one, even if comic doesn't exist yet
                    if ($deepestShelfId) {
                        $this->toSyncShelves[] = ['comic' => $comic, 'shelfId' => $deepestShelfId];
                    }

                    $this->flushSavesBatch(false);
                }
                if ($isNew) $counts['new']++;
                else $counts['updated']++;
            } else if ($deepestShelfId && !$dryRun) {
                // Not dirty, but might need shelf sync
                $pivotKey = $comic->id . ':' . $deepestShelfId;
                if (!isset($this->shelfPivotSet[$pivotKey])) {
                    $comic->shelves()->syncWithoutDetaching([$deepestShelfId]);
                    $this->shelfPivotSet[$pivotKey] = true;
                }
            }

            // -- Queue thumbnail generation if still missing ---------------
            if (!$comic->thumbnail && ($comic->exists || $isNew) && !$dryRun) {
                $this->toDispatchThumb[] = $comic;
            }

            $processedPaths[$relativePath] = true;
            $counts['total']++;
            $bar->advance();

            if ($counts['total'] % 20 === 0 && !$dryRun) {
                Setting::set('sync_progress', "Processed {$counts['total']} of {$files->count()} files...");
            }
        }

        // Flush remaining batch
        $this->flushSavesBatch(true);

        $bar->finish();
        $this->newLine();


        // -- 6. Soft-delete orphans ----------------------------------------
        $orphans = $existingComics->diffKeys($processedPaths)->filter(fn($c) => !$c->trashed());
        $counts['removed'] = $orphans->count();

        if (!$dryRun) {
            foreach ($orphans as $orphan) {
                $orphan->delete();
            }
        }

        // -- 7. Report -----------------------------------------------------
        $duration = round(microtime(true) - $startTime, 2);

        $this->info(sprintf(
            "Completed in %ss - Total: %d | New: %d | Updated: %d | Dupes skipped: %d | Removed: %d",
            $duration,
            $counts['total'],
            $counts['new'],
            $counts['updated'],
            $counts['skipped'],
            $counts['removed']
        ));

        if (!$dryRun) {
            Setting::set('sync_status', 'idle');
            Setting::set('sync_progress', "Last sync completed successfully at " . now()->toDateTimeString());
            Setting::set('last_sync_at', now()->toDateTimeString());

            LoggingService::info('Comic library sync completed', array_merge(
                $counts,
                ['duration_seconds' => $duration, 'base_dir' => $baseDir]
            ));
        }

        return 0;
    }

    // -----------------------------------------------------------------------
    // Shelf helpers
    // -----------------------------------------------------------------------

    /**
     * Walk the directory path and return the deepest shelf ID.
     * Results are cached in $shelfCache so repeated paths cost 0 queries.
     */
    private function resolveShelfHierarchy(string $dirPath, bool $dryRun): ?int
    {
        if (!$dirPath || $dirPath === '.') return null;

        $parts    = explode('/', $dirPath);
        $parentId = null;

        foreach ($parts as $part) {
            $cacheKey = ($parentId ?? 'null') . ':' . strtolower($part);

            if (!isset($this->shelfCache[$cacheKey])) {
                $shelf = Shelf::whereRaw('LOWER(name) = ?', [strtolower($part)])
                    ->where('parent_id', $parentId)
                    ->first();

                if (!$shelf && !$dryRun) {
                    $shelf = Shelf::create([
                        'name'      => $part,
                        'parent_id' => $parentId,
                        'is_common' => true,
                        'user_id'   => null,
                        'is_hidden' => false,
                    ]);
                }

                $this->shelfCache[$cacheKey] = $shelf;
            }

            $shelf = $this->shelfCache[$cacheKey];
            if (!$shelf) break;
            $parentId = $shelf->id;
        }

        return $parentId;
    }

    /**
     * Preload all comic<>shelf pivot rows into a fast in-memory set
     * so we never fire `syncWithoutDetaching` for already-linked rows.
     */
    private function preloadShelfPivots(array $comicIds): void
    {
        if (empty($comicIds)) return;

        DB::table('comic_shelf') // adjust pivot table name if different
            ->whereIn('comic_id', $comicIds)
            ->select(['comic_id', 'shelf_id'])
            ->orderBy('comic_id')
            ->each(function ($row) {
                $this->shelfPivotSet[$row->comic_id . ':' . $row->shelf_id] = true;
            });
    }

    // -----------------------------------------------------------------------
    // Batch save helpers
    // -----------------------------------------------------------------------

    /**
     * Flush accumulated saves in chunks.
     * Pass $force=true to flush whatever remains regardless of chunk size.
     */
    private function flushSavesBatch(bool $force): void
    {
        if (!$force && count($this->toSave) < self::SAVE_CHUNK) return;

        DB::transaction(function () {
            foreach ($this->toSave as ['comic' => $comic, 'isNew' => $isNew, 'aiEnabled' => $aiEnabled]) {
                $comic->save();

                if ($isNew && $aiEnabled) {
                    $this->toDispatchAI[] = $comic->id;
                }
            }

            // Now that comics have IDs, we can sync shelves
            foreach ($this->toSyncShelves as ['comic' => $comic, 'shelfId' => $shelfId]) {
                $pivotKey = $comic->id . ':' . $shelfId;
                if (!isset($this->shelfPivotSet[$pivotKey])) {
                    $comic->shelves()->syncWithoutDetaching([$shelfId]);
                    $this->shelfPivotSet[$pivotKey] = true;
                }
            }
        });

        // Dispatch AI jobs outside the transaction
        foreach ($this->toDispatchAI as $id) {
            ProcessComicAIJob::dispatch($id);
        }

        // Dispatch Thumbnail jobs outside the transaction
        foreach ($this->toDispatchThumb as $comic) {
            GenerateThumbnailJob::dispatch($comic);
        }

        $this->toSave        = [];
        $this->toSyncShelves = [];
        $this->toDispatchAI  = [];
        $this->toDispatchThumb = [];
    }

    // -----------------------------------------------------------------------
    // Duplicate-detection helpers
    // -----------------------------------------------------------------------

    /**
     * Find a comic whose visual hash is within Hamming-distance threshold.
     * Format: "<hex_phash>:<page_count>"
     */
    private function findSimilarHash(
        string $newHash,
        \Illuminate\Support\Collection $hashMap,
        int $threshold = 8
    ): ?Comic {
        [$newHex, $newPages] = array_pad(explode(':', $newHash, 2), 2, null);
        if (!$newHex || !$newPages) return null;

        foreach ($hashMap as $existingHash => $comic) {
            [$existingHex, $existingPages] = array_pad(explode(':', $existingHash, 2), 2, null);
            if ($existingPages !== $newPages) continue;

            $distance = $this->hammingDistanceHex($newHex, $existingHex);
            if ($distance !== null && $distance <= $threshold) {
                return $comic;
            }
        }

        return null;
    }

    /**
     * XOR each byte pair and count set bits (Brian Kernighan).
     * No external library required.
     */
    private function hammingDistanceHex(string $hex1, string $hex2): ?int
    {
        if (strlen($hex1) !== strlen($hex2)) return null;

        $distance = 0;
        for ($i = 0, $len = strlen($hex1); $i < $len; $i += 2) {
            $xor = hexdec(substr($hex1, $i, 2)) ^ hexdec(substr($hex2, $i, 2));
            while ($xor) {
                $distance += $xor & 1;
                $xor >>= 1;
            }
        }

        return $distance;
    }

    // -----------------------------------------------------------------------
    // Thumbnail helpers
    // -----------------------------------------------------------------------

    protected function getThumbnail(string $pdfPath, string $thumbDir): ?string
    {
        $basename = pathinfo($pdfPath, PATHINFO_BASENAME);
        $filename = pathinfo($pdfPath, PATHINFO_FILENAME);

        $candidates = [
            "$filename.jpg",
            "$filename.jpeg",
            "$basename.jpg",
            "$basename.jpeg",
            "$basename.png",
            "$filename.png",
            str_replace('.pdf', '.PDF.png', $basename),
            str_replace('.pdf', '.Pdf.png', $basename),
        ];

        foreach ($candidates as $candidate) {
            if (file_exists("$thumbDir/$candidate")) return $candidate;
        }

        return null;
    }

    // -----------------------------------------------------------------------
    // Utility
    // -----------------------------------------------------------------------

    protected function cleanTitle(string $name): string
    {
        return trim(preg_replace('/\s+/', ' ', preg_replace('/[-_]/', ' ', $name)));
    }

    /**
     * Print a warning that temporarily clears the progress bar so it stays tidy.
     */
    private function warnOnce(string $message, $bar): void
    {
        $bar->clear();
        $this->warn($message);
        $bar->display();
    }

    /**
     * Algorithm to extract Series, Author, and Index from filename
     */
    protected function parseMetadataFromFilename($filename)
    {
        $clean = pathinfo($filename, PATHINFO_FILENAME);
        // Replace underscores and dots (if they seem like separators) with spaces
        $clean = str_replace('_', ' ', $clean);
        // Remove common noisy characters
        $clean = preg_replace('/[\[\]\(\)]/', ' ', $clean);
        $clean = preg_replace('/\s+/', ' ', $clean);
        $clean = trim($clean);

        $metadata = [
            'series'       => null,
            'author'       => null,
            'series_index' => null,
        ];

        // Try to find index (e.g. #001 or 001 at the end, or V01 etc)
        // Look for #123 or 001 at the end
        if (preg_match('/#\s*(\d+(\.\d+)?)/', $clean, $matches)) {
            $metadata['series_index'] = (float)$matches[1];
            $clean = trim(str_replace($matches[0], '', $clean));
        } elseif (preg_match('/\s+(\d+(\.\d+)?)$/', $clean, $matches)) {
            $metadata['series_index'] = (float)$matches[1];
            $clean = trim(preg_replace('/\s+\d+(\.\d+)?$/', '', $clean));
        }

        // Split by '-' for Author vs Series
        if (str_contains($clean, '-')) {
            $parts = explode('-', $clean, 2);
            $metadata['author'] = trim($parts[0]);
            $metadata['series'] = trim($parts[1]);
        } else {
            $metadata['series'] = trim($clean);
        }

        return $metadata;
    }
}
