import React, { useState, useEffect } from 'react';
import {
  Save, Home, Globe, Landmark, Eye, Target, Users, Plus, Trash2,
  CheckCircle, AlertCircle, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../Layouts/DashboardLayout';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface OrgMember {
  name: string;
  position: string;
  level: number; // 1 = head, 2 = deputies, 3 = other staff
}

interface ProfileForm {
  tagline: string;
  established_year: string;
  about: string;
  vision: string;
  mission: string;
  organization: OrgMember[];
}

const EMPTY_FORM: ProfileForm = {
  tagline: '',
  established_year: '',
  about: '',
  vision: '',
  mission: '',
  organization: [],
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Head (e.g. Guru Besar)',
  2: 'Deputy / Senior Assistant',
  3: 'Staff / Committee',
};

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700';

// Section wrapper to keep the form visually grouped like the rest of the app.
const Section = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-xl bg-[#1c3068]/10 flex items-center justify-center text-[#1c3068]">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-[#1c3068]">{title}</h3>
    </div>
    <p className="text-gray-500 text-sm mb-6 ml-13">{subtitle}</p>
    {children}
  </div>
);

export default function LandingContent() {
  const [formData, setFormData] = useState<ProfileForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('/api/school/landing-profile')
      .then((res) => {
        const d = res.data.data;
        setFormData({
          tagline: d.tagline || '',
          established_year: d.established_year || '',
          about: d.about || '',
          vision: d.vision || '',
          mission: d.mission || '',
          organization: d.organization || [],
        });
      })
      .catch((err) => console.error('Failed to fetch landing profile', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateMember = (idx: number, field: keyof OrgMember, value: string | number) => {
    const organization = formData.organization.map((m, i) =>
      i === idx ? { ...m, [field]: value } : m
    );
    setFormData({ ...formData, organization });
  };

  const addMember = () => {
    setFormData({
      ...formData,
      organization: [...formData.organization, { name: '', position: '', level: 3 }],
    });
  };

  const removeMember = (idx: number) => {
    setFormData({
      ...formData,
      organization: formData.organization.filter((_, i) => i !== idx),
    });
  };

  const handleSave = async () => {
    // Incomplete organization rows would fail backend validation — catch them early.
    const incomplete = formData.organization.some((m) => !m.name.trim() || !m.position.trim());
    if (incomplete) {
      setErrorModalMsg('Every organization member needs both a name and a position. Remove empty rows or fill them in.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await axios.post('/api/school/landing-profile', {
        tagline: formData.tagline || null,
        established_year: formData.established_year || null,
        about: formData.about || null,
        vision: formData.vision || null,
        mission: formData.mission || null,
        organization: formData.organization,
      });
      if (res.data.success) setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Failed to save landing profile', err);
      setErrorModalMsg(err.response?.data?.message || 'Failed to save. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout activePageId="landing-content">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[#1c3068] font-bold animate-pulse">Loading landing page content...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePageId="landing-content">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#1c3068] tracking-tight">Landing Page Content</h2>
            <p className="text-gray-500 text-sm mt-1">
              Control what visitors see on your school's public landing page. Fields left
              empty fall back to the default copy.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500">
            <Home size={14} />
            <span>Dashboard</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#c53336]">Landing Page</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Identity */}
          <Section
            icon={Landmark}
            title="School Identity"
            subtitle="Shown in the hero banner and the 'About the school' figures."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-[#1c3068]">Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Building a smart, present, and disciplined generation."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1c3068]">Established Year</label>
                <input
                  type="text"
                  name="established_year"
                  value={formData.established_year}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 1985"
                />
              </div>
            </div>
          </Section>

          {/* About */}
          <Section
            icon={Globe}
            title="About the School"
            subtitle="The introduction paragraphs. Separate paragraphs with a blank line."
          >
            <textarea
              rows={6}
              name="about"
              value={formData.about}
              onChange={handleChange}
              className={`${inputClass} leading-relaxed resize-y`}
              placeholder="Tell visitors about your school — its history, community, and what makes it special..."
            />
          </Section>

          {/* Vision & Mission */}
          <Section
            icon={Target}
            title="Vision & Mission"
            subtitle="Displayed side-by-side in the 'Our aspiration' section."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1c3068]">
                  <Eye size={16} className="text-[#c53336]" /> Vision
                </label>
                <textarea
                  rows={5}
                  name="vision"
                  value={formData.vision}
                  onChange={handleChange}
                  className={`${inputClass} leading-relaxed resize-y`}
                  placeholder="Your school's vision statement..."
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[#1c3068]">
                  <Target size={16} className="text-[#c53336]" /> Mission
                </label>
                <textarea
                  rows={5}
                  name="mission"
                  value={formData.mission}
                  onChange={handleChange}
                  className={`${inputClass} leading-relaxed resize-y`}
                  placeholder="Your school's mission statement..."
                />
              </div>
            </div>
          </Section>

          {/* Organization */}
          <Section
            icon={Users}
            title="Organization Hierarchy"
            subtitle="Your school's leadership chart, grouped by tier. Leave empty to hide the section entirely."
          >
            <div className="space-y-3">
              {formData.organization.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No members yet — add your Guru Besar, senior assistants, and committee members.
                </div>
              )}

              {formData.organization.map((member, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-gray-50 rounded-xl border border-gray-200 p-3"
                >
                  <GripVertical size={16} className="text-gray-300 hidden md:block flex-shrink-0" />
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(idx, 'name', e.target.value)}
                    className={`${inputClass} md:flex-1 bg-white`}
                    placeholder="Full name"
                  />
                  <input
                    type="text"
                    value={member.position}
                    onChange={(e) => updateMember(idx, 'position', e.target.value)}
                    className={`${inputClass} md:flex-1 bg-white`}
                    placeholder="Position (e.g. Guru Besar)"
                  />
                  <select
                    value={member.level}
                    onChange={(e) => updateMember(idx, 'level', Number(e.target.value))}
                    className={`${inputClass} md:w-60 bg-white`}
                  >
                    {[1, 2, 3].map((lvl) => (
                      <option key={lvl} value={lvl}>{LEVEL_LABELS[lvl]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="p-3 rounded-xl text-gray-400 hover:text-[#c53336] hover:bg-red-50 transition-colors flex-shrink-0 self-center"
                    title="Remove member"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 text-sm font-bold text-[#1c3068] hover:text-[#c53336] transition-colors px-2 py-2"
              >
                <Plus size={16} /> Add member
              </button>
            </div>
          </Section>

          {/* Save */}
          <div className="flex justify-end pb-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>

        {/* ERROR MODAL */}
        <AnimatePresence>
          {errorModalMsg && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Save Failed</h3>
                <p className="text-gray-500 mb-8">{errorModalMsg}</p>
                <button
                  onClick={() => setErrorModalMsg(null)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                  Go Back & Fix
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SUCCESS MODAL */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Published!</h3>
                <p className="text-gray-500 mb-8">
                  Your landing page content has been saved and is now live on the public page.
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
