import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Sliders,
  Check,
  Star,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  DollarSign,
  ArrowRight,
  Shield,
  HelpCircle,
  UserCheck,
} from 'lucide-react-native';

const FAQ_ITEMS = [
  {
    q: 'Is there any joining fee or security deposit?',
    a: 'No, joining GC Home+ is 100% free. We never charge registration fees, interview charges, or security deposits from our partners.',
  },
  {
    q: 'When and how do I receive my earnings?',
    a: 'Payments are directly deposited into your bank account or UPI every Monday morning by 10:00 AM with zero deductions or delay.',
  },
  {
    q: 'What cleaning supplies do I need to bring?',
    a: 'GC Home+ provides you with a free professional starter kit including a branded uniform apron, cleaning kit bag, safety gloves, and eco-safe supplies.',
  },
];

export const BecomeMaidInfoScreen: React.FC = () => {
  const { navigateTo, user, maidProfile, simulateAdminApproval } = useAuth();
  const status = user?.maidApplicationStatus || 'none';

  // Calculator State
  const [selectedHours, setSelectedHours] = useState<'4' | '6' | '8'>('6');
  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  // Demo simulation collapsed state
  const [showDemoAdmin, setShowDemoAdmin] = useState<boolean>(false);

  const toggleFaq = (idx: number) => {
    setExpandedFaq(prev => (prev === idx ? null : idx));
  };

  const getEarningsData = () => {
    switch (selectedHours) {
      case '4':
        return {
          hours: '4 Hours / Day',
          type: 'Part-Time Flex',
          total: '₹18,500',
          base: '₹15,000',
          bonus: '₹3,500',
          cleans: '~35-40 Cleans',
        };
      case '8':
        return {
          hours: '8 Hours / Day',
          type: 'Full-Time Pro',
          total: '₹36,500',
          base: '₹29,000',
          bonus: '₹7,500',
          cleans: '~80-90 Cleans',
        };
      case '6':
      default:
        return {
          hours: '6 Hours / Day',
          type: 'Standard (Most Popular)',
          total: '₹27,500',
          base: '₹22,500',
          bonus: '₹5,000',
          cleans: '~60-65 Cleans',
        };
    }
  };

  const earnings = getEarningsData();

  return (
    <View style={styles.container}>
      {/* ── Top Header Bar ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigateTo('customer_home')}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Maid Partner Program</Text>
          <Text style={styles.headerSubtitleText}>Earn on your own terms</Text>
        </View>
        <View style={styles.freeBadge}>
          <Sparkles size={11} color="#0D8846" />
          <Text style={styles.freeBadgeText}>100% FREE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ────────────────────────────────────────────────
            STATUS CONDITIONALS (If user already applied)
           ──────────────────────────────────────────────── */}

        {/* 1. PENDING STATUS CARD */}
        {status === 'pending' && (
          <View style={styles.statusSectionContainer}>
            <View style={styles.pendingStatusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.clockIconBox}>
                  <Clock size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingStatusTitle}>Application Under Review</Text>
                  <Text style={styles.pendingStatusSub}>
                    Submitted {maidProfile?.appliedAt || 'Recently'} • Ref #GC-8924
                  </Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>IN REVIEW</Text>
                </View>
              </View>

              <Text style={styles.statusDescription}>
                Our onboarding team is verifying your profile and documents. Verification usually completes within 2 to 4 hours.
              </Text>

              <View style={styles.timelineBox}>
                <View style={styles.timelineItem}>
                  <CheckCircle2 size={15} color="#0D8846" />
                  <Text style={styles.timelineTextDone}>Personal Details & Hub Submitted</Text>
                </View>
                <View style={styles.timelineItem}>
                  <CheckCircle2 size={15} color="#0D8846" />
                  <Text style={styles.timelineTextDone}>Identity & Health Check Verified</Text>
                </View>
                <View style={styles.timelineItem}>
                  <Clock size={15} color="#D97706" />
                  <Text style={styles.timelineTextPending}>Admin Operations Approval (In Progress)</Text>
                </View>
              </View>

              {/* Collapsible Demo Simulation */}
              <TouchableOpacity
                onPress={() => setShowDemoAdmin(!showDemoAdmin)}
                style={styles.demoToggleRow}
                activeOpacity={0.7}
              >
                <Sliders size={13} color="#64748B" />
                <Text style={styles.demoToggleText}>Demo Tools (Test Status)</Text>
                {showDemoAdmin ? (
                  <ChevronUp size={14} color="#64748B" />
                ) : (
                  <ChevronDown size={14} color="#64748B" />
                )}
              </TouchableOpacity>

              {showDemoAdmin && (
                <View style={styles.adminBtnRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => {
                      simulateAdminApproval(true);
                      Alert.alert('Application Approved', 'Partner application approved! Maid Dashboard is now accessible.');
                    }}
                    activeOpacity={0.8}
                  >
                    <Check size={14} color="#FFFFFF" />
                    <Text style={styles.adminBtnText}>Approve (Demo)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => {
                      simulateAdminApproval(false, 'Aadhaar document photo was blurry. Please re-upload clear photos.');
                      Alert.alert('Revision Requested', 'Application marked as revision needed.');
                    }}
                    activeOpacity={0.8}
                  >
                    <XCircle size={14} color="#FFFFFF" />
                    <Text style={styles.adminBtnText}>Request Revision</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 2. APPROVED STATUS CARD */}
        {status === 'approved' && (
          <View style={styles.statusSectionContainer}>
            <View style={styles.approvedStatusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.checkIconBox}>
                  <CheckCircle size={22} color="#0D8846" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.approvedStatusTitle}>Partner Account Active! 🎉</Text>
                  <Text style={styles.approvedStatusSub}>
                    Verified Professional • {maidProfile?.serviceArea || 'Hyderabad Central'}
                  </Text>
                </View>
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedBadgeText}>ACTIVE</Text>
                </View>
              </View>

              <Text style={styles.statusDescription}>
                Welcome to GC Home+! You are verified and ready to accept home service jobs in your area.
              </Text>

              <TouchableOpacity
                style={styles.launchDashboardBtn}
                onPress={() => navigateTo('maid_home')}
                activeOpacity={0.88}
              >
                <Text style={styles.launchDashboardBtnText}>Open Maid Partner Dashboard</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. REJECTED STATUS CARD */}
        {status === 'rejected' && (
          <View style={styles.statusSectionContainer}>
            <View style={styles.rejectedStatusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.rejectIconBox}>
                  <Shield size={22} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectedStatusTitle}>Action Required</Text>
                  <Text style={styles.rejectedStatusSub}>Application Revision Needed</Text>
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonTitle}>Feedback from Operations Team:</Text>
                <Text style={styles.reasonText}>
                  {maidProfile?.rejectionReason || 'Please review your uploaded documents and re-submit.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.reapplyBtn}
                onPress={() => navigateTo('maid_registration_form')}
                activeOpacity={0.88}
              >
                <Text style={styles.reapplyBtnText}>Update & Re-Submit Application</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ────────────────────────────────────────────────
            HERO CARD
           ──────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroTag}>
              <ShieldCheck size={12} color="#0D8846" />
              <Text style={styles.heroTagText}>GC HOME+ VERIFIED NETWORK</Text>
            </View>
          </View>

          <View style={styles.heroMainRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>
                Work with Dignity.{'\n'}
                <Text style={styles.heroHighlight}>Earn up to ₹35k/mo</Text>
              </Text>
              <Text style={styles.heroSub}>
                Guaranteed weekly Monday bank deposits, flexible hours, and ₹3 Lakh free medical insurance.
              </Text>
            </View>

            <View style={styles.heroAvatarContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                }}
                style={styles.heroAvatarImg}
              />
              <View style={styles.heroAvatarBadge}>
                <Star size={10} color="#FBBF24" fill="#FBBF24" />
                <Text style={styles.heroAvatarBadgeText}>4.9★</Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.heroMetricsStrip}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>₹32,000+</Text>
              <Text style={styles.heroMetricLbl}>Avg Monthly</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>Weekly</Text>
              <Text style={styles.heroMetricLbl}>Direct Payout</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>₹3 Lakh</Text>
              <Text style={styles.heroMetricLbl}>Free Insurance</Text>
            </View>
          </View>
        </View>

        {/* ────────────────────────────────────────────────
            INTERACTIVE EARNINGS ESTIMATOR
           ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <DollarSign size={17} color="#0D8846" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Earnings Estimator</Text>
              <Text style={styles.sectionSub}>Select your preferred daily work time</Text>
            </View>
          </View>

          {/* Segment Selector */}
          <View style={styles.hourSegmentsRow}>
            {(['4', '6', '8'] as const).map(h => {
              const isSelected = selectedHours === h;
              return (
                <TouchableOpacity
                  key={h}
                  onPress={() => setSelectedHours(h)}
                  style={[
                    styles.hourSegmentBtn,
                    isSelected && styles.hourSegmentBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.hourSegmentText,
                      isSelected && styles.hourSegmentTextActive,
                    ]}
                  >
                    {h}h / Day
                  </Text>
                  {h === '6' && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Result Box */}
          <View style={styles.calcResultCard}>
            <View style={styles.calcResultTop}>
              <View>
                <Text style={styles.calcType}>{earnings.type}</Text>
                <Text style={styles.calcVol}>{earnings.cleans}</Text>
              </View>
              <View style={styles.calcTotalCol}>
                <Text style={styles.calcTotalAmount}>{earnings.total}</Text>
                <Text style={styles.calcMonthLabel}>/ month est.</Text>
              </View>
            </View>

            <View style={styles.calcDivider} />

            <View style={styles.calcBreakdownRow}>
              <Text style={styles.breakdownLabel}>Base Cleaning Payouts</Text>
              <Text style={styles.breakdownVal}>{earnings.base}</Text>
            </View>
            <View style={styles.calcBreakdownRow}>
              <Text style={styles.breakdownLabel}>Incentives & Bonuses</Text>
              <Text style={styles.breakdownValGreen}>+{earnings.bonus}</Text>
            </View>

            <View style={styles.calcPayoutFooter}>
              <CreditCard size={13} color="#0D8846" />
              <Text style={styles.calcPayoutFooterText}>
                Deposited every Monday morning directly to your bank account
              </Text>
            </View>
          </View>
        </View>


        {/* ────────────────────────────────────────────────
            SIMPLE 4-STEP ONBOARDING
           ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <UserCheck size={17} color="#0D8846" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Simple 4-Step Onboarding</Text>
              <Text style={styles.sectionSub}>Fast verification in under 24 hours</Text>
            </View>
          </View>

          <View style={styles.stepsList}>
            {[
              {
                num: '1',
                title: 'Personal Information',
                desc: 'Fill in your name, contact details, and operating hub zone.',
              },
              {
                num: '2',
                title: 'Upload Documents',
                desc: 'Upload your Aadhaar card for instant digital verification.',
              },
              {
                num: '3',
                title: 'Health & Fitness Declaration',
                desc: 'Confirm medical fitness and declare any allergies or chronic conditions.',
              },
              {
                num: '4',
                title: 'Bank Payout Details',
                desc: 'Provide your bank account or UPI for direct weekly deposits.',
              },
            ].map((step, idx) => (
              <View key={idx} style={styles.stepItem}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>{step.num}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ────────────────────────────────────────────────
            PARTNER SPOTLIGHT
           ──────────────────────────────────────────────── */}
        <View style={styles.spotlightCard}>
          <View style={styles.spotlightTopRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.spotlightAvatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.spotlightName}>Sunita Devi</Text>
                <View style={styles.spotlightVerifiedBadge}>
                  <Check size={10} color="#0D8846" strokeWidth={3} />
                  <Text style={styles.spotlightVerifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.spotlightSub}>Kondapur Hub • 400+ Cleans</Text>
              <View style={styles.spotlightRatingRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={10} color="#FBBF24" fill="#FBBF24" />
                ))}
                <Text style={styles.spotlightRatingNum}>4.9★</Text>
              </View>
            </View>
            <View style={styles.spotlightEarnPill}>
              <Text style={styles.spotlightEarnLbl}>Earned Last Mo</Text>
              <Text style={styles.spotlightEarnVal}>₹34,200</Text>
            </View>
          </View>
          <Text style={styles.spotlightQuote}>
            "Joining GC Home+ changed everything. I work 6 hours a day near my home and earnings are deposited straight to my bank account every Monday without any delays."
          </Text>
        </View>

        {/* ────────────────────────────────────────────────
            FAQS (Top 3)
           ──────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <HelpCircle size={17} color="#0D8846" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.sectionSub}>Quick answers for new partners</Text>
            </View>
          </View>

          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleFaq(idx)}
                  style={styles.faqItem}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestionText}>{item.q}</Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#0D8846" />
                    ) : (
                      <ChevronDown size={16} color="#94A3B8" />
                    )}
                  </View>
                  {isExpanded && (
                    <Text style={styles.faqAnswerText}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Space for bottom CTA */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ────────────────────────────────────────────────
          STICKY BOTTOM APPLICATION CTA BAR
         ──────────────────────────────────────────────── */}
      <View style={styles.stickyBottomBar}>
        <View style={styles.stickyBottomLeft}>
          <View style={styles.zeroFeePill}>
            <Sparkles size={11} color="#0D8846" />
            <Text style={styles.zeroFeeText}>100% Free • No Fees</Text>
          </View>
          <Text style={styles.stickyBottomHeading}>5-Min Online Form</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigateTo('maid_registration_form')}
          style={styles.mainApplyBtn}
          activeOpacity={0.88}
        >
          <Text style={styles.mainApplyBtnText}>Apply Now</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCFA',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 14 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2E23',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1F2DF',
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D8846',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  /* Status Cards */
  statusSectionContainer: {
    marginBottom: 4,
  },
  pendingStatusCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 12,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingStatusSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  statusDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  timelineBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTextDone: {
    fontSize: 11.5,
    color: '#0D8846',
    fontWeight: '700',
  },
  timelineTextPending: {
    fontSize: 11.5,
    color: '#B45309',
    fontWeight: '600',
  },
  demoToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoToggleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  adminBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D8846',
    paddingVertical: 9,
    borderRadius: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    borderRadius: 10,
  },
  adminBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  approvedStatusCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  checkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  approvedStatusSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  approvedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  approvedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  launchDashboardBtn: {
    backgroundColor: '#0D8846',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  launchDashboardBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  rejectedStatusCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  rejectIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  rejectedStatusSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
  },
  reasonBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 4,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  reasonText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  reapplyBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reapplyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    gap: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D8846',
    letterSpacing: 0.5,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F2E23',
    lineHeight: 24,
  },
  heroHighlight: {
    color: '#0D8846',
  },
  heroSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  heroAvatarContainer: {
    position: 'relative',
  },
  heroAvatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#0D8846',
  },
  heroAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F2E23',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  heroAvatarBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FCFA',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2F4EB',
  },
  heroMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D8846',
  },
  heroMetricLbl: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* Section Card Standard */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F2E23',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* Hour Segments */
  hourSegmentsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  hourSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hourSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  hourSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  hourSegmentTextActive: {
    color: '#0D8846',
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#0D8846',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Calculator Result Card */
  calcResultCard: {
    backgroundColor: '#F8FCFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1F2DF',
    gap: 8,
  },
  calcResultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcType: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2E23',
  },
  calcVol: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  calcTotalCol: {
    alignItems: 'flex-end',
  },
  calcTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0D8846',
  },
  calcMonthLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#E2F4EB',
    marginVertical: 4,
  },
  calcBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11.5,
    color: '#475569',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2E23',
  },
  breakdownValGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D8846',
  },
  calcPayoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F8EE',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  calcPayoutFooterText: {
    fontSize: 10.5,
    color: '#0D8846',
    fontWeight: '600',
    flex: 1,
  },

  /* Benefits Grid */
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#F8FCFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    gap: 6,
  },
  benefitIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2E23',
    marginTop: 2,
  },
  benefitDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },

  /* Steps List */
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0D8846',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F2E23',
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 15,
  },

  /* Spotlight Card */
  spotlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#0D8846',
  },
  spotlightName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2E23',
  },
  spotlightVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  spotlightVerifiedText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0D8846',
  },
  spotlightSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  spotlightRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  spotlightRatingNum: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 3,
  },
  spotlightEarnPill: {
    backgroundColor: '#E8F8EE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  spotlightEarnLbl: {
    fontSize: 8.5,
    color: '#475569',
  },
  spotlightEarnVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D8846',
  },
  spotlightQuote: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    fontStyle: 'italic',
    backgroundColor: '#F8FCFA',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0D8846',
  },

  /* FAQ */
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: '#F8FCFA',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBF5F0',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2E23',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswerText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2F4EB',
    paddingTop: 8,
  },

  /* Sticky Bottom Bar */
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  stickyBottomLeft: {
    gap: 2,
  },
  zeroFeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zeroFeeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D8846',
  },
  stickyBottomHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2E23',
  },
  mainApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D8846',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#0D8846',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  mainApplyBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});