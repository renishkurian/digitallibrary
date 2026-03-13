<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\ActivityLog;
use Inertia\Inertia;

class LogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::query();

        if ($request->filled('level')) {
            $query->where('level', $request->input('level'));
        }

        if ($request->filled('q')) {
            $query->where('message', 'like', '%' . $request->input('q') . '%');
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Logs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['q', 'level'])
        ]);
    }
}
