import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Mail, X, Send } from 'lucide-react-native';

const SUPPORT_EMAIL = 'INFOHELP@GCHOMEPLUS.COM';

interface NeedHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NeedHelpModal: React.FC<NeedHelpModalProps> = ({ visible, onClose }) => {
  const handleEmailSupport = () => {
    onClose();
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.modalTitle}>Need Assistance?</Text>
              <Text style={styles.modalSub}>Official Customer & Partner Support</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Mail size={28} color="#0D8846" strokeWidth={2.2} />
            </View>
            <Text style={styles.supportLabel}>Official Email Support</Text>
            <Text style={styles.supportEmail} selectable>{SUPPORT_EMAIL}</Text>
            <Text style={styles.supportDesc}>
              Tap the button below to open your email application and send an inquiry directly to our support desk.
            </Text>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailSupport}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
            >
              <Send size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.emailButtonText}>Email Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 36, 58, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  titleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#10243A',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#68788C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  card: {
    backgroundColor: '#F8FCFA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  supportEmail: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  supportDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  emailButton: {
    width: '100%',
    backgroundColor: '#0D8846',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
