import React from 'react';
import { Navbar } from '../Components/landing/Navbar';
import { Hero } from '../Components/landing/Hero';
import { AboutSystem } from '../Components/landing/AboutSystem';
import { HowItWorks } from '../Components/landing/HowItWorks';
import { WhoIsItFor } from '../Components/landing/WhoIsItFor';
import { FAQ } from '../Components/landing/FAQ';
import { Contact } from '../Components/landing/Contact';
import { Footer } from '../Components/landing/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <Hero />
      <AboutSystem />
      <HowItWorks />
      <WhoIsItFor />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;
