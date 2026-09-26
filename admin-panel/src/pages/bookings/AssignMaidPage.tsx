import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { supabase, supabaseAdmin } from '../../config/supabase';
import { MaidProfile } from '../../types';
import {
  formatDateDDMMYYYY,
  getPaymentDisplayInfo,
  getPartnerEstimatedEarnings,
} from '../../utils/bookingDisplayUtils';
import {
  ChevronRight,
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  Search,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  RotateCcw,
  UserCheck,
  UserX,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

// Resilient Partner Avatar with initials fallback
const PartnerAvatar: React.FC<{ photoUrl?: string; name: string; size?: string }> = ({
  photoUrl,
  name,
  size = 'w-9 h-9',
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
        className={`${size} rounded-full bg-emerald-100 text-[#123D2A] font-black flex items-center justify-center shrink-0 border border-emerald-200 text-xs select-none shadow-2xs`}
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

// Customer Avatar
const CustomerAvatar: React.FC<{ avatarUrl?: string; name: string; size?: string }> = ({
  avatarUrl,
  name,
  size = 'w-10 h-10',
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
        className={`${size} rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 text-xs select-none shadow-2xs`}
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

export const AssignMaidPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();
  const {
    bookings,
    selectedBooking: contextBooking,
    maids,
    setCurrentTab,
    openBookingDetails,
    sendPartnerAssignmentRequest,
    cancelPartnerAssignmentRequest,
    acceptPartnerAssignment,
    declinePartnerAssignment,
    adminError,
    setAdminError,
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [serviceFilter, setServiceFilter] = useState<'matching' | 'all'>('matching');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Local Assignment Request Lifecycle States
  const [requestStatus, setRequestStatus] = useState<
    'idle' | 'pending_acceptance' | 'accepted' | 'declined'
  >('idle');
  const [requestSentAt, setRequestSentAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directBooking, setDirectBooking] = useState<any>(null);
  const [fetchingDirect, setFetchingDirect] = useState<boolean>(false);

  // Resolve booking from context or route param
  const selectedBooking =
    (contextBooking && (!bookingId || contextBooking.bookingId === bookingId || contextBooking.id === bookingId))
      ? contextBooking
      : (bookingId ? bookings.find(item => item.bookingId === bookingId || item.id === bookingId) : null) || directBooking;

  // Direct fetch fallback for direct URL access & refresh
  useEffect(() => {
    if (!selectedBooking && bookingId) {
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
              customerPhone: data.customer_phone || '+91 93904 20247',
              customerEmail: data.customer_email,
              serviceId: data.service_id || 'srv_1',
              serviceName: data.service_name || 'Home Cleaning',
              servicePrice: Number(data.service_price || data.total_amount || 799),
              totalAmount: Number(data.total_amount || 799),
              serviceDuration: data.service_duration || '3 Hours',
              address: {
                id: 'addr_' + (data.booking_code || data.id),
                label: data.address_label || 'Home',
                street: data.address_street || '',
                locality: data.address_locality || '',
                city: data.address_city || 'Hanamkonda',
                pincode: data.address_pincode || '',
              },
              date: data.scheduled_date || 'Today',
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
              partnerEarnings: data.partner_earnings,
              createdAt: data.created_at ? new Date(data.created_at).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString(),
            });
          }
        });
    }
  }, [selectedBooking, bookingId]);

  // Real-time synchronization for this specific booking
  useEffect(() => {
    const targetCode = bookingId || selectedBooking?.bookingId;
    if (!targetCode) return;

    const channel = supabase
      .channel(`assign-partner-realtime-${targetCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        payload => {
          const row: any = payload.new;
          if (row && (row.booking_code === targetCode || row.id === targetCode || row.id === selectedBooking?.id)) {
            setDirectBooking((prev: any) => ({
              ...(prev || {}),
              id: row.id,
              bookingId: row.booking_code || row.id,
              customerName: row.customer_name || prev?.customerName || 'Customer',
              customerPhone: row.customer_phone || prev?.customerPhone,
              customerEmail: row.customer_email || prev?.customerEmail,
              serviceName: row.service_name || prev?.serviceName,
              servicePrice: Number(row.service_price || row.total_amount || prev?.servicePrice || 799),
              totalAmount: Number(row.total_amount || prev?.totalAmount || 799),
              serviceDuration: row.service_duration || prev?.serviceDuration || '3 Hours',
              date: row.scheduled_date || prev?.date || 'Today',
              timeSlot: row.time_slot || prev?.timeSlot || '10:00 AM',
              specialInstructions: row.special_instructions,
              status: row.status || prev?.status || 'pending_assignment',
              adminApprovalStatus: row.admin_approval_status || prev?.adminApprovalStatus || 'pending',
              assignmentStatus: row.assignment_status || prev?.assignmentStatus || 'unassigned',
              paymentMethod: row.payment_method || prev?.paymentMethod || 'cash',
              paymentStatus: row.payment_status || prev?.paymentStatus || 'pending',
              partnerEarnings: row.partner_earnings || prev?.partnerEarnings,
              assignedMaidId: row.assigned_maid_id,
              assignedMaidName: row.assigned_maid_name,
              assignedMaidPhone: row.assigned_maid_phone,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, selectedBooking?.bookingId, selectedBooking?.id]);

  // Synchronize active partner assignment lifecycle
  useEffect(() => {
    const bookingDbId = selectedBooking?.id;
    if (!bookingDbId) return;

    supabaseAdmin
      .from('partner_assignments')
      .select('*')
      .eq('booking_id', bookingDbId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          if (data.response_status === 'pending') {
            setRequestStatus('pending_acceptance');
            setSelectedPartnerId(data.partner_id);
            if (data.offer_sent_at) {
              setRequestSentAt(
                new Date(data.offer_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              );
            }
          } else if (data.response_status === 'accepted') {
            setRequestStatus('accepted');
            setSelectedPartnerId(data.partner_id);
          } else if (data.response_status === 'declined') {
            setRequestStatus('declined');
          }
        }
      });
  }, [selectedBooking?.id]);

  // Real-time synchronization for partner_assignments
  useEffect(() => {
    const bookingDbId = selectedBooking?.id;
    if (!bookingDbId) return;

    const channel = supabase
      .channel(`partner-assignments-rt-${bookingDbId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_assignments',
          filter: `booking_id=eq.${bookingDbId}`,
        },
        payload => {
          const row: any = payload.new;
          if (row) {
            if (row.response_status === 'pending') {
              setRequestStatus('pending_acceptance');
              setSelectedPartnerId(row.partner_id);
            } else if (row.response_status === 'accepted') {
              setRequestStatus('accepted');
              setSelectedPartnerId(row.partner_id);
            } else if (row.response_status === 'declined') {
              setRequestStatus('declined');
            } else if (row.response_status === 'expired') {
              setRequestStatus('idle');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBooking?.id]);

  if (fetchingDirect) {
    return (
      <div className="p-16 text-center text-slate-500 font-sans flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#123D2A] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-600">Loading booking for assignment...</p>
      </div>
    );
  }

  if (!selectedBooking) {
    return (
      <div className="p-12 text-center text-slate-500 font-sans max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-slate-800">No Booking Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Please select a pending booking from the bookings list to assign an eligible partner.</p>
        <button
          onClick={() => navigate('/admin/bookings')}
          className="mt-4 bg-[#123D2A] hover:bg-[#184a34] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          Return to Bookings
        </button>
      </div>
    );
  }

  // Service Eligibility Matching Helper
  const isPartnerEligibleForService = (partner: MaidProfile, requiredService: string) => {
    if (!requiredService) return true;
    const reqLower = requiredService.toLowerCase().trim();

    // 1. Must be an approved partner
    if (partner.status !== 'approved') return false;

    // 2. Check skills array
    if (Array.isArray(partner.skills) && partner.skills.length > 0) {
      const hasSkill = partner.skills.some(skill => {
        const sLower = String(skill).toLowerCase().trim();
        return sLower.includes(reqLower) || reqLower.includes(sLower) || (reqLower.includes('clean') && sLower.includes('clean'));
      });
      if (hasSkill) return true;
    }

    // 3. Check servicesProvided array
    if (Array.isArray(partner.servicesProvided) && partner.servicesProvided.length > 0) {
      const hasService = partner.servicesProvided.some((s: any) => {
        const sName = (s?.serviceName || s?.name || '').toLowerCase().trim();
        return sName.includes(reqLower) || reqLower.includes(sName) || (reqLower.includes('clean') && sName.includes('clean'));
      });
      if (hasService) return true;
    }

    // 4. If partner has no specific skills array recorded, allow matching
    if ((!partner.skills || partner.skills.length === 0) && (!partner.servicesProvided || partner.servicesProvided.length === 0)) {
      return true;
    }

    return false;
  };

  // Filter partners: Approved & matching requested service by default
  const eligiblePartners = useMemo(() => {
    const list = maids.filter(m => {
      // 1. Must be approved by Admin
      if (m.status !== 'approved') return false;

      // 1b. Mandatory verification check:
      // If photo was explicitly marked for reupload by Admin, partner cannot be assigned
      const ver = m.verificationStatus || {};
      if (ver.profile_photo?.status === 'reupload_required') return false;

      // Mandatory documents must not be flagged for re-upload
      if (ver.step4_documents?.status === 'reupload_required') return false;
      const docs = ver.documents || {};
      if (docs.aadhaar_front?.status === 'reupload_required') return false;
      if (docs.aadhaar_back?.status === 'reupload_required') return false;
      if (docs.pan_card?.status === 'reupload_required') return false;

      // KYC cannot be rejected
      if (m.kycStatus === 'rejected') return false;

      // 1c. Availability filter
      if (availabilityFilter === 'available' && !m.isOnline) {
        return false;
      }

      // 2. Service matching
      if (serviceFilter === 'matching') {
        if (!isPartnerEligibleForService(m, selectedBooking.serviceName)) return false;
      }

      // 3. Distance filter (only filter if a positive distance was calculated and exceeds limit)
      const distance = m.distanceKm || 0;
      if (distanceFilter === '5' && distance > 5) return false;
      if (distanceFilter === '10' && distance > 10) return false;

      // 4. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const nameMatch = m.fullName.toLowerCase().includes(term);
        const areaMatch = (m.serviceArea || '').toLowerCase().includes(term);
        const skillMatch = (m.skills || []).some(s => String(s).toLowerCase().includes(term));
        if (!nameMatch && !areaMatch && !skillMatch) return false;
      }

      return true;
    });

    // Sort Available (Online) partners first, then by rating
    return list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return (b.rating || 5) - (a.rating || 5);
    });
  }, [maids, serviceFilter, distanceFilter, availabilityFilter, searchTerm, selectedBooking.serviceName]);

  // Find currently selected partner object
  const selectedPartner = useMemo(() => {
    if (selectedPartnerId) {
      return maids.find(m => m.uid === selectedPartnerId) || null;
    }
    // Default to first available eligible partner if none selected
    const firstAvailable = eligiblePartners.find(m => m.isOnline && m.currentStatus !== 'busy');
    return firstAvailable || null;
  }, [selectedPartnerId, maids, eligiblePartners]);

  // 1. Send Assignment Request to Selected Partner
  const handleSendAssignmentRequest = async () => {
    if (!selectedPartner) {
      alert('Please select an eligible partner first.');
      return;
    }

    if (!selectedPartner.isOnline || selectedPartner.currentStatus === 'busy') {
      alert('This partner is currently busy or unavailable. Please choose an available partner.');
      return;
    }

    setIsSubmitting(true);
    const success = await sendPartnerAssignmentRequest(
      selectedBooking.bookingId,
      selectedPartner.uid,
      selectedPartner.distanceKm || 1.2,
      selectedPartner.etaMins || 8
    );
    setIsSubmitting(false);

    if (success) {
      setRequestStatus('pending_acceptance');
      setRequestSentAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } else {
      alert(adminError || 'Assignment request failed. Please check connection and try again.');
    }
  };

  // 2. Cancel Request
  const handleCancelRequest = async () => {
    if (!selectedPartner) return;
    if (window.confirm('Are you sure you want to cancel this assignment request?')) {
      setIsSubmitting(true);
      await cancelPartnerAssignmentRequest(selectedBooking.bookingId, selectedPartner.uid);
      setIsSubmitting(false);
      setRequestStatus('idle');
      setRequestSentAt(null);
    }
  };

  // 3. Partner Accepts Request (Real-time or simulated)
  const handlePartnerAccept = async () => {
    if (!selectedPartner) return;
    setIsSubmitting(true);
    const success = await acceptPartnerAssignment(selectedBooking.bookingId, selectedPartner.uid);
    setIsSubmitting(false);
    if (success) {
      setRequestStatus('accepted');
    }
  };

  // 4. Partner Declines Request (Real-time or simulated)
  const handlePartnerDecline = async () => {
    if (!selectedPartner) return;
    setIsSubmitting(true);
    await declinePartnerAssignment(selectedBooking.bookingId, selectedPartner.uid, 'Partner schedule conflict');
    setIsSubmitting(false);
    setRequestStatus('declined');
  };

  const paymentInfo = getPaymentDisplayInfo(selectedBooking.paymentStatus, selectedBooking.paymentMethod);
  const partnerPayout = getPartnerEstimatedEarnings(selectedBooking.totalAmount, selectedBooking.partnerEarnings);

  return (
    <div className="flex flex-col gap-5 font-sans text-slate-800 select-none pb-8">
      {/* 1. Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#123D2A] font-bold">Assign Partner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Assign Partner
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Find an eligible partner and send an assignment request.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/bookings')}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </button>
      </div>

      {/* 2. Main Grid: Left Column (Compact Booking Details) + Right Column (Available Partners & Request Workflow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Compact Booking Details Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Booking ID</span>
              <h3 className="text-base font-black text-[#123D2A]">{selectedBooking.bookingId}</h3>
            </div>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">
              {selectedBooking.status === 'maid_assigned' ? 'Assigned' : 'Pending Assignment'}
            </span>
          </div>

          {/* Customer Info (Unmasked Mobile Number for Admin) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CustomerAvatar avatarUrl={selectedBooking.customerAvatar} name={selectedBooking.customerName} size="w-10 h-10" />
              <div>
                <h4 className="text-xs font-black text-slate-900">{selectedBooking.customerName}</h4>
                <p className="text-xs text-slate-700 font-extrabold tracking-wide mt-0.5">
                  {selectedBooking.customerPhone || '+91 93904 20247'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {selectedBooking.customerPhone ? (
                <a
                  href={`tel:${String(selectedBooking.customerPhone).replace(/\s+/g, '')}`}
                  title={`Call ${selectedBooking.customerName} (${selectedBooking.customerPhone})`}
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  disabled
                  title="Phone number unavailable"
                  className="w-8 h-8 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-200 cursor-not-allowed"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => navigate('/admin/chat')}
                title={`Open chat with ${selectedBooking.customerName}`}
                className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#123D2A] flex items-center justify-center border border-emerald-200 cursor-pointer transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Service Info */}
          <div className="border-t border-slate-100 pt-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#123D2A] flex items-center justify-center shrink-0 border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Service</span>
              <div className="text-xs font-black text-slate-900 leading-snug">
                {selectedBooking.serviceName}
              </div>
              {(selectedBooking.selectedAddOns || []).length > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 inline-block mt-0.5">
                  + {(selectedBooking.selectedAddOns || []).length} add-on{(selectedBooking.selectedAddOns || []).length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Schedule & Duration — Formatted strictly as DD-MM-YYYY */}
          <div className="border-t border-slate-100 pt-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Schedule</span>
              <div className="text-xs font-black text-slate-900">
                {formatDateDDMMYYYY(selectedBooking.date)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {selectedBooking.timeSlot} · {selectedBooking.serviceDuration || '3 Hours'}
              </div>
            </div>
          </div>

          {/* Location / Area */}
          <div className="border-t border-slate-100 pt-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Location</span>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                {selectedBooking.address?.locality || selectedBooking.address?.city || 'Hanamkonda'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {selectedBooking.address?.city || 'Hanamkonda'}
              </div>
            </div>
          </div>

          {/* Payment Status & Amount (Never hardcoded to Paid) */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Payment Method
                </span>
                <span className="text-xs font-black text-slate-800">
                  {paymentInfo.methodLabel}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Payment Status
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-block mt-0.5 ${paymentInfo.statusBadgeStyle}`}>
                  {paymentInfo.statusLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Booking Amount
              </span>
              <span className="text-sm font-black text-slate-900">
                ₹{selectedBooking.totalAmount}
              </span>
            </div>
          </div>

          {/* Customer Note */}
          {selectedBooking.specialInstructions && (
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Customer Note
              </span>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs text-slate-600 font-medium leading-relaxed">
                {selectedBooking.specialInstructions}
              </div>
            </div>
          )}
        </div>

        {/* Right 8 Cols: Available Partners Table + Assignment Request Workflow */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Top Card: Available Partners Table */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#0A192F]">
                  Available Partners ({eligiblePartners.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Partners eligible for this booking.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {/* Availability Filter */}
                <select
                  value={availabilityFilter}
                  onChange={e => setAvailabilityFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Partners</option>
                  <option value="available">🟢 Available (Online) Only</option>
                </select>

                {/* Service Match Filter */}
                <select
                  value={serviceFilter}
                  onChange={e => setServiceFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold outline-none cursor-pointer"
                >
                  <option value="matching">Matching Service</option>
                  <option value="all">All Eligible Partners</option>
                </select>

                {/* Distance Filter */}
                <select
                  value={distanceFilter}
                  onChange={e => setDistanceFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Distances</option>
                  <option value="10">Nearby (10 km)</option>
                  <option value="5">Nearby (5 km)</option>
                </select>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search partners..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none w-40 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Partners Table (No Map, Clean Table) */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Partner</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Jobs</th>
                    <th className="py-2.5 px-3">Services</th>
                    <th className="py-2.5 px-3">Availability</th>
                    <th className="py-2.5 px-3">ETA</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {eligiblePartners.map(partner => {
                    const isSelected = selectedPartner?.uid === partner.uid;
                    const isAvailable = Boolean(partner.isOnline);
                    const hasJobs = Boolean(partner.completedJobsCount && partner.completedJobsCount > 0);
                    const hasRatings = Boolean(hasJobs && partner.totalRatingsCount && partner.totalRatingsCount > 0 && partner.rating);
                    const distanceStr = partner.distanceKm !== undefined && partner.distanceKm > 0 ? `${partner.distanceKm} km` : 'Distance unavailable';
                    const partnerEtaStr = (selectedBooking as any).partnerEta || partner.etaMins ? `${(selectedBooking as any).partnerEta || partner.etaMins} min` : 'Not provided';

                    return (
                      <tr
                        key={partner.uid}
                        onClick={() => {
                          if (isAvailable && requestStatus === 'idle') {
                            setSelectedPartnerId(partner.uid);
                          }
                        }}
                        className={`transition-colors ${
                          isAvailable && requestStatus === 'idle' ? 'cursor-pointer' : ''
                        } ${
                          isSelected
                            ? 'bg-emerald-50/80 border-l-4 border-[#123D2A]'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* 1. Partner Profile */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <PartnerAvatar photoUrl={partner.photoUrl} name={partner.fullName} size="w-8 h-8" />
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{partner.fullName}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{partner.serviceArea || partner.city || 'Available'}</span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Distance */}
                        <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                          {distanceStr}
                        </td>

                        {/* 3. Rating */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {hasRatings ? (
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{partner.rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">No ratings yet</span>
                          )}
                        </td>

                        {/* 4. Jobs */}
                        <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                          {hasJobs ? `${partner.completedJobsCount} completed jobs` : '0 completed jobs'}
                        </td>

                        {/* 5. Services */}
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block max-w-[150px] truncate">
                            {(partner.skills || ['General Cleaning']).slice(0, 2).join(' · ')}
                          </span>
                        </td>

                        {/* 6. Availability */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Not Available
                            </span>
                          )}
                        </td>

                        {/* 7. ETA */}
                        <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                          {requestStatus === 'pending_acceptance' ? (
                            <span className="text-amber-600 font-bold italic">Awaiting response</span>
                          ) : (
                            partnerEtaStr
                          )}
                        </td>

                        {/* 8. Action */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isAvailable ? (
                            <button
                              disabled={requestStatus !== 'idle'}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedPartnerId(partner.uid);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                isSelected
                                  ? 'bg-[#123D2A] text-white'
                                  : 'bg-emerald-50 text-[#123D2A] hover:bg-emerald-100 border border-emerald-200'
                              } disabled:opacity-50`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Partner is currently offline / unavailable"
                              className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold opacity-60 cursor-not-allowed"
                            >
                              Not Available
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {eligiblePartners.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-bold text-slate-700">No eligible partners found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Try switching to "All Eligible Partners" or adjusting the radius.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Card: Assignment Request Workflow (Replaces Confirmation Card & Map) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-[#0A192F]">
                  {requestStatus === 'pending_acceptance'
                    ? 'Assignment Request Sent'
                    : requestStatus === 'accepted'
                    ? 'Partner Assigned'
                    : requestStatus === 'declined'
                    ? 'Partner Declined'
                    : 'Assignment Request'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {requestStatus === 'pending_acceptance'
                    ? 'Waiting for partner to accept the assignment request.'
                    : requestStatus === 'accepted'
                    ? 'Partner has accepted the job. Booking is officially assigned.'
                    : requestStatus === 'declined'
                    ? 'Partner declined this request. Please select another partner.'
                    : 'Review selected partner and send assignment request.'}
                </p>
              </div>

              {requestStatus === 'pending_acceptance' && (
                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> Waiting for Acceptance
                </span>
              )}

              {requestStatus === 'accepted' && (
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Assigned
                </span>
              )}
            </div>

            {/* Content Based on Request Status */}
            {selectedPartner ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3">
                {/* Partner Details Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PartnerAvatar
                      photoUrl={selectedPartner.photoUrl}
                      name={selectedPartner.fullName}
                      size="w-11 h-11"
                    />
                    <div>
                      <h5 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        {selectedPartner.fullName}
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                          {selectedPartner.maidId || selectedPartner.uid}
                        </span>
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {selectedPartner.rating || 5.0}
                        </span>
                        <span>·</span>
                        <span>{selectedPartner.distanceKm || 1.2} km away</span>
                        <span>·</span>
                        <span className="text-[#123D2A] font-bold">{selectedPartner.etaMins || 8} min ETA</span>
                      </div>
                      {/* Explicit Partner Earnings vs Customer Booking Total */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="bg-emerald-100/80 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                          Partner Payout: ₹{partnerPayout}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Customer Total: ₹{selectedBooking.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {requestStatus === 'idle' && (
                    <button
                      onClick={() => setSelectedPartnerId(null)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs self-start sm:self-auto"
                    >
                      Change Partner
                    </button>
                  )}
                </div>

                {/* Status-Specific Details */}
                {requestStatus === 'pending_acceptance' && (
                  <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Request Status:</span>
                      <strong className="text-amber-700 font-black">Waiting for partner acceptance</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Offer Sent At:</span>
                      <strong className="text-slate-800 font-bold">{requestSentAt || 'Just now'}</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 mt-1">
                      ℹ️ The booking status remains <strong>Pending Assignment</strong>. Once {selectedPartner.fullName} clicks "Accept Job" in the Partner App, the booking will be officially assigned.
                    </p>

                    {/* Simulation Buttons for Testing/Demo */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs text-emerald-900 font-semibold">
                        <span>Partner App Simulation:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePartnerAccept}
                          disabled={isSubmitting}
                          className="bg-[#123D2A] hover:bg-[#184a34] text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs"
                        >
                          Simulate Partner Accept
                        </button>
                        <button
                          onClick={handlePartnerDecline}
                          disabled={isSubmitting}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          Simulate Partner Decline
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {requestStatus === 'accepted' && (
                  <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <div>
                        <strong className="block font-black text-emerald-950">Partner Confirmed & Assigned</strong>
                        <span className="text-[11px] text-emerald-700">
                          {selectedPartner.fullName} accepted the request. Booking status updated to Assigned.
                        </span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    </div>
                  </div>
                )}

                {requestStatus === 'declined' && (
                  <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
                      <div>
                        <strong className="block font-black text-rose-950">Request Declined</strong>
                        <span className="text-[11px] text-rose-700">
                          {selectedPartner.fullName} declined booking {selectedBooking.bookingId}. Please choose another partner.
                        </span>
                      </div>
                      <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                Select an available partner from the list above to prepare assignment request.
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('all-bookings')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Back to Bookings
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {requestStatus === 'idle' && (
                  <button
                    disabled={!selectedPartner || isSubmitting || !selectedPartner.isOnline || selectedPartner.currentStatus === 'busy'}
                    onClick={handleSendAssignmentRequest}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Assignment Request</span>
                  </button>
                )}

                {requestStatus === 'pending_acceptance' && (
                  <button
                    onClick={handleCancelRequest}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Cancel Request
                  </button>
                )}

                {requestStatus === 'accepted' && (
                  <button
                    onClick={() => openBookingDetails(selectedBooking.bookingId)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>View Booking Details</span>
                  </button>
                )}

                {requestStatus === 'declined' && (
                  <button
                    onClick={() => {
                      setRequestStatus('idle');
                      setSelectedPartnerId(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Find Another Partner</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

