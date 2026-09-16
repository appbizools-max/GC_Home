import React, { useState } from 'react';
import { Send, Bell, Sliders, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [notifTitle, setNotifTitle] = useState('New Cleaning Special Offer!');
  const [notifBody, setNotifBody] = useState('Book Deep Clean today and get 15% instant cashback in Bellandur & HSR Layout.');
  const [targetGroup, setTargetGroup] = useState('all');
  const [sentSuccess, setSentSuccess] = useState(false);

  const [defaultRadius, setDefaultRadius] = useState(7);
  const [commissionRate, setCommissionRate] = useState(20);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="#2D8A68" /> Firebase Cloud Messaging (FCM) Push Broadcaster
        </h3>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Send manual push notification alerts directly to Customer App or Maid App devices.
        </p>

        {sentSuccess && (
          <div style={{ background: '#DCFCE7', color: '#166534', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={18} /> Push Notification broadcast sent successfully to FCM topic!
          </div>
        )}

        <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Target Audience Topic</label>
            <select
              value={targetGroup}
              onChange={e => setTargetGroup(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            >
              <option value="all">All Users (Customers + Maids)</option>
              <option value="customers">Customers Only</option>
              <option value="maids">Active Verified Maids Only</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Notification Title</label>
            <input
              type="text"
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Notification Message Body</label>
            <textarea
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              required
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 20px',
              background: '#1E4E3D',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              alignSelf: 'flex-start'
            }}
          >
            <Send size={16} /> Broadcast Push Alert via FCM
          </button>
        </form>
      </div>

      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={18} color="#2D8A68" /> Platform Operating Rules
        </h3>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          Configure matching radius, commission cuts, and payment gateway options.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Default Auto-Assignment Search Radius (km): {defaultRadius} km
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={defaultRadius}
              onChange={e => setDefaultRadius(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1E4E3D' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
              Platform Commission Rate (%): {commissionRate}%
            </label>
            <input
              type="range"
              min={5}
              max={35}
              value={commissionRate}
              onChange={e => setCommissionRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#1E4E3D' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
