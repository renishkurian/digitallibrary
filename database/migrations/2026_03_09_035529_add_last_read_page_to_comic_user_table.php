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
        Schema::table('comic_user', function (Blueprint $table) {
            $table->integer('last_read_page')->default(1)->after('comic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comic_user', function (Blueprint $table) {
            $table->dropColumn('last_read_page');
        });
    }
};
