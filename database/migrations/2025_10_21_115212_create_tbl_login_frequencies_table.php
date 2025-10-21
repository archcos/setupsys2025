<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_login_frequencies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')
                ->references('user_id')
                ->on('tbl_users')
                ->onDelete('set null')
                ->onUpdate('cascade');
            $table->unsignedSmallInteger('office_id')->nullable();
            $table->date('login_date');
            $table->unsignedInteger('login_count')->default(1);
            $table->timestamps();



            $table->foreign('office_id')
                ->references('office_id')
                ->on('tbl_offices')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_login_frequencies');
    }
};
