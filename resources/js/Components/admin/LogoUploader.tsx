import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Upload, RotateCcw, Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { fkLogo, defaultSchoolLogo } from '../../lib/branding';

interface Props {
  title: string;
  description: string;
  /** Current uploaded logo URL, or null when the built-in default is in use. */
  value: string | null;
  /** What to preview when `value` is null. */
  fallback?: 'school' | 'none';
  /** POST (multipart) and DELETE target, e.g. /api/branding/school-logo */
  endpoint: string;
  onChange: (url: string | null) => void;
  /**
   * Server-reported ceiling in MB — the smaller of the app's own limit and
   * PHP's post_max_size/upload_max_filesize. Falls back to the app limit.
   */
  maxMb?: number;
}

/** App-side limit; keep in sync with BrandingController::MAX_KB. */
const DEFAULT_MAX_MB = 10;

/**
 * Uploads the dynamic (left-hand) logo. The Fakulti Komputeran logo is shown
 * beside it for context but is a fixed asset and cannot be replaced here.
 */
const LogoUploader: React.FC<Props> = ({
  title,
  description,
  value,
  fallback = 'school',
  endpoint,
  onChange,
  maxMb,
}) => {
  const limitMb = maxMb && maxMb > 0 ? maxMb : DEFAULT_MAX_MB;
  const limitBytes = limitMb * 1024 * 1024;

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // On by default: logos are usually supplied on a flat white background, which
  // shows as a white slab against the frosted navbar.
  const [removeBg, setRemoveBg] = useState(true);

  const preview = value || (fallback === 'school' ? defaultSchoolLogo : null);

  // Uploads save immediately, so the confirmation is transient rather than
  // something the admin has to dismiss.
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (file.size > limitBytes) {
      const actual = (file.size / (1024 * 1024)).toFixed(1);
      setError(`That image is ${actual} MB — the limit is ${limitMb} MB. Please upload a smaller file.`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const body = new FormData();
    body.append('logo', file);
    body.append('remove_background', removeBg ? '1' : '0');

    setBusy(true);
    try {
      const res = await axios.post(endpoint, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data?.data?.school_logo ?? res.data?.data?.system_logo ?? null);
      setSuccess(res.data?.message ?? `${title} updated.`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      // Allow re-selecting the same file after a failure.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleReset = async () => {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await axios.delete(endpoint);
      onChange(null);
      setSuccess(res.data?.message ?? `${title} reset to the built-in default.`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not reset the logo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-role">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {/* Live preview of the pairing as it appears across the app */}
      <div className="flex items-center gap-6 flex-wrap p-5 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 flex items-center">
            {preview ? (
              <img src={preview} alt={title} className="h-20 w-auto object-contain" />
            ) : (
              <div className="h-20 w-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 text-center px-2">
                No logo set
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {value ? 'Uploaded' : 'Default'}
          </span>
        </div>

        <div className="h-16 w-px bg-gray-300" />

        <div className="flex flex-col items-center gap-2">
          <div className="h-20 flex items-center">
            <img src={fkLogo} alt="Fakulti Komputeran" className="h-20 w-auto object-contain" />
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Lock size={10} /> Fixed
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-role text-white font-bold text-sm hover:bg-role-dark transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy ? 'Uploading…' : 'Upload Logo'}
        </button>

        {value && (
          <button
            type="button"
            disabled={busy}
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RotateCcw size={16} /> Reset to Default
          </button>
        )}

        <span className="text-xs text-gray-400">PNG, JPG, WEBP or SVG · max {limitMb} MB</span>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={removeBg}
          onChange={(e) => setRemoveBg(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-role focus:ring-role/30"
        />
        <span className="text-xs text-gray-500 leading-relaxed">
          <span className="font-bold text-gray-600">Remove background automatically</span>
          {' — '}
          works when the logo sits on a plain colour. Detailed or photographic
          backgrounds are left untouched rather than damaged.
        </span>
      </label>

      {success && (
        <p className="flex items-start gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <CheckCircle size={18} className="flex-shrink-0 mt-px" />
          {success}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 text-sm font-medium text-[#c53336] bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <AlertCircle size={18} className="flex-shrink-0 mt-px" />
          {error}
        </p>
      )}
    </div>
  );
};

export default LogoUploader;
