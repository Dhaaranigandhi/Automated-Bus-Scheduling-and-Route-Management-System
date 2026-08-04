import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Settings, Save, AlertTriangle, CheckCircle } from 'lucide-react';

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    try {
      const res = await client.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
        const values: Record<string, string> = {};
        res.data.settings.forEach((s: Setting) => {
          values[s.key] = s.value;
        });
        setEditValues(values);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setEditValues(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSave = async (key: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await client.post('/settings', {
        key,
        value: editValues[key]
      });
      if (res.data.success) {
        setSuccess(`Successfully updated ${key}`);
        fetchSettings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure global application parameters, speed limits, and system variables.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 text-sm">
          <AlertTriangle className="flex-shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-4 rounded-2xl text-green-700 text-sm">
          <CheckCircle className="flex-shrink-0" size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-6">
        {settings.map((setting) => (
          <div key={setting.id} className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md">
            <div className="flex-grow max-w-2xl">
              <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">{setting.key}</span>
              <h3 className="text-base font-bold text-slate-800 mt-1 capitalize">
                {setting.key.replace(/_/g, ' ')}
              </h3>
              <p className="text-slate-500 text-sm mt-1">{setting.description || 'No description provided.'}</p>
            </div>
            
            <div className="flex items-center gap-4 min-w-[280px]">
              <input
                type="text"
                value={editValues[setting.key] || ''}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                className="flex-grow px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
              />
              <button
                onClick={() => handleSave(setting.key)}
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-2xl transition-all shadow-md shadow-primary-600/10 flex items-center justify-center disabled:opacity-50"
                title="Save Setting"
              >
                <Save size={18} />
              </button>
            </div>
          </div>
        ))}

        {settings.length === 0 && (
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-12 text-center text-slate-400">
            <Settings size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">No system settings initialized.</p>
            <p className="text-sm text-slate-400 mt-1">Please ensure the database seed script has run successfully.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
