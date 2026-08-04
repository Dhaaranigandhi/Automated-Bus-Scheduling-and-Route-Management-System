import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Plus, Edit2, Trash2, AlertCircle, Cpu, Check, X,
  Calendar, Bus as BusIcon, Clock, Users, Wrench, ShieldAlert,
  AlertTriangle, RefreshCw, BarChart2, CheckCircle2, History
} from 'lucide-react';
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
  availabilityStatus?: string;
  user: { name: string; email: string } | null;
}

interface Route {
  id: number;
  name: string;
  totalDistance: string;
  totalDuration: number;
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
  reasonGenerated?: string[];
}

interface AISuggestion {
  suggestedDeparture: string;
  confidenceScore: number;
  rationale: string;
}

interface SchedulingAnalytics {
  totalActiveBuses: number;
  totalDrivers: number;
  driversAssigned: number;
  availableDrivers: number;
  totalScheduledTrips: number;
  busesUnderMaintenance: number;
  driverUtilization: number;
  busUtilization: number;
  routeUtilization: number;
  conflictCount: number;
}

interface RescheduleSuggestion {
  scheduleId: number;
  schedule: Schedule;
  conflictType: string;
  reason: string;
  suggestedBus: Bus | null;
  suggestedDriver: Driver | null;
}

interface ScheduleHistoryItem {
  id: number;
  generationTime: string;
  generatedBy: string;
  approvedBy: string;
  schedulesCreated: number;
  conflictsResolved: number;
  status: string;
}

interface ConflictItem {
  scheduleId: string | number;
  type: string;
  conflict: string;
  reason: string;
  suggestedResolution: string;
}

interface GenerationSummary {
  schedulesGenerated: number;
  conflictsFound: number;
  automaticallyResolved: number;
  pendingApproval: number;
  generationTime: string;
  successRate: number;
}

