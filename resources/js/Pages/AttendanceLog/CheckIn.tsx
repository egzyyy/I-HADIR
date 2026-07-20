import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import ScannerCard from '../../Components/common/ScannerCard';
import ScanResultModal, { ScanResultTone } from '../../Components/common/ScanResultModal';
import { useAuth } from '../../contexts/AuthContext';

type ScanMode = 'check-in' | 'check-out';

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

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`/api/attendance/${scanMode}`, {
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
          <p className="text-gray-500 text-sm mt-1">
            Point the camera at {scanTargetLabel} QR code to record {scanMode === 'check-out' ? 'check-out' : 'check-in'}.
          </p>
        </div>

        <ScannerCard
          header={
            <div className="mb-6 flex justify-end">
              {/* Check-in / Check-out toggle */}
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
          }
          scanning={scanning}
          loading={loading}
          error={error}
          onScan={handleScan}
          onStart={() => { setScanning(true); setError(null); setResult(null); }}
          onStop={() => { setScanning(false); setError(null); }}
          onDismissError={() => setError(null)}
        />
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
