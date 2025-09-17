<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class PageController extends Controller
{
    public function contact() {
        return Inertia::render('Contact');
    }

    public function about() {
        return Inertia::render('About');
    }

    public function help() {
        return Inertia::render('Help');
    }
}
