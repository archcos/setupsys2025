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
            $table->integer('project_cost')->nullable();

            $table->date('created_at')->nullable();
            $table->dateTime('updated_at')->nullable();

            $table->unsignedBigInteger('added_by')->nullable();
            $table->string('progress', 45)->nullable();
            $table->year('year_obligated')->nullable();

            $table->float('revenue')->nullable();
            $table->float('net_income')->nullable();
            $table->float('current_asset')->nullable();
            $table->float('noncurrent_asset')->nullable();
            $table->float('equity')->nullable();
            $table->float('liability')->nullable();

            $table->date('release_initial')->nullable();
            $table->date('release_end')->nullable();
            $table->date('refund_initial')->nullable();
            $table->date('refund_end')->nullable();
            $table->integer('refund_amount')->nullable();
    $table->foreign('company_id')->references('company_id')->on('tbl_companies')->onDelete('cascade')->onUpdate('cascade');
    $table->foreign('added_by')->references('user_id')->on('tbl_users')->onDelete('set null');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_projects');
    }
};
