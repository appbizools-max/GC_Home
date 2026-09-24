import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { MaidApplicationStatus } from '../../types';
import { AddressEntryForm, AddressFormData } from '../../components/address/AddressEntryForm';
import { DynamicServiceSelector, SelectedServiceItem } from './components/DynamicServiceSelector';
import { PartnerDocumentPicker, DocItemState } from './components/PartnerDocumentPicker';
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Sparkles,
  Clock,
  Check,
  XCircle,
  ArrowRight,
  Upload,
  Calendar as CalendarIcon,
  Globe,
  Radio,
  AlertCircle,
} from 'lucide-react-native';

const STANDARD_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Other'];
const RADIUS_OPTIONS = [5, 10, 15, 20];
const EXPERIENCE_OPTIONS = [1, 2, 3, 5, 8, 10];

export const PARTNER_SUPPORTED_CITIES = [
  'Karimnagar',
  'Kazipet',
  'Hanamkonda',
  'Warangal',
];

export const MaidRegistrationFormScreen: React.FC = () => {
  const { navigateTo, user, submitMaidApplication, maidProfile } = useAuth();

  // Application Flow State (Steps 1 to 5, Step 6 = Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [appStatus, setAppStatus] = useState<MaidApplicationStatus>('none');

  // ── Step 1: Personal Details ──
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [dob, setDob] = useState('');
  const [showDobModal, setShowDobModal] = useState(false);
  const [dobYear, setDobYear] = useState('1995');
  const [dobMonth, setDobMonth] = useState('06');
  const [dobDay, setDobDay] = useState('15');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);

  // ── Step 2: Address Details ──
  const [houseFlat, setHouseFlat] = useState('');
  const [street, setStreet] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedPostOffice, setSelectedPostOffice] = useState('');
  const [locality, setLocality] = useState('');
  const [pincode, setPincode] = useState('');

  // ── Step 3: Services & Availability ──
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Telugu', 'English']);
  const [customLanguageInput, setCustomLanguageInput] = useState('');
  const [customLanguagesList, setCustomLanguagesList] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Not Available'>('Available');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(5); // Initial dispatch radius: 5 KM
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [emergencyJobsAccepted, setEmergencyJobsAccepted] = useState<boolean>(true);

  // ── Step 4: Document Verification (Aadhaar & PAN only) ──
  const [documents, setDocuments] = useState<{
    aadhaarFront: DocItemState;
    aadhaarBack: DocItemState;
    pan: DocItemState;
  }>({
    aadhaarFront: {
      id: 'aadhaar_front',
      name: 'Aadhaar Card (Front)',
      subTitle: 'Clear photo showing your Name & Aadhaar Number',
      required: true,
      uploaded: false,
    },
    aadhaarBack: {
      id: 'aadhaar_back',
      name: 'Aadhaar Card (Back)',
      subTitle: 'Clear photo showing your Residential Address',
      required: true,
      uploaded: false,
    },
    pan: {
      id: 'pan',
      name: 'PAN Card',
      subTitle: 'Required for direct bank tax payout verification',
      required: true,
      uploaded: false,
    },
  });

  // ── Step 5: Bank Details & Complete Registration ──
  const [bankAccountHolder, setBankAccountHolder] = useState(user?.name || '');
  const [bankName, setBankName] = useState('');
  const [confirmBankName, setConfirmBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Declarations
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPartnerId, setGeneratedPartnerId] = useState('');

  // Load existing profile if application was already submitted / correction requested
  useEffect(() => {
    if (maidProfile) {
      const isCorr =
        maidProfile.status === 'correction_requested' ||
        maidProfile.kycStatus === 'incomplete' ||
        Boolean(maidProfile.adminNotes?.toLowerCase().includes('correction'));

      if (
        maidProfile.status === 'pending' ||
        maidProfile.status === 'approved' ||
        maidProfile.status === 'rejected' ||
        isCorr
      ) {
        setAppStatus(isCorr ? 'correction_requested' : maidProfile.status);
        setIsSubmitted(true);
        setCurrentStep(6); // Show confirmation/status screen
        setGeneratedPartnerId(maidProfile.maidCode || 'GC-PARTNER-1001');

        if (maidProfile.fullName) setFullName(maidProfile.fullName);
        if (maidProfile.phone) setPhone(maidProfile.phone);
        if (maidProfile.email) setEmail(maidProfile.email);
        if (maidProfile.dob) setDob(maidProfile.dob);
        if (maidProfile.emergencyContactName) setEmergencyContactName(maidProfile.emergencyContactName);
        if (maidProfile.emergencyContactPhone) setEmergencyContactPhone(maidProfile.emergencyContactPhone);

        if (maidProfile.fullAddress) {
          setFullAddress(maidProfile.fullAddress);
          const parts = maidProfile.fullAddress.split(', ');
          if (parts.length > 1) {
            setHouseFlat(parts[0]);
            setStreet(parts.slice(1).join(', '));
          } else {
            setHouseFlat(maidProfile.fullAddress);
          }
        }
        if (maidProfile.city && PARTNER_SUPPORTED_CITIES.includes(maidProfile.city)) {
          setSelectedCity(maidProfile.city);
        }
        if (maidProfile.locality) setLocality(maidProfile.locality);
        if (maidProfile.district) setSelectedDistrict(maidProfile.district);
        if (maidProfile.state) setSelectedState(maidProfile.state);
        if (maidProfile.postOffice) setSelectedPostOffice(maidProfile.postOffice);
        if (maidProfile.pincode) setPincode(maidProfile.pincode);

        if (maidProfile.bankDetails) {
          if (maidProfile.bankDetails.accountName) setBankAccountHolder(maidProfile.bankDetails.accountName);
          if (maidProfile.bankDetails.accountNumber) {
            setAccountNumber(maidProfile.bankDetails.accountNumber);
            setConfirmAccountNumber(maidProfile.bankDetails.accountNumber);
          }
          if (maidProfile.bankDetails.bankName) {
            setBankName(maidProfile.bankDetails.bankName);
            setConfirmBankName(maidProfile.bankDetails.bankName);
          }
          if (maidProfile.bankDetails.ifscCode) setIfscCode(maidProfile.bankDetails.ifscCode);
          if (maidProfile.bankDetails.upiId) setUpiId(maidProfile.bankDetails.upiId);
        }

        if (maidProfile.serviceRadiusKm) {
          setServiceRadiusKm(maidProfile.serviceRadiusKm);
        }

        if (maidProfile.aadhaarFrontUrl) {
          setDocuments(prev => ({
            ...prev,
            aadhaarFront: { ...prev.aadhaarFront, uploaded: true, fileUrl: maidProfile.aadhaarFrontUrl },
          }));
        }
        if (maidProfile.aadhaarBackUrl) {
          setDocuments(prev => ({
            ...prev,
            aadhaarBack: { ...prev.aadhaarBack, uploaded: true, fileUrl: maidProfile.aadhaarBackUrl },
          }));
        }
        if (maidProfile.panDocUrl) {
          setDocuments(prev => ({
            ...prev,
            pan: { ...prev.pan, uploaded: true, fileUrl: maidProfile.panDocUrl },
          }));
        }
      }
    }
  }, [maidProfile]);

  // ── Language Handlers ──
  const toggleStandardLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length <= 1 && customLanguagesList.length === 0) {
        Alert.alert('Language Required', 'Please keep at least 1 language selected.');
        return;
      }
      setSelectedLanguages(prev => prev.filter(l => l !== lang));
    } else {
      setSelectedLanguages(prev => [...prev, lang]);
    }
  };

  const handleAddCustomLanguage = () => {
    const trimmed = customLanguageInput.trim();
    if (!trimmed) return;
    if (
      !customLanguagesList.some(l => l.toLowerCase() === trimmed.toLowerCase()) &&
      !selectedLanguages.some(l => l.toLowerCase() === trimmed.toLowerCase())
    ) {
      setCustomLanguagesList(prev => [...prev, trimmed]);
    }
    setCustomLanguageInput('');
  };

  const handleRemoveCustomLanguage = (lang: string) => {
    setCustomLanguagesList(prev => prev.filter(l => l !== lang));
  };

  // ── Date of Birth Confirm Handler ──
  const handleConfirmDob = () => {
    const formatted = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    setDob(formatted);
    setShowDobModal(false);
  };

  // ── Step 2 Address Submit ──
  const handlePartnerAddressSubmit = (data: AddressFormData) => {
    if (!data.city || !PARTNER_SUPPORTED_CITIES.includes(data.city)) {
      Alert.alert('City Selection Required', 'Please select your city.');
      return;
    }
    setHouseFlat(data.houseFlat);
    setStreet(data.street);
    setLocality(data.locality);
    setSelectedCity(data.city);
    setSelectedDistrict(data.district || '');
    setSelectedState(data.state);
    setPincode(data.pincode);
    setSelectedPostOffice(data.postOffice || '');
    setFullAddress(`${data.houseFlat}${data.street ? ', ' + data.street : ''}`);

    setCurrentStep(3);
  };

  // ── Document State Change Handler ──
  const handleDocumentChange = (docKey: 'aadhaarFront' | 'aadhaarBack' | 'pan', updated: DocItemState) => {
    setDocuments(prev => ({
      ...prev,
      [docKey]: updated,
    }));
  };

  // ── Validation & Step Navigation ──
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) {
        Alert.alert('Full Name Required', 'Please enter your full legal name.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        Alert.alert('Valid Phone Required', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      if (!dob.trim()) {
        Alert.alert('Date of Birth Required', 'Please select your birth date.');
        return;
      }
      if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
        Alert.alert('Emergency Contact Required', 'Please provide an emergency contact name and phone number.');
        return;
      }
    } else if (currentStep === 2) {
      const hasHouse = houseFlat.trim() || fullAddress.trim();
      if (!hasHouse || !locality.trim() || !pincode.trim() || !selectedCity.trim()) {
        Alert.alert('Complete Address Required', 'Please fill in your address, locality, pincode, and select your city.');
        return;
      }
      if (!PARTNER_SUPPORTED_CITIES.includes(selectedCity.trim())) {
        Alert.alert('City Selection Required', 'Please select your city.');
        return;
      }
      if (pincode.replace(/\D/g, '').length < 6) {
        Alert.alert('Valid Pincode Required', 'Please enter a valid 6-digit pincode.');
        return;
      }
    } else if (currentStep === 3) {
      // Step 3 Validation: Services & Availability
      if (selectedServices.length === 0) {
        Alert.alert('Services Required', 'Please select at least one active service you provide.');
        return;
      }
      if (!experienceYears || experienceYears <= 0) {
        Alert.alert('Experience Required', 'Please select or enter your years of experience.');
        return;
      }
      if (selectedLanguages.length === 0 && customLanguagesList.length === 0) {
        Alert.alert('Language Required', 'Please select at least 1 language you speak.');
        return;
      }

      // Validate working times: End time cannot be earlier than start time
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startTotalMins = (startH || 0) * 60 + (startM || 0);
      const endTotalMins = (endH || 0) * 60 + (endM || 0);
      if (endTotalMins <= startTotalMins) {
        Alert.alert('Invalid Working Hours', 'End time cannot be earlier than or equal to start time.');
        return;
      }
    } else if (currentStep === 4) {
      // Step 4 Validation: Aadhaar & PAN KYC
      if (!documents.aadhaarFront.uploaded) {
        Alert.alert('Aadhaar (Front) Required', 'Please upload or capture your Aadhaar Card (Front).');
        return;
      }
      if (!documents.aadhaarBack.uploaded) {
        Alert.alert('Aadhaar (Back) Required', 'Please upload or capture your Aadhaar Card (Back).');
        return;
      }
      if (!documents.pan.uploaded) {
        Alert.alert('PAN Document Required', 'Please upload or capture your PAN Card.');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ── Final Application Submission (Step 5 -> Supabase -> Step 6 Confirmation) ──
  const handleFinalSubmission = async () => {
    // 1. Bank Fields Validation
    if (!bankAccountHolder.trim()) {
      Alert.alert('Account Holder Required', 'Please enter your account holder name.');
      return;
    }
    if (!accountNumber.trim() || accountNumber.replace(/\D/g, '').length < 9) {
      Alert.alert('Account Number Required', 'Please enter a valid bank account number (9 to 18 digits).');
      return;
    }
    if (!bankName.trim()) {
      Alert.alert('Bank Name Required', 'Please enter your bank name.');
      return;
    }
    if (!confirmBankName.trim()) {
      Alert.alert('Confirm Bank Name Required', 'Please re-enter your bank name.');
      return;
    }
    if (bankName.trim().toLowerCase() !== confirmBankName.trim().toLowerCase()) {
      Alert.alert('Bank Name Mismatch', 'Bank Name and Confirm Bank Name do not match. Please verify.');
      return;
    }

    const ifscClean = ifscCode.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscClean)) {
      Alert.alert(
        'Invalid IFSC Code',
        'Please enter a valid 11-character Indian IFSC code (e.g. HDFC0001234, SBIN0000456).'
      );
      return;
    }

    if (upiId.trim()) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z._]{2,49}$/;
      if (!upiRegex.test(upiId.trim())) {
        Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. 9876543210@upi) or leave it blank.');
        return;
      }
    }

    // 2. Declarations Check
    if (!termsAccepted || !privacyAccepted || !accuracyConfirmed) {
      Alert.alert(
        'Declarations Required',
        'Please check all three boxes confirming Terms, Privacy Policy, and Information Accuracy to complete registration.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 3. Backend Active Service Verification
      const selectedIds = selectedServices.map(s => s.serviceId);
      const { data: dbServices, error: dbServErr } = await supabase
        .from('services')
        .select('id, name, is_active')
        .in('id', selectedIds);

      if (!dbServErr && dbServices) {
        const inactive = dbServices.filter(s => !s.is_active);
        if (inactive.length > 0) {
          Alert.alert(
            'Service No Longer Active',
            `The service "${inactive[0].name}" is currently deactivated in the Admin catalog. Please remove it and select active services.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      const partnerCode = `GC-PARTNER-${Math.floor(1000 + Math.random() * 9000)}`;
      setGeneratedPartnerId(partnerCode);

      const allLanguages = [
        ...selectedLanguages.filter(l => l !== 'Other'),
        ...customLanguagesList,
      ];

      const fullAddressStr = `${houseFlat || fullAddress}${street ? ', ' + street : ''}, ${locality}, ${selectedCity} ${pincode}`;

      const partnerProvidedServices = selectedServices.map(s => ({
        id: s.serviceId,
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        category: s.category || '',
        experienceYears,
      }));

      const applicationPayload = {
        maidCode: partnerCode,
        fullName,
        phone,
        email,
        dob,
        gender,
        photoUrl:
          profilePhotoUrl ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
        idProofUrl: documents.aadhaarFront.fileUrl || '',
        emergencyContact: `${emergencyContactName} (${emergencyContactPhone})`,
        emergencyContactName,
        emergencyContactPhone,
        address: fullAddressStr,
        fullAddress: `${houseFlat || fullAddress}${street ? ', ' + street : ''}`,
        locality,
        pincode,
        city: selectedCity,
        district: selectedDistrict || undefined,
        state: selectedState || undefined,
        postOffice: selectedPostOffice || undefined,
        serviceArea: selectedCity,
        preferredServiceArea: selectedCity,
        serviceRadiusKm,
        healthSafetyDecl: true,
        bankDetails: {
          accountName: bankAccountHolder,
          accountNumber,
          ifscCode: ifscClean,
          bankName,
          upiId,
        },
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        workingHours: `${startTime} - ${endTime}`,
        emergencyJobsAccepted,
        servicesProvided: partnerProvidedServices,
        languagesSpoken: allLanguages,
        aadhaarFrontUrl: documents.aadhaarFront.fileUrl,
        aadhaarBackUrl: documents.aadhaarBack.fileUrl,
        panDocUrl: documents.pan.fileUrl,
        termsAccepted,
        privacyAccepted,
        accuracyConfirmed,
        status: 'pending' as const,
      };

      // 1. Update Context
      await submitMaidApplication(applicationPayload as any);

      // 2. Persist to Supabase `maid_profiles` table
      const isUuid = Boolean(user?.uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.uid));
      const profileId = isUuid && user?.uid
        ? user.uid
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      const dbPayload: any = {
        id: profileId,
        maid_code: partnerCode,
        full_name: fullName,
        phone: phone,
        email: email,
        dob: dob,
        gender: gender,
        emergency_contact: `${emergencyContactName} (${emergencyContactPhone})`,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        address: fullAddressStr,
        full_address: fullAddress,
        locality: locality,
        pincode: pincode,
        city: selectedCity,
        service_area: selectedCity,
        preferred_service_area: selectedCity,
        service_radius_km: serviceRadiusKm,
        working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        working_hours: `${startTime} - ${endTime}`,
        emergency_jobs_accepted: emergencyJobsAccepted,
        skills: selectedServices.map(s => s.serviceName),
        services_provided: partnerProvidedServices,
        languages: allLanguages,
        languages_spoken: allLanguages,
        kyc_documents: {
          aadhaarFrontUrl: documents.aadhaarFront.fileUrl,
          aadhaarBackUrl: documents.aadhaarBack.fileUrl,
          panDocUrl: documents.pan.fileUrl,
          upiId,
        },
        aadhaar_doc_url: documents.aadhaarFront.fileUrl,
        pan_doc_url: documents.pan.fileUrl,
        bank_account_name: bankAccountHolder,
        bank_account_number: accountNumber,
        bank_ifsc: ifscClean,
        bank_name: bankName,
        upi_id: upiId,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        accuracy_confirmed: accuracyConfirmed,
        status: 'pending',
        correction_requested: false,
        applied_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase.from('maid_profiles').upsert(dbPayload);
      if (upsertErr) throw upsertErr;

      // Update customer user_profile to mark maid_application_status
      if (user?.uid) {
        try {
          await supabase
            .from('user_profiles')
            .update({
              maid_application_status: 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.uid);
        } catch (uErr) {
          console.warn('Notice updating user_profiles for partner application:', uErr);
        }
      }

      // 3. Attempt insertion into `partner_services` table
      try {
        const partnerServicesRows = selectedServices.map(s => ({
          partner_id: dbPayload.id || partnerCode,
          service_id: s.serviceId,
          created_at: new Date().toISOString(),
        }));
        await supabase.from('partner_services').upsert(partnerServicesRows, { onConflict: 'partner_id,service_id' });
      } catch (psErr) {
        // Non-blocking if table is pending Supabase migration
      }

      setAppStatus('pending');
      setIsSubmitted(true);
      setCurrentStep(6);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit application. Please check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 6: APPLICATION STATUS & CONFIRMATION SCREEN
  // ─────────────────────────────────────────────────────────────
  if (currentStep === 6 || isSubmitted) {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => navigateTo('become_maid_info')}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>Partner Application</Text>
            <Text style={styles.headerSubtitleText}>Status & Operations Verification</Text>
          </View>
          <View style={styles.reviewPill}>
            <Sparkles size={11} color="#B45309" />
            <Text style={styles.reviewPillText}>
              {appStatus === 'approved'
                ? 'ACTIVE'
                : appStatus === 'correction_requested'
                ? 'ACTION REQUIRED'
                : appStatus === 'rejected'
                ? 'DECLINED'
                : 'UNDER REVIEW'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Status Hero Card */}
          <View style={styles.reviewHeroCard}>
            <View
              style={[
                styles.reviewIconRing,
                appStatus === 'approved' && { backgroundColor: '#DCFCE7' },
                appStatus === 'rejected' && { backgroundColor: '#FEE2E2' },
              ]}
            >
              {appStatus === 'approved' ? (
                <ShieldCheck size={36} color="#166534" />
              ) : appStatus === 'rejected' ? (
                <XCircle size={36} color="#DC2626" />
              ) : (
                <Clock size={36} color="#D97706" />
              )}
            </View>

            <Text style={styles.reviewHeroTitle}>
              {appStatus === 'approved'
                ? 'Application Approved!'
                : appStatus === 'correction_requested'
                ? 'Correction Requested by Admin'
                : appStatus === 'rejected'
                ? 'Application Rejected'
                : 'Pending Operations Verification'}
            </Text>
            <Text style={styles.reviewHeroSub}>
              Hello <Text style={{ fontWeight: '800', color: '#0F172A' }}>{fullName || user?.name}</Text>!{' '}
              {appStatus === 'approved'
                ? 'Your partner profile has been verified and activated. You can now go online to accept service bookings.'
                : appStatus === 'correction_requested'
                ? maidProfile?.adminNotes || 'Admin has requested corrections to your submitted documents. Please edit and resubmit.'
                : appStatus === 'rejected'
                ? maidProfile?.rejectionReason || 'Your application did not meet our verification criteria. Contact support for help.'
                : 'Your multi-service registration application has been received and is currently under verification by our Safety Operations team.'}
            </Text>

            {appStatus === 'pending' && (
              <View style={styles.estTimeBadge}>
                <Sparkles size={13} color="#166534" />
                <Text style={styles.estTimeText}>Estimated Review Time: 2 to 4 Hours</Text>
              </View>
            )}
          </View>

          {/* Action Buttons based on status */}
          {appStatus === 'correction_requested' && (
            <TouchableOpacity
              style={styles.resubmitBtn}
              onPress={() => {
                setIsSubmitted(false);
                setCurrentStep(1);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.resubmitBtnText}>Edit & Resubmit Application</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {appStatus === 'approved' && (
            <TouchableOpacity
              style={styles.approvedDashboardBtn}
              onPress={() => navigateTo('maid_home')}
              activeOpacity={0.88}
            >
              <Text style={styles.approvedDashboardBtnText}>Go to Partner Dashboard</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Application Breakdown Summary */}
          <View style={styles.reviewStepsBox}>
            <Text style={styles.reviewStepsBoxTitle}>Submitted Application Breakdown</Text>

            {/* Step 1: Personal */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Partner ID & Personal Info</Text>
                <Text style={styles.reviewStepSub}>
                  ID #{generatedPartnerId || maidProfile?.maidCode || 'Pending'} • {fullName} ({phone})
                </Text>
              </View>
            </View>

            {/* Step 2: Address & City */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Service Location & City</Text>
                <Text style={styles.reviewStepSub}>
                  {selectedCity ? `${selectedCity} (${pincode})` : `${locality || 'Registered Area'}`}
                </Text>
              </View>
            </View>

            {/* Step 3: Selected Services */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>
                  Services Provided ({selectedServices.length > 0 ? selectedServices.length : 'Configured'})
                </Text>
                <Text style={styles.reviewStepSub}>
                  {selectedServices.length > 0
                    ? selectedServices.map(s => s.serviceName).join(', ')
                    : 'Active Supabase Services Connected'}
                </Text>
              </View>
            </View>

            {/* Step 3: Availability & Hours */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Availability & Dispatch</Text>
                <Text style={styles.reviewStepSub}>
                  Status: {availabilityStatus} • Hours: {startTime} - {endTime} • Radius: {serviceRadiusKm} KM
                </Text>
              </View>
            </View>

            {/* Step 4: Documents */}
            <View style={styles.reviewStepRow}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Document Verification</Text>
                <Text style={styles.reviewStepSub}>
                  Aadhaar Card (Front/Back) & PAN Card attached for KYC
                </Text>
              </View>
            </View>

            {/* Step 5: Bank Details */}
            <View style={[styles.reviewStepRow, { borderBottomWidth: 0 }]}>
              <View style={styles.reviewCheckCircle}>
                <Check size={13} color="#166534" strokeWidth={3} />
              </View>
              <View style={styles.reviewStepTextCol}>
                <Text style={styles.reviewStepTitle}>Payout Bank Account</Text>
                <Text style={styles.reviewStepSub}>
                  {bankName || 'Verified Bank'} (A/C ...{accountNumber.slice(-4) || 'XXXX'}) • IFSC: {ifscCode || 'Verified'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5-STEP REGISTRATION FORM WIZARD
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep > 1) handlePrevStep();
            else navigateTo('become_maid_info');
          }}
          style={styles.headerBackBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Partner Registration</Text>
          <Text style={styles.headerSubtitleText}>Step {currentStep} of 5</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{currentStep} / 5</Text>
        </View>
      </View>

      {/* Progress Bar Indicator */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${(currentStep / 5) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false}>
        {/* ── STEP 1: PERSONAL DETAILS ── */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <User size={20} color="#168A68" />
              <Text style={styles.stepTitle}>Step 1: Personal Details</Text>
            </View>
            <Text style={styles.stepSubTitle}>Enter your basic contact and identity information.</Text>

            {/* Profile Photo Upload */}
            <View style={styles.photoUploadRow}>
              <View style={styles.photoPreviewBox}>
                {profilePhotoUrl ? (
                  <Image source={{ uri: profilePhotoUrl }} style={styles.photoImg} />
                ) : (
                  <User size={36} color="#94A3B8" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoUploadTitle}>Partner Profile Photo</Text>
                <Text style={styles.photoUploadSub}>Clear portrait with good lighting</Text>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={() => {
                    setProfilePhotoUrl(
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
                    );
                    setIsPhotoUploaded(true);
                    Alert.alert('Photo Selected', 'Profile photo attached successfully.');
                  }}
                  activeOpacity={0.8}
                >
                  <Upload size={14} color="#168A68" />
                  <Text style={styles.photoBtnText}>
                    {isPhotoUploaded ? 'Change Photo' : 'Upload Profile Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>Full Legal Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Saroja Devi"
              placeholderTextColor="#94A3B8"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. saroja@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TouchableOpacity
              style={styles.dobSelectorBtn}
              onPress={() => setShowDobModal(true)}
              activeOpacity={0.8}
            >
              <CalendarIcon size={16} color="#168A68" />
              <Text style={[styles.dobSelectorText, !dob && { color: '#94A3B8' }]}>
                {dob ? dob : 'Select Date of Birth (YYYY-MM-DD)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.genderRow}>
              {(['Female', 'Male', 'Other'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderChipText, gender === g && styles.genderChipTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Emergency Contact Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Ramesh Kumar (Husband / Brother)"
              placeholderTextColor="#94A3B8"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
            />

            <Text style={styles.inputLabel}>Emergency Contact Phone *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876501234"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
            />
          </View>
        )}

        {/* ── STEP 2: ADDRESS DETAILS ── */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <MapPin size={20} color="#168A68" />
              <Text style={styles.stepTitle}>Step 2: Address Details</Text>
            </View>

            <AddressEntryForm
              initialValues={{
                houseFlat,
                street,
                locality,
                city: selectedCity,
                district: selectedDistrict,
                state: selectedState,
                pincode,
                postOffice: selectedPostOffice,
              }}
              cityOptions={PARTNER_SUPPORTED_CITIES}
              submitButtonText="Continue"
              onSubmit={handlePartnerAddressSubmit}
            />
          </View>
        )}

        {/* ── STEP 3: SERVICES & AVAILABILITY ── */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <Briefcase size={20} color="#168A68" />
              <Text style={styles.stepTitle}>Step 3: Services & Availability</Text>
            </View>
            <Text style={styles.stepSubTitle}>
              Select active services you provide and configure your operating schedule.
            </Text>

            {/* DYNAMIC SERVICE SELECTOR (Admin Supabase Service Catalog Source of Truth) */}
            <Text style={styles.sectionHeaderLabel}>Services You Provide *</Text>
            <DynamicServiceSelector
              selectedServiceIds={selectedServiceIds}
              onChange={(ids, items) => {
                setSelectedServiceIds(ids);
                setSelectedServices(items);
              }}
            />

            {/* EXPERIENCE (Required) */}
            <Text style={styles.sectionHeaderLabel}>Experience (Years) *</Text>
            <View style={styles.experienceRow}>
              {EXPERIENCE_OPTIONS.map(exp => (
                <TouchableOpacity
                  key={exp}
                  style={[
                    styles.experienceChip,
                    experienceYears === exp && styles.experienceChipSelected,
                  ]}
                  onPress={() => setExperienceYears(exp)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.experienceChipText,
                      experienceYears === exp && styles.experienceChipTextSelected,
                    ]}
                  >
                    {exp} {exp === 1 ? 'Year' : 'Years'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* LANGUAGES (Multiple selection: Telugu, Hindi, English, Other) */}
            <Text style={styles.sectionHeaderLabel}>Languages Spoken *</Text>
            <View style={styles.langChecklist}>
              {STANDARD_LANGUAGES.map(lang => {
                const isChecked = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langRow, isChecked && styles.langRowSelected]}
                    onPress={() => toggleStandardLanguage(lang)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareSelected]}>
                      {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={[styles.langLabel, isChecked && styles.langLabelSelected]}>{lang}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Language input if Other selected */}
            {selectedLanguages.includes('Other') && (
              <View style={styles.customLangSection}>
                <Text style={styles.inputLabel}>Enter Additional Language</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="e.g. Kannada, Marathi, Tamil..."
                    placeholderTextColor="#94A3B8"
                    value={customLanguageInput}
                    onChangeText={setCustomLanguageInput}
                  />
                  <TouchableOpacity
                    style={styles.addCustomLangBtn}
                    onPress={handleAddCustomLanguage}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addCustomLangBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {customLanguagesList.length > 0 && (
                  <View style={styles.chipsWrap}>
                    {customLanguagesList.map(cl => (
                      <View key={cl} style={styles.customLangChip}>
                        <Text style={styles.customLangChipText}>{cl}</Text>
                        <TouchableOpacity onPress={() => handleRemoveCustomLanguage(cl)}>
                          <XCircle size={14} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* AVAILABILITY (Available / Not Available) */}
            <Text style={styles.sectionHeaderLabel}>Partner Availability *</Text>
            <View style={styles.availabilityRow}>
              {(['Available', 'Not Available'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.availabilityCard,
                    availabilityStatus === opt && styles.availabilityCardSelected,
                  ]}
                  onPress={() => setAvailabilityStatus(opt)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      availabilityStatus === opt && styles.radioCircleSelected,
                    ]}
                  >
                    {availabilityStatus === opt && <View style={styles.radioDot} />}
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.availabilityTitle,
                        availabilityStatus === opt && styles.availabilityTitleSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    <Text style={styles.availabilitySub}>
                      {opt === 'Available'
                        ? 'Ready to accept jobs once approved'
                        : 'Temporarily on pause'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* SERVICE RADIUS (Initial dispatch radius: 5 KM) */}
            <View style={styles.radiusHeaderRow}>
              <Text style={styles.sectionHeaderLabel}>Service Radius</Text>
              <Text style={styles.radiusValueBadge}>{serviceRadiusKm} KM</Text>
            </View>
            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, serviceRadiusKm === r && styles.radiusChipSelected]}
                  onPress={() => setServiceRadiusKm(r)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      serviceRadiusKm === r && styles.radiusChipTextSelected,
                    ]}
                  >
                    {r} KM
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* WORKING TIME (Start Time & End Time, validated) */}
            <Text style={styles.sectionHeaderLabel}>Working Time *</Text>
            <View style={styles.timeInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeSubLabel}>Start Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="08:00"
                  placeholderTextColor="#94A3B8"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeSubLabel}>End Time</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="20:00"
                  placeholderTextColor="#94A3B8"
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>
            <Text style={styles.timeHintText}>
              24-hour format (e.g. 08:00 to 20:00). End time must be later than start time.
            </Text>

            {/* EMERGENCY JOBS (Yes / No) */}
            <Text style={styles.sectionHeaderLabel}>Emergency Jobs</Text>
            <TouchableOpacity
              style={styles.emergencyToggleRow}
              onPress={() => setEmergencyJobsAccepted(!emergencyJobsAccepted)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyToggleTitle}>
                  Accept Urgent / Emergency Jobs?
                </Text>
                <Text style={styles.emergencyToggleSub}>
                  Provides priority job dispatch with higher emergency fee compensation
                </Text>
              </View>
              <View
                style={[
                  styles.togglePill,
                  { backgroundColor: emergencyJobsAccepted ? '#168A68' : '#CBD5E1' },
                ]}
              >
                <Text style={styles.togglePillText}>{emergencyJobsAccepted ? 'YES' : 'NO'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 4: DOCUMENT VERIFICATION (Aadhaar & PAN) ── */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <ShieldCheck size={20} color="#168A68" />
              <Text style={styles.stepTitle}>Step 4: Document Verification</Text>
            </View>
            <Text style={styles.stepSubTitle}>
              Upload required identity documents (Aadhaar & PAN). You can upload PDF, image, or take a direct photo.
            </Text>

            <PartnerDocumentPicker
              documents={documents}
              onDocumentChange={handleDocumentChange}
            />
          </View>
        )}

        {/* ── STEP 5: BANK DETAILS & FINAL SUBMIT ── */}
        {currentStep === 5 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <CreditCard size={20} color="#168A68" />
              <Text style={styles.stepTitle}>Step 5: Bank Details & Payouts</Text>
            </View>
            <Text style={styles.stepSubTitle}>
              Direct weekly earnings and bonuses will be credited to this verified account.
            </Text>

            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Saroja Devi"
              placeholderTextColor="#94A3B8"
              value={bankAccountHolder}
              onChangeText={setBankAccountHolder}
            />

            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter 9 to 18 digit account number"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              secureTextEntry
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. State Bank of India / HDFC Bank"
              placeholderTextColor="#94A3B8"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.inputLabel}>Confirm Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter bank name (must match exactly)"
              placeholderTextColor="#94A3B8"
              value={confirmBankName}
              onChangeText={setConfirmBankName}
            />

            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={ifscCode}
              onChangeText={txt => setIfscCode(txt.toUpperCase())}
            />

            <Text style={styles.inputLabel}>UPI Code (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210@upi or mobile@okaxis"
              placeholderTextColor="#94A3B8"
              value={upiId}
              onChangeText={setUpiId}
            />

            {/* Declarations */}
            <View style={styles.declarationsBox}>
              <TouchableOpacity
                style={styles.declarationRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxSquare, termsAccepted && styles.checkboxSquareSelected]}>
                  {termsAccepted && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.declarationText}>
                  I accept the GC HOME+ <Text style={{ fontWeight: '800', color: '#168A68' }}>Terms & Conditions</Text> for Maid Partners.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declarationRow}
                onPress={() => setPrivacyAccepted(!privacyAccepted)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxSquare, privacyAccepted && styles.checkboxSquareSelected]}>
                  {privacyAccepted && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.declarationText}>
                  I agree to the <Text style={{ fontWeight: '800', color: '#168A68' }}>Privacy Policy</Text> and background verification.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declarationRow}
                onPress={() => setAccuracyConfirmed(!accuracyConfirmed)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxSquare, accuracyConfirmed && styles.checkboxSquareSelected]}>
                  {accuracyConfirmed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.declarationText}>
                  I confirm that all submitted details, documents, and banking information are true and accurate.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Complete Registration CTA */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!termsAccepted || !privacyAccepted || !accuracyConfirmed || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleFinalSubmission}
              disabled={!termsAccepted || !privacyAccepted || !accuracyConfirmed || isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Complete Registration</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* DOB Calendar Picker Modal */}
      <Modal visible={showDobModal} transparent animationType="fade" onRequestClose={() => setShowDobModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dobModalCard}>
            <Text style={styles.dobModalTitle}>Select Date of Birth</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Day (DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={dobDay}
                  onChangeText={setDobDay}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Month (MM)</Text>
                <TextInput
                  style={styles.textInput}
                  value={dobMonth}
                  onChangeText={setDobMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Year (YYYY)</Text>
                <TextInput
                  style={styles.textInput}
                  value={dobYear}
                  onChangeText={setDobYear}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.dobConfirmBtn} onPress={handleConfirmDob} activeOpacity={0.88}>
              <Text style={styles.dobConfirmBtnText}>Confirm Birth Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Stepper Bar */}
      {currentStep < 6 && !isSubmitted && (
        <View style={styles.bottomNavContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.prevBtn} onPress={handlePrevStep} activeOpacity={0.7}>
              <ArrowLeft size={16} color="#0F172A" />
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep < 5 && currentStep !== 2 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep} activeOpacity={0.88}>
              <Text style={styles.nextBtnText}>Next Step</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#168A68',
  },
  formScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  sectionHeaderLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  photoPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  photoUploadSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#168A68',
    alignSelf: 'flex-start',
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#168A68',
  },
  dobSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dobSelectorText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  genderChipSelected: {
    borderColor: '#168A68',
    backgroundColor: '#E6F4F1',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  genderChipTextSelected: {
    color: '#168A68',
  },
  experienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  experienceChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  experienceChipSelected: {
    borderColor: '#168A68',
    backgroundColor: '#E6F4F1',
  },
  experienceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  experienceChipTextSelected: {
    color: '#168A68',
  },
  langChecklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  langRowSelected: {
    borderColor: '#168A68',
    backgroundColor: '#E6F4F1',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareSelected: {
    borderColor: '#168A68',
    backgroundColor: '#168A68',
  },
  langLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  langLabelSelected: {
    color: '#168A68',
    fontWeight: '700',
  },
  customLangSection: {
    marginTop: 12,
  },
  addCustomLangBtn: {
    backgroundColor: '#168A68',
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomLangBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  customLangChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  customLangChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  availabilityRow: {
    gap: 10,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  availabilityCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#168A68',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#168A68',
  },
  availabilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  availabilityTitleSelected: {
    color: '#166534',
  },
  availabilitySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  radiusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  radiusValueBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#168A68',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  radiusChipSelected: {
    borderColor: '#168A68',
    backgroundColor: '#E6F4F1',
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusChipTextSelected: {
    color: '#168A68',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  timeHintText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  emergencyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  emergencyToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  emergencyToggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  declarationsBox: {
    marginTop: 18,
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  declarationText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#168A68',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#168A68',
    marginLeft: 'auto',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dobModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  dobModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dobConfirmBtn: {
    backgroundColor: '#168A68',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dobConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
  },
  reviewHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  reviewIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reviewHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  reviewHeroSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  estTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 14,
  },
  estTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  reviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  reviewPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  resubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  resubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  approvedDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  approvedDashboardBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reviewStepsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  reviewStepsBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  reviewStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reviewCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewStepTextCol: {
    flex: 1,
  },
  reviewStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewStepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
