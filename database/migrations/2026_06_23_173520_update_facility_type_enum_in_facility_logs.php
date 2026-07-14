<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('facility_logs', function (Blueprint $table) {
            DB::statement("ALTER TABLE facility_logs MODIFY facility_type ENUM('prayer', 'pss', 'ict', 'rmt') NOT NULL");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facility_logs', function (Blueprint $table) {
            DB::statement("ALTER TABLE facility_logs MODIFY facility_type ENUM('prayer', 'pss', 'ict', 'activity') NOT NULL");
        });
    }
};
