<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_time_settings', function (Blueprint $table) {
            // e.g. [1,2,3,4,5] where 1=Monday ... 7=Sunday. Empty array = manual/override only.
            $table->json('applies_to_days')->nullable()->after('is_default');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_time_settings', function (Blueprint $table) {
            $table->dropColumn('applies_to_days');
        });
    }
};
