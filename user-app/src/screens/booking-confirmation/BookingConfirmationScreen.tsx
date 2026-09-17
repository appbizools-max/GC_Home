import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, MapPin, Calendar, ArrowRight } from 'lucide-react-native';

export const BookingConfirmationScreen: React.FC = () => {
  const { selectedBooking, navigateTo } = useAuth();

  if (!selectedBooking) {
    navigateTo('my_bookings');
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topSection}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={44} color="#166534" />
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Booking ID: <Text style={styles.boldText}>{selectedBooking.bookingId}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.serviceLabel}>SERVICE</Text>
            <Text style={styles.serviceName}>{selectedBooking.serviceName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Clock size={12} color="#92400E" />
            <Text style={styles.statusBadgeText}>Pending Assignment</Text>
          </View>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#2D8A68" />
            <Text style={styles.detailText}>{selectedBooking.date} ({selectedBooking.timeSlot})</Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={16} color="#2D8A68" style={{ marginTop: 2 }} />
            <Text style={styles.detailText}>{selectedBooking.address.street}, {selectedBooking.address.locality}</Text>
          </View>
        </View>

        <View style={styles.otpBox}>
          <View>
            <Text style={styles.otpLabel}>START OTP (Give to Maid)</Text>
            <Text style={styles.otpValue}>{selectedBooking.startOtp}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.otpLabel}>AMOUNT</Text>
            <Text style={styles.amountValue}>₹{selectedBooking.totalAmount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          onPress={() => navigateTo('booking_tracking', { booking: selectedBooking })}
          style={styles.primaryBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Track Maid Assignment</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo('customer_home')}
          style={styles.secondaryBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
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
    gap: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  topSection: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E4E3D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  serviceLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  otpBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  otpValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E4E3D',
    letterSpacing: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  buttonGroup: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
