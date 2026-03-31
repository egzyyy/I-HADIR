# I-HADIR — Claude Development Guide

## Project Overview

**I-HADIR** is a school attendance management system for Malaysian primary schools.
**Stack:** Laravel 12 (PHP 8.2+) + React 18 + Inertia.js + Vite + Tailwind CSS
**DB:** SQLite (file: `database/database.sqlite`)
**Auth:** IC Number + password (NOT email)
**Primary keys:** All core tables use custom PKs (e.g., `school_id`, `student_id`) — NOT auto-increment integers.

---

## Repository Layout

```
app/
  Http/Controllers/        — All controllers live here
  Models/                  — Eloquent models
database/
  migrations/              — Run: php artisan migrate
  seeders/DatabaseSeeder.php
resources/
  js/
    Pages/                 — React page components (TSX)
    Components/            — Reusable UI components
    Layouts/DashboardLayout.tsx
routes/
  web.php                  — ALL routes (both web + /api/* prefix routes)
  api.php                  — Only mock stubs, ignore
```

---

## Current Backend Status

### ✅ Fully Connected Pages (8 pages)

| Page | Routes Used |
|------|------------|
| `Auth/Login.tsx` | POST /login, POST /logout, POST /password/reset-by-code |
| `SchoolSession.tsx` | GET/POST/PUT/DELETE /api/sessions |
| `Users/UserRegistration.tsx` | POST /users/register |
| `Users/UserList.tsx` | GET /api/users, DELETE /api/users/{type}/{id}, PUT /api/users/{id} |
| `Users/Apdm.tsx` | POST /api/apdm/import |
| `Admin/AdminProfile.tsx` | GET/POST /api/admin/profile, POST /api/admin/password |
| `Visitor.tsx` (public) | GET/POST /api/visitors, PUT /api/visitors/{id}/checkout |
| `Users/VisitorList.tsx` | GET /api/visitors/all, PUT /api/visitors/{id}/checkout |

### ❌ Hardcoded / Not Connected Pages (All need backend)

| Page | What It Needs |
|------|--------------|
| `Dashboard.tsx` | Real attendance counts + today's attendance log |
| `Academic/Class.tsx` | CRUD classrooms + assign teacher + list enrolled students |
| `Academic/CoCurricular.tsx` | CRUD co_curriculars + member enrollment |
| `Academic/Sport.tsx` | CRUD sport_houses + member assignment |
| `Academic/Event.tsx` | CRUD events + participant tracking |
| `AttendanceLog/CheckIn.tsx` | QR camera scan → log attendance_logs (check_in) |
| `AttendanceLog/CheckOut.tsx` | QR camera scan → log attendance_logs (check_out) |
| `AttendanceLog/TimeSetting.tsx` | CRUD attendance_time_settings |
| `CheckIn/FacilityCheckIn.tsx` | QR scan → log facility_logs by type |
| `CheckIn/ManualEntry.tsx` | Admin manually marks attendance for date+class |
| `Reports/AttendanceReports.tsx` | Query attendance_logs with filters → chart data |
| `Reports/GeneralReport.tsx` | Query facility_logs with filters |
| `Reports/ParentsReport.tsx` | Per-student attendance summary |

---

## Existing Database Tables (Migrations Already Done)

| Table | Key Fields |
|-------|-----------|
| `schools` | school_id (PK), school_code, name |
| `users` | user_id (PK), school_id, ic_number, email, password, position |
| `school_sessions` | school_session_id (PK), school_id, year, start_date, end_date, is_active |
| `students` | student_id (PK), school_id, name, ic_number, gender, father_*, mother_*, emergency_* |
| `teachers` | teacher_id (PK), school_id, name, ic_number, gender, email |
| `staffs` | staff_id (PK), school_id, name, ic_number, gender, email |
| `classrooms` | classroom_id (PK), school_id, name, is_active |
| `enrollments` | enrollment_id (PK), student_id, school_session_id, classroom_id |
| `teacher_employments` | teacher_employment_id (PK), teacher_id, school_session_id, position |
| `staff_employments` | staff_employment_id (PK), staff_id, school_session_id, staff_type |
| `visitors` | visitor_id (PK), school_id, name, phone_number, category, purpose, status, check_out_time |

---

## New Migrations Required

