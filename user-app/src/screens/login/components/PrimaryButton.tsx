import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
}) => {
  const isInteractive = !disabled && !loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isInteractive && styles.buttonActive,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          <Text style={[styles.buttonText, isInteractive && styles.buttonTextActive]}>
            {title}
          </Text>
          <ArrowRight
            size={18}
            color={isInteractive ? '#FFFFFF' : '#94A3B8'}
            strokeWidth={2.4}
          />
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  buttonActive: {
    backgroundColor: '#123D2A',
    borderColor: '#123D2A',
    shadowColor: '#123D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94A3B8',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});
