import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import {
  UserX,
  Calendar,
  Power,
  AlertTriangle,
  RotateCcw,
  Search,
  Eye,
  X,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  UserCheck,
  Edit2,
  AlertCircle
} from 'lucide-react';

export const InactiveMaidsTab: React.FC = () => {
  const { maids, toggleMaidActiveStatus } = useAdmin();

  const [selectedReason, setSelectedReason] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);

  // Seed / filter inactive maids
  const inactiveMaids = maids.filter(m => m.status === 'rejected' || m.status === 'none' || !m.isOnline || (m.rejectionReason && m.rejectionReason.length > 0));

  const filtered = inactiveMaids.filter(m => {
    if (selectedLocation !== 'All' && !m.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.fullName.toLowerCase().includes(q) && !m.phone.includes(q) && !(m.maidId || m.uid).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalInactive = inactiveMaids.length;
  const onLeaveCount = inactiveMaids.filter(m => m.adminNotes?.toLowerCase().includes('leave')).length;
  const deactivatedCount = inactiveMaids.filter(m => m.status === 'rejected').length;
  const notRespondingCount = inactiveMaids.filter(m => !m.isOnline && m.status === 'approved').length;

  const resetFilters = () => {
    setSelectedReason('All');
    setSelectedLocation('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 4 KPI Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-rose-50/60 p-4.5 rounded-2xl border border-rose-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1">Total Inactive Maids</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-950">{totalInactive}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">On Leave</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{onLeaveCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Deactivated</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{deactivatedCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Power className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Not Responding</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{notRespondingCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Inactive Reasons</option>
            <option value="Leave">On Leave</option>
            <option value="Not Responding">Not Responding</option>
            <option value="Deactivated">Deactivated</option>
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

      {/* Main Table matching Screenshot 2 */}
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
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4">Inactive Reason</th>
                <th className="py-3.5 px-4">Inactive Since</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No inactive maid partners found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m, idx) => (
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
                    <td className="py-3.5 px-4 text-slate-500">{m.lastActive || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{m.rejectionReason || m.adminNotes || 'Inactive'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{m.lastUpdated || m.appliedAt || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        m.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {m.status === 'rejected' ? 'Deactivated' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveDrawerMaid(m)}
                        className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen 2 Drawer matching Screenshot 2 */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <img src={activeDrawerMaid.photoUrl} alt={activeDrawerMaid.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerMaid.fullName}
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">On Leave</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Maid ID: {activeDrawerMaid.maidId || 'MD004'}</p>
                  </div>
                </div>

                <button onClick={() => setActiveDrawerMaid(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider block mb-1">Currently On Leave</span>
                  <p className="text-xs text-amber-800 font-medium">This maid is on leave from 12 Aug 2026</p>
                </div>

                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Inactive Details</h4>
                <div className="space-y-2 text-xs text-slate-700 font-medium mb-6">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Inactive Reason</span>
                    <strong className="text-slate-900 font-bold">On Leave</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Since</span>
                    <strong className="text-slate-900 font-bold">12 Aug 2026</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Expected Return</span>
                    <strong className="text-slate-900 font-bold">30 Sep 2026</strong>
                  </div>
                </div>

                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      toggleMaidActiveStatus(activeDrawerMaid.uid, 'approved');
                      setActiveDrawerMaid(null);
                    }}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Mark as Active
                  </button>
                  <button
                    onClick={() => {
                      toggleMaidActiveStatus(activeDrawerMaid.uid, 'rejected');
                      setActiveDrawerMaid(null);
                    }}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Deactivate Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

