import React from 'react';
import { motion } from 'framer-motion';
import {
    User, Printer, ArrowLeft, Heart, UserCircle2, GraduationCap,
    Users, MapPin, HandHeart,
} from 'lucide-react';

interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name: string;
        phone: string;
        gender: string;
        role: string;
        type: string;
        registeredDate: string;
        raw_data?: any; // Contains the full database row
    } | null;
}

type FieldDef = { label: string; value: any; mono?: boolean; full?: boolean };

const isEmpty = (v: any) => v === null || v === undefined || String(v).trim() === '' || v === '-';

// 12-digit IC → 000000-00-0000
const formatIc = (ic: any) => {
    if (isEmpty(ic)) return null;
    const s = String(ic).replace(/\D/g, '');
    return s.length === 12 ? `${s.slice(0, 6)}-${s.slice(6, 8)}-${s.slice(8)}` : String(ic);
};

const formatMoney = (v: any) => {
    if (isEmpty(v)) return null;
    const n = Number(v);
    return isNaN(n) ? String(v) : `RM ${n.toLocaleString('en-MY')}`;
};

const formatDate = (v: any) => {
    if (isEmpty(v)) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB');
};

const joinParts = (...parts: any[]) => parts.filter(p => !isEmpty(p)).join(', ') || null;

const Field = ({ label, value, mono, full }: FieldDef) => (
    <div className={`flex flex-col gap-0.5 ${full ? 'sm:col-span-2' : ''}`}>
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={`text-gray-900 font-medium text-sm break-words ${mono ? 'font-mono' : ''}`}>
            {isEmpty(value) ? '-' : value}
        </span>
    </div>
);

