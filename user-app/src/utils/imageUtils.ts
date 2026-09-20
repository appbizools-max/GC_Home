import { ImageSourcePropType } from 'react-native';

/**
 * Safely normalizes an image source for React Native's Image component.
 * Supports string URLs, local require/imported numbers, or source objects.
 */
export const resolveImageSource = (source: any): ImageSourcePropType => {
  if (!source) {
    return { uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' };
  }
  if (typeof source === 'string') {
    return { uri: source };
  }
  if (typeof source === 'number') {
    return source;
  }
  if (typeof source === 'object' && source.uri) {
    return source;
  }
  return source;
};
