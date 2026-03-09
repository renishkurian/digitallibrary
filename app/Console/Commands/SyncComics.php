<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

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
        $existingComics = \App\Models\Comic::all(['id', 'path', 'title', 'filename', 'thumbnail'])->keyBy('path');

        $files = \Illuminate\Support\Facades\File::allFiles($baseDir);
        $count = 0;
        $updated = 0;
        $new = 0;

        foreach ($files as $file) {
            if ($file->getExtension() !== 'pdf') continue;

            $absolutePath = $file->getRealPath();
            $relativePath = str_replace($baseDir . '/', '', $absolutePath);
            $filename = $file->getFilename();
            $title = $this->cleanTitle($file->getFilenameWithoutExtension());

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
            ]);

            // Only generate thumbnail reference if not already set or file missing
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

            // Still try to generate thumbnail if missing after all checks
            if (!$comic->thumbnail) {
                if ($comic->generateThumbnail()) {
                    $this->info("Generated missing thumbnail for {$title}");
                }
            }

            $count++;
        }

        $this->info("Scan completed. Total: $count, New: $new, Updated: $updated.");
    }

    protected function cleanTitle($name)
    {
        $name = preg_replace('/[-_]/', ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim($name);
    }

    protected function getThumbnail($pdfPath, $thumbDir, $baseDir)
    {
        // For now, let's just return what the original logic did
        // Original logic checked for png by filename OR md5
        $filename = pathinfo($pdfPath, PATHINFO_FILENAME);
        if (file_exists($thumbDir . "/" . $filename . ".png")) return $filename . ".png";

        $md5 = md5($pdfPath);
        if (file_exists($thumbDir . "/" . $md5 . ".png")) return $md5 . ".png";

        return null;
    }
}
