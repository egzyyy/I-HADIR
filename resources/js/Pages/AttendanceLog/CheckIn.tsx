import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import ScannerCard from '../../Components/common/ScannerCard';
import ScanResultModal, { ScanResultTone } from '../../Components/common/ScanResultModal';
import { useAuth } from '../../contexts/AuthContext';

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
  status?: 'present' | 'late' | 'absent';
  time: string;
  message: string;
  duplicate?: boolean;
  completed?: boolean;
};

const statusTone: Record<NonNullable<ScanResult['status']>, ScanResultTone> = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
};

const statusLabel: Record<NonNullable<ScanResult['status']>, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AttendanceScan = () => {
  const { role } = useAuth();
  const userType = role === 'Teacher' ? 'teacher' : role === 'Security' ? 'staff' : 'student';
  const scanTargetLabel = role === 'Teacher' || role === 'Security' ? 'your' : "a student's";

  // Deep-link support (used by dashboard quick actions): ?mode=check-out
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');

  const [scanMode, setScanMode] = useState<ScanMode>(modeParam === 'check-out' ? 'check-out' : 'check-in');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ScanResult | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Security staff pick a shift before scanning in — check-out auto-detects, no picker.
  const isSecurity = role === 'Security';
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftsLoaded, setShiftsLoaded] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  useEffect(() => {
    if (!isSecurity) return;
    axios.get('/api/shifts/active')
      .then(res => setShifts(res.data.data))
      .finally(() => setShiftsLoaded(true));
  }, [isSecurity]);

  const stillLoadingShifts = isSecurity && scanMode === 'check-in' && !shiftsLoaded && !selectedShiftId;
  const needsShiftPick = isSecurity && scanMode === 'check-in' && shiftsLoaded && shifts.length > 0 && !selectedShiftId;

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`/api/attendance/${scanMode}`, {
        ic_number: decoded.trim(),
        user_type: userType,
        ...(isSecurity && scanMode === 'check-in' ? { shift_id: selectedShiftId } : {}),
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

  const modeToggle = (
    <div className="mb-6 flex justify-end">
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        {(['check-in', 'check-out'] as ScanMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setScanMode(m); setScanning(false); setError(null); setResult(null); }}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              scanMode === m
                ? 'bg-[#1c3068] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {m === 'check-in' ? 'Check In' : 'Check Out'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c3068]">Scan Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">
            Point the camera at {scanTargetLabel} QR code to record {scanMode === 'check-out' ? 'check-out' : 'check-in'}.
          </p>
        </div>

        {stillLoadingShifts ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : needsShiftPick ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {modeToggle}
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
              <>
                {modeToggle}
                {isSecurity && scanMode === 'check-in' && selectedShiftId && (
                  <div className="mb-4 flex items-center justify-between text-sm bg-[#1c3068]/5 border border-[#1c3068]/10 rounded-xl px-4 py-2.5">
                    <span className="text-gray-600">
                      Checking in for <strong className="text-[#1c3068]">{shifts.find(s => s.id === selectedShiftId)?.name}</strong>
                    </span>
                    <button onClick={() => setSelectedShiftId(null)} className="text-[#1c3068] font-semibold hover:underline">
                      Change
                    </button>
                  </div>
                )}
              </>
            }
            scanning={scanning}
            loading={loading}
            error={error}
            onScan={handleScan}
            onStart={() => { setScanning(true); setError(null); setResult(null); }}
            onStop={() => { setScanning(false); setError(null); }}
            onDismissError={() => setError(null)}
          />
        )}
      </motion.div>

      {/* Result modal */}
      <AnimatePresence>
        {result && (
          scanMode === 'check-in' ? (
            result.duplicate ? (
              <ScanResultModal
                tone="warning"
                eyebrow={result.completed ? 'Attendance Completed' : 'Already Checked In'}
                name={result.name}
                subtitle={result.class}
                time={result.time}
                badges={[{ label: result.completed ? 'In & Out Done' : 'Duplicate' }]}
                onClose={() => setResult(null)}
              />
            ) : (
              <ScanResultModal
                tone={statusTone[result.status ?? 'present']}
                eyebrow="Check-In Recorded"
                name={result.name}
                subtitle={result.class}
                time={result.time}
                badges={[{ label: statusLabel[result.status ?? 'present'] }]}
                onClose={() => setResult(null)}
              />
            )
          ) : (
            <ScanResultModal
              tone={result.duplicate ? 'warning' : 'success'}
              eyebrow={result.duplicate ? 'Already Checked Out' : 'Check-Out Recorded'}
              name={result.name}
              subtitle={result.class}
              time={result.time}
              badges={[{ label: result.duplicate ? 'Duplicate' : 'Checked Out' }]}
              onClose={() => setResult(null)}
            />
          )
        )}
      </AnimatePresence>
    </>
  );
};

export default function CheckInPage() {
  return (
    <DashboardLayout activePageId="check-in">
      <AttendanceScan />
    </DashboardLayout>
  );
}
