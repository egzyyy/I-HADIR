<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_attendees', function (Blueprint $table) {
            if (!Schema::hasColumn('event_attendees', 'purpose')) {
                $table->string('purpose')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('event_attendees', function (Blueprint $table) {
            $table->dropColumn('purpose');
        });
    }
};