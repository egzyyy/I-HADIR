import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Moon, Book, Monitor, ClipboardList, ChevronRight } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import ScannerCard from '../../Components/common/ScannerCard';
import ScanResultModal from '../../Components/common/ScanResultModal';

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
          <h2 className="text-3xl font-bold text-role mb-3">Facility Check In</h2>
          <p className="text-gray-500">Please select the facility you want to check in to</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {/* Prayer Card */}
          <div
            onClick={() => setSelectedType('prayer')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Moon size={32} className="text-role" />
            </div>
            <h3 className="text-lg font-bold text-role">Prayer</h3>
          </div>

          {/* PSS Card */}
          <div
            onClick={() => setSelectedType('pss')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Book size={32} className="text-role" />
            </div>
            <h3 className="text-lg font-bold text-role">PSS</h3>
          </div>

          {/* ICT Card */}
          <div
            onClick={() => setSelectedType('ict')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Monitor size={32} className="text-role" />
            </div>
            <h3 className="text-lg font-bold text-role">ICT</h3>
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
              <ClipboardList size={32} className="text-role" />
            </div>
            <h3 className="text-lg font-bold text-role">RMT</h3>
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
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-role transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ChevronRight size={16} className="rotate-180" /> Back to Selection
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h2 className="text-2xl font-bold text-role">{getTitle()} Scanner</h2>
        </div>

        <ScannerCard
          header={
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
                        ? 'bg-role text-white'
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
          onStart={() => { setScanning(true); setError(null); }}
          onStop={() => { setScanning(false); setError(null); }}
          onDismissError={() => setError(null)}
        />
      </motion.div>

      {result && (
        <ScanResultModal
          tone={result.duplicate ? 'warning' : 'success'}
          eyebrow={result.duplicate ? 'Already Checked In' : scanMode === 'check-out' ? 'Check-Out Recorded' : 'Check-In Recorded'}
          name={result.name}
          subtitle={result.class}
          time={result.time}
          badges={result.duration ? [{ label: result.duration, tone: 'success' }] : []}
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
