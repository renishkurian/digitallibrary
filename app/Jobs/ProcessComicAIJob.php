<?php

namespace App\Jobs;

use App\Models\Comic;
use App\Services\AIService;
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

    public $comic;
    public $userId;

    /**
     * Create a new job instance.
     */
    public function __construct(Comic $comic, ?int $userId = null)
    {
        $this->comic = $comic;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(AIService $aiService): void
    {
        Log::info("Starting AI processing for comic: {$this->comic->id}");

        $baseDir = rtrim(config('comics.base_dir'), '/');
        $comicPath = urldecode(ltrim($this->comic->path, '/'));
        $fullPath = $baseDir . '/' . $comicPath;

        if (!file_exists($fullPath)) {
            Log::error("ProcessComicAIJob failed: File does not exist at {$fullPath}");
            return;
        }

        // Extract text from the first 10 pages using pdftotext
        // '-' means output to stdout
        $process = new Process(['pdftotext', '-f', '1', '-l', '10', $fullPath, '-']);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::error("ProcessComicAIJob failed: pdftotext error - " . $process->getErrorOutput());
            return;
        }

        $text = $process->getOutput();

        if (empty(trim($text))) {
            Log::warning("ProcessComicAIJob: Extracted text is empty for comic {$this->comic->id}.");
            return;
        }

        // Generate metadata
        $metadata = $aiService->generateMetadata($text, $this->userId);

        if ($metadata) {
            $this->comic->update([
                'ai_summary' => $metadata['summary'] ?? null,
                'rating' => $metadata['rating'] ?? null,
                'tags' => isset($metadata['tags']) ? json_encode($metadata['tags']) : null,
            ]);
            Log::info("Successfully generated AI metadata for comic {$this->comic->id}");
        } else {
            Log::error("Failed to generate AI metadata for comic {$this->comic->id}");
        }
    }
}
