<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_projects', function (Blueprint $table) {
    $table->integer('project_id')->autoIncrement();
    $table->text('project_title')->nullable();
    $table->integer('company_id')->nullable();
    $table->string('phase_one', 45)->nullable();
    $table->string('phase_two', 45)->nullable();
    $table->string('project_cost', 45)->nullable();
    $table->date('created_at')->nullable();
    $table->dateTime('updated_at')->nullable();
    $table->integer('added_by')->nullable();
    $table->string('progress', 45)->nullable();
    $table->year('year_obligated')->nullable();
    $table->integer('revenue')->nullable();
    $table->integer('net_income')->nullable();
    $table->integer('current_asset')->nullable();
    $table->integer('noncurrent_asset')->nullable();
    $table->integer('equity')->nullable();
    $table->integer('liability')->nullable();
    $table->foreign('company_id')->references('company_id')->on('tbl_companies')->onDelete('cascade')->onUpdate('cascade');
    $table->foreign('added_by')->references('user_id')->on('tbl_users')->onDelete('set null');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_projects');
    }
};
