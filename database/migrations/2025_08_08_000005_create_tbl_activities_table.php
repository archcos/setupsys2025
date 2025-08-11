<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_activities', function (Blueprint $table) {
    $table->integer('activity_id')->autoIncrement();
    $table->integer('project_id')->nullable();
    $table->string('activity_name', 45)->nullable();
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();
    $table->foreign('project_id')->references('project_id')->on('tbl_projects')->onDelete('cascade')->onUpdate('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_activities');
    }
};
