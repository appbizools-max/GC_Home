import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Share,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import {
  generateAvailableDates,
  getAvailableSlotsForDate,
  AvailableDate,
  AvailableSlot,
} from '../../services/dateTimeEngine';
import { HomeSize, AddOnItem } from '../../types';
import { ASSETS } from '../../assets/index';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Clock,
  ShieldCheck,
  Home,
  Check,
  Calendar as CalendarIcon,
  Info,
  ChevronUp,
  ChevronDown,
  ShoppingCart,
  ArrowRight,
  Leaf,
  Sparkles,
  Award,
  Smile,
  X,
  MapPin,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const HOME_SIZES: HomeSize[] = [
  { id: '1bhk', label: '1 BHK', roomsCount: 1, price: 699, subtitle: '1 Bedroom + 1 Hall + 1 Kitchen' },
  { id: '2bhk', label: '2 BHK', roomsCount: 2, price: 999, subtitle: '2 Bedrooms + 1 Hall + 1 Kitchen' },
  { id: '3bhk', label: '3 BHK', roomsCount: 3, price: 1299, subtitle: '3 Bedrooms + 1 Hall + 1 Kitchen' },
  { id: '4bhk', label: '4 BHK', roomsCount: 4, price: 1599, subtitle: '4 Bedrooms + 1 Hall + 1 Kitchen' },
];

const ADD_ON_SERVICES: AddOnItem[] = [
  {
    id: 'addon_fridge',
    title: 'Refrigerator Cleaning',
    price: 199,
    imageUrl: ASSETS.serviceKitchen,
    description: 'Internal shelves wipe, freezer defrost wash & deodorizing',
  },
  {
    id: 'addon_microwave',
    title: 'Microwave Cleaning',
    price: 149,
    imageUrl: ASSETS.serviceKitchen,
    description: 'Grease removal, turntable sanitize & interior polish',
  },
  {
    id: 'addon_balcony',
    title: 'Balcony Cleaning',
    price: 199,
    imageUrl: ASSETS.heroLivingRoom,
    description: 'Railing wash, floor scrubbing & pigeon net wipe',
  },
  {
    id: 'addon_window',
    title: 'Window Cleaning',
    price: 249,
    imageUrl: ASSETS.serviceBathroom,
    description: 'Glass descaling, mesh vacuum & track cleaning',
  },
];

