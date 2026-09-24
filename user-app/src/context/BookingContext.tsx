import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerBooking, CustomerCart, TrackingStage, AssignedProfessional } from '../types';
import { ASSETS } from '../assets/index';
import { supabase } from '../config/supabase';
import { authService } from '../services/authService';
import {
  acceptBooking,
  verifyBookingOtp,
  confirmPartnerArrival,
  submitWorkCompletion,
  confirmCustomerCompletion,
  submitTip,
  reportUnauthorizedPayment,
  RPCResponse,
} from '../services/bookingStateMachine';

interface BookingContextType {
  bookings: CustomerBooking[];
  activeBooking: CustomerBooking | null;
  createBookingFromCart: (cart: CustomerCart, paymentMethod: CustomerBooking['paymentMethod']) => Promise<CustomerBooking>;
  selectBookingForTracking: (bookingId: string) => void;
  advanceBookingStage: (bookingId: string, targetStage: TrackingStage) => void;
  cancelBooking: (bookingId: string, reason?: string) => void;
  submitReview: (bookingId: string, rating: number, reviewText: string, tags: string[]) => void;
  // Enhanced Server-Authoritative State Machine Actions
  acceptJobOffer: (bookingId: string, partnerId: string, lat: number, lng: number) => Promise<RPCResponse>;
  verifyStartOtp: (bookingId: string, otpCode: string, partnerId: string) => Promise<RPCResponse>;
  markPartnerArrived: (bookingId: string, partnerId: string, lat: number, lng: number) => Promise<RPCResponse>;
  submitCompletion: (bookingId: string, partnerId: string, notes: string, photos: string[]) => Promise<RPCResponse>;
  confirmCompletion: (bookingId: string, customerId: string) => Promise<RPCResponse>;
  addTip: (bookingId: string, customerId: string, partnerId: string, amount: number) => Promise<RPCResponse>;
  reportPaymentViolation: (bookingId: string, reporterId: string, partnerId: string | undefined, reportType: 'asked_for_cash' | 'unauthorized_amount' | 'payment_outside_app' | 'service_issue' | 'other', description: string, amountRequested?: number) => Promise<RPCResponse>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);


