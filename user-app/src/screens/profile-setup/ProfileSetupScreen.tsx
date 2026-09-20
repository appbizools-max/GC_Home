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
import { ProgressStepper } from '../../components/ui/ProgressStepper';
import { BottomWaveDecoration } from '../../components/ui/BottomWaveDecoration';
import { CitySelectModal, CityItem, INDIAN_CITIES } from '../../components/ui/CitySelectModal';
import { AddressInputModal } from '../../components/ui/AddressInputModal';
import { PhotoPickerModal } from '../../components/ui/PhotoPickerModal';
import {
  User,
  Mail,
  MapPin,
  Home,
  Camera,
  ChevronDown,
  ShieldCheck,
  ArrowRight,
  Heart,
} from 'lucide-react-native';

export const ProfileSetupScreen: React.FC = () => {
  const {
    user,
    pendingPhoneNumber,
    completeProfileSetup,
    isAuthLoading,
    authError,
    clearAuthError,
  } = useAuth();

  const [fullName, setFullName] = useState(user?.name || 'Rohan Sharma');
  const [email, setEmail] = useState(user?.email || 'rohan@gmail.com');
  const [city, setCity] = useState('Bengaluru, Karnataka');
  const [address, setAddress] = useState('123, 4th Cross, HSR Layout\nBengaluru, Karnataka - 560102');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');

  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name (at least 2 characters).';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!city.trim()) {
      newErrors.city = 'Please select your city.';
    }

    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = 'Please provide your home address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCitySelect = (selectedCity: CityItem) => {
    const formatted = `${selectedCity.name}, ${selectedCity.state}`;
    setCity(formatted);
    // Auto update address city part if needed
    if (errors.city) {
      const next = { ...errors };
      delete next.city;
      setErrors(next);
    }
  };

  const handleAddressSave = (newAddress: string) => {
    setAddress(newAddress);
    if (errors.address) {
      const next = { ...errors };
      delete next.address;
      setErrors(next);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (authError) clearAuthError();

    await completeProfileSetup({
      name: fullName.trim(),
      email: email.trim() || undefined,
      city,
      address,
      profilePhoto: profilePhoto || undefined,
    });
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
        {/* Top Header & Right Slogan Badge */}
        <View style={styles.topHeaderRow}>
          <AppLogo size="sm" showTagline={true} align="left" />
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>Clean Spaces</Text>
            <Text style={styles.topBadgeText}>Brighter Lives</Text>
            <Heart size={9} color="#168A68" fill="#168A68" style={{ marginTop: 1 }} />
          </View>
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperWrapper}>
          <ProgressStepper currentStep={3} />
        </View>

        {/* Screen Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Complete Your Profile</Text>
          <Text style={styles.screenSubtitle}>Just a few details to get you started</Text>
        </View>

        {/* Profile Avatar Upload Picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarCircleWrapper}
            onPress={() => setShowPhotoModal(true)}
            activeOpacity={0.85}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={38} color="#A7F3D0" />
              </View>
            )}

            {/* Camera Floating Badge */}
            <View style={styles.cameraBadge}>
              <Camera size={14} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowPhotoModal(true)} activeOpacity={0.7}>
            <Text style={styles.avatarLabel}>Add Profile Photo</Text>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Helps us personalize your experience</Text>
        </View>

        {/* Main Form Fields Container */}
        <View style={styles.formCard}>
          {/* Field 1: Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.fieldBox, errors.fullName ? styles.fieldBoxError : null]}>
              <User size={18} color="#168A68" />
              <TextInput
                style={styles.fieldInput}
                value={fullName}
                onChangeText={text => {
                  setFullName(text);
                  if (errors.fullName) {
                    const next = { ...errors };
                    delete next.fullName;
                    setErrors(next);
                  }
                }}
                placeholder="e.g. Rohan Sharma"
                placeholderTextColor="#94A3B8"
              />
            </View>
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Field 2: Email (Optional) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email (Optional)</Text>
            <View style={[styles.fieldBox, errors.email ? styles.fieldBoxError : null]}>
              <Mail size={18} color="#168A68" />
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (errors.email) {
                    const next = { ...errors };
                    delete next.email;
                    setErrors(next);
                  }
                }}
                placeholder="e.g. rohan@gmail.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Field 3: Select City */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Select City</Text>
            <TouchableOpacity
              style={[styles.fieldBox, errors.city ? styles.fieldBoxError : null]}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.8}
            >
              <MapPin size={18} color="#168A68" />
              <Text style={styles.fieldDropdownText} numberOfLines={1}>
                {city || 'Select your city'}
              </Text>
              <ChevronDown size={18} color="#68788C" />
            </TouchableOpacity>
            {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
          </View>

          {/* Field 4: Your Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Your Address</Text>
            <TouchableOpacity
              style={[styles.fieldBox, styles.addressFieldBox, errors.address ? styles.fieldBoxError : null]}
              onPress={() => setShowAddressModal(true)}
              activeOpacity={0.8}
            >
              <Home size={18} color="#168A68" style={{ marginTop: 2 }} />
              <Text style={styles.addressDropdownText} numberOfLines={2}>
                {address || 'Tap to enter house, street & locality'}
              </Text>
              <ChevronDown size={18} color="#68788C" />
            </TouchableOpacity>
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          </View>

          {/* Security Information Card */}
          <View style={styles.securityInfoCard}>
            <View style={styles.securityIconBox}>
              <ShieldCheck size={20} color="#168A68" strokeWidth={2.2} />
            </View>
            <View style={styles.securityTextCol}>
              <Text style={styles.securityTitle}>Your information is safe with us</Text>
              <Text style={styles.securitySubtitle}>
                We use your details only to provide and improve our services.
              </Text>
            </View>
          </View>

          {/* Global Auth Error */}
          {authError ? <Text style={styles.globalErrorBanner}>{authError}</Text> : null}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.continueBtn, isAuthLoading && styles.continueBtnDisabled]}
            onPress={handleSubmit}
            disabled={isAuthLoading}
            activeOpacity={0.88}
          >
            {isAuthLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.continueBtnText}>Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Slogan Wave */}
        <BottomWaveDecoration slogan="A Cleaner Home for a Happier You" />
      </ScrollView>

      {/* Modals */}
      <CitySelectModal
        visible={showCityModal}
        selectedCity={city}
        onSelect={handleCitySelect}
        onClose={() => setShowCityModal(false)}
      />

      <AddressInputModal
        visible={showAddressModal}
        currentAddress={address}
        selectedCity={city}
        onSave={handleAddressSave}
        onClose={() => setShowAddressModal(false)}
      />

      <PhotoPickerModal
        visible={showPhotoModal}
        currentPhotoUri={profilePhoto}
        onSelectPhoto={setProfilePhoto}
        onRemovePhoto={() => setProfilePhoto('')}
        onClose={() => setShowPhotoModal(false)}
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
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  titleSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10243A',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12.5,
    color: '#68788C',
    marginTop: 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircleWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#C6EEDB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#F5FCF8',
    marginBottom: 6,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#168A68',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#168A68',
  },
  avatarHint: {
    fontSize: 11,
    color: '#68788C',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#68788C',
    marginBottom: 6,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  addressFieldBox: {
    alignItems: 'flex-start',
    paddingVertical: 9,
  },
  fieldBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  fieldInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#10243A',
  },
  fieldDropdownText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#10243A',
  },
  addressDropdownText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#10243A',
    lineHeight: 18,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '600',
  },
  securityInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EAF8F1',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C6EEDB',
    marginTop: 4,
    marginBottom: 14,
  },
  securityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityTextCol: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0E5B47',
  },
  securitySubtitle: {
    fontSize: 11,
    color: '#168A68',
    marginTop: 2,
    lineHeight: 14,
  },
  globalErrorBanner: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  continueBtn: {
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
  },
  continueBtnDisabled: {
    backgroundColor: '#A3D9C9',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
