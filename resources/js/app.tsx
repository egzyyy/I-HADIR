import '../css/app.css';
import './bootstrap';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

// Pages — No dropdown (single files)
import Welcome from './Pages/Welcome';
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

// Pages — Academic dropdown (folder)
import ClassPage from './Pages/Academic/Class';
import CoCurricular from './Pages/Academic/CoCurricular';
import Sport from './Pages/Academic/Sport';
import EventPage from './Pages/Academic/Event';

// Pages — Attendance Log dropdown (folder)
import CheckIn from './Pages/AttendanceLog/CheckIn';
import CheckOut from './Pages/AttendanceLog/CheckOut';
import TimeSetting from './Pages/AttendanceLog/TimeSetting';

// Pages — Admin (folder)
import AdminProfile from './Pages/Admin/AdminProfile';
import AdminAttendance from './Pages/Admin/AdminAttendance';
import AdminPassword from './Pages/Admin/AdminPassword';

// Pages — Check In (folder)
import FacilityCheckIn from './Pages/CheckIn/FacilityCheckIn';
import ManualEntry from './Pages/CheckIn/ManualEntry';

// Pages — Reports (folder)
import ParentsReport from './Pages/Reports/ParentsReport';

// Pages — Other
import Visitor from './Pages/Visitor';

const root = createRoot(document.getElementById('app')!);

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* School Management */}
      <Route path="/school-session" element={<SchoolSession />} />

      {/* SMS API */}
      <Route path="/set-sms-api" element={<SetSmsApi />} />

      {/* Users (dropdown) */}
      <Route path="/users/registration" element={<UserRegistration />} />
      <Route path="/users/apdm" element={<Apdm />} />
      <Route path="/users/list" element={<UserList />} />

      {/* Academic (dropdown) */}
      <Route path="/academic/class" element={<ClassPage />} />
      <Route path="/academic/co-curricular" element={<CoCurricular />} />
      <Route path="/academic/sport" element={<Sport />} />
      <Route path="/academic/event" element={<EventPage />} />

      {/* Attendance Log (dropdown) */}
      <Route path="/attendance-log/check-in" element={<CheckIn />} />
      <Route path="/attendance-log/check-out" element={<CheckOut />} />
      <Route path="/attendance-log/time-setting" element={<TimeSetting />} />

      {/* Check In */}
      <Route path="/facility-check-in" element={<FacilityCheckIn />} />
      <Route path="/manual-entry" element={<ManualEntry />} />

      {/* Reports */}
      <Route path="/attendance-reports" element={<AttendanceReports />} />
      <Route path="/general-report" element={<GeneralReport />} />

      {/* Support */}
      <Route path="/faqs" element={<Faqs />} />

      {/* Admin */}
      <Route path="/admin-profile" element={<AdminProfile />} />
      <Route path="/admin-attendance" element={<AdminAttendance />} />
      <Route path="/admin-password" element={<AdminPassword />} />

      {/* Other */}
      <Route path="/visitor" element={<Visitor />} />
      <Route path="/parents-report" element={<ParentsReport />} />
    </Routes>
  </BrowserRouter>
);
