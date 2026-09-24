import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Address } from '../../types';
import { AddressEntryForm, AddressFormData } from '../address/AddressEntryForm';

interface AddressFormModalProps {
  visible: boolean;
  initialAddress?: Address | null;
  onSave: (addressData: Omit<Address, 'id'>) => Promise<any> | void;
  onClose: () => void;
}

const PRESET_LABELS = ['Home', 'Work', 'Apartment', 'Parents', 'Other'];

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  visible,
  initialAddress,
  onSave,
  onClose,
}) => {
  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialAddress) {
      const preset = PRESET_LABELS.includes(initialAddress.label) ? initialAddress.label : 'Other';
      setLabel(preset);
      if (preset === 'Other') setCustomLabel(initialAddress.label);
      setIsDefault(Boolean(initialAddress.isDefault));
    } else {
      setLabel('Home');
      setCustomLabel('');
      setIsDefault(false);
    }
  }, [initialAddress, visible]);

  const handleAddressSubmit = async (formData: AddressFormData) => {
    const finalLabel = label === 'Other' ? customLabel.trim() || 'Other' : label;
    setIsSaving(true);
    try {
      await onSave({
        label: finalLabel,
        houseFlat: formData.houseFlat,
        street: formData.street,
        locality: formData.locality,
        landmark: formData.landmark,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        postOffice: formData.postOffice,
        isDefault,
      });
      setIsSaving(false);
      onClose();
    } catch {
      setIsSaving(false);
      Alert.alert('Save Failed', 'Could not save address. Please try again.');
    }
  };

  const initialFormValues: Partial<AddressFormData> = initialAddress
    ? {
        houseFlat: initialAddress.houseFlat || '',
        street: initialAddress.street || '',
        locality: initialAddress.locality || '',
        landmark: initialAddress.landmark || '',
        city: initialAddress.city || '',
        district: initialAddress.district || '',
        state: initialAddress.state || '',
        pincode: initialAddress.pincode || '',
        postOffice: initialAddress.postOffice || '',
      }
    : {};

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>
                {initialAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}
              </Text>
              <Text style={styles.subtitle}>Enter 6-digit PIN code to auto-fill location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <AddressEntryForm
              key={initialAddress ? initialAddress.id : 'new_addr'}
              initialValues={initialFormValues}
              submitButtonText={isSaving ? 'Saving Address...' : 'Save Address'}
              isSubmitting={isSaving}
              onSubmit={handleAddressSubmit}
              extraHeaderContent={
                <View style={styles.labelSection}>
                  <Text style={styles.fieldLabel}>ADDRESS LABEL *</Text>
                  <View style={styles.labelRow}>
                    {PRESET_LABELS.map(item => (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setLabel(item)}
                        style={[styles.labelChip, label === item && styles.labelChipActive]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.labelChipText, label === item && styles.labelChipTextActive]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {label === 'Other' && (
                    <View style={styles.customLabelGroup}>
                      <Text style={styles.inputSubLabel}>CUSTOM LABEL NAME</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Sister's House, Farmhouse"
                        placeholderTextColor="#94A3B8"
                        value={customLabel}
                        onChangeText={setCustomLabel}
                      />
                    </View>
                  )}
                </View>
              }
              extraFooterContent={
                <TouchableOpacity
                  onPress={() => setIsDefault(!isDefault)}
                  style={styles.defaultToggleRow}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
                    {isDefault && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.defaultToggleText}>Set as Default Delivery Address</Text>
                </TouchableOpacity>
              }
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  scrollContent: {
    marginTop: 14,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#0D8846',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D8846',
  },
  labelSection: {
    marginBottom: 12,
  },
  customLabelGroup: {
    marginTop: 8,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  labelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  labelChipActive: {
    backgroundColor: '#0D8846',
    borderColor: '#0D8846',
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  labelChipTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  defaultToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0D8846',
    borderColor: '#0D8846',
  },
  defaultToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  saveBtn: {
    backgroundColor: '#0D8846',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

