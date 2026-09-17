import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  User,
  Sparkles,
  CheckCircle,
  Clock,
  Edit2,
  Briefcase,
  Smartphone,
} from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { loginWithPhone, loginAsDemoCustomer, loginAsDemoMaid } = useAuth();
  const [role, setRole] = useState<'customer' | 'partner'>('customer');
  const [phoneNumber, setPhoneNumber] = useState('9849201824');
  const [otp, setOtp] = useState(['7', '4', '9', '2', '', '']);
  const [activeDigit, setActiveDigit] = useState(4);
  const [countdown, setCountdown] = useState(28);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      setActiveDigit(index + 1);
    }
  };

  const handleVerifyAndContinue = () => {
    const fullPhone = `+91 ${phoneNumber}`;
    const name = role === 'partner' ? 'Sunita Devi' : 'Rahul Verma';
    if (role === 'partner') {
      loginAsDemoMaid();
    } else {
      loginWithPhone(fullPhone, name);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Background Ambient Glow */}
      <View style={styles.ambientGlowTop} />

      {/* Hero & Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80',
            }}
            style={styles.logoImage}
          />
          <View style={styles.logoBadge}>
            <CheckCircle size={12} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.brandTitle}>Welcome to GC Home Plus</Text>
        <Text style={styles.brandSubtitle}>Genuine Cleaning. Genuine Care.</Text>
      </View>

      {/* Unified Role Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, role === 'customer' && styles.segmentBtnActive]}
          onPress={() => setRole('customer')}
          activeOpacity={0.85}
        >
          <User size={16} color={role === 'customer' ? '#2D8A68' : '#64748B'} />
          <Text style={[styles.segmentText, role === 'customer' && styles.segmentTextActive]}>
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, role === 'partner' && styles.segmentBtnActive]}
          onPress={() => setRole('partner')}
          activeOpacity={0.85}
        >
          <Sparkles size={16} color={role === 'partner' ? '#2D8A68' : '#64748B'} />
          <Text style={[styles.segmentText, role === 'partner' && styles.segmentTextActive]}>
            Cleaning Partner
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step 1: Mobile Phone Context Display Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
          <View style={styles.smsSentBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.smsSentText}>SMS Sent</Text>
          </View>
        </View>

        <View style={styles.phoneInputRow}>
          <View style={styles.countryBadge}>
            <Text style={styles.flagEmoji}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneNumberInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="98492 01824"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.editIconBtn}>
            <Edit2 size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 2: 6-Digit OTP Verification Card */}
      <View style={styles.card}>
        <View style={styles.otpHeaderRow}>
          <View style={styles.otpIconCircle}>
            <Smartphone size={18} color="#2D8A68" />
          </View>
          <Text style={styles.otpTitle}>Verify your mobile number</Text>
        </View>
        <Text style={styles.otpSub}>
          Enter the 6-digit OTP code sent via SMS to <Text style={styles.boldPhone}>+91 {phoneNumber}</Text>
        </Text>

        {/* 6-Digit OTP Box Grid */}
        <View style={styles.otpGrid}>
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <TextInput
              key={idx}
              style={[
                styles.otpBox,
                activeDigit === idx && styles.otpBoxActive,
                otp[idx] ? styles.otpBoxFilled : null,
              ]}
              value={otp[idx]}
              onChangeText={text => handleDigitChange(text, idx)}
              keyboardType="number-pad"
              maxLength={1}
              onFocus={() => setActiveDigit(idx)}
            />
          ))}
        </View>

        {/* Resend Timer */}
        <View style={styles.resendSection}>
          <View style={styles.resendTimerRow}>
            <View style={styles.timerGroup}>
              <Clock size={14} color="#64748B" />
              <Text style={styles.timerText}>
                Resend OTP in <Text style={styles.timerCount}>00:{countdown < 10 ? `0${countdown}` : countdown}</Text>
              </Text>
            </View>
            <TouchableOpacity
              disabled={countdown > 0}
              onPress={() => setCountdown(30)}
            >
              <Text style={[styles.resendSmsText, countdown > 0 && styles.resendDisabled]}>
                Resend SMS
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleVerifyAndContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Verify & Continue</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ⚡ Instant One-Tap Demo Access Box */}
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>⚡ INSTANT ONE-TAP DEMO ACCESS</Text>
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity
            style={styles.demoCustomerBtn}
            onPress={loginAsDemoCustomer}
            activeOpacity={0.85}
          >
            <User size={15} color="#1E4E3D" />
            <Text style={styles.demoCustomerBtnText}>Customer Demo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoMaidBtn}
            onPress={loginAsDemoMaid}
            activeOpacity={0.85}
          >
            <Sparkles size={15} color="#FFFFFF" />
            <Text style={styles.demoMaidBtnText}>Maid Partner Demo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Partner Onboarding Hint Card (Visible when Partner selected) */}
      {role === 'partner' && (
        <View style={styles.partnerHintCard}>
          <Briefcase size={20} color="#2D8A68" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerHintTitle}>Cleaning Specialist Access</Text>
            <Text style={styles.partnerHintSub}>
              Log in to view your daily booked jobs, client locations, and earnings payout ledger.
            </Text>
          </View>
        </View>
      )}

      {/* Legal Footer */}
      <Text style={styles.legalFooterText}>
        By continuing, you agree to GC Home Plus{' '}
        <Text style={styles.legalLink}>Terms of Service</Text> &{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>.
      </Text>
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
    gap: 14,
    paddingBottom: 40,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DCFCE7',
    opacity: 0.6,
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2D8A68',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  segmentedControl: {
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  smsSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2D8A68',
  },
  smsSentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D8A68',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 14,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneNumberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  editIconBtn: {
    padding: 6,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  otpIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  boldPhone: {
    fontWeight: '700',
    color: '#0F172A',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxActive: {
    borderColor: '#2D8A68',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  otpBoxFilled: {
    backgroundColor: '#EBF8F2',
    borderColor: '#BBE9D2',
  },
  resendSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginBottom: 14,
  },
  resendTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    color: '#64748B',
  },
  timerCount: {
    fontWeight: '800',
    color: '#2D8A68',
  },
  resendSmsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D8A68',
  },
  resendDisabled: {
    color: '#94A3B8',
  },
  primaryBtn: {
    backgroundColor: '#1E4E3D',
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E4E3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBE9D2',
    gap: 8,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2D8A68',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoCustomerBtn: {
    flex: 1,
    backgroundColor: '#EBF8F2',
    borderWidth: 1,
    borderColor: '#BBE9D2',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  demoCustomerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  demoMaidBtn: {
    flex: 1,
    backgroundColor: '#2D8A68',
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  demoMaidBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  partnerHintCard: {
    backgroundColor: '#EBF8F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBE9D2',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  partnerHintTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E4E3D',
  },
  partnerHintSub: {
    fontSize: 11,
    color: '#2D8A68',
    marginTop: 2,
    lineHeight: 15,
  },
  legalFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  legalLink: {
    color: '#2D8A68',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
