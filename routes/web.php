<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;

/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
| All frontend routing is handled by React Router.
| Laravel just serves the app.blade.php shell for any non-API route.
|
*/

Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy']);

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
