import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { exportBookingsToCSV as exportFilteredBookings } from '../../utils/exportUtils';
import { Booking } from '../../types';
import {
  Calendar,
  User,
  Shield,
  Clock,
  Download,
  Search,
  Filter,
  Layers,
  Phone,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  ArrowRight,
  ArrowDown,
  MapPin,
  CalendarCheck,
} from 'lucide-react';

export const RescheduledBookingsPage: React.FC = () => {
  const { bookings, openBookingDetails } = useAdmin();

  // Strictly filter only rescheduled bookings from real Supabase dataset
  const rescheduledBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'rescheduled');
  }, [bookings]);

  // Selected booking for on-demand details drawer (never default to bookings[0] or mock data)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filters State
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [rescheduledByFilter, setRescheduledByFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [newScheduleFilter, setNewScheduleFilter] = useState<string>('all');
  const [customNewDate, setCustomNewDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBooking(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4 Real-Data KPI Calculations (No fake percentage comparisons)
  const totalRescheduledCount = rescheduledBookings.length;

  const customerRescheduledCount = useMemo(() => {
    return rescheduledBookings.filter(b => {
      const by = (b.rescheduledBy || 'Customer').toLowerCase();
      return by.includes('cust');
    }).length;
  }, [rescheduledBookings]);

  const partnerRescheduledCount = useMemo(() => {
    return rescheduledBookings.filter(b => {
      const by = (b.rescheduledBy || '').toLowerCase();
      return by.includes('maid') || by.includes('partner');
    }).length;
  }, [rescheduledBookings]);

  const adminRescheduledCount = useMemo(() => {
    return rescheduledBookings.filter(b => {
      const by = (b.rescheduledBy || '').toLowerCase();
      return by.includes('admin');
    }).length;
  }, [rescheduledBookings]);

  // Dynamic filter dropdown options derived from live rescheduled data
  const uniqueReasons = useMemo(() => {
    const set = new Set<string>();
    rescheduledBookings.forEach(b => {
      if (b.rescheduleReason) set.add(b.rescheduleReason.trim());
    });
    return Array.from(set).sort();
  }, [rescheduledBookings]);

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    rescheduledBookings.forEach(b => {
      if (b.serviceName) set.add(b.serviceName);
    });
    return Array.from(set).sort();
  }, [rescheduledBookings]);

  // Reference date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filter pipeline
  const filteredRescheduled = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return rescheduledBookings.filter(b => {
      // Date filter (based on booking date or created date)
      const bDateStr = b.date;
      if (dateFilter === 'today') {
        if (bDateStr !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        if (bDateStr !== yStr) return false;
      } else if (dateFilter === 'last7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const bDateObj = new Date(bDateStr);
        if (isNaN(bDateObj.getTime()) || bDateObj < sevenDaysAgo || bDateObj > now) return false;
      } else if (dateFilter === 'thisMonth') {
        if (!bDateStr || !bDateStr.startsWith(currentMonthStr)) return false;
      } else if (dateFilter === 'lastMonth') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        if (!bDateStr || !bDateStr.startsWith(lastMonthStr)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && bDateStr < customStartDate) return false;
        if (customEndDate && bDateStr > customEndDate) return false;
      }

      // Reason filter
      if (reasonFilter !== 'all') {
        if ((b.rescheduleReason || 'Reason not provided') !== reasonFilter) return false;
      }

      // Rescheduled By filter
      if (rescheduledByFilter !== 'all') {
        const by = (b.rescheduledBy || 'Customer').toLowerCase();
        if (rescheduledByFilter === 'Customer' && !by.includes('cust')) return false;
        if (rescheduledByFilter === 'Partner' && !by.includes('maid') && !by.includes('partner')) return false;
        if (rescheduledByFilter === 'Admin' && !by.includes('admin')) return false;
      }

      // Service filter
      if (serviceFilter !== 'all' && b.serviceName !== serviceFilter) {
        return false;
      }

      // New Scheduled Date filter
      if (newScheduleFilter !== 'all') {
        const newDateStr = b.rescheduledTo ? b.rescheduledTo.split(',')[0].trim() : b.date;
        if (newScheduleFilter === 'today') {
          if (b.date !== todayStr) return false;
        } else if (newScheduleFilter === 'tomorrow') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tStr = tomorrow.toISOString().split('T')[0];
          if (b.date !== tStr) return false;
        } else if (newScheduleFilter === 'thisWeek') {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          const bDateObj = new Date(b.date);
          if (isNaN(bDateObj.getTime()) || bDateObj < today || bDateObj > endOfWeek) return false;
        } else if (newScheduleFilter === 'customDate') {
          if (customNewDate && b.date !== customNewDate) return false;
        }
      }

      // Search query filter (Booking ID, Customer Name, Customer Phone, Service, Partner Name)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (b.bookingId || '').toLowerCase().includes(q);
        const matchCust = (b.customerName || '').toLowerCase().includes(q);
        const matchPhone = (b.customerPhone || '').toLowerCase().includes(q);
        const matchPartner = (b.assignedMaidName || '').toLowerCase().includes(q);
        const matchService = (b.serviceName || '').toLowerCase().includes(q);

        if (!matchId && !matchCust && !matchPhone && !matchPartner && !matchService) {
          return false;
        }
      }

      return true;
    });
  }, [
    rescheduledBookings,
    dateFilter,
    customStartDate,
    customEndDate,
    reasonFilter,
    rescheduledByFilter,
    serviceFilter,
    newScheduleFilter,
    customNewDate,
    searchQuery,
    todayStr,
    currentMonthStr,
  ]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, customStartDate, customEndDate, reasonFilter, rescheduledByFilter, serviceFilter, newScheduleFilter, customNewDate, searchQuery]);

  // Pagination calculations
  const totalRecords = filteredRescheduled.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRescheduled.slice(start, start + pageSize);
  }, [filteredRescheduled, currentPage, pageSize]);

  // Handle Export (Respects active filtered dataset)
  const handleExport = () => {
    if (filteredRescheduled.length === 0) {
      alert('No rescheduled bookings to export with current filters.');
      return;
    }
    exportFilteredBookings(filteredRescheduled);
  };

  // Helper: Mask phone number for privacy
  const maskPhone = (phone?: string) => {
    if (!phone) return '-';
    const clean = phone.trim();
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 4)} ••••• ${clean.slice(-2)}`;
  };

  // Helper: Rescheduled By Badge
  const getRescheduledByBadge = (by?: string) => {
    const norm = (by || 'Customer').toLowerCase();
    if (norm.includes('cust')) {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          Customer
        </span>
      );
    }
    if (norm.includes('maid') || norm.includes('partner')) {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          Partner
        </span>
      );
    }
    if (norm.includes('admin')) {
      return (
        <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          Admin
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
        {by || 'Customer'}
      </span>
    );
  };

  // Helper: Status Badge
  const getStatusBadge = (status?: string) => {
    const s = (status || 'rescheduled').toLowerCase();
    if (s === 'completed') {
      return (
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          Completed
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="bg-rose-50 text-rose-800 border border-rose-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          Cancelled
        </span>
      );
    }
    if (['cleaning_started', 'in_progress', 'ongoing', 'en_route', 'arrived'].includes(s)) {
      return (
        <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
          Ongoing
        </span>
      );
    }
    return (
      <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
        Upcoming
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span>Bookings</span> ➔ <span className="text-[#123D2A] font-bold">Rescheduled Bookings</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rescheduled Bookings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View and manage bookings that were moved to a different date or time.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredRescheduled.length === 0}
          className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
          title="Export filtered rescheduled bookings to CSV"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* 4 Clean Real-Data KPI Cards (No fake percentages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Rescheduled */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100 flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Rescheduled</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">{totalRescheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Customer Rescheduled */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 border border-rose-100 flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Customer Rescheduled</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">{customerRescheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Partner Rescheduled */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 border border-purple-100 flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Partner Rescheduled</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">{partnerRescheduledCount}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Admin Rescheduled */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-100 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Admin Rescheduled</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">{adminRescheduledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1">
            {/* Date Range Dropdown */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Reschedule Reason Dropdown */}
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={reasonFilter}
                onChange={e => setReasonFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">All Reasons</option>
                {uniqueReasons.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Rescheduled By Dropdown */}
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={rescheduledByFilter}
                onChange={e => setRescheduledByFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">Rescheduled By: All</option>
                <option value="Customer">Customer</option>
                <option value="Partner">Partner</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Service Dropdown */}
            <div className="relative">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">All Services</option>
                {uniqueServices.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* New Scheduled Date Dropdown */}
            <div className="relative">
              <CalendarCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={newScheduleFilter}
                onChange={e => setNewScheduleFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-6 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">New Date: All</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="thisWeek">This Week</option>
                <option value="customDate">Custom Date</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer, partner, service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-8 py-2 rounded-xl focus:outline-none focus:border-emerald-600 font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Filters */}
        {(dateFilter === 'custom' || newScheduleFilter === 'customDate') && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Date Range:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}

            {newScheduleFilter === 'customDate' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Target New Date:</span>
                <input
                  type="date"
                  value={customNewDate}
                  onChange={e => setCustomNewDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Full-Width Rescheduled Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden w-full flex flex-col justify-between min-h-[460px]">
        <div>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rescheduled Bookings ({totalRecords})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Bookings moved to a different schedule with clear reason and status.
              </p>
            </div>
            {totalRecords > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 border-b border-slate-200/80 uppercase tracking-wider">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Original Schedule</th>
                  <th className="py-3 px-4">New Schedule</th>
                  <th className="py-3 px-4">Rescheduled By</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {paginatedBookings.map(job => {
                  const addOnsCount = job.selectedAddOns?.length || 0;
                  const originalScheduleText = job.rescheduledFrom || `${job.date}${job.timeSlot ? ` · ${job.timeSlot}` : ''}`;
                  const newScheduleText = job.rescheduledTo || `${job.date}${job.timeSlot ? ` · ${job.timeSlot}` : ''}`;

                  return (
                    <tr
                      key={job.bookingId}
                      onClick={() => setSelectedBooking(job)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-bold text-blue-700 group-hover:underline">
                        {job.bookingId}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {job.customerAvatar ? (
                            <img
                              src={job.customerAvatar}
                              alt={job.customerName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px] border border-slate-200">
                              {job.customerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                            {job.customerName}
                          </span>
                        </div>
                      </td>

                      {/* Service (+ add-on tag if present) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{job.serviceName}</span>
                          {addOnsCount > 0 && (
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-emerald-100">
                              + {addOnsCount} {addOnsCount === 1 ? 'add-on' : 'add-ons'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Partner */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {job.assignedMaidName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      {/* Original Schedule */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap line-through decoration-slate-300">
                        {originalScheduleText}
                      </td>

                      {/* New Schedule */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#123D2A]">
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{newScheduleText}</span>
                        </div>
                      </td>

                      {/* Rescheduled By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRescheduledByBadge(job.rescheduledBy)}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[150px] truncate" title={job.rescheduleReason || 'Reason not provided'}>
                        {job.rescheduleReason || 'Reason not provided'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedBooking(job);
                          }}
                          className="border border-slate-200 hover:border-[#123D2A] hover:bg-[#123D2A] hover:text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty State */}
                {filteredRescheduled.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <RotateCcw className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-slate-700">No rescheduled bookings found.</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Try changing the date range or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Server/Client Pagination Bar */}
        {filteredRescheduled.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} rescheduled bookings
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const hasGap = prevPage && page - prevPage > 1;
                  return (
                    <React.Fragment key={page}>
                      {hasGap && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${
                          currentPage === page
                            ? 'bg-[#123D2A] text-white'
                            : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Demand Reschedule Details Slide-over Drawer (Opens only when a booking is selected) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedBooking(null)}
          />

          {/* Slide-over Content Drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-50 p-6 border-l border-slate-200">
            <div className="flex flex-col gap-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {selectedBooking.bookingId}
                    </h3>
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                    Rescheduled Booking Record
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Close Details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customer Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedBooking.customerAvatar ? (
                    <img
                      src={selectedBooking.customerAvatar}
                      alt={selectedBooking.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm">
                      {selectedBooking.customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedBooking.customerName}</h4>
                    <span className="text-xs font-semibold text-slate-500 block">
                      {maskPhone(selectedBooking.customerPhone)}
                    </span>
                  </div>
                </div>

                {/* Communication buttons if phone exists */}
                {selectedBooking.customerPhone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedBooking.customerPhone}`}
                      className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                      title="Call Customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://wa.me/${selectedBooking.customerPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-lg bg-[#2D8A68] text-white hover:bg-emerald-800 flex items-center justify-center transition-colors"
                      title="Message Customer on WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Service & Partner Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Primary Service</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBooking.serviceName}</span>
                </div>

                {selectedBooking.selectedAddOns && selectedBooking.selectedAddOns.length > 0 && (
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px] mb-1">Add-ons</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBooking.selectedAddOns.map((addon: any, idx: number) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded text-[11px] font-semibold"
                        >
                          {addon.name || addon.title || `Add-on #${idx + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partner Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 font-semibold block text-[11px]">Assigned Partner</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedBooking.assignedMaidName || 'Unassigned Partner'}
                    </span>
                    {typeof selectedBooking.assignedMaidRating === 'number' && (
                      <span className="font-extrabold text-amber-500 flex items-center gap-1 text-xs">
                        ★ {selectedBooking.assignedMaidRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Schedule Comparison Box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-900 block">Schedule Comparison</span>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Original Schedule
                      </span>
                      <span className="font-bold text-slate-600 line-through decoration-slate-400 text-xs block mt-0.5">
                        {selectedBooking.rescheduledFrom || `${selectedBooking.date} ${selectedBooking.timeSlot || ''}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-0.5 text-emerald-600">
                    <ArrowDown className="w-4 h-4" />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                      New Schedule
                    </span>
                    <span className="font-black text-[#123D2A] text-sm block mt-0.5">
                      {selectedBooking.rescheduledTo || `${selectedBooking.date} ${selectedBooking.timeSlot || ''}`}
                    </span>
                  </div>
                </div>

                {/* Rescheduled By & Reason */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-semibold block text-[10px]">Rescheduled By</span>
                    <div className="mt-1">
                      {getRescheduledByBadge(selectedBooking.rescheduledBy)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-semibold block text-[10px]">Reason</span>
                    <span className="font-bold text-slate-900 block mt-1">
                      {selectedBooking.rescheduleReason || 'Reason not provided'}
                    </span>
                  </div>
                </div>

                {/* Location / Area */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Location & Locality</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">
                    {selectedBooking.address?.locality || selectedBooking.address?.city}
                  </p>
                  {selectedBooking.address?.street && (
                    <p className="text-[11px] text-slate-600 font-medium">
                      {selectedBooking.address.street}, {selectedBooking.address.city} - {selectedBooking.address.pincode}
                    </p>
                  )}
                </div>

                {/* Customer Note */}
                {selectedBooking.customerNote && (
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 space-y-1">
                    <span className="text-[11px] font-bold text-amber-900 block">Customer Note</span>
                    <p className="text-xs text-amber-950 font-medium italic">
                      "{selectedBooking.customerNote}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  const id = selectedBooking.bookingId;
                  setSelectedBooking(null);
                  openBookingDetails(id);
                }}
                className="w-full bg-[#123D2A] hover:bg-emerald-950 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4 text-emerald-300" />
                <span>View Full Booking Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescheduledBookingsPage;

