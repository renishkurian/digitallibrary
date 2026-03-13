<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comics', function (Blueprint $column) {
            $column->string('md5_hash')->nullable()->index()->after('path');
        });
    }

    public function down(): void
    {
        Schema::table('comics', function (Blueprint $column) {
            $column->dropColumn('md5_hash');
        });
    }
};
