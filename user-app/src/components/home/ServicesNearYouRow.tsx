import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Service } from '../../types';
import { TwoColumnServicesGrid } from '../common/TwoColumnServicesGrid';
import { ChevronRight } from 'lucide-react-native';

interface ServicesNearYouRowProps {
  services: (Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currentLocationName: string;
  onSelectService: (service: Service) => void;
  onQuickAdd: (service: Service) => void;
  onViewAll: () => void;
}

export const ServicesNearYouRow: React.FC<ServicesNearYouRowProps> = ({
  services,
  isLoading = false,
  error = null,
  onRetry,
  currentLocationName,
  onSelectService,
  onQuickAdd,
  onViewAll,
}) => {
  const shortLocation = currentLocationName.split(',')[0] || 'HSR Layout';

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Top Rated Services</Text>
          <Text style={styles.sectionSubtitle}>
            Top-rated featured services curated for you in {shortLocation}
          </Text>
        </View>

        <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight size={14} color="#168A68" />
        </TouchableOpacity>
      </View>

      {/* Two-Column Services Grid */}
      <TwoColumnServicesGrid
        services={services}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onSelectService={onSelectService}
        onQuickAdd={onQuickAdd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10243A',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
});
