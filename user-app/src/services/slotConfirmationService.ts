import { supabase } from '../config/supabase';
import { Booking } from '../types';

export interface SlotConfirmationCheckResult {
  reminderTriggered: string[]; // booking IDs
  redFlagsRaised: string[];     // booking IDs
  bothConfirmed: string[];     // booking IDs
}

/**
 * Parses booking date (YYYY-MM-DD) and timeSlot (e.g. "09:00 AM - 10:00 AM" or "10:00 AM")
 * into a JavaScript Date object representing the slot start time.
 */
export function getSlotStartTime(dateStr: string, timeSlotStr: string): Date | null {
  try {
    if (!dateStr) return null;
    const cleanTime = (timeSlotStr || '').split('-')[0].trim(); // e.g. "09:00 AM"
    
    // Parse Date part
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return null;
    
    const slotDate = new Date(year, month - 1, day);

    if (!cleanTime) return slotDate;

    // Match time format: HH:MM AM/PM or HH:MM
    const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      slotDate.setHours(hours, minutes, 0, 0);
    }

    return slotDate;
  } catch {
    return null;
  }
}

class SlotConfirmationService {
  /**
   * Run automated background audit on all active/confirmed bookings:
   * 1. Auto-fires 30-min reminder if slot starts within 30 minutes and reminder is unsent.
   * 2. Runs 5-minute verification check after reminder was sent.
   */
  async processSlotConfirmations(bookings: Booking[]): Promise<SlotConfirmationCheckResult> {
    const now = new Date();
    const result: SlotConfirmationCheckResult = {
      reminderTriggered: [],
      redFlagsRaised: [],
      bothConfirmed: [],
    };

    const confirmedStatuses = [
      'maid_assigned',
      'maid_accepted',
      'partner_accepted',
      'scheduled',
      'in_progress',
    ];

    for (const b of bookings) {
      if (!confirmedStatuses.includes(b.status)) continue;
      if (b.slotConfirmationStatus === 'finalized' || b.slotConfirmationStatus === 'admin_resolved') continue;

      const slotStart = getSlotStartTime(b.date, b.timeSlot);
      if (!slotStart) continue;

      const diffMs = slotStart.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // ── STEP 1: Auto-fire reminder 30 mins before slot ──
      // Trigger if slot is 30 mins away or less (down to -60 mins window)
      if (diffMinutes <= 30 && diffMinutes >= -60 && !b.slotReminderSentAt) {
        const nowIso = now.toISOString();
        b.slotReminderSentAt = nowIso;
        b.slotConfirmationStatus = 'reminder_sent';
        result.reminderTriggered.push(b.bookingId);

        // Update database asynchronously
        this.updateBookingInSupabase(b.bookingId, {
          slot_reminder_sent_at: nowIso,
          slot_confirmation_status: 'reminder_sent',
        });
      }

      // ── STEP 2: 5-minute verification check after reminder ──
      if (b.slotReminderSentAt && !b.fiveMinCheckTriggeredAt) {
        const reminderTime = new Date(b.slotReminderSentAt).getTime();
        const minutesSinceReminder = Math.floor((now.getTime() - reminderTime) / (1000 * 60));

        if (minutesSinceReminder >= 5) {
          const nowIso = now.toISOString();
          b.fiveMinCheckTriggeredAt = nowIso;

          if (b.customerConfirmedSlot && b.maidConfirmedSlot) {
            b.slotConfirmationStatus = 'both_confirmed';
            result.bothConfirmed.push(b.bookingId);

            this.updateBookingInSupabase(b.bookingId, {
              five_min_check_triggered_at: nowIso,
              slot_confirmation_status: 'both_confirmed',
            });
          } else {
            // EITHER customer or maid failed to confirm within 5 mins -> RED FLAG!
            b.slotConfirmationStatus = 'red_flagged';
            result.redFlagsRaised.push(b.bookingId);

            this.updateBookingInSupabase(b.bookingId, {
              five_min_check_triggered_at: nowIso,
              slot_confirmation_status: 'red_flagged',
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Log customer slot confirmation response + timestamp
   */
  async confirmCustomerSlot(booking: Booking): Promise<Booking> {
    const nowIso = new Date().toISOString();
    booking.customerConfirmedSlot = true;
    booking.customerSlotConfirmedAt = nowIso;

    if (booking.maidConfirmedSlot) {
      booking.slotConfirmationStatus = 'both_confirmed';
    } else {
      booking.slotConfirmationStatus = 'customer_confirmed';
    }

    await this.updateBookingInSupabase(booking.bookingId, {
      customer_confirmed_slot: true,
      customer_slot_confirmed_at: nowIso,
      slot_confirmation_status: booking.slotConfirmationStatus,
    });

    return booking;
  }

  /**
   * Log maid slot confirmation response + timestamp
   */
  async confirmMaidSlot(booking: Booking): Promise<Booking> {
    const nowIso = new Date().toISOString();
    booking.maidConfirmedSlot = true;
    booking.maidSlotConfirmedAt = nowIso;

    if (booking.customerConfirmedSlot) {
      booking.slotConfirmationStatus = 'both_confirmed';
    } else {
      booking.slotConfirmationStatus = 'maid_confirmed';
    }

    await this.updateBookingInSupabase(booking.bookingId, {
      maid_confirmed_slot: true,
      maid_slot_confirmed_at: nowIso,
      slot_confirmation_status: booking.slotConfirmationStatus,
    });

    return booking;
  }

  /**
   * Admin confirms "OK" & finalizes both-confirmed slot
   */
  async finalizeAdminSlot(bookingId: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    return this.updateBookingInSupabase(bookingId, {
      slot_confirmation_status: 'finalized',
      admin_finalized_at: nowIso,
    });
  }

  /**
   * Admin resolves red-flagged booking
   */
  async resolveRedFlagAdmin(bookingId: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    return this.updateBookingInSupabase(bookingId, {
      slot_confirmation_status: 'finalized',
      admin_resolved_at: nowIso,
    });
  }

  private async updateBookingInSupabase(bookingId: string, updates: Record<string, any>): Promise<boolean> {
    try {
      // Try updating by booking_code first, then by id
      const { error: err1 } = await supabase
        .from('bookings')
        .update(updates)
        .eq('booking_code', bookingId);

      if (err1) {
        await supabase
          .from('bookings')
          .update(updates)
          .eq('id', bookingId);
      }
      return true;
    } catch (e) {
      console.warn('[SlotConfirmationService] Supabase update warning:', e);
      return false;
    }
  }
}

export const slotConfirmationService = new SlotConfirmationService();
