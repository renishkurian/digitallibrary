<?php

namespace App\Jobs;

use App\Models\Comic;
use App\Models\Setting;
use App\Models\Shelf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class SyncComicsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes

    public function handle()
    {
        Setting::set('sync_status', 'running');
        Setting::set('sync_error', null);

        try {
            $baseDir = config('comics.base_dir');
            $thumbDir = config('comics.thumb_dir');

            if (!is_dir($baseDir)) {
                throw new \Exception("Base directory does not exist: $baseDir");
            }

            $existingComics = Comic::all(['id', 'path', 'title', 'filename', 'thumbnail'])->keyBy('path');
            $files = File::allFiles($baseDir);
            $total = count($files);
            $processed = 0;

            foreach ($files as $file) {
                if ($file->getExtension() !== 'pdf') continue;

                $absolutePath = $file->getRealPath();
                $relativePath = str_replace($baseDir . '/', '', $absolutePath);
                $filename = $file->getFilename();
                $title = $this->cleanTitle($file->getFilenameWithoutExtension());

                $dirPath = dirname($relativePath);
                $deepestShelfId = null;

                if ($dirPath && $dirPath !== '.') {
                    $parts = explode('/', $dirPath);
                    $parentId = null;

                    foreach ($parts as $part) {
                        $shelf = Shelf::whereRaw('LOWER(name) = ?', [strtolower($part)])
                            ->where('parent_id', $parentId)
                            ->first();

                        if (!$shelf) {
                            $shelf = Shelf::create([
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
                $isNew = !$comic;

                if ($isNew) {
                    $comic = new Comic(['path' => $relativePath]);
                }

                $comic->fill([
                    'title' => $title,
                    'filename' => $filename,
                ]);

                // Calculate page count if missing or zero
                if (!$comic->pages_count) {
                    $comic->pages_count = Comic::getPageCount($absolutePath);
                }

                // Store file size
                $comic->file_size = filesize($absolutePath);

                // Extract date from title (e.g. "October 01 2018" or "Jan 13 2025")
                if (preg_match('/(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(?:\d{1,2}\s*,?\s*)?\d{4}/i', $title, $matches)) {
                    try {
                        $parsedDate = \Carbon\Carbon::parse($matches[0]);
                        $comic->created_at = $parsedDate;
                    } catch (\Exception $e) {
                        // Keep default if parsing fails
                    }
                }

                if ($comic->thumbnail && !file_exists($thumbDir . '/' . $comic->thumbnail)) {
                    $comic->thumbnail = null;
                }

                if (!$comic->thumbnail) {
                    $comic->thumbnail = $this->getThumbnail($absolutePath, $thumbDir);
                }

                if ($comic->isDirty()) {
                    $comic->save();
                    if ($isNew && Setting::get('ai_enabled') == '1') {
                        ProcessComicAIJob::dispatch($comic);
                    }
                }

                if ($deepestShelfId) {
                    // Only sync to the folder's shelf if it's new or doesn't have it.
                    $comic->shelves()->syncWithoutDetaching([$deepestShelfId]);
                }

                if (!$comic->thumbnail) {
                    $comic->generateThumbnail();
                }

                $processed++;
                if ($processed % 10 == 0) {
                    Setting::set('sync_progress', "Processed $processed of $total files...");
                }
            }

            Setting::set('sync_status', 'idle');
            Setting::set('sync_progress', "Last sync completed successfully at " . now()->toDateTimeString());
            Setting::set('last_sync_at', now()->toDateTimeString());
        } catch (\Exception $e) {
            Log::error("Sync Error: " . $e->getMessage());
            Setting::set('sync_status', 'error');
            Setting::set('sync_error', $e->getMessage());
        }
    }

    protected function cleanTitle($name)
    {
        $name = preg_replace('/[-_]/', ' ', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim($name);
    }

    protected function getThumbnail($pdfPath, $thumbDir)
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

        $md5 = md5($pdfPath);
        foreach ([$md5 . ".png", $md5 . ".jpg", $md5 . ".jpeg"] as $pattern) {
            if (file_exists($thumbDir . "/" . $pattern)) return $pattern;
        }

        return null;
    }
}
