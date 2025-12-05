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
            $table->decimal('project_cost', 11, 2);
            $table->string('amount_words', 255);

            // Add approved file columns here (without ->after())
            $table->string('approved_file_path')->nullable();
            $table->timestamp('approved_file_uploaded_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        
            // Foreign keys
            $table->foreign('project_id')
                    ->references('project_id')
                    ->on('tbl_projects')
                    ->onDelete('cascade');
                    
            $table->foreign('approved_by')
                ->references('user_id')
                ->on('tbl_users')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_moa');
    }
};