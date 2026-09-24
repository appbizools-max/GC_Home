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
  normalizeLocationString,
} from '../../services/homeService';
import { Service } from '../../types';
import { supabase } from '../../config/supabase';

// Subcomponents
import { GCHeader } from '../../components/home/GCHeader';
import { LocationSelectionModal } from '../../components/home/LocationSelectionModal';
import { SearchServicesModal } from '../../components/home/SearchServicesModal';
import { HeroBannerCarousel } from '../../components/home/HeroBannerCarousel';
import { ServiceCategoryRow } from '../../components/home/ServiceCategoryRow';
import { ServicesNearYouRow } from '../../components/home/ServicesNearYouRow';
import { QuickAddServiceModal } from '../../components/home/QuickAddServiceModal';
import { WhyChooseSection } from '../../components/home/WhyChooseSection';
import { LowerBrandBanner } from '../../components/home/LowerBrandBanner';
import { NotificationsModal } from '../../components/home/NotificationsModal';
import { OffersModal } from '../../components/home/OffersModal';
import { AboutGCModal } from '../../components/home/AboutGCModal';
import { AddressInputModal } from '../../components/ui/AddressInputModal';
import { DashboardSkeleton } from '../../components/home/DashboardSkeleton';
import { FloatingCartBar } from '../../components/common/FloatingCartBar';
import { SlotConfirmationModal } from '../../components/booking/SlotConfirmationModal';
import { BecomePartnerBanner } from '../../components/home/BecomePartnerBanner';

// Icons
import { Search, Sparkles, ChevronRight, Briefcase } from 'lucide-react-native';

