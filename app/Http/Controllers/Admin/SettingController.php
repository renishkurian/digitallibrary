<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AIService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = [
            'ai_enabled' => Setting::get('ai_enabled', '0'),
            'ai_provider' => Setting::get('ai_provider', 'openai'),
            'ai_base_url' => Setting::get('ai_base_url', ''),
            'ai_api_key' => Setting::get('ai_api_key', ''),
            'ai_model' => Setting::get('ai_model', 'gpt-4o'),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'ai_enabled' => 'required|in:0,1',
            'ai_provider' => 'required|string',
            'ai_base_url' => 'nullable|url',
            'ai_api_key' => 'nullable|string',
            'ai_model' => 'nullable|string',
        ]);

        Setting::set('ai_enabled', $request->ai_enabled);
        Setting::set('ai_provider', $request->ai_provider);
        Setting::set('ai_base_url', $request->ai_base_url ?? '');

        if ($request->has('ai_api_key') && $request->ai_api_key !== '********') {
            Setting::set('ai_api_key', $request->ai_api_key);
        }

        Setting::set('ai_model', $request->ai_model ?? '');

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }

    public function test(Request $request, AIService $aiService)
    {
        $request->validate([
            'ai_provider' => 'required|string',
            'ai_base_url' => 'nullable|url',
            'ai_api_key' => 'nullable|string',
            'ai_model' => 'required|string',
        ]);

        $apiKey = (string) ($request->input('ai_api_key') ?? '');
        if ($apiKey === '********' || $apiKey === '') {
            $apiKey = (string) Setting::get('ai_api_key', '');
        }

        $result = $aiService->testConnection(
            $request->ai_provider,
            $apiKey,
            $request->ai_model,
            (string) ($request->ai_base_url ?? ''),
        );

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        return response()->json($result);
    }
}
