<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_products', function (Blueprint $table) {
            $table->id('product_id'); // Auto-increment primary key
            $table->unsignedBigInteger('report_id')->nullable();
            $table->string('product_name', 45)->nullable();
            $table->integer('volume')->nullable();
            $table->smallInteger('quarter')->nullable();
            $table->decimal('gross_sales', 10, 2)->nullable();

            // Foreign key to tbl_reports
            $table->foreign('report_id')
                  ->references('report_id')
                  ->on('tbl_reports')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_products');
    }
};