Create these in order (run `php artisan migrate` after each batch):

### 1. `attendance_time_settings`
```php
Schema::create('attendance_time_settings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->string('title');                    // e.g. "Normal Class", "PKU"
    $table->time('check_in_start');             // earliest valid check-in time
    $table->time('check_in_deadline');          // on-time cutoff (e.g. 07:30)
    $table->time('late_threshold');             // after this = LATE (e.g. 08:00)
    $table->time('check_out_time');             // expected check-out (e.g. 13:30)
    $table->boolean('is_default')->default(false);
    $table->timestamps();
});
```

### 2. `attendance_logs`
```php
Schema::create('attendance_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->string('school_session_id');
    $table->enum('user_type', ['student', 'teacher', 'staff']);
    $table->string('user_id');                  // matches student_id/teacher_id/staff_id
    $table->date('date');
    $table->timestamp('check_in_time')->nullable();
    $table->timestamp('check_out_time')->nullable();
    $table->enum('status', ['present', 'late', 'absent'])->default('present');
    $table->string('scan_method')->default('qr'); // 'qr' or 'manual'
    $table->string('scanned_by')->nullable();    // admin user_id who did manual entry
    $table->timestamps();
    $table->unique(['user_type', 'user_id', 'date'], 'unique_daily_attendance');
});
```

### 3. `facility_logs`
```php
Schema::create('facility_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->enum('user_type', ['student', 'teacher', 'staff']);
    $table->string('user_id');
    $table->enum('facility_type', ['prayer', 'pss', 'ict', 'activity']);
    $table->date('date');
    $table->timestamp('check_in_time');
    $table->timestamp('check_out_time')->nullable();
    $table->timestamps();
});
```

