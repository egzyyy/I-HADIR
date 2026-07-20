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

### Phase A — Admin Dashboard wired for real ✅ (2026-07-15)
- [x] `SchoolController::dashboardSummary()` → `GET /api/school/dashboard-summary`: total active users, teachers, staff, students, classrooms (classrooms scoped to active session, matching existing patterns).
- [x] Registered the route in `routes/web.php`.
- [x] `Pages/Dashboard.tsx`: hardcoded `StatCard` values replaced with the new endpoint's data ('—' while loading).
- [x] `Pages/Dashboard.tsx`: `attendanceData` dummy object replaced — fetches `GET /api/attendance/log?user_type=X` once per type on mount; "late" tab is a client-side merge of the three tagged by type. Also wired while in there: real banner date + active session year, working name search, working Previous/Next pagination (10/page), Copy/CSV/Excel/PDF/Print exports on the filtered rows (same helpers as `MyAttendance.tsx`), status badge column, loading/empty states. Reason column now shows `reason_manual` from the log.
- [x] Smoke-tested via `tinker`: summary returns correct counts for the dev DB (5 users / 2 teachers / 2 staff / 1 student / 1 class); `getLog` shape confirmed against what the frontend consumes. `npm run build` passes.
- [ ] Manual check (on-device): cross-check counts against `/users/list` and `/academic/class`; verify tabs against the role-specific dashboards.

### Phase B — Event attendance tracking (new feature) ✅ (2026-07-15)
Confirmed §2.2 decision: **(a) present-only** — the report lists who checked in; no "absent" count.
- [x] Migration: `event_attendees` table (`event_id`, `user_type` enum, `user_id`, `check_in_time`, timestamps, unique on `event_id`+`user_type`+`user_id`). Migrated.
- [x] `EventAttendee` model.
- [x] `EventController::scanAttendance(Request $request, $id)` → `POST /api/events/{id}/scan`. Resolves `{ic_number, user_type}` with the same `resolveByIc` pattern as `FacilityController`; 409 friendly-duplicate response; additionally rejects (422) scanning a type the event's `participant_types` doesn't declare.
- [x] Route registered in `routes/web.php`.
- [x] New `Pages/Academic/EventScan.tsx` (`/academic/event/:id/scan`, admin-only) — event summary strip, participant-type toggle limited to the event's declared types (parents excluded — no IC to resolve), `QrScanner` + result modal per `FacilityCheckIn.tsx` conventions. Entry point: new "Scan Attendance" (scan-line icon) action button on each `Event.tsx` row.
- [x] `ReportController::eventReport()` — real query against `event_attendees` with name/class resolution (student class from active-session enrollment); returns `stats.present` + rows in the exact shape `GeneralReport.tsx` already consumes (`time_out` is '-' since event attendance is check-in only). Stale "Feature pending" empty-state copy updated.
- [x] Smoke-tested via `tinker`: scan → recorded; duplicate → 409 with name/time; undeclared type → 422; report returns the row with correct class/date/time. Test event + attendee cleaned up. `npm run build` passes.
- [ ] Manual check (on-device): scan a printed/on-screen QR into a real event from the new page, confirm it appears in General Report → Event tab.

### Phase C — SMS API settings persistence — ⏸ ON HOLD (Harith, 2026-07-15)
Deferred entirely per Harith: "This we hold first, no need to do for now." Nothing built —
`SetSmsApi.tsx` remains a static UI. Revisit when an SMS provider decision is made.

### Phase D — Small fixes / cleanup ✅ (2026-07-15, all three confirmed by Harith)
- [x] Removed the `POST /api/attendance/manual` route. (The `manualEntry()` method itself no
  longer existed in `AttendanceController` — the route pointed at a nonexistent method and
  would have 500'd if ever called. Repo-wide grep confirmed no frontend caller.)
- [x] Added `throttle:10,1` to `POST /api/reports/parent-student` (confirmed via `route:list -v`).
- [x] Wired `Faqs.tsx`'s "Contact Support" button as a `mailto:info@ihadir.edu` link with a
  prefilled subject — same support address the landing page's Contact section publishes.

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
