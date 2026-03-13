<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comic;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use App\Services\LoggingService;

class DuplicateController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('q');

        // 1. Base query for hashes with duplicates
        $hashQuery = Comic::whereNotNull('md5_hash')
            ->select('md5_hash')
            ->groupBy('md5_hash')
            ->havingRaw('COUNT(*) > 1');

        // 2. Filter hashes by search if provided
        // We only want to show duplicate groups where at least ONE item matches the search
        if ($search) {
            $hashQuery->whereIn('md5_hash', function ($query) use ($search) {
                $query->select('md5_hash')
                    ->from('comics')
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        // 3. Paginate the hashes (10 per page)
        $paginatedHashes = $hashQuery->paginate(10)->withQueryString();

        // 4. Get all comics for these specific hashes
        $hashesOnPage = $paginatedHashes->pluck('md5_hash');

        $comics = Comic::whereIn('md5_hash', $hashesOnPage)
            ->with(['shelf', 'categories'])
            ->orderBy('md5_hash')
            ->get()
            ->groupBy('md5_hash');

        // 5. Transform into the grouped structure
        $duplicates = $paginatedHashes->getCollection()->map(function ($h) use ($comics) {
            $hash = $h->md5_hash;
            $group = $comics->get($hash);

            if (!$group) return null;

            return [
                'hash' => $hash,
                'count' => $group->count(),
                'size' => $this->getFileSize($group->first()->path),
                'items' => $group->map(fn($comic) => [
                    'id' => $comic->id,
                    'title' => $comic->title,
                    'path' => $comic->path,
                    'filename' => $comic->filename,
                    'thumbnail' => $comic->thumbnail,
                    'is_approved' => $comic->is_approved,
                    'shelf' => $comic->shelf ? $comic->shelf->name : 'No Shelf',
                    'size' => $this->getFileSize($comic->path)
                ])
            ];
        })->filter()->values();

        return Inertia::render('Admin/Comics/Duplicates', [
            'paginatedData' => [
                'data' => $duplicates,
                'links' => $paginatedHashes->linkCollection()->toArray(),
                'meta' => [
                    'current_page' => $paginatedHashes->currentPage(),
                    'from' => $paginatedHashes->firstItem(),
                    'last_page' => $paginatedHashes->lastPage(),
                    'path' => $paginatedHashes->path(),
                    'per_page' => $paginatedHashes->perPage(),
                    'to' => $paginatedHashes->lastItem(),
                    'total' => $paginatedHashes->total(),
                ]
            ],
            'filters' => $request->only(['q'])
        ]);
    }

    public function destroy(Comic $comic)
    {
        $baseDir = config('comics.base_dir');
        $fullPath = $baseDir . '/' . ltrim($comic->path, '/');

        LoggingService::info("Attempting to delete duplicate file", [
            'id' => $comic->id,
            'path' => $comic->path,
            'fullPath' => $fullPath,
            'exists' => File::exists($fullPath)
        ]);

        // 1. Delete physical file
        if (File::exists($fullPath)) {
            $success = File::delete($fullPath);
            if (!$success) {
                LoggingService::error("Failed to delete physical file", ['path' => $fullPath]);
            } else {
                LoggingService::info("Physical file deleted successfully", ['path' => $fullPath]);
            }
        } else {
            LoggingService::warning("Physical file does not exist during deletion attempt", ['path' => $fullPath]);
        }

        // 2. Delete database record
        $comic->delete();

        return back()->with('success', 'Duplicate file deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'No files selected for deletion.');
        }

        $comics = Comic::whereIn('id', $ids)->get();
        $baseDir = config('comics.base_dir');
        $count = 0;

        foreach ($comics as $comic) {
            $fullPath = $baseDir . '/' . ltrim($comic->path, '/');

            LoggingService::info("Bulk deleting duplicate file", [
                'id' => $comic->id,
                'fullPath' => $fullPath,
                'exists' => File::exists($fullPath)
            ]);

            // Delete physical file
            if (File::exists($fullPath)) {
                $success = File::delete($fullPath);
                if (!$success) {
                    LoggingService::error("Failed to bulk delete physical file", ['path' => $fullPath]);
                }
            }

            // Delete database record
            $comic->delete();
            $count++;
        }

        return back()->with('success', "$count duplicate files deleted successfully.");
    }

    private function getFileSize($path)
    {
        $baseDir = config('comics.base_dir');
        $fullPath = $baseDir . '/' . ltrim($path, '/');

        if (File_exists($fullPath)) {
            $bytes = filesize($fullPath);
            $units = ['B', 'KB', 'MB', 'GB', 'TB'];

            for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
                $bytes /= 1024;
            }

            return round($bytes, 2) . ' ' . $units[$i];
        }

        return 'Unknown';
    }
}
