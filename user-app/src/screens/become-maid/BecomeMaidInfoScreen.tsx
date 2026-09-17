import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  UserCheck,
  ShieldCheck,
  DollarSign,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Sliders,
  Check,
} from 'lucide-react-native';

export const BecomeMaidInfoScreen: React.FC = () => {
  const { navigateTo, user, maidProfile, simulateAdminApproval } = useAuth();
  const status = user?.maidApplicationStatus || 'none';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigateTo('customer_home')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maid Partner Portal</Text>
      </View>

      {/* STATUS CONDITIONALS */}

      {/* 1. PENDING STATUS */}
      {status === 'pending' && (
        <View style={styles.statusSectionContainer}>
          <View style={styles.pendingStatusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.clockIconBox}>
                <Clock size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingStatusTitle}>Application Under Admin Review</Text>
                <Text style={styles.pendingStatusSub}>Submitted on {maidProfile?.appliedAt || 'Today'}</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>PENDING</Text>
              </View>
            </View>

            <Text style={styles.statusDescription}>
              Your partner application is being verified by our Safety Operations team. Background check and DigiLocker UIDAI verification are underway.
            </Text>

            {/* Timeline Progress */}
            <View style={styles.timelineBox}>
              <View style={styles.timelineItem}>
                <CheckCircle size={16} color="#2D8A68" />
                <Text style={styles.timelineTextDone}>Personal & Hub Details Submitted</Text>
              </View>
              <View style={styles.timelineItem}>
                <CheckCircle size={16} color="#2D8A68" />
                <Text style={styles.timelineTextDone}>DigiLocker Identity Verified</Text>
              </View>
              <View style={styles.timelineItem}>
                <Clock size={16} color="#D97706" />
                <Text style={styles.timelineTextPending}>Admin Panel Verification (In Progress)</Text>
              </View>
            </View>
          </View>

          {/* SIMULATE ADMIN PANEL ACTION BOX */}
          <View style={styles.adminSimCard}>
            <View style={styles.adminSimHeader}>
              <Sliders size={18} color="#1E4E3D" />
              <Text style={styles.adminSimTitle}>Admin Panel Simulation</Text>
            </View>
            <Text style={styles.adminSimDesc}>
              Test end-to-end admin approval workflow. Approve or reject this pending application to update partner access role.
            </Text>
            <View style={styles.adminBtnRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => {
                  simulateAdminApproval(true);
                  Alert.alert('Admin Approved', 'Partner application approved! Maid Dashboard unlocked.');
                }}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Approve Application</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => {
                  simulateAdminApproval(false, 'Aadhaar document image was blurry. Please re-upload clear photos.');
                  Alert.alert('Admin Rejected', 'Partner application updated to rejected state.');
                }}
              >
                <XCircle size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Reject Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 2. APPROVED STATUS */}
      {status === 'approved' && (
        <View style={styles.statusSectionContainer}>
          <View style={styles.approvedStatusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.checkIconBox}>
                <CheckCircle size={28} color="#2D8A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.approvedStatusTitle}>Application Approved! 🎉</Text>
                <Text style={styles.approvedStatusSub}>Active Partner • {maidProfile?.serviceArea}</Text>
              </View>
              <View style={styles.approvedBadge}>
                <Text style={styles.approvedBadgeText}>APPROVED</Text>
              </View>
            </View>

            <Text style={styles.statusDescription}>
              Congratulations! Your GC Home+ maid partner account is fully verified and active. You can now toggle online status and accept local home service jobs.
            </Text>

            <TouchableOpacity
              style={styles.launchDashboardBtn}
              onPress={() => navigateTo('maid_home')}
            >
              <Text style={styles.launchDashboardBtnText}>Go to Maid Dashboard</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. REJECTED STATUS */}
      {status === 'rejected' && (
        <View style={styles.statusSectionContainer}>
          <View style={styles.rejectedStatusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.rejectIconBox}>
                <ShieldAlert size={28} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectedStatusTitle}>Application Requires Revision</Text>
                <Text style={styles.rejectedStatusSub}>Admin Feedback Provided</Text>
              </View>
              <View style={styles.rejectedBadge}>
                <Text style={styles.rejectedBadgeText}>ACTION REQ</Text>
              </View>
            </View>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>Reason from Admin Ops:</Text>
              <Text style={styles.reasonText}>
                {maidProfile?.rejectionReason || 'Identity verification document was unreadable. Please re-upload.'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.reapplyBtn}
              onPress={() => navigateTo('maid_registration_form')}
            >
              <Text style={styles.reapplyBtnText}>Edit Application & Re-submit</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. NONE / DEFAULT INITIAL REGISTRATION INTRO */}
      {status === 'none' && (
        <>
          <View style={styles.promoBox}>
            <UserCheck size={48} color="#FFFFFF" style={styles.promoIcon} />
            <Text style={styles.promoTitle}>Earn up to ₹30,000 / month</Text>
            <Text style={styles.promoSub}>
              Flexible working hours, direct weekly bank payouts, and complete health insurance coverage.
            </Text>
          </View>

          <View style={styles.benefitsList}>
            {[
              {
                icon: DollarSign,
                title: 'Weekly Direct Bank Payouts',
                desc: 'Get paid guaranteed every Monday directly to your bank account.',
              },
              {
                icon: Calendar,
                title: 'Choose Your Own Hours',
                desc: 'Work full-time or part-time in your preferred locality radius.',
              },
              {
                icon: ShieldCheck,
                title: 'Health & Safety First',
                desc: 'Safety protocols, health declarations, and free eco-friendly cleaning kits.',
              },
            ].map((b, idx) => {
              const IconComponent = b.icon;
              return (
                <View key={idx} style={styles.benefitCard}>
                  <View style={styles.iconCircle}>
                    <IconComponent size={24} color="#2D8A68" />
                  </View>
                  <View style={styles.benefitTextGroup}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => navigateTo('maid_registration_form')}
            style={styles.applyBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>Fill 5-Step Maid Application</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </>
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
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusSectionContainer: {
    gap: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
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
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  statusDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  timelineBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTextDone: {
    fontSize: 12,
    color: '#1E4E3D',
    fontWeight: '600',
  },
  timelineTextPending: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
  adminSimCard: {
    backgroundColor: '#EBF8F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBE9D2',
    gap: 10,
  },
  adminSimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminSimTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  adminSimDesc: {
    fontSize: 12,
    color: '#2D8A68',
    lineHeight: 16,
  },
  adminBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2D8A68',
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  approvedStatusCard: {
    backgroundColor: '#EBF8F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBE9D2',
    gap: 12,
  },
  checkIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedStatusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  approvedStatusSub: {
    fontSize: 11,
    color: '#2D8A68',
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  approvedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  launchDashboardBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  launchDashboardBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectedStatusCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 12,
  },
  rejectIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedStatusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
  },
  rejectedStatusSub: {
    fontSize: 11,
    color: '#DC2626',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rejectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
  },
  reasonBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 2,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  reasonText: {
    fontSize: 12,
    color: '#7F1D1D',
  },
  reapplyBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  reapplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promoBox: {
    backgroundColor: '#1E4E3D',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  promoIcon: {
    alignSelf: 'center',
    marginBottom: 10,
    opacity: 0.9,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  promoSub: {
    fontSize: 13,
    color: '#E2E8F0',
    opacity: 0.9,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTextGroup: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
