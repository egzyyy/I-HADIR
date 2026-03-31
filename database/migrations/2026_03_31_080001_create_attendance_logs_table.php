<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->unsignedBigInteger('school_session_id');
            $table->enum('user_type', ['student', 'teacher', 'staff']);
            $table->string('user_id');
            $table->date('date');
            $table->timestamp('check_in_time')->nullable();
            $table->timestamp('check_out_time')->nullable();
            $table->enum('status', ['present', 'late', 'absent'])->default('present');
            $table->string('scan_method')->default('qr');
            $table->string('scanned_by')->nullable();
            $table->timestamps();
            $table->unique(['user_type', 'user_id', 'date'], 'unique_daily_attendance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
