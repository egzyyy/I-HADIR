import React from 'react';
import ScannerPanel from './ScannerPanel';

interface ScannerCardProps {
  scanning: boolean;
  loading: boolean;
  error: string | null;
  onScan: (decoded: string) => void;
  onStart: () => void;
  onStop: () => void;
  onDismissError: () => void;
  idleHint?: string;
  /** Content rendered inside the card, above the scanner — e.g. a check-in/out toggle or a participant-type switcher. */
  header?: React.ReactNode;
  /** False hides the scanner itself while still rendering `header` — used when there's nothing scannable yet (e.g. no valid participant type selected). */
  showScanner?: boolean;
}

/**
 * The white card shell every QR scan page (attendance, facility, events,
 * public kiosk) wraps its scanner in. Pulled out alongside ScannerPanel/
 * ScanResultModal because the shell's size (max width, padding) had already
 * drifted between pages once — keeping it here means there's nowhere left
 * for that to happen.
 */
const ScannerCard: React.FC<ScannerCardProps> = ({ header, showScanner = true, ...panelProps }) => (
  <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6">
      {header}
      {showScanner && <ScannerPanel {...panelProps} />}
    </div>
  </div>
);

export default ScannerCard;
