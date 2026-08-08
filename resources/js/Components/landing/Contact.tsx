import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
           <span className="text-[color:var(--accent,#c53336)] font-semibold tracking-wider text-sm uppercase">Need Any More Information</span>
           <h2 className="text-4xl font-bold text-[color:var(--brand,#1c3068)] mt-2">We're Here To Help</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
          {/* Left Side Info */}
          <div className="bg-[color:var(--brand,#1c3068)] p-10 lg:p-16 text-white lg:w-2/5 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-6">Get in touch</h3>
              <p className="text-blue-100 mb-10 leading-relaxed">
                Have questions or need more information? Our team is happy to help you.
                We look forward to hearing from you!
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[color:var(--accent,#c53336)] p-3 rounded-lg">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Email Us</p>
                    <p className="font-semibold">info@ihadir.edu</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-[color:var(--accent,#c53336)] p-3 rounded-lg">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Call Us Anytime</p>
                    <p className="font-semibold">+1 (123) 456-7890</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-[color:var(--accent,#c53336)] p-3 rounded-lg">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Visit Us</p>
                    <p className="font-semibold">123 School Street, Education City, USA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decor */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-[color:var(--accent,#c53336)] rounded-full opacity-20"></div>
          </div>

          {/* Right Side Form */}
          <div className="p-10 lg:p-16 lg:w-3/5 bg-white">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--brand,#1c3068)] mb-2">Name</label>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="w-full px-4 py-3 rounded-lg bg-[#fcfafa] border border-gray-200 focus:border-[color:var(--accent,#c53336)] focus:ring-2 focus:ring-[#c53336]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--brand,#1c3068)] mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full px-4 py-3 rounded-lg bg-[#fcfafa] border border-gray-200 focus:border-[color:var(--accent,#c53336)] focus:ring-2 focus:ring-[#c53336]/20 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[color:var(--brand,#1c3068)] mb-2">Subject</label>
                <input 
                  type="text" 
                  placeholder="Subject" 
                  className="w-full px-4 py-3 rounded-lg bg-[#fcfafa] border border-gray-200 focus:border-[color:var(--accent,#c53336)] focus:ring-2 focus:ring-[#c53336]/20 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[color:var(--brand,#1c3068)] mb-2">Message</label>
                <textarea 
                  rows={4} 
                  placeholder="Your Message..." 
                  className="w-full px-4 py-3 rounded-lg bg-[#fcfafa] border border-gray-200 focus:border-[color:var(--accent,#c53336)] focus:ring-2 focus:ring-[#c53336]/20 outline-none transition-all"
                ></textarea>
              </div>
              
              <button 
                type="button" 
                className="bg-[color:var(--accent,#c53336)] hover:brightness-95 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
              >
                Send Message <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
