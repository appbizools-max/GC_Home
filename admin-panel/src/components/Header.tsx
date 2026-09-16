import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { Bell, ShieldCheck, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentTab, getDashboardMetrics } = useAdmin();
  const metrics = getDashboardMetrics();

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    services: 'Cleaning Service Catalog Management',
    bookings: 'Bookings & Maid Assignment Engine',
    maids: 'Maid Verification & Roster Management',
    revenue: 'Platform Revenue & Maid Payouts',
    settings: 'Platform Settings & Broadcaster'
  };

  return (
    <header style={{ background: '#FFFFFF', padding: '16px 28px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
          {titleMap[currentTab] || 'Admin Console'}
        </h2>
        <span style={{ fontSize: 12, color: '#64748B' }}>GC Home Plus Operating System</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="#64748B" />
          {metrics.pendingMaidApprovalsCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16, borderLeft: '1px solid #E2E8F0' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1E4E3D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            A
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'block' }}>Platform Admin</span>
            <span style={{ fontSize: 11, color: '#2D8A68', fontWeight: 600 }}>Superuser</span>
          </div>
        </div>
      </div>
    </header>
  );
};
