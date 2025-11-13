<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_apply_restruct', function (Blueprint $table) {
            $table->id('apply_id');

            // Foreign key to tbl_projects
            $table->unsignedBigInteger('project_id')->nullable();
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('tbl_projects')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Added by (user who created the record)
            $table->unsignedBigInteger('added_by')->nullable();
            $table->foreign('added_by')
                  ->references('user_id')
                  ->on('tbl_users')
                  ->onDelete('set null');

            // Four text fields
            $table->text('proponent')->nullable();
            $table->text('psto')->nullable();
            $table->text('annexc')->nullable();
            $table->text('annexd')->nullable();

            // Optional timestamps
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_apply_restruct');
    }
};