### 4. `co_curriculars`
```php
Schema::create('co_curriculars', function (Blueprint $table) {
    $table->string('co_curricular_id')->primary();   // e.g. COC001
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->string('name');
    $table->enum('type', ['uniform', 'club', 'sport'])->default('club');
    $table->integer('capacity')->nullable();
    $table->string('teacher_id')->nullable();        // advisor teacher
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

### 5. `co_curricular_members`
```php
Schema::create('co_curricular_members', function (Blueprint $table) {
    $table->id();
    $table->string('co_curricular_id');
    $table->string('student_id');
    $table->string('school_session_id');
    $table->string('role')->default('member');      // 'president', 'secretary', 'member'
    $table->timestamps();
    $table->unique(['co_curricular_id', 'student_id', 'school_session_id']);
});
```

### 6. `sport_houses`
```php
Schema::create('sport_houses', function (Blueprint $table) {
    $table->string('sport_house_id')->primary();    // e.g. SPH001
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->string('name');
    $table->string('color')->nullable();
    $table->string('teacher_id')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

### 7. `sport_house_members`
```php
Schema::create('sport_house_members', function (Blueprint $table) {
    $table->id();
    $table->string('sport_house_id');
    $table->string('student_id');
    $table->string('school_session_id');
    $table->timestamps();
    $table->unique(['student_id', 'school_session_id']); // one house per student per year
});
```

### 8. `events`
```php
Schema::create('events', function (Blueprint $table) {
    $table->string('event_id')->primary();          // e.g. EVT001
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->string('school_session_id');
    $table->string('name');
    $table->text('description')->nullable();
    $table->date('event_date');
    $table->string('location')->nullable();
    $table->string('banner_path')->nullable();
    $table->json('participant_types');              // ["student","teacher","staff","parent"]
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

### 9. `event_attendees`
```php
Schema::create('event_attendees', function (Blueprint $table) {
    $table->id();
    $table->string('event_id');
    $table->enum('user_type', ['student', 'teacher', 'staff']);
    $table->string('user_id');
    $table->timestamp('check_in_time')->nullable();
    $table->timestamps();
    $table->unique(['event_id', 'user_type', 'user_id']);
});
```

---

## New Models Required

### Pattern to follow (CustomStringKey trait for string PKs):
```php
// In each model with a string PK:
protected $primaryKey = 'co_curricular_id';
public $incrementing = false;
protected $keyType = 'string';

// Auto-generate ID in boot():
protected static function boot() {
    parent::boot();
    static::creating(function ($model) {
        if (!$model->{$model->getKeyName()}) {
            $model->{$model->getKeyName()} = static::generateId();
        }
    });
}
```

Models needed:
- `AttendanceLog` — no string PK, uses auto-increment
- `AttendanceSetting` — no string PK
- `FacilityLog` — no string PK
- `CoCurricular` — string PK `co_curricular_id`
- `CoCurricularMember` — no string PK
- `SportHouse` — string PK `sport_house_id`
- `SportHouseMember` — no string PK
- `Event` — string PK `event_id`
- `EventAttendee` — no string PK

---

## New Controllers Required

### `ClassController`
- `index()` — GET /api/classes — list classrooms with teacher + student count for active session
- `store()` — POST /api/classes — create classroom + assign teacher employment
- `update()` — PUT /api/classes/{id} — edit class name / teacher
- `destroy()` — DELETE /api/classes/{id} — soft delete
- `getStudents()` — GET /api/classes/{id}/students — enrolled students with unenrolled available
- `addStudent()` — POST /api/classes/{id}/students — enroll student_id into classroom for active session
- `removeStudent()` — DELETE /api/classes/{id}/students/{studentId} — remove enrollment

### `CoCurricularController`
- `index()` — GET /api/co-curriculars — list all with member count
- `store()` — POST /api/co-curriculars
- `update()` — PUT /api/co-curriculars/{id}
- `destroy()` — DELETE /api/co-curriculars/{id}
- `getMembers()` — GET /api/co-curriculars/{id}/members
- `addMember()` — POST /api/co-curriculars/{id}/members
- `removeMember()` — DELETE /api/co-curriculars/{id}/members/{studentId}

### `SportHouseController`
- `index()` — GET /api/sport-houses
- `store()` — POST /api/sport-houses
- `update()` — PUT /api/sport-houses/{id}
- `destroy()` — DELETE /api/sport-houses/{id}
- `getMembers()` — GET /api/sport-houses/{id}/members
- `addMember()` — POST /api/sport-houses/{id}/members (also removes from old house if exists)
- `removeMember()` — DELETE /api/sport-houses/{id}/members/{studentId}

### `EventController`
- `index()` — GET /api/events — list all events for current session
- `store()` — POST /api/events — create with banner image upload
- `update()` — PUT /api/events/{id}
- `destroy()` — DELETE /api/events/{id}
- `scanAttendance()` — POST /api/events/{id}/scan — log event attendee via QR/IC

### `AttendanceController`
- `checkIn()` — POST /api/attendance/check-in — scan QR, resolve IC → log attendance_logs
- `checkOut()` — POST /api/attendance/check-out — scan QR, resolve IC → update check_out_time
- `manualEntry()` — POST /api/attendance/manual — admin marks attendance for date+class
- `getLog()` — GET /api/attendance/log — paginated attendance_logs with filters
- `getDashboard()` — GET /api/attendance/dashboard — today's stats for StatCards

### `FacilityController`
- `checkIn()` — POST /api/facility/check-in — scan QR by facility_type → log facility_logs
- `checkOut()` — POST /api/facility/check-out — update check_out_time
- `getLog()` — GET /api/facility/log?type={type}&date={date} — list logs

### `TimeSettingController`
- `index()` — GET /api/time-settings
- `store()` — POST /api/time-settings
- `update()` — PUT /api/time-settings/{id}
- `destroy()` — DELETE /api/time-settings/{id}

### `ReportController`
- `attendanceReport()` — GET /api/reports/attendance?date={}&class_id={}&user_type={}
- `generalReport()` — GET /api/reports/general?date={}&facility_type={}
- `parentsReport()` — GET /api/reports/parents?student_id={}&month={}
- `exportReport()` — GET /api/reports/export?type={} (returns CSV)

### `QrController`
- `generate()` — GET /api/qr/{user_type}/{user_id} — returns QR image (SVG/PNG)
- `resolve()` — POST /api/qr/resolve — POST {ic_number} → returns user info (used for validation before marking)

---

## QR Code Implementation

### Backend Package
Install via composer: `simplesoftwareio/simple-qrcode`
```
composer require simplesoftwareio/simple-qrcode
```
QR content format: JSON string `{"type":"student","ic":"xxxxxxxx"}`

### Frontend Camera Scanning
Install via npm: `html5-qrcode`
```
npm install html5-qrcode
```

Usage pattern for CheckIn.tsx and CheckOut.tsx:
```tsx
import { Html5Qrcode } from 'html5-qrcode';

// In useEffect, initialize scanner:
const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: { width: 250, height: 250 } },
  (decodedText) => {
    // decodedText = '{"type":"student","ic":"xxxxxxxxx"}'
    handleQrScanned(decodedText);
  },
  (error) => {}
);
```

---

## QR Scan → Attendance Flow

1. Camera scans QR → gets JSON `{type, ic}`
2. Frontend POSTs to `/api/attendance/check-in` with `{ic_number, type}`
3. Controller resolves IC → finds student/teacher/staff ID
4. Checks `attendance_logs` for today's record
5. If no record → create with `check_in_time = now()`, calculate `status` based on `attendance_time_settings`
6. Returns `{success, name, class, status, time}`
7. Frontend shows success flash with person's name + time

For **Check Out**: same flow but updates `check_out_time` on existing today's record.

---

## Attendance Status Logic

```php
$now = now();
$setting = AttendanceSetting::where('school_id', ...)->where('is_default', true)->first();

