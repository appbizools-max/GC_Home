import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StyleProp,
  ViewStyle,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Service } from '../../types';
import { ServiceCard, ExtendedService, SERVICE_CARD_WIDTH } from './ServiceCard';
import { SearchX, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

interface TwoColumnServicesGridProps {
  services: ExtendedService[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectService: (service: Service) => void;
  onQuickAdd?: (service: Service) => void;
  favorites?: Record<string, boolean> | string[];
  onToggleFavorite?: (serviceId: string) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  showsVerticalScrollIndicator?: boolean;
}

export const TwoColumnServicesGrid: React.FC<TwoColumnServicesGridProps> = ({
  services,
  isLoading = false,
  error = null,
  onRetry,
  onSelectService,
  onQuickAdd,
  favorites,
  onToggleFavorite,
  emptyMessage = 'No services found',
  emptySubMessage = 'Try adjusting your search or category filter',
  containerStyle,
  contentContainerStyle,
  scrollable = false,
  showsVerticalScrollIndicator = false,
}) => {
  const { cart, addServiceToCart, removeServiceFromCart, updateItemQuantity, toggleServiceInCart } = useCart();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isLoading) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading]);

  const isFavorite = (serviceId: string): boolean => {
    if (!favorites) return false;
    if (Array.isArray(favorites)) {
      return favorites.includes(serviceId);
    }
    return Boolean(favorites[serviceId]);
  };

  const handleQuickAdd = (service: Service) => {
    if (onQuickAdd) {
      onQuickAdd(service);
    } else {
      toggleServiceInCart(service);
    }
  };

  const handleIncrement = (service: Service) => {
    addServiceToCart(service, 1);
  };

  const handleDecrement = (service: Service) => {
    const cartItem = cart?.items.find(i => i.service.serviceId === service.serviceId);
    const currentQty = cartItem?.quantity || 0;
    if (currentQty <= 1) {
      removeServiceFromCart(service.serviceId);
    } else {
      updateItemQuantity(service.serviceId, currentQty - 1);
    }
  };

  // 1. Loading State Skeleton (when no services exist yet)
  if (isLoading && (!services || services.length === 0)) {
    const skeletonItems = [1, 2, 3, 4];
    return (
      <View style={[styles.wrapContainer, containerStyle]}>
        {skeletonItems.map(key => (
          <Animated.View
            key={key}
            style={[
              styles.skeletonCard,
              { width: SERVICE_CARD_WIDTH, opacity: pulseAnim },
            ]}
          >
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonTextLarge} />
            <View style={styles.skeletonTextSmall} />
            <View style={styles.skeletonFooterRow}>
              <View style={styles.skeletonPrice} />
              <View style={styles.skeletonBtn} />
            </View>
          </Animated.View>
        ))}
      </View>
    );
  }

  // 2. Error State (when fetch failed and no services available)
  if (error && (!services || services.length === 0)) {
    return (
      <View style={[styles.emptyContainer, containerStyle]}>
        <View style={[styles.emptyIconCircle, styles.errorIconCircle]}>
          <AlertTriangle size={32} color="#EF4444" />
        </View>
        <Text style={styles.emptyTitle}>Unable to load services</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <RefreshCw size={14} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 3. Genuine Empty State (ONLY when NOT loading, NO error, and returned services list is 0)
  if (!services || services.length === 0) {
    return (
      <View style={[styles.emptyContainer, containerStyle]}>
        <View style={styles.emptyIconCircle}>
          <SearchX size={32} color="#68788C" />
        </View>
        <Text style={styles.emptyTitle}>{emptyMessage}</Text>
        <Text style={styles.emptySubtitle}>{emptySubMessage}</Text>
      </View>
    );
  }

  if (scrollable) {
    return (
      <FlatList
        data={services}
        keyExtractor={item => item.serviceId}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        renderItem={({ item }) => {
          const cartItem = cart?.items.find(i => i.service.serviceId === item.serviceId);
          return (
            <ServiceCard
              service={item}
              onSelect={onSelectService}
              onQuickAdd={handleQuickAdd}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              isFavorite={isFavorite(item.serviceId)}
              onToggleFavorite={onToggleFavorite}
              isInCart={Boolean(cartItem)}
              cartQuantity={cartItem?.quantity || 0}
            />
          );
        }}
      />
    );
  }

  // Flex wrap mode for nesting inside ScrollViews
  return (
    <View style={[styles.wrapContainer, containerStyle]}>
      {services.map(service => {
        const cartItem = cart?.items.find(i => i.service.serviceId === service.serviceId);
        return (
          <ServiceCard
            key={service.serviceId}
            service={service}
            onSelect={onSelectService}
            onQuickAdd={handleQuickAdd}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            isFavorite={isFavorite(service.serviceId)}
            onToggleFavorite={onToggleFavorite}
            isInCart={Boolean(cartItem)}
            cartQuantity={cartItem?.quantity || 0}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#68788C',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorIconCircle: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#168A68',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  skeletonCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  skeletonImage: {
    height: 100,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 10,
  },
  skeletonTextLarge: {
    height: 14,
    width: '80%',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonTextSmall: {
    height: 10,
    width: '50%',
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPrice: {
    height: 16,
    width: '40%',
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  skeletonBtn: {
    height: 28,
    width: 28,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
  },
});
