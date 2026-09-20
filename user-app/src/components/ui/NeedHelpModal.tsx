import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, MessageCircle, HelpCircle, X, ExternalLink } from 'lucide-react-native';

interface NeedHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NeedHelpModal: React.FC<NeedHelpModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <Text style={styles.modalTitle}>Need Assistance?</Text>
              <Text style={styles.modalSub}>Our customer support team is available 24/7</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.optionCard} onPress={onClose} activeOpacity={0.8}>
              <View style={[styles.iconCircle, { backgroundColor: '#EAF8F1' }]}>
                <MessageSquare size={20} color="#168A68" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>In-App Live Support</Text>
                <Text style={styles.optionSubtitle}>Instant answers & booking assistance</Text>
              </View>
              <ExternalLink size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={onClose} activeOpacity={0.8}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <MessageCircle size={20} color="#0284C7" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>WhatsApp Support</Text>
                <Text style={styles.optionSubtitle}>Instant answers & booking help</Text>
              </View>
              <ExternalLink size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={onClose} activeOpacity={0.8}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <HelpCircle size={20} color="#D97706" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>Help Center & FAQs</Text>
                <Text style={styles.optionSubtitle}>Learn how GC Home Plus works</Text>
              </View>
              <ExternalLink size={16} color="#94A3B8" />
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
    marginBottom: 20,
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
  optionsList: {
    gap: 12,
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#10243A',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
});
