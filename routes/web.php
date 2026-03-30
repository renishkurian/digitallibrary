<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ComicController;
use App\Http\Controllers\ShelfController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\Admin\DuplicateController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/', [ComicController::class, 'index'])->name('comics.index');
Route::get('/calendar', [ComicController::class, 'calendar'])->name('comics.calendar');
Route::get('/comics/{comic}', [ComicController::class, 'show'])->name('comics.show');
Route::get('/comics/{comic}/serve', [ComicController::class, 'serve'])->name('comics.serve');
Route::get('/s/{id}', [ComicController::class, 'share'])->name('comics.shared');

Route::get('/shelves', [ShelfController::class, 'index'])->name('shelves.index');
Route::get('/shelves/{shelf}', [ShelfController::class, 'show'])->name('shelves.show');
Route::get('/categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/reading-stats', [UserController::class, 'readingStats'])->name('reading-stats');

    Route::post('/comics/{comic}/read', [ComicController::class, 'toggleRead'])->name('comics.toggle-read');
    Route::post('/comics/{comic}/page', [ComicController::class, 'updateLastReadPage'])->name('comics.update-page');
    Route::post('/comics/{comic}/sync-time', [ComicController::class, 'syncReadingTime'])->name('comics.sync-time');
    Route::post('/comics/{comic}/shelves', [ComicController::class, 'addToPersonalShelf'])->name('comics.add-to-shelf');
    Route::post('/comics/{comic}/bookmarks', [ComicController::class, 'addBookmark'])->name('comics.add-bookmark');
    Route::delete('/comics/{comic}/bookmarks/{bookmark}', [ComicController::class, 'removeBookmark'])->name('comics.remove-bookmark');

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/comics', [ComicController::class, 'adminIndex'])->name('comics.index');
        Route::post('/comics/{comic}/update', [ComicController::class, 'update'])->name('comics.update');
        Route::post('/comics/{comic}/rename', [ComicController::class, 'rename'])->name('comics.rename');
        Route::post('/comics/{comic}/visibility', [ComicController::class, 'toggleVisibility'])->name('comics.toggle-visibility');
        Route::delete('/comics/{comic}', [ComicController::class, 'destroy'])->name('comics.destroy');
        Route::post('/comics/{id}/restore', [ComicController::class, 'restore'])->name('comics.restore');
        Route::delete('/comics/{id}/force-delete', [ComicController::class, 'forceDelete'])->name('comics.force-delete');
        Route::post('/comics/bulk-trash', [ComicController::class, 'bulkTrash'])->name('comics.bulk-trash');
        Route::post('/comics/bulk-restore', [ComicController::class, 'bulkRestore'])->name('comics.bulk-restore');
        Route::delete('/comics/bulk-force-delete', [ComicController::class, 'bulkForceDelete'])->name('comics.bulk-force-delete');
        Route::post('/comics/bulk-visibility', [ComicController::class, 'bulkToggleVisibility'])->name('comics.bulk-visibility');
        Route::post('/comics/{comic}/toggle-visibility', [ComicController::class, 'toggleVisibility'])->name('comics.toggle-visibility');
        Route::post('/comics/{comic}/fetch-calibre-meta', [ComicController::class, 'fetchCalibreMeta'])->name('comics.fetch-calibre-meta');
        Route::post('/comics/upload', [ComicController::class, 'upload'])->name('comics.upload');
        Route::post('/comics/{comic}/regenerate-thumbnail', [ComicController::class, 'regenerateThumbnail'])->name('comics.regenerate-thumbnail');
        Route::post('/comics/{comic}/approve', [ComicController::class, 'approve'])->name('comics.approve');
        Route::post('/comics/bulk-approve', [ComicController::class, 'bulkApprove'])->name('comics.bulk-approve');
        Route::post('/comics/bulk-shelves', [ComicController::class, 'bulkShelves'])->name('comics.bulk-shelves');
        Route::post('/comics/approve-all-pending', [ComicController::class, 'approveAllPending'])->name('comics.approve-all-pending');
        Route::get('/comics/sync-status', [ComicController::class, 'getSyncStatus'])->name('comics.sync-status');
        Route::post('/comics/auto-tag-all-pending', [ComicController::class, 'autoTagAllPending'])->name('comics.auto-tag-all-pending');
        Route::post('/comics/{comic}/generate-ai', [ComicController::class, 'generateAiMeta'])->name('comics.generate-ai');
        Route::post('/comics/bulk-generate-ai', [ComicController::class, 'bulkGenerateAiMeta'])->name('comics.bulk-generate-ai');
        Route::post('/comics/{comic}/share', [ComicController::class, 'shareWith'])->name('comics.share');
        Route::delete('/comics/{comic}/share/{user}', [ComicController::class, 'revokeShare'])->name('comics.revoke-share');
        Route::post('/comics/{comic}/share-role', [ComicController::class, 'shareWithRole'])->name('comics.share-role');
        Route::delete('/comics/{comic}/share-role/{role}', [ComicController::class, 'revokeRoleShare'])->name('comics.revoke-role-share');
        Route::post('/comics/sync', [ComicController::class, 'sync'])->name('comics.sync');

        // User Management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users/{user}/update', [UserController::class, 'update'])->name('users.update');
        Route::post('/users/{user}/role', [UserController::class, 'assignRole'])->name('users.role');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Shelf Management
        Route::get('/shelves', [ShelfController::class, 'adminIndex'])->name('shelves.index');
        Route::post('/shelves', [ShelfController::class, 'store'])->name('shelves.store');
        Route::post('/shelves/{shelf}', [ShelfController::class, 'update'])->name('shelves.update');
        Route::delete('/shelves/{shelf}', [ShelfController::class, 'destroy'])->name('shelves.destroy');

        // Category Management
        Route::get('/categories', [CategoryController::class, 'adminIndex'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::post('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
        Route::post('/categories/{category}/share-user', [CategoryController::class, 'shareWithUser'])->name('categories.share-user');
        Route::post('/categories/{category}/share-role', [CategoryController::class, 'shareWithRole'])->name('categories.share-role');
        Route::delete('/categories/{category}/share-user/{user}', [CategoryController::class, 'revokeUserShare'])->name('categories.revoke-user-share');
        Route::delete('/categories/{category}/share-role/{role}', [CategoryController::class, 'revokeRoleShare'])->name('categories.revoke-role-share');
        // Role Management
        Route::get('/roles', [RolePermissionController::class, 'index'])->name('roles.index');
        Route::post('/roles', [RolePermissionController::class, 'store'])->name('roles.store');
        Route::put('/roles/{role}', [RolePermissionController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [RolePermissionController::class, 'destroy'])->name('roles.destroy');

        // Settings Management
        Route::get('/settings', [App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [App\Http\Controllers\Admin\SettingController::class, 'update'])->name('settings.update');

        // AI Logs
        Route::get('/ai-logs', [App\Http\Controllers\Admin\AiLogController::class, 'index'])->name('ai-logs.index');

        // AI Playground
        Route::get('/ai-playground', [App\Http\Controllers\Admin\AiPlaygroundController::class, 'index'])->name('ai-playground.index');
        Route::post('/ai-playground/query', [App\Http\Controllers\Admin\AiPlaygroundController::class, 'query'])->name('ai-playground.query');

        // Duplicates
        Route::get('/duplicates', [DuplicateController::class, 'index'])->name('duplicates.index');
        Route::post('/duplicates/bulk-trash', [DuplicateController::class, 'bulkMoveToTrash'])->name('duplicates.bulk-trash');
        Route::delete('/duplicates/bulk-delete', [DuplicateController::class, 'bulkDestroy'])->name('duplicates.bulk-delete');
        Route::post('/duplicates/{comic}/trash', [DuplicateController::class, 'moveToTrash'])->name('duplicates.trash');
        Route::delete('/duplicates/{comic}', [DuplicateController::class, 'destroy'])->name('duplicates.destroy');

        // Logs
        Route::get('/logs', [App\Http\Controllers\Admin\LogController::class, 'index'])->name('logs.index');
    });
});

require __DIR__ . '/auth.php';
