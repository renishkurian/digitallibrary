<?php

namespace App\Http\Controllers;

use App\Models\Comic;
use App\Models\ComicPlaylist;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComicPlaylistController extends Controller
{
    public function index(Request $request)
    {
        $playlists = ComicPlaylist::query()
            ->where('user_id', $request->user()->id)
            ->withCount('comics')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (ComicPlaylist $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'comics_count' => $p->comics_count,
                'updated_at' => $p->updated_at?->toIso8601String(),
            ]);

        return Inertia::render('Lists/Index', [
            'playlists' => $playlists,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
        ]);

        $max = (int) ComicPlaylist::where('user_id', $request->user()->id)->max('sort_order');

        $playlist = ComicPlaylist::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'sort_order' => $max + 1,
        ]);

        return redirect()
            ->route('lists.show', $playlist)
            ->with('success', 'List created.');
    }

    public function show(Request $request, ComicPlaylist $list)
    {
        $this->authorizeList($request, $list);

        $list->load(['comics' => function ($q) {
            $q->orderBy('comic_playlist_comic.position');
        }]);

        $comics = $list->comics->map(fn (Comic $c) => [
            'id' => $c->hash_id,
            'title' => $c->title,
            'thumbnail' => $c->thumbnail,
            'pages_count' => $c->pages_count,
            'series' => $c->series,
        ]);

        return Inertia::render('Lists/Show', [
            'playlist' => [
                'id' => $list->id,
                'name' => $list->name,
            ],
            'comics' => $comics,
        ]);
    }

    public function update(Request $request, ComicPlaylist $list)
    {
        $this->authorizeList($request, $list);

        $data = $request->validate([
            'name' => 'required|string|max:120',
        ]);

        $list->update(['name' => $data['name']]);

        return back()->with('success', 'List updated.');
    }

    public function destroy(Request $request, ComicPlaylist $list)
    {
        $this->authorizeList($request, $list);
        $list->delete();

        return redirect()->route('lists.index')->with('success', 'List deleted.');
    }

    public function attach(Request $request, ComicPlaylist $list)
    {
        $this->authorizeList($request, $list);

        $data = $request->validate([
            'comic_id' => 'required|string',
        ]);

        $comic = is_numeric($data['comic_id'])
            ? Comic::findOrFail((int) $data['comic_id'])
            : Comic::findByHashId($data['comic_id']);

        if (!$comic) {
            abort(404);
        }

        $max = (int) $list->comics()->max('comic_playlist_comic.position');

        $list->comics()->syncWithoutDetaching([
            $comic->id => ['position' => $max !== null ? $max + 1 : 0],
        ]);

        return back()->with('success', 'Added to list.');
    }

    public function detach(Request $request, ComicPlaylist $list, Comic $comic)
    {
        $this->authorizeList($request, $list);
        $list->comics()->detach($comic->id);

        return back()->with('success', 'Removed from list.');
    }

    public function reorder(Request $request, ComicPlaylist $list)
    {
        $this->authorizeList($request, $list);

        $data = $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|string',
        ]);

        foreach ($data['order'] as $position => $hashOrId) {
            $comic = is_numeric($hashOrId)
                ? Comic::find($hashOrId)
                : Comic::findByHashId($hashOrId);
            if ($comic && $list->comics()->where('comics.id', $comic->id)->exists()) {
                $list->comics()->updateExistingPivot($comic->id, ['position' => $position]);
            }
        }

        return back()->with('success', 'Order saved.');
    }

    private function authorizeList(Request $request, ComicPlaylist $list): void
    {
        abort_unless($list->user_id === $request->user()->id, 403);
    }
}
