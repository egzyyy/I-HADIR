# Security Staff Shift Attendance — Design

Status: **Approved, ready for implementation planning.**
Branch: `feat/security-staff-shift-attendance`

## Problem

Security staff attendance today is identical to teacher/student attendance: a single,
school-wide `attendance_time_settings` record decides whether a check-in is present/late/absent,
resolved automatically by day-of-week. Security staff don't work a single fixed school day —
they work shifts (morning/afternoon/night, sometimes overnight), and the school may have
anywhere from one guard to several working different or overlapping shift patterns. Nothing
in the codebase models "a shift" today.

## Current state (verified against code, not CLAUDE.md's original plan)

- `security_staff` is a distinct `users.user_type` (not a subtype of generic `staff`).
- `AttendanceSetting` (`attendance_time_settings` table) + `TimeSettingController` +
  `TimeSetting.tsx` are fully built, but model exactly **one** auto-resolved setting per school
  per day (via `applies_to_days` / `is_default`, with per-date overrides for closures). Every
  user type shares it identically.
- `AttendanceController::checkIn/checkOut/manualCheckIn` treat `student`, `teacher`, `staff`
  uniformly; `security_staff` is aliased to `staff` wherever resolved (`resolveStaff()`).
- Security staff already self-check-in via `CheckIn.tsx`/`CheckOut.tsx` (role-derived
  `user_type`) and via the unauthenticated kiosk `PublicScan.tsx` (`?type=staff`).
- No shift concept exists anywhere in the codebase (fresh branch, zero prior work).

## Requirements gathered

- Staffing is flexible: could be one guard or several, with no fixed pattern — design must not
  assume a specific count.
- Admin defines a catalog of shifts (name + time window). Any security staff can pick any
  active shift at check-in — no per-person restriction/assignment.
- Overlap must be prevented in two independent ways:
  1. **Catalog-level**: admin cannot define two shifts whose time windows overlap.
  2. **Runtime**: a staff member cannot be checked into two shifts at once.
- Shifts must support crossing midnight (overnight shifts).
- Shift management lives as a new tab inside the existing Time Setting page.
- Check-in requires picking a shift first; check-out auto-detects the open shift — no picker.

## Approach

Dedicated `Shift` model/table, independent of `AttendanceSetting`, with a nullable
`shift_id` FK added to `attendance_logs`. This keeps the school-wide Time Setting's
"auto-resolve exactly one setting per day" logic untouched, and gives shifts their own
"many options, human picks one" logic without conflating the two responsibilities in one
model. (Rejected: extending `AttendanceSetting` with a user-type scope — would mix two
different resolution strategies into one model; a free-text/JSON shift label — too weak to
support per-shift thresholds, overlap validation, or reporting joins.)

## Data model

### New table `shifts`

