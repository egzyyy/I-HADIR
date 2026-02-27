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
        Schema::create('school_sessions', function (Blueprint $table) {
            // Custom Primary Key
            $table->id('school_session_id');
            
            // Foreign Key linking to schools table
            // constrained() automatically looks for the referenced table if following conventions, 
            // but since we have a custom ID, we define it explicitly.
            $table->foreignId('school_id')
                  ->references('school_id')
                  ->on('schools')
                  ->onDelete('cascade'); // If a school is deleted, its sessions are deleted too
            
            // Session Details
            $table->string('year')->comment('E.g., 2024 or 2024/2025');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(false)->comment('Only one session should be active at a time per school');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_sessions');
    }
};