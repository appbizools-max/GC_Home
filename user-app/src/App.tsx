import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './screens/login/LoginScreen';
import { CustomerHomeScreen } from './screens/customer-home/CustomerHomeScreen';
import { ServiceDetailsScreen } from './screens/service-details/ServiceDetailsScreen';
import { BookingScreen } from './screens/booking/BookingScreen';
import { BookingConfirmationScreen } from './screens/booking-confirmation/BookingConfirmationScreen';
import { MyJobsScreen as MyBookingsScreen } from './screens/my-jobs/MyJobsScreen';
import { BookingDetailTrackingScreen } from './screens/booking-tracking/BookingDetailTrackingScreen';
import { BecomeMaidInfoScreen } from './screens/become-maid/BecomeMaidInfoScreen';
import { BecomeMaidInfoScreen as MaidRegistrationFormScreen } from './screens/become-maid/BecomeMaidInfoScreen';
import { MaidHomeScreen as MaidStatusScreen } from './screens/maid-home/MaidHomeScreen';
import { MaidHomeScreen } from './screens/maid-home/MaidHomeScreen';
import { MyJobsScreen as JobRequestsScreen } from './screens/my-jobs/MyJobsScreen';
import { ActiveJobScreen } from './screens/active-job/ActiveJobScreen';
import { MyJobsScreen } from './screens/my-jobs/MyJobsScreen';
import { EarningsScreen } from './screens/earnings/EarningsScreen';
import { UserProfileScreen } from './screens/user-profile/UserProfileScreen';
import { MaidProfileScreen } from './screens/maid-profile/MaidProfileScreen';
import { BottomTabs } from './components/BottomTabs';

const RouterView: React.FC = () => {
  const { currentScreen, user, maidProfile } = useAuth();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login': return <LoginScreen />;
      case 'customer_home': return <CustomerHomeScreen />;
      case 'service_details': return <ServiceDetailsScreen />;
      case 'booking_screen': return <BookingScreen />;
      case 'booking_confirmation': return <BookingConfirmationScreen />;
      case 'my_bookings': return <MyBookingsScreen />;
      case 'booking_tracking': return <BookingDetailTrackingScreen />;
      case 'become_maid_info': return <BecomeMaidInfoScreen />;
      case 'maid_registration_form': return <MaidRegistrationFormScreen />;
      case 'maid_status': return <MaidStatusScreen />;
      case 'maid_home': return <MaidHomeScreen />;
      case 'job_requests': return <JobRequestsScreen />;
      case 'active_job': return <ActiveJobScreen />;
      case 'my_jobs': return <MyJobsScreen />;
      case 'earnings': return <EarningsScreen />;
      case 'user_profile': return <UserProfileScreen />;
      case 'maid_profile': return <MaidProfileScreen />;
      default: return <CustomerHomeScreen />;
    }
  };

  const isMaidUI = user?.role === 'maid' && maidProfile?.status === 'approved';

  return (
    <div className="mobile-wrapper">
      {/* Header Bar */}
      {currentScreen !== 'login' && (
        <header className="app-header">
          <div>
            <h1>GC Home Plus</h1>
            <span style={{ fontSize: 10, color: '#1E4E3D', fontWeight: 600 }}>Genuine & Care</span>
          </div>
          <span className="header-badge">
            {isMaidUI ? 'Maid Partner' : 'Customer'}
          </span>
        </header>
      )}

      {/* Main Screen Content */}
      <main className="app-content">
        {renderScreen()}
      </main>

      {/* Bottom Tabs Navigation */}
      <BottomTabs />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <RouterView />
    </AuthProvider>
  );
}

export default App;
