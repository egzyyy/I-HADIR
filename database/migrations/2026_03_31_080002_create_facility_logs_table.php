<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facility_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->enum('user_type', ['student', 'teacher', 'staff']);
            $table->string('user_id');
            $table->enum('facility_type', ['prayer', 'pss', 'ict', 'activity']);
            $table->date('date');
            $table->timestamp('check_in_time');
            $table->timestamp('check_out_time')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facility_logs');
    }
};
