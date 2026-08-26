import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Plus, Pencil, Trash2, X, Star, Calendar, BanIcon, ChevronLeft, ChevronRight, Moon, Shield, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

type Setting = {
  id: number;
  title: string;
  checkInStart: string;
  checkInDeadline: string;
  lateThreshold: string;
  absentThreshold: string | null;
  checkOutTime: string;
  isDefault: boolean;
  appliesToDays: number[];
};

type Override = {
  id: number;
  date: string;       // YYYY-MM-DD
  setting_id: number | null;
  settingTitle: string | null;
  note: string | null;
  isClosed: boolean;
};

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  isActive: boolean;
};

// "19:00" → "7:00 PM" — mirrors the backend's ShiftController::formatShiftName so the
// modal's live preview matches what actually gets saved.
const fmtShiftTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
};
const shiftNamePreview = (start: string, end: string) =>
  start && end ? `${fmtShiftTime(start)} - ${fmtShiftTime(end)}` : '';

const DAY_LABELS: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Pure helpers (no Date allocations inside render loops) ───────────────────

function pad(n: number) { return String(n).padStart(2, '0'); }
function toYMD(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}
function getMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
// Returns ISO weekday of 1st: 1=Mon … 7=Sun
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 7 : d;
}
// Stable today string — computed once at module load, never changes within a session
const TODAY_STR = (() => {
  const t = new Date();
  return toYMD(t.getFullYear(), t.getMonth() + 1, t.getDate());
})();

// ─── SettingCard — memoized so sibling deletes don't re-render it ─────────────

