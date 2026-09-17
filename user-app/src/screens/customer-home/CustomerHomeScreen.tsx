import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Sparkles,
  MapPin,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Clock,
  Navigation,
  Star,
  Check,
  DollarSign,
  Key,
  Receipt,
  HeartHandshake,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react-native';

export const CustomerHomeScreen: React.FC = () => {
  const { services, navigateTo, user, bookings } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const activeBooking = bookings.find(b =>
    b.status === 'maid_accepted' || b.status === 'in_progress' || b.status === 'pending_assignment'
  );

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Live Active Booking Toast Bar */}
      {activeBooking && (
        <TouchableOpacity
          style={styles.liveToastCard}
          onPress={() => navigateTo('booking_tracking', { booking: activeBooking })}
          activeOpacity={0.9}
        >
          <View style={styles.toastAccentBar} />
          <Image
            source={{
              uri: activeBooking.assignedMaidPhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
            }}
            style={styles.toastAvatar}
          />
          <View style={styles.toastInfo}>
            <View style={styles.toastTagRow}>
              <View style={styles.toastBadge}>
                <Text style={styles.toastBadgeText}>{activeBooking.bookingId}</Text>
              </View>
              <Text style={styles.toastMaidName}>
                {activeBooking.assignedMaidName || 'Assigning Maid...'}
              </Text>
            </View>
            <View style={styles.toastTimeRow}>
              <Clock size={12} color="#2D8A68" />
              <Text style={styles.toastTimeText}>
                {activeBooking.date || 'Today'} • {activeBooking.timeSlot || '10:00 AM'}
              </Text>
            </View>
          </View>
          <View style={styles.trackBtn}>
            <Text style={styles.trackBtnText}>Track</Text>
            <Navigation size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Location Banner & Greeting */}
      <View style={styles.locationBanner}>
        <View style={styles.locationLeft}>
          <MapPin size={18} color="#2D8A68" />
          <View>
            <Text style={styles.deliveringToLabel}>DELIVERING TO</Text>
            <Text style={styles.locationText}>Kondapur (Near Botanical Garden)</Text>
          </View>
        </View>
        {user?.maidApplicationStatus === 'none' && (
          <TouchableOpacity
            onPress={() => navigateTo('become_maid_info')}
            style={styles.earnButton}
          >
            <UserCheck size={14} color="#1E4E3D" />
            <Text style={styles.earnButtonText}>Earn with Us</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Promotional Coupon Banner (Stitch Mint Glow Gradient) */}
      <View style={styles.promoBanner}>
        <View style={styles.promoContent}>
          <View style={styles.guaranteeBadge}>
            <Sparkles size={12} color="#1E4E3D" />
            <Text style={styles.guaranteeBadgeText}>EXCLUSIVE WELCOME</Text>
          </View>
          <Text style={styles.promoTitle}>Get ₹300 OFF your first Deep Clean</Text>
          <View style={styles.couponRow}>
            <Text style={styles.couponLabel}>Use coupon code:</Text>
            <View style={styles.couponPill}>
              <Text style={styles.couponCode}>GCNEW</Text>
            </View>
          </View>
        </View>
        <Sparkles size={70} color="#FFFFFF" style={styles.sparklesBg} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="What would you like to clean today? (Basic, Deep Clean)..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      {/* Curated Cleaning Tiers Grid */}
      <View style={styles.serviceSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Curated Cleaning Tiers</Text>
            <Text style={styles.sectionSub}>Hospitality-grade care tailored for your space</Text>
          </View>
          <Text style={styles.serviceCount}>{filteredServices.length} Tiers</Text>
        </View>

        <View style={styles.serviceList}>
          {filteredServices.map(service => (
            <TouchableOpacity
              key={service.serviceId}
              onPress={() => navigateTo('service_details', { service })}
              style={styles.serviceCard}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: service.imageUrl }}
                style={styles.serviceImage}
              />
              <View style={styles.serviceInfo}>
                <View>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{service.estimatedDuration}</Text>
                    </View>
                  </View>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={styles.startsFromLabel}>STARTS FROM</Text>
                    <Text style={styles.priceText}>₹{service.startingPrice}</Text>
                  </View>
                  <View style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Book Now</Text>
                    <ChevronRight size={14} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>



      {/* Customer Review Social Proof Card */}
      <View style={styles.reviewCard}>
        <View style={styles.reviewAvatarCol}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            }}
            style={styles.reviewAvatar}
          />
          <View style={styles.reviewStarBadge}>
            <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
        <View style={styles.reviewTextCol}>
          <View style={styles.reviewHeaderRow}>
            <Text style={styles.reviewScore}>4.9/5 Service Delight</Text>
            <View style={styles.cleansChip}>
              <Text style={styles.cleansChipText}>1,240+ Cleans</Text>
            </View>
          </View>
          <Text style={styles.reviewBody}>
            "Anita reached Kondapur on dot time. Spotless kitchen tiles without harsh chemical fumes!" — Sneha K.
          </Text>
        </View>
      </View>

      {/* Empowerment Hub Card */}
      <TouchableOpacity
        style={styles.empowermentCard}
        onPress={() => navigateTo('become_maid_info')}
        activeOpacity={0.9}
      >
        <View style={styles.empowermentTag}>
          <HeartHandshake size={12} color="#1E4E3D" />
          <Text style={styles.empowermentTagText}>EMPOWERMENT HUB</Text>
        </View>
        <Text style={styles.empowermentTitle}>Become a Maid Partner</Text>
        <Text style={styles.empowermentSub}>
          Earn up to <Text style={styles.boldText}>₹25,000 / month</Text> with guaranteed safety, flexible hours, and health cover.
        </Text>
        <View style={styles.applyBtnPill}>
          <Text style={styles.applyBtnPillText}>Apply in 2 Mins</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
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
    gap: 14,
    paddingBottom: 32,
  },
  liveToastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  toastAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#2D8A68',
  },
  toastAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 6,
  },
  toastInfo: {
    flex: 1,
    marginLeft: 10,
  },
  toastTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toastBadge: {
    backgroundColor: '#EBF8F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toastBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  toastMaidName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  toastTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  toastTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  trackBtn: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveringToLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  earnButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF8F2',
    borderWidth: 1,
    borderColor: '#BBE9D2',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  promoBanner: {
    backgroundColor: '#1E4E3D',
    borderRadius: 16,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  promoContent: {
    maxWidth: '85%',
  },
  guaranteeBadge: {
    backgroundColor: '#BBE9D2',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guaranteeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4E3D',
    textTransform: 'uppercase',
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  couponLabel: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  couponPill: {
    backgroundColor: '#2D8A68',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  couponCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sparklesBg: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    opacity: 0.15,
  },
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 38,
    paddingRight: 14,
    fontSize: 13,
    color: '#0F172A',
  },
  serviceSection: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  serviceCount: {
    fontSize: 12,
    color: '#2D8A68',
    fontWeight: '700',
  },
  serviceList: {
    gap: 14,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  durationBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  startsFromLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D8A68',
  },
  viewButton: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bentoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bentoSub: {
    fontSize: 11,
    color: '#64748B',
  },
  bentoGrid: {
    gap: 10,
    marginTop: 4,
  },
  bentoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bentoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EBF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  bentoCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatarCol: {
    position: 'relative',
  },
  reviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  reviewStarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2D8A68',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTextCol: {
    flex: 1,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cleansChip: {
    backgroundColor: '#EBF8F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cleansChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D8A68',
  },
  reviewBody: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  empowermentCard: {
    backgroundColor: '#EBF8F2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBE9D2',
    gap: 6,
  },
  empowermentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  empowermentTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  empowermentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  empowermentSub: {
    fontSize: 12,
    color: '#2D8A68',
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '800',
    color: '#1E4E3D',
  },
  applyBtnPill: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  applyBtnPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
