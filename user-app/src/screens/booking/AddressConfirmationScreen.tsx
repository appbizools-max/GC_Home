import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../config/supabase';
import { AppLogo } from '../../components/ui/AppLogo';
import { AddressFormModal } from '../../components/ui/AddressFormModal';
import { Address } from '../../types';
import { checkPincodeServiceability } from '../../services/pincodeService';
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

export const AddressConfirmationScreen: React.FC = () => {
  const { navigateTo, savedAddresses, addSavedAddress, updateSavedAddress } = useAuth();
  const { cart, setDeliveryAddress } = useCart();

  const defaultSavedAddress = (savedAddresses && savedAddresses.length > 0)
    ? (savedAddresses.find(a => a.isDefault) || savedAddresses[0])
    : null;

  // Selected Booking Address: starts with active cart address if present, or user's default address
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    cart?.address || defaultSavedAddress
  );
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);

  // Synchronize when savedAddresses load or cart address changes
  useEffect(() => {
    if (!selectedAddress && defaultSavedAddress) {
      setSelectedAddress(defaultSavedAddress);
      setDeliveryAddress(defaultSavedAddress);
    }
  }, [defaultSavedAddress, selectedAddress, setDeliveryAddress]);

  // Address Modal State for Add / Edit
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditCurrent = () => {
    if (selectedAddress) {
      setEditingAddress(selectedAddress);
      setIsAddressModalOpen(true);
    }
  };

  /**
   * Save address from modal:
   * By default, adding or choosing an address for a booking does NOT affect
   * or modify the customer's Default Address unless they explicitly choose to make it default.
   */
  const handleSaveModalAddress = async (data: Omit<Address, 'id'>) => {
    if (editingAddress) {
      await updateSavedAddress(editingAddress.id, data);
      const updated: Address = { ...editingAddress, ...data };
      setSelectedAddress(updated);
      setDeliveryAddress(updated);
    } else {
      const isFirst = !savedAddresses || savedAddresses.length === 0;
      const willBeDefault = Boolean(data.isDefault || isFirst);
      await addSavedAddress({ ...data, isDefault: willBeDefault });
      const newAddr: Address = {
        id: 'addr_' + Date.now(),
        ...data,
        isDefault: willBeDefault,
      };
      setSelectedAddress(newAddr);
      setDeliveryAddress(newAddr);
    }
  };

  const [serviceMessage, setServiceMessage] = useState<string>('Services available in your area.');

  const validateArea = useCallback(async () => {
    if (!selectedAddress || !selectedAddress.pincode) {
      setIsServiceAvailable(false);
      setServiceMessage('Please select or add an address to verify service availability.');
      return;
    }
    const result = await checkPincodeServiceability(selectedAddress.pincode);
    setIsServiceAvailable(result.isServiceable);
    setServiceMessage(result.message);
  }, [selectedAddress]);

  useEffect(() => {
    validateArea();

    // Supabase Realtime sync: reflect Admin activate/deactivate changes immediately
    const channel = supabase
      .channel('service_areas_realtime_address_confirm')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_areas' },
        () => {
          validateArea();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [validateArea]);

  /**
   * Selecting an address for this booking:
   * Sets the booking delivery address without modifying the customer's Default Address.
   */
  const handleSelect = (addr: Address) => {
    setSelectedAddress(addr);
    setDeliveryAddress(addr);
  };

  const handleConfirm = () => {
    if (!selectedAddress || !isServiceAvailable) return;
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
          <Text style={styles.screenTitle}>Where should we clean?</Text>
          <Text style={styles.screenSubtitle}>
            Choose a service address for this booking or add a new location
          </Text>
        </View>

        {/* Swiggy-style Booking Notice */}
        <View style={styles.noticeBanner}>
          <MapPin size={15} color="#0D8846" />
          <Text style={styles.noticeBannerText}>
            You can select any location for this booking. Your default address won't be changed.
          </Text>
        </View>

        {/* Selected Booking Address Preview Hero Card */}
        {selectedAddress ? (
          <View style={styles.currentCard}>
            <View style={styles.currentCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.badgeLabel}>
                  <Home size={14} color="#0E5B47" />
                  <Text style={styles.badgeLabelText}>{selectedAddress.label} Address</Text>
                </View>
                {selectedAddress.isDefault && (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultPillText}>DEFAULT ADDRESS</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.editBtn} onPress={handleEditCurrent} activeOpacity={0.7}>
                <Edit3 size={13} color="#168A68" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {Boolean(selectedAddress.houseFlat) && (
              <Text style={styles.houseFlatText}>{selectedAddress.houseFlat}</Text>
            )}
            <Text style={styles.streetText}>{selectedAddress.street}</Text>
            <Text style={styles.localityText}>
              {selectedAddress.locality ? `${selectedAddress.locality}, ` : ''}
              {selectedAddress.city}
              {selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ''}
            </Text>

            {Boolean(selectedAddress.landmark) && (
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
                    Services available in your area.
                  </Text>
                </>
              ) : (
                <>
                  <AlertCircle size={16} color="#EF4444" />
                  <Text style={[styles.coverageText, { color: '#EF4444' }]}>
                    {serviceMessage || 'Sorry, GC HOME+ is currently not available in your area.'}
                  </Text>
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyPromptCard}>
            <MapPin size={28} color="#94A3B8" />
            <Text style={styles.emptyPromptTitle}>No service address selected</Text>
            <Text style={styles.emptyPromptSub}>
              Please add a service location where you would like our cleaning partner to arrive.
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={handleAddNew} activeOpacity={0.85}>
              <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.addFirstBtnText}>Add Service Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Addresses Section */}
        <View style={styles.savedSectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity style={styles.addNewBtn} onPress={handleAddNew} activeOpacity={0.7}>
            <Plus size={14} color="#168A68" strokeWidth={2.5} />
            <Text style={styles.addNewText}>Add New Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addressesList}>
          {savedAddresses && savedAddresses.length > 0 ? (
            savedAddresses.map(addr => {
              const isSelected = selectedAddress?.id === addr.id;
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.addrLabel}>{addr.label}</Text>
                      {addr.isDefault && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    {Boolean(addr.houseFlat) && (
                      <Text style={styles.addrHouseFlat}>{addr.houseFlat}</Text>
                    )}
                    <Text style={styles.addrStreet} numberOfLines={1}>
                      {addr.street}
                    </Text>
                    <Text style={styles.addrCity}>
                      {addr.locality ? `${addr.locality}, ` : ''}{addr.city} - {addr.pincode}
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
            })
          ) : (
            <View style={styles.noAddressesFoundBox}>
              <Text style={styles.noAddressesText}>No saved addresses found. Tap "+ Add New Location" above.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Confirmation Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedAddress || !isServiceAvailable) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selectedAddress || !isServiceAvailable}
          activeOpacity={0.88}
        >
          <Text style={styles.confirmBtnText}>Confirm Booking Address</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* Address Form Modal with PIN auto-fill */}
      <AddressFormModal
        visible={isAddressModalOpen}
        initialAddress={editingAddress}
        onSave={handleSaveModalAddress}
        onClose={() => setIsAddressModalOpen(false)}
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
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#C6E7D2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#0D6836',
    fontWeight: '600',
    lineHeight: 16,
  },
  defaultPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  defaultPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  houseFlatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 1,
  },
  addrHouseFlat: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyPromptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyPromptSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D8846',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFirstBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  noAddressesFoundBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noAddressesText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
});
