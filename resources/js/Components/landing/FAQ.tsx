import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mb-4 transition-all duration-300 hover:shadow-md">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className="text-lg font-bold text-[#1c3068]">{question}</span>
        <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-[#c53336] text-white' : 'bg-[#fcfafa] text-gray-500'}`}>
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What happens if a student loses their QR code?",
      answer: "Don't worry! If a student loses their ID card or QR code, administrators can instantly generate a new one from the system. The old code will be deactivated to prevent misuse, ensuring the security of the student's identity."
    },
    {
      question: "Is the data secure and private?",
      answer: "Yes, absolutely. We prioritize data security and privacy. All attendance data is encrypted and stored on secure servers. Only authorized personnel (teachers, admins) and parents with valid credentials can access the relevant information."
    },
    {
      question: "Can I use this on a smartphone or only on a desktop?",
      answer: "I-HADIR is fully responsive and works on all devices. There is a web portal for desktop use, perfect for detailed reports, and a mobile-optimized interface for smartphones, allowing parents to check status on the go."
    },
    {
      question: "How reliable is the QR scanning process?",
      answer: "The scanning process is extremely fast and reliable, taking less than a second per student. It works even with slightly damaged codes, ensuring smooth entry flow during peak morning hours."
    }
  ];

  return (
    <section className="py-24 bg-[#fcfafa]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1c3068]/10 text-[#1c3068] px-4 py-2 rounded-full font-bold text-sm mb-4">
            <HelpCircle size={18} />
            <span>Common Questions</span>
          </div>
          <h2 className="text-4xl font-bold text-[#1c3068]">Frequently Asked Questions</h2>
          <p className="text-gray-600 mt-4">
            Find answers to common questions about the I-HADIR attendance system.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
