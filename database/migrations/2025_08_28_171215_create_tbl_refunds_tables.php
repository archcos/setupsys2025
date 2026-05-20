<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tbl_refunds', function (Blueprint $table) {
            $table->id('refund_id');

            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->decimal('amount_due', 10, 2)->nullable();
            $table->json('payments')->nullable();

            $table->enum('status', [
                'paid',
                'unpaid',
                'restructured',
                'partial',
            ])->default('unpaid');

            $table->date('month_paid')->nullable();

            $table->timestamps();

            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('set null');

            $table->foreign('updated_by')
                ->references('user_id')
                ->on('tbl_users')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_refunds');
    }
};
