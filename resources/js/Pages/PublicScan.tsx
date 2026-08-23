import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
//   /scan?mode=check-out&type=staff           → daily attendance (security staff, shift picker)
//   /scan?mode=check-out&type=general-staff   → daily attendance (non-security staff, no shift picker)
//   /scan?facility=pss&mode=check-in          → facility log (students)

type ScanMode = 'check-in' | 'check-out';

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
};

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
  // Attendance scans: student (default), staff (security), or general-staff (non-security).
  // Both staff variants resolve to the same backend user_type — the split only affects
  // the label and whether the shift picker shows.
  const typeParam = searchParams.get('type');
  const isGeneralStaff = typeParam === 'general-staff';
  const userType = typeParam === 'staff' || isGeneralStaff ? 'staff' : 'student';
  // School slug carried from the school landing page's navbar, so "back" returns there.
  const school = searchParams.get('school');
  const backHref = school ? `/school/${school}` : '/';

  const title = isFacility
    ? `${FACILITY_LABELS[facility!]} ${mode === 'check-out' ? 'Check Out' : 'Check In'}`
    : `${isGeneralStaff ? 'Staff' : userType === 'staff' ? 'Security Staff' : 'Student'} ${mode === 'check-out' ? 'Check Out' : 'Check In'}`;

  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Security staff pick a shift before scanning in — check-out auto-detects, no picker.
  // General staff skip this entirely and go straight to scanning, like students/teachers.
  const needsShift = !isFacility && userType === 'staff' && !isGeneralStaff && mode === 'check-in';
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftsLoaded, setShiftsLoaded] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  useEffect(() => {
    if (!needsShift) return;
    axios.get('/api/shifts/active')
      .then(res => setShifts(res.data.data))
      .finally(() => setShiftsLoaded(true));
  }, [needsShift]);

  const showShiftPicker = needsShift && shiftsLoaded && shifts.length > 0 && !selectedShiftId;

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isFacility
        ? `/api/facility/${mode}`
        : `/api/attendance/${mode}`;
      const payload = isFacility
        ? { ic_number: decoded.trim(), user_type: 'student', facility_type: facility }
        : { ic_number: decoded.trim(), user_type: userType, ...(needsShift ? { shift_id: selectedShiftId } : {}) };

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

        {needsShift && !shiftsLoaded ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : showShiftPicker ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-[#1c3068]" />
              <h3 className="font-bold text-[#1c3068]">Which shift are you checking in for?</h3>
            </div>
            <div className="space-y-2">
              {shifts.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShiftId(s.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-[#1c3068] hover:bg-[#1c3068]/5 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {s.startTime}–{s.endTime}{s.isOvernight ? ' (overnight)' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScannerCard
            header={
              needsShift && selectedShiftId ? (
                <div className="mb-4 flex items-center justify-between text-sm bg-[#1c3068]/5 border border-[#1c3068]/10 rounded-xl px-4 py-2.5">
                  <span className="text-gray-600">
                    Checking in for <strong className="text-[#1c3068]">{shifts.find(s => s.id === selectedShiftId)?.name}</strong>
                  </span>
                  <button onClick={() => setSelectedShiftId(null)} className="text-[#1c3068] font-semibold hover:underline">
                    Change
                  </button>
                </div>
              ) : undefined
            }
            scanning={scanning}
            loading={loading}
            error={error}
            onScan={handleScan}
            onStart={() => { setScanning(true); setError(null); }}
            onStop={() => { setScanning(false); setError(null); }}
            onDismissError={() => setError(null)}
          />
        )}
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
