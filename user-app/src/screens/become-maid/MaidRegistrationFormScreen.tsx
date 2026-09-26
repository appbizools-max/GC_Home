import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { authService } from '../../services/authService';
import { MaidApplicationStatus } from '../../types';
import { AddressEntryForm, AddressFormData } from '../../components/address/AddressEntryForm';
import { DynamicServiceSelector, SelectedServiceItem } from './components/DynamicServiceSelector';
import { PartnerDocumentPicker, DocItemState, UploadedDocItem } from './components/PartnerDocumentPicker';
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker';
import { NativeTimePicker, parseTimeString } from './components/NativeTimePicker';
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Clock,
  Check,
  XCircle,
  ArrowRight,
  Upload,
  Calendar as CalendarIcon,
  Globe,
  Radio,
  Edit3,
} from 'lucide-react-native';

const STANDARD_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Other'];
const RADIUS_OPTIONS = [5, 10, 15, 20];
const EXPERIENCE_OPTIONS = [
  '0–1 Years',
  '1–2 Years',
  '2–3 Years',
  '3–5 Years',
  '5–10 Years',
  '10+ Years',
];

export const PARTNER_SUPPORTED_CITIES = [
  'Karimnagar',
  'Kazipet',
  'Hanamkonda',
  'Warangal',
];

