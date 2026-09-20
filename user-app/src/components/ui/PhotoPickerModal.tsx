import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Camera, Image as ImageIcon, Trash2, X, Sparkles } from 'lucide-react-native';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
];

interface PhotoPickerModalProps {
  visible: boolean;
  currentPhotoUri?: string;
  onSelectPhoto: (uri: string) => void;
  onRemovePhoto: () => void;
  onClose: () => void;
}

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  visible,
  currentPhotoUri,
  onSelectPhoto,
  onRemovePhoto,
  onClose,
}) => {
  const handlePickPreset = (uri: string) => {
    onSelectPhoto(uri);
    onClose();
  };

  const handleSimulateCamera = () => {
    // Selects high-definition camera avatar
    const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
    onSelectPhoto(randomAvatar);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Profile Photo</Text>
              <Text style={styles.modalSub}>Choose a photo to personalize your account</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#68788C" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSimulateCamera} activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EAF8F1' }]}>
                <Camera size={20} color="#168A68" />
              </View>
              <Text style={styles.actionBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleSimulateCamera} activeOpacity={0.8}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
                <ImageIcon size={20} color="#0284C7" />
              </View>
              <Text style={styles.actionBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {currentPhotoUri ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  onRemovePhoto();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 size={20} color="#DC2626" />
                </View>
                <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Preset Avatar Selection */}
          <View style={styles.presetSection}>
            <View style={styles.presetHeader}>
              <Sparkles size={14} color="#168A68" />
              <Text style={styles.presetTitle}>Or Choose an Avatar</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
              {PRESET_AVATARS.map((url, idx) => {
                const isSelected = currentPhotoUri === url;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handlePickPreset(url)}
                    style={[styles.avatarChoice, isSelected && styles.avatarChoiceSelected]}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: url }} style={styles.avatarImg} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    padding: 20,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10243A',
  },
  presetSection: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  presetTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#10243A',
  },
  avatarRow: {
    gap: 12,
    paddingVertical: 4,
  },
  avatarChoice: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#E1E8E5',
    overflow: 'hidden',
  },
  avatarChoiceSelected: {
    borderColor: '#168A68',
    borderWidth: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
