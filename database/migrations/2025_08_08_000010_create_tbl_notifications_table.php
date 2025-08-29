<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_notifications', function (Blueprint $table) {
    $table->integer('notification_id')->autoIncrement();
    $table->string('title', 255);
    $table->text('message');
    $table->unsignedSmallInteger('office_id')->nullable(); // in tbl_companies
    $table->boolean('is_read')->default(0);
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
    $table->unsignedBigInteger('company_id')->nullable();
    $table->foreign('office_id')->references('office_id')->on('tbl_offices')->onDelete('cascade');
    $table->foreign('company_id')->references('company_id')->on('tbl_companies')->onDelete('set null')->onUpdate('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_notifications');
    }
};
