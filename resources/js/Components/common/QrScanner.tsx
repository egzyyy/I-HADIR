import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (value: string) => void;
  active: boolean;
}

/**
 * Renders a live camera feed that decodes QR codes.
 * Calls onScan(decodedText) once per successful scan, then pauses briefly.
 *
 * Detection config is deliberately centralized here so every scanning page
 * (attendance, facility, event, public kiosk) behaves identically:
 * - qrbox is computed from the real viewfinder size at runtime — a hardcoded
 *   pixel box is a documented html5-qrcode failure mode when it doesn't match
 *   the video stream, and it made scan tolerance vary between pages.
 * - 1080p is requested so distant/slanted codes keep enough pixel detail
 *   (many webcams otherwise default to 640×480).
 */
const QrScanner: React.FC<QrScannerProps> = ({ onScan, active }) => {
  const containerId = 'qr-reader-container';
  const scannerRef  = useRef<Html5Qrcode | null>(null);
  const cooldown    = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Always call the latest onScan. The scanner only (re)starts when `active`
  // changes, so the html5-qrcode callback would otherwise keep the closure from
  // the first render — e.g. still posting "check-out" after the page switched
  // to check-in mode via a query-param change that doesn't remount anything.
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; });

  useEffect(() => {
    if (!active) return;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        {
          facingMode: 'environment',
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        {
          fps: 15,
          // Scan region sized against the actual viewfinder: 75% of the
          // smaller edge, so it always fits the stream regardless of camera.
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
            return { width: edge, height: edge };
          },
        },
        (decoded) => {
          if (cooldown.current) return;
          cooldown.current = true;
          onScanRef.current(decoded);
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
