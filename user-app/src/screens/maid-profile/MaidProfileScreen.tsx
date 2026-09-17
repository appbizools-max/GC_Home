import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Star, Landmark, LogOut } from 'lucide-react-native';

export const MaidProfileScreen: React.FC = () => {
  const { maidProfile, logout, loginAsDemoCustomer } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.card, styles.profileCard]}>
        <Image
          source={{ uri: maidProfile?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' }}
          style={styles.photo}
        />
        <Text style={styles.name}>{maidProfile?.fullName || 'Sunita Sharma'}</Text>
        <Text style={styles.phone}>{maidProfile?.phone || '+91 98765 43210'}</Text>

        <TouchableOpacity onPress={loginAsDemoCustomer} style={styles.switchRoleBtn}>
          <Text style={styles.switchRoleBtnText}>Switch to Customer Mode</Text>
        </TouchableOpacity>

        <View style={styles.ratingRow}>
          <Star size={18} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingValue}>4.8 Partner Rating</Text>
          <Text style={styles.ratingCount}>(56 Jobs)</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verification Status</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Government ID (Aadhaar)</Text>
            <Text style={styles.verifiedText}>✓ Verified by Admin</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Health & Chemical Safety</Text>
            <Text style={styles.verifiedText}>✓ Signed Declaration</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Locality Radius</Text>
            <Text style={styles.radiusText}>
              {maidProfile?.serviceArea || 'Bellandur'} ({maidProfile?.serviceRadiusKm || 5} km)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Landmark size={16} color="#2D8A68" />
          <Text style={styles.cardTitle}>Payout Bank Details</Text>
        </View>
        <View style={styles.bankDetailsGroup}>
          <Text style={styles.bankDetailText}>
            <Text style={{ fontWeight: '700' }}>Bank: </Text>
            {maidProfile?.bankDetails?.bankName || 'State Bank of India'}
          </Text>
          <Text style={styles.bankDetailText}>
            <Text style={{ fontWeight: '700' }}>A/C Holder: </Text>
            {maidProfile?.bankDetails?.accountName || 'Sunita Sharma'}
          </Text>
          <Text style={styles.bankDetailText}>
            <Text style={{ fontWeight: '700' }}>A/C No: </Text>
            {maidProfile?.bankDetails?.accountNumber || 'XXXX-XXXX-4829'}
          </Text>
          <Text style={styles.bankDetailText}>
            <Text style={{ fontWeight: '700' }}>IFSC: </Text>
            {maidProfile?.bankDetails?.ifscCode || 'SBIN0004821'}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
        <LogOut size={16} color="#991B1B" />
        <Text style={styles.logoutText}>Logout Partner Account</Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#2D8A68',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  phone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  switchRoleBtn: {
    backgroundColor: '#2D8A68',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
  },
  switchRoleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  ratingCount: {
    fontSize: 12,
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#475569',
  },
  verifiedText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '700',
  },
  radiusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  bankDetailsGroup: {
    gap: 4,
  },
  bankDetailText: {
    fontSize: 13,
    color: '#334155',
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
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
});
