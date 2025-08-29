<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_directors', function (Blueprint $table) {
            $table->integer('director_id')->autoIncrement();
            $table->string('first_name', 45)->nullable();
            $table->string('middle_name', 45)->nullable();
            $table->string('last_name', 45)->nullable();
            $table->string('email', 45)->nullable();
            $table->string('title', 45)->nullable();
            $table->string('honorific', 45)->nullable();
            $table->unsignedSmallInteger('office_id')->nullable(); // in tbl_companies
            $table->foreign('office_id')
                  ->references('office_id')
                  ->on('tbl_offices')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });

        // Insert initial data
        DB::table('tbl_directors')->insert([
            ['director_id' => 1, 'first_name' => 'Romela', 'middle_name' => 'Nisperos', 'last_name' => 'Ratilla', 'email' => 'ord@region10.dost.gov.ph', 'title' => 'Regional Director', 'honorific'=> 'Engr.', 'office_id' => 1],
            ['director_id' => 2, 'first_name' => 'Ritchie Mae', 'middle_name' => 'L.', 'last_name' => 'Guno', 'email' => null, 'title' => 'Provincial Director', 'honorific'=> '', 'office_id' => 2],
            ['director_id' => 3, 'first_name' => 'Joanne Katherine', 'middle_name' => 'I.', 'last_name' => 'Banaag', 'email' => null, 'title' => 'Provincial Director', 'honorific'=> '.', 'office_id' => 3],
            ['director_id' => 4, 'first_name' => 'Roy', 'middle_name' => 'C.', 'last_name' => 'Sagrado', 'email' => null, 'title' => 'Provincial Director', 'honorific'=> '.', 'office_id' => 4],
            ['director_id' => 5, 'first_name' => 'Juvelyn Louvena', 'middle_name' => 'B.', 'last_name' => 'Ruiz', 'email' => null, 'title' => 'Provincial Director', 'honorific'=> 'Engr.', 'office_id' => 5],
            ['director_id' => 6, 'first_name' => 'Eufresnie Ann', 'middle_name' => 'D.', 'last_name' => 'Simbajon', 'email' => null, 'title' => 'Provincial Director', 'honorific'=> 'Engr.', 'office_id' => 6],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_directors');
    }
};
