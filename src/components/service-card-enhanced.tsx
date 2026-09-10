'use client';

import React from 'react';
import { ArrowUpRight, ListChecks, ExternalLink } from 'lucide-react';
import { Service } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface ServiceCardEnhancedProps {
  service: Service;
  isAr: boolean;
  compact?: boolean;
}

export const ServiceCardEnhanced = ({ service, isAr, compact = false }: ServiceCardEnhancedProps) => {
  const IconComponent = (Icons as any)[service.iconName] || Icons.Info;
  const catInfo = CAT_CONFIG[service.category as CategoryId];

  const handleAccessClick = (e: React.MouseEvent) => {
    if (service.linkUrl) {
      e.stopPropagation();
      window.open(service.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={cn("relative group perspective-1000", compact ? 'scale-95 origin-top' : '')} onClick={handleAccessClick}>
      <div className="p-6 rounded-[2.2rem] bg-white transition-all duration-500 cursor-pointer flex flex-col justify-between h-72 border border-transparent shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:border-primary/20 relative z-10 overflow-hidden">
        <div>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-12 bg-gradient-to-br from-primary to-accent">
              <IconComponent size={28} />
            </div>
            <h5 className="font-black text-sm text-slate-800 leading-tight mt-1">
              {isAr ? service.title : (service.titleEn || service.title)}
            </h5>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black border uppercase",
              catInfo?.color || "bg-slate-100 text-slate-600 border-slate-200"
            )}>
              {isAr ? catInfo?.labelAr : catInfo?.labelEn}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-3 line-clamp-2">
            {isAr ? service.description : (service.descriptionEn || service.description)}
          </p>
        </div>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-secondary flex items-center gap-1">
            {isAr ? "الدخول إلى الخدمة" : "Access Service"}
            {service.linkUrl && <ExternalLink size={12} className="inline ml-1" />}
          </span>
          <ArrowUpRight size={18} className="text-secondary transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>

        <div className="absolute inset-0 bg-slate-900/95 p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center translate-y-4 group-hover:translate-y-0">
          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
            <ListChecks size={16} className="text-accent" />
            <span className="text-white font-black text-xs">{isAr ? "المتطلبات" : "Requirements"}</span>
          </div>
          <ul className="space-y-2">
            {(isAr ? service.reqsAr : service.reqsEn)?.length > 0 ? (
              (isAr ? service.reqsAr : service.reqsEn).map((req, idx) => (
                <li key={idx} className="text-slate-300 text-[10px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" /> {req}
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic text-[10px]">{isAr ? "لا توجد متطلبات خاصة" : "No special requirements"}</li>
            )}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-slate-500 text-[9px] font-bold uppercase">{isAr ? "الرسوم" : "Fees"}</span>
            <span className="text-emerald-400 font-black text-xs">{service.fees || (isAr ? "مجاني" : "Free")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
