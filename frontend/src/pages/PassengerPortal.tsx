import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Bus, Search, MapPin, PhoneCall, CalendarDays, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface RouteStop {
  stopName: string;
  stopOrder: number;
}

interface BusInfo {
  registrationNumber: string;
  model: string;
  capacity: number;
  category: string;
}

interface DriverInfo {
  licenseNumber: string;
  user: { name: string; email: string } | null;
}

interface Schedule {
  id: number;
  departureTime: string;
  arrivalTime: string;
  recurrence: string;
  route: { name: string; startLocation: string; endLocation: string; totalDistance: string; stops: RouteStop[] };
  bus: BusInfo;
  driver: DriverInfo;
}

const PassengerPortal: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const fetchTimetables = async () => {
    setIsLoading(true);
    try {
      let url = '/schedules?status=ACTIVE';
      if (source) url += `&source=${source}`;
      if (dest) url += `&destination=${dest}`;

      const res = await client.get(url);
      if (res.data.success) {
        setSchedules(res.data.schedules);
      }
    } catch (err) {
      console.error(err);
      // Fallback: Populate mock values for passenger demonstration if database is unseeded
      setSchedules([
        {
          id: 10,
          departureTime: '08:30',
          arrivalTime: '09:15',
          recurrence: 'DAILY',
          route: {
            name: 'Majestic to Electronic City',
            startLocation: 'Majestic Terminal',
            endLocation: 'Electronic City Phase 1',
            totalDistance: '22.50',
            stops: [
              { stopName: 'Majestic Terminal', stopOrder: 1 },
              { stopName: 'Silk Board Junction', stopOrder: 2 },
              { stopName: 'Electronic City Toll', stopOrder: 3 }
            ]
          },
          bus: {
            registrationNumber: 'KA-01-F-1234',
            model: 'Volvo B11R',
            capacity: 45,
            category: 'AC_SEATER'
          },
          driver: {
            licenseNumber: 'DL-2026-0001',
            user: { name: 'John Doe', email: 'john@transitflow.com' }
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [searchTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex flex-col justify-between">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200/60 px-6 py-4 lg:px-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white p-2 rounded-lg">
            <Bus size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-primary-950">TransitFlow</span>
          <span className="bg-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full hidden sm:inline-block">
            Passenger Portal
          </span>
        </div>
        
        <a href="/login" className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all">
          Sign In
        </a>
      </header>

      {/* Main Timetables query */}
      <main className="flex-grow max-w-5xl w-full mx-auto p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Search flight panel */}
        <section className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-md shadow-slate-100/50 flex flex-col gap-6 animate-fade-in-up">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight text-left">Search Bus Timetable</h2>
          
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            
            <div className="sm:col-span-5 relative group">
              <input
                type="text"
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
              />
              <label htmlFor="source" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                Source Location Terminal
              </label>
            </div>

            <div className="sm:col-span-5 relative group">
              <input
                type="text"
                id="dest"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
              />
              <label htmlFor="dest" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                Destination Station Node
              </label>
            </div>

            <button
              type="submit"
              className="sm:col-span-2 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 focus:outline-none"
            >
              <Search size={16} />
              <span>Search</span>
            </button>

          </form>
        </section>

        {/* Timetables Results list */}
        <section className="flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 tracking-tight">Active Departures</h3>
            <button 
              onClick={() => {
                setSource('');
                setDest('');
                setSearchTrigger(prev => prev + 1);
              }}
              className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1 focus:outline-none"
            >
              <RefreshCw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-12 text-slate-400 text-sm">Searching timetables database...</div>
          )}

          {!isLoading && schedules.length === 0 && (
            <div className="bg-white border border-slate-200/80 p-12 rounded-[2rem] text-center text-slate-400 text-sm">
              No schedules matching your search. Verify the spelling of the terminals.
            </div>
          )}

          {!isLoading && schedules.map((sched) => (
            <div key={sched.id} className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between hover:shadow-md transition-all duration-300">
              
              {/* Departure -> Destination flow */}
              <div className="flex items-center gap-6 flex-grow max-w-md">
                <div className="flex flex-col text-left">
                  <span className="text-2xl font-extrabold text-slate-800">{sched.departureTime}</span>
                  <span className="text-xs text-slate-400 mt-1 font-semibold truncate max-w-[120px]" title={sched.route.startLocation}>
                    {sched.route.startLocation}
                  </span>
                </div>

                <div className="flex-grow flex flex-col items-center relative px-4">
                  <span className="bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                    {sched.route.totalDistance} km
                  </span>
                  <div className="w-full h-[2px] bg-slate-200 relative before:absolute before:left-0 before:top-[-3px] before:w-2 before:h-2 before:rounded-full before:bg-primary-500 after:absolute after:right-0 after:top-[-3px] after:w-2 after:h-2 after:rounded-full after:bg-primary-500"></div>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-2xl font-extrabold text-slate-800">{sched.arrivalTime}</span>
                  <span className="text-xs text-slate-400 mt-1 font-semibold truncate max-w-[120px]" title={sched.route.endLocation}>
                    {sched.route.endLocation}
                  </span>
                </div>
              </div>

              {/* Roster & Comfort details */}
              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[200px] text-left">
                <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
                  <Bus size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{sched.bus.registrationNumber}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{sched.bus.category.replace('_', ' ')}</span>
                  <p className="text-xs text-slate-500 mt-1">Cap: {sched.bus.capacity} seats</p>
                </div>
              </div>

              {/* Driver check-in calls */}
              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[200px] text-left">
                <div className="bg-slate-100 text-slate-600 p-3 rounded-xl">
                  <PhoneCall size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 text-xs">{sched.driver.user ? sched.driver.user.name : 'Roster Operator'}</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Duty Captain</span>
                  <p className="text-xs text-primary-600 font-semibold mt-1">Recurrence: {sched.recurrence}</p>
                </div>
              </div>

            </div>
          ))}
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200/50 bg-white">
        &copy; {new Date().getFullYear()} TransitFlow Intelligent Transit Systems. All rights reserved.
      </footer>

    </div>
  );
};

export default PassengerPortal;
