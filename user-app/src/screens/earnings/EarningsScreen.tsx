import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export const EarningsScreen: React.FC = () => {
  const { bookings, maidProfile, navigateTo } = useAuth();

  const completedJobs = bookings.filter(b => b.assignedMaidId === maidProfile?.uid && b.status === 'completed');
  const totalEarnings = completedJobs.reduce((acc, curr) => acc + Math.round(curr.totalAmount * 0.8), 0) + 4250;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigateTo('maid_home')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Earnings & Payouts</Text>
      </View>

      <View style={styles.promoCard}>
        <Text style={styles.promoLabel}>TOTAL EARNINGS (THIS MONTH)</Text>
        <Text style={styles.totalValue}>₹{totalEarnings.toLocaleString()}</Text>

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statSubLabel}>Jobs Completed</Text>
            <Text style={styles.statSubVal}>{completedJobs.length + 18} Jobs</Text>
          </View>
          <View>
            <Text style={styles.statSubLabel}>Next Payout Date</Text>
            <Text style={styles.statSubVal}>Monday, 15 Sep</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View>
          <Text style={styles.bankLabel}>PAYOUT BANK ACCOUNT</Text>
          <Text style={styles.bankName}>State Bank of India</Text>
          <Text style={styles.bankAcc}>A/C: XXXX-XXXX-4829</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Per-Job Payout History</Text>
        <View style={styles.historyList}>
          {[
            { id: 'BK-9038', service: 'Basic Clean', date: '2026-09-07', payout: 399, status: 'paid' },
            { id: 'BK-9022', service: 'Deep Clean', date: '2026-09-05', payout: 1199, status: 'paid' },
            { id: 'BK-9011', service: 'Medium Clean', date: '2026-09-03', payout: 719, status: 'paid' },
            ...completedJobs.map(j => ({
              id: j.bookingId,
              service: j.serviceName,
              date: j.date,
              payout: Math.round(j.totalAmount * 0.8),
              status: 'processing'
            }))
          ].map((item, idx) => (
            <View key={idx} style={styles.historyCard}>
              <View>
                <Text style={styles.historyService}>{item.service}</Text>
                <Text style={styles.historySub}>{item.id} • {item.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.payoutText}>+₹{item.payout}</Text>
                <Text style={[
                  styles.statusText,
                  item.status === 'paid' ? styles.statusPaid : styles.statusProcessing
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
  promoCard: {
    backgroundColor: '#1E4E3D',
    borderRadius: 16,
    padding: 18,
  },
  promoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statSubLabel: {
    fontSize: 11,
    color: '#E2E8F0',
    opacity: 0.8,
  },
  statSubVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  cardRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  bankAcc: {
    fontSize: 12,
    color: '#2D8A68',
    fontWeight: '600',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyService: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  historySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  payoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  statusPaid: {
    color: '#166534',
  },
  statusProcessing: {
    color: '#D97706',
  },
});
