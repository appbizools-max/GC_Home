import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut, MapPin, ChevronRight } from 'lucide-react-native';

export const UserProfileScreen: React.FC = () => {
  const { user, logout, navigateTo, loginAsDemoMaid, loginAsDemoCustomer } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Rahul Verma'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '+91 98111 22233'}</Text>
        </View>

        <TouchableOpacity onPress={loginAsDemoMaid} style={styles.switchRoleBtn}>
          <Text style={styles.switchRoleBtnText}>Switch to Maid</Text>
        </TouchableOpacity>
      </View>

      {/* Become a Maid Shortcut */}
      {user?.role === 'customer' && user?.maidApplicationStatus === 'none' && (
        <TouchableOpacity
          onPress={() => navigateTo('become_maid_info')}
          style={styles.partnerCard}
          activeOpacity={0.85}
        >
          <View style={styles.partnerContent}>
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>PARTNER PROGRAM</Text>
            </View>
            <Text style={styles.partnerTitle}>Register as a Maid Partner</Text>
            <Text style={styles.partnerSub}>Earn up to ₹30,000/mo flexible hours</Text>
          </View>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Account Menu */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saved Addresses</Text>
        <View style={styles.addressBox}>
          <MapPin size={16} color="#2D8A68" />
          <Text style={styles.addressText}>Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103</Text>
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
        <LogOut size={16} color="#991B1B" />
        <Text style={styles.logoutText}>Logout Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    backgroundColor: '#EBF8F2',
    borderWidth: 1,
    borderColor: '#BBE9D2',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D8A68',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  switchRoleBtn: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchRoleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  partnerCard: {
    backgroundColor: '#1E4E3D',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerContent: {
    flex: 1,
  },
  partnerBadge: {
    backgroundColor: '#BBE9D2',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  partnerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  partnerSub: {
    fontSize: 12,
    color: '#E2E8F0',
    opacity: 0.9,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    marginTop: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
});
