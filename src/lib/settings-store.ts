
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';
type FontSize = 'base' | 'lg' | 'xl';

interface SettingsState {
  language: Language;
  fontSize: FontSize;
  highContrast: boolean;
  spacing: 'normal' | 'wide';
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setSpacing: (spacing: 'normal' | 'wide') => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleDyslexiaFont: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      fontSize: 'base',
      highContrast: false,
      spacing: 'normal',
      reducedMotion: false,
      dyslexiaFont: false,
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSpacing: (spacing) => set({ spacing }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
      toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
      toggleDyslexiaFont: () => set((state) => ({ dyslexiaFont: !state.dyslexiaFont })),
    }),
    {
      name: 'dm-portal-settings-v3',
    }
  )
);
