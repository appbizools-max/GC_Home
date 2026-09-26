import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking, BookingStatus } from '../../types';
import { formatDateDDMMYYYY } from '../../utils/bookingDisplayUtils';
import {
  Play,
  Car,
  MapPin,
  Sparkles,
  CheckCircle2,
  Search,
  Eye,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Layers,
  AlertCircle,
  X,
  Clock,
  ShieldCheck,
  RefreshCw,
  Phone,
} from 'lucide-react';

export const OngoingBookingsPage: React.FC = () => {
  const { bookings, markJobAsCompleted, openBookingDetails, selectedTimezone } = useAdmin();

  // Filter strictly for ongoing/active job statuses
  const ongoingBookings = useMemo(() => {
    return bookings.filter(b =>
      ['maid_assigned', 'maid_accepted', 'en_route', 'arrived', 'cleaning_started', 'in_progress', 'ongoing'].includes(b.status)
    );
  }, [bookings]);

  // Filters State
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Confirmation Modal State for Mark Completed
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  // 3 Simplified KPI Counts
  const totalOngoing = ongoingBookings.length;
  const enRouteCount = ongoingBookings.filter(b => b.status === 'en_route').length;
  const cleaningNowCount = ongoingBookings.filter(b =>
    ['cleaning_started', 'in_progress', 'ongoing'].includes(b.status)
  ).length;

  // Dynamic filter dropdown options derived from live ongoing data
  const uniqueLocalities = useMemo(() => {
    const set = new Set<string>();
    ongoingBookings.forEach(b => {
      const loc = b.address?.locality || b.address?.city;
      if (loc) set.add(loc);
    });
    return Array.from(set);
  }, [ongoingBookings]);

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    ongoingBookings.forEach(b => {
      if (b.serviceName) set.add(b.serviceName);
    });
    return Array.from(set);
  }, [ongoingBookings]);

  const uniquePartners = useMemo(() => {
    const set = new Set<string>();
    ongoingBookings.forEach(b => {
      if (b.assignedMaidName) set.add(b.assignedMaidName);
    });
    return Array.from(set);
  }, [ongoingBookings]);

  // Filter pipeline
  const filteredJobs = useMemo(() => {
    return ongoingBookings.filter(b => {
      if (locationFilter !== 'all') {
        const loc = b.address?.locality || b.address?.city;
        if (loc !== locationFilter) return false;
      }
      if (serviceFilter !== 'all' && b.serviceName !== serviceFilter) {
        return false;
      }
      if (partnerFilter !== 'all' && b.assignedMaidName !== partnerFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (b.bookingId || '').toLowerCase().includes(q);
        const matchCust = (b.customerName || '').toLowerCase().includes(q);
        const matchPartner = (b.assignedMaidName || '').toLowerCase().includes(q);
        const matchLoc = (b.address?.locality || b.address?.city || '').toLowerCase().includes(q);
        const matchSvc = (b.serviceName || '').toLowerCase().includes(q);
        if (!matchId && !matchCust && !matchPartner && !matchLoc && !matchSvc) return false;
      }
      return true;
    });
  }, [ongoingBookings, locationFilter, serviceFilter, partnerFilter, searchQuery]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Status Badge Component
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'en_route':
        return (
          <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 border border-purple-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            <span>En Route</span>
          </span>
        );
      case 'arrived':
        return (
          <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Arrived</span>
          </span>
        );
      case 'cleaning_started':
      case 'in_progress':
      case 'ongoing':
        return (
          <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Cleaning</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  // Execution handler for completing a booking after confirmation
  const handleConfirmCompletion = async () => {
    if (!confirmingBooking) return;
    setIsCompleting(true);
    try {
      await markJobAsCompleted(confirmingBooking.bookingId);
      setConfirmingBooking(null);
    } catch (err: any) {
      alert(`Error completing job: ${err?.message || 'Failed to complete.'}`);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-slate-800 font-sans pb-12 select-none">
      {/* ── 1. COMPACT HEADER ROW ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Dashboard</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>Bookings</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-emerald-700 font-bold">Ongoing Bookings</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0A192F] tracking-tight">
          Ongoing Bookings
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Track active service jobs
        </p>
      </div>

      {/* ── 2. 3 COMPACT KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Ongoing Jobs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-[#123D2A] ml-0.5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                Ongoing Jobs
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                {totalOngoing}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Active
          </span>
        </div>

        {/* Card 2: En Route */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                En Route
              </span>
              <span className="text-2xl font-black text-purple-900 mt-0.5 block">
                {enRouteCount}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
            Traveling
          </span>
        </div>

        {/* Card 3: Cleaning Now */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                Cleaning Now
              </span>
              <span className="text-2xl font-black text-blue-900 mt-0.5 block">
                {cleaningNowCount}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
            In Service
          </span>
        </div>
      </div>

      {/* ── 3. FILTER TOOLBAR: [Location] [Service] [Partner] [Search] ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full md:w-auto flex-1 max-w-2xl">
          {/* Location Filter */}
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={locationFilter}
              onChange={e => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none truncate"
            >
              <option value="all">All Locations</option>
              {uniqueLocalities.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div className="relative">
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={serviceFilter}
              onChange={e => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none truncate"
            >
              <option value="all">All Services</option>
              {uniqueServices.map(svc => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Partner Filter */}
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={partnerFilter}
              onChange={e => {
                setPartnerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold pl-8 pr-7 py-2 rounded-xl focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none truncate"
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
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ongoing bookings..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-8 pr-8 py-2 rounded-xl focus:outline-none focus:border-emerald-600 font-medium placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. ONGOING BOOKINGS TABLE (FULL WIDTH, NO LIVE TRACKING SIDEBAR) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full flex flex-col">
        {/* Table Title Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#0A192F]">Ongoing Bookings</h3>
            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-xs">
              {filteredJobs.length}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Timezone: {selectedTimezone || 'Asia/Kolkata'}
          </span>
        </div>

        {/* ── 5. COMPACT EMPTY STATE (WHEN 0 ONGOING BOOKINGS) ── */}
        {filteredJobs.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">No ongoing jobs</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no active service jobs.
            </p>
            {(locationFilter !== 'all' || serviceFilter !== 'all' || partnerFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setLocationFilter('all');
                  setServiceFilter('all');
                  setPartnerFilter('all');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 text-[10px] font-extrabold text-slate-400 border-b border-slate-200/80 uppercase tracking-wider">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3">Partner</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedJobs.map(job => (
                    <tr key={job.bookingId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-black text-[#123D2A]">
                        #{job.bookingId}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-tight">
                            {job.customerName}
                          </span>
                          <a
                            href={`tel:${job.customerPhone}`}
                            className="text-[10px] text-slate-500 hover:text-emerald-700 font-medium inline-flex items-center gap-1 mt-0.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {job.customerPhone}
                          </a>
                        </div>
                      </td>

                      {/* Service with Addons breakdown */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 leading-tight">
                          {job.serviceName}
                        </div>
                        {job.selectedAddOns && job.selectedAddOns.length > 0 && (
                          <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                            +{job.selectedAddOns.length} Add-on{job.selectedAddOns.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      {/* Partner */}
                      <td className="py-3.5 px-3">
                        {job.assignedMaidName ? (
                          <div className="flex items-center gap-2">
                            {job.assignedMaidPhotoUrl ? (
                              <img
                                src={job.assignedMaidPhotoUrl}
                                alt={job.assignedMaidName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold text-[10px]">
                                {job.assignedMaidName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-extrabold text-slate-800">
                              {job.assignedMaidName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-3 font-semibold text-slate-600">
                        <div>{formatDateDDMMYYYY(job.date) || 'Today'}</div>
                        <div className="text-[10px] text-slate-400">{job.timeSlot || 'Anytime'}</div>
                      </td>

                      {/* Location (Locality, Area only) */}
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                            {job.address?.locality || job.address?.city || 'Hyderabad'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">{getStatusBadge(job.status)}</td>

                      {/* Actions: View and Mark Completed */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openBookingDetails(job.bookingId)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setConfirmingBooking(job)}
                            className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1 active:scale-95"
                          >
                            <Check className="w-3 h-3 text-emerald-300" />
                            <span>Complete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100 text-xs">
              {paginatedJobs.map(job => (
                <div key={job.bookingId} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#123D2A] text-xs">#{job.bookingId}</span>
                    {getStatusBadge(job.status)}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{job.serviceName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer: <strong>{job.customerName}</strong> • {job.customerPhone}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Partner: <strong>{job.assignedMaidName || 'Unassigned'}</strong>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{formatDateDDMMYYYY(job.date) || 'Today'} • {job.timeSlot || 'Anytime'}</span>
                      <span>•</span>
                      <span>{job.address?.locality || job.address?.city || 'Hyderabad'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                    <button
                      onClick={() => openBookingDetails(job.bookingId)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setConfirmingBooking(job)}
                      className="bg-[#123D2A] hover:bg-[#184a34] text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Complete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Showing{' '}
                <strong className="text-slate-800">
                  {Math.min((currentPage - 1) * pageSize + 1, filteredJobs.length)}–
                  {Math.min(currentPage * pageSize, filteredJobs.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filteredJobs.length}</strong> jobs
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#123D2A] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 6. CONFIRMATION MODAL FOR MARK COMPLETED ── */}
      {confirmingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#123D2A] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0A192F]">
                  Confirm Job Completion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mark booking <strong>#{confirmingBooking.bookingId}</strong> as completed?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Service:</span>
                <span className="font-extrabold text-slate-900">{confirmingBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-900">{confirmingBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Assigned Partner:</span>
                <span className="font-bold text-emerald-800">
                  {confirmingBooking.assignedMaidName || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="font-semibold text-slate-700">
                  {confirmingBooking.address?.locality || confirmingBooking.address?.city || 'Hyderabad'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmingBooking(null)}
                disabled={isCompleting}
                className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompletion}
                disabled={isCompleting}
                className="flex-1 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
              >
                {isCompleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Completion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OngoingBookingsPage;


