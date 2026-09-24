import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Home, Sparkles, Calendar, User, DollarSign } from 'lucide-react-native';

export const BottomTabs: React.FC = () => {
  const { user, maidProfile, currentScreen, navigateTo } = useAuth();

  // Hide bottom navigation on auth/onboarding or full-screen modal flows
  if (
    !user ||
    currentScreen === 'splash' ||
    currentScreen === 'login' ||
    currentScreen === 'otp' ||
    currentScreen === 'otp_verification' ||
    currentScreen === 'profile_setup' ||
    currentScreen === 'complete_profile' ||
    currentScreen === 'become_maid_info' ||
    currentScreen === 'become_maid' ||
    currentScreen === 'maid_registration_form' ||
    currentScreen === 'maid_status' ||
    currentScreen === 'service_details' ||
    currentScreen === 'booking_screen' ||
    currentScreen === 'booking_confirmation'
  ) {
    return null;
  }

  const isPartner = user.role === 'maid' || user.role === 'partner' || (maidProfile?.status === 'approved' && user.maidApplicationStatus === 'approved');
  const isMaidApproved = isPartner && (maidProfile?.status === 'approved' || user.maidApplicationStatus === 'approved');

  // ── Maid Partner Bottom Navigation (If Partner Account is Approved) ──
  if (isMaidApproved) {
    const maidTabs = [
      { id: 'maid_home', label: 'Home', icon: Home },
      { id: 'my_jobs', label: 'My Jobs', icon: Calendar },
      { id: 'earnings', label: 'Earnings', icon: DollarSign },
      { id: 'maid_profile', label: 'Profile', icon: User },
    ];

    return (
      <View style={styles.bottomNav}>
        {maidTabs.map(tab => {
          const isActive = currentScreen === tab.id;
          const IconComp = tab.icon;
          const activeColor = '#123D2A';
          const inactiveColor = '#526058';

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => navigateTo(tab.id as any)}
              activeOpacity={0.7}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconContainer}>
                <IconComp
                  size={20}
                  color={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.activeNavLabel,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // ── Customer Bottom Navigation (Exactly 4 Tabs: Home, Services, My Bookings, Profile) ──
  const customerTabs = [
    { id: 'customer_home', label: 'Home', icon: Home },
    { id: 'services_listing', label: 'Services', icon: Sparkles },
    { id: 'my_bookings', label: 'My Bookings', icon: Calendar },
    { id: 'user_profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.bottomNav}>
      {customerTabs.map(tab => {
        const isActive =
          tab.id === 'customer_home'
            ? currentScreen === 'customer_home' || currentScreen === 'home'
            : tab.id === 'services_listing'
            ? currentScreen === 'services_listing' || currentScreen === 'services-listing'
            : tab.id === 'my_bookings'
            ? currentScreen === 'my_bookings' || currentScreen === 'my-bookings'
            : currentScreen === 'user_profile' || currentScreen === 'profile';

        const IconComp = tab.icon;
        const activeColor = '#123D2A';
        const inactiveColor = '#526058';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => navigateTo(tab.id as any)}
            activeOpacity={0.7}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconContainer}>
              <IconComp
                size={21}
                color={isActive ? activeColor : inactiveColor}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive && (tab.id === 'customer_home' || tab.id === 'services_listing') ? '#EAF5EC' : 'none'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                isActive && styles.activeNavLabel,
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    shadowColor: '#171A18',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 24,
  },
  navLabel: {
    fontSize: 10,
    color: '#526058',
    fontWeight: '600',
    marginTop: 2,
  },
  activeNavLabel: {
    color: '#123D2A',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#123D2A',
    marginTop: 2,
  },
});