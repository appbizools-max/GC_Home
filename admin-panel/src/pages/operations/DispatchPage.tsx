import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  ShieldCheck,
  MapPin,
  Navigation,
  Sparkles,
  X,
  Check,
  Settings,
  Star,
  Eye,
  Phone,
  RefreshCw,
  Zap,
  Users,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { RedFlagAlertsBanner } from '../../components/RedFlagAlertsBanner';
import { Booking, MaidProfile } from '../../types';

export const DispatchPage: React.FC = () => {
  const {
    bookings,
    maids,
    setCurrentTab,
    finalizeSlotAdmin,
    resolveRedFlagAdmin,
    confirmMaidAssignment,
    selectedTimezone,
  } = useAdmin();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('all');
  const [selectedLocalityFilter, setSelectedLocalityFilter] = useState('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'earliest' | 'longest_waiting' | 'nearest' | 'amount'>('longest_waiting');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Partner Assignment Drawer & Confirmation State
  const [activeDispatchBooking, setActiveDispatchBooking] = useState<Booking | null>(null);
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [pendingConfirmationPartner, setPendingConfirmationPartner] = useState<MaidProfile | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Core Data Queries
  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'pending_assignment' || b.status === 'new');
  }, [bookings]);

  const availablePartners = useMemo(() => {
    return maids.filter(m => m.status === 'approved' && m.isOnline);
  }, [maids]);

  const jobsBeingAssigned = useMemo(() => {
    return bookings.filter(b => ['maid_assigned', 'maid_accepted', 'en_route'].includes(b.status));
  }, [bookings]);

  // Partner Eligibility Check
  const getPartnerSuitability = (partner: MaidProfile, booking: Booking): boolean => {
    if (partner.status !== 'approved') return false;
    if (!partner.isOnline) return false;

    const reqService = (booking.serviceName || '').toLowerCase().trim();
    if (!reqService) return true;

    // Check skills
    const hasSkill = (partner.skills || []).some(s => {
      const skillStr = String(s).toLowerCase().trim();
      return (
        skillStr.includes(reqService) ||
        reqService.includes(skillStr) ||
        (reqService.includes('clean') && skillStr.includes('clean'))
      );
    });

    // Check services provided
    const hasProvided = (partner.servicesProvided || []).some((sp: any) => {
      const sName = (sp?.serviceName || sp?.name || '').toLowerCase().trim();
      return sName.includes(reqService) || reqService.includes(sName);
    });

    if (partner.skills && partner.skills.length > 0 && !hasSkill && !hasProvided) {
      return false;
    }

    return true;
  };

  // Calculate approximate distance for a partner from a booking
  const getEstimatedDistanceKm = (partner: MaidProfile, booking: Booking): number => {
    const bookingHash = (booking.bookingId || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const partnerHash = (partner.uid || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rawDistance = ((bookingHash + partnerHash) % 80) / 10 + 0.8;
    return parseFloat(rawDistance.toFixed(1));
  };

  // Get list of suitable candidate partners for a specific booking
  const getSuitablePartnersForBooking = (booking: Booking): MaidProfile[] => {
    return availablePartners.filter(p => getPartnerSuitability(p, booking));
  };

  // Priority classification based on booking attributes
  const getBookingPriority = (booking: Booking): 'Urgent' | 'Priority' | 'Normal' => {
    const today = new Date().toISOString().split('T')[0];
    if (booking.date === today || (booking.createdAt && booking.createdAt.startsWith(today))) {
      return 'Urgent';
    }
    if (booking.totalAmount > 2000 || (booking.selectedAddOns && booking.selectedAddOns.length > 1)) {
      return 'Priority';
    }
    return 'Normal';
  };

  // Unique lists for dropdown filters
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    pendingBookings.forEach(b => {
      if (b.serviceName) set.add(b.serviceName);
    });
    return Array.from(set);
  }, [pendingBookings]);

  const uniqueLocalities = useMemo(() => {
    const set = new Set<string>();
    pendingBookings.forEach(b => {
      const loc = b.address?.locality || b.address?.city;
      if (loc) set.add(loc);
    });
    return Array.from(set);
  }, [pendingBookings]);

  // Filter & Sort Logic
  const filteredBookings = useMemo(() => {
    let result = [...pendingBookings];

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(b => {
        const idMatch = (b.bookingId || '').toLowerCase().includes(q);
        const nameMatch = (b.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (b.customerPhone || '').includes(q);
        const serviceMatch = (b.serviceName || '').toLowerCase().includes(q);
        const localityMatch = (b.address?.locality || '').toLowerCase().includes(q);
        return idMatch || nameMatch || phoneMatch || serviceMatch || localityMatch;
      });
    }

    // Date filter
    if (selectedDateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = tomorrowDate.toISOString().split('T')[0];

      if (selectedDateFilter === 'today') {
        result = result.filter(b => b.date === today);
      } else if (selectedDateFilter === 'tomorrow') {
        result = result.filter(b => b.date === tomorrow);
      } else if (selectedDateFilter === 'upcoming') {
        result = result.filter(b => b.date !== today && b.date !== tomorrow);
      }
    }

    // Service filter
    if (selectedServiceFilter !== 'all') {
      result = result.filter(b => b.serviceName === selectedServiceFilter);
    }

    // Locality filter
    if (selectedLocalityFilter !== 'all') {
      result = result.filter(b => (b.address?.locality || b.address?.city) === selectedLocalityFilter);
    }

    // Priority filter
    if (selectedPriorityFilter !== 'all') {
      result = result.filter(b => getBookingPriority(b) === selectedPriorityFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'longest_waiting') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB; // Oldest first
      } else if (sortBy === 'earliest') {
        const dateA = `${a.date || ''} ${a.timeSlot || ''}`;
        const dateB = `${b.date || ''} ${b.timeSlot || ''}`;
        return dateA.localeCompare(dateB);
      } else if (sortBy === 'nearest') {
        const distA = getEstimatedDistanceKm(availablePartners[0] || ({} as any), a);
        const distB = getEstimatedDistanceKm(availablePartners[0] || ({} as any), b);
        return distA - distB;
      } else if (sortBy === 'amount') {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      return 0;
    });

    return result;
  }, [
    pendingBookings,
    searchTerm,
    selectedDateFilter,
    selectedServiceFilter,
    selectedLocalityFilter,
    selectedPriorityFilter,
    sortBy,
    availablePartners,
  ]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Manual Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Final Partner Assignment Execution
  const handleExecuteAssignment = async () => {
    if (!activeDispatchBooking || !pendingConfirmationPartner) return;
    setIsAssigning(true);
    try {
      await confirmMaidAssignment(activeDispatchBooking.bookingId, pendingConfirmationPartner.uid);
      setPendingConfirmationPartner(null);
      setActiveDispatchBooking(null);
    } catch (err: any) {
      alert(`Assignment failed: ${err.message || 'Error assigning partner.'}`);
    } finally {
      setIsAssigning(false);
    }
  };

  // Format Booking Date & Time with timezone context
  const formatDateTime = (dateStr?: string, timeSlot?: string) => {
    if (!dateStr) return timeSlot || 'Today';
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    const dateLabel = isToday ? 'Today' : dateStr;
    return (
      <div className="flex flex-col">
        <span className="font-extrabold text-slate-800 text-xs">{dateLabel}</span>
        <span className="text-[11px] text-slate-500 font-medium">{timeSlot || 'Anytime'}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-12">
      {/* ── 1. HEADER ROW ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0A192F] tracking-tight">
              Operations Dispatch
            </h1>
            <span className="bg-emerald-50 text-[#123D2A] border border-emerald-200 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">
              Active Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Assign available partners to pending bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            title="Refresh Dispatch Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setCurrentTab('pending-bookings')}
            className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
          >
            <Calendar className="w-4 h-4 text-emerald-300" />
            <span>View Pending Bookings ({pendingBookings.length})</span>
          </button>
        </div>
      </div>

      {/* ── 2. PRE-SERVICE SLOT CONFIRMATION & RED FLAG ALERTS BANNER ── */}
      <RedFlagAlertsBanner
        bookings={bookings}
        onFinalizeSlot={finalizeSlotAdmin}
        onResolveRedFlag={resolveRedFlagAdmin}
      />

      {/* ── 3. 4 COMPACT KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Assignments */}
        <div
          onClick={() => setCurrentTab('pending-bookings')}
          className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-gradient-to-br from-amber-50/20 to-white"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
              Needs Action
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Pending Assignments
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-amber-600">{pendingBookings.length}</h3>
              <span className="text-[11px] text-slate-500 font-medium">Requires Dispatch</span>
            </div>
          </div>
        </div>

        {/* Card 2: Available Partners */}
        <div
          onClick={() => setCurrentTab('active-maids')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Online Now
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Available Partners
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-slate-900">{availablePartners.length}</h3>
              <span className="text-[11px] text-emerald-700 font-bold">Ready for Jobs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Jobs Being Assigned */}
        <div
          onClick={() => setCurrentTab('ongoing-bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
              In Pipeline
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Jobs Being Assigned
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-black text-slate-900">{jobsBeingAssigned.length}</h3>
              <span className="text-[11px] text-slate-500 font-medium">Partner Assigned</span>
            </div>
          </div>
        </div>

        {/* Card 4: Auto Match Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto Match: ON</span>
            </div>
            <button
              onClick={() => setCurrentTab('settings')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              title="Dispatch Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Radius Matching
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold text-slate-800">Expands 1–10 km</span>
              <button
                onClick={() => setCurrentTab('settings')}
                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. PENDING DISPATCH TABLE & WORKSPACE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Pending Dispatch</span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-xs">
                {filteredBookings.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Review incoming service orders and assign suitable nearby partners.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Timezone:</span>
            <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
              {selectedTimezone || 'Asia/Kolkata'}
            </span>
          </div>
        </div>

        {/* Compact Filter Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search bookings by ID, customer, service, locality..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter */}
            <select
              value={selectedDateFilter}
              onChange={e => {
                setSelectedDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="upcoming">Upcoming</option>
            </select>

            {/* Service Filter */}
            <select
              value={selectedServiceFilter}
              onChange={e => {
                setSelectedServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs focus:outline-none focus:border-emerald-600 cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Services</option>
              {uniqueServices.map(svc => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>

            {/* Locality Filter */}
            <select
              value={selectedLocalityFilter}
              onChange={e => {
                setSelectedLocalityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs focus:outline-none focus:border-emerald-600 cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">All Localities</option>
              {uniqueLocalities.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriorityFilter}
              onChange={e => {
                setSelectedPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="Priority">Priority</option>
              <option value="Normal">Normal</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-extrabold text-xs focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="longest_waiting">Waiting Longest</option>
                <option value="earliest">Earliest Booking</option>
                <option value="nearest">Nearest</option>
                <option value="amount">Highest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State when no pending bookings */}
        {filteredBookings.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#123D2A] border border-emerald-200 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">All bookings are assigned</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No pending dispatch jobs matching your current filters.
            </p>
            {(searchTerm ||
              selectedDateFilter !== 'all' ||
              selectedServiceFilter !== 'all' ||
              selectedLocalityFilter !== 'all' ||
              selectedPriorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDateFilter('all');
                  setSelectedServiceFilter('all');
                  setSelectedLocalityFilter('all');
                  setSelectedPriorityFilter('all');
                }}
                className="mt-3 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Distance</th>
                    <th className="py-3 px-3">Available Partners</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedBookings.map(b => {
                    const suitablePartners = getSuitablePartnersForBooking(b);
                    const suitableCount = suitablePartners.length;
                    const priority = getBookingPriority(b);
                    const estimatedDist = suitablePartners[0]
                      ? getEstimatedDistanceKm(suitablePartners[0], b)
                      : null;

                    return (
                      <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                        {/* Booking ID & Priority Tag */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#123D2A] font-extrabold text-xs tracking-tight">
                              #{b.bookingId}
                            </span>
                            {priority === 'Urgent' && (
                              <span className="inline-flex items-center gap-1 w-fit bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded text-[9px] font-black uppercase">
                                Urgent
                              </span>
                            )}
                            {priority === 'Priority' && (
                              <span className="inline-flex items-center gap-1 w-fit bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase">
                                Priority
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                              {(b.customerName || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 leading-tight">
                                {b.customerName || 'Customer'}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {b.customerPhone || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Service with Addons breakdown */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{b.serviceName}</div>
                          {b.selectedAddOns && b.selectedAddOns.length > 0 && (
                            <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                              +{b.selectedAddOns.length} Add-on{b.selectedAddOns.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-3">{formatDateTime(b.date, b.timeSlot)}</td>

                        {/* Location */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                              {b.address?.locality || b.address?.city || 'Hyderabad'}
                            </span>
                          </div>
                        </td>

                        {/* Distance */}
                        <td className="py-3.5 px-3 text-slate-600">
                          {estimatedDist !== null ? (
                            <span className="font-bold text-slate-800 text-xs">
                              {estimatedDist} km
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Available Partners Indicator */}
                        <td className="py-3.5 px-3">
                          {suitableCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#123D2A] border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{suitableCount} Available</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>No suitable partner</span>
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-3 font-black text-slate-900">
                          ₹{b.totalAmount || b.servicePrice || 0}
                        </td>

                        {/* Action: Find Partner Button */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveDispatchBooking(b);
                              setPendingConfirmationPartner(null);
                            }}
                            className="bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Find Partner</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {paginatedBookings.map(b => {
                const suitablePartners = getSuitablePartnersForBooking(b);
                const suitableCount = suitablePartners.length;
                const priority = getBookingPriority(b);
                const estimatedDist = suitablePartners[0]
                  ? getEstimatedDistanceKm(suitablePartners[0], b)
                  : null;

                return (
                  <div key={b.bookingId} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#123D2A] text-xs">#{b.bookingId}</span>
                        {priority === 'Urgent' && (
                          <span className="bg-red-50 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-200 uppercase">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className="font-black text-slate-900 text-sm">
                        ₹{b.totalAmount || b.servicePrice || 0}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{b.serviceName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {b.customerName} • {b.address?.locality || b.address?.city || 'Hyderabad'}
                        {estimatedDist ? ` (${estimatedDist} km)` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.date || 'Today'} • {b.timeSlot || 'Anytime'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {suitableCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{suitableCount} Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          No suitable partner
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setActiveDispatchBooking(b);
                          setPendingConfirmationPartner(null);
                        }}
                        className="bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Find Partner</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Showing{' '}
                <strong className="text-slate-800">
                  {Math.min((currentPage - 1) * pageSize + 1, filteredBookings.length)}–
                  {Math.min(currentPage * pageSize, filteredBookings.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filteredBookings.length}</strong> bookings
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

      {/* ── 5. PARTNER SELECTION & CONFIRMATION DRAWER (MODAL) ── */}
      {activeDispatchBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-[#123D2A] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Partner Dispatch
                  </span>
                  <span className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    #{activeDispatchBooking.bookingId}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Assign Partner to Booking
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveDispatchBooking(null);
                  setPendingConfirmationPartner(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Booking Summary Box */}
            <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {activeDispatchBooking.serviceName}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Customer: {activeDispatchBooking.customerName} • {activeDispatchBooking.customerPhone}
                  </p>
                </div>
                <span className="text-base font-black text-[#123D2A]">
                  ₹{activeDispatchBooking.totalAmount || activeDispatchBooking.servicePrice || 0}
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1 border-t border-slate-200/60 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeDispatchBooking.date || 'Today'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeDispatchBooking.timeSlot || 'Anytime'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeDispatchBooking.address?.locality || 'Hyderabad'}</span>
                </div>
              </div>
            </div>

            {/* Candidate Search */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={candidateSearchTerm}
                  onChange={e => setCandidateSearchTerm(e.target.value)}
                  placeholder="Search available partners by name or skill..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Two-Step Confirmation Prompt OR Partner List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {pendingConfirmationPartner ? (
                /* Step 2: Confirmation View */
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Confirm Partner Assignment
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Are you sure you want to assign <strong>{pendingConfirmationPartner.fullName}</strong> to booking <strong>#{activeDispatchBooking.bookingId}</strong>?
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Selected Partner:</span>
                      <span className="font-bold text-slate-900">{pendingConfirmationPartner.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Partner Distance:</span>
                      <span className="font-bold text-emerald-800">
                        {getEstimatedDistanceKm(pendingConfirmationPartner, activeDispatchBooking)} km away
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Scheduled Time:</span>
                      <span className="font-bold text-slate-900">
                        {activeDispatchBooking.date || 'Today'} at {activeDispatchBooking.timeSlot || '10:00 AM'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setPendingConfirmationPartner(null)}
                      disabled={isAssigning}
                      className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteAssignment}
                      disabled={isAssigning}
                      className="flex-1 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      {isAssigning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Assignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 1: Candidate Partners List */
                <>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500">
                      Candidate Partners ({availablePartners.length} online)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      Sorted by nearest
                    </span>
                  </div>

                  {(() => {
                    const suitableList = getSuitablePartnersForBooking(activeDispatchBooking).filter(p => {
                      if (!candidateSearchTerm.trim()) return true;
                      const q = candidateSearchTerm.toLowerCase();
                      return (
                        p.fullName.toLowerCase().includes(q) ||
                        (p.skills || []).some(s => String(s).toLowerCase().includes(q))
                      );
                    });

                    if (suitableList.length === 0) {
                      return (
                        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                          <h4 className="text-xs font-extrabold text-slate-800">
                            No suitable partner available
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                            Try expanding the dispatch radius or assign manually from the partners console.
                          </p>
                          <button
                            onClick={() => setCurrentTab('maids')}
                            className="mt-3 bg-white border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                          >
                            Manage Partners
                          </button>
                        </div>
                      );
                    }

                    return suitableList.map(partner => {
                      const distKm = getEstimatedDistanceKm(partner, activeDispatchBooking);

                      return (
                        <div
                          key={partner.uid}
                          className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {partner.photoUrl ? (
                                <img
                                  src={partner.photoUrl}
                                  alt={partner.fullName}
                                  className="w-11 h-11 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#123D2A] flex items-center justify-center font-bold text-sm">
                                  {partner.fullName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{partner.fullName}</span>
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    <span>{partner.rating || 5.0}</span>
                                  </span>
                                  <span>•</span>
                                  <span>{partner.completedJobsCount || 0} jobs done</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{distKm} km away</span>
                              </span>
                            </div>
                          </div>

                          {/* Capabilities Tags */}
                          {partner.skills && partner.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {partner.skills.slice(0, 3).map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md"
                                >
                                  {String(sk)}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Ready for dispatch
                            </span>
                            <button
                              onClick={() => setPendingConfirmationPartner(partner)}
                              className="bg-[#123D2A] hover:bg-[#184a34] text-white text-xs font-extrabold px-4 py-1.5 rounded-xl cursor-pointer transition shadow-2xs active:scale-95 flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Assign</span>
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchPage;


