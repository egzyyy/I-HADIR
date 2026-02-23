import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ShieldCheck, BarChart3, CheckCircle2 } from 'lucide-react';

const UserCard = ({ title, icon: Icon, colorClass, features, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
  >
    <div className={`p-6 ${colorClass} text-white`}>
      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
    </div>
    
    <div className="p-8 flex-1 flex flex-col">
      <ul className="space-y-4 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-[#cec43a] mt-1 flex-shrink-0" />
            <span className="text-gray-600 leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-8 pt-6 border-t border-gray-100">
        <button className="text-sm font-bold text-[#1c3068] hover:text-[#c53336] transition-colors flex items-center gap-2">
          Learn more
        </button>
      </div>
    </div>
  </motion.div>
);

export const WhoIsItFor = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c53336] font-bold tracking-wider text-sm uppercase">Benefits For Everyone</span>
          <h2 className="text-4xl font-bold text-[#1c3068] mt-2">Who is it for?</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            The I-HADIR system is designed to provide value to every stakeholder in the education ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <UserCard
            title="For Teachers"
            icon={BookOpen}
            colorClass="bg-[#1c3068]"
            features={[
              "Easy classroom management with automated rolls",
              "Automated reports generation saving hours of time",
              "Significantly less paperwork and manual data entry",
              "Instant overview of class attendance trends"
            ]}
            delay={0.1}
          />

          <UserCard
            title="For Parents"
            icon={ShieldCheck}
            colorClass="bg-[#c53336]"
            features={[
              "Instant peace of mind with real-time alerts",
              "Receive notifications upon arrival and departure",
              "View historical attendance records anytime",
              "Direct communication channel with school"
            ]}
            delay={0.3}
          />

          <UserCard
            title="For Administrators"
            icon={BarChart3}
            colorClass="bg-[#cec43a]"
            features={[
              "Comprehensive data analytics on school-wide trends",
              "Detailed punctuality and absenteeism reports",
              "Centralized dashboard for all students and staff",
              "Secure data management and export capabilities"
            ]}
            delay={0.5}
          />
        </div>
      </div>
    </section>
  );
};
