# Remaining Features Completion Plan

Status: **DRAFT — awaiting review before implementation.**
Scope: everything found not-yet-complete in the full-project audit, **excluding** the landing page
(tracked separately in `TEACHER_SECURITY_COMPLETION_PLAN.md`'s Phase 6).

---

## 1. Audit summary (verified against actual code)

| Area | File(s) | State |
|---|---|---|
| Admin Dashboard | `Pages/Dashboard.tsx` | ❌ 100% dummy — stat cards and student/teacher/staff/late tables all hardcoded |
| Event attendance tracking | `EventController.php`, `Pages/Academic/Event.tsx` | ❌ Missing end-to-end — no `event_attendees` table/model, no scan endpoint, no scan UI. Event *creation* CRUD works fine. |
| Event report | `ReportController::eventReport()` | 🐛 Literal stub — always returns `{present:0, absent:0, data:[]}` regardless of input. Frontend (`GeneralReport.tsx`) is correctly wired and shows no error, so this fails silently. |
| SMS API settings | `Pages/SetSmsApi.tsx` | ❌ Pure static UI — no state, no `axios`, Save button has no handler. No backend route or controller exists. |
| Parents Report security posture | `Pages/Reports/ParentsReport.tsx`, `ReportController::parentStudentReport` | ⚠️ Fully functional, but public + unauthenticated + no rate limiting on an IC-number lookup. Needs a decision, not necessarily a bug. |
| FAQ content | `Pages/Faqs.tsx` | ⚠️ Static copy, "Contact Support" button has no handler. Likely intentional — flagging for confirmation only. |
| Dead backend routes | `QrController::generate/resolve`, `AttendanceController::manualEntry` | 🧹 Zero frontend callers. `generate`/`resolve` were already fixed for correctness in the Teacher/Security plan (Phase 0) and are being kept as intentional utility endpoints for future use. `manualEntry` is genuinely superseded by `manual-check-in`/`manual-check-out/{id}`, which `ManualEntry.tsx` actually uses — safe to remove. |

Confirmed **already clean**, no action needed: `CoCurricular.tsx`, `Sport.tsx`, `Event.tsx` (the CRUD parts), `TimeSetting.tsx`, `AttendanceLog.tsx` — full matching CRUD front-to-back. No frontend-calls-nonexistent-route bugs found anywhere in the app.

---

## 2. Key design decisions (please confirm before implementation)

### 2.1 Admin Dashboard data source
Reuse existing, already-tested endpoints rather than building a monolithic new one:
- **Attendance tables (student/teacher/staff tabs)** — reuse `GET /api/attendance/log?user_type=&date=` (`AttendanceController::getLog`), which already returns exactly the right shape (name, class, date, check-in/out, status, reason) including absent-by-default fallback for anyone with no log yet. No backend change needed — just call it 3x from the frontend, once per type.
- **"Late" tab** — no single endpoint returns a cross-type "everyone late today" list. Plan: call `getLog()` for each of the 3 types with `?status=late`, merge client-side, tag each row with its type. No backend change needed.
- **Stat cards (Total Users/Teachers/Staff/Students/Classes)** — genuinely missing; nothing currently returns org-wide counts. New endpoint needed: `SchoolController::dashboardSummary()` → `GET /api/school/dashboard-summary`, reusing the same counting patterns already established in `UserController::index()` (student/teacher/staff counts) plus a `Classroom` count scoped to the active session.

**Confirm:** OK with this reuse-first approach (adds one small new endpoint, no new tables), or did you want a single consolidated dashboard endpoint instead?

### 2.2 Event attendance tracking — scope
This is a full missing feature, not a wiring gap. Building it properly means:
- New `event_attendees` table + `EventAttendee` model (matches the original CLAUDE.md schema design: `event_id`, `user_type`, `user_id`, `check_in_time`, unique per event+person).
- New `EventController::scanAttendance()` → `POST /api/events/{id}/scan`, same IC-resolution pattern already used in `AttendanceController`/`FacilityController` (`resolveByIc` for student/teacher/staff).
- New frontend scan page — there is currently **no UI at all** for this (confirmed: `Event.tsx` has zero scan/attendee references). Needs a new page, e.g. `/academic/event/:id/scan`, following the same camera-scanner pattern as `FacilityCheckIn.tsx`.
- Fix `ReportController::eventReport()` to query real `event_attendees` data instead of the hardcoded stub.

**Open question on "absent" semantics:** events don't have a fixed roster the way daily school attendance does (no "expected list" to compare against) — so what should `absent` mean in the event report? Options:
  - (a) Drop the "absent" concept for events entirely — report just shows who checked in (present count + list), no absent number.
  - (b) Compute "absent" as (active population of the event's declared `participant_types`) minus (present) — e.g. if an event's `participant_types` includes `student`, absent = total active students − students who scanned in. This treats every eligible person as "expected."

**Confirm:** which interpretation of "absent" do you want for event reports — (a) or (b)? I'd lean (a), since forcing every student/teacher/staff to be "expected" at every event (e.g. a small prize-giving ceremony) doesn't match reality, but it's your call.

### 2.3 SMS API — scope boundary
The original CLAUDE.md plan positioned this as parent SMS alerts (also referenced in the landing page's marketing copy: "Instant parent SMS alerts"). Actually **sending** SMS messages requires integrating a real SMS gateway (e.g. Twilio, or a Malaysian provider), has a real per-message cost, and needs a vendor/product decision that's out of scope for a code-only pass.

**Proposed scope for this plan:** build the **settings persistence** only — a place to save/load the SMS provider's API key and sender config, wired to `SetSmsApi.tsx`, so the page is no longer a dead-end UI. **Not included:** actually dispatching SMS messages on check-in/absence (that's a separate, bigger feature requiring a chosen provider and its SDK/API).

**Confirm:** OK to scope it that way (settings storage only), or do you want to pick an SMS provider now and build the actual sending pipeline too?

### 2.4 Parents Report security posture
`ReportController::parentStudentReport` is public, unauthenticated, and takes a raw 12-digit IC number with no rate limiting or CAPTCHA — meaning anyone who can guess or brute-force a valid student IC can pull that student's attendance report. No code changes proposed unless you want this hardened.

**Confirm:** leave as-is, or add basic protection (e.g. Laravel's built-in rate limiter on the route, `throttle:10,1`)? This is a small, low-risk addition if wanted.

### 2.5 Cleanup scope
Remove `AttendanceController::manualEntry()` + its route (`POST /api/attendance/manual`) since it's genuinely superseded and unused. Leave `QrController::generate`/`resolve` alone — those were deliberately fixed and kept as future-use utility endpoints in the prior plan, not dead code to delete.

**Confirm:** OK to remove `manualEntry()`, or leave it in case something external depends on it?

---

## 3. Implementation phases & checklists

### Phase A — Admin Dashboard wired for real
- [ ] `SchoolController::dashboardSummary()` → `GET /api/school/dashboard-summary`: total active users, teachers, staff, students, classrooms (classrooms scoped to active session, matching existing patterns).
- [ ] Register the route in `routes/web.php`.
- [ ] `Pages/Dashboard.tsx`: replace hardcoded `StatCard` values with the new endpoint's data.
- [ ] `Pages/Dashboard.tsx`: replace the `attendanceData` dummy object — fetch `GET /api/attendance/log?user_type=X&date=Y` per tab (student/teacher/staff), merge-and-filter client-side for the "late" tab.
- [ ] Manual check: verify counts match reality (cross-check against `/users/list`, `/academic/class`), verify each attendance tab matches what the equivalent role-specific dashboard already shows for today.

### Phase B — Event attendance tracking (new feature)
- [ ] Migration: `event_attendees` table (`event_id`, `user_type` enum, `user_id`, `check_in_time`, timestamps, unique on `event_id`+`user_type`+`user_id`).
- [ ] `EventAttendee` model.
- [ ] `EventController::scanAttendance(Request $request, $id)` → `POST /api/events/{id}/scan`, resolves `{ic_number, user_type}` the same way `AttendanceController`/`FacilityController` do, creates the attendee row (idempotent — already-checked-in returns a friendly duplicate response, not an error).
- [ ] Register the route in `routes/web.php`.
- [ ] New frontend page for scanning — camera-based, same `QrScanner` component/pattern as `FacilityCheckIn.tsx`. Routed from `Event.tsx` (e.g. a "Scan Attendance" button per event card → `/academic/event/:id/scan`).
- [ ] Fix `ReportController::eventReport()` — replace the stub with a real query against `event_attendees`, per the §2.2 "absent" decision.
- [ ] Manual check: create a test event, scan a real student/teacher/staff IC into it, confirm it shows up in the event report; confirm duplicate-scan handling.

### Phase C — SMS API settings persistence
- [ ] Migration: `sms_settings` table (or a single-row config approach — TBD based on whether multi-school supports different providers) — `school_id`, `provider`, `api_key`, `sender_id`, timestamps.
- [ ] `SmsSettingController` (or extend `SchoolController`) — `GET`/`POST` for saving and loading the config.
- [ ] Register routes in `routes/web.php`.
- [ ] `Pages/SetSmsApi.tsx`: wire the form to fetch/save via the new endpoint, add loading/success/error states matching the rest of the app's conventions.
- [ ] Explicitly **not** building: actual SMS dispatch logic. Note this clearly in the UI copy so it's not mistaken for a working alert system.

### Phase D — Small fixes / cleanup
- [ ] Remove `AttendanceController::manualEntry()` and its route (`POST /api/attendance/manual`), pending §2.5 confirmation.
- [ ] (If confirmed in §2.4) Add rate limiting to the parent report lookup route.
- [ ] (If confirmed) Wire `Faqs.tsx`'s "Contact Support" button, or confirm it's intentionally inert.

---

## 4. Files touched (summary)

**Backend**
- `app/Http/Controllers/SchoolController.php` — new `dashboardSummary()`
- `app/Http/Controllers/EventController.php` — new `scanAttendance()`
- `app/Http/Controllers/ReportController.php` — fix `eventReport()`
- `app/Http/Controllers/SmsSettingController.php` — **new**
- `app/Models/EventAttendee.php` — **new**
- `app/Models/SmsSetting.php` — **new**
- `database/migrations/xxxx_create_event_attendees_table.php` — **new**
- `database/migrations/xxxx_create_sms_settings_table.php` — **new**
- `routes/web.php` — new routes, remove `manualEntry` route

**Frontend**
- `Pages/Dashboard.tsx` — real stats + attendance tables
- `Pages/Academic/Event.tsx` — "Scan Attendance" entry point
- New event-scan page (path TBD, e.g. `Pages/Academic/EventScan.tsx`)
- `Pages/SetSmsApi.tsx` — real form wiring
- `resources/js/app.tsx` — new route(s) registered

---

## 5. Suggested build order
1. **Phase A** (Admin Dashboard) — highest visibility, purely additive, no new tables, lowest risk.
2. **Phase B** (Event attendance) — biggest lift (new table + new page), but self-contained.
3. **Phase C** (SMS settings) — independent, can slot in anywhere.
4. **Phase D** (cleanup) — trivial, do last or opportunistically alongside any of the above.

---

## 6. Open questions before implementation starts
- **§2.1** — confirm the reuse-first approach for the Admin Dashboard, or ask for a consolidated endpoint instead.
- **§2.2** — confirm event report's "absent" semantics: (a) present-only, or (b) computed against `participant_types` population.
- **§2.3** — confirm SMS phase scope is settings-storage-only (no real sending).
- **§2.4** — confirm whether the Parents Report lookup needs rate limiting.
- **§2.5** — confirm it's OK to delete `AttendanceController::manualEntry()`.
