import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

interface PhoneNumberInputProps {
  phoneNumber: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  error?: string | null;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  phoneNumber,
  onChangeText,
  onClear,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mobile Number</Text>
      
      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          Boolean(error) && styles.inputRowError,
        ]}
      >
        {/* Fixed India (+91) Badge */}
        <View style={styles.countryBadge} accessibilityLabel="Country code India +91">
          <Text style={styles.flagEmoji}>🇮🇳</Text>
          <Text style={styles.dialCode}>+91</Text>
        </View>

        <View style={styles.divider} />

        {/* 10-Digit Mobile Input */}
        <TextInput
          style={styles.textInput}
          value={phoneNumber}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="Enter 10-digit number"
          placeholderTextColor="#94A3B8"
          accessibilityLabel="Mobile Number. Enter 10-digit Indian phone number"
        />

        {/* Clear Button */}
        {phoneNumber.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear mobile number"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Accessible Inline Error Message */}
      {Boolean(error) && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 52,
  },
  inputRowFocused: {
    borderColor: '#123D2A',
    backgroundColor: '#FFFFFF',
  },
  inputRowError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  flagEmoji: {
    fontSize: 17,
  },
  dialCode: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  clearBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 11.5,
    color: '#DC2626',
    marginTop: 5,
    fontWeight: '600',
  },
});
