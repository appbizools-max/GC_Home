import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, MapPin, ChevronRight } from 'lucide-react';

export const UserProfileScreen: React.FC = () => {
  const { user, logout, navigateTo } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* User Card */}
      <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#EBF8F2', borderColor: '#BBE9D2' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#2D8A68',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800
        }}>
          {user?.name?.charAt(0) || 'U'}
        </div>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E4E3D' }}>{user?.name || 'Rahul Verma'}</h3>
          <span style={{ fontSize: 13, color: '#64748B' }}>{user?.phone || '+91 98111 22233'}</span>
        </div>
      </div>

      {/* Become a Maid Shortcut */}
      {user?.role === 'customer' && user?.maidApplicationStatus === 'none' && (
        <div
          className="card"
          onClick={() => navigateTo('become_maid_info')}
          style={{
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #1E4E3D 0%, #2D8A68 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, background: '#BBE9D2', color: '#1E4E3D', padding: '2px 6px', borderRadius: 6 }}>
              PARTNER PROGRAM
            </span>
            <h4 style={{ fontSize: 15, fontWeight: 800, marginTop: 4, color: '#FFFFFF' }}>Register as a Maid Partner</h4>
            <p style={{ fontSize: 12, opacity: 0.9 }}>Earn up to ₹30,000/mo flexible hours</p>
          </div>
          <ChevronRight size={20} color="white" />
        </div>
      )}

      {/* Account Menu */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Saved Addresses</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569', background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
          <MapPin size={16} color="#2D8A68" />
          <span>Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103</span>
        </div>
      </div>

      <button className="btn-secondary" onClick={logout} style={{ color: '#991B1B', borderColor: '#FCA5A5', marginTop: 12 }}>
        <LogOut size={16} /> Logout Account
      </button>
    </div>
  );
};
