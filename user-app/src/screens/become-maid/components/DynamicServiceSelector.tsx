import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { supabase } from '../../../config/supabase';
import {
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  X,
  Sparkles,
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
  display_order?: number;
}

interface CategoryRecord {
  id: string;
  name: string;
  is_active: boolean;
  display_order?: number;
}

interface CategoryGroup {
  categoryName: string;
  services: ServiceRecord[];
}

export const DynamicServiceSelector: React.FC<DynamicServiceSelectorProps> = ({
  selectedServiceIds,
  onChange,
  error,
}) => {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  /**
   * Fetch only ACTIVE services & categories directly from Supabase (Admin is single source of truth)
   */
  const fetchServiceCatalog = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      // 1. Fetch active categories from Admin service_categories table
      let activeCategories: CategoryRecord[] = [];
      try {
        const { data: catData, error: catErr } = await supabase
          .from('service_categories')
          .select('id, name, is_active, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!catErr && catData) {
          activeCategories = catData.map(c => ({
            id: c.id,
            name: c.name,
            is_active: Boolean(c.is_active),
            display_order: c.display_order,
          }));
        }
      } catch {
        // Table might be optional, fallback to grouping by service.category
      }

      // 2. Fetch active services
      const { data: servData, error: servErr } = await supabase
        .from('services')
        .select('id, name, category, category_id, is_active, starting_price, estimated_duration, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (servErr) {
        throw servErr;
      }

      const activeServices: ServiceRecord[] = (servData || []).map(s => ({
        id: s.id,
        name: s.name,
        category: s.category || 'General Services',
        category_id: s.category_id,
        is_active: Boolean(s.is_active),
        starting_price: s.starting_price,
        estimated_duration: s.estimated_duration,
        display_order: s.display_order,
      }));

      // Filter out any service whose parent category is deactivated in Admin
      let filteredServices = activeServices;
      if (activeCategories.length > 0) {
        const activeCategoryNames = new Set(activeCategories.map(c => c.name.toLowerCase()));
        const activeCategoryIds = new Set(activeCategories.map(c => c.id));
        filteredServices = activeServices.filter(s => {
          if (s.category_id && activeCategoryIds.has(s.category_id)) return true;
          if (s.category && activeCategoryNames.has(s.category.toLowerCase())) return true;
          return false;
        });
      }

      setCategories(activeCategories);
      setServices(filteredServices);

      // Auto-expand all categories by default so partner sees all options immediately
      const initialExpanded: Record<string, boolean> = {};
      filteredServices.forEach(s => {
        const cat = s.category || 'General';
        initialExpanded[cat] = true;
      });
      setExpandedCategories(initialExpanded);
    } catch (e: any) {
      console.error('Failed to load active services from Supabase:', e);
      setFetchError('Unable to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceCatalog();
  }, [fetchServiceCatalog]);

  /**
   * Group active services by Category
   */
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    const groupsMap = new Map<string, ServiceRecord[]>();

    for (const s of services) {
      if (query) {
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesCategory = s.category && s.category.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory) continue;
      }

      const catName = s.category?.trim() || 'General Services';
      if (!groupsMap.has(catName)) {
        groupsMap.set(catName, []);
      }
      groupsMap.get(catName)!.push(s);
    }

    const groups: CategoryGroup[] = [];
    groupsMap.forEach((servList, categoryName) => {
      groups.push({
        categoryName,
        services: servList,
      });
    });

    return groups;
  }, [services, searchQuery]);

  /**
   * Toggle category accordion expand/collapse
   * Allows multiple categories to remain expanded simultaneously
   * Does NOT clear or modify selected services
   */
  const toggleCategoryExpand = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  /**
   * Toggle a service selection on/off
   */
  const handleToggleService = (service: ServiceRecord) => {
    const isSelected = selectedServiceIds.includes(service.id);
    let nextIds: string[];
    if (isSelected) {
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
          category: found.category,
          price: found.starting_price,
          duration: found.estimated_duration,
        });
      }
    }

    onChange(nextIds, nextItems);
  };

  return (
    <View style={styles.container}>
      {/* Search Input for fast selection */}
      <View style={styles.searchBar}>
        <Search size={15} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search active services..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#168A68" />
          <Text style={styles.loadingText}>Fetching services from Admin catalog...</Text>
        </View>
      )}

      {/* Error State with Retry Button */}
      {!isLoading && fetchError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServiceCatalog} activeOpacity={0.8}>
            <RefreshCw size={13} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !fetchError && categoryGroups.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching services found.' : 'No services available right now.'}
          </Text>
        </View>
      )}

      {/* Expandable Category Sections */}
      {!isLoading && !fetchError && categoryGroups.length > 0 && (
        <View style={styles.categoryAccordionWrap}>
          {categoryGroups.map(group => {
            const isExpanded = expandedCategories[group.categoryName] ?? true;
            const categorySelectedCount = group.services.filter(s =>
              selectedServiceIds.includes(s.id)
            ).length;

            return (
              <View key={group.categoryName} style={styles.categoryCard}>
                {/* Expandable Category Header */}
                <TouchableOpacity
                  style={[
                    styles.categoryHeader,
                    isExpanded && styles.categoryHeaderExpanded,
                    categorySelectedCount > 0 && styles.categoryHeaderWithSelection,
                  ]}
                  onPress={() => toggleCategoryExpand(group.categoryName)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryNameText}>{group.categoryName}</Text>
                    {categorySelectedCount > 0 && (
                      <View style={styles.selectedCountPill}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.selectedCountPillText}>
                          {categorySelectedCount} selected
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.chevronBox}>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#168A68" />
                    ) : (
                      <ChevronDown size={18} color="#64748B" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Services List in Category */}
                {isExpanded && (
                  <View style={styles.servicesContainer}>
                    {group.services.map(service => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <TouchableOpacity
                          key={service.id}
                          style={[
                            styles.serviceRow,
                            isSelected && styles.serviceRowSelected,
                          ]}
                          onPress={() => handleToggleService(service)}
                          activeOpacity={0.7}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          {/* Green Checkbox */}
                          <View
                            style={[
                              styles.checkboxBox,
                              isSelected && styles.checkboxBoxSelected,
                            ]}
                          >
                            {isSelected && (
                              <Check size={13} color="#FFFFFF" strokeWidth={3} />
                            )}
                          </View>

                          {/* Service Name & Duration */}
                          <View style={styles.serviceInfoCol}>
                            <Text
                              style={[
                                styles.serviceName,
                                isSelected && styles.serviceNameSelected,
                              ]}
                            >
                              {service.name}
                            </Text>
                            {service.estimated_duration ? (
                              <Text style={styles.serviceMetaText}>
                                {service.estimated_duration}
                              </Text>
                            ) : null}
                          </View>

                          {/* Starting Price */}
                          {Boolean(service.starting_price) && (
                            <View style={styles.priceContainer}>
                              <Text
                                style={[
                                  styles.servicePrice,
                                  isSelected && styles.servicePriceSelected,
                                ]}
                              >
                                ₹{service.starting_price}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {error ? <Text style={styles.validationErrorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  searchBar: {
    height: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  errorContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginVertical: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#168A68',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  categoryAccordionWrap: {
    gap: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  categoryHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryHeaderWithSelection: {
    backgroundColor: '#F0FDF4',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#10243A',
  },
  selectedCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#168A68',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectedCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevronBox: {
    padding: 2,
  },
  servicesContainer: {
    backgroundColor: '#FFFFFF',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
    minHeight: 48,
  },
  serviceRowSelected: {
    backgroundColor: '#F0FDF4',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxSelected: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  serviceInfoCol: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  serviceNameSelected: {
    color: '#0E5B47',
    fontWeight: '700',
  },
  serviceMetaText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  priceContainer: {
    paddingLeft: 6,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  servicePriceSelected: {
    color: '#168A68',
  },
  validationErrorText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
});
