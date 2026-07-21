import React from 'react';
import { motion } from 'framer-motion'; // or 'motion/react' depending on your package setup
import { User, Printer, ArrowLeft, Phone, Calendar, Hash, Users, Heart, UserCircle2 } from 'lucide-react';

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

export const UserInfoModal = ({ isOpen, onClose, user }: UserInfoModalProps) => {
    if (!isOpen || !user) return null;

    // Formatting helper for the badge (same as in the table)
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

    // Safely extract real data from the database payload
    const icNumber = user.raw_data?.ic_number || '-';
    const emergencyName = user.raw_data?.emergency_name || '-';
    const emergencyRelation = user.raw_data?.emergency_relation || '-';
    const emergencyPhone = user.raw_data?.emergency_phone_num || '-';
    const profilePicPath = user.raw_data?.profile_pic_path;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="overflow-y-auto">
                    {/* Header Background */}
                    <div className="h-32 bg-gradient-to-r from-[#1c3068] to-[#2a4595] w-full"></div>

                    <div className="relative z-10 px-8 pb-8 -mt-16">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-32 h-32 bg-white p-1 rounded-full shadow-lg mb-4 relative z-10">
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white">
                                    {/* If you implement profile pictures later, replace this icon with an <img src={user.raw_data.profile_pic_path} /> */}
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
                            <div className="mt-2 px-4 py-1 bg-blue-50 text-[#1c3068] rounded-full text-sm font-bold uppercase tracking-wide border border-blue-100 shadow-sm">
                                {roleLabel}
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Personal Info */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-4 text-[#1c3068]">
                                    <UserCircle2 size={20} />
                                    <h3 className="font-bold text-lg">Personal Information</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Hash size={12} /> IC Number
                                        </span>
                                        <span className="text-gray-900 font-medium font-mono">{icNumber}</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Users size={12} /> Gender
                                        </span>
                                        <span className="text-gray-900 font-medium">{user.gender || '-'}</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Phone size={12} /> Phone Number
                                        </span>
                                        <span className="text-gray-900 font-medium font-mono">{user.phone}</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Calendar size={12} /> Registered Date
                                        </span>
                                        <span className="text-gray-900 font-medium">{user.registeredDate}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="bg-red-50/50 rounded-xl p-6 border border-red-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-4 text-[#c53336]">
                                    <Heart size={20} />
                                    <h3 className="font-bold text-lg">Emergency Contact</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Name</span>
                                        <span className="text-gray-900 font-bold uppercase">{user.raw_data?.emergency_contact_name}</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Relation</span>
                                        <span className="text-gray-900 font-medium uppercase">{user.raw_data?.emergency_relationship}</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Phone size={12} /> Phone Number
                                        </span>
                                        <span className="text-gray-900 font-medium font-mono">{user.raw_data?.emergency_phone_num}</span>
                                    </div>
                                </div>
                            </div>
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
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#1c3068] text-white rounded-xl text-sm font-bold hover:bg-[#152450] transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
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