'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ListChecks, Send, Video, Volume2, Loader2, Clock, BadgeCent, ShieldAlert, FileSearch } from 'lucide-react';
import { Service } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
  
  const [loadingSign, setLoadingSign] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);

  const handleSignLanguage = async () => {
    setLoadingSign(true);
    try {
      const text = isAr ? service.title : (service.titleEn || service.title);
      const { description } = await explainInSignLanguage({ text, language: isAr ? 'ar' : 'en' });
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

  const title = isAr ? service.title : (service.titleEn || service.title);

  return (
    <div className={cn("relative group perspective-1000", compact ? 'scale-95 origin-top' : '')}>
      <article className="p-6 rounded-[2.2rem] bg-white transition-all duration-500 cursor-pointer flex flex-col justify-between h-80 border border-transparent shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:border-primary/20 relative z-10 overflow-hidden">
        <div>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br from-primary to-accent relative overflow-hidden" aria-hidden="true">
              {service.customIconUrl ? (
                <Image src={service.customIconUrl} alt="" fill className="object-contain p-2" />
              ) : (
                <IconComponent size={28} />
              )}
            </div>
            <h3 className="font-black text-sm text-slate-800 leading-tight mt-1">
              {title}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 hover:text-accent" 
              onClick={(e) => { e.stopPropagation(); handleTTS(); }} 
              disabled={ttsLoading}
              aria-label={isAr ? `قراءة وصف خدمة ${title}` : `Read aloud description for ${title}`}
            >
              {ttsLoading ? <Loader2 className="animate-spin size-4" /> : <Volume2 size={16} />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-lg bg-slate-50 text-slate-500 hover:text-accent" 
              onClick={(e) => { e.stopPropagation(); handleSignLanguage(); }} 
              disabled={loadingSign}
              aria-label={isAr ? `ترجمة خدمة ${title} للغة الإشارة` : `Translate ${title} to sign language`}
            >
              {loadingSign ? <Loader2 className="animate-spin size-4" /> : <Video size={16} />}
            </Button>
          </div>
          <p className="text-[10px] text-slate-600 font-medium mt-3 line-clamp-2">
            {isAr ? service.description : (service.descriptionEn || service.description)}
          </p>
        </div>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
          <Link 
            href={`/services/${service.id}`} 
            className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary flex items-center gap-1"
            aria-label={isAr ? `الدخول لخدمة ${title}` : `Access service for ${title}`}
          >
            {isAr ? "الدخول للخدمة" : "Access Service"}
            <Send size={12} className="inline ml-1" aria-hidden="true" />
          </Link>
          <ArrowUpRight size={18} className="text-secondary" aria-hidden="true" />
        </div>

        {/* Hover Information Overlay - Expanded as requested */}
        <div className="absolute inset-0 bg-slate-900/95 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between translate-y-4 group-hover:translate-y-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-2">
              <FileSearch size={16} className="text-accent" aria-hidden="true" />
              <span className="text-white font-black text-xs uppercase tracking-widest">{isAr ? "تفاصيل الخدمة" : "Service Details"}</span>
            </div>
            
            {/* Required Documents */}
            <div className="space-y-1">
               <span className="text-[9px] text-accent font-black uppercase flex items-center gap-1"><ListChecks size={10}/> {isAr ? 'المستندات المطلوبة' : 'Documents'}</span>
               <p className="text-white font-bold text-[10px] line-clamp-1">{(isAr ? service.reqsAr : service.reqsEn)?.join(', ')}</p>
            </div>

            {/* Duration */}
            <div className="space-y-1">
               <span className="text-[9px] text-accent font-black uppercase flex items-center gap-1"><Clock size={10}/> {isAr ? 'مدة الإنجاز' : 'Duration'}</span>
               <p className="text-white font-bold text-[10px]">{isAr ? (service.durationAr || 'فوري') : (service.durationEn || 'Instant')}</p>
            </div>

            {/* Price/Fees */}
            <div className="space-y-1">
               <span className="text-[9px] text-accent font-black uppercase flex items-center gap-1"><BadgeCent size={10}/> {isAr ? 'الرسوم المقررة' : 'Price'}</span>
               <p className="text-white font-bold text-[10px]">{isAr ? service.fees : (service.feesEn || service.fees)}</p>
            </div>

            {/* Conditions */}
            <div className="space-y-1">
               <span className="text-[9px] text-accent font-black uppercase flex items-center gap-1"><ShieldAlert size={10}/> {isAr ? 'الاشتراطات' : 'Conditions'}</span>
               <p className="text-white font-bold text-[10px] line-clamp-1">{isAr ? (service.conditionsAr || 'عماني الجنسية') : (service.conditionsEn || 'Omani Citizen')}</p>
            </div>
          </div>
          
          <Button className="w-full bg-accent text-accent-foreground font-black rounded-full h-10 text-xs mt-2" asChild>
            <Link href={`/services/${service.id}`}>
              {isAr ? "تقديم طلب رقمي" : "Apply Digitally"}
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
};