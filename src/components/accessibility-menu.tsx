'use client';

import React from 'react';
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

export function AccessibilityMenu() {
  const { fontSize, setFontSize, highContrast, toggleHighContrast, language } = useSettingsStore();

  const isAr = language === 'ar';

  return (
    <div className="fixed right-4 bottom-24 z-[100]" role="region" aria-label={isAr ? "أدوات التسهيل والنفاذ" : "Accessibility controls"}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-2xl bg-[#008E91] hover:bg-[#470D67] text-white border-2 border-white focus-visible:ring-4 focus-visible:ring-accent animate-in fade-in zoom-in"
            aria-label={isAr ? "أدوات النفاذ الرقمي" : "Digital Accessibility Tools"}
          >
            <Accessibility className="h-8 w-8" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-6 mr-4 bg-white shadow-2xl rounded-2xl border border-slate-100" side="left" align="end">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Accessibility size={20} />
              </div>
              <h2 className="font-black text-sm text-primary">
                {isAr ? 'أدوات النفاذ الرقمي (WCAG 2.2)' : 'Digital Accessibility Tools'}
              </h2>
            </div>
            
            <div className="space-y-3">
              <span className="text-xs font-black block text-slate-500 uppercase tracking-widest">{isAr ? 'حجم الخط' : 'Font Size'}</span>
              <div className="flex gap-2" role="group" aria-label={isAr ? "تغيير مقاس الخط" : "Change size"}>
                {[
                  { id: 'base', label: 'A' },
                  { id: 'lg', label: 'A+' },
                  { id: 'xl', label: 'A++' }
                ].map(size => (
                  <Button 
                    key={size.id}
                    variant={fontSize === size.id ? 'default' : 'outline'} 
                    className="flex-1 font-black"
                    onClick={() => setFontSize(size.id as any)}
                    aria-pressed={fontSize === size.id}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-black block text-slate-500 uppercase tracking-widest">{isAr ? 'إعدادات الرؤية' : 'Visual Settings'}</span>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant={highContrast ? 'secondary' : 'outline'} 
                  className="w-full justify-start gap-3 h-12 font-bold"
                  onClick={toggleHighContrast}
                >
                  <Contrast className="h-5 w-5" />
                  <span>{highContrast ? (isAr ? 'إلغاء التباين العالي' : 'Disable High Contrast') : (isAr ? 'تفعيل تباين عالي' : 'Enable High Contrast')}</span>
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 font-bold"
                >
                  <Maximize2 className="h-5 w-5" />
                  <span>{isAr ? 'تباعد الأسطر' : 'Text Spacing'}</span>
                </Button>
              </div>
            </div>
            
            <p className="text-[9px] text-slate-400 font-bold text-center pt-2">
              {isAr ? 'هذه المنصة متوافقة مع معايير النفاذ الرقمي العالمية' : 'Platform compliant with international accessibility standards'}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}