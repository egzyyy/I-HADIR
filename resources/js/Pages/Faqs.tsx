import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, Search, MessageCircle, Minus, Plus } from 'lucide-react';
import DashboardLayout from '../Layouts/DashboardLayout';

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How can i scan my qr code?",
      answer: "Please enable your browser to use camera first. You can scan your qr code upon enabling it."
    },
    {
      question: "How to register new student?",
      answer: "Go to user -> Student Registration."
    },
    {
      question: "How to logout?",
      answer: "You can logout in 3 ways. First logout button located at the bottom left of this page. Second logout button located at top left of the page where you can see your name, click your name and logout button will appear. The last one is on your top right of this page where your name is located. Logout button will appear when your name is clicked."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-[#2f4fa8] mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-500">Find answers to common questions about using the i-HADIR system.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden
              ${openIndex === index
                ? 'border-blue-200 shadow-lg shadow-blue-900/5'
                : 'border-gray-100 shadow-sm hover:shadow-md'
              }
            `}
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full px-8 py-6 flex items-center justify-between gap-4 text-left focus:outline-none"
            >
              <span className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-[#2f4fa8]' : 'text-gray-700'}`}>
                {faq.question}
              </span>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
                ${openIndex === index ? 'bg-[#c53336] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}
              `}>
                {openIndex === index ? <Minus size={18} /> : <Plus size={18} />}
              </div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-8 pb-8 pt-0">
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base border-t border-gray-100 pt-4">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Contact Support Section */}
      {/* <div className="mt-12 text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-[#2f4fa8] mb-2">Still have questions?</h3>
        <p className="text-gray-500 text-sm mb-6">Can't find the answer you're looking for? Please contact our support team.</p>
        <a
          href={`mailto:info@ihadir.edu?subject=${encodeURIComponent('I-HADIR Support Request')}`}
          className="inline-block bg-[#2f4fa8] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#264190] transition-colors shadow-lg shadow-blue-900/20"
        >
          Contact Support
        </a>
      </div> */}
    </motion.div>
  );
};

export default function FaqsPage() {
  return (
    <DashboardLayout activePageId="faqs">
      <FaqPage />
    </DashboardLayout>
  );
}
