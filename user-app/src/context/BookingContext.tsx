import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerBooking, CustomerCart, TrackingStage, AssignedProfessional } from '../types';
import { ASSETS } from '../assets/index';
import { supabase } from '../config/supabase';
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

const DEFAULT_PRO: AssignedProfessional = {
  id: 'pro_sunita_01',
  name: 'Sunita Devi',
  photoUrl: ASSETS.promoCleaner,
  rating: 4.9,
  reviewCount: 348,
  phone: '+91 98765 43210',
  isVerified: true,
  experience: '4.5 years exp.',
  vaccinationStatus: 'Fully Vaccinated & Verified',
};

const SEED_BOOKINGS: CustomerBooking[] = [
  {
    bookingId: 'GC-89421',
    serviceId: 'srv_home_clean',
    serviceName: 'Home Cleaning',
    serviceCategory: 'Home',
    serviceImage: ASSETS.heroLivingRoom,
    homeSize: { id: '1bhk', label: '1 BHK', roomsCount: 1, price: 699 },
    addOns: [{ id: 'addon_micro', title: 'Microwave Cleaning', price: 149 }],
    date: 'Today',
    dateLabel: 'Today, 26 Apr',
    timeSlot: '4:00 PM – 6:00 PM',
    address: {
      id: 'addr_default',
      label: 'Home',
      street: '123, 4th Cross, HSR Layout',
      locality: 'HSR Layout',
      city: 'Bengaluru',
      pincode: '560102',
    },
    assignedPro: DEFAULT_PRO,
    currentStage: 'on_the_way',
    stageHistory: [
      { stage: 'confirmed', timestamp: '3:30 PM', label: 'Booking Confirmed', completed: true },
      { stage: 'assigned', timestamp: '3:45 PM', label: 'Professional Assigned', completed: true },
      { stage: 'on_the_way', timestamp: '4:00 PM', label: 'Professional On The Way', completed: true },
      { stage: 'arrived', timestamp: 'Pending', label: 'Arrived at Location', completed: false },
      { stage: 'cleaning', timestamp: 'Pending', label: 'Cleaning In Progress', completed: false },
      { stage: 'completed', timestamp: 'Pending', label: 'Cleaning Completed', completed: false },
    ],
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    basePrice: 699,
    addOnsTotal: 149,
    discountAmount: 170,
    platformFee: 29,
    taxes: 122,
    totalAmount: 829,
    promoCode: 'GCHOME20',
    createdAt: new Date().toISOString(),
    startOtp: '4829',
  },
];

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<CustomerBooking[]>(SEED_BOOKINGS);
  const [activeBookingId, setActiveBookingId] = useState<string>('GC-89421');

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
              return {
                ...b,
                startOtp: updatedRow.verification_otp || b.startOtp,
                paymentStatus: updatedRow.payment_status || b.paymentStatus,
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

    const newBooking: CustomerBooking = {
      bookingId: newBookingId,
      serviceId: cart.service.serviceId,
      serviceName: cart.service.name,
      serviceCategory: cart.service.category,
      serviceImage: cart.service.imageUrl,
      homeSize: cart.homeSize,
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
      assignedPro: DEFAULT_PRO,
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
      basePrice: cart.basePrice,
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

  const cancelBooking = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.bookingId !== bookingId) return b;
        return {
          ...b,
          currentStage: 'confirmed',
          paymentStatus: 'pending',
        };
      })
    );
  };

  const submitReview = (
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
