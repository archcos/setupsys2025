<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_announces', function (Blueprint $table) {
            $table->increments('announce_id'); // INT AUTO_INCREMENT PRIMARY KEY
            $table->unsignedSmallInteger('office_id'); // must match tbl_offices type
            $table->string('title', 45)->nullable();
            $table->text('details')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

            // Foreign Key
            $table->foreign('office_id', 'fk_announces_office')
                  ->references('office_id')
                  ->on('tbl_offices')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_announces', function (Blueprint $table) {
            $table->dropForeign('fk_announces_office');
        });

        Schema::dropIfExists('tbl_announces');
    }
};
