'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { SiteConfig } from '@/lib/types';

interface PortalFooterProps {
  siteConfig: SiteConfig | null;
}

export function PortalFooter({ siteConfig }: PortalFooterProps) {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <footer className="bg-slate-950 text-white py-20 px-6 relative overflow-hidden border-t-8 border-accent">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16 relative z-10">
        <div className="space-y-6">
           <div className="flex items-center gap-4">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={60} height={60} className="brightness-0 invert" />
             <div className="flex flex-col">
               <span className="text-2xl font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] text-accent font-black tracking-widest uppercase">{isAr ? 'حكومة سلطنة عمان' : 'OMAN GOVERNMENT'}</span>
             </div>
           </div>
           <p className="text-sm text-white/40 leading-relaxed font-medium">
             {isAr ? "نعمل بجد لتطوير محافظة ظفار وتقديم أفضل الخدمات الرقمية." : "We work diligently to develop Dhofar Governorate and provide the best digital services."}
           </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-accent text-xs font-black uppercase tracking-widest mb-2">{isAr ? "تواصل مباشر" : "Contact"}</h4>
          <div className="flex items-center gap-6">
            <span className="text-5xl font-black text-white">{siteConfig?.contactPhone || '1771'}</span>
            <div className="h-12 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/50">{isAr ? "البريد الإلكتروني" : "Email"}</span>
              <span className="text-sm font-black">{siteConfig?.contactEmail || 'care@dm.gov.om'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
           <h4 className="text-accent text-xs font-black uppercase tracking-widest mb-2">{isAr ? "روابط سريعة" : "Quick Links"}</h4>
           <div className="grid grid-cols-2 gap-4">
              <Link href="/template" className="text-sm font-bold text-white/60 hover:text-white">{isAr ? 'المساحة الذكية' : 'Spatial Workspace'}</Link>
              <Link href="/admin" className="text-sm font-bold text-white/60 hover:text-white">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
              <Link href="/" className="text-sm font-bold text-white/60 hover:text-white">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
              <Link href="/" className="text-sm font-bold text-white/60 hover:text-white">{isAr ? 'الشروط' : 'Terms'}</Link>
           </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-40 dm-wave-5 opacity-10 pointer-events-none" />
    </footer>
  );
}
