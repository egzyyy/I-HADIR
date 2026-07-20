import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../Components/landing/Navbar';
import ScannerCard from '../Components/common/ScannerCard';
import ScanResultModal, { ScanResultBadge } from '../Components/common/ScanResultModal';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Public kiosk scanner (no login required) — reached from the landing page
// navbar. Params decide what a scan records:
//   /scan?mode=check-in&type=student          → daily attendance
//   /scan?mode=check-out&type=staff           → daily attendance (security staff)
//   /scan?facility=pss&mode=check-in          → facility log (students)

type ScanMode = 'check-in' | 'check-out';

type ScanResult = {
  success: boolean;
  name: string;
  class: string;
  time: string;
  status?: string;
  message: string;
  duration?: string;
  duplicate?: boolean;
};

const FACILITY_LABELS: Record<string, string> = {
  prayer: 'Prayer',
  pss: 'PSS',
  ict: 'ICT',
  rmt: 'RMT',
};

const statusTone: Record<string, ScanResultBadge['tone']> = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
};

export default function PublicScan() {
  const [searchParams] = useSearchParams();

  const mode: ScanMode = searchParams.get('mode') === 'check-out' ? 'check-out' : 'check-in';
  const facility = searchParams.get('facility');
  const isFacility = !!facility && facility in FACILITY_LABELS;
  // Attendance scans: student (default) or staff (security). Facility scans are student-only.
  const userType = searchParams.get('type') === 'staff' ? 'staff' : 'student';
  // School slug carried from the school landing page's navbar, so "back" returns there.
  const school = searchParams.get('school');
  const backHref = school ? `/school/${school}` : '/';

  const title = isFacility
    ? `${FACILITY_LABELS[facility!]} ${mode === 'check-out' ? 'Check Out' : 'Check In'}`
    : `${userType === 'staff' ? 'Security Staff' : 'Student'} ${mode === 'check-out' ? 'Check Out' : 'Check In'}`;

  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isFacility
        ? `/api/facility/${mode}`
        : `/api/attendance/${mode}`;
      const payload = isFacility
        ? { ic_number: decoded.trim(), user_type: 'student', facility_type: facility }
        : { ic_number: decoded.trim(), user_type: userType };

      const res = await axios.post(endpoint, payload);
      setResult(res.data);
    } catch (err: any) {
      const data = err.response?.data;
      if (err.response?.status === 409) {
        setResult({ ...data, success: false });
      } else {
        setError(data?.message ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfafa] font-sans">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1c3068] text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> {school ? 'Back to school page' : 'Back to home'}
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#1c3068] mb-2">{title}</h1>
          <p className="text-gray-500">Show the QR code to the camera to record {mode === 'check-out' ? 'check-out' : 'check-in'}.</p>
        </div>

        <ScannerCard
          scanning={scanning}
          loading={loading}
          error={error}
          onScan={handleScan}
          onStart={() => { setScanning(true); setError(null); }}
          onStop={() => { setScanning(false); setError(null); }}
          onDismissError={() => setError(null)}
        />
      </div>

      {result && (
        <ScanResultModal
          tone={result.duplicate ? 'warning' : 'success'}
          eyebrow={result.duplicate ? 'Already Recorded' : mode === 'check-out' ? 'Check-Out Recorded' : 'Check-In Recorded'}
          name={result.name}
          subtitle={result.class}
          time={result.time}
          badges={[
            ...(result.status ? [{ label: result.status, tone: statusTone[result.status], variant: 'pill' as const }] : []),
            ...(result.duration ? [{ label: result.duration, tone: 'success' as const }] : []),
          ]}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
