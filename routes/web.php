<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\UserController; // Add this import!

// Authentication Routes
Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy']);

// Registration Route
Route::post('/users/register', [RegistrationController::class, 'store'])->name('users.register');

// NEW: Data Fetching & Deletion Routes
Route::get('/api/users', [UserController::class, 'index']);
Route::delete('/api/users/{type}/{id}', [UserController::class, 'destroy']);


/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
| MUST remain at the very bottom!
*/
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');