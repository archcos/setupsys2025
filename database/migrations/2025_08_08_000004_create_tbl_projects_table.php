<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_projects', function (Blueprint $table) {
            $table->id('project_id');
            
            $table->text('project_title')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->decimal('project_cost', 10, 2)->nullable();

            $table->date('created_at')->nullable();
            $table->dateTime('updated_at')->nullable();

            $table->unsignedBigInteger('added_by')->nullable();
            $table->string('progress', 45)->nullable();
            $table->year('year_obligated')->nullable();

            $table->decimal('revenue', 10, 2)->nullable();
            $table->decimal('net_income', 10, 2)->nullable();
            $table->decimal('current_asset', 10, 2)->nullable();
            $table->decimal('noncurrent_asset', 10, 2)->nullable();
            $table->decimal('equity', 10, 2)->nullable();
            $table->decimal('liability', 10, 2)->nullable();

            $table->date('release_initial')->nullable();
            $table->date('release_end')->nullable();
            $table->date('refund_initial')->nullable();
            $table->date('refund_end')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->decimal('last_refund', 10, 2)->nullable();
    $table->foreign('company_id')->references('company_id')->on('tbl_companies')->onDelete('cascade')->onUpdate('cascade');
    $table->foreign('added_by')->references('user_id')->on('tbl_users')->onDelete('set null');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_projects');
    }
};
