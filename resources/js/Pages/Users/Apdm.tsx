import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X, ChevronDown, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import apdmFormatImage from '../../assets/apdm.png';

const ImportApdm = () => {
  const [selectedClass, setSelectedClass] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-[#1c3068]">Import</h2>
          <div className="mt-4 space-y-1 text-sm text-gray-500">
            <p>This section is for importing the list of student from APDM into the system.</p>
            <p>Teacher have to select the Class first before uploading the excel list.</p>
            <p>User have to follow the excel format before it can be imported into the system.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#1c3068]">Format Excel :</h3>
            <p className="text-sm text-gray-500">The data in excel must started from Row A1, without inserting the header name. See the example below.</p>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <img src={apdmFormatImage} alt="Excel Format Example" className="w-full h-auto object-cover" />
            </div>
          </div>

          <div className="max-w-md space-y-2">
            <label className="block text-sm font-bold text-[#1c3068]">
              <span className="text-[#c53336] mr-1">*</span> Class
            </label>
            <div className="relative">
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
              >
                <option value="">Select..</option>
                <option value="1-amanah">1 Amanah</option>
                <option value="1-bestari">1 Bestari</option>
                <option value="1-cekal">1 Cekal</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <AnimatePresence>
            {selectedClass && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 10 }}
                className="overflow-hidden"
              >
                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-[#1c3068] mb-4">Upload Excel File</h3>
                  <div className="w-full h-64 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                       <FileSpreadsheet size={32} className="text-green-600" />
                    </div>
                    <div className="flex items-center gap-2 text-[#1c3068] font-semibold">
                      <Upload size={18} />
                      <span>Upload Excel File</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">.xlsx or .csv files only</p>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      type="button"
                      className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                      Import Data
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
