import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AllBookingsPage } from './pages/bookings/AllBookingsPage';
import { PendingBookingsPage } from './pages/bookings/PendingBookingsPage';
import { OngoingBookingsPage } from './pages/bookings/OngoingBookingsPage';
import { CompletedBookingsPage } from './pages/bookings/CompletedBookingsPage';
import { CancelledBookingsPage } from './pages/bookings/CancelledBookingsPage';
import { RescheduledBookingsPage } from './pages/bookings/RescheduledBookingsPage';
import { AssignMaidPage } from './pages/bookings/AssignMaidPage';
import { BookingDetailsPage } from './pages/bookings/BookingDetailsPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { MaidManagementPage } from './pages/maid-management/MaidManagementPage';
import { RevenuePage } from './pages/revenue/RevenuePage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { LiveJobsPage } from './pages/operations/LiveJobsPage';
import { DispatchPage } from './pages/operations/DispatchPage';
import { PaymentReportsPage } from './pages/operations/PaymentReportsPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ChatManagementPage } from './pages/chat/ChatManagementPage';
import { ServiceAreasPage } from './pages/operations/ServiceAreasPage';
import { CreateBookingModal } from './components/CreateBookingModal';
import { RescheduleBookingModal } from './components/RescheduleBookingModal';
import { CancelBookingModal } from './components/CancelBookingModal';
import { GCLogo } from './components/common/GCLogo';

const AdminLayout: React.FC = () => {
  const { isAdminLoggedIn, authLoading, currentTab } = useAdmin();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <GCLogo size={56} />
          <div className="w-8 h-8 border-3 border-[#123D2A] border-t-transparent rounded-full animate-spin mt-1"></div>
          <span className="text-xs font-bold text-[#171A18] tracking-wider uppercase">
            Loading Admin Portal...
          </span>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return <LoginPage />;
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'dispatch':
        return <DispatchPage />;
      case 'live-jobs':
      case 'operations':
        return <LiveJobsPage />;
      case 'all-bookings':
      case 'bookings':
        return <AllBookingsPage />;
      case 'pending-bookings':
        return <PendingBookingsPage />;
      case 'ongoing-bookings':
        return <OngoingBookingsPage />;
      case 'completed-bookings':
        return <CompletedBookingsPage />;
      case 'cancelled-bookings':
        return <CancelledBookingsPage />;
      case 'rescheduled-bookings':
        return <RescheduledBookingsPage />;
      case 'assign-maid':
        return <AssignMaidPage />;
      case 'booking-details':
        return <BookingDetailsPage />;
      case 'maids':
      case 'all-maids':
      case 'pending-approvals':
      case 'pending-maid-details':
      case 'pending-kyc':
      case 'approved-maids':
      case 'unapproved-maids':
      case 'active-maids':
      case 'inactive-maids':
      case 'documents':
      case 'performance':
        return <MaidManagementPage />;
      case 'customers':
        return <CustomersPage />;
      case 'services':
      case 'services-catalog':
      case 'categories':
      case 'service-categories':
      case 'addons':
      case 'service-addons':
        return <ServicesPage />;
      case 'service-areas':
      case 'service_areas':
        return <ServiceAreasPage />;
      case 'chat':
      case 'chat-management':
      case 'communications':
        return <ChatManagementPage />;
      case 'payments':
      case 'payment-reports':
      case 'cash-reports':
        return <PaymentReportsPage />;
      case 'partner-payouts':
      case 'payouts':
      case 'transactions':
      case 'revenue':
      case 'financials':
        return <RevenuePage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main className="no-scrollbar" style={{ flex: 1, padding: 28, overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          {renderTab()}
        </main>
      </div>
      <CreateBookingModal />
      <RescheduleBookingModal />
      <CancelBookingModal />
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

