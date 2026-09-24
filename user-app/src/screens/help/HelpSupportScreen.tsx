import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const SUPPORT_EMAIL = 'INFOHELP@GCHOMEPLUS.COM';

export const HelpSupportScreen: React.FC = () => {
  const { goBack, canGoBack, navigateTo, user } = useAuth();

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else if (user?.role === 'maid' || user?.role === 'partner') {
      navigateTo('maid_home');
    } else if (user) {
      navigateTo('customer_home');
    } else {
      navigateTo('login');
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
      // Handle case where no email client is installed
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSub}>Official Customer & Partner Support</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Main Email Support Section */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Mail size={34} color="#0D8846" strokeWidth={2.2} />
          </View>

          <Text style={styles.supportLabel}>Official Email Support</Text>
          <Text style={styles.supportEmail} selectable>{SUPPORT_EMAIL}</Text>

          <Text style={styles.descriptionText}>
            For any queries, booking assistance, account issues, or partner support,
            please write to our official customer care desk.
          </Text>

          {/* Email Support Action Button */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailSupport}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Send email to ${SUPPORT_EMAIL}`}
          >
            <Send size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.emailButtonText}>Email Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          Tapping above opens your email app with {SUPPORT_EMAIL} pre-filled.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : (StatusBar.currentHeight || 14),
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  supportLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  supportEmail: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
    marginBottom: 14,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 8,
  },
  emailButton: {
    width: '100%',
    backgroundColor: '#0D8846',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0D8846',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footnote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