if ($now->toTimeString() <= $setting->check_in_deadline) {
    $status = 'present';
} elseif ($now->toTimeString() <= $setting->late_threshold) {
    $status = 'late';
} else {
    $status = 'absent'; // or don't allow check-in after late threshold
}
```

---

## Class Controller — Important Logic

The `classrooms` table already exists. The `enrollments` table links students to classrooms per session.
The Class page needs:
- Fetching classrooms with `teacher_employments` join to show the teacher name
- The "Add Class" form needs to also create a `teacher_employments` record linking the teacher to the class (teacher position = 'Homeroom Teacher' or similar)
- Student enrollment goes into `enrollments` table with `school_session_id`

**Important:** The `classrooms` table does NOT have a `teacher_id` column. Teacher-to-class assignment is done by convention: a teacher in `teacher_employments` with `position = 'Homeroom Teacher'` is treated as the classroom teacher. You may need to add a `classroom_id` column to `teacher_employments` OR add a `teacher_id` column directly to `classrooms`. **Recommended:** Add `teacher_id` to `classrooms` table via a new migration for simplicity.

---

## Routes to Add in `routes/web.php`

Add these BEFORE the SPA catch-all route:

```php
// Class Management
Route::get('/api/classes', [ClassController::class, 'index']);
Route::post('/api/classes', [ClassController::class, 'store']);
Route::put('/api/classes/{id}', [ClassController::class, 'update']);
Route::delete('/api/classes/{id}', [ClassController::class, 'destroy']);
Route::get('/api/classes/{id}/students', [ClassController::class, 'getStudents']);
Route::post('/api/classes/{id}/students', [ClassController::class, 'addStudent']);
Route::delete('/api/classes/{id}/students/{studentId}', [ClassController::class, 'removeStudent']);

// Co-Curricular Management
Route::get('/api/co-curriculars', [CoCurricularController::class, 'index']);
Route::post('/api/co-curriculars', [CoCurricularController::class, 'store']);
Route::put('/api/co-curriculars/{id}', [CoCurricularController::class, 'update']);
Route::delete('/api/co-curriculars/{id}', [CoCurricularController::class, 'destroy']);
Route::get('/api/co-curriculars/{id}/members', [CoCurricularController::class, 'getMembers']);
Route::post('/api/co-curriculars/{id}/members', [CoCurricularController::class, 'addMember']);
Route::delete('/api/co-curriculars/{id}/members/{studentId}', [CoCurricularController::class, 'removeMember']);

// Sport Houses
Route::get('/api/sport-houses', [SportHouseController::class, 'index']);
Route::post('/api/sport-houses', [SportHouseController::class, 'store']);
Route::put('/api/sport-houses/{id}', [SportHouseController::class, 'update']);
Route::delete('/api/sport-houses/{id}', [SportHouseController::class, 'destroy']);
Route::get('/api/sport-houses/{id}/members', [SportHouseController::class, 'getMembers']);
Route::post('/api/sport-houses/{id}/members', [SportHouseController::class, 'addMember']);
Route::delete('/api/sport-houses/{id}/members/{studentId}', [SportHouseController::class, 'removeMember']);

