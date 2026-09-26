import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CheckCircle2,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import { pincodeService, PincodeLookupResult } from '../../services/pincodeService';

export interface AddressFormData {
  houseFlat: string;
  street: string;
  locality: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  postOffice?: string;
}

export interface AddressEntryFormProps {
  initialValues?: Partial<AddressFormData>;
  submitButtonText?: string;
  onSubmit?: (data: AddressFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  showCancelButton?: boolean;
  showSubmitButton?: boolean;
  onChange?: (data: AddressFormData) => void;
  extraHeaderContent?: React.ReactNode;
  extraFooterContent?: React.ReactNode;
  cityOptions?: string[];
  onInputFocus?: (event: any) => void;
}

export const AddressEntryForm: React.FC<AddressEntryFormProps> = ({
  initialValues,
  submitButtonText = 'Continue',
  onSubmit,
  isSubmitting = false,
  onCancel,
  showCancelButton = false,
  showSubmitButton = true,
  onChange,
  extraHeaderContent,
  extraFooterContent,
  cityOptions,
  onInputFocus,
}) => {
  // Address Fields
  const [houseFlat, setHouseFlat] = useState(initialValues?.houseFlat || '');
  const [street, setStreet] = useState(initialValues?.street || '');
  const [locality, setLocality] = useState(initialValues?.locality || '');
  const [pincode, setPincode] = useState(initialValues?.pincode || '');
  const [city, setCity] = useState(initialValues?.city || '');
  const [district, setDistrict] = useState(initialValues?.district || '');
  const [state, setState] = useState(initialValues?.state || '');
  const [landmark, setLandmark] = useState(initialValues?.landmark || '');
  const [selectedPostOffice, setSelectedPostOffice] = useState(initialValues?.postOffice || '');

  // UI States
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isLoadingPin, setIsLoadingPin] = useState(false);
  const [pinLookupSuccess, setPinLookupSuccess] = useState(false);
  const [availablePostOffices, setAvailablePostOffices] = useState<string[]>([]);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lastSearchedPinRef = useRef<string>('');
  const lastInitialKeyRef = useRef<string>('');

  useEffect(() => {
    if (initialValues) {
      const key = `${initialValues.houseFlat || ''}|${initialValues.street || ''}|${initialValues.locality || ''}|${initialValues.city || ''}|${initialValues.pincode || ''}`;
      if (key !== '' && key !== lastInitialKeyRef.current) {
        lastInitialKeyRef.current = key;
        if (initialValues.houseFlat !== undefined) setHouseFlat(initialValues.houseFlat);
        if (initialValues.street !== undefined) setStreet(initialValues.street);
        if (initialValues.locality !== undefined) setLocality(initialValues.locality);
        if (initialValues.landmark !== undefined) setLandmark(initialValues.landmark || '');
        if (initialValues.city !== undefined) setCity(initialValues.city);
        if (initialValues.district !== undefined) setDistrict(initialValues.district || '');
        if (initialValues.state !== undefined) setState(initialValues.state);
        if (initialValues.pincode !== undefined) setPincode(initialValues.pincode);
        if (initialValues.postOffice !== undefined) setSelectedPostOffice(initialValues.postOffice || '');
      }
    }
  }, [
    initialValues?.houseFlat,
    initialValues?.street,
    initialValues?.locality,
    initialValues?.city,
    initialValues?.district,
    initialValues?.state,
    initialValues?.pincode,
    initialValues?.postOffice,
  ]);

  // Sync state upward via onChange callback
  useEffect(() => {
    if (onChange) {
      onChange({
        houseFlat,
        street,
        locality,
        city,
        district,
        state,
        pincode,
        postOffice: selectedPostOffice,
        landmark,
      });
    }
  }, [houseFlat, street, locality, city, district, state, pincode, selectedPostOffice, landmark, onChange]);

