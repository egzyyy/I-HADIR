import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Home, Globe, Landmark, Eye, Target, Users, Plus, Trash2,
  CheckCircle, AlertCircle, GripVertical, Image as ImageIcon, Search, X,
  UserRound, Upload, Network, FolderPlus, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../Layouts/DashboardLayout';
import LogoUploader from '../../Components/admin/LogoUploader';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface OrgMember {
  id: string;
  parent_id: string | null;
  user_id?: number | null;
  name: string;
  position: string;
  level?: number;
}

interface TeacherOption {
  user_id: number;
  name: string;
  position: string;
  positions?: string[];
  photo?: string | null;
}

type OrgMode = 'builder' | 'image';

interface ProfileForm {
  tagline: string;
  established_year: string;
  about: string;
  vision: string;
  mission: string;
  organization_mode: OrgMode;
  organization_image: string | null;
  organization: OrgMember[];
}

const EMPTY_FORM: ProfileForm = {
  tagline: '',
  established_year: '',
  about: '',
  vision: '',
  mission: '',
  organization_mode: 'builder',
  organization_image: null,
  organization: [],
};

const makeNodeId = () =>
  `org_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// Convert any legacy flat `level` rows into `id` + `parent_id` nodes automatically
function normalizeOrgNodes(raw: any[]): OrgMember[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const hasTreeIds = raw.some((m) => m.id);
  if (hasTreeIds) {
    return raw.map((m) => ({
      id: String(m.id || makeNodeId()),
      parent_id: m.parent_id ? String(m.parent_id) : null,
      user_id: m.user_id ?? null,
      name: m.name || '',
      position: m.position || '',
      level: m.level ?? 1,
    }));
  }

  const nodes: OrgMember[] = raw.map((m) => ({
    id: makeNodeId(),
    parent_id: null,
    user_id: m.user_id ?? null,
    name: m.name || '',
    position: m.position || '',
    level: m.level ?? 3,
  }));

  const firstL1 = nodes.find((n) => n.level === 1);
  const firstL2 = nodes.find((n) => n.level === 2);

  return nodes.map((n) => {
    if (n.level === 2 && firstL1) return { ...n, parent_id: firstL1.id };
    if (n.level === 3 && (firstL2 || firstL1)) return { ...n, parent_id: (firstL2 || firstL1)!.id };
    return n;
  });
}

// Prevent dropping a parent into one of its own descendants
function isDescendant(nodes: OrgMember[], ancestorId: string, candidateId: string): boolean {
  let current = nodes.find((n) => n.id === candidateId);
  const visited = new Set<string>();
  while (current?.parent_id) {
    if (current.parent_id === ancestorId) return true;
    if (visited.has(current.parent_id)) break;
    visited.add(current.parent_id);
    current = nodes.find((n) => n.id === current!.parent_id);
  }
  return false;
}

function getTeacherPositions(teacher: TeacherOption): string[] {
  if (teacher.positions && teacher.positions.length > 0) {
    return teacher.positions;
  }
  return (teacher.position || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all text-gray-700';

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
      <div className="w-10 h-10 rounded-xl bg-role/10 flex items-center justify-center text-role">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-role">{title}</h3>
    </div>
    <p className="text-gray-500 text-sm mb-6 ml-13">{subtitle}</p>
    {children}
  </div>
);

export default function LandingContent() {
  const [formData, setFormData] = useState<ProfileForm>(EMPTY_FORM);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  // Add Member Modal States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'teacher' | 'custom'>('teacher');
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [customNodeName, setCustomNodeName] = useState('');
  const [customNodePosition, setCustomNodePosition] = useState('');

  // Org Image Upload States
  const orgImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingOrgImage, setIsUploadingOrgImage] = useState(false);

  // Drag & Drop States
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);

  const { refresh } = useAuth();
  const [schoolLogo, setSchoolLogoState] = useState<string | null>(null);
  const [maxUploadMb, setMaxUploadMb] = useState<number | undefined>(undefined);

  const setSchoolLogo = (url: string | null) => {
    setSchoolLogoState(url);
    refresh();
  };

  useEffect(() => {
    axios
      .get('/api/branding')
      .then((res) => {
        if (!res.data?.success) return;
        setSchoolLogoState(res.data.data.school_logo ?? null);
        setMaxUploadMb(res.data.data.max_upload_mb ?? undefined);
      })
      .catch((err) => console.error('Failed to fetch branding', err));
  }, []);

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
          organization_mode: d.organization_mode === 'image' ? 'image' : 'builder',
          organization_image: d.organization_image || null,
          organization: normalizeOrgNodes(d.organization || []),
        });
        setTeachers(res.data.teachers || []);
      })
      .catch((err) => console.error('Failed to fetch landing profile', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Org Tree Helpers ──────────────────────────────────────────────────────
  const findTeacherForNode = (node: OrgMember): TeacherOption | undefined => {
    if (node.user_id) {
      const byId = teachers.find((t) => t.user_id === node.user_id);
      if (byId) return byId;
    }
    return teachers.find(
      (t) => t.name.trim().toLowerCase() === node.name.trim().toLowerCase()
    );
  };

  const openPicker = (parentId: string | null) => {
    setTargetParentId(parentId);
    setPickerTab('teacher');
    setTeacherSearch('');
    setCustomNodeName('');
    setCustomNodePosition('');
    setIsPickerOpen(true);
  };

  const countTeacherUses = (teacher: TeacherOption) =>
    formData.organization.filter(
      (m) =>
        (m.user_id && m.user_id === teacher.user_id) ||
        m.name.trim().toLowerCase() === teacher.name.trim().toLowerCase()
    ).length;

  const handleAddTeacher = (teacher: TeacherOption) => {
    const posList = getTeacherPositions(teacher);
    const newNode: OrgMember = {
      id: makeNodeId(),
      parent_id: targetParentId,
      user_id: teacher.user_id,
      name: teacher.name,
      position: posList[0] || '',
    };
    setFormData((prev) => ({
      ...prev,
      organization: [...prev.organization, newNode],
    }));
    setIsPickerOpen(false);
  };

  const handleAddCustomNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNodeName.trim()) return;
    const newNode: OrgMember = {
      id: makeNodeId(),
      parent_id: targetParentId,
      user_id: null,
      name: customNodeName.trim(),
      position: customNodePosition.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      organization: [...prev.organization, newNode],
    }));
    setIsPickerOpen(false);
  };

  const updateNode = (id: string, field: 'name' | 'position', value: string) => {
    setFormData((prev) => ({
      ...prev,
      organization: prev.organization.map((n) => (n.id === id ? { ...n, [field]: value } : n)),
    }));
  };

  const removeNode = (id: string) => {
    setFormData((prev) => {
      const target = prev.organization.find((n) => n.id === id);
      const fallbackParent = target?.parent_id ?? null;
      return {
        ...prev,
        organization: prev.organization
          .filter((n) => n.id !== id)
          .map((n) => (n.parent_id === id ? { ...n, parent_id: fallbackParent } : n)),
      };
    });
  };

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────────
  const clearDrag = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDragOverRoot(false);
  };

  const handleDropOnNode = (e: React.DragEvent, newParentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === newParentId) return clearDrag();
    if (isDescendant(formData.organization, draggedId, newParentId)) return clearDrag();

    setFormData((prev) => ({
      ...prev,
      organization: prev.organization.map((n) =>
        n.id === draggedId ? { ...n, parent_id: newParentId } : n
      ),
    }));
    clearDrag();
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return clearDrag();
    setFormData((prev) => ({
      ...prev,
      organization: prev.organization.map((n) =>
        n.id === draggedId ? { ...n, parent_id: null } : n
      ),
    }));
    clearDrag();
  };

  // ─── Org Image Upload Handlers ─────────────────────────────────────────────
  const handleOrgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOrgImage(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await axios.post('/api/school/landing-profile/org-image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          organization_mode: 'image',
          organization_image: res.data.url,
        }));
      }
    } catch (err: any) {
      setErrorModalMsg(err.response?.data?.message || 'Failed to upload organization chart image.');
    } finally {
      setIsUploadingOrgImage(false);
      if (orgImageInputRef.current) orgImageInputRef.current.value = '';
    }
  };

  const handleRemoveOrgImage = async () => {
    try {
      await axios.delete('/api/school/landing-profile/org-image');
      setFormData((prev) => ({ ...prev, organization_image: null }));
    } catch {
      setErrorModalMsg('Failed to remove image.');
    }
  };

  // ─── Save All ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (formData.organization_mode === 'builder') {
      const incomplete = formData.organization.some((m) => !m.name.trim());
      if (incomplete) {
        setErrorModalMsg('Every node in the organization chart must have a name.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await axios.post('/api/school/landing-profile', {
        tagline: formData.tagline || null,
        established_year: formData.established_year || null,
        about: formData.about || null,
        vision: formData.vision || null,
        mission: formData.mission || null,
        organization_mode: formData.organization_mode,
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

  // ─── Recursive Tree Renderer (Builder) ─────────────────────────────────────
  const renderTreeNode = (node: OrgMember, depth = 0) => {
    const children = formData.organization.filter((n) => n.parent_id === node.id);
    const isRoot = depth === 0;
    const isDragging = draggedId === node.id;
    const isDropTarget = dragOverId === node.id && draggedId !== node.id;

    const matchedTeacher = findTeacherForNode(node);
    const isTeacherNode = Boolean(matchedTeacher || node.user_id);

    const teacherPositions = matchedTeacher ? getTeacherPositions(matchedTeacher) : [];
    const positionOptions = Array.from(
      new Set([...teacherPositions, ...(node.position ? [node.position] : [])])
    );

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          draggable
          onDragStart={(e) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'OPTION') {
              e.preventDefault();
              return;
            }
            setDraggedId(node.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={clearDrag}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedId && draggedId !== node.id && !isDescendant(formData.organization, draggedId, node.id)) {
              setDragOverId(node.id);
            }
          }}
          onDragLeave={() => setDragOverId((prev) => (prev === node.id ? null : prev))}
          onDrop={(e) => handleDropOnNode(e, node.id)}
          className={`relative group rounded-2xl bg-white border p-3.5 text-center transition-all cursor-grab active:cursor-grabbing select-none ${
            isRoot ? 'w-56' : 'w-48'
          } ${
            isDragging
              ? 'opacity-40 scale-95 border-role'
              : isDropTarget
              ? 'border-role ring-2 ring-role/30 bg-role/5 shadow-md'
              : 'border-gray-200 shadow-sm hover:shadow-md hover:border-role/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gray-300 group-hover:text-gray-500" title="Drag onto another card to move under it">
              <GripVertical size={14} />
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openPicker(node.id)}
                className="p-1 rounded-md text-role bg-role/10 hover:bg-role hover:text-white transition-colors"
                title={`Add member / unit under ${node.name || 'this node'}`}
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeNode(node.id)}
                className="p-1 rounded-md text-gray-300 hover:text-[#c53336] hover:bg-red-50 transition-colors"
                title="Remove node"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Profile Photo or Default Icon */}
          <div
            className={`mx-auto rounded-full flex items-center justify-center mb-2 bg-role/10 text-role overflow-hidden ${
              isRoot ? 'w-14 h-14' : 'w-11 h-11'
            }`}
          >
            {matchedTeacher?.photo ? (
              <img
                src={matchedTeacher.photo}
                alt={node.name}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <UserRound size={isRoot ? 24 : 18} />
            )}
          </div>

          {/* Name & Position */}
          {isTeacherNode ? (
            <>
              <p className="w-full text-center text-xs font-bold text-role px-1.5 py-0.5 leading-snug">
                {node.name}
              </p>

              <div className="relative mt-1.5">
                <select
                  value={node.position}
                  onChange={(e) => updateNode(node.id, 'position', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full appearance-none text-center text-[11px] text-gray-600 bg-gray-50 border border-gray-200 hover:border-role/40 focus:border-role focus:bg-white rounded-lg pl-2 pr-6 py-1.5 outline-none cursor-pointer truncate"
                >
                  {positionOptions.length === 0 && <option value="">No position set</option>}
                  {positionOptions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                value={node.name}
                onChange={(e) => updateNode(node.id, 'name', e.target.value)}
                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                placeholder="Unit / Panitia Name"
                className="w-full text-center text-xs font-bold text-role bg-transparent border border-transparent hover:border-gray-200 focus:border-role focus:bg-gray-50 rounded-md px-1.5 py-0.5 outline-none"
              />
              <input
                type="text"
                value={node.position}
                onChange={(e) => updateNode(node.id, 'position', e.target.value)}
                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                placeholder="Subtitle (optional)"
                className="w-full text-center text-[11px] text-gray-500 bg-gray-50/70 border border-gray-100 hover:border-gray-200 focus:border-role focus:bg-white rounded-md px-1.5 py-0.5 mt-1 outline-none"
              />
            </>
          )}
        </div>

        {/* Children with Org-Chart Connecting Lines */}
        {children.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gray-300" />
            <div className="flex items-start justify-center">
              {children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                const isOnly = children.length === 1;

                return (
                  <div key={child.id} className="relative flex flex-col items-center px-2.5 pt-5">
                    {!isOnly && (
                      <>
                        {!isFirst && <div className="absolute top-0 left-0 right-1/2 h-0.5 bg-gray-300" />}
                        {!isLast && <div className="absolute top-0 left-1/2 right-0 h-0.5 bg-gray-300" />}
                      </>
                    )}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-gray-300" />
                    {renderTreeNode(child, depth + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootNodes = formData.organization.filter(
    (n) => !n.parent_id || !formData.organization.some((p) => p.id === n.parent_id)
  );

  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.position || '').toLowerCase().includes(q);
  });

  const targetParentNode = targetParentId
    ? formData.organization.find((n) => n.id === targetParentId)
    : null;

  if (isLoading) {
    return (
      <DashboardLayout activePageId="landing-content">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-role font-bold animate-pulse">Loading landing page content...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePageId="landing-content">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-role tracking-tight">Landing Page Content</h2>
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
          {/* Logos */}
          <Section
            icon={ImageIcon}
            title="Logos"
            subtitle="The school logo appears beside the Fakulti Komputeran logo everywhere in the system — dashboard, login, landing page and every PDF export."
          >
            <LogoUploader
              title="School Logo"
              description="Replaces your school's crest across the whole system."
              value={schoolLogo}
              fallback="school"
              endpoint="/api/branding/school-logo"
              maxMb={maxUploadMb}
              onChange={setSchoolLogo}
            />
          </Section>

          {/* Identity */}
          <Section
            icon={Landmark}
            title="School Identity"
            subtitle="Shown in the hero banner and the 'About the school' figures."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-role">Tagline</label>
                <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} className={inputClass} placeholder="e.g. Building a smart, present, and disciplined generation." />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-role">Established Year</label>
                <input type="text" name="established_year" value={formData.established_year} onChange={handleChange} className={inputClass} placeholder="e.g. 1985" />
              </div>
            </div>
          </Section>

          {/* About */}
          <Section
            icon={Globe}
            title="About the School"
            subtitle="The introduction paragraphs. Separate paragraphs with a blank line."
          >
            <textarea rows={6} name="about" value={formData.about} onChange={handleChange} className={`${inputClass} leading-relaxed resize-y`} placeholder="Tell visitors about your school..." />
          </Section>

          {/* Vision & Mission */}
          <Section
            icon={Target}
            title="Vision & Mission"
            subtitle="Displayed side-by-side in the 'Our aspiration' section."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-role">
                  <Eye size={16} className="text-[#c53336]" /> Vision
                </label>
                <textarea rows={5} name="vision" value={formData.vision} onChange={handleChange} className={`${inputClass} leading-relaxed resize-y`} placeholder="Your school's vision statement..." />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-role">
                  <Target size={16} className="text-[#c53336]" /> Mission
                </label>
                <textarea rows={5} name="mission" value={formData.mission} onChange={handleChange} className={`${inputClass} leading-relaxed resize-y`} placeholder="Your school's mission statement..." />
              </div>
            </div>
          </Section>

          {/* Organization Hierarchy — Mode Tabs (Custom Builder vs Upload Image) */}
          <Section
            icon={Users}
            title="Organization Hierarchy"
            subtitle="Build a custom tree with connecting lines (Guru Besar → PK → Panitia → Teachers) or upload your school's existing organization chart image."
          >
            {/* Mode Switcher Tabs */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, organization_mode: 'builder' }))}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  formData.organization_mode === 'builder'
                    ? 'bg-role text-white shadow-sm'
                    : 'text-gray-600 hover:text-role'
                }`}
              >
                <Network size={16} /> Customize Hierarchy
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, organization_mode: 'image' }))}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  formData.organization_mode === 'image'
                    ? 'bg-role text-white shadow-sm'
                    : 'text-gray-600 hover:text-role'
                }`}
              >
                <Upload size={16} /> Upload Org Chart Image
              </button>
            </div>

            {formData.organization_mode === 'builder' ? (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedId) setDragOverRoot(true);
                  }}
                  onDragLeave={() => setDragOverRoot(false)}
                  onDrop={handleDropOnRoot}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed transition-all ${
                    dragOverRoot ? 'border-role bg-role/5' : 'border-gray-200 bg-gray-50/70'
                  }`}
                >
                  <p className="text-xs text-gray-500">
                    {draggedId
                      ? 'Drop here to make this card a top-level root, or drop directly onto another card to nest under it.'
                      : 'Click + on any card to add subordinates (e.g. Panitia or Teachers under PK Pentadbiran), or drag cards onto each other to re-link.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openPicker(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-role hover:bg-role-dark text-white px-4 py-2 rounded-lg shadow-sm flex-shrink-0"
                  >
                    <Plus size={14} /> Add Top-Level Member
                  </button>
                </div>

                {rootNodes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No organization chart yet — click <strong>Add Top-Level Member</strong> to add your Guru Besar and start building branches.
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-6 pt-4 px-4 bg-[#f8fafc] rounded-2xl border border-gray-200">
                    <div className="inline-flex min-w-full justify-center gap-8">
                      {rootNodes.map((root) => renderTreeNode(root, 0))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Upload Org Chart Image Tab */
              <div className="space-y-4">
                <input
                  ref={orgImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleOrgImageUpload}
                  className="hidden"
                />

                {formData.organization_image ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                    <div className="rounded-xl overflow-hidden bg-white border border-gray-100 flex justify-center p-2">
                      <img
                        src={formData.organization_image}
                        alt="School Organization Chart"
                        className="max-h-[480px] w-auto object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => orgImageInputRef.current?.click()}
                        disabled={isUploadingOrgImage}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-white text-role hover:bg-gray-50"
                      >
                        <Upload size={15} /> {isUploadingOrgImage ? 'Uploading...' : 'Replace Image'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveOrgImage}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={15} /> Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => orgImageInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-role rounded-2xl p-12 text-center cursor-pointer bg-gray-50/70 hover:bg-role/5 transition-all"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-role/10 text-role flex items-center justify-center mb-4">
                      <Upload size={26} />
                    </div>
                    <p className="font-bold text-role text-sm">
                      {isUploadingOrgImage ? 'Uploading organization chart...' : 'Click to upload your school organization chart image'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, or WEBP (recommended high-resolution landscape, max 5 MB)</p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Save */}
          <div className="flex justify-end pb-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-role hover:bg-role-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-role/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>

        {/* ADD MEMBER / UNIT PICKER MODAL */}
        <AnimatePresence>
          {isPickerOpen && (
            <div
              className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsPickerOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[82vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                  <div>
                    <h3 className="text-lg font-bold text-role">
                      {targetParentNode ? `Add Under: ${targetParentNode.name}` : 'Add Top-Level Member'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Pick a teacher (teachers with multiple roles can be added again) or create a Panitia / Unit node.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Picker Mode Tabs */}
                <div className="px-4 pt-3 flex gap-2 border-b border-gray-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setPickerTab('teacher')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                      pickerTab === 'teacher' ? 'bg-role text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Users size={14} /> From Teacher List
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('custom')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                      pickerTab === 'custom' ? 'bg-role text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FolderPlus size={14} /> Custom Panitia / Unit
                  </button>
                </div>

                {pickerTab === 'teacher' ? (
                  <>
                    <div className="p-4 border-b border-gray-100">
                      <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          placeholder="Search teacher name or position..."
                          autoFocus
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-role focus:bg-white outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
                      {filteredTeachers.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-400">No matching teachers found.</div>
                      ) : (
                        filteredTeachers.map((teacher) => {
                          const useCount = countTeacherUses(teacher);
                          return (
                            <button
                              key={teacher.user_id}
                              type="button"
                              onClick={() => handleAddTeacher(teacher)}
                              className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 bg-white hover:border-role/40 hover:bg-role/5 transition-all flex items-center justify-between gap-3 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-role/10 text-role flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {teacher.photo ? (
                                    <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <UserRound size={16} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-gray-800 truncate">{teacher.name}</p>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {teacher.position || 'No position set'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {useCount > 0 && (
                                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    In chart ({useCount}×)
                                  </span>
                                )}
                                <span className="text-xs font-bold text-role">Add</span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleAddCustomNode} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-role uppercase">Unit / Panitia Name *</label>
                      <input
                        type="text"
                        value={customNodeName}
                        onChange={(e) => setCustomNodeName(e.target.value)}
                        placeholder="e.g. Panitia Bahasa Melayu"
                        autoFocus
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-role uppercase">Subtitle / Role (Optional)</label>
                      <input
                        type="text"
                        value={customNodePosition}
                        onChange={(e) => setCustomNodePosition(e.target.value)}
                        placeholder="e.g. Kurikulum"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-role hover:bg-role-dark text-white py-3 rounded-xl font-bold text-sm shadow-md"
                    >
                      Add to Chart
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ERROR & SUCCESS MODALS */}
        <AnimatePresence>
          {errorModalMsg && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Save Failed</h3>
                <p className="text-gray-500 mb-8">{errorModalMsg}</p>
                <button onClick={() => setErrorModalMsg(null)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20">
                  Go Back & Fix
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-role mb-2">Published!</h3>
                <p className="text-gray-500 mb-8">Your landing page content has been saved and is now live on the public page.</p>
                <button onClick={() => setShowSuccessModal(false)} className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20">
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