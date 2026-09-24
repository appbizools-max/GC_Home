import React from 'react';
import { Text, TextInput, StyleSheet, Platform, TextStyle } from 'react-native';

/**
 * Global Font Family definitions for Inter across Android, iOS, and Web.
 * 4 Weights:
 * - Regular (400)
 * - Medium (500)
 * - SemiBold (600)
 * - Bold (700)
 */
export const FONT_FAMILY = {
  regular: Platform.OS === 'web' ? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : 'Inter-Regular',
  medium: Platform.OS === 'web' ? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : 'Inter-Medium',
  semiBold: Platform.OS === 'web' ? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : 'Inter-SemiBold',
  bold: Platform.OS === 'web' ? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : 'Inter-Bold',
} as const;

export type FontWeightKey = 400 | 500 | 600 | 700 | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';

/**
 * Returns the exact Inter font family for a given fontWeight.
 */
export function getFontFamily(weight?: string | number): string {
  if (Platform.OS === 'web') {
    return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }
  if (!weight) return 'Inter-Regular';
  const w = String(weight).toLowerCase();
  if (w === '700' || w === '800' || w === '900' || w === 'bold' || w === 'bolder') {
    return 'Inter-Bold';
  }
  if (w === '600' || w === 'semibold') {
    return 'Inter-SemiBold';
  }
  if (w === '500' || w === 'medium') {
    return 'Inter-Medium';
  }
  return 'Inter-Regular';
}

/**
 * Centralized Typography scale for GC HOME+ application.
 * All presets guarantee consistent line heights, letter spacings, and font weights with Inter.
 */
export const typography = {
  hero: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  } as TextStyle,

  h1: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  } as TextStyle,

  h2: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  } as TextStyle,

  h3: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  } as TextStyle,

  h4: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  } as TextStyle,

  subtitle: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500' as const,
  } as TextStyle,

  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  } as TextStyle,

  bodyMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  } as TextStyle,

  bodyBold: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  } as TextStyle,

  caption: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  } as TextStyle,

  captionMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  } as TextStyle,

  captionBold: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  } as TextStyle,

  button: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  } as TextStyle,

  price: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  } as TextStyle,

  priceLg: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  } as TextStyle,

  badge: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  } as TextStyle,

  overline: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  } as TextStyle,
};

let isPatched = false;

/**
 * Applies Inter globally to React Native Text and TextInput components.
 * Automatically resolves the weight (400, 500, 600, 700) and prevents font clipping
 * on Android via includeFontPadding: false and removes synthetic faux bolding.
 */
export function applyGlobalTypography() {
  if (isPatched) return;
  isPatched = true;

  // 1. Patch Text component
  const originalTextRender = (Text as any).render;
  if (typeof originalTextRender === 'function') {
    (Text as any).render = function (props: any, ref: any) {
      const flattened = StyleSheet.flatten(props?.style);
      const customFont = flattened?.fontFamily;

      // Override if no custom font or if default/system/legacy font was passed
      const needsInterFont =
        !customFont ||
        customFont === 'System' ||
        customFont.toLowerCase().includes('jakarta') ||
        customFont.toLowerCase().includes('roboto') ||
        customFont.toLowerCase().includes('sans-serif') ||
        customFont === 'Inter';

      const targetFont = needsInterFont ? getFontFamily(flattened?.fontWeight) : customFont;

      const styleOverride: TextStyle = {
        fontFamily: targetFont,
        ...(Platform.OS === 'android'
          ? {
              includeFontPadding: false,
              ...(needsInterFont ? { fontWeight: 'normal' } : {}),
            }
          : {}),
      };

      const mergedProps = {
        ...props,
        style: [props?.style, styleOverride],
      };

      return originalTextRender.call(this, mergedProps, ref);
    };
  }

  // 2. Patch TextInput component
  const originalTextInputRender = (TextInput as any).render;
  if (typeof originalTextInputRender === 'function') {
    (TextInput as any).render = function (props: any, ref: any) {
      const flattened = StyleSheet.flatten(props?.style);
      const customFont = flattened?.fontFamily;

      const needsInterFont =
        !customFont ||
        customFont === 'System' ||
        customFont.toLowerCase().includes('jakarta') ||
        customFont.toLowerCase().includes('roboto') ||
        customFont.toLowerCase().includes('sans-serif') ||
        customFont === 'Inter';

      const targetFont = needsInterFont ? getFontFamily(flattened?.fontWeight) : customFont;

      const styleOverride: TextStyle = {
        fontFamily: targetFont,
        ...(Platform.OS === 'android'
          ? {
              includeFontPadding: false,
              ...(needsInterFont ? { fontWeight: 'normal' } : {}),
            }
          : {}),
      };

      const mergedProps = {
        ...props,
        style: [props?.style, styleOverride],
      };

      return originalTextInputRender.call(this, mergedProps, ref);
    };
  }
}
