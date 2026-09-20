import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  homeService,
  HeroBanner,
  ServiceCategory,
  PromoOffer,
  NotificationItem,
  HERO_BANNERS_SEED,
  SERVICE_CATEGORIES_SEED,
  NEARBY_SERVICES_SEED,
  PROMO_OFFER_SEED,
  NOTIFICATIONS_SEED,
} from '../../services/homeService';
import { Service } from '../../types';

// Subcomponents
import { GCHeader } from '../../components/home/GCHeader';
import { LocationSelectionModal } from '../../components/home/LocationSelectionModal';
import { SearchServicesModal } from '../../components/home/SearchServicesModal';
import { HeroBannerCarousel } from '../../components/home/HeroBannerCarousel';
import { ServiceCategoryRow } from '../../components/home/ServiceCategoryRow';
import { PromotionalOfferBanner } from '../../components/home/PromotionalOfferBanner';
import { ServicesNearYouRow } from '../../components/home/ServicesNearYouRow';
import { QuickAddServiceModal } from '../../components/home/QuickAddServiceModal';
import { WhyChooseSection } from '../../components/home/WhyChooseSection';
import { LowerBrandBanner } from '../../components/home/LowerBrandBanner';
import { NotificationsModal } from '../../components/home/NotificationsModal';
import { OffersModal } from '../../components/home/OffersModal';
import { AboutGCModal } from '../../components/home/AboutGCModal';
import { AddressInputModal } from '../../components/ui/AddressInputModal';
import { DashboardSkeleton } from '../../components/home/DashboardSkeleton';

// Icons
import { Search, Sparkles, UserCheck, ChevronRight } from 'lucide-react-native';

