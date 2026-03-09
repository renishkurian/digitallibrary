<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\AiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AIService
{
    /**
     * Generate metadata for a comic based on its extracted text.
     *
     * @param string $text Extracted text from the PDF
     * @return array|null An array containing ['summary' => string, 'rating' => float, 'tags' => array] or null on failure.
     */
    public function generateMetadata(string $text, ?int $userId = null): ?array
    {
        $provider = Setting::get('ai_provider', 'openai');
        $apiKey = Setting::get('ai_api_key', '');
        $model = Setting::get('ai_model', 'gpt-4o');
        $baseUrl = Setting::get('ai_base_url', '');

        if (empty($apiKey)) {
            Log::error("AIService: API key is not configured.");
            return null;
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
" . substr($text, 0, 8000); // Limit to ~8k characters to save tokens

        try {
            if ($provider === 'openai' || $provider === 'custom') {
                $url = $baseUrl ?: 'https://api.openai.com/v1';
                $response = Http::withToken($apiKey)
                    ->timeout(60)
                    ->post(rtrim($url, '/') . '/chat/completions', [
                        'model' => $model,
                        'messages' => [
                            ['role' => 'system', 'content' => 'You are a helpful assistant that only responds in valid JSON.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'response_format' => ['type' => 'json_object'],
                    ]);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content');
                    $tokens = $response->json('usage.total_tokens') ?? 0;

                    $this->logUsage('auto-tag', $provider, $model, $prompt, $content, $tokens, $userId);

                    return json_decode($content, true);
                }

                Log::error("AIService OpenAI/Custom Error: " . $response->body());
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

                    // Gemini sometimes wraps JSON in markdown code blocks
                    $cleanContent = preg_replace('/^```(?:json)?\s*(.*?)\s*```$/ms', '$1', trim($content));

                    $decoded = json_decode($cleanContent, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        Log::error("AIService JSON Decode Error: " . json_last_error_msg() . "\nOriginal Content:\n" . $content . "\nCleaned Content:\n" . $cleanContent);
                        return null;
                    }

                    return $decoded;
                }

                Log::error("AIService Gemini Error: " . $response->body());
                return null;
            }
        } catch (\Exception $e) {
            Log::error("AIService Exception: " . $e->getMessage());
        }

        return null;
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
