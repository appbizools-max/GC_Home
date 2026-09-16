import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Wifi, Signal, Battery } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithPhone } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('sarah.daniels@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Sarah Daniels');
  const [phone, setPhone] = useState('+91 98111 22233');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithPhone(phone, isSignUp ? name : 'Sarah Daniels');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F7FAF8] px-6 py-4 justify-between text-slate-800 font-sans">
      {/* Mobile Top Status Bar */}
      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 px-1 pt-1 pb-4">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal size={14} className="stroke-[2.5]" />
          <Wifi size={14} className="stroke-[2.5]" />
          <Battery size={16} className="stroke-[2]" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-4">
        {/* Brand Icon & Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0D473B] flex items-center justify-center shadow-lg shadow-emerald-900/10 mb-4">
            <Sparkles className="w-8 h-8 text-emerald-200" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0D473B] tracking-tight">
            GC Home Plus
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Genuine & Care Cleaning
          </p>
        </div>

        {/* Welcome Text */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isSignUp
              ? 'Sign up to book background-checked maid cleaning services.'
              : 'Log in to manage your premium home cleaning services.'}
          </p>
        </div>

        {/* Login / Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Sarah Daniels"
                required
                className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D473B]/20 focus:border-[#0D473B] transition-all shadow-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sarah.daniels@gmail.com"
              required
              className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D473B]/20 focus:border-[#0D473B] transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D473B]/20 focus:border-[#0D473B] transition-all shadow-sm"
            />
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold text-[#0D473B] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0D473B] hover:bg-[#0A382E] active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-full text-sm shadow-md shadow-emerald-950/15 transition-all mt-2 cursor-pointer"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {/* Toggle Sign Up / Log In */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-bold text-[#0D473B] hover:underline cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-32 h-1 bg-slate-900 rounded-full mx-auto my-2 opacity-80" />
    </div>
  );
};
