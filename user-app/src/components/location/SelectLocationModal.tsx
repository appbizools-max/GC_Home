import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Search,
  Crosshair,
  Home,
  Building,
  MapPin,
  Clock,
  MoreVertical,
  ChevronRight,
  CheckCircle2,
  Circle,
  Navigation,
} from 'lucide-react-native';
import Svg, { Rect, Path, Circle as SvgCircle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

export interface SavedAddressOption {
  id: string;
  type: 'home' | 'office' | 'other';
  label: string;
  address: string;
  isDefault?: boolean;
}

export interface RecentAddressOption {
  id: string;
  area: string;
  fullAddress: string;
}

interface SelectLocationModalProps {
  visible: boolean;
  currentAddress: string;
  onSelectAddress: (address: string) => void;
  onClose: () => void;
}

const DEFAULT_SAVED_ADDRESSES: SavedAddressOption[] = [];

const INITIAL_RECENT_ADDRESSES: RecentAddressOption[] = [];

export const SelectLocationModal: React.FC<SelectLocationModalProps> = ({
  visible,
  currentAddress,
  onSelectAddress,
  onClose,
}) => {
  const { savedAddresses } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [recentAddresses, setRecentAddresses] = useState(INITIAL_RECENT_ADDRESSES);
  const [selectedFormattedAddress, setSelectedFormattedAddress] = useState(
    currentAddress || ''
  );

  const activeSavedAddresses: SavedAddressOption[] = savedAddresses && savedAddresses.length > 0
    ? savedAddresses.map(addr => ({
        id: addr.id,
        type: (addr.label?.toLowerCase().includes('office') ? 'office' : (addr.label?.toLowerCase().includes('home') ? 'home' : 'other')) as any,
        label: addr.label || 'Home',
        address: `${addr.street ? addr.street + ', ' : ''}${addr.locality ? addr.locality + ', ' : ''}${addr.city || 'Hyderabad'} - ${addr.pincode || '500001'}`,
        isDefault: Boolean(addr.isDefault),
      }))
    : DEFAULT_SAVED_ADDRESSES;

  const handleSelectSaved = (saved: SavedAddressOption) => {
    setSelectedId(saved.id);
    setSelectedFormattedAddress(saved.address.replace('\n', ', '));
  };

  const handleSelectRecent = (recent: RecentAddressOption) => {
    const formatted = `${recent.area}, ${recent.fullAddress}`;
    setSelectedFormattedAddress(formatted);
    setSelectedId(recent.id);
  };

  const handleUseCurrentLocation = () => {
    const detected = 'HSR Layout, Bengaluru, Karnataka 560102';
    setSelectedFormattedAddress(detected);
    setSelectedId('current_gps');
  };

  const handleConfirm = () => {
    onSelectAddress(selectedFormattedAddress);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.safeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#10243A" />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Select Your Location</Text>
            <Text style={styles.headerSubtitle}>We'll show services available near you</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Map Preview Graphic */}
          <View style={styles.mapContainer}>
            {/* Vector Map Simulation */}
            <Svg width="100%" height="160" viewBox="0 0 360 160" fill="none">
              <Rect width="360" height="160" fill="#F1F5F9" />
              {/* Roads */}
              <Path d="M0 40 Q 180 60 360 30" stroke="#E2E8F0" strokeWidth="18" fill="none" />
              <Path d="M80 0 L 140 160" stroke="#E2E8F0" strokeWidth="14" fill="none" />
              <Path d="M260 0 L 220 160" stroke="#E2E8F0" strokeWidth="14" fill="none" />
              <Path d="M0 120 Q 160 90 360 130" stroke="#FFFFFF" strokeWidth="12" fill="none" />
              <Path d="M0 40 Q 180 60 360 30" stroke="#FFFFFF" strokeWidth="10" fill="none" />
              {/* Green Parks */}
              <Path d="M220 70 Q 280 60 310 110 L 230 130 Z" fill="#DCFCE7" />
              <Path d="M30 60 Q 60 50 80 90 L 20 110 Z" fill="#DCFCE7" />
              {/* Blue Radar Pulse */}
              <SvgCircle cx="180" cy="80" r="32" fill="#3B82F6" fillOpacity="0.15" />
              <SvgCircle cx="180" cy="80" r="16" fill="#3B82F6" fillOpacity="0.25" />
              <SvgCircle cx="180" cy="80" r="6" fill="#2563EB" />
            </Svg>

            {/* Floating Location Tooltip Pin */}
            <View style={styles.mapTooltip}>
              <Text style={styles.tooltipTitle}>HSR Layout</Text>
              <Text style={styles.tooltipSub}>Bengaluru, Karnataka</Text>
            </View>

            {/* GPS Target Floating Button */}
            <TouchableOpacity style={styles.mapTargetBtn} onPress={handleUseCurrentLocation} activeOpacity={0.8}>
              <Crosshair size={18} color="#10243A" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={18} color="#68788C" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for area, landmark or pincode..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Use Current Location Action Bar */}
          <View style={styles.currentLocCard}>
            <View style={styles.currentLocLeft}>
              <View style={styles.currentLocIconBox}>
                <Navigation size={18} color="#168A68" />
              </View>
              <View>
                <Text style={styles.currentLocTitle}>Use Current Location</Text>
                <Text style={styles.currentLocSub}>Detect my current location</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.useLocBtn}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.85}
            >
              <Text style={styles.useLocBtnText}>Use Location</Text>
            </TouchableOpacity>
          </View>

          {/* Saved Addresses Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.addAddressText}>Add New +</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.savedList}>
            {activeSavedAddresses.length === 0 ? (
              <View style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>No saved addresses yet</Text>
              </View>
            ) : (
              activeSavedAddresses.map(item => {
                const isSelected = selectedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.savedCard, isSelected && styles.savedCardSelected]}
                    onPress={() => handleSelectSaved(item)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.savedCardContent}>
                      <View style={styles.savedIconBox}>
                        {item.type === 'home' && <Home size={20} color="#168A68" />}
                        {item.type === 'office' && <Building size={20} color="#168A68" />}
                        {item.type === 'other' && <MapPin size={20} color="#168A68" />}
                      </View>

                      <View style={styles.savedDetails}>
                        <View style={styles.savedLabelRow}>
                          <Text style={styles.savedLabel}>{item.label}</Text>
                          {item.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.savedAddressText}>{item.address}</Text>
                      </View>
                    </View>

                    <View style={styles.savedActionsRow}>
                      {isSelected ? (
                        <CheckCircle2 size={20} color="#168A68" fill="#168A68" />
                      ) : (
                        <Circle size={20} color="#CBD5E1" />
                      )}
                      <TouchableOpacity style={styles.moreOptionsBtn} activeOpacity={0.7}>
                        <MoreVertical size={16} color="#68788C" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Recent Addresses Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Addresses</Text>
            {recentAddresses.length > 0 && (
              <TouchableOpacity onPress={() => setRecentAddresses([])} activeOpacity={0.7}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.recentList}>
            {recentAddresses.length === 0 ? (
              <View style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>No recent addresses</Text>
              </View>
            ) : (
              recentAddresses.map(recent => (
                <TouchableOpacity
                  key={recent.id}
                  style={styles.recentItem}
                  onPress={() => handleSelectRecent(recent)}
                  activeOpacity={0.7}
                >
                  <Clock size={16} color="#68788C" style={styles.recentIcon} />
                  <View style={styles.recentTextCol}>
                    <Text style={styles.recentArea}>{recent.area}</Text>
                    <Text style={styles.recentFull}>{recent.fullAddress}</Text>
                  </View>
                  <ChevronRight size={16} color="#CBD5E1" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Sticky Confirm Location CTA Button */}
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.88}>
            <Text style={styles.confirmBtnText}>Confirm Location →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
    textAlign: 'center',
    marginRight: 32,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#68788C',
    textAlign: 'center',
    marginRight: 32,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  mapContainer: {
    height: 155,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  mapTooltip: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10243A',
  },
  tooltipSub: {
    fontSize: 9.5,
    color: '#68788C',
  },
  mapTargetBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#10243A',
    fontWeight: '600',
  },
  currentLocCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 18,
  },
  currentLocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  currentLocIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
  },
  currentLocSub: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  useLocBtn: {
    backgroundColor: '#0E5B47',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  useLocBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#10243A',
  },
  addAddressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  clearAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#168A68',
  },
  savedList: {
    gap: 10,
    marginBottom: 20,
  },
  savedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#F5FCF8',
    borderWidth: 1.5,
  },
  savedCardContent: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  savedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedDetails: {
    flex: 1,
  },
  savedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  savedLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
  },
  defaultBadge: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#168A68',
  },
  savedAddressText: {
    fontSize: 11.5,
    color: '#68788C',
    lineHeight: 16,
  },
  savedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreOptionsBtn: {
    padding: 4,
  },
  recentList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  recentIcon: {
    marginRight: 10,
  },
  recentTextCol: {
    flex: 1,
  },
  recentArea: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10243A',
  },
  recentFull: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 1,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    backgroundColor: '#FFFFFF',
  },
  confirmBtn: {
    backgroundColor: '#0E5B47',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E5B47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
