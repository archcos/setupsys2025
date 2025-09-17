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
        Schema::create('tbl_objectives', function (Blueprint $table) {
            $table->id('objective_id');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->text('details')->nullable();
            $table->string('report', 9)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Foreign key reference
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('tbl_projects')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_objectives');
    }
};
