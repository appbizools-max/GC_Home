import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking } from '../../types';
import {
  CheckCircle2,
  Calendar,
  IndianRupee,
  Star,
  Download,
  Search,
  MapPin,
  Layers,
  User,
  Phone,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
} from 'lucide-react';

export const CompletedBookingsPage: React.FC = () => {
  const { bookings, exportBookingsToCSV, openBookingDetails } = useAdmin();

  // Strictly filter only completed bookings
  const completedBookings = bookings.filter(b => b.status === 'completed');

  const [selectedBooking, setSelectedBooking] = useState<Booking>(completedBookings[0] || bookings[0]);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtered dataset
  const filteredCompleted = completedBookings.filter(b => {
    if (locationFilter !== 'all' && b.address.locality !== locationFilter) return false;
    if (serviceFilter !== 'all' && !b.serviceName.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchId = b.bookingId.toLowerCase().includes(q);
      const matchCust = b.customerName.toLowerCase().includes(q);
      const matchMaid = (b.assignedMaidName || '').toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchMaid) return false;
    }
    return true;
  });

  const totalCompletedCount = 186;
  const completedTodayCount = 18;
  const totalRevenueAmount = '₹92,340';
  const averageRatingScore = '4.8';

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span>Bookings</span> ➔ <span className="text-emerald-700 font-bold">Completed Bookings</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Completed Bookings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View all successfully completed cleaning services.
          </p>
        </div>

        <button
          onClick={exportBookingsToCSV}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* 4 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Today */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Completed Today</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{completedTodayCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 20% <span className="text-slate-400 font-normal">vs yesterday</span></span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed This Month */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Completed This Month</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{totalCompletedCount}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 15% <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Revenue</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{totalRevenueAmount}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 18% <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>

        {/* Card 4: Average Rating */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
            <Star className="w-5 h-5 fill-purple-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Average Rating</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{averageRatingScore}</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ 0.2 <span className="text-slate-400 font-normal">vs last month</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">01 Sep 2026 - 16 Sep 2026</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
          </div>

          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Locations</option>
              <option value="Kondapur">Kondapur</option>
              <option value="Madhapur">Madhapur</option>
              <option value="Gachibowli">Gachibowli</option>
            </select>
          </div>

          <div className="relative">
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none"
            >
              <option value="all">All Services</option>
              <option value="Home Cleaning">Home Cleaning</option>
              <option value="Deep Cleaning">Deep Cleaning</option>
              <option value="Bathroom">Bathroom Cleaning</option>
            </select>
          </div>

          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none">
              <option value="all">All Maids</option>
              <option value="Pavani">Pavani M.</option>
              <option value="Laxmi">Laxmi T.</option>
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search completed bookings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Side: Table & Pagination */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Completed Bookings ({totalCompletedCount})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  All successfully completed cleaning services.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 border-b border-slate-200/80 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Maid</th>
                    <th className="py-3 px-4">Completed Time</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredCompleted.slice(0, 10).map((job, idx) => {
                    const isSelected = selectedBooking?.bookingId === job.bookingId;
                    return (
                      <tr
                        key={job.bookingId}
                        onClick={() => {
                          setSelectedBooking(job);
                          setShowSummaryDrawer(true);
                        }}
                        className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-600 hover:underline">
                          {job.bookingId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                job.customerAvatar ||
                                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
                              }
                              alt={job.customerName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{job.customerName}</span>
                              <span className="text-[11px] text-slate-400 block">{job.customerPhone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{job.serviceName}</td>
                        <td className="py-3.5 px-4">
                          {job.assignedMaidName ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  job.assignedMaidPhotoUrl ||
                                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
                                }
                                alt={job.assignedMaidName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-800 block leading-tight">
                                  {job.assignedMaidName}
                                </span>
                                <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-0.5">
                                  ★ {job.assignedMaidRating || 4.9}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {job.completedAt || '16 Sep 2026, 02:10 PM'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">₹{job.totalAmount}</td>
                        <td className="py-3.5 px-4 font-extrabold text-amber-500 flex items-center gap-1">
                          ★ 5.0
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedBooking(job);
                              setShowSummaryDrawer(true);
                            }}
                            className="border border-slate-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-2xs"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>Showing 1 to 10 of {totalCompletedCount} completed bookings</span>
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#043927] text-white flex items-center justify-center font-bold">1</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">2</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">3</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">4</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">5</button>
              <span>...</span>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">19</button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Booking Summary Drawer */}
        {showSummaryDrawer && selectedBooking && (
          <div className="w-full lg:w-[380px] bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 flex-shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Booking Summary</h3>
              <button onClick={() => setShowSummaryDrawer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">{selectedBooking.bookingId}</h4>
                <span className="text-[11px] text-slate-400 font-medium">Completed on 16 Sep 2026, 02:10 PM</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full">
                Completed
              </span>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'details' ? 'border-b-2 border-emerald-600 text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 text-center py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'timeline' ? 'border-b-2 border-emerald-600 text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Customer Box */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-3">
                <img
                  src={selectedBooking.customerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'}
                  alt={selectedBooking.customerName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{selectedBooking.customerName}</h5>
                  <span className="text-xs font-semibold text-slate-500 block">{selectedBooking.customerPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a href={`tel:${selectedBooking.customerPhone}`} className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/${selectedBooking.customerPhone}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Service & Details */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-700 font-medium">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Service</span>
                <span className="font-bold text-slate-900 block">{selectedBooking.serviceName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Address</span>
                <span className="font-bold text-slate-800 block">
                  {selectedBooking.address.street}, {selectedBooking.address.locality}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Assigned Maid</span>
                <span className="font-bold text-slate-800 block">{selectedBooking.assignedMaidName || 'Pavani M.'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Duration</span>
                  <span className="font-bold text-slate-900 block">2 hrs 10 mins</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">Amount</span>
                  <span className="font-black text-slate-900 block">₹{selectedBooking.totalAmount} (Paid via UPI)</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Rating</span>
                <span className="font-extrabold text-amber-500 flex items-center gap-1 text-sm">
                  ★ 5.0
                </span>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60">
                <span className="text-[11px] font-bold text-amber-900 block">Customer Note</span>
                <p className="text-xs text-amber-950 font-medium mt-0.5">
                  "Great service! Very professional and on time."
                </p>
              </div>
            </div>

            {/* Before & After Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  Before & After Photos
                </span>
                <button className="text-[11px] font-bold text-blue-600 hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <img
                    src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80"
                    alt="Before"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold text-center block mt-1">Before</span>
                </div>
                <div>
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"
                    alt="After"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold text-center block mt-1">After</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => openBookingDetails(selectedBooking.bookingId)}
              className="w-full bg-[#043927] hover:bg-emerald-950 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-2"
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>View Full Booking Details</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedBookingsPage;
