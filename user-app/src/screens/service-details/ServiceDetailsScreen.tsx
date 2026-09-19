import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  Droplets,
  ArrowRight,
  Share2,
  Check,
  Wrench,
  Sparkles,
} from 'lucide-react-native';
import { Service } from '../../types';

interface BhkOption {
  id: string;
  label: string;
  rooms: number;
  multiplier: number;
  duration: string;
  summary: string;
}

const BHK_OPTIONS: BhkOption[] = [
  {
    id: '1bhk',
    label: '1 BHK',
    rooms: 1,
    multiplier: 1.0,
    duration: '1.5 - 2 hrs',
    summary: '1 Living Room • 1 Bedroom • 1 Kitchen • 1 Bathroom',
  },
  {
    id: '2bhk',
    label: '2 BHK',
    rooms: 2,
    multiplier: 1.3,
    duration: '2.5 - 3 hrs',
    summary: '1 Living Room • 2 Bedrooms • 1 Kitchen • 2 Bathrooms',
  },
  {
    id: '3bhk',
    label: '3 BHK',
    rooms: 3,
    multiplier: 1.6,
    duration: '3.5 - 4 hrs',
    summary: '1 Living Room • 3 Bedrooms • 1 Kitchen • 3 Bathrooms',
  },
  {
    id: '4bhk',
    label: '4+ BHK',
    rooms: 4,
    multiplier: 2.0,
    duration: '5 - 6 hrs',
    summary: 'Living & Dining • 4 Bedrooms • 1 Kitchen • Balcony • 4 Bathrooms',
  },
];

