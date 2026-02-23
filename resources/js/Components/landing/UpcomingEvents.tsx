import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock } from 'lucide-react';

const EventItem = ({ date, time, title, description, isOpen, onClick }) => (
  <div className="border-b border-gray-100 last:border-0">
    <button 
      onClick={onClick}
      className="w-full text-left py-6 px-4 hover:bg-[#fcfafa] transition-colors flex items-start gap-4 group rounded-lg"
    >
      <div className={`p-3 rounded-lg flex-shrink-0 transition-colors ${isOpen ? 'bg-[#c53336] text-white' : 'bg-[#1c3068]/10 text-[#1c3068] group-hover:bg-[#1c3068]/20'}`}>
        <Calendar size={24} />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-1">
          <span className="font-semibold text-[#1c3068]">{date}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {time}</span>
        </div>
        <h3 className={`text-lg font-bold mb-1 transition-colors ${isOpen ? 'text-[#c53336]' : 'text-[#1c3068]'}`}>
          {title}
        </h3>
        <motion.div 
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
          className="overflow-hidden"
        >
          <p className="text-gray-600 text-sm mt-2">{description}</p>
        </motion.div>
      </div>
      <div className="text-gray-400">
        {isOpen ? '−' : '+'}
      </div>
    </button>
  </div>
);

export const UpcomingEvents = () => {
  const [openIndex, setOpenIndex] = React.useState(0);

  const events = [
    {
      date: '15 Jan, 2026',
      time: '09:00 am',
      title: 'A Learning Community Where people Knowledge',
      description: 'Join us for a day of sharing knowledge and building connections within our school community. Parents and students are welcome.'
    },
    {
      date: '18 Jan, 2026',
      time: '10:00 am',
      title: 'Science Fair & Technology Exhibition',
      description: 'Explore the amazing projects created by our students in the fields of Science, Technology, Engineering, and Mathematics.'
    },
    {
      date: '25 Jan, 2026',
      time: '02:00 pm',
      title: 'Annual Sports Day Competition',
      description: 'Cheer for your favorite teams as they compete in various sports activities including track, field, and team games.'
    }
  ];

  return (
    <section id="activities" className="py-20 bg-[#fcfafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <span className="text-[#c53336] font-semibold tracking-wider text-sm uppercase">Don't Miss Our Upcoming Events</span>
            <h2 className="text-4xl font-bold text-[#1c3068] mt-2 mb-8">Upcoming Events</h2>
            <p className="text-gray-600 mb-8">
              Stay up-to-date with all the exciting events happening at School. 
              From workshops to parent-teacher meetings, there is always something happening.
            </p>
            
            <div className="bg-white rounded-2xl shadow-lg p-2">
              {events.map((event, index) => (
                <EventItem 
                  key={index}
                  {...event}
                  isOpen={openIndex === index}
                  onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
                />
              ))}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[600px] hidden lg:block"
          >
            <div className="absolute inset-0 bg-[#1c3068] rounded-3xl transform rotate-3 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1758685733760-71c797cf0b05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwd3JpdGluZyUyMG9uJTIwYmxhY2tib2FyZHxlbnwxfHx8fDE3Njk2MTUxMzF8MA&ixlib=rb-4.1.0&q=80&w=1080" 
              alt="Student writing on blackboard" 
              className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl"
            />
            <div className="absolute bottom-10 left-10 bg-white/95 backdrop-blur-md p-6 rounded-xl max-w-xs shadow-lg border-l-4 border-[#cec43a]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-[#c53336] rounded-full"></div>
                <span className="font-bold text-[#1c3068]">Live Learning</span>
              </div>
              <p className="text-sm text-gray-600">Interactive sessions that engage students and promote active participation.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
