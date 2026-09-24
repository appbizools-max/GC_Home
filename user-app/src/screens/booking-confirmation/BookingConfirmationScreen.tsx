import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { AppLogo } from '../../components/ui/AppLogo';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Home,
  FileText,
} from 'lucide-react-native';

export const BookingConfirmationScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { activeBooking } = useBooking();

  const booking = activeBooking || {
    bookingId: 'GC-89421',
    serviceName: 'Home Cleaning',
    homeSize: { label: '1 BHK' },
    dateLabel: 'Today, 26 Apr',
    timeSlot: '4:00 PM – 6:00 PM',
    address: {
      street: '123, Collectorate Road, Mankammathota',
      locality: 'Clock Tower Area',
      city: 'Karimnagar',
      pincode: '505001',
    },
    totalAmount: 848,
    paymentStatus: 'paid',
  };

  return (
    <View style={styles.safeContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <AppLogo size="sm" showTagline={true} align="left" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Visual Graphic */}
        <View style={styles.successBadgeContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <CheckCircle2 size={46} color="#FFFFFF" strokeWidth={2.8} />
            </View>
          </View>
          <Text style={styles.successHeading}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>
            Your home cleaning has been scheduled successfully.
          </Text>
        </View>

        {/* Booking Reference Card */}
        <View style={styles.refCard}>
          <View style={styles.refHeaderRow}>
            <Text style={styles.refIdLabel}>Booking ID</Text>
            <Text style={styles.refIdValue}>{booking.bookingId}</Text>
          </View>

          <View style={styles.serviceBriefRow}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
          </View>

          <View style={styles.divider} />

          {/* Details Rows */}
          <View style={styles.infoRow}>
            <Calendar size={16} color="#168A68" />
            <Text style={styles.infoText}>
              Date: <Text style={styles.infoBold}>{booking.dateLabel}</Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color="#168A68" />
            <Text style={styles.infoText}>
              Time Slot: <Text style={styles.infoBold}>{booking.timeSlot}</Text>
            </Text>
          </View>

          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <MapPin size={16} color="#168A68" style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>
              Address:{' '}
              <Text style={styles.infoBold}>
                {booking.address.street}, {booking.address.locality}, {booking.address.city} - {booking.address.pincode}
              </Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <ShieldCheck size={16} color="#168A68" />
            <Text style={styles.infoText}>
              Amount Paid: <Text style={styles.priceBold}>₹ {booking.totalAmount}</Text>
            </Text>
          </View>
        </View>

        {/* Cleaner Assignment Status Banner */}
        <View style={styles.assignmentBanner}>
          <View style={styles.assignmentIconBox}>
            <UserCheck size={20} color="#0E5B47" />
          </View>
          <View style={styles.assignmentTextCol}>
            <Text style={styles.assignmentTitle}>Professional Assignment</Text>
            <Text style={styles.assignmentSub}>
              We are assigning a top-rated, background-verified cleaning professional for your slot.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigateTo('booking-tracking')}
          activeOpacity={0.88}
        >
          <Text style={styles.trackBtnText}>Track Booking</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigateTo('home')}
          activeOpacity={0.8}
        >
          <Home size={16} color="#0E5B47" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  successBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  outerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#168A68',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10243A',
  },
  successSub: {
    fontSize: 12.5,
    color: '#68788C',
    marginTop: 3,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  refCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginBottom: 14,
  },
  refHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refIdLabel: {
    fontSize: 11,
    color: '#68788C',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  refIdValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  serviceBriefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
  },
  homeSizeTag: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#168A68',
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E8E5',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#68788C',
  },
  infoBold: {
    fontWeight: '800',
    color: '#10243A',
  },
  priceBold: {
    fontWeight: '900',
    color: '#0E5B47',
  },
  assignmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EAF8F1',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  assignmentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentTextCol: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5B47',
  },
  assignmentSub: {
    fontSize: 11,
    color: '#168A68',
    marginTop: 2,
    lineHeight: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  trackBtn: {
    backgroundColor: '#0E5B47',
    borderRadius: 26,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  trackBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  homeBtn: {
    backgroundColor: '#F5FCF8',
    borderRadius: 26,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  homeBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
});
