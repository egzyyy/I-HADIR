import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface Teacher {
  teacher_id: number;
  name: string;
}

interface ClassData {
  id: number;
  name: string;
  teacher_id: number | null;
  capacity: number | null;
  totalStudents?: number;
}

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  teachers: Teacher[];
  onSaved: (updatedName?: string) => void;
}

const DARJAH_OPTIONS = [
  { value: 'Prasekolah', label: 'Prasekolah' },
  { value: '1', label: '1 (Darjah 1)' },
  { value: '2', label: '2 (Darjah 2)' },
  { value: '3', label: '3 (Darjah 3)' },
  { value: '4', label: '4 (Darjah 4)' },
  { value: '5', label: '5 (Darjah 5)' },
  { value: '6', label: '6 (Darjah 6)' },
];

function parseClassName(fullName: string): { darjah: string; className: string } {
  const trimmed = (fullName || '').trim();

  const praMatch = trimmed.match(/^prasekolah\s+(.*)$/i);
  if (praMatch) {
    return { darjah: 'Prasekolah', className: praMatch[1].trim() };
  }

  const numMatch = trimmed.match(/^(?:darjah\s+)?([1-6])\s+(.*)$/i);
  if (numMatch) {
    return { darjah: numMatch[1], className: numMatch[2].trim() };
  }

  return { darjah: '', className: trimmed };
}

export const EditClassModal = ({
  isOpen,
  onClose,
  classData,
  teachers,
  onSaved,
}: EditClassModalProps) => {
  const [darjah, setDarjah] = useState('');
  const [className, setClassName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classData) {
      const parsed = parseClassName(classData.name);
      setDarjah(parsed.darjah);
      setClassName(parsed.className);
      setTeacherId(classData.teacher_id ? String(classData.teacher_id) : '');
      setCapacity(classData.capacity ? String(classData.capacity) : '');
      setError('');
    }
  }, [classData]);

  if (!isOpen || !classData) return null;

  const combinedClassName =
    darjah && className.trim() ? `${darjah} ${className.trim()}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!darjah) {
      setError('Please select a Darjah / Level.');
      return;
    }
    if (!className.trim()) {
      setError('Class name is required.');
      return;
    }
    if (
      capacity &&
      classData.totalStudents !== undefined &&
      Number(capacity) < classData.totalStudents
    ) {
      setError(
        `Capacity cannot be lower than current student count (${classData.totalStudents}).`
      );
      return;
    }

    setSaving(true);
    try {
      await axios.put(`/api/classes/${classData.id}`, {
        name: combinedClassName,
        teacher_id: teacherId || null,
        capacity: capacity ? Number(capacity) : null,
      });
      onSaved(combinedClassName);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-role">Edit Class</h3>
            <p className="text-gray-500 text-sm mt-1">Update the details for this class.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Darjah / Level */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Darjah
                </label>
                <div className="relative">
                  <select
                    value={darjah}
                    onChange={(e) => setDarjah(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                  >
                    <option value="">Select Darjah...</option>
                    {DARJAH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Class Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Class Name e.g. "Bestari", "Pintar"
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Bestari"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                />
                {combinedClassName && (
                  <p className="text-xs text-gray-500">
                    Saved as: <span className="font-bold text-role">{combinedClassName}</span>
                  </p>
                )}
              </div>

              {/* Classroom Teacher */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Classroom Teacher
                </label>
                <div className="relative">
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                  >
                    <option value="">— No Teacher Assigned —</option>
                    {teachers.map((t) => (
                      <option key={t.teacher_id} value={t.teacher_id}>
                        {t.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Capacity e.g. "30"
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Capacity"
                  min={1}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 min-w-[120px]"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};