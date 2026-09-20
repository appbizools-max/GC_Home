import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { PromoOffer } from '../../services/homeService';
import { ASSETS } from '../../assets/index';
import { Tag, Check, Copy } from 'lucide-react-native';

interface PromotionalOfferBannerProps {
  offer: PromoOffer;
  onApplyOffer: (code: string) => void;
}

export const PromotionalOfferBanner: React.FC<PromotionalOfferBannerProps> = ({
  offer,
  onApplyOffer,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    try {
      Clipboard.setString(offer.code);
    } catch {}
    setCopied(true);
    onApplyOffer(offer.code);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Left Discount Tag Graphic */}
        <View style={styles.tagIconWrapper}>
          <Tag size={28} color="#168A68" strokeWidth={2.4} fill="#C6EEDB" />
          <Text style={styles.percentSymbol}>%</Text>
        </View>

        {/* Center Offer Details */}
        <View style={styles.textDetailsCol}>
          <Text style={styles.discountHeading}>{offer.discountText}</Text>
          <Text style={styles.discountSub}>{offer.subtitle}</Text>

          {/* Copyable Coupon Pill */}
          <TouchableOpacity
            style={[styles.couponPill, copied && styles.couponPillCopied]}
            onPress={handleCopyCode}
            activeOpacity={0.8}
            accessibilityLabel={`Use coupon code ${offer.code}`}
          >
            <Text style={styles.couponPrefix}>Use code</Text>
            <Text style={styles.couponCode}>{offer.code}</Text>
            {copied ? (
              <Check size={12} color="#168A68" strokeWidth={3} />
            ) : (
              <Copy size={11} color="#168A68" />
            )}
          </TouchableOpacity>
        </View>

        {/* Right Cleaner Photo & Trust Tag */}
        <View style={styles.rightCleanerCol}>
          <Image
            source={
              typeof ASSETS.promoCleaner === 'string'
                ? { uri: ASSETS.promoCleaner }
                : ASSETS.promoCleaner
            }
            style={styles.cleanerPhoto}
            resizeMode="cover"
          />

          <View style={styles.trustSideTag}>
            <Text style={styles.trustSideText}>Trusted</Text>
            <Text style={styles.trustSideText}>Cleaning</Text>
            <Text style={styles.trustSideSub}>Professionals 💚</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#EAF8F1',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  tagIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  percentSymbol: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '900',
    color: '#0E5B47',
    top: 9,
  },
  textDetailsCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  discountHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0E5B47',
    lineHeight: 20,
  },
  discountSub: {
    fontSize: 11,
    color: '#168A68',
    fontWeight: '600',
    marginTop: 1,
  },
  couponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  couponPillCopied: {
    backgroundColor: '#F5FCF8',
    borderColor: '#168A68',
  },
  couponPrefix: {
    fontSize: 10,
    color: '#68788C',
    fontWeight: '600',
  },
  couponCode: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  rightCleanerCol: {
    width: 95,
    height: 75,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  cleanerPhoto: {
    width: '100%',
    height: '100%',
  },
  trustSideTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  trustSideText: {
    fontSize: 6.5,
    fontWeight: '800',
    color: '#0E5B47',
    lineHeight: 8,
  },
  trustSideSub: {
    fontSize: 6,
    fontWeight: '700',
    color: '#168A68',
  },
});
