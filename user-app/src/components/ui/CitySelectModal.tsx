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
import { Search, X, Check, MapPin } from 'lucide-react-native';

export interface CityItem {
  id: string;
  name: string;
  state: string;
  isPopular?: boolean;
}

export const INDIAN_CITIES: CityItem[] = [
  { id: 'blr', name: 'Bengaluru', state: 'Karnataka', isPopular: true },
  { id: 'hyd', name: 'Hyderabad', state: 'Telangana', isPopular: true },
  { id: 'mum', name: 'Mumbai', state: 'Maharashtra', isPopular: true },
  { id: 'del', name: 'Delhi NCR', state: 'Delhi & NCR', isPopular: true },
  { id: 'pun', name: 'Pune', state: 'Maharashtra', isPopular: true },
  { id: 'chn', name: 'Chennai', state: 'Tamil Nadu', isPopular: true },
  { id: 'kol', name: 'Kolkata', state: 'West Bengal', isPopular: true },
  { id: 'ahm', name: 'Ahmedabad', state: 'Gujarat', isPopular: true },
  { id: 'jai', name: 'Jaipur', state: 'Rajasthan' },
  { id: 'koc', name: 'Kochi', state: 'Kerala' },
  { id: 'chd', name: 'Chandigarh', state: 'Punjab' },
  { id: 'lko', name: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 'ind', name: 'Indore', state: 'Madhya Pradesh' },
];

interface CitySelectModalProps {
  visible: boolean;
  selectedCity: string;
  onSelect: (city: CityItem) => void;
  onClose: () => void;
}

export const CitySelectModal: React.FC<CitySelectModalProps> = ({
  visible,
  selectedCity,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const filtered = INDIAN_CITIES.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Select Your City</Text>
              <Text style={styles.modalSub}>GC Home Plus verified services are active in:</Text>
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
              placeholder="Search your city..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Cities List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const formattedName = `${item.name}, ${item.state}`;
              const isSelected =
                selectedCity.toLowerCase().includes(item.name.toLowerCase()) ||
                selectedCity === formattedName;

              return (
                <TouchableOpacity
                  style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={[styles.pinIconBox, isSelected && styles.pinIconBoxSelected]}>
                    <MapPin size={16} color={isSelected ? '#168A68' : '#68788C'} />
                  </View>
                  <View style={styles.cityTextCol}>
                    <View style={styles.cityNameRow}>
                      <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                        {item.name}
                      </Text>
                      {item.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>Active Hub</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stateName}>{item.state}</Text>
                  </View>
                  {isSelected && <Check size={18} color="#168A68" strokeWidth={2.5} />}
                </TouchableOpacity>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#10243A',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    gap: 12,
  },
  cityRowSelected: {
    backgroundColor: '#F5FCF8',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  pinIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIconBoxSelected: {
    backgroundColor: '#EAF8F1',
  },
  cityTextCol: {
    flex: 1,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10243A',
  },
  cityNameSelected: {
    color: '#168A68',
  },
  popularBadge: {
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#168A68',
  },
  stateName: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
});
