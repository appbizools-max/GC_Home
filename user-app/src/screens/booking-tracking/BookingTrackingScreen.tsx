import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
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
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react-native';

const STAGES_CONFIG: { stage: TrackingStage; title: string; subtitle: string }[] = [
  { stage: 'confirmed', title: 'Booking Confirmed', subtitle: 'Your booking has been received and scheduled.' },
  { stage: 'assigned', title: 'Professional Assigned', subtitle: 'Verified cleaning partner is assigned to your slot.' },
  { stage: 'on_the_way', title: 'Professional On The Way', subtitle: 'Partner is heading towards your location.' },
  { stage: 'arrived', title: 'Arrived at Location', subtitle: 'Partner has reached your doorstep.' },
  { stage: 'cleaning', title: 'Cleaning In Progress', subtitle: 'Deep sanitization and cleaning under progress.' },
  { stage: 'completed', title: 'Cleaning Completed', subtitle: 'Service completed with high standard.' },
];

/**
 * Human-readable date formatting (e.g. "Today · 9:00 AM – 11:00 AM" or "Tomorrow · 9:00 AM – 11:00 AM")
 */
function formatHumanDate(dateStr?: string): string {
  if (!dateStr) return 'Today';
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  
  const todayIso = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowIso = tomorrowObj.toISOString().split('T')[0];

  if (cleanDate === todayIso) return 'Today';
  if (cleanDate === tomorrowIso) return 'Tomorrow';

  try {
    const d = new Date(cleanDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  } catch {
    return cleanDate;
  }
  return cleanDate;
}

/**
 * Concise location helper
 */
function formatConciseLocation(locality?: string, city?: string, fullAddr?: string) {
  if (locality && locality.trim()) {
    const cityStr = city && city.trim() ? `, ${city.trim()}` : '';
    return `${locality.trim()}${cityStr}`;
  }
  if (fullAddr && fullAddr.trim()) {
    const parts = fullAddr.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    }
    return parts[0] || 'Hyderabad';
  }
  return city || 'Hyderabad';
}

