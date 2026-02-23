import React from 'react';
import { Copy, FileText, FileSpreadsheet, FileType, Printer } from 'lucide-react';

export const ExportButtons = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    <button className="flex items-center gap-2 px-3 py-2 bg-[#c53336] text-white rounded-lg hover:bg-[#a02224] transition-colors font-medium text-sm shadow-sm">
      <Copy size={16} /> Copy
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-[#1c3068] text-white rounded-lg hover:bg-[#152450] transition-colors font-medium text-sm shadow-sm">
      <FileText size={16} /> CSV
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-[#1c3068] text-white rounded-lg hover:bg-[#152450] transition-colors font-medium text-sm shadow-sm">
      <FileSpreadsheet size={16} /> Excel
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-[#1c3068] text-white rounded-lg hover:bg-[#152450] transition-colors font-medium text-sm shadow-sm">
      <FileType size={16} /> PDF
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-white text-[#1c3068] rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm">
      <Printer size={16} /> Print
    </button>
  </div>
);
