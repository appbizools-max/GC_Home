import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import { TrackingStage } from '../../types';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Star,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  HelpCircle,
  KeyRound,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';

const STAGES_CONFIG: { stage: TrackingStage; title: string; subtitle: string }[] = [
  { stage: 'confirmed', title: 'Booking Confirmed', subtitle: 'Your booking has been received and scheduled.' },
  { stage: 'assigned', title: 'Professional Assigned', subtitle: 'Verified cleaning partner is assigned to your slot.' },
  { stage: 'on_the_way', title: 'Professional On The Way', subtitle: 'Partner is heading towards your location.' },
  { stage: 'arrived', title: 'Arrived at Location', subtitle: 'Partner has reached your doorstep.' },
  { stage: 'cleaning', title: 'Cleaning In Progress', subtitle: 'Deep sanitization and cleaning under progress.' },
  { stage: 'completed', title: 'Cleaning Completed', subtitle: 'Service completed with high standard.' },
];

export const BookingTrackingScreen: React.FC = () => {
  const { navigateTo, user } = useAuth();
  const { activeBooking, advanceBookingStage, reportPaymentViolation } = useBooking();

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'asked_for_cash' | 'unauthorized_amount' | 'payment_outside_app' | 'service_issue' | 'other'>('asked_for_cash');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const booking = activeBooking;
  const currentStage = booking?.currentStage || 'on_the_way';
  const pro = booking?.assignedPro;

  const currentStageIndex = STAGES_CONFIG.findIndex(s => s.stage === currentStage);

  const handleReportSubmit = async () => {
    if (!booking) return;
    setIsSubmittingReport(true);
    await reportPaymentViolation(
      booking.bookingId,
      user?.uid || 'cust_curr',
      booking.assignedPro?.id,
      reportReason,
      reportDescription || 'Customer reported unauthorized cash collection demand.',
      150
    );
    setIsSubmittingReport(false);
    setShowReportModal(false);
    alert('Report Submitted. Operations Admin has been alerted and will review immediately.');
  };

  const handleSOSAlert = async () => {
    if (!booking) return;
    try {
      const { supabase } = await import('../../config/supabase');
      await supabase.from('sos_alerts').insert([
        {
          booking_id: booking.bookingId,
          user_id: user?.uid || 'cust_curr',
          user_role: 'customer',
          user_name: user?.name || 'Customer',
          user_phone: user?.phone || '+91 9849201824',
          latitude: 17.4375,
          longitude: 78.4482,
          address_text: (booking.address?.street || 'Road No. 12') + ', ' + (booking.address?.locality || 'Banjara Hills'),
          status: 'active',
        }
      ]);
      alert('🔴 EMERGENCY SOS SIGNAL DISPATCHED!\n\nGC HOME+ Security Control Room & Emergency Response Team have been alerted with your live location.');
    } catch (err) {
      alert('Emergency SOS Dispatched to GC Control Room.');
    }
  };

  const handleNextStageSimulation = () => {
    const nextIdx = currentStageIndex + 1;
    if (nextIdx < STAGES_CONFIG.length && booking) {
      const nextStage = STAGES_CONFIG[nextIdx].stage;
      advanceBookingStage(booking.bookingId, nextStage);
      if (nextStage === 'completed') {
        navigateTo('service-completed');
      }
    }
  };

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('home')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <AppLogo size="sm" showTagline={true} align="left" />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.helpBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={handleSOSAlert}
            activeOpacity={0.7}
          >
            <ShieldAlert size={18} color="#DC2626" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => navigateTo('help')}
            activeOpacity={0.7}
          >
            <HelpCircle size={20} color="#10243A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Tracking Card */}
        <View style={styles.trackingHeaderCard}>
          <View style={styles.trackingTitleRow}>
            <View>
              <Text style={styles.bookingIdText}>Booking #{booking?.bookingId || 'GC-89421'}</Text>
              <Text style={styles.serviceHeading}>
                {booking?.serviceName || 'Home Cleaning'} ({booking?.homeSize.label || '1 BHK'})
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {/* Start OTP Safety Pin */}
          <View style={styles.otpSafetyBanner}>
            <KeyRound size={16} color="#0E5B47" />
            <Text style={styles.otpBannerText}>
              Share Start OTP with cleaner upon arrival:{' '}
              <Text style={styles.otpDigits}>{booking?.startOtp || '4829'}</Text>
            </Text>
          </View>
        </View>

        {/* Assigned Cleaner Profile Card */}
        {pro && (
          <View style={styles.cleanerCard}>
            <Image source={resolveImageSource(pro.photoUrl)} style={styles.cleanerPhoto} />

            <View style={styles.cleanerDetails}>
              <View style={styles.cleanerNameRow}>
                <Text style={styles.cleanerName}>{pro.name}</Text>
                {pro.isVerified && (
                  <View style={styles.verifiedTag}>
                    <ShieldCheck size={11} color="#168A68" />
                    <Text style={styles.verifiedText}>Verified Pro</Text>
                  </View>
                )}
              </View>

              <View style={styles.ratingRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingScore}>{pro.rating}</Text>
                <Text style={styles.ratingCount}>({pro.reviewCount} reviews)</Text>
              </View>

              <Text style={styles.experienceText}>{pro.experience}</Text>
            </View>

            {/* Quick In-App Chat Action */}
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => setShowMessageModal(true)}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color="#0E5B47" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 6-Stage Timeline Section */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineSectionTitle}>Service Progress</Text>

          <View style={styles.timelineList}>
            {STAGES_CONFIG.map((step, idx) => {
              const isPassed = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <View key={step.stage} style={styles.timelineStepRow}>
                  {/* Left Indicator & Line */}
                  <View style={styles.indicatorCol}>
                    {isPassed ? (
                      <CheckCircle2
                        size={22}
                        color="#168A68"
                        fill={isCurrent ? '#168A68' : '#EAF8F1'}
                      />
                    ) : (
                      <Circle size={20} color="#CBD5E1" />
                    )}
                    {idx < STAGES_CONFIG.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          idx < currentStageIndex && styles.timelineLineActive,
                        ]}
                      />
                    )}
                  </View>

                  {/* Step Text Info */}
                  <View style={styles.stepTextCol}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isPassed && styles.stepTitlePassed,
                        isCurrent && styles.stepTitleCurrent,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Schedule & Location Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.sumRow}>
            <Clock size={15} color="#168A68" />
            <Text style={styles.sumText}>
              {booking?.dateLabel || 'Today, 26 Apr'} • {booking?.timeSlot || '4:00 PM – 6:00 PM'}
            </Text>
          </View>
          <View style={styles.sumRow}>
            <MapPin size={15} color="#168A68" />
            <Text style={styles.sumText} numberOfLines={2}>
              {booking?.address.street}, {booking?.address.locality}, {booking?.address.city}
            </Text>
          </View>
        </View>

        {/* Security & Cash Handling Safeguard Banner */}
        <TouchableOpacity
          style={[styles.summaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
          onPress={() => setShowReportModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.sumRow}>
            <ShieldCheck size={15} color="#DC2626" />
            <Text style={[styles.sumText, { color: '#991B1B', fontWeight: '800' }]}>
              Report Unauthorized Cash Request
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#B91C1C', marginTop: 4 }}>
            Partners are strictly forbidden from demanding cash payments outside the app. Click here to report.
          </Text>
        </TouchableOpacity>

        {/* Interactive Demo Simulation Button */}
        <TouchableOpacity
          style={styles.simStageBtn}
          onPress={handleNextStageSimulation}
          activeOpacity={0.8}
        >
          <Sparkles size={14} color="#0E5B47" />
          <Text style={styles.simStageText}>
            {currentStage === 'completed'
              ? 'View Completed Summary →'
              : `Advance to next stage (${STAGES_CONFIG[Math.min(currentStageIndex + 1, 5)].title})`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Message / Chat Modal */}
      <Modal visible={showMessageModal} transparent animationType="slide" onRequestClose={() => setShowMessageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.chatSheet}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Chat with {pro?.name || 'Partner'}</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <Text style={styles.closeChatText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chatBubblePartner}>
              <Text style={styles.bubbleText}>
                Namaste! I am on my way to your location. I will arrive around {booking?.timeSlot.split('–')[0]}.
              </Text>
            </View>
            <View style={styles.chatBubbleUser}>
              <Text style={styles.bubbleTextUser}>
                Thanks Sunita ji! Please call once you reach the gate.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  helpBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  trackingHeaderCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginBottom: 12,
  },
  trackingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#168A68',
    textTransform: 'uppercase',
  },
  serviceHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#168A68',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E5B47',
  },
  otpSafetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  otpBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#0E5B47',
    fontWeight: '600',
  },
  otpDigits: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 1,
  },
  cleanerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 14,
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cleanerPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  cleanerDetails: {
    flex: 1,
  },
  cleanerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cleanerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10243A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#168A68',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10243A',
  },
  ratingCount: {
    fontSize: 10,
    color: '#68788C',
  },
  experienceText: {
    fontSize: 10.5,
    color: '#68788C',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#168A68',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 12,
  },
  timelineSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
    marginBottom: 14,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 26,
    marginRight: 10,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineLineActive: {
    backgroundColor: '#168A68',
  },
  stepTextCol: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#68788C',
  },
  stepTitlePassed: {
    color: '#10243A',
    fontWeight: '800',
  },
  stepTitleCurrent: {
    color: '#0E5B47',
    fontWeight: '900',
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 14,
  },
  summaryCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    gap: 8,
    marginBottom: 14,
  },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sumText: {
    flex: 1,
    fontSize: 11.5,
    color: '#10243A',
    fontWeight: '600',
  },
  simStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  simStageText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5B47',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  chatSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
  },
  closeChatText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#168A68',
  },
  chatBubblePartner: {
    backgroundColor: '#F5FCF8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 10,
    maxWidth: '85%',
  },
  bubbleText: {
    fontSize: 12.5,
    color: '#10243A',
    lineHeight: 16,
  },
  chatBubbleUser: {
    backgroundColor: '#0E5B47',
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 16,
  },
  bubbleTextUser: {
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 16,
  },
});
