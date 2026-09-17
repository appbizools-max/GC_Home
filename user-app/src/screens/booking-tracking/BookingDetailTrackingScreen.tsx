import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Clock, Phone, Star } from 'lucide-react-native';
import { BookingStatus } from '../../types';

export const BookingDetailTrackingScreen: React.FC = () => {
  const { selectedBooking, navigateTo, updateBookingStatus } = useAuth();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittedRating, setSubmittedRating] = useState(false);

  if (!selectedBooking) {
    navigateTo('my_bookings');
    return null;
  }

  const steps: { status: BookingStatus; label: string }[] = [
    { status: 'pending_assignment', label: 'Booking Received' },
    { status: 'maid_assigned', label: 'Maid Assigned' },
    { status: 'maid_accepted', label: 'Maid Accepted' },
    { status: 'in_progress', label: 'Cleaning In Progress' },
    { status: 'completed', label: 'Job Completed' }
  ];

  const getStepIndex = (s: BookingStatus) => {
    switch (s) {
      case 'pending_assignment': return 0;
      case 'maid_assigned': return 1;
      case 'maid_accepted': return 2;
      case 'in_progress': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(selectedBooking.status);

  const handleRatingSubmit = () => {
    updateBookingStatus(selectedBooking.bookingId, 'completed', { rating, review });
    setSubmittedRating(true);
  };

  const handleCallMaid = () => {
    if (selectedBooking.assignedMaidPhone) {
      Linking.openURL(`tel:${selectedBooking.assignedMaidPhone}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigateTo('my_bookings')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{selectedBooking.serviceName}</Text>
          <Text style={styles.headerSubtitle}>Booking #{selectedBooking.bookingId}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Status Progression</Text>
        <View style={styles.stepsList}>
          {steps.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={[
                  styles.stepCircle,
                  isDone ? styles.stepCircleDone : styles.stepCirclePending,
                  isCurrent && styles.stepCircleCurrent
                ]}>
                  <Text style={[styles.stepCircleText, isDone && styles.stepCircleTextDone]}>
                    {isDone ? '✓' : String(idx + 1)}
                  </Text>
                </View>
                <Text style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isDone && !isCurrent && styles.stepLabelDone
                ]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {selectedBooking.assignedMaidName ? (
        <View style={[styles.card, styles.maidCard]}>
          <View style={styles.maidHeader}>
            <Text style={styles.maidLabel}>ASSIGNED MAID</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>Verified Partner</Text>
            </View>
          </View>

          <View style={styles.maidInfoRow}>
            <Image
              source={{ uri: selectedBooking.assignedMaidPhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' }}
              style={styles.maidPhoto}
            />
            <View style={styles.maidDetails}>
              <Text style={styles.maidName}>{selectedBooking.assignedMaidName}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>4.8 (42 jobs)</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCallMaid} style={styles.callBtn}>
              <Phone size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.card, styles.findingCard]}>
          <Clock size={28} color="#92400E" style={{ alignSelf: 'center', marginBottom: 8 }} />
          <Text style={styles.findingTitle}>Finding the Nearest Verified Maid</Text>
          <Text style={styles.findingDesc}>
            Admin is matching your job location with available maids in Bellandur.
          </Text>
        </View>
      )}

      <View style={[styles.card, styles.otpCard]}>
        <View>
          <Text style={styles.otpLabel}>SERVICE START OTP</Text>
          <Text style={styles.otpValue}>{selectedBooking.startOtp || '4829'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.otpLabel}>AMOUNT DUE</Text>
          <Text style={styles.amountValue}>₹{selectedBooking.totalAmount}</Text>
        </View>
      </View>

      {selectedBooking.status === 'completed' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate Your Service</Text>
          {submittedRating || selectedBooking.rating ? (
            <View style={styles.ratedBox}>
              <Text style={styles.ratedText}>
                Thank you for rating! You rated {selectedBooking.rating || rating} Stars.
              </Text>
            </View>
          ) : (
            <View style={styles.ratingForm}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Star
                      size={28}
                      color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                      fill={star <= rating ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={review}
                onChangeText={setReview}
                placeholder="Share your experience with the maid..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
                style={styles.reviewInput}
              />
              <TouchableOpacity onPress={handleRatingSubmit} style={styles.submitRatingBtn}>
                <Text style={styles.submitRatingBtnText}>Submit Rating & Review</Text>
              </TouchableOpacity>
            </View>
          )}
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
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  stepsList: {
    gap: 12,
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#2D8A68',
  },
  stepCirclePending: {
    backgroundColor: '#E2E8F0',
  },
  stepCircleCurrent: {
    borderWidth: 3,
    borderColor: '#BBE9D2',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepCircleTextDone: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  stepLabelDone: {
    color: '#1E293B',
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  maidCard: {
    backgroundColor: '#EBF8F2',
    borderColor: '#BBE9D2',
  },
  maidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  maidLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  maidInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  maidPhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  maidDetails: {
    flex: 1,
  },
  maidName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D8A68',
    justifyContent: 'center',
    alignItems: 'center',
  },
  findingCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    alignItems: 'center',
    paddingVertical: 20,
  },
  findingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  findingDesc: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 4,
    textAlign: 'center',
  },
  otpCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  otpValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E4E3D',
    letterSpacing: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  ratedBox: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 10,
  },
  ratedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  ratingForm: {
    gap: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#1E293B',
    height: 60,
    textAlignVertical: 'top',
  },
  submitRatingBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitRatingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
