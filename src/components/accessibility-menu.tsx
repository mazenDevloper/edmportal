'use client';

import React from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { 
  Accessibility, 
  Contrast, 
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
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[100]" role="region" aria-label={isAr ? "أدوات التسهيل والنفاذ" : "Accessibility controls"}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-2xl bg-[#008E91] hover:bg-[#470D67] text-white border-2 border-white focus-visible:ring-4 focus-visible:ring-accent"
            aria-label={isAr ? "أدوات النفاذ الرقمي والتحكم بالتسهيلات" : "Digital Accessibility Tools"}
          >
            <Accessibility className="h-6 w-6" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 mr-4 bg-white shadow-xl rounded-xl border border-slate-200" side="left">
          <div className="space-y-4">
            <h2 className="font-bold border-b pb-2 text-sm text-[#008E91]">
              {isAr ? 'أدوات النفاذ الرقمي (WCAG)' : 'Digital Accessibility Tools'}
            </h2>
            
            <div className="space-y-2">
              <span className="text-xs font-bold block text-slate-700">{isAr ? 'حجم خط واجهة المستخدم' : 'Interface Font Size'}</span>
              <div className="flex gap-2" role="group" aria-label={isAr ? "تغيير مقاس الخط" : "Change size"}>
                <Button 
                  variant={fontSize === 'base' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFontSize('base')}
                  aria-label={isAr ? "الخط الافتراضي" : "Default font size"}
                  aria-pressed={fontSize === 'base'}
                >A</Button>
                <Button 
                  variant={fontSize === 'lg' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFontSize('lg')}
                  aria-label={isAr ? "تكبير الخط" : "Large font size"}
                  aria-pressed={fontSize === 'lg'}
                >A+</Button>
                <Button 
                  variant={fontSize === 'xl' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFontSize('xl')}
                  aria-label={isAr ? "تكبير الخط مضاعف" : "Extra large font size"}
                  aria-pressed={fontSize === 'xl'}
                >A++</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold block text-slate-700">{isAr ? 'تباين ألوان العرض' : 'Color Contrast Option'}</span>
              <Button 
                variant={highContrast ? 'secondary' : 'outline'} 
                className="w-full justify-start gap-2 focus-visible:ring-2 focus-visible:ring-[#008E91]"
                onClick={toggleHighContrast}
                aria-pressed={highContrast}
              >
                <Contrast className="h-4 w-4" aria-hidden="true" />
                <span>{highContrast ? (isAr ? 'إلغاء التباين العالي' : 'Disable High Contrast') : (isAr ? 'تفعيل تباين عالي' : 'Enable High Contrast')}</span>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
