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
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\QrController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\SchoolProfileController;
use App\Http\Controllers\BrandingController;
use App\Http\Controllers\ReportController;

// Public landing-page endpoints (no auth — consumed by logged-out visitors)
Route::get('/api/public/schools', [PublicController::class, 'schools']);
Route::get('/api/public/schools/{slug}', [PublicController::class, 'show']);
Route::get('/api/public/schools/{slug}/events', [PublicController::class, 'events']);
// Does the kiosk scanner need a location fix before it may scan?
Route::get('/api/public/scan-policy', [PublicController::class, 'scanPolicy']);
Route::post('/api/public/verify-location', [PublicController::class, 'verifyLocation']);

// Branding — the login screen and both landing pages read this while logged out.
Route::get('/api/branding', [BrandingController::class, 'show']);

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

// Current authenticated user (drives role-based dashboard menu)
Route::get('/api/me', [UserController::class, 'me']);

// Profile Management (self-service, all roles)
Route::get('/api/profile', [UserController::class, 'getMyProfile']);
Route::post('/api/profile', [UserController::class, 'updateMyProfile']);
Route::post('/api/password', [UserController::class, 'updatePassword']);

// Landing Page Content (admin-managed public school profile)
Route::get('/api/school/landing-profile', [SchoolProfileController::class, 'show']);
Route::post('/api/school/landing-profile', [SchoolProfileController::class, 'update']);

// Logo management (admin). The Fakulti Komputeran logo is a static frontend
// asset and is intentionally not exposed here.
Route::post('/api/branding/school-logo', [BrandingController::class, 'uploadSchoolLogo']);
Route::delete('/api/branding/school-logo', [BrandingController::class, 'resetSchoolLogo']);
Route::post('/api/branding/system-logo', [BrandingController::class, 'uploadSystemLogo']);
Route::delete('/api/branding/system-logo', [BrandingController::class, 'resetSystemLogo']);

// Admin Dashboard summary (org-wide counts)
Route::get('/api/school/dashboard-summary', [SchoolController::class, 'dashboardSummary']);

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
Route::get('/api/co-curriculars/{id}/students', [CoCurricularController::class, 'getStudentsForEnrollment']);
Route::post('/api/co-curriculars/{id}/students', [CoCurricularController::class, 'syncStudents']);

// Sport House Management
Route::get('/api/sport-houses', [SportHouseController::class, 'index']);
Route::post('/api/sport-houses', [SportHouseController::class, 'store']);
Route::put('/api/sport-houses/{id}', [SportHouseController::class, 'update']);
Route::delete('/api/sport-houses/{id}', [SportHouseController::class, 'destroy']);
Route::get('/api/sport-houses/{id}/students', [SportHouseController::class, 'getStudentsForEnrollment']);
Route::post('/api/sport-houses/{id}/students', [SportHouseController::class, 'syncStudents']);

// Event Management
Route::get('/api/events', [EventController::class, 'index']);
Route::post('/api/events', [EventController::class, 'store']);
Route::get('/api/events/{id}', [EventController::class, 'show']);
Route::put('/api/events/{id}', [EventController::class, 'update']);
Route::delete('/api/events/{id}', [EventController::class, 'destroy']);
Route::post('/api/events/parent-check', [EventController::class, 'checkParentIc']);
Route::post('/api/events/{id}/scan', [EventController::class, 'scanAttendance']);
Route::post('/api/events/{id}/manual-registration', [EventController::class, 'manualRegistration']);
Route::post('/api/events/{id}/public-registration', [EventController::class, 'publicRegistration']);
Route::post('/api/events/{id}/public-parent-check', [EventController::class, 'publicCheckParentIc']);
Route::get('/api/events/{id}/unregistered', [EventController::class, 'getUnregisteredParticipants']);
Route::get('/api/events/{id}/attendees', [EventController::class, 'getAttendees']);

// Attendance
Route::post('/api/attendance/check-in', [AttendanceController::class, 'checkIn']);
Route::post('/api/attendance/check-out', [AttendanceController::class, 'checkOut']);
Route::post('/api/attendance/manual-check-in', [AttendanceController::class, 'manualCheckIn']);
Route::post('/api/attendance/manual-check-out/{id}', [AttendanceController::class, 'manualCheckOut']);
Route::get('/api/attendance/log', [AttendanceController::class, 'getLog']);
Route::get('/api/attendance/my-log', [AttendanceController::class, 'myLog']);
Route::get('/api/attendance/dashboard', [AttendanceController::class, 'getDashboard']);
Route::get('/api/attendance/teacher-dashboard', [AttendanceController::class, 'teacherDashboard']);

// Time Settings
Route::get('/api/time-settings', [TimeSettingController::class, 'index']);
Route::post('/api/time-settings', [TimeSettingController::class, 'store']);
Route::put('/api/time-settings/{id}', [TimeSettingController::class, 'update']);
Route::delete('/api/time-settings/{id}', [TimeSettingController::class, 'destroy']);

// Time Setting Overrides (calendar exceptions: holidays, special days)
Route::get('/api/time-settings/overrides', [TimeSettingController::class, 'getOverrides']);
Route::post('/api/time-settings/overrides', [TimeSettingController::class, 'storeOverride']);
Route::put('/api/time-settings/overrides/{id}', [TimeSettingController::class, 'updateOverride']);
Route::delete('/api/time-settings/overrides/{id}', [TimeSettingController::class, 'destroyOverride']);

// Security Shifts
Route::get('/api/shifts/active', [ShiftController::class, 'activeForCheckIn']);
Route::get('/api/shifts', [ShiftController::class, 'index']);
Route::post('/api/shifts', [ShiftController::class, 'store']);
Route::put('/api/shifts/{id}', [ShiftController::class, 'update']);
Route::delete('/api/shifts/{id}', [ShiftController::class, 'destroy']);

// QR Code
Route::get('/api/qr/me', [QrController::class, 'me']);
Route::get('/api/qr/{userType}/{userId}', [QrController::class, 'generate']);
Route::post('/api/qr/resolve', [QrController::class, 'resolve']);

// Facility Check-In
Route::post('/api/facility/check-in', [FacilityController::class, 'checkIn']);
Route::post('/api/facility/check-out', [FacilityController::class, 'checkOut']);
Route::get('/api/facility/log', [FacilityController::class, 'getLog']);

// Reports
Route::get('/api/reports/classes', [ReportController::class, 'getClasses']);
Route::get('/api/reports/attendance', [ReportController::class, 'attendanceReport']);
Route::get('/api/reports/monthly', [ReportController::class, 'monthlyReport']);
Route::get('/api/reports/summary', [ReportController::class, 'summaryReport']);
Route::get('/api/visitors', [VisitorController::class, 'index']);
Route::post('/api/visitors', [VisitorController::class, 'store']);
Route::get('/api/visitors/all', [VisitorController::class, 'getAllVisitors']);
Route::put('/api/visitors/{id}/checkout', [VisitorController::class, 'checkout']);

// Public IC-number lookup — throttled to slow brute-force enumeration of student ICs
Route::post('/api/reports/parent-student', [ReportController::class, 'parentStudentReport'])->middleware('throttle:10,1');
Route::get('/api/reports/facility', [ReportController::class, 'facilityReport']);
Route::get('/api/reports/visitors', [ReportController::class, 'visitorReport']);
Route::get('/api/reports/events', [ReportController::class, 'getEvents']); // To populate the dropdown
Route::get('/api/reports/event-attendance', [ReportController::class, 'eventReport']); // Placeholder

/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
| MUST remain at the very bottom!
*/
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');