export const ServiceDetailsScreen: React.FC = () => {
  const { selectedService, services, navigateTo, goBack } = useAuth();
  const [selectedBhk, setSelectedBhk] = useState<BhkOption>(BHK_OPTIONS[0]);

  if (!selectedService) {
    navigateTo('services_listing');
    return null;
  }

  const recommendedServices = (services || [])
    .filter(s => s.serviceId !== selectedService.serviceId)
    .slice(0, 4);

  const basePrice = selectedService.startingPrice;
  const totalPrice = Math.round(basePrice * selectedBhk.multiplier);
  const originalPrice = Math.round(totalPrice * 1.35);
  const savings = originalPrice - totalPrice;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Book ${selectedService.name} on GC Home Plus starting at ₹${selectedService.startingPrice}!`,
      });
    } catch (e) {
      // ignore
    }
  };

  const inclusions = [
    {
      title: 'Living & Bedrooms',
      details: 'Floor sweeping, wet antiseptic mopping, furniture dusting & trash bag replacement.',
    },
    {
      title: 'Kitchen Space',
      details: 'Countertop wiping, sink scrubbing, faucet shine & exterior stove wipe-down.',
    },
    {
      title: 'Bathroom Hygiene',
      details: 'Toilet seat sanitization, washbasin cleaning, mirror polish & floor tile scrub.',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Hero Image Header ── */}
        <View style={styles.heroBox}>
          <Image source={{ uri: selectedService.imageUrl }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          {/* Navigation Bar */}
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={() => goBack()}
              style={styles.navCircleBtn}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.navCircleBtn}
              activeOpacity={0.8}
            >
              <Share2 size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main Details Card ── */}
        <View style={styles.detailsCard}>
          <Text style={styles.serviceTitle}>{selectedService.name}</Text>
          <Text style={styles.serviceDescription}>{selectedService.description}</Text>

          {/* Key Meta Badges */}
          <View style={styles.metaStrip}>
            <View style={styles.metaItem}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.metaTextBold}>4.9</Text>
              <Text style={styles.metaTextMuted}>(2.4k)</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Clock size={13} color="#1E4E3D" />
              <Text style={styles.metaText}>{selectedBhk.duration}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <ShieldCheck size={13} color="#1E4E3D" />
              <Text style={styles.metaText}>Verified Maid</Text>
            </View>
          </View>
        </View>

        {/* ── Home Size (BHK Selector) ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Home Size</Text>
          <Text style={styles.sectionSubtitle}>Price and duration update based on rooms</Text>

          <View style={styles.bhkSelectorRow}>
            {BHK_OPTIONS.map(opt => {
              const isSelected = selectedBhk.id === opt.id;
              const optPrice = Math.round(basePrice * opt.multiplier);

              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelectedBhk(opt)}
                  style={[styles.bhkBtn, isSelected && styles.bhkBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.bhkBtnLabel, isSelected && styles.bhkBtnLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.bhkBtnPrice, isSelected && styles.bhkBtnPriceActive]}>
                    ₹{optPrice}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Room Summary */}
          <View style={styles.roomSummaryPill}>
            <CheckCircle2 size={13} color="#1E4E3D" />
            <Text style={styles.roomSummaryText}>{selectedBhk.summary}</Text>
          </View>
        </View>

        {/* ── What's Included (Clean Checklist) ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <Text style={styles.sectionSubtitle}>Hospitality-standard cleaning checklist</Text>

          <View style={styles.inclusionsBox}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={styles.inclusionItem}>
                <View style={styles.checkBubble}>
                  <Check size={12} color="#1E4E3D" />
                </View>
                <View style={styles.inclusionContent}>
                  <Text style={styles.inclusionTitle}>{item.title}</Text>
                  <Text style={styles.inclusionDesc}>{item.details}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Supplies & Safety Note ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Supplies & Equipment</Text>

          <View style={styles.suppliesRow}>
            <View style={styles.supplyDot} />
            <Text style={styles.supplyText}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>Maid provides: </Text>
              Hospital-grade floor disinfectant, surface spray, 4 color-coded microfiber wipes & heavy mop.
            </Text>
          </View>

          <View style={styles.suppliesRow}>
            <View style={styles.supplyDot} />
            <Text style={styles.supplyText}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>Customer provides: </Text>
              Running tap water bucket and electrical plug socket.
            </Text>
          </View>
        </View>

        {/* ── Recommended Add-ons Section ── */}
        <View style={styles.recSection}>
          <View style={styles.recHeaderRow}>
            <Text style={styles.recSectionTitle}>Recommended Services</Text>
            <Text style={styles.recSectionSub}>Frequently booked together</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recListContent}
          >
            {recommendedServices.map(rec => (
              <TouchableOpacity
                key={rec.serviceId}
                style={styles.recCard}
                onPress={() => navigateTo('service_details', { service: rec })}
                activeOpacity={0.88}
              >
                <Image source={{ uri: rec.imageUrl }} style={styles.recCardImage} />
                <View style={styles.recCardBody}>
                  <Text style={styles.recCardTitle} numberOfLines={1}>
                    {rec.name}
                  </Text>
                  <View style={styles.recMetaRow}>
                    <Star size={10} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.recRatingText}>4.9</Text>
                    <Text style={styles.recMetaDot}>•</Text>
                    <Text style={styles.recDurationText}>{rec.estimatedDuration}</Text>
                  </View>
                  <View style={styles.recBottomRow}>
                    <Text style={styles.recPrice}>₹{rec.startingPrice}</Text>
                    <View style={styles.recAddBtn}>
                      <Text style={styles.recAddBtnText}>VIEW</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Checkout Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.priceCol}>
          <View style={styles.strikeRow}>
            <Text style={styles.strikePrice}>₹{originalPrice}</Text>
            <Text style={styles.savingsText}>Save ₹{savings}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.totalPrice}>₹{totalPrice}</Text>
            <Text style={styles.forBhkText}>for {selectedBhk.label}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() =>
            navigateTo('booking_screen', {
              service: {
                ...selectedService,
                startingPrice: totalPrice,
              },
              roomsCount: selectedBhk.rooms,
              totalPrice,
            })
          }
          style={styles.ctaButton}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaButtonText}>Select Slot</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroBox: {
    height: 240,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  navBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTextBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  metaTextMuted: {
    fontSize: 11,
    color: '#64748B',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -6,
  },
  bhkSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  bhkBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 2,
  },
  bhkBtnActive: {
    backgroundColor: '#1E4E3D',
    borderColor: '#1E4E3D',
  },
  bhkBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  bhkBtnLabelActive: {
    color: '#FFFFFF',
  },
  bhkBtnPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  bhkBtnPriceActive: {
    color: '#FFFFFF',
  },
  roomSummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 2,
  },
  roomSummaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E4E3D',
    flex: 1,
  },
  inclusionsBox: {
    gap: 10,
    marginTop: 2,
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  inclusionContent: {
    flex: 1,
  },
  inclusionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  inclusionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 16,
  },
  suppliesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  supplyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E4E3D',
    marginTop: 6,
  },
  supplyText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 17,
  },
  /* Recommended Services */
  recSection: {
    marginTop: 14,
    gap: 10,
  },
  recHeaderRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  recSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  recSectionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  recListContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  recCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  recCardImage: {
    width: '100%',
    height: 95,
  },
  recCardBody: {
    padding: 10,
    gap: 4,
  },
  recCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  recMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  recMetaDot: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  recDurationText: {
    fontSize: 10,
    color: '#64748B',
  },
  recBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  recPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  recAddBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E4E3D',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recAddBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4E3D',
    letterSpacing: 0.4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
  },
  priceCol: {
    gap: 1,
  },
  strikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strikePrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E4E3D',
  },
  forBhkText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  ctaButton: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
