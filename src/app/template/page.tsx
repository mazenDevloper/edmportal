
'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, LayoutDashboard, Languages } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem } from '@/lib/types';

const ImmersionCanvas = dynamic(
  () => import('@/components/immersion-canvas'),
  { ssr: false }
);

export default function ImmersionTemplatePage() {
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchBin().then(data => {
      if (data) setMenuItems(data.menuItems || []);
    });
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Immersive Branding Bar */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between bg-black/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 text-white shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={40} height={40} className="object-contain brightness-0 invert" />
             <div className="flex flex-col">
               <span className="text-lg font-black leading-tight text-accent">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">{isAr ? 'المساحة الذكية الغامرة' : 'Spatial Immersive Workspace'}</span>
             </div>
          </Link>
          <div className="h-6 w-px bg-white/10 hidden md:block" />
          <nav className="hidden md:flex items-center gap-4">
             {menuItems.map(item => (
               <Link key={item.id} href={item.link} className="text-[10px] font-bold text-white/60 hover:text-accent uppercase tracking-widest">
                 {isAr ? item.labelAr : item.labelEn}
               </Link>
             ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(isAr ? 'en' : 'ar')}
            className="text-white hover:bg-white/10 rounded-full h-10 px-4 font-bold gap-2"
          >
            <Languages size={14} />
            {isAr ? 'EN' : 'العربية'}
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-full h-10 px-6 font-bold gap-2" asChild>
            <Link href="/admin">
              <LayoutDashboard size={14} />
              {isAr ? 'التحكم' : 'Admin'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full border-accent text-accent hover:bg-accent hover:text-slate-900 font-black h-10 px-6" asChild>
            <Link href="/">
              <ArrowLeft className={cn("size-4", isAr ? "rotate-180" : "")} />
              <span className="ml-2">{isAr ? 'العودة' : 'Exit'}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary 3D Workspace Environment */}
      <div className="w-full h-full">
        <ImmersionCanvas />
      </div>
      
      {/* Immersive Footer Branding */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity">
        <div className="text-right">
          <p className="text-[10px] font-black text-white">{isAr ? 'حكومة سلطنة عمان' : 'Oman Government'}</p>
          <p className="text-[8px] text-accent font-bold">Spatial Portal V1.0</p>
        </div>
        <Globe size={24} className="text-white" />
      </div>
    </div>
  );
}