  // Trigger PIN Code Lookup when 6 numeric digits are entered
  const handlePincodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);

    if (errors.pincode) {
      setErrors(prev => ({ ...prev, pincode: '' }));
    }

    if (cleaned.length === 6) {
      triggerPincodeLookup(cleaned);
    } else {
      setIsLoadingPin(false);
      setPinLookupSuccess(false);
      setAvailablePostOffices([]);
      lastSearchedPinRef.current = '';
    }
  };

  const triggerPincodeLookup = async (pin: string) => {
    if (lastSearchedPinRef.current === pin) return;
    lastSearchedPinRef.current = pin;

    setIsLoadingPin(true);
    setPinLookupSuccess(false);
    setAvailablePostOffices([]);

    const result: PincodeLookupResult = await pincodeService.fetchPincodeDetails(pin);
    setIsLoadingPin(false);

    if (result.success) {
      setPinLookupSuccess(true);

      // Auto-fill State and District
      if (result.state) setState(result.state);
      if (result.district) setDistrict(result.district);

      // City handling: if cityOptions provided, check if detected city matches one of the options
      if (cityOptions && cityOptions.length > 0) {
        const detected = (result.city || '').toLowerCase();
        const detectedDist = (result.district || '').toLowerCase();
        const matched = cityOptions.find(
          c => c.toLowerCase() === detected || c.toLowerCase() === detectedDist
        );
        if (matched) {
          setCity(matched);
          if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
        }
      } else {
        if (result.city) setCity(result.city);
      }

      // Multiple Post Offices / Localities handling
      if (result.postOffices && result.postOffices.length > 0) {
        setAvailablePostOffices(result.postOffices);
        if (!locality.trim()) {
          setSelectedPostOffice(result.postOffices[0]);
          setLocality(result.postOffices[0]);
        }
      }
    } else {
      if (result.errorType === 'notFound' || result.message) {
        setErrors(prev => ({
          ...prev,
          pincode: result.message || "We couldn't find this PIN code. Please check the PIN and try again.",
        }));
      }
    }
  };

  const handleSelectPostOffice = (poName: string) => {
    setSelectedPostOffice(poName);
    setLocality(poName);
    if (errors.locality) {
      setErrors(prev => ({ ...prev, locality: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!houseFlat.trim()) {
      newErrors.houseFlat = 'Please enter house / flat / door number.';
    }
    if (!street.trim()) {
      newErrors.street = 'Please enter street or road.';
    }
    if (!locality.trim()) {
      newErrors.locality = 'Please enter area or locality.';
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      newErrors.pincode = 'Please enter a valid 6-digit PIN code.';
    }

    // City validation: if cityOptions provided, must be in cityOptions
    if (cityOptions && cityOptions.length > 0) {
      if (!city || !cityOptions.includes(city)) {
        newErrors.city = 'Please select your city.';
      }
    } else {
      if (!city.trim()) {
        newErrors.city = 'Please enter city.';
      }
    }

    if (!state.trim()) {
      newErrors.state = 'Please enter state.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Incomplete Address', 'Please fill in all required address fields before saving.');
      return;
    }

    onSubmit?.({
      houseFlat: houseFlat.trim(),
      street: street.trim(),
      locality: locality.trim(),
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      district: district.trim() || undefined,
      state: state.trim(),
      pincode: pincode.trim(),
      postOffice: selectedPostOffice || undefined,
    });
  };

  return (
    <View style={styles.formContainer}>
      {extraHeaderContent}

      {/* ── 1. House / Flat / Door No. ── */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>HOUSE / FLAT / DOOR NO. *</Text>
        <TextInput
          style={[styles.input, errors.houseFlat ? styles.inputError : null]}
          placeholder="Enter house / flat / door number"
          placeholderTextColor="#94A3B8"
          value={houseFlat}
          onFocus={onInputFocus}
          onChangeText={text => {
            setHouseFlat(text);
            if (errors.houseFlat) setErrors(prev => ({ ...prev, houseFlat: '' }));
          }}
        />
        {errors.houseFlat ? <Text style={styles.errorText}>{errors.houseFlat}</Text> : null}
      </View>

      {/* ── 2. Street / Road ── */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>STREET / ROAD *</Text>
        <TextInput
          style={[styles.input, errors.street ? styles.inputError : null]}
          placeholder="Enter street or road"
          placeholderTextColor="#94A3B8"
          value={street}
          onFocus={onInputFocus}
          onChangeText={text => {
            setStreet(text);
            if (errors.street) setErrors(prev => ({ ...prev, street: '' }));
          }}
        />
        {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
      </View>

      {/* ── 3. Area / Locality ── */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>AREA / LOCALITY *</Text>
        <TextInput
          style={[styles.input, errors.locality ? styles.inputError : null]}
          placeholder="Enter area or locality"
          placeholderTextColor="#94A3B8"
          value={locality}
          onFocus={onInputFocus}
          onChangeText={text => {
            setLocality(text);
            if (errors.locality) setErrors(prev => ({ ...prev, locality: '' }));
          }}
        />
        {errors.locality ? <Text style={styles.errorText}>{errors.locality}</Text> : null}
      </View>

      {/* ── 4. PIN Code (Input only - No explanatory helper paragraph) ── */}
      <View style={styles.inputGroup}>
        <View style={styles.pinLabelRow}>
          <Text style={styles.fieldLabel}>PIN CODE *</Text>
          {isLoadingPin && (
            <View style={styles.pinLoadingBadge}>
              <ActivityIndicator size="small" color="#168A68" />
              <Text style={styles.pinLoadingText}>Finding location...</Text>
            </View>
          )}
          {pinLookupSuccess && !isLoadingPin && (
            <View style={styles.pinSuccessBadge}>
              <CheckCircle2 size={13} color="#168A68" />
              <Text style={styles.pinSuccessText}>Location Identified</Text>
            </View>
          )}
        </View>

        <TextInput
          style={[
            styles.input,
            errors.pincode ? styles.inputError : null,
            pinLookupSuccess ? styles.inputSuccess : null,
          ]}
          placeholder="Enter 6-digit PIN code"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          maxLength={6}
          value={pincode}
          onFocus={onInputFocus}
          onChangeText={handlePincodeChange}
        />
        {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}
      </View>

      {/* ── 5. Multiple Post Offices / Area Selector (if multi areas found for PIN) ── */}
      {availablePostOffices.length > 1 && (
        <View style={styles.multiAreaContainer}>
          <Text style={styles.multiAreaTitle}>Select your area / post office</Text>
          <View style={styles.chipsWrap}>
            {availablePostOffices.map((po, index) => {
              const isSelected = selectedPostOffice === po || locality === po;
              return (
                <TouchableOpacity
                  key={`${po}_${index}`}
                  style={[styles.areaChip, isSelected && styles.areaChipSelected]}
                  onPress={() => handleSelectPostOffice(po)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Select area ${po}`}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[styles.areaChipText, isSelected && styles.areaChipTextSelected]}
                    numberOfLines={1}
                  >
                    {po}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── 6. Select City * (Dropdown when cityOptions provided, else TextInput) ── */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>
          {cityOptions && cityOptions.length > 0 ? 'SELECT CITY *' : 'CITY *'}
        </Text>

        {cityOptions && cityOptions.length > 0 ? (
          <>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                errors.city ? styles.inputError : null,
                isCityDropdownOpen && styles.dropdownButtonActive,
              ]}
              onPress={() => setIsCityDropdownOpen(prev => !prev)}
              activeOpacity={0.8}
              accessibilityRole="combobox"
              accessibilityLabel="Select City"
            >
              <Text style={[styles.dropdownButtonText, !city && styles.placeholderText]}>
                {city || 'Select City'}
              </Text>
              <ChevronDown
                size={18}
                color={isCityDropdownOpen ? '#168A68' : '#64748B'}
                style={{ transform: [{ rotate: isCityDropdownOpen ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {isCityDropdownOpen && (
              <View style={styles.dropdownList}>
                {cityOptions.map(option => {
                  const isSelected = city === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                      onPress={() => {
                        setCity(option);
                        setIsCityDropdownOpen(false);
                        if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {isSelected && <Check size={16} color="#168A68" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, errors.city ? styles.inputError : null]}
              placeholder="Enter city"
              placeholderTextColor="#94A3B8"
              value={city}
              onFocus={onInputFocus}
              onChangeText={text => {
                setCity(text);
                if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
              }}
            />
            {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
          </>
        )}
      </View>

      {/* ── 7. District & State ── */}
      <View style={styles.rowTwo}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>DISTRICT</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter district"
            placeholderTextColor="#94A3B8"
            value={district}
            onFocus={onInputFocus}
            onChangeText={setDistrict}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>STATE *</Text>
          <TextInput
            style={[styles.input, errors.state ? styles.inputError : null]}
            placeholder="Enter state"
            placeholderTextColor="#94A3B8"
            value={state}
            onFocus={onInputFocus}
            onChangeText={text => {
              setState(text);
              if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
            }}
          />
          {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
        </View>
      </View>

      {/* ── 8. Landmark (Optional) ── */}
      <View style={styles.inputGroup}>
        <Text style={styles.fieldLabel}>LANDMARK (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Near Bus Stand / Temple / Landmark"
          placeholderTextColor="#94A3B8"
          value={landmark}
          onFocus={onInputFocus}
          onChangeText={setLandmark}
        />
      </View>

      {extraFooterContent}

      {/* ── 9. Submit & Cancel Actions ── */}
      {showSubmitButton && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={submitButtonText}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.submitButtonText}>{submitButtonText}</Text>
              </>
            )}
          </TouchableOpacity>

          {showCancelButton && onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#0F172A',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputSuccess: {
    borderColor: '#168A68',
  },
  errorText: {
    fontSize: 11.5,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 4,
  },
  pinLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pinLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pinLoadingText: {
    fontSize: 11.5,
    color: '#168A68',
    fontWeight: '600',
  },
  pinSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinSuccessText: {
    fontSize: 11.5,
    color: '#168A68',
    fontWeight: '700',
  },
  multiAreaContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  multiAreaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10243A',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  areaChipSelected: {
    borderColor: '#168A68',
    backgroundColor: '#F0FDF4',
  },
  areaChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  areaChipTextSelected: {
    color: '#168A68',
    fontWeight: '700',
  },
  radioCircle: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#168A68',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#168A68',
  },
  // Dropdown Styles
  dropdownButton: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonActive: {
    borderColor: '#168A68',
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonText: {
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#168A68',
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#10243A',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#168A68',
    fontWeight: '700',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  actionContainer: {
    marginTop: 8,
    gap: 10,
  },
  submitButton: {
    height: 50,
    backgroundColor: '#168A68',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});
