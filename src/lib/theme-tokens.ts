import type { CSSProperties } from 'react';

export const THEME_TOKENS = {
  background: '--background',
  surface: '--surface',
  surfaceHover: '--surface-hover',
  border: '--border',
  borderStrong: '--border-strong',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textTertiary: '--text-tertiary',
  textInverse: '--text-inverse',
  accentNavy: '--accent-navy',
  accentNavyHover: '--accent-navy-hover',
  accentCoral: '--accent-coral',
  accentCoralHover: '--accent-coral-hover',
  successBg: '--success-bg',
  successText: '--success-text',
  warningBg: '--warning-bg',
  warningText: '--warning-text',
  infoBg: '--info-bg',
  infoText: '--info-text',
  neutralBg: '--neutral-bg',
  neutralText: '--neutral-text',
  dangerBg: '--danger-bg',
  dangerText: '--danger-text',
} as const;

type ThemeLayout = Record<string, unknown> | null | undefined;

const DEFAULT_THEME_VARIABLES: Record<string, string> = {
  [THEME_TOKENS.background]: '#F7F6F3',
  [THEME_TOKENS.surface]: '#FFFFFF',
  [THEME_TOKENS.surfaceHover]: '#F2F1EE',
  [THEME_TOKENS.border]: '#E5E2DC',
  [THEME_TOKENS.borderStrong]: '#C9C5BD',
  [THEME_TOKENS.textPrimary]: '#111110',
  [THEME_TOKENS.textSecondary]: '#6B6A65',
  [THEME_TOKENS.textTertiary]: '#9B9A95',
  [THEME_TOKENS.textInverse]: '#FFFFFF',
  [THEME_TOKENS.accentNavy]: '#1A1A2E',
  [THEME_TOKENS.accentNavyHover]: '#252540',
  [THEME_TOKENS.accentCoral]: '#E8624A',
  [THEME_TOKENS.accentCoralHover]: '#D4513A',
  [THEME_TOKENS.successBg]: '#DCFCE7',
  [THEME_TOKENS.successText]: '#15803D',
  [THEME_TOKENS.warningBg]: '#FEF9C3',
  [THEME_TOKENS.warningText]: '#A16207',
  [THEME_TOKENS.infoBg]: '#DBEAFE',
  [THEME_TOKENS.infoText]: '#1D4ED8',
  [THEME_TOKENS.neutralBg]: '#F3F2F0',
  [THEME_TOKENS.neutralText]: '#6B6A65',
  [THEME_TOKENS.dangerBg]: '#FEE2E2',
  [THEME_TOKENS.dangerText]: '#DC2626',
};

function maybeColor(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function getThemeVariables(layout: ThemeLayout): CSSProperties {
  const nextVars: Record<string, string> = { ...DEFAULT_THEME_VARIABLES };

  if (layout) {
    const entries: Array<[keyof typeof THEME_TOKENS, string | undefined]> = [
      ['background', maybeColor(layout.background)],
      ['surface', maybeColor(layout.surface)],
      ['surfaceHover', maybeColor(layout.surfaceHover ?? layout.surface_hover)],
      ['border', maybeColor(layout.border)],
      ['borderStrong', maybeColor(layout.borderStrong ?? layout.border_strong)],
      ['textPrimary', maybeColor(layout.textPrimary ?? layout.text_primary)],
      ['textSecondary', maybeColor(layout.textSecondary ?? layout.text_secondary)],
      ['textTertiary', maybeColor(layout.textTertiary ?? layout.text_tertiary)],
      ['textInverse', maybeColor(layout.textInverse ?? layout.text_inverse)],
      ['accentNavy', maybeColor(layout.accentNavy ?? layout.accent_navy)],
      ['accentNavyHover', maybeColor(layout.accentNavyHover ?? layout.accent_navy_hover)],
      ['accentCoral', maybeColor(layout.accentCoral ?? layout.accent_coral)],
      ['accentCoralHover', maybeColor(layout.accentCoralHover ?? layout.accent_coral_hover)],
      ['successBg', maybeColor(layout.successBg ?? layout.success_bg)],
      ['successText', maybeColor(layout.successText ?? layout.success_text)],
      ['warningBg', maybeColor(layout.warningBg ?? layout.warning_bg)],
      ['warningText', maybeColor(layout.warningText ?? layout.warning_text)],
      ['infoBg', maybeColor(layout.infoBg ?? layout.info_bg)],
      ['infoText', maybeColor(layout.infoText ?? layout.info_text)],
      ['neutralBg', maybeColor(layout.neutralBg ?? layout.neutral_bg)],
      ['neutralText', maybeColor(layout.neutralText ?? layout.neutral_text)],
      ['dangerBg', maybeColor(layout.dangerBg ?? layout.danger_bg)],
      ['dangerText', maybeColor(layout.dangerText ?? layout.danger_text)],
    ];

    for (const [tokenKey, tokenValue] of entries) {
      if (tokenValue) {
        nextVars[THEME_TOKENS[tokenKey]] = tokenValue;
      }
    }
  }

  return nextVars as CSSProperties;
}
