
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { useSettingsStore } from '@/lib/settings-store';
import { AccessibilityMenu } from '@/components/accessibility-menu';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, fontSize, highContrast, spacing } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ar';
  const currentDir = currentLang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={currentLang} dir={currentDir} className={cn(mounted && highContrast ? 'high-contrast' : '')}>
      <head>
        <title>{currentLang === 'ar' ? 'بوابة بلدية ظفار الرقمية الموحدة' : 'Dhofar Municipality Unified Digital Portal'}</title>
        <meta name="description" content={currentLang === 'ar' ? 'البوابة الرسمية للخدمات الإلكترونية لبلدية ظفار - سلطنة عمان' : 'Official Electronic Services Portal for Dhofar Municipality - Sultanate of Oman'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "antialiased transition-all duration-300 min-h-screen bg-background text-foreground",
        currentLang === 'ar' ? 'font-arabic' : 'font-sans',
        mounted && fontSize === 'lg' && 'text-lg',
        mounted && fontSize === 'xl' && 'text-xl',
        mounted && spacing === 'wide' && 'tracking-wider leading-loose'
      )}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:bg-accent focus:text-white focus:p-4">
          {currentLang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
        </a>
        <FirebaseClientProvider>
          {children}
          {mounted && <AccessibilityMenu />}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
