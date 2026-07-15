<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\AiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AIService
{
    private const OLLAMA_DEFAULT_URL = 'http://127.0.0.1:11434/v1';

    /**
     * Generate metadata for a comic based on its extracted text.
     *
     * @param string $text Extracted text from the PDF
     * @param array{title?: string, author?: string, filename?: string, description?: string, used_title_fallback?: bool}|null $context
     * @return array|null An array containing ['summary' => string, 'rating' => float, 'tags' => array] or null on failure.
     */
    public function generateMetadata(string $text, ?int $userId = null, ?array $context = null): ?array
    {
        $provider = (string) Setting::get('ai_provider', 'openai');
        $apiKey = (string) Setting::get('ai_api_key', '');
        $model = (string) Setting::get('ai_model', 'gpt-4o');
        $baseUrl = (string) Setting::get('ai_base_url', '');

        if (!$this->providerConfigured($provider, $apiKey, $baseUrl)) {
            Log::error("AIService: API key is not configured.");
            return null;
        }

        $isLocal = $this->usesLocalLlm($provider, $baseUrl);
        $textLimit = $isLocal ? 3500 : 8000;
        $startedAt = microtime(true);

        $this->logProviderSelection('auto-tag', $provider, $model, $baseUrl);

        $promptBody = substr($text, 0, $textLimit);

        if (($context['used_title_fallback'] ?? false) || strlen(trim($promptBody)) < 80) {
            $promptBody = $this->buildTitleFallbackContext($context ?? [], $promptBody);
        }

        $prompt = "You are a professional comic book and manga reviewer. Based on the following extracted text from the beginning of a comic book, please provide:
1. A concise, engaging summary (2-3 sentences max).
2. A maturity/quality rating out of 5.0 (just the number).
3. A list of 3-5 relevant genre tags (e.g., Action, Sci-Fi, Fantasy, Slice of Life).

Return your response EXCLUSIVELY in the following JSON format, with no markdown formatting or extra text:
{
  \"summary\": \"The story follows...\",
  \"rating\": 4.5,
  \"tags\": [\"Action\", \"Sci-Fi\", \"Adventure\"]
}

Extracted Text:
" . $promptBody;

        try {
            if ($provider === 'openai' || $provider === 'custom') {
                $url = $baseUrl ?: 'https://api.openai.com/v1';
                $payload = [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a helpful assistant that only responds in valid JSON.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                ];

                if (!$this->isLocalOllamaUrl($url)) {
                    $payload['response_format'] = ['type' => 'json_object'];
                } else {
                    $payload['stream'] = false;
                    $payload['options'] = $this->ollamaGenerationOptions();
                }

                $timeout = $this->isLocalOllamaUrl($url) ? 540 : 60;
                $response = $this->chatCompletions($url, $apiKey ?: null, $payload, $timeout);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content');
                    $tokens = $response->json('usage.total_tokens') ?? 0;

                    $this->logUsage('auto-tag', $provider, $model, $prompt, $content, $tokens, $userId);
                    $this->logProviderResponse('auto-tag', $provider, $model, $baseUrl, $startedAt, $tokens);

                    return $this->decodeJsonResponse($content, 'auto-tag');
                }

                Log::error("AIService OpenAI/Custom Error: " . $response->body());
                return null;
            } elseif ($provider === 'ollama') {
                $url = $baseUrl ?: self::OLLAMA_DEFAULT_URL;
                $response = $this->chatCompletions($url, null, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a helpful assistant that only responds in valid JSON.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'stream' => false,
                    'options' => $this->ollamaGenerationOptions(),
                ], 540);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content');
                    $tokens = $response->json('usage.total_tokens')
                        ?? $response->json('prompt_eval_count', 0) + $response->json('eval_count', 0);

                    $this->logUsage('auto-tag', $provider, $model, $prompt, $content, $tokens, $userId);
                    $this->logProviderResponse('auto-tag', $provider, $model, $baseUrl, $startedAt, $tokens);

                    return $this->decodeJsonResponse($content, 'auto-tag');
                }

                Log::error("AIService Ollama Error: " . $response->body());
                return null;
            } elseif ($provider === 'anthropic') {
                $url = $baseUrl ?: 'https://api.anthropic.com/v1';
                $response = Http::withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type' => 'application/json',
                ])
                    ->timeout(60)
                    ->post(rtrim($url, '/') . '/messages', [
                        'model' => $model ?: 'claude-3-haiku-20240307',
                        'max_tokens' => 1024,
                        'messages' => [
                            ['role' => 'user', 'content' => $prompt]
                        ]
                    ]);

                if ($response->successful()) {
                    $content = $response->json('content.0.text');
                    $inputTokens = $response->json('usage.input_tokens') ?? 0;
                    $outputTokens = $response->json('usage.output_tokens') ?? 0;

                    $this->logUsage('auto-tag', $provider, $model, $prompt, $content, $inputTokens + $outputTokens, $userId);

                    return json_decode($content, true);
                }

                Log::error("AIService Anthropic Error: " . $response->body());
                return null;
            } elseif ($provider === 'gemini') {
                $url = $baseUrl ?: 'https://generativelanguage.googleapis.com/v1beta';
                $response = Http::timeout(60)
                    ->post(rtrim($url, '/') . "/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]]
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json'
                        ]
                    ]);

                if ($response->successful()) {
                    $content = $response->json('candidates.0.content.parts.0.text');
                    $tokens = $response->json('usageMetadata.totalTokenCount') ?? 0;

                    $this->logUsage('auto-tag', $provider, $model, $prompt, $content, $tokens, $userId);

                    return $this->decodeJsonResponse($content, 'auto-tag');
                }

                Log::error("AIService Gemini Error: " . $response->body());
                return null;
            }
        } catch (\Exception $e) {
            Log::error("AIService Exception: " . $e->getMessage());
        }

        return null;
    }

    public function providerConfigured(string $provider, ?string $apiKey, string $baseUrl = ''): bool
    {
        $apiKey = $apiKey ?? '';

        return $provider === 'ollama'
            || $this->isLocalOllamaUrl($baseUrl)
            || $apiKey !== '';
    }

    public function isLocalOllamaUrl(string $baseUrl): bool
    {
        if ($baseUrl === '') {
            return false;
        }

        return (bool) preg_match('#^https?://(127\.0\.0\.1|localhost)(:11434)?(/v1)?/?$#i', rtrim($baseUrl, '/'))
            || str_contains(rtrim($baseUrl, '/'), ':11434/v1');
    }

    public function usesLocalLlm(string $provider, string $baseUrl = ''): bool
    {
        return $provider === 'ollama'
            || $this->isLocalOllamaUrl($this->resolveBaseUrl($provider, $baseUrl));
    }

    public function getConfiguredProvider(): array
    {
        $provider = (string) Setting::get('ai_provider', 'openai');
        $model = (string) Setting::get('ai_model', 'gpt-4o');
        $baseUrl = (string) Setting::get('ai_base_url', '');
        $resolvedUrl = $this->resolveBaseUrl($provider, $baseUrl);

        return [
            'provider' => $provider,
            'model' => $model,
            'base_url' => $resolvedUrl,
            'is_local' => $this->usesLocalLlm($provider, $baseUrl),
        ];
    }

    private function logProviderSelection(string $action, string $provider, string $model, string $baseUrl): void
    {
        $resolvedUrl = $this->resolveBaseUrl($provider, $baseUrl);
        $context = [
            'action' => $action,
            'provider' => $provider,
            'model' => $model,
            'base_url' => $resolvedUrl,
        ];

        if ($this->usesLocalLlm($provider, $baseUrl)) {
            Log::info('AIService: using local LLM (Ollama)', $context);
            return;
        }

        Log::info('AIService: using remote LLM', $context);
    }

    private function logProviderResponse(string $action, string $provider, string $model, string $baseUrl, float $startedAt, int $tokens = 0): void
    {
        $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);
        $context = [
            'action' => $action,
            'provider' => $provider,
            'model' => $model,
            'latency_ms' => $latencyMs,
            'tokens' => $tokens,
        ];

        if ($this->usesLocalLlm($provider, $baseUrl)) {
            Log::info('AIService: local LLM (Ollama) response received', $context);
            return;
        }

        Log::info('AIService: remote LLM response received', $context);
    }

    private function logTestConnectionResult(string $provider, string $model, string $baseUrl, array $result): void
    {
        if (!$this->usesLocalLlm($provider, $baseUrl)) {
            return;
        }

        if ($result['success'] ?? false) {
            Log::info('AIService: local LLM (Ollama) test connection succeeded', [
                'model' => $model,
                'latency_ms' => $result['latency_ms'] ?? null,
                'response' => $result['response'] ?? null,
            ]);
            return;
        }

        Log::warning('AIService: local LLM (Ollama) test connection failed', [
            'model' => $model,
            'message' => $result['message'] ?? 'Unknown error',
        ]);
    }

    /**
     * Send a minimal prompt to verify provider connectivity and model availability.
     *
     * @return array{success: bool, message: string, response?: string, latency_ms?: int}
     */
    public function testConnection(string $provider, string $apiKey, string $model, string $baseUrl): array
    {
        if (empty($model)) {
            return ['success' => false, 'message' => 'Model name is required.'];
        }

        if (!$this->providerConfigured($provider, $apiKey, $baseUrl)) {
            return ['success' => false, 'message' => 'API token is required for this provider.'];
        }

        $prompt = 'Reply with exactly the single word: OK';
        $startedAt = microtime(true);

        $this->logProviderSelection('test-connection', $provider, $model, $baseUrl);

        try {
            if ($provider === 'openai' || $provider === 'custom') {
                $url = $this->resolveBaseUrl($provider, $baseUrl);
                $timeout = $this->isLocalOllamaUrl($url) ? 180 : 60;
                $response = $this->chatCompletions($url, $apiKey ?: null, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 16,
                    'stream' => false,
                ], $timeout);

                $result = $this->buildTestResult($response, $startedAt, 'choices.0.message.content');
                $this->logTestConnectionResult($provider, $model, $baseUrl, $result);

                return $result;
            }

            if ($provider === 'ollama') {
                $url = $this->resolveBaseUrl($provider, $baseUrl);
                $response = $this->chatCompletions($url, null, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'stream' => false,
                ], 180);

                $result = $this->buildTestResult($response, $startedAt, 'choices.0.message.content');
                $this->logTestConnectionResult($provider, $model, $baseUrl, $result);

                return $result;
            }

            if ($provider === 'anthropic') {
                $url = $this->resolveBaseUrl($provider, $baseUrl);
                $response = Http::withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type' => 'application/json',
                ])
                    ->timeout(60)
                    ->post(rtrim($url, '/') . '/messages', [
                        'model' => $model ?: 'claude-3-haiku-20240307',
                        'max_tokens' => 16,
                        'messages' => [
                            ['role' => 'user', 'content' => $prompt],
                        ],
                    ]);

                return $this->buildTestResult($response, $startedAt, 'content.0.text');
            }

            if ($provider === 'gemini') {
                $url = $this->resolveBaseUrl($provider, $baseUrl);
                $response = Http::timeout(60)
                    ->post(rtrim($url, '/') . "/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                    ]);

                return $this->buildTestResult($response, $startedAt, 'candidates.0.content.parts.0.text');
            }

            return ['success' => false, 'message' => 'Unsupported AI provider.'];
        } catch (\Exception $e) {
            Log::error('AIService testConnection Exception: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    public function resolveBaseUrl(string $provider, string $baseUrl): string
    {
        if (!empty($baseUrl)) {
            return rtrim($baseUrl, '/');
        }

        return match ($provider) {
            'ollama' => self::OLLAMA_DEFAULT_URL,
            'anthropic' => 'https://api.anthropic.com/v1',
            'gemini' => 'https://generativelanguage.googleapis.com/v1beta',
            default => 'https://api.openai.com/v1',
        };
    }

    private function chatCompletions(string $baseUrl, ?string $apiKey, array $payload, int $timeout = 60)
    {
        if ($this->isLocalOllamaUrl($baseUrl)) {
            Log::info('AIService: waiting for local LLM (Ollama) response...', [
                'model' => $payload['model'] ?? null,
                'timeout_seconds' => $timeout,
            ]);
        }

        $request = Http::timeout($timeout);

        if (!empty($apiKey)) {
            $request = $request->withToken($apiKey);
        }

        return $request->post(rtrim($baseUrl, '/') . '/chat/completions', $payload);
    }

    private function buildTestResult($response, float $startedAt, string $contentPath): array
    {
        $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

        if (!$response->successful()) {
            $error = $response->json('error.message')
                ?? $response->json('error')
                ?? trim($response->body());

            if (is_array($error)) {
                $error = json_encode($error);
            }

            return [
                'success' => false,
                'message' => 'Provider returned an error: ' . ($error ?: 'Unknown error'),
                'latency_ms' => $latencyMs,
            ];
        }

        $content = trim((string) $response->json($contentPath));

        if ($content === '') {
            return [
                'success' => false,
                'message' => 'Provider responded but returned empty content.',
                'latency_ms' => $latencyMs,
            ];
        }

        return [
            'success' => true,
            'message' => 'Connection successful.',
            'response' => $content,
            'latency_ms' => $latencyMs,
        ];
    }

    private function buildTitleFallbackContext(array $context, string $extractedText): string
    {
        $lines = array_filter([
            isset($context['title']) ? 'Title: ' . $context['title'] : null,
            !empty($context['author']) ? 'Author: ' . $context['author'] : null,
            !empty($context['filename']) ? 'Filename: ' . $context['filename'] : null,
            !empty($context['description']) ? 'Description: ' . $context['description'] : null,
            'Note: PDF text extraction returned very little content (likely a scanned/image PDF). Infer genre and write a short summary from the title and metadata.',
            $extractedText !== '' ? 'Extracted text fragment: ' . $extractedText : null,
        ]);

        return implode("\n", $lines);
    }

    private function ollamaGenerationOptions(): array
    {
        return [
            'num_predict' => 400,
            'temperature' => 0.2,
        ];
    }

    private function decodeJsonResponse(?string $content, string $action = 'auto-tag'): ?array
    {
        if ($content === null || $content === '') {
            return null;
        }

        $cleanContent = trim($content);
        $cleanContent = preg_replace('/^```(?:json)?\s*(.*?)\s*```$/ms', '$1', $cleanContent);

        if (preg_match('/\{.*\}/s', $cleanContent, $matches)) {
            $cleanContent = $matches[0];
        }

        $decoded = json_decode($cleanContent, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $this->normalizeMetadata($decoded);
        }

        $repaired = $this->repairTruncatedJson($cleanContent);
        if ($repaired !== null) {
            Log::warning("AIService [{$action}]: repaired truncated JSON from LLM response");
            return $this->normalizeMetadata($repaired);
        }

        Log::error("AIService JSON Decode Error [{$action}]: " . json_last_error_msg(), [
            'preview' => substr($content, 0, 400),
        ]);

        return null;
    }

    private function normalizeMetadata(array $decoded): ?array
    {
        $summary = $decoded['summary'] ?? null;
        if (!is_string($summary) || trim($summary) === '') {
            return null;
        }

        $rating = $decoded['rating'] ?? null;
        if (is_string($rating)) {
            $rating = (float) preg_replace('/[^0-9.]/', '', $rating);
        }

        $tags = $decoded['tags'] ?? [];
        if (is_string($tags)) {
            $tags = array_filter(array_map('trim', explode(',', $tags)));
        }

        return [
            'summary' => trim($summary),
            'rating' => is_numeric($rating) ? (float) $rating : null,
            'tags' => array_values(array_filter((array) $tags)),
        ];
    }

    private function repairTruncatedJson(string $content): ?array
    {
        $summary = null;
        $rating = null;
        $tags = [];

        if (preg_match('/"summary"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/s', $content, $m)) {
            $summary = stripcslashes($m[1]);
        }

        if (preg_match('/"rating"\s*:\s*([0-9.]+)/', $content, $m)) {
            $rating = (float) $m[1];
        }

        if (preg_match('/"tags"\s*:\s*\[(.*?)\]/s', $content, $m)) {
            preg_match_all('/"((?:[^"\\\\]|\\\\.)*)"/', $m[1], $tagMatches);
            $tags = array_map('stripcslashes', $tagMatches[1] ?? []);
        }

        if ($summary === null) {
            return null;
        }

        return [
            'summary' => $summary,
            'rating' => $rating,
            'tags' => $tags,
        ];
    }

    private function logUsage($action, $provider, $model, $prompt, $response, $tokens, ?int $userId = null)
    {
        try {
            AiLog::create([
                'user_id' => $userId ?? Auth::id(),
                'action' => $action,
                'provider' => $provider,
                'model' => $model,
                'prompt' => is_string($prompt) ? $prompt : json_encode($prompt),
                'response' => is_string($response) ? $response : json_encode($response),
                'tokens_used' => $tokens,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to log AI usage: " . $e->getMessage());
        }
    }
}
