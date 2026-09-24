import { supabase } from '../config/supabase';
import { Booking, BookingStatus, PaymentReport, BookingTip } from '../types';

export interface EligiblePartner {
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  partnerRating: number;
  distanceKm: number;
  estimatedEarnings: number;
  isAvailable: boolean;
}

export interface RPCResponse<T = any> {
  success?: boolean;
  valid?: boolean;
  error?: string;
  message?: string;
  data?: T;
  attemptsRemaining?: number;
}

/**
 * Calculate distance in km between two lat/lng coordinates (Haversine formula via Supabase)
 */
export async function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('calculate_distance_km', {
      lat1,
      lon1: lng1,
      lat2,
      lon2: lng2,
    });
    if (error) {
      console.warn('Distance RPC error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error in calculateDistanceKm:', err);
    return null;
  }
}

/**
 * Progressive radius search for eligible partners (1km → 10km)
 */
export async function findEligiblePartners(
  bookingId: string,
  radiusKm: number = 1.0,
  limit: number = 10
): Promise<EligiblePartner[]> {
  try {
    const { data, error } = await supabase.rpc('find_eligible_partners', {
      p_booking_id: bookingId,
      p_radius_km: radiusKm,
      p_limit: limit,
    });

    if (error) {
      console.warn('findEligiblePartners error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      partnerId: row.partner_id,
      partnerName: row.partner_name,
      partnerPhone: row.partner_phone,
      partnerRating: row.partner_rating,
      distanceKm: row.distance_km,
      estimatedEarnings: row.estimated_earnings,
      isAvailable: row.is_available,
    }));
  } catch (err) {
    console.error('Error in findEligiblePartners:', err);
    return [];
  }
}

/**
 * Validate payment status prior to partner assignment
 */
export async function validatePaymentBeforeAssignment(bookingId: string): Promise<RPCResponse> {
  try {
    const { data, error } = await supabase.rpc('validate_payment_before_assignment', {
      p_booking_id: bookingId,
    });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error in validatePaymentBeforeAssignment:', err);
    return { valid: false, error: 'rpc_error', message: err.message || 'Payment validation failed' };
  }
}

const IS_UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function resolveBookingUuid(bookingIdOrCode: string): Promise<string | null> {
  if (!bookingIdOrCode) return null;
  if (IS_UUID_REGEX.test(bookingIdOrCode)) return bookingIdOrCode;
  try {
    const { data: bRow } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_code', bookingIdOrCode)
      .maybeSingle();
    return bRow?.id || null;
  } catch {
    return null;
  }
}

/**
 * Atomic Booking Acceptance by Partner (concurrency-safe)
 */
