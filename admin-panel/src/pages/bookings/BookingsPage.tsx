import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { BookingStatus } from '../../types';

export const BookingsPage: React.FC = () => {
  const { bookings, maids, assignMaidToBooking, autoAssignMaid, cancelBooking } = useAdmin();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const targetBooking = bookings.find(b => b.bookingId === selectedBookingId);
  const eligibleMaids = maids.filter(m => m.status === 'approved' && m.isOnline);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending_assignment': return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Pending Assignment</span>;
      case 'maid_assigned': return <span style={{ background: '#E0F2FE', color: '#075985', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Maid Assigned</span>;
      case 'maid_accepted': return <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Maid Accepted</span>;
      case 'in_progress': return <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>In Progress</span>;
      case 'completed': return <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Completed</span>;
      case 'cancelled': return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Cancelled</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['all', 'pending_assignment', 'maid_assigned', 'in_progress', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: statusFilter === f ? '#1E4E3D' : '#F1F5F9',
                color: statusFilter === f ? '#FFFFFF' : '#475569',
                textTransform: 'capitalize'
              }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Locality</th>
              <th>Requested Slot</th>
              <th>Assigned Maid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(b => (
              <tr key={b.bookingId}>
                <td style={{ fontWeight: 800, color: '#2D8A68' }}>{b.bookingId}</td>
                <td>
                  <strong style={{ fontSize: 13, display: 'block' }}>{b.customerName}</strong>
                  <span style={{ fontSize: 11, color: '#64748B' }}>{b.customerPhone}</span>
                </td>
                <td style={{ fontWeight: 700 }}>{b.serviceName}</td>
                <td style={{ fontSize: 13 }}>{b.address.locality}</td>
                <td style={{ fontSize: 12, color: '#334155' }}>{b.date}<br />{b.timeSlot}</td>
                <td>
                  {b.assignedMaidName ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1E4E3D' }}>{b.assignedMaidName}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>Unassigned</span>
                  )}
                </td>
                <td>{getStatusBadge(b.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {b.status === 'pending_assignment' && (
                      <>
                        <button
                          onClick={() => setSelectedBookingId(b.bookingId)}
                          style={{ padding: '6px 10px', background: '#1E4E3D', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Assign Maid
                        </button>
                        <button
                          onClick={() => autoAssignMaid(b.bookingId)}
                          style={{ padding: '6px 10px', background: '#2D8A68', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Auto
                        </button>
                      </>
                    )}
                    {b.status !== 'completed' && b.status !== 'cancelled' && (
                      <button
                        onClick={() => cancelBooking(b.bookingId)}
                        style={{ padding: '6px 8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBookingId && targetBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: 540, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Assign Maid Partner</h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Booking {targetBooking.bookingId} — {targetBooking.address.locality}</span>
              </div>
              <button onClick={() => setSelectedBookingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Eligible Active Maids (Bellandur / HSR Radius)</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {eligibleMaids.map(maid => (
                <div key={maid.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #E2E8F0', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={maid.photoUrl} alt={maid.fullName} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>{maid.fullName}</strong>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{maid.serviceArea} • {maid.rating} ★ ({maid.completedJobsCount} jobs)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      assignMaidToBooking(targetBooking.bookingId, maid.uid);
                      setSelectedBookingId(null);
                    }}
                    style={{ padding: '8px 14px', background: '#1E4E3D', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
