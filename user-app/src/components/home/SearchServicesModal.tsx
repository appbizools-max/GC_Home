import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Service } from '../../types';
import { TwoColumnServicesGrid } from '../common/TwoColumnServicesGrid';
import { Search, X, Sparkles, TrendingUp } from 'lucide-react-native';

interface SearchServicesModalProps {
  visible: boolean;
  services: Service[];
  onSelectService: (service: Service) => void;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Deep Cleaning',
  'Kitchen Degreasing',
  'Bathroom Descaling',
  'Sofa Shampooing',
  'Move-in Clean',
];

export const SearchServicesModal: React.FC<SearchServicesModalProps> = ({
  visible,
  services,
  onSelectService,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filteredServices = services.filter(s => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.features?.some(f => f.toLowerCase().includes(q))
    );
  });

  const handleSelect = (service: Service) => {
    onSelectService(service);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Search Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.searchBox}>
              <Search size={18} color="#168A68" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for cleaning services, e.g. home cleaning..."
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                  <X size={14} color="#68788C" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Popular Searches */}
          {query.length === 0 && (
            <View style={styles.popularSection}>
              <View style={styles.popularHeader}>
                <TrendingUp size={14} color="#168A68" />
                <Text style={styles.popularTitle}>POPULAR SEARCHES</Text>
              </View>
              <View style={styles.popularChipsWrap}>
                {POPULAR_SEARCHES.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={styles.chip}
                    onPress={() => setQuery(item)}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={11} color="#168A68" />
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Service Results 2-Column Grid */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeading}>
              {query.trim() ? `Search Results (${filteredServices.length})` : 'All Available Services'}
            </Text>

            <TwoColumnServicesGrid
              services={filteredServices}
              onSelectService={handleSelect}
              onQuickAdd={handleSelect}
              scrollable={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 30 }}
              emptyMessage="No matching services"
              emptySubMessage="Try searching with different terms like 'Kitchen', 'Bathroom', or 'Deep Clean'"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#10243A',
  },
  clearBtn: {
    padding: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#168A68',
  },
  popularSection: {
    marginBottom: 14,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  popularTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#68788C',
    letterSpacing: 0.5,
  },
  popularChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0E5B47',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 10,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 10,
    gap: 12,
  },
  serviceImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10243A',
  },
  serviceDesc: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10243A',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 10.5,
    color: '#68788C',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  startsAt: {
    fontSize: 10.5,
    color: '#68788C',
  },
  priceVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#168A68',
  },
  bookArrow: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#EAF8F1',
  },
});
