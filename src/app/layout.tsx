
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { useSettingsStore } from '@/lib/settings-store';
import { AccessibilityToolbar } from '@/components/accessibility-toolbar';
import { ServiceAssistant } from '@/components/citizen/service-assistant';
import { ThiqaDialogHost } from '@/components/citizen/thiqa-dialog';
import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = useSettingsStore(s => s.language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? language : 'ar';
  const currentDir = currentLang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={currentLang} dir={currentDir}>
      <head>
        <title>{currentLang === 'ar' ? 'بوابة بلدية ظفار الرقمية الموحدة' : 'Dhofar Municipality Unified Digital Portal'}</title>
        <meta name="description" content={currentLang === 'ar' ? 'البوابة الرسمية للخدمات الإلكترونية لبلدية ظفار - سلطنة عمان' : 'Official Electronic Services Portal for Dhofar Municipality - Sultanate of Oman'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;400;700&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --font-readex: 'Readex Pro', sans-serif;
          }
          body {
            font-family: var(--font-readex) !important;
          }
        `}</style>
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:bg-accent focus:text-white focus:p-4">
          {currentLang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
        </a>
        <FirebaseClientProvider>
          <div id="main-content">
            {children}
          </div>
          {mounted && <AccessibilityToolbar />}
          {mounted && <ServiceAssistant />}
          {mounted && <ThiqaDialogHost />}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
