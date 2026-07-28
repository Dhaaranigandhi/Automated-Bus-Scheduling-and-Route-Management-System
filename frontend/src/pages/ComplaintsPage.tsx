import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { MessageSquare, Check, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Complaint {
  id: number;
  title: string;
  description: string;
  status: 'SUBMITTED' | 'IN_INVESTIGATION' | 'RESOLVED' | 'CLOSED';
  resolutionDetails: string | null;
  createdAt: string;
  passenger: {
    user: { name: string; email: string } | null;
  };
}

const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);

  // Form states
  const [details, setDetails] = useState('');

  const fetchComplaints = async () => {
    try {
      const res = await client.get('/complaints');
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints tickets');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setError(null);
    try {
      const res = await client.put(`/complaints/${selectedTicket.id}/resolve`, {
        resolutionDetails: details,
        status: 'RESOLVED',
      });
      if (res.data.success) {
        setIsOpen(false);
        fetchComplaints();
        setDetails('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save ticket resolution');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Passenger Feedback tickets</h2>
        <p className="text-slate-500 text-sm mt-1">Review student issues, passenger service complaints, and file solutions.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertTriangle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Complaints List grid */}
      <div className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/70 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Passenger Name</th>
                <th className="px-6 py-4">Ticket Title</th>
                <th className="px-6 py-4">Description Details</th>
                <th className="px-6 py-4">Date Filed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No passenger complaints submitted. Great job!</td>
                </tr>
              ) : (
                complaints.map((ticket) => {
                  let statusBg = 'bg-slate-100 text-slate-600';
                  if (ticket.status === 'RESOLVED') statusBg = 'bg-green-50 text-green-700';
                  else if (ticket.status === 'SUBMITTED') statusBg = 'bg-primary-50 text-primary-700';
                  else if (ticket.status === 'IN_INVESTIGATION') statusBg = 'bg-yellow-50 text-yellow-700';

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 tracking-tight">
                        {ticket.passenger.user ? ticket.passenger.user.name : 'Unknown passenger'}
                        {ticket.passenger.user && <p className="text-xs text-slate-400 font-normal">{ticket.passenger.user.email}</p>}
                      </td>
                      <td className="px-6 py-4 font-semibold">{ticket.title}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{ticket.description}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBg}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-6">
                        {ticket.status !== 'RESOLVED' && (
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setDetails('');
                              setIsOpen(true);
                            }}
                            className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold px-3 py-2 rounded-xl transition-all focus:outline-none"
                          >
                            Resolve Ticket
                          </button>
                        )}
                        {ticket.status === 'RESOLVED' && ticket.resolutionDetails && (
                          <span className="text-xs text-slate-400 italic">Resolved: {ticket.resolutionDetails}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Dialog */}
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

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Resolve Support Ticket
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Ticket Title: <span className="font-semibold text-slate-700">{selectedTicket?.title}</span>
              </p>

              <form onSubmit={handleResolveSubmit} className="flex flex-col gap-5">
                
                <div className="relative group">
                  <textarea
                    id="details"
                    required
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder=" "
                    className="peer w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all resize-none"
                  />
                  <label htmlFor="details" className="absolute left-4 top-4 text-slate-400 text-xs pointer-events-none transition-all peer-focus:top-0 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-90 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2">
                    Action Plan & Resolution Details
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-primary-600/20 mt-2 transition-all"
                >
                  Save Ticket Resolution
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ComplaintsPage;
