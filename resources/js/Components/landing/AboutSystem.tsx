import React from 'react';
import { motion } from 'motion/react';
import { Scan, MonitorSmartphone, Send } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-50 group"
  >
    <div className={`w-20 h-20 mx-auto rounded-full ${colorClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={36} className="text-white" />
    </div>
    <h3 className="text-xl font-bold text-[#1c3068] mb-4 group-hover:text-[#c53336] transition-colors">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm">
      {description}
    </p>
  </motion.div>
);

export const AboutSystem = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#1c3068_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-[#1c3068] mb-8"
          >
            About <span className="text-[#c53336]">i - HADIR</span>
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg mx-auto text-gray-600 leading-8"
          >
            <p>
              i - HADIR is a attendance tracking management system that uses QR code as a base to track our students, teachers, and staff attendance. 
              QR Code is a type of barcode that contains a matrix of dots. Once scanned, the system converts the dots within the code into some unique id that is used to capture attendance.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard 
            icon={Scan}
            title="QR - Code"
            description="We use QR Code to keep track of our attendance efficiently and accurately, eliminating manual errors."
            colorClass="bg-[#1c3068]"
            delay={0.2}
          />
          <FeatureCard 
            icon={MonitorSmartphone}
            title="Online Tracking"
            description="Parent can easily track their kids using this system through our dedicated web and mobile portals."
            colorClass="bg-[#c53336]"
            delay={0.4}
          />
          <FeatureCard 
            icon={Send}
            title="Technology & Software"
            description="QR technology for better and advanced attendance tracking system that integrates seamlessly with our database."
            colorClass="bg-[#cec43a]"
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};
