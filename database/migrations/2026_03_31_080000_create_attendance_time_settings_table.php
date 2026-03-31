<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_time_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->string('title');
            $table->time('check_in_start');
            $table->time('check_in_deadline');
            $table->time('late_threshold');
            $table->time('check_out_time');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_time_settings');
    }
};
