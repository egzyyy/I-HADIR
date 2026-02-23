import React from 'react';
import { ArrowRight } from 'lucide-react';

const NewsCard = ({ date, title, image, category }) => (
  <div className="group relative overflow-hidden rounded-2xl shadow-lg h-96 cursor-pointer">
    <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#1c3068]/90 via-[#1c3068]/40 to-transparent"></div>
    <div className="absolute top-4 left-4">
       <span className="bg-[#c53336] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
         {category}
       </span>
    </div>
    <div className="absolute bottom-0 left-0 p-6 w-full">
      <p className="text-gray-300 text-xs mb-2">{date}</p>
      <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 group-hover:text-[#cec43a] transition-colors">
        {title}
      </h3>
      <div className="flex items-center text-white text-sm font-medium gap-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        Read More <ArrowRight size={16} />
      </div>
    </div>
  </div>
);

export const News = () => {
  const newsItems = [
    {
      date: 'Jan 28, 2026',
      title: 'Third Rally Day: Showcase Talent',
      category: 'News',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000'
    },
    {
      date: 'Jan 15, 2026',
      title: 'The School Trip - This is a big world place',
      category: 'Events',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000'
    },
    {
      date: 'Jan 10, 2026',
      title: 'This is main copy. This is a text school place.',
      category: 'Academic',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000'
    }
  ];

  return (
    <section id="news" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[#c53336] font-semibold tracking-wider text-sm uppercase">Get The Latest News And Updates</span>
            <h2 className="text-4xl font-bold text-[#1c3068] mt-2">Latest News & Updates</h2>
            <p className="text-gray-600 mt-2 max-w-xl">
              Keep track of the latest news and important announcements from School Name.
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            {/* Arrows could go here if it was a slider */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsItems.map((item, index) => (
            <NewsCard key={index} {...item} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="border border-[#1c3068]/30 text-[#1c3068] hover:bg-[#fcfafa] px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            View All News
          </button>
        </div>
      </div>
    </section>
  );
};
