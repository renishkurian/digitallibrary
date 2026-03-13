<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\LoggingService;

class SyncComics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
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

        // Pre-fetch all existing comic paths to avoid N+1 queries
        $existingComics = \App\Models\Comic::all(['id', 'path', 'title', 'filename', 'thumbnail', 'md5_hash'])->keyBy('path');

        $files = \Illuminate\Support\Facades\File::allFiles($baseDir);
        $count = 0;
        $updated = 0;
        $new = 0;
        $processedPaths = [];

        foreach ($files as $file) {
            if ($file->getExtension() !== 'pdf') continue;

            $absolutePath = $file->getRealPath();
            $relativePath = str_replace($baseDir . '/', '', $absolutePath);
            $filename = $file->getFilename();
            $title = $this->cleanTitle($file->getFilenameWithoutExtension());
            $md5Hash = \App\Models\Comic::getPartialHash($absolutePath);

            // Check if comic exists in our pre-fetched map
            $comic = $existingComics->get($relativePath);

            if (!$comic) {
                // New Comic
                $comic = new \App\Models\Comic(['path' => $relativePath]);
                $isNew = true;
            } else {
                $isNew = false;
            }

            $comic->fill([
                'title' => $title,
                'filename' => $filename,
                'md5_hash' => $md5Hash,
            ]);

            // 1. If we have a thumbnail in DB, verify it exists. If not, mark as null to re-search.
            if ($comic->thumbnail && !file_exists($thumbDir . '/' . $comic->thumbnail)) {
                $comic->thumbnail = null;
            }

            // 2. Search for existing thumbnail (Name then MD5)
            if (!$comic->thumbnail) {
                $comic->thumbnail = $this->getThumbnail($absolutePath, $thumbDir, $baseDir, $md5Hash);
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

            // 3. Fallback to generation (which now also double-checks Name/MD5)
            if (!$comic->thumbnail) {
                if ($comic->generateThumbnail()) {
                    $this->info("Generated or linked thumbnail for {$title}");
                }
            }

            $processedPaths[$relativePath] = true;
            $count++;
        }

        // Cleanup: Remove records from database if file is no longer on disk
        $orphans = $existingComics->diffKeys($processedPaths);
        $deleted = $orphans->count();

        foreach ($orphans as $orphan) {
            $orphan->delete();
        }

        $this->info("Scan completed. Total: $count, New: $new, Updated: $updated, Removed: $deleted.");

        LoggingService::info("Comic library sync completed", [
            'total' => $count,
            'new' => $new,
            'updated' => $updated,
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

    protected function getThumbnail($pdfPath, $thumbDir, $baseDir, $md5Hash = null)
    {
        $basename = pathinfo($pdfPath, PATHINFO_BASENAME);
        $filename = pathinfo($pdfPath, PATHINFO_FILENAME);

        $patterns = [
            $basename . ".png",   // "ബാലഭൂമി.pdf.png"
            $basename . ".PNG",   // "ബാലഭൂമി.pdf.PNG"
            $filename . ".png",   // "ബാലഭൂമി.png"
            $filename . ".jpg",   // "ബാലഭൂമി.jpg"
            $filename . ".jpeg",  // "ബാലഭൂമി.jpeg"
            str_replace('.pdf', '.PDF.png', $basename), // "ബാലഭൂമി.PDF.png"
            str_replace('.pdf', '.Pdf.png', $basename), // "ബാലഭൂമി.Pdf.png"
        ];

        foreach ($patterns as $pattern) {
            if (file_exists($thumbDir . "/" . $pattern)) return $pattern;
        }

        return null;
    }
}
