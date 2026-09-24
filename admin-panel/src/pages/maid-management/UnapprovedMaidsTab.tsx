import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import {
  UserX,
  ShieldAlert,
  FileX,
  AlertTriangle,
  RotateCcw,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Send,
  X,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Plus,
  Edit2,
  AlertCircle
} from 'lucide-react';

export const UnapprovedMaidsTab: React.FC = () => {
  const { maids, approveMaid, rejectMaid, requestMaidCorrection } = useAdmin();

  const [selectedReason, setSelectedReason] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeDrawerMaid, setActiveDrawerMaid] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<string>('overview');

  const unapprovedMaids = maids.filter(m => m.status === 'rejected');

  const unapprovedMaidsList = unapprovedMaids.map(m => ({
    id: m.maidId || m.uid,
    name: m.fullName,
    phone: m.phone,
    submitted: m.appliedAt || 'Recently',
    reason: m.rejectionReason || 'Application Rejected',
    rejectedBy: m.rejectedBy || 'Admin',
    rejectedDate: m.rejectedAt || m.appliedAt || 'Recently',
    status: 'Rejected',
    photo: m.photoUrl,
    location: m.serviceArea,
    exp: m.experience || '1+ Years',
    lang: (m.languages || ['Telugu']).join(', '),
    dob: m.dob || 'N/A'
  }));

  const filtered = unapprovedMaidsList.filter(m => {
    if (selectedReason !== 'All' && !m.reason.toLowerCase().includes(selectedReason.toLowerCase())) return false;
    if (selectedLocation !== 'All' && !m.location.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !m.phone.includes(q) && !m.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalUnapproved = unapprovedMaids.length;
  const kycRejected = unapprovedMaids.filter(m => (m.rejectionReason || '').toLowerCase().includes('doc') || (m.rejectionReason || '').toLowerCase().includes('kyc')).length;
  const detailsRejected = unapprovedMaids.filter(m => (m.rejectionReason || '').toLowerCase().includes('detail') || (m.rejectionReason || '').toLowerCase().includes('address')).length;
  const awaitingCorrection = unapprovedMaids.filter(m => m.kycStatus === 'incomplete' || (m.rejectionReason || '').toLowerCase().includes('correct')).length;
  const otherReasons = Math.max(0, totalUnapproved - kycRejected - detailsRejected);

  const resetFilters = () => {
    setSelectedReason('All');
    setSelectedLocation('All');
    setSelectedDateRange('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 5 KPI Cards matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-rose-50/60 p-4.5 rounded-2xl border border-rose-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1">Total Unapproved</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-950">{totalUnapproved}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">KYC Rejected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{kycRejected}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Details Rejected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{detailsRejected}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Correction Req.</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{awaitingCorrection}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Other Reasons</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{otherReasons}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar matching Screenshot 4 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">Rejection Reason</option>
            <option value="Invalid">Invalid Documents</option>
            <option value="Incomplete">Incomplete Details</option>
            <option value="Police">Police Verification Pending</option>
          </select>

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

      {/* Main Table matching Screenshot 4 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid ID</th>
                <th className="py-3.5 px-4">Maid Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Rejection Reason</th>
                <th className="py-3.5 px-4">Rejected By</th>
                <th className="py-3.5 px-4">Rejected Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{m.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={m.photo} alt={m.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <strong className="text-slate-900 font-bold">{m.name}</strong>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{m.phone}</td>
                  <td className="py-3.5 px-4 text-slate-500">{m.submitted}</td>
                  <td className="py-3.5 px-4 font-semibold text-rose-700">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">
                      {m.reason}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{m.rejectedBy}</td>
                  <td className="py-3.5 px-4 text-slate-500">{m.rejectedDate}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                      m.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.status}
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No unapproved maid applications found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen 4 Drawer matching Screenshot 4 */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <img src={activeDrawerMaid.photo} alt={activeDrawerMaid.name} className="w-12 h-12 rounded-full object-cover border-2 border-rose-500" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      {activeDrawerMaid.name}
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">Rejected</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Maid ID: {activeDrawerMaid.id} • Submitted on {activeDrawerMaid.submitted}</p>
                  </div>
                </div>

                <button onClick={() => setActiveDrawerMaid(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="px-6 border-b border-slate-200 flex items-center gap-4 text-xs font-bold text-slate-500">
                <button onClick={() => setDrawerTab('overview')} className={`py-3 border-b-2 ${drawerTab === 'overview' ? 'border-emerald-700 text-emerald-800' : 'border-transparent'}`}>Overview</button>
                <button onClick={() => setDrawerTab('documents')} className={`py-3 border-b-2 ${drawerTab === 'documents' ? 'border-emerald-700 text-emerald-800' : 'border-transparent'}`}>Documents</button>
                <button onClick={() => setDrawerTab('notes')} className={`py-3 border-b-2 ${drawerTab === 'notes' ? 'border-emerald-700 text-emerald-800' : 'border-transparent'}`}>Notes</button>
                <button onClick={() => setDrawerTab('history')} className={`py-3 border-b-2 ${drawerTab === 'history' ? 'border-emerald-700 text-emerald-800' : 'border-transparent'}`}>History</button>
              </div>

              <div className="p-6">
                {/* Rejection Details Banner matching Screenshot 4 */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-6">
                  <span className="text-xs font-black text-rose-900 uppercase tracking-wider block mb-1">Application Rejected</span>
                  <p className="text-xs text-rose-800 font-medium">This application was rejected due to invalid documents.</p>

                  <div className="space-y-1 text-xs text-slate-700 font-medium mt-3 pt-3 border-t border-rose-200/80">
                    <p className="flex justify-between"><span className="text-slate-500">Rejection Reason</span> <strong className="text-slate-900">{activeDrawerMaid.reason}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-500">Rejected By</span> <strong className="text-slate-900">{activeDrawerMaid.rejectedBy}</strong></p>
                    <p className="flex justify-between"><span className="text-slate-500">Rejected Date</span> <strong className="text-slate-900">{activeDrawerMaid.rejectedDate}</strong></p>
                    <div className="pt-2">
                      <span className="text-slate-500 block mb-0.5">Rejection Notes</span>
                      <p className="text-slate-900 bg-white p-2 rounded-lg border border-rose-200 text-[11px] font-semibold">
                        Aadhaar document is not valid. Please upload a clear and valid document.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submitted Information */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Submitted Information</h4>
                  <button className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Full Name</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Phone Number</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.phone}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Location</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.location}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Experience</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.exp}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Languages</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.lang}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Date of Birth</span>
                    <strong className="text-slate-900 font-bold">{activeDrawerMaid.dob}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions matching Screenshot 4 */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                onClick={() => {
                  requestMaidCorrection('maid_001', 'Please upload a clear Aadhaar card.');
                  setActiveDrawerMaid(null);
                }}
                className="flex-1 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" /> Request Update
              </button>

              <button
                onClick={() => {
                  approveMaid('maid_001');
                  setActiveDrawerMaid(null);
                }}
                className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-review
              </button>

              <button
                onClick={() => {
                  alert(`Application ${activeDrawerMaid.id} deleted.`);
                  setActiveDrawerMaid(null);
                }}
                className="py-2.5 px-3 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