export const BookingTrackingScreen: React.FC = () => {
  const { navigateTo, user } = useAuth();
  const { activeBooking, reportPaymentViolation } = useBooking();

  // OTP Masking Toggle State
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [showFullAddress, setShowFullAddress] = useState<boolean>(false);

  // Modals State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'asked_for_cash' | 'unauthorized_amount' | 'payment_outside_app' | 'service_issue' | 'other'>('asked_for_cash');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const booking = activeBooking;

  const getStageFromStatus = (status?: string): TrackingStage => {
    if (!status) return 'confirmed';
    switch (status) {
      case 'new':
      case 'pending':
      case 'pending_assignment':
        return 'confirmed';
      case 'maid_assigned':
      case 'assigned':
      case 'searching_partner':
        return 'assigned';
      case 'maid_accepted':
      case 'partner_accepted':
      case 'partner_en_route':
      case 'on_the_way':
      case 'en_route':
        return 'on_the_way';
      case 'partner_arrived':
      case 'arrived':
        return 'arrived';
      case 'in_progress':
      case 'cleaning_started':
      case 'cleaning':
      case 'service_in_progress':
        return 'cleaning';
      case 'completed':
      case 'customer_confirmed':
      case 'completion_submitted':
        return 'completed';
      default:
        return 'confirmed';
    }
  };

  const currentStage = booking?.currentStage || getStageFromStatus(booking?.status);
  const pro = booking?.assignedPro;
  const currentStageIndex = STAGES_CONFIG.findIndex(s => s.stage === currentStage);

  // Dynamic Primary Action CTA based on booking status
  const getPrimaryActionLabel = (): string => {
    switch (currentStage) {
      case 'confirmed':
        return pro ? 'View Professional →' : 'Track Order Status →';
      case 'assigned':
        return 'View Professional →';
      case 'on_the_way':
        return 'Track Professional →';
      case 'arrived':
      case 'cleaning':
        return 'View Service Status →';
      case 'completed':
        return 'View Service Summary →';
      default:
        return 'Track Professional →';
    }
  };

  const handlePrimaryAction = () => {
    if (currentStage === 'completed') {
      navigateTo('service-completed');
    } else if (pro) {
      setShowMessageModal(true);
    } else {
      navigateTo('my-bookings');
    }
  };

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

  const formattedHumanDate = formatHumanDate(booking?.date || booking?.createdAt);
  const conciseLocation = formatConciseLocation(
    booking?.address?.locality,
    booking?.address?.city,
    booking?.address ? `${booking.address.street || ''}, ${booking.address.locality || ''}, ${booking.address.city || ''}` : undefined
  );

  return (
    <View style={styles.safeContainer}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('customer_home')}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <AppLogo size="sm" showTagline={true} align="left" />

        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => navigateTo('help')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HelpCircle size={20} color="#10243A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. BOOKING SUMMARY CARD */}
        <View style={styles.summaryHeaderCard}>
          <View style={styles.cardTopFlex}>
            <Text style={styles.bookingIdText}>
              BOOKING #{booking?.bookingId || 'GC-30937'}
            </Text>
            
            {/* LIVE Badge: Never Clipped, 100% inside container */}
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.serviceTitleText} numberOfLines={2}>
            {booking?.serviceName || 'Overhead Tank Cleaning – 500L'}
          </Text>

          {/* 3. OTP SECURITY CARD (Initially Masked UX) */}
          <View style={styles.otpCard}>
            <View style={styles.otpHeaderRow}>
              <View style={styles.otpLeftGroup}>
                <KeyRound size={16} color="#123D2A" strokeWidth={2.2} />
                <Text style={styles.otpTitleLabel}>START OTP</Text>
              </View>

              <TouchableOpacity
                style={styles.showOtpBtn}
                onPress={() => setShowOtp(!showOtp)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showOtp ? (
                  <>
                    <EyeOff size={13} color="#123D2A" />
                    <Text style={styles.showOtpBtnText}>Hide OTP</Text>
                  </>
                ) : (
                  <>
                    <Eye size={13} color="#123D2A" />
                    <Text style={styles.showOtpBtnText}>Show OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.otpDisplayRow}>
              {showOtp ? (
                <Text style={styles.otpDigitsRevealed}>{booking?.startOtp || '438060'}</Text>
              ) : (
                <Text style={styles.otpDigitsMasked}>● ● ● ● ● ●</Text>
              )}
            </View>

            <Text style={styles.otpWarningSub}>
              Share only when the professional arrives.
            </Text>
          </View>
        </View>

        {/* ASSIGNED PROFESSIONAL CARD (If Assigned) */}
        {pro && (
          <View style={styles.cleanerCard}>
            <Image source={resolveImageSource(pro.photoUrl)} style={styles.cleanerPhoto} />

            <View style={styles.cleanerDetails}>
              <View style={styles.cleanerNameRow}>
                <Text style={styles.cleanerName}>{pro.name}</Text>
                {pro.isVerified !== false && (
                  <View style={styles.verifiedTag}>
                    <ShieldCheck size={11} color="#168A68" />
                    <Text style={styles.verifiedText}>Verified Pro</Text>
                  </View>
                )}
              </View>

              <View style={styles.ratingRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingScore}>{pro.rating || '4.9'}</Text>
                <Text style={styles.ratingCount}>({pro.reviewCount || 0} reviews)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => setShowMessageModal(true)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MessageSquare size={16} color="#123D2A" />
            </TouchableOpacity>
          </View>
        )}

        {/* 4 & 5. SERVICE PROGRESS TIMELINE (Compact Reduced Height) */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeaderTitle}>Service Progress</Text>

          <View style={styles.timelineList}>
            {STAGES_CONFIG.map((step, idx) => {
              const isPassed = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isLast = idx === STAGES_CONFIG.length - 1;

              return (
                <View key={step.stage} style={styles.stepContainer}>
                  <View style={styles.indicatorCol}>
                    {isCurrent ? (
                      <View style={styles.currentDotOuter}>
                        <View style={styles.currentDotInner} />
                      </View>
                    ) : isPassed ? (
                      <CheckCircle2 size={18} color="#168A68" fill="#EAF8F1" strokeWidth={2.2} />
                    ) : (
                      <Circle size={18} color="#CBD5E1" strokeWidth={2} />
                    )}

                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnector,
                          isPassed && idx < currentStageIndex && styles.timelineConnectorActive,
                        ]}
                      />
                    )}
                  </View>

                  {/* Step Text: Show Subtitle ONLY for Current Step to reduce height */}
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
                    
                    {/* Subtitle rendered only for active step */}
                    {isCurrent && (
                      <Text style={styles.activeStepSubtitle}>{step.subtitle}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 6 & 7. DYNAMIC PRIMARY ACTION CTA */}
        <TouchableOpacity
          style={styles.primaryCtaButton}
          onPress={handlePrimaryAction}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.primaryCtaText}>{getPrimaryActionLabel()}</Text>
        </TouchableOpacity>

        {/* 8 & 9. HUMAN READABLE SCHEDULE & CONCISE LOCATION CARD */}
        <View style={styles.scheduleLocationCard}>
          {/* Date & Time Row */}
          <View style={styles.infoRow}>
            <Clock size={16} color="#168A68" strokeWidth={2.2} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {formattedHumanDate} · {booking?.timeSlot || '9:00 AM – 11:00 AM'}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          {/* Location Row */}
          <View style={styles.infoRow}>
            <MapPin size={16} color="#168A68" strokeWidth={2.2} style={styles.infoIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoText} numberOfLines={1}>
                📍 {conciseLocation}
              </Text>
              
              {showFullAddress && booking?.address?.street ? (
                <Text style={styles.fullAddrSubtext}>
                  {booking.address.street}, {booking.address.locality}, {booking.address.city} - {booking.address.pincode}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => setShowFullAddress(!showFullAddress)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewAddrLink}>
                {showFullAddress ? 'Hide address' : 'View full address →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 11. CASH HANDLING SAFEGUARD WARNING CARD */}
        <TouchableOpacity
          style={styles.cashWarningCard}
          onPress={() => setShowReportModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.cashHeaderRow}>
            <ShieldAlert size={16} color="#DC2626" />
            <Text style={styles.cashTitle}>Report Unauthorized Cash Request</Text>
          </View>
          <Text style={styles.cashSubtext}>
            Partners must not request cash payments outside the app.
          </Text>
          <Text style={styles.cashReportLink}>Report an issue →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Payment Issue</Text>
            <Text style={styles.modalSub}>
              Describe any cash demand outside the GC HOME+ platform.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Describe issue..."
              multiline
              numberOfLines={3}
              value={reportDescription}
              onChangeText={setReportDescription}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleReportSubmit}
                disabled={isSubmittingReport}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
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
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  // SUMMARY CARD
  summaryHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAF1ED',
    gap: 10,
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C3E6D5',
    flexShrink: 0,
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#168A68',
  },
  liveBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  serviceTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 22,
  },
  // OTP SECURITY CARD
  otpCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    gap: 6,
    marginTop: 4,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpTitleLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#123D2A',
    letterSpacing: 0.5,
  },
  showOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C6E3CB',
  },
  showOtpBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#123D2A',
  },
  otpDisplayRow: {
    paddingVertical: 2,
  },
  otpDigitsRevealed: {
    fontSize: 20,
    fontWeight: '900',
    color: '#123D2A',
    letterSpacing: 3,
  },
  otpDigitsMasked: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 4,
  },
  otpWarningSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  // CLEANER CARD
  cleanerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAF1ED',
  },
  cleanerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
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
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#168A68',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingScore: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingCount: {
    fontSize: 11,
    color: '#64748B',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C3E6D5',
  },
  // TIMELINE CARD (COMPACT)
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAF1ED',
    gap: 12,
  },
  timelineHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  timelineList: {
    gap: 0,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  currentDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EAF5EC',
    borderWidth: 2,
    borderColor: '#123D2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#123D2A',
  },
  timelineConnector: {
    width: 2,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  timelineConnectorActive: {
    backgroundColor: '#168A68',
  },
  stepTextCol: {
    flex: 1,
    paddingBottom: 6,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTitlePassed: {
    color: '#475569',
  },
  stepTitleCurrent: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#123D2A',
  },
  activeStepSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  // PRIMARY CTA
  primaryCtaButton: {
    backgroundColor: '#123D2A',
    borderRadius: 24,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#123D2A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryCtaText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // SCHEDULE & LOCATION CARD
  scheduleLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAF1ED',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    marginTop: 1,
  },
  infoText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  viewAddrLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#168A68',
  },
  fullAddrSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  // CASH WARNING CARD (COMPACT)
  cashWarningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 4,
  },
  cashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cashTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#991B1B',
  },
  cashSubtext: {
    fontSize: 11,
    color: '#7F1D1D',
  },
  cashReportLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  // MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 60,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
