import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export const EarningsScreen: React.FC = () => {
  const { bookings, maidProfile, navigateTo } = useAuth();

  const completedJobs = bookings.filter(b => b.assignedMaidId === maidProfile?.uid && b.status === 'completed');
  const totalEarnings = completedJobs.reduce((acc, curr) => acc + Math.round(curr.totalAmount * 0.8), 0) + 4250;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigateTo('maid_home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>My Earnings & Payouts</h2>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, #1E4E3D 0%, #2D8A68 100%)', color: 'white' }}>
        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, textTransform: 'uppercase' }}>TOTAL EARNINGS (THIS MONTH)</span>
        <h3 style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: '#FFFFFF' }}>₹{totalEarnings.toLocaleString()}</h3>

        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>
          <div>
            <span style={{ opacity: 0.8, display: 'block' }}>Jobs Completed</span>
            <strong style={{ fontSize: 15 }}>{completedJobs.length + 18} Jobs</strong>
          </div>
          <div>
            <span style={{ opacity: 0.8, display: 'block' }}>Next Payout Date</span>
            <strong style={{ fontSize: 15 }}>Monday, 15 Sep</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>PAYOUT BANK ACCOUNT</span>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>State Bank of India</h4>
          <span style={{ fontSize: 12, color: '#2D8A68', fontWeight: 600 }}>A/C: XXXX-XXXX-4829</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#166534', padding: '4px 8px', borderRadius: 8 }}>
          Verified
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 10 }}>Per-Job Payout History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'BK-9038', service: 'Basic Clean', date: '2026-09-07', payout: 399, status: 'paid' },
            { id: 'BK-9022', service: 'Deep Clean', date: '2026-09-05', payout: 1199, status: 'paid' },
            { id: 'BK-9011', service: 'Medium Clean', date: '2026-09-03', payout: 719, status: 'paid' },
            ...completedJobs.map(j => ({
              id: j.bookingId,
              service: j.serviceName,
              date: j.date,
              payout: Math.round(j.totalAmount * 0.8),
              status: 'processing'
            }))
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
              <div>
                <h5 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{item.service}</h5>
                <span style={{ fontSize: 11, color: '#64748B' }}>{item.id} • {item.date}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1E4E3D', display: 'block' }}>+₹{item.payout}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: item.status === 'paid' ? '#166534' : '#D97706', textTransform: 'capitalize' }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
