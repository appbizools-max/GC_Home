import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, MapPin, Phone, Camera, CheckCircle2 } from 'lucide-react';

export const ActiveJobScreen: React.FC = () => {
  const { selectedBooking, updateBookingStatus, navigateTo } = useAuth();

  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  if (!selectedBooking) {
    navigateTo('maid_home');
    return null;
  }

  const handleStartJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === (selectedBooking.startOtp || '4829')) {
      setOtpVerified(true);
      updateBookingStatus(selectedBooking.bookingId, 'in_progress');
    } else {
      alert('Invalid Customer OTP! Please ask customer for the correct 4-digit code.');
    }
  };

  const handleMarkCompleted = () => {
    updateBookingStatus(selectedBooking.bookingId, 'completed', {
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    alert('Job marked as Completed! Payout added to your earnings.');
    navigateTo('maid_home');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigateTo('maid_home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </button>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{selectedBooking.serviceName}</h2>
          <span style={{ fontSize: 11, color: '#64748B' }}>Booking #{selectedBooking.bookingId}</span>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 10, color: '#64748B', display: 'block' }}>CUSTOMER</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{selectedBooking.customerName}</h3>
          </div>
          <a
            href={`tel:${selectedBooking.customerPhone}`}
            style={{
              padding: '8px 12px',
              background: '#2D8A68',
              color: 'white',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none'
            }}
          >
            <Phone size={14} /> Call Customer
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155', background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
          <MapPin size={16} color="#2D8A68" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <strong>{selectedBooking.address.locality}</strong><br />
            <span>{selectedBooking.address.street}, {selectedBooking.address.city} - {selectedBooking.address.pincode}</span>
          </div>
        </div>

        {selectedBooking.specialInstructions && (
          <div style={{ fontSize: 12, color: '#78350F', background: '#FEF3C7', padding: 8, borderRadius: 6 }}>
            <strong>Special Note:</strong> {selectedBooking.specialInstructions}
          </div>
        )}
      </div>

      {selectedBooking.status === 'maid_accepted' && !otpVerified && (
        <form onSubmit={handleStartJob} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderColor: '#2D8A68' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1E4E3D' }}>Ask Customer for 4-Digit OTP</h3>
          <p style={{ fontSize: 12, color: '#64748B' }}>
            Enter the OTP displayed on customer's phone to start the cleaning service timer.
          </p>

          <input
            type="text"
            value={otpInput}
            onChange={e => setOtpInput(e.target.value)}
            placeholder="Enter 4-digit OTP (demo: 4829)"
            maxLength={4}
            required
            style={{
              width: '100%',
              padding: '12px',
              textAlign: 'center',
              borderRadius: 10,
              border: '2px solid #2D8A68',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 6
            }}
          />

          <button type="submit" className="btn-primary">
            Verify OTP & Start Job
          </button>
        </form>
      )}

      {(selectedBooking.status === 'in_progress' || otpVerified) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ background: '#DCFCE7', borderColor: '#86EFAC' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={18} /> Service In Progress
            </h3>
            <p style={{ fontSize: 12, color: '#14532D', marginTop: 4 }}>
              Timer active. Upload before & after photos for proof of work (optional).
            </p>
          </div>

          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Job Proof Photos</h4>
            <div style={{ display: 'flex', gap: 10 }}>
              <div
                onClick={() => setBeforePhoto('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  background: beforePhoto ? '#EBF8F2' : '#F8FAFC',
                  cursor: 'pointer'
                }}
              >
                <Camera size={24} color="#2D8A68" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>
                  {beforePhoto ? '✓ Before Photo' : 'Upload Before'}
                </span>
              </div>

              <div
                onClick={() => setAfterPhoto('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400')}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  background: afterPhoto ? '#EBF8F2' : '#F8FAFC',
                  cursor: 'pointer'
                }}
              >
                <Camera size={24} color="#2D8A68" style={{ margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>
                  {afterPhoto ? '✓ After Photo' : 'Upload After'}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleMarkCompleted}
            style={{ padding: '14px', fontSize: 16 }}
          >
            <CheckCircle2 size={20} /> Mark Job Completed (Payout ₹{Math.round(selectedBooking.totalAmount * 0.8)})
          </button>
        </div>
      )}
    </div>
  );
};
