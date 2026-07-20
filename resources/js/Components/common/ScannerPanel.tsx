import React from 'react';
import { QrCode, XCircle, X } from 'lucide-react';
import QrScanner from './QrScanner';

interface ScannerPanelProps {
  scanning: boolean;
  loading: boolean;
  error: string | null;
  onScan: (decoded: string) => void;
  onStart: () => void;
  onStop: () => void;
  onDismissError: () => void;
  idleHint?: string;
}

/**
 * Shared idle/active/error/stop chrome around QrScanner. Always used inside
 * ScannerCard, which owns the surrounding width/padding — this component
 * only owns the scan lifecycle (idle, scanning, loading, error).
 */
const ScannerPanel: React.FC<ScannerPanelProps> = ({
  scanning,
  loading,
  error,
  onScan,
  onStart,
  onStop,
  onDismissError,
  idleHint = 'Camera is off',
}) => {
  const minHeight = 480;
  if (!scanning) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-24 h-24 rounded-2xl bg-[#1c3068]/5 flex items-center justify-center">
          <QrCode size={48} className="text-[#1c3068]" />
        </div>
        <p className="text-gray-500 text-sm">{idleHint}</p>
        <button
          onClick={onStart}
          className="px-8 py-3 bg-[#1c3068] text-white rounded-xl font-semibold hover:bg-[#152450] transition-all"
        >
          Start Scanner
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative" style={{ minHeight }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-xl">
            <div className="w-10 h-10 border-4 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <QrScanner onScan={onScan} active={scanning} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <XCircle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm text-red-600 flex-1">{error}</p>
          <button onClick={onDismissError}><X size={16} className="text-red-400" /></button>
        </div>
      )}

      <button
        onClick={onStop}
        className="w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        Stop Scanner
      </button>
    </div>
  );
};

export default ScannerPanel;
