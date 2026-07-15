<?php

namespace App\Console\Commands;

use App\Models\Comic;
use App\Services\ComicAiProcessor;
use Illuminate\Console\Command;

class ProcessComicAiCommand extends Command
{
    protected $signature = 'comics:process-ai
                            {comic : The comic ID to process}
                            {--user= : Optional user ID for AI logging}';

    protected $description = 'Generate AI summary/tags for a comic (runs outside the queue worker timeout)';

    public function handle(ComicAiProcessor $processor): int
    {
        set_time_limit(0);
        ini_set('max_execution_time', '0');

        $comic = Comic::find($this->argument('comic'));

        if (!$comic) {
            $this->error('Comic not found.');
            return self::FAILURE;
        }

        $userId = $this->option('user') ? (int) $this->option('user') : null;

        $this->info("Processing comic {$comic->id}: {$comic->title}");
        $this->info("Processing start at {date(H:i:s}");
        $this->line('Calling LLM (local Ollama may take 1–2 minutes)...');

        $startedAt = microtime(true);
        $success = $processor->process($comic, $userId);
        $elapsed = (int) round(microtime(true) - $startedAt);

        $comic->refresh();

        if (!$success) {
            $this->error("Failed after {$elapsed}s. Check storage/logs/laravel.log for details.");
            return self::FAILURE;
        }

        $this->newLine();
        $this->info("Done in {$elapsed}s using your configured LLM.");
        $this->line('Summary: ' . ($comic->ai_summary ?: '(empty)'));
        if ($comic->rating) {
            $this->line('Rating: ' . $comic->rating);
        }
        if ($comic->tags) {
            $tags = is_array($comic->tags) ? $comic->tags : json_decode($comic->tags, true);
            if ($tags) {
                $this->line('Tags: ' . implode(', ', $tags));
            }
        }

        return self::SUCCESS;
    }
}
