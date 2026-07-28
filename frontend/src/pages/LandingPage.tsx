import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bus, MapPin, Calendar, Clock, ShieldCheck, BarChart3, ChevronRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      
      {/* Dynamic Scrolling Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 lg:px-16 flex items-center justify-between ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md border-b border-slate-200/50 py-3' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-lg">
            <Bus size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-primary-950">TransitFlow</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/passenger" className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors">
            Passenger Portal
          </Link>
          <Link to="/login" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-primary-600/20 transition-all">
            Admin Console
          </Link>
        </div>
      </nav>

      {/* Hero Banner Grid */}
      <header className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 px-6 lg:px-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Column Text */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary-100/80 text-primary-700 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6 border border-primary-200/50"
          >
            <ShieldCheck size={14} />
            Intelligent Fleet Dispatch System
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6"
          >
            Automated Bus Scheduling & <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Route Management</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-500 leading-relaxed max-w-xl mb-8"
          >
            Automate schedule generation, coordinate vehicle driver rosters, log maintenance operations, and tracks routes in real-time. Designed for institutional efficiency.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/passenger" className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-primary-600/30 transition-all hover:translate-y-[-2px]">
              <span>Search Timetables</span>
              <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold px-8 py-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:translate-y-[-2px]">
              Access Console
            </Link>
          </motion.div>
        </div>

        {/* Right Column illustration */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          
          {/* Radial Lighting Background */}
          <div className="absolute w-[120%] h-[120%] bg-radial-gradient from-primary-500/10 to-transparent blur-3xl z-[-1] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative w-full max-w-md lg:max-w-none"
          >
            <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[110%] h-[110%] bg-primary-500/5 rounded-full filter blur-xl animate-pulse"></div>
            <img 
              src="/hero_bus.png" 
              alt="Futuristic Bus" 
              className="w-full h-auto drop-shadow-[0_24px_50px_rgba(30,58,138,0.2)] relative z-10"
            />
          </motion.div>
        </div>
      </header>

      {/* Feature Section with Glassmorphism grid */}
      <section className="bg-slate-100 border-t border-slate-200/50 py-24 px-6 lg:px-16 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Intelligent Platform Capabilities</h2>
            <p className="text-slate-500 mt-4 text-base">Everything you need to digitize bus routing networks and schedules inside a modern enterprise dashboard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-primary-100 text-primary-600 p-4 rounded-2xl w-fit mb-6">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">Automated Schedules</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Resolve driver-vehicle assignments, configure departure times, and detect conflicts instantly.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-primary-100 text-primary-600 p-4 rounded-2xl w-fit mb-6">
                <MapPin size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">Live Tracking</h3>
              <p className="text-slate-500 text-sm leading-relaxed">GPS telemetry broadcasts and Speed monitoring. Direct delays and deviation alarms to dispatcher desks.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-primary-100 text-primary-600 p-4 rounded-2xl w-fit mb-6">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">Passenger Portal</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Let passengers search timetables, inspect seat maps, find driver contacts, and view live vehicle coordinates.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-primary-100 text-primary-600 p-4 rounded-2xl w-fit mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">Compliance & Auditing</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Maintain bus fitness certificates, insurance cards, and license registries with expiry warnings.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-primary-100 text-primary-600 p-4 rounded-2xl w-fit mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">Refuel & Maintenance</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Log odometer readings, monitor daily fuel bills, and schedule routine garage checks dynamically.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="bg-primary-100 text-primary-600 p-4 rounded-2xl w-fit mb-6">
                <Bus size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3">AI Route Optimization</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Optimize route matrices using historical traffic, vehicle occupancy rate models, and delay forecasts.</p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer copyright */}
      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} TransitFlow Intelligent Transit Systems. All rights reserved.
      </footer>

    </div>
  );
};

export default LandingPage;
