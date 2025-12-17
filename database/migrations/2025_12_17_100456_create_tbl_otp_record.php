<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_otp_records', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('code'); // HMAC-SHA256 hash
            $table->timestamp('expires_at')->nullable()->index();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('used_at')->nullable();
            $table->ipAddress('used_ip')->nullable();
            $table->unsignedTinyInteger('resend_count')->default(1);
            $table->timestamps();
            $table->unique(['email', 'used_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_otp_records');
    }
};