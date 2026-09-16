import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, MapPin } from 'lucide-react';

export const MyJobsScreen: React.FC = () => {
  const { bookings, maidProfile, navigateTo } = useAuth();
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');

  const maidJobs = bookings.filter(b => b.assignedMaidId === maidProfile?.uid || b.status === 'pending_assignment');

  const filtered = maidJobs.filter(j => {
    if (activeTab === 'assigned') return ['pending_assignment', 'maid_assigned', 'maid_accepted', 'in_progress'].includes(j.status);
    return j.status === 'completed';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>My Maid Job Ledger</h2>

      <div style={{ display: 'flex', background: '#E2E8F0', padding: 4, borderRadius: 12 }}>
        {[
          { id: 'assigned', label: 'Active Jobs' },
          { id: 'completed', label: 'Completed Jobs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.id ? '#1E4E3D' : '#64748B',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
          <Briefcase size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
          <p style={{ fontSize: 13, fontWeight: 600 }}>No {activeTab} jobs found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(job => (
            <div
              key={job.bookingId}
              className="card"
              onClick={() => navigateTo('active_job', { booking: job })}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#2D8A68' }}>{job.bookingId}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1E4E3D' }}>Payout: ₹{Math.round(job.totalAmount * 0.8)}</span>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{job.serviceName}</h4>
              <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="#2D8A68" /> {job.address.locality}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
