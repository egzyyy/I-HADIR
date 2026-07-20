import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
 * - formatsToSupport is narrowed to QR_CODE only. Left at its default, every
 *   decoder (native BarcodeDetector or the bundled fallback) tests each
 *   frame against all 17 supported symbologies — this was the actual cause
 *   of slow/inconsistent reads, not the decoder itself. These two options
 *   only take effect via the Html5Qrcode *constructor*; passing them to
 *   `.start()` instead is a silent no-op (the scan-config type there has no
 *   such fields).
 * - continuous autofocus is requested so the camera keeps re-focusing on a
 *   moved/tilted QR code instead of staying locked on whatever it focused on
 *   at scan start. It's a non-standard MediaTrackConstraint outside the TS
 *   DOM lib, so it's applied via a plain object cast; unsupported browsers
 *   just ignore the unknown constraint.
 *
 * A previous version of this file also auto-restarted the scanner after a
 * period of no frames, to work around Chrome's native BarcodeDetector
 * occasionally wedging mid-session. That was reverted: Html5Qrcode.stop()
 * can throw *synchronously* if its internal state manager disagrees with
 * the isScanning flag, which isn't caught by a .catch() — so the "recovery"
 * path could itself throw and leave the scanner permanently dead, which is
 * worse than the problem it was trying to fix. If it wedges again, use the
 * page's own Stop/Start Scanner button — that unmounts this component and
 * builds a fresh Html5Qrcode instance via the effect below, which is a
 * clean, verified-safe teardown rather than an in-place restart.
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

    // formatsToSupport/useBarCodeDetectorIfSupported must go here (the
    // constructor), not into .start()'s config — see comment above.
    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    scannerRef.current = scanner;

    const onDecode = (decoded: string) => {
      if (cooldown.current) return;
      cooldown.current = true;
      onScanRef.current(decoded);
      // 3-second cooldown before next scan
      setTimeout(() => { cooldown.current = false; }, 3000);
    };

    const baseConfig = {
      fps: 20,
      // Scan region sized against the actual viewfinder: 75% of the
      // smaller edge, so it always fits the stream regardless of camera.
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
        return { width: edge, height: edge };
      },
    };

    // advanced/focusMode isn't in the TS DOM lib's MediaTrackConstraints —
    // cast so unsupported browsers can still safely ignore the constraint.
    const videoConstraints = {
      facingMode: 'environment',
      width:  { ideal: 1920 },
      height: { ideal: 1080 },
      advanced: [{ focusMode: 'continuous' }],
    } as MediaTrackConstraints;

    // First attempt requests 1080p. If the camera rejects those constraints,
    // retry with defaults rather than showing a dead scanner.
    scanner
      .start(
        { facingMode: 'environment' },
        { ...baseConfig, videoConstraints },
        onDecode,
        () => {} // ignore per-frame errors
      )
      .catch((err) => {
        console.warn('QrScanner: 1080p constraints rejected, retrying with defaults.', err);
        return scanner.start({ facingMode: 'environment' }, baseConfig, onDecode, () => {});
      })
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
