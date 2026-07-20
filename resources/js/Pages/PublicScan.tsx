import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, X, ArrowLeft, QrCode,
} from 'lucide-react';
import axios from 'axios';
import { Navbar } from '../Components/landing/Navbar';
import QrScanner from '../Components/common/QrScanner';

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

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    present: 'bg-green-50 text-green-700',
    late: 'bg-yellow-50 text-yellow-700',
    absent: 'bg-red-50 text-red-700',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600';
};

const ResultModal = ({ result, mode, onClose }: { result: ScanResult; mode: ScanMode; onClose: () => void }) => {
  const isDuplicate = result.duplicate;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className={`h-2 w-full ${isDuplicate ? 'bg-yellow-400' : 'bg-green-400'}`} />
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDuplicate ? 'bg-yellow-50' : 'bg-green-50'}`}>
            {isDuplicate
              ? <AlertTriangle size={32} className="text-yellow-500" />
              : <CheckCircle size={32} className="text-green-500" />
            }
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              {isDuplicate ? 'Already Recorded' : mode === 'check-out' ? 'Check-Out Recorded' : 'Check-In Recorded'}
            </p>
            <p className="text-xl font-black text-[#1c3068]">{result.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{result.class}</p>
          </div>
          <div className={`w-full rounded-xl px-4 py-3 flex items-center justify-between ${isDuplicate ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>{result.time}</span>
            </div>
            {result.status && (
              <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${statusBadgeClass(result.status)}`}>
                {result.status}
              </span>
            )}
            {result.duration && (
              <span className="text-sm font-bold text-green-600">{result.duration}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1c3068] text-white rounded-xl font-semibold hover:bg-[#152450] transition-all"
          >
            Continue Scanning
          </button>
        </div>
      </motion.div>
    </div>
  );
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
          {!scanning ? (
            <div className="bg-gray-50/50 rounded-xl h-[480px] flex flex-col items-center justify-center gap-4 text-gray-400">
              <QrCode size={48} className="text-gray-300" />
              <p className="text-sm">Camera is off</p>
              <button
                onClick={() => { setScanning(true); setError(null); }}
                className="px-6 py-2.5 bg-[#1c3068] text-white rounded-xl font-semibold hover:bg-[#152450] transition-all text-sm"
              >
                Start Scanner
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative min-h-[480px]">
                {loading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-xl">
                    <div className="w-10 h-10 border-4 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <QrScanner onScan={handleScan} active={scanning} />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                  <XCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-sm text-red-600 flex-1">{error}</p>
                  <button onClick={() => setError(null)}><X size={16} className="text-red-400" /></button>
                </div>
              )}

              <button
                onClick={() => { setScanning(false); setError(null); }}
                className="w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Stop Scanner
              </button>
            </div>
          )}
        </div>
      </div>

      {result && (
        <ResultModal result={result} mode={mode} onClose={() => setResult(null)} />
      )}
    </div>
  );
}
