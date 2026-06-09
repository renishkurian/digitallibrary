<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comic_playlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('comic_playlist_comic', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comic_playlist_id')->constrained('comic_playlists')->cascadeOnDelete();
            $table->foreignId('comic_id')->constrained('comics')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['comic_playlist_id', 'comic_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comic_playlist_comic');
        Schema::dropIfExists('comic_playlists');
    }
};
