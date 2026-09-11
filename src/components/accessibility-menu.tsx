
'use client';

import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Accessibility, 
  Contrast, 
  Type,
  Maximize2,
  Video,
  Volume2,
  Keyboard,
  Eye,
  Languages
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function AccessibilityMenu() {
  const { fontSize, setFontSize, highContrast, toggleHighContrast, language, setLanguage, spacing, setSpacing } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAr = language === 'ar';

  const handleKeyboardGuide = () => {
    toast({
      title: isAr ? "مساعد لوحة المفاتيح" : "Keyboard Navigation",
      description: isAr ? "استخدم Tab للتنقل و Enter للاختيار. Alt+S للتخطي للمحتوى." : "Use Tab to navigate and Enter to select. Alt+S to skip to content."
    });
  };

  return (
    <div className="fixed right-6 bottom-24 z-[9999]" role="region" aria-label={isAr ? "أدوات التسهيل والنفاذ" : "Accessibility controls"}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full shadow-[0_0_30px_rgba(3,207,203,0.4)] bg-[#008E91] hover:bg-[#470D67] text-white border-2 border-white focus-visible:ring-4 focus-visible:ring-accent animate-pulse"
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
                {isAr ? 'أدوات النفاذ الشامل (WCAG 2.2)' : 'Universal Access Tools'}
              </h2>
            </div>
            
            <div className="space-y-3">
              <span className="text-[10px] font-black block text-slate-400 uppercase tracking-widest">{isAr ? 'اللغة والمقياس' : 'Language & Scale'}</span>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 font-bold rounded-xl"
                onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              >
                <Languages className="h-5 w-5 text-accent" />
                <span>{isAr ? 'English' : 'العربية'}</span>
              </Button>
              <div className="flex gap-2" role="group">
                {[
                  { id: 'base', label: 'A' },
                  { id: 'lg', label: 'A+' },
                  { id: 'xl', label: 'A++' }
                ].map(size => (
                  <Button 
                    key={size.id}
                    variant={fontSize === size.id ? 'default' : 'outline'} 
                    className={cn("flex-1 font-black rounded-xl", fontSize === size.id && "dm-gradient-primary")}
                    onClick={() => setFontSize(size.id as any)}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black block text-slate-400 uppercase tracking-widest">{isAr ? 'المساعدات البصرية' : 'Visual Aids'}</span>
              <Button 
                variant={highContrast ? 'secondary' : 'outline'} 
                className={cn("w-full justify-start gap-3 h-12 font-bold rounded-xl", highContrast && "bg-slate-900 text-white")}
                onClick={toggleHighContrast}
              >
                <Contrast className="h-5 w-5" />
                <span>{isAr ? 'تباين عالي' : 'High Contrast'}</span>
              </Button>
              <Button 
                variant={spacing === 'wide' ? 'secondary' : 'outline'} 
                className={cn("w-full justify-start gap-3 h-12 font-bold rounded-xl", spacing === 'wide' && "bg-slate-900 text-white")}
                onClick={() => setSpacing(spacing === 'wide' ? 'normal' : 'wide')}
              >
                <Maximize2 className="h-5 w-5" />
                <span>{isAr ? 'تباعد مريح' : 'Comfortable Spacing'}</span>
              </Button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black block text-slate-400 uppercase tracking-widest">{isAr ? 'الإعاقة السمعية والحركية' : 'Hearing & Motor'}</span>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 font-black rounded-xl"
                  onClick={() => toast({ title: isAr ? "مساعد لغة الإشارة" : "Sign Language Assistant", description: isAr ? "جاري تفعيل ترجمة الإشارة العمانية..." : "Activating Oman SL Assistant..." })}
                >
                  <Video className="h-5 w-5 text-accent" />
                  <span>{isAr ? 'لغة الإشارة العمانية' : 'Oman Sign Language'}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 font-black rounded-xl"
                  onClick={handleKeyboardGuide}
                >
                  <Keyboard className="h-5 w-5 text-accent" />
                  <span>{isAr ? 'التنقل بلوحة المفاتيح' : 'Keyboard Navigation'}</span>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400">
                {isAr ? 'بوابة متاحة للجميع' : 'Inclusive Access Portal'}
              </Badge>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
