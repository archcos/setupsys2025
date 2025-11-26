<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_implements', function (Blueprint $table) {
            $table->id('implement_id');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->text('tarp')->nullable();
            $table->timestamp('tarp_upload')->nullable();
            $table->unsignedBigInteger('tarp_by')->nullable();
            $table->text('pdc')->nullable();
            $table->timestamp('pdc_upload')->nullable();
            $table->unsignedBigInteger('pdc_by')->nullable();
            $table->text('liquidation')->nullable();
            $table->timestamp('liquidation_upload')->nullable();
            $table->unsignedBigInteger('liquidation_by')->nullable();

            // Foreign keys to tbl_users
            $table->foreign('tarp_by')->references('user_id')->on('tbl_users')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('pdc_by')->references('user_id')->on('tbl_users')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('liquidation_by')->references('user_id')->on('tbl_users')->onDelete('set null')->onUpdate('cascade');
            
            // Foreign key to tbl_projects
            $table->foreign('project_id')->references('project_id')->on('tbl_projects')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_implements');
    }
};