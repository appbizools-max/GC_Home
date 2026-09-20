import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../../components/ui/AppLogo';
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { TrustBadgeRow } from '../../components/ui/TrustBadgeRow';
import { ASSETS } from '../../assets/index';
import {
  Lock,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Heart,
  ChevronLeft,
} from 'lucide-react-native';

export const OtpVerificationScreen: React.FC = () => {
  const {
    pendingPhoneNumber,
    verifyLoginOtp,
    resendLoginOtp,
    isAuthLoading,
    authError,
    clearAuthError,
    navigateTo,
  } = useAuth();

  const [digits, setDigits] = useState<string[]>(['7', '4', '9', '2', '1', '6']);
  const [activeIndex, setActiveIndex] = useState(5);
  const [countdown, setCountdown] = useState(24);
  const [localError, setLocalError] = useState('');

  // Input refs for 6 boxes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer
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

    // Check if user pasted complete 6-digit code
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

  const handleVerify = async () => {
    if (!isComplete) {
      setLocalError('Please enter all 6 digits of the OTP.');
      return;
    }
    await verifyLoginOtp(otpCode);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    setActiveIndex(0);
    await resendLoginOtp();
  };

  const displayPhone = pendingPhoneNumber || '+91 9849201824';

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header & Right Slogan Badge */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigateTo('login')}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color="#10243A" />
          </TouchableOpacity>
          <AppLogo size="sm" showTagline={true} align="left" />
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>Clean Spaces</Text>
            <Text style={styles.topBadgeText}>Brighter Lives</Text>
            <Heart size={9} color="#168A68" fill="#168A68" style={{ marginTop: 1 }} />
          </View>
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperWrapper}>
          <ProgressStepper currentStep={2} />
        </View>

        {/* Verification Card */}
        <View style={styles.card}>
          {/* Card Title Header */}
          <View style={styles.titleRow}>
            <View style={styles.lockIconCircle}>
              <Lock size={18} color="#168A68" strokeWidth={2.2} />
            </View>
            <Text style={styles.cardTitle}>Verify your mobile number</Text>
          </View>

          <Text style={styles.cardSubtitle}>
            Enter the 6-digit OTP code sent via SMS to{' '}
            <Text style={styles.phoneHighlight}>{displayPhone}</Text>
          </Text>

          {/* 6 Digit Input Boxes */}
          <View style={styles.otpGrid}>
            {[0, 1, 2, 3, 4, 5].map(idx => {
              const isFocused = activeIndex === idx;
              const hasVal = Boolean(digits[idx]);
              const isBoxError = Boolean(localError || authError);

              return (
                <TextInput
                  key={idx}
                  ref={el => (inputRefs.current[idx] = el)}
                  style={[
                    styles.otpBox,
                    hasVal && styles.otpBoxFilled,
                    isFocused && styles.otpBoxActive,
                    isBoxError && styles.otpBoxError,
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

          {/* Error Message */}
          {(localError || authError) ? (
            <Text style={styles.errorBanner}>{localError || authError}</Text>
          ) : null}

          {/* Info Hint Box */}
          <View style={styles.infoHintCard}>
            <MessageSquare size={16} color="#168A68" />
            <Text style={styles.infoHintText}>
              Didn't receive the code? Check your SMS or spam folder.
            </Text>
          </View>

          {/* Resend OTP Row */}
          <View style={styles.resendRow}>
            <View style={styles.timerGroup}>
              <Clock size={14} color="#68788C" />
              <Text style={styles.timerText}>
                Resend OTP in{' '}
                <Text style={styles.timerDigits}>
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleResend}
              disabled={countdown > 0}
              activeOpacity={0.7}
            >
              <Text style={[styles.resendBtnText, countdown > 0 && styles.resendBtnDisabled]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
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
              <>
                <Text style={styles.verifyBtnText}>Verify & Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>

          {/* Security Subtext */}
          <View style={styles.securityRow}>
            <ShieldCheck size={14} color="#68788C" />
            <Text style={styles.securityText}>Your information is secure and encrypted</Text>
          </View>
        </View>

        {/* 3 Trust Badges */}
        <View style={styles.trustWrapper}>
          <TrustBadgeRow variant="otp" />
        </View>

        {/* Living Room Visual Section */}
        <View style={styles.bottomHeroBanner}>
          <Image
            source={
              typeof ASSETS.heroLivingRoom === 'string'
                ? { uri: ASSETS.heroLivingRoom }
                : ASSETS.heroLivingRoom
            }
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerTag}>
            <Text style={styles.bannerTagTitle}>Good Homes</Text>
            <Text style={styles.bannerTagSub}>Happier People 💚</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    minHeight: '100%',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  topBadge: {
    backgroundColor: '#EAF8F1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  topBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0E5B47',
    lineHeight: 11,
  },
  stepperWrapper: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  lockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10243A',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#68788C',
    marginBottom: 16,
    lineHeight: 17,
  },
  phoneHighlight: {
    fontWeight: '800',
    color: '#10243A',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 14,
  },
  otpBox: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E1E8E5',
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '900',
    color: '#10243A',
  },
  otpBoxActive: {
    borderColor: '#168A68',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  otpBoxFilled: {
    backgroundColor: '#EAF8F1',
    borderColor: '#C6EEDB',
    color: '#0E5B47',
  },
  otpBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorBanner: {
    fontSize: 11.5,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5FCF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 14,
  },
  infoHintText: {
    flex: 1,
    fontSize: 11.5,
    color: '#168A68',
    fontWeight: '600',
    lineHeight: 15,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 12,
    marginBottom: 16,
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerText: {
    fontSize: 12,
    color: '#68788C',
  },
  timerDigits: {
    fontWeight: '800',
    color: '#168A68',
  },
  resendBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#168A68',
  },
  resendBtnDisabled: {
    color: '#94A3B8',
  },
  verifyBtn: {
    backgroundColor: '#168A68',
    borderRadius: 26,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
  },
  verifyBtnDisabled: {
    backgroundColor: '#A3D9C9',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: '#68788C',
    fontWeight: '500',
  },
  trustWrapper: {
    marginBottom: 12,
  },
  bottomHeroBanner: {
    width: '100%',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerTag: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    alignItems: 'center',
  },
  bannerTagTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#10243A',
  },
  bannerTagSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#168A68',
  },
});
