import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { BookingProvider } from './context/BookingContext';
import { SplashScreen } from './screens/splash/SplashScreen';
import { LoginScreen } from './screens/login/LoginScreen';
import { OtpVerificationScreen } from './screens/otp/OtpVerificationScreen';
import { ProfileSetupScreen } from './screens/profile-setup/ProfileSetupScreen';
import { CustomerHomeScreen } from './screens/customer-home/CustomerHomeScreen';
import { CleaningServicesScreen } from './screens/services-listing/CleaningServicesScreen';
import { ServiceDetailsScreen } from './screens/service-details/ServiceDetailsScreen';
import { AddressConfirmationScreen } from './screens/booking/AddressConfirmationScreen';
import { BookingSummaryScreen } from './screens/booking/BookingSummaryScreen';
import { PaymentScreen } from './screens/booking/PaymentScreen';
import { BookingConfirmationScreen } from './screens/booking-confirmation/BookingConfirmationScreen';
import { BookingTrackingScreen } from './screens/booking-tracking/BookingTrackingScreen';
import { ServiceCompletedScreen } from './screens/booking-tracking/ServiceCompletedScreen';
import { RatingReviewScreen } from './screens/booking-tracking/RatingReviewScreen';
import { MyBookingsScreen } from './screens/my-bookings/MyBookingsScreen';
import { OffersScreen } from './screens/offers/OffersScreen';
import { NotificationsScreen } from './screens/notifications/NotificationsScreen';
import { HelpSupportScreen } from './screens/help/HelpSupportScreen';
import { UserProfileScreen } from './screens/user-profile/UserProfileScreen';
import { BecomeMaidInfoScreen } from './screens/become-maid/BecomeMaidInfoScreen';
import { MaidRegistrationFormScreen } from './screens/become-maid/MaidRegistrationFormScreen';
import { MaidHomeScreen } from './screens/maid-home/MaidHomeScreen';
import { ActiveJobScreen } from './screens/active-job/ActiveJobScreen';
import { MyJobsScreen } from './screens/my-jobs/MyJobsScreen';
import { EarningsScreen } from './screens/earnings/EarningsScreen';
import { MaidProfileScreen } from './screens/maid-profile/MaidProfileScreen';
import { BottomTabs } from './components/BottomTabs';

const RouterView: React.FC = () => {
  const { currentScreen } = useAuth();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'login':
        return <LoginScreen />;
      case 'otp':
      case 'otp_verification':
        return <OtpVerificationScreen />;
      case 'profile_setup':
      case 'profile-setup':
        return <ProfileSetupScreen />;
      case 'home':
      case 'customer_home':
        return <CustomerHomeScreen />;
      case 'services_listing':
      case 'services-listing':
        return <CleaningServicesScreen />;
      case 'service_details':
      case 'service-details':
        return <ServiceDetailsScreen />;
      case 'address_confirmation':
      case 'address-confirmation':
        return <AddressConfirmationScreen />;
      case 'booking_summary':
      case 'booking-summary':
        return <BookingSummaryScreen />;
      case 'payment':
        return <PaymentScreen />;
      case 'booking_confirmation':
      case 'booking-confirmation':
        return <BookingConfirmationScreen />;
      case 'booking_tracking':
      case 'booking-tracking':
        return <BookingTrackingScreen />;
      case 'service_completed':
      case 'service-completed':
        return <ServiceCompletedScreen />;
      case 'rating_review':
      case 'rating-review':
        return <RatingReviewScreen />;
      case 'my_bookings':
      case 'my-bookings':
        return <MyBookingsScreen />;
      case 'offers':
        return <OffersScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'help':
        return <HelpSupportScreen />;
      case 'user_profile':
      case 'profile':
        return <UserProfileScreen />;
      case 'become_maid_info':
      case 'become_maid':
      case 'become-maid':
        return <BecomeMaidInfoScreen />;
      case 'maid_registration_form':
      case 'become_maid_form':
        return <MaidRegistrationFormScreen />;
      case 'maid_status':
        return <BecomeMaidInfoScreen />;
      case 'maid_home':
        return <MaidHomeScreen />;
      case 'active_job':
        return <ActiveJobScreen />;
      case 'my_jobs':
        return <MyJobsScreen />;
      case 'earnings':
        return <EarningsScreen />;
      case 'maid_profile':
        return <MaidProfileScreen />;
      default:
        return <SplashScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Screen Content */}
      <View style={styles.appContent}>
        {renderScreen()}
      </View>

      {/* Fixed Bottom Tabs Navigation */}
      <BottomTabs />
    </View>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BookingProvider>
          <RouterView />
        </BookingProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appContent: {
    flex: 1,
  },
});
