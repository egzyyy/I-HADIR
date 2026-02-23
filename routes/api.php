<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. These are prefixed with /api.
|
| For now, auth is a simple stub (dev shortcut).
| Backend developers should replace with real Sanctum auth later.
|
*/

// DEV SHORTCUT: Login just returns success (no real auth)
Route::post('/login', function (Request $request) {
    return response()->json([
        'message' => 'Login successful',
        'user' => [
            'name' => 'Admin',
            'email' => 'admin@skpulauserai.edu.my',
            'role' => 'administrator',
        ],
    ]);
});

Route::post('/logout', function (Request $request) {
    return response()->json(['message' => 'Logged out']);
});

// Protected routes (add auth:sanctum middleware when ready)
Route::get('/user', function (Request $request) {
    return response()->json([
        'name' => 'Admin',
        'email' => 'admin@skpulauserai.edu.my',
        'role' => 'administrator',
    ]);
});
