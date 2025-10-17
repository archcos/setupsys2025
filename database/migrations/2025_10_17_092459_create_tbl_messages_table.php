<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_messages', function (Blueprint $table) {
            $table->id('message_id');

            // Project relation
            $table->unsignedBigInteger('project_id');
            $table->foreign('project_id')
                ->references('project_id')
                ->on('tbl_projects')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // User relation (who created the message)
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')
                ->references('user_id')
                ->on('tbl_users')
                ->onDelete('set null')
                ->onUpdate('cascade');

            // Message contents
            $table->string('subject', 255); // e.g. "internal_compliance approved"
            $table->text('message'); // remarks
            $table->string('status', 4); // remarks

            $table->timestamps();
        });
    }
    
};
