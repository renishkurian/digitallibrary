<?php

namespace App\Http\Controllers;

use App\Models\Comic;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'totalComics'  => Comic::count(),
            'hiddenComics' => Comic::where('is_hidden', true)->count(),
            'totalUsers'   => User::count(),
            'readEvents'   => DB::table('comic_user')->count(),
        ];

        $recentComics = Comic::with('shelves')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($c) => [
                'id'        => $c->id,
                'title'     => $c->title,
                'is_hidden' => $c->is_hidden,
                'shelf'     => $c->shelves->pluck('name')->join(', '),
                'added'     => $c->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats'        => $stats,
            'recentComics' => $recentComics,
        ]);
    }
}
