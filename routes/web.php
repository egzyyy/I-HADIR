<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
| All frontend routing is handled by React Router.
| Laravel just serves the app.blade.php shell for any non-API route.
|
*/

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
