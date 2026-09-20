import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StyleProp,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { Service } from '../../types';
import { ServiceCard, ExtendedService, SERVICE_CARD_WIDTH } from './ServiceCard';
import { SearchX } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface TwoColumnServicesGridProps {
  services: ExtendedService[];
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
  const isFavorite = (serviceId: string): boolean => {
    if (!favorites) return false;
    if (Array.isArray(favorites)) {
      return favorites.includes(serviceId);
    }
    return Boolean(favorites[serviceId]);
  };

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
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onSelect={onSelectService}
            onQuickAdd={onQuickAdd}
            isFavorite={isFavorite(item.serviceId)}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      />
    );
  }

  // Flex wrap mode for nesting inside ScrollViews
  return (
    <View style={[styles.wrapContainer, containerStyle]}>
      {services.map(service => (
        <ServiceCard
          key={service.serviceId}
          service={service}
          onSelect={onSelectService}
          onQuickAdd={onQuickAdd}
          isFavorite={isFavorite(service.serviceId)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
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
});
