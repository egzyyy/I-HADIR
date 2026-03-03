<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_employments', function (Blueprint $table) {
            $table->id('staff_employment_id');
            $table->foreignId('staff_id')->references('staff_id')->on('staffs')->cascadeOnDelete();
            $table->foreignId('school_session_id')->references('school_session_id')->on('school_sessions')->cascadeOnDelete();
            
            $table->string('staff_type')->comment('e.g., Cleaner, Security, Admin');
            $table->timestamps();
            
            // A staff member can only have one primary role per session
            $table->unique(['staff_id', 'school_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_employments');
    }
};