<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_moa', function (Blueprint $table) {
            $table->unsignedInteger('moa_id', true); // UNSIGNED AUTO_INCREMENT
            $table->unsignedBigInteger('project_id');

            $table->string('owner_name', 255)->nullable();
            $table->string('owner_position', 255)->nullable();
            $table->string('pd_name', 255);
            $table->string('pd_title', 255);
            $table->string('witness', 255);
            $table->decimal('project_cost', 10, 2);
            $table->string('amount_words', 255);

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->dateTime('acknowledge_date')->nullable();

            // Foreign key
            $table->foreign('project_id')
                  ->references('project_id')
                  ->on('tbl_projects')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_moa');
    }
};
