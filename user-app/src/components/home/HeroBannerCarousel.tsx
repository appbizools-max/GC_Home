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
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={styles.card}
            onPress={() => onPressBanner(banner)}
            activeOpacity={0.92}
          >
            <Image
              source={resolveImageSource(banner.imageUrl)}
              style={styles.bannerImage}
              resizeMode="cover"
            />
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
    height: 165,
    backgroundColor: '#EAF8F1',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