export const CustomerHomeScreen: React.FC = () => {
  const { user, services, savedAddresses, navigateTo, isMaidPartner, switchUserMode, bookings, confirmCustomerSlot } = useAuth();
  const { addServiceToCart, toggleServiceInCart, cart } = useCart();

  const [dismissedSlotReminderId, setDismissedSlotReminderId] = useState<string | null>(null);

  const slotReminderBooking = React.useMemo(() => {
    return (
      bookings.find(
        b =>
          b.customerId === user?.uid &&
          b.slotReminderSentAt &&
          !b.customerConfirmedSlot &&
          b.bookingId !== dismissedSlotReminderId &&
          b.slotConfirmationStatus !== 'finalized' &&
          b.slotConfirmationStatus !== 'admin_resolved'
      ) || null
    );
  }, [bookings, user?.uid, dismissedSlotReminderId]);

  // Selected Location State (Normalized)
  const defaultLocation = normalizeLocationString(
    savedAddresses && savedAddresses.length > 0
      ? `${savedAddresses[0].locality || savedAddresses[0].street}, ${savedAddresses[0].city} ${savedAddresses[0].pincode}`
      : 'Collectorate Road, Karimnagar, Telangana 505001'
  );

  const [currentLocation, setCurrentLocation] = useState<string>(defaultLocation);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!homeService.getCachedDashboard());
  const [servicesError, setServicesError] = useState<string | null>(null);
  const requestIdRef = React.useRef<number>(0);

  // Dynamic Content State (Instant cache-first initialization)
  const initialCache = homeService.getCachedDashboard();
  const [banners, setBanners] = useState<HeroBanner[]>(initialCache?.banners || []);
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCache?.categories || []);
  const [nearbyServices, setNearbyServices] = useState<
    (Service & { isBestseller?: boolean; reviewCount?: string; rating?: number })[]
  >(initialCache?.services || []);
  const [promoOffer, setPromoOffer] = useState<PromoOffer>(PROMO_OFFER_SEED);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialCache?.notifications || []);
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

  // Load Dashboard Data with Instant Cache Delivery & Race Condition Safety
  const loadDashboard = async (isSilentRefresh = false, forceRefresh = false) => {
    const currentReqId = ++requestIdRef.current;
    const cached = homeService.getCachedDashboard();

    if (cached && nearbyServices.length === 0) {
      setBanners(cached.banners);
      setCategories(cached.categories);
      setNearbyServices(cached.services);
      setNotifications(cached.notifications);
      setIsLoading(false);
    } else if (!isSilentRefresh && nearbyServices.length === 0) {
      setIsLoading(true);
    }
    setServicesError(null);

    try {
      const data = await homeService.getDashboardData(currentLocation, user?.uid, forceRefresh);
      if (currentReqId !== requestIdRef.current) return;

      setBanners(data.banners);
      setCategories(data.categories);
      setNearbyServices(data.services);
      setPromoOffer(data.promoOffer);
      setNotifications(data.notifications);
    } catch (err: any) {
      if (currentReqId !== requestIdRef.current) return;
      if (nearbyServices.length === 0) {
        setServicesError(err?.message || 'Unable to connect to services database');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboard();

    const channel = supabase
      .channel('customer_home_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_categories' }, () => {
        loadDashboard(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        loadDashboard(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_banners' }, () => {
        loadDashboard(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        loadDashboard(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Refresh services automatically when location changes
  useEffect(() => {
    loadDashboard(true);
  }, [currentLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
    setRefreshing(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick Booking Handler from QuickAdd Modal
  const handleProceedToBooking = (service: Service, roomCount: number, totalPrice: number) => {
    // Set the service in cart context and navigate to service details
    addServiceToCart({ ...service, startingPrice: totalPrice }, 1);
    navigateTo('service-details');
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
            {/* ── Search Bar Trigger with Conditional Partner Mode Toggle ── */}
            <View style={styles.searchSection}>
              <TouchableOpacity
                style={styles.searchBarButton}
                onPress={() => setShowSearchModal(true)}
                activeOpacity={0.85}
                accessibilityLabel="Search for cleaning services"
              >
                <Search size={16} color="#168A68" />
                <Text style={styles.searchPlaceholderText} numberOfLines={1}>
                  {isMaidPartner ? 'Search services...' : 'Search for cleaning services, e.g. home cleaning...'}
                </Text>
              </TouchableOpacity>

              {isMaidPartner && (
                <TouchableOpacity
                  style={styles.modeTogglePill}
                  onPress={() => switchUserMode('maid')}
                  activeOpacity={0.85}
                  accessibilityLabel="Switch to Maid Partner Mode"
                >
                  <View style={styles.partnerDot} />
                  <Briefcase size={14} color="#0E5B47" strokeWidth={2.5} />
                  <Text style={styles.modeToggleText} numberOfLines={1}>
                    Partner Mode
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── 1. Hero Banner Carousel ── */}
            <HeroBannerCarousel
              banners={banners}
              onPressBanner={() => {
                navigateTo('services-listing');
              }}
            />

            {/* ── 2. Service Categories (Horizontal Pastel Badges) ── */}
            <ServiceCategoryRow
              categories={categories}
              onSelectCategory={cat => {
                navigateTo('services-listing', { categoryId: cat.id, categoryName: cat.name });
              }}
            />

            {/* ── 3. Become a GC Maid Partner Banner (Ultra-Premium Redesign) ── */}
            <BecomePartnerBanner onPress={() => navigateTo('become_maid_info')} />

            {/* ── 4. Services Near You (Horizontal Cards with Quick Add) ── */}
            <ServicesNearYouRow
              services={nearbyServices}
              isLoading={isLoading}
              error={servicesError}
              onRetry={() => loadDashboard()}
              currentLocationName={currentLocation}
              onSelectService={service => {
                addServiceToCart(service, 1);
                navigateTo('service-details');
              }}
              onQuickAdd={service => {
                const isInCart = cart?.items.some(i => i.service.serviceId === service.serviceId);
                toggleServiceInCart(service);
                showToast(isInCart ? `${service.name} removed from cart` : `${service.name} added to cart!`);
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
        services={nearbyServices}
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

      <SlotConfirmationModal
        visible={Boolean(slotReminderBooking)}
        booking={slotReminderBooking}
        role="customer"
        onConfirm={confirmCustomerSlot}
        onClose={() => setDismissedSlotReminderId(slotReminderBooking?.bookingId || null)}
      />

      <AddressInputModal
        visible={showAddAddressModal}
        currentAddress={currentLocation}
        selectedCity="Karimnagar, Telangana"
        onSave={newAddr => {
          setCurrentLocation(newAddr);
          showToast('New address saved!');
        }}
        onClose={() => setShowAddAddressModal(false)}
      />

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={16} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 8,
  },
  searchBarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 12.5,
    color: '#68788C',
    fontWeight: '500',
  },
  modeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8F1',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 5,
  },
  partnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  modeToggleText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0E5B47',
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
