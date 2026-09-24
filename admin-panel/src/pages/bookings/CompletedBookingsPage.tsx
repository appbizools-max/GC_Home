import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { exportBookingsToCSV as exportFilteredBookings } from '../../utils/exportUtils';
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
  Clock,
  CreditCard,
  Building,
  Check,
  Camera,
} from 'lucide-react';

export const CompletedBookingsPage: React.FC = () => {
  const { bookings, openBookingDetails } = useAdmin();

  // Strictly filter only completed bookings from real Supabase dataset
  const completedBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'completed');
  }, [bookings]);

  // Selected booking for on-demand details drawer (never default to bookings[0] or mock data)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filters State
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
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

  // Helper: Extract booking rating safely
  const getBookingRating = (booking: Booking): number | null => {
    if (booking.review && typeof booking.review.rating === 'number' && booking.review.rating > 0) {
      return booking.review.rating;
    }
    const anyB = booking as any;
    if (typeof anyB.rating === 'number' && anyB.rating > 0) {
      return anyB.rating;
    }
    if (typeof anyB.customerRating === 'number' && anyB.customerRating > 0) {
      return anyB.customerRating;
    }
    return null;
  };

  // 4 Real Supabase KPI Calculations (No fake percentage comparisons)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const completedTodayCount = useMemo(() => {
    return completedBookings.filter(b => {
      const bookingDate = b.completedAt ? b.completedAt.split('T')[0] : b.date;
      return bookingDate === todayStr;
    }).length;
  }, [completedBookings, todayStr]);

  const completedThisMonthCount = useMemo(() => {
    return completedBookings.filter(b => {
      const bookingDate = b.completedAt || b.date;
      return bookingDate && bookingDate.startsWith(currentMonthStr);
    }).length;
  }, [completedBookings, currentMonthStr]);

  const totalRevenueVal = useMemo(() => {
    return completedBookings
      .filter(b => b.paymentStatus === 'paid' || b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [completedBookings]);

  const averageRatingScore = useMemo(() => {
    const ratings = completedBookings
      .map(b => getBookingRating(b))
      .filter((r): r is number => r !== null);
    if (ratings.length === 0) return null;
    const avg = ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length;
    return avg.toFixed(1);
  }, [completedBookings]);

  // Dynamic filter dropdown options derived from real completed data
  const uniqueLocalities = useMemo(() => {
    const set = new Set<string>();
    completedBookings.forEach(b => {
      const loc = b.address?.locality || b.address?.city;
      if (loc) set.add(loc);
    });
    return Array.from(set).sort();
  }, [completedBookings]);

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    completedBookings.forEach(b => {
      if (b.serviceName) set.add(b.serviceName);
    });
    return Array.from(set).sort();
  }, [completedBookings]);

  const uniquePartners = useMemo(() => {
    const set = new Set<string>();
    completedBookings.forEach(b => {
      if (b.assignedMaidName) set.add(b.assignedMaidName);
    });
    return Array.from(set).sort();
  }, [completedBookings]);

  // Filter pipeline
  const filteredCompleted = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return completedBookings.filter(b => {
      // Date filter
      const bDateStr = b.completedAt ? b.completedAt.split('T')[0] : b.date;
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

      // Location filter
      if (locationFilter !== 'all') {
        const loc = b.address?.locality || b.address?.city;
        if (loc !== locationFilter) return false;
      }

      // Service filter
      if (serviceFilter !== 'all' && b.serviceName !== serviceFilter) {
        return false;
      }

      // Partner filter
      if (partnerFilter !== 'all' && b.assignedMaidName !== partnerFilter) {
        return false;
      }

      // Search query filter (Booking ID, Customer Name, Phone, Service, Partner Name, Locality)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (b.bookingId || '').toLowerCase().includes(q);
        const matchCust = (b.customerName || '').toLowerCase().includes(q);
        const matchPhone = (b.customerPhone || '').toLowerCase().includes(q);
        const matchPartner = (b.assignedMaidName || '').toLowerCase().includes(q);
        const matchService = (b.serviceName || '').toLowerCase().includes(q);
        const matchLoc = (b.address?.locality || b.address?.city || '').toLowerCase().includes(q);

        if (!matchId && !matchCust && !matchPhone && !matchPartner && !matchService && !matchLoc) {
          return false;
        }
      }

      return true;
    });
  }, [
    completedBookings,
    dateFilter,
    customStartDate,
    customEndDate,
    locationFilter,
    serviceFilter,
    partnerFilter,
    searchQuery,
    todayStr,
    currentMonthStr,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, customStartDate, customEndDate, locationFilter, serviceFilter, partnerFilter, searchQuery]);

  // Pagination calculations
  const totalRecords = filteredCompleted.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompleted.slice(start, start + pageSize);
  }, [filteredCompleted, currentPage, pageSize]);

  // Handle Export (Respects active filtered dataset)
  const handleExport = () => {
    if (filteredCompleted.length === 0) {
      alert('No completed bookings to export with current filters.');
      return;
    }
    exportFilteredBookings(filteredCompleted);
  };

  // Helper: Format date & time
  const formatCompletedDateTime = (booking: Booking): string => {
    if (booking.completedTimeFormatted) return booking.completedTimeFormatted;
    if (booking.completedAt) {
      try {
        const d = new Date(booking.completedAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {
        // fallback
      }
      return booking.completedAt;
    }
    return `${booking.date}${booking.timeSlot ? `, ${booking.timeSlot}` : ''}`;
  };

  // Helper: Mask phone number for authorized privacy
  const maskPhone = (phone?: string) => {
    if (!phone) return '-';
    const clean = phone.trim();
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 4)} ••••• ${clean.slice(-2)}`;
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span> ➔ <span>Bookings</span> ➔ <span className="text-[#123D2A] font-bold">Completed Bookings</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Completed Bookings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View successfully completed services, job metrics, and customer reviews.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredCompleted.length === 0}
          className="border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
          title="Export filtered completed bookings to CSV"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* 4 Clean Real-Data KPI Cards (No fake percentages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Today */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Completed Today</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">{completedTodayCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed This Month */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100 flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Completed This Month</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">{completedThisMonthCount}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-100 flex-shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Revenue</span>
            <div className="mt-0.5">
              <span className="text-2xl font-black text-slate-900">
                ₹{totalRevenueVal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Average Rating */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 border border-purple-100 flex-shrink-0">
            <Star className="w-6 h-6 fill-purple-600 text-purple-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Average Rating</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              {averageRatingScore ? (
                <>
                  <span className="text-2xl font-black text-slate-900">{averageRatingScore}</span>
                  <span className="text-xs font-bold text-amber-500 flex items-center">★</span>
                </>
              ) : (
                <span className="text-base font-bold text-slate-400">Not Rated</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {/* Date Range Dropdown */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
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

            {/* Location Dropdown */}
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">All Locations</option>
                {uniqueLocalities.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Dropdown */}
            <div className="relative">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">All Services</option>
                {uniqueServices.map(svc => (
                  <option key={svc} value={svc}>
                    {svc}
                  </option>
                ))}
              </select>
            </div>

            {/* Partner Dropdown (Consistently labeled "Partner") */}
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none"
              >
                <option value="all">All Partners</option>
                {uniquePartners.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
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

        {/* Custom Date Range Selector (Rendered only when Custom Range is active) */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="text-slate-400 text-xs">Custom Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer ml-auto"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Full-Width Completed Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden w-full flex flex-col justify-between min-h-[460px]">
        <div>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Completed Bookings ({totalRecords})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Successfully delivered services with verified payment and ratings.
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
                  <th className="py-3 px-4">Completed Date/Time</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {paginatedBookings.map(job => {
                  const rating = getBookingRating(job);
                  const addOnsCount = job.selectedAddOns?.length || 0;

                  return (
                    <tr
                      key={job.bookingId}
                      onClick={() => setSelectedBooking(job)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-bold text-[#123D2A] group-hover:underline">
                        {job.bookingId}
                      </td>

                      {/* Customer (Name & Compact Avatar only, no full address/phone) */}
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
                          <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                            {job.customerName}
                          </span>
                        </div>
                      </td>

                      {/* Service (+ add-on tag if present, no long description) */}
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

                      {/* Partner (Consistent Terminology) */}
                      <td className="py-3.5 px-4">
                        {job.assignedMaidName ? (
                          <div className="flex items-center gap-2">
                            {job.assignedMaidPhotoUrl ? (
                              <img
                                src={job.assignedMaidPhotoUrl}
                                alt={job.assignedMaidName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                                {job.assignedMaidName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-800 block leading-tight">
                                {job.assignedMaidName}
                              </span>
                              {typeof job.assignedMaidRating === 'number' && (
                                <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-0.5">
                                  ★ {job.assignedMaidRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Completed Date/Time */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatCompletedDateTime(job)}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{Number(job.totalAmount).toLocaleString('en-IN')}
                      </td>

                      {/* Rating (Clean Star or Not Rated) */}
                      <td className="py-3.5 px-4">
                        {rating !== null ? (
                          <span className="font-extrabold text-amber-500 flex items-center gap-1">
                            ★ {rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px]">Not Rated</span>
                        )}
                      </td>

                      {/* Action View Button */}
                      <td className="py-3.5 px-4 text-right">
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
                {filteredCompleted.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-slate-700">No completed bookings found.</p>
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
        {filteredCompleted.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} completed bookings
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

      {/* On-Demand Booking Details Slide-over Drawer (Opens only when a booking is selected) */}
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
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Completed
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                    Completed: {formatCompletedDateTime(selectedBooking)}
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
                    <div className="w-10 h-10 rounded-full bg-[#123D2A] text-white font-bold flex items-center justify-center text-sm">
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

              {/* Service Details */}
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

                {/* Schedule & Duration Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-semibold block text-[10px]">Service Date & Time</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {selectedBooking.date} {selectedBooking.timeSlot ? `• ${selectedBooking.timeSlot}` : ''}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 font-semibold block text-[10px]">Job Duration</span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {selectedBooking.durationFormatted || selectedBooking.serviceDuration || 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Location & Address */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Location & Locality</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">
                    {selectedBooking.address.locality || selectedBooking.address.city}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {selectedBooking.address.street}, {selectedBooking.address.city} - {selectedBooking.address.pincode}
                  </p>
                </div>

                {/* Payment Summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      Payment Method
                    </span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                      {selectedBooking.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-700">
                      {selectedBooking.paymentMethod || 'Online Payment'}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      ₹{Number(selectedBooking.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Rating & Customer Note */}
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900">Customer Rating</span>
                    {getBookingRating(selectedBooking) !== null ? (
                      <span className="font-black text-amber-600 text-xs flex items-center gap-1">
                        ★ {getBookingRating(selectedBooking)?.toFixed(1)} / 5.0
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-800">Not Rated</span>
                    )}
                  </div>
                  <p className="text-xs text-amber-950 font-medium italic">
                    {selectedBooking.review?.comment ||
                      selectedBooking.customerNote ||
                      'No written review provided by customer.'}
                  </p>
                </div>
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

export default CompletedBookingsPage;

