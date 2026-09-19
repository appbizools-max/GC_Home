import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Navigation,
} from 'lucide-react-native';
import { Booking, BookingStatus } from '../../types';

export const MyBookingsScreen: React.FC = () => {
  const { bookings, user, navigateTo, goBack } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Filter bookings belonging to customer (or demo customer)
  const customerBookings = bookings.filter(
    b => b.customerId === user?.uid || user?.role === 'customer'
  );

  const filtered = customerBookings.filter(b => {
    if (filter === 'active') {
      return ['pending_assignment', 'maid_assigned', 'maid_accepted', 'in_progress'].includes(
        b.status
      );
    }
    if (filter === 'completed') {
      return b.status === 'completed';
    }
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending_assignment':
        return { label: 'Pending Assignment', bg: '#FEF3C7', color: '#92400E' };
      case 'maid_assigned':
        return { label: 'Maid Assigned', bg: '#E0F2FE', color: '#075985' };
      case 'maid_accepted':
        return { label: 'Maid Confirmed', bg: '#DCFCE7', color: '#166534' };
      case 'in_progress':
        return { label: 'In Progress', bg: '#F3E8FF', color: '#6B21A8' };
      case 'completed':
        return { label: 'Completed', bg: '#DCFCE7', color: '#15803D' };
      case 'cancelled':
        return { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' };
      default:
        return { label: status, bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>Track appointment history & live progress</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Filter Tabs ── */}
        <View style={styles.tabRow}>
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
          ].map(tab => {
            const isSelected = filter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Bookings List ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={42} color="#94A3B8" style={{ marginBottom: 12, opacity: 0.6 }} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any {filter === 'all' ? '' : filter} service appointments yet.
            </Text>
            <TouchableOpacity
              onPress={() => navigateTo('services_listing')}
              style={styles.browseButton}
              activeOpacity={0.85}
            >
              <Text style={styles.browseButtonText}>Browse Cleaning Packages</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {filtered.map(booking => {
              const badge = getStatusBadge(booking.status);
              const isActive = [
                'pending_assignment',
                'maid_assigned',
                'maid_accepted',
                'in_progress',
              ].includes(booking.status);

              return (
                <View key={booking.bookingId} style={styles.bookingCard}>
                  {/* Card Header: ID, Date, Status */}
                  <View style={styles.cardHeader}>
                    <View>
                      <View style={styles.idRow}>
                        <Text style={styles.bookingId}>{booking.bookingId}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.serviceName}>{booking.serviceName}</Text>
                    </View>
                    <Text style={styles.totalPrice}>₹{booking.totalAmount}</Text>
                  </View>

                  {/* Date & Location Details */}
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Calendar size={14} color="#2D8A68" />
                      <Text style={styles.detailText}>
                        {booking.date} • {booking.timeSlot}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MapPin size={14} color="#64748B" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {booking.address.street}, {booking.address.locality}
                      </Text>
                    </View>
                  </View>

                  {/* Assigned Maid Partner Section */}
                  {booking.assignedMaidName && (
                    <View style={styles.maidPartnerRow}>
                      <Image
                        source={{
                          uri:
                            booking.assignedMaidPhoto ||
                            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
                        }}
                        style={styles.maidAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.maidLabel}>ASSIGNED MAID PARTNER</Text>
                        <Text style={styles.maidName}>{booking.assignedMaidName}</Text>
                      </View>
                      {booking.startOtp && (
                        <View style={styles.otpBox}>
                          <Text style={styles.otpLabel}>START OTP</Text>
                          <Text style={styles.otpCode}>{booking.startOtp}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => navigateTo('booking_tracking', { booking })}
                      style={styles.trackButton}
                      activeOpacity={0.8}
                    >
                      <Navigation size={14} color="#FFFFFF" />
                      <Text style={styles.trackButtonText}>
                        {isActive ? 'Track Live Progress' : 'View Full Details'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1E4E3D',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  browseButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookingsList: {
    gap: 14,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D8A68',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  maidPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  maidAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  maidLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  maidName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  otpBox: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  otpCode: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E4E3D',
    letterSpacing: 1,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  trackButton: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
