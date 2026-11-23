import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, AlertCircle, CheckCircle, ChevronDown, FileSpreadsheet, 
  Download, Info, Search, X, Check, Users, Eye, Loader2, Filter,
  Columns, Maximize2
} from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export const APDM_COLUMNS = [
  { key: 'bil', label: 'BIL.', minWidth: '60px', category: 'identity' },
  { key: 'id_murid', label: 'ID MURID', minWidth: '110px', category: 'identity' },
  { key: 'name', label: 'NAMA', minWidth: '220px', category: 'identity', bold: true },
  { key: 'ic_number', label: 'NO. PENGENALAN', minWidth: '140px', category: 'identity', mono: true },
  { key: 'jenis_pengenalan', label: 'JENIS PENGENALAN', minWidth: '140px', category: 'identity' },
  { key: 'tarikh_lahir', label: 'TARIKH LAHIR', minWidth: '110px', category: 'identity' },
  { key: 'status_pengajian', label: 'STATUS PENGAJIAN', minWidth: '130px', category: 'identity' },
  { key: 'tarikh_masuk_sekolah', label: 'TARIKH MASUK SEKOLAH', minWidth: '150px', category: 'academic' },
  { key: 'tarikh_masuk_kelas', label: 'TARIKH MASUK KELAS', minWidth: '140px', category: 'academic' },
  { key: 'tahun_tingkatan', label: 'TAHUN / TINGKATAN', minWidth: '130px', category: 'academic' },
  { key: 'class_name', label: 'NAMA KELAS', minWidth: '130px', category: 'academic', badge: 'purple' },
  { key: 'status_dlp', label: 'STATUS DLP', minWidth: '100px', category: 'academic' },
  { key: 'jenis_kelas', label: 'JENIS KELAS', minWidth: '110px', category: 'academic' },
  { key: 'keterangan_aliran', label: 'KETERANGAN ALIRAN', minWidth: '150px', category: 'academic' },
  { key: 'keterangan_bidang', label: 'KETERANGAN BIDANG', minWidth: '150px', category: 'academic' },
  { key: 'nama_guru_kelas', label: 'NAMA GURU KELAS', minWidth: '180px', category: 'academic' },
  { key: 'gender', label: 'JANTINA', minWidth: '100px', category: 'identity' },
  { key: 'kaum', label: 'KAUM', minWidth: '100px', category: 'demographics' },
  { key: 'agama', label: 'AGAMA', minWidth: '100px', category: 'demographics' },
  { key: 'warganegara', label: 'WARGANEGARA', minWidth: '120px', category: 'demographics' },
  { key: 'negara_asal', label: 'NEGARA ASAL', minWidth: '120px', category: 'demographics' },
  { key: 'status_asrama', label: 'STATUS ASRAMA', minWidth: '120px', category: 'demographics' },
  { key: 'nama_asrama', label: 'NAMA ASRAMA', minWidth: '130px', category: 'demographics' },
  { key: 'status_oku', label: 'STATUS OKU', minWidth: '100px', category: 'oku' },
  { key: 'tarikh_sah_oku', label: 'TARIKH SAH OKU', minWidth: '120px', category: 'oku' },
  { key: 'no_pendaftaran_oku', label: 'NO. PENDAFTARAN OKU', minWidth: '150px', category: 'oku' },
  { key: 'tarikh_daftar_oku', label: 'TARIKH DAFTAR OKU', minWidth: '140px', category: 'oku' },
  { key: 'tarikh_kad_oku', label: 'TARIKH KAD OKU', minWidth: '130px', category: 'oku' },
  { key: 'kategori_ketidakupayaan', label: 'KATEGORI KETIDAKUPAYAAN', minWidth: '180px', category: 'oku' },
  { key: 'subkategori_ketidakupayaan', label: 'SUBKATEGORI KETIDAKUPAYAAN', minWidth: '190px', category: 'oku' },
  { key: 'status_yatim', label: 'STATUS YATIM', minWidth: '120px', category: 'demographics' },
  { key: 'no_akaun_bank', label: 'NO. AKAUN BANK', minWidth: '140px', category: 'banking' },
  { key: 'nama_bank', label: 'NAMA BANK', minWidth: '130px', category: 'banking' },
  { key: 'penjaga_1_name', label: 'PENJAGA 1', minWidth: '180px', category: 'guardian' },
  { key: 'penjaga_1_ic', label: 'NO. PENGENALAN PENJAGA 1', minWidth: '170px', category: 'guardian', mono: true },
  { key: 'penjaga_1_jenis_ic', label: 'JNS. PENGENALAN PENJAGA 1', minWidth: '180px', category: 'guardian' },
  { key: 'penjaga_1_hubungan', label: 'HUBUNGAN PENJAGA 1', minWidth: '150px', category: 'guardian' },
  { key: 'penjaga_1_pekerjaan', label: 'PEKERJAAN PENJAGA 1', minWidth: '160px', category: 'guardian' },
  { key: 'penjaga_1_status_kerja', label: 'STATUS KERJA PENJAGA 1', minWidth: '160px', category: 'guardian' },
  { key: 'penjaga_1_majikan', label: 'NAMA MAJIKAN PENJAGA 1', minWidth: '170px', category: 'guardian' },
  { key: 'penjaga_1_pendapatan', label: 'PENDAPATAN PENJAGA 1', minWidth: '150px', category: 'guardian' },
  { key: 'penjaga_1_tel_pejabat', label: 'NO. TEL. PEJABAT PENJAGA 1', minWidth: '170px', category: 'guardian' },
  { key: 'penjaga_1_tel_bimbit', label: 'NO. TEL. BIMBIT PENJAGA 1', minWidth: '170px', category: 'guardian' },
  { key: 'tanggungan', label: 'TANGGUNGAN', minWidth: '110px', category: 'guardian' },
  { key: 'penjaga_2_name', label: 'PENJAGA 2', minWidth: '180px', category: 'guardian' },
  { key: 'penjaga_2_ic', label: 'NO. PENGENALAN PENJAGA 2', minWidth: '170px', category: 'guardian', mono: true },
  { key: 'penjaga_2_jenis_ic', label: 'JNS. PENGENALAN PENJAGA 2', minWidth: '180px', category: 'guardian' },
  { key: 'penjaga_2_hubungan', label: 'HUBUNGAN PENJAGA 2', minWidth: '150px', category: 'guardian' },
  { key: 'penjaga_2_pekerjaan', label: 'PEKERJAAN PENJAGA 2', minWidth: '160px', category: 'guardian' },
  { key: 'penjaga_2_status_kerja', label: 'STATUS KERJA PENJAGA 2', minWidth: '160px', category: 'guardian' },
  { key: 'penjaga_2_majikan', label: 'NAMA MAJIKAN PENJAGA 2', minWidth: '170px', category: 'guardian' },
  { key: 'penjaga_2_pendapatan', label: 'PENDAPATAN PENJAGA 2', minWidth: '150px', category: 'guardian' },
  { key: 'penjaga_2_tel_pejabat', label: 'NO. TEL. PEJABAT PENJAGA 2', minWidth: '170px', category: 'guardian' },
  { key: 'penjaga_2_tel_bimbit', label: 'NO. TEL. BIMBIT PENJAGA 2', minWidth: '170px', category: 'guardian' },
  { key: 'alamat_1', label: 'ALAMAT 1', minWidth: '180px', category: 'address' },
  { key: 'alamat_2', label: 'ALAMAT 2', minWidth: '180px', category: 'address' },
  { key: 'alamat_3', label: 'ALAMAT 3', minWidth: '180px', category: 'address' },
  { key: 'poskod', label: 'POSKOD', minWidth: '90px', category: 'address' },
  { key: 'bandar', label: 'BANDAR', minWidth: '120px', category: 'address' },
  { key: 'daerah', label: 'DAERAH', minWidth: '120px', category: 'address' },
  { key: 'negeri', label: 'NEGERI', minWidth: '120px', category: 'address' },
];

