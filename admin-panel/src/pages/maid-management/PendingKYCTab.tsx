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

  // Find target maid for approval review (default to MD023 Saroja P or first pending)
  const pendingMaidList = maids.filter(m => m.status === 'pending' || m.kycStatus === 'under_review');
  const [selectedMaidIndex, setSelectedMaidIndex] = useState<number>(0);
  const targetMaid: MaidProfile = pendingMaidList[selectedMaidIndex] || maids.find(m => m.maidId === 'MD023') || maids[0];

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

  const fallbackDocs: KycDocument[] = [
    { id: 'doc_1', type: 'aadhaar', title: 'Aadhaar Card', fileName: 'aadhaar_saroja.pdf', fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', fileSize: '245 KB', status: 'verified', uploadedAt: '14 Sep 2026, 10:24 AM', verifiedAt: '14 Sep 2026, 11:30 AM', verifiedBy: 'Admin' },
    { id: 'doc_2', type: 'pan', title: 'PAN Card', fileName: 'pan_saroja.pdf', fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', fileSize: '190 KB', status: 'verified', uploadedAt: '14 Sep 2026, 10:25 AM', verifiedAt: '14 Sep 2026, 11:30 AM', verifiedBy: 'Admin' },
    { id: 'doc_3', type: 'address_proof', title: 'Address Proof', fileName: 'address_saroja.pdf', fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', fileSize: '320 KB', status: 'under_review', uploadedAt: '14 Sep 2026, 10:26 AM' },
    { id: 'doc_4', type: 'police_verification', title: 'Police Verification Certificate', fileName: 'police_saroja.pdf', fileUrl: '', fileSize: '0 KB', status: 'not_submitted', uploadedAt: '-' },
    { id: 'doc_5', type: 'bank_passbook', title: 'Bank Passbook', fileName: 'bank_saroja.pdf', fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', fileSize: '410 KB', status: 'verified', uploadedAt: '14 Sep 2026, 10:28 AM', verifiedAt: '14 Sep 2026, 11:30 AM', verifiedBy: 'Admin' }
  ];

  const kycDocs: KycDocument[] = dbKycDocs.length > 0 
    ? dbKycDocs 
    : (targetMaid.kycDocuments && targetMaid.kycDocuments.length > 0 ? targetMaid.kycDocuments : fallbackDocs);

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
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-black text-slate-900">{targetMaid.fullName}</h2>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                ★ Pending Approval
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">Maid ID: {targetMaid.maidId || targetMaid.uid}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mt-2">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {targetMaid.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {targetMaid.serviceArea}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Applied on {targetMaid.appliedAt}</span>
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
                    <strong className="text-xs font-bold text-slate-900">Hub / Location</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">Verified</span>
                    <button className="text-[11px] font-bold text-sky-600 hover:underline">View Details</button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5 pl-7">
                  <p>Home Address: <strong className="text-slate-800">{targetMaid.address}</strong></p>
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
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Address Proof
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Police Verification
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
        </div>

        {/* Right Column: KYC Documents Review Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">KYC Documents</h3>
            <p className="text-xs text-slate-500 mb-4">Review and verify all uploaded documents</p>

            {/* Document Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
              {[
                { type: 'aadhaar', label: 'Aadhaar' },
                { type: 'pan', label: 'PAN' },
                { type: 'address_proof', label: 'Address Proof' },
                { type: 'police_verification', label: 'Police Verification' },
                { type: 'bank_passbook', label: 'Bank Details' }
              ].map(tab => (
                <button
                  key={tab.type}
                  onClick={() => {
                    setActiveDocType(tab.type);
                    setZoomScale(100);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeDocType === tab.type
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Interactive Document View Canvas */}
            <div className="mt-4 border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row gap-4 items-center">
              {/* Document Image Preview Box */}
              <div className="w-full md:w-1/2 h-60 bg-white rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center p-3">
                <img
                  src={currentActiveDoc.fileUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'}
                  alt={currentActiveDoc.title}
                  className="max-h-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale / 100})` }}
                />

                {/* Canvas Controls overlay */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm">
                  <button onClick={() => setZoomScale(s => Math.max(50, s - 25))} className="hover:text-emerald-400"><ZoomOut className="w-3.5 h-3.5" /></button>
                  <span>{zoomScale}%</span>
                  <button onClick={() => setZoomScale(s => Math.min(200, s + 25))} className="hover:text-emerald-400"><ZoomIn className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setZoomScale(100)} className="hover:text-emerald-400 ml-1"><RotateCcw className="w-3.5 h-3.5" /></button>
                </div>
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
                className="w-full sm:w-auto px-6 py-3 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
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
