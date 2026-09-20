import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { X, AlertTriangle } from 'lucide-react';

export const CancelBookingModal: React.FC = () => {
  const { cancelModalOpen, setCancelModalOpen, selectedBooking, cancelBookingWithReason } = useAdmin();
  const [reason, setReason] = useState('Customer requested cancellation');

  if (!cancelModalOpen || !selectedBooking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await cancelBookingWithReason(selectedBooking.bookingId, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
        <button
          onClick={() => setCancelModalOpen(false)}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-3">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900">Cancel Booking</h3>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Are you sure you want to cancel booking <span className="font-bold text-slate-800">{selectedBooking.bookingId}</span>?
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Cancellation Reason
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
            >
              <option value="Customer requested cancellation">Customer requested cancellation</option>
              <option value="No maids available in locality">No maids available in locality</option>
              <option value="Payment verification failure">Payment verification failure</option>
              <option value="Incorrect address details">Incorrect address details</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer shadow-md"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
