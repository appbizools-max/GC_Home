import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AllMaidsTab } from './AllMaidsTab';
import { PendingMaidDetailsTab } from './PendingMaidDetailsTab';
import { PendingKYCTab } from './PendingKYCTab';
import { ApprovedMaidsTab } from './ApprovedMaidsTab';
import { UnapprovedMaidsTab } from './UnapprovedMaidsTab';
import { ActiveMaidsTab } from './ActiveMaidsTab';
import { InactiveMaidsTab } from './InactiveMaidsTab';
import { DocumentsManagementTab } from './DocumentsManagementTab';
import { PerformanceTab } from './PerformanceTab';
import { Plus, Users, Clock, ShieldCheck, CheckCircle2, XCircle, Wifi, FileText, TrendingUp } from 'lucide-react';

export const MaidManagementPage: React.FC = () => {
  const { maids, currentTab } = useAdmin();

  // Selected sub-tab mapping with currentTab sync
  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'pending-details' | 'pending-kyc' | 'approved' | 'unapproved' | 'active' | 'inactive' | 'documents' | 'performance'
  >('all');

  useEffect(() => {
    if (currentTab === 'pending-maid-details') setActiveSubTab('pending-details');
    else if (currentTab === 'pending-kyc') setActiveSubTab('pending-kyc');
    else if (currentTab === 'approved-maids') setActiveSubTab('approved');
    else if (currentTab === 'unapproved-maids') setActiveSubTab('unapproved');
    else if (currentTab === 'active-maids') setActiveSubTab('active');
    else if (currentTab === 'inactive-maids') setActiveSubTab('inactive');
    else if (currentTab === 'documents') setActiveSubTab('documents');
    else if (currentTab === 'performance') setActiveSubTab('performance');
    else setActiveSubTab('all');
  }, [currentTab]);

  // Calculate Badge Counts dynamically from live database
  const totalCount = maids.length;
  const pendingDetailsCount = maids.filter(m => m.status === 'pending' && m.kycStatus === 'incomplete').length;
  const pendingKycCount = maids.filter(m => m.status === 'pending' || m.kycStatus === 'under_review').length;
  const approvedCount = maids.filter(m => m.status === 'approved').length;
  const unapprovedCount = maids.filter(m => m.status === 'rejected').length;
  const activeCount = maids.filter(m => m.status === 'approved' && m.isOnline).length;
  const inactiveCount = maids.filter(m => m.status === 'approved' && !m.isOnline).length;

  const renderSubView = () => {
    switch (activeSubTab) {
      case 'all':
        return <AllMaidsTab />;
      case 'pending-details':
        return <PendingMaidDetailsTab />;
      case 'pending-kyc':
        return <PendingKYCTab />;
      case 'approved':
        return <ApprovedMaidsTab />;
      case 'unapproved':
        return <UnapprovedMaidsTab />;
      case 'active':
        return <ActiveMaidsTab />;
      case 'inactive':
        return <InactiveMaidsTab />;
      case 'documents':
        return <DocumentsManagementTab />;
      case 'performance':
        return <PerformanceTab />;
      default:
        return <AllMaidsTab />;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Top Header Bar matching Screenshot 1 & 4 */}
      {activeSubTab !== 'documents' && activeSubTab !== 'performance' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Maid Partners
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage all registered maids, view status, performance, documents and approve new registrations.
            </p>
          </div>

          <button
            onClick={() => alert('Add Maid Partner flow initialized.')}
            className="px-4 py-2.5 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Maid Partner
          </button>
        </div>
      )}

      {/* Horizontal Pill Navigation Bar matching all reference screens */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-[#043927] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> All Maids
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeSubTab === 'all' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pending-details')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pending-details'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Maid Details
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
            {pendingDetailsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pending-kyc')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pending-kyc'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Pending KYC
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
            {pendingKycCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'approved'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved Maids
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeSubTab === 'approved' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('unapproved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'unapproved'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" /> Unapproved Maids
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
            {unapprovedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'active'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" /> Active Maids
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('inactive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'inactive'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Inactive Maids
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {inactiveCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'documents'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Documents
        </button>

        <button
          onClick={() => setActiveSubTab('performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'performance'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Performance
        </button>
      </div>

      {/* Render Active Sub-View */}
      {renderSubView()}
    </div>
  );
};
