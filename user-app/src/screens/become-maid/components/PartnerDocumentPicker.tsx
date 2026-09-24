import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  FileText,
  Camera,
  Upload,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Plus,
  FileCheck,
} from 'lucide-react-native';
import { supabase } from '../../../config/supabase';

// Safe dynamic accessor for expo-document-picker
const getDocumentPicker = (): any => {
  try {
    return require('expo-document-picker');
  } catch {
    return null;
  }
};

export interface UploadedDocItem {
  id: string;
  name: string;
  fileUrl: string;
  fileType: 'pdf' | 'image' | 'file';
  mimeType?: string;
  fileSize?: number;
  uploadedAt: string;
}

// Backward-compatibility type definition
export interface DocItemState {
  id: string;
  name: string;
  subTitle?: string;
  required?: boolean;
  uploaded: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'file';
  fileSize?: number;
}

interface PartnerDocumentPickerProps {
  documents: UploadedDocItem[] | Record<string, DocItemState>;
  onDocumentsChange?: (docs: UploadedDocItem[]) => void;
  onDocumentChange?: (docKey: string, updated: DocItemState) => void;
  partnerIdentifier?: string;
}

export const PartnerDocumentPicker: React.FC<PartnerDocumentPickerProps> = ({
  documents,
  onDocumentsChange,
  onDocumentChange,
  partnerIdentifier,
}) => {
  // Normalize incoming documents to UploadedDocItem array
  const docList: UploadedDocItem[] = React.useMemo(() => {
    if (Array.isArray(documents)) {
      return documents;
    }
    if (documents && typeof documents === 'object') {
      return Object.entries(documents)
        .filter(([_, d]) => d && d.uploaded && d.fileUrl)
        .map(([k, d]) => ({
          id: d.id || k,
          name: d.fileName || d.name || 'Document',
          fileUrl: d.fileUrl || '',
          fileType: (d.fileType as any) || (d.fileUrl?.endsWith('.pdf') ? 'pdf' : 'image'),
          fileSize: d.fileSize,
          uploadedAt: new Date().toISOString(),
        }));
    }
    return [];
  }, [documents]);

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocItem | null>(null);

  // Web fallback file inputs
  const webPdfInputRef = useRef<HTMLInputElement | null>(null);
  const webImgInputRef = useRef<HTMLInputElement | null>(null);
  const webCamInputRef = useRef<HTMLInputElement | null>(null);

  const notifyChange = (updatedList: UploadedDocItem[]) => {
    if (onDocumentsChange) {
      onDocumentsChange(updatedList);
    }
    if (onDocumentChange) {
      // Compatibility bridge
      updatedList.forEach((d, idx) => {
        const key = idx === 0 ? 'aadhaarFront' : idx === 1 ? 'aadhaarBack' : idx === 2 ? 'pan' : `doc_${idx}`;
        onDocumentChange(key, {
          id: d.id,
          name: d.name,
          uploaded: true,
          fileUrl: d.fileUrl,
          fileName: d.name,
          fileType: d.fileType,
          fileSize: d.fileSize,
        });
      });
    }
  };

  /**
   * Upload binary file to Supabase Storage
   * Priority: 'partner-kyc' -> fallback 'gc-home-assets'
   */
  const uploadBinaryToSupabase = async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    base64?: string
  ): Promise<string> => {
    const cleanId = (partnerIdentifier || 'partner').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = fileName.split('.').pop()?.toLowerCase() || (mimeType.includes('pdf') ? 'pdf' : 'jpg');
    const filePath = `partners/kyc/${cleanId}_doc_${Date.now()}.${ext}`;

    let body: any;
    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      body = await response.blob();
    } else if (base64) {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      body = new Uint8Array(byteNumbers);
    } else {
      const response = await fetch(fileUri);
      body = await response.blob();
    }

    // Try 'partner-kyc' bucket first
    try {
      const { data, error } = await supabase.storage.from('partner-kyc').upload(filePath, body, {
        contentType: mimeType || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from('partner-kyc').getPublicUrl(filePath);
        if (urlData?.publicUrl) return urlData.publicUrl;
      }
    } catch {
      // Proceed to fallback bucket
    }

    // Fallback: 'gc-home-assets' bucket
    try {
      const { data, error } = await supabase.storage.from('gc-home-assets').upload(filePath, body, {
        contentType: mimeType || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        upsert: true,
      });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from('gc-home-assets').getPublicUrl(filePath);
        if (urlData?.publicUrl) return urlData.publicUrl;
      }
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      throw new Error(err?.message || 'Storage upload failed. Please check internet connection.');
    }

    throw new Error('Could not retrieve public URL for uploaded document.');
  };

  /**
   * Save uploaded file to state
   */
  const handleUploadSuccess = (
    publicUrl: string,
    fileName: string,
    fileType: 'pdf' | 'image' | 'file',
    mimeType?: string,
    fileSize?: number
  ) => {
    const newDoc: UploadedDocItem = {
      id: replacingDocId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: fileName,
      fileUrl: publicUrl,
      fileType,
      mimeType,
      fileSize,
      uploadedAt: new Date().toISOString(),
    };

    let nextList: UploadedDocItem[];
    if (replacingDocId) {
      nextList = docList.map(d => (d.id === replacingDocId ? newDoc : d));
    } else {
      nextList = [...docList, newDoc];
    }

    notifyChange(nextList);
    setReplacingDocId(null);
  };

  /**
   * 1. 📷 Take Photo / Camera
   */
  const handleCaptureCamera = async () => {
    setShowOptionsModal(false);
    setUploadError(null);

    if (Platform.OS === 'web') {
      if (webCamInputRef.current) {
        webCamInputRef.current.value = '';
        webCamInputRef.current.click();
      }
      return;
    }

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is required to take a photo of your verification document.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.back,
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setReplacingDocId(null);
        return;
      }

      const asset = result.assets[0];
      setIsUploading(true);

      const fileName = `document_${Date.now()}.jpg`;
      const publicUrl = await uploadBinaryToSupabase(
        asset.uri,
        fileName,
        'image/jpeg',
        asset.base64 || undefined
      );

      handleUploadSuccess(publicUrl, fileName, 'image', 'image/jpeg', asset.fileSize);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to capture photo.';
      setUploadError(errMsg);
      Alert.alert('Camera Error', errMsg);
      setReplacingDocId(null);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 2. 🖼️ Choose from Gallery
   */
  const handlePickGalleryImage = async () => {
    setShowOptionsModal(false);
    setUploadError(null);

    if (Platform.OS === 'web') {
      if (webImgInputRef.current) {
        webImgInputRef.current.value = '';
        webImgInputRef.current.click();
      }
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Gallery access is required to upload your verification document.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setReplacingDocId(null);
        return;
      }

      const asset = result.assets[0];
      setIsUploading(true);

      const fileName = asset.fileName || `document_${Date.now()}.jpg`;
      const publicUrl = await uploadBinaryToSupabase(
        asset.uri,
        fileName,
        'image/jpeg',
        asset.base64 || undefined
      );

      handleUploadSuccess(publicUrl, fileName, 'image', 'image/jpeg', asset.fileSize);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to upload photo from gallery.';
      setUploadError(errMsg);
      Alert.alert('Upload Error', errMsg);
      setReplacingDocId(null);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 3. 📄 Choose File (PDF / Images / Any device document)
   */
  const handlePickFile = async () => {
    setShowOptionsModal(false);
    setUploadError(null);

    if (Platform.OS === 'web') {
      if (webPdfInputRef.current) {
        webPdfInputRef.current.value = '';
        webPdfInputRef.current.click();
      }
      return;
    }

    const DocumentPicker = getDocumentPicker();
    if (!DocumentPicker || typeof DocumentPicker.getDocumentAsync !== 'function') {
      // Fallback to gallery if native document picker module is absent
      Alert.alert(
        'Choose Document',
        'You can select your document photo directly from your gallery or capture with camera.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setReplacingDocId(null) },
          { text: 'Gallery', onPress: handlePickGalleryImage },
          { text: 'Camera', onPress: handleCaptureCamera },
        ]
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setReplacingDocId(null);
        return;
      }

      const asset = result.assets[0];
      setIsUploading(true);

      const isPdf = asset.mimeType?.includes('pdf') || asset.name?.toLowerCase().endsWith('.pdf');
      const docType: 'pdf' | 'image' | 'file' = isPdf
        ? 'pdf'
        : asset.mimeType?.startsWith('image/')
        ? 'image'
        : 'file';

      const fileName = asset.name || `document_${Date.now()}.${isPdf ? 'pdf' : 'jpg'}`;
      const publicUrl = await uploadBinaryToSupabase(
        asset.uri,
        fileName,
        asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg')
      );

      handleUploadSuccess(publicUrl, fileName, docType, asset.mimeType, asset.size);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to upload document file.';
      setUploadError(errMsg);
      Alert.alert('Upload Error', errMsg);
      setReplacingDocId(null);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Web file input change handler
   */
  const handleWebFileChange = async (event: any, type: 'file' | 'image' | 'camera') => {
    const files = event.target?.files;
    if (!files || files.length === 0) return;

    const file: File = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const blobUrl = URL.createObjectURL(file);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const docType: 'pdf' | 'image' | 'file' = isPdf
        ? 'pdf'
        : file.type.startsWith('image/')
        ? 'image'
        : 'file';

      const publicUrl = await uploadBinaryToSupabase(
        blobUrl,
        file.name,
        file.type || (isPdf ? 'application/pdf' : 'image/jpeg')
      );

      handleUploadSuccess(publicUrl, file.name, docType, file.type, file.size);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to upload file.';
      setUploadError(errMsg);
      Alert.alert('Upload Error', errMsg);
      setReplacingDocId(null);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Remove document from list
   */
  const handleRemove = (docId: string) => {
    const updated = docList.filter(d => d.id !== docId);
    notifyChange(updated);
  };

  /**
   * Trigger Replace flow
   */
  const handleReplace = (docId: string) => {
    setReplacingDocId(docId);
    setShowOptionsModal(true);
  };

  /**
   * Trigger new upload flow
   */
  const handleStartUpload = () => {
    setReplacingDocId(null);
    setShowOptionsModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Hidden Web file inputs */}
      {Platform.OS === 'web' && (
        <div style={{ display: 'none' }}>
          <input
            ref={webPdfInputRef as any}
            type="file"
            accept="application/pdf,image/*,.doc,.docx"
            onChange={e => handleWebFileChange(e, 'file')}
          />
          <input
            ref={webImgInputRef as any}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={e => handleWebFileChange(e, 'image')}
          />
          <input
            ref={webCamInputRef as any}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => handleWebFileChange(e, 'camera')}
          />
        </div>
      )}

      {/* Uploading Spinner Indicator */}
      {isUploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator size="small" color="#168A68" />
          <Text style={styles.uploadingText}>Uploading document to secure storage...</Text>
        </View>
      )}

      {/* Upload Error Banner */}
      {uploadError && !isUploading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{uploadError}</Text>
          <TouchableOpacity onPress={handleStartUpload} style={styles.retryBtn}>
            <RefreshCw size={13} color="#DC2626" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List of Uploaded Document Cards */}
      {docList.map(doc => {
        const isPdf = doc.fileType === 'pdf' || doc.name.toLowerCase().endsWith('.pdf');

        return (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docCardMain}>
              {/* File Icon / Thumbnail */}
              <View style={[styles.fileIconBox, isPdf ? styles.pdfIconBox : styles.imageIconBox]}>
                {isPdf ? (
                  <FileText size={22} color="#0284C7" />
                ) : (
                  <ImageIcon size={22} color="#168A68" />
                )}
              </View>

              {/* File Details */}
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {doc.name}
                </Text>
                <View style={styles.fileMetaRow}>
                  <View style={styles.fileTypeBadge}>
                    <Text style={styles.fileTypeBadgeText}>
                      {isPdf ? 'PDF' : doc.fileType === 'image' ? 'IMAGE' : 'FILE'}
                    </Text>
                  </View>
                  {doc.fileSize ? (
                    <Text style={styles.fileSizeText}>
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </Text>
                  ) : null}
                  <View style={styles.uploadedTag}>
                    <FileCheck size={11} color="#166534" />
                    <Text style={styles.uploadedTagText}>Uploaded</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons: [Preview] [Replace] [Remove] */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setPreviewDoc(doc)}
                activeOpacity={0.7}
              >
                <Eye size={13} color="#334155" />
                <Text style={styles.actionBtnText}>Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleReplace(doc.id)}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color="#334155" />
                <Text style={styles.actionBtnText}>Replace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => handleRemove(doc.id)}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#DC2626" />
                <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* "+ Upload Document" / "+ Upload Another Document" Button */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          docList.length > 0 && styles.uploadButtonSecondary,
        ]}
        onPress={handleStartUpload}
        disabled={isUploading}
        activeOpacity={0.85}
      >
        <Plus size={18} color={docList.length > 0 ? '#168A68' : '#FFFFFF'} />
        <Text
          style={[
            styles.uploadButtonText,
            docList.length > 0 && styles.uploadButtonSecondaryText,
          ]}
        >
          {docList.length === 0 ? '+ Upload Document' : '+ Upload Another Document'}
        </Text>
      </TouchableOpacity>

      {/* ── ACTION SHEET MODAL: UPLOAD OPTIONS ── */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowOptionsModal(false);
          setReplacingDocId(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowOptionsModal(false);
            setReplacingDocId(null);
          }}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {replacingDocId ? 'Replace Document' : 'Upload Document'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowOptionsModal(false);
                  setReplacingDocId(null);
                }}
                style={styles.closeBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select an option to upload your verification document:
            </Text>

            <View style={styles.optionsList}>
              {/* Option 1: Take Photo */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handleCaptureCamera}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Camera size={20} color="#168A68" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Take Photo</Text>
                  <Text style={styles.optionDescription}>
                    Use camera to capture document directly
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Choose from Gallery */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handlePickGalleryImage}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <ImageIcon size={20} color="#166534" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionDescription}>
                    Select JPG, JPEG, or PNG photo
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Choose File */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handlePickFile}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#F0F9FF' }]}>
                  <FileText size={20} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Choose File</Text>
                  <Text style={styles.optionDescription}>
                    Select PDF or supported device file
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── PREVIEW MODAL ── */}
      <Modal
        visible={Boolean(previewDoc)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModal}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {previewDoc?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.closeBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {previewDoc?.fileType === 'pdf' || previewDoc?.name.toLowerCase().endsWith('.pdf') ? (
              <View style={styles.pdfPreviewBox}>
                <FileText size={52} color="#0284C7" />
                <Text style={styles.pdfPreviewTitle}>PDF Document</Text>
                <Text style={styles.pdfPreviewName} numberOfLines={2}>
                  {previewDoc?.name}
                </Text>
                {previewDoc?.fileUrl ? (
                  <TouchableOpacity
                    style={styles.openPdfBtn}
                    onPress={() => {
                      if (previewDoc?.fileUrl) Linking.openURL(previewDoc.fileUrl);
                    }}
                    activeOpacity={0.85}
                  >
                    <ExternalLink size={15} color="#FFFFFF" />
                    <Text style={styles.openPdfBtnText}>Open Document</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : previewDoc?.fileUrl ? (
              <View style={styles.imagePreviewBox}>
                <Image
                  source={{ uri: previewDoc.fileUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.closePreviewBtn}
              onPress={() => setPreviewDoc(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.closePreviewBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
  },
  uploadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Document Card
  docCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  docCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfIconBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  imageIconBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fileTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fileTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  fileSizeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  uploadedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  uploadedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },

  // Actions Row: [Preview] [Replace] [Remove]
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },

  // Primary Upload Button
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#168A68',
    borderRadius: 10,
    shadowColor: '#168A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadButtonSecondary: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#168A68',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonSecondaryText: {
    color: '#168A68',
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 11,
    color: '#64748B',
  },

  // Preview Modal
  previewModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 18,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
    width: '92%',
  },
  imagePreviewBox: {
    width: '100%',
    height: 320,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginVertical: 14,
    gap: 10,
  },
  pdfPreviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pdfPreviewName: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  openPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  openPdfBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closePreviewBtn: {
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
  },
  closePreviewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
});
