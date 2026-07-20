import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode, Clock, ChevronRight, CheckCircle, XCircle, AlertTriangle, X,
  Calendar, MapPin, GraduationCap, Users, Briefcase
} from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import QrScanner from '../../Components/common/QrScanner';

type ScanType = 'student' | 'teacher' | 'staff';

interface EventItem {
  id: number;
  name: string;
  date: string;
  time: string | null;
  spot: string;
  participantTypes: string[];
}

type ScanResult = {
  success: boolean;
  name: string;
  class: string;
  time: string;
  message: string;
  duplicate?: boolean;
};

const TYPE_META: { key: ScanType; label: string; icon: any }[] = [
  { key: 'student', label: 'Student', icon: GraduationCap },
  { key: 'teacher', label: 'Teacher', icon: Users },
  { key: 'staff', label: 'Staff', icon: Briefcase },
];

// ─── Result Modal (same conventions as FacilityCheckIn) ──────────────────────
const ResultModal = ({ result, onClose }: { result: ScanResult; onClose: () => void }) => {
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
              {isDuplicate ? 'Already Checked In' : 'Attendance Recorded'}
            </p>
            <p className="text-xl font-black text-[#1c3068]">{result.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{result.class}</p>
          </div>
          <div className={`w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm text-gray-500 ${isDuplicate ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <Clock size={14} />
            <span>{result.time}</span>
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

const EventScan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [scanType, setScanType] = useState<ScanType>('student');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scannable types = the event's declared participants, minus 'parent'
  // (parents have no IC record in the system to resolve against).
  const scanTypes = TYPE_META.filter((t) => event?.participantTypes?.includes(t.key));

  useEffect(() => {
    axios.get('/api/events')
      .then((res) => {
        const found = (res.data.data ?? []).find((e: EventItem) => String(e.id) === id);
        setEvent(found ?? null);
        const firstType = TYPE_META.find((t) => found?.participantTypes?.includes(t.key));
        if (firstType) setScanType(firstType.key);
      })
      .catch(() => setEvent(null))
      .finally(() => setLoadingEvent(false));
  }, [id]);

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/api/events/${id}/scan`, {
        ic_number: decoded.trim(),
        user_type: scanType,
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

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#1c3068] font-bold animate-pulse">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle size={48} className="text-gray-300" />
        <p className="text-gray-500">Event not found.</p>
        <button
          onClick={() => navigate('/academic/event')}
          className="px-6 py-2.5 bg-[#1c3068] text-white rounded-xl font-semibold hover:bg-[#152450] transition-all text-sm"
        >
          Back to Event List
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-full mx-auto"
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/academic/event')}
            className="text-gray-500 hover:text-[#1c3068] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ChevronRight size={16} className="rotate-180" /> Back to Event List
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h2 className="text-2xl font-bold text-[#1c3068]">Event Attendance Scanner</h2>
        </div>

        {/* Event summary strip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Scanning for</p>
            <p className="text-xl font-black text-[#c53336]">{event.name}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-[#1c3068]" /> {event.date}{event.time ? `, ${event.time}` : ''}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-[#1c3068]" /> {event.spot}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="p-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">QR Scanner</h3>
                <p className="text-gray-500 text-sm mt-1">Select the participant type, then scan their QR code.</p>
              </div>
              {/* Participant type toggle — limited to the event's declared types */}
              {scanTypes.length > 0 ? (
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {scanTypes.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => { setScanType(t.key); setError(null); }}
                        className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                          scanType === t.key
                            ? 'bg-[#1c3068] text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={15} /> {t.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-2">
                  This event only lists parents as participants — there is nothing to scan.
                </p>
              )}
            </div>

            {scanTypes.length > 0 && (
              !scanning ? (
                <div className="bg-gray-50/50 border-0 rounded-xl h-[600px] flex flex-col items-center justify-center gap-4 text-gray-400">
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
                  <div className="relative min-h-[600px]">
                    {loading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-xl">
                        <div className="w-10 h-10 border-4 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <QrScanner onScan={handleScan} active={scanning} qrboxSize={280} />
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
              )
            )}
          </div>
        </div>
      </motion.div>

      {result && (
        <ResultModal result={result} onClose={() => setResult(null)} />
      )}
    </>
  );
};

export default function EventScanPage() {
  return (
    <DashboardLayout activePageId="event">
      <EventScan />
    </DashboardLayout>
  );
}
