<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comic;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use App\Services\LoggingService;
use Jenssegers\ImageHash\Hash;

class DuplicateController extends Controller
{
    // Bits that can differ and still be considered the same visual content.
    // 8 = tolerant enough for compression differences, strict enough to avoid false positives.
    private const HASH_THRESHOLD = 8;

    public function index(Request $request)
    {
        $search = $request->input('q');

        // Fetch all comics that have a visual hash
        $query = Comic::whereNotNull('visual_hash')->with(['shelf', 'categories']);

        // Narrow the pool to comics matching the search before grouping
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title',    'like', "%{$search}%")
                    ->orWhere('path',     'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        $allComics = $query->get();

        // Group by perceptual similarity (hamming distance)
        $groups   = [];
        $assigned = [];

        foreach ($allComics as $comic) {
            if (isset($assigned[$comic->id])) continue;

            [$hex, $pages] = array_pad(explode(':', $comic->visual_hash, 2), 2, null);
            if (!$hex || !$pages) continue;

            $group = collect([$comic]);
            $assigned[$comic->id] = true;

            foreach ($allComics as $other) {
                if (isset($assigned[$other->id])) continue;

                [$otherHex, $otherPages] = array_pad(explode(':', $other->visual_hash, 2), 2, null);

                if ($otherPages !== $pages) continue;

                try {
                    $distance = Hash::fromHex($hex)->distance(Hash::fromHex($otherHex));
                    if ($distance <= self::HASH_THRESHOLD) {
                        $group->push($other);
                        $assigned[$other->id] = true;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            if ($group->count() > 1) {
                $groups[] = $group;
            }
        }

        // Paginate the groups manually
        $perPage     = 10;
        $currentPage = (int) $request->input('page', 1);
        $total       = count($groups);
        $slice       = array_slice($groups, ($currentPage - 1) * $perPage, $perPage);

        $duplicates = collect($slice)->map(function ($group) {
            // Suggest keeping the smallest file (compressed version)
            $suggestedKeepId = $group->sortBy(fn($c) => $this->getFileSizeBytes($c->path))->first()->id;

            return [
                'hash'              => $group->first()->visual_hash,
                'count'             => $group->count(),
                'suggested_keep_id' => $suggestedKeepId,
                'items'             => $group->map(fn($comic) => [
                    'id'          => $comic->id,
                    'title'       => $comic->title,
                    'path'        => $comic->path,
                    'filename'    => $comic->filename,
                    'thumbnail'   => $comic->thumbnail,
                    'is_approved' => $comic->is_approved,
                    'shelf'       => $comic->shelf?->name ?? 'No Shelf',
                    'size'        => $this->getFileSize($comic->path),
                    'size_bytes'  => $this->getFileSizeBytes($comic->path),
                ])->values(),
            ];
        })->values();

        // Build pagination links manually
        $lastPage = max(1, (int) ceil($total / $perPage));
        $links    = $this->buildPaginationLinks($currentPage, $lastPage, $request);

        return Inertia::render('Admin/Comics/Duplicates', [
            'paginatedData' => [
                'data'  => $duplicates,
                'links' => $links,
                'meta'  => [
                    'current_page' => $currentPage,
                    'from'         => $total > 0 ? ($currentPage - 1) * $perPage + 1 : null,
                    'last_page'    => $lastPage,
                    'path'         => $request->url(),
                    'per_page'     => $perPage,
                    'to'           => min($currentPage * $perPage, $total) ?: null,
                    'total'        => $total,
                ],
            ],
            'filters' => $request->only(['q']),
        ]);
    }

    public function destroy(Comic $comic)
    {
        $baseDir  = config('comics.base_dir');
        $fullPath = $baseDir . '/' . ltrim($comic->path, '/');

        LoggingService::info("Attempting to delete duplicate file", [
            'id'       => $comic->id,
            'path'     => $comic->path,
            'fullPath' => $fullPath,
            'exists'   => File::exists($fullPath),
        ]);

        $success = false;

        if (File::exists($fullPath)) {
            $success = @unlink($fullPath);
            if (!$success) {
                $error       = error_get_last();
                $permissions = substr(sprintf('%o', fileperms($fullPath)), -4);
                $owner       = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($fullPath))['name'] : fileowner($fullPath);

                LoggingService::error("Failed to delete physical file", [
                    'path'         => $fullPath,
                    'error'        => $error['message'] ?? 'Unknown error',
                    'permissions'  => $permissions,
                    'owner'        => $owner,
                    'is_writable'  => is_writable($fullPath),
                    'dir_writable' => is_writable(dirname($fullPath)),
                ]);
            } else {
                LoggingService::info("Physical file deleted successfully", ['path' => $fullPath]);
            }
        } else {
            LoggingService::warning("Physical file does not exist during deletion attempt", ['path' => $fullPath]);
            $success = true;
        }

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

        $comics  = Comic::whereIn('id', $ids)->get();
        $baseDir = config('comics.base_dir');
        $count   = 0;
        $failed  = 0;

        foreach ($comics as $comic) {
            $fullPath = $baseDir . '/' . ltrim($comic->path, '/');
            $success  = false;

            if (File::exists($fullPath)) {
                $success = @unlink($fullPath);
                if (!$success) {
                    $error       = error_get_last();
                    $permissions = substr(sprintf('%o', fileperms($fullPath)), -4);
                    $owner       = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($fullPath))['name'] : fileowner($fullPath);

                    LoggingService::error("Failed to bulk delete physical file", [
                        'path'        => $fullPath,
                        'error'       => $error['message'] ?? 'Unknown error',
                        'permissions' => $permissions,
                        'owner'       => $owner,
                    ]);
                    $failed++;
                }
            } else {
                $success = true;
            }

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

    private function buildPaginationLinks(int $currentPage, int $lastPage, Request $request): array
    {
        $links = [];

        $links[] = [
            'url'    => $currentPage > 1 ? $request->fullUrlWithQuery(['page' => $currentPage - 1]) : null,
            'label'  => '&laquo; Previous',
            'active' => false,
        ];

        for ($i = 1; $i <= $lastPage; $i++) {
            $links[] = [
                'url'    => $request->fullUrlWithQuery(['page' => $i]),
                'label'  => (string) $i,
                'active' => $i === $currentPage,
            ];
        }

        $links[] = [
            'url'    => $currentPage < $lastPage ? $request->fullUrlWithQuery(['page' => $currentPage + 1]) : null,
            'label'  => 'Next &raquo;',
            'active' => false,
        ];

        return $links;
    }

    private function getFileSizeBytes($path): int
    {
        $fullPath = config('comics.base_dir') . '/' . ltrim($path, '/');
        return file_exists($fullPath) ? (int) filesize($fullPath) : 0;
    }

    private function getFileSize($path): string
    {
        $bytes = $this->getFileSizeBytes($path);

        if ($bytes === 0) return 'Unknown';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
