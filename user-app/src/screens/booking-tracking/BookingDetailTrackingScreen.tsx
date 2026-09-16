import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Clock, Phone, Star } from 'lucide-react';
import { BookingStatus } from '../../types';

export const BookingDetailTrackingScreen: React.FC = () => {
  const { selectedBooking, navigateTo, updateBookingStatus } = useAuth();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittedRating, setSubmittedRating] = useState(false);

  if (!selectedBooking) {
    navigateTo('my_bookings');
    return null;
  }

  const steps: { status: BookingStatus; label: string }[] = [
    { status: 'pending_assignment', label: 'Booking Received' },
    { status: 'maid_assigned', label: 'Maid Assigned' },
    { status: 'maid_accepted', label: 'Maid Accepted' },
    { status: 'in_progress', label: 'Cleaning In Progress' },
    { status: 'completed', label: 'Job Completed' }
  ];

  const getStepIndex = (s: BookingStatus) => {
    switch (s) {
      case 'pending_assignment': return 0;
      case 'maid_assigned': return 1;
      case 'maid_accepted': return 2;
      case 'in_progress': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(selectedBooking.status);

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingStatus(selectedBooking.bookingId, 'completed', { rating, review });
    setSubmittedRating(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigateTo('my_bookings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </button>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{selectedBooking.serviceName}</h2>
          <span style={{ fontSize: 11, color: '#64748B' }}>Booking #{selectedBooking.bookingId}</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Live Status Progression</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 8 }}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isDone ? '#2D8A68' : '#E2E8F0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: isCurrent ? '0 0 0 4px #EBF8F2' : 'none'
                }}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 800 : (isDone ? 600 : 400),
                  color: isCurrent ? '#1E4E3D' : (isDone ? '#1E293B' : '#94A3B8')
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBooking.assignedMaidName ? (
        <div className="card" style={{ background: '#EBF8F2', borderColor: '#BBE9D2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#1E4E3D', textTransform: 'uppercase' }}>Assigned Maid</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 10 }}>
              Verified Partner
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img
              src={selectedBooking.assignedMaidPhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'}
              alt={selectedBooking.assignedMaidName}
              style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{selectedBooking.assignedMaidName}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>4.8 (42 jobs)</span>
              </div>
            </div>
            <a
              href={`tel:${selectedBooking.assignedMaidPhone}`}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#2D8A68',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              <Phone size={18} />
            </a>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px', background: '#FEF3C7', borderColor: '#FDE68A' }}>
          <Clock size={28} color="#92400E" style={{ margin: '0 auto 8px auto' }} />
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>Finding the Nearest Verified Maid</h4>
          <p style={{ fontSize: 12, color: '#78350F', marginTop: 4 }}>
            Admin is matching your job location with available maids in Bellandur.
          </p>
        </div>
      )}

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>SERVICE START OTP</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1E4E3D', letterSpacing: 4 }}>{selectedBooking.startOtp || '4829'}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>AMOUNT DUE</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>₹{selectedBooking.totalAmount}</span>
        </div>
      </div>

      {selectedBooking.status === 'completed' && (
        <div className="card" style={{ background: '#F8FAFC' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>Rate Your Service</h3>
          {submittedRating || selectedBooking.rating ? (
            <div style={{ background: '#DCFCE7', color: '#166534', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              Thank you for rating! You rated {selectedBooking.rating || rating} Stars.
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={28}
                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                    fill={star <= rating ? '#F59E0B' : 'transparent'}
                    onClick={() => setRating(star)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Share your experience with the maid..."
                rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px' }}>
                Submit Rating & Review
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
