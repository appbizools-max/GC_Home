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
} from 'lucide-react-native';
export const UserProfileScreen: React.FC = () => {
  const {
    user,
    maidProfile,
    toggleMaidOnline,
    logout,
    navigateTo,
    savedAddresses,
    updateUserProfile,
  } = useAuth();
  const userName = user?.name && user.name !== 'User' ? user.name : 'Pavani M';
  const userEmail = user?.email || 'pavani@gmail.com';
  const userPhone = user?.phone || '+91 98765 43210';
  const userLocation = 'Kondapur, Hyderabad';
  // Address Modal State
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('addr_1');
  // Payment Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  // Settings Modal State
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  // Notifications Modal State
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifOffers, setNotifOffers] = useState(false);
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
  const handleAvatarChange = () => {
    Alert.alert('Change Profile Photo', 'Choose photo source:', [
      {
        text: 'Camera',
        onPress: () => {
          updateUserProfile({
            profilePhoto:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          });
          Alert.alert('Photo Updated', 'New profile photo set successfully.');
        },
      },
      {
        text: 'Photo Gallery',
        onPress: () => {
          updateUserProfile({
            profilePhoto:
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          });
          Alert.alert('Photo Selected', 'Gallery photo applied.');
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
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };
  return (
    <View style={styles.screenWrapper}>
      {/* Top Header: My Profile */}
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
            <Image
              source={{
                uri:
                  user?.profilePhoto ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
              }}
              style={styles.avatarImg}
            />
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleAvatarChange}
              activeOpacity={0.85}
            >
              <Camera size={12} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfoCol}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileMeta}>{userEmail}</Text>
            <Text style={styles.profileMeta}>{userPhone}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#0D8846" />
              <Text style={styles.locationText}>{userLocation}</Text>
            </View>
          </View>
          {/* Member Badge */}
          <View style={styles.memberBadge}>
            <Star size={14} color="#0D8846" fill="#0D8846" />
            <View>
              <Text style={styles.memberBadgeSub}>Member Since</Text>
              <Text style={styles.memberBadgeDate}>Sep 2026</Text>
            </View>
          </View>
        </View>
        {/* Approved Maid Partner Toggle Card */}
        {maidProfile?.status === 'approved' ? (
          <TouchableOpacity
            onPress={toggleMaidOnline}
            style={[
              styles.partnerBannerCard,
              { backgroundColor: maidProfile.isOnline ? '#043927' : '#0F172A', marginTop: 12 }
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
            >
              <View style={styles.partnerIconBox}>
                <Leaf size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.partnerCardTitle}>GC Maid Partner Program</Text>
                  <View style={styles.partnerPill}>
                    <Text style={styles.partnerPillText}>Earn ₹35k/mo</Text>
                  </View>
                </View>
                <Text style={styles.partnerCardSub}>
                  Flexible hours, insurance & weekly payouts
                </Text>
              </View>
              <ChevronRight size={18} color="#0D8846" />
            </TouchableOpacity>
          )
        )}
        {/* Menu Items List */}
        <View style={styles.menuContainer}>
          {/* 1. Personal Information */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <User size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Personal Information</Text>
              <Text style={styles.menuSubtitle}>
                Name, phone number, email, address
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          {/* 2. Addresses */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsAddressModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Home size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Addresses</Text>
              <Text style={styles.menuSubtitle}>Manage your saved addresses</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          {/* 3. Payment Methods */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsPaymentModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <CreditCard size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Payment Methods</Text>
              <Text style={styles.menuSubtitle}>
                Manage your cards, UPI and wallets
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          {/* 4. Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsNotificationModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Bell size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>
                Booking updates, offers and more
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          {/* 5. App Settings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <SlidersHorizontal size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>App Settings</Text>
              <Text style={styles.menuSubtitle}>
                Language, theme, preferences
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          {/* 6. Help & Support */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleHelpAndSupport}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <HelpCircle size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSubtitle}>FAQs, contact us</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          {/* 7. Privacy & Security */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePrivacySecurity}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <ShieldCheck size={18} color="#0D8846" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Privacy & Security</Text>
              <Text style={styles.menuSubtitle}>
                Data, security and privacy settings
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />
          {/* 9. Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
              <LogOut size={18} color="#DC2626" strokeWidth={2.2} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Logout</Text>
              <Text style={styles.menuSubtitle}>Sign out from your account</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
            <View style={{ gap: 10 }}>
              {(savedAddresses || []).map(addr => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => setSelectedAddressId(addr.id)}
                    style={[styles.addressItemCard, isSelected && styles.addressItemCardActive]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addressLeft}>
                      <View style={[styles.addrTag, isSelected && styles.addrTagActive]}>
                        <Text style={[styles.addrTagText, isSelected && styles.addrTagTextActive]}>
                          {addr.label.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.addrLine1}>{addr.street}</Text>
                      <Text style={styles.addrLine2}>
                        {addr.locality}, {addr.city} - {addr.pincode}
                      </Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                Alert.alert('Add Address', 'Enter new address in your next booking or checkout.');
                setIsAddressModalVisible(false);
              }}
              activeOpacity={0.88}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.modalActionBtnText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    paddingTop: Platform.OS === 'ios' ? 14 : 12,
    paddingBottom: 12,
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
    marginTop: 2,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4FBF7',
    borderWidth: 1,
    borderColor: '#D1F2DF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editProfilePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D8846',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
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
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D8846',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F2E23',
  },
  profileMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  memberBadge: {
    backgroundColor: '#E8F8EE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  memberBadgeSub: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
  },
  memberBadgeDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D8846',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2E23',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },
  partnerBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F8EE',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1F2DF',
  },
  partnerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0D8846',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2E23',
  },
  partnerPill: {
    backgroundColor: '#0D8846',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  partnerPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  partnerCardSub: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EBF5F0',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F2E23',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 14,
  },
  bottomCommunityBanner: {
    backgroundColor: '#F4FBF7',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2F4EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityGraphicLeft: {
    marginRight: 10,
  },
  communityTextCol: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D8846',
  },
  communitySub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  leavesRight: {
    marginLeft: 8,
    opacity: 0.8,
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
