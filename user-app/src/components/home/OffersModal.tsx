import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { Tag, X, Check, Copy, Sparkles, Percent } from 'lucide-react-native';
import { homeService, SupabaseOffer } from '../../services/homeService';

interface OffersModalProps {
  visible: boolean;
  onApplyOffer: (code: string) => void;
  onClose: () => void;
  subtotal?: number;
  appliedCode?: string;
}

export const OffersModal: React.FC<OffersModalProps> = ({
  visible,
  onApplyOffer,
  onClose,
  subtotal,
  appliedCode,
}) => {
  const [offers, setOffers] = useState<SupabaseOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      homeService.getOffersFromSupabase()
        .then(data => setOffers(data.filter(o => o.isActive !== false)))
        .catch(err => console.error('Error fetching offers for modal:', err))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleApply = (code: string) => {
    try {
      Clipboard.setString(code);
    } catch {}
    setCopiedCode(code);
    onApplyOffer(code);
    setTimeout(() => {
      setCopiedCode(null);
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Available Offers & Coupons</Text>
              <Text style={styles.modalSub}>Apply promo codes for instant discounts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#168A68" />
              <Text style={{ marginTop: 10, fontSize: 12, color: '#68788C' }}>Loading active offers...</Text>
            </View>
          ) : offers.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Percent size={28} color="#94A3B8" />
              <Text style={{ marginTop: 10, fontSize: 14, fontWeight: '700', color: '#64748B' }}>
                No active coupons available right now
              </Text>
            </View>
          ) : (
            <FlatList
              data={offers}
              keyExtractor={item => item.id || item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isCurrentlyApplied = appliedCode && appliedCode.toUpperCase() === item.code.toUpperCase();
                const isCopied = copiedCode === item.code || isCurrentlyApplied;
                const isUnderMin = subtotal !== undefined && item.minBookingAmount > 0 && subtotal < item.minBookingAmount;
                const discountLabel = item.discountType === 'percentage'
                  ? `${item.discountValue}% OFF`
                  : `₹${item.discountValue} OFF`;
                const validDate = item.validUntil
                  ? new Date(item.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Limited Time';

                return (
                  <View style={[styles.couponCard, isUnderMin ? { opacity: 0.65 } : undefined]}>
                    <View style={styles.couponLeft}>
                      <View style={styles.discountBadge}>
                        <Tag size={13} color="#0E5B47" />
                        <Text style={styles.discountBadgeText}>{discountLabel}</Text>
                        {item.maxDiscount ? (
                          <Text style={{ fontSize: 9.5, color: '#0E5B47', marginLeft: 4 }}>
                            (Up to ₹{item.maxDiscount})
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.couponTitle}>{item.title}</Text>
                      {item.description ? (
                        <Text style={styles.couponDesc}>{item.description}</Text>
                      ) : null}
                      {item.minBookingAmount > 0 ? (
                        <Text style={[styles.couponValidity, isUnderMin ? { color: '#E65100', fontWeight: '700' } : undefined]}>
                          {isUnderMin
                            ? `Min. order ₹${item.minBookingAmount} (Add ₹${item.minBookingAmount - subtotal} more)`
                            : `Min. order amount: ₹${item.minBookingAmount}`}
                        </Text>
                      ) : null}
                      <Text style={styles.couponValidity}>Valid till: {validDate}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        isCopied ? styles.applyButtonCopied : undefined,
                        isUnderMin ? { borderColor: '#CBD5E1', backgroundColor: '#F1F5F9' } : undefined,
                      ]}
                      onPress={() => !isUnderMin && handleApply(item.code)}
                      disabled={isUnderMin}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.codeText, isUnderMin && { color: '#94A3B8' }]}>
                        {item.code}
                      </Text>
                      <Text style={[styles.applyActionText, isUnderMin && { color: '#94A3B8' }]}>
                        {isCurrentlyApplied ? 'Applied ✓' : isCopied ? 'Applied!' : isUnderMin ? 'Locked' : 'Apply Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10243A',
  },
  modalSub: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  couponCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponLeft: {
    flex: 1,
    paddingRight: 10,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  discountBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10243A',
  },
  couponDesc: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 2,
    lineHeight: 14,
  },
  couponValidity: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#168A68',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  applyButtonCopied: {
    backgroundColor: '#EAF8F1',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0E5B47',
    letterSpacing: 0.5,
  },
  applyActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#168A68',
    marginTop: 2,
  },
});
