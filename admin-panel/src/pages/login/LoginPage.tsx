import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
  Shield,
  Headphones,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAdminWithCredentials, resetPassword } = useAdmin();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status & Modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else {
      setEmail('admin@example.com');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (rememberMe) {
        localStorage.setItem('admin_remembered_email', email.trim());
      } else {
        localStorage.removeItem('admin_remembered_email');
      }

      const res = await loginAdminWithCredentials(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please check your email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while logging in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetSubmitting(true);
    setResetStatus(null);

    const res = await resetPassword(resetEmail.trim());
    setResetSubmitting(false);
    if (res.success) {
      setResetStatus({ success: true, message: res.message });
    } else {
      setResetStatus({ success: false, message: res.error });
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col justify-between bg-cover bg-center bg-no-repeat relative font-sans text-slate-800 select-none overflow-y-auto lg:overflow-hidden bg-[#F0FDF4]"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(240, 253, 244, 0.94) 0%, rgba(255, 255, 255, 0.90) 100%), url('/login-bg.jpg')`,
      }}
    >
      {/* Top Header Row */}
      <header className="max-w-7xl w-full mx-auto px-6 py-3.5 lg:py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#043927] text-white font-black text-sm flex items-center justify-center shadow-xs">
            GC
          </div>
          <div>
            <span className="text-sm font-black text-[#0A192F] tracking-tight block leading-tight">
              GC HOME+
            </span>
            <span className="text-[10px] text-emerald-800 font-bold block leading-tight">
              Admin Portal
            </span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur border border-slate-200/90 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#043927]" />
          <span>Secure Admin Access</span>
        </div>
      </header>

      {/* Main Content Area: 2-Column Responsive Layout */}
      <main className="max-w-7xl w-full mx-auto px-6 py-2 lg:py-3 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center z-10 min-h-0">
        {/* Left Side: Brand Marketing & Statistics */}
        <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-4">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.06] mb-2.5">
            <span className="text-[#0A192F] block">Clean Spaces.</span>
            <span className="text-[#043927] block mt-0.5">Better Lives.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#0F1E36] text-sm sm:text-base max-w-lg mb-5 leading-relaxed font-bold tracking-tight">
            Manage your operations, partners, services and bookings — all in one powerful dashboard.
          </p>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 max-w-md mb-5 items-start">
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] border border-emerald-200/80 text-[#043927] flex items-center justify-center shadow-xs mb-1.5 transition-transform hover:scale-105">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                Real-time <br /> Insights
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] border border-emerald-200/80 text-[#043927] flex items-center justify-center shadow-xs mb-1.5 transition-transform hover:scale-105">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                Secure <br /> Access
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] border border-emerald-200/80 text-[#043927] flex items-center justify-center shadow-xs mb-1.5 transition-transform hover:scale-105">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                Partner <br /> Dispatch
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] border border-emerald-200/80 text-[#043927] flex items-center justify-center shadow-xs mb-1.5 transition-transform hover:scale-105">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                Operational <br /> Control
              </span>
            </div>
          </div>

          {/* Bottom Left Stats Card */}
          <div className="bg-[#0B3B2B]/95 backdrop-blur-md border border-emerald-600/40 rounded-2xl p-4 sm:p-4.5 text-white max-w-md shadow-xl shadow-emerald-950/20">
            <p className="italic text-emerald-100 text-xs sm:text-sm font-medium mb-3 leading-relaxed">
              “A cleaner tomorrow starts with better management.”
            </p>

            <div className="border-t border-emerald-700/60 pt-2.5 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">100+</div>
                <div className="text-[9px] sm:text-[10px] text-emerald-200 font-extrabold uppercase tracking-widest mt-0.5">
                  Partners
                </div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">5K+</div>
                <div className="text-[9px] sm:text-[10px] text-emerald-200 font-extrabold uppercase tracking-widest mt-0.5">
                  Customers
                </div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">20+</div>
                <div className="text-[9px] sm:text-[10px] text-emerald-200 font-extrabold uppercase tracking-widest mt-0.5">
                  Cities
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-slate-900/10 border border-slate-100 max-w-[420px] w-full">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 font-semibold mb-4 mt-0.5">
              Sign in to your administrator dashboard
            </p>

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl p-3 mb-4 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-semibold leading-relaxed">{errorMessage}</div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs mt-0.5">
                <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#043927] focus:ring-[#043927]/30 cursor-pointer"
                  />
                  <span className="text-[11px]">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || 'admin@example.com');
                    setShowForgotModal(true);
                  }}
                  className="text-[#043927] text-[11px] font-bold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#043927] hover:bg-[#064e3b] active:scale-[0.99] text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md shadow-[#043927]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-70 tracking-wide"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Enterprise Security Banner */}
            <div className="bg-[#EFFDF6] border border-emerald-100 rounded-xl p-2.5 mt-3.5 flex items-center gap-2 text-[11px] text-emerald-900 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
              <span>Enterprise-grade encryption & RLS session security</span>
            </div>

            {/* Footer Links */}
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-slate-400 font-semibold">
              <a href="#terms" className="hover:text-slate-600 transition-colors">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#privacy" className="hover:text-slate-600 transition-colors">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#help" className="hover:text-slate-600 transition-colors">
                Help Desk
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      <footer className="w-full border-t border-slate-200/70 bg-white/85 backdrop-blur-md py-2.5 px-6 z-10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 font-semibold">
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-[#043927]" />
            <div>
              <span className="font-extrabold text-[#0A192F]">Support Helpline:</span>{' '}
              <span className="text-slate-500 font-medium">1800-424-663 (24/7 Operations)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#043927]" />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#0A192F]">Platform Status:</span>{' '}
              <span className="text-slate-500 font-medium">All systems operational</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#043927]" />
            <div>
              <span className="font-extrabold text-[#0A192F]">Security:</span>{' '}
              <span className="text-slate-500 font-medium">SOC-2 & ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setResetStatus(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] text-[#043927] flex items-center justify-center mb-3.5">
              <Lock className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-extrabold text-[#0A192F]">Reset Admin Password</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4 font-medium">
              Enter your registered administrator email to receive password reset instructions.
            </p>

            {resetStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold mb-3.5 flex items-start gap-2 ${
                  resetStatus.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {resetStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Registered Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927] transition-all font-semibold"
                />
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetStatus(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="flex-1 bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {resetSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
