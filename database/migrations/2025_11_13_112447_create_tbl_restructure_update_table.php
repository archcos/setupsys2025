<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_restructure_update', function (Blueprint $table) {
            $table->id('update_id');

            // Foreign key to tbl_restructures
            $table->unsignedBigInteger('restruct_id')->nullable();
            $table->foreign('restruct_id')
                ->references('restruct_id')
                ->on('tbl_restructures')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Update details
            $table->date('update_start')->nullable();
            $table->date('update_end')->nullable();
            $table->decimal('update_amount', 10, 2)->nullable();

            // Standard timestamps
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_restructure_update');
    }
};
