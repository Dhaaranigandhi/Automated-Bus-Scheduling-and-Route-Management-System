import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Bus, MapPin, Calendar, Clock, AlertOctagon, 
  MessageSquare, Wrench, ShieldAlert, Fuel
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface DashboardStats {
  todayTrips: number;
  runningBuses: number;
  delayedBuses: number;
  driverAvailability: { available: number; total: number };
  fuel: { totalCost: number; totalLiters: number };
  maintenanceAlerts: number;
  openComplaints: number;
  attendance: { drivers: number; passengers: number };
  fleet: { total: number; active: number; maintenance: number };
}

interface AuditLog {
  id: number;
  action: string;
  details: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

interface MonthlyReport {
  labels: string[];
  trips: number[];
  fuelCosts: number[];
  maintenanceCosts: number[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch live KPI stats
      const statsRes = await client.get('/reports/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setAuditLogs(statsRes.data.recentAuditLogs);
      }

      // 2. Fetch historical trends
      const reportRes = await client.get('/reports/monthly');
      if (reportRes.data.success) {
        const report: MonthlyReport = reportRes.data.report;
        const formattedData = report.labels.map((month, idx) => ({
          name: month,
          Trips: report.trips[idx],
          'Fuel Expense ($)': report.fuelCosts[idx],
          'Repairs Expense ($)': report.maintenanceCosts[idx],
        }));
        setChartData(formattedData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-slate-200 rounded-3xl"></div>
          <div className="lg:col-span-4 h-96 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  // Calculate active fleet percentage
  const totalFleet = stats.fleet.total;
  const activeFleet = stats.fleet.active;
  const activePercentage = totalFleet > 0 ? Math.round((activeFleet / totalFleet) * 100) : 0;

  return (
    <div className="flex flex-col gap-8 animate-fade-in-up">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fleet Command</h2>
        <p className="text-slate-500 text-sm mt-1">Real-time status overview of active dispatches, drivers, and operations.</p>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Trips */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Trips</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2">{stats.todayTrips}</span>
          </div>
          <div className="bg-primary-50 text-primary-600 p-4 rounded-2xl">
            <Calendar size={24} />
          </div>
        </div>

        {/* Running Buses */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Running Vehicles</span>
            <span className="text-3xl font-extrabold text-green-600 mt-2">{stats.runningBuses}</span>
          </div>
          <div className="bg-green-50 text-green-600 p-4 rounded-2xl">
            <Bus size={24} />
          </div>
        </div>

        {/* Delay Alerts */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Delays</span>
            <span className={`text-3xl font-extrabold mt-2 ${stats.delayedBuses > 0 ? 'text-red-500' : 'text-slate-800'}`}>
              {stats.delayedBuses}
            </span>
          </div>
          <div className={`p-4 rounded-2xl ${stats.delayedBuses > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
            <AlertOctagon size={24} />
          </div>
        </div>

        {/* Available Drivers */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Drivers</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2">
              {stats.driverAvailability.available} <span className="text-xs text-slate-400 font-medium">/ {stats.driverAvailability.total}</span>
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl">
            <Clock size={24} />
          </div>
        </div>

      </section>

      {/* Operational Widgets */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Maintenance alerts */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-yellow-50 text-yellow-600 p-3 rounded-xl">
            <Wrench size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Service Alerts</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5">{stats.maintenanceAlerts} pending tasks</span>
          </div>
        </div>

        {/* Fuel Spent */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
            <Fuel size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fuel Expenditure</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5">${stats.fuel.totalCost.toLocaleString()} total</span>
          </div>
        </div>

        {/* Complaints */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-rose-50 text-rose-500 p-3 rounded-xl">
            <MessageSquare size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Unresolved Issues</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5">{stats.openComplaints} passenger tickets</span>
          </div>
        </div>

        {/* Attendance Rates */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Daily Checked-In</span>
            <span className="text-lg font-bold text-slate-800 mt-0.5">{stats.attendance.passengers} check-ins</span>
          </div>
        </div>

      </section>

      {/* Main Charts & Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Trend chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-slate-900">Transit Logs & Cost Trends</h3>
            <p className="text-xs text-slate-400 mt-1">Monthly breakdown comparing total bus dispatches to operational logs.</p>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="Trips" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Fuel Expense ($)" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="Repairs Expense ($)" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Utilization SVG Circle Gauge */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm flex flex-col items-center justify-between">
          <div className="w-full text-left self-start">
            <h3 className="font-bold text-lg text-slate-900">Fleet Allocation</h3>
            <p className="text-xs text-slate-400 mt-1">Active vs standby status registry.</p>
          </div>

          {/* SVG Donut */}
          <div className="relative w-44 h-44 my-6">
            <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
              <circle 
                cx="18" 
                cy="18" 
                r="15.915" 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                strokeDasharray={`${activePercentage} 100`}
                strokeDashoffset="0"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{activePercentage}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Fleet</span>
            </div>
          </div>

          {/* Status Legends */}
          <div className="flex flex-col gap-3 w-full border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                <span className="text-slate-500 font-medium">Running / Active</span>
              </div>
              <span className="font-bold text-slate-800">{stats.fleet.active} vehicles</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-slate-500 font-medium">In Maintenance</span>
              </div>
              <span className="font-bold text-slate-800">{stats.fleet.maintenance} vehicles</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <span className="text-slate-500 font-medium">Standby / Off</span>
              </div>
              <span className="font-bold text-slate-800">{stats.fleet.total - stats.fleet.active - stats.fleet.maintenance} vehicles</span>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Logs Row */}
      <section className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm">
        <div className="mb-6">
          <h3 className="font-bold text-lg text-slate-900">Audit Logs & Activity Trail</h3>
          <p className="text-xs text-slate-400 mt-1">Live tracking of sensitive console actions made by administrators.</p>
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-2xl">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Time String</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">No recent activities.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {log.user ? log.user.name : 'System Process'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{log.details || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
