import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, X, ChevronDown, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import apdmFormatImage from '../../assets/apdm.png';
import saveAs from '../../assets/saveas.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const ImportApdm = () => {
  const navigate = useNavigate();

  // State for form inputs
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Modal States
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic frontend validation for CSV
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setErrorMsg("Please upload a valid .csv file. If you have an Excel file, please 'Save As CSV' first.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedClassId) {
      setErrorMsg("Please select a class first.");
      return;
    }
    if (!selectedFile) {
      setErrorMsg("Please select a CSV file to upload.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('classroom_id', selectedClassId); // Changed to classroom_id
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/apdm/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        setSelectedFile(null); // Reset file after success
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      setErrorMsg(error.response?.data?.message || "An unexpected error occurred during import.");
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-[#1c3068]">Import APDM Data</h2>
          <div className="mt-4 space-y-1 text-sm text-gray-500">
            <p>This section is for importing the list of student from APDM into the system.</p>
            <p>Teacher have to select the Class first before uploading the CSV list.</p>
            <p className="text-red-500 font-medium">Note: Only .csv files are supported. Please 'Save As CSV' if using Excel.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1c3068]">Format Requirement:</h3>
            <p className="text-sm text-gray-500">The data in the file must include the exact APDM headers. See the example below.</p>
            
            <div className="">
              <img src={apdmFormatImage} alt="CSV Format Example" className="w-full h-auto object-cover" />
            </div>

            <p className="text-sm text-gray-500">Also save the file in this CSV format.</p>

            <div className="mt-4">
              <img src={saveAs} alt="Save As CSV" className="w-1/3 h-auto object-cover py-2" /> 
            </div>

          </div>

          <div className="max-w-md space-y-2">
            <label className="block text-sm font-bold text-[#1c3068]">
              <span className="text-[#c53336] mr-1">*</span> Class
            </label>
            <div className="relative">
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
              >
                <option value="">Select a destination class..</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <AnimatePresence>
            {selectedClassId && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 10 }}
                className="overflow-hidden"
              >
                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-[#1c3068] mb-4">Upload CSV File</h3>
                  
                  <label className="w-full h-64 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group relative">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                       <FileSpreadsheet size={32} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-2 text-[#1c3068] font-semibold">
                      <Upload size={18} />
                      <span>{selectedFile ? selectedFile.name : 'Click to Upload CSV File'}</span>
                    </div>
                    {!selectedFile && <p className="text-xs text-gray-400 mt-2">.csv files only</p>}
                    
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                  </label>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleImport}
                      disabled={isUploading || !selectedFile}
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Importing Data...' : 'Import Data'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorMsg && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Import Failed</h3>
              <p className="text-gray-500 mb-8">{errorMsg}</p>
              <button 
                onClick={() => setErrorMsg(null)} 
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all transform hover:-translate-y-1"
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
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Success!</h3>
              <p className="text-gray-500 mb-8">{successMsg}</p>
              <button 
                onClick={() => navigate('/users/list')} 
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold transition-all transform hover:-translate-y-1"
              >
                Done
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