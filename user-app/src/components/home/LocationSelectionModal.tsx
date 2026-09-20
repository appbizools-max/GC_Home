import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Address } from '../../types';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Home,
  Briefcase,
  Plus,
  Check,
} from 'lucide-react-native';

interface LocationSelectionModalProps {
  visible: boolean;
  currentLocation: string;
  savedAddresses: Address[];
  onSelectAddress: (addressText: string) => void;
  onAddNewAddress: () => void;
  onClose: () => void;
}

export const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
  visible,
  currentLocation,
  savedAddresses,
  onSelectAddress,
  onAddNewAddress,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const handleUseGPS = () => {
    const gpsLocation = 'HSR Layout, Bengaluru, Karnataka 560102';
    onSelectAddress(gpsLocation);
    onClose();
  };

  const POPULAR_AREAS = [
    'HSR Layout, Bengaluru, Karnataka 560102',
    'Koramangala, Bengaluru, Karnataka 560034',
    'Indiranagar, Bengaluru, Karnataka 560038',
    'Whitefield, Bengaluru, Karnataka 560066',
    'Bellandur, Bengaluru, Karnataka 560103',
    'Kondapur, Hyderabad, Telangana 500084',
    'Hitec City, Hyderabad, Telangana 500081',
    'Bandra West, Mumbai, Maharashtra 400050',
    'Powai, Mumbai, Maharashtra 400076',
  ];

  const filteredAreas = POPULAR_AREAS.filter(area =>
    area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Choose Service Location</Text>
              <Text style={styles.modalSubtitle}>Showing verified cleaning services in your area</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Search size={16} color="#68788C" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area, apartment or pincode..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Use Current GPS Location Button */}
          <TouchableOpacity style={styles.gpsButton} onPress={handleUseGPS} activeOpacity={0.8}>
            <View style={styles.gpsIconCircle}>
              <Navigation size={16} color="#168A68" />
            </View>
            <View style={styles.gpsTextCol}>
              <Text style={styles.gpsTitle}>Use Current Location</Text>
              <Text style={styles.gpsSubtitle}>Using device GPS / auto-detect</Text>
            </View>
          </TouchableOpacity>

          {/* Saved Addresses Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
            <TouchableOpacity onPress={onAddNewAddress} style={styles.addBtnSmall}>
              <Plus size={13} color="#168A68" />
              <Text style={styles.addBtnSmallText}>Add New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.savedList}>
            {savedAddresses.map(addr => {
              const fullFormatted = `${addr.street}, ${addr.locality}, ${addr.city} ${addr.pincode}`;
              const isSelected = currentLocation.includes(addr.locality) || currentLocation.includes(addr.city);

              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                  onPress={() => {
                    onSelectAddress(fullFormatted);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.addrIconBox, isSelected && styles.addrIconBoxSelected]}>
                    {addr.label.toLowerCase() === 'home' ? (
                      <Home size={16} color={isSelected ? '#168A68' : '#68788C'} />
                    ) : (
                      <Briefcase size={16} color={isSelected ? '#168A68' : '#68788C'} />
                    )}
                  </View>

                  <View style={styles.addrTextCol}>
                    <Text style={[styles.addrLabel, isSelected && styles.addrLabelSelected]}>
                      {addr.label}
                    </Text>
                    <Text style={styles.addrDetails} numberOfLines={1}>
                      {addr.street}, {addr.locality}
                    </Text>
                  </View>

                  {isSelected && <Check size={18} color="#168A68" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search suggestions if typing */}
          {search.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.sectionTitle}>SUGGESTED AREAS</Text>
              <FlatList
                data={filteredAreas}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestedAreaRow}
                    onPress={() => {
                      onSelectAddress(item);
                      onClose();
                    }}
                  >
                    <MapPin size={15} color="#168A68" />
                    <Text style={styles.suggestedAreaText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
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
    maxHeight: '85%',
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
  modalSubtitle: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#10243A',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EAF8F1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    gap: 12,
    marginBottom: 18,
  },
  gpsIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E5B47',
  },
  gpsSubtitle: {
    fontSize: 11,
    color: '#168A68',
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#68788C',
    letterSpacing: 0.8,
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  savedList: {
    gap: 10,
    marginBottom: 14,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
    gap: 12,
  },
  addressCardSelected: {
    backgroundColor: '#EAF8F1',
    borderColor: '#168A68',
  },
  addrIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addrIconBoxSelected: {
    backgroundColor: '#FFFFFF',
  },
  addrTextCol: {
    flex: 1,
  },
  addrLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
  },
  addrLabelSelected: {
    color: '#0E5B47',
  },
  addrDetails: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 1,
  },
  searchResultsContainer: {
    maxHeight: 180,
    marginTop: 6,
  },
  suggestedAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  suggestedAreaText: {
    fontSize: 13,
    color: '#10243A',
    fontWeight: '600',
    flex: 1,
  },
});
