
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
  Keyboard,
  Languages,
  X,
  Volume2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function AccessibilityMenu() {
  const { fontSize, setFontSize, highContrast, toggleHighContrast, language, setLanguage, spacing, setSpacing } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAr = language === 'ar';

  const handleLanguageToggle = () => {
    const newLang = isAr ? 'en' : 'ar';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="fixed right-6 bottom-24 z-[9999]" role="region" aria-label="Accessibility Toolbar">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full shadow-[0_0_40px_rgba(3,207,203,0.5)] bg-primary hover:bg-secondary text-white border-4 border-white animate-bounce-slow"
            aria-label="Toggle Accessibility Menu"
          >
            <Accessibility className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-85 p-0 mr-4 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] rounded-[3rem] border-none overflow-hidden" side="left" align="end">
          <div className="bg-slate-900 p-8 text-white relative">
             <div className="flex items-center gap-4 relative z-10">
                <div className="size-12 rounded-2xl bg-accent text-slate-900 flex items-center justify-center shadow-lg"><Accessibility size={28}/></div>
                <div>
                   <h2 className="font-black text-lg leading-none">{isAr ? 'مركز النفاذ الرقمي الشامل' : 'Inclusive Access Hub'}</h2>
                   <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-2">WCAG 2.2 Global Standard</p>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 pointer-events-none" />
          </div>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Language & Scale */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="size-1.5 bg-accent rounded-full" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'اللغة والمقياس' : 'Language & Scale'}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-between h-14 font-black rounded-2xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all px-6"
                onClick={handleLanguageToggle}
              >
                <div className="flex items-center gap-4">
                   <Languages className="size-5 text-accent" />
                   <span>{isAr ? 'English (Global)' : 'العربية (عمان)'}</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-black">AI Translated</Badge>
              </Button>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'base', label: 'A', desc: 'Standard' },
                  { id: 'lg', label: 'A+', desc: 'Large' },
                  { id: 'xl', label: 'A++', desc: 'X-Large' }
                ].map(size => (
                  <Button 
                    key={size.id}
                    variant={fontSize === size.id ? 'default' : 'outline'} 
                    className={cn("flex flex-col h-16 rounded-2xl gap-0.5", fontSize === size.id ? "dm-gradient-primary shadow-xl" : "border-2")}
                    onClick={() => setFontSize(size.id as any)}
                  >
                    <span className="text-lg font-black">{size.label}</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase">{size.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Visual Assistants */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="size-1.5 bg-accent rounded-full" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'المساعدات البصرية' : 'Visual Aids'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <Button 
                   variant={highContrast ? 'secondary' : 'outline'} 
                   className={cn("h-14 font-black rounded-2xl border-2 gap-3", highContrast && "bg-slate-950 text-white border-slate-950 shadow-lg")}
                   onClick={toggleHighContrast}
                 >
                   <Contrast className="size-5" />
                   <span>{isAr ? 'تباين عالٍ' : 'Contrast'}</span>
                 </Button>
                 <Button 
                   variant={spacing === 'wide' ? 'secondary' : 'outline'} 
                   className={cn("h-14 font-black rounded-2xl border-2 gap-3", spacing === 'wide' && "bg-slate-950 text-white border-slate-950 shadow-lg")}
                   onClick={() => setSpacing(spacing === 'wide' ? 'normal' : 'wide')}
                 >
                   <Maximize2 className="size-5" />
                   <span>{isAr ? 'تباعد' : 'Spacing'}</span>
                 </Button>
              </div>
            </div>

            {/* Hearing & Motor */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="size-1.5 bg-accent rounded-full" />
                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'السمعية والحركية' : 'Hearing & Motor'}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-4 h-14 font-black rounded-2xl border-2 px-6"
                onClick={() => toast({ title: isAr ? "مساعد لغة الإشارة" : "OSL Assistant", description: "Activating Oman SL Neural Flow..." })}
              >
                <div className="size-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Video size={20}/></div>
                <span>{isAr ? 'لغة الإشارة العمانية (OSL)' : 'Oman Sign Language'}</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-4 h-14 font-black rounded-2xl border-2 px-6"
              >
                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Keyboard size={20}/></div>
                <span>{isAr ? 'دليل لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
              </Button>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t text-center">
             <Badge variant="outline" className="rounded-full font-black text-[9px] uppercase text-slate-400 px-4 py-1">Inclusive Dhofar Municipality v4.0</Badge>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
