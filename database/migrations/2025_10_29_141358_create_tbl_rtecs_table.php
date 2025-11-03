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
        Schema::create('tbl_rtecs', function (Blueprint $table) {
            $table->id('rtec_id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('progress', 50)->nullable(); 
            $table->dateTime('schedule')->nullable();
            $table->string('zoom_link', 500)->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('user_id')
                ->on('tbl_users')
                ->onDelete('set null');

            // Indexes
            $table->index('project_id');
            $table->index('user_id');
            $table->index('progress'); 
            $table->index('schedule');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_rtecs');
    }
};