const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Auto scheduling states
  const [analytics, setAnalytics] = useState<SchedulingAnalytics | null>(null);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState<RescheduleSuggestion[]>([]);
  const [historyLogs, setHistoryLogs] = useState<ScheduleHistoryItem[]>([]);
  const [previewSchedules, setPreviewSchedules] = useState<Schedule[]>([]);
  const [previewConflicts, setPreviewConflicts] = useState<ConflictItem[]>([]);
  const [previewSummary, setPreviewSummary] = useState<GenerationSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

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
      const [schedRes, busRes, driverRes, routeRes, analyticsRes, historyRes, suggestionsRes] = await Promise.all([
        client.get('/schedules'),
        client.get('/buses'),
        client.get('/drivers'),
        client.get('/routes'),
        client.get('/schedules/analytics'),
        client.get('/schedules/history'),
        client.get('/schedules/reschedule-suggestions')
      ]);

      if (schedRes.data.success) setSchedules(schedRes.data.schedules);
      if (busRes.data.success) setBuses(busRes.data.buses);
      if (driverRes.data.success) setDrivers(driverRes.data.drivers);
      if (routeRes.data.success) setRoutes(routeRes.data.routes);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
      if (historyRes.data.success) setHistoryLogs(historyRes.data.history);
      if (suggestionsRes.data.success) setRescheduleSuggestions(suggestionsRes.data.suggestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load scheduling parameters');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateSchedules = async () => {
    setIsGenerating(true);
    setError(null);
    setPreviewSchedules([]);
    setPreviewConflicts([]);
    setPreviewSummary(null);
    try {
      const res = await client.post('/schedules/auto-generate');
      if (res.data.success) {
        setPreviewSchedules(res.data.schedules);
        setPreviewConflicts(res.data.conflicts);
        setPreviewSummary(res.data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to auto-generate schedules');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveBatch = async () => {
    if (previewSchedules.length === 0) return;
    setIsSavingBatch(true);
    setError(null);
    try {
      const resolvedCount = (previewSummary?.conflictsFound || 0) - previewConflicts.length;
      const res = await client.post('/schedules/approve-batch', {
        schedules: previewSchedules,
        conflictsResolved: resolvedCount >= 0 ? resolvedCount : 0
      });
      if (res.data.success) {
        setPreviewSchedules([]);
        setPreviewConflicts([]);
        setPreviewSummary(null);
        fetchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to approve schedule batch');
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleApproveSuggestion = async (suggestion: RescheduleSuggestion) => {
    setError(null);
    try {
      const replacementBusId = suggestion.suggestedBus ? suggestion.suggestedBus.id : suggestion.schedule.busId;
      const replacementDriverId = suggestion.suggestedDriver ? suggestion.suggestedDriver.id : suggestion.schedule.driverId;

      const res = await client.put(`/schedules/${suggestion.scheduleId}`, {
        routeId: suggestion.schedule.routeId,
        busId: replacementBusId,
        driverId: replacementDriverId,
        departureTime: suggestion.schedule.departureTime,
        recurrence: suggestion.schedule.recurrence,
        status: 'ACTIVE'
      });

      if (res.data.success) {
        fetchData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to apply rescheduling replacement');
    }
  };

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
      setError(err.response?.data?.message || err.message || 'Failed to create schedule');
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
      setError(err.response?.data?.message || err.message || 'Failed to update schedule');
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
        <div className="text-left">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dispatch Schedules</h2>
          <p className="text-slate-500 text-sm mt-1">Allocate drivers, assign buses to routes, and configure timetables.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateSchedules}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-purple-600/20 transition-all focus:outline-none cursor-pointer"
          >
            <Cpu size={18} />
            <span>{isGenerating ? 'Generating...' : 'Generate Schedule'}</span>
          </button>

          <button 
            onClick={() => {
              setError(null);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm text-left">
          <AlertCircle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Cards Grid (Step 7 / Feature 8) */}
      {analytics && (
        <div className="flex flex-col gap-4">
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Buses</span>
                <span className="text-xl font-extrabold text-slate-800 mt-1">{analytics.totalActiveBuses}</span>
              </div>
              <div className="bg-primary-50 text-primary-600 p-2.5 rounded-xl">
                <BusIcon size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drivers Assigned</span>
                <span className="text-xl font-extrabold text-slate-800 mt-1">
                  {analytics.driversAssigned} <span className="text-xs text-slate-400 font-medium">/ {analytics.totalDrivers}</span>
                </span>
              </div>
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Trips</span>
                <span className="text-xl font-extrabold text-slate-800 mt-1">{analytics.totalScheduledTrips}</span>
              </div>
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
                <Calendar size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Maintenance</span>
                <span className="text-xl font-extrabold text-yellow-600 mt-1">{analytics.busesUnderMaintenance}</span>
              </div>
              <div className="bg-yellow-50 text-yellow-600 p-2.5 rounded-xl">
                <Wrench size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conflict Count</span>
                <span className={`text-xl font-extrabold mt-1 ${analytics.conflictCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {analytics.conflictCount}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${analytics.conflictCount > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle size={18} />
              </div>
            </div>
          </section>

          {/* Utilization Rates Row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
                <BarChart2 size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Driver Utilization</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">{analytics.driverUtilization}%</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
                <BarChart2 size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bus Utilization</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">{analytics.busUtilization}%</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
                <BarChart2 size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Route Utilization</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">{analytics.routeUtilization}%</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Generated Preview and Conflict Section */}
      {previewSchedules.length > 0 && (
        <section className="flex flex-col gap-6 bg-slate-50/70 border border-purple-200 p-6 lg:p-8 rounded-[2rem] shadow-sm relative overflow-hidden text-left">
          
          <div className="absolute top-6 right-6">
            <button 
              onClick={() => {
                setPreviewSchedules([]);
                setPreviewConflicts([]);
                setPreviewSummary(null);
              }}
              className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-2 border border-purple-100 w-fit">
              <Cpu size={14} />
              Intelligent Generation Preview
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Optimized Timetable Proposal</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Review automatically generated scheduling options and resolved conflict alerts before saving items to the database.
            </p>
          </div>

          {/* Automation Summary (Step 6 / Feature 7) */}
          {previewSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedules Generated</span>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{previewSummary.schedulesGenerated}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conflicts Found</span>
                <p className="text-lg font-extrabold text-red-500 mt-0.5">{previewSummary.conflictsFound}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Automatically Resolved</span>
                <p className="text-lg font-extrabold text-green-600 mt-0.5">{previewSummary.automaticallyResolved}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approval</span>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5">{previewSummary.pendingApproval}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
                <p className="text-lg font-extrabold text-purple-600 mt-0.5">{previewSummary.successRate}%</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generation Time</span>
                <p className="text-xs font-semibold text-slate-500 mt-1">{new Date(previewSummary.generationTime).toLocaleTimeString()}</p>
              </div>
            </div>
          )}

          {/* Conflict Summary Panel (Step 2 / Feature 2) */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conflict Summary panel</h4>
            {previewConflicts.length === 0 ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-4 rounded-2xl text-green-700 text-sm font-semibold">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <span>✓ No scheduling conflicts detected.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                {previewConflicts.map((c, idx) => (
                  <div key={idx} className="bg-red-50/50 border border-red-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 text-left">
                    <div className="flex gap-3 items-start">
                      <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {c.type}
                        </span>
                        <h5 className="font-bold text-sm text-slate-800 mt-1">{c.conflict}</h5>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.reason}</p>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs w-full sm:max-w-xs flex-shrink-0">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Suggested Resolution</span>
                      <p className="text-slate-700 font-semibold mt-1">{c.suggestedResolution}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5">Transit Route</th>
                    <th className="px-6 py-3.5">Assigned Bus</th>
                    <th className="px-6 py-3.5">Driver Details</th>
                    <th className="px-6 py-3.5">Departure</th>
                    <th className="px-6 py-3.5">Arrival</th>
                    <th className="px-6 py-3.5">Reason Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {previewSchedules.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-semibold text-primary-700">{p.route?.name || `Route #${p.routeId}`}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{p.bus?.registrationNumber || `Bus #${p.busId}`}</td>
                      <td className="px-6 py-3">
                        <span className="font-semibold">{p.driver?.user ? p.driver.user.name : `Driver #${p.driverId}`}</span>
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-800">{p.departureTime}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{p.arrivalTime}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.reasonGenerated?.map((reason: string, rIdx: number) => (
                            <span 
                              key={rIdx} 
                              className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${
                                reason.startsWith('✓') 
                                  ? 'bg-green-50 text-green-700 border border-green-100' 
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                              }`}
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                setPreviewSchedules([]);
                setPreviewConflicts([]);
                setPreviewSummary(null);
              }}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel Preview
            </button>
            <button
              onClick={handleApproveBatch}
              disabled={isSavingBatch}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSavingBatch ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Approve & Save to Database</span>
                </>
              )}
            </button>
          </div>

        </section>
      )}

      {/* Auto Rescheduling Suggestions Panel (Step 8 / Feature 5) */}
      {rescheduleSuggestions.length > 0 && (
        <section className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm text-left">
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 border border-yellow-100">
            <RefreshCw size={14} className="animate-spin-slow" />
            Auto Rescheduling Suggestions
          </div>
          <h3 className="font-extrabold text-lg text-slate-900">Required Roster Replacements</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            The following active database schedules contain drivers or vehicles that have become unavailable. Review and approve recommended substitutes.
          </p>

          <div className="flex flex-col gap-4 mt-6">
            {rescheduleSuggestions.map((s, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all hover:bg-slate-100/50">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-primary-700">Schedule #{s.scheduleId}</span>
                    <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {s.conflictType}
                    </span>
                    <span className="text-slate-400 text-xs font-medium">
                      Route: {s.schedule.route?.name} · {s.schedule.departureTime}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 font-medium">{s.reason}</p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex-grow lg:flex-grow-0 text-left min-w-[200px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Recommended Replacement</span>
                    <div className="mt-1 font-semibold text-slate-700">
                      {s.suggestedBus && <div>Bus: {s.suggestedBus.registrationNumber} ({s.suggestedBus.model})</div>}
                      {s.suggestedDriver && <div>Driver: {s.suggestedDriver.user ? s.suggestedDriver.user.name : s.suggestedDriver.licenseNumber}</div>}
                      {!s.suggestedBus && !s.suggestedDriver && <div className="text-red-500">No suitable alternative available</div>}
                    </div>
                  </div>

                  {(s.suggestedBus || s.suggestedDriver) && (
                    <button
                      onClick={() => handleApproveSuggestion(s)}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0 cursor-pointer"
                    >
                      Approve Replacement
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
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
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-md shadow-purple-600/10 focus:outline-none cursor-pointer"
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
            <div className="h-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center p-8 text-center text-slate-400 text-xs min-h-[150px] w-full">
              No recommendations generated yet. Select a route above to compute options.
            </div>
          )}
          {!isAiLoading && aiSuggestions.map((s, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-slate-100/50 text-left">
              <div>
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
                className="bg-white hover:bg-primary-50 hover:text-primary-600 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all focus:outline-none flex-shrink-0 cursor-pointer"
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
                    <td className="px-6 py-4 font-bold text-slate-800 tracking-tight text-left">
                      {sched.bus.registrationNumber}
                      <p className="text-xs text-slate-400 font-normal">{sched.bus.model}</p>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="font-semibold">{sched.driver.user ? sched.driver.user.name : 'Roster Account'}</span>
                      <p className="text-xs text-slate-400 font-normal">Lic: {sched.driver.licenseNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary-700 text-left">{sched.route.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-left">{sched.departureTime}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-left">{sched.arrivalTime}</td>
                    <td className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">{sched.recurrence}</td>
                    <td className="px-6 py-4 text-left">
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
                          className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sched.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
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

      {/* Schedule History Panel (Step 9 / Feature 6) */}
      <section className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm text-left">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
          <History size={14} />
          Schedule History Log
        </div>
        <h3 className="font-extrabold text-lg text-slate-900">Automation Run Logs</h3>
        <p className="text-slate-500 text-xs mt-1">Audit log records of previously approved automatic schedule generations.</p>

        <div className="overflow-x-auto mt-6 border border-slate-100 rounded-2xl">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3">Generation Time</th>
                <th className="px-6 py-3">Generated By</th>
                <th className="px-6 py-3">Approved By</th>
                <th className="px-6 py-3">Schedules Created</th>
                <th className="px-6 py-3">Conflicts Resolved</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {historyLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">No automated schedule runs logged.</td>
                </tr>
              ) : (
                historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-semibold text-slate-700">
                      {new Date(log.generationTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-medium">{log.generatedBy}</td>
                    <td className="px-6 py-3 font-medium">{log.approvedBy}</td>
                    <td className="px-6 py-3 font-bold text-slate-800">{log.schedulesCreated}</td>
                    <td className="px-6 py-3 font-bold text-green-600">{log.conflictsResolved}</td>
                    <td className="px-6 py-3">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {log.status}
                      </span>
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
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6 text-left">
                {isAddOpen ? 'Allocate Dispatch Run' : 'Edit Schedule Assignment'}
              </h3>

              <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="flex flex-col gap-5 text-left">
                
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Route</label>
                  <select
                    value={routeId}
                    required
                    onChange={(e) => setRouteId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Select Transit Corridor --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Vehicle</label>
                  <select
                    value={busId}
                    required
                    onChange={(e) => setBusId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Select Active Fleet --</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.registrationNumber} ({b.model} - {b.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Driver</label>
                  <select
                    value={driverId}
                    required
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Select Available Operator --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.user ? d.user.name : ' Roster Account'} (Lic: {d.licenseNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departure Time</label>
                    <input
                      type="time"
                      required
                      value={depTime}
                      onChange={(e) => setDepTime(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recurrence</label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKDAYS">Weekdays Only</option>
                      <option value="WEEKENDS">Weekends Only</option>
                      <option value="HOLIDAYS">Holidays Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Timetable lists)</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all cursor-pointer"
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
