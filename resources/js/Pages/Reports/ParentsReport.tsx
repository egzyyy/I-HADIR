import React, { useState } from 'react';
import { 
  Copy, 
  FileText, 
  FileSpreadsheet, 
  FileType, 
  Printer, 
  Users,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const ExportButtons = () => (
  <div className="flex flex-wrap gap-2 mb-4">
    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#c7393b] text-white rounded text-xs font-bold hover:bg-[#a02224] transition-colors shadow-sm">
      <Copy size={14} /> Copy
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1c3068] text-white rounded text-xs font-bold hover:bg-[#152450] transition-colors shadow-sm">
      <FileText size={14} /> CSV
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1c3068] text-white rounded text-xs font-bold hover:bg-[#152450] transition-colors shadow-sm">
      <FileSpreadsheet size={14} /> Excel
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1c3068] text-white rounded text-xs font-bold hover:bg-[#152450] transition-colors shadow-sm">
      <FileType size={14} /> PDF
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-[#1c3068] rounded text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
      <Printer size={14} /> Print
    </button>
  </div>
);

const DataTable = ({ title, data, columns }: { title?: string, data: any[], columns: { header: string, accessor: string }[] }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col w-full min-w-0">
      {title && <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">{title}</h3>}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <ExportButtons />
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search:" 
            className="pl-2 pr-8 py-1 text-sm border-b border-gray-300 focus:border-[#1c3068] outline-none text-right w-32 focus:w-48 transition-all"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 w-full">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 font-bold whitespace-nowrap text-[#1c3068]">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 text-gray-700 whitespace-nowrap">{row[col.accessor]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 bg-gray-50/30 rounded-lg">
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-4 text-xs text-gray-500 pt-4 border-t border-gray-100 flex-wrap gap-2">
        <span>Showing 0 to 0 of 0 entries</span>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 text-[#1c3068]">Previous</button>
          <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 text-[#1c3068]">Next</button>
        </div>
      </div>
    </div>
  );
};

const MonthTabs = ({ activeMonth, onMonthChange }: { activeMonth: number, onMonthChange: (m: number) => void }) => (
  <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide w-full">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
      <button
        key={month}
        onClick={() => onMonthChange(month)}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all flex-shrink-0 ${
          activeMonth === month 
            ? 'bg-[#1c3068] text-white shadow-md transform scale-110' 
            : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100'
        }`}
      >
        {month}
      </button>
    ))}
  </div>
);

export default function ParentsReport() {
  const [studentIc, setStudentIc] = useState('');
  const [activeListTab, setActiveListTab] = useState<'present' | 'absent'>('present');
  const [activeMonth, setActiveMonth] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock Data
  const lateData: any[] = [];
  const presentData: any[] = [];
  const absentData: any[] = [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans text-[#1c3068]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className="p-2 hover:bg-gray-100 rounded-full text-[#1c3068] transition-colors inline-block"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[#1c3068] uppercase tracking-wide">Infographic Report for Parent</h1>
                <p className="text-xs text-gray-500 mt-1">School Session: 2026 • Saturday, 14th of February 2026</p>
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="text-[#1c3068] font-bold">I-HADIR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Search Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-[#1c3068] mb-6 border-b border-gray-100 pb-4">Student Report</h2>
          <form onSubmit={handleSearch} className="max-w-xl">
             <div className="space-y-2">
               <label className="block text-sm font-bold text-[#1c3068]">
                 <span className="text-[#c7393b] mr-1">*</span> Student IC
               </label>
               <div className="flex flex-col sm:flex-row gap-4">
                 <input 
                   type="text" 
                   value={studentIc}
                   onChange={(e) => setStudentIc(e.target.value)}
                   placeholder="Enter Student IC"
                   className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-mono"
                 />
                 <button 
                   type="submit"
                   className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wider text-sm"
                 >
                   Submit
                 </button>
               </div>
               <p className="text-xs text-gray-400 mt-1">Enter IC without dashes or spaces</p>
             </div>
          </form>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Summary Split Card */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-40">
            <div className="bg-[#1c3068] flex-1 flex items-center justify-center">
               <Users size={32} className="text-white" />
            </div>
            <div className="bg-white h-16 flex border-t border-gray-100">
               <div className="flex-1 border-r border-gray-100 flex flex-col items-center justify-center">
                 <span className="text-lg font-black text-[#1c3068]">0</span>
                 <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Present</span>
               </div>
               <div className="flex-1 flex flex-col items-center justify-center">
                 <span className="text-lg font-black text-[#c7393b]">0</span>
                 <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Absent</span>
               </div>
            </div>
          </div>

          {/* Card 2: Total Present */}
          <div className="bg-[#1c3068] rounded-2xl p-6 text-white shadow-lg shadow-[#1c3068]/20 flex flex-col items-center justify-center h-40 relative overflow-hidden group">
             <div className="relative z-10 text-center">
               <h3 className="text-4xl font-black mb-1">0</h3>
               <p className="text-sm font-bold opacity-90 uppercase tracking-wider">Total Present</p>
             </div>
          </div>

          {/* Card 3: Total Absent */}
          <div className="bg-[#c7393b] rounded-2xl p-6 text-white shadow-lg shadow-[#c7393b]/20 flex flex-col items-center justify-center h-40 relative overflow-hidden group">
             <div className="relative z-10 text-center">
               <h3 className="text-4xl font-black mb-1">0</h3>
               <p className="text-sm font-bold opacity-90 uppercase tracking-wider">Total Absent</p>
             </div>
          </div>
        </div>

        {/* Content Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Combined Attendance List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#1c3068]">Attendance List</h3>
                <p className="text-xs text-gray-400">Monthly attendance records</p>
              </div>
              <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                  onClick={() => setActiveListTab('present')}
                  className={`px-6 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${
                    activeListTab === 'present'
                      ? 'bg-[#1c3068] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#1c3068]'
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setActiveListTab('absent')}
                  className={`px-6 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${
                    activeListTab === 'absent'
                      ? 'bg-[#c7393b] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#c7393b]'
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
            
            <MonthTabs activeMonth={activeMonth} onMonthChange={setActiveMonth} />
            
            <h4 className="text-sm font-bold text-gray-600 mb-4 bg-gray-50 px-3 py-2 rounded border border-gray-100 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeListTab === 'present' ? 'bg-[#1c3068]' : 'bg-[#c7393b]'}`}></span>
              Student {activeListTab} list on {new Date(2026, activeMonth - 1).toLocaleString('default', { month: 'long' })}
            </h4>
            
            <div className="flex-1 w-full overflow-hidden min-h-[400px]">
               <DataTable 
                data={activeListTab === 'present' ? presentData : absentData}
                columns={[
                  { header: 'Date', accessor: 'date' },
                  { header: 'Time In', accessor: 'timeIn' },
                  { header: 'Time Out', accessor: 'timeOut' },
                  { header: 'Reason', accessor: 'reason' },
                  { header: 'Location', accessor: 'location' },
                ]}
              />
            </div>
          </div>

          {/* Late List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-w-0">
             <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1c3068]">Late List</h3>
                <p className="text-xs text-gray-400">Records of late arrivals</p>
             </div>
             
             <div className="h-full min-h-[400px]">
                <DataTable 
                  data={lateData}
                  columns={[
                    { header: 'Date', accessor: 'date' },
                    { header: 'Attendance', accessor: 'attendance' },
                    { header: 'Time In', accessor: 'timeIn' },
                    { header: 'Time Out', accessor: 'timeOut' },
                    { header: 'Reason', accessor: 'reason' },
                  ]}
                />
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};
