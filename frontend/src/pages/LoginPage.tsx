import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Bus, KeyRound, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Connecting to auth service failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 font-poppins">
      
      {/* Left Marketing Banner */}
      <div className="hidden lg:flex lg:col-span-5 bg-primary-900 text-white flex-col justify-between p-16 relative overflow-hidden">
        
        {/* Abstract Background Glow */}
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-primary-700/20 rounded-full filter blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-xl">
            <Bus size={24} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">TransitFlow</span>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight">Managing Transit,<br />Simplified.</h2>
          <p className="text-primary-200/80 leading-relaxed text-sm max-w-sm">
            Access your administrative command console to manage fleets, check active rosters, track vehicles, and compile performance metrics.
          </p>
        </div>

        <div className="text-xs text-primary-400">
          &copy; {new Date().getFullYear()} TransitFlow intelligent Transit Systems.
        </div>
      </div>

      {/* Right Login Form Cards */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-slate-200/80 p-8 sm:p-12 rounded-[2rem] shadow-xl shadow-slate-100"
        >
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Console Sign In</h3>
            <p className="text-slate-400 text-sm mt-2">Enter your credential details below to open your workspace</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Input with pure floating label layout style */}
            <div className="relative group">
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <label 
                htmlFor="email"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none transition-all duration-200
                  peer-focus:top-0 peer-focus:scale-85 peer-focus:text-primary-600 peer-focus:bg-white peer-focus:px-2
                  peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
              >
                Email Address
              </label>
            </div>

            <div className="relative group">
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
              />
              <label 
                htmlFor="password"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none transition-all duration-200
                  peer-focus:top-0 peer-focus:scale-85 peer-focus:text-primary-600 peer-focus:bg-white peer-focus:px-2
                  peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:scale-85 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
              >
                Password
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-primary-600/25 disabled:bg-primary-300 disabled:shadow-none transition-all"
            >
              <KeyRound size={16} />
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            </button>

          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              &larr; Back to Landing Page
            </Link>
          </div>
        </motion.div>

      </div>

    </div>
  );
};

export default LoginPage;
