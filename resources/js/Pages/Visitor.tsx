import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  UserPlus,
  ClipboardList,
  ChevronDown,
  LogOut,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Search,
  QrCode,
  Camera,
  Download,
  X,
  ScanLine,
} from 'lucide-react';
import bgImage from '../assets/3379b4a489c00147d1f88ca87c8a0a3a3769dc13.png';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

type ScanTarget = 'entrance' | 'prayer' | 'pss' | 'ict';
type ScanMode = 'check-in' | 'check-out';

const SCAN_TARGETS: { key: ScanTarget; label: string }[] = [
  { key: 'entrance', label: 'School Entrance' },
  { key: 'prayer', label: 'Prayer (Surau)' },
  { key: 'pss', label: 'PSS (Library)' },
  { key: 'ict', label: 'ICT Lab' },
];

export default function Visitor() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  // ─── IC Lookup States ─────────────────────────────────────────────────────
  const [lookupIc, setLookupIc] = useState('');
  const [isCheckingIc, setIsCheckingIc] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // ─── Form States ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    icNumber: '',
    name: '',
    phone: '',
    plateNumber: '',
    category: '',
    personToMeet: '',
    passBadgeNo: '',
    purpose: '',
    notes: '',
  });

  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── QR Pass Modal States ─────────────────────────────────────────────────
  const [qrModalData, setQrModalData] = useState<{
    name: string;
    icNumber: string;
    payload: string;
    isNewVisitor: boolean;
  } | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Camera Scanner Modal States ──────────────────────────────────────────
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget>('entrance');
  const [scanMode, setScanMode] = useState<ScanMode>('check-in');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    name?: string;
    time?: string;
  } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanBusyRef = useRef(false);
  const scanTargetRef = useRef<ScanTarget>(scanTarget);
  const scanModeRef = useRef<ScanMode>(scanMode);

  useEffect(() => {
    scanTargetRef.current = scanTarget;
  }, [scanTarget]);

  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  // ─── Other Modal States ───────────────────────────────────────────────────
  const [showCheckOutSuccess, setShowCheckOutSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkOutConfirm, setCheckOutConfirm] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: '',
  });

  // 1. Fetch active visitors currently in premise
  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/visitors');
      if (response.data.success) {
        setRecentVisitors(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Render QR code on canvas whenever qrModalData opens
  useEffect(() => {
    if (qrModalData && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrModalData.payload, {
        width: 220,
        margin: 2,
        color: { dark: '#1c3068', light: '#ffffff' },
      });
    }
  }, [qrModalData]);

  // Stop camera cleanly if scanner modal closes or component unmounts
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isScannerOpen && !scanResult) {
      startCamera();
    } else if (!isScannerOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  // Reusable IC lookup (used by manual Check IC form)
  const lookupVisitorByIc = async (rawIc: string) => {
    const cleaned = rawIc.replace(/\D/g, '');
    if (cleaned.length < 6) {
      setErrorMsg('Please enter a valid IC number to check.');
      return;
    }

    setLookupIc(cleaned);
    setIsCheckingIc(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/visitors/check-ic', { ic_number: cleaned });
      if (res.data.found && res.data.visitor) {
        if (res.data.in_premise) {
          setLookupStatus('idle');
          setLookupMessage(null);
          setErrorMsg(
            `${res.data.visitor.name} (${res.data.visitor.ic_number}) is already checked in to the school premise. Please check out first.`
          );
          return;
        }

        setLookupStatus('found');
        setLookupMessage(`Found registered visitor IC (${res.data.visitor.ic_number}). Name & IC have been auto-filled.`);
        setFormData({
          icNumber: res.data.visitor.ic_number,
          name: res.data.visitor.name,
          phone: '',
          plateNumber: '',
          category: '',
          personToMeet: '',
          passBadgeNo: '',
          purpose: '',
          notes: '',
        });
      } else {
        setLookupStatus('not_found');
        setLookupMessage('Visitor IC not found in system. Please fill in your details below to register.');
        setFormData({
          icNumber: cleaned,
          name: '',
          phone: '',
          plateNumber: '',
          category: '',
          personToMeet: '',
          passBadgeNo: '',
          purpose: '',
          notes: '',
        });
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Failed to check visitor IC.');
    } finally {
      setIsCheckingIc(false);
    }
  };

  // 2. Check Visitor IC from form submit
  const handleCheckIc = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookupVisitorByIc(lookupIc);
  };

  const resetLookup = () => {
    setLookupIc('');
    setLookupStatus('idle');
    setLookupMessage(null);
    setFormData({
      icNumber: '',
      name: '',
      phone: '',
      plateNumber: '',
      category: '',
      personToMeet: '',
      passBadgeNo: '',
      purpose: '',
      notes: '',
    });
  };

  // 3. Submit Registration / Check-In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.icNumber.trim()) {
      setErrorMsg('IC Number is required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/visitors', formData);
      if (response.data.success) {
        const v = response.data.visitor;
        setQrModalData({
          name: v?.name || formData.name,
          icNumber: v?.ic_number || formData.icNumber,
          payload: response.data.qr_payload || formData.icNumber,
          isNewVisitor: Boolean(response.data.is_new_visitor),
        });

        resetLookup();
        fetchVisitors();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to check in visitor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Download generated Visitor QR PNG
  const handleDownloadQr = () => {
    if (!qrCanvasRef.current || !qrModalData) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Visitor_QR_${qrModalData.icNumber}.png`;
    a.click();
  };

  // 5. Camera Scanner Controls
  const startCamera = async () => {
    await stopCamera();
    scanBusyRef.current = false;

    // Wait briefly so the #visitor-qr-reader container is mounted in the DOM
    setTimeout(async () => {
      const el = document.getElementById('visitor-qr-reader');
      if (!el) return;
      try {
        const html5Qr = new Html5Qrcode('visitor-qr-reader');
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (!scanBusyRef.current) {
              scanBusyRef.current = true;
              handleQrScanned(decodedText);
            }
          },
          () => {
            // Ignore per-frame decode misses
          }
        );
        setCameraActive(true);
      } catch (err) {
        console.error('Camera start failed:', err);
        setScanResult({
          type: 'error',
          title: 'Camera Unavailable',
          message: 'Unable to access camera. Please allow camera permission in your browser settings.',
        });
      }
    }, 200);
  };

  const handleQrScanned = async (decodedText: string) => {
    await stopCamera();
    const cleanedIc = decodedText.replace(/\D/g, '') || decodedText.trim();
    const currentTarget = scanTargetRef.current;
    const currentMode = scanModeRef.current;

    // School Entrance Check-In: check status first before auto-filling form
    if (currentTarget === 'entrance' && currentMode === 'check-in') {
      try {
        const res = await axios.post('/api/visitors/check-ic', { ic_number: cleanedIc });
        if (res.data.found && res.data.in_premise) {
          setScanResult({
            type: 'error',
            title: 'Already In Premise',
            name: res.data.visitor?.name,
            message: 'This visitor is already checked in to the school premise. Please check out first.',
          });
          return;
        }

        setIsScannerOpen(false);
        setScanResult(null);
        setLookupIc(cleanedIc);

        if (res.data.found && res.data.visitor) {
          setLookupStatus('found');
          setLookupMessage(`Found registered visitor IC (${res.data.visitor.ic_number}). Name & IC have been auto-filled.`);
          setFormData({
            icNumber: res.data.visitor.ic_number,
            name: res.data.visitor.name,
            phone: '',
            plateNumber: '',
            category: '',
            personToMeet: '',
            passBadgeNo: '',
            purpose: '',
            notes: '',
          });
        } else {
          setLookupStatus('not_found');
          setLookupMessage('Visitor IC not found in system. Please fill in your details below to register.');
          setFormData({
            icNumber: cleanedIc,
            name: '',
            phone: '',
            plateNumber: '',
            category: '',
            personToMeet: '',
            passBadgeNo: '',
            purpose: '',
            notes: '',
          });
        }
      } catch (err: any) {
        setScanResult({
          type: 'error',
          title: 'Scan Failed',
          message: err.response?.data?.message || 'Unable to verify visitor IC.',
        });
      }
      return;
    }

    try {
      if (currentTarget === 'entrance') {
        // School Entrance Check-Out
        const res = await axios.post('/api/visitors/scan', {
          ic_number: cleanedIc,
          mode: 'check-out',
        });
        setScanResult({
          type: 'success',
          title: 'Entrance Check-Out Recorded',
          message: res.data.message,
          name: res.data.name,
          time: res.data.time,
        });
        fetchVisitors();
      } else {
        // Facilities (Prayer, PSS, ICT): check-in / check-out
        const endpoint = currentMode === 'check-in' ? '/api/facility/check-in' : '/api/facility/check-out';
        const res = await axios.post(endpoint, {
          ic_number: cleanedIc,
          user_type: 'visitor',
          facility_type: currentTarget,
        });
        setScanResult({
          type: 'success',
          title: `${currentTarget.toUpperCase()} ${currentMode === 'check-in' ? 'Check-In' : 'Check-Out'} Recorded`,
          message: res.data.message,
          name: res.data.name,
          time: res.data.time,
        });
      }
    } catch (err: any) {
      setScanResult({
        type: 'error',
        title: 'Scan Failed',
        message: err.response?.data?.message || 'Unable to process QR scan.',
      });
    }
  };

  const openScannerModal = (defaultTarget: ScanTarget = 'entrance') => {
    setQrModalData(null);
    setScanResult(null);
    setScanTarget(defaultTarget);
    setScanMode('check-in');
    setIsScannerOpen(true);
  };

  // 6. Manual Check Out from Active List
  const triggerCheckOut = (id: number, name: string) => {
    setCheckOutConfirm({ isOpen: true, id, name });
  };

  const proceedCheckOut = async () => {
    if (!checkOutConfirm.id) return;
    setIsSubmitting(true);

    try {
      const response = await axios.put(`/api/visitors/${checkOutConfirm.id}/checkout`);
      if (response.data.success) {
        setCheckOutConfirm({ isOpen: false, id: null, name: '' });
        setShowCheckOutSuccess(true);
        fetchVisitors();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckOutConfirm({ isOpen: false, id: null, name: '' });
      setErrorMsg('Failed to check out visitor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'icNumber') {
      setFormData(prev => ({ ...prev, icNumber: value.replace(/\D/g, '') }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function DateDisplay(dateString?: string) {
    if (!dateString) return '-';
    const [date, time] = dateString.split(', ');
    if (!time) return date;
    return (
      <>
        {date}
        <br />
        {time}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-[#1c3068]/80 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="p-2 hover:bg-gray-100 rounded-full text-[#1c3068] transition-colors inline-block"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black text-[#1c3068] uppercase tracking-wide">VISITOR CHECK-IN</h1>
                <p className="text-xs text-gray-500 mt-1">System Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openScannerModal('entrance')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1c3068] hover:bg-[#152450] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <ScanLine size={15} />
                <span>Scan Visitor QR</span>
              </button>
              <div className="hidden sm:flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="text-[#1c3068] font-bold">I-HADIR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Main Page Title */}
          <div className="flex items-center justify-center gap-3 text-white">
            <ClipboardList size={32} className="stroke-[2.5]" />
            <h2 className="text-3xl font-black tracking-tight">Visitor Logbook</h2>
          </div>

          {/* Step 1: Visitor IC Check Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Search className="text-[#1c3068]" size={22} />
                  <h3 className="text-lg font-bold text-[#1c3068]">Check Visitor IC First</h3>
                </div>
                {lookupStatus !== 'idle' && (
                  <button
                    type="button"
                    onClick={resetLookup}
                    className="text-xs font-bold text-gray-500 hover:text-[#1c3068] underline"
                  >
                    Check Another IC
                  </button>
                )}
              </div>

              <form onSubmit={handleCheckIc} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={lookupIc}
                  onChange={(e) => setLookupIc(e.target.value.replace(/\D/g, ''))}
                  maxLength={12}
                  placeholder="Enter 12-digit IC Number (e.g. 880101112233)"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all font-mono font-semibold"
                  required
                />
                <button
                  type="submit"
                  disabled={isCheckingIc || lookupIc.length < 6}
                  className="bg-[#1c3068] hover:bg-[#152450] text-white font-bold px-6 py-2.5 rounded-lg shadow-md transition-all text-sm uppercase tracking-wide disabled:opacity-50"
                >
                  {isCheckingIc ? 'Checking...' : 'Check IC'}
                </button>
              </form>

              {lookupMessage && (
                <div
                  className={`mt-4 p-3.5 rounded-lg border flex items-center gap-2.5 text-sm font-medium ${lookupStatus === 'found'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                >
                  {lookupStatus === 'found' ? (
                    <CheckCircle size={18} className="flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0" />
                  )}
                  <span>{lookupMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Registration / Returning Visitor Form Card */}
          <AnimatePresence>
            {lookupStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-white rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <UserPlus className="text-[#1c3068]" size={24} />
                      <div>
                        <h3 className="text-xl font-bold text-[#1c3068]">
                          {lookupStatus === 'found' ? 'Welcome back, visitor' : 'Register Visitor'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {lookupStatus === 'found'
                            ? 'Your IC and name are locked. Please fill in your details for today’s visit.'
                            : 'Complete the form below to register and generate your Visitor QR Code.'}
                        </p>
                      </div>
                    </div>

                    {lookupStatus === 'found' && (
                      <button
                        type="button"
                        onClick={() => openScannerModal('entrance')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-[#1c3068] border border-blue-200 hover:bg-[#1c3068] hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        <Camera size={15} />
                        Open Camera Scanner
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ROW 1: IC Number | Name */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">
                          IC Number <span className="text-[#c53336]">*</span>
                        </label>
                        <input
                          type="text"
                          name="icNumber"
                          value={formData.icNumber}
                          onChange={handleChange}
                          maxLength={12}
                          readOnly={lookupStatus === 'found'}
                          className={`block w-full px-4 py-2.5 rounded-lg border outline-none transition-all font-mono ${lookupStatus === 'found'
                            ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed font-bold'
                            : 'border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 placeholder-gray-400'
                            }`}
                          placeholder="880101112233"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">
                          Name <span className="text-[#c53336]">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          readOnly={lookupStatus === 'found'}
                          className={`block w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${lookupStatus === 'found'
                            ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed font-bold'
                            : 'border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 placeholder-gray-400'
                            }`}
                          placeholder="Full name"
                          required
                        />
                      </div>

                      {/* ROW 2: Phone | Visitor Category */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">
                          Phone <span className="text-[#c53336]">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all placeholder-gray-400"
                          placeholder="0123456789"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">
                          Visitor Category <span className="text-[#c53336]">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all appearance-none cursor-pointer bg-white"
                            required
                          >
                            <option value="" disabled>Select Category</option>
                            <option value="Parent / Guardian">Parent / Guardian</option>
                            <option value="Official (PPD/JPN/KPM)">Official (PPD/JPN/KPM)</option>
                            <option value="Alumni SKPS">Alumni SKPS</option>
                            <option value="Contractor / Maintenance">Contractor / Maintenance</option>
                            <option value="Vendor / Delivery">Vendor / Delivery</option>
                            <option value="Public">Public / Others</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* ROW 3: Person to Meet | Pass Badge No */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">
                          Person to Meet <span className="text-[#c53336]">*</span>
                        </label>
                        <input
                          type="text"
                          name="personToMeet"
                          value={formData.personToMeet}
                          onChange={handleChange}
                          className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all placeholder-gray-400"
                          placeholder="Cikgu Ahmad"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">Pass Badge No</label>
                        <input
                          type="text"
                          name="passBadgeNo"
                          value={formData.passBadgeNo}
                          onChange={handleChange}
                          className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all uppercase placeholder-gray-400"
                          placeholder="V001"
                        />
                      </div>

                      {/* ROW 4: Plate Number | Purpose of Visit */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">Plate Number</label>
                        <input
                          type="text"
                          name="plateNumber"
                          value={formData.plateNumber}
                          onChange={handleChange}
                          className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all uppercase placeholder-gray-400"
                          placeholder="VBC1234"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">
                          Purpose of Visit <span className="text-[#c53336]">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all appearance-none cursor-pointer bg-white"
                            required
                          >
                            <option value="" disabled>Select Purpose</option>
                            <option value="Meeting / Discussion">Meeting / Discussion</option>
                            <option value="Classes / Tuition">Classes / Tuition</option>
                            <option value="Pickup Student">Pickup Student</option>
                            <option value="Delivery / Supply">Delivery / Supply</option>
                            <option value="Maintenance / Repair">Maintenance / Repair</option>
                            <option value="Other">Other Purpose</option>
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* ROW 5: Additional Notes */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">Additional Notes</label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows={2}
                          className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all resize-none placeholder-gray-400"
                          placeholder="Any additional information..."
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#1c3068] hover:bg-[#152450] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wide text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? 'Processing...'
                          : lookupStatus === 'found'
                            ? 'Check In & Generate QR'
                            : 'Register Visitor & Generate QR'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visitors Today Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-12">
            <div className="p-8">
              <h3 className="text-xl font-bold text-[#1c3068] mb-6 flex items-center justify-between">
                <span>School Visitors Today</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {recentVisitors.filter((v) => v.status === 'In Premise').length} Active
                  </span>
                  <span className="text-xs font-bold bg-blue-50 text-[#1c3068] px-3 py-1 rounded-full">
                    {recentVisitors.length} Total
                  </span>
                </div>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="py-3 px-4 font-bold text-gray-600">Name</th>
                      <th className="py-3 px-4 font-bold text-gray-600">Pass No</th>
                      <th className="py-3 px-4 font-bold text-gray-600">Plate Number</th>
                      <th className="py-3 px-4 font-bold text-gray-600">Time In</th>
                      <th className="py-3 px-4 font-bold text-gray-600 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">Loading today's visitors...</td>
                      </tr>
                    ) : recentVisitors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No visitors recorded today yet.</td>
                      </tr>
                    ) : (
                      recentVisitors.map((visitor) => (
                        <tr key={visitor.id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="py-3 px-4 text-[#1c3068] font-bold">{visitor.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${visitor.passNo === '-'
                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                                }`}
                            >
                              {visitor.passNo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 uppercase font-mono">{visitor.plateNumber}</td>
                          <td className="py-3 px-4 text-gray-500 font-medium">{DateDisplay(visitor.date)}</td>
                          <td className="py-3 px-4 text-center">
                            {visitor.status === 'In Premise' ? (
                              <span className="inline-flex items-center justify-center whitespace-nowrap text-[11px] font-bold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                In Premise
                              </span>
                            ) : (
                              <div className="inline-flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 leading-tight whitespace-nowrap">
                                <span className="text-[11px] font-bold text-gray-700">Out</span>
                                <span className="text-[11px] font-mono text-gray-500 mt-0.5">{visitor.timeOut}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* VISITOR QR CODE PASS MODAL (After Check-In / Register) */}
        {qrModalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={34} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068]">
                {qrModalData.isNewVisitor ? 'Registration Successful!' : 'Welcome Back!'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-5">
                Use this QR code at the school entrance and facilities (Prayer, PSS, ICT).
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 inline-flex flex-col items-center mb-5">
                <canvas ref={qrCanvasRef} />
                <p className="mt-3 text-sm font-bold text-[#1c3068]">{qrModalData.name}</p>
                <p className="text-xs font-mono text-gray-500">{qrModalData.icNumber}</p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#1c3068] py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <Download size={16} />
                  Download QR Code
                </button>
                <button
                  type="button"
                  onClick={() => openScannerModal('entrance')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white py-3 rounded-xl font-bold text-sm shadow-lg transition-all"
                >
                  <Camera size={16} />
                  Open Camera Scanner (Entrance / Facilities)
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalData(null)}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CAMERA QR SCANNER MODAL (Entrance + Prayer / PSS / ICT) */}
        {isScannerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#1c3068] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={20} />
                  <h3 className="font-bold text-base">Visitor QR Scanner</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Target Selector */}
                <div className="grid grid-cols-2 gap-2">
                  {SCAN_TARGETS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setScanTarget(t.key)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${scanTarget === t.key
                        ? 'bg-[#1c3068] text-white border-[#1c3068]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setScanMode('check-in')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${scanMode === 'check-in' ? 'bg-white text-[#1c3068] shadow-sm' : 'text-gray-500'
                      }`}
                  >
                    Check In
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('check-out')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${scanMode === 'check-out' ? 'bg-white text-[#c53336] shadow-sm' : 'text-gray-500'
                      }`}
                  >
                    Check Out
                  </button>
                </div>

                {/* Camera Viewport or Scan Result */}
                {scanResult ? (
                  <div className="py-6 text-center space-y-3">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${scanResult.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}
                    >
                      {scanResult.type === 'success' ? <CheckCircle size={36} /> : <AlertCircle size={36} />}
                    </div>
                    <h4 className="text-lg font-bold text-[#1c3068]">{scanResult.title}</h4>
                    {scanResult.name && <p className="text-sm font-bold text-gray-800">{scanResult.name}</p>}
                    <p className="text-sm text-gray-500">{scanResult.message}</p>
                    {scanResult.time && (
                      <p className="text-xs font-mono text-gray-400">Time: {scanResult.time}</p>
                    )}
                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScanResult(null);
                          startCamera();
                        }}
                        className="flex-1 bg-[#1c3068] hover:bg-[#152450] text-white py-2.5 rounded-xl text-sm font-bold"
                      >
                        Scan Again
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(false)}
                        className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      id="visitor-qr-reader"
                      className="w-full min-h-[260px] rounded-xl overflow-hidden bg-gray-900"
                    />
                    <p className="text-xs text-center text-gray-500">
                      {cameraActive
                        ? 'Point the camera at the Visitor QR Code.'
                        : 'Starting camera...'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* CHECK-OUT CONFIRMATION MODAL */}
        {checkOutConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={40} className="text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Confirm Check-Out</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to check out <br />
                <span className="font-bold text-gray-800">{checkOutConfirm.name}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCheckOutConfirm({ isOpen: false, id: null, name: '' })}
                  className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedCheckOut}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-[#1c3068] hover:bg-[#152450] text-white shadow-lg transition-all disabled:opacity-70"
                >
                  {isSubmitting ? 'Checking out...' : 'Check Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CHECK-OUT SUCCESS MODAL */}
        {showCheckOutSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Check-Out Complete!</h3>
              <p className="text-gray-500 mb-8">
                The visitor has been successfully checked out and removed from the active list.
              </p>
              <button
                onClick={() => setShowCheckOutSuccess(false)}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}

        {/* ERROR MODAL */}
        {errorMsg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Error</h3>
              <p className="text-gray-500 mb-8">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg(null)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}