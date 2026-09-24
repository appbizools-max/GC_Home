import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Calendar,
  UserCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  CheckCircle,
  Shield,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';

export const BecomeMaidInfoScreen: React.FC = () => {
  const { navigateTo, user, maidProfile } = useAuth();
  const status = user?.maidApplicationStatus || maidProfile?.status || 'none';
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const handleHeaderBack = () => {
    navigateTo('login');
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const digits = (user?.phone || maidProfile?.phone || '').replace(/\D/g, '').slice(-10);
      const phoneOrId = digits
        ? `phone.eq.${user?.phone},phone.eq.+91${digits},phone.eq.${digits},id.eq.${user?.uid || ''}`
        : `id.eq.${user?.uid || ''}`;

      const { data, error } = await supabase
        .from('maid_profiles')
        .select('status, rejection_reason')
        .or(phoneOrId)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const latestStatus = data[0].status;
        if (latestStatus === 'approved') {
          Alert.alert(
            'Application Approved! 🎉',
            'Your partner profile has been approved by the Admin Operations team.',
            [{ text: 'Open Dashboard', onPress: () => navigateTo('maid_home') }]
          );
        } else if (latestStatus === 'rejected') {
          Alert.alert(
            'Application Feedback',
            data[0].rejection_reason || 'Revisions requested by Admin. Please update your details.',
            [{ text: 'Re-Apply as Partner', onPress: () => navigateTo('maid_registration_form', { isReapplication: true }) }]
          );
        } else {
          Alert.alert(
            'Under Review',
            'Your application is pending Admin Operations review. You will receive an SMS upon approval.'
          );
        }
      } else {
        Alert.alert('Status Check', 'Your application is currently pending Admin review.');
      }
    } catch {
      Alert.alert('Status Check', 'Application is currently under review by Admin.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header Bar ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={handleHeaderBack}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Maid Partner Program</Text>
          <Text style={styles.headerSubtitleText}>Earn on your own terms</Text>
        </View>
      </View>

      {/* ── Fixed Screen Content (No Scrolling) ── */}
      <View style={styles.mainContent}>
        {/* CASE 1: PENDING APPROVAL */}
        {status === 'pending' ? (
          <View style={styles.statusSectionContainer}>
            <View style={styles.pendingStatusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.clockIconBox}>
                  <Clock size={20} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingStatusTitle}>Application Under Review</Text>
                  <Text style={styles.pendingStatusSub}>
                    Submitted {maidProfile?.appliedAt || 'Recently'} • Awaiting Admin
                  </Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>PENDING</Text>
                </View>
              </View>

              <Text style={styles.statusDescription}>
                Your partner application and documents have been sent to the Admin Operations team for verification. An admin will review and approve your profile before partner access is activated.
              </Text>

              <View style={styles.timelineBox}>
                <View style={styles.timelineItem}>
                  <CheckCircle2 size={15} color="#0D8846" />
                  <Text style={styles.timelineTextDone}>Personal Details & Hub Submitted</Text>
                </View>
                <View style={styles.timelineItem}>
                  <CheckCircle2 size={15} color="#0D8846" />
                  <Text style={styles.timelineTextDone}>Identity & KYC Documents Uploaded</Text>
                </View>
                <View style={styles.timelineItem}>
                  <Clock size={15} color="#D97706" />
                  <Text style={styles.timelineTextPending}>Admin Operations Approval (In Progress)</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.refreshStatusBtn}
                onPress={handleCheckStatus}
                disabled={isCheckingStatus}
                activeOpacity={0.8}
              >
                <RefreshCw size={14} color="#0D8846" />
                <Text style={styles.refreshStatusBtnText}>
                  {isCheckingStatus ? 'Checking...' : 'Check Approval Status'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : status === 'approved' ? (
          /* CASE 2: APPROVED */
          <View style={styles.statusSectionContainer}>
            <View style={styles.approvedStatusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.checkIconBox}>
                  <CheckCircle size={22} color="#0D8846" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.approvedStatusTitle}>Partner Account Active! 🎉</Text>
                  <Text style={styles.approvedStatusSub}>
                    Verified Professional • {maidProfile?.serviceArea || 'Partner Network'}
                  </Text>
                </View>
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedBadgeText}>APPROVED</Text>
                </View>
              </View>

              <Text style={styles.statusDescription}>
                Congratulations! Your profile has been approved by the Admin Operations team. You can now access your partner dashboard and start accepting service bookings.
              </Text>

              <TouchableOpacity
                style={styles.launchDashboardBtn}
                onPress={() => navigateTo('maid_home')}
                activeOpacity={0.88}
              >
                <Text style={styles.launchDashboardBtnText}>Open Partner Dashboard</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : status === 'rejected' ? (
          /* CASE 3: REJECTED */
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
                  {maidProfile?.rejectionReason || 'Please review your uploaded documents or details and re-submit for review.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.reapplyBtn}
                onPress={() => navigateTo('maid_registration_form', { isReapplication: true })}
                activeOpacity={0.88}
              >
                <Text style={styles.reapplyBtnText}>Re-Apply as Partner</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* CASE 4: DEFAULT UNREGISTERED SCREEN */
          <View style={styles.infoLayout}>
            {/* Hero Card */}
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
                    <Text style={styles.heroHighlight}>Partner with GC HOME+</Text>
                  </Text>
                  <Text style={styles.heroSub}>
                    Flexible hours, verified households, and direct bank transfers. Payouts are based on the agreement and understanding between the partner and GC HOME+.
                  </Text>
                </View>
              </View>

              {/* Quick Metrics Strip */}
              <View style={styles.heroMetricsStrip}>
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricVal}>Flexible</Text>
                  <Text style={styles.heroMetricLbl}>Choose Hours</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricVal}>Direct</Text>
                  <Text style={styles.heroMetricLbl}>Bank Transfers</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Text style={styles.heroMetricVal}>Verified</Text>
                  <Text style={styles.heroMetricLbl}>Safe Homes</Text>
                </View>
              </View>
            </View>

            {/* Key Benefits Card */}
            <View style={styles.perksCard}>
              <View style={styles.perksHeaderRow}>
                <Sparkles size={13} color="#0D8846" />
                <Text style={styles.perksHeading}>PROGRAM BENEFITS</Text>
              </View>
              <View style={styles.perksGrid}>
                <View style={styles.perkRow}>
                  <View style={styles.perkIconBox}>
                    <Calendar size={15} color="#0D8846" />
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Flexible Working Schedule</Text>
                    <Text style={styles.perkDesc}>Choose your own hours, days, and preferred service areas.</Text>
                  </View>
                </View>

                <View style={styles.perkRow}>
                  <View style={styles.perkIconBox}>
                    <CreditCard size={15} color="#0D8846" />
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Partner Payouts</Text>
                    <Text style={styles.perkDesc}>Payouts are based on the agreement and understanding between the partner and GC HOME+.</Text>
                  </View>
                </View>

                <View style={styles.perkRow}>
                  <View style={styles.perkIconBox}>
                    <ShieldCheck size={15} color="#0D8846" />
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Safe & Respectful Environment</Text>
                    <Text style={styles.perkDesc}>Safe work environment in verified residential communities.</Text>
                  </View>
                </View>

                <View style={styles.perkRow}>
                  <View style={styles.perkIconBox}>
                    <UserCheck size={15} color="#0D8846" />
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Dedicated Operations Support</Text>
                    <Text style={styles.perkDesc}>Direct guidance and verification from the GC HOME+ team.</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 4-Step Onboarding Strip */}
            <View style={styles.stepsStrip}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeNum}>1</Text>
                <Text style={styles.stepBadgeText}>Details</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeNum}>2</Text>
                <Text style={styles.stepBadgeText}>Docs</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeNum}>3</Text>
                <Text style={styles.stepBadgeText}>Admin Review</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeNum}>4</Text>
                <Text style={styles.stepBadgeText}>Start Jobs</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Fixed Bottom Bar ── */}
      {status !== 'pending' && status !== 'approved' && (
        <View style={styles.fixedBottomBar}>
          <View style={styles.fixedBottomLeft}>
            <Text style={styles.bottomBarTitle}>Partner Registration</Text>
            <Text style={styles.bottomBarSub}>5-Minute Online Form</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigateTo('maid_registration_form')}
            style={styles.mainApplyBtn}
            activeOpacity={0.88}
          >
            <Text style={styles.mainApplyBtnText}>Next</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCFA',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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

  /* Main Non-Scrolling Body */
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  infoLayout: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 8,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 8,
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
    paddingVertical: 3,
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
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2E23',
    lineHeight: 23,
  },
  heroHighlight: {
    color: '#0D8846',
  },
  heroSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FCFA',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#EBF5F0',
  },
  heroMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D8846',
  },
  heroMetricLbl: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },
  heroMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },

  /* Benefits Card */
  perksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    flex: 1,
    justifyContent: 'flex-start',
  },
  perksHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  perksHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F2E23',
    letterSpacing: 0.5,
  },
  perksGrid: {
    flex: 1,
    justifyContent: 'space-around',
    gap: 6,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTextBox: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F2E23',
  },
  perkDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 13,
  },

  /* 4-Step Strip */
  stepsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EBF5F0',
  },
  stepBadge: {
    alignItems: 'center',
    gap: 2,
  },
  stepBadgeNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0D8846',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#D1F2DF',
    marginHorizontal: 4,
    marginBottom: 12,
  },

  /* Fixed Bottom Bar */
  fixedBottomBar: {
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
  fixedBottomLeft: {
    gap: 2,
  },
  bottomBarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2E23',
  },
  bottomBarSub: {
    fontSize: 11,
    color: '#64748B',
  },
  mainApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D8846',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
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

  /* Status Cards */
  statusSectionContainer: {
    flex: 1,
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  timelineTextPending: {
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '700',
  },
  refreshStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1F2DF',
    marginTop: 4,
  },
  refreshStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8846',
  },

  /* Approved Card */
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

  /* Rejected Card */
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
});