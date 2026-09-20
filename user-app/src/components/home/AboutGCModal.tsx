import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ShieldCheck, Leaf, HeartHandshake, Sparkles, X, Check } from 'lucide-react-native';

interface AboutGCModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutGCModal: React.FC<AboutGCModalProps> = ({ visible, onClose }) => {
  const points = [
    {
      icon: ShieldCheck,
      title: 'Triple-Layer Background Verification',
      sub: 'Every cleaning specialist undergoes criminal record screening and government ID verification.',
    },
    {
      icon: Leaf,
      title: 'Eco-Certified & Child-Safe Solutions',
      sub: '100% non-toxic, pet-friendly cleaning detergents and hospital-grade sanitizers.',
    },
    {
      icon: Sparkles,
      title: 'Hospitality-Grade Training',
      sub: 'Trained by industry veterans with deep domain expertise across premium urban residences.',
    },
    {
      icon: HeartHandshake,
      title: '₹3,00,000 Service Guarantee',
      sub: 'Complete peace of mind with accidental damage coverage and free 24-hour re-cleaning.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Genuine Cleaning. Genuine Care.</Text>
              <Text style={styles.modalSub}>Our commitment to your home and health</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {points.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <View key={idx} style={styles.pointCard}>
                  <View style={styles.iconBox}>
                    <IconComp size={20} color="#168A68" strokeWidth={2.2} />
                  </View>
                  <View style={styles.pointTextCol}>
                    <Text style={styles.pointTitle}>{p.title}</Text>
                    <Text style={styles.pointSub}>{p.sub}</Text>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.doneBtnText}>Got it, Thanks!</Text>
            </TouchableOpacity>
          </ScrollView>
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
    padding: 20,
    maxHeight: '80%',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10243A',
  },
  modalSub: {
    fontSize: 12,
    color: '#68788C',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  contentScroll: {
    maxHeight: 400,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5FCF8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8E5',
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF8F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointTextCol: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10243A',
  },
  pointSub: {
    fontSize: 11.5,
    color: '#68788C',
    marginTop: 2,
    lineHeight: 15,
  },
  doneBtn: {
    backgroundColor: '#168A68',
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
