<?php

namespace App\Jobs;

use App\Models\Comic;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class ProcessComicAIJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 30;

    public $tries = 3;

    public $comic;
    public $userId;

    public function __construct(Comic $comic, ?int $userId = null)
    {
        $this->comic = $comic;
        $this->userId = $userId;
    }

    /**
     * Spawn a detached process so Ollama can run as long as needed
     * without being killed by the queue worker timeout.
     */
    public function handle(): void
    {
        $comicId = $this->comic->id;
        $userFlag = $this->userId ? ' --user=' . (int) $this->userId : '';
        $logFile = storage_path('logs/ai-process.log');

        $command = sprintf(
            'nohup %s %s comics:process-ai %d%s >> %s 2>&1 &',
            escapeshellarg(PHP_BINARY),
            escapeshellarg(base_path('artisan')),
            $comicId,
            $userFlag,
            escapeshellarg($logFile)
        );

        Log::info("ProcessComicAIJob: spawning background AI processor for comic {$comicId}");

        $process = Process::fromShellCommandline($command, base_path());
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \RuntimeException(
                'Failed to spawn background AI processor: ' . trim($process->getErrorOutput())
            );
        }

        Log::info("ProcessComicAIJob: background AI processor started for comic {$comicId} (LLM runs in separate process, no queue timeout)");
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error("ProcessComicAIJob failed for comic {$this->comic->id}: " . ($exception?->getMessage() ?? 'Unknown error'));
    }
}
