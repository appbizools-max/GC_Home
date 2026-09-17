import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  FileText,
  MapPin,
  Check,
  Building,
  Upload,
  User,
  CreditCard,
  Calendar,
  ChevronRight,
  Edit3,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react-native';

export const MaidRegistrationFormScreen: React.FC = () => {
  const { navigateTo, user, submitMaidApplication } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Personal Details State
  const [fullName, setFullName] = useState(user?.name || 'Sunita Devi');
  const [phone, setPhone] = useState(user?.phone || '+91 98492 01824');
  const [email, setEmail] = useState(user?.email || 'sunita.d@gchomeplus.com');
  const [dob, setDob] = useState('14/08/1988');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [address, setAddress] = useState('Plot 44, Near Metro Station, Kondapur, Hyderabad');
  const [emergencyContact, setEmergencyContact] = useState('Ramesh Kumar (+91 98765 43210)');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  );
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(true);

  // Step 2: Hub & Location Details State
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [selectedHub, setSelectedHub] = useState('Kondapur Zone, Hyderabad');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(5);
  const [preferredShift, setPreferredShift] = useState('Morning (7 AM - 12 PM)');

  // Step 3: KYC Details State
  const [aadhaarNumber, setAadhaarNumber] = useState('9842 1048 2910');
  const [kycMethod, setKycMethod] = useState<'digilocker' | 'manual'>('digilocker');
  const [isDigiLockerVerified, setIsDigiLockerVerified] = useState(true);
  const [isVerifyingDigiLocker, setIsVerifyingDigiLocker] = useState(false);
  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(true);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(true);
  const [policeCertUploaded, setPoliceCertUploaded] = useState(true);

  // Step 4: Bank Details State
  const [bankAccountHolder, setBankAccountHolder] = useState('Sunita Devi');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50100234891204');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('50100234891204');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>('Savings');

  // Step 5: Safety & Declarations State
  const [healthDecl, setHealthDecl] = useState(true);
  const [uniformKitDecl, setUniformKitDecl] = useState(true);
  const [bgCheckConsent, setBgCheckConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification & Next Logic
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!fullName.trim() || !phone.trim() || !dob.trim() || !address.trim()) {
        Alert.alert('Missing Details', 'Please fill in all required personal details before continuing.');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedCity || !selectedHub) {
        Alert.alert('Missing Details', 'Please select your operating city and hub zone.');
        return;
      }
    } else if (currentStep === 3) {
      if (!aadhaarNumber.replace(/\s/g, '') || aadhaarNumber.replace(/\s/g, '').length < 12) {
        Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number.');
        return;
      }
      if (kycMethod === 'manual' && (!aadhaarFrontUploaded || !aadhaarBackUploaded)) {
        Alert.alert('Missing Documents', 'Please upload both front and back photos of your Aadhaar card.');
        return;
      }
    } else if (currentStep === 4) {
      if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert('Missing Bank Info', 'Please enter complete bank account and IFSC details.');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        Alert.alert('Mismatch', 'Bank account numbers do not match.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleDigiLockerVerify = () => {
    setIsVerifyingDigiLocker(true);
    setTimeout(() => {
      setIsVerifyingDigiLocker(false);
      setIsDigiLockerVerified(true);
      Alert.alert(
        'DigiLocker Verified',
        'Identity & Aadhaar details verified successfully via UIDAI DigiLocker Vault.'
      );
    }, 1500);
  };

  const handleFinalSubmission = async () => {
    if (!healthDecl || !uniformKitDecl || !bgCheckConsent) {
      Alert.alert(
        'Declarations Required',
        'Please accept all health, safety, and background verification declarations to proceed.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const fullApplicationPayload = {
        fullName,
        phone,
        email,
        dob,
        gender,
        address,
        serviceArea: selectedHub,
        serviceRadiusKm,
        emergencyContact,
        healthSafetyDecl: healthDecl,
        bankDetails: {
          accountNumber,
          ifscCode,
          bankName,
          accountName: bankAccountHolder,
        },
        status: 'pending' as const,
      };

      // 1. Update local state via AuthContext
      submitMaidApplication(fullApplicationPayload);

      // 2. Persist in Supabase PostgreSQL `maids` table
      if (user?.uid) {
        await supabase.from('maids').upsert({
          id: user.uid,
          full_name: fullName,
          phone: phone,
          email: email,
          city: selectedCity,
          hub_zone: selectedHub,
          aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
          kyc_method: kycMethod,
          is_digilocker_verified: isDigiLockerVerified,
          bank_account: accountNumber,
          bank_ifsc: ifscCode,
          bank_name: bankName,
          status: 'pending',
          rating: 5.0,
          jobs_completed: 0,
          earnings: 0,
          created_at: new Date().toISOString(),
        });
      }

      Alert.alert(
        'Registration Submitted!',
        'Your Maid Partner application has been received and sent to the Admin Panel for background KYC approval.',
        [{ text: 'Check Application Status', onPress: () => navigateTo('become_maid_info') }]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to persist application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigateTo('become_maid_info')} style={styles.backBtn}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maid Partner Registration</Text>
      </View>

      {/* Stepper Header Card */}
      <View style={styles.progressCard}>
        <View style={styles.stepBadgeRow}>
          <View style={styles.applicationBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.applicationBadgeText}>Application #GC-9042</Text>
          </View>
          <Text style={styles.stepText}>Step {currentStep} of 5</Text>
        </View>

        <Text style={styles.stepTitle}>
          {currentStep === 1 && 'Personal Details'}
          {currentStep === 2 && 'Hub & Location Details'}
          {currentStep === 3 && 'Government KYC Verification'}
          {currentStep === 4 && 'Bank & Payout Setup'}
          {currentStep === 5 && 'Safety & Application Review'}
        </Text>
        <Text style={styles.stepSubtitle}>
          {currentStep === 1 && 'Provide basic identity details for partner verification and communication.'}
          {currentStep === 2 && 'Choose your preferred operating city, hub zone, and service radius.'}
          {currentStep === 3 && 'Instant UIDAI DigiLocker verification or manual document upload.'}
          {currentStep === 4 && 'Enter direct bank account details for weekly earnings payouts.'}
          {currentStep === 5 && 'Review all entered information and sign safety declarations.'}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${(currentStep / 5) * 100}%` }]} />
        </View>

        {/* Step Indicators */}
        <View style={styles.stepLabelsRow}>
          {['1. Personal', '2. Hub', '3. KYC', '4. Bank', '5. Safety'].map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => {
                  if (stepNum < currentStep) setCurrentStep(stepNum);
                }}
                disabled={stepNum > currentStep}
              >
                <Text
                  style={[
                    styles.stepLabelText,
                    isCurrent && styles.stepActive,
                    isDone && styles.stepDone,
                  ]}
                >
                  {isDone ? `✓ Step ${stepNum}` : label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* STEP 1: PERSONAL DETAILS */}
      {currentStep === 1 && (
        <View style={styles.stepFormCard}>
          <View style={styles.sectionHeader}>
            <User size={18} color="#2D8A68" />
            <Text style={styles.sectionTitle}>Basic Personal Profile</Text>
          </View>

          {/* Photo Upload Row */}
          <View style={styles.photoUploadRow}>
            <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
            <View style={styles.photoActions}>
              <Text style={styles.photoTitle}>Profile Photo</Text>
              <Text style={styles.photoSub}>Clear face photo for customer verification</Text>
              <TouchableOpacity
                style={styles.uploadPhotoBtn}
                onPress={() => {
                  setPhotoUrl(
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
                  );
                  setIsPhotoUploaded(true);
                  Alert.alert('Photo Selected', 'Profile photograph updated successfully.');
                }}
              >
                <Upload size={14} color="#1E4E3D" />
                <Text style={styles.uploadPhotoBtnText}>
                  {isPhotoUploaded ? 'Change Photo' : 'Upload Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Legal Name *</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Sunita Devi"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 Mobile Number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="sunita@example.com"
            />
          </View>

          <View style={styles.twoColRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TextInput
                style={styles.textInput}
                value={dob}
                onChangeText={setDob}
                placeholder="DD/MM/YYYY"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Gender *</Text>
              <View style={styles.genderOptions}>
                {(['Female', 'Male', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Residential Address *</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholder="House/Plot No, Street, Landmark, Pincode"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Emergency Contact Name & Phone</Text>
            <TextInput
              style={styles.textInput}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="e.g. Ramesh Kumar (+91 98765 43210)"
            />
          </View>
        </View>
      )}

      {/* STEP 2: HUB & LOCATION DETAILS */}
      {currentStep === 2 && (
        <View style={styles.stepFormCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#2D8A68" />
            <Text style={styles.sectionTitle}>Operating Zone & Shifts</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Operating City *</Text>
            <View style={styles.optionGrid}>
              {['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi-NCR'].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.optionCard, selectedCity === city && styles.optionCardActive]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Building size={16} color={selectedCity === city ? '#2D8A68' : '#64748B'} />
                  <Text
                    style={[
                      styles.optionCardText,
                      selectedCity === city && styles.optionCardTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Hub Zone *</Text>
            <View style={styles.optionList}>
              {[
                'Kondapur Zone, Hyderabad',
                'Hitec City Zone, Hyderabad',
                'Gachibowli Zone, Hyderabad',
                'Jubilee Hills Zone, Hyderabad',
                'Madhapur Zone, Hyderabad',
              ].map((hub) => (
                <TouchableOpacity
                  key={hub}
                  style={[styles.listOptionRow, selectedHub === hub && styles.listOptionRowActive]}
                  onPress={() => setSelectedHub(hub)}
                >
                  <MapPin size={16} color={selectedHub === hub ? '#2D8A68' : '#64748B'} />
                  <Text
                    style={[
                      styles.listOptionText,
                      selectedHub === hub && styles.listOptionTextActive,
                    ]}
                  >
                    {hub}
                  </Text>
                  {selectedHub === hub && <Check size={16} color="#2D8A68" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Maximum Service Radius (km)</Text>
            <View style={styles.radiusRow}>
              {[3, 5, 10, 15].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusChip, serviceRadiusKm === km && styles.radiusChipActive]}
                  onPress={() => setServiceRadiusKm(km)}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      serviceRadiusKm === km && styles.radiusChipTextActive,
                    ]}
                  >
                    Within {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Preferred Shift Availability</Text>
            <View style={styles.optionGrid}>
              {[
                'Morning (7 AM - 12 PM)',
                'Afternoon (12 PM - 4 PM)',
                'Evening (4 PM - 8 PM)',
                'Full Day (8 AM - 6 PM)',
              ].map((shift) => (
                <TouchableOpacity
                  key={shift}
                  style={[styles.optionCard, preferredShift === shift && styles.optionCardActive]}
                  onPress={() => setPreferredShift(shift)}
                >
                  <Calendar size={16} color={preferredShift === shift ? '#2D8A68' : '#64748B'} />
                  <Text
                    style={[
                      styles.optionCardText,
                      preferredShift === shift && styles.optionCardTextActive,
                    ]}
                  >
                    {shift}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* STEP 3: KYC & DIGILOCKER */}
      {currentStep === 3 && (
        <View style={styles.stepFormCard}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color="#2D8A68" />
            <Text style={styles.sectionTitle}>Identity Verification & Documents</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>12-Digit Aadhaar Number *</Text>
            <TextInput
              style={styles.textInput}
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="number-pad"
              maxLength={14}
              placeholder="e.g. 9842 1048 2910"
            />
          </View>

          {/* Verification Method Toggle */}
          <Text style={styles.inputLabel}>Choose Verification Method</Text>
          <View style={styles.methodTabRow}>
            <TouchableOpacity
              style={[
                styles.methodTab,
                kycMethod === 'digilocker' && styles.methodTabActive,
              ]}
              onPress={() => setKycMethod('digilocker')}
            >
              <Shield size={16} color={kycMethod === 'digilocker' ? '#2D8A68' : '#64748B'} />
              <Text
                style={[
                  styles.methodTabText,
                  kycMethod === 'digilocker' && styles.methodTabTextActive,
                ]}
              >
                DigiLocker (Instant)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodTab,
                kycMethod === 'manual' && styles.methodTabActive,
              ]}
              onPress={() => setKycMethod('manual')}
            >
              <Upload size={16} color={kycMethod === 'manual' ? '#2D8A68' : '#64748B'} />
              <Text
                style={[
                  styles.methodTabText,
                  kycMethod === 'manual' && styles.methodTabTextActive,
                ]}
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>

          {kycMethod === 'digilocker' ? (
            <View style={styles.digiLockerCard}>
              <View style={styles.digiLockerHeader}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
                  }}
                  style={styles.digiLogo}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.digiTitle}>Government DigiLocker Vault</Text>
                  <Text style={styles.digiSub}>Official UIDAI instant identity authentication</Text>
                </View>
              </View>

              {isDigiLockerVerified ? (
                <View style={styles.digiVerifiedCard}>
                  <CheckCircle size={20} color="#2D8A68" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.digiVerifiedTitle}>Aadhaar Identity Verified</Text>
                    <Text style={styles.digiVerifiedSub}>
                      Matches: {fullName} • DOB: {dob}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.digiVerifyBtn}
                  onPress={handleDigiLockerVerify}
                  disabled={isVerifyingDigiLocker}
                >
                  {isVerifyingDigiLocker ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Lock size={16} color="#FFFFFF" />
                      <Text style={styles.digiVerifyBtnText}>Verify via DigiLocker OTP</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.manualDocSection}>
              {/* Aadhaar Front */}
              <View style={styles.docUploadCard}>
                <View style={styles.docIconBox}>
                  <FileText size={20} color="#2D8A68" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docCardTitle}>Aadhaar Card (Front)</Text>
                  <Text style={styles.docCardSub}>
                    {aadhaarFrontUploaded ? 'aadhaar_front_scan.jpg (Verified)' : 'Required JPG/PNG'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => {
                    setAadhaarFrontUploaded(true);
                    Alert.alert('Uploaded', 'Aadhaar front scanned and stored.');
                  }}
                >
                  <Text style={styles.docActionBtnText}>
                    {aadhaarFrontUploaded ? 'Replace' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Aadhaar Back */}
              <View style={styles.docUploadCard}>
                <View style={styles.docIconBox}>
                  <FileText size={20} color="#2D8A68" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docCardTitle}>Aadhaar Card (Back)</Text>
                  <Text style={styles.docCardSub}>
                    {aadhaarBackUploaded ? 'aadhaar_back_scan.jpg (Verified)' : 'Required JPG/PNG'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => {
                    setAadhaarBackUploaded(true);
                    Alert.alert('Uploaded', 'Aadhaar back scanned and stored.');
                  }}
                >
                  <Text style={styles.docActionBtnText}>
                    {aadhaarBackUploaded ? 'Replace' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Police Clearance Certificate */}
              <View style={styles.docUploadCard}>
                <View style={styles.docIconBox}>
                  <Shield size={20} color="#2D8A68" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docCardTitle}>Police Clearance Certificate</Text>
                  <Text style={styles.docCardSub}>
                    {policeCertUploaded ? 'police_clearance_cert.pdf (Uploaded)' : 'Optional / Recommended'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => {
                    setPoliceCertUploaded(true);
                    Alert.alert('Uploaded', 'Police Clearance Certificate stored.');
                  }}
                >
                  <Text style={styles.docActionBtnText}>
                    {policeCertUploaded ? 'Replace' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* STEP 4: BANK DETAILS */}
      {currentStep === 4 && (
        <View style={styles.stepFormCard}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color="#2D8A68" />
            <Text style={styles.sectionTitle}>Bank Account Payout Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.textInput}
              value={bankAccountHolder}
              onChangeText={setBankAccountHolder}
              placeholder="Full name as in bank passbook"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={styles.textInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              secureTextEntry={false}
              placeholder="Enter Account Number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Account Number *</Text>
            <TextInput
              style={styles.textInput}
              value={confirmAccountNumber}
              onChangeText={setConfirmAccountNumber}
              keyboardType="number-pad"
              placeholder="Re-enter Account Number"
            />
          </View>

          <View style={styles.twoColRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>IFSC Code *</Text>
              <TextInput
                style={styles.textInput}
                value={ifscCode}
                onChangeText={setIfscCode}
                autoCapitalize="characters"
                placeholder="e.g. HDFC0001234"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Account Type</Text>
              <View style={styles.genderOptions}>
                {(['Savings', 'Current'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.genderChip, accountType === type && styles.genderChipActive]}
                    onPress={() => setAccountType(type)}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        accountType === type && styles.genderChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* STEP 5: SAFETY DECLARATIONS & COMPLETE SUMMARY REVIEW */}
      {currentStep === 5 && (
        <View style={{ gap: 16 }}>
          {/* Summary Review Card */}
          <View style={styles.stepFormCard}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#2D8A68" />
              <Text style={styles.sectionTitle}>Application Review</Text>
            </View>

            {/* Personal Section Review */}
            <View style={styles.reviewSectionCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewSectionTitle}>1. Personal Details</Text>
                <TouchableOpacity
                  style={styles.editSectionBtn}
                  onPress={() => setCurrentStep(1)}
                >
                  <Edit3 size={14} color="#2D8A68" />
                  <Text style={styles.editSectionText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Name: </Text>
                {fullName} ({gender}, DOB: {dob})
              </Text>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Contact: </Text>
                {phone} • {email}
              </Text>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Address: </Text>
                {address}
              </Text>
            </View>

            {/* Hub Section Review */}
            <View style={styles.reviewSectionCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewSectionTitle}>2. Hub & Zone</Text>
                <TouchableOpacity
                  style={styles.editSectionBtn}
                  onPress={() => setCurrentStep(2)}
                >
                  <Edit3 size={14} color="#2D8A68" />
                  <Text style={styles.editSectionText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>City & Hub: </Text>
                {selectedCity} - {selectedHub}
              </Text>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Radius & Shift: </Text>
                {serviceRadiusKm} km radius • {preferredShift}
              </Text>
            </View>

            {/* KYC Section Review */}
            <View style={styles.reviewSectionCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewSectionTitle}>3. Identity Verification</Text>
                <TouchableOpacity
                  style={styles.editSectionBtn}
                  onPress={() => setCurrentStep(3)}
                >
                  <Edit3 size={14} color="#2D8A68" />
                  <Text style={styles.editSectionText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Aadhaar: </Text>
                {aadhaarNumber} ({kycMethod === 'digilocker' ? 'DigiLocker Verified' : 'Manual Upload'})
              </Text>
            </View>

            {/* Bank Section Review */}
            <View style={styles.reviewSectionCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewSectionTitle}>4. Bank Account</Text>
                <TouchableOpacity
                  style={styles.editSectionBtn}
                  onPress={() => setCurrentStep(4)}
                >
                  <Edit3 size={14} color="#2D8A68" />
                  <Text style={styles.editSectionText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewText}>
                <Text style={styles.reviewLabel}>Account: </Text>
                {bankName} • Account #{accountNumber} (IFSC: {ifscCode})
              </Text>
            </View>
          </View>

          {/* Safety & Health Declarations */}
          <View style={styles.stepFormCard}>
            <View style={styles.sectionHeader}>
              <Shield size={18} color="#2D8A68" />
              <Text style={styles.sectionTitle}>Partner Safety Declarations</Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setHealthDecl(!healthDecl)}
            >
              <View style={[styles.checkboxBox, healthDecl && styles.checkboxBoxActive]}>
                {healthDecl && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I declare that I am physically fit and free of contagious medical conditions suitable for home services.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setUniformKitDecl(!uniformKitDecl)}
            >
              <View style={[styles.checkboxBox, uniformKitDecl && styles.checkboxBoxActive]}>
                {uniformKitDecl && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to wear the official GC Home+ partner uniform and use certified eco-friendly cleaning materials during customer visits.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setBgCheckConsent(!bgCheckConsent)}
            >
              <View style={[styles.checkboxBox, bgCheckConsent && styles.checkboxBoxActive]}>
                {bgCheckConsent && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I authorize GC Home+ Ops to conduct police background verification and criminal record checks.
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Navigation & Action Controls */}
      <View style={styles.actionRow}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={handlePrevStep}
            disabled={isSubmitting}
          >
            <ArrowLeft size={16} color="#475569" />
            <Text style={styles.prevBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < 5 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, styles.submitBtn]}
            onPress={handleFinalSubmission}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Submit Application</Text>
                <CheckCircle size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF8F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D8A68',
  },
  applicationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  stepText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2D8A68',
    borderRadius: 3,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepLabelText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stepActive: {
    fontWeight: '800',
    color: '#2D8A68',
  },
  stepDone: {
    color: '#1E4E3D',
  },
  stepFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2D8A68',
  },
  photoActions: {
    flex: 1,
    gap: 2,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  photoSub: {
    fontSize: 11,
    color: '#64748B',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF8F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  uploadPhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: '#EBF8F2',
    borderColor: '#2D8A68',
  },
  genderChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  genderChipTextActive: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  optionCardActive: {
    backgroundColor: '#EBF8F2',
    borderColor: '#2D8A68',
  },
  optionCardText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  optionCardTextActive: {
    color: '#1E4E3D',
    fontWeight: '700',
  },
  optionList: {
    gap: 8,
  },
  listOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  listOptionRowActive: {
    backgroundColor: '#EBF8F2',
    borderColor: '#2D8A68',
  },
  listOptionText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  listOptionTextActive: {
    color: '#1E4E3D',
    fontWeight: '700',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  radiusChipActive: {
    backgroundColor: '#EBF8F2',
    borderColor: '#2D8A68',
  },
  radiusChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  radiusChipTextActive: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  methodTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  methodTabActive: {
    backgroundColor: '#EBF8F2',
    borderColor: '#2D8A68',
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTabTextActive: {
    color: '#1E4E3D',
    fontWeight: '700',
  },
  digiLockerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  digiLockerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  digiLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  digiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  digiSub: {
    fontSize: 11,
    color: '#64748B',
  },
  digiVerifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EBF8F2',
    padding: 10,
    borderRadius: 8,
  },
  digiVerifiedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  digiVerifiedSub: {
    fontSize: 11,
    color: '#2D8A68',
  },
  digiVerifyBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  digiVerifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualDocSection: {
    gap: 10,
  },
  docUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EBF8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  docActionBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  docActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  reviewSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  editSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editSectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D8A68',
  },
  reviewText: {
    fontSize: 12,
    color: '#334155',
  },
  reviewLabel: {
    fontWeight: '700',
    color: '#64748B',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxActive: {
    backgroundColor: '#2D8A68',
    borderColor: '#2D8A68',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#1E4E3D',
  },
  submitBtn: {
    backgroundColor: '#2D8A68',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
