import React from 'react';
import { motion } from 'motion/react';
import DashboardLayout from '../Layouts/DashboardLayout';

const SetSmsApi = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-role">Set SMS API</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Please enter your API key. You may get the key from <a href="http://cloudsms.trio-mobile.com/" target="_blank" rel="noreferrer" className="text-[#c53336] hover:underline">http://cloudsms.trio-mobile.com/</a>
          </p>
        </div>

        <div className="p-8">
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-role">
                <span className="text-[#c53336] mr-1">*</span> API Key
              </label>
              <p className="text-xs text-gray-400 italic mb-2">
                e.g. " NUC130101000066611200fc47a084919fca76d84e5f998329 "
              </p>
              <input 
                type="text" 
                placeholder="Enter API Key"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all text-gray-700 font-mono text-sm"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="button"
                className="bg-role hover:bg-role-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-role/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default function SetSmsApiPage() {
  return (
    <DashboardLayout activePageId="set-sms-api">
      <SetSmsApi />
    </DashboardLayout>
  );
}
