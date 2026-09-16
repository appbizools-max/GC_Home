import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAdmin } = useAdmin();
  const [email, setEmail] = useState('admin@gchomeplus.com');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAdmin();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-emerald-950/20">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-900/40 mb-4">
            <Sparkles className="w-8 h-8 text-emerald-200" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            GC Home Plus Admin
          </h1>
          <span className="mt-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60 uppercase tracking-wider">
            Superuser Control Console
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@gchomeplus.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center gap-3 text-xs text-slate-400 mt-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Restricted access. All admin actions are logged and audit-trailed.</span>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-emerald-900/30 transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            Access Admin Console <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
