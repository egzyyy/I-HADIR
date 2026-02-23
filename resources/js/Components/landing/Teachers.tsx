import React from 'react';
import { motion } from 'motion/react';

const TeacherCard = ({ name, subject, image, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 p-4 text-center group"
  >
    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-2 border-[#1c3068]/20 group-hover:border-[#c53336] transition-colors">
      <img src={image} alt={name} className="w-full h-full object-cover" />
    </div>
    <h3 className="font-bold text-[#1c3068] text-lg">{name}</h3>
    <p className="text-[#c53336] text-sm font-medium">{subject}</p>
    
    <div className="mt-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <div className="w-2 h-2 rounded-full bg-[#cec43a]"></div>
       <div className="w-2 h-2 rounded-full bg-[#cec43a]"></div>
       <div className="w-2 h-2 rounded-full bg-[#cec43a]"></div>
    </div>
  </motion.div>
);

export const Teachers = () => {
  const teachers = [
    { name: 'Jenny Wilson', subject: 'Science', image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200' },
    { name: 'Brooklyn Simmons', subject: 'Mathematics', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { name: 'Barlene Robertson', subject: 'English', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
    { name: 'John Cooper', subject: 'History', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
    { name: 'Marvin Flore', subject: 'Arts', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200' },
    { name: 'Theresa Webb', subject: 'Physics', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
    { name: 'Albert Flores', subject: 'Sports', image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200' },
    { name: 'Wade Warren', subject: 'Music', image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=200' },
  ];

  return (
    <section id="teachers" className="py-20 bg-[#fcfafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c53336] font-semibold tracking-wider text-sm uppercase">Learn From The Best</span>
          <h2 className="text-4xl font-bold text-[#1c3068] mt-2">Meet Our Teachers</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Our teachers are passionate about education and committed to helping each student succeed.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {teachers.map((teacher, index) => (
            <TeacherCard key={index} {...teacher} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};
