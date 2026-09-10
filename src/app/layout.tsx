
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
  const { language, fontSize, highContrast } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  if (!mounted) return null;

  return (
    <html lang={language} dir={direction}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(
        "antialiased transition-all duration-300",
        language === 'ar' ? 'font-arabic' : 'font-body',
        fontSize === 'lg' && 'text-lg',
        fontSize === 'xl' && 'text-xl',
        highContrast && 'high-contrast'
      )}>
        <FirebaseClientProvider>
          {children}
          <AccessibilityMenu />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
