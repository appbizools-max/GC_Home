import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ToggleLeft, ToggleRight, DollarSign, Briefcase, Star, Clock, ChevronRight, MapPin } from 'lucide-react';

export const MaidHomeScreen: React.FC = () => {
  const { maidProfile, toggleMaidOnline, bookings, navigateTo } = useAuth();

  const isOnline = maidProfile?.isOnline ?? true;

  const assignedJobs = bookings.filter(b => b.assignedMaidId === maidProfile?.uid && ['maid_assigned', 'maid_accepted', 'in_progress'].includes(b.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #1E4E3D 0%, #2D8A68 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img
              src={maidProfile?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'}
              alt={maidProfile?.fullName}
              style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }}
            />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{maidProfile?.fullName || 'Sunita Sharma'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>4.8 ★ (56 Jobs)</span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleMaidOnline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: isOnline ? '#DCFCE7' : '#FEE2E2',
              color: isOnline ? '#15803D' : '#991B1B',
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isOnline ? <ToggleRight size={20} color="#15803D" /> : <ToggleLeft size={20} color="#991B1B" />}
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ background: '#EBF8F2', borderColor: '#BBE9D2', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2D8A68', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2D8A68', display: 'block' }}>THIS WEEK</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1E4E3D' }}>₹4,250</span>
          </div>
        </div>

        <div className="card" style={{ background: '#F0F9FF', borderColor: '#BAE6FD', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0284C7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', display: 'block' }}>ACTIVE JOBS</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#075985' }}>{assignedJobs.length}</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>Assigned Jobs Today</h3>
          <span style={{ fontSize: 12, color: '#2D8A68', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigateTo('job_requests')}>
            View Incoming Requests →
          </span>
        </div>

        {assignedJobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: '#94A3B8' }}>
            <Clock size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>No active jobs assigned right now.</p>
            <span style={{ fontSize: 11, color: '#64748B', marginTop: 2, display: 'block' }}>
              Ensure your Online toggle is active to receive job assignments.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assignedJobs.map(job => (
              <div key={job.bookingId} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 8 }}>
                    {job.serviceName}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#1E4E3D' }}>Payout: ₹{Math.round(job.totalAmount * 0.8)}</span>
                </div>

                <div style={{ fontSize: 13, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#2D8A68" />
                    <strong>{job.address.locality}</strong> ({job.address.street})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
                    <Clock size={14} color="#64748B" /> {job.date} | {job.timeSlot}
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => navigateTo('active_job', { booking: job })}
                  style={{ padding: '10px' }}
                >
                  Open Job Console <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
