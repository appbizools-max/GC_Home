import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MaidProfile } from '../../types';
import { DocumentLightboxModal } from '../../components/DocumentLightboxModal';
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
  ChevronDown,
  ChevronUp,
  Maximize2,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const PendingMaidDetailsTab: React.FC = () => {
  const { maids, approveMaid, rejectMaid, requestMaidCorrection, updateItemVerification } = useAdmin();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDrawerMaid, setActiveDrawerMaid] = useState<MaidProfile | null>(null);
  const [correctionNote, setCorrectionNote] = useState<string>('');
  const [showCorrectionPrompt, setShowCorrectionPrompt] = useState<boolean>(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string>('');
  const [lightboxItemPath, setLightboxItemPath] = useState<string>('');
  const [lightboxCurrentStatus, setLightboxCurrentStatus] = useState<string>('pending');
  const [lightboxRejectionReason, setLightboxRejectionReason] = useState<string | null>(null);

  // Collapsible Step Sections State
  const [expandedSteps, setExpandedSteps] = useState<{ [key: number]: boolean }>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  const toggleStep = (stepNum: number) => {
    setExpandedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  // Filter pending maids and maids with correction requested
  const pendingMaids = maids.filter(m => m.status === 'pending' || m.status === 'correction_requested');

  const filtered = pendingMaids.filter(m => {
    if (selectedLocation !== 'All') {
      const loc = selectedLocation.toLowerCase();
      const areaMatch = (m.serviceArea || '').toLowerCase().includes(loc);
      const cityMatch = (m.city || '').toLowerCase().includes(loc);
      const addrMatch = (m.fullAddress || m.address || '').toLowerCase().includes(loc);
      if (!areaMatch && !cityMatch && !addrMatch) return false;
    }
    if (
      selectedLanguage !== 'All' &&
      !(m.languagesSpoken || m.languages || []).some(l => l.toLowerCase() === selectedLanguage.toLowerCase())
    )
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!m.fullName.toLowerCase().includes(q) && !m.phone.includes(q) && !(m.maidId || m.uid).toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const totalPending = pendingMaids.length;

  // Compute Verification Statuses for Active Drawer Maid
  const ver = activeDrawerMaid?.verificationStatus || {};
  const step1Ver = ver.step1_personal?.status || 'pending';
  const step2Ver = ver.step2_address?.status || 'pending';
  const step3Ver = ver.step3_services?.status || 'pending';
  const step4Ver = ver.step4_documents?.status || 'pending';
  const step5Ver = ver.step5_bank?.status || 'pending';
  const photoVer = ver.profile_photo?.status || (activeDrawerMaid?.photoUrl ? 'pending' : 'reupload_required');

  const docs = ver.documents || {};
  const aadhaarFrontVer = docs.aadhaar_front?.status || 'pending';
  const aadhaarBackVer = docs.aadhaar_back?.status || 'pending';
  const panCardVer = docs.pan_card?.status || 'pending';

  // Compute Verification Progress
  const verifiedStepsCount = [step1Ver, step2Ver, step3Ver, step4Ver, step5Ver].filter(s => s === 'verified').length;
  const verifiedDocsCount = [aadhaarFrontVer, aadhaarBackVer, panCardVer].filter(s => s === 'verified').length;

  // Strict Approval Guard Rule: ALL 5 steps + Photo + Mandatory Docs must be VERIFIED
  const canApprove =
    verifiedStepsCount === 5 &&
    photoVer === 'verified' &&
    aadhaarFrontVer === 'verified' &&
    aadhaarBackVer === 'verified' &&
    panCardVer === 'verified';

  // Open Document Lightbox
  const openLightbox = (title: string, url: string, itemPath: string, currentSt: string, reason?: string | null) => {
    setLightboxTitle(title);
    setLightboxUrl(url);
    setLightboxItemPath(itemPath);
    setLightboxCurrentStatus(currentSt);
    setLightboxRejectionReason(reason || null);
    setLightboxOpen(true);
  };

  const handleLightboxAccept = async () => {
    if (!activeDrawerMaid || !lightboxItemPath) return;
    await updateItemVerification(activeDrawerMaid.uid, lightboxItemPath, 'verified');
  };

  const handleLightboxReject = async (reason: string) => {
    if (!activeDrawerMaid || !lightboxItemPath) return;
    await updateItemVerification(activeDrawerMaid.uid, lightboxItemPath, 'reupload_required', reason);
  };

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
                      )
                        .slice(0, 3)
                        .map((sName, i) => (
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
                      Review Application
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

      {/* 5-Step Application Review Side Drawer */}
      {activeDrawerMaid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              {/* Drawer Top Header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  {activeDrawerMaid.photoUrl ? (
                    <img
                      src={activeDrawerMaid.photoUrl}
                      alt={activeDrawerMaid.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center border-2 border-emerald-400 text-sm">
                      {activeDrawerMaid.fullName ? activeDrawerMaid.fullName.charAt(0).toUpperCase() : 'P'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                      {activeDrawerMaid.fullName}
                      <span className="text-[10px] bg-amber-400/20 border border-amber-400/30 text-amber-300 font-extrabold px-2 py-0.5 rounded-full">
                        {activeDrawerMaid.status === 'correction_requested' ? 'Correction Requested' : 'Under Review'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Partner ID: {activeDrawerMaid.maidId || activeDrawerMaid.uid} • Submitted:{' '}
                      {activeDrawerMaid.submittedAt || activeDrawerMaid.appliedAt}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveDrawerMaid(null);
                    setShowCorrectionPrompt(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Header Verification Progress Bar */}
              <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>
                    Steps Verified:{' '}
                    <strong className={verifiedStepsCount === 5 ? 'text-emerald-400' : 'text-amber-400'}>
                      {verifiedStepsCount} / 5
                    </strong>
                  </span>
                  <span>
                    Docs Verified:{' '}
                    <strong className={verifiedDocsCount === 3 ? 'text-emerald-400' : 'text-amber-400'}>
                      {verifiedDocsCount} / 3
                    </strong>
                  </span>
                  <span>
                    Photo:{' '}
                    <strong className={photoVer === 'verified' ? 'text-emerald-400' : 'text-amber-400'}>
                      {photoVer.toUpperCase()}
                    </strong>
                  </span>
                </div>
                <div>
                  {canApprove ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold rounded-md text-[10px]">
                      READY TO APPROVE ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold rounded-md text-[10px]">
                      VERIFICATION INCOMPLETE
                    </span>
                  )}
                </div>
              </div>

              {/* Drawer 5-Step Body */}
              <div className="p-6 space-y-4">
                {/* ─────────────────────────────────────────────────────────────
                    STEP 1: PERSONAL DETAILS & PROFILE PHOTO
                ───────────────────────────────────────────────────────────── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div
                    onClick={() => toggleStep(1)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-all border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">Step 1</div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Personal Details & Photo</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          step1Ver === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step1Ver === 'reupload_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step1Ver}
                      </span>
                      {expandedSteps[1] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {expandedSteps[1] && (
                    <div className="p-4 space-y-4 text-xs text-slate-700">
                      {/* Profile Photo Sub-Section */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {activeDrawerMaid.photoUrl ? (
                            <img
                              src={activeDrawerMaid.photoUrl}
                              alt="Profile Submission"
                              className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs">
                              No Photo
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900">Submitted Profile Photo</div>
                            <div className="text-[11px] text-slate-500">
                              Status:{' '}
                              <strong
                                className={
                                  photoVer === 'verified'
                                    ? 'text-emerald-700'
                                    : photoVer === 'reupload_required'
                                    ? 'text-amber-700'
                                    : 'text-sky-700'
                                }
                              >
                                {photoVer.toUpperCase()}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {activeDrawerMaid.photoUrl && (
                            <button
                              onClick={() =>
                                openLightbox(
                                  'Profile Photo Submission',
                                  activeDrawerMaid.photoUrl,
                                  'profile_photo',
                                  photoVer,
                                  ver.profile_photo?.rejectionReason
                                )
                              }
                              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Inspect Full Image"
                            >
                              <Maximize2 className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                          <button
                            onClick={() => updateItemVerification(activeDrawerMaid.uid, 'profile_photo', 'verified')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Accept Photo
                          </button>
                          <button
                            onClick={() => {
                              const r = prompt('Reason for photo re-upload:', 'Photo is blurry or unreadable');
                              if (r) updateItemVerification(activeDrawerMaid.uid, 'profile_photo', 'reupload_required', r);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Request Re-upload
                          </button>
                        </div>
                      </div>

                      {/* Submitted Fields */}
                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Full Name</span>
                          <strong className="text-slate-900 font-bold">{activeDrawerMaid.fullName}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Mobile Phone</span>
                          <strong className="text-slate-900 font-bold">{activeDrawerMaid.phone}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Email Address</span>
                          <strong className="text-slate-900 font-bold">{activeDrawerMaid.email || 'N/A'}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Date of Birth / Gender</span>
                          <strong className="text-slate-900 font-bold">
                            {activeDrawerMaid.dob || 'N/A'} ({activeDrawerMaid.gender || 'N/A'})
                          </strong>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Emergency Contact</span>
                          <strong className="text-slate-900 font-bold">
                            {activeDrawerMaid.emergencyContact || activeDrawerMaid.emergencyContactName}
                          </strong>
                        </div>
                      </div>

                      {/* Step 1 Verification Action Button */}
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => updateItemVerification(activeDrawerMaid.uid, 'step1_personal', 'verified')}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Mark Step 1 Verified
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STEP 2: ADDRESS DETAILS
                ───────────────────────────────────────────────────────────── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div
                    onClick={() => toggleStep(2)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-all border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">Step 2</div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Address & Operating Area</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          step2Ver === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step2Ver === 'reupload_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step2Ver}
                      </span>
                      {expandedSteps[2] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {expandedSteps[2] && (
                    <div className="p-4 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Full Address</span>
                        <strong className="text-slate-900 font-bold text-right max-w-[240px]">
                          {activeDrawerMaid.fullAddress || activeDrawerMaid.address}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Locality & City</span>
                        <strong className="text-slate-900 font-bold">
                          {activeDrawerMaid.locality || 'N/A'}, {activeDrawerMaid.city} ({activeDrawerMaid.pincode})
                        </strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Preferred Work Cities / Area</span>
                        <strong className="text-slate-900 font-bold">
                          {(activeDrawerMaid.preferredCities || [activeDrawerMaid.serviceArea]).join(', ')}
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => updateItemVerification(activeDrawerMaid.uid, 'step2_address', 'verified')}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Mark Step 2 Verified
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STEP 3: SERVICES & AVAILABILITY
                ───────────────────────────────────────────────────────────── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div
                    onClick={() => toggleStep(3)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-all border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">Step 3</div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Services Provided & Availability</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          step3Ver === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step3Ver === 'reupload_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step3Ver}
                      </span>
                      {expandedSteps[3] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {expandedSteps[3] && (
                    <div className="p-4 space-y-3 text-xs text-slate-700">
                      {/* Services List */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Provided Services</span>
                        {(activeDrawerMaid.servicesProvided && activeDrawerMaid.servicesProvided.length > 0
                          ? activeDrawerMaid.servicesProvided
                          : (activeDrawerMaid.skills as any[]) || []
                        ).map((srv: any, idx: number) => {
                          const sName = typeof srv === 'object' ? srv.serviceName : String(srv);
                          const expYrs = typeof srv === 'object' ? srv.experienceYears || 1 : 1;
                          const expMths = typeof srv === 'object' ? srv.experienceMonths || 0 : 0;
                          const desc = typeof srv === 'object' ? srv.description : '';

                          return (
                            <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900">{sName || 'General Service'}</span>
                                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                                  {expYrs} yrs {expMths > 0 ? `${expMths} mos` : ''} exp
                                </span>
                              </div>
                              {desc ? <p className="text-[11px] text-slate-600 mt-1">{desc}</p> : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Languages */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Languages Spoken</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeDrawerMaid.languagesSpoken || activeDrawerMaid.languages || ['Telugu', 'English']).map((l, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 font-bold rounded-md text-[11px]">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Working Hours */}
                      {activeDrawerMaid.workingHours && (
                        <div className="pt-2 border-t border-slate-100 flex justify-between">
                          <span className="text-slate-500">Working Hours / Emergency Jobs</span>
                          <strong className="text-slate-900 font-bold">{activeDrawerMaid.workingHours}</strong>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => updateItemVerification(activeDrawerMaid.uid, 'step3_services', 'verified')}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Mark Step 3 Verified
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STEP 4: REQUIRED DOCUMENTS (Aadhaar & PAN)
                    (Police Clearance Completely Removed)
                ───────────────────────────────────────────────────────────── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div
                    onClick={() => toggleStep(4)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-all border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">Step 4</div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Document Verification (Aadhaar & PAN)</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          step4Ver === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step4Ver === 'reupload_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step4Ver}
                      </span>
                      {expandedSteps[4] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {expandedSteps[4] && (
                    <div className="p-4 space-y-4 text-xs text-slate-700">
                      {(() => {
                        const rawKyc = (activeDrawerMaid as any).rawKycDocuments || (activeDrawerMaid as any).kycDocuments;
                        const kycObj = typeof rawKyc === 'object' && rawKyc !== null && !Array.isArray(rawKyc) ? rawKyc : {};
                        const docsList: any[] = Array.isArray(kycObj.documents) ? kycObj.documents : [];

                        const aadhaarFront = activeDrawerMaid.aadhaarDocUrl || kycObj.aadhaarFrontUrl || docsList[0]?.fileUrl;
                        const aadhaarBack = kycObj.aadhaarBackUrl || docsList[1]?.fileUrl;
                        const panDoc = activeDrawerMaid.panDocUrl || kycObj.panDocUrl || docsList[2]?.fileUrl;

                        const docEntries = [
                          {
                            key: 'aadhaar_front',
                            label: 'Aadhaar Card - Front',
                            url: aadhaarFront,
                            status: aadhaarFrontVer,
                            reason: docs.aadhaar_front?.rejectionReason,
                          },
                          {
                            key: 'aadhaar_back',
                            label: 'Aadhaar Card - Back',
                            url: aadhaarBack,
                            status: aadhaarBackVer,
                            reason: docs.aadhaar_back?.rejectionReason,
                          },
                          {
                            key: 'pan_card',
                            label: 'PAN Card',
                            url: panDoc,
                            status: panCardVer,
                            reason: docs.pan_card?.rejectionReason,
                          },
                        ];

                        return (
                          <div className="space-y-3">
                            {docEntries.map(doc => (
                              <div
                                key={doc.key}
                                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  {doc.url ? (
                                    <img
                                      src={doc.url}
                                      alt={doc.label}
                                      className="w-16 h-12 object-cover rounded-lg border border-slate-300 shadow-sm"
                                      onError={(e: any) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-16 h-12 rounded-lg bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-[10px]">
                                      Missing
                                    </div>
                                  )}
                                  <div className="hidden items-center justify-center w-16 h-12 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg">
                                    N/A
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900">{doc.label}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      Status:{' '}
                                      <strong
                                        className={
                                          doc.status === 'verified'
                                            ? 'text-emerald-700 font-bold'
                                            : doc.status === 'reupload_required'
                                            ? 'text-amber-700 font-bold'
                                            : 'text-sky-700 font-bold'
                                        }
                                      >
                                        {doc.status.toUpperCase().replace('_', ' ')}
                                      </strong>
                                    </div>
                                    {doc.reason && <p className="text-[10px] text-amber-800 font-semibold mt-0.5">Note: {doc.reason}</p>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {doc.url ? (
                                    <button
                                      onClick={() =>
                                        openLightbox(
                                          doc.label,
                                          doc.url,
                                          `documents.${doc.key}`,
                                          doc.status,
                                          doc.reason
                                        )
                                      }
                                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" /> Preview
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">Not Uploaded</span>
                                  )}
                                  <button
                                    onClick={() => updateItemVerification(activeDrawerMaid.uid, `documents.${doc.key}`, 'verified')}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      const r = prompt(`Re-upload reason for ${doc.label}:`, 'Document photo is blurry or unreadable');
                                      if (r) updateItemVerification(activeDrawerMaid.uid, `documents.${doc.key}`, 'reupload_required', r);
                                    }}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
                                  >
                                    Re-upload
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    STEP 5: BANK DETAILS
                ───────────────────────────────────────────────────────────── */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div
                    onClick={() => toggleStep(5)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between cursor-pointer transition-all border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-black text-xs">Step 5</div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Bank Payout Details</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          step5Ver === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : step5Ver === 'reupload_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {step5Ver}
                      </span>
                      {expandedSteps[5] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {expandedSteps[5] && (
                    <div className="p-4 space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Account Holder Name</span>
                        <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.accountName || activeDrawerMaid.fullName}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Bank Name</span>
                        <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.bankName}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Account Number</span>
                        <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.accountNumber}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">IFSC Code</span>
                        <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails?.ifscCode}</strong>
                      </div>
                      {activeDrawerMaid.bankDetails?.upiId && (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">UPI ID</span>
                          <strong className="text-slate-900 font-bold">{activeDrawerMaid.bankDetails.upiId}</strong>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => updateItemVerification(activeDrawerMaid.uid, 'step5_bank', 'verified')}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Mark Step 5 Verified
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operational Notes / Custom Correction Prompt */}
                {activeDrawerMaid.adminNotes && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <h4 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">Active Operations Note</h4>
                    <p className="text-xs text-amber-900 font-medium">{activeDrawerMaid.adminNotes}</p>
                  </div>
                )}

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

            {/* Bottom Action Footer Bar & Strict Approval Guard */}
            {!showCorrectionPrompt && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 sticky bottom-0">
                {!canApprove && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Approval Guard Active: You must verify all 5 steps, profile photo, and mandatory documents (Aadhaar & PAN) before approving.
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    disabled={!canApprove}
                    onClick={async () => {
                      if (!canApprove) return;
                      await approveMaid(activeDrawerMaid.uid);
                      setActiveDrawerMaid(null);
                    }}
                    className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      canApprove
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> Approve Partner
                  </button>

                  <button
                    onClick={() => setShowCorrectionPrompt(true)}
                    className="py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Request Correction
                  </button>

                  <button
                    onClick={async () => {
                      const reason = prompt('Enter rejection reason:') || 'Application criteria not met';
                      await rejectMaid(activeDrawerMaid.uid, reason);
                      setActiveDrawerMaid(null);
                    }}
                    className="py-3 px-4 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Lightbox Modal */}
      <DocumentLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        documentTitle={lightboxTitle}
        documentUrl={lightboxUrl}
        currentStatus={lightboxCurrentStatus}
        rejectionReason={lightboxRejectionReason}
        onAccept={handleLightboxAccept}
        onReject={handleLightboxReject}
      />
    </div>
  );
};
