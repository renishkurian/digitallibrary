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
        Schema::create('comic_shelf', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comic_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shelf_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Migrate existing data
        \Illuminate\Support\Facades\DB::table('comics')
            ->whereNotNull('shelf_id')
            ->orderBy('id')
            ->chunk(100, function ($comics) {
                $inserts = [];
                foreach ($comics as $comic) {
                    $inserts[] = [
                        'comic_id' => $comic->id,
                        'shelf_id' => $comic->shelf_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                \Illuminate\Support\Facades\DB::table('comic_shelf')->insert($inserts);
            });

        Schema::table('comics', function (Blueprint $table) {
            $table->dropForeign(['shelf_id']);
            $table->dropColumn('shelf_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comics', function (Blueprint $table) {
            $table->foreignId('shelf_id')->nullable()->after('is_hidden')->constrained()->onDelete('set null');
        });

        \Illuminate\Support\Facades\DB::table('comic_shelf')
            ->orderBy('id')
            ->chunk(100, function ($rows) {
                foreach ($rows as $row) {
                    \Illuminate\Support\Facades\DB::table('comics')
                        ->where('id', $row->comic_id)
                        ->update(['shelf_id' => $row->shelf_id]);
                }
            });

        Schema::dropIfExists('comic_shelf');
    }
};
