import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Linking, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, MapPin, Phone, Camera, CheckCircle2 } from 'lucide-react-native';

export const ActiveJobScreen: React.FC = () => {
  const { selectedBooking, updateBookingStatus, navigateTo } = useAuth();

  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  if (!selectedBooking) {
    navigateTo('maid_home');
    return null;
  }

  const handleStartJob = () => {
    if (otpInput === (selectedBooking.startOtp || '4829')) {
      setOtpVerified(true);
      updateBookingStatus(selectedBooking.bookingId, 'in_progress');
    } else {
      Alert.alert('Invalid OTP', 'Invalid Customer OTP! Please ask customer for the correct 4-digit code.');
    }
  };

  const handleMarkCompleted = () => {
    updateBookingStatus(selectedBooking.bookingId, 'completed', {
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    Alert.alert('Success', 'Job marked as Completed! Payout added to your earnings.');
    navigateTo('maid_home');
  };

  const handleCallCustomer = () => {
    if (selectedBooking.customerPhone) {
      Linking.openURL(`tel:${selectedBooking.customerPhone}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigateTo('maid_home')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{selectedBooking.serviceName}</Text>
          <Text style={styles.headerSubtitle}>Booking #{selectedBooking.bookingId}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.customerRow}>
          <View>
            <Text style={styles.customerLabel}>CUSTOMER</Text>
            <Text style={styles.customerName}>{selectedBooking.customerName}</Text>
          </View>
          <TouchableOpacity onPress={handleCallCustomer} style={styles.callBtn}>
            <Phone size={14} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addressBox}>
          <MapPin size={16} color="#2D8A68" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.localityText}>{selectedBooking.address.locality}</Text>
            <Text style={styles.streetText}>{selectedBooking.address.street}, {selectedBooking.address.city} - {selectedBooking.address.pincode}</Text>
          </View>
        </View>

        {selectedBooking.specialInstructions ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              <Text style={{ fontWeight: '700' }}>Special Note: </Text>
              {selectedBooking.specialInstructions}
            </Text>
          </View>
        ) : null}
      </View>

      {selectedBooking.status === 'maid_accepted' && !otpVerified && (
        <View style={[styles.card, { borderColor: '#2D8A68' }]}>
          <Text style={styles.otpSectionTitle}>Ask Customer for 4-Digit OTP</Text>
          <Text style={styles.otpSectionSub}>
            Enter the OTP displayed on customer's phone to start the cleaning service timer.
          </Text>

          <TextInput
            value={otpInput}
            onChangeText={setOtpInput}
            placeholder="4829"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={4}
            style={styles.otpInput}
          />

          <TouchableOpacity onPress={handleStartJob} style={styles.verifyBtn} activeOpacity={0.85}>
            <Text style={styles.verifyBtnText}>Verify OTP & Start Job</Text>
          </TouchableOpacity>
        </View>
      )}

      {(selectedBooking.status === 'in_progress' || otpVerified) && (
        <View style={{ gap: 14 }}>
          <View style={styles.inProgressCard}>
            <View style={styles.inProgressHeader}>
              <CheckCircle2 size={18} color="#166534" />
              <Text style={styles.inProgressTitle}>Service In Progress</Text>
            </View>
            <Text style={styles.inProgressSub}>
              Timer active. Upload before & after photos for proof of work (optional).
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Job Proof Photos</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity
                onPress={() => setBeforePhoto('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400')}
                style={[styles.photoBox, beforePhoto ? styles.photoBoxActive : styles.photoBoxInactive]}
              >
                <Camera size={24} color="#2D8A68" style={{ alignSelf: 'center', marginBottom: 4 }} />
                <Text style={styles.photoBoxText}>
                  {beforePhoto ? '✓ Before Photo' : 'Upload Before'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAfterPhoto('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400')}
                style={[styles.photoBox, afterPhoto ? styles.photoBoxActive : styles.photoBoxInactive]}
              >
                <Camera size={24} color="#2D8A68" style={{ alignSelf: 'center', marginBottom: 4 }} />
                <Text style={styles.photoBoxText}>
                  {afterPhoto ? '✓ After Photo' : 'Upload After'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleMarkCompleted} style={styles.completeBtn} activeOpacity={0.85}>
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>
              Mark Job Completed (Payout ₹{Math.round(selectedBooking.totalAmount * 0.8)})
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  callBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2D8A68',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  localityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  streetText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  noteBox: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#78350F',
  },
  otpSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  otpSectionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2D8A68',
    borderRadius: 10,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 6,
    color: '#1E4E3D',
  },
  verifyBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inProgressCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  inProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inProgressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  inProgressSub: {
    fontSize: 12,
    color: '#14532D',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBoxActive: {
    backgroundColor: '#EBF8F2',
  },
  photoBoxInactive: {
    backgroundColor: '#F8FAFC',
  },
  photoBoxText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  completeBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
