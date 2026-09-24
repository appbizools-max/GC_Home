import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  Linking,
  Share,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../config/supabase';
import {
  Settings,
  Camera,
  MapPin,
  Star,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Home,
  CreditCard,
  Bell,
  SlidersHorizontal,
  HelpCircle,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Leaf,
  Plus,
  X,
  Smartphone,
  ToggleRight,
  ToggleLeft,
  Check,
  Edit2,
  Trash2,
  Star as StarIcon,
} from 'lucide-react-native';
import { AddressFormModal } from '../../components/ui/AddressFormModal';
import { Address } from '../../types';
import { SettingsRow } from './components/SettingsRow';
import { LogoutModal } from './components/LogoutModal';
import appJson from '../../../app.json';

export const UserProfileScreen: React.FC = () => {
  const {
    user,
    maidProfile,
    toggleMaidOnline,
    logout,
    navigateTo,
    savedAddresses,
    updateUserProfile,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    setDefaultSavedAddress,
  } = useAuth();
  const userName = user?.name && user.name !== 'User' ? user.name : 'Pavani M';
  const userEmail = user?.email || 'madathala.pavani.5@gmail.com';
  const userPhone = user?.phone || '+91 9390420247';
  const userLocation = 'Kondapur, Hyderabad';
  const appVersion = appJson?.expo?.version || '2.0.0';

  // Address Modal State
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('addr_1');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Payment Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

  // Settings Modal State
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  // Notifications Modal State
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifOffers, setNotifOffers] = useState(false);

  // Logout Modal State
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  const handleEditProfile = () => {
    Alert.prompt
      ? Alert.prompt(
        'Edit Name',
        'Enter your updated display name:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (newName?: string) => {
              if (newName?.trim()) {
                updateUserProfile({ name: newName.trim() });
                Alert.alert('Profile Updated', `Name updated to ${newName.trim()}`);
              }
            },
          },
        ],
        'plain-text',
        userName
      )
      : Alert.alert('Edit Profile', 'Profile Details:\n\n• Name: ' + userName + '\n• Phone: ' + userPhone + '\n• Email: ' + userEmail);
  };

  const savePhotoToStorage = async (uri: string, base64?: string): Promise<string> => {
    const ext = 'jpg';
    const filePath = `profile-photos/customer/${user?.uid || 'user'}_${Date.now()}.${ext}`;

    try {
      let body: any;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        body = await response.blob();
      } else if (base64) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        body = new Uint8Array(byteNumbers);
      } else {
        const response = await fetch(uri);
        body = await response.blob();
      }

      const { data, error } = await supabase.storage.from('gc-home-assets').upload(filePath, body, {
        contentType: 'image/jpeg',
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from('gc-home-assets').getPublicUrl(filePath);
        if (urlData?.publicUrl) return urlData.publicUrl;
      }

      if (base64) return `data:image/jpeg;base64,${base64}`;
      return uri;
    } catch {
      if (base64) return `data:image/jpeg;base64,${base64}`;
      return uri;
    }
  };

  const handleAvatarChange = () => {
    Alert.alert('Change Profile Photo', 'Select photo source:', [
      {
        text: 'Take Photo (Front Camera)',
        onPress: async () => {
          try {
            if (Platform.OS !== 'web') {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Camera Permission Required', 'Camera permission is required to take your photo.');
                return;
              }
            }
            const result = await ImagePicker.launchCameraAsync({
              cameraType: ImagePicker.CameraType.front,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.75,
              base64: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              const finalUrl = await savePhotoToStorage(asset.uri, asset.base64 || undefined);
              updateUserProfile({ profilePhoto: finalUrl });
              Alert.alert('Success', 'Profile photo updated successfully.');
            }
          } catch (e: any) {
            Alert.alert('Camera Error', e?.message || 'Unable to open camera.');
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          try {
            if (Platform.OS !== 'web') {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Gallery Permission Required', 'Gallery permission is required to choose a photo.');
                return;
              }
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.75,
              base64: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              const finalUrl = await savePhotoToStorage(asset.uri, asset.base64 || undefined);
              updateUserProfile({ profilePhoto: finalUrl });
              Alert.alert('Success', 'Profile photo updated successfully.');
            }
          } catch (e: any) {
            Alert.alert('Gallery Error', e?.message || 'Unable to open gallery.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleHelpAndSupport = () => {
    navigateTo('help');
  };

  const handlePrivacySecurity = () => {
    Alert.alert(
      'Privacy & Security',
      'GC HOME+ protects your privacy.\n\n• 256-bit SSL Data Encryption\n• Verified Professional Cleaners\n• Strict Background Checks\n• 100% Secure Payment Gateways'
    );
  };

  const handleLogoutClick = () => {
    setIsLogoutModalVisible(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalVisible(false);
    logout();
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header: My Profile (Tightened padding so card appears higher) */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account and preferences
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                <User size={38} color="#94A3B8" />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleAvatarChange}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Camera size={13} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfoCol}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.profileMeta} numberOfLines={1} ellipsizeMode="tail">
              {userEmail}
            </Text>
            <Text style={styles.profileMeta}>
              {userPhone}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={13} color="#0D8846" />
              <Text style={styles.locationText} numberOfLines={1}>
                {userLocation}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileLink}
              onPress={handleEditProfile}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
            >
              <Text style={styles.editProfileLinkText}>Edit Profile</Text>
              <ChevronRight size={14} color="#0D8846" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Approved Maid Partner Toggle Card */}
        {maidProfile?.status === 'approved' ? (
          <TouchableOpacity
            onPress={toggleMaidOnline}
            style={[
              styles.partnerBannerCard,
              { backgroundColor: maidProfile.isOnline ? '#123D2A' : '#171A18' }
            ]}
            activeOpacity={0.88}
          >
            <View style={[styles.partnerIconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              {maidProfile.isOnline ? <ToggleRight size={22} color="#4ADE80" /> : <ToggleLeft size={22} color="#F87171" />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.partnerCardTitle, { color: '#FFFFFF' }]}>
                  {maidProfile.isOnline ? 'Maid Partner Mode: ONLINE 🟢' : 'Maid Partner Mode: OFFLINE 🔴'}
                </Text>
              </View>
              <Text style={[styles.partnerCardSub, { color: maidProfile.isOnline ? '#A7F3D0' : '#94A3B8' }]}>
                {maidProfile.isOnline
                  ? 'Currently active. Tap to go OFFLINE & view Customer App.'
                  : 'Currently in Customer Mode. Tap to go ONLINE & receive job offers.'}
              </Text>
            </View>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          /* Partner Program Shortcut for non-maids */
          user?.role === 'customer' && (
            <TouchableOpacity
              onPress={() => navigateTo('become_maid_info')}
              style={styles.partnerBannerCard}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="GC Maid Partner Program. Flexible hours, insurance and weekly payouts. Earn up to 35k per month."
            >
              <View style={styles.partnerIconBox}>
                <Leaf size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.partnerHeaderRow}>
                  <Text style={styles.partnerCardTitle}>GC Maid Partner Program</Text>
                  <View style={styles.partnerTag}>
                    <Text style={styles.partnerTagText}>For Partners</Text>
                  </View>
                </View>
                <Text style={styles.partnerCardSub}>
                  Flexible hours, insurance & weekly payouts
                </Text>
                <View style={styles.partnerBadgeRow}>
                  <View style={styles.partnerPill}>
                    <Text style={styles.partnerPillText}>Earn ₹35k/mo</Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={18} color="#0D8846" />
            </TouchableOpacity>
          )
        )}

        {/* ── 1. ACCOUNT SECTION ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeaderText}>ACCOUNT</Text>
        </View>
        <View style={styles.menuContainer}>
          <SettingsRow
            icon={User}
            title="Personal Information"
            description="Name, phone number, email, address"
            onPress={handleEditProfile}
          />
          <SettingsRow
            icon={Home}
            title="Addresses"
            description="Manage your saved addresses"
            onPress={() => setIsAddressModalVisible(true)}
          />
          <SettingsRow
            icon={CreditCard}
            title="Payment Methods"
            description="Manage your cards, UPI and wallets"
            trailingBadge="UPI added"
            onPress={() => setIsPaymentModalVisible(true)}
            isLast
          />
        </View>

        {/* ── 2. PREFERENCES SECTION ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeaderText}>PREFERENCES</Text>
        </View>
        <View style={styles.menuContainer}>
          <SettingsRow
            icon={Bell}
            title="Notifications"
            description="Booking updates, offers and more"
            onPress={() => setIsNotificationModalVisible(true)}
          />
          <SettingsRow
            icon={SlidersHorizontal}
            title="App Settings"
            description="Language, theme, preferences"
            onPress={() => setIsSettingsModalVisible(true)}
            isLast
          />
        </View>

        {/* ── 3. SUPPORT & SECURITY SECTION ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeaderText}>SUPPORT & SECURITY</Text>
        </View>
        <View style={styles.menuContainer}>
          <SettingsRow
            icon={HelpCircle}
            title="Help & Support"
            description="FAQs, contact us"
            onPress={handleHelpAndSupport}
          />
          <SettingsRow
            icon={ShieldCheck}
            title="Privacy & Security"
            description="Data, security and privacy settings"
            onPress={handlePrivacySecurity}
            isLast
          />
        </View>

        {/* ── 4. ACCOUNT ACTION SECTION ── */}
        <View style={styles.sectionHeaderBox}>
          <Text style={styles.sectionHeaderText}>ACCOUNT ACTION</Text>
        </View>
        <View style={styles.menuContainer}>
          <SettingsRow
            icon={LogOut}
            title="Logout"
            description="Sign out from your account"
            isDestructive
            onPress={handleLogoutClick}
            isLast
          />
        </View>

        {/* Version Footer */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionAppName}>GC Home Plus</Text>
          <Text style={styles.versionNumber}>Version {appVersion}</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <LogoutModal
        visible={isLogoutModalVisible}
        onCancel={() => setIsLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. SAVED ADDRESSES MODAL SHEET
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsAddressModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Home size={18} color="#0D8846" />
                <Text style={styles.modalTitle}>Saved Addresses</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddressModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                {(savedAddresses || []).length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 13 }}>No saved addresses found. Add a new address below.</Text>
                  </View>
                ) : (
                  (savedAddresses || []).map(addr => {
                    const isSelected = selectedAddressId === addr.id || addr.isDefault;
                    return (
                      <View
                        key={addr.id}
                        style={[styles.addressItemCard, isSelected && styles.addressItemCardActive, { flexDirection: 'column', alignItems: 'stretch' }]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <View style={[styles.addrTag, isSelected && styles.addrTagActive]}>
                                <Text style={[styles.addrTagText, isSelected && styles.addrTagTextActive]}>
                                  {addr.label.toUpperCase()}
                                </Text>
                              </View>
                              {addr.isDefault && (
                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309' }}>DEFAULT</Text>
                                </View>
                              )}
                            </View>
                            {Boolean(addr.houseFlat) && (
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{addr.houseFlat}</Text>
                            )}
                            <Text style={styles.addrLine1}>{addr.street}</Text>
                            <Text style={styles.addrLine2}>
                              {addr.locality}, {addr.city} {addr.state ? `, ${addr.state}` : ''} - {addr.pincode}
                            </Text>
                            {Boolean(addr.landmark) && (
                              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Landmark: {addr.landmark}</Text>
                            )}
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                          {!addr.isDefault && (
                            <TouchableOpacity
                              onPress={() => setDefaultSavedAddress(addr.id)}
                              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1' }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Set Default</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              setEditingAddress(addr);
                              setIsFormModalVisible(true);
                            }}
                            style={{ padding: 6, backgroundColor: '#F1F5F9', borderRadius: 6 }}
                          >
                            <Edit2 size={14} color="#0D8846" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert('Delete Address', `Are you sure you want to delete "${addr.label}" address?`, [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: () => deleteSavedAddress(addr.id),
                                },
                              ]);
                            }}
                            style={{ padding: 6, backgroundColor: '#FEF2F2', borderRadius: 6 }}
                          >
                            <Trash2 size={14} color="#991B1B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setEditingAddress(null);
                setIsFormModalVisible(true);
              }}
              activeOpacity={0.88}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.modalActionBtnText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AddressFormModal
        visible={isFormModalVisible}
        initialAddress={editingAddress}
        onSave={async addressData => {
          if (editingAddress) {
            await updateSavedAddress(editingAddress.id, addressData);
          } else {
            await addSavedAddress(addressData);
          }
        }}
        onClose={() => {
          setIsFormModalVisible(false);
          setEditingAddress(null);
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. PAYMENT METHODS MODAL SHEET
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsPaymentModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="#0D8846" />
                <Text style={styles.modalTitle}>Payment Methods</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPaymentModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <View style={styles.payOptionRow}>
                <Smartphone size={20} color="#0D8846" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.payOptionTitle}>UPI Instant Pay</Text>
                  <Text style={styles.payOptionSub}>Google Pay, PhonePe, Paytm, BHIM</Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Enabled</Text>
                </View>
              </View>

              <View style={styles.payOptionRow}>
                <CreditCard size={20} color="#0D8846" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.payOptionTitle}>Credit & Debit Cards</Text>
                  <Text style={styles.payOptionSub}>Visa, Mastercard, RuPay</Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Enabled</Text>
                </View>
              </View>

              <View style={styles.payOptionRow}>
                <ShieldCheck size={20} color="#0D8846" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.payOptionTitle}>Pay After Clean Service</Text>
                  <Text style={styles.payOptionSub}>Pay cash or UPI after job finishes</Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Default</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => setIsPaymentModalVisible(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.modalActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          3. NOTIFICATIONS MODAL SHEET
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isNotificationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsNotificationModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color="#0D8846" />
                <Text style={styles.modalTitle}>Notification Preferences</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsNotificationModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={styles.notifToggleRow}
                onPress={() => setNotifPush(!notifPush)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Booking Tracking & OTP</Text>
                  <Text style={styles.notifSub}>Real-time updates when maid is en-route</Text>
                </View>
                <View style={[styles.switchTrack, notifPush && styles.switchTrackActive]}>
                  <View style={[styles.switchThumb, notifPush && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notifToggleRow}
                onPress={() => setNotifWhatsapp(!notifWhatsapp)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>WhatsApp Confirmation</Text>
                  <Text style={styles.notifSub}>Receive service receipts on WhatsApp</Text>
                </View>
                <View style={[styles.switchTrack, notifWhatsapp && styles.switchTrackActive]}>
                  <View style={[styles.switchThumb, notifWhatsapp && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notifToggleRow}
                onPress={() => setNotifOffers(!notifOffers)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Offers & Seasonal Discounts</Text>
                  <Text style={styles.notifSub}>Special holiday discount promo codes</Text>
                </View>
                <View style={[styles.switchTrack, notifOffers && styles.switchTrackActive]}>
                  <View style={[styles.switchThumb, notifOffers && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                Alert.alert('Preferences Saved', 'Your notification settings have been updated.');
                setIsNotificationModalVisible(false);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalActionBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          4. APP SETTINGS MODAL SHEET
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isSettingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsSettingsModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Settings size={18} color="#0D8846" />
                <Text style={styles.modalTitle}>App Settings</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSettingsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>App Language</Text>
                <Text style={styles.settingsVal}>English (India)</Text>
              </View>

              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Currency</Text>
                <Text style={styles.settingsVal}>Indian Rupee (₹)</Text>
              </View>

              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Service City</Text>
                <Text style={styles.settingsVal}>Hyderabad</Text>
              </View>

              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>App Version</Text>
                <Text style={styles.settingsVal}>v2.4.0 (Latest)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => setIsSettingsModalVisible(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.modalActionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FCFA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F2E23',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0D8846',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2E23',
  },
  profileMeta: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  editProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6EAD4',
  },
  editProfileLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8846',
  },
  partnerBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F8EE',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1F2DF',
  },
  partnerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0D8846',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F2E23',
  },
  partnerTag: {
    backgroundColor: 'rgba(13,136,70,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partnerTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0D8846',
  },
  partnerBadgeRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerPill: {
    backgroundColor: '#0D8846',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  partnerPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  partnerCardSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  sectionHeaderBox: {
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  versionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  versionAppName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  versionNumber: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 14,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  addressItemCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#0D8846',
  },
  addressLeft: {
    flex: 1,
    gap: 2,
  },
  addrTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  addrTagActive: {
    backgroundColor: '#E6F4EA',
  },
  addrTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  addrTagTextActive: {
    color: '#0D8846',
  },
  addrLine1: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  addrLine2: {
    fontSize: 11,
    color: '#64748B',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: '#0D8846',
    borderColor: '#0D8846',
  },
  modalActionBtn: {
    backgroundColor: '#0D8846',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  payOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  payOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  payOptionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  activePill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D8846',
  },
  notifToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    backgroundColor: '#0D8846',
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
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  settingsLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  settingsVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
