<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_setting_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->references('school_id')->on('schools')->cascadeOnDelete();
            $table->date('date');
            // Nullable = school closed / public holiday (no attendance allowed)
            $table->foreignId('setting_id')->nullable()->references('id')->on('attendance_time_settings')->nullOnDelete();
            $table->string('note')->nullable(); // e.g. "Hari Raya Aidilfitri", "Hari Sukan"
            $table->timestamps();

            $table->unique(['school_id', 'date']); // one override per school per date
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_setting_overrides');
    }
};
