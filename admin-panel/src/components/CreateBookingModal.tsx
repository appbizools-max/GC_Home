import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { X, Calendar, Clock, MapPin, User, Phone, Mail, Sparkles, CreditCard } from 'lucide-react';

export const CreateBookingModal: React.FC = () => {
  const { createBookingModalOpen, setCreateBookingModalOpen, createNewBooking, services } = useAdmin();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.serviceId || 'srv_1');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('Kondapur');
  const [date, setDate] = useState('16 Sep 2026');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [paymentMethod, setPaymentMethod] = useState('Online (UPI)');
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!createBookingModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selService = services.find(s => s.serviceId === serviceId) || services[0];
    await createNewBooking({
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      serviceName: selService.name,
      servicePrice: selService.startingPrice,
      totalAmount: selService.startingPrice,
      address: {
        id: 'addr_' + Date.now(),
        label: 'Home',
        street,
        locality,
        city: 'Hyderabad',
        pincode: '500084',
      },
      date,
      timeSlot,
      paymentMethod,
      specialInstructions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setCreateBookingModalOpen(false)}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] text-[#043927] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#0A192F]">Create New Booking</h3>
            <p className="text-xs text-slate-500 font-medium">Add a new customer service request</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Customer Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Select Service
            </label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
            >
              {services.map(s => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.name} — ₹{s.startingPrice} ({s.estimatedDuration})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Street / Flat Address
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={e => setStreet(e.target.value)}
                placeholder="Flat 4B, Sri Sai Residency"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Locality / Hub Zone
              </label>
              <select
                value={locality}
                onChange={e => setLocality(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
              >
                <option value="Kondapur">Kondapur</option>
                <option value="Madhapur">Madhapur</option>
                <option value="Gachibowli">Gachibowli</option>
                <option value="Manikonda">Manikonda</option>
                <option value="Bachupally">Bachupally</option>
                <option value="Kukatpally">Kukatpally</option>
                <option value="Ameerpet">Ameerpet</option>
                <option value="Hitech City">Hitech City</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Service Date
              </label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="16 Sep 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:15 AM">10:15 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
              Special Instructions
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Focus on living room and kitchen"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setCreateBookingModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#043927] hover:bg-[#064e3b] text-white text-xs font-extrabold cursor-pointer shadow-md"
            >
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
