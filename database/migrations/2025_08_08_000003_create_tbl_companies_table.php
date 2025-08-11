<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_companies', function (Blueprint $table) {
    $table->integer('company_id')->autoIncrement();
    $table->string('company_name', 254)->nullable();
    $table->string('owner_name', 254)->nullable();
    $table->string('email', 150)->nullable();
    $table->integer('added_by')->nullable();
    $table->integer('office_id')->nullable();
    $table->string('street', 45)->nullable();
    $table->string('barangay', 45)->nullable();
    $table->string('municipality', 45)->nullable();
    $table->string('province', 45)->nullable();
    $table->string('district', 45)->nullable();
    $table->string('sex', 45)->nullable();
    $table->text('products')->nullable();
    $table->string('setup_industry', 150)->nullable();
    $table->string('industry_type', 45)->nullable();
    $table->integer('female')->nullable();
    $table->integer('male')->nullable();
    $table->integer('direct_male')->nullable();
    $table->integer('direct_female')->nullable();
    $table->string('contact_number', 45)->nullable();
    $table->foreign('added_by')->references('user_id')->on('tbl_users')->onDelete('set null');
    $table->foreign('office_id')->references('office_id')->on('tbl_offices')->onDelete('set null')->onUpdate('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_companies');
    }
};
