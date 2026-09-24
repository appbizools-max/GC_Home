import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { HelpCircle, Briefcase } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { NeedHelpModal } from '../../components/ui/NeedHelpModal';

import { PhoneNumberInput } from './components/PhoneNumberInput';
import { PrimaryButton } from './components/PrimaryButton';
import { TermsText } from './components/TermsText';

// ── Animated slot helper ───────────────────────────────────────────────────────
// Each element has its own opacity + translateY pair, staggered by delay.
function useSlotAnim(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

export const LoginScreen: React.FC = () => {
  const {
    sendLoginOtp,
    isAuthLoading,
    authError,
    clearAuthError,
    navigateTo,
    setRegistrationDraft,
  } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');

  // ── Staggered entrance animations ──────────────────────────────────────────
  const logoAnim     = useSlotAnim(0);
  const titleAnim    = useSlotAnim(80);
  const inputAnim    = useSlotAnim(160);
  const buttonAnim   = useSlotAnim(240);
  const secondaryAnim = useSlotAnim(320);

  // Validate 10-digit Indian Mobile Number starting with 6-9
  const rawDigits = phoneNumber.replace(/\D/g, '');
  const isIndianValidPattern = /^[6-9]\d{9}$/.test(rawDigits);
  const isValidPhone = rawDigits.length === 10 && isIndianValidPattern;

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (apiError) setApiError('');
    if (authError) clearAuthError();

    if (cleaned.length === 10) {
      if (!/^[6-9]/.test(cleaned)) {
        setValidationError('Please enter a valid 10-digit mobile number starting with 6-9.');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  };

  const handleClear = () => {
    setPhoneNumber('');
    setValidationError('');
    setApiError('');
    if (authError) clearAuthError();
  };

  const handleCreateAccountPress = () => {
    setApiError('');
    setValidationError('');
    if (authError) clearAuthError();

    // If user already typed valid or partial digits, pass it as initial draft for convenience
    if (rawDigits.length > 0) {
      setRegistrationDraft({
        name: '',
        phone: `+91 ${rawDigits}`,
      });
    }

    // Navigate to Complete Your Profile screen WITHOUT sending OTP
    navigateTo('complete_profile');
  };

  const handleBecomePartnerPress = () => {
    setApiError('');
    setValidationError('');
    if (authError) clearAuthError();
    navigateTo('become_maid_info');
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    if (!isValidPhone || isAuthLoading) {
      if (!isValidPhone) {
        setValidationError('Please enter a valid mobile number.');
      }
      return;
    }

    setApiError('');
    if (authError) clearAuthError();

    const fullPhone = `+91 ${rawDigits}`;

    try {
      const success = await sendLoginOtp(fullPhone);
      if (!success) {
        setApiError('Unable to send verification code. Please try again.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Unable to send verification code. Please try again.');
    }
  };

  const displayError = validationError || apiError || authError;

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
            {/* Top Spacing */}
            <View style={styles.topSpacer} />

            {/* 1. GC HOME+ Brand Logo — animated entrance */}
            <Animated.View style={[styles.logoSection, logoAnim]}>
              <AppLogo size="md" showTagline={false} align="center" />
            </Animated.View>

            {/* 2. Login Title & Subtitle — animated entrance */}
            <Animated.View style={[styles.titleSection, titleAnim]}>
              <Text style={styles.titleText}>Welcome back</Text>
              <Text style={styles.subtitleText}>Sign in to continue</Text>
            </Animated.View>

            {/* 3. Form Area */}
            <View style={styles.formContainer}>
              {/* Mobile Number Input — animated entrance */}
              <Animated.View style={inputAnim}>
                <PhoneNumberInput
                  phoneNumber={phoneNumber}
                  onChangeText={handlePhoneChange}
                  onClear={handleClear}
                  error={displayError}
                />
              </Animated.View>

              {/* Primary CTA Button — animated entrance */}
              <Animated.View style={buttonAnim}>
                <PrimaryButton
                  title={isAuthLoading ? 'Sending code...' : 'Continue'}
                  onPress={handleContinue}
                  disabled={!isValidPhone || isAuthLoading}
                  loading={isAuthLoading}
                  accessibilityLabel="Continue to verify mobile number"
                />
              </Animated.View>

              {/* Secondary actions — staggered appearance */}
              <Animated.View style={secondaryAnim}>
                {/* 4. Navigate to Complete Your Profile (NO OTP SENT) */}
                <View style={styles.switchRow}>
                  <Text style={styles.switchNormalText}>New to GC HOME+?</Text>
                  <TouchableOpacity
                    onPress={handleCreateAccountPress}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Create an account"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.switchActionText}>Create an account</Text>
                  </TouchableOpacity>
                </View>

                {/* 5. Minimal Or Divider */}
                <View style={styles.orDividerContainer}>
                  <View style={styles.orDividerLine} />
                  <Text style={styles.orDividerText}>or</Text>
                  <View style={styles.orDividerLine} />
                </View>

                {/* 6. Become a Partner Secondary Action */}
                <View style={styles.partnerSwitchRow}>
                  <Text style={styles.partnerPromptText}>Want to become a partner?</Text>
                  <TouchableOpacity
                    onPress={handleBecomePartnerPress}
                    activeOpacity={0.75}
                    style={styles.becomePartnerBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Become a Partner"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Briefcase size={13} color="#0D8846" strokeWidth={2.2} />
                    <Text style={styles.becomePartnerActionText}>Become a Partner</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacer} />

            {/* 5. Need Help? Link */}
            <Animated.View style={secondaryAnim}>
              <TouchableOpacity
                style={styles.needHelpBtn}
                onPress={() => setShowHelpModal(true)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Need Help?"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <HelpCircle size={15} color="#0D8846" strokeWidth={2.2} />
                <Text style={styles.needHelpText}>Need Help?</Text>
              </TouchableOpacity>

              {/* 6. Terms & Privacy Policy Links */}
              <TermsText />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Need Help Modal */}
        <NeedHelpModal
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
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
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  topSpacer: {
    height: Platform.OS === 'ios' ? 24 : 16,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#171A18',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 14.5,
    color: '#526058',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  switchNormalText: {
    fontSize: 13.5,
    color: '#526058',
    fontWeight: '500',
  },
  switchActionText: {
    fontSize: 13.5,
    color: '#123D2A',
    fontWeight: '700',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 14,
    gap: 10,
  },
  orDividerLine: {
    width: 60,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orDividerText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  partnerSwitchRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  partnerPromptText: {
    fontSize: 13,
    color: '#526058',
    fontWeight: '500',
  },
  becomePartnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#EAF5EC',
    borderWidth: 1,
    borderColor: '#C6E3CB',
  },
  becomePartnerActionText: {
    fontSize: 13,
    color: '#123D2A',
    fontWeight: '700',
  },
  bottomSpacer: {
    flex: 1,
    minHeight: 24,
  },
  needHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  needHelpText: {
    fontSize: 13,
    color: '#123D2A',
    fontWeight: '600',
  },
});
