<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Comic;
use App\Models\Shelf;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ComicController extends Controller
{
    public function index(Request $request)
    {
        $query = Comic::withCount('readers');

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

        // Shelf Filter
        if ($request->filled('shelf')) {
            $query->where('shelf_id', $request->shelf);
        }

        // Category Filter
        if ($request->filled('category')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('categories.id', $request->category)
                    ->orWhere('categories.slug', $request->category);
            });
        }

        $comics = $query->latest()
            ->paginate(28)
            ->withQueryString()
            ->through(fn($comic) => [
                'id' => $comic->id,
                'title' => $comic->title,
                'thumbnail' => $comic->thumbnail,
                'is_read' => Auth::check() ? $comic->isReadBy(Auth::user()) : false,
                'is_hidden' => (bool) $comic->is_hidden,
                'readers_count' => $comic->readers_count,
            ]);

        return Inertia::render('Comics/Index', [
            'comics' => $comics,
            'filters' => $request->only(['q', 'status', 'shelf', 'category']),
            'shelves' => Shelf::visible()->orderBy('sort_order')->get(),
            'categories' => Category::whereNull('parent_id')->with('children')->orderBy('sort_order')->get(),
        ]);
    }

    public function show(Comic $comic)
    {
        if ($comic->is_hidden && (!Auth::check() || !Auth::user()->is_admin)) {
            abort(403);
        }

        $comic->loadCount('readers');

        return Inertia::render('Comics/Show', [
            'comic' => $comic
        ]);
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
        $comics = Comic::with('shelf', 'categories')->withCount('readers')->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/Comics/Index', [
            'comics' => $comics,
            'shelves' => Shelf::orderBy('sort_order')->get(),
            'categories' => Category::orderBy('sort_order')->get(),
        ]);
    }

    public function update(Request $request, Comic $comic)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'shelf_id' => 'nullable|exists:shelves,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'is_hidden' => 'required|boolean',
        ]);

        $comic->update([
            'title' => $request->title,
            'shelf_id' => $request->shelf_id,
            'is_hidden' => $request->is_hidden,
        ]);

        $comic->categories()->sync($request->category_ids ?? []);

        return back()->with('success', 'Comic updated successfully.');
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
