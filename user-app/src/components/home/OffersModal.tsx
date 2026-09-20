import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Clipboard,
} from 'react-native';
import { Tag, X, Check, Copy, Sparkles } from 'lucide-react-native';

interface OffersModalProps {
  visible: boolean;
  onApplyOffer: (code: string) => void;
  onClose: () => void;
}

const AVAILABLE_OFFERS = [
  {
    code: 'GCHOME20',
    title: '20% OFF First Clean',
    description: 'Valid for new customers on all regular and deep home services.',
    discount: '20% OFF',
    validUntil: '31 Dec 2026',
  },
  {
    code: 'DEEP300',
    title: '₹300 Flat OFF on Deep Cleaning',
    description: 'Applicable on bookings above ₹1,299.',
    discount: '₹300 OFF',
    validUntil: '31 Dec 2026',
  },
  {
    code: 'KITCHEN50',
    title: '₹150 OFF Kitchen Degreasing',
    description: 'Complete degreasing & appliance sanitization package.',
    discount: '₹150 OFF',
    validUntil: '15 Oct 2026',
  },
];

export const OffersModal: React.FC<OffersModalProps> = ({
  visible,
  onApplyOffer,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    try {
      Clipboard.setString(code);
    } catch {}
    setCopiedCode(code);
    onApplyOffer(code);
    setTimeout(() => setCopiedCode(null), 2500);
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

          <FlatList
            data={AVAILABLE_OFFERS}
            keyExtractor={item => item.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isCopied = copiedCode === item.code;
              return (
                <View style={styles.couponCard}>
                  <View style={styles.couponLeft}>
                    <View style={styles.discountBadge}>
                      <Tag size={13} color="#0E5B47" />
                      <Text style={styles.discountBadgeText}>{item.discount}</Text>
                    </View>
                    <Text style={styles.couponTitle}>{item.title}</Text>
                    <Text style={styles.couponDesc}>{item.description}</Text>
                    <Text style={styles.couponValidity}>Valid till: {item.validUntil}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.applyButton, isCopied && styles.applyButtonCopied]}
                    onPress={() => handleCopy(item.code)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.codeText}>{item.code}</Text>
                    <Text style={styles.applyActionText}>
                      {isCopied ? 'Copied!' : 'Apply Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
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
