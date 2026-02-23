import React from 'react';
import { motion } from 'motion/react';
import { Palette, Code, Layout, ArrowRight, Star } from 'lucide-react';

const ProgramCard = ({ title, description, instructor, price, image, rating, icon: Icon, colorClass }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group"
  >
    <div className="h-48 overflow-hidden relative">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-800">
        {rating} <Star size={10} className="inline text-[#cec43a] fill-[#cec43a] mb-0.5" />
      </div>
    </div>
    <div className="p-6">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${colorClass}`}>
        <Icon size={14} />
        <span>Program</span>
      </div>
      <h3 className="text-xl font-bold text-[#1c3068] mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
             {/* Placeholder avatar */}
             <div className="w-full h-full bg-gray-300"></div> 
          </div>
          <div className="text-xs">
            <p className="font-semibold text-[#1c3068]">{instructor}</p>
            <p className="text-gray-500">Instructor</p>
          </div>
        </div>
        <div className="text-[#c53336] font-bold text-lg">{price}</div>
      </div>
    </div>
  </motion.div>
);

export const Programs = () => {
  const programs = [
    {
      title: 'Figma UI/UX Design',
      description: 'Master the art of user interface and user experience design with hands-on projects.',
      instructor: 'Jane Cooper',
      price: '$77.24',
      rating: '4.9',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=1000',
      icon: Palette,
      colorClass: 'bg-[#1c3068]/10 text-[#1c3068]'
    },
    {
      title: 'Learn Web Development',
      description: 'Build modern websites and web applications from scratch using React and Node.js.',
      instructor: 'Gary Wilson',
      price: '$98.00',
      rating: '4.8',
      image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1000',
      icon: Code,
      colorClass: 'bg-[#c53336]/10 text-[#c53336]'
    },
    {
      title: 'Building User Interfaces',
      description: 'Advanced techniques for creating responsive and accessible user interfaces.',
      instructor: 'Cody Fisher',
      price: '$71.19',
      rating: '4.7',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1000',
      icon: Layout,
      colorClass: 'bg-[#cec43a]/10 text-[#cec43a] darken-10'
    }
  ];

  return (
    <section id="programs" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#c53336] font-semibold tracking-wider text-sm uppercase">Explore The Variety of Programs We Offer</span>
          <h2 className="text-4xl font-bold text-[#1c3068] mt-2">Diverse And Comprehensive</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            We offer a wide range of programs designed to cater to the diverse interests and needs of our students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <ProgramCard key={index} {...program} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-colors inline-flex items-center gap-2">
            Explore All Programs <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};
