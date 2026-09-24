import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';


import { PromotionalOfferBanner } from '../../components/home/PromotionalOfferBanner';
import { SelectLocationModal } from '../../components/location/SelectLocationModal';
import { TwoColumnServicesGrid } from '../../components/common/TwoColumnServicesGrid';
import { FloatingCartBar } from '../../components/common/FloatingCartBar';
import { resolveImageSource } from '../../utils/imageUtils';
import { ASSETS } from '../../assets/index';
import { Service } from '../../types';
import { homeService, ServiceCategory, normalizeLocationString } from '../../services/homeService';
import { supabase } from '../../config/supabase';
import {
  Bell,
  ShoppingCart,
  ChevronDown,
  Search,
  X,
  Heart,
  Star,
  Clock,
  Plus,
  SlidersHorizontal,
  Sparkles,
  LayoutGrid,
  Home as HomeIcon,
  ChefHat,
  Bath,
  Armchair,
  CheckCircle2,
  Navigation,
  Sofa,
  Bed,
  Layers,
  Maximize2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Truck,
  Briefcase,
  Wrench,
  Package,
  KeyRound,
  Utensils,
} from 'lucide-react-native';



export const FULL_SERVICES_SEED: (Service & {
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: string;
  isFavorite?: boolean;
})[] = [];

const DEFAULT_CATEGORIES: ServiceCategory[] = [];

const renderCategoryIcon = (iconName?: string, color: string = '#168A68') => {
  const sz = 16;
  switch (iconName) {
    // Full Home Cleaning
    case 'home':         return <HomeIcon size={sz} color={color} />;
    // Kitchen Cleaning
    case 'utensils':     return <Utensils size={sz} color={color} />;
    case 'kitchen':      return <ChefHat size={sz} color={color} />;
    // Bathroom Cleaning
    case 'bath':         return <Bath size={sz} color={color} />;
    // Living Room Cleaning
    case 'couch':        return <Sofa size={sz} color={color} />;
    // Bedroom Cleaning
    case 'bed':          return <Bed size={sz} color={color} />;
    // Sofa Cleaning
    case 'armchair':     return <Armchair size={sz} color={color} />;
    case 'sofa':         return <Armchair size={sz} color={color} />;
    // Mattress Cleaning
    case 'sparkles':     return <Sparkles size={sz} color={color} />;
    // Floor Cleaning
    case 'layers':       return <Layers size={sz} color={color} />;
    // Window & Glass Cleaning
    case 'maximize':     return <Maximize2 size={sz} color={color} />;
    // Regular Cleaning
    case 'clock':        return <Clock size={sz} color={color} />;
    // Deep Cleaning
    case 'deep':         return <Sparkles size={sz} color={color} />;
    case 'shield-check': return <ShieldCheck size={sz} color={color} />;
    // Sanitization
    case 'activity':     return <Activity size={sz} color={color} />;
    // Pest Control
    case 'alert-triangle': return <AlertTriangle size={sz} color={color} />;
    // Car Cleaning
    case 'truck':        return <Truck size={sz} color={color} />;
    // Office Cleaning
    case 'briefcase':    return <Briefcase size={sz} color={color} />;
    // Post-Construction Cleaning
    case 'tool':         return <Wrench size={sz} color={color} />;
    // Move-In Cleaning
    case 'package':      return <Package size={sz} color={color} />;
    // Move-Out Cleaning
    case 'key':          return <KeyRound size={sz} color={color} />;
    case 'more':
    default:
      return <LayoutGrid size={sz} color={color} />;
  }
};

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Rating' },
  { id: 'popular', label: 'Popular' },
];

interface CleaningServicesScreenProps {
  onSelectService?: (service: Service) => void;
  onOpenNotifications?: () => void;
  onOpenCart?: () => void;
}

