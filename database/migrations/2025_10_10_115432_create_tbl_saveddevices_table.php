<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_saveddevices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('device_mac')->nullable(); // store MAC or device identifier
            $table->string('device_name')->nullable(); // optional, e.g. “Windows Laptop” or “iPhone”
            $table->string('device_fingerprint', 255)->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();

           $table->foreign('user_id')
                  ->references('user_id')
                  ->on('tbl_users')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_saveddevices');
    }
};
