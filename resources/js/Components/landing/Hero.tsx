import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// Shape returned by GET /api/public/schools/{slug}/events
interface PublicEvent {
  id: number;
  name: string;
  description: string | null;
  date: string;       // e.g. "29 October 2026"
  time: string | null; // e.g. "08:00"
  location: string | null;
  bannerUrl: string | null;
}

interface HeroProps {
  slug?: string; // school slug; when absent no events are fetched
}

// Renders the event name with its last word accented, mirroring the old
// hardcoded highlightText styling without needing per-event config.
const EventTitle = ({ name }: { name: string }) => {
  const words = name.trim().split(' ');
  const last = words.pop();
  return (
    <>
      {words.join(' ')} <span className="text-[#cec43a]">{last}</span>
    </>
  );
};

export const Hero = ({ slug }: HeroProps) => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(!!slug);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!slug) return;
    axios
      .get(`/api/public/schools/${slug}/events`)
      .then((res) => setEvents(res.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [slug]);

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

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = events.length - 1;
      if (nextIndex >= events.length) nextIndex = 0;
      return nextIndex;
    });
  };

  // Loading / empty states replace the carousel entirely.
  if (loading) {
    return (
      <section className="relative bg-[#fcfafa] py-24 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[color:var(--brand,#1c3068)] rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading events…</p>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="relative bg-[#fcfafa] py-24 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[color:var(--brand,#1c3068)] rounded-full blur-3xl opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-xl mx-auto text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1c3068]/10 flex items-center justify-center mb-6">
              <CalendarDays size={32} className="text-[color:var(--brand,#1c3068)]" />
            </div>
            <h2 className="text-2xl font-bold text-[color:var(--brand,#1c3068)] mb-3">No upcoming events</h2>
            <p className="text-gray-500 leading-relaxed">
              There are no school events scheduled right now. Check back soon —
              new events will appear here as they are announced.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentEvent = events[currentIndex] ?? events[0];

  return (
    <section className="relative bg-[#fcfafa] pt-10 pb-20 overflow-hidden min-h-[800px] flex items-center">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[color:var(--brand,#1c3068)] rounded-full blur-3xl opacity-10"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[color:var(--brand,#2f4fa8)] rounded-full blur-3xl opacity-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Navigation Buttons (only with multiple events) */}
        {events.length > 1 && (
          <>
            <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden lg:block">
              <button
                onClick={() => paginate(-1)}
                className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-[color:var(--brand,#1c3068)] hover:bg-white hover:scale-110 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden lg:block">
              <button
                onClick={() => paginate(1)}
                className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-[color:var(--brand,#1c3068)] hover:bg-white hover:scale-110 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </>
        )}

        <AnimatePresence initial={false} custom={direction} mode='wait'>
          <motion.div
            key={currentEvent.id}
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
              <div className="inline-block bg-[#c53336]/10 text-[color:var(--accent,#c53336)] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 flex items-center gap-2 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--accent,#c53336)]"></span>
                </span>
                Upcoming School Event
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-[color:var(--brand,#1c3068)] leading-tight mb-6 min-h-[120px]">
                <EventTitle name={currentEvent.name} />
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed min-h-[84px]">
                {currentEvent.description || 'Join us for this upcoming school event — more details to be announced.'}
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-md">
                  <div className="p-3 bg-blue-50 text-[color:var(--brand,#1c3068)] rounded-lg">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</p>
                    <p className="font-bold text-[color:var(--brand,#1c3068)]">{currentEvent.date}</p>
                  </div>
                </div>

                {currentEvent.time && (
                  <div className="flex items-center gap-4 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-md">
                    <div className="p-3 bg-blue-50 text-[color:var(--brand,#1c3068)] rounded-lg">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Time</p>
                      <p className="font-bold text-[color:var(--brand,#1c3068)]">{currentEvent.time}</p>
                    </div>
                  </div>
                )}

                {currentEvent.location && (
                  <div className="flex items-center gap-4 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-md">
                    <div className="p-3 bg-blue-50 text-[color:var(--brand,#1c3068)] rounded-lg">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Venue</p>
                      <p className="font-bold text-[color:var(--brand,#1c3068)]">{currentEvent.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image/Visuals */}
            <div className="relative flex justify-center lg:justify-end px-4 lg:px-0">
              <div className="relative rounded-full bg-[#1c3068]/5 p-4 sm:p-10 aspect-square flex items-center justify-center w-full max-w-[580px]">
                <div className="relative rounded-full overflow-hidden border-8 border-white shadow-2xl w-full h-full max-w-[500px] max-h-[500px]">
                  {currentEvent.bannerUrl ? (
                    <img
                      src={currentEvent.bannerUrl}
                      alt={currentEvent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Neutral fallback graphic when the event has no banner uploaded.
                    <div className="w-full h-full bg-gradient-to-br from-[color:var(--brand,#1c3068)] to-[#31509e] flex flex-col items-center justify-center text-white">
                      <CalendarDays size={72} className="opacity-80 mb-4" />
                      <p className="font-bold text-lg opacity-90 px-10 text-center leading-snug">
                        {currentEvent.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile Navigation Dots */}
        {events.length > 1 && (
          <div className="flex justify-center gap-2 mt-8 lg:hidden">
            {events.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-[color:var(--brand,#1c3068)] w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
