import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../../../config/supabase';
import {
  Check,
  Search,
  X,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';

export interface SelectedServiceItem {
  serviceId: string;
  serviceName: string;
  category?: string;
  price?: number;
  duration?: string;
}

export interface DynamicServiceSelectorProps {
  selectedServiceIds: string[];
  onChange: (serviceIds: string[], items: SelectedServiceItem[]) => void;
  error?: string;
}

interface ServiceRecord {
  id: string;
  name: string;
  category?: string;
  category_id?: string;
  is_active: boolean;
  starting_price?: number;
  estimated_duration?: string;
}

export const DynamicServiceSelector: React.FC<DynamicServiceSelectorProps> = ({
  selectedServiceIds,
  onChange,
  error,
}) => {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDropdownExpanded, setIsDropdownExpanded] = useState(true);

  // Fetch active services dynamically from Supabase
  const fetchActiveServices = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data, error: err } = await supabase
        .from('services')
        .select('id, name, category, category_id, is_active, starting_price, estimated_duration')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (err) {
        throw err;
      }

      setServices(data || []);
    } catch (e: any) {
      console.error('Failed to load active services:', e);
      setFetchError('Unable to load services. Please check connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveServices();
  }, []);

  // Compute unique categories from active services
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach(s => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesCat =
        selectedCategory === 'All' ||
        (service.category && service.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [services, searchQuery, selectedCategory]);

  // Selected items detailed list
  const selectedItems = useMemo<SelectedServiceItem[]>(() => {
    const list: SelectedServiceItem[] = [];
    for (const id of selectedServiceIds) {
      const found = services.find(s => s.id === id);
      if (found) {
        list.push({
          serviceId: found.id,
          serviceName: found.name,
          category: found.category || undefined,
          price: found.starting_price,
          duration: found.estimated_duration,
        });
      }
    }
    return list;
  }, [selectedServiceIds, services]);

  const toggleService = (service: ServiceRecord) => {
    let nextIds: string[];
    if (selectedServiceIds.includes(service.id)) {
      nextIds = selectedServiceIds.filter(id => id !== service.id);
    } else {
      nextIds = [...selectedServiceIds, service.id];
    }

    const nextItems: SelectedServiceItem[] = [];
    for (const id of nextIds) {
      const found = services.find(s => s.id === id);
      if (found) {
        nextItems.push({
          serviceId: found.id,
          serviceName: found.name,
          category: found.category || undefined,
          price: found.starting_price,
          duration: found.estimated_duration,
        });
      }
    }

    onChange(nextIds, nextItems);
  };

  const removeServiceById = (serviceId: string) => {
    const nextIds = selectedServiceIds.filter(id => id !== serviceId);
    const nextItems = selectedItems.filter(item => item.serviceId !== serviceId);
    onChange(nextIds, nextItems);
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Briefcase size={18} color="#168A68" />
          <Text style={styles.headerTitle}>Services You Provide *</Text>
        </View>
        <TouchableOpacity
          style={styles.collapseToggle}
          onPress={() => setIsDropdownExpanded(!isDropdownExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.collapseToggleText}>
            {selectedServiceIds.length} Selected
          </Text>
          {isDropdownExpanded ? (
            <ChevronUp size={16} color="#168A68" />
          ) : (
            <ChevronDown size={16} color="#168A68" />
          )}
        </TouchableOpacity>
      </View>

      {/* Selected Services Compact Summary */}
      {selectedItems.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTitle}>Selected Services ({selectedItems.length})</Text>
            {selectedItems.length > 1 && (
              <TouchableOpacity onPress={() => onChange([], [])} activeOpacity={0.7}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chipsWrap}>
            {selectedItems.map(item => (
              <View key={item.serviceId} style={styles.selectedChip}>
                <Text style={styles.selectedChipText} numberOfLines={1}>
                  {item.serviceName}
                </Text>
                <TouchableOpacity
                  onPress={() => removeServiceById(item.serviceId)}
                  style={styles.chipRemoveBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#168A68" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Expandable Service Catalog Dropdown / Multi-Select */}
      {isDropdownExpanded && (
        <View style={styles.selectorCard}>
          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search size={15} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services (e.g. Chimney, Plumbing, Fan)..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Horizontal Scroll */}
          {categories.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    selectedCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Loading / Error / Service List */}
          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#168A68" />
              <Text style={styles.loadingText}>Loading live service catalog...</Text>
            </View>
          ) : fetchError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.fetchErrorText}>{fetchError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchActiveServices}>
                <RefreshCw size={13} color="#168A68" />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching services found.</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {filteredServices.map(service => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceItemRow,
                      isSelected && styles.serviceItemRowSelected,
                    ]}
                    onPress={() => toggleService(service)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    {/* Checkbox Box */}
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>

                    {/* Service Details */}
                    <View style={styles.serviceTextCol}>
                      <Text
                        style={[
                          styles.serviceName,
                          isSelected && styles.serviceNameSelected,
                        ]}
                      >
                        {service.name}
                      </Text>
                      {service.category ? (
                        <Text style={styles.serviceCategoryTag}>{service.category}</Text>
                      ) : null}
                    </View>

                    {service.starting_price ? (
                      <Text style={styles.servicePrice}>
                        ₹{service.starting_price}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {error ? <Text style={styles.validationErrorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10243A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  collapseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  collapseToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 10,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  clearAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A3D9C9',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 9,
    maxWidth: '95%',
  },
  selectedChipText: {
    fontSize: 12,
    color: '#168A68',
    fontWeight: '600',
    flexShrink: 1,
  },
  chipRemoveBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EAF8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBar: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#168A68',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  fetchErrorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#168A68',
  },
  retryBtnText: {
    fontSize: 12,
    color: '#168A68',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  servicesList: {
    maxHeight: 260,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  serviceItemRowSelected: {
    backgroundColor: '#F0FDF4',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  serviceTextCol: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#10243A',
  },
  serviceNameSelected: {
    color: '#0E5B47',
    fontWeight: '700',
  },
  serviceCategoryTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  servicePrice: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#168A68',
  },
  validationErrorText: {
    fontSize: 11.5,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
});