// Events
Route::get('/api/events', [EventController::class, 'index']);
Route::post('/api/events', [EventController::class, 'store']);
Route::put('/api/events/{id}', [EventController::class, 'update']);
Route::delete('/api/events/{id}', [EventController::class, 'destroy']);
Route::post('/api/events/{id}/scan', [EventController::class, 'scanAttendance']);

// Attendance
Route::post('/api/attendance/check-in', [AttendanceController::class, 'checkIn']);
Route::post('/api/attendance/check-out', [AttendanceController::class, 'checkOut']);
Route::post('/api/attendance/manual', [AttendanceController::class, 'manualEntry']);
Route::get('/api/attendance/log', [AttendanceController::class, 'getLog']);
Route::get('/api/attendance/dashboard', [AttendanceController::class, 'getDashboard']);

// Facility Check-In
Route::post('/api/facility/check-in', [FacilityController::class, 'checkIn']);
Route::post('/api/facility/check-out', [FacilityController::class, 'checkOut']);
Route::get('/api/facility/log', [FacilityController::class, 'getLog']);

// Time Settings
Route::get('/api/time-settings', [TimeSettingController::class, 'index']);
Route::post('/api/time-settings', [TimeSettingController::class, 'store']);
Route::put('/api/time-settings/{id}', [TimeSettingController::class, 'update']);
Route::delete('/api/time-settings/{id}', [TimeSettingController::class, 'destroy']);

// Reports
Route::get('/api/reports/attendance', [ReportController::class, 'attendanceReport']);
Route::get('/api/reports/general', [ReportController::class, 'generalReport']);
Route::get('/api/reports/parents', [ReportController::class, 'parentsReport']);
Route::get('/api/reports/export', [ReportController::class, 'exportReport']);

// QR Code
Route::get('/api/qr/{userType}/{userId}', [QrController::class, 'generate']);
Route::post('/api/qr/resolve', [QrController::class, 'resolve']);
```

---

## Frontend Changes Required

### Minimal changes — only wire up what's needed:

**Class.tsx:**
- Remove dummy data, add `useEffect` to `GET /api/classes?session_id={activeSession}`
- AddClassModal `onSubmit` → POST /api/classes
- EditClassModal `onSubmit` → PUT /api/classes/{id}
- Delete confirm → DELETE /api/classes/{id}
- AddStudentToClass view → GET /api/classes/{id}/students, POST to add, DELETE to remove
- Teacher dropdown → from users list filtered by type='teacher'

**CoCurricular.tsx:**
- Same pattern: remove dummy, wire CRUD to `/api/co-curriculars`

**Sport.tsx:**
- Same pattern: wire to `/api/sport-houses`

**Event.tsx:**
- Wire to `/api/events`, banner upload via FormData (multipart)

**AttendanceLog/CheckIn.tsx:**
- Install `html5-qrcode`, replace placeholder div with actual camera scanner
- On scan, POST to `/api/attendance/check-in`
- Show success modal with name/class/time
- Show error if already checked in

**AttendanceLog/CheckOut.tsx:**
- Same camera scanner, POST to `/api/attendance/check-out`

**AttendanceLog/TimeSetting.tsx:**
- Remove dummy data, wire to `/api/time-settings`

**CheckIn/FacilityCheckIn.tsx:**
- After facility type selected, show camera scanner
- POST to `/api/facility/check-in` with `{facility_type, ic_number, type}`

**CheckIn/ManualEntry.tsx:**
- Form: select date, select class → load students → mark present/absent/late per student
- POST to `/api/attendance/manual` with array of attendance records

**Dashboard.tsx:**
- `useEffect` → GET /api/attendance/dashboard → populate StatCards + today's log table
- Replace hardcoded date with real date from response

**Reports/AttendanceReports.tsx:**
- Wire filter selectors → GET /api/reports/attendance?{filters}
- Populate chart with response data

**Reports/GeneralReport.tsx:**
- Wire to GET /api/reports/general

**Reports/ParentsReport.tsx:**
- Wire to GET /api/reports/parents

---

## Recommended Implementation Order

Given the 1-day deadline, implement in this order:

### Phase 1 — Database (30 min)
1. Create all migration files listed above
2. Run `php artisan migrate`
3. Seed default `attendance_time_settings` record in DatabaseSeeder

### Phase 2 — Class Management (45 min) ⭐ Priority
1. Create `ClassController` with full CRUD + student enrollment
2. Add routes
3. Wire `Class.tsx` frontend

### Phase 3 — QR + Attendance Core (2 hours) ⭐ Most Critical
1. `composer require simplesoftwareio/simple-qrcode`
2. `npm install html5-qrcode`
3. Create `QrController` (generate + resolve)
4. Create `AttendanceController` (checkIn + checkOut)
5. Wire `CheckIn.tsx` and `CheckOut.tsx` with real camera scanner
6. Create `TimeSettingController` + wire `TimeSetting.tsx`

### Phase 4 — Facility Check-In (45 min)
1. Create `FacilityController`
2. Wire `FacilityCheckIn.tsx` with camera scanner (reuse same component)

### Phase 5 — Manual Entry (30 min)
1. Create `manualEntry()` in `AttendanceController`
2. Wire `ManualEntry.tsx` (select date + class → students list → mark)

### Phase 6 — Co-Curricular, Sport, Events (1 hour)
1. Create controllers for each
2. Wire respective frontend pages

### Phase 7 — Dashboard + Reports (1 hour)
1. `getDashboard()` endpoint — aggregates today's attendance_logs
2. Wire Dashboard.tsx
3. Report endpoints + wire report pages

---

## Key Patterns in This Codebase

### Controller Response Pattern
Controllers return JSON for API routes:
```php
return response()->json(['data' => $result, 'message' => 'Success'], 200);
// On error:
return response()->json(['message' => 'Error description'], 422);
```

### Getting Current School
```php
// From authenticated user:
$school_id = auth()->user()->school_id;
```

### Getting Active Session
```php
$session = SchoolSession::where('school_id', $school_id)
    ->where('is_active', true)
    ->first();
