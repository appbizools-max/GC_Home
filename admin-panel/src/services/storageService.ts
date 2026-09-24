import { supabase } from '../config/supabase';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const PRIMARY_STORAGE_BUCKET = 'gc-home-assets';
export const FALLBACK_STORAGE_BUCKET = 'job-photos';

export interface UploadResult {
  publicUrl: string;
  path: string;
  bucket: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file format and size before uploading.
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const mimeType = file.type.toLowerCase();
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(mimeType);
  const isAllowedExt = fileExt && ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt);

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload JPG, PNG, or WEBP image only.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a filename for storage paths.
 */
function sanitizeFileName(fileName: string): string {
  const parts = fileName.split('.');
  const ext = parts.pop()?.toLowerCase() || 'webp';
  const name = parts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  return `${name}.${ext}`;
}

/**
 * Uploads an image file to Supabase Storage.
 * Prioritizes gc-home-assets bucket, gracefully falling back to job-photos if needed.
 */
export async function uploadAssetFile(
  file: File,
  folder: 'services' | 'addons' | 'categories' | 'banners' | 'offers' | 'general' = 'services',
  subfolder?: string
): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const cleanName = sanitizeFileName(file.name);
  const uniqueTimestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const folderPath = subfolder ? `${folder}/${subfolder}` : folder;
  const filePath = `${folderPath}/${uniqueTimestamp}-${randomSuffix}-${cleanName}`;

  let targetBucket = PRIMARY_STORAGE_BUCKET;

  // Try primary bucket first
  let { data, error } = await supabase.storage
    .from(targetBucket)
    .upload(filePath, file, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  // If primary bucket is not found / pending SQL migration, use fallback bucket
  if (error && (error.message?.includes('Bucket not found') || (error as any).code === 'NoSuchBucket')) {
    console.warn(`[StorageService] Bucket '${targetBucket}' not found, falling back to '${FALLBACK_STORAGE_BUCKET}'`);
    targetBucket = FALLBACK_STORAGE_BUCKET;

    const fallbackResult = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error || !data) {
    console.error('[StorageService] Upload failed:', error);
    throw new Error(error?.message || 'Failed to upload image to Supabase Storage');
  }

  const { data: urlData } = supabase.storage
    .from(targetBucket)
    .getPublicUrl(filePath);

  return {
    publicUrl: urlData.publicUrl,
    path: filePath,
    bucket: targetBucket,
  };
}

/**
 * Safely extracts bucket and object path from a Supabase storage public URL.
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    // Format: .../storage/v1/object/public/{bucket}/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      return { bucket: match[1], path: match[2] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Deletes an old asset from Supabase storage if it is a Supabase Storage reference.
 */
export async function deleteAssetFile(
  pathOrUrl: string,
  explicitBucket?: string
): Promise<boolean> {
  if (!pathOrUrl) return false;

  let bucket = explicitBucket || PRIMARY_STORAGE_BUCKET;
  let path = pathOrUrl;

  const parsed = parseStorageUrl(pathOrUrl);
  if (parsed) {
    bucket = parsed.bucket;
    path = parsed.path;
  }

  // Never attempt to delete external URLs like unsplash
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return false;
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('[StorageService] Error removing old image:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[StorageService] Exception deleting asset:', err);
    return false;
  }
}

/**
 * Resolves a storage path or full URL to a high-speed public URL.
 * Handles:
 * - Full http/https URLs (returns directly)
 * - Relative Supabase storage paths (e.g. 'categories/full-home-cleaning.webp', 'services/...')
 * - Local public asset paths (e.g. 'assets/catalog/...')
 */
export function getPublicAssetUrl(pathOrUrl: string | null | undefined, fallback: string = ''): string {
  if (!pathOrUrl) return fallback;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.replace(/^\/+/, '');
  if (cleanPath.startsWith('assets/')) {
    return `/${cleanPath}`;
  }
  const { data } = supabase.storage.from(PRIMARY_STORAGE_BUCKET).getPublicUrl(cleanPath);
  return data.publicUrl;
}

