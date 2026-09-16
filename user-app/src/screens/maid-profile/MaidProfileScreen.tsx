import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Star, Landmark, LogOut } from 'lucide-react';

export const MaidProfileScreen: React.FC = () => {
  const { maidProfile, logout } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ textAlign: 'center', padding: 20 }}>
        <img
          src={maidProfile?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'}
          alt={maidProfile?.fullName}
          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', border: '3px solid #2D8A68' }}
        />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>{maidProfile?.fullName || 'Sunita Sharma'}</h3>
        <span style={{ fontSize: 13, color: '#64748B' }}>{maidProfile?.phone || '+91 98765 43210'}</span>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Star size={18} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>4.8 Partner Rating</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>(56 Jobs)</span>
        </div>
      </div>

      <div className="card">
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Verification Status</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#475569' }}>Government ID (Aadhaar)</span>
            <span style={{ color: '#166534', fontWeight: 700 }}>✓ Verified by Admin</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#475569' }}>Health & Chemical Safety</span>
            <span style={{ color: '#166534', fontWeight: 700 }}>✓ Signed Declaration</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#475569' }}>Primary Locality Radius</span>
            <span style={{ fontWeight: 700, color: '#1E4E3D' }}>{maidProfile?.serviceArea || 'Bellandur'} ({maidProfile?.serviceRadiusKm || 5} km)</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Landmark size={16} color="#2D8A68" /> Payout Bank Details
        </h4>
        <div style={{ fontSize: 13, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><strong>Bank:</strong> {maidProfile?.bankDetails?.bankName || 'State Bank of India'}</div>
          <div><strong>A/C Holder:</strong> {maidProfile?.bankDetails?.accountName || 'Sunita Sharma'}</div>
          <div><strong>A/C No:</strong> {maidProfile?.bankDetails?.accountNumber || 'XXXX-XXXX-4829'}</div>
          <div><strong>IFSC:</strong> {maidProfile?.bankDetails?.ifscCode || 'SBIN0004821'}</div>
        </div>
      </div>

      <button className="btn-secondary" onClick={logout} style={{ color: '#991B1B', borderColor: '#FCA5A5', marginTop: 8 }}>
        <LogOut size={16} /> Logout Partner Account
      </button>
    </div>
  );
};
