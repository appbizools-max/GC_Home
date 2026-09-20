import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  Wifi,
  Star,
  Search,
  RotateCcw,
  Download,
  Eye,
  MoreVertical,
  X,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export const AllMaidsTab: React.FC = () => {
  const { maids, toggleMaidActiveStatus, exportMaidsToCSV } = useAdmin();

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Maid Drawer
  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 8;

  // Filter Computation
  const filteredMaids = maids.filter(m => {
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'Approved' && m.status !== 'approved') return false;
      if (selectedStatus === 'Pending' && m.status !== 'pending') return false;
      if (selectedStatus === 'Unapproved' && m.status !== 'rejected') return false;
      if (selectedStatus === 'Active' && (!m.isOnline || m.status !== 'approved')) return false;
    }
    if (selectedLocation !== 'All' && !m.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (selectedLanguage !== 'All' && !(m.languages || []).some(l => l.toLowerCase() === selectedLanguage.toLowerCase())) return false;
    if (selectedExperience !== 'All') {
      if (selectedExperience === '1-2 Years' && !m.experience?.includes('1') && !m.experience?.includes('2')) return false;
      if (selectedExperience === '3+ Years' && !m.experience?.includes('3') && !m.experience?.includes('4') && !m.experience?.includes('5')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = m.fullName.toLowerCase().includes(q);
      const phoneMatch = m.phone.toLowerCase().includes(q);
      const idMatch = (m.maidId || m.uid).toLowerCase().includes(q);
      const locMatch = m.serviceArea.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !idMatch && !locMatch) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredMaids.length / rowsPerPage) || 1;
  const paginatedMaids = filteredMaids.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Metrics
  const totalCount = maids.length;
  const approvedCount = maids.filter(m => m.status === 'approved').length;
  const pendingCount = maids.filter(m => m.status === 'pending').length;
  const activeTodayCount = maids.filter(m => m.status === 'approved' && m.isOnline).length;
  const avgRating = (maids.reduce((sum, m) => sum + (m.rating || 0), 0) / (maids.length || 1)).toFixed(1);

  const resetFilters = () => {
    setSelectedStatus('All');
    setSelectedLocation('All');
    setSelectedLanguage('All');
    setSelectedExperience('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Total Maids</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalCount}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center">
                ↑ 15% vs last month
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Approved Maids</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{approvedCount}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {Math.round((approvedCount / (totalCount || 1)) * 100)}% of total
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Pending Approvals</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                Need review
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Active Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{activeTodayCount}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                Currently online
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Average Rating</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{avgRating}</span>
              <span className="text-[11px] font-bold text-slate-500">
                Based on 1.2k reviews
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Unapproved">Unapproved</option>
            <option value="Active">Active</option>
          </select>

          {/* Location Select */}
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Locations</option>
            <option value="Kondapur">Kondapur</option>
            <option value="Madhapur">Madhapur</option>
            <option value="Gachibowli">Gachibowli</option>
            <option value="KPHB">KPHB</option>
            <option value="Miyapur">Miyapur</option>
            <option value="Bachupally">Bachupally</option>
          </select>

          {/* Language Select */}
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

          {/* Experience Select */}
          <select
            value={selectedExperience}
            onChange={e => setSelectedExperience(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Experience</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="3+ Years">3+ Years</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search maid name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
            />
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportMaidsToCSV}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#043927] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-700" /> Export
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid Partner</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Languages</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Jobs</th>
                <th className="py-3.5 px-4">Customers</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Earnings (Month)</th>
                <th className="py-3.5 px-4">Joined On</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedMaids.map((maid, idx) => (
                <tr key={maid.uid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                    {(currentPage - 1) * rowsPerPage + idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={maid.photoUrl}
                        alt={maid.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <strong className="text-slate-900 font-bold block text-sm">{maid.fullName}</strong>
                        <span className="text-[11px] text-slate-500 font-medium">{maid.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                        maid.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : maid.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {maid.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{maid.serviceArea}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">
                    {(maid.languages || ['Telugu', 'Hindi']).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{maid.experience || '3+ Years'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{maid.completedJobsCount}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{maid.uniqueCustomersServed || Math.round(maid.completedJobsCount * 0.85)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-extrabold text-slate-900">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {maid.rating}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ₹{(maid.earningsThisMonth || 25600).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{maid.appliedAt}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveDrawerMaid(maid)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedMaids.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No maid partners found matching filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredMaids.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredMaids.length)} of {filteredMaids.length} maids
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-[#043927] text-white text-xs font-black rounded-lg">
              {currentPage}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Maid Overview Side Drawer (Screen 1 Drawer) */}
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
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerMaid.fullName}
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                        {activeDrawerMaid.maidId || activeDrawerMaid.uid}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {activeDrawerMaid.serviceArea}
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

              {/* Quick Overview Metrics Grid */}
              <div className="p-6 border-b border-slate-100">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-semibold text-emerald-800 block">Total Jobs</span>
                    <span className="text-lg font-black text-emerald-950">{activeDrawerMaid.completedJobsCount}</span>
                  </div>
                  <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
                    <span className="text-[11px] font-semibold text-sky-800 block">Customers Served</span>
                    <span className="text-lg font-black text-sky-950">{activeDrawerMaid.uniqueCustomersServed || 42}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[11px] font-semibold text-emerald-800 block">Total Earnings</span>
                    <span className="text-lg font-black text-emerald-950">₹{(activeDrawerMaid.totalEarnings || 25600).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <span className="text-[11px] font-semibold text-amber-800 block">Rating</span>
                    <span className="text-lg font-black text-amber-950 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {activeDrawerMaid.rating}
                    </span>
                  </div>
                </div>

                {/* Personal Information */}
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Phone Number</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.phone}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Emergency Contact</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.emergencyContact}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Languages</span>
                    <strong className="text-slate-900 font-bold">{(activeDrawerMaid.languages || ['Telugu', 'Hindi']).join(', ')}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Experience</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.experience || '4+ Years'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Registration Date</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.appliedAt}</strong>
                  </div>
                </div>

                {/* Verified Documents */}
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-6 mb-3">Verified Documents</h4>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Aadhaar Card
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> PAN Card
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Police Verification
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={() => {
                  toggleMaidActiveStatus(
                    activeDrawerMaid.uid,
                    activeDrawerMaid.status === 'approved' ? 'rejected' : 'approved'
                  );
                  setActiveDrawerMaid(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeDrawerMaid.status === 'approved'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-md'
                }`}
              >
                {activeDrawerMaid.status === 'approved' ? 'Deactivate Maid' : 'Activate Maid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
