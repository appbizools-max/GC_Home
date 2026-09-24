import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export const OtpVerificationScreen: React.FC = () => {
  const {
    pendingPhoneNumber,
    registrationDraft,
    navigationPayload,
    verifyLoginOtp,
    verifyRegistrationOtp,
    resendLoginOtp,
    isAuthLoading,
    authError,
    clearAuthError,
    navigateTo,
  } = useAuth();

  const isRegistration = Boolean(navigationPayload?.isRegistration || registrationDraft);
  const rawPhone = pendingPhoneNumber || registrationDraft?.phone || '+91 9849201824';

  const formatMaskedPhone = (phone: string) => {
    const raw = phone.replace(/\D/g, '');
    if (raw.length >= 10) {
      const last10 = raw.slice(-10);
      return `+91 ${last10.slice(0, 5)} *****`;
    }
    return phone;
  };

  const maskedPhone = formatMaskedPhone(rawPhone);

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [localError, setLocalError] = useState('');

  // Input refs for 6 boxes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleDigitInput = (text: string, index: number) => {
    if (localError) setLocalError('');
    if (authError) clearAuthError();

    // Support full 6-digit paste
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      setActiveIndex(5);
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    // Auto advance to next box
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
    }
  };

  const otpCode = digits.join('');
  const isComplete = otpCode.length === 6 && digits.every(d => d !== '');

  const handleBack = () => {
    if (authError) clearAuthError();
    if (isRegistration) {
      navigateTo('complete_profile');
    } else {
      navigateTo('login');
    }
  };

  const handleVerify = async () => {
    if (!isComplete) {
      setLocalError('Please enter all 6 digits of the OTP.');
      return;
    }

    setLocalError('');
    const res = isRegistration
      ? await verifyRegistrationOtp(otpCode)
      : await verifyLoginOtp(otpCode);

    if (!res.success) {
      setLocalError(res.message || 'Invalid OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setLocalError('');
    if (authError) clearAuthError();
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    setActiveIndex(0);
    await resendLoginOtp();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header with Back Arrow */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color="#10243A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            {/* Title */}
            <Text style={styles.title}>Verify OTP</Text>

            {/* Masked Mobile Subtitle */}
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.maskedPhone}>{maskedPhone}</Text>
            </Text>

            {/* 6 OTP Input Boxes */}
            <View style={styles.otpGrid}>
              {[0, 1, 2, 3, 4, 5].map(idx => {
                const isFocused = activeIndex === idx;
                const hasValue = Boolean(digits[idx]);
                const isError = Boolean(localError || authError);

                return (
                  <TextInput
                    key={idx}
                    ref={el => (inputRefs.current[idx] = el)}
                    style={[
                      styles.otpBox,
                      hasValue && styles.otpBoxFilled,
                      isFocused && styles.otpBoxActive,
                      isError && styles.otpBoxError,
                    ]}
                    value={digits[idx]}
                    onChangeText={txt => handleDigitInput(txt, idx)}
                    onKeyPress={e => handleKeyPress(e, idx)}
                    onFocus={() => setActiveIndex(idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                );
              })}
            </View>

            {/* Inline Error Message */}
            {(authError || localError) ? (
              <Text style={styles.errorText}>{authError || localError}</Text>
            ) : null}

            {/* Resend OTP with Countdown */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.resendTimerText}>
                  Resend OTP in{' '}
                  <Text style={styles.countdownDigits}>
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  activeOpacity={0.7}
                  style={styles.resendBtn}
                >
                  <Text style={styles.resendActiveText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* One Large Green Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyBtn,
                (!isComplete || isAuthLoading) && styles.verifyBtnDisabled,
              ]}
              onPress={handleVerify}
              disabled={!isComplete || isAuthLoading}
              activeOpacity={0.88}
            >
              {isAuthLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#171A18',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#526058',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  maskedPhone: {
    fontWeight: '700',
    color: '#171A18',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  otpBox: {
    flex: 1,
    maxWidth: 52,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#171A18',
  },
  otpBoxActive: {
    borderColor: '#123D2A',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#123D2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: '#123D2A',
    backgroundColor: '#EAF5EC',
    color: '#171A18',
  },
  otpBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 36,
  },
  resendTimerText: {
    fontSize: 14,
    color: '#526058',
    fontWeight: '500',
  },
  countdownDigits: {
    fontWeight: '700',
    color: '#123D2A',
  },
  resendBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendActiveText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#123D2A',
  },
  verifyBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#123D2A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyBtnDisabled: {
    backgroundColor: '#8FBFA5',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
