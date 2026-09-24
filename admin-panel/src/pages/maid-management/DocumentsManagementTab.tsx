import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { KycDocument } from '../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  RotateCcw,
  Upload,
  Eye,
  X,
  Download,
  ShieldCheck,
  Maximize2,
  FileX,
  Send,
  MapPin
} from 'lucide-react';

export const DocumentsManagementTab: React.FC = () => {
  const { maids, updateMaidKycDocStatus } = useAdmin();

  const [activeSubPill, setActiveSubPill] = useState<string>('All');
  const [selectedDocType, setSelectedDocType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedMaidStatus, setSelectedMaidStatus] = useState<string>('All');
  const [selectedUploadDate, setSelectedUploadDate] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDrawerDoc, setSelectedDrawerDoc] = useState<any | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'Document Details' | 'History'>('Document Details');

  // Dynamically derive documents list from live registered maids and their KYC documents
  const documentsList = maids.flatMap(m => {
    return (m.kycDocuments || []).map(doc => ({
      id: doc.id,
      maidId: m.maidId || m.uid,
      maidName: m.fullName,
      photo: m.photoUrl,
      type: doc.type === 'aadhaar' ? 'Aadhaar Card' : doc.type === 'pan' ? 'PAN Card' : doc.type === 'address_proof' ? 'Address Proof' : doc.type === 'bank_passbook' ? 'Bank Passbook' : doc.title || 'Document',
      fileName: doc.fileName,
      uploadDate: doc.uploadedAt || 'Recently',
      status: doc.status === 'verified' ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : doc.status === 'under_review' ? 'Under Review' : 'Missing',
      verifiedBy: doc.verifiedBy || (doc.status === 'verified' ? 'Admin' : '-'),
      fileSize: doc.fileSize || '150 KB',
      fileUrl: doc.fileUrl,
    }));
  });

  const filtered = documentsList.filter(d => {
    if (activeSubPill !== 'All' && !d.type.toLowerCase().includes(activeSubPill.toLowerCase())) return false;
    if (selectedStatus !== 'All' && d.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!d.maidName.toLowerCase().includes(q) && !d.maidId.toLowerCase().includes(q) && !d.fileName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalDocs = documentsList.length;
  const verifiedDocs = documentsList.filter(d => d.status === 'Verified').length;
  const underReviewDocs = documentsList.filter(d => d.status === 'Under Review').length;
  const rejectedDocs = documentsList.filter(d => d.status === 'Rejected').length;
  const missingDocs = documentsList.filter(d => d.status === 'Missing').length;

  const docCounts: Record<string, number> = {
    All: totalDocs,
    Aadhaar: documentsList.filter(d => d.type.toLowerCase().includes('aadhaar')).length,
    PAN: documentsList.filter(d => d.type.toLowerCase().includes('pan')).length,
    Address: documentsList.filter(d => d.type.toLowerCase().includes('address')).length,
    Profile: documentsList.filter(d => d.type.toLowerCase().includes('profile')).length,
    Bank: documentsList.filter(d => d.type.toLowerCase().includes('bank')).length,
    Other: documentsList.filter(d => !['aadhaar', 'pan', 'address', 'profile', 'bank'].some(k => d.type.toLowerCase().includes(k))).length,
  };

  const resetFilters = () => {
    setActiveSubPill('All');
    setSelectedDocType('All');
    setSelectedStatus('All');
    setSelectedMaidStatus('All');
    setSelectedUploadDate('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* Page Header Bar matching Reference Screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Documents Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">View, verify and manage all maid partner documents in one place.</p>
        </div>

        <button
          onClick={() => alert('Upload document flow initialized.')}
          className="px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md self-start md:self-auto"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Top Document Type Sub-Pills matching Reference Screenshot */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'All', label: 'All Documents', count: docCounts.All },
          { id: 'Aadhaar', label: 'Aadhaar', count: docCounts.Aadhaar },
          { id: 'PAN', label: 'PAN', count: docCounts.PAN },
          { id: 'Address', label: 'Address Proof', count: docCounts.Address },
          { id: 'Profile', label: 'Profile Photos', count: docCounts.Profile },
          { id: 'Bank', label: 'Bank Documents', count: docCounts.Bank },
          { id: 'Other', label: 'Other Documents', count: docCounts.Other }
        ].map(pill => (
          <button
            key={pill.id}
            onClick={() => setActiveSubPill(pill.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubPill === pill.id
                ? 'bg-[#123D2A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {pill.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubPill === pill.id ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* 5 KPI Cards matching Reference Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Total Documents</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalDocs}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Verified</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{verifiedDocs}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Under Review</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{underReviewDocs}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Rejected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{rejectedDocs}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Missing</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{missingDocs}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar with Full Dropdowns & Search Button matching Reference Screenshot */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedDocType}
            onChange={e => setSelectedDocType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Aadhaar Card">Aadhaar Card</option>
            <option value="PAN Card">PAN Card</option>
            <option value="Address Proof">Address Proof</option>
            <option value="Bank Passbook">Bank Passbook</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Verification Status</option>
            <option value="Verified">Verified</option>
            <option value="Under Review">Under Review</option>
            <option value="Rejected">Rejected</option>
            <option value="Missing">Missing</option>
          </select>

          <select
            value={selectedMaidStatus}
            onChange={e => setSelectedMaidStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Maid Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Unapproved">Unapproved</option>
          </select>

          <select
            value={selectedUploadDate}
            onChange={e => setSelectedUploadDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by maid name, maid ID or document..."
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

          <button
            className="px-4 py-2 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5" /> Search
          </button>
        </div>
      </div>

      {/* Documents Table matching Reference Screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Maid ID</th>
                <th className="py-3.5 px-4">Maid Name</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verified By</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((d, idx) => {
                const statusBg = d.status === 'Verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : d.status === 'Under Review'
                  ? 'bg-amber-100 text-amber-800'
                  : d.status === 'Rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-rose-50 text-rose-700 border border-rose-200';

                return (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{d.maidId}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={d.photo} alt={d.maidName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        <strong className="text-slate-900 font-bold">{d.maidName}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" /> {d.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{d.fileName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{d.uploadDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${statusBg}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{d.verifiedBy}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDrawerDoc(d)}
                        className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No documents found matching criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Details Drawer matching Reference Screenshot 2 */}
      {selectedDrawerDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between font-sans">
            <div>
              {/* Drawer Top Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-start gap-3.5">
                  <img src={selectedDrawerDoc.photo} alt={selectedDrawerDoc.maidName} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{selectedDrawerDoc.maidName}</h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">Verified</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Maid ID: {selectedDrawerDoc.maidId}</p>
                    <p className="text-xs text-slate-500 font-medium">+91 91234 56789</p>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Kondapur, Hyderabad
                    </p>
                  </div>
                </div>

                <button onClick={() => setSelectedDrawerDoc(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-200 flex items-center px-6 gap-6 text-xs font-bold text-slate-500 bg-white">
                {(['Document Details', 'History'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 border-b-2 transition-all cursor-pointer ${
                      activeDrawerTab === tab ? 'border-emerald-600 text-emerald-800 font-black' : 'border-transparent hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-5">
                {/* Document Type Header Card */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{selectedDrawerDoc.type}</h4>
                      <p className="text-xs text-slate-500 font-medium">{selectedDrawerDoc.fileName}</p>
                      <p className="text-[10px] text-slate-400">Uploaded on {selectedDrawerDoc.uploadDate}, 10:24 AM</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-[10px]">
                    {selectedDrawerDoc.status}
                  </span>
                </div>

                {/* Aadhaar Image Preview Card matching Screenshot 2 */}
                <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-sm">
                  <button className="absolute top-3 right-3 p-1.5 bg-slate-900/70 text-white rounded-lg hover:bg-slate-900 transition-all cursor-pointer shadow-sm">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-inner flex flex-col items-center justify-center text-center">
                    <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Government of India</span>
                      <span className="text-[10px] font-extrabold text-rose-600">AADHAAR</span>
                    </div>
                    <div className="flex items-center gap-3 w-full my-1">
                      <img src={selectedDrawerDoc.photo} alt="Identity" className="w-14 h-16 rounded-lg object-cover border border-slate-200" />
                      <div className="text-left space-y-0.5">
                        <strong className="text-xs font-bold text-slate-900 block">{selectedDrawerDoc.maidName}</strong>
                        <span className="text-[10px] text-slate-500 block">DOB: 12/05/1992</span>
                        <span className="text-[10px] text-slate-500 block">Gender: Female</span>
                        <span className="text-xs font-extrabold text-slate-800 block mt-1 tracking-wider">XXXX XXXX 1234</span>
                      </div>
                    </div>
                    <div className="w-full border-t border-slate-100 pt-1.5 mt-1 text-center">
                      <span className="text-[11px] font-black text-rose-700 tracking-wide">मेरा आधार, मेरी पहचान</span>
                    </div>
                  </div>
                </div>

                {/* Document Information Grid */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Document Information</h4>
                  <div className="space-y-2 text-xs text-slate-700 font-medium">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Document Type</span>
                      <strong className="text-slate-900 font-bold">{selectedDrawerDoc.type}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">File Name</span>
                      <strong className="text-slate-900 font-bold">{selectedDrawerDoc.fileName}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">File Size</span>
                      <strong className="text-slate-900 font-bold">{selectedDrawerDoc.fileSize}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Upload Date</span>
                      <strong className="text-slate-900 font-bold">{selectedDrawerDoc.uploadDate}, 10:24 AM</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Verification Status</span>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">{selectedDrawerDoc.status}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Verified By</span>
                      <strong className="text-slate-900 font-bold">{selectedDrawerDoc.verifiedBy}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Verified On</span>
                      <strong className="text-slate-900 font-bold">15 Sep 2026, 09:30 AM</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Expiry Date</span>
                      <strong className="text-slate-900 font-bold">-</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons matching Reference Screenshot 2 */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center gap-2">
                <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> View Full Size
                </button>
                <button className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedDrawerDoc(null)}
                  className="py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Reject Document
                </button>
                <button
                  onClick={() => setSelectedDrawerDoc(null)}
                  className="py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Request New Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


