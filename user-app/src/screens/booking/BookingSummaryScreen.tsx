import React, { useState } from 'react';
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
import { AppLogo } from '../../components/ui/AppLogo';
import { resolveImageSource } from '../../utils/imageUtils';
import { ASSETS } from '../../assets/index';
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
  X,
} from 'lucide-react-native';

export const BookingSummaryScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { cart, applyCouponCode, removeCouponCode } = useCart();

  const [couponInput, setCouponInput] = useState<string>('GCHOME20');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const basePrice = cart?.homeSize.price || 699;
  const addOnsTotal = cart?.addOns.reduce((acc, curr) => acc + curr.price, 0) || 0;
  const discountAmount = cart?.discountAmount || (cart?.promoCode ? Math.round((basePrice + addOnsTotal) * 0.2) : 0);
  const platformFee = 29;
  const taxableAmount = Math.max(0, basePrice + addOnsTotal - discountAmount);
  const taxes = Math.round(taxableAmount * 0.18);
  const finalTotal = taxableAmount + platformFee + taxes;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
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

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('address-confirmation')}
          activeOpacity={0.7}
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
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Review Your Booking</Text>
          <Text style={styles.screenSubtitle}>Check all details before proceeding to payment</Text>
        </View>

        {/* Service & Configuration Card */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <Image
              source={resolveImageSource(cart?.service.imageUrl || ASSETS.heroLivingRoom)}
              style={styles.serviceThumbnail}
            />
            <View style={styles.serviceMeta}>
              <Text style={styles.serviceName}>{cart?.service.name || 'Home Cleaning'}</Text>
              <Text style={styles.homeSizeText}>Size: {cart?.homeSize.label || '1 BHK'}</Text>
              <View style={styles.proBadge}>
                <ShieldCheck size={12} color="#168A68" />
                <Text style={styles.proBadgeText}>Verified Professional</Text>
              </View>
            </View>
          </View>

          {/* Add-ons List if any */}
          {cart?.addOns && cart.addOns.length > 0 && (
            <View style={styles.addonsBox}>
              <Text style={styles.addonsBoxTitle}>Included Add-ons:</Text>
              {cart.addOns.map(a => (
                <View key={a.id} style={styles.addonItemRow}>
                  <Text style={styles.addonItemName}>• {a.title}</Text>
                  <Text style={styles.addonItemPrice}>+ ₹ {a.price}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Schedule Info Box */}
          <View style={styles.infoRow}>
            <Calendar size={16} color="#168A68" />
            <Text style={styles.infoText}>
              Date: <Text style={styles.infoBold}>{cart?.selectedDateLabel || 'Today, 26 Apr'}</Text>
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color="#168A68" />
            <Text style={styles.infoText}>
              Time Slot: <Text style={styles.infoBold}>{cart?.selectedSlot || '4:00 PM – 6:00 PM'}</Text>
            </Text>
          </View>

          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <MapPin size={16} color="#168A68" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoText}>
                Address: <Text style={styles.infoBold}>{cart?.address?.street || '123, 4th Cross, HSR Layout'}</Text>
              </Text>
              <Text style={styles.subAddress}>
                {cart?.address?.locality || 'Sector 2, HSR Layout'}, {cart?.address?.city || 'Bengaluru'} - {cart?.address?.pincode || '560102'}
              </Text>
            </View>
          </View>
        </View>

        {/* Coupon Code Card */}
        <View style={styles.card}>
          <View style={styles.couponHeader}>
            <Tag size={16} color="#168A68" />
            <Text style={styles.cardHeaderTitle}>Apply Coupon</Text>
          </View>

          <View style={styles.couponInputRow}>
            <TextInput
              style={styles.couponTextInput}
              placeholder="Enter coupon code (e.g. GCHOME20)"
              placeholderTextColor="#94A3B8"
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
            />
            {cart?.promoCode ? (
              <TouchableOpacity style={styles.removeCouponBtn} onPress={handleRemoveCoupon}>
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.applyCouponBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyCouponText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>

          {couponMessage && (
            <Text
              style={[
                styles.couponMsgText,
                couponMessage.isError && styles.couponMsgError,
              ]}
            >
              {couponMessage.text}
            </Text>
          )}

          {discountAmount > 0 && (
            <View style={styles.savingsBanner}>
              <Sparkles size={14} color="#0E5B47" />
              <Text style={styles.savingsText}>
                Yay! You are saving <Text style={styles.savingsAmount}>₹ {discountAmount}</Text> on this booking.
              </Text>
            </View>
          )}
        </View>

        {/* Itemized Price Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Bill Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Base Cleaning ({cart?.homeSize.label || '1 BHK'})
            </Text>
            <Text style={styles.billValue}>₹ {basePrice}</Text>
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

        {/* Cancellation Policy Banner */}
        <View style={styles.policyCard}>
          <Info size={16} color="#68788C" />
          <Text style={styles.policyText}>
            Free cancellation & full refund up to 2 hours before the scheduled service time.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Proceed to Payment Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalAmount}>₹ {finalTotal}</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => navigateTo('payment')}
          activeOpacity={0.88}
        >
          <Text style={styles.payBtnText}>Proceed to Payment</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  serviceThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  serviceMeta: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
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
  addonsBox: {
    backgroundColor: '#F5FCF8',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#68788C',
  },
  infoBold: {
    fontWeight: '800',
    color: '#10243A',
  },
  subAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10243A',
    marginBottom: 8,
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
    fontSize: 13,
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
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  couponMsgText: {
    fontSize: 11,
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
    fontSize: 11,
    color: '#0E5B47',
    fontWeight: '600',
  },
  savingsAmount: {
    fontWeight: '900',
  },
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