```

### Frontend Axios Pattern
```tsx
const [data, setData] = useState([]);
useEffect(() => {
    axios.get('/api/endpoint')
        .then(res => setData(res.data.data))
        .catch(err => console.error(err));
}, []);
```

### Frontend POST Pattern
```tsx
const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await axios.post('/api/endpoint', formData);
        // refresh list
    } catch (err) {
        setError(err.response?.data?.message);
    }
};
```

### File Upload Pattern (multipart)
```tsx
const formData = new FormData();
formData.append('banner', file);
axios.post('/api/events', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## Important Notes / Gotchas

1. **CSRF:** All POST/PUT/DELETE routes work via Axios because Laravel's CSRF token is shared via `X-XSRF-TOKEN` cookie. No manual setup needed.

2. **No QR lib in composer.json yet** — must run `composer require simplesoftwareio/simple-qrcode` before using.

3. **No html5-qrcode in package.json yet** — must run `npm install html5-qrcode` before using in React.

4. **Classrooms don't have teacher_id** — add via migration: `ALTER TABLE classrooms ADD COLUMN teacher_id VARCHAR(255) NULL`.

5. **All routes are in `routes/web.php`** — not `routes/api.php`. The `/api/*` prefix routes are web routes by convention in this project.

6. **SPA catch-all must stay last** in `routes/web.php`.

7. **Soft deletes** — use `->whereNull('deleted_at')` or `withTrashed()`/`onlyTrashed()` when querying soft-deleted models.

8. **Custom primary keys** — when querying by PK use `->find($id)` or `->where('co_curricular_id', $id)->first()`.

9. **Session filtering** — most lists should be filtered by `school_session_id` (the active session). Get it from `SchoolSession::where('school_id', $school_id)->where('is_active', true)->first()`.

10. **Image storage** — use `storage/app/public/` and call `php artisan storage:link` once if not already done. Store path as `Storage::url($path)` in DB.

---

## Dev Commands

```bash
# Start everything (Laravel + Vite + Queue + Logs)
composer run dev

# Run migrations
php artisan migrate

# Re-seed (careful — drops and recreates)
php artisan migrate:fresh --seed

# Install PHP package
composer require simplesoftwareio/simple-qrcode

# Install JS package
npm install html5-qrcode

# Build frontend
npm run build

# Create storage symlink (once)
php artisan storage:link
```
