import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../config/supabase';
import { formatDateDDMMYYYY, getPaymentDisplayInfo, getPartnerEstimatedEarnings } from '../../utils/bookingDisplayUtils';
import {
  ChevronRight,
  User,
  Phone,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Star,
  Navigation,
  AlertCircle,
  Package,
  ShieldCheck,
  UserCheck,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';

interface BookingItem {
  id: string;
  service_id?: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const BookingDetailsPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();
  const {
    bookings,
    selectedBooking,
    openAssignMaid,
    setRescheduleModalOpen,
    setCancelModalOpen,
  } = useAdmin();

  const [directBooking, setDirectBooking] = useState<any>(null);
  const [fetchingDirect, setFetchingDirect] = useState<boolean>(false);
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const [customerReview, setCustomerReview] = useState<{ rating: number; comment?: string; reviewed_at?: string } | null>(null);
  const [assignedPartnerProfile, setAssignedPartnerProfile] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState<{ totalBookings: number; totalSpent: number; customerType: string }>({
    totalBookings: 1,
    totalSpent: 0,
    customerType: 'First-time Customer',
  });

  // 1. Resolve booking from context or direct fetch
  const b =
    (selectedBooking && (!bookingId || selectedBooking.bookingId === bookingId || selectedBooking.id === bookingId))
      ? selectedBooking
      : (bookingId ? bookings.find(item => item.bookingId === bookingId || item.id === bookingId) : null) || directBooking;

  // 2. Fallback fetch if opened directly via URL or on refresh
  useEffect(() => {
    if (!b && bookingId) {
      setFetchingDirect(true);
      supabase
        .from('bookings')
        .select('*')
        .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`)
        .maybeSingle()
        .then(({ data, error }) => {
          setFetchingDirect(false);
          if (data && !error) {
            setDirectBooking({
              id: data.id,
              bookingId: data.booking_code || data.id,
              customerId: data.customer_id,
              customerName: data.customer_name || 'Customer',
              customerPhone: data.customer_phone || '',
              customerEmail: data.customer_email || '',
              serviceId: data.service_id,
              serviceName: data.service_name || 'Home Cleaning',
              servicePrice: Number(data.service_price || data.total_amount || 0),
              totalAmount: Number(data.total_amount || 0),
              serviceDuration: data.service_duration || '3 Hours',
              address: {
                id: 'addr_' + (data.booking_code || data.id),
                label: data.address_label || 'Home',
                street: data.address_street || '',
                locality: data.address_locality || '',
                city: data.address_city || 'Karimnagar',
                pincode: data.address_pincode || '',
              },
              date: data.scheduled_date || '',
              timeSlot: data.time_slot || '10:00 AM',
              specialInstructions: data.special_instructions,
              status: data.status || 'pending_assignment',
              adminApprovalStatus: data.admin_approval_status || 'pending',
              assignmentStatus: data.assignment_status || 'unassigned',
              categoryName: data.category_name || 'General',
              selectedAddOns: Array.isArray(data.selected_addons) ? data.selected_addons : [],
              assignedMaidId: data.assigned_maid_id,
              assignedMaidName: data.assigned_maid_name,
              assignedMaidPhone: data.assigned_maid_phone,
              assignedMaidPhotoUrl: data.assigned_maid_photo_url,
              assignedMaidRating: data.assigned_maid_rating ? Number(data.assigned_maid_rating) : undefined,
              paymentMethod: data.payment_method || 'cash',
              paymentStatus: data.payment_status || 'pending',
              transactionId: data.transaction_id,
              paidAt: data.paid_at,
              cancellationReason: data.cancellation_reason,
              rescheduleReason: data.reschedule_reason,
              createdAt: data.created_at,
              partner_accepted_at: data.partner_accepted_at,
              partner_arrived_at: data.partner_arrived_at,
              partner_en_route_at: data.partner_en_route_at,
              service_started_at: data.service_started_at,
              completed_at: data.completed_at,
              otp_verified: data.otp_verified,
              otp_verified_at: data.otp_verified_at,
              partner_distance_km: data.partner_distance_km,
              partner_eta_minutes: data.partner_eta_minutes,
              tip_amount: data.tip_amount,
              partner_earnings: data.partner_earnings,
              discount_amount: data.discount_amount,
              coupon_code: data.coupon_code,
              platform_fee: data.platform_fee,
              tax_amount: data.tax_amount,
            });
          }
        });
    }
  }, [b, bookingId]);

  // 3. Realtime subscription for this specific booking
  useEffect(() => {
    const targetCode = bookingId || b?.bookingId;
    if (!targetCode) return;

    const channel = supabase
      .channel(`booking-details-realtime-${targetCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        payload => {
          const row: any = payload.new;
          if (row && (row.booking_code === targetCode || row.id === targetCode || row.id === b?.id)) {
            setDirectBooking((prev: any) => ({
              ...(prev || {}),
              ...row,
              bookingId: row.booking_code || row.id,
              customerName: row.customer_name || prev?.customerName,
              customerPhone: row.customer_phone || prev?.customerPhone,
              customerEmail: row.customer_email || prev?.customerEmail,
              serviceName: row.service_name || prev?.serviceName,
              totalAmount: Number(row.total_amount || prev?.totalAmount || 0),
              date: row.scheduled_date || prev?.date,
              timeSlot: row.time_slot || prev?.timeSlot,
              specialInstructions: row.special_instructions,
              status: row.status || prev?.status,
              paymentMethod: row.payment_method || prev?.paymentMethod,
              paymentStatus: row.payment_status || prev?.paymentStatus,
              transactionId: row.transaction_id || prev?.transactionId,
              paidAt: row.paid_at || prev?.paidAt,
              assignedMaidId: row.assigned_maid_id,
              assignedMaidName: row.assigned_maid_name,
              assignedMaidPhone: row.assigned_maid_phone,
              partner_accepted_at: row.partner_accepted_at,
              partner_arrived_at: row.partner_arrived_at,
              partner_en_route_at: row.partner_en_route_at,
              service_started_at: row.service_started_at,
              completed_at: row.completed_at,
              otp_verified: row.otp_verified,
              otp_verified_at: row.otp_verified_at,
              tip_amount: row.tip_amount,
              partner_earnings: row.partner_earnings,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, b?.bookingId, b?.id]);

  // 4. Fetch Deep Real Data: items, partner profile, customer history, timeline logs, ratings
  useEffect(() => {
    if (!b) return;
    const fetchDeepData = async () => {
      try {
        const bookingDbId = b.id;

        // A. Multi-Service items from booking_items table
        if (bookingDbId) {
          const { data: items } = await supabase
            .from('booking_items')
            .select('*')
            .eq('booking_id', bookingDbId);
          if (items && items.length > 0) {
            setBookingItems(items);
          }
        }

        // B. Assigned Partner Profile from maid_profiles
        if (b.assignedMaidId) {
          const { data: partnerData } = await supabase
            .from('maid_profiles')
            .select('*')
            .or(`id.eq.${b.assignedMaidId},maid_code.eq.${b.assignedMaidId}`)
            .maybeSingle();
          if (partnerData) {
            setAssignedPartnerProfile(partnerData);
          }
        } else {
          setAssignedPartnerProfile(null);
        }

        // C. Customer History stats
        if (b.customerId || b.customerPhone) {
          const custQuery = supabase
            .from('bookings')
            .select('id, total_amount, payment_status, status');
          if (b.customerId) {
            custQuery.eq('customer_id', b.customerId);
          } else {
            custQuery.eq('customer_phone', b.customerPhone);
          }
          const { data: cBookings } = await custQuery;
          if (cBookings) {
            const count = cBookings.length;
            const paid = cBookings.filter(bk => bk.payment_status === 'paid' && bk.status !== 'cancelled');
            const spend = paid.reduce((acc, bk) => acc + (Number(bk.total_amount) || 0), 0);
            let cType = 'First-time Customer';
            if (spend > 5000 || count >= 5) cType = 'VIP Member';
            else if (count > 1) cType = 'Regular Customer';
            setCustomerStats({ totalBookings: count, totalSpent: spend, customerType: cType });
          }
        }

        // D. Timeline Logs from booking_timeline_logs table
        if (bookingDbId) {
          const { data: logs } = await supabase
            .from('booking_timeline_logs')
            .select('*')
            .eq('booking_id', bookingDbId)
            .order('created_at', { ascending: true });
          if (logs && logs.length > 0) {
            setTimelineLogs(logs);
          }
        }

        // E. Customer Review & Rating from ratings table
        if (bookingDbId) {
          const { data: ratingData } = await supabase
            .from('ratings')
            .select('*')
            .eq('booking_id', bookingDbId)
            .maybeSingle();
          if (ratingData) {
            setCustomerReview({
              rating: ratingData.rating,
              comment: ratingData.comment,
              reviewed_at: ratingData.reviewed_at || ratingData.created_at,
            });
          }
        }
      } catch (err) {
        console.warn('BookingDetailsPage deep data fetch notice:', err);
      }
    };

    fetchDeepData();
  }, [b?.bookingId, b?.id, b?.assignedMaidId, b?.customerId, b?.customerPhone]);

  if (fetchingDirect) {
    return (
      <div className="p-16 text-center text-slate-500 font-sans flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#123D2A] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-600">Loading booking details...</p>
      </div>
    );
  }

  if (!b) {
    return (
      <div className="p-12 text-center text-slate-500 font-sans max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-slate-800">Booking Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          {bookingId ? `Could not locate booking "${bookingId}".` : 'No booking details selected.'}
        </p>
        <button
          onClick={() => navigate('/admin/bookings')}
          className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          Return to All Bookings
        </button>
      </div>
    );
  }

  const paymentInfo = getPaymentDisplayInfo(b.paymentStatus, b.paymentMethod);
  const isPartnerAssigned = Boolean(b.assignedMaidId || b.assignedMaidName);

  // Helper to format ISO timestamps nicely
  const formatTimestamp = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  // Build Real Timeline Events (Only events that actually occurred)
  const realTimelineEvents: { id: string; title: string; time: string; details?: string; actor?: string }[] = [];

  if (b.createdAt) {
    realTimelineEvents.push({
      id: 'evt_created',
      title: 'Booking Created',
      time: formatTimestamp(b.createdAt),
      details: `Booking placed for ${b.serviceName}`,
      actor: 'Customer',
    });
  }

  if (b.partner_search_started_at || (b.assignmentStatus && b.assignmentStatus !== 'unassigned')) {
    realTimelineEvents.push({
      id: 'evt_dispatch',
      title: 'Assignment Requested',
      time: formatTimestamp(b.partner_search_started_at || b.createdAt),
      details: b.assignedMaidName ? `Assigned to ${b.assignedMaidName}` : 'Partner dispatch initiated',
      actor: 'Admin / System',
    });
  }

  if (b.partner_accepted_at) {
    realTimelineEvents.push({
      id: 'evt_accepted',
      title: 'Partner Accepted',
      time: formatTimestamp(b.partner_accepted_at),
      details: `${b.assignedMaidName || 'Partner'} accepted the booking request`,
      actor: 'Partner',
    });
  }

  if (b.partner_en_route_at) {
    realTimelineEvents.push({
      id: 'evt_en_route',
      title: 'Partner En Route',
      time: formatTimestamp(b.partner_en_route_at),
      details: 'Partner started journey towards service address',
      actor: 'Partner',
    });
  }

  if (b.partner_arrived_at) {
    realTimelineEvents.push({
      id: 'evt_arrived',
      title: 'Partner Arrived',
      time: formatTimestamp(b.partner_arrived_at),
      details: 'Partner confirmed arrival at customer location',
      actor: 'Partner',
    });
  }

  if (b.otp_verified_at) {
    realTimelineEvents.push({
      id: 'evt_otp_verified',
      title: 'Service Start OTP Verified',
      time: formatTimestamp(b.otp_verified_at),
      details: 'Customer OTP verified securely by partner',
      actor: 'Partner & Customer',
    });
  }

  if (b.service_started_at) {
    realTimelineEvents.push({
      id: 'evt_started',
      title: 'Service Started',
      time: formatTimestamp(b.service_started_at),
      details: 'Cleaning job commenced',
      actor: 'Partner',
    });
  }

  if (b.completed_at) {
    realTimelineEvents.push({
      id: 'evt_completed',
      title: 'Service Completed',
      time: formatTimestamp(b.completed_at),
      details: 'Service marked complete by partner',
      actor: 'Partner',
    });
  }

  if (b.status === 'cancelled') {
    realTimelineEvents.push({
      id: 'evt_cancelled',
      title: 'Booking Cancelled',
      time: formatTimestamp(b.updated_at || b.createdAt),
      details: b.cancellationReason ? `Reason: ${b.cancellationReason}` : 'Booking was cancelled',
      actor: 'System / Customer',
    });
  }

  if (b.paymentStatus === 'paid' && b.paidAt) {
    realTimelineEvents.push({
      id: 'evt_paid',
      title: 'Payment Collected',
      time: formatTimestamp(b.paidAt),
      details: `Full payment of ₹${b.totalAmount} collected via ${paymentInfo.methodLabel}`,
      actor: 'Payment Gateway',
    });
  }

  // Merge any distinct database timeline logs
  (timelineLogs || []).forEach((log: any, idx: number) => {
    if (log.title && !realTimelineEvents.some(e => e.title.toLowerCase() === log.title.toLowerCase())) {
      realTimelineEvents.push({
        id: log.id || `log_${idx}`,
        title: log.title,
        time: formatTimestamp(log.created_at),
        details: log.details,
        actor: log.actor_name || log.actor_type,
      });
    }
  });

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-12">
      {/* Breadcrumb & Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span onClick={() => navigate('/admin/dashboard')} className="hover:text-slate-600 cursor-pointer">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span onClick={() => navigate('/admin/bookings')} className="hover:text-slate-600 cursor-pointer">Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#123D2A] font-bold">{b.bookingId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Booking Details
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Realtime verified lifecycle, customer, partner, and payment records for this booking.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openAssignMaid(b.bookingId)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#123D2A]" />
            <span>{isPartnerAssigned ? 'Reassign Partner' : 'Assign Partner'}</span>
          </button>

          <button
            onClick={() => setRescheduleModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#123D2A]" />
            <span>Reschedule</span>
          </button>

          <button
            onClick={() => setCancelModalOpen(true)}
            className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Booking</span>
          </button>

          <button
            onClick={() => window.open(`tel:${b.customerPhone}`)}
            className="bg-[#123D2A] hover:bg-[#184a34] text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact Customer</span>
          </button>
        </div>
      </div>

      {/* Booking Identifier & Status Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-[#0A192F] tracking-tight">{b.bookingId}</h2>
          <span className="bg-slate-100 text-slate-800 border border-slate-300 font-black px-3 py-1 rounded-full text-xs uppercase tracking-wide">
            {b.status.replace(/_/g, ' ')}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${paymentInfo.statusBadgeStyle}`}>
            {paymentInfo.statusLabel} ({paymentInfo.methodLabel})
          </span>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Booked on {formatTimestamp(b.createdAt)}
        </div>
      </div>

      {/* 3 Column Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Customer Details, Address, Notes) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Customer Details Card (Strictly Real Data, No Dummy Email) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Customer Details</h3>
              <span className="text-[10px] font-bold text-slate-400">Verified Profile</span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">{b.customerName || 'Registered Customer'}</h4>
              <a
                href={`tel:${b.customerPhone}`}
                className="text-xs text-slate-600 font-bold hover:text-emerald-700 flex items-center gap-1.5 mt-1"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {b.customerPhone || 'Phone not available'}
              </a>
              {/* Only display email if customer explicitly entered a real email */}
              {b.customerEmail &&
                !b.customerEmail.includes('customer@gchome.com') &&
                !b.customerEmail.includes('example.com') && (
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {b.customerEmail}
                  </div>
                )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Booking Address
              </div>
              <div className="text-xs font-bold text-slate-800 leading-snug">
                {b.address?.street ? `${b.address.street}, ` : ''}
                {b.address?.locality || 'Locality not specified'}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {b.address?.city || 'Karimnagar'} {b.address?.pincode ? `- ${b.address.pincode}` : ''}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Customer History</span>
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                {customerStats.customerType} ({customerStats.totalBookings} Booking{customerStats.totalBookings > 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Payment & Financial Breakdown Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Payment & Financials</h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${paymentInfo.statusBadgeStyle}`}>
                {paymentInfo.statusLabel}
              </span>
            </div>

            <div className="text-xs space-y-2 font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-extrabold text-slate-900">{paymentInfo.methodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Service Price:</span>
                <span className="font-bold text-slate-800">
                  ₹{Number(b.servicePrice || b.totalAmount || 0).toLocaleString()}
                </span>
              </div>

              {b.couponCode && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({b.couponCode}):</span>
                  <span>- ₹{b.discountAmount || 0}</span>
                </div>
              )}

              {b.platformFee !== undefined && Number(b.platformFee) > 0 && (
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>₹{b.platformFee}</span>
                </div>
              )}

              {b.taxAmount !== undefined && Number(b.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>GST / Tax:</span>
                  <span>₹{b.taxAmount}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="font-extrabold text-slate-900">Customer Total:</span>
                <span className="font-black text-slate-900 text-sm">₹{Number(b.totalAmount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-slate-100 text-emerald-900">
                <span className="font-bold">Partner Estimated Payout:</span>
                <span className="font-black">
                  ₹{b.partner_earnings ? Number(b.partner_earnings).toLocaleString() : getPartnerEstimatedEarnings(b.totalAmount).toLocaleString()}
                </span>
              </div>

              {b.tip_amount && Number(b.tip_amount) > 0 && (
                <div className="flex justify-between text-[#123D2A] font-bold">
                  <span>Customer Tip:</span>
                  <span>₹{Number(b.tip_amount).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span>Transaction ID:</span>
                <span className="font-bold text-slate-700">{b.transactionId || 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid On:</span>
                <span className="font-bold text-slate-700">
                  {b.paidAt ? formatTimestamp(b.paidAt) : (b.paymentStatus === 'paid' ? 'Paid' : 'Not paid yet')}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Special Instructions (Real Data Only) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0A192F] mb-3">Special Instructions</h3>
            {b.specialInstructions && b.specialInstructions.trim() ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 font-medium leading-relaxed italic">
                "{b.specialInstructions}"
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-400 font-medium">
                No special instructions provided.
              </div>
            )}
          </div>
        </div>

        {/* Middle Column (Services, Add-ons, Partner Details, Distance/ETA) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Service Details Card (Completely Dynamic & Supports Multi-Services) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Booked Services</h3>
              <span className="text-[10px] font-bold text-slate-400">{b.categoryName || 'Cleaning'}</span>
            </div>

            {/* If multi-service cart was used, display all items */}
            {bookingItems.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Services ({bookingItems.length})
                </span>
                {bookingItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-slate-900 block font-bold">{item.service_name}</strong>
                      <span className="text-slate-400 text-[11px]">Quantity: × {item.quantity || 1}</span>
                    </div>
                    <span className="font-black text-slate-900">
                      ₹{Number(item.subtotal || item.unit_price || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{b.serviceName || 'Home Cleaning'}</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl text-xs font-medium mt-2">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Estimated Duration</span>
                    <span className="font-extrabold text-slate-900">{b.serviceDuration || '3 Hours'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Price</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{Number(b.servicePrice || b.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Add-ons (Explicit List or Clear 'No Add-ons') */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Selected Add-ons
              </span>
              {(b.selectedAddOns || []).length > 0 ? (
                <div className="space-y-1.5">
                  {b.selectedAddOns.map((addon: any, idx: number) => {
                    const name = addon.name || addon.addonName || addon.title || 'Add-on';
                    const qty = addon.quantity || addon.qty || 1;
                    const price = addon.price ? Number(addon.price) : 0;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">• {name} × {qty}</span>
                        {price > 0 && (
                          <span className="font-bold text-[#123D2A]">₹{(price * qty).toLocaleString()}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 font-medium">
                  No add-ons selected
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Scheduled Slot
              </span>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                {formatDateDDMMYYYY(b.date)}, {b.timeSlot || 'Anytime'}
              </div>
            </div>
          </div>

          {/* Assigned Partner Card (Real Data Only, No Fake Maid) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Assigned Partner</h3>
              <button
                onClick={() => openAssignMaid(b.bookingId)}
                className="text-xs font-bold text-[#123D2A] hover:underline cursor-pointer"
              >
                {isPartnerAssigned ? 'Change' : 'Assign'}
              </button>
            </div>

            {isPartnerAssigned ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{b.assignedMaidName}</h4>
                    {b.assignedMaidPhone && (
                      <a
                        href={`tel:${b.assignedMaidPhone}`}
                        className="text-xs text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        {b.assignedMaidPhone}
                      </a>
                    )}
                    <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>
                        {assignedPartnerProfile?.rating
                          ? `${assignedPartnerProfile.rating.toFixed(1)} (${assignedPartnerProfile.totalRatingsCount || 0} reviews)`
                          : 'No reviews yet'}
                      </span>
                    </div>
                  </div>

                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-2.5 py-1 rounded-full text-[10px]">
                    {b.assignmentStatus === 'accepted' || b.partner_accepted_at ? 'Accepted' : 'Assigned'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs font-bold">
                  <div>
                    <div className="text-slate-900 font-black">
                      {assignedPartnerProfile?.completedJobsCount ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">Jobs Completed</div>
                  </div>
                  <div>
                    <div className="text-slate-900 font-black">
                      {assignedPartnerProfile?.isOnline ? 'Online' : 'Offline'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">Availability</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-2">
                <User className="w-8 h-8 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">No partner assigned yet</h4>
                <p className="text-xs text-slate-400">This booking is awaiting partner allocation.</p>
                <button
                  onClick={() => openAssignMaid(b.bookingId)}
                  className="mt-2 bg-[#123D2A] hover:bg-[#184a34] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Assign Partner
                </button>
              </div>
            )}
          </div>

          {/* Clean Partner → Customer Travel Card (Replaces Fake Live Map) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#123D2A]" />
                Partner → Customer Travel
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">Location Data</span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Distance</span>
                <span className="text-sm font-black text-slate-900">
                  {b.partner_distance_km ? `${b.partner_distance_km} km` : 'Not available'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Estimated Arrival</span>
                <span className="text-sm font-black text-slate-900">
                  {b.partner_eta_minutes ? `${b.partner_eta_minutes} mins` : 'Not available'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium text-center">
              {b.partner_distance_km
                ? 'Calculated from actual partner & customer coordinates.'
                : 'Partner location unavailable until live dispatch is initiated.'}
            </p>
          </div>
        </div>

        {/* Right Column (OTP Status, Real Booking Timeline, Reviews) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Service Start OTP Verification Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Service Start OTP
              </h3>
              {b.otp_verified || ['ongoing', 'in_progress', 'cleaning_started', 'completed'].includes(b.status) ? (
                <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-black px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                  ✓ Verified
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">
                  Not verified
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-1.5">
              {b.otp_verified_at ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified At:</span>
                    <span className="font-bold text-slate-800">{formatTimestamp(b.otp_verified_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified By:</span>
                    <span className="font-bold text-slate-800">Assigned Partner via Mobile OTP</span>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 font-medium">
                  Partner enters the customer's secure OTP in Partner App upon arrival to begin service.
                </p>
              )}
            </div>
          </div>

          {/* Real Auditable Booking Timeline (Strictly Real Events, No Fake Timestamps) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Booking Timeline</h3>
              <span className="text-[11px] font-bold text-slate-400">
                {realTimelineEvents.length} Event{realTimelineEvents.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-slate-100 text-xs max-h-80 overflow-y-auto pr-1">
              {realTimelineEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="relative">
                  <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white"></span>
                  <div className="font-extrabold text-slate-900">{evt.title}</div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {evt.time} {evt.actor ? `• ${evt.actor}` : ''}
                  </div>
                  {evt.details && (
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{evt.details}</div>
                  )}
                </div>
              ))}

              {realTimelineEvents.length === 0 && (
                <div className="py-6 text-center text-slate-400">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold">No timeline events recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Review & Tip Structure */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-extrabold text-[#0A192F]">Customer Review</h3>

            {b.status !== 'completed' && b.status !== 'customer_confirmed' ? (
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-center text-slate-400 text-xs font-medium">
                <Star className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                Review will become available after the service is completed.
              </div>
            ) : customerReview ? (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-center">
                <div className="flex justify-center gap-1 text-amber-400 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i <= customerReview.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                {customerReview.comment ? (
                  <p className="text-xs text-slate-800 font-bold italic">
                    "{customerReview.comment}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Rated {customerReview.rating} out of 5 stars (no written comment).
                  </p>
                )}
                <div className="text-[10px] text-slate-400 font-medium mt-1">
                  Verified Review • {formatTimestamp(customerReview.reviewed_at)}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-center text-slate-400 text-xs font-medium">
                <Star className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                Service completed. Customer has not submitted a review yet.
              </div>
            )}

            {/* Tip for Partner */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                Tip for Partner:
              </span>
              <span className="font-black text-[#123D2A]">
                {b.tip_amount && Number(b.tip_amount) > 0 ? `₹${b.tip_amount}` : 'No tip added'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
