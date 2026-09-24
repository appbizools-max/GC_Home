import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, MapPin } from 'lucide-react-native';

export const MyJobsScreen: React.FC = () => {
  const { bookings, maidProfile, navigateTo } = useAuth();
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');

  const maidId = maidProfile?.uid;
  const maidJobs = bookings.filter(
    b => maidId && b.assignedMaidId === maidId
  );

  const filtered = maidJobs.filter(j => {
    if (activeTab === 'assigned') {
      return ['maid_assigned', 'maid_accepted', 'partner_accepted', 'partner_en_route', 'partner_arrived', 'in_progress', 'cleaning_started'].includes(j.status);
    }
    return j.status === 'completed';
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>My Maid Job Ledger</Text>

      <View style={styles.tabBar}>
        {[
          { id: 'assigned', label: 'Active Jobs' },
          { id: 'completed', label: 'Completed Jobs' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              styles.tabBtn,
              activeTab === tab.id ? styles.tabBtnActive : styles.tabBtnInactive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id ? styles.tabTextActive : styles.tabTextInactive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Briefcase size={36} color="#94A3B8" style={{ alignSelf: 'center', marginBottom: 8, opacity: 0.5 }} />
          <Text style={styles.emptyText}>No {activeTab} jobs found.</Text>
        </View>
      ) : (
        <View style={styles.jobsList}>
          {filtered.map(job => (
            <TouchableOpacity
              key={job.bookingId}
              onPress={() => navigateTo('active_job', { booking: job })}
              style={styles.jobCard}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.bookingIdText}>{job.bookingId}</Text>
                <Text style={styles.payoutText}>Payout: ₹{Math.round(job.totalAmount * 0.8)}</Text>
              </View>
              <Text style={styles.serviceName}>{job.serviceName}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#2D8A68" />
                <Text style={styles.locationText}>{job.address.locality}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBtnInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#1E4E3D',
  },
  tabTextInactive: {
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
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
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D8A68',
  },
  payoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
});
