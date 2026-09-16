import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { BookingsPage } from './pages/bookings/BookingsPage';
import { MaidManagementPage } from './pages/maid-management/MaidManagementPage';
import { RevenuePage } from './pages/revenue/RevenuePage';
import { SettingsPage } from './pages/settings/SettingsPage';

const AdminLayout: React.FC = () => {
  const { isAdminLoggedIn, currentTab } = useAdmin();

  if (!isAdminLoggedIn) {
    return <LoginPage />;
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'dashboard': return <DashboardPage />;
      case 'services': return <ServicesPage />;
      case 'bookings': return <BookingsPage />;
      case 'maids': return <MaidManagementPage />;
      case 'revenue': return <RevenuePage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {renderTab()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AdminProvider>
      <AdminLayout />
    </AdminProvider>
  );
}

export default App;
