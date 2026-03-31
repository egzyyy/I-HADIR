import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import axios from 'axios';

interface Teacher {
  teacher_id: number;
  name: string;
}

interface ClassItem {
  id: number;
  name: string;
  teacher_id: number | null;
  teacher: string;
  totalStudents: number;
  capacity: number | null;
  createdAt: string;
  sessionId: number | null;
  sessionName: string;
  isActive: boolean;
}

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassItem | null;
  teachers: Teacher[];
  onSaved: () => void;
}

export const EditClassModal = ({ isOpen, onClose, classData, teachers, onSaved }: EditClassModalProps) => {
  const [name, setName]           = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (classData) {
      setName(classData.name);
      setTeacherId(classData.teacher_id ? String(classData.teacher_id) : '');
      setCapacity(classData.capacity ? String(classData.capacity) : '');
    }
    setError('');
  }, [classData]);

  if (!isOpen || !classData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Class name is required.'); return; }
    setSaving(true);
    try {
      await axios.put(`/api/classes/${classData.id}`, {
        name:       name.trim(),
        teacher_id: teacherId || null,
        capacity:   capacity ? Number(capacity) : null,
      });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-[#1c3068]">Edit class</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

              {/* Class Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-[#c53336] mr-1">*</span> Class Name e.g. "1 Merah"
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all font-medium text-[#1c3068]"
                />
              </div>

              {/* Classroom Teacher */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Classroom Teacher (Current)
                </label>
                <div className="relative">
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-[#1c3068] font-medium cursor-pointer uppercase"
                  >
                    <option value="">— No Teacher Assigned —</option>
                    {teachers.map((t) => (
                      <option key={t.teacher_id} value={t.teacher_id}>
                        {t.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Capacity e.g. "30"
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Capacity"
                  min={1}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all font-medium text-[#1c3068]"
                />
              </div>

            </div>

            {/* Footer */}
            <div className="pt-8 flex justify-end gap-3 border-t border-gray-50 mt-8">
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
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
