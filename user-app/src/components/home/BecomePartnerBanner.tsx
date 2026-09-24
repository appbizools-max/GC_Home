import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

interface BecomePartnerBannerProps {
  onPress: () => void;
}

export const BecomePartnerBanner: React.FC<BecomePartnerBannerProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={styles.cardContainer}
      accessibilityRole="button"
      accessibilityLabel="Become a GC Maid Partner. Tap to apply."
    >
      <Text style={styles.mainTitle}>
        Become a <Text style={styles.goldText}>GC Maid</Text> Partner
      </Text>

      <View style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Apply Now</Text>
        <ArrowRight size={13} color="#062E1F" strokeWidth={2.6} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0A2D20',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderColor: 'rgba(52, 211, 153, 0.28)',
    shadowColor: '#052317',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 22,
    flex: 1,
    marginRight: 12,
  },
  goldText: {
    color: '#FCD34D',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#062E1F',
    letterSpacing: 0.2,
  },
});
