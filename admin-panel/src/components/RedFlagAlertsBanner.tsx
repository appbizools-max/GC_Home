import React from 'react';
import { Booking } from '../types';
import { AlertTriangle, CheckCircle2, Phone, ShieldAlert, Check } from 'lucide-react';

interface RedFlagAlertsBannerProps {
  bookings: Booking[];
  onFinalizeSlot: (bookingId: string) => void;
  onResolveRedFlag: (bookingId: string) => void;
}

export const RedFlagAlertsBanner: React.FC<RedFlagAlertsBannerProps> = ({
  bookings,
  onFinalizeSlot,
  onResolveRedFlag,
}) => {
  const redFlaggedBookings = bookings.filter(b => b.slotConfirmationStatus === 'red_flagged');
  const bothConfirmedBookings = bookings.filter(b => b.slotConfirmationStatus === 'both_confirmed');

  if (redFlaggedBookings.length === 0 && bothConfirmedBookings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* ── RED FLAG ALERTS (HIGH PRIORITY UNCONFIRMED SLOTS) ── */}
      {redFlaggedBookings.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500/80 rounded-2xl p-4 shadow-lg shadow-red-500/10 animate-pulse-subtle">
          <div className="flex items-center justify-between gap-3 mb-3 border-b border-red-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold animate-bounce">
                🚩
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-red-950 uppercase tracking-wide flex items-center gap-2">
                  <span>RED FLAG ALERT:</span> Unconfirmed Pre-Service Slot Reminders ({redFlaggedBookings.length})
                </h3>
                <p className="text-xs text-red-700 font-medium">
                  Either Customer or Maid failed to confirm 30-min slot attendance within 5 minutes. Immediate admin resolution required.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {redFlaggedBookings.map(b => {
              const customerPending = !b.customerConfirmedSlot;
              const maidPending = !b.maidConfirmedSlot;

              return (
                <div key={b.bookingId} className="bg-white rounded-xl p-3 border border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">#{b.bookingId}</span>
                      <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-red-300">
                        {customerPending && maidPending
                          ? 'Both Pending'
                          : customerPending
                          ? 'Customer Unconfirmed'
                          : 'Maid Unconfirmed'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">• Slot: {b.date} ({b.timeSlot})</span>
                    </div>

                    <div className="text-xs text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>Service:</strong> {b.serviceName}</span>
                      <span><strong>Customer:</strong> {b.customerName} ({b.customerPhone})</span>
                      {b.assignedMaidName && (
                        <span><strong>Maid:</strong> {b.assignedMaidName} ({b.assignedMaidPhone || 'N/A'})</span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex gap-4 pt-1">
                      <span>Customer Status: {b.customerConfirmedSlot ? `✅ Confirmed at ${b.customerSlotConfirmedAt ? new Date(b.customerSlotConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}` : '❌ Pending'}</span>
                      <span>Maid Status: {b.maidConfirmedSlot ? `✅ Confirmed at ${b.maidSlotConfirmedAt ? new Date(b.maidSlotConfirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}` : '❌ Pending'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${customerPending ? b.customerPhone : b.assignedMaidPhone}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <Phone size={13} />
                      <span>Call {customerPending ? 'Customer' : 'Maid'}</span>
                    </a>

                    <button
                      onClick={() => onResolveRedFlag(b.bookingId)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow transition"
                    >
                      <ShieldAlert size={13} />
                      <span>Resolve Red Flag</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BOTH CONFIRMED SLOTS (ADMIN FINALIZATION READY) ── */}
      {bothConfirmedBookings.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-2 border-b border-emerald-200 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-700" />
              <div>
                <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                  Pre-Service Slot Check: Both Parties Confirmed ({bothConfirmedBookings.length})
                </h3>
                <p className="text-xs text-emerald-700">
                  Customer and Maid have both logged slot confirmation responses. Tap OK to finalize slot verification.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {bothConfirmedBookings.map(b => (
              <div key={b.bookingId} className="bg-white rounded-xl p-3 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">#{b.bookingId}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <Check size={12} /> Both Confirmed
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">• Slot: {b.date} ({b.timeSlot})</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Service: <strong>{b.serviceName}</strong> • Customer: <strong>{b.customerName}</strong> • Maid: <strong>{b.assignedMaidName}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onFinalizeSlot(b.bookingId)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition shrink-0"
                >
                  <CheckCircle2 size={14} />
                  <span>OK & Finalize Slot</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
