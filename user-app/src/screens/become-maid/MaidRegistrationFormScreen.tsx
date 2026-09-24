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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
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
  const { navigateTo, user, submitMaidApplication, maidProfile, savedAddresses, navigationPayload } = useAuth();

  // Application Flow State (Steps 1 to 5, Step 6 = Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [appStatus, setAppStatus] = useState<MaidApplicationStatus>('none');
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<any>(null);

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

  // ── Step 2: Preferred Work City (Multi-select checkboxes, separate from residential address) ──
  const [availableCities, setAvailableCities] = useState<string[]>(PARTNER_SUPPORTED_CITIES);
  const [preferredWorkCities, setPreferredWorkCities] = useState<string[]>([]);

  // ── Step 3: Services & Availability ──
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Telugu', 'English']);
  const [customLanguageInput, setCustomLanguageInput] = useState('');
  const [customLanguagesList, setCustomLanguagesList] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Not Available'>('Available');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(5); // Initial dispatch radius: 5 KM
  const [startTime, setStartTime] = useState<string>('08:00 AM');
  const [endTime, setEndTime] = useState<string>('08:00 PM');
  const [emergencyJobsAccepted, setEmergencyJobsAccepted] = useState<boolean>(true);

  // ── Step 4: Document Verification (Simple upload without rigid document-type restriction) ──
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

  // ── Auto-save Draft Function ──
  const saveDraft = useCallback(async (overrides?: Record<string, any>) => {
    setDraftStatus('saving');
    try {
      const draftData = {
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
        selectedServices,
        experienceYears,
        selectedLanguages,
        customLanguagesList,
        availabilityStatus,
        serviceRadiusKm,
        startTime,
        endTime,
        emergencyJobsAccepted,
        uploadedDocs,
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
        currentStep,
        ...overrides,
      };

      const key = `@gc_partner_draft_${user?.uid || phone || 'default'}`;
      await AsyncStorage.setItem(key, JSON.stringify(draftData));

      // Also auto-save to Supabase maid_profiles with status: 'draft' if user has a valid UID
      if (user?.uid) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.uid);
        if (isUuid) {
          const fullAddressStr = `${draftData.houseFlat || draftData.fullAddress}${draftData.street ? ', ' + draftData.street : ''}, ${draftData.locality}, ${draftData.selectedCity} ${draftData.pincode}`;
          const citiesArr = draftData.preferredWorkCities || [];
          const citiesStr = citiesArr.join(', ') || draftData.selectedCity || '';
          const activeDocsList: UploadedDocItem[] = draftData.uploadedDocs || [];

          await supabase.from('maid_profiles').upsert({
            id: user.uid,
            full_name: draftData.fullName || user.name || 'Partner Draft',
            phone: draftData.phone || user.phone || '',
            email: draftData.email || user.email || '',
            photo_url: draftData.profilePhotoUrl || '',
            dob: draftData.dob || '',
            gender: draftData.gender || 'Female',
            emergency_contact_name: draftData.emergencyContactName || '',
            emergency_contact_phone: draftData.emergencyContactPhone || '',
            address: fullAddressStr,
            full_address: draftData.fullAddress || '',
            locality: draftData.locality || '',
            pincode: draftData.pincode || '',
            city: draftData.selectedCity || '',
            service_area: citiesStr,
            preferred_service_area: citiesStr,
            preferred_cities: citiesArr,
            service_radius_km: draftData.serviceRadiusKm || 5,
            start_time: draftData.startTime || '08:00 AM',
            end_time: draftData.endTime || '08:00 PM',
            emergency_jobs_accepted: draftData.emergencyJobsAccepted ?? true,
            skills: (draftData.selectedServices || []).map((s: any) => s.serviceName),
            services_provided: draftData.selectedServices || [],
            languages_spoken: draftData.selectedLanguages || [],
            kyc_documents: {
              profilePhotoUrl: draftData.profilePhotoUrl || '',
              documents: activeDocsList,
              aadhaarFrontUrl: activeDocsList[0]?.fileUrl || draftData.documents?.aadhaarFront?.fileUrl,
              aadhaarBackUrl: activeDocsList[1]?.fileUrl || draftData.documents?.aadhaarBack?.fileUrl,
              panDocUrl: activeDocsList[2]?.fileUrl || draftData.documents?.pan?.fileUrl,
              upiId: draftData.upiId,
            },
            aadhaar_doc_url: activeDocsList[0]?.fileUrl || draftData.documents?.aadhaarFront?.fileUrl,
            pan_doc_url: activeDocsList[1]?.fileUrl || draftData.documents?.pan?.fileUrl,
            other_docs_urls: activeDocsList.map(d => d.fileUrl),
            bank_account_name: draftData.bankAccountHolder || '',
            bank_account_number: draftData.accountNumber || '',
            bank_ifsc: draftData.ifscCode || '',
            bank_name: draftData.bankName || '',
            upi_id: draftData.upiId || '',
            status: 'draft',
            correction_requested: false,
          });
        }
      }

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setDraftStatus('saved');
      }, 500);
    } catch (err) {
      console.warn('Draft auto-save notice:', err);
      setDraftStatus('idle');
    }
  }, [
    fullName, phone, email, gender, dob, emergencyContactName, emergencyContactPhone,
    profilePhotoUrl, houseFlat, street, locality, selectedCity, selectedDistrict,
    selectedState, selectedPostOffice, pincode, fullAddress, preferredWorkCities,
    selectedServiceIds, selectedServices, experienceYears, selectedLanguages,
    customLanguagesList, availabilityStatus, serviceRadiusKm, startTime, endTime,
    emergencyJobsAccepted, documents, bankAccountHolder, bankName, confirmBankName,
    accountNumber, confirmAccountNumber, ifscCode, upiId, termsAccepted, privacyAccepted,
    accuracyConfirmed, currentStep, user?.uid
  ]);

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

  // Pre-fill customer profile details & saved address if empty (TASK 2)
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

  // Handle Re-Application intent from navigation payload (TASK 3)
  useEffect(() => {
    if (navigationPayload?.isReapplication) {
      setIsSubmitted(false);
      setCurrentStep(1);
    }
  }, [navigationPayload]);

  // Restore Draft on Mount (Local storage first, then Supabase draft row)
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
          if (d.dob) setDob(d.dob);
          if (d.emergencyContactName) setEmergencyContactName(d.emergencyContactName);
          if (d.emergencyContactPhone) setEmergencyContactPhone(d.emergencyContactPhone);
          if (d.profilePhotoUrl) setProfilePhotoUrl(d.profilePhotoUrl);
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
          if (Array.isArray(d.selectedServices)) setSelectedServices(d.selectedServices);
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
          } else if (d.documents) {
            const converted: UploadedDocItem[] = [];
            if (d.documents.aadhaarFront?.fileUrl) {
              converted.push({
                id: 'aadhaar_front',
                name: d.documents.aadhaarFront.fileName || 'Verification Document 1',
                fileUrl: d.documents.aadhaarFront.fileUrl,
                fileType: d.documents.aadhaarFront.fileType || 'image',
                uploadedAt: new Date().toISOString(),
              });
            }
            if (d.documents.aadhaarBack?.fileUrl) {
              converted.push({
                id: 'aadhaar_back',
                name: d.documents.aadhaarBack.fileName || 'Verification Document 2',
                fileUrl: d.documents.aadhaarBack.fileUrl,
                fileType: d.documents.aadhaarBack.fileType || 'image',
                uploadedAt: new Date().toISOString(),
              });
            }
            if (d.documents.pan?.fileUrl) {
              converted.push({
                id: 'pan',
                name: d.documents.pan.fileName || 'Verification Document 3',
                fileUrl: d.documents.pan.fileUrl,
                fileType: d.documents.pan.fileType || 'image',
                uploadedAt: new Date().toISOString(),
              });
            }
            if (converted.length > 0) setUploadedDocs(converted);
            setDocuments(d.documents);
          }
          if (d.bankAccountHolder) setBankAccountHolder(d.bankAccountHolder);
          if (d.bankName) setBankName(d.bankName);
          if (d.confirmBankName) setConfirmBankName(d.confirmBankName);
          if (d.accountNumber) {
            setAccountNumber(d.accountNumber);
            setConfirmAccountNumber(d.accountNumber);
          }
          if (d.ifscCode) setIfscCode(d.ifscCode);
          if (d.upiId) setUpiId(d.upiId);
          if (d.currentStep && d.currentStep >= 1 && d.currentStep <= 5) {
            setCurrentStep(d.currentStep);
          }
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

          if (dbDraft && dbDraft.status === 'draft') {
            if (dbDraft.full_name) setFullName(dbDraft.full_name);
            if (dbDraft.phone) setPhone(dbDraft.phone);
            if (dbDraft.email) setEmail(dbDraft.email);
            if (dbDraft.photo_url) setProfilePhotoUrl(dbDraft.photo_url);
            if (dbDraft.dob) setDob(dbDraft.dob);
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
            } else {
              const converted: UploadedDocItem[] = [];
              if (dbDraft.aadhaar_doc_url || dbKyc?.aadhaarFrontUrl) {
                converted.push({
                  id: 'doc_1',
                  name: 'Verification Document 1',
                  fileUrl: dbDraft.aadhaar_doc_url || dbKyc?.aadhaarFrontUrl,
                  fileType: (dbDraft.aadhaar_doc_url || dbKyc?.aadhaarFrontUrl)?.endsWith('.pdf') ? 'pdf' : 'image',
                  uploadedAt: new Date().toISOString(),
                });
              }
              if (dbKyc?.aadhaarBackUrl) {
                converted.push({
                  id: 'doc_2',
                  name: 'Verification Document 2',
                  fileUrl: dbKyc.aadhaarBackUrl,
                  fileType: dbKyc.aadhaarBackUrl.endsWith('.pdf') ? 'pdf' : 'image',
                  uploadedAt: new Date().toISOString(),
                });
              }
              if (dbDraft.pan_doc_url || dbKyc?.panDocUrl) {
                converted.push({
                  id: 'doc_3',
                  name: 'Verification Document 3',
                  fileUrl: dbDraft.pan_doc_url || dbKyc?.panDocUrl,
                  fileType: (dbDraft.pan_doc_url || dbKyc?.panDocUrl)?.endsWith('.pdf') ? 'pdf' : 'image',
                  uploadedAt: new Date().toISOString(),
                });
              }
              if (converted.length > 0) setUploadedDocs(converted);
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
          setCurrentStep(6); // Show confirmation/status screen
        }
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

        const existingDocs: UploadedDocItem[] = [];
        const rawKyc = (maidProfile as any).kyc_documents;
        if (rawKyc && Array.isArray(rawKyc.documents) && rawKyc.documents.length > 0) {
          setUploadedDocs(rawKyc.documents);
        } else {
          if (maidProfile.aadhaarFrontUrl) {
            existingDocs.push({
              id: 'doc_1',
              name: 'Verification Document 1',
              fileUrl: maidProfile.aadhaarFrontUrl,
              fileType: maidProfile.aadhaarFrontUrl.endsWith('.pdf') ? 'pdf' : 'image',
              uploadedAt: new Date().toISOString(),
            });
          }
          if (maidProfile.aadhaarBackUrl) {
            existingDocs.push({
              id: 'doc_2',
              name: 'Verification Document 2',
              fileUrl: maidProfile.aadhaarBackUrl,
              fileType: maidProfile.aadhaarBackUrl.endsWith('.pdf') ? 'pdf' : 'image',
              uploadedAt: new Date().toISOString(),
            });
          }
          if (maidProfile.panDocUrl) {
            existingDocs.push({
              id: 'doc_3',
              name: 'Verification Document 3',
              fileUrl: maidProfile.panDocUrl,
              fileType: maidProfile.panDocUrl.endsWith('.pdf') ? 'pdf' : 'image',
              uploadedAt: new Date().toISOString(),
            });
          }
          if (existingDocs.length > 0) {
            setUploadedDocs(existingDocs);
          }
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

  // ── Step 2 Multi-City Preference Toggle ──
  const toggleWorkCity = (cityName: string) => {
    setPreferredWorkCities(prev => {
      const updated = prev.includes(cityName)
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName];
      saveDraft({ preferredWorkCities: updated });
      return updated;
    });
  };

  // ── Step 2 Address Submit & Continue ──
  const handleStep2Continue = () => {
    const hasHouse = houseFlat.trim() || fullAddress.trim();
    if (!hasHouse || !locality.trim() || !pincode.trim()) {
      Alert.alert(
        'Address Details Required',
        'Please complete your residential address (House/Flat, Street, Locality, and Pincode).'
      );
      return;
    }
    if (pincode.replace(/\D/g, '').length < 6) {
      Alert.alert('Valid Pincode Required', 'Please enter a valid 6-digit pincode.');
      return;
    }
    if (preferredWorkCities.length === 0) {
      Alert.alert(
        'Preferred Work City Required',
        'Please select at least one city where you want to provide services.'
      );
      return;
    }

    saveDraft({ currentStep: 3, preferredWorkCities });
    setCurrentStep(3);
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
    handleStep2Continue();
  };

  // ── Document State Change Handlers ──
  const handleDocumentsChange = (docs: UploadedDocItem[]) => {
    setUploadedDocs(docs);
    setDocuments({
      aadhaarFront: {
        id: docs[0]?.id || 'aadhaar_front',
        name: docs[0]?.name || 'Verification Document 1',
        uploaded: Boolean(docs[0]?.fileUrl),
        fileUrl: docs[0]?.fileUrl,
        fileType: docs[0]?.fileType,
      },
      aadhaarBack: {
        id: docs[1]?.id || 'aadhaar_back',
        name: docs[1]?.name || 'Verification Document 2',
        uploaded: Boolean(docs[1]?.fileUrl),
        fileUrl: docs[1]?.fileUrl,
        fileType: docs[1]?.fileType,
      },
      pan: {
        id: docs[2]?.id || 'pan',
        name: docs[2]?.name || 'Verification Document 3',
        uploaded: Boolean(docs[2]?.fileUrl || docs[0]?.fileUrl),
        fileUrl: docs[2]?.fileUrl || docs[0]?.fileUrl,
        fileType: docs[2]?.fileType || docs[0]?.fileType,
      },
    });
    saveDraft({ uploadedDocs: docs });
  };

  const handleDocumentChange = (docKey: string, updated: DocItemState) => {
    setDocuments(prev => {
      const nextDocs = {
        ...prev,
        [docKey]: updated,
      };
      saveDraft({ documents: nextDocs });
      return nextDocs;
    });
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
      if (pincode.replace(/\D/g, '').length < 6) {
        Alert.alert('Valid Pincode Required', 'Please enter a valid 6-digit pincode.');
        return;
      }
      if (preferredWorkCities.length === 0) {
        Alert.alert('Preferred Work City Required', 'Please select at least one city where you want to provide services.');
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

      // Validate working times: End time must be later than start time (Native AM/PM validation)
      const pStart = parseTimeString(startTime);
      const pEnd = parseTimeString(endTime);
      if (pEnd.totalMinutes <= pStart.totalMinutes) {
        Alert.alert(
          'Invalid Working Hours',
          `End time (${pEnd.display12}) cannot be earlier than or equal to start time (${pStart.display12}). Please adjust your schedule.`
        );
        return;
      }
    } else if (currentStep === 4) {
      // Step 4 Validation: Simple Document Upload — accept any uploaded document, do not enforce rigid types
      if (uploadedDocs.length === 0) {
        Alert.alert(
          'Document Required',
          'Please upload your verification document to proceed.'
        );
        return;
      }
    }

    const nextStepNum = Math.min(currentStep + 1, 5);
    setCurrentStep(nextStepNum);
    saveDraft({ currentStep: nextStepNum });
  };

  const handlePrevStep = () => {
    const prevStepNum = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStepNum);
    saveDraft({ currentStep: prevStepNum });
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

    // 2. Re-validate Document Completeness
    if (uploadedDocs.length === 0) {
      Alert.alert(
        'Document Required',
        'Please upload at least one verification document before submitting.'
      );
      setCurrentStep(4);
      return;
    }

    // 3. Re-validate Working Hours (SECTION 2)
    const pStart = parseTimeString(startTime);
    const pEnd = parseTimeString(endTime);
    if (pEnd.totalMinutes <= pStart.totalMinutes) {
      Alert.alert(
        'Invalid Working Hours',
        `End time (${pEnd.display12}) cannot be earlier than or equal to start time (${pStart.display12}).`
      );
      setCurrentStep(3);
      return;
    }

    // 4. Declarations Check
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
      const citiesStr = preferredWorkCities.join(', ') || selectedCity;

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
        photoUrl: profilePhotoUrl || '',
        idProofUrl: uploadedDocs[0]?.fileUrl || documents.aadhaarFront.fileUrl || '',
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
        aadhaarFrontUrl: uploadedDocs[0]?.fileUrl || documents.aadhaarFront.fileUrl,
        aadhaarBackUrl: uploadedDocs[1]?.fileUrl || documents.aadhaarBack.fileUrl,
        panDocUrl: uploadedDocs[2]?.fileUrl || documents.pan.fileUrl,
        termsAccepted,
        privacyAccepted,
        accuracyConfirmed,
        status: 'pending' as const,
      };

      // 1. Check & preserve previous application history for re-application (TASK 3)
      const isUuid = Boolean(user?.uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.uid));
      const profileId = isUuid && user?.uid
        ? user.uid
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      let existingHistory: any[] = [];
      let currentReappCount = 0;

      if (isUuid && user?.uid) {
        try {
          const { data: existingMaidRow } = await supabase
            .from('maid_profiles')
            .select('id, application_history, reapplication_count, status, rejection_reason, rejected_at, applied_at, photo_url, services_provided, preferred_cities')
            .eq('id', user.uid)
            .maybeSingle();

          if (existingMaidRow) {
            existingHistory = Array.isArray(existingMaidRow.application_history)
              ? [...existingMaidRow.application_history]
              : [];
            currentReappCount = existingMaidRow.reapplication_count || 0;

            // If previously rejected or completed application exists, archive into application_history
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
      }

      // Update Context with history metadata
      await submitMaidApplication({
        ...applicationPayload,
        reapplicationCount: currentReappCount,
        latestAppliedAt: new Date().toISOString(),
        applicationHistory: existingHistory,
      } as any);

      // 2. Persist to Supabase `maid_profiles` table (status: 'pending' for Admin KYC Review)
      const dbPayload: any = {
        id: profileId,
        maid_code: partnerCode,
        full_name: fullName,
        phone: phone,
        email: email,
        photo_url: profilePhotoUrl || '',
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
        available_hours: `${pStart.display12} - ${pEnd.display12}`,
        start_time: pStart.time24,
        end_time: pEnd.time24,
        emergency_jobs_accepted: emergencyJobsAccepted,
        skills: selectedServices.map(s => s.serviceName),
        services_provided: partnerProvidedServices,
        languages: allLanguages,
        languages_spoken: allLanguages,
        kyc_documents: {
          profilePhotoUrl: profilePhotoUrl || '',
          documents: uploadedDocs,
          aadhaarFrontUrl: uploadedDocs[0]?.fileUrl || documents.aadhaarFront.fileUrl,
          aadhaarBackUrl: uploadedDocs[1]?.fileUrl || documents.aadhaarBack.fileUrl,
          panDocUrl: uploadedDocs[2]?.fileUrl || documents.pan.fileUrl,
          upiId,
        },
        aadhaar_doc_url: uploadedDocs[0]?.fileUrl || documents.aadhaarFront.fileUrl || '',
        pan_doc_url: uploadedDocs[1]?.fileUrl || documents.pan.fileUrl || '',
        other_docs_urls: uploadedDocs.map(d => d.fileUrl),
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
        rejection_reason: null,
        rejected_at: null,
        rejected_by: null,
        reapplication_count: currentReappCount,
        latest_applied_at: new Date().toISOString(),
        application_history: existingHistory,
        applied_at: (maidProfile as any)?.appliedAt || new Date().toISOString(),
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
              profile_photo_url: profilePhotoUrl || undefined,
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

      // 4. Clear local registration draft on successful final submission
      try {
        const draftKey = `@gc_partner_draft_${user?.uid || phone || 'default'}`;
        await AsyncStorage.removeItem(draftKey);
      } catch (cErr) {
        // Non-blocking
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

          {appStatus === 'rejected' && (
            <TouchableOpacity
              style={[styles.resubmitBtn, { backgroundColor: '#168A68' }]}
              onPress={() => {
                setIsSubmitted(false);
                setCurrentStep(1);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.resubmitBtnText}>Re-Apply as Partner</Text>
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
                <Text style={styles.reviewStepTitle}>Preferred Work City & Address</Text>
                <Text style={styles.reviewStepSub}>
                  Work Cities: {preferredWorkCities.length > 0 ? preferredWorkCities.join(', ') : (selectedCity || 'Selected Cities')} • Residential: {selectedCity || locality} ({pincode})
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitleText}>Partner Registration</Text>
            {draftStatus === 'saving' && (
              <Text style={styles.headerDraftStatus}>• Saving draft...</Text>
            )}
            {draftStatus === 'saved' && (
              <Text style={styles.headerDraftStatusSaved}>• Draft saved</Text>
            )}
          </View>
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

            {/* Partner Profile Photo Picker (Optional per Section 12) */}
            <ProfilePhotoPicker
              value={profilePhotoUrl}
              onChange={url => {
                setProfilePhotoUrl(url);
                setIsPhotoUploaded(Boolean(url));
                saveDraft({ profilePhotoUrl: url });
              }}
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
              onChangeText={val => {
                setFullName(val);
                saveDraft({ fullName: val });
              }}
            />

            <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={val => {
                setPhone(val);
                saveDraft({ phone: val });
              }}
            />

            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. saroja@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={val => {
                setEmail(val);
                saveDraft({ email: val });
              }}
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
                  onPress={() => {
                    setGender(g);
                    saveDraft({ gender: g });
                  }}
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
              onChangeText={val => {
                setEmergencyContactName(val);
                saveDraft({ emergencyContactName: val });
              }}
            />

            <Text style={styles.inputLabel}>Emergency Contact Phone *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876501234"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={emergencyContactPhone}
              onChangeText={val => {
                setEmergencyContactPhone(val);
                saveDraft({ emergencyContactPhone: val });
              }}
            />
          </View>
        )}

        {/* ── STEP 2: ADDRESS DETAILS & PREFERRED WORK CITY ── */}
        {currentStep === 2 && (
          <View style={styles.step2Container}>
            {/* Section 1: Address Details Card */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <MapPin size={20} color="#168A68" />
                <Text style={styles.stepTitle}>Address Details</Text>
              </View>
              <Text style={styles.stepSubTitle}>Enter your residential address information.</Text>

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
                showSubmitButton={false}
                onChange={data => {
                  setHouseFlat(data.houseFlat);
                  setStreet(data.street);
                  setLocality(data.locality);
                  setSelectedCity(data.city);
                  setSelectedDistrict(data.district || '');
                  setSelectedState(data.state);
                  setPincode(data.pincode);
                  setSelectedPostOffice(data.postOffice || '');
                  setFullAddress(`${data.houseFlat}${data.street ? ', ' + data.street : ''}`);
                  saveDraft({
                    houseFlat: data.houseFlat,
                    street: data.street,
                    locality: data.locality,
                    selectedCity: data.city,
                    selectedDistrict: data.district || '',
                    selectedState: data.state,
                    pincode: data.pincode,
                    selectedPostOffice: data.postOffice || '',
                    fullAddress: `${data.houseFlat}${data.street ? ', ' + data.street : ''}`,
                  });
                }}
              />
            </View>

            {/* Section 2: Preferred Work City Card */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <Globe size={20} color="#168A68" />
                <Text style={styles.stepTitle}>Preferred Work City</Text>
              </View>
              <Text style={styles.workCityHelperText}>
                Select all cities where you want to provide services.
              </Text>

              <View style={styles.cityChecklistContainer}>
                {availableCities.map(cityName => {
                  const isSelected = preferredWorkCities.includes(cityName);
                  return (
                    <TouchableOpacity
                      key={cityName}
                      style={[
                        styles.cityCheckboxRow,
                        isSelected && styles.cityCheckboxRowSelected,
                      ]}
                      onPress={() => toggleWorkCity(cityName)}
                      activeOpacity={0.8}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View
                        style={[
                          styles.cityCheckboxSquare,
                          isSelected && styles.cityCheckboxSquareSelected,
                        ]}
                      >
                        {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text
                        style={[
                          styles.cityCheckboxLabel,
                          isSelected && styles.cityCheckboxLabelSelected,
                        ]}
                      >
                        {cityName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2 Continue Button */}
            <TouchableOpacity
              style={[
                styles.step2ContinueBtn,
                preferredWorkCities.length === 0 && styles.step2ContinueBtnDisabled,
              ]}
              onPress={handleStep2Continue}
              disabled={preferredWorkCities.length === 0}
              activeOpacity={0.88}
            >
              <Text
                style={[
                  styles.step2ContinueBtnText,
                  preferredWorkCities.length === 0 && styles.step2ContinueBtnTextDisabled,
                ]}
              >
                Continue →
              </Text>
            </TouchableOpacity>
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
                saveDraft({ selectedServiceIds: ids, selectedServices: items });
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
                  onPress={() => {
                    setExperienceYears(exp);
                    saveDraft({ experienceYears: exp });
                  }}
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
                  onPress={() => {
                    setAvailabilityStatus(opt);
                    saveDraft({ availabilityStatus: opt });
                  }}
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
                  onPress={() => {
                    setServiceRadiusKm(r);
                    saveDraft({ serviceRadiusKm: r });
                  }}
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

            {/* WORKING TIME (Native AM/PM Start Time & End Time pickers with validation) */}
            <Text style={styles.sectionHeaderLabel}>Working Time *</Text>
            <NativeTimePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={(time24, display12) => {
                setStartTime(display12);
                saveDraft({ startTime: display12 });
              }}
              onEndTimeChange={(time24, display12) => {
                setEndTime(display12);
                saveDraft({ endTime: display12 });
              }}
            />

            {/* EMERGENCY JOBS (Yes / No) */}
            <Text style={styles.sectionHeaderLabel}>Emergency Jobs</Text>
            <TouchableOpacity
              style={styles.emergencyToggleRow}
              onPress={() => {
                const nextVal = !emergencyJobsAccepted;
                setEmergencyJobsAccepted(nextVal);
                saveDraft({ emergencyJobsAccepted: nextVal });
              }}
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

        {/* ── STEP 4: DOCUMENT VERIFICATION ── */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderRow}>
              <ShieldCheck size={20} color="#168A68" />
              <Text style={styles.stepTitle}>Document Verification</Text>
            </View>
            <Text style={styles.stepSubTitle}>
              Upload your verification documents
            </Text>

            <PartnerDocumentPicker
              documents={uploadedDocs}
              onDocumentsChange={handleDocumentsChange}
              partnerIdentifier={phone || fullName || user?.uid}
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
              onChangeText={val => {
                setBankAccountHolder(val);
                saveDraft({ bankAccountHolder: val });
              }}
            />

            <Text style={styles.inputLabel}>Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter 9 to 18 digit account number"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              secureTextEntry
              value={accountNumber}
              onChangeText={val => {
                setAccountNumber(val);
                saveDraft({ accountNumber: val });
              }}
            />

            <Text style={styles.inputLabel}>Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. State Bank of India / HDFC Bank"
              placeholderTextColor="#94A3B8"
              value={bankName}
              onChangeText={val => {
                setBankName(val);
                saveDraft({ bankName: val });
              }}
            />

            <Text style={styles.inputLabel}>Confirm Bank Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter bank name (must match exactly)"
              placeholderTextColor="#94A3B8"
              value={confirmBankName}
              onChangeText={val => {
                setConfirmBankName(val);
                saveDraft({ confirmBankName: val });
              }}
            />

            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={ifscCode}
              onChangeText={txt => {
                const upper = txt.toUpperCase();
                setIfscCode(upper);
                saveDraft({ ifscCode: upper });
              }}
            />

            <Text style={styles.inputLabel}>UPI Code (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210@upi or mobile@okaxis"
              placeholderTextColor="#94A3B8"
              value={upiId}
              onChangeText={val => {
                setUpiId(val);
                saveDraft({ upiId: val });
              }}
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

          {currentStep === 3 ? (
            <View style={styles.step3BottomAction}>
              <View style={styles.step3CountCol}>
                <Text style={styles.step3CountText}>
                  {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'service selected' : 'services selected'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.step3ContinueBtn,
                  selectedServiceIds.length === 0 && styles.step3ContinueBtnDisabled,
                ]}
                disabled={selectedServiceIds.length === 0}
                onPress={handleNextStep}
                activeOpacity={0.88}
              >
                <Text
                  style={[
                    styles.step3ContinueBtnText,
                    selectedServiceIds.length === 0 && styles.step3ContinueBtnTextDisabled,
                  ]}
                >
                  Continue →
                </Text>
              </TouchableOpacity>
            </View>
          ) : currentStep < 5 && currentStep !== 2 ? (
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

  /* ── Header Draft Status Badge ── */
  headerDraftStatus: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  headerDraftStatusSaved: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#168A68',
  },

  /* ── Step 2 Container & Multi-City Checkbox Elements ── */
  step2Container: {
    gap: 14,
  },
  workCityHelperText: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 12,
  },
  cityChecklistContainer: {
    gap: 10,
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
    paddingVertical: 13,
    minHeight: 52,
  },
  cityCheckboxRowSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#168A68',
  },
  cityCheckboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  cityCheckboxLabelSelected: {
    fontWeight: '800',
    color: '#0E5B47',
  },
  step2ContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#168A68',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 4,
    marginBottom: 16,
  },
  step2ContinueBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  step2ContinueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  step2ContinueBtnTextDisabled: {
    color: '#94A3B8',
  },

  /* ── Step 3 Sticky Bottom Action Bar ── */
  step3BottomAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginLeft: 8,
  },
  step3CountCol: {
    flex: 1,
    justifyContent: 'center',
  },
  step3CountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#168A68',
  },
  step3ContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#168A68',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  step3ContinueBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  step3ContinueBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  step3ContinueBtnTextDisabled: {
    color: '#94A3B8',
  },
});
