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

        $files = \Illuminate\Support\Facades\File::allFiles($baseDir);
        $count = 0;

        foreach ($files as $file) {
            if ($file->getExtension() !== 'pdf') continue;

            $absolutePath = $file->getRealPath();
            $relativePath = str_replace($baseDir . '/', '', $absolutePath);
            $filename = $file->getFilename();
            $title = $this->cleanTitle($file->getFilenameWithoutExtension());

            $comic = \App\Models\Comic::firstOrNew(['path' => $relativePath]);
            $comic->fill([
                'title' => $title,
                'filename' => $filename,
                'thumbnail' => $this->getThumbnail($absolutePath, $thumbDir, $baseDir),
            ]);
            $comic->save();
            $count++;
        }

        $this->info("Synced $count comics.");
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