const ImportApdm = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Preview & Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [previewClasses, setPreviewClasses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch available classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        if (response.data.success) {
          setClasses(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load classes", error);
      }
    };
    fetchClasses();
  }, []);

  // Process selected or dropped file and trigger preview
  const handleFileProcess = async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.txt')) {
      setErrorMsg("Please upload a valid .csv or .xlsx file matching the APDM template.");
      return;
    }

    setSelectedFile(file);
    setIsPreviewing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/apdm/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setPreviewStudents(response.data.students || []);
        setPreviewClasses(response.data.classes || []);
        setShowPreviewModal(true);
      }
    } catch (error: any) {
      console.error('File preview failed:', error);
      setErrorMsg(error.response?.data?.message || "Failed to parse APDM file. Please check file headers.");
    } finally {
      setIsPreviewing(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Final confirmation to commit into database
  const handleConfirmImport = async () => {
    if (previewStudents.length === 0) {
      setErrorMsg("No student data available to import.");
      return;
    }

    setIsImporting(true);

    try {
      const response = await axios.post('/api/apdm/import', {
        classroom_id: selectedClassId,
        students: previewStudents,
      });

      if (response.data.success) {
        setShowPreviewModal(false);
        setSuccessMsg(response.data.message);
        setSelectedFile(null);
        setPreviewStudents([]);
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      setErrorMsg(error.response?.data?.message || "An unexpected error occurred during database import.");
    } finally {
      setIsImporting(false);
    }
  };

  // Visible columns based on selected category filter
  const visibleColumns = APDM_COLUMNS.filter(col => {
    if (activeCategory === 'all') return true;
    return col.category === activeCategory;
  });

  // Filter preview records by search query
  const filteredStudents = previewStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.name && String(s.name).toLowerCase().includes(q)) ||
      (s.ic_number && String(s.ic_number).includes(q)) ||
      (s.class_name && String(s.class_name).toLowerCase().includes(q)) ||
      (s.penjaga_1_name && String(s.penjaga_1_name).toLowerCase().includes(q)) ||
      (s.penjaga_2_name && String(s.penjaga_2_name).toLowerCase().includes(q))
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-role">Import APDM Data</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p>Import official MOE APDM student records into the school attendance system.</p>
              <p className="text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                <CheckCircle size={15} /> All 61 official APDM columns detected, previewed, and saved.
              </p>
            </div>
          </div>

          {/* Download Template Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a 
              href="/templates/apdm_template.csv" 
              download="CBA5089_Keseluruhan_Murid_TEMPLATE.csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs shadow-sm transition-all"
            >
              <Download size={14} className="text-blue-600" />
              Download Template (.csv)
            </a>
            <a 
              href="/templates/apdm_template.xlsx" 
              download="CBA5089_Keseluruhan_Murid_TEMPLATE.xlsx"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs shadow-sm transition-all"
            >
              <Download size={14} className="text-emerald-600" />
              Download Template (.xlsx)
            </a>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Header Format Guide */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Info size={18} className="text-blue-600 flex-shrink-0" />
              <span>Official 61-Column APDM Template ("Senarai Keseluruhan Murid")</span>
            </div>
            <p className="text-xs text-blue-950/80 leading-relaxed">
              Upload your file. The system automatically reads all 61 columns, shows an interactive preview popup for your confirmation, and commits all attributes directly into the database:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-900/90 pt-1">
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100/60">
                <span className="font-semibold block text-blue-950">Identity (Col 1–7, 17):</span>
                <code>BIL.</code>, <code>ID MURID</code>, <code>NAMA</code>, <code>NO. PENGENALAN</code>, <code>TARIKH LAHIR</code>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100/60">
                <span className="font-semibold block text-blue-950">Academic (Col 8–16):</span>
                <code>NAMA KELAS</code>, <code>TAHUN</code>, <code>DLP</code>, <code>ALIRAN</code>, <code>GURU KELAS</code>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100/60">
                <span className="font-semibold block text-blue-950">Guardians (Col 34–54):</span>
                <code>PENJAGA 1 & 2</code> (IC, Hubungan, Pekerjaan, Pendapatan, Tel)
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100/60">
                <span className="font-semibold block text-blue-950">Address (Col 55–61):</span>
                <code>ALAMAT 1-3</code>, <code>POSKOD</code>, <code>BANDAR</code>, <code>DAERAH</code>, <code>NEGERI</code>
              </div>
            </div>
          </div>

          {/* Class Destination Selector */}
          <div className="max-w-xl space-y-2">
            <label className="block text-sm font-bold text-role">
              Destination Class
            </label>
            <div className="relative">
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
              >
                <option value="auto">
                  🌟 Auto-detect classes from file (Recommended for 'Keseluruhan Murid')
                </option>
                <optgroup label="Or force all students to a specific class:">
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400">
              {selectedClassId === 'auto' 
                ? "Students will be automatically enrolled into their classes according to Column K ('NAMA KELAS')."
                : "All students in the file will be assigned to the selected class."}
            </p>
          </div>

          {/* Drag & Drop File Upload Area */}
          <div className="pt-2">
            <h3 className="text-base font-bold text-role mb-3">Upload APDM File (.csv or .xlsx)</h3>
            
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer group relative ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/90 ring-4 ring-blue-500/20 scale-[1.01]' 
                  : 'border-gray-200 hover:border-blue-400 bg-gray-50/60 hover:bg-blue-50/30'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                isDragging ? 'bg-blue-200 scale-110' : 'bg-blue-100/70 group-hover:scale-105'
              }`}>
                {isPreviewing ? (
                  <Loader2 size={30} className="text-blue-600 animate-spin" />
                ) : (
                  <FileSpreadsheet size={30} className="text-blue-600" />
                )}
              </div>

              <div className="flex items-center gap-2 text-role font-semibold text-sm">
                <Upload size={16} />
                <span>
                  {isPreviewing 
                    ? 'Reading & parsing all 61 APDM headers...' 
                    : isDragging 
                    ? 'Drop APDM file here!' 
                    : selectedFile 
                    ? selectedFile.name 
                    : 'Drag & Drop or Click to Browse APDM File'}
                </span>
              </div>

              {!selectedFile ? (
                <p className="text-xs text-gray-400 mt-1">Supports official .xlsx and .csv APDM exports</p>
              ) : (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  Ready ({(selectedFile.size / 1024).toFixed(1)} KB) — Click to choose a different file
                </p>
              )}

              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv, .xlsx, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv" 
                onChange={handleFileInputChange} 
                className="hidden" 
              />
            </div>

            {/* Quick Action when file selected */}
            {selectedFile && previewStudents.length > 0 && (
              <div className="mt-4 flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {previewStudents.length}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{selectedFile.name}</h4>
                    <p className="text-xs text-gray-500">
                      {previewStudents.length} student(s) detected across {previewClasses.length} class(es).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
                >
                  <Eye size={15} />
                  View All 61 Columns & Confirm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* POPUP PREVIEW & CONFIRMATION MODAL SHOWING ALL 61 APDM COLUMNS             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] max-h-[94vh] flex flex-col overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>Preview APDM Data</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        All 61 Columns
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Scroll horizontally to inspect all 61 APDM columns. Click <strong>Confirm & Import</strong> to save to the database.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Statistics & Filter Ribbon */}
              <div className="px-6 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                {/* Category Filters */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-gray-400 font-semibold mr-1 flex items-center gap-1">
                    <Filter size={13} /> View:
                  </span>
                  {[
                    { id: 'all', label: `All 61 Columns (${APDM_COLUMNS.length})` },
                    { id: 'identity', label: 'Identity (1-7, 17)' },
                    { id: 'academic', label: 'Academics (8-16)' },
                    { id: 'demographics', label: 'Demographics (18-23, 31)' },
                    { id: 'oku', label: 'OKU / Needs (24-30)' },
                    { id: 'banking', label: 'Banking (32-33)' },
                    { id: 'guardian', label: 'Guardians (34-54)' },
                    { id: 'address', label: 'Address (55-61)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        activeCategory === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search in preview */}
                <div className="relative min-w-[240px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, IC, class, guardian..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Badges Info Bar */}
              <div className="px-6 py-2 bg-blue-50/50 border-b border-blue-100/60 flex flex-wrap items-center justify-between text-xs text-blue-900 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    Detected: <strong className="text-blue-950">{previewStudents.length} students</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Classes: <strong className="text-blue-950">{previewClasses.join(', ') || 'Auto-assign'}</strong>
                  </span>
                  {selectedClassId !== 'auto' && (
                    <>
                      <span>•</span>
                      <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                        Class forced to: {classes.find(c => String(c.id) === String(selectedClassId))?.name || selectedClassId}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-gray-500 text-[11px]">
                  Displaying {visibleColumns.length} of {APDM_COLUMNS.length} columns • Drag/scroll table horizontally →
                </div>
              </div>

              {/* Scrollable 61-Column Table */}
              <div className="flex-1 overflow-auto p-4 bg-gray-50/30">
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white min-w-full">
                  <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                        <tr>
                          {visibleColumns.map((col, cIdx) => (
                            <th 
                              key={col.key} 
                              style={{ minWidth: col.minWidth }}
                              className="py-3 px-3 border-b border-r border-gray-200 text-xs whitespace-nowrap bg-gray-100"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span>{col.label}</span>
                                <span className="text-[9px] text-gray-400 font-normal">#{cIdx + 1}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 text-gray-600">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumns.length} className="py-12 text-center text-gray-400 text-sm">
                              No students match your filter or search query.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((s, rIdx) => (
                            <tr key={rIdx} className="hover:bg-blue-50/50 transition-colors">
                              {visibleColumns.map((col) => {
                                const val = s[col.key] ?? s.raw_map?.[col.label.toLowerCase()] ?? '';
                                return (
                                  <td 
                                    key={col.key}
                                    style={{ minWidth: col.minWidth }}
                                    className={`py-2.5 px-3 border-r border-gray-100 whitespace-nowrap text-xs ${
                                      col.bold ? 'font-bold text-gray-900' : ''
                                    } ${
                                      col.mono ? 'font-mono text-gray-700' : ''
                                    }`}
                                  >
                                    {col.key === 'class_name' ? (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100 text-[11px]">
                                        {selectedClassId !== 'auto'
                                          ? (classes.find(c => String(c.id) === String(selectedClassId))?.name || selectedClassId)
                                          : (val || 'N/A')}
                                      </span>
                                    ) : col.key === 'gender' ? (
                                      val ? (
                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                          val === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                        }`}>
                                          {val}
                                        </span>
                                      ) : '-'
                                    ) : (
                                      val ? String(val) : <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="text-xs text-gray-500">
                  Showing <strong>{filteredStudents.length}</strong> of <strong>{previewStudents.length}</strong> student records across <strong>{visibleColumns.length}</strong> columns.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    disabled={isImporting}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting || previewStudents.length === 0}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Saving to Database...
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        Confirm & Import ({previewStudents.length} Students)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorMsg && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Import Failed</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">{errorMsg}</p>
              <button 
                onClick={() => setErrorMsg(null)} 
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5"
              >
                Go Back & Fix
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {successMsg && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-role mb-2">Success!</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">{successMsg}</p>
              <button 
                onClick={() => navigate('/users/list')} 
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5"
              >
                View Students List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default function ApdmPage() {
  return (
    <DashboardLayout activePageId="import-apdm">
      <ImportApdm />
    </DashboardLayout>
  );
}
