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
        }

        if (!$request->filled('status') || $request->status !== 'history') {
            $query->latest();
        }

        $comics = $query->paginate(30)
            ->withQueryString()
            ->through(function ($comic) {
                /** @var \App\Models\Comic $comic */
                return [
                    'id' => $comic->id,
                    'title' => $comic->title,
                    'thumbnail' => $comic->thumbnail,
                    'is_read' => Auth::check() ? $comic->isReadBy(Auth::user()) : false,
                    'is_hidden' => (bool) $comic->is_hidden,
                    'is_personal' => (bool) $comic->is_personal,
                    'user_id' => $comic->user_id,
                    'readers_count' => $comic->readers_count,
                    'share_url' => $comic->share_url,
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
            'filters' => $request->only(['q', 'status', 'shelf', 'category', 'personal', 'shared', 'hidden']),
            'shelves' => Shelf::visible(Auth::user())->orderBy('sort_order')->get(),
            'categories' => Category::visible(Auth::user())->whereNull('parent_id')->with('children')->orderBy('sort_order')->get(),
        ]);
    }

    public function show(Comic $comic)
    {
        if ($comic->is_hidden && (!Auth::check() || !Auth::user()->is_admin)) {
            abort(403);
        }

        $comic->loadCount('readers');

        $lastReadPage = 1;
        if (Auth::check()) {
            $reader = $comic->readers()->where('user_id', Auth::id())->first();
            if ($reader) {
                $lastReadPage = $reader->pivot->last_read_page ?? 1;
            }
        }

        return Inertia::render('Comics/Show', [
            'comic' => $comic,
            'last_read_page' => $lastReadPage,
        ]);
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
                // If it's a personal PDF, ONLY the uploader/admin can see it
                // is_personal takes precedence over sharing in terms of policy? 
                // Actually, if it's personal, uploader probably doesn't want to share it, but shared users could see it if uploader explicitly shared it.
                abort(403);
            }
        }

        $baseDir = rtrim(config('comics.base_dir'), '/');
        // Decode the path in case it contains URL-encoded characters like %20 for spaces
        $comicPath = urldecode(ltrim($comic->path, '/'));

        $path = $baseDir . '/' . $comicPath;

        if (!File::exists($path)) {
            return response()->json([
                'error' => 'File not found',
                'attempted_path' => $path,
                'base_dir' => $baseDir,
                'comic_path' => $comicPath
            ], 404);
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
        $query = Comic::with('shelf', 'categories', 'sharedWith', 'uploader')->withCount('readers')->latest();

        // Approval filter
        if ($request->get('approval') === 'pending') {
            $query->where('is_approved', false)->where('is_personal', false);
        }

        // Visibility filter
        $visibility = $request->get('visibility', 'all');
        if ($visibility === 'public') {
            $query->where('is_hidden', false);
        } elseif ($visibility === 'hidden') {
            $query->where('is_hidden', true);
        }

        $comics = $query->paginate(50)->withQueryString()->through(fn($comic) => [
            'id'            => $comic->id,
            'title'         => $comic->title,
            'path'          => $comic->path,
            'is_hidden'     => (bool) $comic->is_hidden,
            'is_personal'   => (bool) $comic->is_personal,
            'is_approved'   => (bool) $comic->is_approved,
            'user_id'       => $comic->user_id,
            'uploader'      => $comic->uploader ? ['name' => $comic->uploader->name] : null,
            'shelf_id'      => $comic->shelf_id,
            'shelf'         => $comic->shelf,
            'categories'    => $comic->categories,
            'readers_count' => $comic->readers_count,
            'shared_with'   => $comic->sharedWith->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email]),
            'shared_roles'  => $comic->sharedRoles->map(fn($r) => ['id' => $r->id, 'name' => $r->name]),
            'share_url'     => $comic->share_url,
        ]);

        return Inertia::render('Admin/Comics/Index', [
            'comics'     => $comics,
            'shelves'    => Shelf::orderBy('sort_order')->get(),
            'categories' => Category::orderBy('sort_order')->get(),
            'users'      => User::orderBy('name')->get(['id', 'name', 'email']),
            'roles'      => \Spatie\Permission\Models\Role::orderBy('name')->get(['id', 'name']),
            'filters'    => [
                'visibility' => $visibility,
                'approval' => $request->get('approval', 'all')
            ],
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
            'is_personal' => 'required|boolean',
            'is_approved' => 'required|boolean',
            'thumbnail' => 'nullable|image|max:2048',
        ]);

        $data = [
            'title' => $request->title,
            'shelf_id' => $request->shelf_id,
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
            'is_personal' => 'nullable|boolean',
            'thumbnail' => 'nullable|image|max:2048',
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

        // Generate thumbnail if not provided
        if (!$request->hasFile('thumbnail')) {
            if ($comic->generateThumbnail()) {
                return back()->with('success', 'Comic uploaded and thumbnail generated successfully.');
            }
            return back()->with('success', 'Comic uploaded successfully, but thumbnail generation failed.');
        }

        return back()->with('success', 'Comic uploaded successfully.');
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
        \Illuminate\Support\Facades\Artisan::call('app:sync-comics');
        return back()->with('success', 'Sync completed.');
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
}
