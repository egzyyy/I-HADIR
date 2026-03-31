import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (value: string) => void;
  active: boolean;
  qrboxSize?: number;
}

/**
 * Renders a live camera feed that decodes QR codes.
 * Calls onScan(decodedText) once per successful scan, then pauses briefly.
 */
const QrScanner: React.FC<QrScannerProps> = ({ onScan, active, qrboxSize = 250 }) => {
  const containerId = 'qr-reader-container';
  const scannerRef  = useRef<Html5Qrcode | null>(null);
  const cooldown    = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
        (decoded) => {
          if (cooldown.current) return;
          cooldown.current = true;
          onScan(decoded);
          // 3-second cooldown before next scan
          setTimeout(() => { cooldown.current = false; }, 3000);
        },
        () => {} // ignore per-frame errors
      )
      .catch((err) => {
        setError('Camera access denied or unavailable.');
        console.error(err);
      });

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
  }, [active]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-red-400 gap-2">
        <p className="font-medium">{error}</p>
        <p className="text-sm text-gray-400">Please allow camera access and reload.</p>
      </div>
    );
  }

  return <div id={containerId} className="w-full rounded-xl overflow-hidden" />;
};

export default QrScanner;
