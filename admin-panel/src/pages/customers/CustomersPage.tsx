import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Customer } from '../../types';
import { supabase } from '../../config/supabase';
import { PaginationControls } from '../../components/PaginationControls';
import { exportCustomersToCSV as triggerExportCustomers } from '../../utils/exportUtils';
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
  AlertCircle
} from 'lucide-react';

interface CustomerWithDetails extends Customer {
  allAddresses: any[];
  bookingHistory: any[];
  avgRating: number;
  totalRatingsGiven: number;
  preferredServices: string[];
  isPartner?: boolean;
  partnerStatus?: string;
  partnerProfile?: any;
  partnerJobsCount?: number;
  customerBookingsCount?: number;
}

export const CustomersPage: React.FC = () => {
  const { customers: contextCustomers, bookings, ratings, setCurrentTab } = useAdmin();

  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocality, setSelectedLocality] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDrawerCustomer, setActiveDrawerCustomer] = useState<CustomerWithDetails | null>(null);

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
          if (!addressesByUser.has(addr.user_id)) {
            addressesByUser.set(addr.user_id, []);
          }
          addressesByUser.get(addr.user_id)!.push({
            id: addr.id,
            user_id: addr.user_id,
            label: addr.label || 'Home',
            street: addr.street_address || addr.street || '',
            locality: addr.locality || '',
            city: addr.city || 'Hyderabad',
            pincode: addr.pincode || '500081',
            is_primary: addr.is_default,
          });
        });

        // Enrich each customer with full details
        const enriched: CustomerWithDetails[] = contextCustomers.map(cust => {
          const userBookings = bookings.filter(b => b.customerId === cust.id);
          const userRatings = ratings.filter(r => r.customerId === cust.id);
          const completedBookings = userBookings.filter(b => b.status === 'completed');
          
          const totalSpent = completedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
          const avgRating = userRatings.length > 0 
            ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length 
            : 0;

          // Determine customer type based on spend and booking count
          let customerType = 'First-time Customer';
          if (totalSpent > 5000 || userBookings.length >= 5) {
            customerType = 'VIP Member';
          } else if (userBookings.length > 1) {
            customerType = 'Regular Customer';
          }

          // Get preferred services (most booked service names)
          const serviceCounts = new Map<string, number>();
          userBookings.forEach(b => {
            const serviceName = b.serviceName || 'Unknown Service';
            serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
          });
          const preferredServices = Array.from(serviceCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

          // Get all addresses for this user
          const allAddresses = addressesByUser.get(cust.id) || [];
          const primaryAddress = allAddresses.find(a => a.is_primary) || allAddresses[0];

          // Sort bookings by date descending
          const sortedBookings = [...userBookings].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          const lastBooking = sortedBookings[0];
          const lastBookingDate = lastBooking?.date || lastBooking?.createdAt 
            ? new Date(lastBooking.createdAt || lastBooking.date).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })
            : 'No bookings yet';

          return {
            ...cust,
            customerType,
            locality: primaryAddress?.locality || cust.locality || 'Not specified',
            address: primaryAddress ? {
              id: primaryAddress.id,
              label: primaryAddress.label || 'Home',
              street: primaryAddress.street,
              locality: primaryAddress.locality,
              city: primaryAddress.city,
              pincode: primaryAddress.pincode,
            } : cust.address,
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
            totalSpent: totalSpent,
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
        // Fallback to basic customer data
        const basic: CustomerWithDetails[] = contextCustomers.map(c => ({
          ...c,
          allAddresses: [],
          bookingHistory: [],
          avgRating: 0,
          totalRatingsGiven: 0,
          preferredServices: [],
        }));
        setCustomers(basic);
      }
    };

    if (contextCustomers.length > 0) {
      enrichCustomers();
    } else {
      setCustomers([]);
    }
  }, [contextCustomers, bookings, ratings]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCustomers = customers.filter(c => {
    if (selectedCategory !== 'All' && c.customerType !== selectedCategory) return false;
    if (selectedLocality !== 'All' && !(c.locality || '').toLowerCase().includes(selectedLocality.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!(c.name || '').toLowerCase().includes(q) && !(c.phone || '').includes(q) && !(c.email || '').toLowerCase().includes(q) && !(c.locality || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCustomers = customers.length;
  const vipCount = customers.filter(c => c.customerType === 'VIP Member').length;
  const totalSpentSum = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLtv = totalCustomers > 0 ? Math.round(totalSpentSum / totalCustomers) : 0;
  
  // Calculate actual average rating from all customer ratings
  const customersWithRatings = customers.filter(c => c.totalRatingsGiven > 0);
  const totalRatingSum = customersWithRatings.reduce((sum, c) => sum + (c.avgRating * c.totalRatingsGiven), 0);
  const totalRatingsCount = customersWithRatings.reduce((sum, c) => sum + c.totalRatingsGiven, 0);
  const avgRating = totalRatingsCount > 0 ? (totalRatingSum / totalRatingsCount).toFixed(1) : '0.0';

  // Get unique localities for filter dropdown
  const uniqueLocalities = Array.from(new Set(customers.map(c => c.locality).filter(Boolean))).sort();

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedLocality('All');
    setSearchQuery('');
  };

  const exportCustomersToCSV = () => {
    triggerExportCustomers(filteredCustomers);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Customers Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View, manage, and audit all customer accounts, lifetime bookings, and spending history.
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Total Customers</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalCustomers}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Active VIP Members</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{vipCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Avg Lifetime Value</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-950">₹{avgLtv.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">Satisfaction Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{avgRating} ★</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>
      </div>

      {/* Filter Bar & CSV Export */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="VIP Member">VIP Member</option>
            <option value="Regular Customer">Regular Customer</option>
            <option value="First-time Customer">First-time Customer</option>
          </select>

          <select
            value={selectedLocality}
            onChange={e => setSelectedLocality(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Localities</option>
            {uniqueLocalities.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer name, phone or locality..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
            />
          </div>

          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        <button
          onClick={exportCustomersToCSV}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-700" /> Export CSV
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Locality</th>
                <th className="py-3.5 px-4">Total Bookings</th>
                <th className="py-3.5 px-4">Lifetime Spend</th>
                <th className="py-3.5 px-4">Last Booking Date</th>
                <th className="py-3.5 px-4">Rating Given</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedCustomers.map((c, idx) => {
                const typeBadge = c.customerType === 'VIP Member'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : c.customerType === 'First-time Customer'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-emerald-100 text-emerald-800';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <strong className="text-slate-900 font-bold block text-sm">{c.name}</strong>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                              CUSTOMER
                            </span>
                            {c.isPartner && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                                PARTNER
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{c.email || c.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.phone}</td>
                    <td className="py-3.5 px-4">
                      {c.isPartner ? (
                        <div className="flex flex-col gap-1 items-start">
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
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.locality}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{c.totalBookings} booked</span>
                        {c.isPartner && (
                          <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-0.5 w-fit">
                            {c.partnerJobsCount || 0} partner jobs
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#123D2A]">₹{c.totalSpent.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-500">{c.lastBookingDate}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-1">
                      {c.avgRating > 0 ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 
                          {c.avgRating.toFixed(1)}
                        </>
                      ) : (
                        <span className="text-slate-400 text-xs">No ratings</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveDrawerCustomer(c)}
                        className="px-3.5 py-1.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        View Profile
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

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80">
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Side Drawer View - Enhanced Customer Profile */}
      {activeDrawerCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col font-sans">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <img 
                  src={activeDrawerCustomer.avatarUrl} 
                  alt={activeDrawerCustomer.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600" 
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    {activeDrawerCustomer.name}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeDrawerCustomer.customerType === 'VIP Member' 
                        ? 'bg-amber-100 text-amber-900' 
                        : activeDrawerCustomer.customerType === 'Regular Customer'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-sky-100 text-sky-900'
                    }`}>
                      {activeDrawerCustomer.customerType}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Joined on {activeDrawerCustomer.joinedDate}</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveDrawerCustomer(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-800 block">Total Bookings</span>
                  <span className="text-lg font-black text-emerald-950">{activeDrawerCustomer.totalBookings}</span>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <span className="text-[11px] font-semibold text-sky-800 block">Lifetime Spend</span>
                  <span className="text-lg font-black text-sky-950">₹{activeDrawerCustomer.totalSpent.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-800 block">Avg Rating Given</span>
                  <span className="text-lg font-black text-amber-950 flex items-center gap-1">
                    {activeDrawerCustomer.avgRating > 0 ? (
                      <>
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        {activeDrawerCustomer.avgRating.toFixed(1)}
                      </>
                    ) : (
                      <span className="text-sm">No ratings</span>
                    )}
                  </span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[11px] font-semibold text-purple-800 block">Total Reviews</span>
                  <span className="text-lg font-black text-purple-950">{activeDrawerCustomer.totalRatingsGiven}</span>
                </div>
              </div>

              {/* Contact Information */}
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Contact Information
              </h4>
              <div className="space-y-2.5 text-xs text-slate-700 font-medium mb-6 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Phone</span>
                  <strong className="text-slate-900 font-bold">{activeDrawerCustomer.phone}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Email</span>
                  <strong className="text-slate-900 font-bold">{activeDrawerCustomer.email || 'Not provided'}</strong>
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
                        {activeDrawerCustomer.partnerProfile?.service_area || activeDrawerCustomer.locality || 'Karimnagar'}
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
                      setActiveDrawerCustomer(null);
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
                  activeDrawerCustomer.allAddresses.map((addr, idx) => (
                    <div key={addr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
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
                        {addr.street}, {addr.locality}, {addr.city} - {addr.pincode}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                    <MapPin className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs">No saved addresses</p>
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

                    return (
                      <div key={booking.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <strong className="text-slate-900 font-bold block text-sm">{booking.serviceName || 'Service'}</strong>
                            <span className="text-[11px] text-slate-500">
                              {booking.date} • {booking.timeSlot}
                            </span>
                          </div>
                          <span className={`${status.bg} ${status.text} px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            {booking.address?.locality || 'Location not specified'}
                          </span>
                          <strong className="text-emerald-950 font-black">₹{Number(booking.totalAmount).toLocaleString()}</strong>
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
                className="flex-1 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call Customer
              </button>
              <button
                onClick={() => setActiveDrawerCustomer(null)}
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

