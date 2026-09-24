import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Booking } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  RotateCcw,
  UserCheck,
  UserX,
  MapPin,
  ChevronRight,
  Eye,
  Filter,
} from 'lucide-react';

// Resilient Customer Avatar with initials fallback
const CustomerAvatar: React.FC<{ avatarUrl?: string; name: string; size?: string }> = ({
  avatarUrl,
  name,
  size = 'w-8 h-8',
}) => {
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
        className={`${size} rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-[10px] select-none shadow-2xs`}
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
      className={`${size} rounded-full object-cover border border-slate-200 shrink-0`}
    />
  );
};

// Resilient Partner Avatar with initials fallback
const PartnerAvatar: React.FC<{ photoUrl?: string; name: string; size?: string }> = ({
  photoUrl,
  name,
  size = 'w-6 h-6',
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = (name || 'Partner')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  if (!photoUrl || imageError) {
    return (
      <div
        className={`${size} rounded-full bg-emerald-100 text-[#123D2A] font-black flex items-center justify-center shrink-0 border border-emerald-200 text-[9px] select-none`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      onError={() => setImageError(true)}
      className={`${size} rounded-full object-cover border border-slate-200 shrink-0`}
    />
  );
};

export const AllBookingsPage: React.FC = () => {
  const {
    bookings,
    openAssignMaid,
    openBookingDetails,
    setCreateBookingModalOpen,
  } = useAdmin();

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Helper to determine if a booking requires partner assignment
  const isBookingPendingAssignment = (b: Booking): boolean => {
    return (
      b.status === 'pending_assignment' ||
      b.status === 'new' ||
      b.status === 'pending_approval' ||
      b.assignmentStatus === 'searching' ||
      b.assignmentStatus === 'unassigned' ||
      !b.assignedMaidName
    );
  };

  // Real-Data KPI Counts (Summary metrics)
  const kpiCounts = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => isBookingPendingAssignment(b)).length,
      ongoing: bookings.filter(b =>
        ['ongoing', 'in_progress', 'en_route', 'arrived', 'cleaning_started', 'partner_accepted', 'maid_assigned', 'maid_accepted', 'scheduled'].includes(
          b.status
        )
      ).length,
      completed: bookings.filter(
        b => b.status === 'completed' || b.status === 'customer_confirmed' || b.status === 'payment_settled'
      ).length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
  }, [bookings]);

  // Unique dynamic options for dropdowns
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => {
      const loc = b.address?.locality || b.address?.city;
      if (loc && loc.trim()) set.add(loc.trim());
    });
    return Array.from(set).sort();
  }, [bookings]);

  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => {
      if (b.serviceName && b.serviceName.trim()) set.add(b.serviceName.trim());
    });
    return Array.from(set).sort();
  }, [bookings]);

  // Check if filters are active
  const isFilterActive =
    dateRangePreset !== 'all' ||
    locationFilter !== 'all' ||
    serviceFilter !== 'all' ||
    partnerFilter !== 'all' ||
    paymentFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setDateRangePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setLocationFilter('all');
    setServiceFilter('all');
    setPartnerFilter('all');
    setPaymentFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Helper: Date range filter evaluation
  const isDateMatching = (dateStr: string | undefined): boolean => {
    if (dateRangePreset === 'all' || !dateRangePreset) return true;
    if (!dateStr) return false;

    const bDate = new Date(dateStr);
    if (isNaN(bDate.getTime())) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());

    if (dateRangePreset === 'today') {
      return bDay.getTime() === today.getTime();
    }
    if (dateRangePreset === 'tomorrow') {
      return bDay.getTime() === tomorrow.getTime();
    }
    if (dateRangePreset === 'last7days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return bDay >= sevenDaysAgo && bDay <= tomorrow;
    }
    if (dateRangePreset === 'thismonth') {
      return bDay.getFullYear() === today.getFullYear() && bDay.getMonth() === today.getMonth();
    }
    if (dateRangePreset === 'lastmonth') {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return bDay >= lastMonthStart && bDay <= lastMonthEnd;
    }
    if (dateRangePreset === 'custom') {
      if (customStartDate) {
        const sDate = new Date(customStartDate);
        if (bDay < sDate) return false;
      }
      if (customEndDate) {
        const eDate = new Date(customEndDate);
        if (bDay > eDate) return false;
      }
      return true;
    }
    return true;
  };

  // Status mapping helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending_assignment' || s === 'new' || s === 'pending_approval' || s === 'searching') {
      return {
        label: 'Pending Assignment',
        style: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (s === 'assigned' || s === 'maid_assigned' || s === 'maid_accepted' || s === 'partner_accepted') {
      return {
        label: 'Assigned',
        style: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      };
    }
    if (s === 'ongoing' || s === 'in_progress' || s === 'en_route' || s === 'arrived' || s === 'cleaning_started') {
      return {
        label: 'Ongoing',
        style: 'bg-sky-50 text-sky-800 border-sky-200',
      };
    }
    if (s === 'completed' || s === 'customer_confirmed' || s === 'payment_settled') {
      return {
        label: 'Completed',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    }
    if (s === 'cancelled') {
      return {
        label: 'Cancelled',
        style: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    }
    if (s === 'rescheduled') {
      return {
        label: 'Rescheduled',
        style: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    }
    return {
      label: status.replace(/_/g, ' '),
      style: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  // Payment badge helper
  const getPaymentBadge = (status: string, method?: string) => {
    const s = (status || '').toLowerCase();
    const m = (method || '').toLowerCase();

    if (s === 'paid') {
      return { label: 'Paid', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (s === 'failed') {
      return { label: 'Failed', style: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (s === 'refunded') {
      return { label: 'Refunded', style: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (m === 'cash' || m === 'cod') {
      return { label: 'COD', style: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
    return { label: 'Pending', style: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  // Masked phone helper
  const maskPhone = (phone?: string): string => {
    if (!phone) return '';
    const cleaned = phone.trim();
    if (cleaned.length < 8) return cleaned;
    const start = cleaned.slice(0, 5);
    const end = cleaned.slice(-2);
    return `${start} ••••• ${end}`;
  };

  // Service with add-ons helper
  const renderServiceField = (b: Booking) => {
    const serviceName = b.serviceName || 'Home Cleaning';
    const addOnsCount = (b.selectedAddOns || []).length;

    return (
      <div>
        <span className="font-bold text-slate-900 block truncate max-w-[170px]" title={serviceName}>
          {serviceName}
        </span>
        {addOnsCount > 0 && (
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-block mt-0.5">
            + {addOnsCount} add-on{addOnsCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  };

  // Main filtered bookings calculation
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Date Range
      if (!isDateMatching(b.date || b.createdAt)) return false;

      // 2. Location
      if (locationFilter !== 'all') {
        const loc = locationFilter.toLowerCase();
        const bLoc = (b.address?.locality || b.address?.city || '').toLowerCase();
        if (!bLoc.includes(loc)) return false;
      }

      // 3. Service
      if (serviceFilter !== 'all') {
        if ((b.serviceName || '').toLowerCase() !== serviceFilter.toLowerCase()) return false;
      }

      // 4. Partner
      if (partnerFilter !== 'all') {
        const hasPartner = Boolean(b.assignedMaidId || b.assignedMaidName);
        if (partnerFilter === 'assigned' && !hasPartner) return false;
        if (partnerFilter === 'unassigned' && hasPartner) return false;
      }

      // 5. Payment Status
      if (paymentFilter !== 'all') {
        const pStatus = (b.paymentStatus || '').toLowerCase();
        const pMethod = (b.paymentMethod || '').toLowerCase();
        if (paymentFilter === 'paid' && pStatus !== 'paid') return false;
        if (paymentFilter === 'pending' && pStatus !== 'pending') return false;
        if (paymentFilter === 'failed' && pStatus !== 'failed') return false;
        if (paymentFilter === 'refunded' && pStatus !== 'refunded') return false;
        if (paymentFilter === 'cod' && !(pMethod === 'cash' || pMethod === 'cod')) return false;
      }

      // 6. Status
      if (statusFilter !== 'all') {
        const s = (b.status || '').toLowerCase();
        if (statusFilter === 'pending') {
          if (!isBookingPendingAssignment(b)) return false;
        } else if (statusFilter === 'assigned') {
          if (!(s === 'assigned' || s === 'maid_assigned' || s === 'maid_accepted' || s === 'partner_accepted')) return false;
        } else if (statusFilter === 'ongoing') {
          if (!['ongoing', 'in_progress', 'en_route', 'arrived', 'cleaning_started'].includes(s)) return false;
        } else if (statusFilter === 'completed') {
          if (!(s === 'completed' || s === 'customer_confirmed' || s === 'payment_settled')) return false;
        } else if (statusFilter === 'cancelled') {
          if (s !== 'cancelled') return false;
        } else if (statusFilter === 'rescheduled') {
          if (s !== 'rescheduled') return false;
        }
      }

      // 7. Search Box (Booking ID, Customer Name, Phone, Service, Partner Name, Locality)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = (b.bookingId || '').toLowerCase().includes(q);
        const nameMatch = (b.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (b.customerPhone || '').includes(q);
        const srvMatch = (b.serviceName || '').toLowerCase().includes(q);
        const maidMatch = (b.assignedMaidName || '').toLowerCase().includes(q);
        const locMatch = (b.address?.locality || b.address?.city || '').toLowerCase().includes(q);

        if (!idMatch && !nameMatch && !phoneMatch && !srvMatch && !maidMatch && !locMatch) return false;
      }

      return true;
    });
  }, [
    bookings,
    dateRangePreset,
    customStartDate,
    customEndDate,
    locationFilter,
    serviceFilter,
    partnerFilter,
    paymentFilter,
    statusFilter,
    searchQuery,
  ]);

  // Server-like pagination
  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Export filtered bookings to CSV
  const handleExportCSV = () => {
    const headers = [
      'Booking ID',
      'Customer Name',
      'Customer Phone',
      'Service',
      'Location',
      'Date',
      'Time Slot',
      'Assigned Partner',
      'Amount',
      'Payment Status',
      'Status',
    ];
    const rows = filteredBookings.map(b => [
      `"${b.bookingId}"`,
      `"${b.customerName}"`,
      `"${b.customerPhone}"`,
      `"${b.serviceName}"`,
      `"${b.address?.locality || ''}"`,
      `"${b.date}"`,
      `"${b.timeSlot}"`,
      `"${b.assignedMaidName || 'Not Assigned'}"`,
      `"${b.totalAmount}"`,
      `"${b.paymentStatus}"`,
      `"${b.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GC_Home_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5 font-sans select-none pb-8 text-slate-800">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A192F] tracking-tight flex items-center gap-2">
            All Bookings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage and track all customer bookings across locations.
          </p>
        </div>

        <button
          onClick={() => setCreateBookingModalOpen(true)}
          className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99] self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Booking</span>
        </button>
      </div>

      {/* 2. 5 Summary KPI Cards (Real Data Only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Bookings */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'all'
              ? 'border-[#123D2A] ring-2 ring-[#123D2A]/10 shadow-sm'
              : 'border-slate-200 shadow-xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#123D2A] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.total}</h3>
          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Total recorded</span>
        </div>

        {/* New / Pending */}
        <div
          onClick={() => {
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
              : 'border-slate-200 shadow-xs hover:border-slate-300'
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
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.pending}</h3>
          <span className="text-[10px] font-bold text-amber-600 block mt-0.5">Awaiting assignment</span>
        </div>

        {/* Ongoing */}
        <div
          onClick={() => {
            setStatusFilter('ongoing');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'ongoing'
              ? 'border-sky-500 ring-2 ring-sky-500/10 shadow-sm'
              : 'border-slate-200 shadow-xs hover:border-slate-300'
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
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.ongoing}</h3>
          <span className="text-[10px] font-bold text-sky-600 block mt-0.5">Active in progress</span>
        </div>

        {/* Completed */}
        <div
          onClick={() => {
            setStatusFilter('completed');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'completed'
              ? 'border-emerald-600 ring-2 ring-emerald-600/10 shadow-sm'
              : 'border-slate-200 shadow-xs hover:border-slate-300'
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
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.completed}</h3>
          <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Fulfilled jobs</span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => {
            setStatusFilter('cancelled');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'cancelled'
              ? 'border-rose-500 ring-2 ring-rose-500/10 shadow-sm'
              : 'border-slate-200 shadow-xs hover:border-slate-300'
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
          <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.cancelled}</h3>
          <span className="text-[10px] font-bold text-rose-600 block mt-0.5">Cancelled jobs</span>
        </div>
      </div>

      {/* 3. Compact Filter Bar (Without Redundant Tab Bar) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5">
            <select
              value={dateRangePreset}
              onChange={e => {
                setDateRangePreset(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="last7days">Last 7 Days</option>
              <option value="thismonth">This Month</option>
              <option value="lastmonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateRangePreset === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                />
              </div>
            )}
          </div>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={e => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[130px] truncate"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={e => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[130px] truncate"
          >
            <option value="all">All Services</option>
            {uniqueServices.map(srv => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>

          {/* Partner Filter ("All Partners", "Assigned Only", "Unassigned Only") */}
          <select
            value={partnerFilter}
            onChange={e => {
              setPartnerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Partners</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={e => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cod">COD</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Assignment</option>
            <option value="assigned">Assigned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, customer, service, partner..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600"
            />
          </div>

          {/* Reset Button (rendered only when filters or search are active) */}
          {isFilterActive && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer animate-fadeIn"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Right Action: CSV Export */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleExportCSV}
            title="Export filtered bookings to CSV"
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" /> Export CSV
          </button>
        </div>
      </div>

      {/* 4. Main 10-Column Data Table (Scalable for thousands of bookings) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop & Tablet Table */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">Booking ID</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Customer</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Service</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Location</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Date & Time</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Assigned Partner</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Amount</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Payment</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedBookings.map(b => {
                const isPending = isBookingPendingAssignment(b);
                const statusBadge = getStatusBadge(b.status);
                const paymentBadge = getPaymentBadge(b.paymentStatus, b.paymentMethod);

                return (
                  <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Booking ID */}
                    <td className="py-3 px-3.5 font-extrabold text-[#123D2A] whitespace-nowrap">
                      {b.bookingId}
                    </td>

                    {/* 2. Customer */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <CustomerAvatar avatarUrl={b.customerAvatar} name={b.customerName} size="w-8 h-8" />
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{b.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{maskPhone(b.customerPhone)}</span>
                        </div>
                      </div>
                    </td>

                    {/* 3. Service */}
                    <td className="py-3 px-3.5">
                      {renderServiceField(b)}
                    </td>

                    {/* 4. Location */}
                    <td className="py-3 px-3.5 font-semibold text-slate-700 whitespace-nowrap">
                      {b.address?.locality || b.address?.city || 'Hyderabad'}
                    </td>

                    {/* 5. Date & Time */}
                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{b.date}</div>
                      <div className="text-[10px] text-slate-400">{b.timeSlot}</div>
                    </td>

                    {/* 6. Assigned Partner */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {b.assignedMaidName ? (
                        <div className="flex items-center gap-2">
                          <PartnerAvatar
                            photoUrl={b.assignedMaidPhotoUrl}
                            name={b.assignedMaidName}
                            size="w-6 h-6"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{b.assignedMaidName}</span>
                            {b.assignedMaidRating && (
                              <span className="text-[10px] text-amber-600 font-bold block">
                                ★ {b.assignedMaidRating}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md text-[10px] border border-slate-200">
                          Not Assigned
                        </span>
                      )}
                    </td>

                    {/* 7. Amount */}
                    <td className="py-3 px-3.5 font-extrabold text-slate-900 whitespace-nowrap">
                      ₹{b.totalAmount}
                    </td>

                    {/* 8. Payment */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentBadge.style}`}
                      >
                        {paymentBadge.label}
                      </span>
                    </td>

                    {/* 9. Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.style}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* 10. Action ([Assign] for Pending, [View] for others) */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {isPending ? (
                        <button
                          onClick={() => openAssignMaid(b.bookingId)}
                          className="bg-[#123D2A] hover:bg-[#184a34] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Assign
                        </button>
                      ) : (
                        <button
                          onClick={() => openBookingDetails(b.bookingId)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Calendar className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No bookings found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try changing your filters or date range.</p>
                    {isFilterActive && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Touch-Friendly Booking Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedBookings.map(b => {
            const isPending = isBookingPendingAssignment(b);
            const statusBadge = getStatusBadge(b.status);
            const paymentBadge = getPaymentBadge(b.paymentStatus, b.paymentMethod);

            return (
              <div key={b.bookingId} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#123D2A] text-xs">{b.bookingId}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-800 text-xs">{b.customerName}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.style}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Service</span>
                    <span className="font-bold text-slate-800">{b.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Schedule</span>
                    <span className="font-bold text-slate-800">{b.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Partner</span>
                    <span className="font-bold text-slate-800">
                      {b.assignedMaidName || 'Not Assigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Amount & Payment</span>
                    <span className="font-black text-slate-900">
                      ₹{b.totalAmount} ·{' '}
                      <span className="text-[10px] font-bold text-emerald-700">{paymentBadge.label}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {b.address?.locality || 'Hyderabad'}
                  </span>
                  {isPending ? (
                    <button
                      onClick={() => openAssignMaid(b.bookingId)}
                      className="px-3.5 py-1.5 bg-[#123D2A] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Assign
                    </button>
                  ) : (
                    <button
                      onClick={() => openBookingDetails(b.bookingId)}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {paginatedBookings.length === 0 && (
            <div className="py-12 text-center text-slate-400 px-4">
              <Calendar className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No bookings found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try changing your filters or date range.</p>
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Server-Style Pagination Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-600">
            Showing {filteredBookings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredBookings.length)} of {filteredBookings.length} bookings
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-[#123D2A] text-white text-xs font-black rounded-lg shadow-2xs">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

