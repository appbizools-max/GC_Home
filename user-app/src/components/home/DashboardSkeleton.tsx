import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const DashboardSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <Animated.View style={[styles.box, { width: 140, height: 28, opacity: pulseAnim }]} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Animated.View style={[styles.circle, { width: 36, height: 36, opacity: pulseAnim }]} />
          <Animated.View style={[styles.circle, { width: 36, height: 36, opacity: pulseAnim }]} />
        </View>
      </View>

      {/* Location Skeleton */}
      <Animated.View style={[styles.box, { width: 220, height: 16, marginBottom: 14, opacity: pulseAnim }]} />

      {/* Search Skeleton */}
      <Animated.View style={[styles.box, { width: '100%', height: 44, borderRadius: 14, marginBottom: 16, opacity: pulseAnim }]} />

      {/* Banner Skeleton */}
      <Animated.View style={[styles.box, { width: '100%', height: 165, borderRadius: 20, marginBottom: 16, opacity: pulseAnim }]} />

      {/* Categories Skeleton */}
      <View style={styles.categoriesRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <Animated.View style={[styles.box, { width: 54, height: 54, borderRadius: 16, opacity: pulseAnim }]} />
            <Animated.View style={[styles.box, { width: 44, height: 10, opacity: pulseAnim }]} />
          </View>
        ))}
      </View>

      {/* Services Row Skeleton */}
      <View style={{ marginTop: 10 }}>
        <Animated.View style={[styles.box, { width: 160, height: 18, marginBottom: 12, opacity: pulseAnim }]} />
        <View style={styles.cardsRow}>
          {[1, 2, 3].map(i => (
            <Animated.View key={i} style={[styles.box, { width: 140, height: 170, borderRadius: 16, opacity: pulseAnim }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  box: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  circle: {
    backgroundColor: '#E2E8F0',
    borderRadius: 18,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
