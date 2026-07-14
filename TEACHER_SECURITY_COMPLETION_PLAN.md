# Teacher / Security / Landing Page Completion Plan

Status: **DRAFT — awaiting review before implementation.**
Scope owner: Harith (backend + this feature set).

This plan covers everything requested: Teacher & Security self-attendance, "Generate My QR
Code" (backed by a properly rebuilt `QrController` from the start), both role dashboards
working end-to-end, the remaining teacher-facing pages, the public landing page becoming
data-driven, and the event banner pulling from the real `events` table.

---

## 1. Audit — current state (verified against the actual code, not CLAUDE.md's original spec)

| Area | File(s) | State |
|---|---|---|
| Security Dashboard | `Components/dashboards/SecurityDashboard.tsx` | ✅ Done (previous session) — real stats, recent activity, quick actions wired |
| Teacher Dashboard | `Components/dashboards/TeacherDashboard.tsx` | ❌ 100% hardcoded, zero `axios` calls |
| Self Check-In / Check-Out (shared page, all roles) | `Pages/AttendanceLog/CheckIn.tsx`, `CheckOut.tsx` | ⚠️ Hits real backend, but **hardcodes `user_type: 'student'`** — breaks for Teacher/Security scanning their own IC |
| "My Attendance Record" (Teacher: *Self Attendance Report*, Security: *My Attendance Record*) | `Pages/Admin/MyAttendance.tsx` (routed at `/my-attendance`, renamed from `AdminAttendance.tsx`/`/admin-attendance` — the old name was misleading since it's a shared self-service page for all roles, not admin-only) | ✅ Now connected (Phase 2) |
| Visitor Report | `Pages/Users/VisitorList.tsx` | ✅ Connected (`/api/visitors/all`) |
| Visitor Check-In form | `Pages/Visitor.tsx` (route `/visitor`) | ✅ Connected (`/api/visitors`) — Security dashboard's "Check In Visitor" button already routes here correctly. **No change needed.** |
| Class management (teacher-scoped) | `Pages/Academic/Class.tsx` + `ClassController` | ✅ Connected, and already properly scoped to `auth()->user_type === 'teacher'` via `classrooms.user_id` |
| Student List (teacher-scoped) | `Pages/Users/UserList.tsx` + `UserController@index` | ✅ Connected, already scoped to the teacher's own class via enrollment join |
| Manual Entry | `Pages/CheckIn/ManualEntry.tsx` | ✅ Connected |
| Facility Check-In | `Pages/CheckIn/FacilityCheckIn.tsx` | ✅ Connected |
| Attendance / General Reports | `Pages/Reports/AttendanceReports.tsx`, `GeneralReport.tsx` | ✅ Connected |
| QR generation (admin/print use) | `Components/modals/StudentQrModal.tsx` | ✅ Works today — renders a QR **client-side** via the `qrcode` npm package, encoding the **raw IC number** (not the JSON `{type,ic}` payload CLAUDE.md originally described). This is the real, working convention on the wire (`CheckIn.tsx` reads the scanned text directly as `ic_number`) — the plan keeps it. What changes is *where the IC comes from*: see §2.1. |
| `QrController` (`/api/qr/{type}/{id}`, `/api/qr/resolve`) | `app/Http/Controllers/QrController.php` | 🐛 **Broken** — references `App\Models\Teacher` and `App\Models\Staff`, neither of which exist (teachers/staff live in the unified `App\Models\User` table). Currently unreferenced by any frontend code. **This plan now fixes and builds this out as the authoritative backend for all QR generation/lookup, done up front in Phase 0 — not deferred.** |
| `AttendanceLog::resolveUser()` model method | `app/Models/AttendanceLog.php` | 🐛 Same dead/broken `Teacher`/`Staff` reference. Unused (controller has its own resolver). Bundled into the Phase 0 fix since it's the identical bug pattern — effectively free once we're rewriting the resolution logic. |
| `/api/me` | `UserController@me` | Returns `name/email/position/role` only. **No change needed** — IC numbers now flow exclusively through the dedicated QR endpoints (§2.1), not through `/api/me`. |
| Landing page — schools directory | `Pages/GeneralLanding.tsx` → `Components/landing/SchoolDirectory.tsx` | ❌ Fully static (`data/schools.ts`), not backed by the `schools` DB table at all |
| Landing page — school detail stats | `Pages/SchoolLanding.tsx` (`SchoolAbout`) | ❌ Hardcoded "600+ students / 40+ educators / 20+ clubs" |
| Landing page — events banner | `Components/landing/Hero.tsx` | ❌ 3 fully hardcoded fake events with stock Unsplash photos |
| `events` table / `EventController` | migrations + `EventController` | ✅ Schema and admin CRUD exist and work, but `index()` requires `auth()->user()` — **no public/unauthenticated read path exists**, which the landing page needs |
| `schools` table | migration | Has `school_code, name, email, phone_number, address, postcode, city, state` — **no `slug` column**, so there is currently no link between the static frontend `slug` ("pulau-serai") and the real DB row (`school_code = MEA0001`) |

---

## 2. Key design decisions (please confirm before I start building)

### 2.1 QR generation — bundled into `QrController` from the start (updated per your feedback)

Original draft treated QR generation as purely client-side (a component encoding whatever IC
string it was handed) and left `QrController` as an unused, broken file to fix "later, if
convenient." That's now flipped: **`QrController` becomes the single authoritative backend
for every QR lookup in the app, built correctly from Phase 0.**

- **Wire format stays the raw IC number** (unchanged) — that's the live convention `CheckIn.tsx`/`CheckOut.tsx` already scan against, and there's no reason to diverge from it.
- **What's new:** the *source* of that IC string is no longer a prop threaded in from wherever the component happens to be rendered — it comes from a fixed, correct `QrController`:
  - `GET /api/qr/{userType}/{userId}` — **fixed** (was broken): resolves `student` via `Student`, `teacher`/`staff` via `User` (with the same `staff` → `whereIn(['staff','security_staff'])` mapping already used everywhere else, e.g. `AttendanceController::resolveStaff`). Returns `{ success, payload: <ic_number>, name, label }`. This becomes the one real endpoint for "generate a QR for any known person by id" — used by admin-side printing.
  - `POST /api/qr/resolve` — **fixed** (was broken): same model-resolution fix, `{ic_number, user_type}` → person info. Kept for the pre-validation use case it was originally designed for.
  - `GET /api/qr/me` — **new**: resolves `auth()->user()` into the same `(type, id, ic, name, label)` shape using the existing role mapping (`teacher` → `teacher`, `Security`/`security_staff` → `staff`), so a logged-in Teacher or Security user can fetch their own QR without their IC ever needing to pass through `/api/me` or sit in `AuthContext`. This is what powers "Generate My QR Code."
- `Components/modals/MyQrModal.tsx` (new, shared): **self-contained** — takes only `{ isOpen, onClose }`, calls `GET /api/qr/me` itself on open, renders the canvas via the same `qrcode` package pattern as `StudentQrModal`, shows loading/error states, and offers the same PNG download. No IC/name props threaded in from the dashboard — the modal is the client of the new endpoint, full stop.
- `StudentQrModal.tsx` / `AddStudentToClass.tsx` (existing, working admin flow) — **left as-is**. It already has the student's IC in hand from the row it's rendering and works correctly; there's no bug to fix there, and routing it through the network for data it already has would be pure churn, not a improvement. `QrController`'s `generate`/`resolve` are there for genuine "must look it up by id" cases going forward.

### 2.2 Check-In/Check-Out role awareness
`/attendance-log/check-in` and `/check-out` are shared by all three roles today. They'll derive `user_type` from `useAuth().role` (`Teacher` → `teacher`, `Security` → `staff`, `Admin` → `student`, the existing default). This matches how the sidebar already labels these pages differently per role ("Teacher Attendance" / "My Attendance" vs. Admin's "School Attendance"). Admin's gate-scanning behavior for students is unaffected.

