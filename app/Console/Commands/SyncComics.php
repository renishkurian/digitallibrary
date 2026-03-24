<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\LoggingService;

class SyncComics extends Command
{
    protected $signature = 'app:sync-comics';
    protected $description = 'Scan base directory and sync comics to database';

    public function handle()
    {
        $baseDir = config('comics.base_dir');
        $thumbDir = config('comics.thumb_dir');

        if (!is_dir($baseDir)) {
            $this->error("Base directory does not exist: $baseDir");
            return 1;
        }

        $this->info("Scanning $baseDir...");

        // Pre-fetch all existing comics keyed by path
        $existingComics = \App\Models\Comic::all(['id', 'path', 'title', 'filename', 'thumbnail', 'md5_hash', 'visual_hash'])->keyBy('path');

        // Build visual_hash => Comic map for similarity lookups
        $visualHashMap = $existingComics
            ->filter(fn($c) => !empty($c->visual_hash))
            ->keyBy('visual_hash');

        $files = \Illuminate\Support\Facades\File::allFiles($baseDir);
        $count   = 0;
        $updated = 0;
        $new     = 0;
        $skipped = 0;
        $processedPaths = [];

        foreach ($files as $file) {
            if ($file->getExtension() !== 'pdf') continue;

            $absolutePath = $file->getRealPath();
            $relativePath = str_replace($baseDir . '/', '', $absolutePath);
            $filename     = $file->getFilename();
            $title        = $this->cleanTitle($file->getFilenameWithoutExtension());

            $dirPath = dirname($relativePath);
            $deepestShelfId = null;

            if ($dirPath && $dirPath !== '.') {
                $parts = explode('/', $dirPath);
                $parentId = null;

                foreach ($parts as $part) {
                    $shelf = \App\Models\Shelf::whereRaw('LOWER(name) = ?', [strtolower($part)])
                        ->where('parent_id', $parentId)
                        ->first();

                    if (!$shelf) {
                        $shelf = \App\Models\Shelf::create([
                            'name' => $part,
                            'parent_id' => $parentId,
                            'is_common' => true,
                            'user_id' => null,
                            'is_hidden' => false,
                        ]);
                    }
                    $parentId = $shelf->id;
                }
                $deepestShelfId = $parentId;
            }

            $comic = $existingComics->get($relativePath);

            if (!$comic) {
                // New file — compute perceptual hash and check for visual duplicates
                $visualHash = \App\Models\Comic::getVisualHash($absolutePath);

                if ($visualHash) {
                    $duplicate = $this->findSimilarHash($visualHash, $visualHashMap);

                    if ($duplicate) {
                        $this->warn("Duplicate skipped: {$filename} matches existing [{$duplicate->filename}]");
                        $skipped++;
                        $processedPaths[$relativePath] = true; // prevent orphan deletion
                        continue;
                    }
                }

                // Genuinely new comic
                $comic = new \App\Models\Comic(['path' => $relativePath]);
                $comic->visual_hash = $visualHash;
                $comic->md5_hash    = \App\Models\Comic::getPartialHash($absolutePath);

                // Register so duplicates later in this same scan are also caught
                if ($visualHash) {
                    $visualHashMap->put($visualHash, $comic);
                }

                $isNew = true;
            } else {
                // Existing comic — backfill visual_hash lazily if missing
                if (empty($comic->visual_hash)) {
                    $comic->visual_hash = \App\Models\Comic::getVisualHash($absolutePath);
                    if ($comic->visual_hash) {
                        $visualHashMap->put($comic->visual_hash, $comic);
                    }
                }
                $isNew = false;
            }

            $comic->fill([
                'title'    => $title,
                'filename' => $filename,
            ]);

            // Extract date from filename (e.g. "April_12_2024" or "2018_9_21")
            $publishedDate = \App\Models\Comic::parseDateFromFilename($filename);
            if (!$publishedDate) {
                $publishedDate = \App\Models\Comic::parseDateFromFilename($title);
            }

            if ($publishedDate) {
                $comic->published_date = $publishedDate;
            }

            // Calculate page count if missing or zero
            if (!$comic->pages_count) {
                $comic->pages_count = \App\Models\Comic::getPageCount($absolutePath);
            }

            // Store file size
            $comic->file_size = filesize($absolutePath);

            // 1. Verify thumbnail still exists on disk
            if ($comic->thumbnail && !file_exists($thumbDir . '/' . $comic->thumbnail)) {
                $comic->thumbnail = null;
            }

            // 2. Search for existing thumbnail by filename patterns
            if (!$comic->thumbnail) {
                $comic->thumbnail = $this->getThumbnail($absolutePath, $thumbDir, $baseDir);
            }

            // Only write to DB if something actually changed
            if ($comic->isDirty()) {
                $comic->save();
                if ($isNew) {
                    $new++;
                    if (\App\Models\Setting::get('ai_enabled') == '1') {
                        \App\Jobs\ProcessComicAIJob::dispatch($comic);
                    }
                } else {
                    $updated++;
                }
            }

            if ($deepestShelfId && $comic->exists) {
                $comic->shelves()->syncWithoutDetaching([$deepestShelfId]);
            }

            // 3. Fallback thumbnail generation
            if (!$comic->thumbnail) {
                if ($comic->generateThumbnail()) {
                    $this->info("Generated thumbnail for {$title}");
                }
            }

            $processedPaths[$relativePath] = true;
            $count++;
        }

        // Remove DB records whose files no longer exist on disk
        $orphans = $existingComics->diffKeys($processedPaths);
        $deleted = $orphans->count();

        foreach ($orphans as $orphan) {
            $orphan->delete();
        }

        $this->info("Scan completed. Total: $count, New: $new, Updated: $updated, Duplicates skipped: $skipped, Removed: $deleted.");

        LoggingService::info("Comic library sync completed", [
            'total'              => $count,
            'new'                => $new,
            'updated'            => $updated,
            'skipped_duplicates' => $skipped,
            'removed'            => $deleted,
            'base_dir'           => $baseDir,
        ]);
    }

