
'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      "home": "الرئيسية",
      "admin": "لوحة التحكم",
      "services": "الخدمات",
      "search_placeholder": "ابحث عن خدمة بلدية...",
      "featured_services": "الخدمات الأكثر طلباً",
      "contact_us": "تواصل معنا",
      "accessibility": "النفاذ الرقمي",
      "language": "العربية",
      "loading": "جاري التحميل...",
      "save": "حفظ",
      "back": "رجوع"
    }
  },
  en: {
    translation: {
      "home": "Home",
      "admin": "Admin",
      "services": "Services",
      "search_placeholder": "Search municipal services...",
      "featured_services": "Top Municipal Services",
      "contact_us": "Contact Us",
      "accessibility": "Accessibility",
      "language": "English",
      "loading": "Loading...",
      "save": "Save",
      "back": "Back"
    }
  }
};

if (!i18next.isInitialized) {
  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'ar',
      interpolation: {
        escapeValue: false
      }
    });
}

export default i18next;
