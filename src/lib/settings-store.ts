
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';
type FontSize = 'base' | 'lg' | 'xl';

interface SettingsState {
  language: Language;
  fontSize: FontSize;
  highContrast: boolean;
  spacing: 'normal' | 'wide';
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setSpacing: (spacing: 'normal' | 'wide') => void;
  toggleHighContrast: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      fontSize: 'base',
      highContrast: false,
      spacing: 'normal',
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSpacing: (spacing) => set({ spacing }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
    }),
    {
      name: 'dm-portal-settings-v2',
    }
  )
);
