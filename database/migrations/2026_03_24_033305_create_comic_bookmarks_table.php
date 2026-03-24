<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comic_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('comic_id')->constrained()->onDelete('cascade');
            $table->integer('page_number');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'comic_id', 'page_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comic_bookmarks');
    }
};
