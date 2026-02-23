import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const About = () => {
  return (
    <section id="about" className="py-20 bg-[#fcfafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#c53336] font-semibold tracking-wider text-sm uppercase">Learn about our history, mission and vision</span>
            <h2 className="text-4xl font-bold text-[#1c3068] mt-2 mb-6">About Our School</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Founded in 2005, I-HADIR School has been committed to providing a high-quality 
              education that empowers students to achieve their full potential. Our mission 
              is to cultivate a lifelong love of learning and prepare students for success 
              in an ever-changing world.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We focus not just on academic excellence, but on character development, 
              leadership skills, and creative problem solving. Our campus provides a safe, 
              inclusive environment where diversity is celebrated.
            </p>
            
            <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
              Learn More <ArrowRight size={18} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-4 mt-8">
              <img 
                src="https://images.unsplash.com/photo-1740635341299-3b8e3490f546?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVtZW50YXJ5JTIwc2Nob29sJTIwY2xhc3Nyb29tJTIwdGVhY2hlciUyMHN0dWRlbnRzfGVufDF8fHx8MTc2OTYxNTEzMXww&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Classroom" 
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
              <div className="bg-[#1c3068]/10 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-[#1c3068]">15+</h3>
                <p className="text-[#1c3068]/80">Years of Excellence</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#cec43a]/10 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-[#1c3068]">100%</h3>
                <p className="text-[#cec43a] darken-10 font-medium">Student Satisfaction</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1752920299180-e8fd9276c202?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGluJTIwbGlicmFyeSUyMHN0dWR5aW5nfGVufDF8fHx8MTc2OTYxNTEzMXww&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Students studying" 
                className="rounded-2xl shadow-lg w-full h-64 object-cover"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
