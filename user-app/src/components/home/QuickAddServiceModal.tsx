import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Service } from '../../types';
import { resolveImageSource } from '../../utils/imageUtils';
import { X, Star, Clock, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react-native';

interface QuickAddServiceModalProps {
  visible: boolean;
  service: Service | null;
  onProceedToBooking: (service: Service, roomCount: number, totalPrice: number) => void;
  onClose: () => void;
}

export const QuickAddServiceModal: React.FC<QuickAddServiceModalProps> = ({
  visible,
  service,
  onProceedToBooking,
  onClose,
}) => {
  if (!service) return null;

  const [rooms, setRooms] = useState(2);
  const basePrice = service.startingPrice;
  const pricePerExtraRoom = service.pricePerRoom || 250;
  const calculatedTotal = basePrice + (rooms > 1 ? (rooms - 1) * pricePerExtraRoom : 0);

  const handleBook = () => {
    onProceedToBooking(service, rooms, calculatedTotal);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>Quick Service Booking</Text>
              <Text style={styles.modalSubtitle}>Customize your service options</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          {/* Service Overview Card */}
          <View style={styles.servicePreviewCard}>
            <Image source={resolveImageSource(service.imageUrl)} style={styles.serviceImg} />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={styles.metaRow}>
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
                <View style={styles.durationBadge}>
                  <Clock size={11} color="#68788C" />
                  <Text style={styles.durationText}>{service.estimatedDuration}</Text>
                </View>
              </View>
              <Text style={styles.startsAtText}>Base Price: ₹{service.startingPrice}</Text>
            </View>
          </View>

          {/* Room / Size Counter */}
          <View style={styles.configSection}>
            <View>
              <Text style={styles.configLabel}>Select Size / Rooms</Text>
              <Text style={styles.configSub}>Standard 1BHK, 2BHK, 3BHK+</Text>
            </View>

            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[styles.counterBtn, rooms <= 1 && styles.counterBtnDisabled]}
                onPress={() => setRooms(prev => Math.max(1, prev - 1))}
                disabled={rooms <= 1}
              >
                <Minus size={16} color={rooms <= 1 ? '#94A3B8' : '#168A68'} />
              </TouchableOpacity>

              <Text style={styles.counterVal}>{rooms} {rooms === 1 ? 'BHK' : 'BHK'}</Text>

              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setRooms(prev => Math.min(6, prev + 1))}
              >
                <Plus size={16} color="#168A68" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Guarantee Badge */}
          <View style={styles.guaranteeRow}>
            <ShieldCheck size={16} color="#168A68" />
            <Text style={styles.guaranteeText}>
              100% Eco-friendly chemicals & sanitized equipment included
            </Text>
          </View>

          {/* Price & Checkout Footer */}
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.totalPriceLabel}>Total Estimated Price</Text>
              <Text style={styles.totalPriceVal}>₹ {calculatedTotal}</Text>
            </View>

            <TouchableOpacity style={styles.proceedBtn} onPress={handleBook} activeOpacity={0.88}>
              <Text style={styles.proceedBtnText}>Continue to Book</Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
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
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10243A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  servicePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 16,
    gap: 12,
  },
  serviceImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10243A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10243A',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 10.5,
    color: '#68788C',
  },
  startsAtText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#168A68',
    marginTop: 3,
  },
  configSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F4F2',
    marginBottom: 14,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  configSub: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  counterBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  counterVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10243A',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    padding: 10,
    borderRadius: 10,
    marginBottom: 18,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0E5B47',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceLabel: {
    fontSize: 11,
    color: '#68788C',
  },
  totalPriceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
  },
  proceedBtn: {
    backgroundColor: '#168A68',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  proceedBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
