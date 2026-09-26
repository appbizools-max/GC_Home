/**
 * GC HOME+ — Booking & Payment Presentation Utilities
 * Consistent, uncorrupted presentation mapping across all Admin Panel views.
 */

export interface PaymentDisplayInfo {
  methodLabel: string;
  statusLabel: string;
  statusBadgeStyle: string;
  isPaid: boolean;
  isPayAfterService: boolean;
}

/**
 * Standardize date presentation to DD-MM-YYYY without altering stored ISO/DB timestamps.
 * Examples:
 *   "2026-09-25" -> "25-09-2026"
 *   "2026-09-25T13:07:12.000Z" -> "25-09-2026"
 *   "25-09-2026" -> "25-09-2026"
 */
export const formatDateDDMMYYYY = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // YYYY-MM-DD or ISO timestamp
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const ymd = trimmed.substring(0, 10).split('-');
    if (ymd.length === 3) {
      return `${ymd[2]}-${ymd[1]}-${ymd[0]}`;
    }
  }

  // Try Date parsing fallback
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {}

  return trimmed;
};

/**
 * Robust payment state mapping derived from actual DB payment record.
 * Never defaults or hardcodes "Paid" for Pay After Service or uncollected payments.
 */
export const getPaymentDisplayInfo = (
  paymentStatus?: string | null,
  paymentMethod?: string | null
): PaymentDisplayInfo => {
  const method = (paymentMethod || '').toLowerCase().trim();
  const status = (paymentStatus || '').toLowerCase().trim();

  const isPayAfterService =
    method === 'cash' ||
    method === 'cod' ||
    method === 'pay_after_service' ||
    method === 'pay after service' ||
    method === 'post_service';

  // 1. Resolve human-readable Payment Method Label
  let methodLabel = 'Online Payment';
  if (isPayAfterService) {
    methodLabel = 'Pay After Service';
  } else if (method === 'upi') {
    methodLabel = 'UPI Payment';
  } else if (method === 'card') {
    methodLabel = 'Credit/Debit Card';
  } else if (method === 'netbanking') {
    methodLabel = 'Net Banking';
  } else if (method === 'wallet') {
    methodLabel = 'Wallet';
  } else if (method) {
    methodLabel = method.charAt(0).toUpperCase() + method.slice(1);
  }

  // 2. Resolve Payment Status based strictly on actual payment record
  if (status === 'paid' || status === 'completed' || status === 'success') {
    return {
      methodLabel,
      statusLabel: 'Paid',
      statusBadgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold',
      isPaid: true,
      isPayAfterService,
    };
  }

  if (status === 'failed') {
    return {
      methodLabel,
      statusLabel: 'Payment Failed',
      statusBadgeStyle: 'bg-rose-50 text-rose-800 border-rose-200/80 font-bold',
      isPaid: false,
      isPayAfterService,
    };
  }

  if (status === 'refunded') {
    return {
      methodLabel,
      statusLabel: 'Refunded',
      statusBadgeStyle: 'bg-purple-50 text-purple-800 border-purple-200/80 font-bold',
      isPaid: false,
      isPayAfterService,
    };
  }

  if (status === 'partial' || status === 'advance_paid') {
    return {
      methodLabel,
      statusLabel: 'Partial Payment',
      statusBadgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200/80 font-bold',
      isPaid: false,
      isPayAfterService,
    };
  }

  // Default: Pending
  if (isPayAfterService) {
    return {
      methodLabel,
      statusLabel: 'Payment Pending',
      statusBadgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold',
      isPaid: false,
      isPayAfterService: true,
    };
  }

  return {
    methodLabel,
    statusLabel: 'Payment Pending',
    statusBadgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold',
    isPaid: false,
    isPayAfterService: false,
  };
};

/**
 * Partner payout calculation — strictly separating partner earnings from customer total.
 * Standard formula: 75% of customer service total or stored partner_earnings.
 */
export const getPartnerEstimatedEarnings = (
  totalAmount?: number | null,
  partnerEarnings?: number | null
): number => {
  if (partnerEarnings !== undefined && partnerEarnings !== null && Number(partnerEarnings) > 0) {
    return Math.round(Number(partnerEarnings));
  }
  const total = Number(totalAmount || 0);
  return total > 0 ? Math.round(total * 0.75) : 500;
};
