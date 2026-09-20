import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Service } from '../../types';
import { resolveImageSource } from '../../utils/imageUtils';
import { Star, Clock, Plus, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');
export const SERVICE_CARD_WIDTH = Math.floor((width - 44) / 2);

export interface ExtendedService extends Service {
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: string;
  isFavorite?: boolean;
}

interface ServiceCardProps {
  service: ExtendedService;
  onSelect: (service: Service) => void;
  onQuickAdd?: (service: Service) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (serviceId: string) => void;
  cardWidth?: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelect,
  onQuickAdd,
  isFavorite: controlledFavorite,
  onToggleFavorite,
  cardWidth = SERVICE_CARD_WIDTH,
}) => {
  const [internalFavorite, setInternalFavorite] = useState(false);
  const isFav = controlledFavorite !== undefined ? controlledFavorite : internalFavorite;

  const handleToggleFav = (e: any) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(service.serviceId);
    } else {
      setInternalFavorite(!internalFavorite);
    }
  };

  const handleAdd = (e: any) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(service);
    } else {
      onSelect(service);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={() => onSelect(service)}
      activeOpacity={0.9}
    >
      {/* Image Container with Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={resolveImageSource(service.imageUrl)}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Bestseller Badge */}
        {service.isBestseller && (
          <View style={styles.bestsellerTag}>
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>
        )}

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={handleToggleFav}
          activeOpacity={0.8}
          accessibilityLabel={`Add ${service.name} to favorites`}
        >
          <Heart
            size={14}
            color={isFav ? '#EF4444' : '#68788C'}
            fill={isFav ? '#EF4444' : 'rgba(255, 255, 255, 0.7)'}
          />
        </TouchableOpacity>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>
          {service.name}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {service.description}
        </Text>

        {/* Meta Specs: Duration & Rating */}
        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <Clock size={10.5} color="#168A68" />
            <Text style={styles.specText}>{service.estimatedDuration}</Text>
          </View>

          <View style={styles.specItem}>
            <Star size={10.5} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.specText}>
              {service.rating || 4.8} ({service.reviewCount || '1.5K'})
            </Text>
          </View>
        </View>

        {/* Price & Green + Button Row */}
        <View style={styles.priceRow}>
          <View style={styles.priceCol}>
            <Text style={styles.startsAtText}>Starts at</Text>
            <Text style={styles.priceValue}>₹ {service.startingPrice}</Text>
          </View>

          <TouchableOpacity
            style={styles.plusBtn}
            onPress={handleAdd}
            activeOpacity={0.85}
            accessibilityLabel={`Add ${service.name}`}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.8} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    overflow: 'hidden',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 102,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bestsellerTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  cardBody: {
    padding: 10,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10243A',
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    color: '#68788C',
    lineHeight: 14,
    height: 28,
    marginBottom: 6,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 6,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10243A',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCol: {
    justifyContent: 'center',
  },
  startsAtText: {
    fontSize: 8.5,
    color: '#68788C',
    lineHeight: 11,
  },
  priceValue: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#10243A',
    lineHeight: 18,
  },
  plusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#168A68',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
});
