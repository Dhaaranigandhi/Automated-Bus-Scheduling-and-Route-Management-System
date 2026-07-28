import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Plus, Edit2, Trash2, AlertCircle, Cpu, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bus {
  id: number;
  registrationNumber: string;
  model: string;
  status: string;
}

interface Driver {
  id: number;
  licenseNumber: string;
  user: { name: string; email: string } | null;
}

interface Route {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  routeId: number;
  busId: number;
  driverId: number;
  departureTime: string;
  arrivalTime: string;
  recurrence: string;
  status: 'ACTIVE' | 'INACTIVE';
  route: Route;
  bus: Bus;
  driver: Driver;
}

interface AISuggestion {
  suggestedDeparture: string;
  confidenceScore: number;
  rationale: string;
}

const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);

  // AI suggestions states
  const [aiRouteId, setAiRouteId] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Form states
  const [routeId, setRouteId] = useState('');
  const [busId, setBusId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [depTime, setDepTime] = useState('08:00');
  const [recurrence, setRecurrence] = useState('DAILY');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const fetchData = async () => {
    try {
      const [schedRes, busRes, driverRes, routeRes] = await Promise.all([
        client.get('/schedules'),
        client.get('/buses'),
        client.get('/drivers'),
        client.get('/routes'),
      ]);

      if (schedRes.data.success) setSchedules(schedRes.data.schedules);
      if (busRes.data.success) setBuses(busRes.data.buses);
      if (driverRes.data.success) setDrivers(driverRes.data.drivers);
      if (routeRes.data.success) setRoutes(routeRes.data.routes);
    } catch (err: any) {
      setError(err.message || 'Failed to load scheduling parameters');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFetchRecommendations = async () => {
    if (!aiRouteId) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    setError(null);
    try {
      const res = await client.get(`/schedules/recommend?routeId=${aiRouteId}`);
      if (res.data.success) {
        setAiSuggestions(res.data.suggestions);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI recommendations');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await client.post('/schedules', {
        routeId: parseInt(routeId, 10),
        busId: parseInt(busId, 10),
        driverId: parseInt(driverId, 10),
        departureTime: depTime,
        recurrence,
        status,
      });
      if (res.data.success) {
        setIsAddOpen(false);
        fetchData();
        // Clear
        setRouteId('');
        setBusId('');
        setDriverId('');
        setDepTime('08:00');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create schedule');
    }
  };

  const handleApplyAISuggestion = (s: AISuggestion) => {
    setRouteId(aiRouteId);
    setDepTime(s.suggestedDeparture);
    setIsAddOpen(true);
  };

  const handleEditOpen = (sched: Schedule) => {
    setSelectedSchedule(sched);
    setRouteId(sched.routeId.toString());
    setBusId(sched.busId.toString());
    setDriverId(sched.driverId.toString());
    setDepTime(sched.departureTime);
    setRecurrence(sched.recurrence);
    setStatus(sched.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setError(null);
    try {
      const res = await client.put(`/schedules/${selectedSchedule.id}`, {
        routeId: parseInt(routeId, 10),
        busId: parseInt(busId, 10),
        driverId: parseInt(driverId, 10),
        departureTime: depTime,
        recurrence,
        status,
      });
      if (res.data.success) {
        setIsEditOpen(false);
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update schedule');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    setError(null);
    try {
      await client.delete(`/schedules/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete schedule');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dispatch Schedules</h2>
          <p className="text-slate-500 text-sm mt-1">Allocate drivers, assign buses to routes, and configure timetables.</p>
        </div>
        
        <button 
          onClick={() => {
            setError(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none"
        >
          <Plus size={18} />
          <span>Add Schedule</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* AI Recommendation Panel */}
      <section className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-8 items-start">
        
        <div className="flex flex-col max-w-sm text-left">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 border border-purple-100">
            <Cpu size={14} />
            AI Scheduling Rationale
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">Optimize Dispatch Hours</h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            Select a transit route to let our mocked ML optimizer search historical occupancy patterns, holiday files, and traffic nodes to recommend optimal departure slots.
          </p>

          <div className="flex gap-3 mt-6 w-full">
            <select
              value={aiRouteId}
              onChange={(e) => setAiRouteId(e.target.value)}
              className="flex-grow px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none cursor-pointer focus:bg-white focus:border-primary-500 transition-all"
            >
              <option value="">-- Select Route Corridor --</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              onClick={handleFetchRecommendations}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-md shadow-purple-600/10 focus:outline-none"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* Suggestion outputs */}
        <div className="flex-grow flex flex-col gap-4 w-full">
          {isAiLoading && (
            <div className="text-center py-8 text-slate-400 text-sm">Evaluating traffic patterns and class rosters...</div>
          )}
          {!isAiLoading && aiSuggestions.length === 0 && (
            <div className="h-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center p-8 text-center text-slate-400 text-xs">
              No recommendations generated yet. Select a route above to compute options.
            </div>
          )}
          {!isAiLoading && aiSuggestions.map((s, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-slate-100/50">
              <div className="text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-extrabold text-slate-800">{s.suggestedDeparture}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    {Math.round(s.confidenceScore * 100)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.rationale}</p>
              </div>

              <button
                onClick={() => handleApplyAISuggestion(s)}
                className="bg-white hover:bg-primary-50 hover:text-primary-600 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all focus:outline-none flex-shrink-0"
              >
                Apply Timing
              </button>
            </div>
          ))}
        </div>

      </section>

      {/* Timetable schedule grid */}
      <section className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Assigned Bus</th>
                <th className="px-6 py-4">Driver Details</th>
                <th className="px-6 py-4">Transit Route</th>
                <th className="px-6 py-4">Departure Time</th>
                <th className="px-6 py-4">Arrival Time</th>
                <th className="px-6 py-4">Recurrence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">No schedules configured. Click 'Add Schedule' to allocate dispatches.</td>
                </tr>
              ) : (
                schedules.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">
                      {sched.bus.registrationNumber}
                      <p className="text-xs text-slate-400 font-normal">{sched.bus.model}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{sched.driver.user ? sched.driver.user.name : 'Roster Account'}</span>
                      <p className="text-xs text-slate-400 font-normal">Lic: {sched.driver.licenseNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary-700">{sched.route.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{sched.departureTime}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{sched.arrivalTime}</td>
                    <td className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{sched.recurrence}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        sched.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {sched.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditOpen(sched)}
                          className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sched.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Schedule Dialogue */}
      <AnimatePresence>
        {(isAddOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg p-8 rounded-[2rem] shadow-xl relative"
            >
              <button 
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                }}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                {isAddOpen ? 'Allocate Dispatch Run' : 'Edit Schedule Assignment'}
              </h3>

              <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Route</label>
                  <select
                    value={routeId}
                    required
                    onChange={(e) => setRouteId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="">-- Select Transit Corridor --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Vehicle</label>
                  <select
                    value={busId}
                    required
                    onChange={(e) => setBusId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="">-- Select Active Fleet --</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.registrationNumber} ({b.model} - {b.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Driver</label>
                  <select
                    value={driverId}
                    required
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="">-- Select Available Operator --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.user ? d.user.name : ' Roster Account'} (Lic: {d.licenseNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departure Time</label>
                    <input
                      type="time"
                      required
                      value={depTime}
                      onChange={(e) => setDepTime(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recurrence</label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKDAYS">Weekdays Only</option>
                      <option value="WEEKENDS">Weekends Only</option>
                      <option value="HOLIDAYS">Holidays Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="ACTIVE">Active (Timetable lists)</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Allocate Timetable Slot
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SchedulesPage;
