<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

Schema::create('tbl_refunds', function (Blueprint $table) {
    $table->bigIncrements('refund_id');
    $table->string('project_code', 255);
    $table->string('company_name', 255);
    $table->string('refund_date', 50);
    $table->string('status', 100);
    $table->timestamps();
});

    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_refunds');
    }
};
