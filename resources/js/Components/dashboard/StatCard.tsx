import React from 'react';
import { motion } from 'motion/react';

export const StatCard = ({ icon: Icon, label, value, colorClass, delay }: { icon: any, label: string, value: string, colorClass: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
  >
    <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-3xl font-black text-role">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className={`mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden`}>
      <div className={`h-full ${colorClass} w-2/3 rounded-full`}></div>
    </div>
  </motion.div>
);
