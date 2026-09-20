import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { supabase } from '../../config/supabase';
import {
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Calendar,
  CheckCircle2,
  RefreshCw,
  XCircle,
  MessageSquare,
  Star,
  FileText,
  Camera,
  Navigation,
  Edit2,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';

export const BookingDetailsPage: React.FC = () => {
  const {
    selectedBooking,
    openAssignMaid,
    setRescheduleModalOpen,
    setCancelModalOpen,
    setCurrentTab,
  } = useAdmin();

  const [activePhotoTab, setActivePhotoTab] = useState<'before' | 'after'>('before');
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [customerReview, setCustomerReview] = useState<{ rating: number; comment?: string; reviewed_at?: string } | null>(null);
  const [loadingExtra, setLoadingExtra] = useState<boolean>(false);

  if (!selectedBooking) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        <p className="text-sm font-bold">No booking details available.</p>
        <button
          onClick={() => setCurrentTab('all-bookings')}
          className="mt-4 bg-[#043927] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          Return to All Bookings
        </button>
      </div>
    );
  }

  const b = selectedBooking;

  useEffect(() => {
    if (!b) return;
    const fetchBookingDeepData = async () => {
      setLoadingExtra(true);
      try {
        const bookingDbId = b.id;

        // 1. Fetch live timeline logs
        let logsQuery = supabase.from('booking_timeline_logs').select('*');
        if (bookingDbId) {
          logsQuery = logsQuery.eq('booking_id', bookingDbId);
        }
        const { data: logsData } = await logsQuery.order('created_at', { ascending: true });
        if (logsData && logsData.length > 0) {
          setTimelineLogs(logsData);
        } else if (b.timelineLogs && b.timelineLogs.length > 0) {
          setTimelineLogs(b.timelineLogs);
        } else {
          setTimelineLogs([
            {
              id: 't_init',
              title: 'Booking Created',
              created_at: b.createdAt,
              details: `Booking placed for ${b.serviceName} (${b.timeSlot})`,
              actor_type: 'customer',
            },
          ]);
        }

        // 2. Fetch live photos
        if (bookingDbId) {
          const { data: photosData } = await supabase
            .from('booking_photos')
            .select('*')
            .eq('booking_id', bookingDbId);
          if (photosData && photosData.length > 0) {
            setPhotos(photosData);
          }
        }

        // 3. Fetch live customer review/rating
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
              reviewed_at: ratingData.reviewed_at,
            });
          }
        }
      } catch (err) {
        console.warn('BookingDetailsPage deep data fetch notice:', err);
      } finally {
        setLoadingExtra(false);
      }
    };

    fetchBookingDeepData();
  }, [b?.bookingId, b?.id]);

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800 select-none pb-8">
      {/* Breadcrumb & Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span>Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span>All Bookings</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#043927] font-bold">Booking Details</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Booking Details
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View complete information and track the booking status.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openAssignMaid(b.bookingId)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#043927]" />
            <span>Reassign Maid</span>
          </button>

          <button
            onClick={() => setRescheduleModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#043927]" />
            <span>Reschedule</span>
          </button>

          <button
            onClick={() => setCancelModalOpen(true)}
            className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Booking</span>
          </button>

          <button className="bg-[#043927] hover:bg-[#064e3b] text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer">
            <Phone className="w-3.5 h-3.5" />
            <span>Contact Customer</span>
          </button>
        </div>
      </div>

      {/* Booking Identifier & Status Pill */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-[#0A192F] tracking-tight">{b.bookingId}</h2>
            <span className="bg-sky-50 text-sky-700 border border-sky-200/60 font-extrabold px-3 py-1 rounded-full text-xs">
              {b.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Booked on {b.createdTimeFormatted || '16 Sep 2026, 10:15 AM'}
          </div>
        </div>

        {/* Horizontal Lifecycle Stepper */}
        <div className="pt-2 pb-4">
          <div className="grid grid-cols-7 gap-2 relative items-center text-center">
            {/* Step 1: Created */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 mt-2">Created</span>
              <span className="text-[10px] text-slate-400 font-medium">10:15 AM</span>
            </div>

            {/* Step 2: Payment Confirmed */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 mt-2">
                Payment Confirmed
              </span>
              <span className="text-[10px] text-slate-400 font-medium">10:18 AM</span>
            </div>

            {/* Step 3: Maid Assigned */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 mt-2">
                Maid Assigned
              </span>
              <span className="text-[10px] text-slate-400 font-medium">10:25 AM</span>
            </div>

            {/* Step 4: En Route */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 mt-2">En Route</span>
              <span className="text-[10px] text-slate-400 font-medium">10:35 AM</span>
            </div>

            {/* Step 5: Arrived */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 mt-2">Arrived</span>
              <span className="text-[10px] text-slate-400 font-medium">11:05 AM</span>
            </div>

            {/* Step 6: Cleaning Started */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-emerald-100 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold text-[#043927] mt-2">
                Cleaning Started
              </span>
              <span className="text-[10px] text-slate-400 font-medium">11:10 AM</span>
            </div>

            {/* Step 7: Completed */}
            <div className="flex flex-col items-center relative z-10 opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                7
              </div>
              <span className="text-[11px] font-bold text-slate-600 mt-2">Completed</span>
              <span className="text-[10px] text-slate-400 font-medium">--:--</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Customer, Payment & Notes) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Customer Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Customer Details</h3>
              <button className="text-slate-400 hover:text-slate-600">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {b.customerAvatar ? (
                <img
                  src={b.customerAvatar}
                  alt={b.customerName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-sm">
                  {b.customerName[0]}
                </div>
              )}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{b.customerName}</h4>
                <div className="text-xs text-slate-500 font-medium">{b.customerPhone}</div>
                <div className="text-xs text-slate-400 font-medium">{b.customerEmail || 'priya.sharma@gmail.com'}</div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Address
              </div>
              <div className="text-xs font-bold text-slate-800 leading-snug">
                {b.address.street}, {b.address.locality}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {b.address.city} - {b.address.pincode}
              </div>
              <button className="text-[11px] font-bold text-[#043927] hover:underline flex items-center gap-1 mt-1 cursor-pointer">
                <span>View on Map</span>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Customer Type</span>
              <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                {b.customerType || 'Regular Customer'} ({b.customerTotalBookings || 8} Bookings)
              </span>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Payment Details</h3>
              <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">
                Paid
              </span>
            </div>

            <div className="text-xs space-y-2 font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-extrabold text-slate-900">{b.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-black text-slate-900 text-sm">₹{b.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-bold text-slate-700">{b.transactionId || '7260916102458'}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid On:</span>
                <span className="font-bold text-slate-700">{b.paidAt || '16 Sep 2026, 10:18 AM'}</span>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0A192F] mb-3">Customer Notes</h3>
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-xs text-slate-700 font-medium leading-relaxed">
              {b.specialInstructions ||
                'Please focus on kitchen and living room. Bring your own cleaning supplies. Door code: 4321'}
            </div>
          </div>
        </div>

        {/* Middle Column (Service, Assigned Maid & Live Map) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Service Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Service Details</h3>
              <button className="text-slate-400 hover:text-slate-600">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">{b.serviceName}</h4>
              <p className="text-xs text-slate-500 font-medium">Full home cleaning service</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl text-xs font-medium">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">Duration</span>
                <span className="font-extrabold text-slate-900">{b.serviceDuration || '3 Hours'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">Price</span>
                <span className="font-extrabold text-slate-900">₹{b.servicePrice}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Service Date & Time
              </span>
              <div className="text-xs font-bold text-slate-900">
                {b.date}, {b.timeSlot}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Special Instructions
              </span>
              <div className="text-xs text-slate-600 font-medium">
                Focus on kitchen, living room and bedrooms.
              </div>
            </div>
          </div>

          {/* Assigned Maid Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Assigned Maid</h3>
              <button
                onClick={() => openAssignMaid(b.bookingId)}
                className="text-xs font-bold text-[#043927] hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={b.assignedMaidPhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'}
                  alt={b.assignedMaidName || 'Pavani M.'}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {b.assignedMaidName || 'Pavani M.'}
                  </h4>
                  <div className="text-xs text-amber-600 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{b.assignedMaidRating || 4.9} (320 reviews)</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {b.assignedMaidPhone || '+91 91234 56789'}
                  </div>
                </div>
              </div>

              <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full text-[10px]">
                ● Online
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs font-bold">
              <div>
                <div className="text-slate-900 font-black">320</div>
                <div className="text-[10px] text-slate-400 font-semibold">Jobs Completed</div>
              </div>
              <div>
                <div className="text-slate-900 font-black">2.1 km</div>
                <div className="text-[10px] text-slate-400 font-semibold">Distance</div>
              </div>
              <div>
                <div className="text-slate-900 font-black">12 mins</div>
                <div className="text-[10px] text-slate-400 font-semibold">ETA</div>
              </div>
            </div>
          </div>

          {/* Live Location Map */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Live Location</h3>
              <button className="text-xs font-bold text-[#043927] hover:underline flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                <span>Track Live</span>
              </button>
            </div>

            <div
              className="rounded-2xl border border-slate-200/80 bg-cover bg-center h-44 relative flex items-center justify-center p-4 overflow-hidden"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`,
              }}
            >
              <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]"></div>

              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold px-2.5 py-1 rounded-xl shadow-lg text-[10px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Customer (Kondapur)</span>
              </div>

              <div className="absolute bottom-1/4 left-1/3 bg-white/95 text-slate-900 font-extrabold px-2.5 py-1 rounded-xl shadow-lg text-[10px] flex items-center gap-1.5 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Pavani M. • En Route 12 mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Booking Timeline, Before/After Photos, Review) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Booking Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Booking Timeline</h3>
              <span className="text-[11px] font-bold text-slate-400">
                {timelineLogs.length} Events
              </span>
            </div>

            <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-slate-100 text-xs max-h-72 overflow-y-auto pr-1">
              {timelineLogs.map((log: any, idx: number) => (
                <div key={log.id || idx} className="relative">
                  <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                  <div className="font-extrabold text-slate-900">{log.title || log.status_to || 'Update'}</div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : log.timestamp || 'Recorded'}
                    {log.actor_name ? ` by ${log.actor_name}` : log.actor_type ? ` (${log.actor_type})` : ''}
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-600 mt-0.5">{log.details}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Before & After Photos */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0A192F]">Before & After Photos</h3>
              <span className="text-[11px] font-bold text-[#043927]">
                {photos.length} Uploaded
              </span>
            </div>

            {/* Photo Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActivePhotoTab('before')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePhotoTab === 'before' ? 'bg-white text-[#043927] shadow-sm' : 'text-slate-500'
                }`}
              >
                Before ({photos.filter(p => p.photo_type === 'before').length})
              </button>
              <button
                onClick={() => setActivePhotoTab('after')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activePhotoTab === 'after' ? 'bg-white text-[#043927] shadow-sm' : 'text-slate-500'
                }`}
              >
                After ({photos.filter(p => p.photo_type === 'after').length})
              </button>
            </div>

            {/* Photo Gallery Grid */}
            {photos.filter(p => p.photo_type === activePhotoTab).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {photos
                  .filter(p => p.photo_type === activePhotoTab)
                  .map((photo: any, pIdx: number) => (
                    <div key={photo.id || pIdx} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
                      <img
                        src={photo.file_url || photo.url}
                        alt={photo.label || 'Job Photo'}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2 bg-white">
                        <div className="text-[10px] font-bold text-slate-900 truncate">{photo.label || 'Clean Area'}</div>
                        <div className="text-[9px] text-slate-400">
                          {photo.uploaded_at ? new Date(photo.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-2xl">
                <Camera className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-400">
                  No {activePhotoTab} photos uploaded yet.
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Maid partner uploads photos via mobile app during service.
                </p>
              </div>
            )}
          </div>

          {/* Customer Review Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-extrabold text-[#0A192F] mb-3">Customer Review</h3>
            {customerReview ? (
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
                <p className="text-xs text-slate-700 font-bold italic">
                  "{customerReview.comment || 'Service completed satisfactorily.'}"
                </p>
                <div className="text-[10px] text-slate-400 font-medium mt-1">
                  Verified Review • {customerReview.rating} out of 5 stars
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center">
                <div className="flex justify-center gap-1 text-slate-300 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-slate-200 text-slate-300" />
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Rating will be available after the service is completed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
