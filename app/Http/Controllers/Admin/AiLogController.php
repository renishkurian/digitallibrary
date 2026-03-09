<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiLog;
use Inertia\Inertia;

class AiLogController extends Controller
{
    public function index()
    {
        $logs = AiLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->through(function ($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user ? ['name' => $log->user->name, 'email' => $log->user->email] : null,
                    'action' => $log->action,
                    'provider' => $log->provider,
                    'model' => $log->model,
                    'prompt' => $log->prompt,
                    'response' => $log->response,
                    'tokens_used' => $log->tokens_used,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('Admin/AILogs/Index', [
            'logs' => $logs,
        ]);
    }
}
