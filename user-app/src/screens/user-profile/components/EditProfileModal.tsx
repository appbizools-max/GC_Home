import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, User, Mail, Phone, MapPin, Check, ChevronRight } from 'lucide-react-native';

interface EditProfileModalProps {
  visible: boolean;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  currentAddressText?: string;
  onManageAddress?: () => void;
  onSave: (data: { name: string; email: string; phone: string }) => Promise<boolean>;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  initialName,
  initialEmail,
  initialPhone,
  currentAddressText,
  onManageAddress,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [phone, setPhone] = useState(initialPhone || '');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setEmail(initialEmail || '');
      setPhone(initialPhone || '');
      setNameError('');
      setEmailError('');
      setPhoneError('');
      setIsSaving(false);
    }
  }, [visible, initialName, initialEmail, initialPhone]);

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (phoneError) setPhoneError('');
  };

  const validate = (): boolean => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPhoneError('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Please enter a valid full name (minimum 2 characters).');
      isValid = false;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
      }
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanDigits.length === 10 ? `+91 ${cleanDigits}` : phone.trim();

    try {
      const success = await onSave({
        name: name.trim(),
        email: email.trim(),
        phone: formattedPhone,
      });

      if (success) {
        setIsSaving(false);
        onClose();
      } else {
        setIsSaving(false);
        setNameError('Could not save changes. Please try again.');
      }
    } catch {
      setIsSaving(false);
      setNameError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetContainer}
          >
            <View style={styles.modalSheet}>
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.headerIconCircle}>
                    <User size={18} color="#0D8846" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Personal Information</Text>
                    <Text style={styles.modalSub}>Edit and update your profile details</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL NAME *</Text>
                  <View style={[styles.inputBox, Boolean(nameError) && styles.inputBoxError]}>
                    <User size={18} color={nameError ? '#DC2626' : '#64748B'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={text => {
                        setName(text);
                        if (nameError) setNameError('');
                      }}
                      autoCapitalize="words"
                      editable={!isSaving}
                    />
                  </View>
                  {Boolean(nameError) && (
                    <Text style={styles.errorText}>{nameError}</Text>
                  )}
                </View>

                {/* Email Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <View style={[styles.inputBox, Boolean(emailError) && styles.inputBoxError]}>
                    <Mail size={18} color={emailError ? '#DC2626' : '#64748B'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. john@example.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={text => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isSaving}
                    />
                  </View>
                  {Boolean(emailError) && (
                    <Text style={styles.errorText}>{emailError}</Text>
                  )}
                </View>

                {/* Mobile Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MOBILE NUMBER *</Text>
                  <View style={[styles.inputBox, Boolean(phoneError) && styles.inputBoxError]}>
                    <Phone size={18} color={phoneError ? '#DC2626' : '#64748B'} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor="#94A3B8"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      editable={!isSaving}
                    />
                  </View>
                  {Boolean(phoneError) && (
                    <Text style={styles.errorText}>{phoneError}</Text>
                  )}
                </View>

                {/* Current Delivery Address Shortcut */}
                {Boolean(currentAddressText) && (
                  <View style={styles.addressShortcutBox}>
                    <View style={styles.addressShortcutHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MapPin size={15} color="#0D8846" />
                        <Text style={styles.addressShortcutTitle}>SAVED ADDRESS</Text>
                      </View>
                      {onManageAddress && (
                        <TouchableOpacity
                          onPress={() => {
                            onClose();
                            setTimeout(() => {
                              onManageAddress();
                            }, 300);
                          }}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                        >
                          <Text style={styles.manageAddressLink}>Manage</Text>
                          <ChevronRight size={13} color="#0D8846" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.addressShortcutText} numberOfLines={2}>
                      {currentAddressText}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.88}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    maxHeight: 380,
  },
  formContent: {
    paddingVertical: 14,
    gap: 14,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  inputBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  addressShortcutBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  addressShortcutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressShortcutTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  manageAddressLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D8846',
  },
  addressShortcutText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 17,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0D8846',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0D8846',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
