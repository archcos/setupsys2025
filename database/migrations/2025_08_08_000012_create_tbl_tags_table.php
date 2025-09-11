<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_tags', function (Blueprint $table) {
    $table->integer('tag_id')->autoIncrement();
    $table->integer('implement_id')->nullable();
    $table->string('tag_name', 45)->nullable();
    $table->decimal('tag_amount', 10, 2)->nullable();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
    $table->foreign('implement_id')->references('implement_id')->on('tbl_implements')->onDelete('set null')->onUpdate('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_tags');
    }
};
