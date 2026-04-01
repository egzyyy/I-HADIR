<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_time_settings', function (Blueprint $table) {
            // absent_threshold: after this time check-in = absent (e.g. 13:30 dismissal)
            // late_threshold remains: after check_in_deadline and before absent_threshold = late
            $table->time('absent_threshold')->nullable()->after('late_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_time_settings', function (Blueprint $table) {
            $table->dropColumn('absent_threshold');
        });
    }
};
