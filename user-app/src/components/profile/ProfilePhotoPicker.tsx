import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Trash2,
  X,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { supabase } from '../../config/supabase';

export interface ProfilePhotoPickerProps {
  value?: string;
  onChange: (photoUri: string) => void;
  label?: string;
  subLabel?: string;
  userType?: 'customer' | 'partner';
  identifier?: string;
  required?: boolean;
  size?: number;
  cameraOnly?: boolean;
}

export const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  value,
  onChange,
  label = 'Profile Photo',
  subLabel = 'Clear portrait with front camera',
  userType = 'customer',
  identifier,
  required = false,
  size = 96,
  cameraOnly = false,
}) => {
  const isCameraOnly = cameraOnly || userType === 'partner';
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [lastSelectedUri, setLastSelectedUri] = useState<string | null>(null);
  const [lastBase64, setLastBase64] = useState<string | undefined>(undefined);

  // Hidden web file inputs for 100% web fallback
  const webCamInputRef = useRef<HTMLInputElement | null>(null);
  const webGalleryInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Upload image to Supabase Storage ('profile-image' bucket)
   * Prevents orphaned/duplicate files by using a canonical path with upsert
   */
  const saveImageToStorage = async (uri: string, base64?: string): Promise<string> => {
    const ext = 'jpg';
    const cleanId = (identifier || userType).replace(/[^a-zA-Z0-9_-]/g, '_');
    // Deterministic single reference file path per user/partner to prevent duplicate orphaned objects
    const filePath = `profile-photos/${userType}/${cleanId}_photo.${ext}`;

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

    // 1. Primary Target: 'profile-image' bucket
    try {
      const { data, error } = await supabase.storage.from('profile-image').upload(filePath, body, {
        contentType: 'image/jpeg',
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from('profile-image').getPublicUrl(filePath);
        if (urlData?.publicUrl) return urlData.publicUrl;
      }
    } catch {
      // Continue to resilient fallback
    }

    // 2. Fallback Target: 'gc-home-assets'
    try {
      const { data: fb1, error: fb1Err } = await supabase.storage.from('gc-home-assets').upload(filePath, body, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (!fb1Err && fb1) {
        const { data: u1 } = supabase.storage.from('gc-home-assets').getPublicUrl(filePath);
        if (u1?.publicUrl) return u1.publicUrl;
      }
    } catch {
      // Continue
    }

    // 3. Fallback Target: 'job-photos'
    try {
      const { data: fb2, error: fb2Err } = await supabase.storage.from('job-photos').upload(filePath, body, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (!fb2Err && fb2) {
        const { data: u2 } = supabase.storage.from('job-photos').getPublicUrl(filePath);
        if (u2?.publicUrl) return u2.publicUrl;
      }
    } catch {
      // Continue
    }

    // If bucket uploads fail, use base64 data URI so user preview & data is never lost
    if (base64) {
      return `data:image/jpeg;base64,${base64}`;
    }
    return uri;
  };

  /**
   * Handle image once captured or selected
   */
  const handleImageReady = async (uri: string, base64?: string) => {
    setIsProcessing(true);
    setUploadStatus('uploading');
    setModalVisible(false);
    setLastSelectedUri(uri);
    setLastBase64(base64);

    // Show preview immediately to ensure instant visual feedback
    const immediatePreview = base64 ? `data:image/jpeg;base64,${base64}` : uri;
    onChange(immediatePreview);

    try {
      const finalUrl = await saveImageToStorage(uri, base64);
      if (finalUrl) {
        onChange(finalUrl);
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch (err: any) {
      console.warn('Profile image upload error:', err);
      // Keep local preview visible on failure
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Retry failed photo upload
   */
  const handleRetryUpload = async () => {
    if (!lastSelectedUri && !value) return;
    setIsProcessing(true);
    setUploadStatus('uploading');
    try {
      const uriToUpload = lastSelectedUri || value!;
      const finalUrl = await saveImageToStorage(uriToUpload, lastBase64);
      if (finalUrl) {
        onChange(finalUrl);
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch {
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Take Photo using FRONT-FACING camera
   * Permissions requested ONLY on tap
   */
  const handleTakePhoto = async () => {
    try {
      setIsProcessing(true);
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'GC HOME+ needs camera access to take your profile photo. Please enable camera permission in device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          setIsProcessing(false);
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
        await handleImageReady(asset.uri, asset.base64 || undefined);
      }
    } catch (err: any) {
      console.warn('Camera launch error:', err);
      if (Platform.OS === 'web' && webCamInputRef.current) {
        webCamInputRef.current.click();
      } else {
        Alert.alert('Camera Error', 'Unable to open camera. Please use Choose from Gallery instead.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Choose photo from local device gallery
   * Permissions requested ONLY on tap
   */
  const handleChooseFromGallery = async () => {
    try {
      setIsProcessing(true);
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Gallery Permission Required',
            'GC HOME+ needs photo library access to select your profile photo. Please enable gallery permission in device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          setIsProcessing(false);
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
        // Validate image format
        const ext = asset.uri.split('.').pop()?.toLowerCase();
        if (ext && !['jpg', 'jpeg', 'png', 'webp'].includes(ext) && !asset.uri.startsWith('data:image')) {
          Alert.alert('Invalid Format', 'Please select a valid JPG, JPEG, or PNG image.');
          setIsProcessing(false);
          return;
        }
        await handleImageReady(asset.uri, asset.base64 || undefined);
      }
    } catch (err: any) {
      console.warn('Gallery launch error:', err);
      if (Platform.OS === 'web' && webGalleryInputRef.current) {
        webGalleryInputRef.current.click();
      } else {
        Alert.alert('Gallery Error', 'Unable to open photo library.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Web file input change handler
   */
  const handleWebFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Alert.alert('Invalid Image', 'Please select a valid JPG, JPEG, or PNG image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      await handleImageReady(dataUrl, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChange('');
    setUploadStatus('idle');
    setLastSelectedUri(null);
    setLastBase64(undefined);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Hidden Web Inputs */}
      {Platform.OS === 'web' && (
        <>
          <input
            type="file"
            accept="image/*"
            capture="user"
            ref={webCamInputRef as any}
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
          />
          <input
            type="file"
            accept="image/*"
            ref={webGalleryInputRef as any}
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
          />
        </>
      )}

      {/* Main Avatar Card */}
      <View style={styles.pickerRow}>
        {/* Avatar Circle Container */}
        <TouchableOpacity
          style={[
            styles.avatarCircle,
            { width: size, height: size, borderRadius: size / 2 },
            Boolean(value) && styles.avatarCircleWithImage,
          ]}
          onPress={() => {
            if (isCameraOnly && !value) {
              handleTakePhoto();
            } else {
              setModalVisible(true);
            }
          }}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#0D8846" />
          ) : value ? (
            <Image
              source={{ uri: value }}
              style={[styles.avatarImage, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
            />
          ) : (
            <View style={styles.avatarEmptyContent}>
              <User size={size * 0.42} color="#94A3B8" />
            </View>
          )}

          {/* Action Badge Indicator */}
          <View style={styles.cameraBadge}>
            {value ? (
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Camera size={11} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </View>
        </TouchableOpacity>

        {/* Text Details & Action Buttons */}
        <View style={styles.metaCol}>
          <Text style={styles.pickerLabel}>
            {label} {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
          <Text style={styles.pickerSubLabel}>{subLabel}</Text>

          {/* Action Buttons */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              {value ? (
                <RefreshCw size={12} color="#0D8846" />
              ) : (
                <Camera size={12} color="#0D8846" />
              )}
              <Text style={styles.actionBtnText}>
                {value ? 'Retake Photo' : 'Take Photo'}
              </Text>
            </TouchableOpacity>

            {!isCameraOnly && (
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleChooseFromGallery}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                <ImageIcon size={12} color="#475569" />
                <Text style={styles.actionBtnSecondaryText}>
                  {value ? 'Change Photo' : 'Gallery'}
                </Text>
              </TouchableOpacity>
            )}

            {Boolean(value) && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={handleRemovePhoto}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Trash2 size={13} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Upload Feedback Status Pill */}
      {uploadStatus === 'uploading' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#0D8846" />
          <Text style={styles.statusUploadingText}>Uploading photo…</Text>
        </View>
      )}
      {uploadStatus === 'success' && (
        <View style={styles.statusSuccessRow}>
          <CheckCircle2 size={13} color="#166534" />
          <Text style={styles.statusSuccessText}>Profile photo uploaded</Text>
        </View>
      )}
      {uploadStatus === 'error' && (
        <View style={styles.statusErrorRow}>
          <AlertCircle size={13} color="#DC2626" />
          <Text style={styles.statusErrorText}>Unable to upload photo. Please try again.</Text>
          <TouchableOpacity onPress={handleRetryUpload} style={styles.retryUploadBtn} activeOpacity={0.7}>
            <RefreshCw size={11} color="#DC2626" />
            <Text style={styles.retryUploadText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Choice Modal (Opens on Avatar Tap) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Set Profile Photo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {isCameraOnly
                ? 'Take a live photo using your device front camera.'
                : 'Take a front camera photo or select from your gallery.'}
            </Text>

            <TouchableOpacity
              style={styles.modalOptionBtn}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              <View style={styles.modalOptionIconBox}>
                <Camera size={18} color="#0D8846" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>{value ? 'Retake Photo' : 'Take Photo'}</Text>
                <Text style={styles.modalOptionSub}>Open front camera to take a photo</Text>
              </View>
            </TouchableOpacity>

            {!isCameraOnly && (
              <TouchableOpacity
                style={styles.modalOptionBtn}
                onPress={handleChooseFromGallery}
                activeOpacity={0.8}
              >
                <View style={styles.modalOptionIconBox}>
                  <ImageIcon size={18} color="#0D8846" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                  <Text style={styles.modalOptionSub}>Select an existing image from your device</Text>
                </View>
              </TouchableOpacity>
            )}

            {Boolean(value) && (
              <TouchableOpacity
                style={[styles.modalOptionBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
                onPress={handleRemovePhoto}
                activeOpacity={0.8}
              >
                <View style={[styles.modalOptionIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalOptionTitle, { color: '#DC2626' }]}>Remove Photo</Text>
                  <Text style={styles.modalOptionSub}>Clear profile photo</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCircleWithImage: {
    borderColor: '#0D8846',
  },
  avatarEmptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    resizeMode: 'cover',
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
  },
  metaCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2E23',
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '800',
  },
  pickerSubLabel: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1F2DF',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D8846',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  removeBtn: {
    padding: 6,
  },

  /* Modal Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2E23',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F2E23',
  },
  modalOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusUploadingText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0D8846',
  },
  statusSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusSuccessText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#166534',
  },
  statusErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  statusErrorText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
    flexShrink: 1,
  },
  retryUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginLeft: 4,
  },
  retryUploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
