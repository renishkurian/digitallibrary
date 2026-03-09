<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comic;
use App\Models\Setting;
use App\Models\AiLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AiPlaygroundController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/AIPlayground/Index', [
            'provider' => Setting::get('ai_provider', 'openai'),
            'model' => Setting::get('ai_model', 'gpt-4o'),
        ]);
    }

    public function query(Request $request)
    {
        $request->validate(['prompt' => 'required|string']);
        $prompt = $request->prompt;

        $provider = Setting::get('ai_provider', 'openai');
        $apiKey = Setting::get('ai_api_key', '');
        $model = Setting::get('ai_model', 'gpt-4o');
        $baseUrl = Setting::get('ai_base_url', '');

        if (empty($apiKey)) {
            return response()->json(['error' => 'AI API key is not configured.'], 400);
        }

        // Define Tools
        $tools = [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_top_comics',
                    'description' => 'Retrieves a list of the most read comics from the database.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'limit' => ['type' => 'integer', 'description' => 'Number of comics to return. Max 10.']
                        ]
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_comics',
                    'description' => 'Search for a comic in the database by title to find its ID.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => ['type' => 'string', 'description' => 'The title or partial title of the comic.']
                        ],
                        'required' => ['title']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'update_comic_summary',
                    'description' => 'Updates the AI summary of a specific comic.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'comic_id' => ['type' => 'integer', 'description' => 'The ID of the comic'],
                            'new_summary' => ['type' => 'string', 'description' => 'The new summary text to save']
                        ],
                        'required' => ['comic_id', 'new_summary']
                    ]
                ]
            ]
        ];

        // Currently supporting function calling natively via OpenAI format (Works for many proxies too)
        if ($provider !== 'openai' && $provider !== 'custom') {
            return response()->json(['error' => 'The AI Playground with tools is currently only supported with OpenAI or OpenAI-compatible custom endpoints.'], 400);
        }

        $url = $baseUrl ?: 'https://api.openai.com/v1';
        $messages = [
            ['role' => 'system', 'content' => 'You are an AI database assistant for a comic book library. Use the provided tools to fetch data and make updates when asked. Only summarize what you actually found via tools.'],
            ['role' => 'user', 'content' => $prompt],
        ];

        try {
            // First Call
            $response = Http::withToken($apiKey)->timeout(60)->post(rtrim($url, '/') . '/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'tools' => $tools,
                'tool_choice' => 'auto'
            ]);

            if (!$response->successful()) {
                Log::error("Playground Error: " . $response->body());
                return response()->json(['error' => 'Failed to connect to AI provider'], 500);
            }

            $responseData = $response->json();
            $message = $responseData['choices'][0]['message'];

            // Tool Calling Loop
            if (isset($message['tool_calls'])) {
                $messages[] = $message; // Append assistant's tool call request

                foreach ($message['tool_calls'] as $toolCall) {
                    $functionName = $toolCall['function']['name'];
                    $args = json_decode($toolCall['function']['arguments'], true);
                    $result = '';

                    // Execute Local Tools
                    if ($functionName === 'get_top_comics') {
                        $limit = min($args['limit'] ?? 5, 10);
                        $comics = Comic::orderBy('readers_count', 'desc')->take($limit)->get(['id', 'title', 'readers_count']);
                        $result = json_encode($comics);
                    } elseif ($functionName === 'search_comics') {
                        $comics = Comic::where('title', 'like', '%' . $args['title'] . '%')->take(5)->get(['id', 'title', 'ai_summary']);
                        $result = json_encode($comics);
                    } elseif ($functionName === 'update_comic_summary') {
                        $comic = Comic::find($args['comic_id']);
                        if ($comic) {
                            $comic->update(['ai_summary' => $args['new_summary']]);
                            $result = json_encode(['success' => true, 'message' => "Summary updated for comic ID: {$comic->id}"]);
                        } else {
                            $result = json_encode(['error' => 'Comic not found']);
                        }
                    }

                    // Append tool response
                    $messages[] = [
                        'role' => 'tool',
                        'tool_call_id' => $toolCall['id'],
                        'name' => $functionName,
                        'content' => $result
                    ];
                }

                // Second Call with tool results
                $finalResponse = Http::withToken($apiKey)->timeout(60)->post(rtrim($url, '/') . '/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                ]);

                if ($finalResponse->successful()) {
                    $answer = $finalResponse->json('choices.0.message.content');

                    AiLog::create([
                        'user_id' => \Illuminate\Support\Facades\Auth::id(),
                        'action' => 'playground',
                        'provider' => $provider,
                        'model' => $model,
                        'prompt' => $prompt,
                        'response' => $answer,
                        'tokens_used' => $finalResponse->json('usage.total_tokens') ?? 0,
                    ]);

                    return response()->json([
                        'answer' => $answer,
                    ]);
                }
            }

            $answer = $message['content'];
            AiLog::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'action' => 'playground',
                'provider' => $provider,
                'model' => $model,
                'prompt' => $prompt,
                'response' => $answer,
                'tokens_used' => $responseData['usage']['total_tokens'] ?? 0,
            ]);

            // Normal Text Response
            return response()->json([
                'answer' => $answer
            ]);
        } catch (\Exception $e) {
            Log::error("Playground Exception: " . $e->getMessage());
            return response()->json(['error' => 'Server correctly handled the exception but failed. Check logs.'], 500);
        }
    }
}
