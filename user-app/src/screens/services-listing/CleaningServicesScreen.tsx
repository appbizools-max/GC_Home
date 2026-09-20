import React, { useState, useMemo } from 'react';
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
import { AppLogo } from '../../components/ui/AppLogo';
import { PromotionalOfferBanner } from '../../components/home/PromotionalOfferBanner';
import { SelectLocationModal } from '../../components/location/SelectLocationModal';
import { TwoColumnServicesGrid } from '../../components/common/TwoColumnServicesGrid';
import { resolveImageSource } from '../../utils/imageUtils';
import { ASSETS } from '../../assets/index';
import { Service } from '../../types';
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
} from 'lucide-react-native';



export const FULL_SERVICES_SEED: (Service & {
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: string;
  isFavorite?: boolean;
})[] = [
  {
    serviceId: 'srv_home_clean',
    name: 'Home Cleaning',
    category: 'Home',
    description: 'Complete home cleaning for a fresh and healthy living space',
    startingPrice: 699,
    estimatedDuration: '2 - 4 hrs',
    imageUrl: ASSETS.heroLivingRoom,
    isActive: true,
    features: ['All rooms dusted & mopped', 'Trash disposal', 'Eco-friendly solutions'],
    isBestseller: true,
    rating: 4.8,
    reviewCount: '2.1K',
  },
  {
    serviceId: 'srv_kitchen_clean',
    name: 'Kitchen Cleaning',
    category: 'Kitchen',
    description: 'Deep cleaning for a hygienic and sparkling kitchen',
    startingPrice: 599,
    estimatedDuration: '2 - 3 hrs',
    imageUrl: ASSETS.serviceKitchen,
    isActive: true,
    features: ['Oil & grease degreasing', 'Sink sanitize', 'Appliance exterior scrub'],
    isBestseller: false,
    rating: 4.7,
    reviewCount: '1.5K',
  },
  {
    serviceId: 'srv_bathroom_clean',
    name: 'Bathroom Cleaning',
    category: 'Bathroom',
    description: 'Remove dirt, stains and germs for a cleaner bathroom',
    startingPrice: 499,
    estimatedDuration: '2 - 3 hrs',
    imageUrl: ASSETS.serviceBathroom,
    isActive: true,
    features: ['Tile descaling', 'Mirror polish', 'Toilet sanitize & anti-bacterial scrub'],
    isBestseller: false,
    rating: 4.6,
    reviewCount: '1.2K',
  },
  {
    serviceId: 'srv_sofa_clean',
    name: 'Sofa & Carpet Cleaning',
    category: 'Sofa & Carpet',
    description: 'Deep clean your sofas, carpets and upholstery',
    startingPrice: 799,
    estimatedDuration: '1 - 3 hrs',
    imageUrl: ASSETS.serviceSofa,
    isActive: true,
    features: ['Deep shampoo extraction', 'Dust mite sanitization', 'Fabric dry care'],
    isBestseller: false,
    rating: 4.8,
    reviewCount: '980',
  },
  {
    serviceId: 'srv_deep_clean',
    name: 'Deep Cleaning',
    category: 'Deep Cleaning',
    description: 'Intensive cleaning for a healthier and fresher home',
    startingPrice: 1499,
    estimatedDuration: '4 - 6 hrs',
    imageUrl: ASSETS.serviceKitchen,
    isActive: true,
    features: ['Full sanitization', 'Behind appliances', 'Ceiling fans & windows'],
    isBestseller: true,
    rating: 4.9,
    reviewCount: '640',
  },
  {
    serviceId: 'srv_move_clean',
    name: 'Move-in / Move-out Cleaning',
    category: 'Home',
    description: 'Thorough cleaning for a fresh start in your new place',
    startingPrice: 1299,
    estimatedDuration: '3 - 5 hrs',
    imageUrl: ASSETS.heroLivingRoom,
    isActive: true,
    features: ['Empty house overhaul', 'Cabinet interiors', 'Disinfection wash'],
    isBestseller: false,
    rating: 4.7,
    reviewCount: '320',
  },
];

const CATEGORIES = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Home', label: 'Home', icon: HomeIcon },
  { id: 'Kitchen', label: 'Kitchen', icon: ChefHat },
  { id: 'Bathroom', label: 'Bathroom', icon: Bath },
  { id: 'Sofa & Carpet', label: 'Sofa & Carpet', icon: Armchair },
  { id: 'Deep Cleaning', label: 'Deep Cleaning', icon: Sparkles },
];

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
  const { navigateTo } = useAuth();
  const { cart, setCartService, cartItemsCount } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('recommended');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('HSR Layout, Bengaluru, Karnataka 560102');

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredServices = useMemo(() => {
    let result = FULL_SERVICES_SEED.filter(srv => {
      const matchCat = selectedCategory === 'All' || srv.category === selectedCategory;
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
  }, [selectedCategory, searchQuery, selectedSort]);

  const handleCardPress = (service: Service) => {
    setCartService(service);
    if (onSelectService) {
      onSelectService(service);
    } else {
      navigateTo('service-details');
    }
  };

  const handleQuickAdd = (service: Service) => {
    setCartService(service);
    navigateTo('service-details');
  };

  return (
    <View style={styles.safeContainer}>
      {/* Top Header Sticky Area */}
      <View style={styles.headerContainer}>
        {/* Row 1: Logo & Tagline on Left, Notification & Cart on Right */}
        <View style={styles.headerRow1}>
          <AppLogo size="sm" showTagline={true} align="left" />

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

        {/* Row 2: Location Single Line Dropdown & "Using current location" */}
        <View style={styles.headerRow2}>
          <TouchableOpacity
            style={styles.locationDropdown}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locationPinBox}>
              <Navigation size={12} color="#168A68" fill="#168A68" />
            </View>
            <Text style={styles.locationAddressText} numberOfLines={1}>
              {currentLocation}
            </Text>
            <ChevronDown size={14} color="#10243A" />
          </TouchableOpacity>

          <View style={styles.currentLocIndicator}>
            <Text style={styles.currentLocText}>Using current location</Text>
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
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.catIconBox, isSelected && styles.catIconBoxSelected]}>
                  <Icon size={16} color={isSelected ? '#FFFFFF' : '#168A68'} />
                </View>
                <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                  {cat.label}
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
    marginBottom: 8,
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
