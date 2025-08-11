<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_users', function (Blueprint $table) {
    $table->integer('user_id')->autoIncrement();
    $table->string('username', 50)->unique();
    $table->string('password', 255);
    $table->string('email', 100)->unique();
    $table->integer('office_id');
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('last_login')->nullable();
    $table->string('first_name', 50);
    $table->string('middle_name', 50)->nullable();
    $table->string('last_name', 50);
    $table->timestamp('updated_at')->nullable();
    $table->enum('role', ['user','staff','admin']);
    $table->enum('status', ['inactive','active']);
    $table->foreign('office_id')->references('office_id')->on('tbl_offices')->onDelete('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_users');
    }
};
