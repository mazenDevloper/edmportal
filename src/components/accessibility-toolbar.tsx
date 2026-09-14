
'use client';

import React, { useState, useEffect } from 'react';
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
  Volume2,
  Eye,
  Brain,
  Activity,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Category = 'visual' | 'cognitive' | 'seizure' | 'general';

export function AccessibilityToolbar() {
  const { 
    fontSize, setFontSize, 
    highContrast, toggleHighContrast, 
    language, setLanguage, 
    spacing, setSpacing,
    reducedMotion, toggleReducedMotion,
    dyslexiaFont, toggleDyslexiaFont
  } = useSettingsStore();
  
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('general');
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAr = language === 'ar';

  const categories = [
    { id: 'general', label: isAr ? 'عام' : 'General', icon: <Accessibility size={18}/> },
    { id: 'visual', label: isAr ? 'بصري' : 'Visual', icon: <Eye size={18}/> },
    { id: 'cognitive', label: isAr ? 'إدراكي' : 'Cognitive', icon: <Brain size={18}/> },
    { id: 'seizure', label: isAr ? 'حركي/نوبات' : 'Motion', icon: <Activity size={18}/> },
  ];

  const resetAll = () => {
    setFontSize('base');
    setSpacing('normal');
    if (highContrast) toggleHighContrast();
    if (reducedMotion) toggleReducedMotion();
    if (dyslexiaFont) toggleDyslexiaFont();
    toast({ title: isAr ? 'تمت استعادة الإعدادات الافتراضية' : 'Settings Reset to Default' });
  };

  return (
    <div className="fixed right-6 bottom-6 z-[9999]" role="region" aria-label="Accessibility Toolbar">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full shadow-[0_10px_40px_rgba(3,207,203,0.4)] bg-primary hover:bg-secondary text-white border-4 border-white transition-transform hover:scale-110"
            aria-label="Toggle Accessibility Menu"
          >
            <Accessibility className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 mr-4 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] rounded-[2.5rem] border-none overflow-hidden" side="top" align="end">
          {/* Header */}
          <div className="bg-slate-900 p-8 text-white relative">
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-accent text-slate-900 flex items-center justify-center shadow-lg"><Accessibility size={28}/></div>
                  <div>
                    <h2 className="font-black text-lg leading-none">{isAr ? 'مركز المساعدة الرقمي' : 'Inclusive Access Hub'}</h2>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-2">WCAG 2.2 Compliance</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetAll} className="text-white/40 hover:text-white rounded-full">
                  <RotateCcw size={20} />
                </Button>
             </div>
             <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 pointer-events-none" />
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-4 bg-slate-50 border-b flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                className={cn(
                  "flex-1 flex flex-col h-14 rounded-2xl gap-1 text-[10px] font-black transition-all",
                  activeCategory === cat.id ? "bg-white shadow-sm text-primary" : "text-slate-400 opacity-60 hover:text-slate-600"
                )}
                onClick={() => setActiveCategory(cat.id as Category)}
              >
                {cat.icon}
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Tools Area */}
          <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
            
            {/* Visual Section */}
            {(activeCategory === 'general' || activeCategory === 'visual') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'الرؤية والتباين' : 'Visual & Contrast'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={highContrast ? 'secondary' : 'outline'} 
                    className={cn("h-14 font-black rounded-2xl border-2 gap-3", highContrast && "bg-slate-950 text-white border-slate-950 shadow-lg")}
                    onClick={toggleHighContrast}
                  >
                    <Contrast className="size-5" />
                    <span>{isAr ? 'تباين عالٍ' : 'High Contrast'}</span>
                  </Button>
                  <Button 
                    variant={fontSize !== 'base' ? 'secondary' : 'outline'} 
                    className={cn("h-14 font-black rounded-2xl border-2 gap-3", fontSize !== 'base' && "bg-primary text-white border-primary shadow-lg")}
                    onClick={() => setFontSize(fontSize === 'base' ? 'lg' : fontSize === 'lg' ? 'xl' : 'base')}
                  >
                    <Type className="size-5" />
                    <span>{isAr ? 'حجم الخط' : 'Font Size'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Cognitive Section */}
            {(activeCategory === 'general' || activeCategory === 'cognitive') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'الدعم الإدراكي' : 'Cognitive Support'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={dyslexiaFont ? 'secondary' : 'outline'} 
                    className={cn("h-14 font-black rounded-2xl border-2 gap-3", dyslexiaFont && "bg-amber-500 text-white border-amber-500 shadow-lg")}
                    onClick={toggleDyslexiaFont}
                  >
                    <Type className="size-5" />
                    <span>{isAr ? 'خط عسر القراءة' : 'Dyslexia Font'}</span>
                  </Button>
                  <Button 
                    variant={spacing === 'wide' ? 'secondary' : 'outline'} 
                    className={cn("h-14 font-black rounded-2xl border-2 gap-3", spacing === 'wide' && "bg-slate-900 text-white border-slate-900 shadow-lg")}
                    onClick={() => setSpacing(spacing === 'wide' ? 'normal' : 'wide')}
                  >
                    <Maximize2 className="size-5" />
                    <span>{isAr ? 'تباعد النصوص' : 'Text Spacing'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Motion/Seizure Section */}
            {(activeCategory === 'general' || activeCategory === 'seizure') && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'الحركة والنوبات' : 'Motion & Seizures'}</p>
                <Button 
                  variant={reducedMotion ? 'secondary' : 'outline'} 
                  className={cn("w-full h-14 font-black rounded-2xl border-2 gap-3 px-6", reducedMotion && "bg-red-600 text-white border-red-600 shadow-lg")}
                  onClick={toggleReducedMotion}
                >
                  <Activity className="size-5" />
                  <span>{isAr ? 'تعطيل الحركات المشتتة' : 'Disable Animations'}</span>
                  {reducedMotion && <Check size={16} className="ml-auto" />}
                </Button>
              </div>
            )}

            {/* Language Switch */}
            <div className="space-y-4 pt-4 border-t">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? 'اللغة' : 'Language'}</p>
              <Button 
                variant="outline" 
                className="w-full justify-between h-14 font-black rounded-2xl border-2 px-6 hover:bg-primary/5"
                onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              >
                <div className="flex items-center gap-4">
                   <Languages className="size-5 text-accent" />
                   <span>{isAr ? 'Switch to English' : 'التحويل للعربية'}</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-black">AI Auto</Badge>
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-slate-50 border-t text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
               Dhofar Municipality Digital Governance<br/>
               Inclusivity Standards v4.2
             </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
