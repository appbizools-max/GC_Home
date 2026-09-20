import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Leaf, ArrowRight } from 'lucide-react-native';

interface LowerBrandBannerProps {
  onPressKnowMore: () => void;
}

export const LowerBrandBanner: React.FC<LowerBrandBannerProps> = ({ onPressKnowMore }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Left Leaf Accent */}
        <View style={styles.leafCircle}>
          <Leaf size={22} color="#168A68" fill="#A7F3D0" />
        </View>

        {/* Center Slogan */}
        <View style={styles.textCol}>
          <Text style={styles.titlePart1}>Clean Homes</Text>
          <Text style={styles.titlePart2}>Healthier Communities</Text>
        </View>

        {/* Know More CTA */}
        <TouchableOpacity style={styles.knowMoreBtn} onPress={onPressKnowMore} activeOpacity={0.85}>
          <Text style={styles.knowMoreText}>Know More</Text>
          <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
  },
  leafCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginRight: 10,
  },
  textCol: {
    flex: 1,
  },
  titlePart1: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0E5B47',
  },
  titlePart2: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#168A68',
    marginTop: 1,
  },
  knowMoreBtn: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  knowMoreText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
