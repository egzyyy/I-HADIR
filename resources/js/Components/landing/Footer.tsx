import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#1c3068] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#1c3068] font-bold text-xl">I</span>
              </div>
              <span className="font-bold text-2xl">I-HADIR</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering students to reach their full potential through holistic education.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c53336] transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c53336] transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c53336] transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c53336] transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-[#cec43a] transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-[#cec43a] transition-colors">About Us</a></li>
              <li><a href="#programs" className="hover:text-[#cec43a] transition-colors">Programs</a></li>
              <li><a href="#activities" className="hover:text-[#cec43a] transition-colors">Activities</a></li>
              <li><a href="#teachers" className="hover:text-[#cec43a] transition-colors">Teachers</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-bold mb-6">Resources</h4>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-[#cec43a] transition-colors">Admissions</a></li>
              <li><a href="#" className="hover:text-[#cec43a] transition-colors">Student Portal</a></li>
              <li><a href="#" className="hover:text-[#cec43a] transition-colors">Parent Portal</a></li>
              <li><a href="#" className="hover:text-[#cec43a] transition-colors">School Calendar</a></li>
              <li><a href="#" className="hover:text-[#cec43a] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold mb-6">Newsletter</h4>
            <p className="text-gray-300 mb-4">Subscribe to our newsletter to get latest updates.</p>
            <form className="relative">
              <input 
                type="email" 
                placeholder="Enter email address" 
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cec43a]"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-[#c53336] hover:bg-[#a02224] text-white p-2 rounded-md transition-colors">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>&copy; 2026 I-HADIR. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