### 2.3 "My Attendance Record" data source
New endpoint `GET /api/attendance/my-log` that resolves the caller's own `user_type`/`user_id` from `auth()->user()` (same mapping as §2.2) and returns their personal `attendance_logs` history, filterable by date range. This replaces the empty static table in `MyAttendance.tsx` (renamed from `AdminAttendance.tsx`).

### 2.4 Teacher Dashboard's fake "Today's Schedule" widget — ✅ DECIDED
Confirmed: timetables are out of scope. The fake "Today's Schedule" block (hardcoded Math/Science/English periods, `TeacherDashboard.tsx` lines 78–97) gets **replaced** with a real, data-backed **"My Class — Recent Attendance"** feed — a feed of today's check-ins for the teacher's own homeroom class (same pattern as Security's Recent Activity). No timetable/period table gets built.

### 2.5 Landing page dynamism — the `slug` gap
The marketing site lists 6 schools in a static `data/schools.ts` (colors, taglines, monograms — pure branding config with no DB equivalent), but only **one** row exists in the real `schools` table today (`MEA0001` / SK Pulau Serai). Plan:
- Add a nullable, unique `slug` column to `schools` (migration), backfill `pulau-serai` onto the existing row.
- Add **public, unauthenticated** endpoints (new — every existing `/api/*` route assumes `auth()->user()` and will hard-fail with a null-property error for a logged-out visitor):
  - `GET /api/public/schools` — list of `{slug, name, city, state}` for schools that have a `slug` set (i.e., are actually live).
  - `GET /api/public/schools/{slug}` — one school's identity + **real counts** (students, teachers, active co-curriculars) to replace the hardcoded "600+ / 40+ / 20+" stat cards.
  - `GET /api/public/schools/{slug}/events` — upcoming `events` rows for that school (public, no auth), replacing the fake Hero carousel.
- Frontend: `data/schools.ts` **stays** as the branding/visual registry (colors, tagline, monogram — there's no reasonable DB home for these and no ask to add one). `SchoolDirectory.tsx` and `SchoolLanding.tsx` merge that static branding with the live `/api/public/schools*` data by slug. A school only renders as "live" (`hasPortal`) if the backend confirms a `slug` match; otherwise it falls back to today's "Coming soon" card — no behavior change for the 5 placeholder schools.
- If a school has zero upcoming events, the Hero banner shows a clean empty state instead of `events[0]` exploding on an empty array.

**Confirm:** OK with adding the `slug` column + backfilling the one real school, or would you rather key everything off `school_code` directly (skip the new column, match `pulau-serai` → `MEA0001` in a small lookup/config instead)? Recommendation is the `slug` column — cleaner long-term — but it's your call.

---

## 3. Implementation phases & checklists

### Phase 0 — `QrController` rebuild + shared groundwork
*Everything else that touches QR depends on this being done first.*

- [x] `QrController::generate($userType, $userId)` — fixed broken `Teacher`/`Staff` model refs; resolves `student` via `Student`, `teacher`/`staff` via `User` (mirroring `AttendanceController::resolveStaff`'s `whereIn(['staff','security_staff'])`); returns `{ success, payload: <raw ic_number>, name, label }`.
- [x] `QrController::resolve()` — same model-resolution fix for `POST /api/qr/resolve`.
- [x] `QrController::me()` — new method, `GET /api/qr/me`, resolves `auth()->user()` via the role→type mapping in §2.2, returns the same shape as `generate()`.
- [x] Registered `GET /api/qr/me` in `routes/web.php`, ahead of `/api/qr/{userType}/{userId}` (confirmed via `route:list` — no ambiguity, different segment counts).
- [x] Bundled fix for `AttendanceLog::resolveUser()`'s identical broken `Teacher`/`Staff` refs.
- [x] New `Components/modals/MyQrModal.tsx` — self-contained (`{ isOpen, onClose }` only), fetches `GET /api/qr/me` on open, renders via `qrcode` canvas (same visual pattern as `StudentQrModal`), loading/error states, PNG download button.
- [x] Manual check (via `tinker`, simulating auth as each account): `me()` verified correct for teacher (id 4 → IC `850404115555`, label "Teacher"), security (id 5 → IC `750505116666`, label "Security"), and staff (id 6 → IC `880606117777`, label "Staff"). `generate()`/`resolve()` re-verified for teacher/staff too. No student rows exist in the dev DB to smoke-test that branch, but its code path is unchanged from what already worked.

**Phase 0: ✅ complete.**

### Phase 1 — Self attendance actually works (Teacher + Security)
- [x] `Pages/AttendanceLog/CheckIn.tsx` — replaced hardcoded `user_type: 'student'` with role-derived value via `useAuth()` (`Teacher`→`teacher`, `Security`→`staff`, else `student`).
- [x] `Pages/AttendanceLog/CheckOut.tsx` — same fix.
- [x] Updated on-screen copy on both pages ("Point the camera at a student's QR code" → "your QR code" when role is Teacher/Security).
- [x] `AttendanceController@myLog(Request $request)` — new method, resolves caller's own `user_type`/`user_id`, returns their `attendance_logs` rows (optional `?from=&to=` filter), newest first.
- [x] Registered `GET /api/attendance/my-log` in `routes/web.php`.
- [x] Manual check (via `tinker`, simulating full request flow): teacher (id 4) checked in with `user_type=teacher`, status `present`; security (id 5) checked in with `user_type=staff`. `myLog()` for each returned exactly their own single row, correct date/time/status. Test rows cleaned up afterward.

**Phase 1: ✅ complete.**

### Phase 2 — "My Attendance Record" page
- [x] Rewrote `Pages/Admin/AdminAttendance.tsx` — fetches `/api/attendance/my-log`, renders real rows (date, time in, time out, status badge, scan method).
- [x] Renamed the page and route to reflect what it actually is: `Pages/Admin/AdminAttendance.tsx` → `Pages/Admin/MyAttendance.tsx`, component `AdminAttendance` → `MyAttendance`, route `/admin-attendance` → `/my-attendance`. Handled all downstream references: `app.tsx` (import + `<Route>`), `DashboardLayout.tsx`'s sidebar route map. Confirmed via repo-wide grep that nothing else referenced the old name (one unrelated, unused standalone script `extract_layout.cjs` still has old strings but isn't wired into the app — left untouched).
- [x] Replaced the generic text search with a From/To date-range picker wired to `?from=&to=` query params (a plain text search wasn't meaningful for single-user data with no name column to filter).
- [x] Hooked Copy/CSV/Excel/PDF/Print export buttons to the real dataset via the shared `ExportButtons` component (same component `ManualEntry.tsx`/`VisitorList.tsx` already use — no new library).
- [x] Dropped the fake "Temperature" column; replaced with "Status" badge (present/late/absent) + "Method" (qr/manual), consistent with other attendance tables.
- [x] Manual check (via `tinker`): seeded 3 historical rows for the teacher account, confirmed no-filter/`from`-only/`from`+`to` all return the correctly bounded, newest-first subset. `myLog()` is scoped to `auth()->user()` by construction, so cross-user leakage isn't possible. Test rows cleaned up.

**Phase 2: ✅ complete.**

### Phase 3 — "Generate My QR Code" quick action
- [x] Added "Generate My QR Code" button to `TeacherDashboard.tsx` quick actions (3rd button, grid expanded to 3 columns), opening `MyQrModal`.
- [x] Added "Generate My QR Code" button to `SecurityDashboard.tsx` quick actions (4th button, grid expanded to 4 columns), opening `MyQrModal`.
- [x] `MyQrModal` reused as-is from Phase 0 — already self-contained, no per-dashboard wiring needed beyond open/close state.

**Phase 3: ✅ complete.**

### Extra cleanup — the rest of the "Admin-named but actually shared" pages
Same naming smell as `AdminAttendance.tsx` applied to two more pages (both routed `allow={ALL}`, i.e. every role's own profile/password page, not admin-only). Renamed both and handled all downstream references:
- [x] `Pages/Admin/AdminProfile.tsx` → `Pages/Admin/MyProfile.tsx` (component `AdminProfile` → `MyProfile`), route `/admin-profile` → `/my-profile`.
- [x] `Pages/Admin/AdminPassword.tsx` → `Pages/Admin/ChangePassword.tsx` (component `AdminPassword` → `ChangePassword`), route `/admin-password` → `/change-password`.
- [x] Backend API surface renamed to match: `GET/POST /api/admin/profile` → `GET/POST /api/profile`, `POST /api/admin/password` → `POST /api/password`; `UserController::getAdminProfile()` → `getMyProfile()`, `updateAdminProfile()` → `updateMyProfile()` (`updatePassword()` was already named fine, untouched).
- [x] Updated all call sites: `app.tsx` (imports + both `<Route>`s), `DashboardLayout.tsx` (sidebar route map `'my-profile'`/`'change-password'` entries + the two `navigate()` calls in the header account dropdown), the two pages' own `axios` calls.
- [x] Confirmed via `route:list` that `api/profile` (GET/POST) and `api/password` (POST) are registered correctly, and via repo-wide grep that no app source file (`resources/`, `app/`, `routes/`) still references the old names. `CLAUDE.md` and the unused standalone script `extract_layout.cjs` still contain old strings — left untouched per instruction (CLAUDE.md is out of scope for Claude to maintain in this project).

**Phase 3: ✅ complete.**

### Phase 4 — Teacher Dashboard wired for real
- [x] `AttendanceController@teacherDashboard()` → `GET /api/attendance/teacher-dashboard`. Rejects non-teacher accounts (422). Resolves the teacher's homeroom classroom(s) via `Classroom::where('user_id', ...)` scoped to the active session (same pattern `ClassController`/`UserController` already use for teacher scoping):
  - [x] "Students in Your Class" — `total_students`, enrollment count across those classroom(s) for the active session.
  - [x] "Present Today" — `present_today`, count of today's `present`/`late` `attendance_logs` rows scoped by `classroom_id` (reuses the `classroom_id` already stamped onto each log at check-in time).
  - [x] "My Class — Recent Attendance" — `recent[]`, today's check-ins for those classrooms, newest first, with `timestamp` for consistent sorting (same shape as Security's feed).
  - [x] Added `classes_count` (number of homeroom classrooms) as the 3rd real stat, replacing the old fake "Classes Today" schedule-derived number.
- [x] Registered `GET /api/attendance/teacher-dashboard` in `routes/web.php`.
- [x] Rewrote `TeacherDashboard.tsx`: real stats (3 cards), real "My Class — Recent Attendance" feed replacing the fake "Today's Schedule" widget per §2.4, loading/empty states matching `SecurityDashboard.tsx` conventions (including a distinct empty message when the teacher has no class assigned yet vs. no attendance recorded yet today).
- [x] Quick Actions rebuilt for real: Check In (`/attendance-log/check-in`), Check Out (`/attendance-log/check-out`), Take Attendance (`/manual-entry`), View Reports (`/attendance-reports`), Generate My QR Code (Phase 3, unchanged).
- [x] Manual check (via `tinker`): confirmed the zero-classroom case returns clean zeros/empty array (no crash) with real teacher account (id 4). Then created temporary fixtures — a classroom owned by teacher 4, one enrolled student, one `present` attendance log for today — and confirmed `total_students: 1`, `present_today: 1`, `classes_count: 1`, and `recent` contains the correct student/status/time. All test fixtures deleted afterward; DB confirmed back to empty.

**Phase 4: ✅ complete.**

### Phase 5 — Security Dashboard (already done, minor addition)
- [x] "Generate My QR Code" quick action — already added in Phase 3 (4th button, 4-column grid). Stats/recent-activity/visitor-checkin were already wired in the previous session. Nothing further needed.

**Phase 5: ✅ complete.**

### Bug fix (found during manual testing) — QR scanning never detected anything
Reported: on a laptop webcam, the Check-In camera turned on and showed live video, but never detected any generated QR code — for students, teachers, and staff alike. Isolated by testing the backend directly (`AttendanceController::checkIn()`) with a raw IC number, which resolved correctly — confirming this wasn't a backend regression from Phases 0–5, but a pre-existing bug in the camera-scanning layer.

Root cause: `Components/common/QrScanner.tsx` requested a fixed `250×250px` scan box (`qrbox`) from `html5-qrcode`. On webcams where that box ends up larger than, or a different aspect ratio than, the actual video stream, the detection region becomes invalid — the picture still renders fine, but nothing is ever successfully scanned. This is a documented `html5-qrcode` failure mode, unrelated to anything touched in this plan.

- [x] `QrScanner.tsx` — `qrbox` is now computed as a function against the real viewfinder size at runtime (capped at 75% of the smaller edge, or the caller's `qrboxSize` prop, whichever is smaller) instead of a hardcoded pixel box. Backward-compatible with `FacilityCheckIn.tsx`'s `qrboxSize={400}` override.
- [x] `StudentQrModal.tsx` / `MyQrModal.tsx` — bumped rendered QR size 240px → 280px and set `errorCorrectionLevel: 'H'` (was default `'M'`), making on-screen codes more resilient to webcam glare/angle/moiré when scanned off an LCD rather than printed or scanned close-up on a phone.

**Follow-up round 1 (after re-test):** the scan-box fix worked for `StudentQrModal`-generated codes (both student and teacher IC content decode fine now). Two things reported:

1. Scanning a teacher's IC while the page defaults to `user_type: 'student'` correctly failed to find them (expected — that's what "student"-scoped scanning means), but the error message was the unhelpful generic "Person not found with that IC number." Fixed: `AttendanceController::checkIn()/checkOut()/manualCheckIn()` and `FacilityController::checkIn()/checkOut()` now return a type-specific message, e.g. `"No teacher found with that IC number."` — makes it immediately clear *why* it failed (wrong type searched, not a broken scanner). Verified via `tinker`.
2. `MyQrModal` was still completely broken — a genuine bug, not the scan-box issue. Its canvas element only mounts once `loading` flips to `false`, but the QR-draw `useEffect` only depended on `[data]`. Since `data` is set (`.then()`) and `loading` is cleared (`.finally()`) as two *separate* state updates, on the render where the canvas actually mounts, the draw effect didn't re-fire (its dependency hadn't changed again) — so the canvas was left permanently blank. `StudentQrModal` never had this bug since its canvas isn't gated behind a loading state. Fixed by adding `loading`/`error` to the effect's dependency array so it re-runs once the canvas is actually in the DOM.
3. `FacilityCheckIn.tsx`'s scanner resized from `qrboxSize={400}` → `qrboxSize={280}` to match `StudentQrModal`/`MyQrModal`'s render size (one shared `<QrScanner>` instance handles both its Check In and Check Out modes via a toggle, so this one change covers both, for both Admin and Teacher — the only two roles with access to that page).

Noted but **not fixed** (out of scope for this ask, flagged for awareness): `FacilityCheckIn.tsx` hardcodes `user_type: 'student'` for every scan with no way to check in a teacher/staff member, even though `FacilityController` supports all three types. Same class of issue as the one fixed in Phase 1 for the main Check-In/Check-Out pages — worth a follow-up if facility check-in needs to support non-student users.

**Follow-up round 2 — "cannot scan at all" turned out not to be a code bug.** Traced through:
- Confirmed the Teacher/Security "self-only" `user_type` assumption from Phase 1 is intentional and staying as-is (not a bug — a student's QR is *supposed* to fail on a self-only page).
- Confirmed via `tinker` the live `/api/qr/me` payload is a clean 12-digit ASCII string, byte-verified (hex dump), no hidden characters.
- Confirmed `MyQrModal`'s and `StudentQrModal`'s `QRCode.toCanvas(...)` calls are byte-identical (same width/margin/errorCorrectionLevel/colors).
- Generated both payloads to PNG using the exact same `qrcode` package/options as the frontend, then independently decoded them with a third-party decoder (`jsQR`, via a disposable scratch npm project — not added to the project's dependencies) — **both decoded perfectly**, proving the generation code has no defect.
- Root-caused the original "can't scan anything" report to the physical test setup: scanning a QR displayed on a laptop screen using that same laptop's built-in webcam, which physically cannot see its own screen. Not a code issue at all.
- Remaining "still fails even with a phone showing the QR" report is unresolved as of this note — user was given a clean test (scan the downloaded PNG directly) to isolate stale-browser-cache vs. a live/environmental scanning issue; result pending.

### Scanner robustness pass (proactive, not tied to a specific bug report)
Requested: make `QrScanner.tsx` more tolerant of imperfect scanning angles/distances in general, "auto zoom" specifically floated as an idea.

- [x] Confirmed `html5-qrcode` v2.3.8 (the installed version) exposes real camera-control APIs — `getRunningTrackCapabilities()` and `applyVideoConstraints()` — wrapping the standard `MediaTrackConstraints` zoom capability. Built a genuine auto-zoom feature on top of these, not a placeholder.
- [x] `QrScanner.tsx` — added:
  - Camera resolution request bumped from browser-default (often 640×480) to `{ width: { ideal: 1920 }, height: { ideal: 1080 } }` — more raw pixel detail survives an off-angle or distant shot.
  - `fps` bumped 10 → 15 for more scan attempts per second.
  - Auto-zoom cycling: once the camera starts, checks `getRunningTrackCapabilities().zoom`; if the camera supports zoom (most laptop webcams don't — mainly a mobile/some external-webcam feature), cycles through 4 zoom levels (0%, 35%, 65%, 100% of the camera's min–max range) every 2.5s via `applyVideoConstraints()`, so a code held too far or too close eventually lands in a zoom range that decodes, with no manual pinch/slider needed. Silently no-ops (try/catch-guarded) on cameras without zoom support — this is a best-effort enhancement layered on top of the existing scan loop, not a requirement.
  - `useBarCodeDetectorIfSupported` — checked the library source: this is **already enabled by default** (not something I needed to add) and uses the browser's native, hardware-accelerated `BarcodeDetector` API when available (Chrome/Edge), which is significantly more angle/blur-tolerant than the pure-JS fallback decoder.
- [ ] Not independently verified against a live camera (no camera/browser access in this environment) — needs your on-device re-test, particularly on whatever device/webcam actually supports zoom (check browser devtools console for whether the auto-zoom interval is running by inspecting `getRunningTrackCapabilities()` manually, if curious).

### Phase 6 — Landing page goes dynamic
- [ ] Migration: `schools` table gains nullable unique `slug`.
- [ ] Backfill `pulau-serai` onto the existing `MEA0001` row (seeder or one-off `DB::table` update).
- [ ] `School` model — add `slug` to `$fillable`.
- [ ] New `app/Http/Controllers/PublicController.php`:
  - [ ] `schools()` → `GET /api/public/schools`
  - [ ] `show($slug)` → `GET /api/public/schools/{slug}` (name/city/state + live counts: students, teachers, active co-curriculars)
  - [ ] `events($slug)` → `GET /api/public/schools/{slug}/events` (upcoming, `is_active`, ordered by `event_date`)
- [ ] Register all three routes **without** any auth dependency, above the SPA catch-all.
- [ ] `SchoolDirectory.tsx` — fetch `/api/public/schools` on mount, cross-reference `data/schools.ts` by slug, mark `hasPortal` dynamically.
- [ ] `SchoolLanding.tsx` (`SchoolAbout`) — fetch `/api/public/schools/{slug}`, replace the 4 hardcoded stat cards with live counts.
- [ ] `Hero.tsx` — fetch `/api/public/schools/{slug}/events`, replace the 3 hardcoded events; handle 0/1/many gracefully; use each event's `bannerUrl` with a neutral fallback graphic when absent.
- [ ] Manual check: visit `/school/pulau-serai` logged out, confirm live stats + real events render (or a clean empty state if no events exist yet).

---

## 4. Files touched (summary)

**Backend**
- `app/Http/Controllers/QrController.php` — fixed `generate()`/`resolve()`, new `me()`
- `app/Http/Controllers/AttendanceController.php` — new `myLog()`, `teacherDashboard()`
- `app/Http/Controllers/PublicController.php` — **new**
- `app/Models/AttendanceLog.php` — bundled dead-code fix (optional but cheap)
- `app/Models/School.php` — `slug` fillable
- `database/migrations/xxxx_add_slug_to_schools_table.php` — **new**
- `routes/web.php` — new routes for all of the above

**Frontend**
- `Components/modals/MyQrModal.tsx` — **new**
- `Components/dashboards/TeacherDashboard.tsx` — full rewrite (real data)
- `Components/dashboards/SecurityDashboard.tsx` — add 1 quick action
- `Pages/Admin/MyAttendance.tsx` (renamed from `AdminAttendance.tsx`) — full rewrite (real data)
- `Pages/AttendanceLog/CheckIn.tsx`, `CheckOut.tsx` — role-aware `user_type`
- `Components/landing/SchoolDirectory.tsx` — live data merge
- `Pages/SchoolLanding.tsx` — live stats
- `Components/landing/Hero.tsx` — live events

---

## 5. Suggested build order

1. **Phase 0** (QrController rebuild) — unblocks Phase 3, touch it once and get it right.
2. **Phase 1** (self attendance) → **Phase 2** (my attendance record) — tightly coupled, same data path.
3. **Phase 3** (QR quick actions) — trivial once Phase 0 is done.
4. **Phase 4** (Teacher Dashboard) — depends on Phase 0/1/3.
5. **Phase 5** (Security Dashboard addition) — quick, do alongside Phase 4.
6. **Phase 6** (landing page) — fully independent of 0–5, can be done in parallel or last.

---

## 6. Open questions before implementation starts

- **§2.5** (slug column vs. `school_code` lookup) — please confirm.
- Any objection to the bundled `AttendanceLog::resolveUser()` fix in Phase 0, since it touches a file not otherwise in scope this round?

Resolved: **§2.4** — timetables are out of scope; fake schedule widget replaced with a real "My Class Recent Attendance" feed.
