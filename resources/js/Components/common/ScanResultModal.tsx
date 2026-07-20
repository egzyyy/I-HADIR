import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Clock, LucideIcon } from 'lucide-react';

export type ScanResultTone = 'success' | 'warning' | 'danger';

const toneConfig: Record<ScanResultTone, { bg: string; text: string; icon: LucideIcon }> = {
  success: { bg: 'bg-green-50', text: 'text-green-600', icon: CheckCircle },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: AlertTriangle },
  danger: { bg: 'bg-red-50', text: 'text-red-600', icon: XCircle },
};

export interface ScanResultBadge {
  label: string;
  /** Defaults to the modal's overall `tone`. Lets a badge (e.g. a duration) stay green even when the modal itself is a duplicate warning. */
  tone?: ScanResultTone;
  /** 'pill' = filled rounded background (status badges). 'text' = plain colored text (durations, short labels). */
  variant?: 'pill' | 'text';
}

export interface ScanResultModalProps {
  /** Drives the icon, circle background, and top bar color. */
  tone: ScanResultTone;
  /** Small uppercase label above the name, e.g. "Check-In Recorded". */
  eyebrow: string;
  name: string;
  subtitle: string;
  time: string;
  badges?: ScanResultBadge[];
  onClose: () => void;
}

/**
 * Shared success/warning/danger result modal for QR scan flows (attendance,
 * facility, events, public kiosk) so their confirmation UI can't drift apart.
 */
const ScanResultModal: React.FC<ScanResultModalProps> = ({
  tone,
  eyebrow,
  name,
  subtitle,
  time,
  badges = [],
  onClose,
}) => {
  const cfg = toneConfig[tone];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className={`h-2 w-full ${cfg.bg.replace('50', '400')}`} />

        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${cfg.bg}`}>
            <Icon size={32} className={cfg.text.replace('600', '500')} />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{eyebrow}</p>
            <p className="text-xl font-black text-[#1c3068]">{name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>

          <div className={`w-full rounded-xl px-4 py-3 flex items-center gap-2 ${badges.length ? 'justify-between' : 'justify-center'} ${cfg.bg}`}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>{time}</span>
            </div>
            {badges.length > 0 && (
              <div className="flex items-center gap-2">
                {badges.map((b, i) => {
                  const bc = toneConfig[b.tone ?? tone];
                  return b.variant === 'pill' ? (
                    <span key={i} className={`px-2 py-1 rounded text-xs font-bold capitalize ${bc.bg} ${bc.text}`}>
                      {b.label}
                    </span>
                  ) : (
                    <span key={i} className={`text-sm font-bold ${bc.text}`}>
                      {b.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1c3068] text-white rounded-xl font-semibold hover:bg-[#152450] transition-all"
          >
            Continue Scanning
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ScanResultModal;
