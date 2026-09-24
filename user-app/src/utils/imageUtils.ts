import { ImageSourcePropType } from 'react-native';
import ASSETS from '../assets';
import { supabaseUrl } from '../config/supabase';

const PRIMARY_STORAGE_BUCKET = 'gc-home-assets';

/**
 * Safely normalizes an image source for React Native's Image component.
 * Supports:
 * - Relative Supabase Storage paths (e.g. 'categories/...', 'services/...')
 * - Full http/https URLs
 * - Local require/imported numbers
 * - Source objects
 * - Local bundled asset as reliable fallback
 */
export const resolveImageSource = (source: any): ImageSourcePropType => {
  const defaultAsset = typeof ASSETS.heroLivingRoom === 'string'
    ? { uri: ASSETS.heroLivingRoom }
    : (ASSETS.heroLivingRoom as ImageSourcePropType);

  if (!source) {
    return defaultAsset;
  }
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (trimmed === '') return defaultAsset;
    
    // If already absolute URL, use directly
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { uri: trimmed };
    }
    
    // Prepend Supabase Storage public bucket URL for relative paths
    const cleanPath = trimmed.replace(/^\/+/, '');
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${PRIMARY_STORAGE_BUCKET}/${cleanPath}`;
    return { uri: publicUrl };
  }
  if (typeof source === 'number') {
    return source;
  }
  if (typeof source === 'object' && source.uri) {
    if (
      typeof source.uri === 'string' &&
      !source.uri.startsWith('http://') &&
      !source.uri.startsWith('https://')
    ) {
      const cleanPath = source.uri.trim().replace(/^\/+/, '');
      return {
        ...source,
        uri: `${supabaseUrl}/storage/v1/object/public/${PRIMARY_STORAGE_BUCKET}/${cleanPath}`,
      };
    }
    return source;
  }
  return defaultAsset;
};

/**
 * Resizes a base64 or Data URL image string using HTML5 Canvas if running in Web context,
 * scaling it down to a maximum dimension (e.g. 1280px) to optimize upload payload size.
 */
export const resizeImageBase64 = async (
  dataUrl: string,
  maxDimension: number = 1280,
  quality: number = 0.8
): Promise<string> => {
  if (typeof window === 'undefined' || !window.document || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const resized = canvas.toDataURL('image/jpeg', quality);
      resolve(resized);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

