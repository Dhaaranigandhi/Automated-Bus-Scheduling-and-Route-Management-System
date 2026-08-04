import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Plus, Edit2, Trash2, ShieldCheck, ClipboardList, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Driver {
  id: number;
  userId: number | null;
  licenseNumber: string;
  licenseExpiry: string;
  medicalStatus: string | null;
  availabilityStatus: 'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';
  performanceScore: string;
  user: { id: number; name: string; email: string } | null;
}

interface UserAccount {
  id: number;
  name: string;
  email: string;
}

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState<UserAccount[]>([]);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form states
  const [driverName, setDriverName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [medicalStatus, setMedicalStatus] = useState('FIT');
  const [availabilityStatus, setAvailabilityStatus] = useState<'AVAILABLE' | 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED'>('AVAILABLE');
  const [performanceScore, setPerformanceScore] = useState(5.0);

  // Attendance Form states
  const [attendanceStatus, setAttendanceStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE'>('PRESENT');

  const fetchDrivers = async () => {
    try {
      let url = '/drivers';
      const params = [];
      if (search) params.push(`search=${search}`);
      if (availabilityFilter) params.push(`availability=${availabilityFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await client.get(url);
      if (res.data.success) {
        setDrivers(res.data.drivers);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load drivers');
    }
  };

  const fetchUnlinkedUsers = async () => {
    try {
      // In a real codebase, this would fetch accounts that have driver role but no linked profile.
      // We'll mock this list using common API profile queries
      const res = await client.get('/auth/profile'); // Mocking profile listings or fallback
    } catch (err) {}
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, availabilityFilter]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = {
        name: driverName,
        email: driverEmail,
        password: driverPassword,
        licenseNumber,
        licenseExpiry,
        medicalStatus,
        availabilityStatus,
      };
      if (userId) payload.userId = parseInt(userId, 10);

      const res = await client.post('/drivers', payload);
      if (res.data.success) {
        setIsAddOpen(false);
        fetchDrivers();
        setDriverName('');
        setDriverEmail('');
        setDriverPassword('');
        setLicenseNumber('');
        setLicenseExpiry('');
        setUserId('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to register driver');
    }
  };

  const handleEditOpen = (driver: Driver) => {
    setSelectedDriver(driver);
    setLicenseNumber(driver.licenseNumber);
    setLicenseExpiry(driver.licenseExpiry.substring(0, 10));
    setMedicalStatus(driver.medicalStatus || 'FIT');
    setAvailabilityStatus(driver.availabilityStatus);
    setPerformanceScore(parseFloat(driver.performanceScore));
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setError(null);
    try {
      const res = await client.put(`/drivers/${selectedDriver.id}`, {
        licenseNumber,
        licenseExpiry,
        medicalStatus,
        availabilityStatus,
        performanceScore,
      });
      if (res.data.success) {
        setIsEditOpen(false);
        fetchDrivers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update driver details');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    setError(null);
    try {
      await client.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete driver profile');
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setError(null);
    try {
      const res = await client.post('/drivers/attendance', {
        driverId: selectedDriver.id,
        status: attendanceStatus,
        checkInTime: new Date().toISOString(),
      });
      if (res.data.success) {
        setIsAttendanceOpen(false);
        alert('Check-in log created successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log attendance check-in');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Driver Rosters</h2>
          <p className="text-slate-500 text-sm mt-1">Configure compliance details, license logs, duty statuses, and attendance logs.</p>
        </div>
        
        <button 
          onClick={() => {
            setError(null);
            fetchUnlinkedUsers();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none"
        >
          <Plus size={18} />
          <span>Add Driver</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <ShieldCheck className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by license number or driver name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
        />

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none cursor-pointer focus:bg-white focus:border-primary-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4">License Number</th>
                <th className="px-6 py-4">License Expiry</th>
                <th className="px-6 py-4">Medical status</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4">Performance index</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No drivers configured. Click 'Add Driver' to register your first operator.</td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  let statusBg = 'bg-slate-100 text-slate-600';
                  if (driver.availabilityStatus === 'AVAILABLE') statusBg = 'bg-green-50 text-green-700';
                  else if (driver.availabilityStatus === 'ON_DUTY') statusBg = 'bg-primary-50 text-primary-700';
                  else if (driver.availabilityStatus === 'OFF_DUTY') statusBg = 'bg-slate-100 text-slate-500';
                  else if (driver.availabilityStatus === 'SUSPENDED') statusBg = 'bg-red-50 text-red-700';

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">
                        {driver.user ? driver.user.name : 'Unlinked Account'}
                        {driver.user && <p className="text-xs text-slate-400 font-normal">{driver.user.email}</p>}
                      </td>
                      <td className="px-6 py-4 font-semibold">{driver.licenseNumber}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                          {driver.medicalStatus || 'FIT'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBg}`}>
                          {driver.availabilityStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary-600">{driver.performanceScore} / 5.0</td>
                      <td className="px-6 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setIsAttendanceOpen(true);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                            title="Log Attendance check-in"
                          >
                            <ClipboardList size={16} />
                          </button>
                          <button
                            onClick={() => handleEditOpen(driver)}
                            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(driver.id)}
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

      {/* Add Driver Profile Dialog */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg p-8 rounded-[2rem] shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsAddOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                Register New Driver Profile
              </h3>

              <form onSubmit={handleAddSubmit} className="flex flex-col gap-5">
                
                <div className="relative group">
                  <input
                    type="text"
                    id="drvName"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="drvName" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Driver Name (e.g. John Doe)
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="email"
                    id="drvEmail"
                    required
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="drvEmail" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Driver Email (e.g. john.doe@transitflow.com)
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="password"
                    id="drvPassword"
                    required
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="drvPassword" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Password (at least 6 characters)
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    id="licNum"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="licNum" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    License Number (e.g. DL-2026-00001)
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    id="med"
                    value={medicalStatus}
                    onChange={(e) => setMedicalStatus(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="med" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Medical Fitness Status (e.g. FIT, GLASSES_REQUIRED)
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider"> Roster Status</label>
                  <select
                    value={availabilityStatus}
                    onChange={(e: any) => setAvailabilityStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="AVAILABLE">Available (On Call)</option>
                    <option value="ON_DUTY">On Duty (Active run)</option>
                    <option value="OFF_DUTY">Off Duty (Standby)</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Save Driver Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Driver Dialog */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg p-8 rounded-[2rem] shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsEditOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                Update Driver Details
              </h3>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
                
                <div className="relative group">
                  <input
                    type="text"
                    id="editLic"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="editLic" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    License Number (Registration)
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    id="editMed"
                    value={medicalStatus}
                    onChange={(e) => setMedicalStatus(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="editMed" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Medical Fitness Details
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Availability Status</label>
                    <select
                      value={availabilityStatus}
                      onChange={(e: any) => setAvailabilityStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="ON_DUTY">On Duty</option>
                      <option value="OFF_DUTY">Off Duty</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>

                  <div className="relative group self-end">
                    <input
                      type="number"
                      id="editScore"
                      required
                      step="0.1"
                      min="1"
                      max="5"
                      value={performanceScore}
                      onChange={(e) => setPerformanceScore(parseFloat(e.target.value))}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="editScore" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Performance Index (1-5)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Update Driver Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Check-in attendance modal */}
      <AnimatePresence>
        {isAttendanceOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-md p-8 rounded-[2rem] shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsAttendanceOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Digital Attendance Check-In
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Log active status check-in for driver: <span className="font-semibold text-slate-700">{selectedDriver?.user?.name}</span>
              </p>

              <form onSubmit={handleAttendanceSubmit} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-poppins">Check-In Status</label>
                  <select
                    value={attendanceStatus}
                    onChange={(e: any) => setAttendanceStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  >
                    <option value="PRESENT">Present (Standard check-in)</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late arrival</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Submit Check-In Status
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DriversPage;