const Section = ({
    title, icon, fields, tone = 'gray', alwaysShow = false, full = false,
}: {
    title: string; icon: React.ReactNode; fields: FieldDef[];
    tone?: 'gray' | 'red'; alwaysShow?: boolean; full?: boolean;
}) => {
    if (!alwaysShow && fields.every(f => isEmpty(f.value))) return null;
    const box = tone === 'red' ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100';
    const head = tone === 'red' ? 'text-[#c53336]' : 'text-role';
    return (
        <div className={`${box} rounded-xl p-5 border ${full ? 'md:col-span-2' : ''}`}>
            <div className={`flex items-center gap-2 mb-4 ${head}`}>
                {icon}
                <h3 className="font-bold text-base">{title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {fields.map(f => <Field key={f.label} {...f} />)}
            </div>
        </div>
    );
};

export const UserInfoModal = ({ isOpen, onClose, user }: UserInfoModalProps) => {
    if (!isOpen || !user) return null;

    const formatRoleLabel = (role: string, type: string) => {
        if (!role) return '-';
        if (type === 'staff') {
            return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        if (type === 'student') {
            return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        return role;
    };

    const roleLabel = formatRoleLabel(user.role, user.type);
    const d = user.raw_data ?? {};
    const apdm = d.apdm_raw ?? {};
    const isStudent = user.type === 'student';
    const profilePicPath = d.profile_pic_path;
    const typeLabel = isStudent ? 'Student' : user.type === 'teacher' ? 'Teacher' : 'Staff';

    // ── Sections ──────────────────────────────────────────────
    const personal: FieldDef[] = isStudent
        ? [
            { label: 'IC Number', value: formatIc(d.ic_number), mono: true },
            { label: 'ID Type', value: d.jenis_pengenalan },
            { label: 'Student ID (APDM)', value: d.id_murid, mono: true },
            { label: 'Date of Birth', value: d.tarikh_lahir },
            { label: 'Gender', value: user.gender },
            { label: 'Race', value: d.kaum },
            { label: 'Religion', value: d.agama },
            { label: 'Citizenship', value: d.warganegara },
            { label: 'Country of Origin', value: d.negara_asal },
            { label: 'Phone Number', value: d.phone_num, mono: true },
            { label: 'Email', value: d.email },
            { label: 'Registered Date', value: user.registeredDate },
        ]
        : [
            { label: 'IC Number', value: formatIc(d.ic_number), mono: true },
            { label: 'Gender', value: user.gender },
            { label: 'Phone Number', value: d.phone_num, mono: true },
            { label: 'Email', value: d.email },
            { label: 'Position', value: roleLabel },
            { label: 'Status', value: d.is_active === false ? 'Inactive' : 'Active' },
            { label: 'Registered Date', value: user.registeredDate },
        ];

    const academic: FieldDef[] = [
        { label: 'Class', value: user.role !== 'Unassigned' ? user.role : null },
        { label: 'Year', value: d.tahun_tingkatan },
        { label: 'Class Teacher', value: d.nama_guru_kelas },
        { label: 'Class Type', value: d.jenis_kelas },
        { label: 'Stream', value: d.keterangan_aliran },
        { label: 'Field', value: d.keterangan_bidang },
        { label: 'Study Status', value: d.status_pengajian },
        { label: 'DLP', value: d.status_dlp },
        { label: 'School Entry Date', value: d.tarikh_masuk_sekolah },
        { label: 'Class Entry Date', value: d.tarikh_masuk_kelas },
        { label: 'Hostel', value: d.status_asrama === 'YA' ? (d.nama_asrama || 'YA') : d.status_asrama },
    ];

    const guardian = (n: 1 | 2, fallbackName: any, fallbackIc: any, fallbackPhone: any): FieldDef[] => [
        { label: 'Name', value: d[`penjaga_${n}_name`] || fallbackName, full: true },
        { label: 'Relationship', value: d[`penjaga_${n}_hubungan`] },
        { label: 'IC Number', value: formatIc(d[`penjaga_${n}_ic`] || fallbackIc), mono: true },
        { label: 'ID Type', value: d[`penjaga_${n}_jenis_ic`] },
        { label: 'Mobile', value: d[`penjaga_${n}_tel_bimbit`] || fallbackPhone, mono: true },
        { label: 'Office Phone', value: d[`penjaga_${n}_tel_pejabat`], mono: true },
        { label: 'Occupation', value: d[`penjaga_${n}_pekerjaan`] },
        { label: 'Employment Status', value: d[`penjaga_${n}_status_kerja`] },
        { label: 'Employer', value: d[`penjaga_${n}_majikan`] },
        { label: 'Monthly Income', value: formatMoney(d[`penjaga_${n}_pendapatan`]) },
    ];

    const address: FieldDef[] = isStudent
        ? [
            { label: 'Address', value: joinParts(d.alamat_1, d.alamat_2, d.alamat_3) || d.street_address, full: true },
            { label: 'Postcode', value: d.postcode || apdm['poskod'] },
            { label: 'City', value: d.city || apdm['bandar'] },
            { label: 'District', value: d.daerah || apdm['daerah'] },
            { label: 'State', value: d.state || apdm['negeri'] },
        ]
        : [
            { label: 'Address', value: d.street_address, full: true },
            { label: 'Postcode', value: d.postcode },
            { label: 'City', value: d.city },
            { label: 'State', value: d.state },
            { label: 'Country', value: d.country },
        ];

    const welfare: FieldDef[] = [
        { label: 'Orphan Status', value: d.status_yatim },
        { label: 'Dependants', value: d.tanggungan },
        { label: 'OKU Status', value: d.status_oku },
        { label: 'OKU Category', value: d.kategori_ketidakupayaan },
        { label: 'OKU Subcategory', value: d.subkategori_ketidakupayaan },
        { label: 'OKU Registration No.', value: d.no_pendaftaran_oku, mono: true },
        { label: 'OKU Verified Date', value: d.tarikh_sah_oku },
        { label: 'OKU Registered Date', value: d.tarikh_daftar_oku },
        { label: 'OKU Card Date', value: d.tarikh_kad_oku },
        { label: 'Bank', value: d.nama_bank },
        { label: 'Bank Account No.', value: d.no_akaun_bank, mono: true },
    ];

    // Students store emergency contact as emergency_name/emergency_relation;
    // teachers & staff (users table) use emergency_contact_name/emergency_relationship.
    // APDM has no emergency columns — fall back to Guardian 1 for students.
    const emergency: FieldDef[] = [
        { label: 'Contact Name', value: isStudent ? (d.emergency_name || d.penjaga_1_name || d.father_name) : d.emergency_contact_name, full: true },
        { label: 'Relation', value: isStudent ? (d.emergency_relation || d.penjaga_1_hubungan) : d.emergency_relationship },
        { label: 'Phone Number', value: isStudent ? (d.emergency_phone_num || d.penjaga_1_tel_bimbit || d.father_phone_num) : d.emergency_phone_num, mono: true },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="overflow-y-auto">
                    {/* Header Background */}
                    <div className="h-32 bg-gradient-to-r from-role to-[#2a4595] w-full"></div>

                    <div className="relative z-10 px-6 sm:px-8 pb-8 -mt-16">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-32 h-32 bg-white p-1 rounded-full shadow-lg mb-4 relative z-10">
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white">
                                    {profilePicPath ? (
                                        <img
                                            src={`/storage/${profilePicPath}`}
                                            alt={`${user.name}'s profile`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={64} className="text-gray-400 translate-y-2" />
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 text-center px-4">{user.name}</h2>
                            <div className="mt-2 flex flex-wrap justify-center gap-2">
                                <span className="px-4 py-1 bg-blue-50 text-role rounded-full text-sm font-bold uppercase tracking-wide border border-blue-100 shadow-sm">
                                    {roleLabel}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wide self-center">
                                    {typeLabel}
                                </span>
                                {d.deleted_at && (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide self-center">
                                        Removed {formatDate(d.deleted_at)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                            <Section title="Personal Information" icon={<UserCircle2 size={20} />} fields={personal} alwaysShow />

                            {isStudent ? (
                                <Section title="Academic" icon={<GraduationCap size={20} />} fields={academic} alwaysShow />
                            ) : (
                                <Section title="Address" icon={<MapPin size={20} />} fields={address} alwaysShow />
                            )}

                            {isStudent && (
                                <>
                                    <Section
                                        title={`Guardian 1${d.penjaga_1_hubungan ? ` (${d.penjaga_1_hubungan})` : ''}`}
                                        icon={<Users size={20} />}
                                        fields={guardian(1, d.father_name, d.father_ic, d.father_phone_num)}
                                    />
                                    <Section
                                        title={`Guardian 2${d.penjaga_2_hubungan ? ` (${d.penjaga_2_hubungan})` : ''}`}
                                        icon={<Users size={20} />}
                                        fields={guardian(2, d.mother_name, d.mother_ic, d.mother_phone_num)}
                                    />
                                    <Section title="Address" icon={<MapPin size={20} />} fields={address} />
                                    <Section title="Welfare & Financial" icon={<HandHeart size={20} />} fields={welfare} />
                                </>
                            )}

                            <Section
                                title="Emergency Contact"
                                icon={<Heart size={20} />}
                                fields={emergency}
                                tone="red"
                                alwaysShow={!isStudent}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-auto">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-role text-white rounded-xl text-sm font-bold hover:bg-role-dark transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
                            >
                                <Printer size={16} /> Print Details
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
