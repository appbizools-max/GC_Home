import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, UserCheck, User, Briefcase, DollarSign } from 'lucide-react-native';

export const BottomTabs: React.FC = () => {
  const { user, maidProfile, currentScreen, navigateTo } = useAuth();

  if (!user || currentScreen === 'login') return null;

  const isMaidApproved = user.role === 'maid' && maidProfile?.status === 'approved';

  if (isMaidApproved) {
    return (
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('maid_home')}
        >
          <Home size={20} color={currentScreen === 'maid_home' ? '#2A7B62' : '#6B7280'} />
          <Text style={[styles.navLabel, currentScreen === 'maid_home' && styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('my_jobs')}
        >
          <Calendar size={20} color={currentScreen === 'my_jobs' ? '#2A7B62' : '#6B7280'} />
          <Text style={[styles.navLabel, currentScreen === 'my_jobs' && styles.activeNavLabel]}>My Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('earnings')}
        >
          <DollarSign size={20} color={currentScreen === 'earnings' ? '#2A7B62' : '#6B7280'} />
          <Text style={[styles.navLabel, currentScreen === 'earnings' && styles.activeNavLabel]}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('maid_profile')}
        >
          <User size={20} color={currentScreen === 'maid_profile' ? '#2A7B62' : '#6B7280'} />
          <Text style={[styles.navLabel, currentScreen === 'maid_profile' && styles.activeNavLabel]}>Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Customer Bottom Navigation
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigateTo('customer_home')}
      >
        <Home size={20} color={currentScreen === 'customer_home' ? '#2A7B62' : '#6B7280'} />
        <Text style={[styles.navLabel, currentScreen === 'customer_home' && styles.activeNavLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigateTo('my_bookings')}
      >
        <Calendar size={20} color={currentScreen === 'my_bookings' ? '#2A7B62' : '#6B7280'} />
        <Text style={[styles.navLabel, currentScreen === 'my_bookings' && styles.activeNavLabel]}>Bookings</Text>
      </TouchableOpacity>

      {user.maidApplicationStatus === 'none' && (
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('become_maid_info')}
        >
          <UserCheck size={20} color={currentScreen === 'become_maid_info' ? '#2A7B62' : '#6B7280'} />
          <Text style={[styles.navLabel, currentScreen === 'become_maid_info' && styles.activeNavLabel]}>Become Maid</Text>
        </TouchableOpacity>
      )}

      {(user.maidApplicationStatus === 'pending' || user.maidApplicationStatus === 'rejected') && (
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('maid_status')}
        >
          <UserCheck size={20} color={currentScreen === 'maid_status' ? '#2A7B62' : '#6B7280'} />
          <Text style={[styles.navLabel, currentScreen === 'maid_status' && styles.activeNavLabel]}>Maid Status</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigateTo('user_profile')}
      >
        <User size={20} color={currentScreen === 'user_profile' ? '#2A7B62' : '#6B7280'} />
        <Text style={[styles.navLabel, currentScreen === 'user_profile' && styles.activeNavLabel]}>Profile</Text>
      </TouchableOpacity>
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
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activeNavLabel: {
    color: '#2A7B62',
    fontWeight: '600',
  },
});
