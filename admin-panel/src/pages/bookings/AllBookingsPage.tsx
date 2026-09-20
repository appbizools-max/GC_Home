import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowUpRight,
  Search,
  Download,
  Filter,
  MoreVertical,
  ChevronRight,
  Eye,
  UserCheck,
  MapPin,
} from 'lucide-react';

export const AllBookingsPage: React.FC = () => {
  const {
    bookings,
    openAssignMaid,
    openBookingDetails,
    setCreateBookingModalOpen,
    exportBookingsToCSV,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Filter bookings based on activeTab, searchTerm, location, and service
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'pending' && !(b.status === 'pending_assignment' || b.status === 'new')) return false;
    if (activeTab === 'ongoing' && !(b.status === 'ongoing' || b.status === 'in_progress' || b.status === 'en_route' || b.status === 'arrived' || b.status === 'cleaning_started')) return false;
    if (activeTab === 'completed' && b.status !== 'completed') return false;
    if (activeTab === 'cancelled' && b.status !== 'cancelled') return false;
    if (activeTab === 'rescheduled' && b.status !== 'rescheduled') return false;

    if (locationFilter !== 'all' && !b.address.locality.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (serviceFilter !== 'all' && !b.serviceName.toLowerCase().includes(serviceFilter.toLowerCase())) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        b.bookingId.toLowerCase().includes(term) ||
        b.customerName.toLowerCase().includes(term) ||
        b.customerPhone.includes(term) ||
        b.serviceName.toLowerCase().includes(term) ||
        b.address.locality.toLowerCase().includes(term)
      );
    }
    return true;
  });

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
            <span className="text-[#043927] font-bold">All Bookings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            All Bookings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage and track all customer bookings across locations.
          </p>
        </div>

        {/* Create Booking Button */}
        <button
          onClick={() => setCreateBookingModalOpen(true)}
          className="bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Booking</span>
        </button>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Bookings */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === 'all' ? 'border-[#043927] ring-2 ring-[#043927]/10' : 'border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#043927] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">248</h3>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> 12% vs last month
          </span>
        </div>

        {/* New / Pending */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              New / Pending
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">18</h3>
          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> 28% vs last month
          </span>
        </div>

        {/* Ongoing */}
        <div
          onClick={() => setActiveTab('ongoing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === 'ongoing' ? 'border-sky-500 ring-2 ring-sky-500/10' : 'border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Ongoing
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">32</h3>
          <span className="text-[10px] font-bold text-sky-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> 10% vs last month
          </span>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === 'completed' ? 'border-emerald-600 ring-2 ring-emerald-600/10' : 'border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">186</h3>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> 15% vs last month
          </span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => setActiveTab('cancelled')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            activeTab === 'cancelled' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">12</h3>
          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> 20% vs last month
          </span>
        </div>
      </div>

      {/* Filter Bar Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-3">
          {/* Select Date Range */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#043927]" />
            <span>01 Sep 2026 - 16 Sep 2026</span>
          </div>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold"
          >
            <option value="all">All Locations</option>
            <option value="kondapur">Kondapur</option>
            <option value="madhapur">Madhapur</option>
            <option value="gachibowli">Gachibowli</option>
            <option value="manikonda">Manikonda</option>
            <option value="kukatpally">Kukatpally</option>
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold"
          >
            <option value="all">All Services</option>
            <option value="home cleaning">Home Cleaning</option>
            <option value="deep cleaning">Deep Cleaning</option>
            <option value="bathroom cleaning">Bathroom Cleaning</option>
            <option value="sofa cleaning">Sofa Cleaning</option>
          </select>

          {/* All Maids Filter */}
          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="all">All Maids</option>
            <option value="assigned">Assigned Only</option>
            <option value="unassigned">Unassigned Only</option>
          </select>

          {/* Payment Status Filter */}
          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cod">COD</option>
          </select>

          {/* Status Filter */}
          <select className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 font-bold">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="ongoing">Ongoing</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={exportBookingsToCSV}
          className="bg-[#043927] hover:bg-[#064e3b] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Tabs Row & Search Box */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#043927] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All (248)
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#043927] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            New / Pending (18)
          </button>

          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-[#043927] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ongoing (32)
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#043927] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed (186)
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-[#043927] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled (12)
          </button>

          <button
            onClick={() => setActiveTab('rescheduled')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'rescheduled'
                ? 'bg-[#043927] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rescheduled (8)
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search bookings..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043927]/20"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Assigned Maid</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBookings.map((b, idx) => (
                <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
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
                  <td className="py-3.5 px-3 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{b.serviceName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-800">{b.address.locality}</div>
                    <div className="text-[10px] text-slate-400">Hyderabad</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    <div className="font-bold">{b.date}</div>
                    <div className="text-[10px] text-slate-400">{b.timeSlot}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    {b.assignedMaidName ? (
                      <div className="flex items-center gap-2">
                        {b.assignedMaidPhotoUrl && (
                          <img
                            src={b.assignedMaidPhotoUrl}
                            alt={b.assignedMaidName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{b.assignedMaidName}</div>
                          <div className="text-[10px] text-amber-600 font-bold">★ {b.assignedMaidRating || 4.8}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        Not Assigned
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-slate-900">₹{b.totalAmount}</td>
                  <td className="py-3.5 px-3">
                    {b.paymentStatus === 'paid' ? (
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] border border-emerald-200/60">
                        Paid
                      </span>
                    ) : (
                      <span className="bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-full text-[10px] border border-sky-200/60">
                        COD
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    {b.status === 'completed' && (
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        Completed
                      </span>
                    )}
                    {b.status === 'ongoing' && (
                      <span className="bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        Ongoing
                      </span>
                    )}
                    {(b.status === 'pending_assignment' || b.status === 'new') && (
                      <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        Pending
                      </span>
                    )}
                    {b.status === 'cancelled' && (
                      <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        Cancelled
                      </span>
                    )}
                    {b.status === 'rescheduled' && (
                      <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        Rescheduled
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.status === 'pending_assignment' || b.status === 'new' ? (
                        <button
                          onClick={() => openAssignMaid(b.bookingId)}
                          className="bg-[#043927] hover:bg-[#064e3b] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          Assign
                        </button>
                      ) : b.status === 'ongoing' ? (
                        <button
                          onClick={() => openBookingDetails(b.bookingId)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          Track
                        </button>
                      ) : (
                        <button
                          onClick={() => openBookingDetails(b.bookingId)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          View
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <div>Showing 1 to {filteredBookings.length} of 248 bookings</div>

          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              &lt;
            </button>
            <button className="px-3 py-1 rounded-lg bg-[#043927] text-white font-black cursor-pointer">
              1
            </button>
            <button className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              2
            </button>
            <button className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              3
            </button>
            <span>...</span>
            <button className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              25
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white cursor-pointer">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
