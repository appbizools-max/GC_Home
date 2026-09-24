import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { GCLogo } from '../../components/common/GCLogo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Logo size ────────────────────────────────────────────────────────────────
const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.58, 240);
const GLOW_SIZE = LOGO_SIZE + 48;

export const SplashScreen: React.FC = () => {
  const { checkExistingSession } = useAuth();

  // ── Background ────────────────────────────────────────────────────────────
  const bgFade = useRef(new Animated.Value(0)).current;

  // ── Logo reveal ───────────────────────────────────────────────────────────
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.78)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;

  // ── Gold shimmer sweep ────────────────────────────────────────────────────
  const shimmerX     = useRef(new Animated.Value(-LOGO_SIZE)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;

  // ── Glow pulse ────────────────────────────────────────────────────────────
  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const glowScale    = useRef(new Animated.Value(0.88)).current;

  // ── Exit ──────────────────────────────────────────────────────────────────
  const exitOpacity  = useRef(new Animated.Value(1)).current;
  const exitScale    = useRef(new Animated.Value(1)).current;

  // Timer ref so we can clean up
  const sessionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // ── 1. Background fade-in (0–250ms) ────────────────────────────────────
    Animated.timing(bgFade, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();

    // ── 2. Logo reveal (200–800ms) ─────────────────────────────────────────
    //    Opacity: 0 → 1
    //    Scale:   0.78 → 1.08 → 1.0  (overshoot settle)
    //    TranslateY: 18 → 0
    const logoReveal = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 480,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 520,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(logoScale, {
          toValue: 1.0,
          duration: 180,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 560,
        delay: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]);

    // ── 3. Gold shimmer sweep (650–1050ms, fires once) ─────────────────────
    const shimmerReveal = Animated.sequence([
      Animated.timing(shimmerOpacity, {
        toValue: 0.55,
        duration: 80,
        delay: 650,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerX, {
        toValue: LOGO_SIZE * 1.2,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }),
      Animated.timing(shimmerOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]);

    // ── 4. Green/gold glow pulse (900–1350ms, fires once) ──────────────────
    const glowPulse = Animated.sequence([
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.55,
          duration: 280,
          delay: 900,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(glowScale, {
          toValue: 1.0,
          duration: 280,
          delay: 900,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(glowScale, {
          toValue: 1.12,
          duration: 380,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]),
    ]);

    // ── 5. Logo hold (1200–1500ms) ─────────────────────────────────────────
    // (naturally handled by the timer gap before exit)

    // ── 6. Cinematic exit (1500–1900ms) ────────────────────────────────────
    const exitAnim = Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 420,
        delay: 1500,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(exitScale, {
        toValue: 0.92,
        duration: 420,
        delay: 1500,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]);

    // Run all in parallel — timing naturally staggers them via delays
    Animated.parallel([
      logoReveal,
      shimmerReveal,
      glowPulse,
      exitAnim,
    ]).start();

    // ── 7. Session check fires at 1.9s ─────────────────────────────────────
    sessionTimer.current = setTimeout(() => {
      checkExistingSession();
    }, 1900);

    return () => {
      if (sessionTimer.current) clearTimeout(sessionTimer.current);
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      {/* ── Soft green radial background ── */}
      <Animated.View style={[styles.bgLayer, { opacity: bgFade }]}>
        {/* Outer very light green wash */}
        <View style={styles.bgBase} />
        {/* Soft center glow — green */}
        <View style={styles.bgCenterGlow} />
        {/* Top corner accent — gold tint */}
        <View style={styles.bgTopAccent} />
      </Animated.View>

      {/* ── Center content ── */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            transform: [{ scale: exitScale }],
          },
        ]}
      >
        {/* Glow ring behind logo */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: GLOW_SIZE,
              height: GLOW_SIZE,
              borderRadius: GLOW_SIZE / 2,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Logo container with shimmer clip */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          {/* The actual GC HOME+ circular logo */}
          <GCLogo size={LOGO_SIZE} />

          {/* Gold shimmer sweep overlay — clipped to logo bounds */}
          <Animated.View
            style={[
              styles.shimmerStrip,
              {
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerX }],
              },
            ]}
            pointerEvents="none"
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Background layers ──────────────────────────────────────────────────────
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F6FBF7',
  },
  bgCenterGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: SCREEN_WIDTH * 0.6,
    backgroundColor: 'rgba(111, 175, 114, 0.10)',
    top: SCREEN_HEIGHT / 2 - SCREEN_WIDTH * 0.6,
    left: -SCREEN_WIDTH * 0.1,
  },
  bgTopAccent: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(201, 162, 39, 0.05)',
    top: -60,
    right: -40,
  },

  // ── Center content ─────────────────────────────────────────────────────────
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Glow ring ──────────────────────────────────────────────────────────────
  glowRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    // Soft layered shadow simulates the glow
    shadowColor: '#6FAF72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 0,
    borderWidth: 2,
    borderColor: 'rgba(111, 175, 114, 0.35)',
  },

  // ── Logo ───────────────────────────────────────────────────────────────────
  logoWrapper: {
    overflow: 'hidden',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Gold shimmer strip ─────────────────────────────────────────────────────
  shimmerStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: LOGO_SIZE * 0.38,
    height: LOGO_SIZE,
    // Diagonal-ish gold-white gradient effect via rotation
    backgroundColor: 'rgba(255, 235, 170, 0.72)',
    transform: [{ skewX: '-18deg' }],
  },
});
