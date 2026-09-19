import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, UserCheck, User, DollarSign, Broom } from 'lucide-react-native';
export const BottomTabs: React.FC = () => {
  const { user, maidProfile, currentScreen, navigateTo } = useAuth();
  if (
    !user ||
    currentScreen === 'login' ||
    currentScreen === 'service_details' ||
    currentScreen === 'booking_screen' ||
    currentScreen === 'booking_confirmation'
  ) {
    return null;
  }

  const isMaidApproved = user.role === 'maid' && maidProfile?.status === 'approved';

  // ── Maid Partner Bottom Navigation ──
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
          const activeColor = '#0D8846';
          const inactiveColor = '#94A3B8';

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => navigateTo(tab.id as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <IconComp
                  size={21}
                  color={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? 2.4 : 1.8}
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
  // ── Customer Bottom Navigation ──
  const customerTabs = [
    { id: 'customer_home', label: 'Home', icon: Home },
    { id: 'services_listing', label: 'Services', icon: Broom },
    ...(user.maidApplicationStatus === 'none'
      ? [{ id: 'become_maid_info', label: 'Become Maid', icon: UserCheck }]
      : [{ id: 'maid_status', label: 'Maid Status', icon: UserCheck }]),
    { id: 'user_profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.bottomNav}>
      {customerTabs.map(tab => {
        const isActive = currentScreen === tab.id;
        const IconComp = tab.icon;
        const activeColor = '#0D8846';
        const inactiveColor = '#94A3B8';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => navigateTo(tab.id as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <IconComp
                size={21}
                color={isActive ? activeColor : inactiveColor}
                strokeWidth={isActive ? 2.4 : 1.8}
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
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
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
    height: 26,
  },
  navLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  activeNavLabel: {
    color: '#0D8846',
    fontWeight: '800',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D8846',
    marginTop: 3,
  },
});