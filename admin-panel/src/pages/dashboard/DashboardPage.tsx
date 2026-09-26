import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  TrendingUp,
  BarChart3,
  Users,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Star,
  Download,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  Activity,
  Award,
  MapPin,
} from 'lucide-react';
import { RedFlagAlertsBanner } from '../../components/RedFlagAlertsBanner';
import { QuickAccessPanel } from '../../components/QuickAccessPanel';

export const DashboardPage: React.FC = () => {
  const {
    bookings,
    maids,
    ratings,
    bookingsLoading,
    maidsLoading,
    selectedLocation,
    setCurrentTab,
    openBookingDetails,
    exportBookingsToCSV,
    selectedTimezone,
    finalizeSlotAdmin,
    resolveRedFlagAdmin,
  } = useAdmin();

  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (): string => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);

      let hour = parseInt(hourStr, 10);
      if (isNaN(hour)) hour = now.getHours();

      if (hour >= 5 && hour < 12) {
        return 'Good Morning, Admin! 👋';
      } else if (hour >= 12 && hour < 17) {
        return 'Good Afternoon, Admin! 👋';
      } else if (hour >= 17 && hour < 21) {
        return 'Good Evening, Admin! 👋';
      } else {
        return 'Good Night, Admin! 👋';
      }
    } catch {
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) return 'Good Morning, Admin! 👋';
      if (hour >= 12 && hour < 17) return 'Good Afternoon, Admin! 👋';
      if (hour >= 17 && hour < 21) return 'Good Evening, Admin! 👋';
      return 'Good Night, Admin! 👋';
    }
  };

  // Performance & Reports Data Derivations
  const totalGrossValue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount || b.servicePrice) || 0), 0);
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const fulfillmentRate = bookings.length > 0 ? Math.round((completedCount / bookings.length) * 100) : 100;
  const onlineMaidsCount = maids.filter(m => m.isOnline).length;
  const totalMaidsCount = maids.length;

  const validRatings = ratings.filter(r => r.is_visible !== false && r.rating);
  const avgRating = validRatings.length > 0
    ? (validRatings.reduce((sum, r) => sum + Number(r.rating || 5), 0) / validRatings.length).toFixed(1)
    : (maids.length > 0
      ? (maids.reduce((sum, m) => sum + (Number(m.rating) || 5), 0) / maids.length).toFixed(1)
      : '5.0');

  // Service demand breakdown
  const serviceCounts = bookings.reduce((acc, b) => {
    const s = b.serviceName || 'General Home Cleaning';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceEntries = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const catColors = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-500', 'bg-purple-600', 'bg-sky-500'];

  // Top Performing Partners
  const topPerformers = [...maids]
    .sort((a, b) => (Number(b.completedJobsCount) || 0) - (Number(a.completedJobsCount) || 0) || (Number(b.rating) || 5) - (Number(a.rating) || 5))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-8">
      {/* Top Banner & Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
              Admin Operations Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Displaying live operational reports, partner performance benchmarks, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportBookingsToCSV}
            className="bg-[#123D2A] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Export Operational Report</span>
          </button>
        </div>
      </div>

      {/* ── CONSOLIDATED QUICK ACCESS PANEL ── */}
      <QuickAccessPanel onNavigateTab={setCurrentTab} />

      {/* ── PRE-SERVICE SLOT CONFIRMATION & RED FLAG ALERTS BANNER ── */}
      <RedFlagAlertsBanner
        bookings={bookings}
        onFinalizeSlot={finalizeSlotAdmin}
        onResolveRedFlag={resolveRedFlagAdmin}
      />

      {/* ━━━ EXECUTIVE REPORTS & PERFORMANCE KPI ROW ━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue Report */}
        <div
          onClick={() => setCurrentTab('revenue')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span>Financial</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total Gross Revenue
            </span>
            {bookingsLoading ? (
              <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg mt-0.5" />
            ) : (
              <h3 className="text-3xl font-black text-[#0A192F] mt-0.5">
                ₹{totalGrossValue.toLocaleString()}
              </h3>
            )}
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Live platform booking volume
            </p>
          </div>
        </div>

        {/* SLA & Fulfillment Rate */}
        <div
          onClick={() => setCurrentTab('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span>Performance</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              SLA Fulfillment Rate
            </span>
            {bookingsLoading ? (
              <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg mt-0.5" />
            ) : (
              <h3 className="text-3xl font-black text-[#0A192F] mt-0.5">
                {fulfillmentRate}%
              </h3>
            )}
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {completedCount} completed services logged
            </p>
          </div>
        </div>

        {/* Fleet Capacity & Readiness */}
        <div
          onClick={() => setCurrentTab('maids')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span>Fleet</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Active Online Fleet
            </span>
            {maidsLoading ? (
              <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg mt-0.5" />
            ) : (
              <h3 className="text-3xl font-black text-[#0A192F] mt-0.5">
                {onlineMaidsCount} <span className="text-base text-slate-400 font-bold">/ {totalMaidsCount}</span>
              </h3>
            )}
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Online service partners ready
            </p>
          </div>
        </div>

        {/* Quality Score & CSAT */}
        <div
          onClick={() => setCurrentTab('ratings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <span>Quality Index</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Customer Satisfaction
            </span>
            <h3 className="text-3xl font-black text-[#0A192F] mt-0.5 flex items-center gap-1">
              <span>{avgRating}</span>
              <span className="text-amber-500 text-2xl font-black">★</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Verified customer rating score
            </p>
          </div>
        </div>
      </div>

      {/* ━━━ DETAILED REPORTS & PERFORMANCE ANALYSIS GRID ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Service Popularity & Category Demand Report */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0A192F]">
                    Service Category & Demand Report
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Breakdown of customer requests and category market share
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('reports')}
                className="text-xs font-bold text-[#123D2A] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Full Report</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {serviceEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p>No service booking orders recorded yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Service demand analytics will appear as bookings are created.</p>
                </div>
              ) : (
                serviceEntries.map(([name, count], idx) => {
                  const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                  const col = catColors[idx % catColors.length];
                  return (
                    <div key={name} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">{count} Orders</span>
                          <span className="text-[#123D2A] font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${col} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Location: <strong>{selectedLocation} Hub</strong></span>
            <button
              onClick={() => setCurrentTab('services')}
              className="text-[#123D2A] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage Service Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Partner Performance Benchmarks */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0A192F]">
                    Partner Performance & Quality
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Top rated professionals by customer feedback & completions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('maids')}
                className="text-xs font-bold text-[#123D2A] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Fleet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Performance Leaderboard Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 border-b border-slate-200/80 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Partner</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topPerformers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400 font-semibold">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                        No partner performance data available yet.
                      </td>
                    </tr>
                  ) : (
                    topPerformers.map(m => (
                      <tr key={m.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.fullName} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#123D2A] text-white flex items-center justify-center font-bold text-xs">
                                {m.fullName?.charAt(0) || 'P'}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900 leading-tight">{m.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {m.isOnline ? (
                                  <span className="text-emerald-600 font-bold">● Online</span>
                                ) : (
                                  <span className="text-slate-400">Offline</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-semibold">
                          {m.serviceArea?.split(',')[0] || selectedLocation}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-800">
                          {m.completedJobsCount || 0} Jobs
                        </td>
                        <td className="py-2.5 px-3 font-black text-amber-600">
                          ★ {m.rating || '5.0'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Quality Benchmarks Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Response</span>
              <span className="text-xs font-black text-[#123D2A]">&lt; 2 Mins</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Acceptance</span>
              <span className="text-xs font-black text-[#123D2A]">98.5%</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">KYC Verified</span>
              <span className="text-xs font-black text-[#123D2A]">100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
