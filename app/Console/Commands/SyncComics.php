<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\LoggingService;
use Jenssegers\ImageHash\Hash;

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
     * Find a comic whose perceptual hash is visually similar to $newHash.
     * Uses hamming distance — threshold of 8 means up to 8 bits can differ out of 64.
     * Page count must also match to avoid false positives.
     */
    private function findSimilarHash(string $newHash, \Illuminate\Support\Collection $hashMap, int $threshold = 8): ?\App\Models\Comic
    {
        [$newHex, $newPages] = array_pad(explode(':', $newHash, 2), 2, null);
        if (!$newHex || !$newPages) return null;

        foreach ($hashMap as $existingHash => $comic) {
            [$existingHex, $existingPages] = array_pad(explode(':', $existingHash, 2), 2, null);

            if ($existingPages !== $newPages) continue;

            try {
                $distance = Hash::fromHex($newHex)->distance(Hash::fromHex($existingHex));
                if ($distance <= $threshold) {
                    return $comic;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
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
