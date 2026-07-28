import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Map, Plus, Trash2, MapPin, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Stop {
  id?: number;
  stopName: string;
  stopOrder: number;
  latitude: number;
  longitude: number;
  etaOffset: number;
}

interface Route {
  id: number;
  name: string;
  startLocation: string;
  endLocation: string;
  totalDistance: string;
  totalDuration: number;
  stops: Stop[];
}

const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Form states
  const [routeName, setRouteName] = useState('');
  const [startLoc, setStartLoc] = useState('');
  const [endLoc, setEndLoc] = useState('');
  const [stops, setStops] = useState<Stop[]>([
    { stopName: 'Source Terminal', stopOrder: 1, latitude: 12.9778, longitude: 77.5706, etaOffset: 0 },
    { stopName: 'Destination Terminal', stopOrder: 2, latitude: 12.8452, longitude: 77.6631, etaOffset: 45 },
  ]);

  const fetchRoutes = async () => {
    try {
      let url = '/routes';
      if (search) url += `?search=${search}`;
      const res = await client.get(url);
      if (res.data.success) {
        setRoutes(res.data.routes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load routes');
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [search]);

  const handleAddStop = () => {
    const nextOrder = stops.length + 1;
    setStops([
      ...stops,
      { stopName: `Waypoint Stop ${nextOrder}`, stopOrder: nextOrder, latitude: 12.9176, longitude: 77.6244, etaOffset: (nextOrder - 1) * 15 }
    ]);
  };

  const handleRemoveStop = (idx: number) => {
    if (stops.length <= 2) {
      alert('A route must contain at least 2 stops (Source & Destination)');
      return;
    }
    const updated = stops.filter((_, i) => i !== idx).map((stop, i) => ({
      ...stop,
      stopOrder: i + 1
    }));
    setStops(updated);
  };

  const handleStopChange = (idx: number, field: keyof Stop, value: any) => {
    const updated = [...stops];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setStops(updated);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await client.post('/routes', {
        name: routeName,
        startLocation: startLoc,
        endLocation: endLoc,
        stops: stops.map(s => ({
          ...s,
          latitude: parseFloat(s.latitude as any),
          longitude: parseFloat(s.longitude as any),
          etaOffset: parseInt(s.etaOffset as any, 10),
        }))
      });
      if (res.data.success) {
        setIsAddOpen(false);
        fetchRoutes();
        // Clear
        setRouteName('');
        setStartLoc('');
        setEndLoc('');
        setStops([
          { stopName: 'Source Terminal', stopOrder: 1, latitude: 12.9778, longitude: 77.5706, etaOffset: 0 },
          { stopName: 'Destination Terminal', stopOrder: 2, latitude: 12.8452, longitude: 77.6631, etaOffset: 45 },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create route');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    setError(null);
    try {
      await client.delete(`/routes/${id}`);
      fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete route');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Route Networks</h2>
          <p className="text-slate-500 text-sm mt-1">Configure source-destination nodes, multi-stop GPS paths, and travel times.</p>
        </div>
        
        <button 
          onClick={() => {
            setError(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-primary-600/20 transition-all focus:outline-none"
        >
          <Plus size={18} />
          <span>Configure Route</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-[2rem] shadow-sm">
        <input
          type="text"
          placeholder="Search by route name, source, or destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
        />
      </div>

      {/* Grid of routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.length === 0 ? (
          <div className="col-span-2 bg-white border border-slate-200/80 p-12 rounded-[2rem] text-center text-slate-400">
            No transit routes configured. Click 'Configure Route' to design a network path.
          </div>
        ) : (
          routes.map((route) => (
            <div key={route.id} className="bg-white border border-slate-200/80 p-6 lg:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
                    Route #{route.id}
                  </span>
                  <button 
                    onClick={() => handleDelete(route.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Route"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight mb-2">{route.name}</h3>
                
                {/* Distance & duration */}
                <div className="flex gap-6 text-sm mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Distance</span>
                    <p className="font-bold text-slate-800 mt-0.5">{route.totalDistance} km</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Duration</span>
                    <p className="font-bold text-slate-800 mt-0.5">{route.totalDuration} mins</p>
                  </div>
                </div>

                {/* Stations Timeline */}
                <div className="flex flex-col gap-4 pl-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                  {route.stops.map((stop, idx) => (
                    <div key={idx} className="flex gap-4 items-center relative">
                      <div className="w-6 h-6 rounded-full border-2 border-primary-500 bg-white flex items-center justify-center relative z-10">
                        <MapPin size={10} className="text-primary-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-slate-800">{stop.stopName}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Order {stop.stopOrder} {stop.etaOffset > 0 && `· +${stop.etaOffset} mins`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Add Route Dialog */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-2xl p-8 rounded-[2rem] shadow-xl relative my-8"
            >
              <button 
                onClick={() => setIsAddOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-extrabold text-slate-900 mb-6">
                Configure Transit Corridor
              </h3>

              <form onSubmit={handleAddSubmit} className="flex flex-col gap-5">
                
                <div className="relative group">
                  <input
                    type="text"
                    id="routeName"
                    required
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                  />
                  <label htmlFor="routeName" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Route Reference Name (e.g. Route 101 - Majestic to E-City)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <input
                      type="text"
                      id="startLoc"
                      required
                      value={startLoc}
                      onChange={(e) => setStartLoc(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="startLoc" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Start Station Node
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      id="endLoc"
                      required
                      value={endLoc}
                      onChange={(e) => setEndLoc(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    />
                    <label htmlFor="endLoc" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                      Destination Station Node
                    </label>
                  </div>
                </div>

                {/* Stops Configuration Section */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waypoint Stops Sequence</span>
                    <button
                      type="button"
                      onClick={handleAddStop}
                      className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 focus:outline-none"
                    >
                      <Plus size={14} />
                      <span>Add Stop Node</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-4 pr-1">
                    {stops.map((stop, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border border-slate-100 p-4 rounded-2xl relative">
                        <span className="sm:col-span-1 text-slate-400 text-xs font-bold">#{stop.stopOrder}</span>
                        
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            required
                            value={stop.stopName}
                            onChange={(e) => handleStopChange(idx, 'stopName', e.target.value)}
                            placeholder="Stop Name"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            required
                            step="0.0001"
                            value={stop.latitude}
                            onChange={(e) => handleStopChange(idx, 'latitude', parseFloat(e.target.value))}
                            placeholder="Lat"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            required
                            step="0.0001"
                            value={stop.longitude}
                            onChange={(e) => handleStopChange(idx, 'longitude', parseFloat(e.target.value))}
                            placeholder="Lng"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            required
                            value={stop.etaOffset}
                            onChange={(e) => handleStopChange(idx, 'etaOffset', parseInt(e.target.value, 10))}
                            placeholder="ETA Offset (mins)"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 text-slate-800"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStop(idx)}
                          className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-full shadow-sm focus:outline-none"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Save Transit Corridor
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RoutesPage;
