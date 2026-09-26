import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { supabase } from '../../../config/supabase';
import {
  Check,
  ChevronRight,
  RefreshCw,
  Search,
  X,
  Layers,
  Sparkles,
} from 'lucide-react-native';

export interface SelectedServiceItem {
  serviceId: string;
  serviceName: string;
  category?: string;
  duration?: string;
  subServiceIds?: string[];
  subServices?: { id: string; name: string }[];
}

export interface DynamicServiceSelectorProps {
  selectedServiceIds: string[];
  selectedSubServiceIds?: string[];
  onChange: (
    serviceIds: string[],
    items: SelectedServiceItem[],
    subServiceIds?: string[]
  ) => void;
  error?: string;
}

interface SubServiceRecord {
  id: string;
  service_id: string;
  name: string;
  is_active: boolean;
  display_order?: number;
}

interface ServiceRecord {
  id: string;
  name: string;
  category?: string;
  category_id?: string;
  is_active: boolean;
  estimated_duration?: string;
  display_order?: number;
  subServices: SubServiceRecord[];
}

interface CategoryRecord {
  id: string;
  name: string;
  is_active: boolean;
  display_order?: number;
  services: ServiceRecord[];
}

export const DynamicServiceSelector: React.FC<DynamicServiceSelectorProps> = ({
  selectedServiceIds = [],
  selectedSubServiceIds = [],
  onChange,
  error,
}) => {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeSubIds = selectedSubServiceIds || [];

  /**
   * Fetch active Categories, Services, and Sub-services directly from Supabase Admin catalog
   */
  const fetchServiceCatalog = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      // 1. Fetch categories, services, and addons (sub-services) concurrently
      const [catRes, servRes, addonRes] = await Promise.all([
        supabase
          .from('service_categories')
          .select('id, name, is_active, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('services')
          .select('id, name, category, category_id, is_active, estimated_duration, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('service_addons')
          .select('id, service_id, name, is_active, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
      ]);

      if (servRes.error) throw servRes.error;

      const rawCats = catRes.data || [];
      const rawServs = servRes.data || [];
      const rawAddons: SubServiceRecord[] = (addonRes.data || []).map(a => ({
        id: a.id,
        service_id: a.service_id,
        name: a.name,
        is_active: Boolean(a.is_active),
        display_order: a.display_order,
      }));

      // Group addons by service_id
      const addonsByServiceId = new Map<string, SubServiceRecord[]>();
      for (const addon of rawAddons) {
        if (!addonsByServiceId.has(addon.service_id)) {
          addonsByServiceId.set(addon.service_id, []);
        }
        addonsByServiceId.get(addon.service_id)!.push(addon);
      }

      // Build services with sub-services
      const allServices: ServiceRecord[] = rawServs.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category || 'General',
        category_id: s.category_id,
        is_active: Boolean(s.is_active),
        estimated_duration: s.estimated_duration,
        display_order: s.display_order,
        subServices: addonsByServiceId.get(s.id) || [],
      }));

      // Build categories list
      const categoryMap = new Map<string, CategoryRecord>();

      // Prepopulate with admin categories
      for (const cat of rawCats) {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          is_active: Boolean(cat.is_active),
          display_order: cat.display_order,
          services: [],
        });
      }

      // Attach services to categories
      for (const s of allServices) {
        let assignedCat = s.category_id ? categoryMap.get(s.category_id) : null;

        // Fallback matching by category name
        if (!assignedCat && s.category) {
          for (const cat of categoryMap.values()) {
            if (cat.name.toLowerCase() === s.category.toLowerCase()) {
              assignedCat = cat;
              break;
            }
          }
        }

        // If category is not in service_categories table, create dynamic category
        if (!assignedCat) {
          const fallbackCatName = s.category || 'General Services';
          const fallbackCatId = `cat_${fallbackCatName.toLowerCase().replace(/\s+/g, '_')}`;
          if (!categoryMap.has(fallbackCatId)) {
            categoryMap.set(fallbackCatId, {
              id: fallbackCatId,
              name: fallbackCatName,
              is_active: true,
              display_order: 99,
              services: [],
            });
          }
          assignedCat = categoryMap.get(fallbackCatId)!;
        }

        assignedCat.services.push(s);
      }

      // Filter out empty categories
      const activeCategoryList = Array.from(categoryMap.values()).filter(
        c => c.services.length > 0
      );

      setCategories(activeCategoryList);

      // Default select first category
      if (activeCategoryList.length > 0) {
        setSelectedCategoryId(prev => (prev ? prev : activeCategoryList[0].id));
      }
    } catch (e: any) {
      console.error('Failed to load active services from Supabase:', e);
      setFetchError('Unable to load services catalog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceCatalog();
  }, [fetchServiceCatalog]);

  /**
   * Filtered categories and services based on search query
   */
  const filteredCategories = useMemo<CategoryRecord[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;

    return categories
      .map(cat => {
        const matchesCategory = cat.name.toLowerCase().includes(q);
        const matchedServices = cat.services.filter(s => {
          if (matchesCategory) return true;
          if (s.name.toLowerCase().includes(q)) return true;
          return s.subServices.some(sub => sub.name.toLowerCase().includes(q));
        });

        if (matchedServices.length > 0) {
          return {
            ...cat,
            services: matchedServices,
          };
        }
        return null;
      })
      .filter((c): c is CategoryRecord => c !== null);
  }, [categories, searchQuery]);

  // Current active category
  const activeCategory = useMemo(() => {
    if (filteredCategories.length === 0) return null;
    const found = filteredCategories.find(c => c.id === selectedCategoryId);
    return found || filteredCategories[0];
  }, [filteredCategories, selectedCategoryId]);

  /**
   * Helper to emit state changes to parent
   */
  const emitChanges = (nextServiceIds: string[], nextSubIds: string[]) => {
    const allServices = categories.flatMap(c => c.services);
    const nextItems: SelectedServiceItem[] = [];

    for (const servId of nextServiceIds) {
      const s = allServices.find(x => x.id === servId);
      if (s) {
        const activeSubForThis = s.subServices.filter(sub => nextSubIds.includes(sub.id));
        nextItems.push({
          serviceId: s.id,
          serviceName: s.name,
          category: s.category,
          duration: s.estimated_duration,
          subServiceIds: activeSubForThis.map(sub => sub.id),
          subServices: activeSubForThis.map(sub => ({ id: sub.id, name: sub.name })),
        });
      }
    }

    onChange(nextServiceIds, nextItems, nextSubIds);
  };

  /**
   * Toggle a main service
   */
  const handleToggleService = (service: ServiceRecord) => {
    const isCurrentlySelected = selectedServiceIds.includes(service.id);
    let nextServiceIds: string[];
    let nextSubIds = [...activeSubIds];

    if (isCurrentlySelected) {
      // Uncheck service -> also uncheck its sub-services
      nextServiceIds = selectedServiceIds.filter(id => id !== service.id);
      const subIdsToRemove = new Set(service.subServices.map(sub => sub.id));
      nextSubIds = nextSubIds.filter(id => !subIdsToRemove.has(id));
    } else {
      // Check service
      nextServiceIds = [...selectedServiceIds, service.id];
    }

    emitChanges(nextServiceIds, nextSubIds);
  };

  /**
   * Toggle a sub-service
   */
  const handleToggleSubService = (service: ServiceRecord, sub: SubServiceRecord) => {
    const isSubSelected = activeSubIds.includes(sub.id);
    let nextSubIds: string[];
    let nextServiceIds = [...selectedServiceIds];

    if (isSubSelected) {
      // Uncheck sub-service
      nextSubIds = activeSubIds.filter(id => id !== sub.id);
    } else {
      // Check sub-service -> automatically ensure parent service is selected
      nextSubIds = [...activeSubIds, sub.id];
      if (!nextServiceIds.includes(service.id)) {
        nextServiceIds.push(service.id);
      }
    }

    emitChanges(nextServiceIds, nextSubIds);
  };

  // Compute how many services are selected in a category
  const getCategorySelectionCount = (cat: CategoryRecord): number => {
    return cat.services.filter(s => selectedServiceIds.includes(s.id)).length;
  };

  const totalSelectedCount = selectedServiceIds.length;

  return (
    <View style={styles.container}>
      {/* ── Search Input ── */}
      <View style={styles.searchBar}>
        <Search size={15} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories or services..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#168A68" />
          <Text style={styles.loadingText}>Loading catalog from Admin Service Catalog...</Text>
        </View>
      )}

      {/* Error View with Retry */}
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
      {!isLoading && !fetchError && filteredCategories.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching services found.' : 'No active services in the catalog.'}
          </Text>
        </View>
      )}

      {/* ── Hierarchical Service Selection UI ── */}
      {!isLoading && !fetchError && filteredCategories.length > 0 && (
        <View style={styles.hierarchicalWrap}>
          {/* 1. Category Selection Tabs / Chips */}
          <View style={styles.categorySectionHeader}>
            <Text style={styles.stepIndicatorLabel}>1. SELECT CATEGORY</Text>
            {totalSelectedCount > 0 && (
              <View style={styles.totalSelectedBadge}>
                <Check size={10} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.totalSelectedBadgeText}>
                  {totalSelectedCount} service{totalSelectedCount === 1 ? '' : 's'} selected
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsScroll}
          >
            {filteredCategories.map(cat => {
              const isActive = activeCategory?.id === cat.id;
              const count = getCategorySelectionCount(cat);

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                    count > 0 && styles.categoryChipHasSelection,
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && styles.categoryChipTextActive,
                      count > 0 && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {count > 0 && (
                    <View style={styles.categoryCountBadge}>
                      <Text style={styles.categoryCountBadgeText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 2. Services Under Selected Category */}
          {activeCategory && (
            <View style={styles.categoryServicesBox}>
              <View style={styles.servicesHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepIndicatorLabel}>
                    2. SERVICES IN {activeCategory.name.toUpperCase()}
                  </Text>
                  <Text style={styles.servicesHeaderSub}>
                    Select the services & sub-services you offer
                  </Text>
                </View>
              </View>

              {/* List of Services in this Category */}
              <View style={styles.servicesList}>
                {activeCategory.services.map(service => {
                  const isServiceSelected = selectedServiceIds.includes(service.id);
                  const hasSubServices = service.subServices.length > 0;
                  const selectedSubCount = service.subServices.filter(sub =>
                    activeSubIds.includes(sub.id)
                  ).length;

                  return (
                    <View
                      key={service.id}
                      style={[
                        styles.serviceCard,
                        isServiceSelected && styles.serviceCardSelected,
                      ]}
                    >
                      {/* Service Main Row */}
                      <TouchableOpacity
                        style={styles.serviceRow}
                        onPress={() => handleToggleService(service)}
                        activeOpacity={0.7}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isServiceSelected }}
                      >
                        {/* Checkbox */}
                        <View
                          style={[
                            styles.checkboxBox,
                            isServiceSelected && styles.checkboxBoxSelected,
                          ]}
                        >
                          {isServiceSelected && (
                            <Check size={13} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>

                        {/* Service Title */}
                        <View style={styles.serviceInfoCol}>
                          <Text
                            style={[
                              styles.serviceName,
                              isServiceSelected && styles.serviceNameSelected,
                            ]}
                          >
                            {service.name}
                          </Text>
                          {hasSubServices && (
                            <Text style={styles.subServicesCountHint}>
                              {service.subServices.length} sub-service{service.subServices.length === 1 ? '' : 's'} available
                              {selectedSubCount > 0 ? ` • ${selectedSubCount} selected` : ''}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* 3. Sub-services Under This Service */}
                      {hasSubServices && isServiceSelected && (
                        <View style={styles.subServicesContainer}>
                          <View style={styles.subServicesHeaderRow}>
                            <Text style={styles.subServicesTitle}>
                              Sub-services for {service.name}:
                            </Text>
                          </View>

                          <View style={styles.subServicesList}>
                            {service.subServices.map(sub => {
                              const isSubChecked = activeSubIds.includes(sub.id);

                              return (
                                <TouchableOpacity
                                  key={sub.id}
                                  style={[
                                    styles.subServiceRow,
                                    isSubChecked && styles.subServiceRowChecked,
                                  ]}
                                  onPress={() => handleToggleSubService(service, sub)}
                                  activeOpacity={0.7}
                                >
                                  <View
                                    style={[
                                      styles.subCheckbox,
                                      isSubChecked && styles.subCheckboxChecked,
                                    ]}
                                  >
                                    {isSubChecked && (
                                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                                    )}
                                  </View>
                                  <Text
                                    style={[
                                      styles.subServiceName,
                                      isSubChecked && styles.subServiceNameChecked,
                                    ]}
                                  >
                                    {sub.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
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
    marginBottom: 8,
  },
  searchBar: {
    height: 38,
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
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  errorContainer: {
    paddingVertical: 16,
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
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  hierarchicalWrap: {
    gap: 10,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepIndicatorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  totalSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#168A68',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  totalSelectedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryChipsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  categoryChipActive: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  categoryChipHasSelection: {
    borderColor: '#168A68',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryChipTextSelected: {
    color: '#168A68',
  },
  categoryCountBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  categoryCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  categoryServicesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 4,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  servicesHeaderSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  servicesList: {
    gap: 8,
  },
  serviceCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  serviceCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
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
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceNameSelected: {
    color: '#064E3B',
  },
  subServicesCountHint: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  subServicesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    backgroundColor: '#F8FCF9',
  },
  subServicesHeaderRow: {
    marginBottom: 6,
  },
  subServicesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  subServicesList: {
    gap: 6,
    paddingLeft: 6,
  },
  subServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  subServiceRowChecked: {
    opacity: 1,
  },
  subCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  subCheckboxChecked: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  subServiceName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  subServiceNameChecked: {
    color: '#064E3B',
    fontWeight: '700',
  },
  validationErrorText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
});
