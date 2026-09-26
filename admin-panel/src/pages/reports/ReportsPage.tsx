import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { BarChart3, TrendingUp, Users, Calendar, Download, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { bookings, maids, exportBookingsToCSV } = useAdmin();
  const [dateRange, setDateRange] = useState<string>('month');

  const totalGrossValue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const serviceCounts = bookings.reduce((acc, b) => {
    const s = b.serviceName || 'General Cleaning';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceEntries = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const catColors = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-500', 'bg-purple-600', 'bg-sky-500'];

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span className="text-emerald-700 font-bold">Reports & Analytics</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Operations Reports</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Operational SLA trends, revenue metrics, service popularity, and maid performance ledgers.
          </p>
        </div>

        <button
          onClick={exportBookingsToCSV}
          className="bg-[#123D2A] hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>Export PDF / CSV Report</span>
        </button>
      </div>

      {/* 4 KPI Reports Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Bookings Executed</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{bookings.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Monthly Gross Revenue</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">₹{totalGrossValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Completed Bookings</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{bookings.filter(b => b.status === 'completed').length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Active Partners Online</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{maids.filter(m => m.isOnline).length} / {maids.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reports Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Service Popularity Report */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Service Category Share & Popularity
          </h3>

          <div className="flex flex-col gap-3">
            {serviceEntries.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No booking records available to compute service popularity.
              </div>
            ) : (
              serviceEntries.map(([name, count], idx) => {
                const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                const col = catColors[idx % catColors.length];
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{name}</span>
                      <span>{pct}% ({count} Bookings)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${col} rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Maid Performance Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Top Performing Maid Partners
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 uppercase">
                  <th className="py-2.5 px-3">Maid Partner</th>
                  <th className="py-2.5 px-3">Location / Area</th>
                  <th className="py-2.5 px-3">Completed</th>
                  <th className="py-2.5 px-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maids.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                      No maid partners registered yet.
                    </td>
                  </tr>
                ) : (
                  maids.slice(0, 4).map(m => (
                    <tr key={m.uid} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <img src={m.photoUrl} alt={m.fullName} className="w-6 h-6 rounded-full object-cover" />
                        <span>{m.fullName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{m.serviceArea?.split(',')[0] || 'N/A'}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{m.completedJobsCount} Jobs</td>
                      <td className="py-3 px-3 font-extrabold text-amber-500">★ {m.rating}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