const SettingCard = memo(({
  setting,
  deleting,
  onEdit,
  onDelete,
}: {
  setting: Setting;
  deleting: boolean;
  onEdit: (s: Setting) => void;
  onDelete: (id: number) => void;
}) => (
  <div className="p-4 hover:bg-gray-50/50 transition-colors">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800 text-sm">{setting.title}</span>
        {setting.isDefault && (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
            <Star size={9} /> Default
          </span>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(setting)}
          className="p-1.5 rounded-lg hover:bg-role/10 text-gray-400 hover:text-role transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(setting.id)}
          disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
      <span>Opens: <strong className="text-gray-700">{setting.checkInStart}</strong></span>
      <span>On-time by: <strong className="text-gray-700">{setting.checkInDeadline}</strong></span>
      <span>Late after: <strong className="text-gray-700">{setting.lateThreshold}</strong></span>
      <span>Absent after: <strong className="text-gray-700">{setting.absentThreshold ?? '—'}</strong></span>
      <span>Check Out: <strong className="text-gray-700">{setting.checkOutTime}</strong></span>
    </div>

    {setting.appliesToDays.length > 0 ? (
      <div className="flex gap-1 flex-wrap">
        {setting.appliesToDays.map(d => (
          <span key={d} className="px-2 py-0.5 bg-role/10 text-role text-[10px] font-bold rounded-full">
            {DAY_LABELS[d]}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-[10px] text-gray-400 italic">No auto-apply days — override/manual only</span>
    )}
  </div>
));

// ─── Setting Modal ────────────────────────────────────────────────────────────

const SettingModal = memo(({
  initial, onClose, onSaved,
}: {
  initial: Setting | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title:           initial?.title           ?? '',
    checkInStart:    initial?.checkInStart    ?? '07:00',
    checkInDeadline: initial?.checkInDeadline ?? '07:30',
    lateThreshold:   initial?.lateThreshold   ?? '08:00',
    absentThreshold: initial?.absentThreshold ?? '13:30',
    checkOutTime:    initial?.checkOutTime    ?? '13:30',
    isDefault:       initial?.isDefault       ?? false,
    appliesToDays:   initial?.appliesToDays   ?? [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = useCallback((d: number) => {
    setForm(f => ({
      ...f,
      appliesToDays: f.appliesToDays.includes(d)
        ? f.appliesToDays.filter(x => x !== d)
        : [...f.appliesToDays, d].sort(),
    }));
  }, []);

  const toggleDefault = useCallback(() => {
    setForm(f => ({ ...f, isDefault: !f.isDefault }));
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title:             form.title,
        check_in_start:    form.checkInStart,
        check_in_deadline: form.checkInDeadline,
        late_threshold:    form.lateThreshold,
        absent_threshold:  form.absentThreshold || null,
        check_out_time:    form.checkOutTime,
        is_default:        form.isDefault,
        applies_to_days:   form.appliesToDays,
      };
      if (isEdit) {
        await axios.put(`/api/time-settings/${initial!.id}`, payload);
      } else {
        await axios.post('/api/time-settings', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }, [form, isEdit, initial, onSaved, onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-role">{isEdit ? 'Edit Setting' : 'New Time Setting'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Normal Class"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-role outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TIME_FIELDS.map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input
                    type="time"
                    required
                    value={(form as any)[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-role outline-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                Auto-apply on days <span className="font-normal text-gray-400">(leave blank for manual/override only)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      form.appliesToDays.includes(d)
                        ? 'bg-role text-white border-role'
                        : 'text-gray-500 border-gray-200 hover:border-role'
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={toggleDefault}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isDefault ? 'bg-role' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isDefault ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-600">Use as fallback default</span>
            </label>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-role text-white rounded-lg font-semibold hover:bg-role-dark disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

// ─── Override Modal ───────────────────────────────────────────────────────────

const OverrideModal = memo(({
  date, initial, settings, onClose, onSaved,
}: {
  date: string;
  initial: Override | null;
  settings: Setting[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [isClosed, setIsClosed] = useState(initial?.isClosed ?? false);
  const [settingId, setSettingId] = useState<number | ''>(initial?.setting_id ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed once per modal open — date never changes while modal is open
  const displayDate = useMemo(() => (
    new Date(date + 'T00:00:00').toLocaleDateString('en-MY', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  ), [date]);

  const toggleClosed = useCallback(() => setIsClosed(v => !v), []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        date,
        setting_id: isClosed ? null : (settingId || null),
        note:       note || null,
      };
      if (initial) {
        await axios.put(`/api/time-settings/overrides/${initial.id}`, payload);
      } else {
        await axios.post('/api/time-settings/overrides', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }, [date, isClosed, settingId, note, initial, onSaved, onClose]);

  const handleDelete = useCallback(async () => {
    if (!initial) return;
    setSaving(true);
    try {
      await axios.delete(`/api/time-settings/overrides/${initial.id}`);
      onSaved();
      onClose();
    } catch {
      setError('Failed to remove override.');
      setSaving(false);
    }
  }, [initial, onSaved, onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-role">Date Override</h3>
            <p className="text-xs text-gray-400 mt-0.5">{displayDate}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-red-300 transition-colors">
              <div
                onClick={toggleClosed}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${isClosed ? 'bg-red-500' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isClosed ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">School Closed</p>
                <p className="text-xs text-gray-400">Public holiday, no attendance accepted</p>
              </div>
            </label>

            {!isClosed && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Use Setting <span className="font-normal text-gray-400">(leave blank to keep as default)</span>
                </label>
                <select
                  value={settingId}
                  onChange={e => setSettingId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-role outline-none"
                >
                  <option value="">— Use default time setting —</option>
                  {settings.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Note <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Hari Raya Aidilfitri, Hari Sukan"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-role outline-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-between gap-2">
            <div>
              {initial && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  Remove Override
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm bg-role text-white rounded-lg font-semibold hover:bg-role-dark disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Override'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

// ─── Mini Calendar — its own standalone card, no shared container with anything else ──

const CalendarGrid = memo(({
  year, month, overrideMap, selectedDate, onPrev, onNext, onDayClick,
}: {
  year: number;
  month: number;
  overrideMap: Record<string, Override>;
  selectedDate: string | null;
  onPrev: () => void;
  onNext: () => void;
  onDayClick: (dateStr: string) => void;
}) => {
  // Cells array rebuilt only when year/month changes
  const cells = useMemo<(number | null)[]>(() => {
    const startDay = getFirstDayOfMonth(year, month);
    const days = getDaysInMonth(year, month);
    return [
      ...Array<null>(startDay - 1).fill(null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  }, [year, month]);

  const monthTitle = useMemo(() => getMonthLabel(year, month), [year, month]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-role" />
          <h3 className="font-bold text-role">Calendar Overrides</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">{monthTitle}</span>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dateStr = toYMD(year, month, day);
            const ov = overrideMap[dateStr];
            const isToday    = dateStr === TODAY_STR;
            const isSelected = dateStr === selectedDate;

            let cellStyle = 'text-gray-700 hover:bg-gray-50';
            if (isToday)                      cellStyle = 'font-bold text-role';
            if (isSelected)                   cellStyle = 'bg-role text-white hover:bg-role-dark';
            if (ov?.isClosed && !isSelected)  cellStyle = 'text-red-400 bg-red-50 hover:bg-red-100';
            if (ov && !ov.isClosed && !isSelected) cellStyle = 'text-blue-600 bg-blue-50 hover:bg-blue-100';

            return (
              <button
                key={dateStr}
                onClick={() => onDayClick(dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all ${cellStyle}`}
              >
                {day}
                {ov && (
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    ov.isClosed
                      ? (isSelected ? 'bg-white' : 'bg-red-400')
                      : (isSelected ? 'bg-white' : 'bg-blue-400')
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Special schedule
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-red-400" /> School closed
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Overrides-this-month list — shares the Time Profiles column, not the calendar ──

const OverridesThisMonthList = memo(({
  overrides, selectedDate, onSelect,
}: {
  overrides: Override[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) => {
  if (overrides.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-600">Overrides this month</h4>
      </div>
      <div className="divide-y divide-gray-50">
        {overrides.map(o => (
          <OverrideListItem
            key={o.id}
            override={o}
            isSelected={o.date === selectedDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
});

// ─── Override list item — memoized to avoid re-renders on selection change of siblings ──

const OverrideListItem = memo(({
  override: o, isSelected, onSelect,
}: {
  override: Override;
  isSelected: boolean;
  onSelect: (date: string) => void;
}) => {
  const formattedDate = useMemo(
    () => new Date(o.date + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }),
    [o.date],
  );

  return (
    <button
      onClick={() => onSelect(o.date)}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isSelected ? 'bg-gray-50' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${o.isClosed ? 'bg-red-50' : 'bg-blue-50'}`}>
        {o.isClosed
          ? <BanIcon size={14} className="text-red-500" />
          : <Clock size={14} className="text-blue-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700">
          {formattedDate}
          {o.note && <span className="font-normal text-gray-500 ml-1">— {o.note}</span>}
        </p>
        <p className="text-xs text-gray-400">{o.isClosed ? 'School closed' : `Using: ${o.settingTitle}`}</p>
      </div>
    </button>
  );
});

// ─── Shift Card ───────────────────────────────────────────────────────────────

const ShiftCard = memo(({
  shift, deleting, onEdit, onDelete,
}: {
  shift: Shift;
  deleting: boolean;
  onEdit: (s: Shift) => void;
  onDelete: (id: number) => void;
}) => (
  <div className="p-4 hover:bg-gray-50/50 transition-colors">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-800 text-sm">{shift.name}</span>
        {shift.isOvernight && (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">
            <Moon size={9} /> Overnight
          </span>
        )}
        {shift.isActive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-200">
            <CheckCircle2 size={9} /> Active
          </span>
        ) : (
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(shift)}
          className="p-1.5 rounded-lg hover:bg-role/10 text-gray-400 hover:text-role transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(shift.id)}
          disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
      <span>Starts: <strong className="text-gray-700">{shift.startTime}</strong></span>
      <span>Ends: <strong className="text-gray-700">{shift.endTime}</strong></span>
    </div>
  </div>
));

// ─── Shift Modal ──────────────────────────────────────────────────────────────

const ShiftModal = memo(({
  initial, onClose, onSaved,
}: {
  initial: Shift | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    startTime: initial?.startTime ?? '07:00',
    endTime:   initial?.endTime   ?? '15:00',
    isActive:  initial?.isActive  ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  const toggleActive = useCallback(() => {
    setForm(f => ({ ...f, isActive: !f.isActive }));
  }, []);

  const willBeOvernight = !!form.startTime && !!form.endTime && form.endTime <= form.startTime;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        start_time: form.startTime,
        end_time:   form.endTime,
        is_active:  form.isActive,
      };
      if (isEdit) {
        await axios.put(`/api/shifts/${initial!.id}`, payload);
      } else {
        await axios.post('/api/shifts', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }, [form, isEdit, initial, onSaved, onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-role">{isEdit ? 'Edit Shift' : 'New Shift'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={e => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-role outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={e => handleChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-role outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Shift name (from times)</p>
              <p className="text-sm font-semibold text-gray-700">
                {shiftNamePreview(form.startTime, form.endTime) || '—'}
              </p>
            </div>

            {willBeOvernight && (
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
                <Moon size={12} /> End time is before start time — this will be saved as an overnight shift.
              </p>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={toggleActive}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isActive ? 'bg-role' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-600">Active (selectable at check-in)</span>
            </label>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-role text-white rounded-lg font-semibold hover:bg-role-dark disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

// ─── Shifts Tab Panel ─────────────────────────────────────────────────────────

const ShiftsPanel = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Shift | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await axios.get('/api/shifts');
      setShifts(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const openNewShift = useCallback(() => {
    setEditTarget(null);
    setShowModal(true);
  }, []);

  const openEditShift = useCallback((s: Shift) => {
    setEditTarget(s);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => setShowModal(false), []);

  const handleDelete = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/shifts/${id}`);
      setShifts(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-role" />
              <h3 className="font-bold text-role">Security Shifts</h3>
            </div>
            <button
              onClick={openNewShift}
              className="flex items-center gap-2 px-3 py-2 bg-role text-white rounded-xl font-semibold text-xs hover:bg-role-dark transition-all"
            >
              <Plus size={14} /> New Shift
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-role border-t-transparent rounded-full animate-spin" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <Shield size={32} className="opacity-30" />
              <p className="text-sm">No shifts yet.</p>
              <button onClick={openNewShift} className="text-role text-sm font-semibold hover:underline">
                Create one
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {shifts.map(s => (
                <ShiftCard
                  key={s.id}
                  shift={s}
                  deleting={deletingId === s.id}
                  onEdit={openEditShift}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
          <p className="font-bold text-blue-800 mb-1">How security shift check-in works:</p>
          <p>1. Security staff pick one of the <strong>active</strong> shifts below before scanning in.</p>
          <p>2. Check-out is automatic — no picker, the system closes whichever shift is open.</p>
          <p>3. If no active shifts exist, security check-in falls back to the General schedule.</p>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <ShiftModal
            initial={editTarget}
            onClose={closeModal}
            onSaved={fetchShifts}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Static data (defined outside component to avoid re-creation) ─────────────

const TIME_FIELDS = [
  { label: 'Check-in Opens',   key: 'checkInStart' },
  { label: 'On-time Deadline', key: 'checkInDeadline' },
  { label: 'Late After',       key: 'lateThreshold' },
  { label: 'Absent After',     key: 'absentThreshold' },
  { label: 'Check-out Opens',        key: 'checkOutTime' },
] as const;

const HOW_IT_WORKS = (
  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
    <p className="font-bold text-blue-800 mb-1">How schedule resolution works:</p>
    <p>1. <strong>Date override</strong> (calendar) → takes top priority</p>
    <p>2. <strong>Day-of-week</strong> match from profiles → auto-applies</p>
    <p>3. <strong>Default</strong> profile → fallback if nothing else matches</p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AttendanceTimeSetting = () => {
  const [tab, setTab] = useState<'general' | 'shifts'>('general');
  const [settings, setSettings]   = useState<Setting[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Setting | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Calendar nav + selection — lifted here so the calendar (own card) and the
  // "overrides this month" list (shares the Time Profiles column) can stay in
  // sync without sharing a container.
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = useCallback(() => {
    setCalMonth(m => {
      if (m === 1) { setCalYear(y => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCalMonth(m => {
      if (m === 12) { setCalYear(y => y + 1); return 1; }
      return m + 1;
    });
  }, []);

  const overrideMap = useMemo(
    () => Object.fromEntries(overrides.map(o => [o.date, o])),
    [overrides],
  );

  const monthOverrides = useMemo(() => {
    const prefix = `${calYear}-${pad(calMonth)}`;
    return overrides.filter(o => o.date.startsWith(prefix));
  }, [overrides, calYear, calMonth]);

  const selectedOverride = selectedDate ? (overrideMap[selectedDate] ?? null) : null;

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  }, []);

  const closeOverrideModal = useCallback(() => setSelectedDate(null), []);

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, oRes] = await Promise.all([
        axios.get('/api/time-settings'),
        axios.get('/api/time-settings/overrides'),
      ]);
      setSettings(sRes.data.data);
      setOverrides(oRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleOverrideSaved = useCallback(() => {
    fetchAll();
    setSelectedDate(null);
  }, [fetchAll]);

  const openNewSetting = useCallback(() => {
    setEditTarget(null);
    setShowModal(true);
  }, []);

  const openEditSetting = useCallback((s: Setting) => {
    setEditTarget(s);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => setShowModal(false), []);

  const handleDelete = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/time-settings/${id}`);
      setSettings(prev => prev.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-full mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-role">Time Settings</h2>
          {tab === 'general' && (
            <button
              onClick={openNewSetting}
              className="flex items-center gap-2 px-4 py-2.5 bg-role text-white rounded-xl font-semibold text-sm hover:bg-role-dark transition-all"
            >
              <Plus size={16} /> New Setting
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('general')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'general' ? 'bg-white text-role shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock size={14} /> General
          </button>
          <button
            onClick={() => setTab('shifts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'shifts' ? 'bg-white text-role shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={14} /> Security Shifts
          </button>
        </div>

        {tab === 'shifts' ? (
          <ShiftsPanel />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-role" />
                <h3 className="font-bold text-role">Time Profiles</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-role border-t-transparent rounded-full animate-spin" />
                </div>
              ) : settings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Clock size={32} className="opacity-30" />
                  <p className="text-sm">No time profiles yet.</p>
                  <button onClick={openNewSetting} className="text-role text-sm font-semibold hover:underline">
                    Create one
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {settings.map(s => (
                    <SettingCard
                      key={s.id}
                      setting={s}
                      deleting={deletingId === s.id}
                      onEdit={openEditSetting}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            <OverridesThisMonthList
              overrides={monthOverrides}
              selectedDate={selectedDate}
              onSelect={handleDayClick}
            />

            {HOW_IT_WORKS}
          </div>

          {!loading && (
            <CalendarGrid
              year={calYear}
              month={calMonth}
              overrideMap={overrideMap}
              selectedDate={selectedDate}
              onPrev={prevMonth}
              onNext={nextMonth}
              onDayClick={handleDayClick}
            />
          )}
        </div>
        )}
      </motion.div>

      <AnimatePresence>
        {tab === 'general' && showModal && (
          <SettingModal
            initial={editTarget}
            onClose={closeModal}
            onSaved={fetchAll}
          />
        )}
        {tab === 'general' && selectedDate && (
          <OverrideModal
            date={selectedDate}
            initial={selectedOverride}
            settings={settings}
            onClose={closeOverrideModal}
            onSaved={handleOverrideSaved}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default function TimeSettingPage() {
  return (
    <DashboardLayout activePageId="time-setting">
      <AttendanceTimeSetting />
    </DashboardLayout>
  );
}
