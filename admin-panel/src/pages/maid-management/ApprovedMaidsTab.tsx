import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { PaginationControls } from '../../components/PaginationControls';
import { exportMaidsToCSV as triggerExportMaids } from '../../utils/exportUtils';
import {
  CheckCircle2,
  Star,
  Search,
  RotateCcw,
  Download,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  ShieldCheck,
  DollarSign,
  Clock,
  UserCheck,
  Power,
  MessageSquare,
  ChevronDown,
  Edit,
  ArrowLeft
} from 'lucide-react';

export const ApprovedMaidsTab: React.FC = () => {
  const { maids, toggleMaidActiveStatus, exportMaidsToCSV } = useAdmin();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Maid Profile Modal/Drawer
  const [selectedProfileMaid, setSelectedProfileMaid] = useState<MaidProfile | null>(null);

  // Active Tab inside Maid Profile View
  const [profileTab, setProfileTab] = useState<string>('overview');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const approvedMaids = maids.filter(m => m.status === 'approved');

  const filtered = approvedMaids.filter(m => {
    if (selectedLocation !== 'All' && !(m.serviceArea || '').toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (selectedLanguage !== 'All' && !(m.languages || []).some(l => l.toLowerCase() === selectedLanguage.toLowerCase())) return false;
    if (selectedExperience !== 'All') {
      if (selectedExperience === '1-2 Years' && !m.experience?.includes('1') && !m.experience?.includes('2')) return false;
      if (selectedExperience === '3+ Years' && !m.experience?.includes('3') && !m.experience?.includes('4') && !m.experience?.includes('5')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!(m.fullName || '').toLowerCase().includes(q) && !(m.phone || '').includes(q) && !((m.maidId || m.uid) || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paginatedMaids = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // KPI Calculations
  const totalApproved = approvedMaids.length;
  const activeToday = approvedMaids.filter(m => m.isOnline).length;
  const totalJobsCompleted = approvedMaids.reduce((sum, m) => sum + (m.completedJobsCount || 0), 0);
  const totalCustomersServed = approvedMaids.reduce((sum, m) => sum + (m.uniqueCustomersServed || 30), 0);
  const avgRating = (approvedMaids.reduce((sum, m) => sum + (m.rating || 0), 0) / (approvedMaids.length || 1)).toFixed(1);

  const resetFilters = () => {
    setSelectedLocation('All');
    setSelectedLanguage('All');
    setSelectedExperience('All');
    setSearchQuery('');
  };

  const activeMaidToDisplay = selectedProfileMaid || approvedMaids.find(m => m.maidId === 'MD001') || approvedMaids[0];

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* KPI Cards matching Screenshot 3 & 4 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Approved Maids</span>
            <span className="text-2xl font-black text-slate-900">{totalApproved}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Active Today</span>
            <span className="text-2xl font-black text-slate-900">{activeToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Jobs Completed</span>
            <span className="text-2xl font-black text-slate-900">{totalJobsCompleted.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Customers Served</span>
            <span className="text-2xl font-black text-slate-900">{totalCustomersServed.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Average Rating</span>
            <span className="text-2xl font-black text-slate-900 flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" /> {avgRating}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Star className="w-5 h-5" />
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
            <option value="Kondapur">Kondapur</option>
            <option value="Madhapur">Madhapur</option>
            <option value="Gachibowli">Gachibowli</option>
            <option value="KPHB">KPHB</option>
            <option value="Miyapur">Miyapur</option>
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

          <select
            value={selectedExperience}
            onChange={e => setSelectedExperience(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Experience</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="3+ Years">3+ Years</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search maid name, phone or ID..."
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

        <button
          onClick={exportMaidsToCSV}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-700" /> Export CSV
        </button>
      </div>

      {/* Main Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid ID</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Jobs</th>
                <th className="py-3.5 px-4">Unique Customers</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Earnings</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedMaids.map((m, idx) => (
                <tr key={m.uid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{m.maidId || m.uid}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={m.photoUrl} alt={m.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <strong className="text-slate-900 font-bold">{m.fullName}</strong>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{m.phone}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{m.serviceArea}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{m.experience || '3+ Years'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.completedJobsCount}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.uniqueCustomersServed || Math.round(m.completedJobsCount * 0.8)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-extrabold text-slate-900">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {m.rating}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ₹{(m.totalEarnings || m.earningsThisMonth || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{m.appliedAt}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                      m.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.isOnline ? 'Available' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedProfileMaid(m)}
                      className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No approved maid partners found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Screen 4 Full Maid Profile Modal / Drawer View matching Screenshot 3 */}
      {selectedProfileMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Banner */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedProfileMaid(null)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <img
                  src={selectedProfileMaid.photoUrl}
                  alt={selectedProfileMaid.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{selectedProfileMaid.fullName}</h2>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Maid ID: {selectedProfileMaid.maidId || selectedProfileMaid.uid} • ★ {selectedProfileMaid.rating} ({selectedProfileMaid.totalRatingsCount || 98} reviews)
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedProfileMaid.phone}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedProfileMaid.serviceArea}</span>
                  </div>
                </div>
              </div>

              {/* Action Header Buttons */}
              <div className="flex items-center gap-2">
                <button className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button className="px-4 py-2 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm">
                  <MessageSquare className="w-3.5 h-3.5" /> Contact
                </button>
                <button
                  onClick={() => setSelectedProfileMaid(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Sub-tabs Bar matching Screenshot 3 */}
            <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'personal', label: 'Personal Details' },
                { id: 'kyc', label: 'KYC Documents' },
                { id: 'bank', label: 'Bank Details' },
                { id: 'safety', label: 'Safety & Compliance' },
                { id: 'jobs', label: 'Jobs' },
                { id: 'customers', label: 'Customers' },
                { id: 'earnings', label: 'Earnings' },
                { id: 'reviews', label: 'Reviews' },
                { id: 'history', label: 'History' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setProfileTab(t.id)}
                  className={`py-3.5 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    profileTab === t.id
                      ? 'border-emerald-700 text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Profile Content Area */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/60">
              {profileTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left & Middle (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* 6 Overview Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-semibold text-slate-400 block">Total Jobs Completed</span>
                        <span className="text-xl font-black text-slate-900 mt-1 block">{selectedProfileMaid.completedJobsCount}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-semibold text-slate-400 block">Active Customers</span>
                        <span className="text-xl font-black text-slate-900 mt-1 block">{selectedProfileMaid.uniqueCustomersServed || 0}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-semibold text-slate-400 block">Total Earnings</span>
                        <span className="text-xl font-black text-emerald-800 mt-1 block">₹{(selectedProfileMaid.totalEarnings || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-semibold text-slate-400 block">On-Time Rate</span>
                        <span className="text-xl font-black text-emerald-800 mt-1 block">96%</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-semibold text-slate-400 block">Customer Rating</span>
                        <span className="text-xl font-black text-amber-600 mt-1 flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {selectedProfileMaid.rating}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-semibold text-slate-400 block">Last Active</span>
                        <span className="text-xs font-bold text-slate-800 mt-2 block">{selectedProfileMaid.lastActive || '5 minutes ago'}</span>
                      </div>
                    </div>

                    {/* Services Information */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Service Information</h3>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block mb-1">Services Offered</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedProfileMaid.skills || ['Home Cleaning', 'Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning', 'Sofa Cleaning']).map((s, i) => (
                              <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 font-semibold block mb-1">Service Areas</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedProfileMaid.preferredAreas || ['Kondapur', 'Gachibowli', 'Madhapur', 'Hitech City']).map((a, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Jobs Table */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Recent Jobs</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-bold">
                              <th className="py-2">Date</th>
                              <th className="py-2">Service</th>
                              <th className="py-2">Customer</th>
                              <th className="py-2">Status</th>
                              <th className="py-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            <tr>
                              <td className="py-2.5">16 Sep 2026</td>
                              <td className="py-2.5 font-bold text-slate-900">Home Cleaning</td>
                              <td className="py-2.5">Priya Sharma</td>
                              <td className="py-2.5"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Completed</span></td>
                              <td className="py-2.5 text-right font-bold text-slate-900">₹1,200</td>
                            </tr>
                            <tr>
                              <td className="py-2.5">14 Sep 2026</td>
                              <td className="py-2.5 font-bold text-slate-900">Deep Cleaning</td>
                              <td className="py-2.5">Ravi Kumar</td>
                              <td className="py-2.5"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Completed</span></td>
                              <td className="py-2.5 text-right font-bold text-slate-900">₹1,800</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Account Status Card (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">Account Status</h3>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-4">
                        <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> Active
                        </span>
                        <p className="text-[11px] text-emerald-900 font-medium mt-1">This maid partner is active and can receive new bookings.</p>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => toggleMaidActiveStatus(selectedProfileMaid.uid, 'rejected')}
                          className="w-full py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Deactivate
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                            Approve
                          </button>
                          <button className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                            Reject
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-6 mb-3">Quick Info</h4>
                      <div className="space-y-2 text-xs text-slate-700 font-medium">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Maid ID</span>
                          <strong className="text-slate-900 font-bold">{selectedProfileMaid.maidId || selectedProfileMaid.uid}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">KYC Status</span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Police Verification</span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Bank Account</span>
                          <strong className="text-slate-900 font-bold">Linked (HDFC)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

