import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { homeService, SupabaseOffer } from '../../services/homeService';
import { resolveImageSource } from '../../utils/imageUtils';
import { supabase } from '../../config/supabase';
import { Tag, Sparkles, Check, Copy, ArrowRight, Percent } from 'lucide-react-native';

export const OffersScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const [offers, setOffers] = useState<SupabaseOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await homeService.getOffersFromSupabase();
      setOffers(data);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();

    const channel = supabase
      .channel('offers_screen_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        loadOffers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCopy = (code: string) => {
    try {
      Clipboard.setString(code);
    } catch {}
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offers & Discounts</Text>
        <Text style={styles.headerSub}>Exclusive savings on genuine cleaning services</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#168A68" />
          <Text style={styles.loadingText}>Loading latest offers...</Text>
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Percent size={32} color="#168A68" />
          </View>
          <Text style={styles.emptyTitle}>No Active Offers Right Now</Text>
          <Text style={styles.emptySub}>Check back soon for new promotions and seasonal discounts!</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {offers.map(offer => {
            const isCopied = copiedCode === offer.code;
            const discountLabel = offer.discountType === 'percentage'
              ? `${offer.discountValue}% OFF`
              : `₹${offer.discountValue} OFF`;
            const validDate = offer.validUntil
              ? new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Limited Time';

            return (
              <View key={offer.id || offer.code} style={styles.card}>
                {offer.imageUrl ? (
                  <View style={styles.imageHeader}>
                    <Image
                      source={resolveImageSource(offer.imageUrl)}
                      style={styles.offerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay} />
                  </View>
                ) : null}

                <View style={styles.cardInner}>
                  <View style={styles.cardTop}>
                    <View style={styles.tagBadge}>
                      <Tag size={13} color="#0E5B47" />
                      <Text style={styles.tagBadgeText}>{discountLabel}</Text>
                    </View>
                    <Text style={styles.validityText}>Valid till: {validDate}</Text>
                  </View>

                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  {offer.description ? (
                    <Text style={styles.offerDesc}>{offer.description}</Text>
                  ) : null}

                  {offer.minBookingAmount > 0 ? (
                    <Text style={styles.minOrderText}>
                      Min order: ₹{offer.minBookingAmount}
                      {offer.maxDiscount ? ` • Max discount: ₹${offer.maxDiscount}` : ''}
                    </Text>
                  ) : null}

                  <View style={styles.divider} />

                  <View style={styles.cardBottom}>
                    <TouchableOpacity
                      style={[styles.copyBtn, isCopied && styles.copyBtnCopied]}
                      onPress={() => handleCopy(offer.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.codeText}>{offer.code}</Text>
                      {isCopied ? (
                        <View style={styles.copiedRow}>
                          <Check size={13} color="#168A68" strokeWidth={3} />
                          <Text style={styles.copiedText}>Copied!</Text>
                        </View>
                      ) : (
                        <View style={styles.copyRow}>
                          <Copy size={12} color="#168A68" />
                          <Text style={styles.copyText}>Tap to Copy</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookNowBtn}
                      onPress={() => navigateTo('services-listing')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.bookNowText}>Book Service</Text>
                      <ArrowRight size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10243A',
  },
  headerSub: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#F5FCF8',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  imageHeader: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#123D2A',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 61, 42, 0.15)',
  },
  cardInner: {
    padding: 16,
  },
  minOrderText: {
    fontSize: 11,
    color: '#123D2A',
    fontWeight: '700',
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#68788C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#68788C',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5B47',
  },
  validityText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10243A',
  },
  offerDesc: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 4,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E8E5',
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#168A68',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  copyBtnCopied: {
    backgroundColor: '#EAF8F1',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  copyText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#168A68',
  },
  copiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  copiedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#168A68',
  },
  bookNowBtn: {
    backgroundColor: '#168A68',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bookNowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
