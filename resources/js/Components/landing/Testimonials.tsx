import React from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#c53336] font-semibold tracking-wider text-sm uppercase">See What Our Community Says</span>
          <h2 className="text-4xl font-bold text-[#1c3068] mt-2">What Parents And Students Say</h2>
        </div>

        <div className="relative bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#cec43a] text-white p-4 rounded-full shadow-lg">
            <Quote size={24} fill="currentColor" />
          </div>
          
          <div className="text-center pt-6">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-[#fcfafa] mb-6">
              <img 
                src="https://images.unsplash.com/photo-1761257517067-b665b7cb9d65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY5NjE1MTMxfDA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Parent" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <h3 className="text-xl font-bold text-[#1c3068]">Maxwell Richard</h3>
            <p className="text-[#c53336] text-sm mb-6">Lead Designer, Parent</p>
            
            <p className="text-gray-600 italic text-lg leading-relaxed mb-8">
              "I-HADIR has transformed my child's learning experience. The dedicated teachers 
              and engaging curriculum have sparked a genuine love for learning. I'm amazed 
              at the progress and confidence I see every day."
            </p>

            <div className="flex justify-center gap-4">
              <button className="p-2 rounded-full border border-gray-200 hover:bg-[#fcfafa] text-gray-400 hover:text-[#1c3068] transition-colors">
                <ChevronLeft size={24} />
              </button>
              <button className="p-2 rounded-full border border-gray-200 hover:bg-[#fcfafa] text-gray-400 hover:text-[#1c3068] transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
