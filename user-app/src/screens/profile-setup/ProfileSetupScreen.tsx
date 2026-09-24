import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { User, Mail, ChevronLeft, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { PhoneNumberInput } from '../login/components/PhoneNumberInput';
import { PrimaryButton } from '../login/components/PrimaryButton';
import { TermsText } from '../login/components/TermsText';

export const ProfileSetupScreen: React.FC = () => {
  const {
    registrationDraft,
    setRegistrationDraft,
    startRegistration,
    isAuthLoading,
    authError,
    clearAuthError,
    navigateTo,
  } = useAuth();

  // Pre-fill from registration draft if returning back from OTP screen
  const initialPhone = registrationDraft?.phone ? registrationDraft.phone.replace(/\D/g, '').slice(-10) : '';
  const [fullName, setFullName] = useState(registrationDraft?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [email, setEmail] = useState(registrationDraft?.email || '');

  // Validation & error states
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [alreadyRegisteredError, setAlreadyRegisteredError] = useState('');

  // Focused state for inputs
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Sync draft as user types so it persists across back navigation
  useEffect(() => {
    setRegistrationDraft({
      name: fullName,
      phone: phoneNumber ? `+91 ${phoneNumber}` : '',
      email,
    });
  }, [fullName, phoneNumber, email]);

  const handleNameChange = (text: string) => {
    setFullName(text);
    if (nameError) setNameError('');
    if (authError) clearAuthError();
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (phoneError) setPhoneError('');
    if (alreadyRegisteredError) setAlreadyRegisteredError('');
    if (authError) clearAuthError();

    if (cleaned.length === 10) {
      if (!/^[6-9]/.test(cleaned)) {
        setPhoneError('Please enter a valid 10-digit mobile number starting with 6-9.');
      } else {
        setPhoneError('');
      }
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (authError) clearAuthError();
  };

  const handleClearPhone = () => {
    setPhoneNumber('');
    setPhoneError('');
    setAlreadyRegisteredError('');
    if (authError) clearAuthError();
  };

  const validate = () => {
    let isValid = true;
    setNameError('');
    setPhoneError('');
    setEmailError('');
    setAlreadyRegisteredError('');

    // Full Name: required, at least 2 characters
    if (!fullName.trim()) {
      setNameError('Please enter your full name');
      isValid = false;
    } else if (fullName.trim().length < 2) {
      setNameError('Full name must be at least 2 characters');
      isValid = false;
    }

    // Mobile Number: required, 10 digits starting with 6-9
    const rawDigits = phoneNumber.replace(/\D/g, '');
    if (!rawDigits) {
      setPhoneError('Please enter a valid mobile number');
      isValid = false;
    } else if (rawDigits.length !== 10 || !/^[6-9]\d{9}$/.test(rawDigits)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      isValid = false;
    }

    // Email: optional, format checked if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    return isValid;
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    if (!validate() || isAuthLoading) return;

    const fullPhone = `+91 ${phoneNumber.replace(/\D/g, '')}`;

    // startRegistration verifies availability in Supabase, saves draft, and sends OTP
    const res = await startRegistration({
      name: fullName.trim(),
      phone: fullPhone,
      email: email.trim() || undefined,
    });

    if (!res.success) {
      if (res.message && res.message.includes('already registered')) {
        setAlreadyRegisteredError('This mobile number is already registered. Please sign in to continue.');
      }
    }
  };

  const handleBackToLogin = () => {
    if (authError) clearAuthError();
    navigateTo('login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} touchSoundDisabled>
      <View style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <KeyboardAvoidingView
          style={styles.flexWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={styles.topHeaderRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBackToLogin}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back to Login"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={22} color="#10243A" />
              </TouchableOpacity>
              <AppLogo size="sm" showTagline={false} align="center" />
              <View style={styles.backBtnPlaceholder} />
            </View>

            {/* Screen Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>Complete Your Profile</Text>
              <Text style={styles.screenSubtitle}>Enter your details to create an account</Text>
            </View>

            {/* Form Area */}
            <View style={styles.formContainer}>
              {/* Already Registered Error Banner with Back to Login option */}
              {Boolean(alreadyRegisteredError) && (
                <View style={styles.alreadyRegisteredCard}>
                  <View style={styles.alreadyRegisteredRow}>
                    <AlertCircle size={18} color="#DC2626" style={{ marginTop: 2 }} />
                    <View style={styles.alreadyRegisteredTextCol}>
                      <Text style={styles.alreadyRegisteredTitle}>
                        {alreadyRegisteredError}
                      </Text>
                      <TouchableOpacity
                        style={styles.backToLoginActionBtn}
                        onPress={handleBackToLogin}
                        activeOpacity={0.75}
                      >
                        <ArrowLeft size={14} color="#123D2A" />
                        <Text style={styles.backToLoginActionText}>Back to Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* 1. Full Name Input (Required) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Name <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputFieldWrapper,
                    isNameFocused && styles.inputFieldFocused,
                    Boolean(nameError) && styles.inputFieldError,
                  ]}
                >
                  <User size={18} color={isNameFocused ? '#0D8846' : '#64748B'} />
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={handleNameChange}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    accessibilityLabel="Full Name input"
                  />
                </View>
                {Boolean(nameError) && (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {nameError}
                  </Text>
                )}
              </View>

              {/* 2. Mobile Number Input with +91 fixed badge (Required) */}
              <PhoneNumberInput
                phoneNumber={phoneNumber}
                onChangeText={handlePhoneChange}
                onClear={handleClearPhone}
                error={phoneError}
              />

              {/* 3. Email Input (Optional) */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <Text style={styles.optionalBadge}>Optional</Text>
                </View>
                <View
                  style={[
                    styles.inputFieldWrapper,
                    isEmailFocused && styles.inputFieldFocused,
                    Boolean(emailError) && styles.inputFieldError,
                  ]}
                >
                  <Mail size={18} color={isEmailFocused ? '#0D8846' : '#64748B'} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Email input (optional)"
                  />
                </View>
                {Boolean(emailError) && (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {emailError}
                  </Text>
                )}
              </View>

              {/* Primary Continue CTA Button */}
              <View style={styles.buttonWrapper}>
                <PrimaryButton
                  title={isAuthLoading ? 'Checking & Sending OTP...' : 'Continue'}
                  onPress={handleContinue}
                  disabled={isAuthLoading}
                  loading={isAuthLoading}
                  accessibilityLabel="Continue to verify mobile number"
                />
              </View>
            </View>

            {/* Terms and Privacy Footer */}
            <TermsText />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  flexWrapper: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  titleSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10243A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#DC2626',
  },
  optionalBadge: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputFieldFocused: {
    borderColor: '#123D2A',
    backgroundColor: '#FFFFFF',
  },
  inputFieldError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#171A18',
    fontWeight: '600',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 11.5,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 2,
    fontWeight: '500',
  },
  alreadyRegisteredCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 18,
  },
  alreadyRegisteredRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alreadyRegisteredTextCol: {
    flex: 1,
  },
  alreadyRegisteredTitle: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    lineHeight: 18,
  },
  backToLoginActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6E3CB',
  },
  backToLoginActionText: {
    fontSize: 12.5,
    color: '#123D2A',
    fontWeight: '700',
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
