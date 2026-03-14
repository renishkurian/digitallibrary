<?php

namespace App\Http\Controllers;

use App\Models\Shelf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ShelfController extends Controller
{
    public function index()
    {
        $shelves = Shelf::visible(Auth::user())
            ->whereNull('parent_id')
            ->withCount('comics')
            ->with(['children' => fn($q) => $q->visible(Auth::user())->withCount('comics')])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Shelves/Index', [
            'shelves' => $shelves->map(fn($s) => [
                'id' => $s->hash_id,
                'name' => $s->name,
                'description' => $s->description,
                'cover_image' => $s->cover_image,
                'comics_count' => $s->aggregate_comics_count,
                'children' => $s->children->map(fn($c) => [
                    'id' => $c->hash_id,
                    'name' => $c->name,
                    'comics_count' => $c->aggregate_comics_count,
                ])
            ]),
        ]);
    }

    public function show($id, Request $request)
    {
        $shelf = Shelf::findByHashId($id);
        if (!$shelf) {
            // Fallback for numeric ID if needed for backward compatibility during transition
            $shelf = Shelf::find($id);
        }

        if (!$shelf) abort(404);
        if ($shelf->is_hidden && (!Auth::check() || !Auth::user()->is_admin)) {
            abort(403);
        }

        $shelf->load('parent');

        $allShelfIds = array_merge([$shelf->id], $shelf->getDescendantIds());

        $comics = \App\Models\Comic::whereHas('shelves', function ($query) use ($allShelfIds) {
            $query->whereIn('shelves.id', $allShelfIds);
        })
            ->withCount('readers')
            ->visible()
            ->latest()
            ->paginate(28)
            ->through(fn($comic) => [
                'id' => $comic->id,
                'title' => $comic->title,
                'thumbnail' => $comic->thumbnail,
                'is_read' => Auth::check() ? $comic->isReadBy(Auth::user()) : false,
                'readers_count' => $comic->readers_count,
                'share_url' => $comic->share_url,
                'rating' => $comic->rating,
                'tags' => $comic->tags,
            ]);

        $children = $shelf->children()
            ->visible(Auth::user())
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Shelves/Show', [
            'shelf' => $shelf,
            'children' => $children,
            'comics' => $comics,
        ]);
    }

    public function adminIndex()
    {
        $allShelves = Shelf::with(['user', 'parent'])->orderBy('sort_order')->get();

        // Build a hierarchical list
        $shelves = [];
        $roots = $allShelves->whereNull('parent_id');

        $flatten = function ($items, $prefix = '') use (&$flatten, &$shelves, $allShelves) {
            foreach ($items as $item) {
                $item->display_name = $prefix . $item->name;
                $shelves[] = $item;
                $children = $allShelves->where('parent_id', $item->id);
                if ($children->count() > 0) {
                    $flatten($children, $prefix . '— ');
                }
            }
        };

        $flatten($roots);

        return Inertia::render('Admin/Shelves/Index', [
            'shelves' => $shelves,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:shelves,id',
            'is_hidden' => 'required|boolean',
            'is_common' => 'boolean',
            'cover_image' => 'nullable|image|max:2048',
        ]);

        $name = $request->name;
        // If name only contains English characters, numbers, and basic punctuation, convert to Title Case
        if (preg_match('/^[a-zA-Z0-9\s\-_\.,\'"!?()]+$/', $name)) {
            $name = ucwords(strtolower($name));
        }

        $shelf = Shelf::create([
            'name' => $name,
            'description' => $request->description,
            'parent_id' => $request->parent_id,
            'is_hidden' => $request->is_hidden,
            'is_common' => $request->boolean('is_common', true),
            'user_id' => Auth::id(),
        ]);

        if ($request->hasFile('cover_image')) {
            $file = $request->file('cover_image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('shelves'), $filename);
            $shelf->update(['cover_image' => $filename]);
        }

        return back()->with('success', 'Shelf created successfully.');
    }

    public function update(Request $request, Shelf $shelf)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:shelves,id',
            'is_hidden' => 'required|boolean',
            'is_common' => 'boolean',
            'cover_image' => 'nullable|image|max:2048',
        ]);

        // Prevent self-parenting
        if ($request->parent_id == $shelf->id) {
            return back()->with('error', 'A shelf cannot be its own parent.');
        }

        $name = $request->name;
        // If name only contains English characters, numbers, and basic punctuation, convert to Title Case
        if (preg_match('/^[a-zA-Z0-9\s\-_\.,\'"!?()]+$/', $name)) {
            $name = ucwords(strtolower($name));
        }

        $shelf->update([
            'name' => $name,
            'description' => $request->description,
            'parent_id' => $request->parent_id,
            'is_hidden' => $request->is_hidden,
            'is_common' => $request->is_common,
        ]);

        if ($request->hasFile('cover_image')) {
            $file = $request->file('cover_image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('shelves'), $filename);
            $shelf->update(['cover_image' => $filename]);
        }

        return back()->with('success', 'Shelf updated successfully.');
    }

    public function destroy(Shelf $shelf)
    {
        $shelf->delete();

        return back()->with('success', 'Shelf deleted successfully.');
    }
}
