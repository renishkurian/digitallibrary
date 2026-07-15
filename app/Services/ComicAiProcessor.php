<?php

namespace App\Services;

use App\Models\Comic;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class ComicAiProcessor
{
    public function __construct(private AIService $aiService)
    {
    }

    public function process(Comic $comic, ?int $userId = null): bool
    {
        $lock = Cache::lock("comic-ai-processing:{$comic->id}", 900);

        if (!$lock->get()) {
            Log::warning("ComicAiProcessor: comic {$comic->id} is already being processed.");
            return false;
        }

        try {
            return $this->run($comic, $userId);
        } finally {
            $lock->release();
        }
    }

    private function run(Comic $comic, ?int $userId): bool
    {
        $providerInfo = $this->aiService->getConfiguredProvider();

        if ($providerInfo['is_local']) {
            Log::info("ComicAiProcessor: processing comic {$comic->id} with local LLM (Ollama)", $providerInfo);
        } else {
            Log::info("ComicAiProcessor: processing comic {$comic->id} with remote LLM", $providerInfo);
        }

        $baseDir = rtrim(config('comics.base_dir'), '/');
        $comicPath = urldecode(ltrim($comic->path, '/'));
        $fullPath = $baseDir . '/' . $comicPath;

        if (!file_exists($fullPath)) {
            Log::error("ComicAiProcessor failed: file does not exist at {$fullPath}");
            return false;
        }

        $text = $this->extractPdfText($fullPath);
        $usedTitleFallback = strlen(trim($text)) < 80;

        if ($usedTitleFallback) {
            Log::warning("ComicAiProcessor: minimal PDF text for comic {$comic->id}, using title metadata fallback", [
                'extracted_chars' => strlen(trim($text)),
                'title' => $comic->title,
            ]);
        }

        Log::info("ComicAiProcessor: extracted PDF text for comic {$comic->id}", [
            'chars' => strlen($text),
            'used_title_fallback' => $usedTitleFallback,
            'is_local_llm' => $providerInfo['is_local'],
        ]);

        $metadata = $this->aiService->generateMetadata($text, $userId, [
            'title' => $comic->title,
            'author' => $comic->author,
            'filename' => $comic->filename,
            'description' => $comic->description,
            'used_title_fallback' => $usedTitleFallback,
        ]);

        if (!$metadata) {
            Log::error("ComicAiProcessor: failed to generate AI metadata for comic {$comic->id}");
            return false;
        }

        $comic->update([
            'ai_summary' => $metadata['summary'] ?? null,
            'rating' => $metadata['rating'] ?? null,
            'tags' => isset($metadata['tags']) ? json_encode($metadata['tags']) : null,
        ]);

        Log::info("ComicAiProcessor: successfully generated AI metadata for comic {$comic->id}", [
            'is_local_llm' => $providerInfo['is_local'],
            'model' => $providerInfo['model'],
            'summary_length' => strlen($metadata['summary'] ?? ''),
        ]);

        return true;
    }

    private function extractPdfText(string $fullPath): string
    {
        $commands = [
            ['pdftotext', '-f', '1', '-l', '10', $fullPath, '-'],
            ['pdftotext', '-layout', '-f', '1', '-l', '10', $fullPath, '-'],
            ['pdftotext', '-raw', '-f', '1', '-l', '5', $fullPath, '-'],
        ];

        $best = '';

        foreach ($commands as $command) {
            $process = new Process($command);
            $process->setTimeout(120);
            $process->run();

            if (!$process->isSuccessful()) {
                continue;
            }

            $output = trim($process->getOutput());
            if (strlen($output) > strlen($best)) {
                $best = $output;
            }

            if (strlen($output) >= 80) {
                return $output;
            }
        }

        return $best;
    }
}
