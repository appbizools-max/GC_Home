import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, MapPin, CreditCard } from 'lucide-react';
import { PaymentMethod } from '../../types';

export const BookingScreen: React.FC = () => {
  const { selectedService, createBooking, navigateTo, user } = useAuth();

  const [date, setDate] = useState('2026-09-10');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [street, setStreet] = useState('Flat 402, Green Glen Layout');
  const [locality, setLocality] = useState('Bellandur');
  const [city] = useState('Bengaluru');
  const [pincode] = useState('560103');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  if (!selectedService) {
    navigateTo('customer_home');
    return null;
  }

  const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM'
  ];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    const booking = createBooking({
      customerName: user?.name || 'Rahul Verma',
      customerPhone: user?.phone || '+91 98111 22233',
      serviceId: selectedService.serviceId,
      serviceName: selectedService.name,
      servicePrice: selectedService.startingPrice,
      address: {
        id: 'addr_' + Date.now(),
        label: 'Home',
        street,
        locality,
        city,
        pincode
      },
      date,
      timeSlot,
      specialInstructions: instructions,
      paymentMethod,
      paymentStatus: paymentMethod === 'pay_on_completion' ? 'pending' : 'paid',
      totalAmount: selectedService.startingPrice
    });

    navigateTo('booking_confirmation', { booking });
  };

  return (
    <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigateTo('service_details', { service: selectedService })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>Complete Booking</h2>
      </div>

      <div className="card" style={{ background: '#EBF8F2', borderColor: '#BBE9D2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2D8A68' }}>SERVICE PACKAGE</span>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E4E3D' }}>{selectedService.name}</h3>
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#1E4E3D' }}>₹{selectedService.startingPrice}</span>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={16} color="#2D8A68" /> Select Date & Slot
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>Appointment Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 6 }}>Time Slot</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {timeSlots.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setTimeSlot(slot)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: timeSlot === slot ? '2px solid #2D8A68' : '1px solid #E2E8F0',
                  background: timeSlot === slot ? '#EBF8F2' : '#FFFFFF',
                  color: timeSlot === slot ? '#1E4E3D' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={16} color="#2D8A68" /> Service Address
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={street}
            onChange={e => setStreet(e.target.value)}
            placeholder="Flat / Building / House No."
            required
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
          />
          <input
            type="text"
            value={locality}
            onChange={e => setLocality(e.target.value)}
            placeholder="Locality / Area"
            required
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CreditCard size={16} color="#2D8A68" /> Payment Method
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'upi', label: 'UPI / GPay / PhonePe / Paytm', desc: 'Instant & Secure' },
            { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
            { id: 'pay_on_completion', label: 'Pay on Completion', desc: 'Pay after service is finished' }
          ].map(pm => (
            <label
              key={pm.id}
              onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                border: paymentMethod === pm.id ? '2px solid #2D8A68' : '1px solid #E2E8F0',
                background: paymentMethod === pm.id ? '#EBF8F2' : '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block' }}>{pm.label}</span>
                <span style={{ fontSize: 11, color: '#64748B' }}>{pm.desc}</span>
              </div>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === pm.id}
                onChange={() => setPaymentMethod(pm.id as PaymentMethod)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>
          Special Instructions (Optional)
        </label>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="e.g. Please bring extra hard water stain cleaner, beware of pet dog."
          rows={2}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'none' }}
        />
      </div>

      <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
        Confirm & Book Appointment (₹{selectedService.startingPrice})
      </button>
    </form>
  );
};
