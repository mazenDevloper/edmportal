'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';
type FontSize = 'base' | 'lg' | 'xl';

export type ColorMode = 'default' | 'high-contrast' | 'dark' | 'grayscale' | 'low-saturation' | 'high-saturation';

/** Text size steps (root font scale) */
export const TEXT_SCALES = [1, 1.125, 1.25, 1.5, 1.75] as const;
export const LINE_HEIGHTS = ['normal', 'relaxed', 'loose'] as const;

export interface A11yPrefs {
  textScale: number;            // index into TEXT_SCALES
  lineHeight: number;           // index into LINE_HEIGHTS
  textSpacing: number;          // 0 normal, 1 wide, 2 wider
  colorMode: ColorMode;
  highlightLinks: boolean;
  readableFont: boolean;
  bigCursor: boolean;
  readingGuide: boolean;
  readingMask: boolean;
  hideImages: boolean;
  reducedMotion: boolean;
  strongFocus: boolean;
  alignStart: boolean;
  speechRate: number;           // 0.75 – 1.5
  largePanel: boolean;
}

export const A11Y_DEFAULTS: A11yPrefs = {
  textScale: 0, lineHeight: 0, textSpacing: 0, colorMode: 'default',
  highlightLinks: false, readableFont: false, bigCursor: false, readingGuide: false, readingMask: false,
  hideImages: false, reducedMotion: false, strongFocus: false, alignStart: false, speechRate: 1, largePanel: false,
};

interface SettingsState extends A11yPrefs {
  language: Language;
  // Legacy fields kept in sync for older components
  fontSize: FontSize;
  highContrast: boolean;
  spacing: 'normal' | 'wide';
  dyslexiaFont: boolean;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setSpacing: (spacing: 'normal' | 'wide') => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleDyslexiaFont: () => void;
  setA11y: (patch: Partial<A11yPrefs>) => void;
  resetA11y: () => void;
}

/** Keeps the legacy fields consistent with the new preferences */
const legacyFrom = (p: A11yPrefs) => ({
  fontSize: (p.textScale >= 3 ? 'xl' : p.textScale >= 1 ? 'lg' : 'base') as FontSize,
  highContrast: p.colorMode === 'high-contrast',
  spacing: (p.textSpacing > 0 ? 'wide' : 'normal') as 'normal' | 'wide',
  dyslexiaFont: p.readableFont,
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'ar',
      ...A11Y_DEFAULTS,
      ...legacyFrom(A11Y_DEFAULTS),
      setLanguage: (language) => set({ language }),
      setA11y: (patch) => set(s => {
        const next = { ...s, ...patch };
        return { ...patch, ...legacyFrom(next) };
      }),
      resetA11y: () => set({ ...A11Y_DEFAULTS, largePanel: get().largePanel, ...legacyFrom(A11Y_DEFAULTS) }),
      setFontSize: (fontSize) => get().setA11y({ textScale: fontSize === 'xl' ? 3 : fontSize === 'lg' ? 1 : 0 }),
      setSpacing: (spacing) => get().setA11y({ textSpacing: spacing === 'wide' ? 1 : 0 }),
      toggleHighContrast: () => get().setA11y({ colorMode: get().colorMode === 'high-contrast' ? 'default' : 'high-contrast' }),
      toggleReducedMotion: () => get().setA11y({ reducedMotion: !get().reducedMotion }),
      toggleDyslexiaFont: () => get().setA11y({ readableFont: !get().readableFont }),
    }),
    { name: 'dm-portal-settings-v3' }
  )
);
