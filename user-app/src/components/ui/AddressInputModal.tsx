import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Home, MapPin, X, Check, Building2 } from 'lucide-react-native';

interface AddressInputModalProps {
  visible: boolean;
  currentAddress: string;
  selectedCity: string;
  onSave: (fullAddress: string) => void;
  onClose: () => void;
}

export const AddressInputModal: React.FC<AddressInputModalProps> = ({
  visible,
  currentAddress,
  selectedCity,
  onSave,
  onClose,
}) => {
  const [flatNumber, setFlatNumber] = useState('123, 4th Cross');
  const [streetArea, setStreetArea] = useState('HSR Layout, Sector 2');
  const [pincode, setPincode] = useState('560102');
  const [landmark, setLandmark] = useState('Near BDA Complex');

  const handleConfirm = () => {
    const parts = [
      flatNumber.trim(),
      streetArea.trim(),
      selectedCity || 'Bengaluru, Karnataka',
      pincode.trim() ? `- ${pincode.trim()}` : '',
    ].filter(Boolean);

    const formatted = parts.join(', ').replace(', -', ' -');
    onSave(formatted);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.modalTitle}>Your Home Address</Text>
              <Text style={styles.modalSub}>Our cleaning professionals will arrive at this address</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Flat / House No */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HOUSE / FLAT / APARTMENT NO *</Text>
              <View style={styles.inputBox}>
                <Building2 size={18} color="#168A68" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Flat 402, Green Glen Towers"
                  placeholderTextColor="#94A3B8"
                  value={flatNumber}
                  onChangeText={setFlatNumber}
                />
              </View>
            </View>

            {/* Street / Locality */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>STREET / LOCALITY / AREA *</Text>
              <View style={styles.inputBox}>
                <Home size={18} color="#168A68" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 4th Cross, HSR Layout"
                  placeholderTextColor="#94A3B8"
                  value={streetArea}
                  onChangeText={setStreetArea}
                />
              </View>
            </View>

            {/* City & Pincode Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>CITY / STATE</Text>
                <View style={[styles.inputBox, styles.readOnlyBox]}>
                  <MapPin size={16} color="#68788C" />
                  <Text style={styles.readOnlyText} numberOfLines={1}>
                    {selectedCity || 'Bengaluru'}
                  </Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 0.8 }]}>
                <Text style={styles.inputLabel}>PINCODE *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="560102"
                    placeholderTextColor="#94A3B8"
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
            </View>

            {/* Landmark */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LANDMARK (OPTIONAL)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Opposite BDA Complex"
                  placeholderTextColor="#94A3B8"
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>
            </View>

            {/* Save Address Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm} activeOpacity={0.88}>
              <Text style={styles.saveBtnText}>Save Address</Text>
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </ScrollView>
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
  titleGroup: {
    flex: 1,
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
  formScroll: {
    maxHeight: 450,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#68788C',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyBox: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  readOnlyText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#10243A',
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#10243A',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#168A68',
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
