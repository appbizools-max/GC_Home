import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { applyGlobalTypography } from './theme/typography';
import { useAppFonts } from './theme/useAppFonts';
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
import { RelatedAddOnsScreen } from './screens/booking/RelatedAddOnsScreen';
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
  const { currentScreen, user, maidProfile } = useAuth();

  const isPartnerUser = user?.role === 'maid' || user?.role === 'partner' || (maidProfile?.status === 'approved' && user?.maidApplicationStatus === 'approved');
  const isPartnerApproved = isPartnerUser && (maidProfile?.status === 'approved' || user?.maidApplicationStatus === 'approved');

  const renderScreen = () => {
    // ── 1. Unauthenticated Visitor Routing ──
    if (!user) {
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
        case 'complete_profile':
        case 'complete-profile':
        case 'register':
        case 'registration':
        case 'customer_registration':
          return <ProfileSetupScreen />;
        case 'become_maid_info':
        case 'become_maid':
        case 'become-maid':
          return <BecomeMaidInfoScreen />;
        case 'maid_registration_form':
        case 'become_maid_form':
          return <MaidRegistrationFormScreen />;
        case 'help':
          return <HelpSupportScreen />;
        default:
          return <LoginScreen />;
      }
    }

    // ── 2. Partner / Maid Dedicated Routing (Zero Customer Page Leakage) ──
    if (isPartnerUser) {
      if (isPartnerApproved) {
        switch (currentScreen) {
          case 'splash':
            return <SplashScreen />;
          case 'login':
            return <LoginScreen />;
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
          case 'help':
            return <HelpSupportScreen />;
          case 'notifications':
            return <NotificationsScreen />;
          default:
            // Guard: All other routes default strictly to Partner Home
            return <MaidHomeScreen />;
        }
      } else {
        // Pending or Review Partner: show only partner status screen
        switch (currentScreen) {
          case 'splash':
            return <SplashScreen />;
          case 'login':
            return <LoginScreen />;
          case 'maid_status':
          case 'become_maid_info':
          case 'become_maid':
          case 'become-maid':
            return <BecomeMaidInfoScreen />;
          case 'maid_registration_form':
          case 'become_maid_form':
            return <MaidRegistrationFormScreen />;
          case 'help':
            return <HelpSupportScreen />;
          default:
            return <BecomeMaidInfoScreen />;
        }
      }
    }

    // ── 3. Customer Dedicated Routing (No Partner Operational Pages) ──
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
      case 'complete_profile':
      case 'complete-profile':
      case 'register':
      case 'registration':
      case 'customer_registration':
        return <ProfileSetupScreen />;
      case 'home':
      case 'customer_home':
        return <CustomerHomeScreen />;
      case 'services_listing':
      case 'services-listing':
        return <CleaningServicesScreen />;
      case 'service_details':
      case 'service-details':
      case 'cart_summary':
      case 'cart-summary':
        return <ServiceDetailsScreen />;
      case 'related_addons':
      case 'related-addons':
        return <RelatedAddOnsScreen />;
      case 'checkout_schedule':
      case 'checkout-schedule':
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
      default:
        return <CustomerHomeScreen />;
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

// Apply global typography patch once on startup
applyGlobalTypography();

export function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return null;
  }

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
