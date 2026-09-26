import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
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
import { RescheduleBookingModal } from './components/RescheduleBookingModal';
import { CancelBookingModal } from './components/CancelBookingModal';
import { GCLogo } from './components/common/GCLogo';

// Wrapper for partner details route /admin/partners/:partnerId
const PartnerDetailRoute: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  return <MaidManagementPage initialSubTab="all" selectedPartnerId={partnerId} />;
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdminLoggedIn, authLoading } = useAdmin();
  const location = useLocation();

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
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="no-scrollbar flex-1 p-3 sm:p-5 md:p-7 overflow-y-auto bg-[#f8fafc] min-w-0">
          {children}
        </main>
      </div>
      <RescheduleBookingModal />
      <CancelBookingModal />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Root redirects */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Authenticated Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminLayout><DashboardPage /></AdminLayout>} />

      {/* Bookings */}
      <Route path="/admin/bookings" element={<AdminLayout><AllBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/all" element={<AdminLayout><AllBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/pending" element={<AdminLayout><PendingBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/ongoing" element={<AdminLayout><OngoingBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/completed" element={<AdminLayout><CompletedBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/cancelled" element={<AdminLayout><CancelledBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/rescheduled" element={<AdminLayout><RescheduledBookingsPage /></AdminLayout>} />
      <Route path="/admin/bookings/assign" element={<AdminLayout><AssignMaidPage /></AdminLayout>} />
      <Route path="/admin/bookings/assign/:bookingId" element={<AdminLayout><AssignMaidPage /></AdminLayout>} />
      <Route path="/admin/bookings/:bookingId" element={<AdminLayout><BookingDetailsPage /></AdminLayout>} />

      {/* Partners / Maids */}
      <Route path="/admin/partners" element={<AdminLayout><MaidManagementPage initialSubTab="all" /></AdminLayout>} />
      <Route path="/admin/partners/all" element={<AdminLayout><MaidManagementPage initialSubTab="all" /></AdminLayout>} />
      <Route path="/admin/partners/pending" element={<AdminLayout><MaidManagementPage initialSubTab="pending-approval" /></AdminLayout>} />
      <Route path="/admin/partners/pending-approval" element={<AdminLayout><MaidManagementPage initialSubTab="pending-approval" /></AdminLayout>} />
      <Route path="/admin/partners/pending-kyc" element={<AdminLayout><MaidManagementPage initialSubTab="pending-kyc" /></AdminLayout>} />
      <Route path="/admin/partners/kyc" element={<AdminLayout><MaidManagementPage initialSubTab="pending-kyc" /></AdminLayout>} />
      <Route path="/admin/partners/approved" element={<AdminLayout><MaidManagementPage initialSubTab="active" /></AdminLayout>} />
      <Route path="/admin/partners/active" element={<AdminLayout><MaidManagementPage initialSubTab="active" /></AdminLayout>} />
      <Route path="/admin/partners/inactive" element={<AdminLayout><MaidManagementPage initialSubTab="inactive" /></AdminLayout>} />
      <Route path="/admin/partners/:partnerId" element={<AdminLayout><PartnerDetailRoute /></AdminLayout>} />

      {/* Backward-compatible /admin/maids/* routes */}
      <Route path="/admin/maids" element={<Navigate to="/admin/partners" replace />} />
      <Route path="/admin/maids/pending" element={<Navigate to="/admin/partners/pending" replace />} />
      <Route path="/admin/maids/kyc" element={<Navigate to="/admin/partners/pending-kyc" replace />} />
      <Route path="/admin/maids/approved" element={<Navigate to="/admin/partners/approved" replace />} />
      <Route path="/admin/maids/active" element={<Navigate to="/admin/partners/approved" replace />} />
      <Route path="/admin/maids/inactive" element={<Navigate to="/admin/partners/inactive" replace />} />
      <Route path="/admin/maids/:partnerId" element={<AdminLayout><PartnerDetailRoute /></AdminLayout>} />

      {/* Catalog & Services */}
      <Route path="/admin/services" element={<AdminLayout><ServicesPage initialTab="services" /></AdminLayout>} />
      <Route path="/admin/categories" element={<AdminLayout><ServicesPage initialTab="categories" /></AdminLayout>} />
      <Route path="/admin/addons" element={<AdminLayout><ServicesPage initialTab="addons" /></AdminLayout>} />
      <Route path="/admin/offers" element={<AdminLayout><ServicesPage initialTab="banners" initialBannerSubTab="offers" /></AdminLayout>} />
      <Route path="/admin/banners" element={<AdminLayout><ServicesPage initialTab="banners" initialBannerSubTab="banners" /></AdminLayout>} />

      {/* Operations & Dispatch */}
      <Route path="/admin/dispatch" element={<AdminLayout><DispatchPage /></AdminLayout>} />
      <Route path="/admin/live-jobs" element={<AdminLayout><LiveJobsPage /></AdminLayout>} />
      <Route path="/admin/operations" element={<AdminLayout><LiveJobsPage /></AdminLayout>} />
      <Route path="/admin/service-areas" element={<AdminLayout><ServiceAreasPage /></AdminLayout>} />

      {/* Customers */}
      <Route path="/admin/customers" element={<AdminLayout><CustomersPage /></AdminLayout>} />

      {/* Communications & Chat */}
      <Route path="/admin/chat" element={<AdminLayout><ChatManagementPage /></AdminLayout>} />

      {/* Financials & Payments */}
      <Route path="/admin/payments" element={<AdminLayout><PaymentReportsPage /></AdminLayout>} />
      <Route path="/admin/payouts" element={<AdminLayout><RevenuePage initialTab="payouts" /></AdminLayout>} />
      <Route path="/admin/financials" element={<AdminLayout><RevenuePage initialTab="overview" /></AdminLayout>} />
      <Route path="/admin/revenue" element={<AdminLayout><RevenuePage initialTab="overview" /></AdminLayout>} />

      {/* System & Analytics */}
      <Route path="/admin/notifications" element={<AdminLayout><NotificationsPage /></AdminLayout>} />
      <Route path="/admin/reports" element={<AdminLayout><ReportsPage /></AdminLayout>} />
      <Route path="/admin/settings" element={<AdminLayout><SettingsPage /></AdminLayout>} />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <AppRoutes />
      </AdminProvider>
    </BrowserRouter>
  );
}

export default App;
