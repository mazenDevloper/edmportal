
'use client';

import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { 
  Accessibility, 
  Contrast, 
  Type,
  Maximize2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

export function AccessibilityMenu() {
  const { fontSize, setFontSize, highContrast, toggleHighContrast, language, spacing, setSpacing } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering the menu on the server
  if (!mounted) return null;

  const isAr = language === 'ar';

  return (
    <div className="fixed right-6 bottom-24 z-[9999]" role="region" aria-label={isAr ? "أدوات التسهيل والنفاذ" : "Accessibility controls"}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full shadow-[0_0_30px_rgba(3,207,203,0.4)] bg-[#008E91] hover:bg-[#470D67] text-white border-2 border-white focus-visible:ring-4 focus-visible:ring-accent animate-bounce-slow"
            aria-label={isAr ? "أدوات النفاذ الرقمي" : "Digital Accessibility Tools"}
          >
            <Accessibility className="h-8 w-8" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-6 mr-4 bg-white shadow-2xl rounded-[2rem] border-2 border-primary/10" side="left" align="end">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Accessibility size={20} />
              </div>
              <h2 className="font-black text-sm text-primary">
                {isAr ? 'أدوات النفاذ الرقمي (WCAG 2.2)' : 'Digital Accessibility Tools'}
              </h2>
            </div>
            
            <div className="space-y-3">
              <span className="text-[10px] font-black block text-slate-400 uppercase tracking-widest">{isAr ? 'حجم الخط' : 'Font Size'}</span>
              <div className="flex gap-2" role="group" aria-label={isAr ? "تغيير مقاس الخط" : "Change size"}>
                {[
                  { id: 'base', label: 'A' },
                  { id: 'lg', label: 'A+' },
                  { id: 'xl', label: 'A++' }
                ].map(size => (
                  <Button 
                    key={size.id}
                    variant={fontSize === size.id ? 'default' : 'outline'} 
                    className={cn("flex-1 font-black rounded-xl", fontSize === size.id && "dm-gradient-primary border-none shadow-none")}
                    onClick={() => setFontSize(size.id as any)}
                    aria-pressed={fontSize === size.id}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black block text-slate-400 uppercase tracking-widest">{isAr ? 'إعدادات الرؤية والتباين' : 'Visual & Contrast'}</span>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant={highContrast ? 'secondary' : 'outline'} 
                  className={cn("w-full justify-start gap-3 h-12 font-bold rounded-xl", highContrast && "bg-slate-900 text-white")}
                  onClick={toggleHighContrast}
                >
                  <Contrast className="h-5 w-5" />
                  <span>{highContrast ? (isAr ? 'إلغاء التباين العالي' : 'Disable High Contrast') : (isAr ? 'تفعيل تباين عالي' : 'Enable High Contrast')}</span>
                </Button>
                <Button 
                  variant={spacing === 'wide' ? 'secondary' : 'outline'} 
                  className={cn("w-full justify-start gap-3 h-12 font-bold rounded-xl", spacing === 'wide' && "bg-primary/10 text-primary border-primary")}
                  onClick={() => setSpacing(spacing === 'normal' ? 'wide' : 'normal')}
                >
                  <Maximize2 className="h-5 w-5" />
                  <span>{spacing === 'wide' ? (isAr ? 'تباعد عادي' : 'Normal Spacing') : (isAr ? 'تباعد الأسطر' : 'Wide Text Spacing')}</span>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed">
                {isAr ? 'هذه المنصة متوافقة مع معايير النفاذ الرقمي العالمية لضمان سهولة الاستخدام لكافة المواطنين.' : 'Platform compliant with international accessibility standards to ensure ease of use for all citizens.'}
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
