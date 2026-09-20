import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import {
  Clock,
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  Search,
  RotateCcw,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Send,
  UserX,
  Edit2
} from 'lucide-react';

export const PendingMaidDetailsTab: React.FC = () => {
  const { maids, rejectMaid, requestMaidCorrection } = useAdmin();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);

  // Filter only pending maids
  const pendingMaids = maids.filter(m => m.status === 'pending');

  const filtered = pendingMaids.filter(m => {
    if (selectedLocation !== 'All' && !m.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (selectedLanguage !== 'All' && !(m.languages || []).some(l => l.toLowerCase() === selectedLanguage.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.fullName.toLowerCase().includes(q) && !m.phone.includes(q) && !(m.maidId || m.uid).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // KPI calculations
  const totalPending = pendingMaids.length;
  const personalPending = pendingMaids.filter(m => (m.missingSections || []).includes('Personal')).length;
  const hubPending = pendingMaids.filter(m => (m.missingSections || []).includes('Hub')).length;
  const bankPending = pendingMaids.filter(m => (m.missingSections || []).includes('Bank')).length;
  const safetyPending = pendingMaids.filter(m => (m.missingSections || []).includes('Safety')).length;

  const resetFilters = () => {
    setSelectedLocation('All');
    setSelectedLanguage('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Section matching Screenshot 1 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total Pending</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-950">{totalPending}</span>
              <span className="text-[10px] font-semibold text-emerald-700">Need completion</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Personal Details</span>
            <span className="text-2xl font-black text-amber-950">{personalPending}</span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Hub Details</span>
            <span className="text-2xl font-black text-amber-950">{hubPending}</span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Bank Details</span>
            <span className="text-2xl font-black text-amber-950">{bankPending}</span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Safety Details</span>
            <span className="text-2xl font-black text-amber-950">{safetyPending}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="Bachupally">Bachupally</option>
            <option value="Kondapur">Kondapur</option>
            <option value="Gachibowli">Gachibowli</option>
            <option value="Miyapur">Miyapur</option>
            <option value="KPHB">KPHB</option>
          </select>

          <select
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Languages</option>
            <option value="Telugu">Telugu</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
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

      {/* Pending Maids Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid ID</th>
                <th className="py-3.5 px-4">Maid Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Completion</th>
                <th className="py-3.5 px-4">Missing Sections</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((maid, idx) => {
                const pct = maid.kycCompletionPct || 60;
                return (
                  <tr key={maid.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{maid.maidId || maid.uid}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={maid.photoUrl}
                          alt={maid.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <strong className="text-slate-900 font-bold">{maid.fullName}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{maid.phone}</td>
                    <td className="py-3.5 px-4 text-slate-500">{maid.appliedAt}</td>
                    <td className="py-3.5 px-4 w-36">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-slate-900 w-8">{pct}%</strong>
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(maid.missingSections || ['Bank', 'Safety']).map((sec, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{maid.serviceArea}</td>
                    <td className="py-3.5 px-4 text-slate-500">{maid.lastUpdated || maid.appliedAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveDrawerMaid(maid)}
                        className="px-3.5 py-1.5 bg-[#043927] hover:bg-[#064e3b] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No pending registrations found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen 2 Pending Review Side Drawer */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <img
                    src={activeDrawerMaid.photoUrl}
                    alt={activeDrawerMaid.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerMaid.fullName}
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                        Pending Details
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Maid ID: {activeDrawerMaid.maidId || activeDrawerMaid.uid} • Registered {activeDrawerMaid.appliedAt}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDrawerMaid(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Card */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-700">Registration Progress</span>
                  <span className="text-xs font-black text-amber-600">{activeDrawerMaid.kycCompletionPct || 60}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${activeDrawerMaid.kycCompletionPct || 60}%` }}
                  />
                </div>

                {/* Section Checklist */}
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Registration Sections</h4>
                <div className="space-y-2.5">
                  {/* Personal Details */}
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">Personal Details</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>
                  </div>

                  {/* Hub / Location Details */}
                  <div className="p-3 bg-amber-50/50 rounded-xl flex items-center justify-between border border-amber-200">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">Hub / Location Details</span>
                    </div>
                    <button className="text-[11px] font-extrabold text-sky-600 hover:underline">Fill Now</button>
                  </div>

                  {/* KYC Documents */}
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">KYC Documents</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>
                  </div>

                  {/* Bank Details */}
                  <div className="p-3 bg-amber-50/50 rounded-xl flex items-center justify-between border border-amber-200">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">Bank Details</span>
                    </div>
                    <button className="text-[11px] font-extrabold text-sky-600 hover:underline">Fill Now</button>
                  </div>

                  {/* Safety & Compliance */}
                  <div className="p-3 bg-amber-50/50 rounded-xl flex items-center justify-between border border-amber-200">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">Safety & Compliance</span>
                    </div>
                    <button className="text-[11px] font-extrabold text-sky-600 hover:underline">Fill Now</button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Basic Information</h4>
                    <button className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 font-medium">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Full Name</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.fullName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Phone Number</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.phone}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Location</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.serviceArea}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Languages</span>
                      <strong className="text-slate-900 font-bold">{(activeDrawerMaid.languages || ['Telugu', 'Hindi']).join(', ')}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Date of Birth</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.dob || '15 Mar 1998 (28 years)'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={() => {
                  requestMaidCorrection(activeDrawerMaid.uid, 'Please complete missing bank and safety details.');
                  setActiveDrawerMaid(null);
                }}
                className="flex-1 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" /> Request Details
              </button>
              <button
                onClick={() => {
                  rejectMaid(activeDrawerMaid.uid, 'Incomplete details provided.');
                  setActiveDrawerMaid(null);
                }}
                className="px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
