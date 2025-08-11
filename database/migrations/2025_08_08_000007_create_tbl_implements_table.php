<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_implements', function (Blueprint $table) {
    $table->integer('implement_id')->autoIncrement();
    $table->integer('project_id')->nullable();
    $table->text('tarp')->nullable();
    $table->text('pdc')->nullable();
    $table->text('liquidation')->nullable();
    $table->foreign('project_id')->references('project_id')->on('tbl_projects')->onDelete('cascade')->onUpdate('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_implements');
    }
};
