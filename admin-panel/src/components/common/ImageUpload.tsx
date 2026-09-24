import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  X,
  Loader2
} from 'lucide-react';
import { 
  uploadAssetFile, 
  validateImageFile, 
  deleteAssetFile,
  getPublicAssetUrl
} from '../../services/storageService';

interface ImageUploadProps {
  value?: string;
  onChange: (storagePathOrUrl: string, path?: string) => void;
  folder?: 'services' | 'addons' | 'categories' | 'banners' | 'offers' | 'general';
  subfolder?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = 'services',
  subfolder,
  label = 'Upload Image',
  helperText = 'Supported formats: JPG, PNG, WEBP (Max 5MB)',
  required = false,
  aspectRatio = 'auto',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ? getPublicAssetUrl(value) : null);
  const [currentStoragePath, setCurrentStoragePath] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview if external value changes
  React.useEffect(() => {
    setPreviewUrl(value ? getPublicAssetUrl(value) : null);
  }, [value]);

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    // 2. Show local preview immediately for great UX
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // 3. Upload to Supabase Storage
    setIsUploading(true);
    setUploadProgress(20);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
    }, 150);

    try {
      const result = await uploadAssetFile(file, folder, subfolder);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // If we had a previous uploaded file in this session, safely delete it
      if (currentStoragePath && currentStoragePath !== result.path) {
        deleteAssetFile(currentStoragePath).catch(() => {});
      }

      setCurrentStoragePath(result.path);
      setPreviewUrl(result.publicUrl);
      // Pass storage path so it is persisted in Supabase database
      onChange(result.path, result.path);

      setSuccessMessage('Image uploaded successfully to Supabase Storage!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('[ImageUpload] Error:', err);
      setErrorMessage(err.message || 'Failed to upload image. Please try again.');
      setPreviewUrl(value || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStoragePath) {
      await deleteAssetFile(currentStoragePath).catch(() => {});
    }
    setPreviewUrl(null);
    setCurrentStoragePath(null);
    onChange('', undefined);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square max-h-48';
      case 'video':
        return 'aspect-video max-h-52';
      case 'banner':
        return 'aspect-[21/9] max-h-52';
      default:
        return 'min-h-[160px] max-h-52';
    }
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {/* Label and Helper Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">Max 5MB</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Preview or Dropzone Card */}
      {previewUrl ? (
        <div className={`relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm flex items-center justify-center ${getAspectClass()}`}>
          <img
            src={previewUrl}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback placeholder if image cannot be loaded
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
            }}
          />

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-4">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-medium">Uploading to Supabase Storage...</span>
              <div className="w-32 bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Overlay */}
          {!isUploading && (
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          )}

          {/* Persistent badge showing source */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm pointer-events-none">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Supabase Stored</span>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#123D2A] bg-[#EAF8F1]/50 scale-[0.99]'
              : 'border-slate-300 hover:border-[#123D2A]/60 bg-slate-50 hover:bg-slate-100/60'
          } ${getAspectClass()}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <Loader2 className="w-7 h-7 animate-spin text-[#123D2A]" />
              <p className="text-xs font-medium text-slate-700">Uploading to Supabase Storage...</p>
              <div className="w-36 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#123D2A] h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#123D2A]">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Click to upload <span className="text-slate-500 font-normal">or drag & drop</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
              </div>
              <button
                type="button"
                className="mt-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-xs hover:bg-slate-50 transition-colors pointer-events-none"
              >
                Choose Local File
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

