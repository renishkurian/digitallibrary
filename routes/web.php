<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

use App\Http\Controllers\ComicController;

Route::get('/', [ComicController::class, 'index'])->name('comics.index');
Route::get('/comics/{comic}', [ComicController::class, 'show'])->name('comics.show');
Route::get('/comics/{comic}/serve', [ComicController::class, 'serve'])->name('comics.serve');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/comics/{comic}/read', [ComicController::class, 'toggleRead'])->name('comics.toggle-read');

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/comics', [ComicController::class, 'adminIndex'])->name('comics.index');
        Route::post('/comics/{comic}/visibility', [ComicController::class, 'toggleVisibility'])->name('comics.toggle-visibility');
        Route::post('/comics/upload', [ComicController::class, 'upload'])->name('comics.upload');
        Route::post('/comics/sync', [ComicController::class, 'sync'])->name('comics.sync');
    });
});

require __DIR__ . '/auth.php';
