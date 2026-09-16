import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, MapPin, Calendar, ArrowRight } from 'lucide-react';

export const BookingConfirmationScreen: React.FC = () => {
  const { selectedBooking, navigateTo } = useAuth();

  if (!selectedBooking) {
    navigateTo('my_bookings');
    return null;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, padding: '16px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#DCFCE7',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <CheckCircle2 size={44} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E4E3D', marginBottom: 4 }}>Booking Confirmed!</h2>
        <span style={{ fontSize: 13, color: '#64748B' }}>Booking ID: <strong>{selectedBooking.bookingId}</strong></span>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
          <div>
            <span style={{ fontSize: 11, color: '#94A3B8', display: 'block' }}>SERVICE</span>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{selectedBooking.serviceName}</h4>
          </div>
          <span className="status-badge status-pending">
            <Clock size={12} /> Pending Maid Assignment
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#2D8A68" />
            <span>{selectedBooking.date} ({selectedBooking.timeSlot})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={16} color="#2D8A68" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{selectedBooking.address.street}, {selectedBooking.address.locality}</span>
          </div>
        </div>

        <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>START OTP (Give to Maid)</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1E4E3D', letterSpacing: 4 }}>{selectedBooking.startOtp}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>AMOUNT</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>₹{selectedBooking.totalAmount}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="btn-primary"
          onClick={() => navigateTo('booking_tracking', { booking: selectedBooking })}
        >
          Track Maid Assignment <ArrowRight size={18} />
        </button>

        <button
          className="btn-secondary"
          onClick={() => navigateTo('customer_home')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
