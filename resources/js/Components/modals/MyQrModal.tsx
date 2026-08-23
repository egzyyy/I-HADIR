import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Download, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import axios from 'axios';

interface MyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MyQrData = {
  payload: string;
  name: string;
  label: string;
  position: string;
};

export const MyQrModal = ({ isOpen, onClose }: MyQrModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyQrData | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setData(null);

    axios.get('/api/qr/me')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Failed to load your QR code.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    // Guard on `loading` too: the canvas only mounts once loading flips to
    // false, which happens in a separate state update *after* `data` is set
    // (axios .then() sets data, .finally() clears loading) — so this effect
    // must re-run on that second update, not just when `data` first arrives.
    if (loading || error || !data || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, data.payload, {
      width: 280,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: { dark: '#2f4fa8', light: '#ffffff' },
    });
  }, [data, loading, error]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const link = document.createElement('a');
    link.download = `QR_${data.name.replace(/\s+/g, '_')}.png`;
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
            <h3 className="text-lg font-bold text-role">My QR Code</h3>
            <p className="text-gray-400 text-xs mt-0.5">Scan to record your attendance</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-4">
          {loading && (
            <div className="w-[240px] h-[240px] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-role border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-2 text-center text-red-500">
              <AlertCircle size={32} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="border-2 border-role/10 rounded-xl p-4 bg-white shadow-inner">
                <canvas ref={canvasRef} />
              </div>

              <div className="text-center">
                <p className="text-lg font-black text-role">{data.name}</p>
                {data.label && <p className="font-bold text-[#c53336]">{data.label}</p>}
                {data.position && <p className="text-xs font-bold text-role">({data.position})</p>}
              </div>

              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-role text-white rounded-lg font-bold hover:bg-role-dark transition-all text-sm shadow-lg shadow-blue-900/20"
              >
                <Download size={16} /> Download PNG
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