export const ServiceDetailsScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const {
    cart,
    setHomeSize,
    toggleAddOn,
    setBookingSchedule,
    cartItemsCount,
  } = useCart();

  // Selected State
  const [selectedSize, setSelectedSize] = useState<HomeSize>(cart?.homeSize || HOME_SIZES[0]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnItem[]>(cart?.addOns || [ADD_ON_SERVICES[1]]); // Microwave selected by default
  const [isFavorite, setIsFavorite] = useState(false);

  // Dynamic Date & Slot System
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<AvailableDate | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  // Modals
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Initialize Dates & Slots
  useEffect(() => {
    const dates = generateAvailableDates(7);
    setAvailableDates(dates);
    const initialDate = dates[0];
    setSelectedDate(initialDate);

    const initialSlots = getAvailableSlotsForDate(initialDate.dateString);
    setSlots(initialSlots);

    // Pick first available slot or 4:00 PM slot
    const defaultSlot =
      initialSlots.find(s => s.slotId === 'slot_16_18' && s.isAvailable) ||
      initialSlots.find(s => s.isAvailable) ||
      initialSlots[0];
    setSelectedSlot(defaultSlot);

    setBookingSchedule(
      initialDate.dateString,
      initialDate.displayLabel.replace('\n', ', '),
      defaultSlot?.displayRange || '4:00 PM – 6:00 PM'
    );
  }, []);

  const handleSelectDate = (date: AvailableDate) => {
    setSelectedDate(date);
    const dateSlots = getAvailableSlotsForDate(date.dateString);
    setSlots(dateSlots);

    const validSlot =
      dateSlots.find(s => s.slotId === selectedSlot?.slotId && s.isAvailable) ||
      dateSlots.find(s => s.isAvailable) ||
      null;

    setSelectedSlot(validSlot);

    if (validSlot) {
      setBookingSchedule(
        date.dateString,
        date.displayLabel.replace('\n', ', '),
        validSlot.displayRange
      );
    }
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
    if (selectedDate) {
      setBookingSchedule(
        selectedDate.dateString,
        selectedDate.displayLabel.replace('\n', ', '),
        slot.displayRange
      );
    }
  };

  const handleSizeChange = (size: HomeSize) => {
    setSelectedSize(size);
    setHomeSize(size);
  };

  const handleToggleAddOn = (addon: AddOnItem) => {
    toggleAddOn(addon);
    setSelectedAddOns(prev => {
      const exists = prev.some(a => a.id === addon.id);
      return exists ? prev.filter(a => a.id !== addon.id) : [...prev, addon];
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out GC Home Plus - Professional Home Cleaning with Genuine Care! https://gchomeplus.com',
      });
    } catch {}
  };

  // Calculations
  const basePrice = selectedSize.price;
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const totalAmount = basePrice + addOnsTotal;

  const handleProceedToAddress = () => {
    if (selectedDate && selectedSlot) {
      setBookingSchedule(
        selectedDate.dateString,
        selectedDate.displayLabel.replace('\n', ', '),
        selectedSlot.displayRange
      );
    }
    navigateTo('address-confirmation');
  };

  return (
    <View style={styles.safeContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('services-listing')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <AppLogo size="sm" showTagline={true} align="left" />

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.7}
          >
            <Heart
              size={20}
              color={isFavorite ? '#EF4444' : '#10243A'}
              fill={isFavorite ? '#EF4444' : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Share2 size={20} color="#10243A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Visual Card with Overlaid Badges */}
        <View style={styles.heroContainer}>
          <Image
            source={resolveImageSource(cart?.service?.imageUrl || ASSETS.heroLivingRoom)}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Bestseller Badge */}
          <View style={styles.bestsellerTag}>
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>

          {/* Image Pagination Dots Overlay */}
          <View style={styles.heroDotsContainer}>
            <View style={[styles.heroDot, styles.heroDotActive]} />
            <View style={styles.heroDot} />
            <View style={styles.heroDot} />
          </View>

          {/* 1/5 Image Counter */}
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>1 / 5</Text>
          </View>

          {/* Overlaid Trust Feature Tags Box */}
          <View style={styles.trustFeaturesOverlay}>
            <View style={styles.trustFeatureItem}>
              <Award size={14} color="#168A68" />
              <Text style={styles.trustFeatureText}>Trained Professionals</Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <Leaf size={14} color="#168A68" />
              <Text style={styles.trustFeatureText}>Safe & Eco-Friendly</Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <ShieldCheck size={14} color="#168A68" />
              <Text style={styles.trustFeatureText}>Quality Assured</Text>
            </View>
            <View style={styles.trustFeatureItem}>
              <Smile size={14} color="#168A68" />
              <Text style={styles.trustFeatureText}>100% Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Service Main Title & Subtitle */}
        <View style={styles.serviceMetaHeader}>
          <Text style={styles.serviceName}>{cart?.service?.name || 'Home Cleaning'}</Text>
          <Text style={styles.serviceTagline}>
            Complete home cleaning for a fresh and healthy living space.
          </Text>

          {/* Rating, Duration & Starts At */}
          <View style={styles.specificationsRow}>
            <View style={styles.specGroup}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.specValue}>4.8</Text>
              <Text style={styles.specSub}>(2.1K reviews)</Text>
            </View>

            <View style={styles.specDivider} />

            <View style={styles.specGroup}>
              <Clock size={14} color="#168A68" />
              <Text style={styles.specValue}>2 - 4 hrs</Text>
            </View>

            <View style={styles.specDivider} />

            <View style={styles.specGroup}>
              <ShieldCheck size={14} color="#168A68" />
              <Text style={styles.specValue}>Verified Pros</Text>
            </View>
          </View>

          <Text style={styles.startsAtHeading}>
            Starts at <Text style={styles.startsAtNumber}>₹ {cart?.service?.startingPrice || 699}</Text>
          </Text>
        </View>

        {/* SECTION 1: SELECT HOME SIZE */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Select Home Size</Text>
            <TouchableOpacity
              style={styles.sizeGuideBtn}
              onPress={() => setShowSizeGuide(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.sizeGuideText}>Size Guide</Text>
              <Info size={14} color="#168A68" />
            </TouchableOpacity>
          </View>

          {/* 4 BHK Horizontal Row */}
          <View style={styles.homeSizesGrid}>
            {HOME_SIZES.map(item => {
              const isSelected = selectedSize.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.homeSizeCard, isSelected && styles.homeSizeCardSelected]}
                  onPress={() => handleSizeChange(item)}
                  activeOpacity={0.88}
                >
                  <Home size={22} color={isSelected ? '#168A68' : '#68788C'} />
                  <Text style={[styles.homeSizeLabel, isSelected && styles.homeSizeLabelSelected]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.homeSizePrice, isSelected && styles.homeSizePriceSelected]}>
                    ₹ {item.price}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: ADD-ON SERVICES */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Add On Services (Optional)</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addOnsScroll}>
            {ADD_ON_SERVICES.map(addon => {
              const isChecked = selectedAddOns.some(a => a.id === addon.id);
              return (
                <TouchableOpacity
                  key={addon.id}
                  style={[styles.addonCard, isChecked && styles.addonCardChecked]}
                  onPress={() => handleToggleAddOn(addon)}
                  activeOpacity={0.88}
                >
                  {/* Card Thumbnail */}
                  <View style={styles.addonImageWrapper}>
                    <Image source={resolveImageSource(addon.imageUrl)} style={styles.addonImg} />
                    {/* Checkbox */}
                    <View style={[styles.addonCheckbox, isChecked && styles.addonCheckboxActive]}>
                      {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </View>

                  <Text style={styles.addonTitle} numberOfLines={2}>
                    {addon.title}
                  </Text>
                  <Text style={styles.addonPrice}>₹ {addon.price}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SECTION 3: SELECT DATE & TIME */}
        <View style={styles.sectionContainer}>
          <View style={styles.dateTimeHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Select Date & Time</Text>
              <Text style={styles.sectionSubtitle}>
                Choose your preferred date and time slot (Based on your location time)
              </Text>
            </View>

            {/* Timezone Badge */}
            <View style={styles.timezoneBadge}>
              <MapPin size={12} color="#168A68" />
              <View>
                <Text style={styles.timezoneLoc}>HSR Layout, Bengaluru</Text>
                <Text style={styles.timezoneIst}>IST (GMT+5:30)</Text>
              </View>
            </View>
          </View>

          {/* Calendar Date Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsScroll}>
            {availableDates.map(date => {
              const isSelected = selectedDate?.dateString === date.dateString;
              return (
                <TouchableOpacity
                  key={date.dateString}
                  style={[styles.datePill, isSelected && styles.datePillSelected]}
                  onPress={() => handleSelectDate(date)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dateDayText, isSelected && styles.dateTextSelected]}>
                    {date.dayName}
                  </Text>
                  <Text style={[styles.dateNumText, isSelected && styles.dateTextSelected]}>
                    {date.dayNumber} {date.monthName}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* View Full Calendar Button */}
            <TouchableOpacity
              style={styles.viewCalendarBtn}
              onPress={() => setShowFullCalendar(true)}
              activeOpacity={0.8}
            >
              <CalendarIcon size={18} color="#168A68" />
              <Text style={styles.viewCalendarText}>View Calendar</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Time Slots Section */}
          <View style={styles.timeSlotsHeader}>
            <View style={styles.slotHintRow}>
              <Clock size={13} color="#168A68" />
              <Text style={styles.slotHintText}>
                Showing available slots for{' '}
                <Text style={styles.slotHintHighlight}>
                  {selectedDate?.isToday ? 'Today' : selectedDate?.dayName}, {selectedDate?.dayNumber} {selectedDate?.monthName}
                </Text>
              </Text>
            </View>
            <Text style={styles.allTimesText}>All times in IST</Text>
          </View>

          {/* Time Slot Cards Grid */}
          <View style={styles.slotsGrid}>
            {slots.map(slot => {
              const isSelected = selectedSlot?.slotId === slot.slotId && slot.isAvailable;
              const isUnavailable = !slot.isAvailable;

              return (
                <TouchableOpacity
                  key={slot.slotId}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardSelected,
                    isUnavailable && styles.slotCardUnavailable,
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                  disabled={isUnavailable}
                  activeOpacity={0.85}
                >
                  <Clock
                    size={14}
                    color={isSelected ? '#168A68' : isUnavailable ? '#94A3B8' : '#10243A'}
                  />
                  <Text
                    style={[
                      styles.slotTimeText,
                      isSelected && styles.slotTimeSelected,
                      isUnavailable && styles.slotTimeUnavailable,
                    ]}
                  >
                    {slot.displayRange}
                  </Text>

                  {isUnavailable && (
                    <Text style={styles.unavailableLabel}>
                      {slot.isPast || slot.cutoffPassed ? 'Unavailable' : 'Full'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Eco-Friendly Trust Banner Card */}
        <View style={styles.ecoBanner}>
          <View style={styles.ecoIconBox}>
            <Leaf size={22} color="#168A68" />
          </View>
          <View style={styles.ecoTextCol}>
            <Text style={styles.ecoTitle}>
              We use eco-friendly and safe cleaning products for a healthier home and a greener planet.
            </Text>
            <Text style={styles.ecoTag}>Cleaner Homes, Happier Lives 💚</Text>
          </View>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM BOOKING BAR */}
      <View style={styles.stickyBottomBar}>
        {/* Left Total Info */}
        <TouchableOpacity
          style={styles.bottomPriceCol}
          onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
          activeOpacity={0.7}
        >
          <View style={styles.priceDropdownRow}>
            <Text style={styles.bottomTotalPrice}>₹ {totalAmount}</Text>
            {showPriceBreakdown ? (
              <ChevronDown size={18} color="#10243A" />
            ) : (
              <ChevronUp size={18} color="#10243A" />
            )}
          </View>
          <Text style={styles.bottomSummaryText} numberOfLines={1}>
            {selectedSize.label} • {selectedAddOns.length} Add-on
          </Text>
          <Text style={styles.bottomScheduleText} numberOfLines={1}>
            {selectedDate?.isToday ? 'Today' : selectedDate?.dayName}, {selectedSlot?.displayRange}
          </Text>
        </TouchableOpacity>

        {/* Right Action Buttons */}
        <View style={styles.bottomBtnsGroup}>
          <TouchableOpacity
            style={styles.addCartBtn}
            onPress={() => {
              handleProceedToAddress();
            }}
            activeOpacity={0.8}
          >
            <ShoppingCart size={16} color="#0E5B47" />
            <Text style={styles.addCartBtnText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={handleProceedToAddress}
            activeOpacity={0.88}
          >
            <Text style={styles.bookNowBtnText}>Book Now</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Size Guide Modal */}
      <Modal visible={showSizeGuide} transparent animationType="fade" onRequestClose={() => setShowSizeGuide(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>Home Size Guide</Text>
              <TouchableOpacity onPress={() => setShowSizeGuide(false)}>
                <X size={20} color="#10243A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.guideSub}>Recommended estimated cleaning times & coverage</Text>

            {HOME_SIZES.map(sz => (
              <View key={sz.id} style={styles.guideRow}>
                <Text style={styles.guideSizeName}>{sz.label}</Text>
                <Text style={styles.guideDesc}>{sz.subtitle}</Text>
                <Text style={styles.guidePrice}>₹ {sz.price}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.guideCloseBtn} onPress={() => setShowSizeGuide(false)}>
              <Text style={styles.guideCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Calendar Modal */}
      <Modal visible={showFullCalendar} transparent animationType="slide" onRequestClose={() => setShowFullCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalSheet}>
            <View style={styles.guideHeader}>
              <Text style={styles.guideTitle}>Choose Booking Date</Text>
              <TouchableOpacity onPress={() => setShowFullCalendar(false)}>
                <X size={20} color="#10243A" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {availableDates.map(date => {
                const isSelected = selectedDate?.dateString === date.dateString;
                return (
                  <TouchableOpacity
                    key={date.dateString}
                    style={[styles.calendarCell, isSelected && styles.calendarCellSelected]}
                    onPress={() => {
                      handleSelectDate(date);
                      setShowFullCalendar(false);
                    }}
                  >
                    <Text style={[styles.calCellDay, isSelected && styles.calCellSelectedText]}>
                      {date.dayName}
                    </Text>
                    <Text style={[styles.calCellNum, isSelected && styles.calCellSelectedText]}>
                      {date.dayNumber} {date.monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bestsellerTag: {
    position: 'absolute',
    top: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0E5B47',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bestsellerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroDotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  heroDotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: 'rgba(16, 36, 58, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trustFeaturesOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trustFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustFeatureText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0E5B47',
  },
  serviceMetaHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  serviceName: {
    fontSize: 21,
    fontWeight: '900',
    color: '#10243A',
  },
  serviceTagline: {
    fontSize: 12.5,
    color: '#68788C',
    marginTop: 2,
    marginBottom: 10,
  },
  specificationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  specGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10243A',
  },
  specSub: {
    fontSize: 10.5,
    color: '#68788C',
  },
  specDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  startsAtHeading: {
    fontSize: 13,
    color: '#168A68',
    fontWeight: '700',
  },
  startsAtNumber: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0E5B47',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  sizeGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeGuideText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  homeSizesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  homeSizeCard: {
    flex: 1,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E1E8E5',
    gap: 4,
  },
  homeSizeCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#EAF8F1',
  },
  homeSizeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10243A',
  },
  homeSizeLabelSelected: {
    color: '#0E5B47',
  },
  homeSizePrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#68788C',
  },
  homeSizePriceSelected: {
    color: '#0E5B47',
  },
  addOnsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  addonCard: {
    width: 110,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  addonCardChecked: {
    borderColor: '#168A68',
    backgroundColor: '#EAF8F1',
  },
  addonImageWrapper: {
    width: '100%',
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
  },
  addonImg: {
    width: '100%',
    height: '100%',
  },
  addonCheckbox: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addonCheckboxActive: {
    backgroundColor: '#168A68',
    borderColor: '#168A68',
  },
  addonTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10243A',
    lineHeight: 13,
    height: 26,
  },
  addonPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0E5B47',
    marginTop: 2,
  },
  dateTimeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  timezoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#C6EEDB',
  },
  timezoneLoc: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0E5B47',
  },
  timezoneIst: {
    fontSize: 8,
    color: '#168A68',
    fontWeight: '600',
  },
  datePillsScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    alignItems: 'center',
    minWidth: 64,
  },
  datePillSelected: {
    backgroundColor: '#0E5B47',
    borderColor: '#0E5B47',
  },
  dateDayText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#68788C',
  },
  dateNumText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10243A',
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  viewCalendarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#C6EEDB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  viewCalendarText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#168A68',
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  slotHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotHintText: {
    fontSize: 11,
    color: '#68788C',
  },
  slotHintHighlight: {
    fontWeight: '800',
    color: '#10243A',
  },
  allTimesText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  slotsGrid: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  slotCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#EAF8F1',
    borderWidth: 1.5,
  },
  slotCardUnavailable: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  slotTimeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10243A',
  },
  slotTimeSelected: {
    color: '#0E5B47',
  },
  slotTimeUnavailable: {
    color: '#94A3B8',
  },
  unavailableLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#EAF8F1',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  ecoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ecoTextCol: {
    flex: 1,
  },
  ecoTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0E5B47',
    lineHeight: 15,
  },
  ecoTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#168A68',
    marginTop: 2,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceCol: {
    flex: 1,
  },
  priceDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomTotalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
  },
  bottomSummaryText: {
    fontSize: 11,
    color: '#68788C',
    fontWeight: '600',
  },
  bottomScheduleText: {
    fontSize: 10,
    color: '#168A68',
    fontWeight: '700',
  },
  bottomBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  addCartBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5B47',
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: '#0E5B47',
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bookNowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 36, 58, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guideCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#10243A',
  },
  guideSub: {
    fontSize: 12,
    color: '#68788C',
    marginBottom: 16,
  },
  guideRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  guideSizeName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  guideDesc: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 2,
  },
  guidePrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10243A',
    marginTop: 2,
  },
  guideCloseBtn: {
    marginTop: 16,
    backgroundColor: '#0E5B47',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  guideCloseBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarModalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  calendarCell: {
    width: (width - 80) / 3,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    alignItems: 'center',
  },
  calendarCellSelected: {
    backgroundColor: '#0E5B47',
    borderColor: '#0E5B47',
  },
  calCellDay: {
    fontSize: 11,
    fontWeight: '800',
    color: '#68788C',
  },
  calCellNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10243A',
    marginTop: 2,
  },
  calCellSelectedText: {
    color: '#FFFFFF',
  },
});
