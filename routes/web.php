<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ComicController;
use App\Http\Controllers\ShelfController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RolePermissionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/', [ComicController::class, 'index'])->name('comics.index');
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

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/comics', [ComicController::class, 'adminIndex'])->name('comics.index');
        Route::post('/comics/{comic}/update', [ComicController::class, 'update'])->name('comics.update');
        Route::post('/comics/{comic}/visibility', [ComicController::class, 'toggleVisibility'])->name('comics.toggle-visibility');
        Route::post('/comics/upload', [ComicController::class, 'upload'])->name('comics.upload');
        Route::post('/comics/{comic}/regenerate-thumbnail', [ComicController::class, 'regenerateThumbnail'])->name('comics.regenerate-thumbnail');
        Route::post('/comics/{comic}/approve', [ComicController::class, 'approve'])->name('comics.approve');
        Route::post('/comics/bulk-approve', [ComicController::class, 'bulkApprove'])->name('comics.bulk-approve');
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
    });
});

require __DIR__ . '/auth.php';
