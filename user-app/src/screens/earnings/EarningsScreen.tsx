import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  CircleDollarSign,
  Building2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react-native';

export const EarningsScreen: React.FC = () => {
  const { bookings, maidProfile, navigateTo } = useAuth();

  const maidId = maidProfile?.uid;
  const completedJobs = bookings.filter(
    b => maidId && (b.assignedMaidId === maidId || b.assignedMaidName === maidProfile?.fullName) && b.status === 'completed'
  );

  const totalEarnings = completedJobs.reduce(
    (acc, curr) => acc + (curr.partnerPayout && curr.partnerPayout > 0 ? curr.partnerPayout : 0),
    0
  );

  const rawBankName = maidProfile?.bankDetails?.bankName || 'HDFC Bank';
  const rawAccNo = maidProfile?.bankDetails?.accountNumber || '258025802580369';

  // Strict Account Masking: Mask all but the last 4 digits
  const maskAccountNumber = (accStr: string) => {
    const digitsOnly = accStr.replace(/\D/g, '');
    if (digitsOnly.length >= 4) {
      return `A/C •••• ${digitsOnly.slice(-4)}`;
    }
    return 'A/C •••• 0369';
  };

  const maskedAccountDisplay = maskAccountNumber(rawAccNo);

  const getVerificationStatus = (): 'verified' | 'pending' | 'action_required' => {
    if (maidProfile?.status === 'approved' && maidProfile?.bankDetails?.accountNumber) {
      return 'pending';
    }
    if (maidProfile?.status === 'rejected') return 'action_required';
    return 'pending';
  };

  const verificationStatus = getVerificationStatus();

  const historyItems = completedJobs.map((j, idx) => ({
    id: j.bookingId || `TXN-${1000 + idx}`,
    service: j.serviceName || 'Home Cleaning Service',
    date: j.date || 'Sep 22, 2026',
    payout: j.partnerPayout && j.partnerPayout > 0 ? `₹${j.partnerPayout}` : 'Payout Pending',
    status: j.payoutStatus === 'disbursed' || j.payoutStatus === 'paid' ? 'Paid' : 'Processing',
    refCode: `REF-${89000 + idx}`,
  }));

  const handleAccountAction = () => {
    Alert.alert(
      'Payout Bank Account',
      `Bank: ${rawBankName}\nAccount: ${maskedAccountDisplay}\nStatus: ${
        verificationStatus === 'verified' ? 'Verified' : 'Verification Pending'
      }\n\nContact support to update your payout account details.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigateTo('maid_home')}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings & Payouts</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Compact Premium Earnings Summary Card */}
        <View style={styles.earningsSummaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryLabel}>TOTAL EARNINGS</Text>
            <TrendingUp size={16} color="#A7F3D0" />
          </View>

          <Text style={styles.dominantEarningsValue}>₹{totalEarnings.toLocaleString()}</Text>

          <View style={styles.cardDivider} />

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Jobs Completed</Text>
              <Text style={styles.metricValue}>{completedJobs.length} Jobs</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Payout Schedule</Text>
              <Text style={styles.metricValue}>Weekly Direct Transfer</Text>
            </View>
          </View>
        </View>

        {/* 2. Payout Bank Account Card */}
        <View style={styles.bankCard}>
          <View style={styles.bankCardTop}>
            <View style={styles.bankMetaInfo}>
              <View style={styles.bankIconCircle}>
                <Building2 size={18} color="#0E5B47" />
              </View>
              <View>
                <Text style={styles.bankCardLabel}>PAYOUT BANK ACCOUNT</Text>
                <Text style={styles.bankNameText}>{rawBankName}</Text>
                <Text style={styles.maskedAccText}>{maskedAccountDisplay}</Text>
              </View>
            </View>

            {/* Dynamic Status Chip */}
            {verificationStatus === 'verified' && (
              <View style={[styles.statusChip, styles.statusChipVerified]}>
                <CheckCircle2 size={12} color="#0E5B47" />
                <Text style={[styles.statusChipText, styles.statusChipTextVerified]}>Verified</Text>
              </View>
            )}

            {verificationStatus === 'pending' && (
              <View style={[styles.statusChip, styles.statusChipPending]}>
                <Clock size={12} color="#D97706" />
                <Text style={[styles.statusChipText, styles.statusChipTextPending]}>Pending Verification</Text>
              </View>
            )}

            {verificationStatus === 'action_required' && (
              <View style={[styles.statusChip, styles.statusChipError]}>
                <AlertCircle size={12} color="#DC2626" />
                <Text style={[styles.statusChipText, styles.statusChipTextError]}>Action required</Text>
              </View>
            )}
          </View>

          {/* Action Link */}
          <TouchableOpacity style={styles.viewAccountLink} onPress={handleAccountAction} activeOpacity={0.7}>
            <Text style={styles.viewAccountText}>View payout account →</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Recent Payouts History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Payouts</Text>

          {historyItems.length === 0 ? (
            /* Rich Empty State */
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <CircleDollarSign size={32} color="#64748B" />
              </View>
              <Text style={styles.emptyStateTitle}>No payouts yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete your first job to see your payout history here.
              </Text>
            </View>
          ) : (
            /* Populated Transaction Rows */
            <View style={styles.historyList}>
              {historyItems.map((item) => (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={styles.transLeft}>
                    <Text style={styles.transServiceTitle}>{item.service}</Text>
                    <Text style={styles.transSubInfo}>
                      {item.date} · {item.refCode}
                    </Text>
                  </View>

                  <View style={styles.transRight}>
                    <Text style={[styles.transAmountText, item.payout === 'Payout Pending' && { fontSize: 13, color: '#D97706' }]}>
                      {item.payout === 'Payout Pending' ? 'Payout Pending' : `+ ${item.payout}`}
                    </Text>
                    <View
                      style={[
                        styles.transStatusBadge,
                        item.status === 'Paid' ? styles.transStatusPaid : styles.transStatusProcessing,
                      ]}
                    >
                      <Text
                        style={[
                          styles.transStatusText,
                          item.status === 'Paid' ? styles.transStatusTextPaid : styles.transStatusTextProcessing,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  /* 1. Summary Card */
  earningsSummaryCard: {
    backgroundColor: '#0E5B47',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  dominantEarningsValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },

  /* 2. Bank Account Card */
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  bankCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankMetaInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  bankIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EAF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bankNameText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  maskedAccText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0E5B47',
    marginTop: 1,
  },

  /* Status Chips */
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusChipPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusChipTextPending: {
    color: '#B45309',
  },
  statusChipVerified: {
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusChipTextVerified: {
    color: '#0E5B47',
  },
  statusChipError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusChipTextError: {
    color: '#DC2626',
  },

  viewAccountLink: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  viewAccountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },

  /* 3. History Section */
  historySection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyStateSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  historyList: {
    gap: 10,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transLeft: {
    flex: 1,
    marginRight: 12,
  },
  transServiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  transSubInfo: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  transRight: {
    alignItems: 'flex-end',
  },
  transAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0E5B47',
  },
  transStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  transStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  transStatusPaid: {
    backgroundColor: '#EAF8F1',
  },
  transStatusTextPaid: {
    color: '#0E5B47',
  },
  transStatusProcessing: {
    backgroundColor: '#FFFBEB',
  },
  transStatusTextProcessing: {
    color: '#D97706',
  },
});

