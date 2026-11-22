<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id('work_order_id');
            $table->unsignedBigInteger('school_id');
            $table->unsignedBigInteger('school_session_id')->nullable();
            $table->unsignedBigInteger('user_id');               // teacher who created it
            $table->text('description')->nullable();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->string('location')->nullable();
            $table->enum('category', ['individual', 'group'])->default('individual');
            $table->string('document_path')->nullable();
            $table->string('document_name')->nullable();
            $table->enum('status', ['draft', 'submitted'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'user_id']);
        });

        Schema::create('work_order_participants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('work_order_id');
            $table->enum('participant_type', ['teacher', 'student']);
            $table->unsignedBigInteger('participant_id');        // users.user_id or students.student_id
            $table->timestamps();

            $table->unique(['work_order_id', 'participant_type', 'participant_id'], 'wo_participant_unique');
            $table->foreign('work_order_id')->references('work_order_id')->on('work_orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_order_participants');
        Schema::dropIfExists('work_orders');
    }
};
