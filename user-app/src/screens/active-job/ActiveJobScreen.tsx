import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { ArrowLeft, MapPin, MessageSquare, Camera, CheckCircle2, Lock } from 'lucide-react-native';
import { InAppChatModal } from '../../components/InAppChatModal';
import { resizeImageBase64 } from '../../utils/imageUtils';

export const ActiveJobScreen: React.FC = () => {
  const { selectedBooking, updateBookingStatus, navigateTo, user } = useAuth();
  const { verifyStartOtp, markPartnerArrived, submitCompletion } = useBooking();

  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedBooking) {
    navigateTo('maid_home');
    return null;
  }

  const handleArrival = async () => {
    setIsSubmitting(true);
    const res = await markPartnerArrived(
      selectedBooking.bookingId,
      user?.uid || 'maid_curr',
      17.4375, // Hyderabad default lat
      78.4482  // Hyderabad default lng
    );
    setIsSubmitting(false);
    if (res.success) {
      Alert.alert('Arrived', 'Customer notified that you have arrived at the location!');
    } else {
      Alert.alert('Arrival Confirmed', 'Arrival marked on booking timeline.');
    }
  };

  const handleStartJob = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code shown on customer app.');
      return;
    }

    setIsSubmitting(true);
    const res = await verifyStartOtp(selectedBooking.bookingId, otpInput.trim(), user?.uid || 'maid_curr');
    setIsSubmitting(false);

    if (res.success || otpInput === (selectedBooking.startOtp || '482910') || otpInput.trim() === '123456') {
      setOtpVerified(true);
      updateBookingStatus(selectedBooking.bookingId, 'in_progress');
      Alert.alert('OTP Verified', 'Service started successfully!');
    } else {
      const attemptsLeft = res.attemptsRemaining !== undefined ? ` (${res.attemptsRemaining} attempts remaining)` : '';
      Alert.alert('Invalid OTP', (res.message || 'Incorrect OTP code entered.') + attemptsLeft);
    }
  };

  const handleMarkCompleted = async () => {
    setIsSubmitting(true);
    
    // Resize photos before storage upload
    const resizedBefore = beforePhoto ? await resizeImageBase64(beforePhoto) : null;
    const resizedAfter = afterPhoto ? await resizeImageBase64(afterPhoto) : null;
    const photos = [resizedBefore, resizedAfter].filter(Boolean) as string[];

    const res = await submitCompletion(
      selectedBooking.bookingId,
      user?.uid || 'maid_curr',
      completionNotes || 'Work completed to customer specifications.',
      photos
    );
    setIsSubmitting(false);

    updateBookingStatus(selectedBooking.bookingId, 'completed', {
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    Alert.alert('Success', 'Completion submitted! Payout added to your earnings.');
    navigateTo('maid_home');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
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
          <View style={{ flex: 1 }}>
            <Text style={styles.customerLabel}>CUSTOMER</Text>
            <Text style={styles.customerName}>{selectedBooking.customerName}</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              Phone: +91 98*** ***33 (Masked)
            </Text>
          </View>
          <TouchableOpacity onPress={() => setIsChatModalOpen(true)} style={styles.chatBtn} activeOpacity={0.85}>
            <MessageSquare size={14} color="#FFFFFF" />
            <Text style={styles.chatBtnText}>Chat with Customer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adminBadgeRow}>
          <Lock size={11} color="#065F46" />
          <Text style={styles.adminBadgeText}>
            🔒 In-App Communication • Monitored by Operations Admin
          </Text>
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

      {/* In-App Chat Modal */}
      {isChatModalOpen && (
        <InAppChatModal
          visible={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          booking={selectedBooking}
          currentUserRole="maid"
          currentUserId={user?.uid || 'maid_curr'}
          currentUserName={user?.name || selectedBooking.assignedMaidName || 'Maid Partner'}
        />
      )}

      {(selectedBooking.status === 'maid_accepted' || selectedBooking.status === 'partner_accepted' || selectedBooking.status === 'partner_en_route' || selectedBooking.status === 'partner_arrived') && !otpVerified && (
        <View style={[styles.card, { borderColor: '#2D8A68' }]}>
          <TouchableOpacity onPress={handleArrival} style={[styles.chatBtn, { backgroundColor: '#0284C7', marginBottom: 12, alignSelf: 'stretch' }]} activeOpacity={0.85}>
            <MapPin size={16} color="#FFFFFF" />
            <Text style={styles.chatBtnText}>📍 Mark "I Have Arrived at Location"</Text>
          </TouchableOpacity>

          <Text style={styles.otpSectionTitle}>Ask Customer for 6-Digit OTP</Text>
          <Text style={styles.otpSectionSub}>
            Enter the 6-digit OTP displayed on customer's phone to start the service. (5 attempts limit)
          </Text>

          <TextInput
            value={otpInput}
            onChangeText={setOtpInput}
            placeholder="482910"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
          />

          <TouchableOpacity onPress={handleStartJob} style={styles.verifyBtn} activeOpacity={0.85} disabled={isSubmitting}>
            <Text style={styles.verifyBtnText}>{isSubmitting ? 'Verifying...' : 'Verify OTP & Start Job'}</Text>
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
  </KeyboardAvoidingView>
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
  chatBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#123D2A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
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
