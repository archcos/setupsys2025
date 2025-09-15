<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OfficeModel;
use App\Models\UserModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
public function index()
{
    // 🔄 Clear any existing session data
    session()->invalidate();

    // 🆕 Generate a fresh session and CSRF token
    session()->regenerateToken();

    $offices = OfficeModel::all();

    return inertia('Register', [
        'offices' => $offices
    ]);
}


public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'first_name'   => 'required|string|max:50',
        'middle_name'  => 'nullable|string|max:50',
        'last_name'    => 'required|string|max:50',
        'username'     => 'required|string|max:50|unique:tbl_users,username',
        'email'        => 'required|email|unique:tbl_users,email',
        'password'     => 'required|string|min:6',
        'office_id'    => 'required|exists:tbl_offices,office_id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }

    $user = UserModel::create([
        'first_name'   => $request->first_name,
        'middle_name'  => $request->middle_name,
        'last_name'    => $request->last_name,
        'username'     => $request->username,
        'email'        => $request->email,
        'password'     => Hash::make($request->password),
        'office_id'    => $request->office_id,
        'role'         => 'user',
        'status'       => 'active'
    ]);

    return response()->json([
        'message' => 'Registration successful',
    ], 201);
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
