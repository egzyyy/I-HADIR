import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface StudentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  icNumber: string;
  className: string;
  UserType?: string;
}

export const StudentQrModal = ({ isOpen, onClose, studentName, icNumber, className, UserType }: StudentQrModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userType = UserType ? UserType.charAt(0).toUpperCase() + UserType.slice(1) : 'Student';

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, icNumber, {
      width: 280,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: { dark: '#2f4fa8', light: '#ffffff' },
    });
  }, [isOpen, icNumber]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `QR_${icNumber}_${studentName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-[#2f4fa8]">{userType} QR Code</h3>
            <p className="text-gray-400 text-xs mt-0.5">Scan to record attendance</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* QR Content */}
        <div className="p-8 flex flex-col items-center gap-4">
          <div className="border-2 border-[#2f4fa8]/10 rounded-xl p-4 bg-white shadow-inner">
            <canvas ref={canvasRef} />
          </div>

          <div className="text-center">
            <p className="text-sm font-black text-[#2f4fa8]">{studentName}</p>
            <p className="text-xs text-gray-400 mt-0.5">IC: {icNumber}</p>
            <p className="text-xs font-bold text-[#c53336] mt-0.5">{className}</p>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2f4fa8] text-white rounded-lg font-bold hover:bg-[#264190] transition-all text-sm shadow-lg shadow-blue-900/20"
          >
            <Download size={16} /> Download PNG
          </button>
        </div>
      </motion.div>
    </div>
  );
};
