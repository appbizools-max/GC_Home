import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Calendar, Users, DollarSign, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { getDashboardMetrics, bookings, maids, setCurrentTab, setSelectedMaidForReview, autoAssignMaid } = useAdmin();
  const metrics = getDashboardMetrics();

  const pendingMaids = maids.filter(m => m.status === 'pending');
  const pendingBookings = bookings.filter(b => b.status === 'pending_assignment');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metrics Banner Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>TOTAL BOOKINGS TODAY</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 8, margin: '8px 0 0 0' }}>
            {metrics.totalBookingsToday}
          </h3>
          <span style={{ fontSize: 11, color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
            <ArrowUpRight size={12} /> +12% from yesterday
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>ACTIVE MAIDS ONLINE</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 8, margin: '8px 0 0 0' }}>
            {metrics.activeMaidsCount}
          </h3>
          <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 4 }}>Verified & Available</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>PENDING MAID APPROVALS</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#D97706', marginTop: 8, margin: '8px 0 0 0' }}>
            {metrics.pendingMaidApprovalsCount}
          </h3>
          <span style={{ fontSize: 11, color: '#D97706', fontWeight: 700, display: 'block', marginTop: 4 }}>Requires Document Verification</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>TOTAL REVENUE TODAY</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EBF8F2', color: '#2D8A68', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#1E4E3D', marginTop: 8, margin: '8px 0 0 0' }}>
            ₹{metrics.totalRevenueToday.toLocaleString()}
          </h3>
          <span style={{ fontSize: 11, color: '#166534', fontWeight: 700, display: 'block', marginTop: 4 }}>Gross Bookings</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending Maid Approvals Section */}
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Pending Maid Partner Approvals</h3>
            <button
              onClick={() => setCurrentTab('maids')}
              style={{ background: 'none', border: 'none', color: '#2D8A68', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              View All ({pendingMaids.length}) →
            </button>
          </div>

          {pendingMaids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>All maid applications have been reviewed!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingMaids.map(maid => (
                <div key={maid.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #F1F5F9', borderRadius: 12, background: '#FFFBEB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={maid.photoUrl} alt={maid.fullName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{maid.fullName}</h4>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{maid.serviceArea} • {maid.phone}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMaidForReview(maid)}
                    style={{ padding: '8px 14px', background: '#1E4E3D', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Inspect Documents
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings Requiring Maid Assignment */}
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Bookings Pending Assignment</h3>
            <button
              onClick={() => setCurrentTab('bookings')}
              style={{ background: 'none', border: 'none', color: '#2D8A68', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              View Ledger →
            </button>
          </div>

          {pendingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>All customer bookings are assigned to maids!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingBookings.map(b => (
                <div key={b.bookingId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #F1F5F9', borderRadius: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#2D8A68' }}>{b.bookingId}</span>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '2px 0 0 0' }}>{b.serviceName}</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{b.address.locality} • {b.date} ({b.timeSlot})</span>
                  </div>
                  <button
                    onClick={() => autoAssignMaid(b.bookingId)}
                    style={{ padding: '8px 14px', background: '#2D8A68', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Auto-Assign Nearest
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
