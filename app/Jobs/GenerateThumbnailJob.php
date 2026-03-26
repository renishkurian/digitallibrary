<?php

namespace App\Jobs;

use App\Models\Comic;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateThumbnailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 60;

    public function __construct(public Comic $comic) {}

    public function handle(): void
    {
        // Reload fresh in case the model changed between dispatch and execution
        $comic = Comic::find($this->comic->id);

        if (!$comic) return;

        $thumbDir    = rtrim(config('comics.thumb_dir'), '/');
        $baseDir     = rtrim(config('comics.base_dir'), '/');
        $absolutePath = $baseDir . '/' . ltrim($comic->path, '/');

        if (!file_exists($absolutePath)) return;

        // One last check — another worker might have already done this
        if ($comic->thumbnail && file_exists("$thumbDir/{$comic->thumbnail}")) return;

        $comic->generateThumbnail();
    }
}
