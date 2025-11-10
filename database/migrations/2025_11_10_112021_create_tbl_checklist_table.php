<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_checklist', function (Blueprint $table) {
            $table->id('checklist_id');
            $table->unsignedBigInteger('project_id');

            // Four links, each with date and added_by
            for ($i = 1; $i <= 4; $i++) {
                $table->text("link_$i")->nullable();
                $table->dateTime("link_{$i}_date")->nullable();
                $table->string("link_{$i}_added_by")->nullable();
            }

            $table->timestamps();

            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_checklist');
    }
};
