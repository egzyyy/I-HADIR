<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id('event_id');
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->foreignId('school_session_id')->references('school_session_id')->on('school_sessions')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->time('event_time')->nullable();
            $table->string('location')->nullable();
            $table->string('banner_path')->nullable();
            $table->json('participant_types');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