```php
Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('school_id')->constrained('schools', 'school_id');
    $table->string('name');                            // e.g. "Morning Shift", "Night Shift"
    $table->time('start_time');
    $table->time('end_time');
    $table->boolean('is_overnight')->default(false);    // true when end_time < start_time
    $table->time('late_threshold')->nullable();         // after start_time, before this = late
    $table->time('absent_threshold')->nullable();       // after this = absent
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

- Scoped by `school_id`, same convention as `AttendanceSetting`.
- `is_active` retires a shift from the selectable list without breaking historical logs that
  reference it; soft delete is a second-layer safety net (same pattern as `CoCurricular`,
  `SportHouse`, `Event`).
- `is_overnight` is stored explicitly rather than derived on the fly, since overlap-checking
  and status-computation code both need it repeatedly.

### `attendance_logs` — one new column

```php
$table->foreignId('shift_id')->nullable()->constrained('shifts');
```

Populated only when `user_type = 'security_staff'`. All other rows keep `shift_id = null`;
zero behavior change for students/teachers/staff.

### Model `App\Models\Shift`

Plain auto-increment PK (not a string PK — never externally referenced, e.g. not encoded in a
QR code), mirroring `AttendanceSetting` exactly.

## Backend logic

### `ShiftController`

Mirrors `TimeSettingController`'s CRUD shape:

- `index()` — `GET /api/shifts` — list shifts for the admin's school.
- `store()` — `POST /api/shifts` — create, with catalog overlap validation.
- `update()` — `PUT /api/shifts/{id}` — edit, re-validated against overlap (excluding itself).
- `destroy()` — `DELETE /api/shifts/{id}` — soft delete.
- `activeForCheckIn()` — `GET /api/shifts/active` — **no auth required** (the unauthenticated
  kiosk `PublicScan.tsx` needs this too), returns only `is_active` shifts for the school.

### Catalog-level overlap validation

On `store`/`update`, compare the shift's `[start_time, end_time)` window against every other
active shift for the same school. Overnight shifts are represented as wrapping past midnight
(e.g. split into one or two intervals on a 24h ring) before pairwise intersection is checked.
Conflicting requests are rejected with 422, naming the conflicting shift.

### Check-in changes (`AttendanceController::checkIn`, and the `PublicScan.tsx` flow)

- New required field when `user_type = 'security_staff'`: `shift_id`.
- Before creating a log, check whether this staff member already has an **open log**
  (`check_out_time IS NULL`), regardless of date. If one exists, reject with
  *"You still have an open shift — check out first."* This single rule is what prevents a
  staff member from being checked into two shifts at once; no separate time-math is needed at
  check-in.
- `date` on the new log stays the check-in's calendar date (the shift's start date) — same
  convention as today.
- `status` (present/late/absent) is computed the same way as today's `resolveStatus()`, but
  against the **shift's own** `late_threshold`/`absent_threshold` when `shift_id` is present,
  instead of the school-wide `AttendanceSetting`.

### Check-out changes

No shift picker anywhere. `checkOut()` for `security_staff` finds the staff member's most
recent log with `check_out_time IS NULL` (instead of "look up by `date = today`"), so an
overnight shift checked in the previous calendar day still closes correctly. All other user
types are unchanged.

### Manual Entry (`ManualEntry.tsx` / `manualCheckIn`)

When an admin manually marks a `security_staff` member present, the form gains the same shift
dropdown, so status computation and reporting stay consistent with self-service check-in. The
same open-log check applies.

### Reporting

`AttendanceController::getLog()` includes the shift name in row data for `security_staff` rows
that have a `shift_id`, so attendance tables can show which shift a record belongs to.

## Frontend UX flow

### Admin — `TimeSetting.tsx`

New second tab, "Security Shifts," alongside the existing "General" tab. Reuses the page's
existing list/modal visual pattern: a table of shifts (name, time window, late/absent
thresholds, active toggle, edit/delete) and an Add/Edit modal with the Section-1 fields.
Overlap-conflict errors from the backend surface inline on the modal, consistent with existing
form-error handling elsewhere in the app.

### Security self check-in — `CheckIn.tsx` (role = Security)

Before the camera scanner renders, a shift-picker step appears: fetch
`GET /api/shifts/active`, render as a simple list/radio selection ("Which shift are you
checking in for?"). Once picked, the scanner behaves as it does today, with `shift_id`
included in the `/api/attendance/check-in` POST. Teacher/Admin roles are unaffected — gated on
`role === 'Security'`.

### Security self check-out — `CheckOut.tsx`

No UI change — scan only, matching the backend's auto-detect behavior.

### Public kiosk — `PublicScan.tsx` (`?type=staff&mode=check-in`)

Same shift-picker step added before the scanner starts, since this is likely the primary
real-world entry point (gate/entrance kiosk) for security staff. `?mode=check-out` stays
scan-only, same as the self-service page.

### Duplicate/open-shift error

The "you still have an open shift" rejection reuses the existing 409-duplicate UI pattern
already present in `ScanResultModal`/`CheckIn.tsx` (shown as a warning-toned result, not a hard
failure).

### Reporting

`AttendanceLog.tsx` / `Reports/*` tables show a "Shift" column when listing `staff`/
`security_staff` rows that have a `shift_id`.

## Edge cases & fallbacks

**No shifts configured yet** — if a school has zero active shifts (e.g. immediately after this
feature ships, before an admin has created any), security-staff check-in falls back to today's
existing school-wide `AttendanceSetting` behavior (`shift_id` stays `null`, identical to
today). This keeps any already-seeded security guard's flow working unchanged until an admin
opts in by creating shifts — no forced migration step.

**Deactivating/deleting a shift with history** — soft-deleting or setting `is_active = false`
only removes it from the *selectable* list going forward. Existing `attendance_logs.shift_id`
references keep working (checkout still finds the open log by FK regardless of the shift's
active state), and reports show the shift name tagged "(inactive)".

**One shift per staff per day (explicit scope cut)** — the existing
`unique(['user_type','user_id','date'])` constraint on `attendance_logs` is untouched, so a
security staff member is limited to one shift's attendance record per calendar date, same as
every other role today. Double-shifting the same day is explicitly out of scope for this round
— a deliberate cut, not an oversight; revisit later if a real need arises.

## Testing plan (manual, via tinker + on-device)

- Create two overlapping shifts → rejected; create two overnight shifts wrapping past
  midnight that overlap → rejected; non-overlapping shifts accepted.
- Security check-in with a shift → status computed against that shift's thresholds, not the
  school-wide setting.
- Overnight shift: check in 23:00, check out 06:00 the next day → same log row updated,
  `date` stays the check-in date.
- Attempt a second check-in while an open shift log exists → blocked with the "check out
  first" message.
- No active shifts for the school → check-in falls back to existing global-setting behavior,
  unchanged.
- Manual Entry with a security staff + shift selection → log created with correct
  `shift_id`/status.
- Reports list shows the shift name column for `security_staff` rows.
