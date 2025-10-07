<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_users', function (Blueprint $table) {
            $table->id('user_id'); // unsigned BIGINT auto-increment
            $table->string('username', 50)->unique();
            $table->string('password', 255);
            $table->string('email', 100)->unique();
            $table->unsignedSmallInteger('office_id')->nullable(); // in tbl_companies
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('last_login')->nullable();
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50);
            $table->timestamp('updated_at')->nullable();
            $table->enum('role', ['user','staff','head','rpmo']);
            $table->enum('status', ['inactive','active']);
            $table->softDeletes(); // Adds deleted_at column
            $table->foreign('office_id')->references('office_id')->on('tbl_offices')->onDelete('cascade');
        });

        // Insert admin user
        DB::table('tbl_users')->insert([
            'username' => 'admin',
            'password' => Hash::make('admin123'),
            'email' => 'admin@example.com',
            'office_id' => 1, // change if needed
            'first_name' => 'Admin',
            'middle_name' => null,
            'last_name' => 'User',
            'role' => 'head',
            'status' => 'active',
            'created_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_users');
    }
};
