import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../config/supabase';
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import { ASSETS } from '../../assets/index';
import { OffersModal } from '../../components/home/OffersModal';
import { checkPincodeServiceability } from '../../services/pincodeService';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Tag,
  Check,
  ArrowRight,
  Sparkles,
  Info,
  AlertCircle,
  Plus,
} from 'lucide-react-native';

export const BookingSummaryScreen: React.FC = () => {
  const { navigateTo, savedAddresses } = useAuth();
  const { cart, applyCouponCode, removeCouponCode } = useCart();

  const [couponInput, setCouponInput] = useState<string>('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);

  // Address logic: use cart.address or fallback to savedAddresses[0]
  const currentAddress = cart?.address || (savedAddresses && savedAddresses.length > 0 ? savedAddresses[0] : null);

  const hasItems = (cart?.items || []).length > 0;
  const subtotal = cart?.subtotal || 0;
  const addOnsTotal = cart?.addOnsTotal || 0;
  const discountAmount = cart?.discountAmount || 0;
  
  // Platform fee logic: if subtotal is 0, platform fee is 0 to avoid contradiction
  const platformFee = hasItems ? (cart?.platformFee ?? 29) : 0;
  const taxes = hasItems ? (cart?.taxes || 0) : 0;
  const finalTotal = hasItems ? (cart?.totalAmount || 0) : 0;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const res = await applyCouponCode(couponInput);
    setCouponMessage({
      text: res.message,
      isError: !res.success,
    });
  };

  const handleSelectCouponFromModal = async (code: string) => {
    setCouponInput(code);
    const res = await applyCouponCode(code);
    setCouponMessage({
      text: res.message,
      isError: !res.success,
    });
  };

  const handleRemoveCoupon = () => {
    removeCouponCode();
    setCouponMessage(null);
    setCouponInput('');
  };

  const [isServiceable, setIsServiceable] = useState<boolean>(true);

  const validateCurrentArea = useCallback(async () => {
    if (!currentAddress || !currentAddress.pincode) {
      setIsServiceable(false);
      return;
    }
    const res = await checkPincodeServiceability(currentAddress.pincode);
    setIsServiceable(res.isServiceable);
  }, [currentAddress?.pincode]);

  useEffect(() => {
    validateCurrentArea();

    const channel = supabase
      .channel('service_areas_booking_summary_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_areas' },
        () => {
          validateCurrentArea();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [validateCurrentArea]);

  // Determine CTA Button State & Text
  const getCtaState = () => {
    if (!hasItems) {
      return {
        text: 'Add Services →',
        action: () => navigateTo('services-listing'),
        disabled: false,
      };
    }
    if (!currentAddress) {
      return {
        text: 'Add Location →',
        action: () => navigateTo('address-confirmation'),
        disabled: false,
      };
    }
    if (!isServiceable) {
      return {
        text: 'Area Not Serviceable → Change Address',
        action: () => navigateTo('address-confirmation'),
        disabled: true,
      };
    }
    return {
      text: `Pay ₹${finalTotal} →`,
      action: () => navigateTo('payment'),
      disabled: false,
    };
  };

  const ctaState = getCtaState();

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('services-listing')}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>

        <AppLogo size="sm" showTagline={true} align="left" />

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Review Your Booking</Text>
          <Text style={styles.screenSubtitle}>Check all details before proceeding to payment</Text>
        </View>

        {/* 1. Services Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Selected Services ({cart?.items?.length || 0})</Text>
            {hasItems && (
              <TouchableOpacity onPress={() => navigateTo('services-listing')} activeOpacity={0.7}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {!hasItems ? (
            /* Empty Booking State */
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateIcon}>🧹</Text>
              <Text style={styles.emptyStateTitle}>No services selected</Text>
              <Text style={styles.emptyStateSubtext}>
                Choose a cleaning service to continue with your booking.
              </Text>
              <TouchableOpacity
                style={styles.browseServicesBtn}
                onPress={() => navigateTo('services-listing')}
                activeOpacity={0.8}
              >
                <Text style={styles.browseServicesText}>Browse Services →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Selected Services List */
            (cart?.items || []).map((item, idx) => (
              <View key={item.service.serviceId || idx} style={styles.serviceRow}>
                <Image
                  source={resolveImageSource(item.service.imageUrl || ASSETS.heroLivingRoom)}
                  style={styles.serviceThumbnail}
                />
                <View style={styles.serviceMeta}>
                  <Text style={styles.serviceName}>{item.service.name}</Text>
                  <Text style={styles.homeSizeText}>
                    {item.quantity} × ₹{item.service.startingPrice || 0}
                  </Text>
                  <View style={styles.proBadge}>
                    <ShieldCheck size={12} color="#168A68" />
                    <Text style={styles.proBadgeText}>Verified Professional</Text>
                  </View>
                </View>
                <Text style={styles.servicePriceText}>
                  ₹{item.itemTotal}
                </Text>
              </View>
            ))
          )}

          {/* Add-ons List if any */}
          {hasItems && cart?.addOns && cart.addOns.length > 0 && (
            <View style={styles.addonsBox}>
              <Text style={styles.addonsBoxTitle}>Included Add-ons:</Text>
              {cart.addOns.map(a => (
                <View key={a.id} style={styles.addonItemRow}>
                  <Check size={14} color="#168A68" />
                  <Text style={styles.addonItemName}>{a.title}</Text>
                  <Text style={styles.addonItemPrice}>+ ₹ {a.price}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 2. Schedule & Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Schedule & Location</Text>
            <TouchableOpacity onPress={() => navigateTo('services-listing')} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleBox}>
            <View style={styles.scheduleItem}>
              <Calendar size={16} color="#168A68" />
              <View>
                <Text style={styles.scheduleLabel}>DATE</Text>
                <Text style={styles.scheduleValue}>{cart?.selectedDateLabel || 'Today'}</Text>
              </View>
            </View>

            <View style={styles.scheduleDivider} />

            <View style={styles.scheduleItem}>
              <Clock size={16} color="#168A68" />
              <View>
                <Text style={styles.scheduleLabel}>TIME SLOT</Text>
                <Text style={styles.scheduleValue}>{cart?.selectedSlot || '4:00 PM – 6:00 PM'}</Text>
              </View>
            </View>
          </View>

          {currentAddress ? (
            <View style={styles.addressBox}>
              <View style={styles.addressHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <MapPin size={16} color="#168A68" />
                  <Text style={styles.addressLabel}>{currentAddress.label || 'Home'} Location</Text>
                  {currentAddress.isDefault ? (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>DEFAULT</Text>
                    </View>
                  ) : (
                    <View style={styles.bookingOnlyPill}>
                      <Text style={styles.bookingOnlyPillText}>BOOKING LOCATION</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => navigateTo('address-confirmation')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeAddressBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressText}>
                {currentAddress.houseFlat ? `${currentAddress.houseFlat}, ` : ''}
                {currentAddress.street}, {currentAddress.locality}, {currentAddress.city} - {currentAddress.pincode}
              </Text>
              {!isServiceable && (
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' }}>
                  <AlertCircle size={15} color="#EF4444" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>
                    Sorry, GC HOME+ is currently not available in your area.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noAddressBox}>
              <View style={styles.addressHeaderRow}>
                <MapPin size={16} color="#68788C" />
                <Text style={styles.noAddressTitle}>Location not selected</Text>
              </View>
              <TouchableOpacity
                style={styles.addLocationBtn}
                onPress={() => navigateTo('address-confirmation')}
                activeOpacity={0.8}
              >
                <Plus size={14} color="#168A68" />
                <Text style={styles.addLocationText}>Add Location →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Coupons & Offers Section */}
        <View style={styles.card}>
          <View style={styles.couponHeaderRow}>
            <Tag size={18} color="#168A68" />
            <Text style={styles.cardHeaderTitle}>Coupons & Offers</Text>
          </View>

          <View style={styles.couponInputRow}>
            <TextInput
              style={styles.couponTextInput}
              placeholder="Enter Promo Code (e.g. GCHOME20)"
              placeholderTextColor="#68788C"
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
            />
            {cart?.promoCode ? (
              <TouchableOpacity style={styles.removeCouponBtn} onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.applyCouponBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyCouponText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.viewOffersLink} onPress={() => setShowOffersModal(true)}>
            <Sparkles size={14} color="#168A68" />
            <Text style={styles.viewOffersText}>View Available Offers & Coupons</Text>
          </TouchableOpacity>

          {couponMessage && (
            <Text style={[styles.couponMsgText, couponMessage.isError && styles.couponMsgError]}>
              {couponMessage.text}
            </Text>
          )}

          {discountAmount > 0 && (
            <View style={styles.savingsBanner}>
              <Sparkles size={14} color="#0E5B47" />
              <Text style={styles.savingsText}>
                Yay! You are saving <Text style={styles.savingsAmount}>₹ {discountAmount}</Text> on this booking. 🎉
              </Text>
            </View>
          )}
        </View>

        {/* 4. Bill Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billValue}>₹ {subtotal}</Text>
          </View>

          {addOnsTotal > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Add-on Services</Text>
              <Text style={styles.billValue}>₹ {addOnsTotal}</Text>
            </View>
          )}

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#168A68', fontWeight: '700' }]}>
                Coupon Discount ({cart?.promoCode || 'GCHOME20'})
              </Text>
              <Text style={[styles.billValue, { color: '#168A68', fontWeight: '800' }]}>
                - ₹ {discountAmount}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform & Safety Fee</Text>
            <Text style={styles.billValue}>₹ {platformFee}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST (18%)</Text>
            <Text style={styles.billValue}>₹ {taxes}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹ {finalTotal}</Text>
          </View>
        </View>

        {/* 5. Cancellation Policy Banner */}
        <View style={styles.policyCard}>
          <Info size={16} color="#68788C" />
          <Text style={styles.policyText}>
            Free cancellation & full refund up to 2 hours before the scheduled service time.
          </Text>
        </View>
      </ScrollView>

      {/* 6. Sticky Bottom Proceed / Pay Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomTotalLabel}>Total Payable</Text>
          <Text style={styles.bottomTotalAmount}>₹ {finalTotal}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, ctaState.disabled && styles.payBtnDisabled]}
          onPress={ctaState.action}
          disabled={ctaState.disabled}
          activeOpacity={0.88}
        >
          <Text style={styles.payBtnText}>{ctaState.text}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Selecting Offers */}
      <OffersModal
        visible={showOffersModal}
        onClose={() => setShowOffersModal(false)}
        onApplyOffer={handleSelectCouponFromModal}
        subtotal={subtotal + addOnsTotal}
        appliedCode={cart?.promoCode}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  titleSection: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10243A',
  },
  screenSubtitle: {
    fontSize: 12.5,
    color: '#68788C',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 12,
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10243A',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },

  /* Empty State Styles */
  emptyStateBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  emptyStateIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10243A',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#68788C',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  browseServicesBtn: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  browseServicesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Service Item Row */
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  serviceThumbnail: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  serviceMeta: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#10243A',
  },
  homeSizeText: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  proBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  servicePriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addonsBox: {
    backgroundColor: '#F5FCF8',
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  addonsBoxTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 4,
  },
  addonItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  addonItemName: {
    fontSize: 11,
    color: '#68788C',
  },
  addonItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5B47',
  },

  /* Schedule & Location Box */
  scheduleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  scheduleDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noAddressBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noAddressTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
  },
  addLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  addLocationText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#168A68',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  changeAddressBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  defaultPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  bookingOnlyPill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#C6E7D2',
  },
  bookingOnlyPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D8846',
    letterSpacing: 0.3,
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  /* Coupons & Offers */
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10243A',
  },
  applyCouponBtn: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyCouponText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  removeCouponBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  viewOffersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  viewOffersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  couponMsgText: {
    fontSize: 11.5,
    color: '#168A68',
    fontWeight: '700',
    marginTop: 6,
  },
  couponMsgError: {
    color: '#EF4444',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF8F1',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 11.5,
    color: '#0E5B47',
    fontWeight: '600',
  },
  savingsAmount: {
    fontWeight: '900',
  },

  /* Bill Details */
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 12.5,
    color: '#68788C',
  },
  billValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10243A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10243A',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0E5B47',
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginTop: 4,
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: '#68788C',
    lineHeight: 15,
  },

  /* Bottom Payment Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: '#68788C',
    fontWeight: '600',
  },
  bottomTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0E5B47',
  },
  payBtn: {
    backgroundColor: '#0E5B47',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  payBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  payBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

