
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'ar' | 'en';
type FontSize = 'base' | 'lg' | 'xl';

interface SettingsState {
  language: Language;
  fontSize: FontSize;
  highContrast: boolean;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  toggleHighContrast: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      fontSize: 'base',
      highContrast: false,
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
    }),
    {
      name: 'dm-portal-settings',
    }
  )
);
