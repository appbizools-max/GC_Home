/**
 * Web font loader for Inter.
 * On web, fonts are loaded via CSS (@font-face & Google Fonts in index.css).
 */
export function useAppFonts(): [boolean, Error | null] {
  return [true, null];
}
