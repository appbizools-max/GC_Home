/**
 * GC HOME+ — Global Brand Color Tokens
 * Single source of truth for visual identity.
 * Based on the official GC HOME+ circular badge logo.
 */

export const BRAND_COLORS = {
  // Primary Brand Colors
  primaryGreen: '#123D2A', // Primary Deep Green (actions, primary buttons, headers)
  deepGreen: '#123D2A',    // Primary Deep Green
  softGreen: '#6FAF72',    // Primary Soft Green (secondary actions, highlights, cards)
  lightGreen: '#EAF5EC',   // Light Green (subtle backgrounds, page sections, pill badges)
  gold: '#C9A227',         // Gold (premium accents, small icons, borders, highlights)
  lightGold: '#E8D49A',    // Light Gold (subtle badge borders, soft highlights)
  charcoal: '#171A18',     // Black / Charcoal (main typography, titles, bold text)
  white: '#FFFFFF',        // White (cards, input backgrounds, navigation surfaces)
  background: '#F8FAF8',   // Background (screen background)

  // Functional & Semantic Mappings
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAF8',
  border: '#E2E8F0',
  borderSoftGreen: '#C6E3CB',
  borderGold: '#E8D49A',
  textPrimary: '#171A18',
  textSecondary: '#526058',
  textMuted: '#8A9990',
  success: '#123D2A',
  danger: '#DC2626',
  warning: '#D97706',
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;
