import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight, XCircle,
  Calendar, MapPin, GraduationCap, Users, Briefcase
} from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import ScannerCard from '../../Components/common/ScannerCard';
import ScanResultModal from '../../Components/common/ScanResultModal';

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
        <div className="text-role font-bold animate-pulse">Loading event...</div>
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
          className="px-6 py-2.5 bg-role text-white rounded-xl font-semibold hover:bg-role-dark transition-all text-sm"
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
        className="max-w-3xl mx-auto"
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/academic/event')}
            className="text-gray-500 hover:text-role transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ChevronRight size={16} className="rotate-180" /> Back to Event List
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h2 className="text-2xl font-bold text-role">Event Attendance Scanner</h2>
        </div>

        {/* Event summary strip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Scanning for</p>
            <p className="text-xl font-black text-[#c53336]">{event.name}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-role" /> {event.date}{event.time ? `, ${event.time}` : ''}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-role" /> {event.spot}
          </div>
        </div>

        <ScannerCard
          header={
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
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
                        className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${scanType === t.key
                          ? 'bg-role text-white'
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
          }
          showScanner={scanTypes.length > 0}
          scanning={scanning}
          loading={loading}
          error={error}
          onScan={handleScan}
          onStart={() => { setScanning(true); setError(null); }}
          onStop={() => { setScanning(false); setError(null); }}
          onDismissError={() => setError(null)}
        />
      </motion.div>

      {result && (
        <ScanResultModal
          tone={result.duplicate ? 'warning' : 'success'}
          eyebrow={result.duplicate ? 'Already Checked In' : 'Attendance Recorded'}
          name={result.name}
          subtitle={result.class}
          time={result.time}
          onClose={() => setResult(null)}
        />
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
