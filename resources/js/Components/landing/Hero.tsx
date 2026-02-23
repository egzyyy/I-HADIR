import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Calendar, Clock, MapPin, Users, Award, ChevronLeft, ChevronRight, Trophy, FlaskConical } from 'lucide-react';

const events = [
  {
    id: 1,
    title: "Hari Anugerah Kecemerlangan 2026",
    highlightText: "Kecemerlangan",
    description: "Celebrating the academic and co-curricular achievements of our outstanding students. Join us in honoring their dedication and hard work throughout the year.",
    date: "29 October 2026",
    time: "08:00 AM - 01:00 PM",
    venue: "Dewan Besar, I-HADIR SK PULAU SERAI",
    image: "https://images.unsplash.com/photo-1762158007643-666f303d91d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBhd2FyZCUyMGNlcmVtb255JTIwYXVkaXRvcml1bSUyMHN0dWRlbnRzJTIwb24lMjBzdGFnZXxlbnwxfHx8fDE3Njk2MTUxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    stats: {
      label: "Expected",
      value: "500+ Guests",
      icon: Users
    },
    secondaryStats: {
      label: "Excellence Awards",
      subLabel: "Processing...",
      icon: Award
    }
  },
  {
    id: 2,
    title: "Annual Sports Day Championship",
    highlightText: "Championship",
    description: "Witness the spirit of sportsmanship and athleticism as our houses compete for glory. A day filled with energy, excitement, and teamwork.",
    date: "15 November 2026",
    time: "07:30 AM - 04:00 PM",
    venue: "School Sports Complex",
    image: "https://images.unsplash.com/photo-1623208525215-a573aacb1560?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBzcG9ydHMlMjBkYXklMjBydW5uaW5nJTIwdHJhY2slMjBzdHVkZW50c3xlbnwxfHx8fDE3NzAwMjUwNzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    stats: {
      label: "Participants",
      value: "800+ Students",
      icon: Trophy
    },
    secondaryStats: {
      label: "House Points",
      subLabel: "Live Updates",
      icon: Award
    }
  },
  {
    id: 3,
    title: "Science Fair & Innovation Expo",
    highlightText: "Innovation",
    description: "Explore the incredible projects and inventions by our young scientists. Discover the future of technology and sustainable solutions.",
    date: "05 December 2026",
    time: "09:00 AM - 03:00 PM",
    venue: "School Main Hall",
    image: "https://images.unsplash.com/photo-1660351174962-e2a1fbb9af09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBzY2llbmNlJTIwZmFpciUyMHByb2plY3QlMjBzdHVkZW50c3xlbnwxfHx8fDE3NzAwMjUwNzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    stats: {
      label: "Projects",
      value: "120+ Exhibits",
      icon: FlaskConical
    },
    secondaryStats: {
      label: "Judges Panel",
      subLabel: "Industry Experts",
      icon: Users
    }
  }
];

export const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = events.length - 1;
      if (nextIndex >= events.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const currentEvent = events[currentIndex];
  const StatsIcon = currentEvent.stats.icon;
  const SecondaryStatsIcon = currentEvent.secondaryStats.icon;

  return (
    <section className="relative bg-[#fcfafa] pt-10 pb-20 overflow-hidden min-h-[800px] flex items-center">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#1c3068] rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#c53336] rounded-full blur-3xl opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden lg:block">
          <button 
            onClick={() => paginate(-1)}
            className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-[#1c3068] hover:bg-white hover:scale-110 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden lg:block">
          <button 
            onClick={() => paginate(1)}
            className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-[#1c3068] hover:bg-white hover:scale-110 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <AnimatePresence initial={false} custom={direction} mode='wait'>
          <motion.div 
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full"
          >
            
            {/* Text Content */}
            <div className="px-4 lg:px-0">
              <div className="inline-block bg-[#c53336]/10 text-[#c53336] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 flex items-center gap-2 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c53336]"></span>
                </span>
                Current School Event
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1c3068] leading-tight mb-6 min-h-[120px]">
                {currentEvent.title.split(currentEvent.highlightText)[0]}
                <span className="text-[#cec43a]">{currentEvent.highlightText}</span>
                {currentEvent.title.split(currentEvent.highlightText)[1]}
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed min-h-[84px]">
                {currentEvent.description}
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-md">
                  <div className="p-3 bg-blue-50 text-[#1c3068] rounded-lg">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</p>
                    <p className="font-bold text-[#1c3068]">{currentEvent.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-md">
                  <div className="p-3 bg-blue-50 text-[#1c3068] rounded-lg">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Time</p>
                    <p className="font-bold text-[#1c3068]">{currentEvent.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-md">
                  <div className="p-3 bg-blue-50 text-[#1c3068] rounded-lg">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Venue</p>
                    <p className="font-bold text-[#1c3068]">{currentEvent.venue}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                
                
              </div>
            </div>

            {/* Image/Visuals */}
            <div className="relative flex justify-center lg:justify-end px-4 lg:px-0">
              <div className="relative rounded-full bg-[#1c3068]/5 p-4 sm:p-10 aspect-square flex items-center justify-center">
                <div className="relative rounded-full overflow-hidden border-8 border-white shadow-2xl w-full h-full max-w-[500px] max-h-[500px]">
                  <img 
                    src={currentEvent.image}
                    alt={currentEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating Cards */}
                

                
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Mobile Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8 lg:hidden">
          {events.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-[#1c3068] w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
