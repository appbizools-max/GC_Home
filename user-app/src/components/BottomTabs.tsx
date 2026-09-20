import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Tag, Headphones, User, DollarSign } from 'lucide-react-native';

export const BottomTabs: React.FC = () => {
  const { user, maidProfile, currentScreen, navigateTo } = useAuth();

  // Hide bottom navigation on auth/onboarding or full-screen modal flows
  if (
    !user ||
    currentScreen === 'splash' ||
    currentScreen === 'login' ||
    currentScreen === 'otp_verification' ||
    currentScreen === 'profile_setup' ||
    currentScreen === 'service_details' ||
    currentScreen === 'booking_screen' ||
    currentScreen === 'booking_confirmation'
  ) {
    return null;
  }

  const isMaidApproved = (user.role === 'maid' || user.maidApplicationStatus === 'approved' || maidProfile?.status === 'approved') && maidProfile?.isOnline === true;

  // ── Maid Partner Bottom Navigation (If in Maid Mode) ──
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
          const activeColor = '#168A68';
          const inactiveColor = '#68788C';

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

  // ── Customer Bottom Navigation (Exactly 5 Tabs: Home, My Bookings, Offers, Help, Profile) ──
  const customerTabs = [
    { id: 'customer_home', label: 'Home', icon: Home },
    { id: 'my_bookings', label: 'My Bookings', icon: Calendar },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'help', label: 'Help', icon: Headphones },
    { id: 'user_profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.bottomNav}>
      {customerTabs.map(tab => {
        const isActive = currentScreen === tab.id;
        const IconComp = tab.icon;
        const activeColor = '#168A68';
        const inactiveColor = '#68788C';

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
                fill={isActive && tab.id === 'customer_home' ? '#EAF8F1' : 'none'}
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
    borderTopColor: '#E1E8E5',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    shadowColor: '#10243A',
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
    color: '#68788C',
    fontWeight: '600',
    marginTop: 2,
  },
  activeNavLabel: {
    color: '#168A68',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#168A68',
    marginTop: 2,
  },
});