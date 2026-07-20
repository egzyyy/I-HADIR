import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QrScannerProps {
  onScan: (value: string) => void;
  active: boolean;
}

/**
 * Renders a live camera feed that decodes QR codes.
 * Calls onScan(decodedText) once per successful scan, then pauses briefly.
 *
 * Replaced html5-qrcode with qr-scanner (nimiq) after diagnosing why scans
 * were wildly inconsistent: html5-qrcode alternates between the browser's
 * native BarcodeDetector and its own bundled JS decoder on *every frame*
 * with no way to disable that. The bundled decoder turned out to not work
 * at all in this environment (verified: 800+ consecutive frames of a clean,
 * steady QR code, zero decodes with the native detector forced off) — so
 * roughly half of all frames were silently guaranteed to fail regardless of
 * lighting or positioning. qr-scanner picks a single engine up front and,
 * if the native detector throws a "not implemented"/"service unavailable"
 * error (the actual signature of a native detector whose underlying
 * component isn't installed), permanently falls back to its own worker
 * decoder instead of continuing to alternate into a broken path.
 */
const QrScannerComponent: React.FC<QrScannerProps> = ({ onScan, active }) => {
  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const cooldown   = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Always call the latest onScan — see CheckIn/CheckOut/FacilityCheckIn
  // for why (mode can change via query param without remounting this).
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; });

  useEffect(() => {
    if (!active || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (cooldown.current) return;
        cooldown.current = true;
        onScanRef.current(result.data);
        // 3-second cooldown before next scan
        setTimeout(() => { cooldown.current = false; }, 3000);
      },
      {
        onDecodeError: () => {}, // fires continuously while nothing's found; expected
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 20,
        returnDetailedScanResult: true,
      }
    );
    scannerRef.current = scanner;

    scanner.start().catch((err) => {
      setError('Camera access denied or unavailable.');
      console.error('QrScanner: failed to start camera.', err);
    });

    return () => {
      scanner.destroy();
      scannerRef.current = null;
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

  return <video ref={videoRef} className="w-full rounded-xl" muted playsInline />;
};

export default QrScannerComponent;
