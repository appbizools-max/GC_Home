import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Tag, Sparkles, Check, Copy, ArrowRight } from 'lucide-react-native';

const OFFERS = [
  {
    code: 'GCHOME20',
    title: '20% OFF on Your First Booking',
    desc: 'Get flat 20% discount on all regular and deep home services. Maximum discount up to ₹400.',
    discount: '20% OFF',
    validTill: '31 Dec 2026',
    minBooking: '₹499',
  },
  {
    code: 'DEEP300',
    title: 'Flat ₹300 OFF Deep Cleaning',
    desc: 'Top-to-bottom thorough villa & apartment sanitization with certified chemicals.',
    discount: '₹300 OFF',
    validTill: '31 Dec 2026',
    minBooking: '₹1,299',
  },
  {
    code: 'KITCHEN50',
    title: '₹150 OFF Kitchen Degreasing',
    desc: 'Intensive oil & grease removal for chimneys, stovetops, and tile splashbacks.',
    discount: '₹150 OFF',
    validTill: '15 Oct 2026',
    minBooking: '₹599',
  },
  {
    code: 'BATH100',
    title: '₹100 OFF Bathroom Descaling',
    desc: 'Hard water stain removal, mirror polishing & anti-bacterial fogging.',
    discount: '₹100 OFF',
    validTill: '31 Oct 2026',
    minBooking: '₹499',
  },
];

export const OffersScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {OFFERS.map(offer => {
          const isCopied = copiedCode === offer.code;
          return (
            <View key={offer.code} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.tagBadge}>
                  <Tag size={13} color="#0E5B47" />
                  <Text style={styles.tagBadgeText}>{offer.discount}</Text>
                </View>
                <Text style={styles.validityText}>Valid till: {offer.validTill}</Text>
              </View>

              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>

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
                  onPress={() => navigateTo('customer_home')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowText}>Book Service</Text>
                  <ArrowRight size={13} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
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
