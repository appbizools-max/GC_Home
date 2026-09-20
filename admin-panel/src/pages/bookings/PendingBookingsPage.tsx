import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Clock,
  ChevronRight,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Lightbulb,
  Search,
  MoreVertical,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

export const PendingBookingsPage: React.FC = () => {
  const { bookings, openAssignMaid, autoAssignMaid } = useAdmin();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pending bookings filter
  const pendingBookings = bookings.filter(
    b => b.status === 'pending_assignment' || b.status === 'new'
  );

  // Calculate live metrics from pending bookings
  const newBookingsCount = bookings.filter(b => b.status === 'new').length;
  const unassignedCount = pendingBookings.length;
  const waitingOver5MinsCount = pendingBookings.filter(
    b => (b.waitingMinutes || 0) >= 5
  ).length;
  const paymentConfirmedCount = pendingBookings.filter(
    b => b.paymentStatus === 'paid'
  ).length;
  
  // Today's pending bookings
  const today = new Date().toISOString().split('T')[0];
  const todayPendingCount = pendingBookings.filter(b => {
    if (b.createdAt) {
      const bookingDate = new Date(b.createdAt).toISOString().split('T')[0];
      return bookingDate === today;
    }
    return false;
  }).length;

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingBookings.map(b => b.bookingId));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAssign = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one booking to bulk assign.');
      return;
    }
    selectedIds.forEach(id => autoAssignMaid(id));
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#043927] font-bold">New / Pending Bookings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            New / Pending Bookings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Bookings waiting for maid assignment.
          </p>
        </div>
      </div>

      {/* 5 KPI Metric Cards with Live Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* New Bookings */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              New Bookings
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{newBookingsCount}</h3>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 mt-1">
            Live count
          </span>
        </div>

        {/* Unassigned */}
        <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">
              Unassigned
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-700 mt-2">{unassignedCount}</h3>
          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 mt-1">
            Needs action
          </span>
        </div>

        {/* Waiting > 5 Minutes */}
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">
              Waiting &gt; 5 Minutes
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 mt-2">{waitingOver5MinsCount}</h3>
          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
            Urgent
          </span>
        </div>

        {/* Payment Confirmed */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Payment Confirmed
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{paymentConfirmedCount}</h3>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
            Prepaid
          </span>
        </div>

        {/* Today */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Today
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{todayPendingCount}</h3>
          <span className="text-[10px] font-medium text-slate-400 mt-1 block">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-3">
          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="all">All Locations</option>
            <option value="kondapur">Kondapur</option>
            <option value="madhapur">Madhapur</option>
          </select>

          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="all">All Services</option>
            <option value="home">Home Cleaning</option>
            <option value="deep">Deep Cleaning</option>
          </select>

          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="today">Select Date</option>
          </select>

          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="cod">COD</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-[#043927] hover:bg-[#064e3b] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Banner & Bulk Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0A192F]">
            Pending Bookings ({pendingBookings.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium">Customer bookings waiting for maid assignment</p>
        </div>

        <div className="flex items-center gap-3">
          {waitingOver5MinsCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span>{waitingOver5MinsCount} bookings are waiting for more than 5 minutes</span>
            </div>
          )}

          <button
            onClick={handleBulkAssign}
            className="bg-[#043927] hover:bg-[#064e3b] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>Bulk Assign</span>
          </button>
        </div>
      </div>

      {/* Main Pending Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === pendingBookings.length && pendingBookings.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#043927]"
                  />
                </th>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Locality</th>
                <th className="py-3 px-3">Booking Time</th>
                <th className="py-3 px-3">Waiting</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Assignment Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {pendingBookings.map((b, idx) => {
                const waitMins = b.waitingMinutes || 4;
                const isOver5 = waitMins >= 5;

                return (
                  <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.bookingId)}
                        onChange={() => toggleSelectOne(b.bookingId)}
                        className="rounded border-slate-300 text-[#043927]"
                      />
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#043927]">{b.bookingId}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {b.customerAvatar && (
                          <img
                            src={b.customerAvatar}
                            alt={b.customerName}
                            className="w-8 h-8 rounded-full object-cover shadow-sm"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{b.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{b.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{b.serviceName}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-800">{b.address.locality}</td>
                    <td className="py-3.5 px-3 text-slate-600 font-bold">{b.timeSlot}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                          isOver5
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : waitMins > 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {waitMins} mins
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {b.paymentStatus === 'paid' ? (
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          Paid
                        </span>
                      ) : (
                        <span className="bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          COD
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        Unassigned
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAssignMaid(b.bookingId)}
                          className="bg-[#043927] hover:bg-[#064e3b] text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all shadow-sm"
                        >
                          Assign Maid
                        </button>
                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div>Showing 1 to {pendingBookings.length} of {pendingBookings.length} pending bookings</div>

          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              &lt;
            </button>
            <button className="px-3 py-1 rounded-lg bg-[#043927] text-white font-black cursor-pointer">
              1
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-900 font-semibold">
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>
          Tip: Assign maids quickly to improve customer satisfaction and reduce cancellations.
        </span>
      </div>
    </div>
  );
};
