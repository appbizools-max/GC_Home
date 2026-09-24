import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AllMaidsTab } from './AllMaidsTab';
import { Plus, Users, Clock, ShieldCheck, Wifi, UserX } from 'lucide-react';

export const MaidManagementPage: React.FC = () => {
  const { maids, currentTab } = useAdmin();

  // 5 Streamlined Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'pending-approval' | 'pending-kyc' | 'active' | 'inactive'
  >('all');

  // Synchronize with AdminContext currentTab
  useEffect(() => {
    if (currentTab === 'pending-approvals' || currentTab === 'pending-maid-details') {
      setActiveSubTab('pending-approval');
    } else if (currentTab === 'pending-kyc') {
      setActiveSubTab('pending-kyc');
    } else if (currentTab === 'active-maids') {
      setActiveSubTab('active');
    } else if (currentTab === 'inactive-maids') {
      setActiveSubTab('inactive');
    } else {
      setActiveSubTab('all');
    }
  }, [currentTab]);

  // Real-data KPI counts
  const totalCount = maids.length;
  const pendingApprovalCount = maids.filter(m => m.status === 'pending').length;
  const pendingKycCount = maids.filter(
    m =>
      m.kycStatus === 'pending' ||
      m.kycStatus === 'under_review' ||
      m.kycStatus === 'incomplete' ||
      (m.status === 'pending' && m.kycStatus !== 'verified')
  ).length;
  const activeCount = maids.filter(m => m.status === 'approved' && m.isOnline).length;
  const inactiveCount = maids.filter(m => m.status === 'rejected' || (m.status === 'approved' && !m.isOnline)).length;

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Partners
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage registered partners, approvals, availability and partner status.
          </p>
        </div>

        <button
          onClick={() => alert('Partner registration flow initialized.')}
          className="px-4 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* 2. 4 Simplified KPI Cards (Real Data Only - No Fake Comparisons) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Partners */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">Total Partners</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
              Registered on platform
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#123D2A] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Pending Approval */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">Pending Approval</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{pendingApprovalCount}</span>
            </div>
            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
              Awaiting admin review
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Active Partners */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">Active Partners</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{activeCount}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Currently available online
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Pending KYC */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-0.5">Pending KYC</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{pendingKycCount}</span>
            </div>
            <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
              Verification required
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. 5 Streamlined Top Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {/* Tab 1: All Partners */}
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-[#123D2A] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> All Partners
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'all' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Tab 2: Pending Approval */}
        <button
          onClick={() => setActiveSubTab('pending-approval')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pending-approval'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pending Approval
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
            {pendingApprovalCount}
          </span>
        </button>

        {/* Tab 3: Pending KYC */}
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

        {/* Tab 4: Active Partners */}
        <button
          onClick={() => setActiveSubTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'active'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" /> Active Partners
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            {activeCount}
          </span>
        </button>

        {/* Tab 5: Inactive Partners */}
        <button
          onClick={() => setActiveSubTab('inactive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'inactive'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="w-3.5 h-3.5" /> Inactive Partners
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
            {inactiveCount}
          </span>
        </button>
      </div>

      {/* 4. Streamlined Partner Table & Management */}
      <AllMaidsTab activeTab={activeSubTab} />
    </div>
  );
};