export async function acceptBooking(
  bookingId: string,
  partnerId: string,
  acceptanceLat: number,
  acceptanceLng: number
): Promise<RPCResponse> {
  try {
    const resolvedId = (await resolveBookingUuid(bookingId)) || bookingId;
    const { data, error } = await supabase.rpc('accept_booking', {
      p_booking_id: resolvedId,
      p_partner_id: partnerId,
      p_acceptance_lat: acceptanceLat,
      p_acceptance_lng: acceptanceLng,
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error in acceptBooking:', err);
    return { success: false, error: 'rpc_error', message: err.message || 'Booking acceptance failed' };
  }
}

/**
 * Generate 6-digit OTP for booking start
 */
export async function generateBookingOtp(bookingId: string): Promise<string | null> {
  try {
    const resolvedId = (await resolveBookingUuid(bookingId)) || bookingId;
    const { data, error } = await supabase.rpc('generate_booking_otp', {
      p_booking_id: resolvedId,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error in generateBookingOtp:', err);
    return null;
  }
}

/**
 * Verify 6-digit OTP by Partner to start service
 */
export async function verifyBookingOtp(
  bookingId: string,
  otpCode: string,
  partnerId: string
): Promise<RPCResponse> {
  try {
    const resolvedId = (await resolveBookingUuid(bookingId)) || bookingId;
    const { data, error } = await supabase.rpc('verify_booking_otp', {
      p_booking_id: resolvedId,
      p_otp_code: otpCode,
      p_partner_id: partnerId,
    });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Error in verifyBookingOtp:', err);
    return { success: false, error: 'rpc_error', message: err.message || 'OTP verification failed' };
  }
}

/**
 * Partner signals arrival at service location
 */
export async function confirmPartnerArrival(
  bookingId: string,
  partnerId: string,
  currentLat: number,
  currentLng: number
): Promise<RPCResponse> {
  try {
    const resolvedId = (await resolveBookingUuid(bookingId)) || bookingId;
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'partner_arrived',
        partner_arrived_at: new Date().toISOString(),
        partner_location_lat: currentLat,
        partner_location_lng: currentLng,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${resolvedId},booking_code.eq.${bookingId}`);

    if (error) throw error;

    // Log timeline
    if (resolvedId && IS_UUID_REGEX.test(resolvedId)) {
      await supabase.from('booking_timeline').insert({
        booking_id: resolvedId,
        event_type: 'partner_arrived',
        event_title: 'Partner Arrived at Location',
        event_description: 'Partner reached customer service address',
        event_status: 'info',
        actor_id: partnerId,
        actor_type: 'partner',
      });
    }

    return { success: true, message: 'Partner arrival recorded' };
  } catch (err: any) {
    console.error('Error confirming partner arrival:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Partner submits work completion with before/after photos and notes
 */
export async function submitWorkCompletion(
  bookingId: string,
  partnerId: string,
  notes: string,
  photos: string[]
): Promise<RPCResponse> {
  try {
    const resolvedId = (await resolveBookingUuid(bookingId)) || bookingId;
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_submitted_at: new Date().toISOString(),
        completion_notes: notes,
        completion_photos: photos,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${resolvedId},booking_code.eq.${bookingId}`);

    if (error) throw error;

    // Log timeline
    if (resolvedId && IS_UUID_REGEX.test(resolvedId)) {
      await supabase.from('booking_timeline').insert({
        booking_id: resolvedId,
        event_type: 'completion_submitted',
        event_title: 'Partner Submitted Service Completion',
        event_description: 'Work completed to customer specifications.',
        event_status: 'info',
        actor_id: partnerId,
        actor_type: 'partner',
      });
    }

    return { success: true, message: 'Work completion submitted successfully' };
  } catch (err: any) {
    console.error('Error submitting work completion:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Customer confirms completion & settles final payment
 */
export async function confirmCustomerCompletion(
  bookingId: string,
  customerId: string
): Promise<RPCResponse> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'customer_confirmed',
        customer_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('customer_id', customerId);

    if (error) throw error;

    // Log timeline
    await supabase.from('booking_timeline').insert({
      booking_id: bookingId,
      event_type: 'customer_confirmed',
      event_title: 'Customer Confirmed Completion',
      event_description: 'Customer approved service completion.',
      event_status: 'success',
      actor_id: customerId,
      actor_type: 'customer',
    });

    return { success: true, message: 'Service completion confirmed by customer' };
  } catch (err: any) {
    console.error('Error confirming completion:', err);
    return { success: false, message: err.message };
  }
}



/**
 * Submit Tip for Partner
 */
export async function submitTip(
  bookingId: string,
  customerId: string,
  partnerId: string,
  amount: number,
  paymentMethod: string = 'upi'
): Promise<RPCResponse> {
  try {
    if (amount <= 0) {
      return { success: false, message: 'Tip amount must be greater than zero' };
    }

    let resolvedBookingId = IS_UUID_REGEX.test(bookingId) ? bookingId : null;

    if (!resolvedBookingId) {
      // Look up real UUID by booking_code
      const { data: bookingRow } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_code', bookingId)
        .maybeSingle();

      if (bookingRow?.id) {
        resolvedBookingId = bookingRow.id;
      }
    }

    const resolvedCustomerId = IS_UUID_REGEX.test(customerId) ? customerId : null;
    const resolvedPartnerId = IS_UUID_REGEX.test(partnerId) ? partnerId : null;

    // If IDs are mock format (non-UUID) and cannot be resolved in DB, return mock success cleanly
    if (!resolvedBookingId || !resolvedCustomerId || !resolvedPartnerId) {
      console.log('Notice: Tip recorded in mock mode for non-UUID identifiers:', { bookingId, customerId, partnerId });
      return {
        success: true,
        message: 'Tip submitted successfully (mock mode)',
        data: { booking_id: bookingId, amount, payment_status: 'paid' },
      };
    }

    const { data, error } = await supabase
      .from('tips')
      .insert({
        booking_id: resolvedBookingId,
        customer_id: resolvedCustomerId,
        partner_id: resolvedPartnerId,
        amount,
        payment_status: 'paid',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update tip_amount on booking
    await supabase.rpc('calculate_partner_earnings', { p_booking_id: resolvedBookingId });

    return { success: true, message: 'Tip submitted successfully', data };
  } catch (err: any) {
    console.error('Error submitting tip:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Customer reports unauthorized payment request (e.g. partner asking cash on non-COD order)
 */
export async function reportUnauthorizedPayment(
  bookingId: string,
  reporterId: string,
  reportedPartnerId: string | undefined,
  reportType: PaymentReport['reportType'],
  description: string,
  amountRequested?: number
): Promise<RPCResponse> {
  try {
    let resolvedBookingId = IS_UUID_REGEX.test(bookingId) ? bookingId : null;
    if (!resolvedBookingId) {
      const { data: bRow } = await supabase.from('bookings').select('id').eq('booking_code', bookingId).maybeSingle();
      if (bRow?.id) resolvedBookingId = bRow.id;
    }

    const resolvedReporterId = IS_UUID_REGEX.test(reporterId) ? reporterId : null;
    const resolvedPartnerId = reportedPartnerId && IS_UUID_REGEX.test(reportedPartnerId) ? reportedPartnerId : null;

    if (!resolvedBookingId || !resolvedReporterId) {
      console.log('Notice: Payment report recorded in mock mode for non-UUID identifiers:', { bookingId, reporterId });
      return { success: true, message: 'Report submitted. Admin will investigate. (mock mode)' };
    }

    const { data, error } = await supabase
      .from('payment_reports')
      .insert({
        booking_id: resolvedBookingId,
        reporter_id: resolvedReporterId,
        reported_partner_id: resolvedPartnerId,
        report_type: reportType,
        description,
        amount_requested: amountRequested || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Flag booking timeline
    await supabase.from('booking_timeline').insert({
      booking_id: resolvedBookingId,
      event_type: 'unauthorized_payment_report',
      event_title: 'Unauthorized Payment Reported',
      event_description: `Customer reported unauthorized demand (${reportType}): ${description}`,
      event_status: 'warning',
      actor_id: resolvedReporterId,
      actor_type: 'customer',
    });

    return { success: true, message: 'Report submitted. Admin will investigate.', data };
  } catch (err: any) {
    console.error('Error submitting payment report:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Partner location tracking update (live GPS ping)
 */
export async function updatePartnerLocation(
  partnerId: string,
  bookingId: string | null,
  lat: number,
  lng: number,
  accuracy?: number,
  heading?: number,
  speed?: number
): Promise<void> {
  try {
    // Update current maid_profile location
    await supabase
      .from('maid_profiles')
      .update({
        last_location_lat: lat,
        last_location_lng: lng,
        last_location_updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId);

    // Record history ping
    await supabase.from('partner_location_history').insert({
      partner_id: partnerId,
      booking_id: bookingId || null,
      latitude: lat,
      longitude: lng,
      accuracy_meters: accuracy || null,
      heading: heading || null,
      speed_mps: speed || null,
      is_active_booking: !!bookingId,
    });
  } catch (err) {
    console.warn('Error updating partner location:', err);
  }
}
