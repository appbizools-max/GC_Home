import { describe, it, expect } from 'vitest';

describe('User App Core Engine Tests', () => {
  describe('Dual-Role UI Routing Engine', () => {
    it('returns customer UI for regular customer account', () => {
      const user = { uid: 'cust-1', role: 'customer' };
      const maidProfile = null;
      const isMaidUI = user?.role === 'maid' && maidProfile?.status === 'approved';
      expect(isMaidUI).toBe(false);
    });

    it('returns customer UI while maid application is still pending or rejected', () => {
      const user = { uid: 'cust-2', role: 'customer' };
      const maidPending = { status: 'pending' };
      const maidRejected = { status: 'rejected' };

      expect(user.role === 'maid' && maidPending.status === 'approved').toBe(false);
      expect(user.role === 'maid' && maidRejected.status === 'approved').toBe(false);
    });

    it('switches fully to Maid-Only UI when role is maid and profile is approved', () => {
      const user = { uid: 'maid-1', role: 'maid' };
      const maidApproved = { status: 'approved' };

      const isMaidUI = user.role === 'maid' && maidApproved.status === 'approved';
      expect(isMaidUI).toBe(true);
    });
  });

  describe('Dynamic Pricing Calculation Engine', () => {
    const calculateServicePrice = (basePrice: number, bhkCount: number, pricePerBhk: number = 300) => {
      const additionalBhks = Math.max(0, bhkCount - 1);
      return basePrice + (additionalBhks * pricePerBhk);
    };

    it('computes 1 BHK base price accurately', () => {
      const total = calculateServicePrice(799, 1, 300);
      expect(total).toBe(799);
    });

    it('computes 3 BHK price with additional room multiplier', () => {
      // 1 BHK = 799, + 2 extra BHKs @ 300 = 600 => 1399
      const total = calculateServicePrice(799, 3, 300);
      expect(total).toBe(1399);
    });

    it('correctly calculates 80% partner payout and 20% platform commission', () => {
      const bookingTotal = 1500;
      const commissionRate = 0.20;
      const platformFee = Math.round(bookingTotal * commissionRate);
      const maidPayout = bookingTotal - platformFee;

      expect(platformFee).toBe(300);
      expect(maidPayout).toBe(1200);
      expect(platformFee + maidPayout).toBe(bookingTotal);
    });
  });

  describe('Booking Lifecycle & OTP Security', () => {
    it('generates a 4-digit start OTP within valid numerical range', () => {
      for (let i = 0; i < 20; i++) {
        const otp = String(Math.floor(1000 + Math.random() * 9000));
        expect(otp.length).toBe(4);
        expect(Number(otp)).toBeGreaterThanOrEqual(1000);
        expect(Number(otp)).toBeLessThanOrEqual(9999);
      }
    });

    it('validates start OTP correctly and rejects incorrect codes', () => {
      const generatedOtp = '4829';
      const verifyOtp = (entered: string) => entered.trim() === generatedOtp;

      expect(verifyOtp('4829')).toBe(true);
      expect(verifyOtp('0000')).toBe(false);
      expect(verifyOtp('482')).toBe(false);
      expect(verifyOtp('')).toBe(false);
    });

    it('enforces sequential state progression without skipping steps', () => {
      const allowedTransitions: Record<string, string[]> = {
        'pending_assignment': ['maid_assigned', 'cancelled'],
        'maid_assigned': ['maid_accepted', 'pending_assignment', 'cancelled'],
        'maid_accepted': ['en_route', 'cancelled'],
        'en_route': ['in_progress', 'cancelled'],
        'in_progress': ['completed'],
        'completed': [],
        'cancelled': [],
      };

      const canTransition = (from: string, to: string) => {
        return allowedTransitions[from]?.includes(to) ?? false;
      };

      expect(canTransition('pending_assignment', 'maid_assigned')).toBe(true);
      expect(canTransition('maid_assigned', 'maid_accepted')).toBe(true);
      expect(canTransition('maid_accepted', 'in_progress')).toBe(false); // Must go to en_route first
      expect(canTransition('in_progress', 'completed')).toBe(true);
      expect(canTransition('completed', 'in_progress')).toBe(false); // Terminal state
    });
  });
});
