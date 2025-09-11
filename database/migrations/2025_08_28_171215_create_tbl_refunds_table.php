<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbl_refunds', function (Blueprint $table) {
            $table->id('refund_id');
            
            $table->unsignedBigInteger('project_id')->nullable();
            $table->decimal('amount_due', 10, 2)->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->integer('check_num')->nullable();
            $table->integer('receipt_num')->nullable();
            $table->string('status', 45)->nullable();
            $table->date('month_paid')->nullable();
            
            $table->timestamps();

            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('set null');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_loans');
    }
};
