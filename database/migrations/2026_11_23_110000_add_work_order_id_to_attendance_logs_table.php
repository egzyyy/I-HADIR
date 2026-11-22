<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            // Set when the day was credited as present because of a submitted work order.
            $table->unsignedBigInteger('work_order_id')->nullable()->after('shift_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->dropIndex(['work_order_id']);
            $table->dropColumn('work_order_id');
        });
    }
};
