import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdmin, isLocationMatchingHub } from '../../context/AdminContext';
import { Booking } from '../../types';
import { supabase } from '../../config/supabase';
import { formatDateDDMMYYYY, getPaymentDisplayInfo } from '../../utils/bookingDisplayUtils';
import { PaginationControls } from '../../components/PaginationControls';
import {
  Calendar,
  Clock,
  Search,
  Download,
  RotateCcw,
  UserCheck,
  MapPin,
  Eye,
  Package,
  ChevronDown,
  X,
  Phone,
  AlertCircle,
  Layers,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [15, 25, 50, 75, 100];

export const AllBookingsPage: React.FC = () => {
  const {
    bookings,
    bookingsLoading,
    bookingsError,
    services,
    serviceAreas,
    maids,
    openAssignMaid,
    openBookingDetails,
    refreshBookings,
    selectedLocation,
  } = useAdmin();

  const [searchParams, setSearchParams] = useSearchParams();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Read URL search params for bookmarkable & refresh-persistent state
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '15', 10);
  const dateRangePreset = searchParams.get('date') || 'thismonth';
  const customStartDate = searchParams.get('startDate') || '';
  const customEndDate = searchParams.get('endDate') || '';
  const locationFilter = searchParams.get('location') || 'all';
  const serviceFilter = searchParams.get('service') || 'all';
  const partnerFilter = searchParams.get('partner') || 'all';
  const paymentMethodFilter = searchParams.get('payMethod') || 'all';
  const paymentStatusFilter = searchParams.get('payStatus') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : 15;

  // Selected booking for viewing add-on details modal
  const [selectedAddonsBooking, setSelectedAddonsBooking] = useState<Booking | null>(null);

  // Reset horizontal scroll to start at Column 1 (Booking ID) when page/status changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  }, [currentPage, pageSize, statusFilter, dateRangePreset]);

  // Helper to update URL params
  const updateUrlParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === '' ||
          (key === 'date' && val === 'thismonth') ||
          (key === 'location' && val === 'all') ||
          (key === 'service' && val === 'all') ||
          (key === 'partner' && val === 'all') ||
          (key === 'payMethod' && val === 'all') ||
          (key === 'payStatus' && val === 'all') ||
          (key === 'status' && val === 'all') ||
          (key === 'page' && val === '1') ||
          (key === 'pageSize' && val === '15')
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, val);
        }
      });
      return newParams;
    }, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ pageSize: String(newSize), page: '1' });
  };

  const handleDateChange = (date: string) => {
    updateUrlParams({ date, page: '1' });
  };

  const handleCustomStartDateChange = (startDate: string) => {
    updateUrlParams({ startDate, date: 'custom', page: '1' });
  };

  const handleCustomEndDateChange = (endDate: string) => {
    updateUrlParams({ endDate, date: 'custom', page: '1' });
  };

  const handleLocationChange = (location: string) => {
    updateUrlParams({ location, page: '1' });
  };

  const handleServiceChange = (service: string) => {
    updateUrlParams({ service, page: '1' });
  };

  const handlePartnerChange = (partner: string) => {
    updateUrlParams({ partner, page: '1' });
  };

  const handlePaymentMethodChange = (payMethod: string) => {
    updateUrlParams({ payMethod, page: '1' });
  };

  const handlePaymentStatusChange = (payStatus: string) => {
    updateUrlParams({ payStatus, page: '1' });
  };

  const handleStatusChange = (status: string) => {
    updateUrlParams({ status, page: '1' });
  };

  const handleSearchChange = (q: string) => {
    updateUrlParams({ q, page: '1' });
  };

  // Reset clears all filters and returns to page 1
  const resetFilters = () => {
    const newParams = new URLSearchParams();
    if (pageSize !== 15) {
      newParams.set('pageSize', String(pageSize));
    }
    setSearchParams(newParams, { replace: true });
  };

  // Realtime subscription for instant table updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-all-bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          if (refreshBookings) refreshBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshBookings]);

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

  // Real-Data KPI Counts (Summary metrics based on real database records)
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

  // Dynamic Service Area Localities
  const dynamicLocations = useMemo(() => {
    const locMap = new Map<string, string>();
    const activeAreas = (serviceAreas || []).filter(
      (sa: any) => sa.is_serviceable !== false && sa.is_active !== false
    );
    activeAreas.forEach((sa: any) => {
      const locality = (sa.locality || sa.locality_name || sa.zone_name)?.trim();
      if (locality) {
        locMap.set(locality.toLowerCase(), locality);
      }
    });

    bookings.forEach(b => {
      const bLoc = b.address?.locality?.trim();
      if (bLoc) {
        locMap.set(bLoc.toLowerCase(), bLoc);
      }
    });

    return Array.from(locMap.values()).sort((a, b) => a.localeCompare(b));
  }, [serviceAreas, bookings]);

  // Dynamic Services from Supabase Admin Master Catalog (services)
  const dynamicServices = useMemo(() => {
    const srvMap = new Map<string, string>();
    (services || []).forEach(s => {
      if (s.name && s.isActive !== false) {
        srvMap.set(s.name, s.name);
      }
    });
    // Also include any service names present in active bookings
    bookings.forEach(b => {
      if (b.serviceName?.trim()) {
        srvMap.set(b.serviceName.trim(), b.serviceName.trim());
      }
    });
    return Array.from(srvMap.values()).sort((a, b) => a.localeCompare(b));
  }, [services, bookings]);

  // Dynamic Partners from Supabase Approved Partner Records (maid_profiles)
  const dynamicPartners = useMemo(() => {
    const pMap = new Map<string, { id: string; name: string }>();
    (maids || []).forEach(m => {
      const name = m.fullName || 'Partner';
      const id = m.maidId || m.uid;
      if (m.status === 'approved' || (m.status as string) === 'active') {
        pMap.set(id, { id, name });
      }
    });
    // Also include any assigned partners present in bookings
    bookings.forEach(b => {
      if (b.assignedMaidName && b.assignedMaidId) {
        pMap.set(b.assignedMaidId, { id: b.assignedMaidId, name: b.assignedMaidName });
      }
    });
    return Array.from(pMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [maids, bookings]);

  // Helper: Date range filter evaluation (supports all requested date presets)
  const isDateMatching = (dateStr: string | undefined): boolean => {
    if (dateRangePreset === 'all') return true;
    if (!dateStr) return false;

    let bDate: Date;
    const trimmed = dateStr.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('-').map(Number);
      bDate = new Date(y, m - 1, d);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      bDate = new Date(y, m - 1, d);
    } else {
      bDate = new Date(trimmed);
    }
    if (isNaN(bDate.getTime())) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const bDay = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate());

    if (dateRangePreset === 'today') {
      return bDay.getTime() === today.getTime();
    }
    if (dateRangePreset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return bDay.getTime() === yesterday.getTime();
    }
    if (dateRangePreset === 'thisweek') {
      const dayOfWeek = today.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - distanceToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return bDay >= monday && bDay <= sunday;
    }
    if (dateRangePreset === 'thismonth') {
      return bDay.getFullYear() === today.getFullYear() && bDay.getMonth() === today.getMonth();
    }
    if (dateRangePreset === 'lastmonth') {
      const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      return bDay.getFullYear() === lastMonthYear && bDay.getMonth() === lastMonth;
    }
    if (dateRangePreset === 'last3months') {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return bDay >= threeMonthsAgo && bDay <= today;
    }
    if (dateRangePreset === 'custom') {
      if (customStartDate) {
        const s = new Date(customStartDate);
        const sDay = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        if (bDay < sDay) return false;
      }
      if (customEndDate) {
        const e = new Date(customEndDate);
        const eDay = new Date(e.getFullYear(), e.getMonth(), e.getDate());
        if (bDay > eDay) return false;
      }
      return true;
    }
    return true;
  };

  // Status mapping helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'new':
      case 'pending':
      case 'pending_assignment':
      case 'pending_approval':
        return {
          label: 'Pending Assignment',
          style: 'bg-amber-50 text-amber-800 border-amber-200/80',
        };
      case 'assigned':
      case 'maid_assigned':
      case 'partner_assigned':
        return {
          label: 'Assigned',
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        };
      case 'partner_accepted':
      case 'maid_accepted':
        return {
          label: 'Accepted',
          style: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
        };
      case 'en_route':
        return {
          label: 'En Route',
          style: 'bg-sky-50 text-sky-800 border-sky-200/80',
        };
      case 'arrived':
        return {
          label: 'Arrived',
          style: 'bg-purple-50 text-purple-800 border-purple-200/80',
        };
      case 'cleaning_started':
      case 'in_progress':
      case 'ongoing':
        return {
          label: 'Ongoing',
          style: 'bg-blue-50 text-blue-800 border-blue-200/80',
        };
      case 'completed':
      case 'customer_confirmed':
      case 'payment_settled':
        return {
          label: 'Completed',
          style: 'bg-emerald-50 text-[#123D2A] border-emerald-200/80',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          style: 'bg-rose-50 text-rose-800 border-rose-200/80',
        };
      case 'rescheduled':
        return {
          label: 'Rescheduled',
          style: 'bg-orange-50 text-orange-800 border-orange-200/80',
        };
      default:
        return {
          label: status.replace(/_/g, ' '),
          style: 'bg-slate-50 text-slate-700 border-slate-200/80',
        };
    }
  };

  // Combined Filters Logic (Supports AND filtering across all 8 dimensions)
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Date Range
      if (!isDateMatching(b.date)) return false;

      // 2. Location
      if (locationFilter !== 'all') {
        const bLoc = `${b.address?.locality || ''} ${b.address?.city || ''}`.toLowerCase();
        if (!bLoc.includes(locationFilter.toLowerCase())) return false;
      }

      // 3. Service
      if (serviceFilter !== 'all') {
        if ((b.serviceName || '').toLowerCase() !== serviceFilter.toLowerCase()) return false;
      }

      // 4. Partner
      if (partnerFilter !== 'all') {
        const hasPartner = Boolean(b.assignedMaidId || b.assignedMaidName);
        if (partnerFilter === 'unassigned') {
          if (hasPartner) return false;
        } else if (partnerFilter === 'assigned') {
          if (!hasPartner) return false;
        } else {
          if (
            b.assignedMaidId !== partnerFilter &&
            b.assignedMaidName?.toLowerCase() !== partnerFilter.toLowerCase()
          ) {
            return false;
          }
        }
      }

      // 5. Payment Method
      if (paymentMethodFilter !== 'all') {
        const m = (b.paymentMethod || '').toLowerCase();
        if (paymentMethodFilter === 'pay_after_service') {
          if (!['cash', 'cod', 'pay_after_service', 'pasa', 'pay_after'].includes(m)) return false;
        } else if (paymentMethodFilter === 'online') {
          if (!['online', 'upi', 'card', 'netbanking', 'razorpay'].includes(m)) return false;
        }
      }

      // 6. Payment Status
      if (paymentStatusFilter !== 'all') {
        const s = (b.paymentStatus || '').toLowerCase();
        if (paymentStatusFilter === 'paid') {
          if (s !== 'paid') return false;
        } else if (paymentStatusFilter === 'pending') {
          if (s !== 'pending' && s !== 'unpaid') return false;
        } else if (paymentStatusFilter === 'failed') {
          if (s !== 'failed') return false;
        } else if (paymentStatusFilter === 'refunded') {
          if (s !== 'refunded') return false;
        }
      }

      // 7. Booking Status
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

      // 8. Search Box (Booking ID, Customer Name, Phone, Service, Partner Name, Locality)
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
    paymentMethodFilter,
    paymentStatusFilter,
    statusFilter,
    searchQuery,
  ]);

  // Check if any non-default filters are active
  const isFilterActive =
    dateRangePreset !== 'thismonth' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    locationFilter !== 'all' ||
    serviceFilter !== 'all' ||
    partnerFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    paymentStatusFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  // Active filter chip helpers
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (dateRangePreset !== 'thismonth') {
      const dateLabels: Record<string, string> = {
        all: 'All Time',
        today: 'Today',
        yesterday: 'Yesterday',
        thisweek: 'This Week',
        thismonth: 'This Month',
        lastmonth: 'Last Month',
        last3months: 'Last 3 Months',
        custom: `Custom (${formatDateDDMMYYYY(customStartDate)} – ${formatDateDDMMYYYY(customEndDate)})`,
      };
      chips.push({
        key: 'date',
        label: `Date: ${dateLabels[dateRangePreset] || dateRangePreset}`,
        onRemove: () => updateUrlParams({ date: 'thismonth', startDate: null, endDate: null, page: '1' }),
      });
    }

    if (locationFilter !== 'all') {
      chips.push({
        key: 'location',
        label: `Location: ${locationFilter}`,
        onRemove: () => updateUrlParams({ location: 'all', page: '1' }),
      });
    }

    if (serviceFilter !== 'all') {
      chips.push({
        key: 'service',
        label: `Service: ${serviceFilter}`,
        onRemove: () => updateUrlParams({ service: 'all', page: '1' }),
      });
    }

    if (partnerFilter !== 'all') {
      let partnerLabel = partnerFilter;
      if (partnerFilter === 'unassigned') partnerLabel = 'Unassigned';
      if (partnerFilter === 'assigned') partnerLabel = 'Assigned';
      chips.push({
        key: 'partner',
        label: `Partner: ${partnerLabel}`,
        onRemove: () => updateUrlParams({ partner: 'all', page: '1' }),
      });
    }

    if (paymentMethodFilter !== 'all') {
      const methodLabels: Record<string, string> = {
        pay_after_service: 'Pay After Service',
        online: 'Online Payment',
      };
      chips.push({
        key: 'payMethod',
        label: `Payment: ${methodLabels[paymentMethodFilter] || paymentMethodFilter}`,
        onRemove: () => updateUrlParams({ payMethod: 'all', page: '1' }),
      });
    }

    if (paymentStatusFilter !== 'all') {
      chips.push({
        key: 'payStatus',
        label: `Payment Status: ${paymentStatusFilter.toUpperCase()}`,
        onRemove: () => updateUrlParams({ payStatus: 'all', page: '1' }),
      });
    }

    if (statusFilter !== 'all') {
      chips.push({
        key: 'status',
        label: `Status: ${statusFilter.replace(/_/g, ' ').toUpperCase()}`,
        onRemove: () => updateUrlParams({ status: 'all', page: '1' }),
      });
    }

    if (searchQuery.trim().length > 0) {
      chips.push({
        key: 'search',
        label: `Search: "${searchQuery}"`,
        onRemove: () => updateUrlParams({ q: '', page: '1' }),
      });
    }

    return chips;
  }, [
    dateRangePreset,
    customStartDate,
    customEndDate,
    locationFilter,
    serviceFilter,
    partnerFilter,
    paymentMethodFilter,
    paymentStatusFilter,
    statusFilter,
    searchQuery,
  ]);

  // Paginated bookings
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
      'Add-ons',
      'Location',
      'Date',
      'Time Slot',
      'Assigned Partner',
      'Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Status',
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredBookings.map(b => {
      const addOnsStr = (b.selectedAddOns || [])
        .map((a: any) => `${a.name || a.addonName}${a.quantity ? ` x${a.quantity}` : ''}`)
        .join('; ');
      const pInfo = getPaymentDisplayInfo(b.paymentStatus, b.paymentMethod);

      return [
        escapeCsv(b.bookingId),
        escapeCsv(b.customerName || 'Not provided'),
        escapeCsv(b.customerPhone || 'Not provided'),
        escapeCsv(b.serviceName || 'Not specified'),
        escapeCsv(addOnsStr || 'No add-ons'),
        escapeCsv(b.address?.locality || b.address?.city || 'Not provided'),
        escapeCsv(formatDateDDMMYYYY(b.date)),
        escapeCsv(b.timeSlot || '10:00 AM'),
        escapeCsv(b.assignedMaidName || 'Unassigned'),
        escapeCsv(b.totalAmount),
        escapeCsv(pInfo.methodLabel),
        escapeCsv(pInfo.statusLabel),
        escapeCsv(b.status),
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GC_Home_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-5 font-sans select-none pb-8 text-slate-800">
      {/* 1. Header Bar */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#0A192F] tracking-tight">
              All Bookings
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Operational overview of customer bookings, partner assignments, and payment statuses across all service locations.
          </p>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {bookingsError && (
        <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block text-xs font-bold">Unable to load bookings</strong>
              <span className="text-xs text-amber-700">Something went wrong while loading booking data.</span>
            </div>
          </div>
          <button
            onClick={() => refreshBookings && refreshBookings()}
            className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Real-Data KPI Status Cards (100% width with equal distribution) */}
      <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Bookings */}
        <div
          onClick={() => handleStatusChange('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'all'
              ? 'border-emerald-600 ring-2 ring-emerald-600/10 shadow-sm'
              : 'border-slate-200 shadow-xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          {bookingsLoading ? (
            <div className="h-7 w-12 bg-slate-200 animate-pulse rounded my-2" />
          ) : (
            <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.total}</h3>
          )}
          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">All logged bookings</span>
        </div>

        {/* New / Pending */}
        <div
          onClick={() => handleStatusChange('pending')}
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
          {bookingsLoading ? (
            <div className="h-7 w-12 bg-slate-200 animate-pulse rounded my-2" />
          ) : (
            <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.pending}</h3>
          )}
          <span className="text-[10px] font-bold text-amber-700 block mt-0.5">Awaiting partner assignment</span>
        </div>

        {/* Ongoing */}
        <div
          onClick={() => handleStatusChange('ongoing')}
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
          {bookingsLoading ? (
            <div className="h-7 w-12 bg-slate-200 animate-pulse rounded my-2" />
          ) : (
            <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.ongoing}</h3>
          )}
          <span className="text-[10px] font-bold text-sky-700 block mt-0.5">Currently being served</span>
        </div>

        {/* Completed */}
        <div
          onClick={() => handleStatusChange('completed')}
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
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#123D2A] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          {bookingsLoading ? (
            <div className="h-7 w-12 bg-slate-200 animate-pulse rounded my-2" />
          ) : (
            <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.completed}</h3>
          )}
          <span className="text-[10px] font-bold text-emerald-800 block mt-0.5">Jobs finished successfully</span>
        </div>

        {/* Cancelled */}
        <div
          onClick={() => handleStatusChange('cancelled')}
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
              <Layers className="w-4 h-4" />
            </div>
          </div>
          {bookingsLoading ? (
            <div className="h-7 w-12 bg-slate-200 animate-pulse rounded my-2" />
          ) : (
            <h3 className="text-2xl font-black text-[#0A192F] mt-2">{kpiCounts.cancelled}</h3>
          )}
          <span className="text-[10px] font-bold text-rose-700 block mt-0.5">Cancelled or aborted</span>
        </div>
      </div>

      {/* 3. Comprehensive Filter Bar (100% width) */}
      <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-2.5 w-full justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto flex-1">
            {/* 1. Date Filter (Supports: Today, Yesterday, This Week, This Month, Last Month, Last 3 Months, Custom, All Time) */}
            <div className="flex items-center gap-1.5">
              <select
                value={dateRangePreset}
                onChange={e => handleDateChange(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="thismonth">This Month (Default)</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisweek">This Week</option>
                <option value="lastmonth">Last Month</option>
                <option value="last3months">Last 3 Months</option>
                <option value="custom">Custom Date Range</option>
                <option value="all">All Time</option>
              </select>

              {dateRangePreset === 'custom' && (
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => handleCustomStartDateChange(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                    placeholder="From"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => handleCustomEndDateChange(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                    placeholder="To"
                  />
                </div>
              )}
            </div>

            {/* 2. Location Filter (Dynamic from Admin Service Areas in Supabase) */}
            <select
              value={locationFilter}
              onChange={e => handleLocationChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Localities</option>
              {dynamicLocations.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* 3. Services Filter (Dynamic from Admin Service Catalog in Supabase) */}
            <select
              value={serviceFilter}
              onChange={e => handleServiceChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Services</option>
              {dynamicServices.map(srv => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>

            {/* 4. Partner Filter (Dynamic from Supabase Partners + Unassigned) */}
            <select
              value={partnerFilter}
              onChange={e => handlePartnerChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Partners</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Only</option>
              {dynamicPartners.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* 5. Payment Method Filter (Pay After Service vs Online) */}
            <select
              value={paymentMethodFilter}
              onChange={e => handlePaymentMethodChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="pay_after_service">Pay After Service</option>
              <option value="online">Online Payment</option>
            </select>

            {/* 6. Payment Status Filter (Pending vs Paid vs Failed etc.) */}
            <select
              value={paymentStatusFilter}
              onChange={e => handlePaymentStatusChange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* 7. Booking Status Filter */}
            <select
              value={statusFilter}
              onChange={e => handleStatusChange(e.target.value)}
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

            {/* 8. Search Box (Booking ID, Customer Name, Phone, Service, Partner) */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search booking ID, customer name, phone, or partner..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action: Reset Filters & Export */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            {isFilterActive && (
              <button
                onClick={resetFilters}
                title="Reset all filters to default"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              title="Export current filtered bookings to CSV"
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-bold mr-1">Active Filters:</span>
            {activeChips.map(chip => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  className="hover:bg-emerald-200 rounded-full p-0.5 text-emerald-700 transition-colors cursor-pointer"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={resetFilters}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline font-bold ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 4. Main 11-Column Data Table (100% width, container-only horizontal scroll) */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop & Tablet Table (Maintains all 11 columns with explicit min-widths) */}
        <div ref={tableContainerRef} className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1340px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[130px]">Booking ID</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[180px]">Customer</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[180px]">Service</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[120px]">Add-ons</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[140px]">Location</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[130px]">Date & Time</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[170px]">Assigned Partner</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[100px]">Amount</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[150px]">Payment</th>
                <th className="py-3 px-3.5 whitespace-nowrap min-w-[130px]">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {/* Skeleton loading state */}
              {bookingsLoading && (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse border-b border-slate-100">
                      <td className="py-3.5 px-3.5"><div className="h-3.5 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 bg-slate-200 rounded" />
                          <div className="h-2.5 w-20 bg-slate-200 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1">
                          <div className="h-3.5 w-32 bg-slate-200 rounded" />
                          <div className="h-2.5 w-16 bg-slate-200 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5"><div className="h-5 w-20 bg-slate-200 rounded-lg" /></td>
                      <td className="py-3.5 px-3.5"><div className="h-3.5 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1">
                          <div className="h-3.5 w-20 bg-slate-200 rounded" />
                          <div className="h-2.5 w-14 bg-slate-200 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5"><div className="h-3.5 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-3.5"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-slate-200 rounded-full" />
                          <div className="h-2.5 w-20 bg-slate-200 rounded" />
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5"><div className="h-4 w-20 bg-slate-200 rounded-full" /></td>
                      <td className="py-3.5 px-3.5 text-right"><div className="h-7 w-20 bg-slate-200 rounded-lg inline-block" /></td>
                    </tr>
                  ))}
                </>
              )}

              {/* Real Bookings */}
              {!bookingsLoading &&
                paginatedBookings.map(b => {
                  const isPending = isBookingPendingAssignment(b);
                  const statusBadge = getStatusBadge(b.status);
                  const paymentInfo = getPaymentDisplayInfo(b.paymentStatus, b.paymentMethod);
                  const addOns = b.selectedAddOns || [];

                  return (
                    <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Booking ID */}
                      <td className="py-3 px-3.5 font-extrabold text-[#123D2A] whitespace-nowrap min-w-[130px]">
                        {b.bookingId}
                      </td>

                      {/* 2. Customer: Real DB information only, no fake names/phones */}
                      <td className="py-3 px-3.5 min-w-[180px]">
                        <div>
                          <strong className="font-bold text-slate-900 block text-xs tracking-tight">
                            {b.customerName?.trim() ? b.customerName : 'Not provided'}
                          </strong>
                          {b.customerPhone?.trim() ? (
                            <a
                              href={`tel:${b.customerPhone}`}
                              onClick={e => e.stopPropagation()}
                              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 mt-0.5"
                              title="Call Customer"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              {b.customerPhone}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block mt-0.5">Phone not provided</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Service: Real service name with truncation tooltip */}
                      <td className="py-3 px-3.5 min-w-[180px]">
                        <div>
                          <span
                            className="font-bold text-slate-900 block truncate max-w-[200px]"
                            title={b.serviceName || 'Service not specified'}
                          >
                            {b.serviceName || 'Not specified'}
                          </span>
                          {b.categoryName && (
                            <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[200px]">
                              {b.categoryName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Add-ons: Clean +X add-ons badge or strictly 'No add-ons' */}
                      <td className="py-3 px-3.5 whitespace-nowrap min-w-[120px]">
                        {addOns.length > 0 ? (
                          <button
                            onClick={() => setSelectedAddonsBooking(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-all shadow-2xs group"
                            title="Click to view selected add-ons"
                          >
                            <Package className="w-3.5 h-3.5 text-emerald-700" />
                            <span>+{addOns.length} add-on{addOns.length > 1 ? 's' : ''}</span>
                            <ChevronDown className="w-3 h-3 text-emerald-600 transition-transform group-hover:translate-y-0.5" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">No add-ons</span>
                        )}
                      </td>

                      {/* 5. Location */}
                      <td className="py-3 px-3.5 font-semibold text-slate-700 min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span
                            className="truncate max-w-[150px]"
                            title={`${b.address?.locality || ''}${b.address?.locality && b.address?.city ? ', ' : ''}${b.address?.city || ''}`}
                          >
                            {b.address?.locality || b.address?.city || 'Not provided'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Date & Time */}
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap min-w-[130px]">
                        <div className="font-bold text-slate-900">{formatDateDDMMYYYY(b.date)}</div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {b.timeSlot || '10:00 AM'}
                        </div>
                      </td>

                      {/* 7. Assigned Partner */}
                      <td className="py-3 px-3.5 whitespace-nowrap min-w-[170px]">
                        {b.assignedMaidName ? (
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{b.assignedMaidName}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {b.assignedMaidPhone ? (
                                <a
                                  href={`tel:${b.assignedMaidPhone}`}
                                  onClick={e => e.stopPropagation()}
                                  className="text-[10px] text-slate-500 hover:text-emerald-700 inline-flex items-center gap-0.5"
                                  title="Call Partner"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  {b.assignedMaidPhone}
                                </a>
                              ) : null}
                              <button
                                onClick={() => openAssignMaid(b.bookingId)}
                                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                View / Change
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-amber-200">
                              Unassigned
                            </span>
                            <button
                              onClick={() => openAssignMaid(b.bookingId)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 8. Amount */}
                      <td className="py-3 px-3.5 font-black text-slate-900 whitespace-nowrap min-w-[100px]">
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 9. Payment (Separated Payment Status and Payment Method) */}
                      <td className="py-3 px-3.5 whitespace-nowrap min-w-[150px]">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${paymentInfo.statusBadgeStyle}`}
                          >
                            {paymentInfo.statusLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {paymentInfo.methodLabel}
                          </span>
                        </div>
                      </td>

                      {/* 10. Status (Independent Booking Status badge) */}
                      <td className="py-3 px-3.5 whitespace-nowrap min-w-[130px]">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.style}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => openAssignMaid(b.bookingId)}
                              className="bg-[#123D2A] hover:bg-[#184a34] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                              title="Assign Partner to this booking"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assign</span>
                            </button>
                          )}
                          <button
                            onClick={() => openBookingDetails(b.bookingId)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                            title="View booking details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {/* Empty state handlers */}
              {!bookingsLoading && paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-slate-400">
                    <Calendar className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">
                      {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {bookings.length === 0
                        ? 'New bookings will appear here.'
                        : 'Try changing or clearing your filters.'}
                    </p>
                    {isFilterActive && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Responsive Booking Cards (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {bookingsLoading && (
            <div className="p-6 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading bookings...
            </div>
          )}

          {!bookingsLoading &&
            paginatedBookings.map(b => {
              const isPending = isBookingPendingAssignment(b);
              const statusBadge = getStatusBadge(b.status);
              const paymentInfo = getPaymentDisplayInfo(b.paymentStatus, b.paymentMethod);
              const addOns = b.selectedAddOns || [];

              return (
                <div key={b.bookingId} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-[#123D2A] text-xs block">{b.bookingId}</span>
                      <strong className="font-bold text-slate-900 text-sm block mt-0.5">
                        {b.customerName || 'Not provided'}
                      </strong>
                      {b.customerPhone ? (
                        <a
                          href={`tel:${b.customerPhone}`}
                          className="text-xs text-slate-500 font-medium inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" /> {b.customerPhone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Phone not provided</span>
                      )}
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
                      <span className="font-bold text-slate-800">{b.serviceName || 'Not specified'}</span>
                      {addOns.length > 0 ? (
                        <button
                          onClick={() => setSelectedAddonsBooking(b)}
                          className="text-[10px] font-bold text-emerald-700 underline block mt-0.5"
                        >
                          +{addOns.length} add-on{addOns.length > 1 ? 's' : ''} (view)
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">No add-ons</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Schedule</span>
                      <span className="font-bold text-slate-800">{formatDateDDMMYYYY(b.date)}</span>
                      <span className="text-[10px] text-slate-500 block">{b.timeSlot || '10:00 AM'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Location</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {b.address?.locality || b.address?.city || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Partner</span>
                      <span className="font-bold text-slate-800">{b.assignedMaidName || 'Unassigned'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Amount & Payment</span>
                        <span className="font-black text-slate-900 text-sm">₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentInfo.statusBadgeStyle}`}
                        >
                          {paymentInfo.statusLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{paymentInfo.methodLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isPending && (
                      <button
                        onClick={() => openAssignMaid(b.bookingId)}
                        className="px-3.5 py-1.5 bg-[#123D2A] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign Partner</span>
                      </button>
                    )}
                    <button
                      onClick={() => openBookingDetails(b.bookingId)}
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}

          {!bookingsLoading && paginatedBookings.length === 0 && (
            <div className="py-12 text-center text-slate-400 px-4">
              <Calendar className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {bookings.length === 0
                  ? 'New bookings will appear here.'
                  : 'Try changing or clearing your filters.'}
              </p>
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="mt-3 px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 5. Pagination Controls with Admin Selectable Page Size (15, 25, 50, 75, 100) */}
        <div className="w-full p-4 bg-slate-50 border-t border-slate-200/80">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredBookings.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="bookings"
          />
        </div>
      </div>

      {/* 6. Add-on Details Compact Modal */}
      {selectedAddonsBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col font-sans">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-700" />
                  Selected Add-ons
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Booking #{selectedAddonsBooking.bookingId} • {selectedAddonsBooking.serviceName}
                </p>
              </div>
              <button
                onClick={() => setSelectedAddonsBooking(null)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
              {(selectedAddonsBooking.selectedAddOns || []).length > 0 ? (
                (selectedAddonsBooking.selectedAddOns || []).map((addon: any, idx: number) => {
                  const name = addon.name || addon.addonName || addon.title || 'Service Add-on';
                  const qty = addon.quantity || addon.qty || 1;
                  const price = addon.price ? Number(addon.price) : addon.cost ? Number(addon.cost) : 0;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <div>
                          <strong className="text-slate-900 block font-bold">{name}</strong>
                          <span className="text-[11px] text-slate-500 font-medium">Quantity: × {qty}</span>
                        </div>
                      </div>
                      {price > 0 && (
                        <span className="font-black text-[#123D2A] text-xs">
                          ₹{(price * qty).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold">No add-ons selected for this booking.</p>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedAddonsBooking(null)}
                className="px-4 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