    /**
     * Find a comic whose visual hash is within hamming distance threshold.
     * Format stored: "<hex_phash>:<page_count>"
     * Hamming distance is computed manually from hex strings — no library version dependency.
     */
    private function findSimilarHash(string $newHash, \Illuminate\Support\Collection $hashMap, int $threshold = 8): ?\App\Models\Comic
    {
        [$newHex, $newPages] = array_pad(explode(':', $newHash, 2), 2, null);
        if (!$newHex || !$newPages) return null;

        foreach ($hashMap as $existingHash => $comic) {
            [$existingHex, $existingPages] = array_pad(explode(':', $existingHash, 2), 2, null);

            // Page count must match exactly to avoid false positives
            if ($existingPages !== $newPages) continue;

            $distance = $this->hammingDistanceHex($newHex, $existingHex);
            if ($distance !== null && $distance <= $threshold) {
                return $comic;
            }
        }

        return null;
    }

    /**
     * Compute hamming distance between two hex-encoded hashes.
     * XORs each byte pair and counts set bits — no external library needed.
     */
    private function hammingDistanceHex(string $hex1, string $hex2): ?int
    {
        if (strlen($hex1) !== strlen($hex2)) return null;

        $distance = 0;
        $len = strlen($hex1);

        for ($i = 0; $i < $len; $i += 2) {
            $byte1 = hexdec(substr($hex1, $i, 2));
            $byte2 = hexdec(substr($hex2, $i, 2));
            $xor   = $byte1 ^ $byte2;

            // Count set bits (Brian Kernighan's algorithm)
            while ($xor) {
                $distance += $xor & 1;
                $xor >>= 1;
            }
        }

        return $distance;
    }

    protected function cleanTitle($name)
    {
        $name = preg_replace('/[-_]/', ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim($name);
    }

    protected function getThumbnail($pdfPath, $thumbDir, $baseDir)
    {
        $basename = pathinfo($pdfPath, PATHINFO_BASENAME);
        $filename = pathinfo($pdfPath, PATHINFO_FILENAME);

        $patterns = [
            $basename . ".png",
            $basename . ".PNG",
            $filename . ".png",
            $filename . ".jpg",
            $filename . ".jpeg",
            str_replace('.pdf', '.PDF.png', $basename),
            str_replace('.pdf', '.Pdf.png', $basename),
        ];

        foreach ($patterns as $pattern) {
            if (file_exists($thumbDir . "/" . $pattern)) return $pattern;
        }

        return null;
    }
}
