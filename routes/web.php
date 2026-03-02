<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\UserController; 
use App\Http\Controllers\ApdmController;
use App\Http\Controllers\SchoolController;

// Authentication Routes
Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy']);

// Registration Route
Route::post('/users/register', [RegistrationController::class, 'store'])->name('users.register');
Route::post('/api/apdm/import', [ApdmController::class, 'import']);
Route::get('/api/users', [UserController::class, 'index']);
Route::delete('/api/users/{type}/{id}', [UserController::class, 'destroy']);

// Admin Profile Management
Route::get('/api/admin/profile', [UserController::class, 'getAdminProfile']);
Route::post('/api/admin/profile', [UserController::class, 'updateAdminProfile']);
Route::post('/api/admin/password', [UserController::class, 'updatePassword']);

// School Sessions Management
Route::get('/api/sessions', [SchoolController::class, 'getSessions']);
Route::post('/api/sessions', [SchoolController::class, 'storeSession']);
Route::get('/api/sessions/active', [SchoolController::class, 'getActiveSession']);
Route::put('/api/sessions/{id}', [SchoolController::class, 'updateSession']);
Route::delete('/api/sessions/{id}', [SchoolController::class, 'destroySession']);


/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
| MUST remain at the very bottom!
*/
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');