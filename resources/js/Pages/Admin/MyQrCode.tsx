import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, AlertCircle, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';

type MyQrData = {
  payload: string;
  name: string;
  label: string;
};

const MyQrCodeContent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyQrData | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    axios.get('/api/qr/me')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load your QR code.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || error || !data || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data.payload, {
      width: 300,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: { dark: '#2f4fa8', light: '#ffffff' },
    });
  }, [data, loading, error]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const link = document.createElement('a');
    link.download = `QR_${data.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#2f4fa8]">My QR Code</h2>
        <p className="text-gray-500 text-sm mt-1">Your personal QR code for attendance scanning</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 flex flex-col items-center gap-6">
          {loading && (
            <div className="w-[300px] h-[300px] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#2f4fa8] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="w-[300px] h-[300px] flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="border-2 border-[#2f4fa8]/10 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50/50 shadow-inner">
                <canvas ref={canvasRef} />
              </div>

              <div className="text-center space-y-1">
                <p className="text-lg font-black text-[#2f4fa8]">{data.name}</p>
                <p className="text-sm font-bold text-[#c53336]">{data.label}</p>
              </div>

              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-[#2f4fa8] text-white rounded-xl font-bold hover:bg-[#264190] transition-all text-sm shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
              >
                <Download size={18} /> Download QR Code
              </button>

              <div className="w-full mt-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <QrCode size={20} className="text-[#2f4fa8] mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-bold text-gray-600">How to use your QR code:</p>
                    <p>• Show this QR code to the scanner during check-in / check-out.</p>
                    <p>• You can also download and print it for easier access.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function MyQrCode() {
  return (
    <DashboardLayout activePageId="my-qr-code">
      <MyQrCodeContent />
    </DashboardLayout>
  );
}
