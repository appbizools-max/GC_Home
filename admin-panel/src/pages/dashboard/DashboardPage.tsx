import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Plus,
  ChevronRight,
  MapPin,
  Sparkles,
  Phone,
  Eye,
} from 'lucide-react';
import { RedFlagAlertsBanner } from '../../components/RedFlagAlertsBanner';
import { QuickAccessPanel } from '../../components/QuickAccessPanel';
import { StatusBadge } from '../../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const {
    getDashboardMetrics,
    bookings,
    maids,
    setCurrentTab,
    openAssignMaid,
    openBookingDetails,
    setCreateBookingModalOpen,
    exportBookingsToCSV,
    selectedTimezone,
    finalizeSlotAdmin,
    resolveRedFlagAdmin,
  } = useAdmin();

  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (): string => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);

      let hour = parseInt(hourStr, 10);
      if (isNaN(hour)) hour = now.getHours();

      if (hour >= 5 && hour < 12) {
        return 'Good Morning, Admin! 👋';
      } else if (hour >= 12 && hour < 17) {
        return 'Good Afternoon, Admin! 👋';
      } else if (hour >= 17 && hour < 21) {
        return 'Good Evening, Admin! 👋';
      } else {
        return 'Good Night, Admin! 👋';
      }
    } catch {
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) return 'Good Morning, Admin! 👋';
      if (hour >= 12 && hour < 17) return 'Good Afternoon, Admin! 👋';
      if (hour >= 17 && hour < 21) return 'Good Evening, Admin! 👋';
      return 'Good Night, Admin! 👋';
    }
  };

  const metrics = getDashboardMetrics();

  const recentBookings = bookings.slice(0, 5);
  const ongoingBookings = bookings.filter(
    b => ['ongoing', 'in_progress', 'en_route', 'arrived', 'cleaning_started', 'maid_assigned', 'maid_accepted'].includes(b.status)
  );
  const pendingBookings = bookings.filter(b => b.status === 'pending_assignment');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => 
    b.date === today || (b.createdAt && b.createdAt.startsWith(today))
  ).sort((a, b) => {
    const timeA = a.timeSlot || '00:00';
    const timeB = b.timeSlot || '00:00';
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-8">
      {/* Top Banner & Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Admin Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitor platform performance, bookings, dispatch, and partner network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50/80 border border-emerald-100 rounded-full px-4 py-2 text-xs text-emerald-900 font-medium shadow-sm">
            <span className="italic">“A cleaner home makes a happier tomorrow.”</span>
            <span className="text-[10px] text-emerald-700 font-bold">— GC HOME+</span>
          </div>

          <button
            onClick={() => setCreateBookingModalOpen(true)}
            className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* ── CONSOLIDATED QUICK ACCESS PANEL ── */}
      <QuickAccessPanel
        onNewBooking={() => setCreateBookingModalOpen(true)}
        onNavigateTab={setCurrentTab}
      />

      {/* ── PRE-SERVICE SLOT CONFIRMATION & RED FLAG ALERTS BANNER ── */}
      <RedFlagAlertsBanner
        bookings={bookings}
        onFinalizeSlot={finalizeSlotAdmin}
        onResolveRedFlag={resolveRedFlagAdmin}
      />

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div
          onClick={() => setCurrentTab('all-bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#E8F5E9] text-[#123D2A] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <h3 className="text-3xl font-black text-[#0A192F] mt-0.5">
              {bookings.length}
            </h3>
          </div>
        </div>

        {/* Ongoing Bookings */}
        <div
          onClick={() => setCurrentTab('ongoing-bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Ongoing Bookings
            </span>
            <h3 className="text-3xl font-black text-[#0A192F] mt-0.5">
              {ongoingBookings.length}
            </h3>
          </div>
        </div>

        {/* Pending Bookings */}
        <div
          onClick={() => setCurrentTab('pending-bookings')}
          className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-amber-50/20"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
              Pending Bookings
            </span>
            <h3 className="text-3xl font-black text-amber-600 mt-0.5">
              {pendingBookings.length}
            </h3>
          </div>
        </div>

        {/* Completed Jobs */}
        <div
          onClick={() => setCurrentTab('completed-bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Completed Jobs
            </span>
            <h3 className="text-3xl font-black text-[#0A192F] mt-0.5">
              {completedBookings.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 7 Cols / Right 5 Cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (Recent Bookings + Ongoing/Completed cards) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Recent Bookings Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-[#0A192F]">Recent Bookings</h3>
              <button
                onClick={() => setCurrentTab('all-bookings')}
                className="text-xs font-bold text-[#123D2A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              {recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No bookings found</p>
                  <p className="text-xs text-slate-400 mt-1">Create a new booking to get started</p>
                  <button
                    onClick={() => setCreateBookingModalOpen(true)}
                    className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Booking</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recentBookings.map((b, idx) => (
                      <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-extrabold text-[#123D2A]">{b.bookingId}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {b.customerAvatar && (
                              <img
                                src={b.customerAvatar}
                                alt={b.customerName}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{b.customerName}</div>
                              <div className="text-[10px] text-slate-400">{b.customerPhone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold">{b.serviceName}</td>
                        <td className="py-3 px-3 text-slate-500">
                          {b.date} <br />
                          <span className="text-[10px] text-slate-400">{b.timeSlot}</span>
                        </td>
                        <td className="py-3 px-3">
                          {b.status === 'completed' && (
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Completed
                            </span>
                          )}
                          {['ongoing', 'in_progress', 'cleaning_started'].includes(b.status) && (
                            <span className="bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Ongoing
                            </span>
                          )}
                          {['pending_assignment', 'new'].includes(b.status) && (
                            <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Pending
                            </span>
                          )}
                          {['maid_assigned', 'maid_accepted', 'en_route', 'arrived'].includes(b.status) && (
                            <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Scheduled
                            </span>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openBookingDetails(b.bookingId)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Ongoing & Completed Cards Grid */}
          {(ongoingBookings.length > 0 || completedBookings.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Ongoing Bookings List */}
              {ongoingBookings.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-[#0A192F]">Ongoing Bookings</h3>
                    <button
                      onClick={() => setCurrentTab('ongoing-bookings')}
                      className="text-xs font-bold text-[#123D2A] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {ongoingBookings.slice(0, 3).map(b => (
                      <div
                        key={b.bookingId}
                        className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {b.customerAvatar && (
                            <img
                              src={b.customerAvatar}
                              alt={b.customerName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              {b.customerName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {b.serviceName}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{b.address?.locality || 'Location'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openBookingDetails(b.bookingId)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer"
                        >
                          Track
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Bookings List */}
              {completedBookings.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-[#0A192F]">Completed Bookings</h3>
                    <button
                      onClick={() => setCurrentTab('completed-bookings')}
                      className="text-xs font-bold text-[#123D2A] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {completedBookings.slice(0, 3).map(b => (
                      <div
                        key={b.bookingId}
                        className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {b.customerAvatar && (
                            <img
                              src={b.customerAvatar}
                              alt={b.customerName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="text-xs font-extrabold text-slate-900">
                              {b.customerName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {b.serviceName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {b.completedAt ? new Date(b.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Completed'}
                            </div>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side (Today's Schedule) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Today's Schedule Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-[#0A192F]">Today's Schedule</h3>
              <button
                onClick={() => setCurrentTab('all-bookings')}
                className="text-xs font-bold text-[#123D2A] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeline List */}
            <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-slate-100">
              {todayBookings.length === 0 ? (
                <div className="text-center py-8 -ml-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">No bookings scheduled for today</p>
                </div>
              ) : (
                todayBookings.slice(0, 6).map((b, idx) => (
                  <div key={b.bookingId} className="relative">
                    <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      b.status === 'completed' ? 'bg-emerald-500' :
                      ['ongoing', 'in_progress', 'cleaning_started', 'arrived', 'en_route'].includes(b.status) ? 'bg-sky-500' :
                      b.status === 'pending_assignment' ? 'bg-amber-500' :
                      'bg-purple-500'
                    }`}></span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-400">{b.timeSlot || 'TBD'}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        b.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        ['ongoing', 'in_progress', 'cleaning_started', 'arrived', 'en_route'].includes(b.status) ? 'bg-sky-50 text-sky-700' :
                        b.status === 'pending_assignment' ? 'bg-amber-50 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {b.status === 'completed' ? 'Completed' :
                         ['ongoing', 'in_progress', 'cleaning_started'].includes(b.status) ? 'Ongoing' :
                         b.status === 'pending_assignment' ? 'Pending' :
                         ['maid_assigned', 'maid_accepted', 'en_route', 'arrived'].includes(b.status) ? 'Scheduled' :
                         'Active'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs mt-0.5">{b.customerName}</div>
                    <div className="text-[11px] text-slate-500">
                      {b.serviceName} • {b.address?.locality || b.address?.city || 'Location'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


