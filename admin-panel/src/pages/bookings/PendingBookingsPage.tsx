import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking } from '../../types';
import { PaginationControls } from '../../components/PaginationControls';
import {
  Clock,
  ChevronRight,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Search,
  Calendar,
  CheckCircle2,
  Send,
  MapPin,
  Eye,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';

// Helper: Calculate aging in minutes from createdAt
const calculateAgingMinutes = (createdAt?: string, fallbackMinutes?: number): number => {
  if (fallbackMinutes !== undefined && fallbackMinutes > 0) return fallbackMinutes;
  if (!createdAt) return 0;
  const createdDate = new Date(createdAt);
  if (isNaN(createdDate.getTime())) return 0;
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
  return Math.floor(diffMs / 60000);
};

// Helper: Format aging minutes to human readable string
const formatAging = (minutes: number): string => {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const remMins = minutes % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hr`;
};

// Helper: Mask customer phone number to protect privacy
const maskPhoneNumber = (phone?: string): string => {
  if (!phone) return '—';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  // e.g. +91 98765 43210 -> +91 98XXX XX210
  return clean.replace(/(\+?\d{2,3})?\s*(\d{2})\d{4,5}(\d{2,4})/, (_m, p1, p2, p3) => {
    return `${p1 ? p1 + ' ' : ''}${p2}XXX XX${p3}`;
  });
};

// Customer Avatar with Initials Fallback
const CustomerAvatar: React.FC<{ avatarUrl?: string; name: string }> = ({ avatarUrl, name }) => {
  const [imageError, setImageError] = useState(false);
  const initials = (name || 'Customer')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'C';

  if (!avatarUrl || imageError) {
    return (
      <div
        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-xs select-none shadow-2xs"
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      onError={() => setImageError(true)}
      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
    />
  );
};

export const PendingBookingsPage: React.FC = () => {
  const {
    bookings,
    openAssignMaid,
    openBookingDetails,
    refreshBookings,
  } = useAdmin();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'waiting' | 'booking_time' | 'newest'>('waiting');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter pending bookings: only bookings waiting for partner assignment or acceptance
  const pendingBookings = useMemo(() => {
    return bookings.filter(b => {
      // Exclude terminal or actively working jobs
      if (['completed', 'cancelled', 'rejected', 'customer_confirmed', 'payment_settled'].includes(b.status)) {
        return false;
      }
      if (['ongoing', 'in_progress', 'en_route', 'arrived', 'cleaning_started'].includes(b.status)) {
        return false;
      }

      // Included if pending assignment or partner acceptance
      return (
        b.status === 'pending_assignment' ||
        b.status === 'new' ||
        b.status === 'pending_approval' ||
        b.assignmentStatus === 'unassigned' ||
        b.assignmentStatus === 'searching' ||
        b.assignmentStatus === 'partner_offered' ||
        (b.status === 'maid_assigned' && b.assignmentStatus === 'partner_offered') ||
        !b.assignedMaidId
      );
    });
  }, [bookings]);

  // Derive dynamic locations & services for filters
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    pendingBookings.forEach(b => {
      const loc = b.address?.locality || b.address?.city;
      if (loc && loc.trim()) set.add(loc.trim());
    });
    return Array.from(set).sort();
  }, [pendingBookings]);

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    pendingBookings.forEach(b => {
      if (b.serviceName && b.serviceName.trim()) set.add(b.serviceName.trim());
    });
    return Array.from(set).sort();
  }, [pendingBookings]);

  // Real-Data KPI Metrics
  const kpiMetrics = useMemo(() => {
    const totalPending = pendingBookings.length;

    // Unassigned: no partner assigned and no active request sent
    const unassigned = pendingBookings.filter(b => {
      const isOffered = b.assignmentStatus === 'partner_offered';
      return !b.assignedMaidId && !isOffered;
    }).length;

    // Waiting for assignment: active bookings waiting for dispatch/resolution
    const waitingForAssignment = pendingBookings.length;

    // Partner Requests Pending: request already sent to partner, awaiting response
    const partnerRequestsPending = pendingBookings.filter(b => {
      return b.assignmentStatus === 'partner_offered';
    }).length;

    return {
      totalPending,
      unassigned,
      waitingForAssignment,
      partnerRequestsPending,
    };
  }, [pendingBookings]);

  // Handle manual data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshBookings) {
        await refreshBookings();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Filter & Sort Logic
  const filteredBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return pendingBookings
      .filter(b => {
        // Location Filter
        if (locationFilter !== 'all') {
          const loc = (b.address?.locality || b.address?.city || '').toLowerCase();
          if (!loc.includes(locationFilter.toLowerCase())) return false;
        }

        // Service Filter
        if (serviceFilter !== 'all' && b.serviceName !== serviceFilter) {
          return false;
        }

        // Date Filter
        if (dateFilter === 'today') {
          const bookingDate = b.date || (b.createdAt ? b.createdAt.split(' ')[0] : '');
          if (bookingDate !== todayStr && !bookingDate.includes('Today')) return false;
        } else if (dateFilter === 'tomorrow') {
          const bookingDate = b.date || '';
          if (bookingDate !== tomorrowStr && !bookingDate.includes('Tomorrow')) return false;
        }

        // Payment Filter
        if (paymentFilter === 'paid' && b.paymentStatus !== 'paid') return false;
        if (paymentFilter === 'pending' && b.paymentStatus === 'paid') return false;

        // Assignment Status Filter
        if (assignmentStatusFilter === 'unassigned') {
          if (b.assignmentStatus === 'partner_offered' || b.assignedMaidId) return false;
        } else if (assignmentStatusFilter === 'request_sent') {
          if (b.assignmentStatus !== 'partner_offered') return false;
        } else if (assignmentStatusFilter === 'rejected') {
          if (b.assignmentStatus !== 'rejected') return false;
        }

        // Search Query
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchCode = b.bookingId.toLowerCase().includes(q);
          const matchCustomer = b.customerName.toLowerCase().includes(q);
          const matchPhone = (b.customerPhone || '').toLowerCase().includes(q);
          const matchService = b.serviceName.toLowerCase().includes(q);
          const matchLoc = (b.address?.locality || b.address?.city || '').toLowerCase().includes(q);

          if (!matchCode && !matchCustomer && !matchPhone && !matchService && !matchLoc) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'waiting') {
          const agingA = calculateAgingMinutes(a.createdAt, a.waitingMinutes);
          const agingB = calculateAgingMinutes(b.createdAt, b.waitingMinutes);
          return agingB - agingA; // Longest waiting first
        } else if (sortBy === 'booking_time') {
          const timeA = `${a.date} ${a.timeSlot}`;
          const timeB = `${b.date} ${b.timeSlot}`;
          return timeA.localeCompare(timeB);
        } else {
          // Newest created first
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
      });
  }, [
    pendingBookings,
    locationFilter,
    serviceFilter,
    dateFilter,
    paymentFilter,
    assignmentStatusFilter,
    searchTerm,
    sortBy,
  ]);

  // Paginated Rows
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    const pageIds = paginatedBookings.map(b => b.bookingId);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(merged);
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
    if (selectedIds.length === 0) return;
    // Safely route to the Assign Partner page for the first selected booking
    const firstSelected = selectedIds[0];
    openAssignMaid(firstSelected);
  };

  // Helper for assignment status badge & action label
  const renderAssignmentInfo = (b: Booking) => {
    const isRequestSent = b.assignmentStatus === 'partner_offered';
    const isRejected = b.assignmentStatus === 'rejected';
    const isAccepted = b.assignmentStatus === 'accepted' || (b.status === 'maid_assigned' && !isRequestSent);

    if (isRequestSent) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <Send className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
            Request Sent
          </span>
        ),
        actionButton: (
          <button
            onClick={() => openAssignMaid(b.bookingId)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Request</span>
          </button>
        ),
      };
    }

    if (isRejected) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <XCircle className="w-2.5 h-2.5 text-rose-600" />
            Partner Rejected
          </span>
        ),
        actionButton: (
          <button
            onClick={() => openAssignMaid(b.bookingId)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Find Partner</span>
          </button>
        ),
      };
    }

    if (isAccepted) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Partner Accepted
          </span>
        ),
        actionButton: (
          <button
            onClick={() => openBookingDetails(b.bookingId)}
            className="bg-[#123D2A] hover:bg-[#184a34] text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        ),
      };
    }

    // Default: Unassigned
    return {
      badge: (
        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <Clock className="w-2.5 h-2.5 text-slate-500" />
          Unassigned
        </span>
      ),
      actionButton: (
        <button
          onClick={() => openAssignMaid(b.bookingId)}
          className="bg-[#123D2A] hover:bg-[#184a34] text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assign Partner</span>
        </button>
      ),
    };
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-10">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#123D2A] font-bold">New / Pending Bookings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            New / Pending Bookings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Bookings waiting for partner assignment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            title="Refresh pending bookings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#123D2A]' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 4 Simplified KPI Metric Cards with Real Supabase Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. New / Pending */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              New / Pending
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A192F]">{kpiMetrics.totalPending}</h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">
              Awaiting partner dispatch
            </span>
          </div>
        </div>

        {/* 2. Unassigned */}
        <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
              Unassigned
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-700">{kpiMetrics.unassigned}</h3>
            <span className="text-[10px] font-bold text-amber-600 mt-1 block">
              No partner request sent yet
            </span>
          </div>
        </div>

        {/* 3. Waiting for Assignment */}
        <div className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">
              Waiting for Assignment
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600">{kpiMetrics.waitingForAssignment}</h3>
            <span className="text-[10px] font-bold text-rose-600 mt-1 block">
              Active operational queue
            </span>
          </div>
        </div>

        {/* 4. Partner Requests Pending */}
        <div className="p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider">
              Partner Requests Pending
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-purple-700">{kpiMetrics.partnerRequestsPending}</h3>
            <span className="text-[10px] font-bold text-purple-600 mt-1 block">
              Awaiting partner acceptance
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Filter Group */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={e => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#123D2A] cursor-pointer"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={e => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#123D2A] cursor-pointer"
            >
              <option value="all">All Services</option>
              {uniqueServices.map(srv => (
                <option key={srv} value={srv}>{srv}</option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#123D2A] cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={e => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#123D2A] cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid (Online)</option>
              <option value="pending">Pending / COD</option>
            </select>

            {/* Assignment Status Filter */}
            <select
              value={assignmentStatusFilter}
              onChange={e => {
                setAssignmentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#123D2A] cursor-pointer"
            >
              <option value="all">All Assignment Statuses</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="request_sent">Request Sent (Awaiting)</option>
              <option value="rejected">Partner Rejected</option>
            </select>
          </div>

          {/* Search Bar & Sort Dropdown */}
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ID, customer, phone, location..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#123D2A] font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 shrink-0">
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="waiting">Urgency (Waiting Longest)</option>
                <option value="booking_time">Earliest Booking Time</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Header & Bulk Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0A192F]">
            Pending Bookings ({filteredBookings.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Operational queue for assigning available partners to pending bookings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="text-xs font-bold text-[#123D2A] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              {selectedIds.length} booking{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          )}

          <button
            onClick={handleBulkAssign}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
              selectedIds.length > 0
                ? 'bg-[#123D2A] hover:bg-[#184a34] text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{selectedIds.length > 0 ? `Bulk Assign (${selectedIds.length})` : 'Bulk Assign'}</span>
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedBookings.length > 0 &&
                      paginatedBookings.every(b => selectedIds.includes(b.bookingId))
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#123D2A] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Booking Time</th>
                <th className="py-3 px-3">Waiting</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Assignment Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedBookings.map(b => {
                const waitMins = calculateAgingMinutes(b.createdAt, b.waitingMinutes);
                const isUrgent = waitMins >= 15;
                const isNeedsAttention = waitMins >= 5 && waitMins < 15;
                const { badge: statusBadge, actionButton } = renderAssignmentInfo(b);

                return (
                  <tr key={b.bookingId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.bookingId)}
                        onChange={() => toggleSelectOne(b.bookingId)}
                        className="rounded border-slate-300 text-[#123D2A] cursor-pointer"
                      />
                    </td>

                    {/* Booking ID */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => openBookingDetails(b.bookingId)}
                        className="font-extrabold text-[#123D2A] hover:underline font-mono text-xs cursor-pointer"
                      >
                        {b.bookingId}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <CustomerAvatar avatarUrl={b.customerAvatar} name={b.customerName} />
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{b.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {maskPhoneNumber(b.customerPhone)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[170px]" title={b.serviceName}>
                          {b.serviceName}
                        </span>
                        {b.selectedAddOns && b.selectedAddOns.length > 0 && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            + {b.selectedAddOns.length} add-on{b.selectedAddOns.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]" title={b.address?.locality || b.address?.city}>
                          {b.address?.locality || b.address?.city || 'Hyderabad'}
                        </span>
                      </div>
                    </td>

                    {/* Booking Time */}
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-bold text-xs">
                        {b.date || 'Today'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {b.timeSlot || '10:00 AM'}
                      </div>
                    </td>

                    {/* Waiting Aging */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isNeedsAttention
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
                        <span>{formatAging(waitMins)}</span>
                      </span>
                    </td>

                    {/* Payment */}
                    <td className="py-3 px-3">
                      {b.paymentStatus === 'paid' ? (
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-200/60">
                          Paid
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-200/60">
                          {b.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                        </span>
                      )}
                    </td>

                    {/* Assignment Status */}
                    <td className="py-3 px-3">
                      {statusBadge}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {actionButton}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">
                      {pendingBookings.length === 0 ? 'No pending bookings' : 'No bookings match your filters'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {pendingBookings.length === 0
                        ? 'All bookings have been assigned to partners.'
                        : 'Try adjusting your search criteria, dates, or status filters.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredBookings.length}
            pageSize={pageSize}
            onPageChange={p => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* Mobile Card Layout (Touch-friendly for small viewports) */}
      <div className="md:hidden flex flex-col gap-3">
        {paginatedBookings.map(b => {
          const waitMins = calculateAgingMinutes(b.createdAt, b.waitingMinutes);
          const isUrgent = waitMins >= 15;
          const isNeedsAttention = waitMins >= 5 && waitMins < 15;
          const { badge: statusBadge, actionButton } = renderAssignmentInfo(b);

          return (
            <div
              key={b.bookingId}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.bookingId)}
                    onChange={() => toggleSelectOne(b.bookingId)}
                    className="rounded border-slate-300 text-[#123D2A]"
                  />
                  <button
                    onClick={() => openBookingDetails(b.bookingId)}
                    className="font-extrabold text-[#123D2A] font-mono text-xs hover:underline"
                  >
                    {b.bookingId}
                  </button>
                </div>
                {statusBadge}
              </div>

              <div className="flex items-center gap-3">
                <CustomerAvatar avatarUrl={b.customerAvatar} name={b.customerName} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm">{b.customerName}</div>
                  <div className="text-xs text-slate-400 font-medium">
                    {maskPhoneNumber(b.customerPhone)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Service:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">
                    {b.serviceName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Schedule:</span>
                  <span className="font-bold text-slate-800">
                    {b.date || 'Today'} • {b.timeSlot || '10:00 AM'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Location:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[180px]">
                    {b.address?.locality || b.address?.city || 'Hyderabad'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Waiting:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      isUrgent
                        ? 'bg-rose-100 text-rose-700'
                        : isNeedsAttention
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {formatAging(waitMins)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Payment</span>
                  <span className="text-xs font-bold text-slate-800">
                    {b.paymentStatus === 'paid' ? 'Paid Online' : 'Pending / COD'}
                  </span>
                </div>
                <div>{actionButton}</div>
              </div>
            </div>
          );
        })}

        {paginatedBookings.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No pending bookings found</p>
            <p className="text-xs text-slate-400 mt-0.5">All bookings have been assigned or match no filters.</p>
          </div>
        )}

        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredBookings.length}
          pageSize={pageSize}
          onPageChange={p => setCurrentPage(p)}
        />
      </div>
    </div>
  );
};

