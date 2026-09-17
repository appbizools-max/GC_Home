import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ToggleLeft, ToggleRight, DollarSign, Briefcase, Star, Clock, ChevronRight, MapPin } from 'lucide-react-native';

export const MaidHomeScreen: React.FC = () => {
  const { maidProfile, toggleMaidOnline, bookings, navigateTo } = useAuth();

  const isOnline = maidProfile?.isOnline ?? true;

  const assignedJobs = bookings.filter(b => b.assignedMaidId === maidProfile?.uid && ['maid_assigned', 'maid_accepted', 'in_progress'].includes(b.status));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerCard}>
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <Image
              source={{ uri: maidProfile?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' }}
              style={styles.profilePhoto}
            />
            <View>
              <Text style={styles.profileName}>{maidProfile?.fullName || 'Sunita Sharma'}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>4.8 ★ (56 Jobs)</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={toggleMaidOnline}
            style={[styles.toggleBtn, isOnline ? styles.toggleOnline : styles.toggleOffline]}
          >
            {isOnline ? <ToggleRight size={20} color="#15803D" /> : <ToggleLeft size={20} color="#991B1B" />}
            <Text style={[styles.toggleText, isOnline ? styles.toggleTextOnline : styles.toggleTextOffline]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.earningsStatCard]}>
          <View style={[styles.statIconBox, { backgroundColor: '#2D8A68' }]}>
            <DollarSign size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.statLabel}>THIS WEEK</Text>
            <Text style={styles.statValue}>₹4,250</Text>
          </View>
        </View>

        <View style={[styles.statCard, styles.jobsStatCard]}>
          <View style={[styles.statIconBox, { backgroundColor: '#0284C7' }]}>
            <Briefcase size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.statLabel, { color: '#0369A1' }]}>ACTIVE JOBS</Text>
            <Text style={[styles.statValue, { color: '#075985' }]}>{assignedJobs.length}</Text>
          </View>
        </View>
      </View>

      <View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Assigned Jobs Today</Text>
        </View>

        {assignedJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={32} color="#94A3B8" style={{ alignSelf: 'center', marginBottom: 8, opacity: 0.5 }} />
            <Text style={styles.emptyText}>No active jobs assigned right now.</Text>
            <Text style={styles.emptySubText}>
              Ensure your Online toggle is active to receive job assignments.
            </Text>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {assignedJobs.map(job => (
              <View key={job.bookingId} style={styles.jobCard}>
                <View style={styles.jobCardHeader}>
                  <View style={styles.serviceBadge}>
                    <Text style={styles.serviceBadgeText}>{job.serviceName}</Text>
                  </View>
                  <Text style={styles.payoutText}>Payout: ₹{Math.round(job.totalAmount * 0.8)}</Text>
                </View>

                <View style={styles.jobDetailsGroup}>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#2D8A68" />
                    <Text style={styles.addressText}>
                      <Text style={{ fontWeight: '700' }}>{job.address.locality}</Text> ({job.address.street})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color="#64748B" />
                    <Text style={styles.timeText}>{job.date} | {job.timeSlot}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigateTo('active_job', { booking: job })}
                  style={styles.openConsoleBtn}
                >
                  <Text style={styles.openConsoleBtnText}>Open Job Console</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  headerCard: {
    backgroundColor: '#1E4E3D',
    borderRadius: 16,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleOnline: {
    backgroundColor: '#DCFCE7',
  },
  toggleOffline: {
    backgroundColor: '#FEE2E2',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toggleTextOnline: {
    color: '#15803D',
  },
  toggleTextOffline: {
    color: '#991B1B',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  earningsStatCard: {
    backgroundColor: '#EBF8F2',
    borderColor: '#BBE9D2',
  },
  jobsStatCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D8A68',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptySubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  serviceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  payoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  jobDetailsGroup: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: '#334155',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  openConsoleBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  openConsoleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
