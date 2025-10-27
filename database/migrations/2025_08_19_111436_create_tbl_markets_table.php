<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_markets', function (Blueprint $table) {
            $table->id('market_id');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('report_id')->nullable();
            $table->string('place_name', 100)->nullable();
            $table->string('effective_date', 45)->nullable();
            $table->enum('type', ['new', 'existing'])->default('new');

            $table->foreign('project_id')
                ->references('project_id')->on('tbl_projects')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('report_id')
                ->references('report_id')->on('tbl_reports')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_markets');
    }
};
