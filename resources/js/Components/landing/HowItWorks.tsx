import React from 'react';
import { motion } from 'motion/react';
import { QrCode, ScanLine, BellRing } from 'lucide-react';

const StepCard = ({ number, icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="relative flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100 z-10"
  >
    <div className="absolute -top-6 w-12 h-12 bg-[#c53336] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md border-4 border-white">
      {number}
    </div>
    <div className="mt-8 mb-4 p-4 bg-[#1c3068]/10 rounded-full text-[#1c3068]">
      <Icon size={40} strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold text-[#1c3068] mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm">
      {description}
    </p>
  </motion.div>
);

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-[#fcfafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c53336] font-bold tracking-wider text-sm uppercase">Simple & Efficient</span>
          <h2 className="text-4xl font-bold text-[#1c3068] mt-2">How It Works</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Our streamlined process ensures quick and accurate attendance tracking in just three simple steps.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 transform -mt-8"></div>

          <StepCard
            number="1"
            icon={QrCode}
            title="Generate/Print QR"
            description="Students receive a unique, secure QR code printed on their ID card or accessible via the mobile app."
            delay={0.1}
          />

          <StepCard
            number="2"
            icon={ScanLine}
            title="Scan at Entrance"
            description="Students simply scan their code at a designated kiosk or teacher's device upon entering the school."
            delay={0.3}
          />

          <StepCard
            number="3"
            icon={BellRing}
            title="Real-time Update"
            description="Parents and teachers receive instant notifications and attendance status is updated online immediately."
            delay={0.5}
          />
        </div>
      </div>
    </section>
  );
};
