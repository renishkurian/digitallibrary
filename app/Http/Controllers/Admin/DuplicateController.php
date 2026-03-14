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

        // 1. Delete physical file first
        $fullPath = config('comics.base_dir') . '/' . ltrim($comic->path, '/');
        $success = false;

        if (File::exists($fullPath)) {
            // Attempt to delete and capture error if it fails
            $success = @unlink($fullPath);
            if (!$success) {
                $error = error_get_last();
                $permissions = substr(sprintf('%o', fileperms($fullPath)), -4);
                $owner = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($fullPath))['name'] : fileowner($fullPath);

                LoggingService::error("Failed to delete physical file", [
                    'path' => $fullPath,
                    'error' => $error ? $error['message'] : 'Unknown error',
                    'permissions' => $permissions,
                    'owner' => $owner,
                    'is_writable' => is_writable($fullPath),
                    'dir_writable' => is_writable(dirname($fullPath))
                ]);
            } else {
                LoggingService::info("Physical file deleted successfully", ['path' => $fullPath]);
            }
        } else {
            LoggingService::warning("Physical file does not exist during deletion attempt", ['path' => $fullPath]);
            $success = true; // Treat as success for DB cleanup purposes if file is already gone
        }

        // 2. Only delete DB record if file deletion succeeded
        if ($success) {
            $comic->delete();
            return back()->with('success', 'Duplicate file deleted successfully.');
        }

        return back()->with('error', 'Failed to delete the physical file. The database record has been kept to prevent data loss. Please check system logs for permission details.');
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
        $failed = 0;

        foreach ($comics as $comic) {
            $fullPath = $baseDir . '/' . ltrim($comic->path, '/');
            $success = false;

            // Delete physical file
            if (File::exists($fullPath)) {
                $success = @unlink($fullPath);
                if (!$success) {
                    $error = error_get_last();
                    $permissions = substr(sprintf('%o', fileperms($fullPath)), -4);
                    $owner = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($fullPath))['name'] : fileowner($fullPath);

                    LoggingService::error("Failed to bulk delete physical file", [
                        'path' => $fullPath,
                        'error' => $error ? $error['message'] : 'Unknown error',
                        'permissions' => $permissions,
                        'owner' => $owner
                    ]);
                    $failed++;
                }
            } else {
                $success = true; // File already gone
            }

            // Only delete database record if physical file is gone
            if ($success) {
                $comic->delete();
                $count++;
            }
        }

        if ($failed > 0) {
            return back()->with('warning', "$count duplicates deleted. $failed files could not be deleted due to server permissions (see logs).");
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
