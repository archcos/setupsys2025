<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTblRefundsTable extends Migration
{
    public function up()
    {
        Schema::create('tbl_refunds', function (Blueprint $table) {
            $table->id('refund_id'); // Primary key
            $table->string('project_code');
            $table->string('company_name');
            $table->string('refund_date'); // Stored as string, e.g. "Jan , 2025"
            $table->string('status');
            $table->timestamps(); // created_at, updated_at
        });
    }

    public function down()
    {
        Schema::dropIfExists('tbl_refunds');
    }
}
