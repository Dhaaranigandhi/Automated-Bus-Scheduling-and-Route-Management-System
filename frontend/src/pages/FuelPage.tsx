import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Fuel, Plus, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bus {
  id: number;
  registrationNumber: string;
}

interface FuelLog {
  id: number;
  busId: number;
  fuelQuantity: string;
  odometerReading: string;
  cost: string;
  date: string;
  bus: Bus;
}

const FuelPage: React.FC = () => {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isOpen, setIsOpen] = useState(false);

  // Form
  const [busId, setBusId] = useState('');
  const [liters, setLiters] = useState(0);
  const [odometer, setOdometer] = useState(0);
  const [cost, setCost] = useState(0);
  const [date, setDate] = useState('');

  const fetchData = async () => {
    try {
      const [lRes, bRes] = await Promise.all([
        client.get('/fuel'),
        client.get('/buses'),
      ]);
      if (lRes.data.success) setLogs(lRes.data.logs);
      if (bRes.data.success) setBuses(bRes.data.buses);
    } catch (err: any) {
      setError(err.message || 'Failed to load fuel records');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await client.post('/fuel', {
        busId: parseInt(busId, 10),
        fuelQuantity: parseFloat(liters as any),
        odometerReading: parseFloat(odometer as any),
        cost: parseFloat(cost as any),
        date: new Date(date).toISOString(),
      });
      if (res.data.success) {
        setIsOpen(false);
        fetchData();
        setBusId('');
        setLiters(0);
        setOdometer(0);
        setCost(0);
        setDate('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log refueling details');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fuel Records</h2>
          <p className="text-slate-500 text-sm mt-1">Track fleet mileage logs, total refueling costs, and fuel consumption trends.</p>
        </div>
        
        <button 
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none"
        >
          <Plus size={18} />
          <span>Refuel Log</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Renders logs list */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Ref Vehicle</th>
                <th className="px-6 py-4">Quantity Refueled</th>
                <th className="px-6 py-4">Odometer Reading</th>
                <th className="px-6 py-4">Fuel Bill Cost</th>
                <th className="px-6 py-4">Refuel Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No fuel entries logged. Click 'Refuel Log' to create one.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">{log.bus.registrationNumber}</td>
                    <td className="px-6 py-4 font-semibold">{log.fuelQuantity} Liters</td>
                    <td className="px-6 py-4 font-semibold">{Number(log.odometerReading).toLocaleString()} km</td>
                    <td className="px-6 py-4 font-bold text-slate-800">${Number(log.cost).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refuel Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg p-8 rounded-[2rem] shadow-xl relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                Record Refueling Event
              </h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Vehicle</label>
                  <select
                    value={busId}
                    required
                    onChange={(e) => setBusId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="">-- Choose Bus --</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.registrationNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <input
                      type="number"
                      id="liters"
                      required
                      step="0.1"
                      min="0.1"
                      value={liters}
                      onChange={(e) => setLiters(parseFloat(e.target.value))}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="liters" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Fuel Quantity (Liters)
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type="number"
                      id="odometer"
                      required
                      min="1"
                      value={odometer}
                      onChange={(e) => setOdometer(parseInt(e.target.value, 10))}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="odometer" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Odometer (Kilometers)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <input
                      type="number"
                      id="cost"
                      required
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(parseFloat(e.target.value))}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="cost" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Total Cost ($)
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Log refueling details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default FuelPage;
