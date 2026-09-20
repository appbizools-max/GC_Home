import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBooking } from '../../context/BookingContext';
import { AppLogo } from '../../components/ui/AppLogo';
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Banknote,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react-native';

type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';

interface PaymentOption {
  id: PaymentMethodType;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
}

const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'upi',
    title: 'UPI (Instant & Secure)',
    subtitle: 'Google Pay, PhonePe, Paytm, BHIM',
    icon: Smartphone,
    badge: 'Fastest',
  },
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, RuPay, Diners',
    icon: CreditCard,
  },
  {
    id: 'netbanking',
    title: 'Net Banking',
    subtitle: 'HDFC, ICICI, SBI, Axis & all major banks',
    icon: Building2,
  },
  {
    id: 'wallet',
    title: 'Wallets',
    subtitle: 'Paytm, Amazon Pay, Mobikwik',
    icon: Wallet,
  },
  {
    id: 'cod',
    title: 'Cash on Service',
    subtitle: 'Pay via cash or UPI after cleaning is completed',
    icon: Banknote,
  },
];

export const PaymentScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { cart, clearCart } = useCart();
  const { createBookingFromCart } = useBooking();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const totalAmount = cart?.totalAmount || 848;

  const handlePay = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorText('');

    try {
      if (!cart) {
        throw new Error('No active booking details found.');
      }

      await createBookingFromCart(cart, selectedMethod);
      clearCart();
      navigateTo('booking-confirmation');
    } catch (err: any) {
      setErrorText(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('booking-summary')}
          activeOpacity={0.7}
          disabled={isProcessing}
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
          <Text style={styles.screenTitle}>Choose Payment Method</Text>
          <Text style={styles.screenSubtitle}>100% secure payment with end-to-end encryption</Text>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <View>
            <Text style={styles.amountLabel}>Total Payable Amount</Text>
            <Text style={styles.amountValue}>₹ {totalAmount}</Text>
          </View>
          <View style={styles.secureTag}>
            <Lock size={12} color="#168A68" />
            <Text style={styles.secureTagText}>Safe & Secure</Text>
          </View>
        </View>

        {/* Payment Methods List */}
        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map(method => {
            const isSelected = selectedMethod === method.id;
            const Icon = method.icon;

            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                onPress={() => setSelectedMethod(method.id)}
                disabled={isProcessing}
                activeOpacity={0.88}
              >
                <View style={styles.methodIconBox}>
                  <Icon size={20} color="#168A68" />
                </View>

                <View style={styles.methodDetails}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>{method.title}</Text>
                    {method.badge && (
                      <View style={styles.fastestBadge}>
                        <Text style={styles.fastestBadgeText}>{method.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                </View>

                <View style={styles.radioBox}>
                  {isSelected ? (
                    <CheckCircle2 size={22} color="#168A68" fill="#168A68" />
                  ) : (
                    <Circle size={22} color="#CBD5E1" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorText ? (
          <View style={styles.errorCard}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        {/* Trust Badges */}
        <View style={styles.trustBanner}>
          <ShieldCheck size={18} color="#168A68" />
          <Text style={styles.trustBannerText}>
            Payments are secured by 256-bit SSL encryption. We do not store card numbers.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Pay CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing}
          activeOpacity={0.88}
        >
          {isProcessing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.payButtonText}>Processing Payment...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {selectedMethod === 'cod' ? 'Confirm Booking' : `Pay ₹ ${totalAmount}`}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
            </>
          )}
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
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAF8F1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 11.5,
    color: '#168A68',
    fontWeight: '700',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0E5B47',
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  secureTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#168A68',
  },
  methodsList: {
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  methodCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#F5FCF8',
    borderWidth: 1.5,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
  },
  fastestBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastestBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#168A68',
  },
  methodSubtitle: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 2,
  },
  radioBox: {
    marginLeft: 8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    color: '#EF4444',
    fontWeight: '600',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  trustBannerText: {
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
  },
  payButton: {
    backgroundColor: '#0E5B47',
    borderRadius: 26,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
