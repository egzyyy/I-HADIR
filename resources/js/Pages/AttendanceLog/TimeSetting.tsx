import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Plus, Pencil, Trash2, X, Star, Calendar, BanIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
          className="p-1.5 rounded-lg hover:bg-[#1c3068]/10 text-gray-400 hover:text-[#1c3068] transition-colors"
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
          <span key={d} className="px-2 py-0.5 bg-[#1c3068]/10 text-[#1c3068] text-[10px] font-bold rounded-full">
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
          <h3 className="text-lg font-bold text-[#1c3068]">{isEdit ? 'Edit Setting' : 'New Time Setting'}</h3>
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none"
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
                        ? 'bg-[#1c3068] text-white border-[#1c3068]'
                        : 'text-gray-500 border-gray-200 hover:border-[#1c3068]'
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
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isDefault ? 'bg-[#1c3068]' : 'bg-gray-200'}`}
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
              className="px-5 py-2 text-sm bg-[#1c3068] text-white rounded-lg font-semibold hover:bg-[#152450] disabled:opacity-50"
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
            <h3 className="text-lg font-bold text-[#1c3068]">Date Override</h3>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none"
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
                className="px-5 py-2 text-sm bg-[#1c3068] text-white rounded-lg font-semibold hover:bg-[#152450] disabled:opacity-50"
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

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const OverrideCalendar = memo(({
  settings, overrides, onRefresh,
}: {
  settings: Setting[];
  overrides: Override[];
  onRefresh: () => void;
}) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = useCallback(() => {
    setMonth(m => {
      if (m === 1) { setYear(y => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setMonth(m => {
      if (m === 12) { setYear(y => y + 1); return 1; }
      return m + 1;
    });
  }, []);

  // O(n) map built once per overrides change — not on every calendar navigation
  const overrideMap = useMemo(
    () => Object.fromEntries(overrides.map(o => [o.date, o])),
    [overrides],
  );

  // Cells array rebuilt only when year/month changes
  const cells = useMemo<(number | null)[]>(() => {
    const startDay = getFirstDayOfMonth(year, month);
    const days = getDaysInMonth(year, month);
    return [
      ...Array<null>(startDay - 1).fill(null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  }, [year, month]);

  // Single filter pass — used for both the length check and the list render
  const monthOverrides = useMemo(() => {
    const prefix = `${year}-${pad(month)}`;
    return overrides.filter(o => o.date.startsWith(prefix));
  }, [overrides, year, month]);

  const monthTitle = useMemo(() => getMonthLabel(year, month), [year, month]);

  const selectedOverride = selectedDate ? (overrideMap[selectedDate] ?? null) : null;

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  }, []);

  const handleModalClose = useCallback(() => setSelectedDate(null), []);

  const handleModalSaved = useCallback(() => {
    onRefresh();
    setSelectedDate(null);
  }, [onRefresh]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#1c3068]" />
            <h3 className="font-bold text-[#1c3068]">Calendar Overrides</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">{monthTitle}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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
              if (isToday)                      cellStyle = 'font-bold text-[#1c3068]';
              if (isSelected)                   cellStyle = 'bg-[#1c3068] text-white hover:bg-[#152450]';
              if (ov?.isClosed && !isSelected)  cellStyle = 'text-red-400 bg-red-50 hover:bg-red-100';
              if (ov && !ov.isClosed && !isSelected) cellStyle = 'text-blue-600 bg-blue-50 hover:bg-blue-100';

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
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

      {monthOverrides.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-600">Overrides this month</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {monthOverrides.map(o => (
              <OverrideListItem
                key={o.id}
                override={o}
                isSelected={o.date === selectedDate}
                onSelect={handleDayClick}
              />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedDate && (
          <OverrideModal
            date={selectedDate}
            initial={selectedOverride}
            settings={settings}
            onClose={handleModalClose}
            onSaved={handleModalSaved}
          />
        )}
      </AnimatePresence>
    </>
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
  const [settings, setSettings]   = useState<Setting[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Setting | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
          <h2 className="text-2xl font-bold text-[#1c3068]">Time Settings</h2>
          <button
            onClick={openNewSetting}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1c3068] text-white rounded-xl font-semibold text-sm hover:bg-[#152450] transition-all"
          >
            <Plus size={16} /> New Setting
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-[#1c3068]" />
                <h3 className="font-bold text-[#1c3068]">Time Profiles</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : settings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Clock size={32} className="opacity-30" />
                  <p className="text-sm">No time profiles yet.</p>
                  <button onClick={openNewSetting} className="text-[#1c3068] text-sm font-semibold hover:underline">
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

            {HOW_IT_WORKS}
          </div>

          {!loading && (
            <OverrideCalendar
              settings={settings}
              overrides={overrides}
              onRefresh={fetchAll}
            />
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <SettingModal
            initial={editTarget}
            onClose={closeModal}
            onSaved={fetchAll}
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
