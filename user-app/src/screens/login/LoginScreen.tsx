import React, { useState } from 'react';
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
import { TrustBadgeRow } from '../../components/ui/TrustBadgeRow';
import { BottomWaveDecoration } from '../../components/ui/BottomWaveDecoration';
import { CountryPickerModal, CountryItem, COUNTRIES } from '../../components/ui/CountryPickerModal';
import { NeedHelpModal } from '../../components/ui/NeedHelpModal';
import { ASSETS } from '../../assets/index';
import {
  Smartphone,
  Lock,
  ArrowRight,
  Headphones,
  X,
  Clock,
  Calendar,
  Home,
  ChevronDown,
} from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { sendLoginOtp, isAuthLoading, authError, clearAuthError } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('9849201824');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [localError, setLocalError] = useState('');

  // Validate phone number: 10 digits
  const rawDigits = phoneNumber.replace(/\D/g, '');
  const isValidPhone = rawDigits.length === 10;

  const handlePhoneChange = (text: string) => {
    // Only numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (localError) setLocalError('');
    if (authError) clearAuthError();
  };

  const handleClear = () => {
    setPhoneNumber('');
    setLocalError('');
    if (authError) clearAuthError();
  };

  const handleContinue = async () => {
    if (!isValidPhone) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullPhone = `${selectedCountry.dialCode} ${rawDigits}`;
    await sendLoginOtp(fullPhone);
  };

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
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <AppLogo size="sm" showTagline={true} align="left" />
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowHelpModal(true)}
            activeOpacity={0.7}
          >
            <Headphones size={15} color="#168A68" />
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Welcome & Visual Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroTextCol}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.brandAccentTitle}>GC Home Plus</Text>
            <Text style={styles.welcomeSubtitle}>
              Book trusted cleaning services easily and enjoy a cleaner, healthier home.
            </Text>
          </View>

          {/* Hero Circular Visual */}
          <View style={styles.heroVisualWrapper}>
            <Image
              source={typeof ASSETS.heroLivingRoom === 'string' ? { uri: ASSETS.heroLivingRoom } : ASSETS.heroLivingRoom}
              style={styles.heroImage}
            />
            <View style={styles.heroFloatingTag}>
              <Text style={styles.heroFloatingTagText}>Clean Homes</Text>
              <Text style={styles.heroFloatingTagSub}>Happier Lives 💚</Text>
            </View>
          </View>
        </View>

        {/* 3 Trust Feature Indicators */}
        <View style={styles.trustRowWrapper}>
          <TrustBadgeRow variant="login" />
        </View>

        {/* Authentication Card */}
        <View style={styles.authCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.mobileIconCircle}>
              <Smartphone size={18} color="#168A68" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Login / Register</Text>
              <Text style={styles.cardSubtitle}>Enter your mobile number to continue</Text>
            </View>
          </View>

          {/* Phone Input Box */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View
              style={[
                styles.phoneInputRow,
                (localError || authError) ? styles.phoneInputRowError : null,
              ]}
            >
              {/* Country Selector */}
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                <ChevronDown size={14} color="#68788C" />
              </TouchableOpacity>

              <View style={styles.verticalDivider} />

              {/* Number Input */}
              <TextInput
                style={styles.textInput}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#94A3B8"
              />

              {/* Clear (X) Button */}
              {phoneNumber.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
                  <X size={15} color="#68788C" />
                </TouchableOpacity>
              )}
            </View>

            {/* Error Message */}
            {(localError || authError) ? (
              <Text style={styles.errorText}>{localError || authError}</Text>
            ) : null}
          </View>

          {/* Helper Message */}
          <View style={styles.helperCard}>
            <Lock size={15} color="#168A68" />
            <Text style={styles.helperText}>We'll send a 6-digit OTP to this number</Text>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!isValidPhone || isAuthLoading) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isValidPhone || isAuthLoading}
            activeOpacity={0.88}
          >
            {isAuthLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>

          {/* Terms & Privacy */}
          <Text style={styles.termsText}>
            By continuing, you agree to GC Home Plus{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>

        {/* Benefits Strip at Bottom */}
        <View style={styles.benefitsStrip}>
          <View style={styles.benefitItem}>
            <Clock size={16} color="#168A68" />
            <Text style={styles.benefitText}>Quick Booking</Text>
          </View>
          <View style={styles.benefitDivider} />
          <View style={styles.benefitItem}>
            <Calendar size={16} color="#168A68" />
            <Text style={styles.benefitText}>Flexible Scheduling</Text>
          </View>
          <View style={styles.benefitDivider} />
          <View style={styles.benefitItem}>
            <Home size={16} color="#168A68" />
            <Text style={styles.benefitText}>Professional Cleaning</Text>
          </View>
        </View>

        {/* Bottom Organic Wave */}
        <BottomWaveDecoration slogan="Clean Spaces. Brighter Lives." />
      </ScrollView>

      {/* Modals */}
      <CountryPickerModal
        visible={showCountryPicker}
        selectedCountry={selectedCountry}
        onSelect={setSelectedCountry}
        onClose={() => setShowCountryPicker(false)}
      />

      <NeedHelpModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
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
    paddingBottom: 24,
    minHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5FCF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10243A',
    lineHeight: 26,
  },
  brandAccentTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#168A68',
    lineHeight: 26,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#68788C',
    lineHeight: 16,
  },
  heroVisualWrapper: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#EAF8F1',
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  heroFloatingTag: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    alignItems: 'center',
  },
  heroFloatingTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10243A',
  },
  heroFloatingTagSub: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#168A68',
  },
  trustRowWrapper: {
    marginBottom: 14,
    backgroundColor: '#F5FCF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingVertical: 6,
  },
  authCard: {
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
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  mobileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 12,
    color: '#68788C',
    marginTop: 1,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#68788C',
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phoneInputRowError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  flagEmoji: {
    fontSize: 16,
  },
  dialCode: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#10243A',
  },
  verticalDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#D1DDD6',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#10243A',
    letterSpacing: 0.5,
  },
  clearBtn: {
    padding: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '600',
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF8F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C6EEDB',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E5B47',
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: '#A3D9C9',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: 11,
    color: '#68788C',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  termsLink: {
    color: '#168A68',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  benefitsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10243A',
  },
  benefitDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E1E8E5',
  },
});
