<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\UserController; 
use App\Http\Controllers\ApdmController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\CoCurricularController;
use App\Http\Controllers\SportHouseController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\TimeSettingController;
use App\Http\Controllers\QrController;

// Authentication Routes
Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy']);
Route::post('/password/reset-by-code', [NewPasswordController::class, 'resetBySchoolCode']);

// Registration Route
Route::post('/users/register', [RegistrationController::class, 'store'])->name('users.register');
Route::post('/api/apdm/import', [ApdmController::class, 'import']);
Route::get('/api/users', [UserController::class, 'index']);
Route::delete('/api/users/{type}/{id}', [UserController::class, 'destroy']);
Route::put('/api/users/{id}', [UserController::class, 'update']);

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



// Class Management
Route::get('/api/classes', [ClassController::class, 'index']);
Route::get('/api/classes/teachers', [ClassController::class, 'getTeachers']);
Route::post('/api/classes', [ClassController::class, 'store']);
Route::put('/api/classes/{id}', [ClassController::class, 'update']);
Route::delete('/api/classes/{id}', [ClassController::class, 'destroy']);
Route::get('/api/classes/{id}/students', [ClassController::class, 'getStudents']);
Route::post('/api/classes/{id}/students', [ClassController::class, 'addStudent']);
Route::delete('/api/classes/{id}/students/{studentId}', [ClassController::class, 'removeStudent']);
Route::put('/api/classes/{id}/students/{studentId}/transfer', [ClassController::class, 'transferStudent']);

// Co-Curricular Management
Route::get('/api/co-curriculars', [CoCurricularController::class, 'index']);
Route::post('/api/co-curriculars', [CoCurricularController::class, 'store']);
Route::put('/api/co-curriculars/{id}', [CoCurricularController::class, 'update']);
Route::delete('/api/co-curriculars/{id}', [CoCurricularController::class, 'destroy']);

// Sport House Management
Route::get('/api/sport-houses', [SportHouseController::class, 'index']);
Route::post('/api/sport-houses', [SportHouseController::class, 'store']);
Route::put('/api/sport-houses/{id}', [SportHouseController::class, 'update']);
Route::delete('/api/sport-houses/{id}', [SportHouseController::class, 'destroy']);

// Event Management
Route::get('/api/events', [EventController::class, 'index']);
Route::post('/api/events', [EventController::class, 'store']);
Route::put('/api/events/{id}', [EventController::class, 'update']);
Route::delete('/api/events/{id}', [EventController::class, 'destroy']);

// Attendance
Route::post('/api/attendance/check-in', [AttendanceController::class, 'checkIn']);
Route::post('/api/attendance/check-out', [AttendanceController::class, 'checkOut']);
Route::post('/api/attendance/manual', [AttendanceController::class, 'manualEntry']);
Route::post('/api/attendance/manual-check-in', [AttendanceController::class, 'manualCheckIn']);
Route::post('/api/attendance/manual-check-out/{id}', [AttendanceController::class, 'manualCheckOut']);
Route::get('/api/attendance/log', [AttendanceController::class, 'getLog']);
Route::get('/api/attendance/dashboard', [AttendanceController::class, 'getDashboard']);

// Time Settings
Route::get('/api/time-settings', [TimeSettingController::class, 'index']);
Route::post('/api/time-settings', [TimeSettingController::class, 'store']);
Route::put('/api/time-settings/{id}', [TimeSettingController::class, 'update']);
Route::delete('/api/time-settings/{id}', [TimeSettingController::class, 'destroy']);

// QR Code
Route::get('/api/qr/{userType}/{userId}', [QrController::class, 'generate']);
Route::post('/api/qr/resolve', [QrController::class, 'resolve']);

// Facility Check-In
Route::post('/api/facility/check-in', [FacilityController::class, 'checkIn']);
Route::post('/api/facility/check-out', [FacilityController::class, 'checkOut']);
Route::get('/api/facility/log', [FacilityController::class, 'getLog']);

// Visitor Endpoints
Route::get('/api/visitors', [VisitorController::class, 'index']);
Route::post('/api/visitors', [VisitorController::class, 'store']);
Route::get('/api/visitors/all', [VisitorController::class, 'getAllVisitors']); // ADD THIS LINE
Route::put('/api/visitors/{id}/checkout', [VisitorController::class, 'checkout']);


/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
| MUST remain at the very bottom!
*/
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');