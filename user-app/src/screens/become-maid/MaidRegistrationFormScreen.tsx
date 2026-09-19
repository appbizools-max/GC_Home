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
  ChevronRight,
  Sparkles,
  Clock,
  Sliders,
  XCircle,
  ShieldCheck,
  Award,
  HeartHandshake,
  AlertTriangle,
  ArrowRight,
  Zap,
} from 'lucide-react-native';

const ALLERGY_OPTIONS = [
  'No Known Allergies (Fit)',
  'Dust & Mites Sensitivity',
  'Strong Chemical Detergents',
  'Pet Dander (Cats/Dogs)',
  'Latex Gloves Sensitivity',
];

const CHRONIC_OPTIONS = [
  'None (100% Medically Fit)',
  'Asthma / Breathing Difficulties',
  'Chronic Back / Spine Strain',
  'Skin Eczema / Dermatitis',
  'Heart / High Blood Pressure',
];

export const MaidRegistrationFormScreen: React.FC = () => {
  const { navigateTo, user, submitMaidApplication, simulateAdminApproval, maidProfile } = useAuth();

  // Screen State: 4 Form Steps (1 to 4) + Step 5 (Reviewing / Wait for Approval)
  const [currentStep, setCurrentStep] = useState<number>(
    user?.maidApplicationStatus === 'pending' ? 5 : 1
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(
    user?.maidApplicationStatus === 'pending'
  );

  // ── Step 1: Personal Details & Operating Zone ──
  const [fullName, setFullName] = useState(user?.name || 'Sunita Devi');
  const [phone, setPhone] = useState(user?.phone || '+91 98492 01824');
  const [email, setEmail] = useState(user?.email || 'sunita.d@gchomeplus.com');
  const [dob, setDob] = useState('14/08/1988');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [address, setAddress] = useState('Plot 44, Near Metro Station, Kondapur, Hyderabad');
  const [emergencyContact, setEmergencyContact] = useState('Ramesh Kumar (+91 98765 43210)');
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const [selectedHub, setSelectedHub] = useState('Kondapur Zone, Hyderabad');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(5);
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  );
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(true);

  // ── Step 2: Upload Documents & KYC ──
  const [aadhaarNumber, setAadhaarNumber] = useState('9842 1048 2910');
  const [isDigiLockerVerified, setIsDigiLockerVerified] = useState(true);
  const [isVerifyingDigiLocker, setIsVerifyingDigiLocker] = useState(false);
  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(true);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(true);
  const [policeCertUploaded, setPoliceCertUploaded] = useState(true);

  // ── Step 3: Health, Allergies, Diseases & Infections ──
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([
    'No Known Allergies (Fit)',
  ]);
  const [selectedChronicConditions, setSelectedChronicConditions] = useState<string[]>([
    'None (100% Medically Fit)',
  ]);
  const [infectionClearanceDecl, setInfectionClearanceDecl] = useState(true);
  const [physicalFitnessDecl, setPhysicalFitnessDecl] = useState(true);
  const [uniformSafetyDecl, setUniformSafetyDecl] = useState(true);
  const [bgCheckConsent, setBgCheckConsent] = useState(true);

  // ── Step 4: Bank Payout Setup ──
  const [bankAccountHolder, setBankAccountHolder] = useState('Sunita Devi');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50100234891204');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('50100234891204');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>('Savings');
  const [upiId, setUpiId] = useState('sunita.devi@okhdfcbank');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Allergy Toggle Handler ──
  const toggleAllergy = (opt: string) => {
    if (opt === 'No Known Allergies (Fit)') {
      setSelectedAllergies(['No Known Allergies (Fit)']);
      return;
    }
    const filtered = selectedAllergies.filter(item => item !== 'No Known Allergies (Fit)');
    if (filtered.includes(opt)) {
      const next = filtered.filter(item => item !== opt);
      setSelectedAllergies(next.length ? next : ['No Known Allergies (Fit)']);
    } else {
      setSelectedAllergies([...filtered, opt]);
    }
  };

  // ── Chronic Condition Toggle Handler ──
  const toggleChronic = (opt: string) => {
    if (opt === 'None (100% Medically Fit)') {
      setSelectedChronicConditions(['None (100% Medically Fit)']);
      return;
    }
    const filtered = selectedChronicConditions.filter(item => item !== 'None (100% Medically Fit)');
    if (filtered.includes(opt)) {
      const next = filtered.filter(item => item !== opt);
      setSelectedChronicConditions(next.length ? next : ['None (100% Medically Fit)']);
    } else {
      setSelectedChronicConditions([...filtered, opt]);
    }
  };

  // ── Step Navigation & Validation ──
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!fullName.trim() || !phone.trim() || !dob.trim() || !address.trim()) {
        Alert.alert('Incomplete Profile', 'Please provide your full legal name, phone number, birth date, and residential address.');
        return;
      }
      if (!selectedCity || !selectedHub) {
        Alert.alert('Select Work Zone', 'Please select your operating city and preferred hub zone.');
        return;
      }
    } else if (currentStep === 2) {
      if (!aadhaarNumber.replace(/\s/g, '') || aadhaarNumber.replace(/\s/g, '').length < 12) {
        Alert.alert('Valid Aadhaar Required', 'Please enter a valid 12-digit Aadhaar number.');
        return;
      }
      if (!aadhaarFrontUploaded || !aadhaarBackUploaded) {
        Alert.alert('Upload Documents', 'Please upload both front and back photos of your Aadhaar card.');
        return;
      }
    } else if (currentStep === 3) {
      if (!infectionClearanceDecl || !physicalFitnessDecl || !uniformSafetyDecl || !bgCheckConsent) {
        Alert.alert(
          'Declarations Required',
          'Please accept the infection clearance, fitness, uniform protocol, and background verification declarations to proceed.'
        );
        return;
      }
    } else if (currentStep === 4) {
      if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        Alert.alert('Missing Bank Details', 'Please enter your bank name, account number, and IFSC code for direct payouts.');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        Alert.alert('Account Mismatch', 'The bank account numbers you entered do not match. Please verify.');
        return;
      }
      handleFinalSubmission();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ── DigiLocker Verification Simulation ──
  const handleDigiLockerVerify = () => {
    setIsVerifyingDigiLocker(true);
    setTimeout(() => {
      setIsVerifyingDigiLocker(false);
      setIsDigiLockerVerified(true);
      Alert.alert(
        'DigiLocker Verified',
        'Identity & Aadhaar details verified successfully via Government DigiLocker Vault.'
      );
    }, 1200);
  };

  // ── Final Application Submission ──
  const handleFinalSubmission = async () => {
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
        healthSafetyDecl: infectionClearanceDecl && physicalFitnessDecl,
        bankDetails: {
          accountNumber,
          ifscCode,
          bankName,
          accountName: bankAccountHolder,
        },
        status: 'pending' as const,
      };

      // 1. Update state in AuthContext
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
          kyc_method: 'digilocker',
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

      // Transition smoothly to Reviewing / Waiting for Approval screen
      setIsSubmitted(true);
      setCurrentStep(5);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 5: REVIEWING / WAITING FOR APPROVAL SCREEN
  // ─────────────────────────────────────────────────────────────
  if (currentStep === 5 || isSubmitted) {
    return (
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => navigateTo('become_maid_info')}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>Application Status</Text>
            <Text style={styles.headerSubtitleText}>Ref #GC-9842 • Submitted</Text>
          </View>
          <View style={styles.reviewPill}>
            <Clock size={11} color="#B45309" />
            <Text style={styles.reviewPillText}>IN REVIEW</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Main Hero Review Card */}
          <View style={styles.reviewHeroCard}>
            <View style={styles.reviewIconRing}>
              <Clock size={36} color="#D97706" />
            </View>
            <Text style={styles.reviewHeroTitle}>Application Under Review</Text>
            <Text style={styles.reviewHeroSub}>
              Thank you, <Text style={{ fontWeight: '800', color: '#0F172A' }}>{fullName}</Text>! Your 4-step partner registration has been submitted and is currently being verified by our Safety Operations team.
            </Text>

            <View style={styles.estTimeBadge}>
              <Sparkles size={13} color="#166534" />
              <Text style={styles.estTimeText}>Estimated Review: 2 to 4 Hours</Text>
            </View>
          </View>

          {/* Stepper Review Breakdown */}
          <View style={styles.reviewStepsBox}>
            <Text style={styles.reviewStepsBoxTitle}>Registration Verification Progress</Text>

            {/* Step 1 Item */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Step 1: Personal Details & Hub Zone</Text>
                <Text style={styles.reviewStepSub}>
                  {selectedCity} • {selectedHub} ({serviceRadiusKm} km radius)
                </Text>
              </View>
              <Text style={styles.verifiedTag}>Completed</Text>
            </View>

            {/* Step 2 Item */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Step 2: Aadhaar & Govt Documents</Text>
                <Text style={styles.reviewStepSub}>
                  Aadhaar #{aadhaarNumber} • DigiLocker Verified
                </Text>
              </View>
              <Text style={styles.verifiedTag}>Verified</Text>
            </View>

            {/* Step 3 Item */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Step 3: Health & Infection Declarations</Text>
                <Text style={styles.reviewStepSub}>
                  Allergies, chronic conditions & safety agreements cleared
                </Text>
              </View>
              <Text style={styles.verifiedTag}>Cleared</Text>
            </View>

            {/* Step 4 Item */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Step 4: Bank Payout Setup</Text>
                <Text style={styles.reviewStepSub}>
                  {bankName} • Account ending in {accountNumber.slice(-4)}
                </Text>
              </View>
              <Text style={styles.verifiedTag}>Verified</Text>
            </View>

            {/* Final Pending Review */}
            <View style={[styles.reviewStepRow, { borderBottomWidth: 0 }]}>
              <View style={styles.pendingCheckCircle}>
                <Clock size={13} color="#D97706" />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitlePending}>
                  Final Step: Admin Panel Operations Approval
                </Text>
                <Text style={styles.reviewStepSubPending}>
                  Background check & document review in progress
                </Text>
              </View>
              <Text style={styles.pendingTag}>In Progress</Text>
            </View>
          </View>

          {/* What Happens Next Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <ShieldCheck size={18} color="#1E4E3D" />
              <Text style={styles.infoCardTitle}>What Happens Next?</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1.</Text>
              <Text style={styles.infoText}>
                You will receive an instant SMS and WhatsApp confirmation as soon as Admin Ops verifies your documents.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2.</Text>
              <Text style={styles.infoText}>
                Your free starter kit (uniform apron, cleaning tote, and eco-safe supplies) will be issued at your assigned hub.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>3.</Text>
              <Text style={styles.infoText}>
                Once approved, open your Maid Dashboard to toggle Online and accept customer home service requests!
              </Text>
            </View>
          </View>

          {/* SIMULATE ADMIN PANEL ACTION BOX (For testing) */}
          <View style={styles.adminSimCard}>
            <View style={styles.adminSimHeader}>
              <Sliders size={16} color="#1E4E3D" />
              <Text style={styles.adminSimTitle}>Admin Operations Simulation</Text>
            </View>
            <Text style={styles.adminSimDesc}>
              Test instant approval or rejection to inspect partner transitions in real-time.
            </Text>
            <View style={styles.adminBtnRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => {
                  simulateAdminApproval(true);
                  Alert.alert('Approved!', 'Partner application approved! Navigating to Maid Dashboard.');
                  navigateTo('maid_home');
                }}
                activeOpacity={0.8}
              >
                <Check size={15} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Approve (Go to Dashboard)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => {
                  simulateAdminApproval(false, 'Please re-upload a clearer Aadhaar front document.');
                  Alert.alert('Revision Requested', 'Application marked as revision needed.');
                  navigateTo('become_maid_info');
                }}
                activeOpacity={0.8}
              >
                <XCircle size={15} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Request Revision</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action CTAs */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => navigateTo('become_maid_info')}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryActionBtnText}>Go to Maid Partner Portal</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => navigateTo('customer_home')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionBtnText}>Back to Customer Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4-STEP FORM RENDERING
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep > 1) {
              handlePrevStep();
            } else {
              navigateTo('become_maid_info');
            }
          }}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Partner Registration</Text>
          <Text style={styles.headerSubtitleText}>
            Step {currentStep} of 4 • {
              currentStep === 1 ? 'Personal Details' :
              currentStep === 2 ? 'Upload Documents' :
              currentStep === 3 ? 'Health & Allergies' :
              'Bank Payout Setup'
            }
          </Text>
        </View>
        <View style={styles.freeBadge}>
          <ShieldCheck size={12} color="#166534" />
          <Text style={styles.freeBadgeText}>100% SECURE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Stepper Indicator Card */}
        <View style={styles.progressCard}>
          <View style={styles.stepBadgeRow}>
            <View style={styles.applicationBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.applicationBadgeText}>Application #GC-9842</Text>
            </View>
            <Text style={styles.stepPercentText}>{currentStep * 25}% Completed</Text>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${currentStep * 25}%` }]} />
          </View>

          {/* 4 Step Pills */}
          <View style={styles.stepLabelsRow}>
            {[
              { num: 1, label: 'Personal' },
              { num: 2, label: 'Documents' },
              { num: 3, label: 'Health & Allergies' },
              { num: 4, label: 'Bank Setup' },
            ].map(s => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <TouchableOpacity
                  key={s.num}
                  onPress={() => {
                    if (s.num < currentStep) setCurrentStep(s.num);
                  }}
                  disabled={s.num > currentStep}
                  style={[
                    styles.stepPill,
                    isCurrent && styles.stepPillCurrent,
                    isDone && styles.stepPillDone,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.stepPillText,
                      isCurrent && styles.stepPillTextCurrent,
                      isDone && styles.stepPillTextDone,
                    ]}
                  >
                    {isDone ? `✓ ${s.label}` : `${s.num}. ${s.label}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ────────────────────────────────────────────────
            STEP 1: PERSONAL DETAILS & OPERATING ZONE
           ──────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <View style={styles.stepFormCard}>
            <View style={styles.sectionHeader}>
              <User size={18} color="#1E4E3D" />
              <Text style={styles.sectionTitle}>Personal Profile & Work Location</Text>
            </View>

            {/* Photo Upload Box */}
            <View style={styles.photoUploadRow}>
              <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
              <View style={styles.photoActions}>
                <Text style={styles.photoTitle}>Partner Profile Photo</Text>
                <Text style={styles.photoSub}>Clear face picture for customer safety badge</Text>
                <TouchableOpacity
                  style={styles.uploadPhotoBtn}
                  onPress={() => {
                    setPhotoUrl(
                      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
                    );
                    setIsPhotoUploaded(true);
                    Alert.alert('Photo Updated', 'Profile photo updated successfully.');
                  }}
                  activeOpacity={0.8}
                >
                  <Upload size={14} color="#1E4E3D" />
                  <Text style={styles.uploadPhotoBtnText}>
                    {isPhotoUploaded ? 'Change Photo' : 'Upload Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Legal Name *</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Sunita Devi"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Phone Number (WhatsApp Enabled) *</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 Mobile Number"
                placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.genderOptions}>
                  {(['Female', 'Male', 'Other'] as const).map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, gender === g && styles.genderChipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          gender === g && styles.genderChipTextActive,
                        ]}
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
                numberOfLines={2}
                placeholder="House/Flat No, Street, Landmark, Pincode"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact (Name & Phone) *</Text>
              <TextInput
                style={styles.textInput}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="e.g. Ramesh Kumar (+91 98765 43210)"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Operating City & Hub */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Operating City *</Text>
              <View style={styles.optionGrid}>
                {['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi-NCR'].map(city => (
                  <TouchableOpacity
                    key={city}
                    style={[styles.optionCard, selectedCity === city && styles.optionCardActive]}
                    onPress={() => setSelectedCity(city)}
                    activeOpacity={0.8}
                  >
                    <Building size={14} color={selectedCity === city ? '#1E4E3D' : '#64748B'} />
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
                ].map(hub => (
                  <TouchableOpacity
                    key={hub}
                    style={[styles.listOptionRow, selectedHub === hub && styles.listOptionRowActive]}
                    onPress={() => setSelectedHub(hub)}
                    activeOpacity={0.8}
                  >
                    <MapPin size={15} color={selectedHub === hub ? '#1E4E3D' : '#64748B'} />
                    <Text
                      style={[
                        styles.listOptionText,
                        selectedHub === hub && styles.listOptionTextActive,
                      ]}
                    >
                      {hub}
                    </Text>
                    {selectedHub === hub && <Check size={16} color="#1E4E3D" strokeWidth={2.5} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Radius: {serviceRadiusKm} km from Hub</Text>
              <View style={styles.radiusPillsRow}>
                {[3, 5, 8, 10].map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setServiceRadiusKm(r)}
                    style={[
                      styles.radiusPill,
                      serviceRadiusKm === r && styles.radiusPillActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.radiusPillText,
                        serviceRadiusKm === r && styles.radiusPillTextActive,
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ────────────────────────────────────────────────
            STEP 2: UPLOAD DOCUMENTS & KYC
           ──────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <View style={styles.stepFormCard}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color="#1E4E3D" />
              <Text style={styles.sectionTitle}>Government Identity Documents</Text>
            </View>

            <Text style={styles.sectionHint}>
              Upload clear government ID photos. All documents are encrypted and protected under UIDAI safety guidelines.
            </Text>

            {/* Aadhaar Input & DigiLocker Instant Verify */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Aadhaar Card Number *</Text>
              <TextInput
                style={styles.textInput}
                value={aadhaarNumber}
                onChangeText={setAadhaarNumber}
                keyboardType="numeric"
                maxLength={14}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* DigiLocker Button */}
            <TouchableOpacity
              style={[
                styles.digiLockerBtn,
                isDigiLockerVerified && styles.digiLockerBtnVerified,
              ]}
              onPress={handleDigiLockerVerify}
              disabled={isVerifyingDigiLocker || isDigiLockerVerified}
              activeOpacity={0.8}
            >
              {isVerifyingDigiLocker ? (
                <ActivityIndicator size="small" color="#1E4E3D" />
              ) : isDigiLockerVerified ? (
                <CheckCircle size={18} color="#166534" />
              ) : (
                <Zap size={18} color="#1E4E3D" />
              )}
              <Text
                style={[
                  styles.digiLockerBtnText,
                  isDigiLockerVerified && styles.digiLockerBtnTextVerified,
                ]}
              >
                {isVerifyingDigiLocker
                  ? 'Verifying via UIDAI Vault...'
                  : isDigiLockerVerified
                  ? 'DigiLocker Identity Verified ✓'
                  : 'Instant Verify with Govt DigiLocker'}
              </Text>
            </TouchableOpacity>

            {/* Document 1: Aadhaar Front */}
            <View style={styles.docUploadCard}>
              <View style={styles.docIconBox}>
                <FileText size={20} color="#1E4E3D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docCardTitle}>Aadhaar Card (Front Photo) *</Text>
                <Text style={styles.docCardSub}>
                  {aadhaarFrontUploaded ? 'aadhaar_front_scan.jpg (Uploaded)' : 'Clear photo of front side'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.docActionBtn}
                onPress={() => {
                  setAadhaarFrontUploaded(true);
                  Alert.alert('Uploaded', 'Aadhaar front document stored.');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.docActionBtnText}>
                  {aadhaarFrontUploaded ? 'Replace' : 'Upload'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 2: Aadhaar Back */}
            <View style={styles.docUploadCard}>
              <View style={styles.docIconBox}>
                <FileText size={20} color="#1E4E3D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docCardTitle}>Aadhaar Card (Back Photo) *</Text>
                <Text style={styles.docCardSub}>
                  {aadhaarBackUploaded ? 'aadhaar_back_scan.jpg (Uploaded)' : 'Clear photo of address side'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.docActionBtn}
                onPress={() => {
                  setAadhaarBackUploaded(true);
                  Alert.alert('Uploaded', 'Aadhaar back document stored.');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.docActionBtnText}>
                  {aadhaarBackUploaded ? 'Replace' : 'Upload'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 3: Police Clearance Certificate */}
            <View style={styles.docUploadCard}>
              <View style={styles.docIconBox}>
                <Shield size={20} color="#1E4E3D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docCardTitle}>Police Clearance Certificate</Text>
                <Text style={styles.docCardSub}>
                  {policeCertUploaded ? 'police_clearance_cert.pdf (Uploaded)' : 'Optional / Recommended for priority leads'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.docActionBtn}
                onPress={() => {
                  setPoliceCertUploaded(true);
                  Alert.alert('Uploaded', 'Police Clearance Certificate stored.');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.docActionBtnText}>
                  {policeCertUploaded ? 'Replace' : 'Upload'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ────────────────────────────────────────────────
            STEP 3: HEALTH, ALLERGIES, DISEASES & INFECTIONS
           ──────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <View style={styles.stepFormCard}>
            <View style={styles.sectionHeader}>
              <HeartHandshake size={18} color="#1E4E3D" />
              <Text style={styles.sectionTitle}>Health & Allergies Declarations</Text>
            </View>

            <Text style={styles.sectionHint}>
              Please declare any allergies, chronic conditions, or infections for your safety and to ensure suitable job assignments.
            </Text>

            {/* Known Allergies */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Known Allergies & Chemical Sensitivities *</Text>
              <View style={styles.chipGrid}>
                {ALLERGY_OPTIONS.map(opt => {
                  const isSelected = selectedAllergies.includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => toggleAllergy(opt)}
                      style={[styles.declChip, isSelected && styles.declChipActive]}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.chipRadio,
                          isSelected && styles.chipRadioActive,
                        ]}
                      >
                        {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text
                        style={[
                          styles.declChipText,
                          isSelected && styles.declChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Chronic Medical Conditions */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chronic Medical Conditions *</Text>
              <View style={styles.chipGrid}>
                {CHRONIC_OPTIONS.map(opt => {
                  const isSelected = selectedChronicConditions.includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => toggleChronic(opt)}
                      style={[styles.declChip, isSelected && styles.declChipActive]}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.chipRadio,
                          isSelected && styles.chipRadioActive,
                        ]}
                      >
                        {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text
                        style={[
                          styles.declChipText,
                          isSelected && styles.declChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Health & Safety Checkboxes */}
            <View style={styles.declarationList}>
              {/* Infectious Disease Clearance */}
              <TouchableOpacity
                style={styles.checkboxCard}
                onPress={() => setInfectionClearanceDecl(!infectionClearanceDecl)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    infectionClearanceDecl && styles.checkboxSquareActive,
                  ]}
                >
                  {infectionClearanceDecl && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxHeading}>Infectious Disease Clearance</Text>
                  <Text style={styles.checkboxSubText}>
                    I confirm that I do not currently have any active communicable diseases, tuberculosis, or contagious skin infections that would pose risks to clients.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Physical Fitness */}
              <TouchableOpacity
                style={styles.checkboxCard}
                onPress={() => setPhysicalFitnessDecl(!physicalFitnessDecl)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    physicalFitnessDecl && styles.checkboxSquareActive,
                  ]}
                >
                  {physicalFitnessDecl && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxHeading}>Physical Fitness for Cleaning Tasks</Text>
                  <Text style={styles.checkboxSubText}>
                    I declare that I am physically capable of performing home mopping, dusting, sweeping, and kitchen deep cleaning without restriction.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Uniform & Sanitation Kit Protocol */}
              <TouchableOpacity
                style={styles.checkboxCard}
                onPress={() => setUniformSafetyDecl(!uniformSafetyDecl)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    uniformSafetyDecl && styles.checkboxSquareActive,
                  ]}
                >
                  {uniformSafetyDecl && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxHeading}>Official Uniform & Safety Gear Protocol</Text>
                  <Text style={styles.checkboxSubText}>
                    I agree to wear the provided GC Home+ apron uniform, sanitized gloves, and use certified non-toxic eco-cleaning supplies.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Background Check Consent */}
              <TouchableOpacity
                style={styles.checkboxCard}
                onPress={() => setBgCheckConsent(!bgCheckConsent)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    bgCheckConsent && styles.checkboxSquareActive,
                  ]}
                >
                  {bgCheckConsent && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxHeading}>Police & Background Verification Consent</Text>
                  <Text style={styles.checkboxSubText}>
                    I authorize GC Home+ Safety Operations to conduct criminal history and identity background verification.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ────────────────────────────────────────────────
            STEP 4: BANK DETAILS (PAYOUT SETUP)
           ──────────────────────────────────────────────── */}
        {currentStep === 4 && (
          <View style={styles.stepFormCard}>
            <View style={styles.sectionHeader}>
              <CreditCard size={18} color="#1E4E3D" />
              <Text style={styles.sectionTitle}>Bank Account & Payout Setup</Text>
            </View>

            <Text style={styles.sectionHint}>
              Weekly payments are automatically deposited every Monday at 10:00 AM. Enter your verified personal bank account.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Legal Name *</Text>
              <TextInput
                style={styles.textInput}
                value={bankAccountHolder}
                onChangeText={setBankAccountHolder}
                placeholder="Full name as in bank passbook"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <TextInput
                style={styles.textInput}
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g. HDFC Bank, State Bank of India, ICICI"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Account Number *</Text>
              <TextInput
                style={styles.textInput}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
                placeholder="Enter Account Number"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Bank Account Number *</Text>
              <TextInput
                style={styles.textInput}
                value={confirmAccountNumber}
                onChangeText={setConfirmAccountNumber}
                keyboardType="number-pad"
                placeholder="Re-enter Account Number"
                placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.genderOptions}>
                  {(['Savings', 'Current'] as const).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.genderChip, accountType === t && styles.genderChipActive]}
                      onPress={() => setAccountType(t)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          accountType === t && styles.genderChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID (For Instant 24/7 Settlements - Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="username@okhdfcbank"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Payout Guarantee Notice */}
            <View style={styles.payoutNoticeBox}>
              <Sparkles size={15} color="#166534" />
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutNoticeTitle}>Guaranteed Weekly Monday Deposits</Text>
                <Text style={styles.payoutNoticeSub}>
                  Zero fees or commissions deducted. Full earnings deposited directly to your bank account every Monday morning.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ────────────────────────────────────────────────
            BOTTOM NAVIGATION CONTROLS
           ──────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={handlePrevStep}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <ArrowLeft size={16} color="#475569" />
              <Text style={styles.prevBtnText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextBtn,
              currentStep === 4 && styles.submitBtn,
            ]}
            onPress={handleNextStep}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : currentStep === 4 ? (
              <>
                <Text style={styles.nextBtnText}>Submit & Request Approval</Text>
                <CheckCircle size={16} color="#FFFFFF" />
              </>
            ) : (
              <>
                <Text style={styles.nextBtnText}>Next Step</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  reviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },

  /* Stepper Progress Card */
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
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
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E4E3D',
  },
  applicationBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  stepPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E4E3D',
    borderRadius: 3,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  stepPillCurrent: {
    backgroundColor: '#E6F4EA',
    borderColor: '#1E4E3D',
  },
  stepPillDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepPillTextCurrent: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  stepPillTextDone: {
    color: '#166534',
    fontWeight: '800',
  },

  /* Form Card */
  stepFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: -6,
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  photoActions: {
    flex: 1,
    gap: 2,
  },
  photoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  photoSub: {
    fontSize: 10,
    color: '#64748B',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  uploadPhotoBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E4E3D',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#1E4E3D',
  },
  genderChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionCardActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#1E4E3D',
  },
  optionCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  optionCardTextActive: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  optionList: {
    gap: 6,
  },
  listOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  listOptionRowActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#1E4E3D',
  },
  listOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
  },
  listOptionTextActive: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  radiusPillActive: {
    backgroundColor: '#1E4E3D',
    borderColor: '#1E4E3D',
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Step 2 Documents */
  digiLockerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E6F4EA',
    borderWidth: 1.5,
    borderColor: '#1E4E3D',
    borderRadius: 12,
    paddingVertical: 12,
  },
  digiLockerBtnVerified: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
  },
  digiLockerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  digiLockerBtnTextVerified: {
    color: '#166534',
  },
  docUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  docCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  docActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E4E3D',
  },

  /* Step 3 Allergies & Health */
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  declChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  declChipActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#1E4E3D',
  },
  chipRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRadioActive: {
    borderColor: '#1E4E3D',
    backgroundColor: '#1E4E3D',
  },
  declChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  declChipTextActive: {
    color: '#1E4E3D',
    fontWeight: '800',
  },
  declarationList: {
    gap: 8,
    marginTop: 4,
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxSquareActive: {
    borderColor: '#1E4E3D',
    backgroundColor: '#1E4E3D',
  },
  checkboxHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  checkboxSubText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },

  /* Step 4 Bank */
  payoutNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  payoutNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  payoutNoticeSub: {
    fontSize: 10.5,
    color: '#166534',
    lineHeight: 15,
    marginTop: 2,
  },

  /* Form Actions */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E4E3D',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#1E4E3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtn: {
    backgroundColor: '#166534',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ────────────────────────────────────────────────────────
     STEP 5: REVIEWING / WAITING FOR APPROVAL STYLES
     ──────────────────────────────────────────────────────── */
  reviewHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  reviewIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    borderWidth: 4,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  reviewHeroSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    textAlign: 'center',
  },
  estTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  estTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },

  reviewStepsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  reviewStepsBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  reviewStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reviewCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewStepTextCol: {
    flex: 1,
    gap: 2,
  },
  reviewStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewStepSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  reviewStepTitlePending: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewStepSubPending: {
    fontSize: 10.5,
    color: '#92400E',
  },
  verifiedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoBullet: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4E3D',
    width: 14,
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },

  adminSimCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  adminSimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminSimTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  adminSimDesc: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  adminBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E4E3D',
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  primaryActionBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E4E3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
