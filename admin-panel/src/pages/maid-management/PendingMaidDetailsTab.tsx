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
  UserCheck,
  Edit2,
  Briefcase,
  Globe,
  PhoneCall,
} from 'lucide-react';

export const PendingMaidDetailsTab: React.FC = () => {
  const { maids, approveMaid, rejectMaid, requestMaidCorrection } = useAdmin();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);
  const [correctionNote, setCorrectionNote] = useState<string>('');
  const [showCorrectionPrompt, setShowCorrectionPrompt] = useState<boolean>(false);

  // Filter pending maids and maids with correction requested
  const pendingMaids = maids.filter(m => m.status === 'pending' || m.status === 'correction_requested');

  const filtered = pendingMaids.filter(m => {
    if (selectedLocation !== 'All' && !m.serviceArea.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    if (selectedLanguage !== 'All' && !(m.languagesSpoken || m.languages || []).some(l => l.toLowerCase() === selectedLanguage.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.fullName.toLowerCase().includes(q) && !m.phone.includes(q) && !(m.maidId || m.uid).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPending = pendingMaids.length;

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total Applications</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-950">{totalPending}</span>
              <span className="text-[10px] font-semibold text-emerald-700">Need Ops Review</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Verification</span>
            <span className="text-2xl font-black text-amber-950">{pendingMaids.filter(m => m.status === 'pending').length}</span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Correction Requested</span>
            <span className="text-2xl font-black text-amber-950">{pendingMaids.filter(m => m.status === 'correction_requested').length}</span>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Verified Active</span>
            <span className="text-2xl font-black text-emerald-950">{maids.filter(m => m.status === 'approved').length}</span>
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
            <option value="Karimnagar">Karimnagar</option>
            <option value="Kazipet">Kazipet</option>
            <option value="Hanamkonda">Hanamkonda</option>
            <option value="Warangal">Warangal</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Bengaluru">Bengaluru</option>
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
              placeholder="Search by partner name, phone or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Partner Details</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Services Provided</th>
                <th className="py-3.5 px-4">Languages</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(maid => (
                <tr key={maid.uid} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {maid.photoUrl ? (
                        <img
                          src={maid.photoUrl}
                          alt={maid.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-200 text-xs">
                          {maid.fullName ? maid.fullName.charAt(0).toUpperCase() : 'P'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {maid.fullName}
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {maid.maidId || 'GC-PARTNER'}
                          </span>
                          {Boolean(maid.reapplicationCount && maid.reapplicationCount > 0) && (
                            <span className="text-[9px] font-extrabold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                              Re-App #{maid.reapplicationCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{maid.serviceArea || maid.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{maid.phone}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(maid.servicesProvided && maid.servicesProvided.length > 0
                        ? maid.servicesProvided.map(s => s.serviceName)
                        : (maid.skills as string[]) || ['General Cleaning']
                      ).slice(0, 3).map((sName, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md text-[10px]">
                          {sName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {(maid.languagesSpoken || maid.languages || ['Telugu', 'English']).join(', ')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        maid.status === 'correction_requested'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {maid.status === 'correction_requested' ? 'Correction Requested' : 'Pending Verification'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveDrawerMaid(maid)}
                      className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No pending partner applications found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Side Drawer */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  {activeDrawerMaid.photoUrl ? (
                    <img
                      src={activeDrawerMaid.photoUrl}
                      alt={activeDrawerMaid.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center border-2 border-emerald-500 text-sm">
                      {activeDrawerMaid.fullName ? activeDrawerMaid.fullName.charAt(0).toUpperCase() : 'P'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                      {activeDrawerMaid.fullName}
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                        {activeDrawerMaid.status === 'correction_requested' ? 'Correction Requested' : 'Pending Verification'}
                      </span>
                      {Boolean(activeDrawerMaid.reapplicationCount && activeDrawerMaid.reapplicationCount > 0) && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                          Re-Application #{activeDrawerMaid.reapplicationCount}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Partner ID: {activeDrawerMaid.maidId || activeDrawerMaid.uid} • Applied: {activeDrawerMaid.appliedAt}
                      {activeDrawerMaid.latestAppliedAt && activeDrawerMaid.latestAppliedAt !== activeDrawerMaid.appliedAt && ` • Latest: ${activeDrawerMaid.latestAppliedAt}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveDrawerMaid(null);
                    setShowCorrectionPrompt(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                {/* 1. Personal & Contact Details */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" /> Personal & Emergency Contact
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Full Name</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.fullName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Mobile Phone</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.phone}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Email Address</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.email || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Date of Birth / Gender</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.dob || 'N/A'} ({activeDrawerMaid.gender || 'N/A'})</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Emergency Contact</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.emergencyContact || activeDrawerMaid.emergencyContactName}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Address & Operating Radius */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Address & Operating Area
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Full Address</span>
                      <strong className="text-slate-900 font-bold text-right max-w-[220px]">{activeDrawerMaid.fullAddress || activeDrawerMaid.address}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">City & Pincode</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.city} {activeDrawerMaid.pincode}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Preferred Service Area & Radius</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.serviceArea} ({activeDrawerMaid.serviceRadiusKm} km)</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Services Provided (Multi-Service Builder Display) */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" /> Services Provided & Experience
                  </h4>
                  <div className="space-y-3">
                    {(activeDrawerMaid.servicesProvided && activeDrawerMaid.servicesProvided.length > 0
                      ? activeDrawerMaid.servicesProvided
                      : (activeDrawerMaid.skills as any[]) || []
                    ).map((srv: any, idx: number) => {
                      const sName = typeof srv === 'object' ? srv.serviceName : String(srv);
                      const expYrs = typeof srv === 'object' ? srv.experienceYears || 1 : 1;
                      const expMths = typeof srv === 'object' ? srv.experienceMonths || 0 : 0;
                      const desc = typeof srv === 'object' ? srv.description : '';

                      return (
                        <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-xs">{sName || 'General Service'}</span>
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                              {expYrs} yrs {expMths > 0 ? `${expMths} mos` : ''} exp
                            </span>
                          </div>
                          {desc ? <p className="text-[11px] text-slate-600 mt-1">{desc}</p> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Languages Spoken */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" /> Languages Spoken
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(activeDrawerMaid.languagesSpoken || activeDrawerMaid.languages || ['Telugu', 'English']).map((lang, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-full text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5. Bank Payout Details */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> Bank Payout Setup
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Account Holder</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.accountName || activeDrawerMaid.fullName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Bank Name</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.bankName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Account Number</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.accountNumber}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">IFSC Code</span>
                      <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.ifscCode}</strong>
                    </div>
                    {activeDrawerMaid.bankDetails?.upiId && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">UPI ID</span>
                        <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails.upiId}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Box for Requesting Correction */}
                {showCorrectionPrompt && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                    <h5 className="text-xs font-extrabold text-amber-900">Specify Missing or Incorrect Information:</h5>
                    <textarea
                      value={correctionNote}
                      onChange={e => setCorrectionNote(e.target.value)}
                      placeholder="e.g. Please re-upload clear Aadhaar Card back photo and check bank IFSC code."
                      className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-xs outline-none focus:border-amber-500 h-20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!correctionNote.trim()) return alert('Please enter correction instructions for the partner.');
                          await requestMaidCorrection(activeDrawerMaid.uid, correctionNote);
                          setActiveDrawerMaid(null);
                          setShowCorrectionPrompt(false);
                          setCorrectionNote('');
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                      >
                        Send Correction Request
                      </button>
                      <button
                        onClick={() => setShowCorrectionPrompt(false)}
                        className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!showCorrectionPrompt && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
                <button
                  onClick={async () => {
                    await approveMaid(activeDrawerMaid.uid);
                    setActiveDrawerMaid(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserCheck className="w-4 h-4" /> Approve Partner
                </button>

                <button
                  onClick={() => setShowCorrectionPrompt(true)}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Request Correction
                </button>

                <button
                  onClick={async () => {
                    const reason = prompt('Enter rejection reason:') || 'Application criteria not met';
                    await rejectMaid(activeDrawerMaid.uid, reason);
                    setActiveDrawerMaid(null);
                  }}
                  className="py-2.5 px-3 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

