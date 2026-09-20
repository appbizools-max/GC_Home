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
import { useBooking } from '../../context/BookingContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  RotateCcw,
  Star,
  Sparkles,
} from 'lucide-react-native';

type BookingTabType = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export const MyBookingsScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { bookings, selectBookingForTracking } = useBooking();

  const [activeTab, setActiveTab] = useState<BookingTabType>('upcoming');

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'upcoming') {
      return b.currentStage === 'confirmed' || b.currentStage === 'assigned';
    }
    if (activeTab === 'ongoing') {
      return (
        b.currentStage === 'on_the_way' ||
        b.currentStage === 'arrived' ||
        b.currentStage === 'cleaning'
      );
    }
    if (activeTab === 'completed') {
      return b.currentStage === 'completed';
    }
    return false;
  });

  const handleTrackBooking = (bookingId: string) => {
    selectBookingForTracking(bookingId);
    navigateTo('booking-tracking');
  };

  const handleRateBooking = (bookingId: string) => {
    selectBookingForTracking(bookingId);
    navigateTo('rating-review');
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

        <View style={{ width: 36 }} />
      </View>

      {/* 4 Tabs: Upcoming, Ongoing, Completed, Cancelled */}
      <View style={styles.tabsRow}>
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'ongoing', label: 'Ongoing' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map(tab => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isSelected && styles.tabButtonSelected]}
              onPress={() => setActiveTab(tab.id as BookingTabType)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Calendar size={36} color="#168A68" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptySub}>
              You don't have any appointments in the {activeTab} section right now.
            </Text>
            <TouchableOpacity
              style={styles.bookCleaningBtn}
              onPress={() => navigateTo('services-listing')}
              activeOpacity={0.88}
            >
              <Text style={styles.bookCleaningBtnText}>Book a Cleaning Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {filteredBookings.map(item => (
              <View key={item.bookingId} style={styles.bookingCard}>
                {/* Header: ID, Badge, Amount */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.bookingIdText}>#{item.bookingId}</Text>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    <Text style={styles.homeSizeSubtitle}>{item.homeSize.label}</Text>
                  </View>
                  <Text style={styles.totalPrice}>₹ {item.totalAmount}</Text>
                </View>

                {/* Schedule & Location */}
                <View style={styles.detailsBox}>
                  <View style={styles.infoRow}>
                    <Calendar size={14} color="#168A68" />
                    <Text style={styles.infoText}>
                      {item.dateLabel} • {item.timeSlot}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MapPin size={14} color="#68788C" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.address.street}, {item.address.locality}
                    </Text>
                  </View>
                </View>

                {/* Cleaner Info if assigned */}
                {item.assignedPro && (
                  <View style={styles.proRow}>
                    <Image
                      source={resolveImageSource(item.assignedPro.photoUrl)}
                      style={styles.proThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proLabel}>ASSIGNED PROFESSIONAL</Text>
                      <Text style={styles.proName}>{item.assignedPro.name}</Text>
                    </View>
                    {item.startOtp && (
                      <View style={styles.otpBox}>
                        <Text style={styles.otpLabel}>START OTP</Text>
                        <Text style={styles.otpDigits}>{item.startOtp}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Actions Row */}
                <View style={styles.cardActions}>
                  {activeTab === 'completed' ? (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleRateBooking(item.bookingId)}
                      activeOpacity={0.8}
                    >
                      <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.actionBtnTextPrimary}>
                        {item.rating ? 'Edit Rating' : 'Rate Experience'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleTrackBooking(item.bookingId)}
                      activeOpacity={0.8}
                    >
                      <Navigation size={14} color="#FFFFFF" />
                      <Text style={styles.actionBtnTextPrimary}>Track Booking</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F5FCF8',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonSelected: {
    backgroundColor: '#0E5B47',
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#68788C',
  },
  tabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
  },
  emptySub: {
    fontSize: 12,
    color: '#68788C',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  bookCleaningBtn: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookCleaningBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingIdText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#168A68',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
    marginTop: 1,
  },
  homeSizeSubtitle: {
    fontSize: 11,
    color: '#68788C',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0E5B47',
  },
  detailsBox: {
    backgroundColor: '#F5FCF8',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 11.5,
    color: '#10243A',
    fontWeight: '600',
    flex: 1,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
  },
  proThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  proLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#68788C',
    letterSpacing: 0.5,
  },
  proName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10243A',
  },
  otpBox: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  otpDigits: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 8,
  },
  actionBtnPrimary: {
    backgroundColor: '#0E5B47',
    borderRadius: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnTextPrimary: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
