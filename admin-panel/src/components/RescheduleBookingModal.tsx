import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { X, Calendar, Clock } from 'lucide-react';

export const RescheduleBookingModal: React.FC = () => {
  const { rescheduleModalOpen, setRescheduleModalOpen, selectedBooking, rescheduleBooking } = useAdmin();
  const [newDate, setNewDate] = useState('17 Sep 2026');
  const [newTime, setNewTime] = useState('11:00 AM');

  if (!rescheduleModalOpen || !selectedBooking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await rescheduleBooking(selectedBooking.bookingId, newDate, newTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
        <button
          onClick={() => setRescheduleModalOpen(false)}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-3">
          <Calendar className="w-5 h-5" />
        </div>

        <h3 className="text-xl font-extrabold text-[#0A192F]">Reschedule Booking</h3>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Change appointment date and time slot for {selectedBooking.bookingId} ({selectedBooking.customerName})
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              New Date
            </label>
            <input
              type="text"
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              placeholder="17 Sep 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              New Time Slot
            </label>
            <select
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
            >
              <option value="09:00 AM">09:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="04:30 PM">04:30 PM</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold cursor-pointer shadow-md"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