export const CustomerHomeScreen: React.FC = () => {
  const { user, services, savedAddresses, navigateTo } = useAuth();
  const { setCartService } = useCart();

  // Selected Location State
  const defaultLocation =
    savedAddresses && savedAddresses.length > 0
      ? `${savedAddresses[0].locality || savedAddresses[0].street}, ${savedAddresses[0].city} ${savedAddresses[0].pincode}`
      : 'HSR Layout, Bengaluru, Karnataka 560102';

  const [currentLocation, setCurrentLocation] = useState<string>(defaultLocation);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamic Content State
  const [banners, setBanners] = useState<HeroBanner[]>(HERO_BANNERS_SEED);
  const [categories, setCategories] = useState<ServiceCategory[]>(SERVICE_CATEGORIES_SEED);
  const [nearbyServices, setNearbyServices] = useState<
    (Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[]
  >(NEARBY_SERVICES_SEED);
  const [promoOffer, setPromoOffer] = useState<PromoOffer>(PROMO_OFFER_SEED);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS_SEED);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals Visibility
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showOffersModal, setShowOffersModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState<boolean>(false);

  // Quick Add State
  const [selectedQuickAddService, setSelectedQuickAddService] = useState<Service | null>(null);

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      const data = await homeService.getDashboardData(currentLocation);
      setBanners(data.banners);
      setCategories(data.categories);
      setNearbyServices(data.services);
      setPromoOffer(data.promoOffer);
      setNotifications(data.notifications);
    } catch {
      // Fallbacks are already set in state
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick Booking Handler from QuickAdd Modal
  const handleProceedToBooking = (service: Service, roomCount: number, totalPrice: number) => {
    navigateTo('booking_screen', {
      service: {
        ...service,
        startingPrice: totalPrice,
      },
      roomCount,
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.screenContainer}>
      {/* ── Fixed Compact Header (Logo, Tagline, Bell, Avatar & Location Below) ── */}
      <GCHeader
        currentLocation={currentLocation}
        unreadNotificationsCount={unreadCount}
        profilePhotoUri={user?.profilePhoto}
        onOpenLocation={() => setShowLocationModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenProfile={() => navigateTo('user_profile')}
      />

      {/* ── Main Scrollable Dashboard Content ── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#168A68']}
            tintColor="#168A68"
          />
        }
      >
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Search Bar Trigger ── */}
            <View style={styles.searchSection}>
              <TouchableOpacity
                style={styles.searchBarButton}
                onPress={() => setShowSearchModal(true)}
                activeOpacity={0.85}
                accessibilityLabel="Search for cleaning services"
              >
                <Search size={18} color="#168A68" />
                <Text style={styles.searchPlaceholderText} numberOfLines={1}>
                  Search for cleaning services, e.g. home cleaning...
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── 1. Hero Banner Carousel ── */}
            <HeroBannerCarousel
              banners={banners}
              onPressBanner={banner => {
                const targetService = nearbyServices.find(s => s.serviceId === banner.serviceId) || nearbyServices[0];
                setCartService(targetService);
                navigateTo('service-details');
              }}
            />

            {/* ── 2. Service Categories (Horizontal Pastel Badges) ── */}
            <ServiceCategoryRow
              categories={categories}
              onSelectCategory={cat => {
                navigateTo('services-listing');
              }}
            />

            {/* ── 3. Promotional Offer Banner ── */}
            <PromotionalOfferBanner
              offer={promoOffer}
              onApplyOffer={code => {
                showToast(`Promo code '${code}' copied! Apply at checkout.`);
              }}
            />

            {/* ── Become a Maid Partner Banner ── */}
            <TouchableOpacity
              onPress={() => navigateTo('become_maid_info')}
              style={{
                backgroundColor: '#043927',
                borderRadius: 16,
                padding: 16,
                marginHorizontal: 16,
                marginVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
              }}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                    Become a GC Maid Partner
                  </Text>
                  <Text style={{ fontSize: 11, color: '#A7F3D0', marginTop: 2 }}>
                    Earn up to ₹35,000/mo • Weekly payouts • Flexible hours
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* ── 4. Services Near You (Horizontal Cards with Quick Add) ── */}
            <ServicesNearYouRow
              services={nearbyServices}
              currentLocationName={currentLocation}
              onSelectService={service => {
                setCartService(service);
                navigateTo('service-details');
              }}
              onQuickAdd={service => {
                setCartService(service);
                navigateTo('service-details');
              }}
              onViewAll={() => {
                navigateTo('services-listing');
              }}
            />

            {/* ── 5. Why Choose GC Home Plus (5 Trust Badges) ── */}
            <WhyChooseSection onViewAll={() => setShowAboutModal(true)} />

            {/* ── 6. Lower Brand Banner (Clean Homes Healthier Communities) ── */}
            <LowerBrandBanner onPressKnowMore={() => setShowAboutModal(true)} />
          </>
        )}
      </ScrollView>

      {/* ── Floating Notification Toast ── */}
      {toastMessage && (
        <View style={styles.toastCard}>
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Modals & Bottom Sheets ── */}
      <LocationSelectionModal
        visible={showLocationModal}
        currentLocation={currentLocation}
        savedAddresses={savedAddresses}
        onSelectAddress={addr => {
          setCurrentLocation(addr);
          showToast(`Location updated to ${addr.split(',')[0]}`);
        }}
        onAddNewAddress={() => {
          setShowLocationModal(false);
          setShowAddAddressModal(true);
        }}
        onClose={() => setShowLocationModal(false)}
      />

      <SearchServicesModal
        visible={showSearchModal}
        services={services && services.length > 0 ? services : nearbyServices}
        onSelectService={service => {
          setShowSearchModal(false);
          navigateTo('service_details', { service });
        }}
        onClose={() => setShowSearchModal(false)}
      />

      <NotificationsModal
        visible={showNotificationsModal}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          showToast('All notifications marked as read.');
        }}
        onClose={() => setShowNotificationsModal(false)}
      />

      <OffersModal
        visible={showOffersModal}
        onApplyOffer={code => {
          showToast(`Coupon '${code}' copied to clipboard!`);
          setShowOffersModal(false);
        }}
        onClose={() => setShowOffersModal(false)}
      />

      <QuickAddServiceModal
        visible={Boolean(selectedQuickAddService)}
        service={selectedQuickAddService}
        onProceedToBooking={handleProceedToBooking}
        onClose={() => setSelectedQuickAddService(null)}
      />

      <AboutGCModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <AddressInputModal
        visible={showAddAddressModal}
        currentAddress={currentLocation}
        selectedCity="Bengaluru, Karnataka"
        onSave={newAddr => {
          setCurrentLocation(newAddr);
          showToast('New address saved!');
        }}
        onClose={() => setShowAddAddressModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
  },
  searchBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 13,
    color: '#68788C',
    fontWeight: '500',
  },
  toastCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0E5B47',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 99,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
});
