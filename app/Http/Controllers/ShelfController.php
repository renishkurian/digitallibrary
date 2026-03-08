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
        $shelves = Shelf::visible()
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Shelves/Index', [
            'shelves' => $shelves,
        ]);
    }

    public function show(Shelf $shelf, Request $request)
    {
        if ($shelf->is_hidden && (!Auth::check() || !Auth::user()->is_admin)) {
            abort(403);
        }

        $comics = $shelf->comics()
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
            ]);

        return Inertia::render('Shelves/Show', [
            'shelf' => $shelf,
            'comics' => $comics,
        ]);
    }

    public function adminIndex()
    {
        $shelves = Shelf::orderBy('sort_order')->get();

        return Inertia::render('Admin/Shelves/Index', [
            'shelves' => $shelves,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_hidden' => 'required|boolean',
        ]);

        Shelf::create($request->all());

        return back()->with('success', 'Shelf created successfully.');
    }

    public function update(Request $request, Shelf $shelf)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_hidden' => 'required|boolean',
        ]);

        $shelf->update($request->all());

        return back()->with('success', 'Shelf updated successfully.');
    }

    public function destroy(Shelf $shelf)
    {
        $shelf->delete();

        return back()->with('success', 'Shelf deleted successfully.');
    }
}