export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [activeBookingId, setActiveBookingId] = useState<string>('');

  const mapStageFromStatus = (status?: string): TrackingStage => {
    if (!status) return 'confirmed';
    switch (status) {
      case 'completed':
      case 'customer_confirmed':
        return 'completed';
      case 'cleaning_started':
      case 'in_progress':
        return 'cleaning';
      case 'partner_arrived':
      case 'arrived':
        return 'arrived';
      case 'partner_en_route':
      case 'en_route':
        return 'on_the_way';
      case 'maid_assigned':
      case 'partner_accepted':
      case 'assigned':
        return 'assigned';
      default:
        return 'confirmed';
    }
  };

  const mapAssignedPro = (r: any): AssignedProfessional | undefined => {
    if (!r.assigned_maid_name && !r.assigned_maid_id) return undefined;
    return {
      id: r.assigned_maid_id || '',
      name: r.assigned_maid_name || 'Assigned Partner',
      photoUrl: r.assigned_maid_photo_url || ASSETS.promoCleaner,
      rating: r.assigned_maid_rating ? Number(r.assigned_maid_rating) : 5.0,
      reviewCount: r.assigned_maid_review_count ? Number(r.assigned_maid_review_count) : 0,
      phone: r.assigned_maid_phone || '+91 98000 00000',
      isVerified: true,
      experience: 'Verified Professional',
      vaccinationStatus: 'Fully Vaccinated & Verified',
    };
  };

  // Load real bookings from Supabase for the logged-in customer
  useEffect(() => {
    const loadRealBookings = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        let query = supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(50);
        if (userId) {
          query = query.eq('customer_id', userId);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          setBookings([]);
          return;
        }

        const mapped: CustomerBooking[] = data.map((row): CustomerBooking => {
          const pro = mapAssignedPro(row);
          const stage = mapStageFromStatus(row.status);
          const isAssigned = Boolean(pro);
          const isCompleted = row.status === 'completed';

          return {
            bookingId: row.booking_code || row.id,
            serviceId: row.service_id || '',
            serviceName: row.service_name || 'Home Cleaning',
            serviceCategory: row.category_name || 'Home Cleaning',
            serviceImage: ASSETS.heroLivingRoom,
            addOns: [],
            date: row.scheduled_date || new Date().toISOString().split('T')[0],
            dateLabel: row.scheduled_date || 'Today',
            timeSlot: row.time_slot || '4:00 PM – 6:00 PM',
            address: {
              id: 'addr_supabase',
              label: row.address_label || 'Home',
              street: row.address_street || '',
              locality: row.address_locality || '',
              city: row.address_city || 'Hyderabad',
              pincode: row.address_pincode || '500001',
            },
            assignedPro: pro,
            currentStage: stage,
            stageHistory: [
              { stage: 'confirmed', timestamp: 'Confirmed', label: 'Booking Confirmed', completed: true },
              { stage: 'assigned', timestamp: isAssigned ? 'Assigned' : (row.assignment_status || 'Unassigned'), label: 'Partner Matching', completed: isAssigned },
              { stage: 'on_the_way', timestamp: ['on_the_way', 'arrived', 'cleaning', 'completed'].includes(stage) ? 'En Route' : 'Pending', label: 'Professional On The Way', completed: ['on_the_way', 'arrived', 'cleaning', 'completed'].includes(stage) },
              { stage: 'arrived', timestamp: ['arrived', 'cleaning', 'completed'].includes(stage) ? 'Arrived' : 'Pending', label: 'Arrived at Location', completed: ['arrived', 'cleaning', 'completed'].includes(stage) },
              { stage: 'cleaning', timestamp: ['cleaning', 'completed'].includes(stage) ? 'In Progress' : 'Pending', label: 'Cleaning In Progress', completed: ['cleaning', 'completed'].includes(stage) },
              { stage: 'completed', timestamp: isCompleted ? 'Completed' : 'Pending', label: 'Cleaning Completed', completed: isCompleted },
            ],
            paymentMethod: row.payment_method === 'cash' ? 'cod' : 'upi',
            paymentStatus: row.payment_status === 'paid' ? 'paid' : 'pending',
            basePrice: Number(row.base_amount || 0),
            addOnsTotal: Number(row.addon_amount || 0),
            discountAmount: Number(row.discount_amount || 0),
            platformFee: Number(row.platform_fee || 29),
            taxes: Number(row.tax_amount || 0),
            totalAmount: Number(row.total_amount || 0),
            createdAt: row.created_at || new Date().toISOString(),
            startOtp: row.verification_otp || row.start_otp || '123456',
          };
        });

        setBookings(mapped);
        if (mapped.length > 0) {
          setActiveBookingId(mapped[0].bookingId);
        }
      } catch (err) {
        console.warn('BookingContext: Could not load real bookings:', err);
      }
    };

    loadRealBookings();
  }, []);

  // Supabase Realtime Subscription for instant booking updates
  useEffect(() => {
    const subscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        const updatedRow: any = payload.new;
        if (!updatedRow || !updatedRow.id) return;

        setBookings((prev) =>
          prev.map((b) => {
            if (b.bookingId === updatedRow.id || b.bookingId === updatedRow.booking_code) {
              const updatedPro = updatedRow.assigned_maid_name
                ? {
                    id: updatedRow.assigned_maid_id || '',
                    name: updatedRow.assigned_maid_name,
                    photoUrl: updatedRow.assigned_maid_photo_url || ASSETS.promoCleaner,
                    rating: updatedRow.assigned_maid_rating ? Number(updatedRow.assigned_maid_rating) : 5.0,
                    reviewCount: 48,
                    phone: updatedRow.assigned_maid_phone || '+91 98000 00000',
                    isVerified: true,
                    experience: 'Verified Professional',
                    vaccinationStatus: 'Fully Vaccinated & Verified',
                  }
                : b.assignedPro;

              const stage = updatedRow.status
                ? mapStageFromStatus(updatedRow.status)
                : b.currentStage;

              const isAssigned = Boolean(updatedPro);
              const isCompleted = updatedRow.status === 'completed';

              return {
                ...b,
                assignedPro: updatedPro,
                currentStage: stage,
                startOtp: updatedRow.verification_otp || updatedRow.start_otp || b.startOtp,
                paymentStatus: updatedRow.payment_status || b.paymentStatus,
                stageHistory: [
                  { stage: 'confirmed', timestamp: 'Confirmed', label: 'Booking Confirmed', completed: true },
                  { stage: 'assigned', timestamp: isAssigned ? 'Assigned' : 'Pending', label: 'Partner Matching', completed: isAssigned },
                  { stage: 'on_the_way', timestamp: ['on_the_way', 'arrived', 'cleaning', 'completed'].includes(stage) ? 'En Route' : 'Pending', label: 'Professional On The Way', completed: ['on_the_way', 'arrived', 'cleaning', 'completed'].includes(stage) },
                  { stage: 'arrived', timestamp: ['arrived', 'cleaning', 'completed'].includes(stage) ? 'Arrived' : 'Pending', label: 'Arrived at Location', completed: ['arrived', 'cleaning', 'completed'].includes(stage) },
                  { stage: 'cleaning', timestamp: ['cleaning', 'completed'].includes(stage) ? 'In Progress' : 'Pending', label: 'Cleaning In Progress', completed: ['cleaning', 'completed'].includes(stage) },
                  { stage: 'completed', timestamp: isCompleted ? 'Completed' : 'Pending', label: 'Cleaning Completed', completed: isCompleted },
                ],
              };
            }
            return b;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const createBookingFromCart = async (
    cart: CustomerCart,
    paymentMethod: CustomerBooking['paymentMethod']
  ): Promise<CustomerBooking> => {
    await new Promise(r => setTimeout(r, 600));

    const newBookingId = 'GC-' + Math.floor(10000 + Math.random() * 90000);
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Calculate advance requirement for COD / cash bookings (e.g. 20% or flat 150)
    const isCash = paymentMethod === 'cod';
    const advanceAmt = isCash ? Math.min(150, Math.round(cart.totalAmount * 0.2)) : 0;
    const remainingAmt = cart.totalAmount - advanceAmt;

    const primaryItem = (cart.items && cart.items.length > 0) ? cart.items[0] : null;
    const primaryServiceName = cart.items && cart.items.length > 0
      ? cart.items.map(i => `${i.service.name} (x${i.quantity})`).join(', ')
      : 'Home Cleaning';
    const categoryName = primaryItem?.service?.category || 'General';

    const newBooking: CustomerBooking = {
      bookingId: newBookingId,
      serviceId: primaryItem?.service?.serviceId || 'srv_gen',
      serviceName: primaryServiceName,
      serviceCategory: categoryName,
      serviceImage: primaryItem?.service?.imageUrl || ASSETS.heroLivingRoom,
      items: cart.items,
      addOns: cart.addOns,
      date: cart.selectedDate,
      dateLabel: cart.selectedDateLabel,
      timeSlot: cart.selectedSlot,
      address: cart.address || {
        id: 'addr_hyd',
        label: 'Home',
        street: 'Road No 36, Jubilee Hills',
        locality: 'Jubilee Hills',
        city: 'Hyderabad',
        pincode: '500033',
      },
      assignedPro: undefined,
      currentStage: 'confirmed',
      stageHistory: [
        { stage: 'confirmed', timestamp: 'Just now', label: 'Booking Confirmed', completed: true },
        { stage: 'assigned', timestamp: 'Searching Partner', label: 'Partner Matching (1-10km)', completed: false },
        { stage: 'on_the_way', timestamp: 'Pending', label: 'Professional On The Way', completed: false },
        { stage: 'arrived', timestamp: 'Pending', label: 'Arrived at Location', completed: false },
        { stage: 'cleaning', timestamp: 'Pending', label: 'Cleaning In Progress', completed: false },
        { stage: 'completed', timestamp: 'Pending', label: 'Cleaning Completed', completed: false },
      ],
      paymentMethod,
      paymentStatus: isCash ? 'pending' : 'paid',
      basePrice: cart.subtotal,
      addOnsTotal: cart.addOnsTotal,
      discountAmount: cart.discountAmount,
      platformFee: cart.platformFee,
      taxes: cart.taxes,
      totalAmount: cart.totalAmount,
      promoCode: cart.promoCode,
      createdAt: new Date().toISOString(),
      startOtp: otp,
    };

    setBookings(prev => [newBooking, ...prev]);
    setActiveBookingId(newBookingId);

    // Persist booking to Supabase database so Admin Panel receives real booking immediately
    try {
      const authSession = await authService.getCurrentUser();
      const currentUserId = authSession.user?.uid || null;
      const customerName = authSession.user?.name || (cart.address?.label ? `Customer (${cart.address.label})` : 'Customer');
      const customerPhone = authSession.user?.phone || '+91 98000 00000';
      const customerEmail = authSession.user?.email || 'customer@gchome.com';

      let scheduledDateIso = new Date().toISOString().split('T')[0];
      if (cart.selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(cart.selectedDate)) {
        scheduledDateIso = cart.selectedDate;
      }

      // Primary service info for master row
      const primaryItem = (cart.items && cart.items.length > 0) ? cart.items[0] : null;
      const primaryServiceId = primaryItem?.service?.serviceId && primaryItem.service.serviceId.length === 36 ? primaryItem.service.serviceId : null;
      const primaryServiceName = cart.items && cart.items.length > 0
        ? cart.items.map(i => `${i.service.name} (x${i.quantity})`).join(', ')
        : (cart as any).service?.name || 'Home Cleaning';
      const categoryName = primaryItem?.service?.category || 'General';

      const { data: insertedBooking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          booking_code: newBookingId,
          customer_id: currentUserId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          service_id: primaryServiceId,
          service_name: primaryServiceName,
          category_name: categoryName,
          selected_addons: cart.addOns || [],
          base_amount: cart.subtotal - (cart.addOnsTotal || 0),
          addon_amount: cart.addOnsTotal || 0,
          service_price: cart.subtotal,
          discount_amount: cart.discountAmount || 0,
          coupon_code: cart.promoCode || null,
          platform_fee: cart.platformFee || 29,
          tax_amount: cart.taxes || 0,
          total_amount: cart.totalAmount,
          address_label: cart.address?.label || 'Home',
          address_street: cart.address?.street || 'Customer Address',
          address_locality: cart.address?.locality || 'Hyderabad',
          address_city: cart.address?.city || 'Hyderabad',
          address_pincode: cart.address?.pincode || '500001',
          scheduled_date: scheduledDateIso,
          time_slot: cart.selectedSlot || '4:00 PM – 6:00 PM',
          status: 'pending_assignment',
          admin_approval_status: 'pending',
          assignment_status: 'unassigned',
          payment_method: isCash ? 'cash' : 'upi',
          payment_status: isCash ? 'pending' : 'paid',
          verification_otp: otp,
          start_otp: otp,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Insert individual items into booking_items table if master insertion succeeded
      if (insertedBooking && insertedBooking.id && cart.items && cart.items.length > 0) {
        const itemRows = cart.items.map(item => ({
          booking_id: insertedBooking.id,
          service_id: item.service.serviceId && item.service.serviceId.length === 36 ? item.service.serviceId : null,
          service_name: item.service.name,
          quantity: item.quantity,
          unit_price: item.service.startingPrice || 0,
          subtotal: item.itemTotal,
        }));
        await supabase.from('booking_items').insert(itemRows);
      }
    } catch (insertErr) {
      console.warn('Booking insertion notice:', insertErr);
    }

    return newBooking;
  };

  const selectBookingForTracking = (bookingId: string) => {
    setActiveBookingId(bookingId);
  };

  const advanceBookingStage = (bookingId: string, targetStage: TrackingStage) => {
    const STAGE_ORDER: TrackingStage[] = [
      'confirmed',
      'assigned',
      'on_the_way',
      'arrived',
      'cleaning',
      'completed',
    ];
    const targetIdx = STAGE_ORDER.indexOf(targetStage);

    setBookings(prev =>
      prev.map(b => {
        if (b.bookingId !== bookingId) return b;

        const updatedHistory = b.stageHistory.map(item => {
          const itemIdx = STAGE_ORDER.indexOf(item.stage);
          return {
            ...item,
            completed: itemIdx <= targetIdx,
            timestamp: itemIdx <= targetIdx && item.timestamp === 'Pending' ? 'Updated' : item.timestamp,
          };
        });

        return {
          ...b,
          currentStage: targetStage,
          stageHistory: updatedHistory,
        };
      })
    );
  };

  const cancelBooking = (bookingId: string, reason?: string) => {
    // Update local state immediately
    setBookings(prev =>
      prev.map(b => {
        if (b.bookingId !== bookingId) return b;
        return {
          ...b,
          // Use 'confirmed' stage as closest available — 'cancelled' handled by status filter
          currentStage: 'confirmed' as any,
          paymentStatus: 'pending',
        };
      })
    );

    // Persist cancellation to Supabase
    supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by customer',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'customer',
      })
      .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`)
      .then(({ error }) => {
        if (error) console.warn('cancelBooking Supabase error:', error.message);
      });
  };

  const submitReview = async (
    bookingId: string,
    rating: number,
    reviewText: string,
    tags: string[]
  ) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.bookingId !== bookingId) return b;
        return {
          ...b,
          rating,
          reviewText,
          reviewTags: tags,
        };
      })
    );

    // Persist rating & review to Supabase ratings table
    try {
      const { data: bRow } = await supabase
        .from('bookings')
        .select('id, customer_id, assigned_maid_id, service_id')
        .or(`booking_code.eq.${bookingId},id.eq.${bookingId}`)
        .maybeSingle();

      if (bRow) {
        await supabase.from('ratings').insert({
          booking_id: bRow.id,
          maid_id: bRow.assigned_maid_id,
          customer_id: bRow.customer_id,
          service_id: bRow.service_id,
          rating: Math.round(rating),
          stars: Math.round(rating),
          comment: reviewText,
          review_text: reviewText,
          is_visible: true,
        });
      }
    } catch (err) {
      console.warn('submitReview DB notice:', err);
    }
  };

  // State Machine API Actions
  const acceptJobOffer = async (bookingId: string, partnerId: string, lat: number, lng: number) => {
    const res = await acceptBooking(bookingId, partnerId, lat, lng);
    if (res.success) {
      advanceBookingStage(bookingId, 'assigned');
    }
    return res;
  };

  const verifyStartOtp = async (bookingId: string, otpCode: string, partnerId: string) => {
    const res = await verifyBookingOtp(bookingId, otpCode, partnerId);
    if (res.success) {
      advanceBookingStage(bookingId, 'cleaning');
    }
    return res;
  };

  const markPartnerArrived = async (bookingId: string, partnerId: string, lat: number, lng: number) => {
    const res = await confirmPartnerArrival(bookingId, partnerId, lat, lng);
    if (res.success) {
      advanceBookingStage(bookingId, 'arrived');
    }
    return res;
  };

  const submitCompletion = async (bookingId: string, partnerId: string, notes: string, photos: string[]) => {
    const res = await submitWorkCompletion(bookingId, partnerId, notes, photos);
    return res;
  };

  const confirmCompletion = async (bookingId: string, customerId: string) => {
    const res = await confirmCustomerCompletion(bookingId, customerId);
    if (res.success) {
      advanceBookingStage(bookingId, 'completed');
    }
    return res;
  };

  const addTip = async (bookingId: string, customerId: string, partnerId: string, amount: number) => {
    return await submitTip(bookingId, customerId, partnerId, amount);
  };

  const reportPaymentViolation = async (
    bookingId: string,
    reporterId: string,
    partnerId: string | undefined,
    reportType: 'asked_for_cash' | 'unauthorized_amount' | 'payment_outside_app' | 'service_issue' | 'other',
    description: string,
    amountRequested?: number
  ) => {
    return await reportUnauthorizedPayment(bookingId, reporterId, partnerId, reportType, description, amountRequested);
  };

  const activeBooking = bookings.find(b => b.bookingId === activeBookingId) || bookings[0] || null;

  return (
    <BookingContext.Provider
      value={{
        bookings,
        activeBooking,
        createBookingFromCart,
        selectBookingForTracking,
        advanceBookingStage,
        cancelBooking,
        submitReview,
        acceptJobOffer,
        verifyStartOtp,
        markPartnerArrived,
        submitCompletion,
        confirmCompletion,
        addTip,
        reportPaymentViolation,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
