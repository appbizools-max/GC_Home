import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../config/supabase';
import { MaidProfile, KycDocument } from '../../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileText,
  UserCheck,
  UserX,
  Send,
  MapPin,
  Phone,
  Calendar,
  Briefcase
} from 'lucide-react';

export const PendingKYCTab: React.FC = () => {
  const { maids, approveMaid, rejectMaid, requestMaidCorrection, updateMaidKycDocStatus } = useAdmin();

  // Find target maid for approval review
  const pendingMaidList = maids.filter(m => m.status === 'pending' || m.kycStatus === 'under_review');
  const [selectedMaidIndex, setSelectedMaidIndex] = useState<number>(0);
  const targetMaid: MaidProfile | undefined = pendingMaidList[selectedMaidIndex];

  // Active Document Tab
  const [activeDocType, setActiveDocType] = useState<string>('aadhaar');

  // Zoom scale state for interactive document viewer
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Admin notes input
  const [adminNotes, setAdminNotes] = useState<string>(targetMaid?.adminNotes || '');

  if (!targetMaid) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <h3 className="text-base font-bold text-slate-800">No Pending KYC Approvals</h3>
        <p className="text-xs text-slate-500 mt-1">All maid partners have been verified and processed.</p>
      </div>
    );
  }

  const [dbKycDocs, setDbKycDocs] = useState<KycDocument[]>([]);

  useEffect(() => {
    if (!targetMaid?.uid) return;
    const loadLiveDocs = async () => {
      try {
        const { data } = await supabase
          .from('maid_kyc_documents')
          .select('*')
          .eq('maid_id', targetMaid.uid);
        if (data && data.length > 0) {
          setDbKycDocs(
            data.map(d => ({
              id: d.id,
              type: d.doc_type,
              title: d.title || d.doc_type,
              fileName: d.file_name || `${d.doc_type}.pdf`,
              fileUrl: d.file_url || '',
              fileSize: d.file_size_bytes ? `${Math.round(d.file_size_bytes / 1024)} KB` : '150 KB',
              status: d.status || 'under_review',
              uploadedAt: d.uploaded_at ? new Date(d.uploaded_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent',
              verifiedAt: d.verified_at ? new Date(d.verified_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : undefined,
              verifiedBy: d.verified_by_name || 'Admin',
            }))
          );
        } else {
          setDbKycDocs([]);
        }
      } catch (err) {
        console.warn('Live KYC docs fetch notice:', err);
      }
    };
    loadLiveDocs();
  }, [targetMaid?.uid]);

    const profileDocs: KycDocument[] = [];
    const rawKyc = (targetMaid as any).rawKycDocuments || (targetMaid as any).kyc_documents || {};

    const frontUrl = (targetMaid as any).aadhaarFrontUrl || targetMaid.aadhaarDocUrl || targetMaid.idProofUrl || rawKyc.aadhaarFrontUrl;
    if (frontUrl) {
      profileDocs.push({
        id: 'doc_aadhaar_front',
        type: 'aadhaar',
        title: 'Aadhaar Card (Front)',
        fileName: 'aadhaar_front.jpg',
        fileUrl: frontUrl,
        fileSize: 'Uploaded File',
        status: 'under_review',
        uploadedAt: targetMaid.appliedAt || 'Recent',
      });
    }

    const backUrl = (targetMaid as any).aadhaarBackUrl || rawKyc.aadhaarBackUrl;
    if (backUrl) {
      profileDocs.push({
        id: 'doc_aadhaar_back',
        type: 'aadhaar_back',
        title: 'Aadhaar Card (Back)',
        fileName: 'aadhaar_back.jpg',
        fileUrl: backUrl,
        fileSize: 'Uploaded File',
        status: 'under_review',
        uploadedAt: targetMaid.appliedAt || 'Recent',
      });
    }

    const panUrl = targetMaid.panDocUrl || rawKyc.panDocUrl;
    if (panUrl) {
      profileDocs.push({
        id: 'doc_pan',
        type: 'pan',
        title: 'PAN Card',
        fileName: 'pan_card.jpg',
        fileUrl: panUrl,
        fileSize: 'Uploaded File',
        status: 'under_review',
        uploadedAt: targetMaid.appliedAt || 'Recent',
      });
    }

    if (targetMaid.addressProofUrl) {
      profileDocs.push({
        id: 'doc_address',
        type: 'address_proof',
        title: 'Address Proof',
        fileName: 'address_proof.jpg',
        fileUrl: targetMaid.addressProofUrl,
        fileSize: 'Uploaded File',
        status: 'under_review',
        uploadedAt: targetMaid.appliedAt || 'Recent',
      });
    }

    if (Array.isArray(rawKyc?.documents) && rawKyc.documents.length > 0) {
      rawKyc.documents.forEach((d: any, index: number) => {
        if (d && d.fileUrl && !profileDocs.some(pd => pd.fileUrl === d.fileUrl)) {
          const isPdf = d.fileType === 'pdf' || d.fileUrl.endsWith('.pdf') || d.name?.endsWith('.pdf');
          profileDocs.push({
            id: d.id || `doc_${index}`,
            type: (isPdf ? 'other' : 'aadhaar') as any,
            title: d.name || `Verification Document ${index + 1}`,
            fileName: d.name || `document_${index + 1}`,
            fileUrl: d.fileUrl,
            fileSize: d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB` : 'Uploaded File',
            status: 'under_review',
            uploadedAt: d.uploadedAt || targetMaid.appliedAt || 'Recent',
          });
        }
      });
    }

    if (targetMaid.otherDocsUrls && targetMaid.otherDocsUrls.length > 0) {
      targetMaid.otherDocsUrls.forEach((url: string, idx: number) => {
        if (url && !profileDocs.some(pd => pd.fileUrl === url)) {
          profileDocs.push({
            id: `doc_other_${idx}`,
            type: 'other',
            title: `Verification File ${idx + 1}`,
            fileName: url.split('/').pop() || `verification_file_${idx + 1}`,
            fileUrl: url,
            fileSize: 'Uploaded File',
            status: 'under_review',
            uploadedAt: targetMaid.appliedAt || 'Recent',
          });
        }
      });
    }

    const kycDocs: KycDocument[] = dbKycDocs.length > 0
      ? dbKycDocs
      : profileDocs;

  const currentActiveDoc = kycDocs.find(d => d.type === activeDocType) || kycDocs[0];

  const handlePrevMaid = () => {
    if (selectedMaidIndex > 0) setSelectedMaidIndex(prev => prev - 1);
  };

  const handleNextMaid = () => {
    if (selectedMaidIndex < pendingMaidList.length - 1) setSelectedMaidIndex(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Breadcrumb Bar matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Maid Partners</span>
            <span>&gt;</span>
            <span>Pending KYC</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">Maid Approval Review</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Maid Approval Review</h1>
          <p className="text-xs text-slate-500 font-medium">Verify registration details, documents and approve or reject the maid partner.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to List
          </button>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
            <span className="text-xs font-extrabold text-slate-700 mr-2">Maid ID: {targetMaid.maidId || targetMaid.uid}</span>
            <button
              onClick={handlePrevMaid}
              disabled={selectedMaidIndex === 0}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMaid}
              disabled={selectedMaidIndex >= pendingMaidList.length - 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Maid Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <img
            src={targetMaid.photoUrl}
            alt={targetMaid.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">{targetMaid.fullName}</h2>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                ★ Pending Approval
              </span>
              {Boolean(targetMaid.reapplicationCount && targetMaid.reapplicationCount > 0) && (
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[11px] font-extrabold flex items-center gap-1 border border-purple-200">
                  ↺ Re-Application #{targetMaid.reapplicationCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">Maid ID: {targetMaid.maidId || targetMaid.uid}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mt-2">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {targetMaid.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {targetMaid.serviceArea}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> First Applied: {targetMaid.appliedAt}</span>
              {targetMaid.latestAppliedAt && targetMaid.latestAppliedAt !== targetMaid.appliedAt && (
                <span className="flex items-center gap-1 text-purple-700"><Clock className="w-3.5 h-3.5 text-purple-500" /> Latest Re-applied: {targetMaid.latestAppliedAt}</span>
              )}
              {targetMaid.rejectedAt && (
                <span className="flex items-center gap-1 text-rose-600"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Last Rejected: {new Date(targetMaid.rejectedAt).toISOString().split('T')[0]}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-medium block">Age & Gender</span>
            <strong className="text-slate-900 font-bold">{targetMaid.age || 28} years • {targetMaid.gender || 'Female'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Experience</span>
            <strong className="text-slate-900 font-bold">{targetMaid.experience || '2+ Years'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Languages</span>
            <strong className="text-slate-900 font-bold">{(targetMaid.languages || ['Telugu', 'Hindi', 'English']).join(', ')}</strong>
          </div>
          <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-200">
            <span className="text-slate-400 font-medium block">Preferred Areas</span>
            <strong className="text-slate-900 font-bold">{(targetMaid.preferredAreas || ['Miyapur', 'Kondapur', 'Gachibowli']).join(', ')}</strong>
          </div>
        </div>
      </div>

      {/* 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Verification Checklist (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Verification Checklist</h3>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">
                Overall Status: Under Review
              </span>
            </div>

            <div className="space-y-4">
              {/* Item 1: Personal Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center">1</span>
                    <strong className="text-xs font-bold text-slate-900">Personal Details</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">Verified</span>
                    <button className="text-[11px] font-bold text-sky-600 hover:underline">View Details</button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5 pl-7">
                  <p>Full Name: <strong className="text-slate-800">{targetMaid.fullName}</strong></p>
                  <p>Phone: <strong className="text-slate-800">{targetMaid.phone}</strong></p>
                  <p>Emergency: <strong className="text-slate-800">{targetMaid.emergencyContact}</strong></p>
                </div>
              </div>

              {/* Item 2: Hub / Location */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center">2</span>
                    <strong className="text-xs font-bold text-slate-900">Service Location & Address</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">Verified</span>
                    <button className="text-[11px] font-bold text-sky-600 hover:underline">View Details</button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5 pl-7">
                  <p>Home Address: <strong className="text-slate-800">{targetMaid.address}</strong></p>
                  <p>Preferred Work Cities: <strong className="text-emerald-700 font-bold">{targetMaid.preferredCities && targetMaid.preferredCities.length > 0 ? targetMaid.preferredCities.join(', ') : (targetMaid.preferredServiceArea || targetMaid.serviceArea || targetMaid.city || 'Not specified')}</strong></p>
                  <p>Service Radius: <strong className="text-slate-800">{targetMaid.serviceRadiusKm} km</strong></p>
                </div>
              </div>

              {/* Item 3: KYC Documents */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">3</span>
                    <strong className="text-xs font-bold text-slate-900">KYC Documents</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">Pending</span>
                    <button className="text-[11px] font-bold text-sky-600 hover:underline">View Details</button>
                  </div>
                </div>

                {/* Sub-document badges */}
                <div className="grid grid-cols-2 gap-2 pl-7 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold bg-white p-1.5 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aadhaar Card
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold bg-white p-1.5 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PAN Card
                  </div>
                </div>
              </div>

              {/* Item 4: Bank Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center">4</span>
                    <strong className="text-xs font-bold text-slate-900">Bank Details</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">Verified</span>
                    <button className="text-[11px] font-bold text-sky-600 hover:underline">View Details</button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5 pl-7">
                  <p>Account Holder: <strong className="text-slate-800">{targetMaid.bankDetails.accountName || targetMaid.fullName}</strong></p>
                  <p>Bank: <strong className="text-slate-800">{targetMaid.bankDetails.bankName}</strong> ({targetMaid.bankDetails.ifscCode})</p>
                </div>
              </div>

              {/* Item 5: Safety & Compliance */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">5</span>
                    <strong className="text-xs font-bold text-slate-900">Safety & Compliance</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold">Pending</span>
                    <button className="text-[11px] font-bold text-sky-600 hover:underline">View Details</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Application History & Timeline Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Application History & Timeline</h3>
              </div>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-extrabold">
                {((targetMaid.reapplicationCount || 0) + 1)} {((targetMaid.reapplicationCount || 0) + 1) === 1 ? 'Application' : 'Total Applications'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Complete audit trail of all partner applications, re-submissions, and administrative decisions.
            </p>

            <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
              {/* Previous Application Versions (Historical Snapshots) */}
              {Array.isArray(targetMaid.applicationHistory) && targetMaid.applicationHistory.length > 0 ? (
                targetMaid.applicationHistory.map((hist: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-slate-900">Application Version {hist.version || idx + 1}</span>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[9px] font-black uppercase">
                          {hist.status || 'Rejected'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <p>Applied on: <strong className="text-slate-800">{hist.appliedAt ? new Date(hist.appliedAt).toISOString().split('T')[0] : 'Past'}</strong></p>
                        {hist.rejectedAt && (
                          <p>Rejected on: <strong className="text-rose-700">{new Date(hist.rejectedAt).toISOString().split('T')[0]}</strong></p>
                        )}
                        {hist.rejectionReason && (
                          <p className="mt-1 pt-1 border-t border-rose-200/60 text-rose-900 font-medium">
                            Reason: &ldquo;{hist.rejectionReason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : targetMaid.rejectedAt || targetMaid.rejectionReason ? (
                <div className="relative">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900">Application Version 1</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[9px] font-black uppercase">
                        Rejected
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p>Applied on: <strong className="text-slate-800">{targetMaid.appliedAt}</strong></p>
                      {targetMaid.rejectedAt && (
                        <p>Rejected on: <strong className="text-rose-700">{new Date(targetMaid.rejectedAt).toISOString().split('T')[0]}</strong></p>
                      )}
                      {targetMaid.rejectionReason && (
                        <p className="mt-1 pt-1 border-t border-rose-200/60 text-rose-900 font-medium">
                          Reason: &ldquo;{targetMaid.rejectionReason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Current Active Application (Under Review) */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm ring-2 ring-emerald-200" />
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-emerald-950">
                      {(targetMaid.reapplicationCount && targetMaid.reapplicationCount > 0)
                        ? `Application Version ${(targetMaid.reapplicationCount || 0) + 1} (Latest Re-Application)`
                        : 'Application Version 1 (Initial)'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black uppercase">
                      Under Review
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>Submitted on: <strong className="text-slate-900">{targetMaid.latestAppliedAt || targetMaid.appliedAt}</strong></p>
                    <p>Status: <strong className="text-emerald-800 font-bold">Pending Administrative Operations Review</strong></p>
                    <p className="text-[10px] text-slate-500 mt-1">Review applicant details and documents to issue final approval or revision.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: KYC Documents Review Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">KYC Documents</h3>
            <p className="text-xs text-slate-500 mb-4">Review and verify all uploaded documents</p>

            {/* Document Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
              {kycDocs.map(tab => (
                <button
                  key={tab.id || tab.type}
                  onClick={() => {
                    setActiveDocType(tab.type);
                    setZoomScale(100);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    (currentActiveDoc?.type === tab.type || activeDocType === tab.type)
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Interactive Document View Canvas */}
            <div className="mt-4 border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row gap-4 items-center">
              {/* Document Image / PDF Preview Box */}
              <div className="w-full md:w-1/2 h-60 bg-white rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center p-3">
                {currentActiveDoc?.fileUrl ? (
                  currentActiveDoc.fileName?.toLowerCase().endsWith('.pdf') || currentActiveDoc.fileUrl.toLowerCase().includes('.pdf') ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <FileText className="w-12 h-12 text-sky-600 mb-2" />
                      <span className="text-xs font-bold text-slate-800 max-w-[200px] truncate block">
                        {currentActiveDoc.fileName || 'PDF Document'}
                      </span>
                      <a
                        href={currentActiveDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Open / Download
                      </a>
                    </div>
                  ) : (
                    <img
                      src={currentActiveDoc.fileUrl}
                      alt={currentActiveDoc.title}
                      className="max-h-full object-contain transition-transform duration-200"
                      style={{ transform: `scale(${zoomScale / 100})` }}
                    />
                  )
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">Document not uploaded yet</p>
                  </div>
                )}

                {/* Canvas Controls overlay (only when image is displayed) */}
                {currentActiveDoc?.fileUrl && !(currentActiveDoc.fileName?.toLowerCase().endsWith('.pdf') || currentActiveDoc.fileUrl.toLowerCase().includes('.pdf')) && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                    <button onClick={() => setZoomScale(s => Math.max(50, s - 25))} className="hover:text-emerald-400"><ZoomOut className="w-3.5 h-3.5" /></button>
                    <span>{zoomScale}%</span>
                    <button onClick={() => setZoomScale(s => Math.min(200, s + 25))} className="hover:text-emerald-400"><ZoomIn className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setZoomScale(100)} className="hover:text-emerald-400 ml-1"><RotateCcw className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              {/* Document File Info Details */}
              <div className="w-full md:w-1/2 flex flex-col justify-between h-60 p-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{currentActiveDoc.title}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                      currentActiveDoc.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentActiveDoc.status === 'under_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentActiveDoc.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-medium mt-3">
                    <p>File Name: <strong className="text-slate-900">{currentActiveDoc.fileName}</strong></p>
                    <p>File Size: <strong className="text-slate-900">{currentActiveDoc.fileSize}</strong></p>
                    <p>Uploaded On: <strong className="text-slate-900">{currentActiveDoc.uploadedAt}</strong></p>
                    {currentActiveDoc.verifiedAt && (
                      <p>Verified On: <strong className="text-slate-900">{currentActiveDoc.verifiedAt}</strong></p>
                    )}
                    {currentActiveDoc.verifiedBy && (
                      <p>Verified By: <strong className="text-slate-900">{currentActiveDoc.verifiedBy}</strong></p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <a
                    href={currentActiveDoc.fileUrl}
                    download={currentActiveDoc.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" /> Download Document
                  </a>
                </div>
              </div>
            </div>

            {/* Document Thumbnails Grid */}
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mt-5 mb-3">All Submitted Documents</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {kycDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setActiveDocType(doc.type);
                    setZoomScale(100);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                    activeDocType === doc.type
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-900 truncate">{doc.title}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md self-start ${
                    doc.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : doc.status === 'under_review'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {doc.status === 'verified' ? '✓ Verified' : doc.status === 'under_review' ? 'Under Review' : 'Missing'}
                  </span>
                </button>
              ))}
            </div>

            {/* Admin Notes */}
            <div className="mt-5">
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5">Admin Notes</label>
              <textarea
                rows={3}
                placeholder="Add notes about verification, concerns or additional remarks..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                maxLength={500}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 font-medium resize-none"
              />
              <span className="text-[10px] text-slate-400 text-right block mt-1">{adminNotes.length}/500</span>
            </div>

            {/* Final Decision Action Bar matching Screenshot 2 */}
            <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => approveMaid(targetMaid.uid)}
                className="w-full sm:w-auto px-6 py-3 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <UserCheck className="w-4 h-4" /> Approve Maid
              </button>

              <button
                onClick={() => {
                  const reason = prompt('Enter rejection reason:') || 'Documents failed background check.';
                  rejectMaid(targetMaid.uid, reason);
                }}
                className="w-full sm:w-auto px-5 py-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserX className="w-4 h-4" /> Reject Maid
              </button>

              <button
                onClick={() => requestMaidCorrection(targetMaid.uid, adminNotes || 'Please re-upload clear Aadhaar and address proof.')}
                className="w-full sm:w-auto px-5 py-3 bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Request Correction
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

