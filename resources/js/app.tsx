import '../css/app.css';
import './bootstrap';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth, homeForRole, Role } from './contexts/AuthContext';

// Pages — No dropdown (single files)
import GeneralLanding from './Pages/GeneralLanding';
import SchoolLanding from './Pages/SchoolLanding';
import Login from './Pages/Auth/Login';
import Dashboard from './Pages/Dashboard';
import SchoolSession from './Pages/SchoolSession';
import SetSmsApi from './Pages/SetSmsApi';
import AttendanceReports from './Pages/Reports/AttendanceReports';
import GeneralReport from './Pages/Reports/GeneralReport';
import Faqs from './Pages/Faqs';

// Pages — Users dropdown (folder)
import UserRegistration from './Pages/Users/UserRegistration';
import Apdm from './Pages/Users/Apdm';
import UserList from './Pages/Users/UserList';
import VisitorList from './Pages/Users/VisitorList';

// Pages — Academic dropdown (folder)
import ClassPage from './Pages/Academic/Class';
import CoCurricular from './Pages/Academic/CoCurricular';
import Sport from './Pages/Academic/Sport';
import EventPage from './Pages/Academic/Event';
import EventScanPage from './Pages/Academic/EventScan';

// Pages — Attendance Log dropdown (folder)
import CheckIn from './Pages/AttendanceLog/CheckIn';
import TimeSetting from './Pages/AttendanceLog/TimeSetting';
import AttendanceLogList from './Pages/AttendanceLog/AttendanceLog';

// Pages — Admin (folder)
import MyProfile from './Pages/Admin/MyProfile';
import MyAttendance from './Pages/Admin/MyAttendance';
import ChangePassword from './Pages/Admin/ChangePassword';
import MyQrCode from './Pages/Admin/MyQrCode';
import LandingContent from './Pages/Admin/LandingContent';

// Pages — Check In (folder)
import FacilityCheckIn from './Pages/CheckIn/FacilityCheckIn';
import ManualEntry from './Pages/CheckIn/ManualEntry';

// Pages — Reports (folder)
import ParentsReport from './Pages/Reports/ParentsReport';

// Pages — Other
import Visitor from './Pages/Visitor';
import PublicScan from './Pages/PublicScan';

// Role groups for route access
const ALL: Role[] = ['Admin', 'Teacher', 'Security'];
const ADMIN: Role[] = ['Admin'];
const ADMIN_TEACHER: Role[] = ['Admin', 'Teacher'];
const ADMIN_SECURITY: Role[] = ['Admin', 'Security'];

// Guards a route: waits for auth, redirects to login if unauthenticated,
// or to the user's own home if their role isn't allowed here.
function RequireRole({ allow, children }: { allow: Role[]; children: JSX.Element }) {
  const { role, loading } = useAuth();

  // No cached/known role yet and still resolving → render nothing briefly.
  if (loading && !role) return null;
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to={homeForRole(role)} replace />;

  return children;
}

const root = createRoot(document.getElementById('app')!);

root.render(
  <BrowserRouter>
    <AuthProvider>
    <Routes>
      {/* Public */}
      <Route path="/" element={<GeneralLanding />} />
      <Route path="/school/:slug" element={<SchoolLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/visitor" element={<Visitor />} />
      <Route path="/scan" element={<PublicScan />} />
      <Route path="/parents-report" element={<ParentsReport />} />

      {/* Dashboard — all roles */}
      <Route path="/dashboard" element={<RequireRole allow={ALL}><Dashboard /></RequireRole>} />

      {/* School Management — admin only */}
      <Route path="/school-session" element={<RequireRole allow={ADMIN}><SchoolSession /></RequireRole>} />
      <Route path="/landing-content" element={<RequireRole allow={ADMIN}><LandingContent /></RequireRole>} />

      {/* SMS API — admin only */}
      <Route path="/set-sms-api" element={<RequireRole allow={ADMIN}><SetSmsApi /></RequireRole>} />

      {/* Users (dropdown) */}
      <Route path="/users/registration" element={<RequireRole allow={ADMIN}><UserRegistration /></RequireRole>} />
      <Route path="/users/apdm" element={<RequireRole allow={ADMIN}><Apdm /></RequireRole>} />
      <Route path="/users/list" element={<RequireRole allow={ADMIN_TEACHER}><UserList /></RequireRole>} />
      <Route path="/users/visitor-list" element={<RequireRole allow={ADMIN_SECURITY}><VisitorList /></RequireRole>} />

      {/* Academic (dropdown) */}
      <Route path="/academic/class" element={<RequireRole allow={ADMIN_TEACHER}><ClassPage /></RequireRole>} />
      <Route path="/academic/co-curricular" element={<RequireRole allow={ADMIN}><CoCurricular /></RequireRole>} />
      <Route path="/academic/sport" element={<RequireRole allow={ADMIN}><Sport /></RequireRole>} />
      <Route path="/academic/event" element={<RequireRole allow={ADMIN}><EventPage /></RequireRole>} />
      <Route path="/academic/event/:id/scan" element={<RequireRole allow={ADMIN}><EventScanPage /></RequireRole>} />

      {/* Attendance Log (dropdown) */}
      <Route path="/attendance-log" element={<RequireRole allow={ADMIN}><AttendanceLogList /></RequireRole>} />
      <Route path="/attendance-log/check-in" element={<RequireRole allow={ALL}><CheckIn /></RequireRole>} />
      <Route path="/attendance-log/check-out" element={<Navigate to="/attendance-log/check-in?mode=check-out" replace />} />
      <Route path="/attendance-log/time-setting" element={<RequireRole allow={ADMIN}><TimeSetting /></RequireRole>} />

      {/* Check In */}
      <Route path="/facility-check-in" element={<RequireRole allow={ADMIN_TEACHER}><FacilityCheckIn /></RequireRole>} />
      <Route path="/manual-entry" element={<RequireRole allow={ADMIN_TEACHER}><ManualEntry /></RequireRole>} />

      {/* Reports */}
      <Route path="/attendance-reports" element={<RequireRole allow={ADMIN_TEACHER}><AttendanceReports /></RequireRole>} />
      <Route path="/general-report" element={<RequireRole allow={ADMIN_TEACHER}><GeneralReport /></RequireRole>} />

      {/* Support — all roles */}
      <Route path="/faqs" element={<RequireRole allow={ALL}><Faqs /></RequireRole>} />

      {/* Personal account — all roles */}
      <Route path="/my-profile" element={<RequireRole allow={ALL}><MyProfile /></RequireRole>} />
      <Route path="/my-attendance" element={<RequireRole allow={ALL}><MyAttendance /></RequireRole>} />
      <Route path="/my-qr-code" element={<RequireRole allow={ALL}><MyQrCode /></RequireRole>} />
      <Route path="/change-password" element={<RequireRole allow={ALL}><ChangePassword /></RequireRole>} />
    </Routes>
    </AuthProvider>
  </BrowserRouter>
);
