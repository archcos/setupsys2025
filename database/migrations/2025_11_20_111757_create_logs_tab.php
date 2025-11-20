<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logs', function (Blueprint $table) {
            $table->id();

            // User who performed the action
            $table->unsignedBigInteger('user_id')->nullable();

            // Action name: Created, Updated, Deleted, Login, etc.
            $table->string('action');

            // Human-readable description
            $table->string('description')->nullable();

            // Model being affected
            $table->string('model_type')->nullable();   // e.g. App\Models\ProjectModel
            $table->unsignedBigInteger('model_id')->nullable();

            // Before and after values
            $table->json('before')->nullable();
            $table->json('after')->nullable();

            // Additional metadata
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['model_type', 'model_id']);

            // Correct foreign key for your UserModel
            $table->foreign('user_id')
                ->references('user_id')
                ->on('tbl_users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};
