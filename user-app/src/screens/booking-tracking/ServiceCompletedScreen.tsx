import React from 'react';
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
  CheckCircle2,
  Star,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Receipt,
} from 'lucide-react-native';

export const ServiceCompletedScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { activeBooking } = useBooking();

  const booking = activeBooking;
  const pro = booking?.assignedPro;

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <AppLogo size="sm" showTagline={true} align="left" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header Box */}
        <View style={styles.successBox}>
          <View style={styles.iconCircle}>
            <Sparkles size={32} color="#168A68" />
          </View>
          <Text style={styles.completedTitle}>Cleaning Completed!</Text>
          <Text style={styles.completedSub}>
            Your home has been professionally cleaned and sanitized.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Overview</Text>

          <View style={styles.serviceRow}>
            <Text style={styles.serviceLabel}>Service</Text>
            <Text style={styles.serviceValue}>
              {booking?.serviceName || 'Home Cleaning'}
            </Text>
          </View>

          <View style={styles.serviceRow}>
            <Text style={styles.serviceLabel}>Scheduled Time</Text>
            <Text style={styles.serviceValue}>
              {booking?.dateLabel || 'Today'}, {booking?.timeSlot}
            </Text>
          </View>

          <View style={styles.serviceRow}>
            <Text style={styles.serviceLabel}>Final Amount</Text>
            <Text style={styles.priceValue}>₹ {booking?.totalAmount || 848}</Text>
          </View>

          {pro && (
            <View style={styles.cleanerRow}>
              <Image source={resolveImageSource(pro.photoUrl)} style={styles.cleanerPhoto} />
              <View>
                <Text style={styles.cleanerName}>Cleaned by {pro.name}</Text>
                <Text style={styles.cleanerTag}>Verified Professional Partner</Text>
              </View>
            </View>
          )}
        </View>

        {/* Eco Guarantee Banner */}
        <View style={styles.guaranteeBanner}>
          <CheckCircle2 size={18} color="#168A68" />
          <Text style={styles.guaranteeText}>
            100% Genuine Care Guarantee: Eco-friendly products used.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.rateBtn}
          onPress={() => navigateTo('rating-review')}
          activeOpacity={0.88}
        >
          <Star size={18} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.rateBtnText}>Rate Your Experience</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigateTo('home')}
          activeOpacity={0.8}
        >
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
    paddingTop: 12,
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
  successBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10243A',
  },
  completedSub: {
    fontSize: 12.5,
    color: '#68788C',
    marginTop: 3,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10243A',
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8E5',
  },
  serviceLabel: {
    fontSize: 12,
    color: '#68788C',
  },
  serviceValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10243A',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0E5B47',
  },
  cleanerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 8,
  },
  cleanerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  cleanerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  cleanerTag: {
    fontSize: 11,
    color: '#168A68',
    fontWeight: '600',
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  guaranteeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#0E5B47',
    fontWeight: '700',
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
  rateBtn: {
    backgroundColor: '#0E5B47',
    borderRadius: 26,
    paddingVertical: 14,
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
  rateBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  homeBtn: {
    backgroundColor: '#F5FCF8',
    borderRadius: 26,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  homeBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
});
