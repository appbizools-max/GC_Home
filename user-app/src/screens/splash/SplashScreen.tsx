import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { TrustBadgeRow } from '../../components/ui/TrustBadgeRow';
import { BottomWaveDecoration } from '../../components/ui/BottomWaveDecoration';
import { Heart } from 'lucide-react-native';

import { ASSETS } from '../../assets/index';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const { checkExistingSession } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      }),
    ]).start();

    // Check session after 1.8 seconds
    const timer = setTimeout(() => {
      checkExistingSession();
    }, 1900);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Top Right Subtle Badge */}
      <View style={styles.topBadgeWrapper}>
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>Clean Spaces</Text>
          <Text style={styles.topBadgeText}>Brighter Lives</Text>
          <Heart size={10} color="#168A68" fill="#168A68" style={{ marginTop: 2 }} />
        </View>
      </View>

      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Logo & Name */}
        <View style={styles.logoSection}>
          <AppLogo size="lg" showTagline={true} align="center" />
        </View>

        {/* Hero Slogan */}
        <View style={styles.sloganSection}>
          <Text style={styles.heroSloganPart1}>A Cleaner Home</Text>
          <Text style={styles.heroSloganPart2}>for a Happier You</Text>
        </View>

        {/* Hero Visual Banner with Living Room Image & Decorative Tag */}
        <View style={styles.heroImageWrapper}>
          <Image
            source={typeof ASSETS.heroLivingRoom === 'string' ? { uri: ASSETS.heroLivingRoom } : ASSETS.heroLivingRoom}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Book Accent Tag */}
          <View style={styles.bookTag}>
            <Text style={styles.bookTagTitle}>Good Homes</Text>
            <Text style={styles.bookTagSub}>Happier People</Text>
          </View>

          {/* Handwritten Style Side Accent */}
          <View style={styles.sideAccent}>
            <Text style={styles.sideAccentText}>More</Text>
            <Text style={styles.sideAccentText}>Than Cleaning</Text>
            <Text style={styles.sideAccentSub}>— It's Care</Text>
            <Text style={styles.sideAccentHeart}>♡</Text>
          </View>
        </View>

        {/* 3 Trust Badges */}
        <View style={styles.trustSection}>
          <TrustBadgeRow variant="splash" />
        </View>

        {/* Sleek Loading Bar */}
        <View style={styles.loadingSection}>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>Getting things ready...</Text>
        </View>
      </Animated.View>

      {/* Organic Bottom Mint Wave */}
      <BottomWaveDecoration slogan="A Cleaner Home for a Happier You" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    position: 'relative',
  },
  topBadgeWrapper: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 10,
  },
  topBadge: {
    backgroundColor: '#EAF8F1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  topBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0E5B47',
    lineHeight: 12,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 36,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sloganSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heroSloganPart1: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10243A',
    letterSpacing: -0.2,
  },
  heroSloganPart2: {
    fontSize: 20,
    fontWeight: '800',
    color: '#168A68',
    letterSpacing: -0.2,
  },
  heroImageWrapper: {
    width: '100%',
    height: 170,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bookTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  bookTagTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#10243A',
  },
  bookTagSub: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#168A68',
  },
  sideAccent: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sideAccentText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10243A',
    lineHeight: 11,
  },
  sideAccentSub: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#168A68',
    marginTop: 2,
  },
  sideAccentHeart: {
    fontSize: 10,
    color: '#168A68',
    marginTop: 1,
  },
  trustSection: {
    width: '100%',
    marginBottom: 16,
  },
  loadingSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 10,
  },
  progressBarTrack: {
    width: 140,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EAF8F1',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#168A68',
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#68788C',
  },
});
