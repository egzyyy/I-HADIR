<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff_employments', function (Blueprint $table) {
            $table->id('employment_id');
            $table->foreignId('staff_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreignId('school_session_id')->references('school_session_id')->on('school_sessions')->cascadeOnDelete();
            $table->string('staff_type');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_employments');
    }
};
