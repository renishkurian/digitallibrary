<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('comics', function (Blueprint $table) {
            $table->string('author')->nullable()->after('title');
            $table->string('series')->nullable()->after('author');
            $table->decimal('series_index', 8, 2)->nullable()->after('series');
            $table->string('publisher')->nullable()->after('series_index');
            $table->text('description')->nullable()->after('publisher');
            $table->string('language', 10)->nullable()->after('description');
            $table->string('isbn', 20)->nullable()->after('language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comics', function (Blueprint $table) {
            $table->dropColumn(['author', 'series', 'series_index', 'publisher', 'description', 'language', 'isbn']);
        });
    }
};
