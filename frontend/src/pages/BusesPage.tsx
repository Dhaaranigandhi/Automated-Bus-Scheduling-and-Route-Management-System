import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Bus as BusIcon, Plus, Edit2, Trash2, FileText, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BusDoc {
  id: number;
  title: string;
  documentType: string;
  fileUrl: string;
  expiryDate: string;
}

interface Bus {
  id: number;
  registrationNumber: string;
  model: string;
  capacity: number;
  status: 'AVAILABLE' | 'RUNNING' | 'MAINTENANCE' | 'INACTIVE';
  category: 'AC_SEATER' | 'NON_AC_SEATER' | 'AC_SLEEPER' | 'NON_AC_SLEEPER';
  documents: BusDoc[];
}

const BusesPage: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal controls
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // Form states
  const [regNum, setRegNum] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [status, setStatus] = useState<'AVAILABLE' | 'RUNNING' | 'MAINTENANCE' | 'INACTIVE'>('AVAILABLE');
  const [category, setCategory] = useState<'AC_SEATER' | 'NON_AC_SEATER' | 'AC_SLEEPER' | 'NON_AC_SLEEPER'>('NON_AC_SEATER');

  // Doc form states
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('INSURANCE');
  const [docUrl, setDocUrl] = useState('');
  const [docExpiry, setDocExpiry] = useState('');

  const fetchBuses = async () => {
    try {
      let url = '/buses';
      const params = [];
      if (search) params.push(`search=${search}`);
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await client.get(url);
      if (res.data.success) {
        setBuses(res.data.buses);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load buses');
    }
  };

  useEffect(() => {
    fetchBuses();
  }, [search, statusFilter]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await client.post('/buses', {
        registrationNumber: regNum,
        model,
        capacity,
        status,
        category,
      });
      if (res.data.success) {
        setIsAddOpen(false);
        fetchBuses();
        // Clear
        setRegNum('');
        setModel('');
        setCapacity(40);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save bus');
    }
  };

  const handleEditOpen = (bus: Bus) => {
    setSelectedBus(bus);
    setRegNum(bus.registrationNumber);
    setModel(bus.model);
    setCapacity(bus.capacity);
    setStatus(bus.status);
    setCategory(bus.category);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    setError(null);
    try {
      const res = await client.put(`/buses/${selectedBus.id}`, {
        registrationNumber: regNum,
        model,
        capacity,
        status,
        category,
      });
      if (res.data.success) {
        setIsEditOpen(false);
        fetchBuses();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update bus details');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    setError(null);
    try {
      await client.delete(`/buses/${id}`);
      fetchBuses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete bus');
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    setError(null);
    try {
      const res = await client.post(`/buses/${selectedBus.id}/documents`, {
        title: docTitle,
        documentType: docType,
        fileUrl: docUrl || 'https://transitflow-documents.s3.amazonaws.com/mock.pdf',
        expiryDate: docExpiry,
      });
      if (res.data.success) {
        setIsDocOpen(false);
        fetchBuses();
        // Clear
        setDocTitle('');
        setDocUrl('');
        setDocExpiry('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bus Fleet</h2>
          <p className="text-slate-500 text-sm mt-1">Configure registrations, capacity sizes, permits, and active maintenance logs.</p>
        </div>
        
        <button 
          onClick={() => {
            setError(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none"
        >
          <Plus size={18} />
          <span>Add Bus</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by registration number or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
        />

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none cursor-pointer focus:bg-white focus:border-primary-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RUNNING">Running</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Fleet Grid / Cards */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Reg Number</th>
                <th className="px-6 py-4">Comfort Class</th>
                <th className="px-6 py-4">Vehicle Model</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Active Documents</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No buses registered. Click 'Add Bus' to register your first vehicle.</td>
                </tr>
              ) : (
                buses.map((bus) => {
                  let statusBg = 'bg-slate-100 text-slate-600';
                  if (bus.status === 'AVAILABLE') statusBg = 'bg-green-50 text-green-700';
                  else if (bus.status === 'RUNNING') statusBg = 'bg-primary-50 text-primary-700';
                  else if (bus.status === 'MAINTENANCE') statusBg = 'bg-yellow-50 text-yellow-700';
                  else if (bus.status === 'INACTIVE') statusBg = 'bg-red-50 text-red-700';

                  return (
                    <tr key={bus.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">{bus.registrationNumber}</td>
                      <td className="px-6 py-4">
                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {bus.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">{bus.model}</td>
                      <td className="px-6 py-4 font-medium">{bus.capacity} seats</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBg}`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {bus.documents.length === 0 ? (
                            <span className="text-xs text-slate-400">No documents</span>
                          ) : (
                            bus.documents.map(d => (
                              <a 
                                key={d.id} 
                                href={d.fileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                              >
                                <FileText size={12} />
                                <span>{d.title}</span>
                              </a>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBus(bus);
                              setDocTitle('');
                              setIsDocOpen(true);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                            title="Add document permit"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleEditOpen(bus)}
                            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(bus.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Bus Modal Dialogue */}
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
                {isAddOpen ? 'Register New Bus' : 'Update Bus Details'}
              </h3>

              <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="flex flex-col gap-5">
                
                <div className="relative group">
                  <input
                    type="text"
                    id="regNum"
                    required
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="regNum" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Registration Number (e.g. DL-01-AB-1234)
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    id="model"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="model" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Bus Model / Chassis
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <input
                      type="number"
                      id="capacity"
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="capacity" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Seating Capacity
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    >
                      <option value="AC_SEATER">AC Seater</option>
                      <option value="NON_AC_SEATER">Non-AC Seater</option>
                      <option value="AC_SLEEPER">AC Sleeper</option>
                      <option value="NON_AC_SLEEPER">Non-AC Sleeper</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="AVAILABLE">Available (Active Fleet)</option>
                    <option value="RUNNING">Running (Active trip)</option>
                    <option value="MAINTENANCE">Maintenance (Garage)</option>
                    <option value="INACTIVE">Inactive (Off-duty)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Save Vehicle Properties
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload document Modal Dialogue */}
      <AnimatePresence>
        {isDocOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg p-8 rounded-[2rem] shadow-xl relative"
            >
              <button 
                onClick={() => setIsDocOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                Attach Compliance Document
              </h3>

              <form onSubmit={handleDocSubmit} className="flex flex-col gap-5">
                
                <div className="relative group">
                  <input
                    type="text"
                    id="docTitle"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="docTitle" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Document Title (e.g. Fitness Permit 2026)
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Category</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="INSURANCE">Insurance Certificate</option>
                    <option value="PERMIT">Route Permit</option>
                    <option value="FITNESS">Fitness Clearance</option>
                  </select>
                </div>

                <div className="relative group">
                  <input
                    type="url"
                    id="docUrl"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="docUrl" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Storage Link URL (Optional Amazon S3 / S3-compatible link)
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Save Document Attachment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BusesPage;
