import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Clock,
  Navigation,
  Star,
  Plus,
  ArrowRight,
  Shield,
  HeartHandshake,
  SlidersHorizontal,
  Home,
  Droplets,
  CheckCircle2,
  Broom,
} from 'lucide-react-native';
import { Service } from '../../types';

const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: Sparkles },
  { id: 'standard', label: 'Basic & Regular', icon: Home },
  { id: 'premium', label: 'Deep Cleaning', icon: Droplets },
  { id: 'specialized', label: 'Kitchen & Bath', icon: Broom },
];

export const CustomerHomeScreen: React.FC = () => {
  const { services, navigateTo, user, bookings } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const activeBooking = bookings.find(
    b => b.status === 'maid_accepted' || b.status === 'in_progress' || b.status === 'pending_assignment'
  );

  const filteredServices = services.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'standard') return s.category.toLowerCase() === 'standard';
    if (selectedCategory === 'premium') return s.category.toLowerCase() === 'premium';
    if (selectedCategory === 'specialized') return s.category.toLowerCase() === 'specialized';
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* ── Modern Urban Company Style Top Header ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.locationPinBox}>
            <MapPin size={18} color="#1E4E3D" />
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.addressContainer}>
            <View style={styles.addressTitleRow}>
              <Text style={styles.addressTitle}>Kondapur, Hyderabad</Text>
              <ChevronDown size={16} color="#1E293B" />
            </View>
            <Text style={styles.addressSubtitle} numberOfLines={1}>
              Flat 402, Green Glen Layout • 15 mins away
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {user?.maidApplicationStatus === 'none' && (
            <TouchableOpacity
              onPress={() => navigateTo('become_maid_info')}
              style={styles.earnBadge}
              activeOpacity={0.8}
            >
              <UserCheck size={13} color="#1E4E3D" />
              <Text style={styles.earnBadgeText}>Earn</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigateTo('user_profile')}
            style={styles.profileAvatarButton}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri:
                  user?.profilePhoto ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.profileAvatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrapper}>
        <Search size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search 'Deep Clean', 'Bathroom', 'Kitchen'..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.filterPill}>
            <SlidersHorizontal size={14} color="#1E4E3D" />
          </View>
        )}
      </View>

      {/* ── Live Active Booking Bar (Floating Toast) ── */}
      {activeBooking && (
        <TouchableOpacity
          style={styles.liveToastCard}
          onPress={() => navigateTo('booking_tracking', { booking: activeBooking })}
          activeOpacity={0.9}
        >
          <View style={styles.toastAccentBar} />
          <Image
            source={{
              uri:
                activeBooking.assignedMaidPhoto ||
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
            }}
            style={styles.toastAvatar}
          />
          <View style={styles.toastInfo}>
            <View style={styles.toastTagRow}>
              <View style={styles.toastBadge}>
                <Text style={styles.toastBadgeText}>{activeBooking.bookingId}</Text>
              </View>
              <Text style={styles.toastMaidName}>
                {activeBooking.assignedMaidName || 'Assigning Maid Partner...'}
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

      {/* ── Quick Category Horizontal Chips ── */}
      <View style={styles.categoryChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsList}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                activeOpacity={0.8}
              >
                <IconComp size={13} color={isSelected ? '#FFFFFF' : '#1E4E3D'} />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Promotional Hero Banner ── */}
      <View style={styles.promoHeroCard}>
        <View style={styles.promoLeft}>
          <View style={styles.promoTag}>
            <Sparkles size={11} color="#1E4E3D" />
            <Text style={styles.promoTagText}>NEW CUSTOMER SPECIAL</Text>
          </View>
          <Text style={styles.promoTitle}>₹300 OFF On First Clean</Text>
          <Text style={styles.promoSubtitle}>Hospitality-grade vetted cleaners</Text>
          <View style={styles.couponPillRow}>
            <Text style={styles.couponPrefix}>Use code:</Text>
            <View style={styles.couponTag}>
              <Text style={styles.couponCodeText}>GCNEW</Text>
            </View>
          </View>
        </View>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
          }}
          style={styles.promoImage}
        />
      </View>

      {/* ── 2-Column Grid: Cleaning Services ── */}
      <View style={styles.servicesHeaderRow}>
        <View>
          <Text style={styles.servicesSectionTitle}>Most Booked Services</Text>
          <Text style={styles.servicesSectionSub}>Instant booking with certified maid partners</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigateTo('services_listing')}
          style={styles.viewAllButton}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={14} color="#1E4E3D" />
        </TouchableOpacity>
      </View>

      <View style={styles.twoColumnGrid}>
        {filteredServices.map(service => (
          <TouchableOpacity
            key={service.serviceId}
            onPress={() => navigateTo('service_details', { service })}
            style={styles.gridCard}
            activeOpacity={0.88}
          >
            <View style={styles.gridCardInner}>
              {/* Service Image with Rating Overlay */}
              <View style={styles.gridImageWrapper}>
                <Image source={{ uri: service.imageUrl }} style={styles.gridImage} />
                <View style={styles.gridRatingBadge}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.gridRatingText}>4.9</Text>
                </View>
              </View>

              {/* Service Details */}
              <View style={styles.gridContent}>
                <Text style={styles.gridDurationText}>⏱ {service.estimatedDuration}</Text>
                <Text style={styles.gridServiceName} numberOfLines={1}>
                  {service.name}
                </Text>
                <Text style={styles.gridServiceDesc} numberOfLines={2}>
                  {service.description}
                </Text>

                {/* Price & Book Action */}
                <View style={styles.gridFooter}>
                  <View>
                    <Text style={styles.gridStartsFrom}>Starts from</Text>
                    <Text style={styles.gridPrice}>₹{service.startingPrice}</Text>
                  </View>

                  <View style={styles.gridAddButton}>
                    <Text style={styles.gridAddButtonText}>BOOK</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Partner Recruitment Banner ── */}
      {user?.maidApplicationStatus === 'none' && (
        <TouchableOpacity
          style={styles.empowermentCard}
          onPress={() => navigateTo('become_maid_info')}
          activeOpacity={0.9}
        >
          <View style={styles.empowermentTopRow}>
            <View style={styles.empowermentTag}>
              <HeartHandshake size={12} color="#166534" />
              <Text style={styles.empowermentTagText}>PARTNER RECRUITMENT</Text>
            </View>
            <View style={styles.zeroFeePill}>
              <Text style={styles.zeroFeePillText}>100% FREE JOINING</Text>
            </View>
          </View>

          <Text style={styles.empowermentTitle}>Become a Verified Maid Partner</Text>
          <Text style={styles.empowermentSub}>
            Earn up to <Text style={styles.boldText}>₹35,000 / month</Text> with guaranteed weekly Monday payouts, flexible hours, and ₹3L health insurance.
          </Text>

          <View style={styles.empowermentBottomRow}>
            <View style={styles.partnerAvatarsCluster}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
                }}
                style={[styles.clusterAvatar, { zIndex: 3 }]}
              />
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
                }}
                style={[styles.clusterAvatar, { marginLeft: -12, zIndex: 2 }]}
              />
              <Text style={styles.clusterLabel}>Join 5,000+ Partners</Text>
            </View>

            <View style={styles.applyBtnPill}>
              <Text style={styles.applyBtnPillText}>Apply Now</Text>
              <ArrowRight size={13} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Customer Social Proof & Rating Strip ── */}
      <View style={styles.socialProofCard}>
        <View style={styles.socialProofHeader}>
          <View style={styles.starsCluster}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={13} color="#FBBF24" fill="#FBBF24" />
            ))}
          </View>
          <Text style={styles.socialProofScore}>4.92 / 5.0</Text>
          <Text style={styles.socialProofSub}>• 24,000+ Cleaned Homes</Text>
        </View>
        <Text style={styles.socialProofQuote}>
          "The maid arrived on time in complete uniform with sanitized eco-chemicals. Our kitchen grease was 100% gone. Best home service in Hyderabad!"
        </Text>
        <Text style={styles.socialProofAuthor}>— Shweta K., Resident at My Home Bhooja</Text>
      </View>

      {/* ── Trust & Quality Shield Reassurance Strip ── */}
      <View style={styles.trustShieldCard}>
        <View style={styles.trustItem}>
          <ShieldCheck size={18} color="#1E4E3D" />
          <View>
            <Text style={styles.trustHeading}>100% Verified</Text>
            <Text style={styles.trustSub}>Background checked</Text>
          </View>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Sparkles size={18} color="#1E4E3D" />
          <View>
            <Text style={styles.trustHeading}>Eco Chemicals</Text>
            <Text style={styles.trustSub}>Safe & non-toxic</Text>
          </View>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <CheckCircle2 size={18} color="#1E4E3D" />
          <View>
            <Text style={styles.trustHeading}>Free Re-clean</Text>
            <Text style={styles.trustSub}>24h guarantee</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationPinBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addressContainer: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addressSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earnBadge: {
    backgroundColor: '#E6F4EA',
    borderColor: '#BBE9D2',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  profileAvatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#2D8A68',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },

  /* Search */
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 42,
    paddingRight: 44,
    fontSize: 13,
    color: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPill: {
    position: 'absolute',
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
  },

  /* Active Booking Toast */
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
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  toastAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2D8A68',
  },
  toastAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Category Chips */
  categoryChipsContainer: {
    marginHorizontal: -16,
  },
  categoryChipsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#1E4E3D',
    borderColor: '#1E4E3D',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  /* Promo Banner */
  promoHeroCard: {
    backgroundColor: '#1E4E3D',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  promoLeft: {
    flex: 1,
    paddingRight: 10,
  },
  promoTag: {
    backgroundColor: '#BBE9D2',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  promoTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E4E3D',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  promoSubtitle: {
    fontSize: 11,
    color: '#D1E7DD',
    marginTop: 2,
  },
  couponPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  couponPrefix: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  couponTag: {
    backgroundColor: '#2D8A68',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  couponCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  promoImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },

  /* Trust Shield Reassurance Strip */
  trustShieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  trustHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  trustSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  trustDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },

  /* 2-Column Grid Section */
  servicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  servicesSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  servicesSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridCard: {
    width: '50%',
    padding: 5,
  },
  gridCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  gridImageWrapper: {
    height: 110,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridRatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridRatingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gridContent: {
    padding: 10,
    gap: 2,
  },
  gridDurationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  gridServiceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridServiceDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 6,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  gridStartsFrom: {
    fontSize: 9,
    color: '#94A3B8',
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  gridAddButton: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gridAddButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Empowerment Partner Hub */
  empowermentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    gap: 8,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  empowermentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empowermentTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  empowermentTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#166534',
  },
  zeroFeePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  zeroFeePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  empowermentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  empowermentSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: '#1E4E3D',
  },
  empowermentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  partnerAvatarsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clusterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 8,
  },
  applyBtnPill: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applyBtnPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Social Proof & Reviews */
  socialProofCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  socialProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsCluster: {
    flexDirection: 'row',
    gap: 2,
  },
  socialProofScore: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  socialProofSub: {
    fontSize: 11,
    color: '#64748B',
  },
  socialProofQuote: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 17,
    fontStyle: 'italic',
  },
  socialProofAuthor: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E4E3D',
  },
});