export const MaidRegistrationFormScreen: React.FC = () => {
  const { navigateTo, user, submitMaidApplication, maidProfile, savedAddresses, navigationPayload } = useAuth();

  // Application Flow State (Steps 1 to 5, Step 6 = Review & Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [appStatus, setAppStatus] = useState<MaidApplicationStatus>('none');
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSavingStep, setIsSavingStep] = useState<boolean>(false);

  // ── Step 1: Personal Details ──
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [dob, setDob] = useState('');
  const [showDobModal, setShowDobModal] = useState(false);
  const [dobYear, setDobYear] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');

  // Auto-advance input refs for DOB
  const dayInputRef = useRef<TextInput>(null);
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  // Keyboard & Scroll awareness for automatic field scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleInputFocus = useCallback((event: any) => {
    const target = event?.target;
    if (!target || !scrollViewRef.current) return;
    setTimeout(() => {
      try {
        const scrollResponder = (scrollViewRef.current as any)?.getScrollResponder?.();
        if (scrollResponder && typeof scrollResponder.scrollNativeHandleToKeyboard === 'function') {
          scrollResponder.scrollNativeHandleToKeyboard(target, 110, true);
        }
      } catch (err) {
        // ignore
      }
    }, 100);
  }, []);

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

  // ── Step 2: Preferred Work City (Multi-select checkboxes) ──
  const [availableCities, setAvailableCities] = useState<string[]>(PARTNER_SUPPORTED_CITIES);
  const [preferredWorkCities, setPreferredWorkCities] = useState<string[]>([]);

  // ── Step 3: Services & Availability ──
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedSubServiceIds, setSelectedSubServiceIds] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [experienceRange, setExperienceRange] = useState<string>('2–3 Years');
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Telugu', 'English']);
  const [customLanguageInput, setCustomLanguageInput] = useState('');
  const [customLanguagesList, setCustomLanguagesList] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Not Available'>('Available');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(5);
  const [startTime, setStartTime] = useState<string>('09:00 AM');
  const [endTime, setEndTime] = useState<string>('06:00 PM');
  const [emergencyJobsAccepted, setEmergencyJobsAccepted] = useState<boolean>(true);

  // ── Step 4: Document Verification ──
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocItem[]>([]);
  const [documents, setDocuments] = useState<{
    aadhaarFront: DocItemState;
    aadhaarBack: DocItemState;
    pan: DocItemState;
  }>({
    aadhaarFront: {
      id: 'aadhaar_front',
      name: 'Verification Document 1',
      subTitle: 'Uploaded verification document',
      required: false,
      uploaded: false,
    },
    aadhaarBack: {
      id: 'aadhaar_back',
      name: 'Verification Document 2',
      subTitle: 'Uploaded verification document',
      required: false,
      uploaded: false,
    },
    pan: {
      id: 'pan',
      name: 'Verification Document 3',
      subTitle: 'Uploaded verification document',
      required: false,
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

  // ── Step 6: Mobile OTP Verification State ──
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [otpError, setOtpError] = useState('');
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for Partner Registration OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOtpModal && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpCountdown]);

  // Stable Profile ID helper to prevent duplicate partner records
  const getStableProfileId = useCallback(async (): Promise<string> => {
    if (user?.uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.uid)) {
      return user.uid;
    }
    const key = `@gc_partner_draft_id_${user?.uid || phone || 'default'}`;
    const existing = await AsyncStorage.getItem(key);
    if (existing) return existing;
    const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(key, newId);
    return newId;
  }, [user?.uid, phone]);

  // ── PAGE-WISE DRAFT PERSISTENCE (Saves complete step data together, no field-by-field DB thrashing) ──
  const saveStepData = useCallback(async (stepNumber: number): Promise<boolean> => {
    setIsSavingStep(true);
    setDraftStatus('saving');

    try {
      const newCompleted = Math.max(completedSteps, stepNumber);
      setCompletedSteps(newCompleted);

      const profileId = await getStableProfileId();
      const fullAddressStr = `${houseFlat || fullAddress}${street ? ', ' + street : ''}, ${locality}, ${selectedCity} ${pincode}`;
      const citiesArr = preferredWorkCities || [];
      const citiesStr = citiesArr.join(', ') || selectedCity || '';
      const activeDocsList: UploadedDocItem[] = uploadedDocs || [];
      const partnerProvidedServices = selectedServices.map(s => ({
        id: s.serviceId,
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        category: s.category || '',
        experienceYears,
      }));
      const allLanguages = [
        ...selectedLanguages.filter(l => l !== 'Other'),
        ...customLanguagesList,
      ];
      const pStart = parseTimeString(startTime);
      const pEnd = parseTimeString(endTime);

      const draftPayload = {
        fullName,
        phone,
        email,
        gender,
        dob,
        emergencyContactName,
        emergencyContactPhone,
        profilePhotoUrl,
        houseFlat,
        street,
        locality,
        selectedCity,
        selectedDistrict,
        selectedState,
        selectedPostOffice,
        pincode,
        fullAddress,
        preferredWorkCities,
        selectedServiceIds,
        selectedSubServiceIds,
        selectedServices: partnerProvidedServices,
        experienceRange,
        experienceYears,
        selectedLanguages: allLanguages,
        customLanguagesList,
        availabilityStatus,
        serviceRadiusKm,
        startTime,
        endTime,
        emergencyJobsAccepted,
        uploadedDocs: activeDocsList,
        documents,
        bankAccountHolder,
        bankName,
        confirmBankName,
        accountNumber,
        confirmAccountNumber,
        ifscCode,
        upiId,
        termsAccepted,
        privacyAccepted,
        accuracyConfirmed,
        currentStep: Math.min(stepNumber + 1, 6),
        completedSteps: newCompleted,
        lastSavedStep: stepNumber,
        status: 'draft',
        registrationStatus: 'DRAFT',
      };

      // 1. Save complete page draft to AsyncStorage (keep draft local, do not prematurely insert into Supabase)
      const key = `@gc_partner_draft_${user?.uid || phone || 'default'}`;
      await AsyncStorage.setItem(key, JSON.stringify(draftPayload));

      setDraftStatus('saved');
      setIsSavingStep(false);
      return true;
    } catch (err: any) {
      console.error('Error saving step draft:', err);
      setIsSavingStep(false);
      setDraftStatus('idle');
      Alert.alert(
        'Save Failed',
        `Unable to save Step ${stepNumber} information. Please check your network connection and try again.`
      );
      return false;
    }
  }, [
    completedSteps, getStableProfileId, user, phone, fullName, email, gender, dob,
    emergencyContactName, emergencyContactPhone, profilePhotoUrl, houseFlat, street,
    locality, selectedCity, selectedDistrict, selectedState, selectedPostOffice, pincode,
    fullAddress, preferredWorkCities, selectedServiceIds, selectedServices, experienceYears,
    selectedLanguages, customLanguagesList, availabilityStatus, serviceRadiusKm, startTime,
    endTime, emergencyJobsAccepted, uploadedDocs, documents, bankAccountHolder, bankName,
    confirmBankName, accountNumber, confirmAccountNumber, ifscCode, upiId, termsAccepted,
    privacyAccepted, accuracyConfirmed
  ]);

  // Profile Photo Delete Handler (Removes from UI, storage, database, cache, and draft state)
  const handlePhotoDelete = async () => {
    setProfilePhotoUrl('');
    setIsPhotoUploaded(false);

    try {
      const key = `@gc_partner_draft_${user?.uid || phone || 'default'}`;
      const savedStr = await AsyncStorage.getItem(key);
      if (savedStr) {
        const d = JSON.parse(savedStr);
        d.profilePhotoUrl = '';
        await AsyncStorage.setItem(key, JSON.stringify(d));
      }
    } catch (e) {
      console.warn('AsyncStorage photo clear notice:', e);
    }

    try {
      const profileId = await getStableProfileId();
      if (profileId) {
        await supabase.from('maid_profiles').update({
          photo_url: null,
          kyc_documents: {
            documents: uploadedDocs,
            profilePhotoUrl: '',
          },
        }).eq('id', profileId);
      }
    } catch (e) {
      console.warn('Supabase photo clear notice:', e);
    }
  };

  // Dynamic Cities Fetch from Admin/Supabase service_areas
  useEffect(() => {
    const fetchSupportedCities = async () => {
      try {
        const { data, error } = await supabase
          .from('service_areas')
          .select('city')
          .or('is_active.eq.true,is_serviceable.eq.true');
        if (!error && data && data.length > 0) {
          const uniqueCities = Array.from(new Set(data.map((d: any) => d.city?.trim()).filter(Boolean))) as string[];
          if (uniqueCities.length > 0) {
            const combined = Array.from(new Set([...PARTNER_SUPPORTED_CITIES, ...uniqueCities]));
            setAvailableCities(combined);
          }
        }
      } catch (err) {
        // Fallback silently to PARTNER_SUPPORTED_CITIES
      }
    };
    fetchSupportedCities();
  }, []);

  // Pre-fill user profile details & saved address if empty
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!phone && user.phone) setPhone(user.phone);
      if (!email && user.email) setEmail(user.email);
      if (!bankAccountHolder && user.name) setBankAccountHolder(user.name);
    }
    if (savedAddresses && savedAddresses.length > 0 && !houseFlat && !locality && !pincode) {
      const def = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      if (def) {
        if (def.houseFlat) setHouseFlat(def.houseFlat);
        if (def.street) setStreet(def.street);
        if (def.locality) setLocality(def.locality);
        if (def.city && PARTNER_SUPPORTED_CITIES.includes(def.city)) setSelectedCity(def.city);
        if (def.district) setSelectedDistrict(def.district || '');
        if (def.state) setSelectedState(def.state || '');
        if (def.pincode) setPincode(def.pincode);
        if (def.fullAddress) setFullAddress(def.fullAddress);
      }
    }
  }, [user, savedAddresses]);

  // Handle Re-Application intent from navigation payload
  useEffect(() => {
    if (navigationPayload?.isReapplication) {
      setIsSubmitted(false);
      setCurrentStep(1);
    }
  }, [navigationPayload]);

  // Restore Draft on Mount (Resumes from the appropriate step, preserving all completed data)
  useEffect(() => {
    const restoreDraft = async () => {
      if (
        !navigationPayload?.isReapplication &&
        (maidProfile?.status === 'pending' ||
        maidProfile?.status === 'approved' ||
        maidProfile?.status === 'rejected' ||
        maidProfile?.status === 'correction_requested')
      ) {
        return;
      }

      try {
        const key = `@gc_partner_draft_${user?.uid || phone || 'default'}`;
        const savedStr = await AsyncStorage.getItem(key);
        if (savedStr) {
          const d = JSON.parse(savedStr);
          if (d.fullName) setFullName(d.fullName);
          if (d.phone) setPhone(d.phone);
          if (d.email) setEmail(d.email);
          if (d.gender) setGender(d.gender);
          if (d.dob) setDob(normalizeDobToDDMMYYYY(d.dob));
          if (d.emergencyContactName) setEmergencyContactName(d.emergencyContactName);
          if (d.emergencyContactPhone) setEmergencyContactPhone(d.emergencyContactPhone);

          // Explicitly restore profile photo handling empty string as deleted
          if (d.profilePhotoUrl !== undefined) {
            setProfilePhotoUrl(d.profilePhotoUrl || '');
            setIsPhotoUploaded(Boolean(d.profilePhotoUrl));
          }

          if (d.houseFlat) setHouseFlat(d.houseFlat);
          if (d.street) setStreet(d.street);
          if (d.locality) setLocality(d.locality);
          if (d.selectedCity) setSelectedCity(d.selectedCity);
          if (d.selectedDistrict) setSelectedDistrict(d.selectedDistrict);
          if (d.selectedState) setSelectedState(d.selectedState);
          if (d.selectedPostOffice) setSelectedPostOffice(d.selectedPostOffice);
          if (d.pincode) setPincode(d.pincode);
          if (d.fullAddress) setFullAddress(d.fullAddress);
          if (Array.isArray(d.preferredWorkCities) && d.preferredWorkCities.length > 0) {
            setPreferredWorkCities(d.preferredWorkCities);
          } else if (d.preferredWorkCity) {
            setPreferredWorkCities([d.preferredWorkCity]);
          }
          if (Array.isArray(d.selectedServiceIds)) setSelectedServiceIds(d.selectedServiceIds);
          if (Array.isArray(d.selectedSubServiceIds)) setSelectedSubServiceIds(d.selectedSubServiceIds);
          if (Array.isArray(d.selectedServices)) setSelectedServices(d.selectedServices);
          if (d.experienceRange) {
            setExperienceRange(d.experienceRange);
          } else if (d.experienceYears) {
            const y = Number(d.experienceYears);
            if (y <= 1) setExperienceRange('0–1 Years');
            else if (y <= 2) setExperienceRange('1–2 Years');
            else if (y <= 3) setExperienceRange('2–3 Years');
            else if (y <= 5) setExperienceRange('3–5 Years');
            else if (y <= 10) setExperienceRange('5–10 Years');
            else setExperienceRange('10+ Years');
          }
          if (d.experienceYears) setExperienceYears(d.experienceYears);
          if (Array.isArray(d.selectedLanguages)) setSelectedLanguages(d.selectedLanguages);
          if (Array.isArray(d.customLanguagesList)) setCustomLanguagesList(d.customLanguagesList);
          if (d.availabilityStatus) setAvailabilityStatus(d.availabilityStatus);
          if (d.serviceRadiusKm) setServiceRadiusKm(d.serviceRadiusKm);
          if (d.startTime) setStartTime(d.startTime);
          if (d.endTime) setEndTime(d.endTime);
          if (d.emergencyJobsAccepted !== undefined) setEmergencyJobsAccepted(d.emergencyJobsAccepted);
          if (Array.isArray(d.uploadedDocs) && d.uploadedDocs.length > 0) {
            setUploadedDocs(d.uploadedDocs);
          }
          if (d.documents) setDocuments(d.documents);
          if (d.bankAccountHolder) setBankAccountHolder(d.bankAccountHolder);
          if (d.bankName) setBankName(d.bankName);
          if (d.confirmBankName) setConfirmBankName(d.confirmBankName);
          if (d.accountNumber) {
            setAccountNumber(d.accountNumber);
            setConfirmAccountNumber(d.accountNumber);
          }
          if (d.ifscCode) setIfscCode(d.ifscCode);
          if (d.upiId) setUpiId(d.upiId);
          if (d.termsAccepted) setTermsAccepted(d.termsAccepted);
          if (d.privacyAccepted) setPrivacyAccepted(d.privacyAccepted);
          if (d.accuracyConfirmed) setAccuracyConfirmed(d.accuracyConfirmed);

          const savedComp = d.completedSteps || 0;
          setCompletedSteps(savedComp);

          // Resume from the next step after completed steps
          const resumeStep = Math.min(Math.max(savedComp + 1, d.currentStep || 1), 6);
          setCurrentStep(resumeStep);

          setDraftStatus('saved');
          return;
        }

        // If no local draft, check if Supabase maid_profiles has a draft row
        if (user?.uid) {
          const { data: dbDraft } = await supabase
            .from('maid_profiles')
            .select('*')
            .eq('id', user.uid)
            .maybeSingle();

          if (dbDraft && !dbDraft.submitted_at && dbDraft.status !== 'approved') {
            if (dbDraft.full_name) setFullName(dbDraft.full_name);
            if (dbDraft.phone) setPhone(dbDraft.phone);
            if (dbDraft.email) setEmail(dbDraft.email);
            if (dbDraft.photo_url !== undefined) {
              setProfilePhotoUrl(dbDraft.photo_url || '');
              setIsPhotoUploaded(Boolean(dbDraft.photo_url));
            }
            if (dbDraft.dob) setDob(normalizeDobToDDMMYYYY(dbDraft.dob));
            if (dbDraft.gender) setGender(dbDraft.gender);
            if (dbDraft.emergency_contact_name) setEmergencyContactName(dbDraft.emergency_contact_name);
            if (dbDraft.emergency_contact_phone) setEmergencyContactPhone(dbDraft.emergency_contact_phone);
            if (dbDraft.locality) setLocality(dbDraft.locality);
            if (dbDraft.city) setSelectedCity(dbDraft.city);
            if (dbDraft.pincode) setPincode(dbDraft.pincode);
            if (dbDraft.full_address) setFullAddress(dbDraft.full_address);
            if (Array.isArray(dbDraft.preferred_cities) && dbDraft.preferred_cities.length > 0) {
              setPreferredWorkCities(dbDraft.preferred_cities);
            } else if (dbDraft.service_area) {
              setPreferredWorkCities(dbDraft.service_area.split(',').map((s: string) => s.trim()));
            }
            if (Array.isArray(dbDraft.services_provided)) setSelectedServices(dbDraft.services_provided);
            if (Array.isArray(dbDraft.languages_spoken)) setSelectedLanguages(dbDraft.languages_spoken);

            const dbKyc = dbDraft.kyc_documents;
            if (dbKyc && Array.isArray(dbKyc.documents) && dbKyc.documents.length > 0) {
              setUploadedDocs(dbKyc.documents);
            }

            if (dbDraft.bank_account_name) setBankAccountHolder(dbDraft.bank_account_name);
            if (dbDraft.bank_account_number) {
              setAccountNumber(dbDraft.bank_account_number);
              setConfirmAccountNumber(dbDraft.bank_account_number);
            }
            if (dbDraft.bank_name) {
              setBankName(dbDraft.bank_name);
              setConfirmBankName(dbDraft.bank_name);
            }
            if (dbDraft.bank_ifsc) setIfscCode(dbDraft.bank_ifsc);
            if (dbDraft.upi_id) setUpiId(dbDraft.upi_id);
            setDraftStatus('saved');
          }
        }
      } catch (e) {
        console.warn('Draft restoration notice:', e);
      }
    };

    restoreDraft();
  }, [user?.uid, maidProfile?.status]);

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
        if (navigationPayload?.isReapplication) {
          setIsSubmitted(false);
          setCurrentStep(1);
        } else {
          setIsSubmitted(true);
          setCurrentStep(7); // Show confirmation/status screen
        }
        setGeneratedPartnerId(maidProfile.maidCode || '');

        if (maidProfile.fullName) setFullName(maidProfile.fullName);
        if (maidProfile.phone) setPhone(maidProfile.phone);
        if (maidProfile.email) setEmail(maidProfile.email);
        if (maidProfile.dob) setDob(normalizeDobToDDMMYYYY(maidProfile.dob));
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
        if ((maidProfile as any).preferred_cities && Array.isArray((maidProfile as any).preferred_cities) && (maidProfile as any).preferred_cities.length > 0) {
          setPreferredWorkCities((maidProfile as any).preferred_cities);
        } else if ((maidProfile as any).preferred_service_area) {
          setPreferredWorkCities((maidProfile as any).preferred_service_area.split(',').map((s: string) => s.trim()));
        } else if (maidProfile.city && PARTNER_SUPPORTED_CITIES.includes(maidProfile.city)) {
          setPreferredWorkCities([maidProfile.city]);
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

        const rawKyc = (maidProfile as any).kyc_documents;
        if (rawKyc && Array.isArray(rawKyc.documents) && rawKyc.documents.length > 0) {
          setUploadedDocs(rawKyc.documents);
        }
      }
    }
  }, [maidProfile, navigationPayload]);

  // Language toggles
  const toggleStandardLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleAddCustomLanguage = () => {
    if (!customLanguageInput.trim()) return;
    const clean = customLanguageInput.trim();
    if (!customLanguagesList.includes(clean)) {
      setCustomLanguagesList(prev => [...prev, clean]);
    }
    setCustomLanguageInput('');
  };

  const handleRemoveCustomLanguage = (lang: string) => {
    setCustomLanguagesList(prev => prev.filter(l => l !== lang));
  };

  // Normalize any incoming DOB to strict Date – Month – Year (DD-MM-YYYY)
  const normalizeDobToDDMMYYYY = (val: string): string => {
    if (!val) return '';
    const clean = val.trim();
    // YYYY-MM-DD
    const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
    }
    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
    }
    return clean;
  };

  const openDobModal = () => {
    if (dob) {
      const clean = normalizeDobToDDMMYYYY(dob);
      const parts = clean.split('-');
      if (parts.length === 3) {
        setDobDay(parts[0]);
        setDobMonth(parts[1]);
        setDobYear(parts[2]);
      }
    } else {
      if (!dobDay) setDobDay('');
      if (!dobMonth) setDobMonth('');
      if (!dobYear) setDobYear('1995');
    }
    setShowDobModal(true);
  };

  const handleDayChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 2);
    setDobDay(clean);
    if (clean.length === 2 && monthInputRef.current) {
      monthInputRef.current.focus();
    }
  };

  const handleMonthChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 2);
    setDobMonth(clean);
    if (clean.length === 2 && yearInputRef.current) {
      yearInputRef.current.focus();
    }
  };

  const handleYearChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    setDobYear(clean);
  };

  const handleConfirmDob = () => {
    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(d) || d < 1 || d > 31) {
      Alert.alert('Invalid Date', 'Please enter a valid Day between 01 and 31.');
      return;
    }
    if (isNaN(m) || m < 1 || m > 12) {
      Alert.alert('Invalid Month', 'Please enter a valid Month between 01 and 12.');
      return;
    }
    const maxDays = new Date(y, m, 0).getDate();
    if (d > maxDays) {
      Alert.alert('Invalid Date', `The selected month only has ${maxDays} days.`);
      return;
    }
    if (isNaN(y) || y < 1940 || y > currentYear) {
      Alert.alert('Invalid Year', `Please enter a valid 4-digit Year between 1940 and ${currentYear}.`);
      return;
    }
    if (currentYear - y < 18) {
      Alert.alert('Age Requirement', 'Partner applicants must be at least 18 years of age to register.');
      return;
    }

    const formatted = `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(y)}`;
    setDob(formatted);
    setShowDobModal(false);
  };

  // Step 2 Multi-City Preference Toggle
  const toggleWorkCity = (cityName: string) => {
    setPreferredWorkCities(prev =>
      prev.includes(cityName) ? prev.filter(c => c !== cityName) : [...prev, cityName]
    );
  };

  const handlePartnerAddressSubmit = (data: AddressFormData) => {
    setHouseFlat(data.houseFlat);
    setStreet(data.street);
    setLocality(data.locality);
    setSelectedCity(data.city);
    setSelectedDistrict(data.district || '');
    setSelectedState(data.state);
    setPincode(data.pincode);
    setSelectedPostOffice(data.postOffice || '');
    setFullAddress(`${data.houseFlat}${data.street ? ', ' + data.street : ''}`);
  };

  // Document Handlers
  const handleDocumentsChange = (docs: UploadedDocItem[]) => {
    setUploadedDocs(docs);
  };

  // ── Step Navigation & Page-Wise Saving ──
  const handleStep1Next = async () => {
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
      Alert.alert('Date of Birth Required', 'Please enter your Date of Birth in DD-MM-YYYY format.');
      return;
    }
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dob.trim())) {
      Alert.alert('Invalid Date Format', 'Please enter your Date of Birth in DD-MM-YYYY format (e.g. 15-06-1995).');
      return;
    }
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      Alert.alert('Emergency Contact Required', 'Please provide an emergency contact name and phone number.');
      return;
    }

    const saved = await saveStepData(1);
    if (saved) {
      setCurrentStep(2);
    }
  };

  const handleStep2Next = async () => {
    const hasHouse = houseFlat.trim() || fullAddress.trim();
    if (!hasHouse || !locality.trim() || !pincode.trim() || !selectedCity.trim()) {
      Alert.alert('Complete Address Required', 'Please fill in your address, locality, pincode, and select your city.');
      return;
    }
    if (pincode.replace(/\D/g, '').length < 6) {
      Alert.alert('Valid Pincode Required', 'Please enter a valid 6-digit pincode.');
      return;
    }
    if (preferredWorkCities.length === 0) {
      Alert.alert('Preferred Work City Required', 'Please select at least one city where you want to provide services.');
      return;
    }

    const saved = await saveStepData(2);
    if (saved) {
      setCurrentStep(3);
    }
  };

  const handleStep3Next = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Services Required', 'Please select at least one service you provide.');
      return;
    }
    if (!experienceRange) {
      Alert.alert('Experience Required', 'Please select your years of experience.');
      return;
    }
    if (selectedLanguages.length === 0 && customLanguagesList.length === 0) {
      Alert.alert('Language Required', 'Please select at least 1 language you speak.');
      return;
    }

    const pStart = parseTimeString(startTime);
    const pEnd = parseTimeString(endTime);
    if (pEnd.totalMinutes <= pStart.totalMinutes) {
      Alert.alert(
        'Invalid Working Hours',
        `End time (${pEnd.display12}) cannot be earlier than or equal to start time (${pStart.display12}). Please adjust your schedule.`
      );
      return;
    }

    const saved = await saveStepData(3);
    if (saved) {
      setCurrentStep(4);
    }
  };

  const handleStep4Next = async () => {
    // Document upload is optional during registration; can be uploaded later from Partner Profile
    const saved = await saveStepData(4);
    if (saved) {
      setCurrentStep(5);
    }
  };

  const handleSkipStep4 = async () => {
    const saved = await saveStepData(4);
    if (saved) {
      setCurrentStep(5);
    }
  };

  const handleStep5Next = async () => {
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

    if (!termsAccepted || !privacyAccepted || !accuracyConfirmed) {
      Alert.alert(
        'Declarations Required',
        'Please check all three boxes confirming Terms, Privacy Policy, and Information Accuracy to complete registration.'
      );
      return;
    }

    // Save complete Step 5 data and advance to Step 6: Review Application
    const saved = await saveStepData(5);
    if (saved) {
      setCurrentStep(6);
    }
  };

  // Back button handler (Preserves all state; never erases typed inputs)
  const handlePrevStep = () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
  };

  // ── ATOMIC FINAL REGISTRATION SUBMISSION (Step 6 Review -> Submit Registration) ──
  const handleFinalSubmission = async () => {
    setIsSubmitting(true);
    try {
      // 1. Backend Active Service Verification
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
            `The service "${inactive[0].name}" is currently deactivated in the Admin catalog. Please remove it and choose from available services.`
          );
          setIsSubmitting(false);
          setCurrentStep(3);
          return;
        }
      }

      const profileId = await getStableProfileId();
      let partnerCode = maidProfile?.maidCode || generatedPartnerId;
      if (!partnerCode) {
        const { data: existingProfile } = await supabase
          .from('maid_profiles')
          .select('maid_code')
          .eq('id', profileId)
          .maybeSingle();
        if (existingProfile?.maid_code) {
          partnerCode = existingProfile.maid_code;
        } else {
          partnerCode = `GC-PARTNER-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }
      setGeneratedPartnerId(partnerCode);

      const allLanguages = [
        ...selectedLanguages.filter(l => l !== 'Other'),
        ...customLanguagesList,
      ];

      const fullAddressStr = `${houseFlat || fullAddress}${street ? ', ' + street : ''}, ${locality}, ${selectedCity} ${pincode}`;
      const citiesStr = preferredWorkCities.join(', ') || selectedCity;
      const pStart = parseTimeString(startTime);
      const pEnd = parseTimeString(endTime);
      const ifscClean = ifscCode.trim().toUpperCase();

      const partnerProvidedServices = selectedServices.map(s => ({
        id: s.serviceId,
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        category: s.category || '',
        experienceYears,
        experienceRange,
        subServices: s.subServices || [],
      }));

      const applicationPayload = {
        maidCode: partnerCode,
        fullName,
        phone,
        email,
        dob,
        gender,
        photoUrl: profilePhotoUrl || '',
        idProofUrl: uploadedDocs[0]?.fileUrl || documents?.aadhaarFront?.fileUrl || '',
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
        serviceArea: citiesStr,
        preferredServiceArea: citiesStr,
        preferredCities: preferredWorkCities,
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
        workingHours: `${pStart.display12} - ${pEnd.display12}`,
        availableHours: `${pStart.display12} - ${pEnd.display12}`,
        startTime: pStart.time24,
        endTime: pEnd.time24,
        emergencyJobsAccepted,
        servicesProvided: partnerProvidedServices,
        languagesSpoken: allLanguages,
        documents: uploadedDocs,
        aadhaarFrontUrl: uploadedDocs[0]?.fileUrl || documents?.aadhaarFront?.fileUrl || null,
        aadhaarBackUrl: uploadedDocs[1]?.fileUrl || documents?.aadhaarBack?.fileUrl || null,
        panDocUrl: uploadedDocs[2]?.fileUrl || documents?.pan?.fileUrl || null,
        documentsSkipped: uploadedDocs.length === 0,
        termsAccepted,
        privacyAccepted,
        accuracyConfirmed,
        status: 'pending' as const,
      };

      // Check & preserve previous application history for re-application
      let existingHistory: any[] = [];
      let currentReappCount = 0;

      try {
        const { data: existingMaidRow } = await supabase
          .from('maid_profiles')
          .select('id, application_history, reapplication_count, status, rejection_reason, rejected_at, applied_at, photo_url, services_provided, preferred_cities')
          .eq('id', profileId)
          .maybeSingle();

        if (existingMaidRow) {
          existingHistory = Array.isArray(existingMaidRow.application_history)
            ? [...existingMaidRow.application_history]
            : [];
          currentReappCount = existingMaidRow.reapplication_count || 0;

          if (existingMaidRow.status === 'rejected' || existingMaidRow.applied_at) {
            existingHistory.push({
              version: currentReappCount + 1,
              status: existingMaidRow.status || 'rejected',
              rejectionReason: existingMaidRow.rejection_reason || 'Previous application submission',
              rejectedAt: existingMaidRow.rejected_at || new Date().toISOString(),
              appliedAt: existingMaidRow.applied_at || new Date().toISOString(),
              photoUrl: existingMaidRow.photo_url || '',
              servicesProvided: existingMaidRow.services_provided || [],
              preferredCities: existingMaidRow.preferred_cities || [],
              archivedAt: new Date().toISOString(),
            });
            currentReappCount += 1;
          }
        }
      } catch (histFetchErr) {
        console.warn('Could not read existing application history:', histFetchErr);
      }

      // Update Context with history metadata
      await submitMaidApplication({
        ...applicationPayload,
        reapplicationCount: currentReappCount,
        latestAppliedAt: new Date().toISOString(),
        applicationHistory: existingHistory,
      } as any);

      // Persist Final Application to Supabase `maid_profiles` (status: 'pending' for Admin KYC Review)
      const dbPayload: any = {
        id: profileId,
        maid_code: partnerCode,
        full_name: fullName,
        phone: phone,
        email: email,
        photo_url: profilePhotoUrl || null,
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
        service_area: citiesStr,
        preferred_service_area: citiesStr,
        preferred_cities: preferredWorkCities,
        service_radius_km: serviceRadiusKm,
        working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        working_hours: `${pStart.display12} - ${pEnd.display12}`,
        emergency_jobs_accepted: emergencyJobsAccepted,
        skills: selectedServices.map(s => s.serviceName),
        services_provided: partnerProvidedServices,
        languages: allLanguages,
        languages_spoken: allLanguages,
        kyc_documents: {
          profilePhotoUrl: profilePhotoUrl || '',
          documents: uploadedDocs,
          aadhaarFrontUrl: uploadedDocs[0]?.fileUrl || documents?.aadhaarFront?.fileUrl || null,
          aadhaarBackUrl: uploadedDocs[1]?.fileUrl || documents?.aadhaarBack?.fileUrl || null,
          panDocUrl: uploadedDocs[2]?.fileUrl || documents?.pan?.fileUrl || null,
          upiId,
          skipped: uploadedDocs.length === 0,
        },
        aadhaar_doc_url: uploadedDocs[0]?.fileUrl || documents?.aadhaarFront?.fileUrl || null,
        pan_doc_url: uploadedDocs[1]?.fileUrl || documents?.pan?.fileUrl || null,
        other_docs_urls: uploadedDocs.map(d => d.fileUrl),
        bank_account_name: bankAccountHolder,
        bank_account_number: accountNumber,
        bank_ifsc: ifscClean,
        bank_name: bankName,
        upi_id: upiId,
        health_safety_decl: true,
        terms_accepted: true,
        privacy_accepted: true,
        accuracy_confirmed: true,
        status: 'pending',
        application_status: 'pending',
        kyc_status: uploadedDocs.length > 0 ? 'submitted' : 'pending',
        applied_at: new Date().toISOString(),
        latest_applied_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        application_history: existingHistory,
        reapplication_count: currentReappCount,
        correction_requested: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('maid_profiles')
        .upsert(dbPayload, { onConflict: 'id' });

      if (dbError) {
        console.error('[MaidRegistration] Supabase upsert failed:', dbError.code, dbError.message, dbError.details, dbError.hint);
        throw new Error(`Registration save failed: ${dbError.message} (${dbError.code})`);
      }

      // Update user_profiles maid_application_status in Supabase
      try {
        await supabase
          .from('user_profiles')
          .update({
            maid_application_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user?.uid || profileId);
      } catch (uErr) {
        console.warn('Could not update user_profiles maid_application_status:', uErr);
      }

      // Notify Admin Panel immediately of new partner registration
      try {
        await supabase.from('notifications').insert({
          recipient_id: 'admin',
          recipient_role: 'admin',
          title: 'New Partner Registration',
          message: `${fullName || 'Partner'} (${phone}) submitted an application for review.`,
          category: 'updates',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.warn('Could not insert admin notification for partner registration:', notifErr);
      }

      // Clear local draft upon final submission
      const draftKey = `@gc_partner_draft_${user?.uid || phone || 'default'}`;
      await AsyncStorage.removeItem(draftKey);

      setAppStatus('pending');
      setIsSubmitted(true);
      setCurrentStep(7);
      navigateTo('maid_status');
    } catch (err: any) {
      console.error('Final registration error:', err);
      Alert.alert(
        'Submission Failed',
        err.message || 'Unable to submit your registration. Please check your network connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 6: Trigger OTP Verification Dialog before Final Submission ──
  const handleInitiateOtpVerification = async () => {
    if (!termsAccepted || !privacyAccepted || !accuracyConfirmed) {
      Alert.alert(
        'Declarations Required',
        'Please confirm all declarations and accept the terms before submitting your application.'
      );
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      Alert.alert('Invalid Mobile Number', 'Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');
    setOtpDigits(['', '', '', '', '', '']);

    try {
      const fullPhone = `+91 ${cleanDigits}`;
      await authService.sendOtp(fullPhone);
      setIsSendingOtp(false);
      setShowOtpModal(true);
      setOtpCountdown(30);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      setIsSendingOtp(false);
      Alert.alert('OTP Failed', err?.message || 'Unable to send verification code. Please check your phone number.');
    }
  };

  const handleOtpDigitChange = (text: string, index: number) => {
    if (otpError) setOtpError('');
    const cleaned = text.replace(/[^0-9]/g, '');

    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split('');
      setOtpDigits(newDigits);
      otpInputRefs.current[5]?.focus();
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResendPartnerOtp = async () => {
    if (otpCountdown > 0) return;
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const fullPhone = `+91 ${cleanDigits}`;
    setOtpError('');
    try {
      await authService.sendOtp(fullPhone);
      setOtpCountdown(30);
    } catch (err: any) {
      setOtpError('Failed to resend code. Please try again.');
    }
  };

  const handleVerifyOtpAndSubmit = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const fullPhone = `+91 ${cleanDigits}`;

    try {
      const res = await authService.verifyOtp(fullPhone, code, true);
      if (!res.success) {
        setIsVerifyingOtp(false);
        setOtpError(res.message || 'Incorrect OTP code. Please try again.');
        return;
      }

      setShowOtpModal(false);
      setIsVerifyingOtp(false);

      // Save and submit application to Supabase now that OTP is verified
      await handleFinalSubmission();
    } catch (err: any) {
      setIsVerifyingOtp(false);
      setOtpError(err?.message || 'Incorrect OTP code. Please try again.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 6. CONFIRMATION STATUS SCREEN (Clean, Minimal, Flat Layout)
  // ─────────────────────────────────────────────────────────────
  if (isSubmitted || currentStep === 7) {
    const hasPersonal = Boolean(fullName && phone);
    const hasAddress = Boolean(fullAddress || selectedCity || locality);
    const hasServices = Boolean(selectedServices.length > 0);
    const hasDocs = Boolean(uploadedDocs.length > 0 || documents?.aadhaarFront?.fileUrl);
    const hasBank = Boolean(accountNumber || upiId);

    const steps = [
      { id: 'personal', label: 'Personal Details', isCompleted: hasPersonal || true },
      { id: 'address', label: 'Address Details', isCompleted: hasAddress || true },
      { id: 'services', label: 'Services & Experience', isCompleted: hasServices || true },
      { id: 'documents', label: 'Document Verification', isCompleted: hasDocs },
      { id: 'bank', label: 'Bank Details', isCompleted: hasBank || true },
    ];

    const submittedSteps = steps.filter(s => s.isCompleted);

    return (
      <View style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerInner}>
            <TouchableOpacity
              onPress={() => navigateTo('home')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back to Home"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText}>Partner Application</Text>
            </View>
          </View>
        </View>

        {/* Minimal Flat Content (No Large Box / Card) */}
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 36, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Clock size={28} color="#D97706" strokeWidth={2.2} />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#0F172A',
              letterSpacing: -0.3,
              marginBottom: 10,
            }}
          >
            Application Under Review
          </Text>

          {/* Submitted Steps List with ✓ tick marks */}
          <View style={{ width: '100%', marginTop: 18 }}>
            {submittedSteps.map(step => (
              <View
                key={step.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F1F5F9',
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Check size={14} color="#166534" strokeWidth={2.8} />
                </View>
                <Text
                  style={{
                    fontSize: 14.5,
                    fontWeight: '600',
                    color: '#1E293B',
                  }}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Non-Actionable Status Indicator */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: Platform.OS === 'ios' ? 28 : 20,
            paddingTop: 12,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F8FAFC',
          }}
        >
          <View
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14.5,
                fontWeight: '700',
                color: '#64748B',
              }}
            >
              In Progress
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5-STEP REGISTRATION WIZARD + STEP 6 REVIEW SCREEN
  // ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. Compact, Premium Registration Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            onPress={() => {
              if (currentStep > 1) handlePrevStep();
              else navigateTo('become_maid_info');
            }}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>Partner Registration</Text>
            <Text style={styles.headerSubtitleText}>
              {currentStep === 1 && 'Personal Details'}
              {currentStep === 2 && 'Address & Work Area'}
              {currentStep === 3 && 'Services & Availability'}
              {currentStep === 4 && 'Document Verification'}
              {currentStep === 5 && 'Bank & Declarations'}
              {currentStep === 6 && 'Review Application'}
              {currentStep <= 5 ? ` • Step ${currentStep} of 5` : ' • Final Step'}
            </Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {currentStep <= 5 ? `${currentStep} / 5` : 'Review'}
            </Text>
          </View>
        </View>

        {/* Progress Bar Indicator directly attached to header */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min((currentStep / 5) * 100, 100)}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.formScrollContent,
          { paddingBottom: isKeyboardOpen ? 40 : 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ── STEP 1: PERSONAL DETAILS ── */}
        {currentStep === 1 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepIconWrap}>
                <User size={18} color="#168A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Personal Details</Text>
                <Text style={styles.stepSubTitle}>Enter your basic contact and identity information.</Text>
              </View>
            </View>

            {/* Partner Profile Photo Picker */}
            <ProfilePhotoPicker
              value={profilePhotoUrl}
              onChange={url => {
                setProfilePhotoUrl(url);
                setIsPhotoUploaded(Boolean(url));
              }}
              onDelete={handlePhotoDelete}
              label="Partner Profile Photo (Optional)"
              subLabel="Optional: Take a live photo with camera"
              userType="partner"
              cameraOnly={true}
              identifier={phone || fullName}
              required={false}
            />

            <Text style={styles.inputLabel}>Full Legal Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Saroja Devi"
              placeholderTextColor="#94A3B8"
              value={fullName}
              onFocus={handleInputFocus}
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
              onFocus={handleInputFocus}
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
              onFocus={handleInputFocus}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Date of Birth (DD-MM-YYYY) *</Text>
            <TouchableOpacity
              style={styles.dobSelectorBtn}
              onPress={openDobModal}
              activeOpacity={0.8}
            >
              <CalendarIcon size={18} color="#168A68" />
              <Text style={[styles.dobSelectorText, !dob && { color: '#94A3B8' }]}>
                {dob ? dob : 'DD-MM-YYYY (e.g. 15-06-1995)'}
              </Text>
              <ChevronDown size={16} color="#64748B" style={{ marginLeft: 'auto' }} />
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
              onFocus={handleInputFocus}
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
              onFocus={handleInputFocus}
              onChangeText={setEmergencyContactPhone}
            />
          </View>
        )}

        {/* ── STEP 2: ADDRESS & WORK CITY ── */}
        {currentStep === 2 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepIconWrap}>
                <MapPin size={18} color="#168A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Address & Work Cities</Text>
                <Text style={styles.stepSubTitle}>
                  Enter your residential address and choose your operating cities.
                </Text>
              </View>
            </View>

            {/* Standard Address Form */}
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
              onSubmit={handlePartnerAddressSubmit}
              submitButtonText="Save Address & Continue"
              isSubmitting={isSavingStep}
              cityOptions={availableCities}
              onInputFocus={handleInputFocus}
            />

            {/* Multi-City Work Location Selection */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionHeaderLabel}>Preferred Operational Cities *</Text>
              <Text style={styles.workCityHelperText}>
                Select all cities where you are available to accept service appointments.
              </Text>

              <View style={styles.cityChecklistContainer}>
                {availableCities.map(city => {
                  const isChecked = preferredWorkCities.includes(city);
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.cityCheckboxRow, isChecked && styles.cityCheckboxRowSelected]}
                      onPress={() => toggleWorkCity(city)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cityCheckboxSquare, isChecked && styles.cityCheckboxSquareSelected]}>
                        {isChecked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.cityCheckboxLabel, isChecked && styles.cityCheckboxLabelSelected]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 3: SERVICES & AVAILABILITY ── */}
        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepIconWrap}>
                <Briefcase size={18} color="#168A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Services & Availability</Text>
                <Text style={styles.stepSubTitle}>
                  Configure the services you provide and your operating schedule.
                </Text>
              </View>
            </View>

            {/* Dynamic Services Selector */}
            <Text style={styles.sectionHeaderLabel}>Services You Provide *</Text>
            <DynamicServiceSelector
              selectedServiceIds={selectedServiceIds}
              selectedSubServiceIds={selectedSubServiceIds}
              onChange={(ids, items, subIds) => {
                setSelectedServiceIds(ids);
                setSelectedServices(items);
                if (subIds) setSelectedSubServiceIds(subIds);
              }}
            />

            {/* Experience */}
            <Text style={styles.sectionHeaderLabel}>Experience (Years) *</Text>
            <View style={styles.experienceRow}>
              {EXPERIENCE_OPTIONS.map(exp => (
                <TouchableOpacity
                  key={exp}
                  style={[
                    styles.experienceChip,
                    experienceRange === exp && styles.experienceChipSelected,
                  ]}
                  onPress={() => {
                    setExperienceRange(exp);
                    let num = 3;
                    if (exp.includes('0–1')) num = 1;
                    else if (exp.includes('1–2')) num = 2;
                    else if (exp.includes('2–3')) num = 3;
                    else if (exp.includes('3–5')) num = 4;
                    else if (exp.includes('5–10')) num = 7;
                    else if (exp.includes('10+')) num = 10;
                    setExperienceYears(num);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.experienceChipText,
                      experienceRange === exp && styles.experienceChipTextSelected,
                    ]}
                  >
                    {exp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Languages */}
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

            {selectedLanguages.includes('Other') && (
              <View style={styles.customLangSection}>
                <Text style={styles.inputLabel}>Enter Additional Language</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="e.g. Kannada, Marathi, Tamil..."
                    placeholderTextColor="#94A3B8"
                    value={customLanguageInput}
                    onFocus={handleInputFocus}
                    onChangeText={setCustomLanguageInput}
                  />
                  <TouchableOpacity
                    style={styles.addLangBtn}
                    onPress={handleAddCustomLanguage}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addLangBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {customLanguagesList.length > 0 && (
                  <View style={styles.customLangChipsWrap}>
                    {customLanguagesList.map(item => (
                      <View key={item} style={styles.customLangChip}>
                        <Text style={styles.customLangChipText}>{item}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveCustomLanguage(item)}
                          style={{ padding: 2 }}
                        >
                          <Text style={{ fontSize: 13, color: '#047857', fontWeight: '800' }}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Service Radius */}
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

            {/* Working Time */}
            <Text style={styles.sectionHeaderLabel}>Working Time *</Text>
            <NativeTimePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={(time24, display12) => setStartTime(display12)}
              onEndTimeChange={(time24, display12) => setEndTime(display12)}
            />

            {/* Emergency Jobs */}
            <Text style={styles.sectionHeaderLabel}>Emergency Jobs</Text>
            <TouchableOpacity
              style={styles.emergencyToggleRow}
              onPress={() => setEmergencyJobsAccepted(!emergencyJobsAccepted)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyToggleTitle}>Accept Urgent / Emergency Jobs?</Text>
                <Text style={styles.emergencyToggleSub}>
                  Higher earnings: Be dispatched for short-notice cleaning requests.
                </Text>
              </View>
              <View
                style={[
                  styles.switchTrack,
                  emergencyJobsAccepted && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    emergencyJobsAccepted && styles.switchThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 4: DOCUMENT VERIFICATION ── */}
        {currentStep === 4 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepIconWrap}>
                <ShieldCheck size={18} color="#168A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Document Verification</Text>
                <Text style={styles.stepSubTitle}>
                  Upload your Aadhaar Card, PAN Card, or any government photo ID.
                </Text>
              </View>
            </View>

            {/* Skip Option Banner */}
            <View style={styles.skipBanner}>
              <View style={styles.skipBannerContent}>
                <Text style={styles.skipBannerTitle}>Don't have your documents ready right now?</Text>
                <Text style={styles.skipBannerSub}>
                  You can skip this step and upload your verification documents later from your Partner Profile before account verification.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkipStep4}
                activeOpacity={0.8}
              >
                <Text style={styles.skipBtnText}>Skip for Now</Text>
                <ArrowRight size={13} color="#168A68" />
              </TouchableOpacity>
            </View>

            <PartnerDocumentPicker
              documents={uploadedDocs}
              onDocumentsChange={handleDocumentsChange}
              partnerIdentifier={phone || fullName}
            />

            {uploadedDocs.length === 0 && (
              <TouchableOpacity
                style={styles.skipFooterBtn}
                onPress={handleSkipStep4}
                activeOpacity={0.8}
              >
                <Text style={styles.skipFooterBtnText}>Skip Document Upload (Upload Later) →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── STEP 5: BANK DETAILS & DECLARATIONS ── */}
        {currentStep === 5 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepIconWrap}>
                <CreditCard size={18} color="#168A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Bank Details & Agreement</Text>
                <Text style={styles.stepSubTitle}>
                  Enter payout bank account details for weekly direct deposits.
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Account Holder Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Saroja Devi"
              placeholderTextColor="#94A3B8"
              value={bankAccountHolder}
              onFocus={handleInputFocus}
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
              onFocus={handleInputFocus}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. State Bank of India / HDFC Bank"
              placeholderTextColor="#94A3B8"
              value={bankName}
              onFocus={handleInputFocus}
              onChangeText={setBankName}
            />

            <Text style={styles.inputLabel}>Confirm Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter bank name (must match exactly)"
              placeholderTextColor="#94A3B8"
              value={confirmBankName}
              onFocus={handleInputFocus}
              onChangeText={setConfirmBankName}
            />

            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={ifscCode}
              onFocus={handleInputFocus}
              onChangeText={txt => setIfscCode(txt.toUpperCase())}
            />

            <Text style={styles.inputLabel}>UPI Code (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210@upi or mobile@okaxis"
              placeholderTextColor="#94A3B8"
              value={upiId}
              onFocus={handleInputFocus}
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
                  I agree to the <Text style={{ fontWeight: '800', color: '#168A68' }}>Privacy Policy</Text> and background check consent.
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
                  I confirm that all information and identity documents provided are true and accurate.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP 6: REVIEW APPLICATION (Atomic confirmation before final submit) ── */}
        {currentStep === 6 && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <View style={styles.stepIconWrap}>
                <ShieldCheck size={20} color="#168A68" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Review Your Registration</Text>
                <Text style={styles.stepSubTitle}>
                  Review your details below. You can click Edit on any section to revise information.
                </Text>
              </View>
            </View>

            {/* Verification Notice Banner */}
            <View style={styles.reviewNoticeBanner}>
              <ShieldCheck size={16} color="#166534" />
              <Text style={styles.reviewNoticeText}>
                Please verify your details before submitting. Your application will be sent directly for operations verification.
              </Text>
            </View>

            {/* Step 1 Review */}
            <View style={styles.reviewStepBox}>
              <View style={styles.reviewStepHeader}>
                <View style={styles.reviewStepBadge}>
                  <Check size={12} color="#166534" strokeWidth={3} />
                  <Text style={styles.reviewStepBadgeText}>Step 1: Personal Details</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(1)} style={styles.reviewEditBtn}>
                  <Edit3 size={13} color="#168A68" />
                  <Text style={styles.reviewEditLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Name:</Text> {fullName}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Phone:</Text> {phone}</Text>
              {Boolean(email) && <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Email:</Text> {email}</Text>}
              <Text style={styles.reviewDetailText}>
                <Text style={styles.reviewDetailLabel}>Date of Birth:</Text> {dob} (DD-MM-YYYY) • <Text style={styles.reviewDetailLabel}>Gender:</Text> {gender}
              </Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Emergency Contact:</Text> {emergencyContactName} ({emergencyContactPhone})</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Profile Photo:</Text> {profilePhotoUrl ? 'Uploaded ✓' : 'No photo uploaded'}</Text>
            </View>

            {/* Step 2 Review */}
            <View style={styles.reviewStepBox}>
              <View style={styles.reviewStepHeader}>
                <View style={styles.reviewStepBadge}>
                  <Check size={12} color="#166534" strokeWidth={3} />
                  <Text style={styles.reviewStepBadgeText}>Step 2: Address & Work Cities</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(2)} style={styles.reviewEditBtn}>
                  <Edit3 size={13} color="#168A68" />
                  <Text style={styles.reviewEditLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Address:</Text> {houseFlat || fullAddress}, {locality}, {selectedCity} {pincode}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Preferred Work Cities:</Text> {preferredWorkCities.join(', ')}</Text>
            </View>

            {/* Step 3 Review */}
            <View style={styles.reviewStepBox}>
              <View style={styles.reviewStepHeader}>
                <View style={styles.reviewStepBadge}>
                  <Check size={12} color="#166534" strokeWidth={3} />
                  <Text style={styles.reviewStepBadgeText}>Step 3: Services & Availability</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(3)} style={styles.reviewEditBtn}>
                  <Edit3 size={13} color="#168A68" />
                  <Text style={styles.reviewEditLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Services ({selectedServices.length}):</Text> {selectedServices.map(s => s.serviceName).join(', ')}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Experience:</Text> {experienceRange || `${experienceYears} Years`}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Languages:</Text> {[...selectedLanguages.filter(l => l !== 'Other'), ...customLanguagesList].join(', ')}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Working Hours:</Text> {startTime} – {endTime} (Radius: {serviceRadiusKm} KM)</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Emergency Jobs:</Text> {emergencyJobsAccepted ? 'Accepted' : 'No'}</Text>
            </View>

            {/* Step 4 Review */}
            <View style={styles.reviewStepBox}>
              <View style={styles.reviewStepHeader}>
                <View style={styles.reviewStepBadge}>
                  <Check size={12} color="#166534" strokeWidth={3} />
                  <Text style={styles.reviewStepBadgeText}>Step 4: Verification Documents</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(4)} style={styles.reviewEditBtn}>
                  <Edit3 size={13} color="#168A68" />
                  <Text style={styles.reviewEditLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewDetailText}>
                <Text style={styles.reviewDetailLabel}>Attached Documents ({uploadedDocs.length}):</Text>{' '}
                {uploadedDocs.length > 0
                  ? uploadedDocs.map(d => d.name).join(', ')
                  : 'Skipped for now (Can be uploaded later in Partner Profile)'}
              </Text>
            </View>

            {/* Step 5 Review */}
            <View style={styles.reviewStepBox}>
              <View style={styles.reviewStepHeader}>
                <View style={styles.reviewStepBadge}>
                  <Check size={12} color="#166534" strokeWidth={3} />
                  <Text style={styles.reviewStepBadgeText}>Step 5: Bank Details & Declarations</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentStep(5)} style={styles.reviewEditBtn}>
                  <Edit3 size={13} color="#168A68" />
                  <Text style={styles.reviewEditLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Bank:</Text> {bankName}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Account Holder:</Text> {bankAccountHolder}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Account Number:</Text> ••••••••{accountNumber.slice(-4)}</Text>
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>IFSC Code:</Text> {ifscCode}</Text>
              {Boolean(upiId) && <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>UPI ID:</Text> {upiId}</Text>}
              <Text style={styles.reviewDetailText}><Text style={styles.reviewDetailLabel}>Declarations:</Text> Terms, Privacy & Accuracy confirmed ✓</Text>
            </View>

            {/* Final Submit CTA with Mobile OTP Verification */}
            <TouchableOpacity
              style={[styles.submitBtn, (isSendingOtp || isSubmitting) && styles.submitBtnDisabled]}
              onPress={handleInitiateOtpVerification}
              disabled={isSendingOtp || isSubmitting}
              activeOpacity={0.88}
            >
              {isSendingOtp ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitBtnText}>Sending OTP...</Text>
                </View>
              ) : isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitBtnText}>Submitting Application...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Verify Mobile & Submit Application</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* DOB Calendar Picker Modal */}
      <Modal visible={showDobModal} transparent animationType="fade" onRequestClose={() => setShowDobModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.dobModalCard}>
            <View style={styles.dobModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dobModalTitle}>Date of Birth</Text>
                <Text style={styles.dobModalSub}>Format: Date – Month – Year (DD-MM-YYYY)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDobModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dobSegmentsRow}>
              {/* Day */}
              <View style={styles.dobSegmentCol}>
                <Text style={styles.dobSegmentLabel}>Date (DD)</Text>
                <TextInput
                  ref={dayInputRef}
                  style={styles.dobSegmentInput}
                  placeholder="15"
                  placeholderTextColor="#94A3B8"
                  value={dobDay}
                  onChangeText={handleDayChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>

              <Text style={styles.dobDivider}>–</Text>

              {/* Month */}
              <View style={styles.dobSegmentCol}>
                <Text style={styles.dobSegmentLabel}>Month (MM)</Text>
                <TextInput
                  ref={monthInputRef}
                  style={styles.dobSegmentInput}
                  placeholder="06"
                  placeholderTextColor="#94A3B8"
                  value={dobMonth}
                  onChangeText={handleMonthChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>

              <Text style={styles.dobDivider}>–</Text>

              {/* Year */}
              <View style={[styles.dobSegmentCol, { flex: 1.3 }]}>
                <Text style={styles.dobSegmentLabel}>Year (YYYY)</Text>
                <TextInput
                  ref={yearInputRef}
                  style={styles.dobSegmentInput}
                  placeholder="1995"
                  placeholderTextColor="#94A3B8"
                  value={dobYear}
                  onChangeText={handleYearChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  selectTextOnFocus
                />
              </View>
            </View>

            <Text style={styles.dobHelperNote}>
              Applicant must be at least 18 years old. Formatted as DD-MM-YYYY.
            </Text>

            <TouchableOpacity style={styles.dobConfirmBtn} onPress={handleConfirmDob} activeOpacity={0.88}>
              <Text style={styles.dobConfirmBtnText}>Confirm Date of Birth</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Partner Registration OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => setShowOtpModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.dobModalCard}>
            <View style={styles.dobModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dobModalTitle}>Mobile Verification</Text>
                <Text style={styles.dobModalSub}>
                  Enter the 6-digit OTP sent to +91 {phone.replace(/\D/g, '').slice(-10).slice(0, 5)} *****
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 6 OTP Boxes */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginVertical: 14 }}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={el => { otpInputRefs.current[index] = el; }}
                  style={{
                    flex: 1,
                    height: 48,
                    borderWidth: 1.5,
                    borderColor: digit ? '#168A68' : '#CBD5E1',
                    borderRadius: 10,
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: '800',
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={text => handleOtpDigitChange(text, index)}
                  onKeyPress={e => handleOtpKeyPress(e, index)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Error Banner */}
            {Boolean(otpError) && (
              <View style={{ padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '600', textAlign: 'center' }}>{otpError}</Text>
              </View>
            )}

            {/* Resend Timer */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              {otpCountdown > 0 ? (
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
                  Resend code in <Text style={{ color: '#168A68', fontWeight: '700' }}>{otpCountdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendPartnerOtp}>
                  <Text style={{ fontSize: 12, color: '#168A68', fontWeight: '700' }}>Resend Verification Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify CTA */}
            <TouchableOpacity
              style={[styles.dobConfirmBtn, isVerifyingOtp && { opacity: 0.65 }]}
              onPress={handleVerifyOtpAndSubmit}
              disabled={isVerifyingOtp}
              activeOpacity={0.88}
            >
              {isVerifyingOtp ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.dobConfirmBtnText}>Verifying & Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.dobConfirmBtnText}>Verify & Complete Registration</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Stepper Bar (Clean, Centered, Page-Wise Save Trigger) */}
      {currentStep <= 5 && !isSubmitted && (
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNavInner}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={handlePrevStep}
                disabled={isSavingStep}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#0F172A" />
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextBtn,
                (isSavingStep ||
                  (currentStep === 2 && preferredWorkCities.length === 0) ||
                  (currentStep === 3 && selectedServices.length === 0) ||
                  (currentStep === 5 && (!termsAccepted || !privacyAccepted || !accuracyConfirmed))
                ) && styles.nextBtnDisabled,
              ]}
              disabled={
                isSavingStep ||
                (currentStep === 2 && preferredWorkCities.length === 0) ||
                (currentStep === 3 && selectedServices.length === 0) ||
                (currentStep === 5 && (!termsAccepted || !privacyAccepted || !accuracyConfirmed))
              }
              onPress={
                currentStep === 1
                  ? handleStep1Next
                  : currentStep === 2
                  ? handleStep2Next
                  : currentStep === 3
                  ? handleStep3Next
                  : currentStep === 4
                  ? handleStep4Next
                  : handleStep5Next
              }
              activeOpacity={0.88}
            >
              {isSavingStep ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.nextBtnText}>Please wait...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {currentStep === 5
                      ? 'Review Application'
                      : currentStep === 4 && uploadedDocs.length === 0
                      ? 'Skip & Continue'
                      : 'Continue'}
                  </Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── 1. Compact, Premium Registration Header ── */
  topHeader: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
    paddingBottom: 0,
    zIndex: 10,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stepBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#168A68',
  },
  progressBarContainer: {
    height: 3.5,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#168A68',
  },

  /* ── Scroll & Clean Flat Form Layout (No Box/Card Container) ── */
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  stepSection: {
    width: '100%',
    paddingBottom: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepSubTitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
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
    paddingVertical: 11,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#0F172A',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  genderChipTextSelected: {
    color: '#168A68',
  },

  /* ── Step 2 Multi-City Checkbox Elements ── */
  workCityHelperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  cityChecklistContainer: {
    gap: 8,
  },
  cityCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cityCheckboxRowSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#168A68',
  },
  cityCheckboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cityCheckboxSquareSelected: {
    borderColor: '#168A68',
    backgroundColor: '#168A68',
  },
  cityCheckboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  cityCheckboxLabelSelected: {
    fontWeight: '800',
    color: '#0E5B47',
  },

  /* ── Step 3 Services & Availability ── */
  experienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  experienceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
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
    gap: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  langRowSelected: {},
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
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
    color: '#1E293B',
  },
  langLabelSelected: {
    fontWeight: '800',
    color: '#0F172A',
  },
  customLangSection: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addLangBtn: {
    backgroundColor: '#168A68',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLangBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  customLangChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  customLangChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customLangChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  availabilityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  availabilityCardSelected: {
    borderColor: '#168A68',
    backgroundColor: '#E6F4F1',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#168A68',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#168A68',
  },
  availabilityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  availabilityTitleSelected: {
    color: '#166534',
  },
  availabilitySub: {
    fontSize: 10,
    color: '#64748B',
  },
  radiusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  radiusValueBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A68',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 9,
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
  emergencyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  emergencyToggleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  emergencyToggleSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#168A68',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },

  /* ── Step 5 Declarations ── */
  declarationsBox: {
    marginTop: 18,
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  declarationText: {
    flex: 1,
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 17,
  },

  /* ── Step 6 Review Screen Components ── */
  reviewNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16,
    fontWeight: '600',
  },
  reviewStepBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  reviewStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reviewStepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewStepBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E6F4F1',
  },
  reviewEditLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#168A68',
  },
  reviewDetailText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 19,
  },
  reviewDetailLabel: {
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#168A68',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Bottom Stepper Bar ── */
  bottomNavContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  bottomNavInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#168A68',
    marginLeft: 'auto',
  },
  nextBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Modals & Status Screen Hero ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dobModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  dobModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dobModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  dobModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  dobSegmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dobSegmentCol: {
    flex: 1,
  },
  dobSegmentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textAlign: 'center',
  },
  dobSegmentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dobDivider: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 18,
  },
  dobHelperNote: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
    textAlign: 'center',
  },
  dobConfirmBtn: {
    backgroundColor: '#168A68',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dobConfirmBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
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
  skipBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skipBannerContent: {
    flex: 1,
  },
  skipBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  skipBannerSub: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 15,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#168A68',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  skipBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#168A68',
  },
  skipFooterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  skipFooterBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F766E',
  },
});
