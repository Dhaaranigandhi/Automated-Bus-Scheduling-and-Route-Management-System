import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { 
  LayoutDashboard, Bus, UserSquare2, Map, Calendar, MapPin, 
  Wrench, Fuel, MessageSquare, Settings, LogOut, Menu, X, User
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['Super Administrator', 'Transport Manager', 'Dispatcher', 'Scheduler', 'Maintenance Manager', 'Finance Officer', 'Security Officer'] },
  { name: 'Buses', path: '/admin/buses', icon: Bus, roles: ['Super Administrator', 'Transport Manager', 'Bus Operator', 'Maintenance Manager'] },
  { name: 'Drivers', path: '/admin/drivers', icon: UserSquare2, roles: ['Super Administrator', 'Transport Manager'] },
  { name: 'Routes', path: '/admin/routes', icon: Map, roles: ['Super Administrator', 'Transport Manager', 'Scheduler'] },
  { name: 'Schedules', path: '/admin/schedules', icon: Calendar, roles: ['Super Administrator', 'Transport Manager', 'Scheduler'] },
  { name: 'Live Tracking', path: '/admin/tracking', icon: MapPin, roles: ['Super Administrator', 'Transport Manager', 'Dispatcher', 'Scheduler', 'Security Officer'] },
  { name: 'Maintenance', path: '/admin/maintenance', icon: Wrench, roles: ['Super Administrator', 'Maintenance Manager'] },
  { name: 'Fuel Logs', path: '/admin/fuel', icon: Fuel, roles: ['Super Administrator', 'Transport Manager', 'Finance Officer'] },
  { name: 'Complaints', path: '/admin/complaints', icon: MessageSquare, roles: ['Super Administrator', 'Transport Manager'] },
  { name: 'System Settings', path: '/admin/settings', icon: Settings, roles: ['Super Administrator'] },
];

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter links by user role
  const allowedItems = sidebarItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen flex bg-slate-50 font-poppins">
      
      {/* Mobile Drawer Trigger */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-md shadow-md focus:outline-none"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-primary-900 text-white flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:flex-shrink-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 pb-8 mb-6 border-b border-primary-800">
            <div className="bg-primary-600 p-2 rounded-lg text-white shadow-lg shadow-primary-700/50">
              <Bus size={24} />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">TransitFlow</span>
              <p className="text-[10px] text-primary-300 font-medium tracking-widest uppercase">Fleet Console</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-1.5">
            {allowedItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 font-semibold translate-x-1' 
                      : 'text-primary-200/75 hover:bg-white/5 hover:text-white hover:translate-x-1'}
                  `}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="border-t border-primary-800 pt-4 mt-6">
          <button
            onClick={logout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-200 hover:bg-red-500/10 hover:text-red-400 font-medium text-sm transition-all duration-200 hover:translate-x-1"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content frame */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shadow-sm">
          <div>
            <h1 className="text-sm font-semibold text-slate-400 hidden lg:block uppercase tracking-wider">
              {location.pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{user?.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shadow-inner">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic page container */}
        <main className="flex-grow p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
