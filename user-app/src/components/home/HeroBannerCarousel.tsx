import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { HeroBanner } from '../../services/homeService';
import { resolveImageSource } from '../../utils/imageUtils';
import { ArrowRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface HeroBannerCarouselProps {
  banners: HeroBanner[];
  onPressBanner: (banner: HeroBanner) => void;
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  banners,
  onPressBanner,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  // Auto-scroll carousel every 4.5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * (CARD_WIDTH + 12),
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeIndex, banners.length]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + 12));
    if (index >= 0 && index < banners.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollList}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id}
            style={styles.card}
            onPress={() => onPressBanner(banner)}
            activeOpacity={0.92}
          >
            {/* Left Content Column */}
            <View style={styles.contentCol}>
              <View style={styles.titleGroup}>
                <Text style={styles.titlePart1}>A Cleaner Home</Text>
                <Text style={styles.titlePart2}>A Happier You</Text>
              </View>

              <Text style={styles.subtitleText}>{banner.subtitle}</Text>

              {/* Primary Book Now CTA */}
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>{banner.ctaText}</Text>
              </View>
            </View>

            {/* Right Image with Aesthetic Overlay */}
            <View style={styles.imageCol}>
              <Image source={resolveImageSource(banner.imageUrl)} style={styles.bannerImage} resizeMode="cover" />

              {/* Tagline Badge */}
              <View style={styles.taglineBadge}>
                <Text style={styles.taglineText}>Clean Spaces</Text>
                <Text style={styles.taglineSub}>Brighter Lives 💚</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationRow}>
        {banners.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              activeIndex === idx ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: 175,
    backgroundColor: '#EAF8F1',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  contentCol: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'space-between',
    height: '100%',
  },
  titleGroup: {
    gap: 1,
  },
  titlePart1: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0E5B47',
    lineHeight: 22,
  },
  titlePart2: {
    fontSize: 18,
    fontWeight: '900',
    color: '#168A68',
    lineHeight: 22,
  },
  subtitleText: {
    fontSize: 11,
    color: '#0E5B47',
    lineHeight: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    alignSelf: 'flex-start',
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  imageCol: {
    width: 125,
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  taglineBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#C6EEDB',
  },
  taglineText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  taglineSub: {
    fontSize: 7,
    fontWeight: '700',
    color: '#168A68',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 24,
    marginTop: 8,
    gap: 4,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#168A68',
  },
  dotInactive: {
    width: 4,
    backgroundColor: '#CBD5E1',
  },
});
