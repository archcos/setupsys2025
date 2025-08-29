<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_reports', function (Blueprint $table) {
            $table->id('report_id');
            
            $table->unsignedBigInteger('project_id')->nullable();
            $table->text('actual_accom')->nullable();
            $table->string('actual_remarks', 45)->nullable();
            $table->text('util_remarks')->nullable();
            $table->integer('new_male')->nullable();
            $table->integer('new_female')->nullable();
            $table->integer('new_ifmale')->nullable();
            $table->integer('new_iffemale')->nullable();
            $table->integer('new_ibmale')->nullable();
            $table->integer('new_ibfemale')->nullable();
            $table->text('problems')->nullable();
            $table->text('actions')->nullable();
            $table->text('promotional')->nullable();
            
            $table->timestamps(); // created_at & updated_at

            // Foreign key
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('tbl_projects')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_reports');
    }
};
