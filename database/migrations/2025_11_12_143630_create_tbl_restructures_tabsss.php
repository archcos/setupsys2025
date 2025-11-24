<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_restructures', function (Blueprint $table) {
            $table->id('restruct_id');

            // Foreign key to tbl_projects
            $table->unsignedBigInteger('project_id')->nullable();
            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Foreign key to tbl_apply_restruct
            $table->unsignedBigInteger('apply_id')->nullable();
            $table->foreign('apply_id')
                ->references('apply_id')
                ->on('tbl_apply_restruct')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Added by (user who created it)
            $table->unsignedBigInteger('added_by')->nullable();
            $table->foreign('added_by')
                ->references('user_id')
                ->on('tbl_users')
                ->onDelete('set null');

            // Type of restructure (e.g. text description)
            $table->string('type', 50)->nullable(); 
            $table->enum('status', ['approved','raised','pending']);
            $table->text('remarks')->nullable();
            
            // Start and end dates (date type includes year, month, and day)
            $table->date('restruct_start')->nullable();
            $table->date('restruct_end')->nullable();
            $table->date('new_refund_end')->nullable();

            // Optional timestamps
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_restructures');
    }
};