<?php

namespace App\Console\Commands;

use App\Jobs\ProcessComicAIJob;
use App\Models\Comic;
use Illuminate\Console\Command;

class RetryAiJobsCommand extends Command
{
    protected $signature = 'ai:retry-failed
                            {--comic= : Re-dispatch AI for a specific comic ID only}';

    protected $description = 'Re-dispatch failed AI jobs with a fresh 300s timeout (do not use queue:retry for AI jobs)';

    public function handle(): int
    {
        if ($comicId = $this->option('comic')) {
            $comic = Comic::find($comicId);

            if (!$comic) {
                $this->error("Comic {$comicId} not found.");
                return self::FAILURE;
            }

            ProcessComicAIJob::dispatch($comic);
            $this->info("Queued fresh AI job for comic {$comicId} ({$comic->title}).");

            return self::SUCCESS;
        }

        $failer = $this->laravel['queue.failer'];
        $redispatched = 0;

        foreach ($failer->all() as $job) {
            $payload = json_decode($job->payload, true);

            if (!str_contains($payload['displayName'] ?? '', 'ProcessComicAIJob')) {
                continue;
            }

            $command = unserialize($payload['data']['command']);

            if (!$command instanceof ProcessComicAIJob) {
                continue;
            }

            ProcessComicAIJob::dispatch($command->comic, $command->userId);
            $failer->forget($job->id);
            $redispatched++;
        }

        if ($redispatched === 0) {
            $this->warn('No failed ProcessComicAIJob entries found. Use the sparkles button in Admin → Archive to queue new jobs.');
            return self::SUCCESS;
        }

        $this->info("Re-dispatched {$redispatched} AI job(s) with fresh 600s timeout.");
        $this->line('Run: php artisan queue:work-ai');

        return self::SUCCESS;
    }
}
