'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ListChecks, Send, Video, Volume2, Loader2 } from 'lucide-react';
import { Service } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { explainInSignLanguage, generateSignVideo } from '@/ai/flows/sign-language-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';

interface ServiceCardEnhancedProps {
  service: Service;
  isAr: boolean;
  compact?: boolean;
}

export const ServiceCardEnhanced = ({ service, isAr, compact = false }: ServiceCardEnhancedProps) => {
  const IconComponent = (Icons as any)[service.iconName] || Icons.Info;
  const catInfo = CAT_CONFIG[service.category as CategoryId];
  
  const [loadingSign, setLoadingSign] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);

  const handleSignLanguage = async () => {
    setLoadingSign(true);
    try {
      const text = isAr ? service.title : (service.titleEn || service.title);
      const { description, videoPrompt } = await explainInSignLanguage({ text, language: isAr ? 'ar' : 'en' });
      // In a real scenario, we might trigger generateSignVideo(videoPrompt) here
      alert(description);
    } finally {
      setLoadingSign(false);
    }
  };

  const handleTTS = async () => {
    setTtsLoading(true);
    try {
      const text = `${isAr ? service.title : (service.titleEn || service.title)}. ${isAr ? service.description : (service.descriptionEn || service.description)}`;
      const { audioDataUri } = await textToSpeech(text);
      new Audio(audioDataUri).play();
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <div className={cn("relative group perspective-1000", compact ? 'scale-95 origin-top' : '')}>
      <div className="p-6 rounded-[2.2rem] bg-white transition-all duration-500 cursor-pointer flex flex-col justify-between h-80 border border-transparent shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:border-primary/20 relative z-10 overflow-hidden">
        <div>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br from-primary to-accent">
              <IconComponent size={28} />
            </div>
            <h5 className="font-black text-sm text-slate-800 leading-tight mt-1">
              {isAr ? service.title : (service.titleEn || service.title)}
            </h5>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-accent" onClick={handleTTS} disabled={ttsLoading}>
              {ttsLoading ? <Loader2 className="animate-spin size-4" /> : <Volume2 size={16} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-accent" onClick={handleSignLanguage} disabled={loadingSign}>
              {loadingSign ? <Loader2 className="animate-spin size-4" /> : <Video size={16} />}
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-3 line-clamp-2">
            {isAr ? service.description : (service.descriptionEn || service.description)}
          </p>
        </div>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
          <Link href={`/services/${service.id}`} className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary flex items-center gap-1">
            {isAr ? "الدخول للخدمة" : "Access Service"}
            <Send size={12} className="inline ml-1" />
          </Link>
          <ArrowUpRight size={18} className="text-secondary" />
        </div>

        {/* Hover Requirements Overlay */}
        <div className="absolute inset-0 bg-slate-900/95 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between translate-y-4 group-hover:translate-y-0">
          <div>
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
              <ListChecks size={16} className="text-accent" />
              <span className="text-white font-black text-xs">{isAr ? "المتطلبات" : "Requirements"}</span>
            </div>
            <ul className="space-y-2">
              {(isAr ? service.reqsAr : service.reqsEn)?.slice(0, 3).map((req, idx) => (
                <li key={idx} className="text-slate-300 text-[10px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" /> {req}
                </li>
              ))}
            </ul>
          </div>
          <Button className="w-full bg-accent text-accent-foreground font-black rounded-full h-10 text-xs" asChild>
            <Link href={`/services/${service.id}`}>
              {isAr ? "تقديم طلب رقمي" : "Apply Digitally"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
