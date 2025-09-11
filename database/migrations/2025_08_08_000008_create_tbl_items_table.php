<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_items', function (Blueprint $table) {
    $table->integer('item_id')->autoIncrement();
    $table->unsignedBigInteger('project_id')->nullable();
    $table->string('item_name', 50)->nullable();    
    $table->string('type', 10)->nullable();
    $table->text('specifications')->nullable();
    $table->integer('quantity')->nullable();
    $table->decimal('item_cost', 10, 2)->nullable();
    $table->unsignedBigInteger(column: 'added_by')->nullable();
    $table->string('report', 10)->nullable();
    $table->string('acknowledge', 3)->nullable();
    $table->string('remarks', 255)->nullable();
    $table->timestamp('created_at')->nullable();
    $table->timestamp('updated_at')->nullable();
    $table->foreign('project_id')->references('project_id')->on('tbl_projects')->onDelete('cascade');
    $table->foreign('added_by')->references('user_id')->on('tbl_users')->onDelete('set null');
});
}

    public function down(): void
    {
        Schema::dropIfExists('tbl_items');
    }
};
