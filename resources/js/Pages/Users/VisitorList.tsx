import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, LogOut, Info, X, ClipboardList, ChevronDown, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'; 
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import axios from 'axios';

// IMPORT LOGO
import logo from '../../assets/i_hadir_logo2.png';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const VisitorListContent = () => {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [purposeFilter, setPurposeFilter] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal States
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [showCheckOutSuccess, setShowCheckOutSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkOutConfirm, setCheckOutConfirm] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: ''
  });

  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/visitors/all');
      if (response.data.success) {
        setVisitors(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch visitors:", error);
      setErrorMsg("Failed to load visitor data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Complex Filtering Logic
  const filteredData = visitors.filter((visitor) => {
    // 1. Search Query Filter
    const matchesSearch = 
        visitor.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        visitor.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.personToMeet?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Status Filter
    const matchesStatus = statusFilter === 'All' || visitor.status === statusFilter;
    
    // 3. Purpose Filter
    const matchesPurpose = purposeFilter === 'All' || visitor.purpose === purposeFilter;

    return matchesSearch && matchesStatus && matchesPurpose;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // --- CHECKOUT LOGIC --- //

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
      setErrorMsg("Failed to check out visitor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EXPORT FUNCTIONS --- //

  // 1. Copy to Clipboard
  const handleCopy = async () => {
    if (filteredData.length === 0) {
      setErrorMsg("No data available to copy!");
      return;
    }

    const tableHtml = `
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>No</th><th>Name</th><th>Phone</th><th>Plate Number</th><th>Category</th><th>To Meet</th><th>Pass No</th><th>Status</th><th>Time In</th><th>Time Out</th>
          </tr>
        </thead>
        <tbody>
          ${filteredData.map((item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.phone}</td>
              <td>${item.plateNumber}</td>
              <td>${item.category}</td>
              <td>${item.personToMeet}</td>
              <td>${item.passNo}</td>
              <td>${item.status}</td>
              <td>${item.timeIn}</td>
              <td>${item.timeOut}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    try {
      const blobHtml = new Blob([tableHtml], { type: 'text/html' });
      const textFallback = filteredData.map((item: any, i: number) => 
        `${i + 1}\t${item.name}\t${item.phone}\t${item.plateNumber}\t${item.category}\t${item.personToMeet}\t${item.passNo}\t${item.status}\t${item.timeIn}\t${item.timeOut}`
      ).join('\n');
      const blobText = new Blob([textFallback], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      });

      await navigator.clipboard.write([clipboardItem]);
      alert("Table copied to clipboard! You can now paste it into Word, Excel, or Google Docs.");
    } catch (error) {
      console.error("Clipboard API failed, trying fallback:", error);
      const textFallback = filteredData.map((item: any, i: number) => 
        `${i + 1}\t${item.name}\t${item.phone}\t${item.plateNumber}\t${item.category}\t${item.personToMeet}\t${item.passNo}\t${item.status}\t${item.timeIn}\t${item.timeOut}`
      ).join('\n');
      navigator.clipboard.writeText(textFallback);
      alert("Text copied to clipboard!");
    }
  };

  // 2. Export Data to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ['No', 'Name', 'Phone', 'Plate Number', 'Category', 'To Meet', 'Pass No', 'Status', 'Time In', 'Time Out'];
    const csvRows = [headers.join(',')];

    filteredData.forEach((item, index) => {
      const row = [
        index + 1,
        `"${item.name}"`,
        `"=""${item.phone}"""`, 
        `"${item.plateNumber}"`,
        `"${item.category}"`,
        `"${item.personToMeet}"`,
        `"${item.passNo}"`,
        `"${item.status}"`,
        `"${item.timeIn}"`,
        `"${item.timeOut}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `visitor_log_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export to Excel (.xls)
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #1c3068; color: white;">
              <th>No</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Plate Number</th>
              <th>Category</th>
              <th>To Meet</th>
              <th>Pass No</th>
              <th>Status</th>
              <th>Time In</th>
              <th>Time Out</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td style="mso-number-format:'\\@';">${item.phone}</td>
                <td>${item.plateNumber}</td>
                <td>${item.category}</td>
                <td>${item.personToMeet}</td>
                <td>${item.passNo}</td>
                <td>${item.status}</td>
                <td>${item.timeIn}</td>
                <td>${item.timeOut}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `visitor_log_${new Date().getTime()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Export to PDF / Print (Standardized Format)
  const handleExportPDF = () => {
    if (filteredData.length === 0) return;

    const rows = filteredData.map((item: any, index: number) => `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td style="font-weight:bold">${item.name}</td>
        <td style="text-align:center; font-family:monospace">${item.phone}</td>
        <td style="text-align:center">${item.category}</td>
        <td style="text-align:center">${item.personToMeet}</td>
        <td style="text-align:center; font-family:monospace">${item.passNo !== '-' ? item.passNo : ''} ${item.plateNumber !== '-' ? `(${item.plateNumber})` : ''}</td>
        <td style="text-align:center">${item.timeIn}</td>
        <td style="text-align:center">${item.status}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Visitor Logbook Report</title>
        <style>
          @page { margin: 15mm; size: A4 landscape; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
          
          /* Standard Header Styling */
          .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1c3068; }
          .logo { max-height: 80px; margin-bottom: 15px; width: auto; }
          .report-title { color: #1c3068; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
          .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
          
          /* Table Styling */
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
          
          /* Enforce colors in print */
          th { 
            background-color: #1c3068 !important; 
            color: white !important; 
            font-weight: bold; 
            text-align: center; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          th:nth-child(2) { text-align: left; } /* Align Name to left */
          
          tr:nth-child(even) { 
            background-color: #f9fafb !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img src="${logo}" class="logo" alt="School Logo" />
          <h1 class="report-title">Visitor Logbook Report</h1>
          <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width:5%">No</th>
              <th style="width:20%">Visitor Name</th>
              <th style="width:12%">Phone No</th>
              <th style="width:15%">Category</th>
              <th style="width:15%">Meeting With</th>
              <th style="width:13%">Pass / Plate No</th>
              <th style="width:10%">Time In</th>
              <th style="width:10%">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) { 
      win.document.write(html); 
      win.document.close(); 
    }
  };

  return (
    <>
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-[#1c3068] flex items-center gap-2">
              <ClipboardList size={24} className="text-[#c53336]" /> Visitor Logbook
            </h2>
            <p className="text-gray-400 text-xs mt-1">Complete history of campus visitors as of {today}</p>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200 text-sm font-bold shadow-sm">
                {visitors.filter(v => v.status === 'In Premise').length} Active Visitors
             </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            
            <ExportButtons 
                onExportCSV={handleExportCSV} 
                onExportExcel={handleExportExcel} 
                onCopy={handleCopy} 
                onExportPDF={handleExportPDF} 
                onPrint={handleExportPDF} 
            />

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
               
               {/* STATUS FILTER DROPDOWN */}
               <div className="relative w-full sm:w-40">
                 <select 
                   value={statusFilter}
                   onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer text-[#1c3068] font-semibold"
                 >
                   <option value="All">All Status</option>
                   <option value="In Premise">In Premise</option>
                   <option value="Checked Out">Checked Out</option>
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>

               {/* PURPOSE FILTER DROPDOWN */}
               <div className="relative w-full sm:w-48">
                 <select 
                   value={purposeFilter}
                   onChange={(e) => { setPurposeFilter(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer text-[#1c3068] font-semibold"
                 >
                   <option value="All">All Purposes</option>
                   <option value="Meeting / Discussion">Meeting / Discussion</option>
                   <option value="Pickup Student">Pickup Student</option>
                   <option value="Delivery / Supply">Delivery / Supply</option>
                   <option value="Maintenance / Repair">Maintenance / Repair</option>
                   <option value="Other">Other</option>
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>

               {/* SEARCH BAR */}
               <div className="relative w-full sm:w-64">
                 <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Search name, plate, host..."
                   value={searchQuery}
                   onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                 />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">No</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Visitor Info</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Pass / Plate No</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Meeting With</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading visitor data...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">No visitor records found matching your filters.</td></tr>
                ) : (
                  currentData.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                      
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-[#1c3068]">{item.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{item.phone} • {item.category}</p>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                           {item.passNo !== '-' && (
                             <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[13px] font-bold rounded border border-amber-200 w-max">
                               Pass: {item.passNo}
                             </span>
                           )}
                           <span className="text-sm font-mono text-gray-600 uppercase">{item.plateNumber}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-800">{item.personToMeet}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{item.purpose}</p>
                      </td>

                      <td className="px-4 py-4">
                         <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                                item.status === 'In Premise' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                               {item.status}
                            </span>
                            <div className="text-[13px] text-gray-400 flex flex-col mt-0.5">
                               <span>In: {item.timeIn?.split(', ')[1]}</span>
                               {item.status === 'Checked Out' && <span>Out: {item.timeOut?.split(', ')[1]}</span>}
                            </div>
                         </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setSelectedVisitor(item)} 
                            className="p-1.5 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors" 
                            title="View Full Details"
                          >
                             <Info size={16} />
                          </button>
                          {item.status === 'In Premise' && (
                            <button 
                              onClick={() => triggerCheckOut(item.id, item.name)} 
                              className="p-1.5 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1" 
                              title="Force Check Out"
                            >
                               <LogOut size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing {startIndex + 1} to {endIndex} of {filteredData.length} records</p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50">Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border ${currentPage === page ? 'bg-[#c53336] text-white border-[#c53336]' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>

    {/* --- MODALS --- */}
    <AnimatePresence>
       
       {/* VIEW DETAILS MODAL */}
       {selectedVisitor && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedVisitor(null)}>
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                 <h3 className="font-bold text-[#1c3068] flex items-center gap-2"><ClipboardList size={18} /> Visitor Details</h3>
                 <button onClick={() => setSelectedVisitor(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div><p className="text-xs text-gray-500 uppercase font-bold">Name</p><p className="font-medium text-gray-800">{selectedVisitor.name}</p></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-500 uppercase font-bold">Phone</p><p className="font-medium text-gray-800">{selectedVisitor.phone}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase font-bold">Plate No</p><p className="font-medium text-gray-800 uppercase font-mono">{selectedVisitor.plateNumber}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase font-bold">Category</p><p className="font-medium text-gray-800">{selectedVisitor.category}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase font-bold">Pass Badge</p><p className="font-medium text-gray-800">{selectedVisitor.passNo}</p></div>
                 </div>
                 <div className="border-t border-gray-100 pt-4">
                    <div><p className="text-xs text-gray-500 uppercase font-bold">Person Meet</p><p className="font-medium text-gray-800">{selectedVisitor.personToMeet}</p></div>
                    <div className="mt-4"><p className="text-xs text-gray-500 uppercase font-bold">Purpose</p><p className="font-medium text-gray-800">{selectedVisitor.purpose}</p></div>
                    <div className="mt-4"><p className="text-xs text-gray-500 uppercase font-bold">Notes</p><p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-1 border border-gray-100">{selectedVisitor.notes}</p></div>
                 </div>
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
                Force check-out for <span className="font-bold text-gray-800">{checkOutConfirm.name}</span>?
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
                  {isSubmitting ? 'Checking out...' : 'Confirm'}
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
                The visitor has been successfully marked as checked out.
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
    </>
  );
};

export default function VisitorListPage() {
  return (
    <DashboardLayout activePageId="visitor-list">
      <VisitorListContent />
    </DashboardLayout>
  );
}