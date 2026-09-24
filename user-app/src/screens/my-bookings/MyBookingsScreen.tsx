import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { BookingCard } from '../../components/booking/BookingCard';
import { ArrowLeft, Calendar } from 'lucide-react-native';

type BookingTabType = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export const MyBookingsScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { bookings, selectBookingForTracking } = useBooking();

  const [activeTab, setActiveTab] = useState<BookingTabType>('upcoming');

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'upcoming') {
      return (
        b.currentStage === 'confirmed' ||
        b.currentStage === 'assigned' ||
        b.status === 'pending_assignment' ||
        b.status === 'partner_accepted'
      );
    }
    if (activeTab === 'ongoing') {
      return (
        b.currentStage === 'on_the_way' ||
        b.currentStage === 'arrived' ||
        b.currentStage === 'cleaning' ||
        b.status === 'partner_en_route' ||
        b.status === 'partner_arrived' ||
        b.status === 'in_progress'
      );
    }
    if (activeTab === 'completed') {
      return b.currentStage === 'completed' || b.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return b.status === 'cancelled';
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
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Bookings</Text>

        <View style={{ width: 36 }} />
      </View>

      {/* 4 Tabs: Upcoming, Ongoing, Completed, Cancelled */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRowContainer}
        >
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
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
              <BookingCard
                key={item.bookingId}
                bookingId={item.bookingId}
                serviceName={item.serviceName}
                secondaryService={item.serviceCategory}
                price={item.totalAmount}
                dateStr={item.date || item.createdAt}
                timeSlot={item.timeSlot}
                fullAddressText={item.address ? `${item.address.street || ''}, ${item.address.locality || ''}, ${item.address.city || ''}` : ''}
                locality={item.address?.locality}
                city={item.address?.city}
                status={item.status || item.currentStage}
                assignedPro={item.assignedPro ? { name: item.assignedPro.name, photoUrl: item.assignedPro.photoUrl } : undefined}
                startOtp={item.startOtp}
                rating={item.rating}
                onTrackBooking={() => handleTrackBooking(item.bookingId)}
                onRateBooking={() => handleRateBooking(item.bookingId)}
              />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
    letterSpacing: -0.3,
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    paddingVertical: 10,
  },
  tabsRowContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  tabButtonSelected: {
    backgroundColor: '#123D2A',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF1ED',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF5EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171A18',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  bookCleaningBtn: {
    backgroundColor: '#123D2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  bookCleaningBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bookingsList: {
    gap: 14,
  },
});
