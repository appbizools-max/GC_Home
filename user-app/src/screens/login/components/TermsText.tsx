import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export const TermsText: React.FC = () => {
  const handleTermsPress = () => {
    Alert.alert(
      'Terms & Conditions',
      'By using GC HOME+, you agree to our standard terms of service, customer safety guidelines, and service quality standards.'
    );
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      'Privacy Policy',
      'GC HOME+ values your privacy. Your personal details and address are stored securely and never shared with unauthorized third parties.'
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleTermsPress}
        activeOpacity={0.7}
        accessibilityRole="link"
        accessibilityLabel="Terms and Conditions"
      >
        <Text style={styles.link}>Terms & Conditions</Text>
      </TouchableOpacity>
      <Text style={styles.dot}>•</Text>
      <TouchableOpacity
        onPress={handlePrivacyPress}
        activeOpacity={0.7}
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy"
      >
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  link: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dot: {
    fontSize: 10,
    color: '#CBD5E1',
  },
});
