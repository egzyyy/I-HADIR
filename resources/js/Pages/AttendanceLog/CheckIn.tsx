import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, CheckCircle, XCircle, Clock, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import QrScanner from '../../Components/common/QrScanner';
import { useAuth } from '../../contexts/AuthContext';

type ScanResult = {
  success: boolean;
  name: string;
  class: string;
  status: 'present' | 'late' | 'absent';
  time: string;
  message: string;
  duplicate?: boolean;
};

const statusConfig = {
  present: { color: 'text-green-600',  bg: 'bg-green-50',  ring: 'ring-green-200', icon: CheckCircle,   label: 'Present',  iconColor: 'text-green-500' },
  late:    { color: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200', icon: AlertTriangle, label: 'Late',     iconColor: 'text-yellow-500' },
  absent:  { color: 'text-red-600',    bg: 'bg-red-50',    ring: 'ring-red-200',    icon: XCircle,       label: 'Absent',   iconColor: 'text-red-500' },
};

// ─── Success Modal ────────────────────────────────────────────────────────────
const ResultModal = ({ result, onClose }: { result: ScanResult; onClose: () => void }) => {
  const cfg = statusConfig[result.status] ?? statusConfig.present;
  const Icon = cfg.icon;
  const isDuplicate = result.duplicate;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Coloured top bar */}
        <div className={`h-2 w-full ${isDuplicate ? 'bg-yellow-400' : cfg.bg.replace('bg-', 'bg-').replace('50', '400')}`} />

        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDuplicate ? 'bg-yellow-50' : cfg.bg}`}>
            {isDuplicate
              ? <AlertTriangle size={32} className="text-yellow-500" />
              : <Icon size={32} className={cfg.iconColor} />
            }
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              {isDuplicate
                ? ((result as any).completed ? 'Attendance Completed' : 'Already Checked In')
                : 'Check-In Recorded'}
            </p>
            <p className="text-xl font-black text-[#1c3068]">{result.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{result.class}</p>
          </div>

          <div className={`w-full rounded-xl px-4 py-3 flex items-center justify-between ${isDuplicate ? 'bg-yellow-50' : cfg.bg}`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>{result.time}</span>
            </div>
            {!isDuplicate && (
              <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
            )}
            {isDuplicate && (
              <span className="text-sm font-bold text-yellow-600">
                {(result as any).completed ? 'In & Out Done' : 'Duplicate'}
              </span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const AttendanceCheckIn = () => {
  const { role } = useAuth();
  const userType = role === 'Teacher' ? 'teacher' : role === 'Security' ? 'staff' : 'student';
  const scanTargetLabel = role === 'Teacher' || role === 'Security' ? 'your' : "a student's";

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ScanResult | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/attendance/check-in', {
        ic_number: decoded.trim(),
        user_type: userType,
      });
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
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c3068]">Scan Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">Point the camera at {scanTargetLabel} QR code to record check-in.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            {!scanning ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-24 h-24 rounded-2xl bg-[#1c3068]/5 flex items-center justify-center">
                  <QrCode size={48} className="text-[#1c3068]" />
                </div>
                <p className="text-gray-500 text-sm">Camera is off</p>
                <button
                  onClick={() => { setScanning(true); setError(null); setResult(null); }}
                  className="px-8 py-3 bg-[#1c3068] text-white rounded-xl font-semibold hover:bg-[#152450] transition-all"
                >
                  Start Scanner
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scanner — tall box */}
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
      </motion.div>

      {/* Result modal */}
      <AnimatePresence>
        {result && (
          <ResultModal result={result} onClose={() => setResult(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default function CheckInPage() {
  return (
    <DashboardLayout activePageId="check-in">
      <AttendanceCheckIn />
    </DashboardLayout>
  );
}