export const CleaningServicesScreen: React.FC<CleaningServicesScreenProps> = ({
  onSelectService,
  onOpenNotifications,
  onOpenCart,
}) => {
  const { navigateTo, navigationPayload, savedAddresses } = useAuth();
  const { cart, addServiceToCart, cartItemsCount } = useCart();

  const defaultLocation = normalizeLocationString(
    savedAddresses && savedAddresses.length > 0
      ? `${savedAddresses[0].locality || savedAddresses[0].street}, ${savedAddresses[0].city} ${savedAddresses[0].pincode}`
      : 'HSR Layout, Bengaluru, Karnataka 560102'
  );

  const initialServices = homeService.getCachedServices();
  const initialCategories = homeService.getCachedCategories();

  const [liveCategories, setLiveCategories] = useState<ServiceCategory[]>(initialCategories || []);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    navigationPayload?.categoryId || navigationPayload?.categoryName || 'All'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('recommended');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(defaultLocation);

  const [liveServices, setLiveServices] = useState<(Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[]>(initialServices || []);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(!initialServices || initialServices.length === 0);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const requestIdRef = React.useRef<number>(0);

  // Sync category selection whenever navigation payload updates (e.g. from Home category icons)
  useEffect(() => {
    if (navigationPayload?.categoryId) {
      setSelectedCategory(navigationPayload.categoryId);
    } else if (navigationPayload?.categoryName) {
      setSelectedCategory(navigationPayload.categoryName);
    }
  }, [navigationPayload]);

  const loadCategories = async (force = false) => {
    try {
      const data = await homeService.getCategoriesFromSupabase(force);
      if (data && data.length > 0) {
        setLiveCategories(data);
      }
    } catch {
      // keep fallback
    }
  };

  const loadServices = async (isSilent = false, forceRefresh = false) => {
    const currentReqId = ++requestIdRef.current;
    
    // Check cache first
    const cached = homeService.getCachedServices();
    if (cached && liveServices.length === 0) {
      setLiveServices(cached);
      setIsLoadingServices(false);
    } else if (!isSilent && liveServices.length === 0) {
      setIsLoadingServices(true);
    }
    setServicesError(null);

    try {
      const data = await homeService.getServicesFromSupabase(forceRefresh);
      if (currentReqId !== requestIdRef.current) return;
      if (data) {
        setLiveServices(data);
      }
    } catch (err: any) {
      if (currentReqId !== requestIdRef.current) return;
      if (liveServices.length === 0) {
        setServicesError(err?.message || 'Unable to load cleaning services');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoadingServices(false);
      }
    }
  };

  useEffect(() => {
    loadServices();
    loadCategories();

    const channel = supabase
      .channel('cleaning_services_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        loadServices(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_categories' }, () => {
        loadServices(true);
        loadCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categoryChips = useMemo(() => {
    const allChip: ServiceCategory = {
      id: 'All',
      name: 'All',
      iconName: 'more',
      bgColor: '#EAF8F1',
      iconColor: '#168A68',
      routeCategory: 'all',
    };
    return [allChip, ...liveCategories];
  }, [liveCategories]);

  const filteredServices = useMemo(() => {
    let result = liveServices.filter(srv => {
      const matchCat =
        selectedCategory === 'All' ||
        srv.categoryId === selectedCategory ||
        (srv.category && srv.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchQuery =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });

    if (selectedSort === 'price_low') {
      result = [...result].sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (selectedSort === 'price_high') {
      result = [...result].sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (selectedSort === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [liveServices, selectedCategory, searchQuery, selectedSort]);

  const handleCardPress = (service: Service) => {
    addServiceToCart(service, 1);
    if (onSelectService) {
      onSelectService(service);
    } else {
      navigateTo('service-details');
    }
  };

  const handleQuickAdd = (service: Service) => {
    addServiceToCart(service, 1);
  };

  return (
    <View style={styles.safeContainer}>
      {/* Top Header Sticky Area */}
      <View style={styles.headerContainer}>
        {/* Row 1: "Services" title on Left, Notification & Cart on Right */}
        <View style={styles.headerRow1}>
          <Text style={styles.screenTitle}>Services</Text>

          <View style={styles.headerIconsGroup}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenNotifications || (() => navigateTo('notifications'))}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Bell size={20} color="#10243A" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={onOpenCart || (() => navigateTo('booking-summary'))}
              activeOpacity={0.7}
              accessibilityLabel="Cart"
            >
              <ShoppingCart size={20} color="#10243A" />
              {cartItemsCount > 0 && (
                <View style={[styles.badge, styles.cartBadge]}>
                  <Text style={styles.badgeText}>{cartItemsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar Input */}
        <View style={styles.searchBar}>
          <Search size={18} color="#68788C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for cleaning services, e.g. home cleaning..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={16} color="#68788C" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontal Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {categoryChips.map(cat => {
            const isSelected =
              selectedCategory === cat.id ||
              (selectedCategory !== 'All' &&
                (selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                 selectedCategory.toLowerCase() === cat.routeCategory?.toLowerCase()));
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.catIconBox, isSelected && styles.catIconBoxSelected]}>
                  {renderCategoryIcon(cat.iconName, isSelected ? '#FFFFFF' : '#168A68')}
                </View>
                <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                  {cat.name.replace('\n', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Heading & Sort Dropdown */}
        <View style={styles.headingSortRow}>
          <View style={styles.headingCol}>
            <Text style={styles.mainTitle}>Cleaning Services</Text>
            <Text style={styles.mainSubtitle}>
              Professional cleaning for every corner of your home
            </Text>
          </View>

          <View style={styles.sortWrapper}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortDropdown(!showSortDropdown)}
              activeOpacity={0.8}
            >
              <Text style={styles.sortButtonText}>
                {selectedSort === 'recommended' ? 'Sort by' : SORT_OPTIONS.find(s => s.id === selectedSort)?.label}
              </Text>
              <ChevronDown size={14} color="#10243A" />
            </TouchableOpacity>

            {showSortDropdown && (
              <View style={styles.sortMenu}>
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.sortMenuItem, selectedSort === opt.id && styles.sortMenuItemActive]}
                    onPress={() => {
                      setSelectedSort(opt.id);
                      setShowSortDropdown(false);
                    }}
                  >
                    <Text
                      style={[styles.sortMenuText, selectedSort === opt.id && styles.sortMenuTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* TWO-COLUMN SERVICES GRID */}
        <TwoColumnServicesGrid
          services={filteredServices}
          isLoading={isLoadingServices}
          error={servicesError}
          onRetry={() => loadServices()}
          onSelectService={handleCardPress}
          onQuickAdd={handleQuickAdd}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          emptyMessage="No cleaning services found"
          emptySubMessage="Try searching with different keywords or selecting 'All' category"
        />

        {/* Promotional Offer Banner */}
        <View style={styles.promoWrapper}>
          <PromotionalOfferBanner
            offer={{
              id: 'promo_gchome20',
              code: 'GCHOME20',
              discountText: 'Get 20% OFF',
              subtitle: 'on your first booking!',
              discountPercent: 20,
              badgeText: 'Trusted\nCleaning\nProfessionals 💚',
            }}
            onApplyOffer={code => {}}
          />
        </View>
      </ScrollView>

      {/* Select Location Modal */}
      <SelectLocationModal
        visible={showLocationModal}
        currentAddress={currentLocation}
        onSelectAddress={loc => setCurrentLocation(loc)}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Floating Bottom Swiggy-Style Cart Bar */}
      <FloatingCartBar bottomOffset={16} />
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10243A',
    letterSpacing: -0.3,
  },
  headerIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5FCF8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadge: {
    backgroundColor: '#168A68',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  locationDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  locationPinBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationAddressText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10243A',
    flex: 1,
  },
  currentLocIndicator: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentLocText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#168A68',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#10243A',
    fontWeight: '500',
    paddingVertical: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  categoryChipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryChip: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    minWidth: 64,
  },
  categoryChipSelected: {
    backgroundColor: '#EAF8F1',
    borderColor: '#168A68',
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catIconBoxSelected: {
    backgroundColor: '#168A68',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#68788C',
  },
  catChipTextSelected: {
    color: '#0E5B47',
    fontWeight: '800',
  },
  headingSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    zIndex: 10,
  },
  headingCol: {
    flex: 1,
    paddingRight: 8,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#10243A',
  },
  mainSubtitle: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 1,
  },
  sortWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  sortButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10243A',
  },
  sortMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    zIndex: 30,
  },
  sortMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sortMenuItemActive: {
    backgroundColor: '#EAF8F1',
  },
  sortMenuText: {
    fontSize: 11.5,
    color: '#10243A',
    fontWeight: '600',
  },
  sortMenuTextActive: {
    color: '#0E5B47',
    fontWeight: '800',
  },
  promoWrapper: {
    marginTop: 4,
  },
});
