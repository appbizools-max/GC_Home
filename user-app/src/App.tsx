import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './screens/login/LoginScreen';
import { CustomerHomeScreen } from './screens/customer-home/CustomerHomeScreen';
import { ServiceDetailsScreen } from './screens/service-details/ServiceDetailsScreen';
import { BookingScreen } from './screens/booking/BookingScreen';
import { BookingConfirmationScreen } from './screens/booking-confirmation/BookingConfirmationScreen';
import { MyJobsScreen as MyBookingsScreen } from './screens/my-jobs/MyJobsScreen';
import { BookingDetailTrackingScreen } from './screens/booking-tracking/BookingDetailTrackingScreen';
import { BecomeMaidInfoScreen } from './screens/become-maid/BecomeMaidInfoScreen';
import { MaidRegistrationFormScreen } from './screens/become-maid/MaidRegistrationFormScreen';
import { MaidHomeScreen as MaidStatusScreen } from './screens/maid-home/MaidHomeScreen';
import { MaidHomeScreen } from './screens/maid-home/MaidHomeScreen';
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
      case 'maid_status': return <BecomeMaidInfoScreen />;
      case 'maid_home': return <MaidHomeScreen />;
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header Bar */}
      {currentScreen !== 'login' && (
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.headerTitle}>GC Home Plus</Text>
            <Text style={styles.headerSubtitle}>Genuine & Care</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {isMaidUI ? 'Maid Partner' : 'Customer'}
            </Text>
          </View>
        </View>
      )}

      {/* Main Screen Content */}
      <View style={styles.appContent}>
        {renderScreen()}
      </View>

      {/* Bottom Tabs Navigation */}
      <BottomTabs />
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#1E4E3D',
    fontWeight: '600',
  },
  headerBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A7B62',
  },
  appContent: {
    flex: 1,
  },
});
