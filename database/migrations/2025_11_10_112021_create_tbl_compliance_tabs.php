<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_compliance', function (Blueprint $table) {
            $table->id('compliance_id');
            $table->unsignedBigInteger('project_id');

            // Project Proposal Link
            $table->text('pp_link')->nullable();
            $table->dateTime('pp_link_date')->nullable();
            $table->string('pp_link_added_by')->nullable();

            // Financial Statement Link
            $table->text('fs_link')->nullable();
            $table->dateTime('fs_link_date')->nullable();
            $table->string('fs_link_added_by')->nullable();

            $table->enum('status', ['pending', 'recommended', 'approved'])->default('pending');

            $table->timestamps();

            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_compliance');
    }
};