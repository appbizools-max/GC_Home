import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import {
  Wifi,
  Clock,
  CheckCircle2,
  Star,
  Search,
  RotateCcw,
  Eye,
  X,
  MapPin,
  Phone,
  Briefcase,
  Users,
  DollarSign,
  Send,
  Navigation,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const ActiveMaidsTab: React.FC = () => {
  const { maids, toggleMaidOnlineStatus } = useAdmin();

  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);

  const activeRoster = maids.filter(m => m.status === 'approved');

  const filtered = activeRoster.filter(m => {
    if (selectedAvailability !== 'All') {
      if (selectedAvailability === 'Online' && !m.isOnline) return false;
      if (selectedAvailability === 'Busy' && m.currentStatus !== 'busy') return false;
      if (selectedAvailability === 'Available' && (m.currentStatus !== 'available' && !m.isOnline)) return false;
    }
    if (selectedLocation !== 'All' && !m.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.fullName.toLowerCase().includes(q) && !m.phone.includes(q) && !(m.maidId || m.uid).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalActive = activeRoster.length;
  const onlineCount = activeRoster.filter(m => m.isOnline).length;
  const busyCount = activeRoster.filter(m => m.currentStatus === 'busy').length;
  const availableCount = activeRoster.filter(m => m.currentStatus === 'available' || (m.isOnline && m.currentStatus !== 'busy')).length;
  const jobsTodayCount = 124;

  const resetFilters = () => {
    setSelectedAvailability('All');
    setSelectedLocation('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 5 KPI Cards matching Screenshot 5 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#043927] text-white p-4.5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block mb-1">Active Maids</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{totalActive}</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-800/80 px-1.5 py-0.5 rounded-md">↑ 18% vs last month</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-800/60 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-emerald-300" />
          </div>
        </div>

        <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">Online Now</span>
            <span className="text-2xl font-black text-emerald-950">{onlineCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-amber-50/60 p-4.5 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">Busy</span>
            <span className="text-2xl font-black text-amber-950">{busyCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-sky-50/60 p-4.5 rounded-2xl border border-sky-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">Available</span>
            <span className="text-2xl font-black text-sky-950">{availableCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Jobs Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{jobsTodayCount}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">↑ 22% vs yesterday</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedAvailability}
            onChange={e => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Availability</option>
            <option value="Online">Online Now</option>
            <option value="Busy">Busy</option>
            <option value="Available">Available</option>
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="Kondapur">Kondapur</option>
            <option value="Miyapur">Miyapur</option>
            <option value="Bachupally">Bachupally</option>
            <option value="Gachibowli">Gachibowli</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by maid name, phone or ID..."
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
        </div>
      </div>

      {/* Main Active Maids Table matching Screenshot 5 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid ID</th>
                <th className="py-3.5 px-4">Maid Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Services</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Jobs Today</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((m, idx) => {
                const statusBadge = m.currentStatus === 'busy'
                  ? { bg: 'bg-amber-100 text-amber-800', label: 'Busy' }
                  : m.currentStatus === 'available' || m.isOnline
                  ? { bg: 'bg-emerald-100 text-emerald-800', label: 'Online' }
                  : { bg: 'bg-slate-100 text-slate-600', label: 'Offline' };

                return (
                  <tr key={m.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{m.maidId || m.uid}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={m.photoUrl} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        <strong className="text-slate-900 font-bold">{m.fullName}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{m.phone}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{m.serviceArea}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(m.skills || ['Home', 'Office']).slice(0, 2).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{Math.floor(Math.random() * 4) + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-extrabold text-slate-900">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {m.rating}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{m.lastActive || 'Just now'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveDrawerMaid(m)}
                        className="px-3.5 py-1.5 bg-[#043927] hover:bg-[#064e3b] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen 5 Active Maid Side Drawer matching Screenshot 5 */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <img src={activeDrawerMaid.photoUrl} alt={activeDrawerMaid.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerMaid.fullName}
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">Active</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Maid ID: {activeDrawerMaid.maidId || activeDrawerMaid.uid}</p>
                  </div>
                </div>

                <button onClick={() => setActiveDrawerMaid(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6">
                {/* Current Job Live Card matching Screenshot 5 */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Current Job</span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-extrabold text-[10px]">In Progress</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Booking ID</span>
                      <strong className="text-slate-900">BK250916001</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Customer</span>
                      <strong className="text-slate-900">Priya Sharma</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Location</span>
                      <strong className="text-slate-900">Kondapur, Hyderabad</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Service</span>
                      <strong className="text-slate-900">Home Cleaning (2 BHK)</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Started At</span>
                      <strong className="text-slate-900">10:00 AM, 16 Sep 2026</strong>
                    </p>
                  </div>

                  <button className="w-full mt-3 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm">
                    <Navigation className="w-3.5 h-3.5" /> View on Map
                  </button>
                </div>

                {/* Quick Stats Grid */}
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block">Total Jobs</span>
                    <span className="text-lg font-black text-slate-900">{activeDrawerMaid.completedJobsCount}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block">Total Earnings</span>
                    <span className="text-lg font-black text-emerald-800">₹{(activeDrawerMaid.totalEarnings || 56200).toLocaleString()}</span>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Available for new bookings</span>
                    <span className="text-[11px] text-slate-500 font-medium">Toggle maid online status</span>
                  </div>
                  <button
                    onClick={() => toggleMaidOnlineStatus(activeDrawerMaid.uid, !activeDrawerMaid.isOnline)}
                    className="cursor-pointer"
                  >
                    {activeDrawerMaid.isOnline ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={() => setActiveDrawerMaid(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                View Full Profile
              </button>
              <button className="flex-1 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
                Assign Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
