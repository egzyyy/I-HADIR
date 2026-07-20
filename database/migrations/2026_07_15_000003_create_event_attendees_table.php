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
        Schema::create('event_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->references('event_id')->on('events')->cascadeOnDelete();
            $table->enum('user_type', ['student', 'teacher', 'staff']);
            $table->string('user_id');
            $table->timestamp('check_in_time');
            $table->timestamps();
            $table->unique(['event_id', 'user_type', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_attendees');
    }
};
