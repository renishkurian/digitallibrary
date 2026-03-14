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

        // Build a visual_hash => Comic map to detect duplicates across files
        $visualHashMap = $existingComics
            ->filter(fn($c) => !empty($c->visual_hash))
            ->keyBy('visual_hash');

        $files = \Illuminate\Support\Facades\File::allFiles($baseDir);
        $count = 0;
        $updated = 0;
        $new = 0;
        $skipped = 0;
        $processedPaths = [];

        foreach ($files as $file) {
            if ($file->getExtension() !== 'pdf') continue;

            $absolutePath = $file->getRealPath();
            $relativePath = str_replace($baseDir . '/', '', $absolutePath);
            $filename = $file->getFilename();
            $title = $this->cleanTitle($file->getFilenameWithoutExtension());

            // Check if this path already exists in DB
            $comic = $existingComics->get($relativePath);

            if (!$comic) {
                // New file — compute visual hash to check for duplicates
                $visualHash = \App\Models\Comic::getVisualHash($absolutePath);

                if ($visualHash && $visualHashMap->has($visualHash)) {
                    // Duplicate detected — same visual content as an existing comic
                    $original = $visualHashMap->get($visualHash);
                    $this->warn("Duplicate skipped: {$filename} matches existing [{$original->filename}]");
                    $skipped++;
                    $processedPaths[$relativePath] = true; // don't treat as orphan
                    continue;
                }

                // Genuinely new comic
                $comic = new \App\Models\Comic(['path' => $relativePath]);
                $comic->visual_hash = $visualHash;
                $comic->md5_hash = \App\Models\Comic::getPartialHash($absolutePath);

                // Register in map so later files in same sync don't duplicate it
                if ($visualHash) {
                    $visualHashMap->put($visualHash, $comic);
                }

                $isNew = true;
            } else {
                // Existing comic — compute visual hash only if missing
                if (empty($comic->visual_hash)) {
                    $comic->visual_hash = \App\Models\Comic::getVisualHash($absolutePath);
                    if ($comic->visual_hash) {
                        $visualHashMap->put($comic->visual_hash, $comic);
                    }
                }
                $isNew = false;
            }

            $comic->fill([
                'title' => $title,
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

            // Only save if dirty
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

        // Cleanup: Remove DB records whose files are gone
        $orphans = $existingComics->diffKeys($processedPaths);
        $deleted = $orphans->count();

        foreach ($orphans as $orphan) {
            $orphan->delete();
        }

        $this->info("Scan completed. Total: $count, New: $new, Updated: $updated, Duplicates skipped: $skipped, Removed: $deleted.");

        LoggingService::info("Comic library sync completed", [
            'total' => $count,
            'new' => $new,
            'updated' => $updated,
            'skipped_duplicates' => $skipped,
            'removed' => $deleted,
            'base_dir' => $baseDir
        ]);
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
