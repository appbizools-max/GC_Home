import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../config/supabase';
import { MaidProfile } from '../../types';
import {
  TrendingUp,
  Star,
  Users,
  DollarSign,
  Award,
  Download,
  Search,
  RotateCcw,
  Eye,
  X,
  MapPin,
  CheckCircle2,
  Calendar,
  Send,
  Phone,
  Briefcase,
  UserCheck,
  Edit3,
  UserX,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export const PerformanceTab: React.FC = () => {
  const { maids, bookings, ratings, toggleMaidActiveStatus } = useAdmin();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'Overview' | 'Jobs' | 'Earnings' | 'Ratings' | 'History'>('Overview');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!activeDrawerMaid?.uid) return;
    const fetchMaidHistory = async () => {
      try {
        const { data } = await supabase
          .from('maid_history')
          .select('*')
          .eq('maid_id', activeDrawerMaid.uid)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setHistoryLogs(data);
        } else {
          setHistoryLogs([
            {
              id: 'h1',
              action: 'Partner Profile Verified',
              actor_name: 'Admin',
              details: 'Partner verified and activated for assignments.',
              created_at: activeDrawerMaid.appliedAt || new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.warn('Error fetching maid history:', err);
      }
    };
    fetchMaidHistory();
  }, [activeDrawerMaid?.uid]);

  const approvedMaids = maids.filter(m => m.status === 'approved');

  // Calculate real KPIs from live data
  const totalJobsCompleted = approvedMaids.reduce((sum, m) => sum + m.completedJobsCount, 0);
  const totalCustomersServed = approvedMaids.reduce((sum, m) => sum + (m.uniqueCustomersServed || 0), 0);
  const totalEarnings = approvedMaids.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
  const avgRating = approvedMaids.length > 0
    ? (approvedMaids.reduce((sum, m) => sum + m.rating, 0) / approvedMaids.length).toFixed(1)
    : '0.0';
  
  // Find top performing maid by rating and completed jobs
  const topMaid = approvedMaids.length > 0
    ? approvedMaids.reduce((best, current) => 
        (current.rating > best.rating || (current.rating === best.rating && current.completedJobsCount > best.completedJobsCount)) 
          ? current 
          : best
      )
    : null;

  const filtered = approvedMaids.filter(m => {
    if (selectedLocation !== 'All' && !m.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.fullName.toLowerCase().includes(q) && !m.phone.includes(q) && !(m.maidId || m.uid).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSelectedLocation('All');
    setSelectedService('All');
    setSelectedExperience('All');
    setSelectedRating('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Header Bar matching Reference Screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Performance</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track maid partner performance, ratings, jobs and earnings.</p>
        </div>

        <button
          onClick={() => alert('Exporting performance report...')}
          className="px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md self-start md:self-auto"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* 5 KPI Cards with Live Data */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Total Jobs Completed</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalJobsCompleted.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Average Rating</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{avgRating}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Total Customers Served</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalCustomersServed.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Total Earnings</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-950">₹{totalEarnings.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Top Performing Maid</span>
            <div className="flex items-baseline gap-2">
              {topMaid ? (
                <>
                  <span className="text-base font-black text-slate-900 truncate max-w-[120px]">{topMaid.fullName.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-amber-600">{topMaid.rating}★ ({topMaid.completedJobsCount})</span>
                </>
              ) : (
                <span className="text-sm text-slate-400">No data</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3 Analytics Trend Charts Row matching Reference Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Jobs Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Jobs Completed</h3>
            <select className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>
          <div className="h-32 flex items-end justify-between gap-1.5 pt-4 border-b border-slate-100">
            {[40, 55, 65, 80, 95, 85, 110, 130, 175].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-t-sm transition-all"
                  style={{ height: `${(val / 175) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
          </div>
        </div>

        {/* Chart 2: Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Average Rating</h3>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">4.7 ★</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-1.5 pt-4 border-b border-slate-100">
            {[3.8, 4.0, 4.1, 4.2, 4.4, 4.5, 4.6, 4.5, 4.7].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-emerald-500 rounded-t-sm transition-all"
                  style={{ height: `${((val - 3) / 2) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
          </div>
        </div>

        {/* Chart 3: Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Earnings</h3>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">₹{totalEarnings.toLocaleString()}</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-1.5 pt-4 border-b border-slate-100">
            {[20, 25, 30, 38, 42, 48, 52, 60, 75].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-indigo-600 rounded-t-sm transition-all"
                  style={{ height: `${(val / 75) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
          </div>
        </div>
      </div>

      {/* Filter Bar with Full Dropdowns matching Reference Screenshot */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="Kondapur">Kondapur</option>
            <option value="Miyapur">Miyapur</option>
            <option value="Gachibowli">Gachibowli</option>
            <option value="KPHB">KPHB</option>
          </select>

          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Services</option>
            <option value="Home Cleaning">Home Cleaning</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
          </select>

          <select
            value={selectedExperience}
            onChange={e => setSelectedExperience(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Experience</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="3-5 Years">3-5 Years</option>
            <option value="5+ Years">5+ Years</option>
          </select>

          <select
            value={selectedRating}
            onChange={e => setSelectedRating(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Ratings</option>
            <option value="4.5+">4.5★ & Above</option>
            <option value="4.0+">4.0★ & Above</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by maid name, ID or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
            />
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            className="px-4 py-2 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
        </div>
      </div>

      {/* Performance Table matching Reference Screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid ID</th>
                <th className="py-3.5 px-4">Maid Name</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Jobs Completed</th>
                <th className="py-3.5 px-4">Customers Served</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Total Earnings</th>
                <th className="py-3.5 px-4">On-Time %</th>
                <th className="py-3.5 px-4">No Show %</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((m, idx) => (
                <tr key={m.uid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{m.maidId || m.uid}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={m.photoUrl} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <strong className="text-slate-900 font-bold">{m.fullName}</strong>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{m.serviceArea}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.completedJobsCount}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.uniqueCustomersServed || Math.round(m.completedJobsCount * 0.8)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-extrabold text-slate-900">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {m.rating}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-black text-[#123D2A]">
                    ₹{(m.totalEarnings || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">98%</td>
                  <td className="py-3.5 px-4 font-bold text-rose-500">2%</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveDrawerMaid(m)}
                      className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer matching Reference Screenshot 3 */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              {/* Drawer Top Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-start gap-3.5">
                  <img src={activeDrawerMaid.photoUrl} alt={activeDrawerMaid.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{activeDrawerMaid.fullName}</h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">Top Performer</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Maid ID: {activeDrawerMaid.maidId || activeDrawerMaid.uid}</p>
                    <p className="text-xs text-slate-500 font-medium">{activeDrawerMaid.phone}</p>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {activeDrawerMaid.serviceArea}, Hyderabad
                    </p>
                    <div className="flex items-center gap-1 text-xs font-extrabold text-slate-900 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{activeDrawerMaid.rating} (98 reviews)</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setActiveDrawerMaid(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 flex items-center px-6 gap-6 text-xs font-bold text-slate-500 bg-white">
                {(['Overview', 'Jobs', 'Earnings', 'Ratings', 'History'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${
                      activeDrawerTab === tab ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-6">
                {/* Active Status Badge & Action */}
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="text-xs font-extrabold text-emerald-950 block">Active</span>
                      <span className="text-[11px] text-emerald-700 font-medium">Available for new bookings</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" /> Send Message
                  </button>
                </div>

                {activeDrawerTab === 'History' ? (
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Audit & Activity Trail</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {historyLogs.map((log: any, idx: number) => (
                        <div key={log.id || idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{log.action}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recorded'}
                            </span>
                          </div>
                          <div className="text-slate-600 text-[11px]">{log.details}</div>
                          {log.actor_name && (
                            <div className="text-[10px] text-slate-400 font-semibold">By: {log.actor_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Performance Summary Grid */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Performance Summary (This Month)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Jobs Completed</span>
                            <span className="text-xl font-black text-slate-900">{activeDrawerMaid.completedJobsCount || 0}</span>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Briefcase className="w-4.5 h-4.5" />
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Rating</span>
                            <span className="text-xl font-black text-slate-900">{activeDrawerMaid.rating || 5.0}</span>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
                            <Star className="w-4.5 h-4.5 fill-amber-500" />
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Earnings</span>
                            <span className="text-xl font-black text-emerald-950">₹{(activeDrawerMaid.earningsThisMonth || activeDrawerMaid.totalEarnings || 0).toLocaleString()}</span>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <DollarSign className="w-4.5 h-4.5" />
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-0.5">KYC Status</span>
                            <span className="text-sm font-black text-slate-900 uppercase">{activeDrawerMaid.kycStatus || 'Verified'}</span>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                            <CheckCircle2 className="w-4.5 h-4.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Service Details */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Service Details</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Services</span>
                      <strong className="text-slate-900 font-bold">Home Cleaning, Deep Cleaning</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Experience</span>
                      <strong className="text-slate-900 font-bold">4+ Years</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Languages</span>
                      <strong className="text-slate-900 font-bold">Telugu, Hindi, English</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Service Areas</span>
                      <strong className="text-slate-900 font-bold">Kondapur, Gachibowli, Madhapur</strong>
                    </div>
                  </div>
                </div>

                {/* Customer Feedback */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Customer Feedback</h4>
                  {(() => {
                    const maidRatings = (ratings || []).filter(
                      (r: any) => r.maidId === activeDrawerMaid.uid || r.maid_id === activeDrawerMaid.uid
                    );
                    if (maidRatings.length > 0) {
                      const topReview = maidRatings[0];
                      return (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold text-xs">
                                {(topReview.customerName || 'C').charAt(0)}
                              </div>
                              <strong className="text-slate-900 font-bold">{topReview.customerName || 'Verified Customer'}</strong>
                              <div className="flex items-center text-amber-500 font-bold">
                                ★ {topReview.rating || 5}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">{topReview.createdAt || 'Recent'}</span>
                          </div>
                          {topReview.comment && (
                            <p className="italic text-slate-600 font-medium">"{topReview.comment}"</p>
                          )}
                          <span className="text-emerald-700 font-extrabold text-[11px] block pt-1">
                            Total Reviews: {maidRatings.length}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-center text-slate-400">
                        <p className="font-semibold text-slate-600">No Customer Reviews Yet</p>
                        <span className="text-[11px] text-slate-400">Reviews submitted by customers will be visible here.</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Bottom Actions Row matching Screenshot 3 */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center gap-2">
                <button className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" /> Edit Profile
                </button>
                <button className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <UserCheck className="w-3.5 h-3.5 text-slate-600" /> Assign Job
                </button>
                <button className="py-2.5 px-4 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toggleMaidActiveStatus(activeDrawerMaid.uid, 'inactive');
                    setActiveDrawerMaid(null);
                  }}
                  className="py-2.5 px-4 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1"
                >
                  <UserX className="w-3.5 h-3.5" /> Deactivate
                </button>
                <button
                  onClick={() => setActiveDrawerMaid(null)}
                  className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 flex-1 shadow-sm"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


