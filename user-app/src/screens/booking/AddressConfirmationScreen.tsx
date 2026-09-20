import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { Address } from '../../types';
import {
  ArrowLeft,
  MapPin,
  Home,
  Building,
  CheckCircle2,
  Circle,
  Plus,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Edit3,
} from 'lucide-react-native';

const SAVED_ADDRESSES_LIST: Address[] = [
  {
    id: 'addr_home',
    label: 'Home',
    street: '123, 4th Cross, HSR Layout',
    locality: 'Sector 2, HSR Layout',
    city: 'Bengaluru',
    pincode: '560102',
    landmark: 'Near BDA Complex',
  },
  {
    id: 'addr_office',
    label: 'Office',
    street: 'Prestige Tech Park, Outer Ring Road',
    locality: 'Marathahalli - Sarjapur',
    city: 'Bengaluru',
    pincode: '560103',
  },
  {
    id: 'addr_other',
    label: 'Parents Home',
    street: '742, 21st Main, 5th Block',
    locality: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
  },
];

export const AddressConfirmationScreen: React.FC = () => {
  const { navigateTo } = useAuth();
  const { cart, setDeliveryAddress } = useCart();

  const [selectedAddress, setSelectedAddress] = useState<Address>(
    cart?.address || SAVED_ADDRESSES_LIST[0]
  );
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);

  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    // Simulating coverage check in Bengaluru
    const available = addr.city.toLowerCase().includes('bengaluru') || addr.pincode.startsWith('560');
    setIsServiceAvailable(available);
    setDeliveryAddress(addr);
  };

  const handleConfirm = () => {
    if (!isServiceAvailable) return;
    setDeliveryAddress(selectedAddress);
    navigateTo('booking-summary');
  };

  return (
    <View style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('service-details')}
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
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Where should we clean?</Text>
          <Text style={styles.screenSubtitle}>
            Select your service address or add a new location
          </Text>
        </View>

        {/* Selected Address Preview Hero Card */}
        <View style={styles.currentCard}>
          <View style={styles.currentCardHeader}>
            <View style={styles.badgeLabel}>
              <Home size={14} color="#0E5B47" />
              <Text style={styles.badgeLabelText}>{selectedAddress.label} Address</Text>
            </View>

            <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
              <Edit3 size={13} color="#168A68" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.streetText}>{selectedAddress.street}</Text>
          <Text style={styles.localityText}>
            {selectedAddress.locality}, {selectedAddress.city} - {selectedAddress.pincode}
          </Text>

          {selectedAddress.landmark && (
            <Text style={styles.landmarkText}>Landmark: {selectedAddress.landmark}</Text>
          )}

          {/* Service Availability Badge */}
          <View
            style={[
              styles.coverageBanner,
              !isServiceAvailable && styles.coverageBannerUnavailable,
            ]}
          >
            {isServiceAvailable ? (
              <>
                <ShieldCheck size={16} color="#168A68" />
                <Text style={styles.coverageText}>
                  Great news! GC Home Plus services are available at this location.
                </Text>
              </>
            ) : (
              <>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={[styles.coverageText, { color: '#EF4444' }]}>
                  This service isn't currently available at this location.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Saved Addresses Section */}
        <View style={styles.savedSectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity style={styles.addNewBtn} activeOpacity={0.7}>
            <Plus size={14} color="#168A68" strokeWidth={2.5} />
            <Text style={styles.addNewText}>Add New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addressesList}>
          {SAVED_ADDRESSES_LIST.map(addr => {
            const isSelected = selectedAddress.id === addr.id;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                onPress={() => handleSelect(addr)}
                activeOpacity={0.88}
              >
                <View style={styles.addrIconBox}>
                  {addr.label === 'Home' ? (
                    <Home size={18} color="#168A68" />
                  ) : (
                    <Building size={18} color="#168A68" />
                  )}
                </View>

                <View style={styles.addrDetails}>
                  <Text style={styles.addrLabel}>{addr.label}</Text>
                  <Text style={styles.addrStreet} numberOfLines={1}>
                    {addr.street}
                  </Text>
                  <Text style={styles.addrCity}>
                    {addr.locality}, {addr.city}
                  </Text>
                </View>

                <View style={styles.addrRadio}>
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
      </ScrollView>

      {/* Sticky Bottom Confirmation Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !isServiceAvailable && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!isServiceAvailable}
          activeOpacity={0.88}
        >
          <Text style={styles.confirmBtnText}>Confirm Address</Text>
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
    marginBottom: 16,
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
  currentCard: {
    backgroundColor: '#F5FCF8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#168A68',
    marginBottom: 20,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  currentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5B47',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  streetText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10243A',
    marginBottom: 2,
  },
  localityText: {
    fontSize: 12.5,
    color: '#68788C',
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 11.5,
    color: '#168A68',
    fontWeight: '600',
    marginBottom: 10,
  },
  coverageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  coverageBannerUnavailable: {
    backgroundColor: '#FEF2F2',
  },
  coverageText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#0E5B47',
  },
  savedSectionHeader: {
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
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  addressesList: {
    gap: 10,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  addressCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#F5FCF8',
    borderWidth: 1.5,
  },
  addrIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addrDetails: {
    flex: 1,
  },
  addrLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  addrStreet: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 1,
  },
  addrCity: {
    fontSize: 11,
    color: '#94A3B8',
  },
  addrRadio: {
    marginLeft: 10,
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
  confirmBtn: {
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
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
