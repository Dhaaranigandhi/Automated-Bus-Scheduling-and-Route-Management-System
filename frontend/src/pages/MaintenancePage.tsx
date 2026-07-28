import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Wrench, Plus, Check, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bus {
  id: number;
  registrationNumber: string;
}

interface MaintenanceRecord {
  id: number;
  busId: number;
  maintenanceType: 'ROUTINE' | 'REPAIR' | 'INSPECTION';
  description: string;
  cost: string;
  scheduledDate: string;
  completedDate: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  bus: Bus;
}

const MaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isOpen, setIsOpen] = useState(false);

  // Form
  const [busId, setBusId] = useState('');
  const [type, setType] = useState<'ROUTINE' | 'REPAIR' | 'INSPECTION'>('ROUTINE');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState(0);
  const [date, setDate] = useState('');

  const fetchData = async () => {
    try {
      const [mRes, bRes] = await Promise.all([
        client.get('/maintenance'),
        client.get('/buses'),
      ]);
      if (mRes.data.success) setRecords(mRes.data.records);
      if (bRes.data.success) setBuses(bRes.data.buses);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance details');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await client.post('/maintenance', {
        busId: parseInt(busId, 10),
        maintenanceType: type,
        description: desc,
        cost: parseFloat(cost as any),
        scheduledDate: new Date(date).toISOString(),
      });
      if (res.data.success) {
        setIsOpen(false);
        fetchData();
        setBusId('');
        setDesc('');
        setCost(0);
        setDate('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule maintenance');
    }
  };

  const handleResolve = async (id: number) => {
    if (!confirm('Mark this maintenance task as completed?')) return;
    setError(null);
    try {
      const res = await client.put(`/maintenance/${id}/status`, {
        status: 'COMPLETED',
      });
      if (res.data.success) {
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete task');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vehicle Maintenance</h2>
          <p className="text-slate-500 text-sm mt-1">Schedule garage checks, log repair bills, and update fleet statuses.</p>
        </div>
        
        <button 
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none"
        >
          <Plus size={18} />
          <span>Schedule Service</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertTriangle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Renders records list */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Ref Vehicle</th>
                <th className="px-6 py-4">Service Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Cost Spent</th>
                <th className="px-6 py-4">Scheduled Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No maintenance tasks logged. Click 'Schedule Service' to begin.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">{r.bus.registrationNumber}</td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {r.maintenanceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{r.description}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">${Number(r.cost).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(r.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        r.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      {r.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleResolve(r.id)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl transition-all focus:outline-none"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Modal */}
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
                Schedule Fleet Maintenance
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Type</label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    >
                      <option value="ROUTINE">Routine Servicing</option>
                      <option value="REPAIR">Garage Repairs</option>
                      <option value="INSPECTION">General Inspection</option>
                    </select>
                  </div>

                  <div className="relative group self-end">
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
                      Estimated Cost ($)
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                </div>

                <div className="relative group">
                  <textarea
                    id="desc"
                    required
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all resize-none"
                  />
                  <label htmlFor="desc" className="absolute left-4 top-4 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Repair Job Description
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Schedule Service run
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MaintenancePage;
