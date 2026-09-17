import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle2, Clock, Plus, Minus, ArrowRight } from 'lucide-react-native';

export const ServiceDetailsScreen: React.FC = () => {
  const { selectedService, navigateTo } = useAuth();
  const [roomsCount, setRoomsCount] = useState(2);

  if (!selectedService) {
    navigateTo('customer_home');
    return null;
  }

  const pricePerExtraRoom = selectedService.pricePerRoom || 150;
  const totalPrice = selectedService.startingPrice + (roomsCount > 1 ? (roomsCount - 1) * pricePerExtraRoom : 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigateTo('customer_home')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedService.name}</Text>
      </View>

      <View style={styles.imageBox}>
        <Image
          source={{ uri: selectedService.imageUrl }}
          style={styles.image}
        />
        <View style={styles.durationOverlay}>
          <Clock size={14} color="#FFFFFF" />
          <Text style={styles.durationOverlayText}>Duration: {selectedService.estimatedDuration}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Overview</Text>
        <Text style={styles.cardDesc}>{selectedService.description}</Text>
      </View>

      <View style={[styles.card, styles.roomSelectorRow]}>
        <View style={styles.roomLabelGroup}>
          <Text style={styles.roomSelectorTitle}>Select Home Size (BHK / Rooms)</Text>
          <Text style={styles.roomSelectorSub}>+₹{pricePerExtraRoom} per additional room</Text>
        </View>
        <View style={styles.counterBox}>
          <TouchableOpacity onPress={() => setRoomsCount(Math.max(1, roomsCount - 1))} style={styles.counterBtn}>
            <Minus size={16} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.counterText}>{roomsCount}</Text>
          <TouchableOpacity onPress={() => setRoomsCount(roomsCount + 1)} style={styles.counterBtn}>
            <Plus size={16} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What's Included</Text>
        <View style={styles.featureList}>
          {selectedService.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <CheckCircle2 size={16} color="#2D8A68" style={{ marginTop: 2 }} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footerBar}>
        <View>
          <Text style={styles.totalLabel}>TOTAL PRICE</Text>
          <Text style={styles.totalValue}>₹{totalPrice}</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigateTo('booking_screen', { service: selectedService, roomsCount, totalPrice })}
          style={styles.bookBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  imageBox: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  durationOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  roomSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomLabelGroup: {
    flex: 1,
    marginRight: 12,
  },
  roomSelectorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  roomSelectorSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  counterBtn: {
    padding: 4,
  },
  counterText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E4E3D',
    minWidth: 20,
    textAlign: 'center',
  },
  featureList: {
    gap: 10,
    marginTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  footerBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  bookBtn: {
    backgroundColor: '#1E4E3D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
