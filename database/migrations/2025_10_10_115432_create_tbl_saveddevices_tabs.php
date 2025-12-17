<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tbl_saveddevices')) {
            Schema::create('tbl_saveddevices', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('device_name', 255)->nullable();
                $table->string('device_fingerprint', 64)->index();
                $table->string('device_fingerprint_relaxed', 64)->nullable()->index();
                $table->string('components_hash', 64)->nullable();
                $table->ipAddress('last_ip')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('trust_expires_at')->nullable();
                $table->boolean('is_trusted')->default(true);
                $table->integer('fingerprint_version')->default(1);
                $table->timestamps();
                
                $table->foreign('user_id')
                    ->references('user_id')
                    ->on('tbl_users')
                    ->onDelete('cascade');
                
                $table->index(['user_id', 'device_fingerprint']);
                $table->index(['user_id', 'is_trusted']);
            });
        } 
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_saveddevices');
    }
};