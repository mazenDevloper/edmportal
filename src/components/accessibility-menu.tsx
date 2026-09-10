
'use client';

import React from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { 
  Accessibility, 
  Type, 
  Contrast, 
  X,
  Plus,
  Minus
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
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[100]">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-2xl bg-[#008E91] hover:bg-[#470D67] text-white border-2 border-white"
          >
            <Accessibility className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 mr-4" side="left">
          <div className="space-y-4">
            <h4 className="font-bold border-b pb-2 text-[#008E91]">
              {isAr ? 'أدوات النفاذ الرقمي' : 'Digital Accessibility Tools'}
            </h4>
            
            <div className="space-y-2">
              <p className="text-xs font-semibold">{isAr ? 'حجم الخط' : 'Font Size'}</p>
              <div className="flex gap-2">
                <Button 
                  variant={fontSize === 'base' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFontSize('base')}
                >A</Button>
                <Button 
                  variant={fontSize === 'lg' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFontSize('lg')}
                >A+</Button>
                <Button 
                  variant={fontSize === 'xl' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFontSize('xl')}
                >A++</Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">{isAr ? 'تباين الألوان' : 'Color Contrast'}</p>
              <Button 
                variant={highContrast ? 'secondary' : 'outline'} 
                className="w-full justify-start gap-2"
                onClick={toggleHighContrast}
              >
                <Contrast className="h-4 w-4" />
                {isAr ? 'تباين عالي' : 'High Contrast'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
