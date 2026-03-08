<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Comic;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class ComicController extends Controller
{
    public function index(Request $request)
    {
        $query = Comic::query();

        // Guest vs User visibility
        if (!Auth::check() || !Auth::user()->is_admin) {
            $query->visible();
        }

        // Search
        if ($request->filled('q')) {
            $query->search($request->q);
        }

        // Read/Unread Filters (only for logged in users)
        if (Auth::check() && $request->filled('status')) {
            $userId = Auth::id();
            if ($request->status === 'read') {
                $query->whereHas('readers', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            } elseif ($request->status === 'unread') {
                $query->whereDoesntHave('readers', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            }
        }

        $comics = $query->latest()->paginate(28)->withQueryString();

        return view('comics.index', compact('comics'));
    }

    public function show(Comic $comic)
    {
        if ($comic->is_hidden && (!Auth::check() || !Auth::user()->is_admin)) {
            abort(403);
        }

        return view('comics.show', compact('comic'));
    }

    public function serve(Comic $comic)
    {
        if ($comic->is_hidden && (!Auth::check() || !Auth::user()->is_admin)) {
            abort(403);
        }

        $baseDir = env('COMIC_BASE_DIR');
        $path = $baseDir . '/' . $comic->path;

        if (!File::exists($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $comic->filename . '"'
        ]);
    }

    public function toggleRead(Comic $comic)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->readComics()->toggle($comic->id);

        return back();
    }

    // Admin Methods
    public function adminIndex()
    {
        $comics = Comic::latest()->paginate(50);
        return view('admin.comics.index', compact('comics'));
    }

    public function toggleVisibility(Comic $comic)
    {
        $comic->update(['is_hidden' => !$comic->is_hidden]);
        return back()->with('success', 'Visibility toggled.');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'comic' => 'required|file|mimes:pdf|max:102400', // 100MB limit
        ]);

        $file = $request->file('comic');
        $filename = $file->getClientOriginalName();
        $baseDir = env('COMIC_BASE_DIR');

        // Save to baseDir
        $path = $file->move($baseDir, $filename);
        $relativePath = str_replace($baseDir . '/', '', $path->getRealPath());

        $comic = Comic::create([
            'title' => pathinfo($filename, PATHINFO_FILENAME),
            'filename' => $filename,
            'path' => $relativePath,
        ]);

        // Trigger sync or manual thumb generation would go here

        return back()->with('success', 'Comic uploaded successfully.');
    }

    public function sync()
    {
        \Illuminate\Support\Facades\Artisan::call('app:sync-comics');
        return back()->with('success', 'Sync completed.');
    }
}
