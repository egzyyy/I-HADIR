import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { QrCode, Users, GraduationCap, Briefcase, User, MapPin, Clock, Calendar, Moon, Book, Monitor, ClipboardList, ChevronRight, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import QrScanner from '../../Components/common/QrScanner';

// Changed 'activity' to 'rmt' to match backend expectation exactly
type FacilityType = 'prayer' | 'pss' | 'ict' | 'rmt';
type ScanMode = 'check-in' | 'check-out';

type ScanResult = {
  success: boolean;
  name: string;
  class: string;
  time: string;
  message: string;
  duration?: string;
  duplicate?: boolean;
};

// ─── Result Modal ─────────────────────────────────────────────────────────────
const ResultModal = ({ result, mode, onClose }: { result: ScanResult; mode: ScanMode; onClose: () => void }) => {
  const isDuplicate = result.duplicate;
  const isCheckOut  = mode === 'check-out';

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
              {isDuplicate ? 'Already Checked In' : isCheckOut ? 'Check-Out Recorded' : 'Check-In Recorded'}
            </p>
            <p className="text-xl font-black text-[#1c3068]">{result.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{result.class}</p>
          </div>
          <div className={`w-full rounded-xl px-4 py-3 flex items-center justify-between ${isDuplicate ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>{result.time}</span>
            </div>
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

const FacilityCheckIn = () => {
  // Deep-link support (used by the landing page navbar): ?type=prayer&mode=check-out
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const modeParam = searchParams.get('mode');

  const [selectedType, setSelectedType] = useState<FacilityType | null>(
    ['prayer', 'pss', 'ict', 'rmt'].includes(typeParam ?? '') ? (typeParam as FacilityType) : null
  );
  const [scanMode, setScanMode]         = useState<ScanMode>(modeParam === 'check-out' ? 'check-out' : 'check-in');
  const [scanning, setScanning]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<ScanResult | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const handleScan = async (decoded: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = scanMode === 'check-in' ? '/api/facility/check-in' : '/api/facility/check-out';
      const res = await axios.post(endpoint, {
        ic_number:     decoded.trim(),
        user_type:     'student', // Currently defaulting to student per QR logic
        facility_type: selectedType,
      });
      setResult(res.data);
    } catch (err: any) {
      const data = err.response?.data;
      if (err.response?.status === 409) {
        setResult({ ...data, success: false });
      } else {
        // If it's 403 (RMT block), it will show up cleanly here
        setError(data?.message ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setScanning(false);
    setResult(null);
    setError(null);
  };

  if (!selectedType) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[500px]"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1c3068] mb-3">Facility Check In</h2>
          <p className="text-gray-500">Please select the facility you want to check in to</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {/* Prayer Card */}
          <div 
            onClick={() => setSelectedType('prayer')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Moon size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">Prayer</h3>
          </div>

          {/* PSS Card */}
          <div 
            onClick={() => setSelectedType('pss')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Book size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">PSS</h3>
          </div>

          {/* ICT Card */}
          <div 
            onClick={() => setSelectedType('ict')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Monitor size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">ICT</h3>
          </div>

          {/* RMT Card */}
          <div
            onClick={() => setSelectedType('rmt')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              Students Only
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 mt-2">
              <ClipboardList size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">RMT</h3>
          </div>
        </div>
      </motion.div>
    );
  }

  const getTitle = () => {
    switch(selectedType) {
      case 'prayer': return 'Prayer Log';
      case 'pss': return 'PSS Log';
      case 'ict': return 'ICT Log';
      case 'rmt': return 'RMT Log';
      default: return 'Log';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-full mx-auto"
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-[#1c3068] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ChevronRight size={16} className="rotate-180" /> Back to Selection
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h2 className="text-2xl font-bold text-[#1c3068]">{getTitle()} Scanner</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="p-8">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">QR Scanner</h3>
                <p className="text-gray-500 text-sm mt-1">Please show your QR Code to check in or out.</p>
              </div>
              {/* Check-in / Check-out toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['check-in', 'check-out'] as ScanMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setScanMode(m); setScanning(false); setError(null); }}
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

            {!scanning ? (
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
            )}
          </div>
        </div>
      </motion.div>

      {result && (
        <ResultModal
          result={result}
          mode={scanMode}
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
};

export default function FacilityCheckInPage() {
  return (
    <DashboardLayout activePageId="facility-check-in">
      <FacilityCheckIn />
    </DashboardLayout>
  );
}