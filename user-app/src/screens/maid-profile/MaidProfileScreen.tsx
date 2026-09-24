import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { PartnerProvidedService } from '../../types';
import {
  Star,
  Landmark,
  LogOut,
  Briefcase,
  Globe,
  Clock,
  Edit2,
  Check,
  Plus,
  X,
  ArrowLeft,
  ChevronRight,
  Bell,
  ShieldCheck,
  FileText,
  HelpCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UserCheck,
} from 'lucide-react-native';

const STANDARD_LANGUAGES = ['Telugu', 'Hindi', 'English', 'Kannada', 'Tamil', 'Marathi'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MaidProfileScreen: React.FC = () => {
  const { maidProfile, updatePartnerProfile, logout, navigateTo, switchUserMode } = useAuth();

  // Modal Editing States
  const [activeModal, setActiveModal] = useState<'services' | 'languages' | 'availability' | 'bank' | 'info_modal' | null>(null);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalContent, setInfoModalContent] = useState('');

  // Security & Confirmation States
  const [showSensitiveBankDetails, setShowSensitiveBankDetails] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Editable Form States
  const [editServices, setEditServices] = useState<PartnerProvidedService[]>(maidProfile?.servicesProvided || []);
  const [editLanguages, setEditLanguages] = useState<string[]>(maidProfile?.languagesSpoken || ['Telugu', 'English']);
  const [editWorkingDays, setEditWorkingDays] = useState<string[]>(maidProfile?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [editWorkingHours, setEditWorkingHours] = useState(maidProfile?.workingHours || '08:00 AM – 08:00 PM');
  const [editRadius, setEditRadius] = useState(maidProfile?.serviceRadiusKm || 10);
  const [editEmergency, setEditEmergency] = useState(maidProfile?.emergencyJobsAccepted ?? true);

  const [editBankName, setEditBankName] = useState(maidProfile?.bankDetails?.bankName || 'HDFC');
  const [editAccountName, setEditAccountName] = useState(maidProfile?.bankDetails?.accountName || maidProfile?.fullName || 'Pavani');
  const [editAccountNumber, setEditAccountNumber] = useState(maidProfile?.bankDetails?.accountNumber || '258025802580369');
  const [editIfsc, setEditIfsc] = useState(maidProfile?.bankDetails?.ifscCode || 'HDFC1234');
  const [editUpi, setEditUpi] = useState(maidProfile?.bankDetails?.upiId || 'Pavani14@ybl');

  // Account Masking Helpers
  const maskAccountNumber = (accNo?: string) => {
    if (!accNo) return '•••• •••• 0369';
    const digits = accNo.replace(/\D/g, '');
    const last4 = digits.length >= 4 ? digits.slice(-4) : '0369';
    return `•••• •••• ${last4}`;
  };

  const maskUpiId = (upiStr?: string) => {
    if (!upiStr) return 'P••••@ybl';
    const parts = upiStr.split('@');
    if (parts.length === 2 && parts[0].length > 1) {
      return `${parts[0][0]}••••@${parts[1]}`;
    }
    return 'P••••@ybl';
  };

  // Verification Status: 'verified' | 'pending'
  const isBankVerified = maidProfile?.status === 'approved';

  // Save Handlers
  const handleSaveServices = async () => {
    if (editServices.some(s => !s.serviceName.trim())) {
      Alert.alert('Required', 'Please enter a name for every service.');
      return;
    }
    await updatePartnerProfile({ servicesProvided: editServices });
    setActiveModal(null);
    Alert.alert('Updated', 'Partner services updated successfully.');
  };

  const handleSaveLanguages = async () => {
    if (editLanguages.length === 0) {
      Alert.alert('Required', 'Please select at least 1 language.');
      return;
    }
    await updatePartnerProfile({ languagesSpoken: editLanguages });
    setActiveModal(null);
    Alert.alert('Updated', 'Languages spoken updated successfully.');
  };

  const handleSaveAvailability = async () => {
    if (editWorkingDays.length === 0) {
      Alert.alert('Required', 'Please select at least 1 working day.');
      return;
    }
    await updatePartnerProfile({
      workingDays: editWorkingDays,
      workingHours: editWorkingHours,
      serviceRadiusKm: editRadius,
      emergencyJobsAccepted: editEmergency,
    });
    setActiveModal(null);
    Alert.alert('Updated', 'Working availability updated successfully.');
  };

  const handleSaveBank = async () => {
    if (!editBankName || !editAccountNumber || !editIfsc) {
      Alert.alert('Required', 'Please fill in bank name, account number, and IFSC code.');
      return;
    }
    await updatePartnerProfile({
      bankDetails: {
        bankName: editBankName,
        accountName: editAccountName,
        accountNumber: editAccountNumber,
        ifscCode: editIfsc,
        upiId: editUpi,
      },
    });
    setActiveModal(null);
    Alert.alert('Updated', 'Bank payout details updated successfully.');
  };

  const openInfoModal = (title: string, content: string) => {
    setInfoModalTitle(title);
    setInfoModalContent(content);
    setActiveModal('info_modal');
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('maid_home')}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color="#10243A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* 1. Header Profile Summary Card */}
        <View style={[styles.card, styles.profileCard]}>
          <View style={styles.avatarRingContainer}>
            <Image
              source={{
                uri:
                  maidProfile?.photoUrl ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
              }}
              style={styles.photo}
            />
            <View style={styles.availabilityBadgeRing} />
          </View>

          <Text style={styles.name}>{maidProfile?.fullName || 'Pavani'}</Text>

          <View style={styles.ratingRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingValue}>
              {maidProfile?.rating ? Number(maidProfile.rating).toFixed(1) : '5.0'} · {maidProfile?.completedJobsCount || 0} jobs completed
            </Text>
          </View>

          <Text style={styles.partnerIdSecondaryText}>
            Partner Ref: #{maidProfile?.maidCode || 'GC-PARTNER-3247'}
          </Text>

          <TouchableOpacity
            onPress={() => switchUserMode('customer')}
            style={styles.switchRoleSubtleBtn}
            activeOpacity={0.8}
          >
            <UserCheck size={13} color="#0E5B47" />
            <Text style={styles.switchRoleSubtleText}>Switch to Customer Mode</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Services You Provide Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeaderRow} onPress={() => setActiveModal('services')} activeOpacity={0.7}>
            <Briefcase size={16} color="#0E5B47" />
            <Text style={styles.cardTitle}>Services You Provide</Text>
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setActiveModal('services')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Edit2 size={13} color="#168A68" />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.chipsWrap}>
            {(maidProfile?.servicesProvided && maidProfile.servicesProvided.length > 0
              ? maidProfile.servicesProvided
              : [{ id: '1', serviceName: 'Painting', experienceYears: 5, experienceMonths: 0, description: '' }]
            ).map((s, idx) => (
              <View key={s.id || idx} style={styles.serviceChip}>
                <Text style={styles.serviceChipTitle}>{s.serviceName || 'Custom Service'}</Text>
                <Text style={styles.serviceChipExp}>{s.experienceYears || 1} yrs exp</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Languages Spoken Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeaderRow} onPress={() => setActiveModal('languages')} activeOpacity={0.7}>
            <Globe size={16} color="#0E5B47" />
            <Text style={styles.cardTitle}>Languages Spoken</Text>
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setActiveModal('languages')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Edit2 size={13} color="#168A68" />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.chipsWrap}>
            {(maidProfile?.languagesSpoken || ['Telugu', 'English']).map((lang, i) => (
              <View key={i} style={styles.langPill}>
                <Text style={styles.langPillText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Working Availability Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeaderRow} onPress={() => setActiveModal('availability')} activeOpacity={0.7}>
            <Clock size={16} color="#0E5B47" />
            <Text style={styles.cardTitle}>Working Availability</Text>
            <TouchableOpacity style={styles.editIconBtn} onPress={() => setActiveModal('availability')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Edit2 size={13} color="#168A68" />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.availabilityList}>
            <View style={styles.availRow}>
              <Text style={styles.availLabel}>Working days</Text>
              <Text style={styles.availVal}>
                {(maidProfile?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).join(', ')}
              </Text>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.availRow}>
              <Text style={styles.availLabel}>Working hours</Text>
              <Text style={styles.availVal}>{maidProfile?.workingHours || '08:00 AM – 08:00 PM'}</Text>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.availRow}>
              <Text style={styles.availLabel}>Service radius</Text>
              <Text style={styles.availVal}>{maidProfile?.serviceRadiusKm || 10} km radius</Text>
            </View>
          </View>
        </View>

        {/* 5. Secure Bank Payout Setup Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Landmark size={16} color="#0E5B47" />
            <Text style={styles.cardTitle}>Bank Payout Setup</Text>

            {/* Security Masking Eye Toggle Button */}
            <TouchableOpacity
              onPress={() => setShowSensitiveBankDetails(!showSensitiveBankDetails)}
              style={styles.eyeToggleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showSensitiveBankDetails ? <EyeOff size={15} color="#64748B" /> : <Eye size={15} color="#64748B" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.editIconBtn} onPress={() => setActiveModal('bank')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Edit2 size={13} color="#168A68" />
            </TouchableOpacity>
          </View>

          {/* Verification Status Chip */}
          <View style={styles.statusChipRow}>
            {isBankVerified ? (
              <View style={[styles.statusChip, styles.statusChipVerified]}>
                <CheckCircle2 size={13} color="#0E5B47" />
                <Text style={styles.statusChipVerifiedText}>Bank account verified</Text>
              </View>
            ) : (
              <View style={[styles.statusChip, styles.statusChipPending]}>
                <Clock size={13} color="#D97706" />
                <Text style={styles.statusChipPendingText}>Verification pending</Text>
              </View>
            )}
          </View>

          {/* Masked Bank Details */}
          <View style={styles.bankGrid}>
            <View style={styles.bankGridRow}>
              <Text style={styles.bankGridLabel}>Bank</Text>
              <Text style={styles.bankGridVal}>{maidProfile?.bankDetails?.bankName || editBankName}</Text>
            </View>

            <View style={styles.bankGridRow}>
              <Text style={styles.bankGridLabel}>Account name</Text>
              <Text style={styles.bankGridVal}>{maidProfile?.bankDetails?.accountName || editAccountName}</Text>
            </View>

            <View style={styles.bankGridRow}>
              <Text style={styles.bankGridLabel}>Account number</Text>
              <Text style={styles.bankGridValHighlight}>
                {showSensitiveBankDetails
                  ? maidProfile?.bankDetails?.accountNumber || editAccountNumber
                  : maskAccountNumber(maidProfile?.bankDetails?.accountNumber || editAccountNumber)}
              </Text>
            </View>

            <View style={styles.bankGridRow}>
              <Text style={styles.bankGridLabel}>IFSC</Text>
              <Text style={styles.bankGridVal}>{maidProfile?.bankDetails?.ifscCode || editIfsc}</Text>
            </View>

            <View style={styles.bankGridRow}>
              <Text style={styles.bankGridLabel}>UPI</Text>
              <Text style={styles.bankGridVal}>
                {showSensitiveBankDetails
                  ? maidProfile?.bankDetails?.upiId || editUpi
                  : maskUpiId(maidProfile?.bankDetails?.upiId || editUpi)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.managePayoutLink} onPress={() => setActiveModal('bank')} activeOpacity={0.7}>
            <Text style={styles.managePayoutText}>Manage payout details →</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Settings Group Section */}
        <View style={styles.card}>
          <Text style={styles.settingsSectionHeading}>Settings</Text>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openInfoModal('Notifications', 'Push notifications for new service requests in your area are enabled.')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingIconCircle}>
                <Bell size={16} color="#0E5B47" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSub}>Job alerts & status updates</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openInfoModal('Privacy & Security', 'Your data is secured with end-to-end encryption and strict financial masking.')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingIconCircle}>
                <ShieldCheck size={16} color="#0E5B47" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Privacy & Security</Text>
                <Text style={styles.settingSub}>Data protection & permissions</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => navigateTo('earnings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingIconCircle}>
                <CreditCard size={16} color="#0E5B47" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Payout Settings</Text>
                <Text style={styles.settingSub}>Weekly transfer & bank account</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openInfoModal('Terms & Policies', 'GC Home Plus Partner Agreement v2.4. Standard platform fee: 20%.')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingIconCircle}>
                <FileText size={16} color="#0E5B47" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Terms & Policies</Text>
                <Text style={styles.settingSub}>Partner service agreement</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openInfoModal('Help & Support', 'Need help? Contact Partner Support at partner@gchomeplus.com or +91 98765 43210.')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <View style={styles.settingIconCircle}>
                <HelpCircle size={16} color="#0E5B47" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSub}>FAQs & partner support desk</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 7. Logout Button */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          style={styles.logoutBtn}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Log out of Partner Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── MODAL 1: LOGOUT CONFIRMATION MODAL ── */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconCircle}>
              <LogOut size={24} color="#DC2626" />
            </View>
            <Text style={styles.logoutModalTitle}>Log out?</Text>
            <Text style={styles.logoutModalSub}>
              You'll need to sign in again to access your partner account.
            </Text>

            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.logoutConfirmText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: INFO MODAL (For Settings Rows) ── */}
      <Modal visible={activeModal === 'info_modal'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.infoModalCard}>
            <Text style={styles.infoModalTitle}>{infoModalTitle}</Text>
            <Text style={styles.infoModalBody}>{infoModalContent}</Text>
            <TouchableOpacity style={styles.infoModalCloseBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.infoModalCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: EDIT SERVICES ── */}
      <Modal visible={activeModal === 'services'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Services & Experience</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {editServices.map((srv, idx) => (
                <View key={srv.id || idx} style={styles.modalServiceBox}>
                  <Text style={styles.inputLabel}>Service #{idx + 1} Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={srv.serviceName}
                    onChangeText={txt =>
                      setEditServices(prev => prev.map(s => (s.id === srv.id ? { ...s, serviceName: txt } : s)))
                    }
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={String(srv.experienceYears || 0)}
                        onChangeText={txt =>
                          setEditServices(prev =>
                            prev.map(s => (s.id === srv.id ? { ...s, experienceYears: parseInt(txt, 10) || 0 } : s))
                          )
                        }
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={() =>
                  setEditServices(prev => [
                    ...prev,
                    { id: `srv_${Date.now()}`, serviceName: '', experienceYears: 1, experienceMonths: 0, description: '' },
                  ])
                }
              >
                <Plus size={14} color="#0E5B47" />
                <Text style={styles.modalAddBtnText}>+ Add Service</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveServices}>
              <Text style={styles.saveModalBtnText}>Save Services</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 4: EDIT LANGUAGES ── */}
      <Modal visible={activeModal === 'languages'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Languages Spoken</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginVertical: 12 }}>
              {STANDARD_LANGUAGES.map(lang => {
                const isSel = editLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langSelectRow, isSel && styles.langSelectRowSelected]}
                    onPress={() => {
                      if (isSel) setEditLanguages(prev => prev.filter(l => l !== lang));
                      else setEditLanguages(prev => [...prev, lang]);
                    }}
                  >
                    <Text style={[styles.langSelectText, isSel && styles.langSelectTextSelected]}>{lang}</Text>
                    {isSel && <Check size={14} color="#0E5B47" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveLanguages}>
              <Text style={styles.saveModalBtnText}>Save Languages</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 5: EDIT AVAILABILITY ── */}
      <Modal visible={activeModal === 'availability'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Working Availability</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Working Days</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {DAYS_OF_WEEK.map(d => {
                const isSel = editWorkingDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, isSel && styles.dayChipSelected]}
                    onPress={() => {
                      if (isSel) setEditWorkingDays(prev => prev.filter(day => day !== d));
                      else setEditWorkingDays(prev => [...prev, d]);
                    }}
                  >
                    <Text style={[styles.dayChipText, isSel && styles.dayChipTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Working Hours</Text>
            <TextInput style={styles.textInput} value={editWorkingHours} onChangeText={setEditWorkingHours} />

            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveAvailability}>
              <Text style={styles.saveModalBtnText}>Save Availability</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 6: EDIT BANK ── */}
      <Modal visible={activeModal === 'bank'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bank Payout Details</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput style={styles.textInput} value={editBankName} onChangeText={setEditBankName} />

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput style={styles.textInput} value={editAccountNumber} onChangeText={setEditAccountNumber} keyboardType="number-pad" />

            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput style={styles.textInput} value={editIfsc} onChangeText={setEditIfsc} autoCapitalize="characters" />

            <Text style={styles.inputLabel}>UPI ID (Optional)</Text>
            <TextInput style={styles.textInput} value={editUpi} onChangeText={setEditUpi} />

            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveBank}>
              <Text style={styles.saveModalBtnText}>Save Payout Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F5FCF8',
    borderWidth: 1,
    borderColor: '#E1E8E5',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#10243A' },
  contentContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#10243A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  profileCard: { alignItems: 'center', paddingVertical: 18 },
  avatarRingContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  photo: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#FFFFFF' },
  availabilityBadgeRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#0E5B47',
  },
  name: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingValue: { fontSize: 12.5, fontWeight: '700', color: '#475569' },
  partnerIdSecondaryText: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 4 },
  switchRoleSubtleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  switchRoleSubtleText: { fontSize: 11.5, fontWeight: '800', color: '#0E5B47' },

  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: '#0F172A' },
  editIconBtn: { padding: 4, borderRadius: 6, backgroundColor: '#F1F5F9' },
  eyeToggleBtn: { padding: 4, borderRadius: 6, backgroundColor: '#F1F5F9', marginRight: 4 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { backgroundColor: '#EAF8F1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  serviceChipTitle: { fontSize: 12.5, fontWeight: '900', color: '#0E5B47' },
  serviceChipExp: { fontSize: 10.5, color: '#166534', marginTop: 1 },

  langPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  langPillText: { fontSize: 12, fontWeight: '700', color: '#334155' },

  /* Working Availability */
  availabilityList: { gap: 8 },
  availRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  availLabel: { fontSize: 12.5, color: '#64748B' },
  availVal: { fontSize: 12.5, fontWeight: '800', color: '#0F172A' },
  rowDivider: { height: 1, backgroundColor: '#F1F5F9' },

  /* Bank Security & Status */
  statusChipRow: { marginBottom: 12 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  statusChipVerified: { backgroundColor: '#EAF8F1', borderWidth: 1, borderColor: '#A7F3D0' },
  statusChipVerifiedText: { fontSize: 11.5, fontWeight: '800', color: '#0E5B47' },
  statusChipPending: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  statusChipPendingText: { fontSize: 11.5, fontWeight: '800', color: '#B45309' },

  bankGrid: { gap: 6 },
  bankGridRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  bankGridLabel: { fontSize: 12, color: '#64748B' },
  bankGridVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  bankGridValHighlight: { fontSize: 12, fontWeight: '800', color: '#0E5B47' },
  managePayoutLink: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  managePayoutText: { fontSize: 12, fontWeight: '800', color: '#168A68' },

  /* Settings Section */
  settingsSectionHeading: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingIconCircle: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EAF8F1', alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  settingSub: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  settingsDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 6,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#DC2626' },

  /* Modals */
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalOverlayBottom: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#475569', marginTop: 8, marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, fontSize: 12, color: '#0F172A' },
  modalServiceBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  modalAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#EAF8F1', marginVertical: 8 },
  modalAddBtnText: { fontSize: 12, fontWeight: '800', color: '#0E5B47' },
  saveModalBtn: { backgroundColor: '#0E5B47', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveModalBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  langSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  langSelectRowSelected: { backgroundColor: '#EAF8F1', borderColor: '#0E5B47' },
  langSelectText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  langSelectTextSelected: { color: '#0E5B47' },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  dayChipSelected: { backgroundColor: '#0E5B47', borderColor: '#0E5B47' },
  dayChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  dayChipTextSelected: { color: '#FFFFFF' },

  /* Logout Confirmation Modal */
  logoutModalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  logoutIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoutModalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  logoutModalSub: { fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  logoutModalActions: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  logoutCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  logoutCancelText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  logoutConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center' },
  logoutConfirmText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  /* Info Modal */
  infoModalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340, alignItems: 'center' },
  infoModalTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  infoModalBody: { fontSize: 12.5, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  infoModalCloseBtn: { backgroundColor: '#0E5B47', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  infoModalCloseText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
});

