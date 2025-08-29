<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_offices', function (Blueprint $table) {
            $table->smallIncrements('office_id'); // in tbl_offices
            $table->string('office_name', 100)->unique();
        });

        // Insert initial data
        DB::table('tbl_offices')->insert([
            ['office_id' => 2, 'office_name' => 'Bukidnon'],
            ['office_id' => 3, 'office_name' => 'Camiguin'],
            ['office_id' => 4, 'office_name' => 'Lanao del Norte'],
            ['office_id' => 5, 'office_name' => 'Misamis Occidental'],
            ['office_id' => 6, 'office_name' => 'Misamis Oriental'],
            ['office_id' => 1, 'office_name' => 'Regional Office'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_offices');
    }
};
