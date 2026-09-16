import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { LayoutDashboard, Sparkles, Calendar, Users, DollarSign, Settings, LogOut } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, logoutAdmin, getDashboardMetrics } = useAdmin();
  const metrics = getDashboardMetrics();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'services', label: 'Service Management', icon: Sparkles, badge: null },
    { id: 'bookings', label: 'Bookings & Assignment', icon: Calendar, badge: metrics.pendingAssignmentsCount > 0 ? metrics.pendingAssignmentsCount : null },
    { id: 'maids', label: 'Maid Management', icon: Users, badge: metrics.pendingMaidApprovalsCount > 0 ? metrics.pendingMaidApprovalsCount : null },
    { id: 'revenue', label: 'Revenue & Payouts', icon: DollarSign, badge: null },
    { id: 'settings', label: 'Platform Settings', icon: Settings, badge: null }
  ];

  return (
    <aside style={{ width: 260, background: '#1E4E3D', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#BBE9D2', color: '#1E4E3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
          GC
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>GC Home Plus</h1>
          <span style={{ fontSize: 11, color: '#BBE9D2', fontWeight: 600 }}>Admin Console</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? '#2D8A68' : 'transparent',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={18} color={isActive ? '#FFFFFF' : '#BBE9D2'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span style={{ background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={logoutAdmin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#FCA5A5',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <LogOut size={18} /> Logout Admin
        </button>
      </div>
    </aside>
  );
};
