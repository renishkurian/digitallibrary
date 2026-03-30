<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Comic;
use App\Models\Shelf;
use App\Models\Category;
use App\Models\User;
use App\Models\ReadingLog;
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

        // Read/Unread/History/Status Filters (only for logged in users)
        if (Auth::check() && $request->filled('status')) {
            $userId = Auth::id();
            if ($request->status === 'read' || $request->status === 'history') {
                $query->whereHas('readers', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });

                if ($request->status === 'history') {
                    $query->join('comic_user', 'comics.id', '=', 'comic_user.comic_id')
                        ->where('comic_user.user_id', $userId)
                        ->orderByDesc('comic_user.updated_at')
                        ->select('comics.*');
                }
            } elseif ($request->status === 'unread') {
                $query->whereDoesntHave('readers', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            } elseif ($request->status === 'currently_reading') {
                $query->whereHas('readers', function ($q) use ($userId) {
                    $q->where('user_id', $userId)
                        ->where('last_read_page', '>', 1)
                        ->whereColumn('last_read_page', '<', 'comics.pages_count');
                });
            } elseif ($request->status === 'completed') {
                $query->whereHas('readers', function ($q) use ($userId) {
                    $q->where('user_id', $userId)
                        ->whereColumn('last_read_page', '>=', 'comics.pages_count');
                });
            }
        }

        // Shelf Filter (supports comma-separated IDs for multi-select)
        if ($request->filled('shelf')) {
            $shelfParams = array_filter(explode(',', $request->shelf));
            $allShelfIds = [];

            foreach ($shelfParams as $shelfId) {
                $shelfId = trim($shelfId);
                if (!is_numeric($shelfId)) {
                    $shelf = Shelf::findByHashId($shelfId);
                } else {
                    $shelf = Shelf::find($shelfId);
                }

                if ($shelf) {
                    $allShelfIds = array_merge($allShelfIds, [$shelf->id], $shelf->getDescendantIds());
                }
            }

            if (!empty($allShelfIds)) {
                $query->whereHas('shelves', function ($q) use ($allShelfIds) {
                    $q->whereIn('shelves.id', array_unique($allShelfIds));
                });
            } else {
                $query->whereRaw('0=1');
            }
        }

        // Category Filter
        if ($request->filled('category')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('categories.id', $request->category)
                    ->orWhere('categories.slug', $request->category);
            });
        }

        // Date Range Filter (published_date)
        if ($request->filled('date_from')) {
            $query->whereDate('published_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('published_date', '<=', $request->date_to);
        }

        // My Library Filters (only for logged in users)
        if (Auth::check()) {
            $userId = Auth::id();
            if ($request->filled('personal')) {
                $query->where('user_id', $userId)->where('is_personal', true);
            }
            if ($request->filled('shared')) {
                $query->whereHas('sharedWith', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            }
            if ($request->filled('hidden')) {
                $query->where('is_hidden', true);
            }

            // Hide items mapped to user's personal shelves from global/default views
            $isViewingPersonalShelf = false;
            if (isset($shelf) && $shelf->user_id === $userId) {
                $isViewingPersonalShelf = true;
            }

            if (!$isViewingPersonalShelf && !$request->filled('personal') && !$request->filled('q')) {
                $query->whereDoesntHave('shelves', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            }
        }

        if (!$request->filled('status') || $request->status !== 'history') {
            if (!$request->filled('q')) {
                // Default sort: Published date first (DESC), then ID (DESC)
                // We use CASE to put NULL published_dates at the end if desired, 
                // but usually for magazines we want them together.
                $query->orderByRaw('CASE WHEN published_date IS NULL THEN 0 ELSE 1 END DESC')
                    ->orderByDesc('published_date')
                    ->orderByDesc('id');
            } else {
                $query->latest();
            }
        }

        $comics = $query->paginate(28)
            ->withQueryString()
            ->through(function ($comic) {
                /** @var \App\Models\Comic $comic */
                return [
                    'id' => $comic->hash_id,
                    'title' => $comic->title,
                    'filename' => $comic->filename,
                    'file_size' => $comic->file_size,
                    'pages_count' => $comic->pages_count,
                    'thumbnail' => $comic->thumbnail,
                    'shelves' => $comic->shelves->pluck('name'),
                    'is_read' => Auth::check() ? $comic->isReadBy(Auth::user()) : false,
                    'is_hidden' => (bool) $comic->is_hidden,
                    'is_personal' => (bool) $comic->is_personal,
                    'user_id' => $comic->user_id,
                    'readers_count' => $comic->readers_count,
                    'share_url' => $comic->share_url,
                    'rating' => $comic->rating,
                    'tags' => $comic->tags,
                    'published_date' => $comic->published_date ? $comic->published_date->format('Y-m-d') : null,
                ];
            });

        $recentlyRead = [];
        if (Auth::check() && !$request->filled('status') && !$request->filled('shelf') && !$request->filled('category') && !$request->filled('q')) {
            /** @var \App\Models\User $currentUser */
            $currentUser = Auth::user();
            $recentlyRead = $currentUser->readComics()
                ->latest('comic_user.updated_at')
                ->take(6)
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'title' => $c->title,
                    'thumbnail' => $c->thumbnail,
                    'last_read_page' => $c->pivot->last_read_page,
                ]);
        }

        return Inertia::render('Comics/Index', [
            'comics' => $comics,
            'recentlyRead' => $recentlyRead,
            'filters' => $request->only(['q', 'status', 'shelf', 'category', 'personal', 'shared', 'hidden', 'date_from', 'date_to']),
            'shelves' => Shelf::visible(Auth::user())->whereNull('parent_id')->with(['children' => fn($q) => $q->visible(Auth::user())])->orderBy('name')->get()->map(fn($s) => [
                'id' => $s->hash_id,
                'name' => ucfirst(str_replace('_', ' ', $s->name)),
                'cover_image' => $s->display_cover_image,
                'comics_count' => $s->aggregate_comics_count,
                'children' => $s->children->map(fn($c) => [
                    'id' => $c->hash_id,
                    'name' => ucfirst(str_replace('_', ' ', $c->name)),
                    'comics_count' => $c->aggregate_comics_count,
                ])
            ]),
            'categories' => Category::visible(Auth::user())->whereNull('parent_id')->with('children')->orderBy('sort_order')->get(),
        ]);
    }

    public function calendar(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        $query = Comic::query();
        if (!Auth::check() || !Auth::user()->is_admin) {
            $query->visible();
        }

        $shelfId = $request->input('shelf');
        if ($shelfId) {
            $shelf = Shelf::findByHashId($shelfId);
            if ($shelf) {
                $allShelfIds = array_merge([$shelf->id], $shelf->getDescendantIds());
                $query->whereHas('shelves', function ($q) use ($allShelfIds) {
                    $q->whereIn('shelves.id', $allShelfIds);
                });
            }
        }

        $comics = $query->whereNotNull('published_date')
            ->whereYear('published_date', $year)
            ->whereMonth('published_date', $month)
            ->get()
            ->map(function ($comic) {
                return [
                    'id' => $comic->hash_id,
                    'title' => $comic->title,
                    'thumbnail' => $comic->thumbnail,
                    'date' => $comic->published_date->format('Y-m-d'),
                ];
            })
            ->groupBy('date');

        return Inertia::render('Comics/Calendar', [
            'comicsByDate' => $comics,
            'month'      => $month,
            'year'       => $year,
            'magazines'  => Shelf::visible()
                ->whereNull('parent_id')
                ->whereHas('comics')
                ->orderBy('name')
                ->get()
                ->map(fn($s) => [
                    'id'   => $s->hash_id,
                    'name' => ucfirst(str_replace(['_', '-'], ' ', $s->name)),
                ]),
            'currentShelfId' => $shelfId,
        ]);
    }

    public function show(Comic $comic)
    {
        // Re-calculate or find previous/next issues
        $comic->load(['shelves']);
        $shelf = $comic->shelves->first();
        $prev = null;
        $next = null;

        if ($shelf) {
            // Basic ordering: published_date DESC, title ASC, id DESC
            $allComics = $shelf->comics()
                ->orderByRaw('CASE WHEN published_date IS NULL THEN 0 ELSE 1 END DESC')
                ->orderByDesc('published_date')
                ->orderBy('title')
                ->orderByDesc('id')
                ->get();

            $currentIndex = $allComics->search(fn($c) => $c->id === $comic->id);

            if ($currentIndex !== false) {
                if ($currentIndex > 0) $prev = $allComics[$currentIndex - 1];
                if ($currentIndex < $allComics->count() - 1) $next = $allComics[$currentIndex + 1];
            }
        }

        $comic->loadCount('readers');

        $lastReadPage = 1;
        if (Auth::check()) {
            $reader = $comic->readers()->where('user_id', Auth::id())->first();
            if ($reader) {
                $lastReadPage = $reader->pivot->last_read_page ?? 1;
            }
        }

        $personalShelves = [];
        if (Auth::check()) {
            $personalShelves = Shelf::where('user_id', Auth::id())->get(['id', 'name'])->map(function ($s) {
                return ['id' => $s->id, 'name' => ucfirst(str_replace('_', ' ', $s->name))];
            });
        }

        $bookmarks = [];
        if (Auth::check()) {
            $bookmarks = \App\Models\ComicBookmark::where('user_id', Auth::id())
                ->where('comic_id', $comic->id)
                ->orderBy('page_number')
                ->get(['id', 'page_number', 'note', 'created_at']);
        }

        return Inertia::render('Comics/Show', [
            'comic' => $comic,
            'last_read_page' => $lastReadPage,
            'personal_shelves' => $personalShelves,
            'bookmarks' => $bookmarks,
            'prev_issue' => $prev ? ['id' => $prev->hash_id, 'title' => $prev->title] : null,
            'next_issue' => $next ? ['id' => $next->hash_id, 'title' => $next->title] : null,
        ]);
    }

    public function addToPersonalShelf(Request $request, Comic $comic)
    {
        $request->validate([
            'shelf_id' => 'required|exists:shelves,id',
        ]);

        $shelf = Shelf::findOrFail($request->shelf_id);

        if ($shelf->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $comic->shelves()->syncWithoutDetaching([$shelf->id]);

        return back()->with('success', 'Added to shelf: ' . $shelf->name);
    }

    public function addBookmark(Request $request, Comic $comic)
    {
        $request->validate([
            'page_number' => 'required|integer|min:1',
            'note' => 'nullable|string|max:500',
        ]);

        $bookmark = \App\Models\ComicBookmark::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'comic_id' => $comic->id,
                'page_number' => $request->page_number,
            ],
            [
                'note' => $request->note,
            ]
        );

        return response()->json([
            'bookmark' => $bookmark->only(['id', 'page_number', 'note', 'created_at']),
        ]);
    }

    public function removeBookmark(Comic $comic, \App\Models\ComicBookmark $bookmark)
    {
        if ($bookmark->user_id !== Auth::id() || $bookmark->comic_id !== $comic->id) {
            abort(403);
        }

        $bookmark->delete();

        return response()->json(['success' => true]);
    }

    public function serve(Comic $comic)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if ($comic->is_hidden || $comic->is_personal) {
            $isAdmin      = $user && $user->hasRole('admin');
            $isUploader   = $user && $user->id === $comic->user_id;
            $isShared     = $user && $comic->sharedWith()->where('user_id', $user->id)->exists();

            if (!$isAdmin && !$isUploader && !$isShared) {
                abort(403);
            }
        }

        $baseDir = rtrim(config('comics.base_dir'), '/');
        $comicPath = urldecode(ltrim($comic->path, '/'));
        $path = $baseDir . '/' . $comicPath;

        if (!File::exists($path)) {
            abort(404, "File not found at $path");
        }

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . str_replace('"', '\"', $comic->filename) . '"'
        ]);
    }

    public function toggleRead(Comic $comic)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->readComics()->toggle($comic->id);

        return back();
    }

    public function updateLastReadPage(Request $request, Comic $comic)
    {
        $request->validate([
            'page' => 'required|integer|min:1',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Ensure the record exists in the pivot table
        if (!$user->readComics()->where('comic_id', $comic->id)->exists()) {
            $user->readComics()->attach($comic->id);
        }

        $user->readComics()->updateExistingPivot($comic->id, [
            'last_read_page' => $request->page,
            'updated_at' => now(), // Force update timestamp
        ]);

        return response()->json(['success' => true]);
    }

    // Admin Methods
    public function adminIndex(Request $request)
    {
        $statusFilter = $request->get('approval', 'all');
        $query = Comic::with('shelves', 'categories', 'sharedWith', 'uploader')
            ->withCount('readers');

        if ($statusFilter === 'trash') {
            $query->onlyTrashed();
        } else {
            $query->latest();
        }

        // Approval filter
        if ($statusFilter === 'pending') {
            $query->where('is_approved', false)->where('is_personal', false);
        }

        // Search filter
        if ($search = $request->get('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        // Visibility filter
        $visibility = $request->get('visibility', 'all');
        if ($visibility === 'public') {
            $query->where('is_hidden', false);
        } elseif ($visibility === 'hidden') {
            $query->where('is_hidden', true);
        }

        // Shelf filter
        $shelfFilter = $request->get('shelf');
        if ($shelfFilter) {
            $query->whereHas('shelves', function ($q) use ($shelfFilter) {
                $q->where('shelves.id', $shelfFilter);
            });
        }

        $comics = $query->paginate(28)->withQueryString()->through(fn($comic) => [
            'id'            => $comic->id,
            'title'         => $comic->title,
            'path'          => $comic->path,
            'is_hidden'     => (bool) $comic->is_hidden,
            'is_personal'   => (bool) $comic->is_personal,
            'is_approved'   => (bool) $comic->is_approved,
            'user_id'       => $comic->user_id,
            'uploader'      => $comic->uploader ? ['name' => $comic->uploader->name] : null,
            'shelves'       => $comic->shelves,
            'categories'    => $comic->categories,
            'readers_count' => $comic->readers_count,
            'shared_with'   => $comic->sharedWith->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email]),
            'shared_roles'  => $comic->sharedRoles->map(fn($r) => ['id' => $r->id, 'name' => $r->name]),
            'share_url'     => $comic->share_url,
            'rating'        => $comic->rating,
            'thumbnail'     => $comic->thumbnail,
            'tags'          => $comic->tags,
        ]);

        return Inertia::render('Admin/Comics/Index', [
            'comics'     => $comics,
            'shelves'    => Shelf::whereNull('parent_id')->with(['children' => fn($q) => $q->withCount('comics')])->withCount('comics')->orderBy('name')->get(),
            'categories' => Category::orderBy('name')->get(),
            'users'      => User::orderBy('name')->get(['id', 'name', 'email']),
            'roles'      => \Spatie\Permission\Models\Role::orderBy('name')->get(['id', 'name']),
            'filters'    => [
                'visibility' => $visibility,
                'approval' => $request->get('approval', 'all'),
                'q' => $request->get('q', ''),
                'shelf' => $request->get('shelf', ''),
            ],
        ]);
    }

    public function update(Request $request, Comic $comic)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'shelf_ids' => 'nullable|array',
            'shelf_ids.*' => 'exists:shelves,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'is_hidden' => 'required|boolean',
            'is_personal' => 'required|boolean',
            'is_approved' => 'required|boolean',
            'thumbnail' => 'nullable|image|max:2048',
        ]);

        $data = [
            'title' => $request->title,
            'is_hidden' => $request->is_hidden,
            'is_personal' => $request->is_personal,
            'is_approved' => $request->is_approved,
        ];

        if ($request->hasFile('thumbnail')) {
            $thumbFile = $request->file('thumbnail');
            $thumbDir = config('comics.thumb_dir');
            $thumbName = time() . '_' . $thumbFile->getClientOriginalName();
            $thumbFile->move($thumbDir, $thumbName);
            $data['thumbnail'] = $thumbName;
        }

        $comic->update($data);

        $comic->categories()->sync($request->category_ids ?? []);
        $comic->shelves()->sync($request->shelf_ids ?? []);

        return back()->with('success', 'Comic updated successfully.');
    }

    public function toggleVisibility(Comic $comic)
    {
        $comic->update(['is_hidden' => !$comic->is_hidden]);
        return back()->with('success', 'Visibility toggled.');
    }

    public function destroy(Comic $comic)
    {
        $comic->delete();
        return back()->with('success', 'Comic moved to trash.');
    }

    public function restore($id)
    {
        $comic = Comic::onlyTrashed()->findOrFail($id);
        $comic->restore();
        return back()->with('success', 'Comic restored.');
    }

    public function forceDelete($id)
    {
        $comic = Comic::onlyTrashed()->findOrFail($id);

        // Delete thumbnail
        if ($comic->thumbnail) {
            $thumbPath = config('comics.thumb_dir') . '/' . $comic->thumbnail;
            if (File::exists($thumbPath)) File::delete($thumbPath);
        }

        // Delete PDF
        $baseDir = rtrim(config('comics.base_dir'), '/');
        $fullPath = $baseDir . '/' . ltrim($comic->path, '/');
        if (File::exists($fullPath)) File::delete($fullPath);

        $comic->forceDelete();
        return back()->with('success', 'Comic permanently deleted.');
    }

    public function bulkTrash(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
        ]);

        Comic::whereIn('id', $request->ids)->delete();
        return back()->with('success', count($request->ids) . ' comics moved to trash.');
    }

    public function bulkRestore(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
        ]);

        Comic::onlyTrashed()->whereIn('id', $request->ids)->restore();
        return back()->with('success', count($request->ids) . ' comics restored.');
    }

    public function bulkForceDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
        ]);

        $comics = Comic::onlyTrashed()->whereIn('id', $request->ids)->get();
        $count = $comics->count();

        foreach ($comics as $comic) {
            // Delete thumbnail
            if ($comic->thumbnail) {
                $thumbPath = config('comics.thumb_dir') . '/' . $comic->thumbnail;
                if (File::exists($thumbPath)) File::delete($thumbPath);
            }
            // Delete PDF
            $baseDir = rtrim(config('comics.base_dir'), '/');
            $fullPath = $baseDir . '/' . ltrim($comic->path, '/');
            if (File::exists($fullPath)) File::delete($fullPath);

            $comic->forceDelete();
        }

        return back()->with('success', $count . ' comics permanently deleted.');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'comic' => 'required|file|mimes:pdf|max:102400', // 100MB limit
            'is_personal' => 'nullable|boolean',
            'thumbnail' => 'nullable|image|max:2048',
            'shelf_ids' => 'nullable|array',
            'shelf_ids.*' => 'exists:shelves,id',
        ]);

        $file = $request->file('comic');
        $filename = $file->getClientOriginalName();
        $baseDir = config('comics.base_dir');

        // Save to baseDir
        $path = $file->move($baseDir, $filename);
        $relativePath = str_replace($baseDir . '/', '', $path->getRealPath());

        /** @var \App\Models\User $currentUser */
        $currentUser = Auth::user();
        $data = [
            'title' => pathinfo($filename, PATHINFO_FILENAME),
            'filename' => $filename,
            'path' => $relativePath,
            'user_id' => Auth::id(),
            'is_personal' => $request->boolean('is_personal'),
            'is_approved' => $currentUser->hasRole('admin') || $request->boolean('is_personal'),
        ];

        if ($request->hasFile('thumbnail')) {
            $thumbFile = $request->file('thumbnail');
            $thumbDir = config('comics.thumb_dir');
            $thumbName = time() . '_' . $thumbFile->getClientOriginalName();
            $thumbFile->move($thumbDir, $thumbName);
            $data['thumbnail'] = $thumbName;
        }

        $comic = Comic::create($data);

        if ($request->has('shelf_ids')) {
            $comic->shelves()->sync($request->shelf_ids);
        }

        // Generate thumbnail if not provided
        $thumbnailStatus = '';
        if (!$request->hasFile('thumbnail')) {
            if ($comic->generateThumbnail()) {
                $thumbnailStatus = ' and thumbnail generated';
            } else {
                $thumbnailStatus = ' (thumbnail generation failed)';
            }
        }

        if (\App\Models\Setting::get('ai_enabled') == '1' && $request->boolean('generate_ai')) {
            \App\Jobs\ProcessComicAIJob::dispatch($comic, Auth::id());
            $thumbnailStatus .= '. AI auto-tagging process started in the background.';
        }

        return back()->with('success', 'Comic uploaded successfully' . $thumbnailStatus);
    }

    public function regenerateThumbnail(Comic $comic)
    {
        if ($comic->generateThumbnail()) {
            return back()->with('success', 'Thumbnail regenerated successfully.');
        }

        return back()->with('error', 'Failed to generate thumbnail. Check server logs or if pdftoppm is installed.');
    }

    public function sync()
    {
        if (\App\Models\Setting::get('sync_status') === 'running') {
            return back()->with('error', 'Sync is already in progress.');
        }

        \App\Models\Setting::set('sync_status', 'running');
        \App\Models\Setting::set('sync_progress', 'Queued for background processing...');

        \App\Jobs\SyncComicsJob::dispatch();
        return back()->with('success', 'Sync started in the background.');
    }

    public function getSyncStatus()
    {
        return response()->json([
            'status' => \App\Models\Setting::get('sync_status', 'idle'),
            'progress' => \App\Models\Setting::get('sync_progress', ''),
            'error' => \App\Models\Setting::get('sync_error'),
            'last_sync_at' => \App\Models\Setting::get('last_sync_at'),
        ]);
    }

    public function shareWith(Request $request, Comic $comic)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $comic->sharedWith()->syncWithoutDetaching([$request->user_id]);
        return back()->with('success', 'Comic shared successfully.');
    }

    public function revokeShare(Comic $comic, User $user)
    {
        $comic->sharedWith()->detach($user->id);
        return back()->with('success', 'Access revoked.');
    }

    public function shareWithRole(Request $request, Comic $comic)
    {
        $request->validate(['role_id' => 'required|exists:roles,id']);
        $comic->sharedRoles()->syncWithoutDetaching([$request->role_id]);
        return back()->with('success', 'Comic shared with role successfully.');
    }

    public function revokeRoleShare(Comic $comic, $roleId)
    {
        $comic->sharedRoles()->detach($roleId);
        return back()->with('success', 'Role access revoked.');
    }

    public function approve(Comic $comic)
    {
        $comic->update(['is_approved' => true]);
        return back()->with('success', 'Comic approved.');
    }

    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
        ]);

        Comic::whereIn('id', $request->ids)->update(['is_approved' => true]);

        return back()->with('success', count($request->ids) . ' comics approved.');
    }

    public function approveAllPending()
    {
        $count = Comic::where('is_approved', false)->count();
        Comic::where('is_approved', false)->update(['is_approved' => true]);

        return back()->with('success', $count . ' pending comics approved.');
    }

    public function generateAiMeta(Comic $comic)
    {
        if (\App\Models\Setting::get('ai_enabled') != '1') {
            return back()->with('error', 'AI is disabled.');
        }

        \App\Jobs\ProcessComicAIJob::dispatch($comic, Auth::id());
        return back()->with('success', 'AI generation queued for ' . $comic->title);
    }

    public function autoTagAllPending()
    {
        if (\App\Models\Setting::get('ai_enabled') != '1') {
            return back()->with('error', 'AI is disabled.');
        }

        $comics = Comic::whereNull('ai_summary')->get();
        foreach ($comics as $comic) {
            \App\Jobs\ProcessComicAIJob::dispatch($comic, Auth::id());
        }

        return back()->with('success', count($comics) . ' comics queued for AI tagging.');
    }

    public function bulkGenerateAiMeta(Request $request)
    {
        if (\App\Models\Setting::get('ai_enabled') != '1') {
            return back()->with('error', 'AI features are not enabled in settings.');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
        ]);

        $comics = Comic::whereIn('id', $request->ids)->get();
        foreach ($comics as $comic) {
            \App\Jobs\ProcessComicAIJob::dispatch($comic, Auth::id());
        }

        return back()->with('success', count($comics) . ' comics queued for AI auto-tagging.');
    }

    public function syncReadingTime(Request $request, Comic $comic)
    {
        $request->validate([
            'page' => 'nullable|integer|min:1',
            'seconds' => 'required|integer|min:1',
            'total_pages' => 'nullable|integer|min:1',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $seconds = (int) $request->seconds;

        // 1. Update comic_user pivot (Total Time & Last Page)
        if (!$user->readComics()->where('comic_id', $comic->id)->exists()) {
            $user->readComics()->attach($comic->id);
        }

        $pivotData = [
            'total_seconds_spent' => \Illuminate\Support\Facades\DB::raw('total_seconds_spent + ' . $seconds),
            'updated_at' => now(),
        ];

        if ($request->filled('page')) {
            $pivotData['last_read_page'] = $request->page;
        }

        $user->readComics()->updateExistingPivot($comic->id, $pivotData);

        // 2. Update/Create Daily Log
        $today = now()->toDateString();
        $log = ReadingLog::firstOrCreate(
            ['user_id' => $user->id, 'comic_id' => $comic->id, 'date' => $today],
            ['seconds_spent' => 0]
        );
        $log->increment('seconds_spent', $seconds);

        // 3. Update total pages if not set
        if ($request->filled('total_pages') && is_null($comic->pages_count)) {
            $comic->update(['pages_count' => $request->total_pages]);
        }

        return response()->json(['success' => true]);
    }

    public function share($id)
    {
        try {
            $comicId = decrypt($id);
            $comic   = Comic::findOrFail($comicId);

            $baseDir = rtrim(config('comics.base_dir'), '/');
            $comicPath = urldecode(ltrim($comic->path, '/'));
            $path = $baseDir . '/' . $comicPath;

            if (!\Illuminate\Support\Facades\File::exists($path)) {
                abort(404);
            }

            return response()->file($path, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . str_replace('"', '\"', $comic->filename) . '"'
            ]);
        } catch (\Exception $e) {
            abort(404);
        }
    }

    public function bulkShelves(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
            'shelf_id' => 'required|exists:shelves,id',
            'action' => 'required|in:add,set'
        ]);

        $comics = Comic::whereIn('id', $request->ids)->get();
        $shelfId = $request->shelf_id;

        foreach ($comics as $comic) {
            if ($request->action === 'set') {
                $comic->shelves()->sync([$shelfId]);
            } else {
                $comic->shelves()->syncWithoutDetaching([$shelfId]);
            }
        }

        return back()->with('success', count($request->ids) . ' comics updated.');
    }

    public function rename(Request $request, Comic $comic)
    {
        $request->validate([
            'new_filename' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\\\/?%*:|"<>]+\.pdf$/i'
            ],
            'update_title' => 'boolean'
        ], [
            'new_filename.regex' => 'The filename must be a valid PDF name and contain no illegal characters.'
        ]);

        $newFilename = $request->new_filename;
        $baseDir = rtrim(config('comics.base_dir'), '/');
        $oldPath = $baseDir . '/' . ltrim($comic->path, '/');

        $pathParts = explode('/', ltrim($comic->path, '/'));
        array_pop($pathParts);
        $newRelativePath = (count($pathParts) > 0 ? implode('/', $pathParts) . '/' : '') . $newFilename;
        $newAbsolutePath = $baseDir . '/' . $newRelativePath;

        if (File::exists($newAbsolutePath)) {
            return back()->with('error', 'A file with this name already exists in this folder.');
        }

        if (!File::exists($oldPath)) {
            return back()->with('error', 'Original file not found on disk at ' . $oldPath);
        }

        try {
            // Rename file on disk
            File::move($oldPath, $newAbsolutePath);

            // Update thumbnail if it exists
            $oldThumb = $comic->thumbnail;
            $newThumb = $oldThumb;
            if ($oldThumb) {
                $thumbDir = rtrim(config('comics.thumb_dir'), '/');
                $oldThumbPath = $thumbDir . '/' . $oldThumb;

                $oldFilenameNoExt = pathinfo($comic->filename, PATHINFO_FILENAME);
                $newFilenameNoExt = pathinfo($newFilename, PATHINFO_FILENAME);

                // If thumbnail name contained the old filename, try to rename it
                if (str_contains($oldThumb, $oldFilenameNoExt)) {
                    $newThumb = str_replace($oldFilenameNoExt, $newFilenameNoExt, $oldThumb);
                    $newThumbPath = $thumbDir . '/' . $newThumb;

                    if (File::exists($oldThumbPath) && !File::exists($newThumbPath)) {
                        File::move($oldThumbPath, $newThumbPath);
                    }
                }
            }

            // Update database
            $comic->update([
                'filename' => $newFilename,
                'path' => $newRelativePath,
                'title' => $request->boolean('update_title') ? pathinfo($newFilename, PATHINFO_FILENAME) : $comic->title,
                'thumbnail' => $newThumb,
            ]);

            return back()->with('success', "File renamed to {$newFilename} successfully.");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to rename comic {$comic->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to rename file: ' . $e->getMessage());
        }
    }

    public function bulkToggleVisibility(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:comics,id',
        ]);

        $comics = Comic::whereIn('id', $request->ids)->get();
        foreach ($comics as $comic) {
            $comic->update(['is_hidden' => !$comic->is_hidden]);
        }

        return back()->with('success', count($request->ids) . ' comics visibility updated.');
    }
}
