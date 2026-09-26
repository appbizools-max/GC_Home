import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdmin, isFakeLocation } from '../../context/AdminContext';
import { Customer } from '../../types';
import { supabase } from '../../config/supabase';
import { PaginationControls } from '../../components/PaginationControls';
import { exportCustomersToCSV as triggerExportCustomers } from '../../utils/exportUtils';
import { formatDateDDMMYYYY } from '../../utils/bookingDisplayUtils';
import {
  Users,
  Crown,
  TrendingUp,
  Star,
  Search,
  RotateCcw,
  Download,
  X,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface CustomerWithDetails extends Customer {
  allAddresses: any[];
  bookingHistory: any[];
  avgRating: number;
  totalRatingsGiven: number;
  preferredServices: string[];
  totalBookingValue: number;
  pendingAmount: number;
  isPartner?: boolean;
  partnerStatus?: string;
  partnerProfile?: any;
  partnerJobsCount?: number;
  customerBookingsCount?: number;
}

const PAGE_SIZE_OPTIONS = [15, 25, 35, 50, 75, 100];

// Format customer name into clean Title Case
const formatCustomerName = (str?: string): string => {
  if (!str) return 'Registered Customer';
  return str
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

// Format phone number to clean Indian format with country code
const formatCustomerPhone = (phone?: string): string => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
};

export const CustomersPage: React.FC = () => {
  const { customers: contextCustomers, bookings, ratings, serviceAreas, setCurrentTab, selectedLocation } = useAdmin();

  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search params for bookmarkable & refresh-persistent state
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeParam = parseInt(searchParams.get('pageSize') || '15', 10);
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedLocality = searchParams.get('locality') || 'All';
  const searchQuery = searchParams.get('q') || '';
  const customerIdParam = searchParams.get('customerId') || null;

  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : 15;

  const updateUrlParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === '' ||
          (key === 'category' && val === 'All') ||
          (key === 'locality' && val === 'All') ||
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

  const handleCategoryChange = (category: string) => {
    updateUrlParams({ category, page: '1' });
  };

  const handleLocalityChange = (locality: string) => {
    updateUrlParams({ locality, page: '1' });
  };

  const handleSearchChange = (query: string) => {
    updateUrlParams({ q: query, page: '1' });
  };

  const resetFilters = () => {
    const newParams = new URLSearchParams();
    if (pageSize !== 15) {
      newParams.set('pageSize', String(pageSize));
    }
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    const enrichCustomers = async () => {
      try {
        // Fetch all user addresses from saved_addresses
        const { data: addressesData } = await supabase
          .from('saved_addresses')
          .select('*')
          .order('is_default', { ascending: false });

        const addressesByUser = new Map<string, any[]>();
        (addressesData || []).forEach(addr => {
          if (!addr.user_id) return;
          if (!addressesByUser.has(addr.user_id)) {
            addressesByUser.set(addr.user_id, []);
          }
          const street = [addr.house_flat, addr.street_address || addr.street].filter(Boolean).join(', ').trim();
          const locality = (addr.locality || '').trim();
          const city = (addr.city && !isFakeLocation(addr.city) ? addr.city : '').trim();
          const pincode = (addr.pincode || '').trim();

          addressesByUser.get(addr.user_id)!.push({
            id: addr.id,
            user_id: addr.user_id,
            label: addr.label || 'Home',
            street,
            locality: !isFakeLocation(locality) ? locality : '',
            city,
            pincode,
            is_primary: Boolean(addr.is_default),
          });
        });

        // Enrich each customer with real details
        const enriched: CustomerWithDetails[] = contextCustomers.map(cust => {
          const userBookings = bookings.filter(b => b.customerId === cust.id || b.customerPhone === cust.phone);
          const userRatings = ratings.filter(r => r.customerId === cust.id);

          // Lifetime spend: ONLY sum paid bookings, excluding unpaid Pay After Service & cancelled
          const paidBookings = userBookings.filter(b => 
            (b.paymentStatus === 'paid' || (b as any).payment_status === 'paid') && 
            b.status !== 'cancelled'
          );
          const pendingBookings = userBookings.filter(b =>
            b.paymentStatus !== 'paid' && (b as any).payment_status !== 'paid' &&
            b.status !== 'cancelled'
          );

          const totalBookingValue = userBookings.reduce((sum, b) => sum + (Number(b.totalAmount || (b as any).total_amount) || 0), 0);
          const totalSpent = paidBookings.reduce((sum, b) => sum + (Number(b.totalAmount || (b as any).total_amount) || 0), 0);
          const pendingAmount = Math.max(0, totalBookingValue - totalSpent);

          const avgRating = userRatings.length > 0 
            ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length 
            : 0;

          // Determine customer type based on actual spend and booking count
          let customerType = 'First-time Customer';
          if (totalSpent > 5000 || userBookings.length >= 5) {
            customerType = 'VIP Member';
          } else if (userBookings.length > 1) {
            customerType = 'Regular Customer';
          }

          // Preferred services (most booked service names)
          const serviceCounts = new Map<string, number>();
          userBookings.forEach(b => {
            const serviceName = b.serviceName || 'Unknown Service';
            serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
          });
          const preferredServices = Array.from(serviceCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

          // Get addresses
          const allAddresses = addressesByUser.get(cust.id) || [];
          const primaryAddress = allAddresses.find(a => a.is_primary) || allAddresses[0];

          // Determine customer actual locality entered/saved from User App (never fake defaults)
          let actualLocality = '';
          if (primaryAddress) {
            const loc = (primaryAddress.locality || primaryAddress.street || primaryAddress.city || '').trim();
            if (loc && !isFakeLocation(loc)) {
              actualLocality = loc;
            }
          }
          if (!actualLocality && cust.locality && !isFakeLocation(cust.locality)) {
            actualLocality = cust.locality.trim();
          }
          if (!actualLocality && cust.address) {
            const addrLoc = (cust.address.locality || cust.address.street || cust.address.city || '').trim();
            if (addrLoc && !isFakeLocation(addrLoc)) {
              actualLocality = addrLoc;
            }
          }
          if (!actualLocality && userBookings.length > 0) {
            for (const b of userBookings) {
              const bkLoc = (b.address?.locality || (b as any).address_locality || b.address?.street || (b as any).address_street || b.address?.city || (b as any).address_city || '').trim();
              if (bkLoc && !isFakeLocation(bkLoc)) {
                actualLocality = bkLoc;
                break;
              }
            }
          }

          const customerLocality = actualLocality || 'Address not added';

          const resolvedAddress = primaryAddress ? {
            id: primaryAddress.id,
            label: primaryAddress.label || 'Home',
            street: primaryAddress.street,
            locality: primaryAddress.locality,
            city: primaryAddress.city,
            pincode: primaryAddress.pincode,
          } : (cust.address && (!isFakeLocation(cust.address.street) || !isFakeLocation(cust.address.locality)) ? {
            id: cust.address.id || 'addr_1',
            label: cust.address.label || 'Home',
            street: !isFakeLocation(cust.address.street) ? cust.address.street : '',
            locality: !isFakeLocation(cust.address.locality) ? cust.address.locality : '',
            city: !isFakeLocation(cust.address.city) ? cust.address.city : '',
            pincode: cust.address.pincode || '',
          } : {
            id: '',
            label: '',
            street: '',
            locality: '',
            city: '',
            pincode: '',
          });

          // Sort bookings by date descending
          const sortedBookings = [...userBookings].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          const lastBooking = sortedBookings[0];
          const lastBookingRawDate = lastBooking?.date || (lastBooking as any)?.scheduled_date || lastBooking?.createdAt;
          const lastBookingDate = lastBookingRawDate 
            ? formatDateDDMMYYYY(lastBookingRawDate)
            : 'No bookings yet';

          // Strictly sanitize email: never fabricate or assume dummy emails
          const rawEmail = cust.email || '';
          const cleanEmail = rawEmail && !rawEmail.includes('customer@gchome.com') && !rawEmail.includes('example.com')
            ? rawEmail
            : '';

          return {
            ...cust,
            email: cleanEmail,
            customerType,
            locality: customerLocality,
            address: resolvedAddress,
            allAddresses: allAddresses.map(a => ({
              id: a.id,
              label: a.label || 'Home',
              street: a.street,
              locality: a.locality,
              city: a.city,
              pincode: a.pincode,
              isPrimary: a.is_primary,
            })),
            totalBookings: userBookings.length,
            totalBookingValue,
            totalSpent,
            pendingAmount,
            lastBookingDate,
            avgRating,
            totalRatingsGiven: userRatings.length,
            ratingGiven: avgRating,
            bookingHistory: sortedBookings,
            preferredServices,
          };
        });

        setCustomers(enriched);
      } catch (err) {
        console.error('Error enriching customers:', err);
        const basic: CustomerWithDetails[] = contextCustomers.map(c => ({
          ...c,
          locality: (!c.locality || isFakeLocation(c.locality)) ? 'Address not added' : c.locality,
          email: c.email && !c.email.includes('customer@gchome.com') && !c.email.includes('example.com') ? c.email : '',
          allAddresses: [],
          bookingHistory: [],
          avgRating: 0,
          totalRatingsGiven: 0,
          preferredServices: [],
          totalBookingValue: 0,
          pendingAmount: 0,
        }));
        setCustomers(basic);
      }
    };

    if (contextCustomers.length > 0) {
      enrichCustomers();
    } else {
      setCustomers([]);
    }

    const channel = supabase
      .channel('customers_page_addresses_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_addresses' }, enrichCustomers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, enrichCustomers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contextCustomers, bookings, ratings]);

  // Dynamic Localities derived from Admin-configured Service Areas in Supabase
  const dynamicLocalities = useMemo(() => {
    const locSet = new Set<string>();
    (serviceAreas || []).forEach((sa: any) => {
      if (sa.is_serviceable !== false && sa.is_active !== false) {
        if (sa.locality) locSet.add(sa.locality);
        if (sa.locality_name) locSet.add(sa.locality_name);
        if (sa.city) locSet.add(sa.city);
      }
    });
    // Include any customer localities already present in real accounts
    customers.forEach(c => {
      if (c.locality && !isFakeLocation(c.locality)) {
        locSet.add(c.locality);
      }
    });
    return Array.from(locSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [serviceAreas, customers]);

  // Filtered Customers based on Category, Locality, and Search Query
  const filteredCustomers = customers.filter(c => {
    if (selectedCategory !== 'All' && c.customerType !== selectedCategory) return false;
    if (selectedLocality !== 'All' && !(c.locality || '').toLowerCase().includes(selectedLocality.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !(c.name || '').toLowerCase().includes(q) &&
        !(c.phone || '').includes(q) &&
        !(c.email || '').toLowerCase().includes(q) &&
        !(c.locality || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCustomers = customers.length;
  const vipCount = customers.filter(c => c.customerType === 'VIP Member').length;
  const paidCustomers = customers.filter(c => c.totalSpent > 0);
  const totalSpentSum = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLtv = paidCustomers.length > 0 ? Math.round(totalSpentSum / paidCustomers.length) : 0;
  
  // Real average rating from all actual customer ratings
  const customersWithRatings = customers.filter(c => c.totalRatingsGiven > 0);
  const totalRatingSum = customersWithRatings.reduce((sum, c) => sum + (c.avgRating * c.totalRatingsGiven), 0);
  const totalRatingsCount = customersWithRatings.reduce((sum, c) => sum + c.totalRatingsGiven, 0);
  const avgRating = totalRatingsCount > 0 ? (totalRatingSum / totalRatingsCount).toFixed(1) : null;

  // Active customer for side drawer (synced via customerId URL param)
  const activeDrawerCustomer = useMemo(() => {
    if (!customerIdParam) return null;
    return customers.find(c => c.id === customerIdParam || c.phone === customerIdParam) || null;
  }, [customerIdParam, customers]);

  const handleOpenDrawer = (customer: CustomerWithDetails) => {
    updateUrlParams({ customerId: customer.id });
  };

  const handleCloseDrawer = () => {
    updateUrlParams({ customerId: null });
  };

  const exportCustomersToCSV = () => {
    triggerExportCustomers(filteredCustomers);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none pb-8 text-slate-800">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Showing all registered customers and service activity.
          </p>
        </div>
      </div>

      {/* 2. KPI Cards Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              TOTAL CUSTOMERS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totalCustomers}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Active client profiles
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active VIP Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              ACTIVE VIP
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{vipCount}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              High-frequency clients
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Lifetime Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              AVG. LIFETIME VALUE
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-950">₹{avgLtv.toLocaleString()}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              {paidCustomers.length > 0 ? 'From paid bookings only' : 'No completed payments yet'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Satisfaction Score / Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              AVG. RATING
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {avgRating !== null ? `${avgRating} ★` : '—'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              {avgRating !== null ? `${totalRatingsCount} verified review${totalRatingsCount > 1 ? 's' : ''}` : 'No ratings yet'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & CSV Export */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Customer Type Filter */}
          <select
            value={selectedCategory}
            onChange={e => handleCategoryChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs shrink-0"
          >
            <option value="All">All Customer Types</option>
            <option value="VIP Member">VIP Member</option>
            <option value="Regular Customer">Regular Customer</option>
            <option value="First-time Customer">First-time Customer</option>
          </select>

          {/* Customer Locality Filter */}
          <select
            value={selectedLocality}
            onChange={e => handleLocalityChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-2xs shrink-0 max-w-[180px] truncate"
          >
            <option value="All">All Localities</option>
            {dynamicLocalities.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Search Box - Expands to occupy available space without truncation */}
          <div className="relative flex-1 min-w-[260px] md:min-w-[320px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name, phone number or location..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-colors shadow-2xs"
            />
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" /> <span>Reset</span>
          </button>
        </div>

        <button
          onClick={exportCustomersToCSV}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-700" /> <span>Export CSV</span>
        </button>
      </div>

      {/* 4. Desktop & Laptop Table View (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center whitespace-nowrap align-middle">#</th>
                <th className="py-3 px-4 text-left whitespace-nowrap min-w-[190px] align-middle">CUSTOMER</th>
                <th className="py-3 px-4 text-left whitespace-nowrap w-36 align-middle">PHONE</th>
                <th className="py-3 px-4 text-left whitespace-nowrap w-36 align-middle">CUSTOMER TYPE</th>
                <th className="py-3 px-4 text-left whitespace-nowrap min-w-[180px] max-w-[260px] align-middle">ADDRESS</th>
                <th className="py-3 px-4 text-center whitespace-nowrap w-24 align-middle">BOOKINGS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap w-28 align-middle">SPEND</th>
                <th className="py-3 px-4 text-center whitespace-nowrap w-32 align-middle">LAST BOOKING</th>
                <th className="py-3 px-4 text-center whitespace-nowrap w-24 align-middle">RATING</th>
                <th className="py-3 px-4 text-right whitespace-nowrap w-32 align-middle">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {paginatedCustomers.map((c, idx) => {
                const typeBadge = c.customerType === 'VIP Member'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : c.customerType === 'First-time Customer'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-emerald-100 text-emerald-800';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* # Column */}
                    <td className="py-3 px-3 text-center text-slate-400 font-bold whitespace-nowrap align-middle">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {/* 1. Customer Column (Name + optional Partner badge, NO 'CUSTOMER' badge) */}
                    <td className="py-3 px-4 text-left align-middle">
                      <div>
                        <strong className="text-slate-900 font-bold block text-sm tracking-tight whitespace-nowrap">
                          {formatCustomerName(c.name)}
                        </strong>
                        {c.isPartner && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                              PARTNER
                            </span>
                          </div>
                        )}
                        {c.email ? (
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate max-w-[200px]" title={c.email}>
                            {c.email}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* 2. Phone Column */}
                    <td className="py-3 px-4 text-left whitespace-nowrap font-semibold text-slate-800 align-middle">
                      <a
                        href={`tel:${c.phone}`}
                        className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1.5"
                        title="Call Customer"
                      >
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{formatCustomerPhone(c.phone)}</span>
                      </a>
                    </td>

                    {/* 3. Customer Type Column */}
                    <td className="py-3 px-4 text-left whitespace-nowrap align-middle">
                      {c.isPartner ? (
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide bg-gradient-to-r from-emerald-100 via-teal-100 to-purple-100 text-slate-900 border border-purple-200">
                            Customer + Partner
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 capitalize">
                            KYC: {c.partnerStatus || 'Pending'}
                          </span>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${typeBadge}`}>
                          {c.customerType}
                        </span>
                      )}
                    </td>

                    {/* 4. Address Column (Renamed from LOCALITY) */}
                    <td className="py-3 px-4 text-left whitespace-nowrap font-medium text-slate-700 align-middle">
                      <div className="flex items-center gap-1.5 max-w-[260px] truncate">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${c.locality === 'Address not added' ? 'text-slate-400' : 'text-emerald-600'}`} />
                        <span className={`truncate ${c.locality === 'Address not added' ? 'text-slate-400 font-normal italic' : 'text-slate-800 font-semibold'}`}>
                          {c.locality}
                        </span>
                      </div>
                    </td>

                    {/* 5. Bookings Column (Only numeric count e.g. 0) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap align-middle">
                      <span className="font-bold text-slate-900 text-sm">
                        {c.totalBookings}
                      </span>
                    </td>

                    {/* 6. Spend Column */}
                    <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                      <div className="font-black text-slate-900 text-sm">
                        ₹{c.totalSpent.toLocaleString()}
                      </div>
                      {c.totalSpent === 0 && c.totalBookings > 0 ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block w-fit ml-auto mt-0.5">
                          Unpaid
                        </span>
                      ) : null}
                    </td>

                    {/* 7. Last Booking Column */}
                    <td className="py-3 px-4 text-center whitespace-nowrap text-slate-500 font-medium align-middle">
                      {c.lastBookingDate}
                    </td>

                    {/* 8. Rating Column (Only numeric rating e.g. — or 5.0) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap align-middle">
                      {c.avgRating > 0 ? (
                        <div className="inline-flex items-center justify-center gap-1 font-extrabold text-slate-900 text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                          <span>{c.avgRating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold text-sm">—</span>
                      )}
                    </td>

                    {/* 9. Actions Column */}
                    <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                      <button
                        onClick={() => handleOpenDrawer(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">
                      {totalCustomers === 0 ? 'No customers registered yet.' : 'No customers found matching filter criteria.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Smart Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="customers"
          />
        </div>
      </div>

      {/* 5. Mobile / Tablet Responsive Cards (< 768px) */}
      <div className="block md:hidden space-y-3">
        {paginatedCustomers.map(c => {
          const typeBadge = c.customerType === 'VIP Member'
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : c.customerType === 'First-time Customer'
            ? 'bg-sky-100 text-sky-800'
            : 'bg-emerald-100 text-emerald-800';

          return (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <strong className="text-sm font-bold text-slate-900 block">{formatCustomerName(c.name)}</strong>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                      CUSTOMER
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${typeBadge}`}>
                      {c.customerType}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenDrawer(c)}
                  className="px-3 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100 text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{formatCustomerPhone(c.phone)}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${c.locality === 'Address not added' ? 'text-slate-400' : 'text-emerald-600'}`} />
                  <span className={`truncate ${c.locality === 'Address not added' ? 'text-slate-400 font-normal italic' : 'text-slate-800 font-semibold'}`}>
                    {c.locality}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">BOOKINGS</span>
                  <span className="font-bold text-slate-900">{c.totalBookings}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">LIFETIME SPEND</span>
                  <span className="font-black text-slate-900">₹{c.totalSpent.toLocaleString()}</span>
                  {c.totalSpent === 0 && c.totalBookings > 0 && (
                    <span className="text-[10px] text-amber-700 font-semibold block">Unpaid booking</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 p-6">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">
              {totalCustomers === 0 ? 'No customers registered yet.' : 'No customers found matching filter criteria.'}
            </p>
          </div>
        )}

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            itemLabel="customers"
          />
        </div>
      </div>

      {/* 6. Side Drawer View - Customer Profile */}
      {activeDrawerCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col font-sans">
            {/* Header: Strictly NO profile photo or avatar container */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {formatCustomerName(activeDrawerCustomer.name)}
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    activeDrawerCustomer.customerType === 'VIP Member' 
                      ? 'bg-amber-100 text-amber-900' 
                      : activeDrawerCustomer.customerType === 'Regular Customer'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-sky-100 text-sky-900'
                  }`}>
                    {activeDrawerCustomer.customerType}
                  </span>
                  {activeDrawerCustomer.isPartner && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300">
                      Partner
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Joined on {formatDateDDMMYYYY(activeDrawerCustomer.joinedDate)}
                </p>
              </div>

              <button 
                onClick={handleCloseDrawer} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Financial Stats Breakdown (Resolves issue 7 & 25) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
                  <span className="text-lg font-black text-slate-900">{activeDrawerCustomer.totalBookings}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Paid Spend</span>
                  <span className="text-lg font-black text-emerald-950">₹{activeDrawerCustomer.totalSpent.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Pending Value</span>
                  <span className="text-lg font-black text-amber-950">₹{activeDrawerCustomer.pendingAmount.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Avg Rating</span>
                  <span className="text-lg font-black text-purple-950 flex items-center gap-1">
                    {activeDrawerCustomer.avgRating > 0 ? (
                      <>
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        {activeDrawerCustomer.avgRating.toFixed(1)}
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">—</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Contact Information
              </h4>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium mb-6 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Phone</span>
                  <strong className="text-slate-900 font-bold">{formatCustomerPhone(activeDrawerCustomer.phone)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Email</span>
                  <strong className="text-slate-900 font-bold">
                    {activeDrawerCustomer.email || 'Not provided'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Locality</span>
                  <strong className={`font-semibold ${activeDrawerCustomer.locality === 'Address not added' ? 'text-slate-400 font-normal italic' : 'text-slate-900'}`}>
                    {activeDrawerCustomer.locality}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Account Type</span>
                  <span className="font-extrabold text-emerald-800">
                    {activeDrawerCustomer.isPartner ? 'Customer + Partner (Dual-Role)' : 'Customer Only'}
                  </span>
                </div>
              </div>

              {/* Dual-Role Partner Profile & KYC Section */}
              {activeDrawerCustomer.isPartner && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-slate-50 to-emerald-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
                      <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                        Partner Profile & KYC
                      </h4>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                      Status: {activeDrawerCustomer.partnerStatus || 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Partner Jobs Completed</span>
                      <strong className="text-slate-900 font-black text-sm">{activeDrawerCustomer.partnerJobsCount || 0} jobs</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">Service Area</span>
                      <strong className="text-slate-900 font-bold text-xs truncate block">
                        {activeDrawerCustomer.partnerProfile?.service_area || (!isFakeLocation(activeDrawerCustomer.locality) ? activeDrawerCustomer.locality : 'Not specified')}
                      </strong>
                    </div>
                  </div>

                  {activeDrawerCustomer.partnerProfile?.bank_account_name && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] mb-3">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Bank Payout Info</span>
                      <div className="text-slate-700">
                        {activeDrawerCustomer.partnerProfile.bank_name} • A/C: {activeDrawerCustomer.partnerProfile.bank_account_number ? '••••' + activeDrawerCustomer.partnerProfile.bank_account_number.slice(-4) : 'Provided'}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      handleCloseDrawer();
                      setCurrentTab('maids');
                    }}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Open in Partner Management →
                  </button>
                </div>
              )}

              {/* Saved Addresses */}
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Saved Addresses ({activeDrawerCustomer.allAddresses.length})
              </h4>
              <div className="space-y-2 mb-6">
                {activeDrawerCustomer.allAddresses.length > 0 ? (
                  activeDrawerCustomer.allAddresses.map((addr, idx) => {
                    const formatted = [addr.street, addr.locality, addr.city, addr.pincode].filter(Boolean).join(', ');
                    return (
                      <div key={addr.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="flex items-start justify-between mb-1">
                          <strong className="text-slate-900 font-bold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {addr.label}
                          </strong>
                          {addr.isPrimary && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {formatted || 'Address not added'}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                    <MapPin className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <p className="text-xs font-medium">Address not added</p>
                  </div>
                )}
              </div>

              {/* Preferred Services */}
              {activeDrawerCustomer.preferredServices.length > 0 && (
                <>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Preferred Services
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {activeDrawerCustomer.preferredServices.map((service, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Booking History */}
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Booking History ({activeDrawerCustomer.bookingHistory.length})
              </h4>
              <div className="space-y-2.5 mb-6 max-h-96 overflow-y-auto">
                {activeDrawerCustomer.bookingHistory.length > 0 ? (
                  activeDrawerCustomer.bookingHistory.map((booking, idx) => {
                    const statusConfig = {
                      completed: { bg: 'bg-emerald-100', text: 'text-emerald-900', icon: CheckCircle, label: 'Completed' },
                      cancelled: { bg: 'bg-red-100', text: 'text-red-900', icon: XCircle, label: 'Cancelled' },
                      ongoing: { bg: 'bg-sky-100', text: 'text-sky-900', icon: Clock, label: 'Ongoing' },
                      in_progress: { bg: 'bg-sky-100', text: 'text-sky-900', icon: Clock, label: 'In Progress' },
                      pending_assignment: { bg: 'bg-amber-100', text: 'text-amber-900', icon: AlertCircle, label: 'Pending' },
                    };
                    const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.ongoing;
                    const StatusIcon = status.icon;

                    const isBookingPaid = booking.paymentStatus === 'paid' || (booking as any).payment_status === 'paid';

                    return (
                      <div key={booking.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <strong className="text-slate-900 font-bold block text-sm">{booking.serviceName || 'Home Cleaning'}</strong>
                            <span className="text-[11px] text-slate-500">
                              {formatDateDDMMYYYY(booking.date || booking.scheduled_date || booking.createdAt)} • {booking.timeSlot || booking.time_slot || '10:00 AM'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`${status.bg} ${status.text} px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isBookingPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {isBookingPaid ? 'Paid' : 'Payment Pending'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-600 truncate max-w-[200px]">
                            {booking.address?.locality || 'Location not specified'}
                          </span>
                          <strong className="text-slate-900 font-black">₹{Number(booking.totalAmount || booking.servicePrice || 0).toLocaleString()}</strong>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                    <Calendar className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No booking history available</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {activeDrawerCustomer.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                  <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Admin Notes
                  </span>
                  <p className="text-amber-800">{activeDrawerCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3 mt-auto">
              <button
                onClick={() => window.open(`tel:${activeDrawerCustomer.phone}`)}
                className="flex-1 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call Customer
              </button>
              <button
                onClick={handleCloseDrawer}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
