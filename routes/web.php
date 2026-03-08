<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ComicController;
use App\Http\Controllers\ShelfController;
use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/', [ComicController::class, 'index'])->name('comics.index');
Route::get('/comics/{comic}', [ComicController::class, 'show'])->name('comics.show');
Route::get('/comics/{comic}/serve', [ComicController::class, 'serve'])->name('comics.serve');

Route::get('/shelves', [ShelfController::class, 'index'])->name('shelves.index');
Route::get('/shelves/{shelf}', [ShelfController::class, 'show'])->name('shelves.show');
Route::get('/categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/comics/{comic}/read', [ComicController::class, 'toggleRead'])->name('comics.toggle-read');

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/comics', [ComicController::class, 'adminIndex'])->name('comics.index');
        Route::post('/comics/{comic}/update', [ComicController::class, 'update'])->name('comics.update');
        Route::post('/comics/{comic}/visibility', [ComicController::class, 'toggleVisibility'])->name('comics.toggle-visibility');
        Route::post('/comics/upload', [ComicController::class, 'upload'])->name('comics.upload');
        Route::post('/comics/sync', [ComicController::class, 'sync'])->name('comics.sync');

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
    });
});

require __DIR__ . '/auth.php';
