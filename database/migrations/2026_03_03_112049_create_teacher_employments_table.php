<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_employments', function (Blueprint $table) {
            $table->id('teacher_employment_id');
            $table->foreignId('teacher_id')->references('teacher_id')->on('teachers')->cascadeOnDelete();
            $table->foreignId('school_session_id')->references('school_session_id')->on('school_sessions')->cascadeOnDelete();
            
            $table->string('position')->comment('e.g., Guru Biasa, PK HEM, Pengetua');
            $table->timestamps();
            
            // A teacher can only have one primary role per session
            $table->unique(['teacher_id', 'school_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_employments');
    }
};