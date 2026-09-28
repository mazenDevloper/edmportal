
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettingsStore } from '@/lib/settings-store';
import { SiteConfig, FooterVariant } from '@/lib/types';
import { ExternalLink, Mail, Phone, MapPin } from 'lucide-react';

interface PortalFooterProps {
  siteConfig: SiteConfig | null;
  /** full = four columns (default); compact = one row; none = hidden */
  variant?: FooterVariant;
}

export function PortalFooter({ siteConfig, variant = 'full' }: PortalFooterProps) {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const footerLinks = siteConfig?.footerLinks || [];

  const legalLinks = footerLinks.filter(l => l.category === 'legal');
  const serviceLinks = footerLinks.filter(l => l.category === 'services');
  const importantLinks = footerLinks.filter(l => l.category === 'important');

  if (variant === 'none') return null;

  if (variant === 'compact') {
    const links = footerLinks.length ? footerLinks : [
      { id: 'terms', labelAr: 'الشروط والأحكام', labelEn: 'Terms', link: '/p/terms' },
      { id: 'privacy', labelAr: 'الخصوصية', labelEn: 'Privacy', link: '/privacy' },
      { id: 'a11y', labelAr: 'بيان النفاذ الرقمي', labelEn: 'Accessibility statement', link: '/accessibility-statement' },
    ];
    return (
      <footer className="bg-slate-950 text-white border-t-4 border-accent">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="" width={36} height={36} className="brightness-0 invert" />
            <span className="font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
          </div>
          <nav aria-label={isAr ? 'روابط التذييل' : 'Footer links'} className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map(l => <Link key={l.id} href={l.link} className="text-sm font-bold text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded">{isAr ? l.labelAr : l.labelEn}</Link>)}
            <Link href="/staff" className="text-sm font-bold text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link>
          </nav>
          <p className="text-xs font-bold text-white/50">© {new Date().getFullYear()} {isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-950 text-white py-24 px-6 relative overflow-hidden border-t-8 border-accent">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-8">
             <div className="flex items-center gap-4">
               <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={60} height={60} className="brightness-0 invert" />
               <div className="flex flex-col">
                 <span className="text-2xl font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
                 <span className="text-[10px] text-accent font-black tracking-widest uppercase">{isAr ? 'حكومة سلطنة عمان' : 'OMAN GOVERNMENT'}</span>
               </div>
             </div>
             <p className="text-sm text-white/70 leading-relaxed font-medium max-w-xs">
               {isAr ? "نعمل بجد لتطوير محافظة ظفار وتقديم أفضل الخدمات الرقمية التي تساهم في تحسين جودة الحياة للمواطنين والمقيمين." : "Working diligently to develop Dhofar Governorate and provide best-in-class digital services."}
             </p>
             <div className="space-y-4">
               <div className="flex items-center gap-3 text-white/80">
                 <Phone size={16} className="text-accent" />
                 <span className="text-sm font-bold">{siteConfig?.contactPhone || '1771'}</span>
               </div>
               <div className="flex items-center gap-3 text-white/80">
                 <Mail size={16} className="text-accent" />
                 <span className="text-sm font-bold">{siteConfig?.contactEmail || 'care@dm.gov.om'}</span>
               </div>
             </div>
          </div>
          
          {/* Dynamic Footer Sections */}
          <div className="flex flex-col gap-6">
            <h4 className="text-accent text-xs font-black uppercase tracking-widest">{isAr ? "المعلومات القانونية" : "Legal Information"}</h4>
            <div className="flex flex-col gap-4">
              {legalLinks.length > 0 ? legalLinks.map(l => (
                <Link key={l.id} href={l.link} className="text-sm font-bold text-white/70 hover:text-white transition-colors">
                  {isAr ? l.labelAr : l.labelEn}
                </Link>
              )) : (
                <>
                  <Link href="/p/terms" className="text-sm font-bold text-white/70 hover:text-white transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link>
                  <Link href="/p/privacy" className="text-sm font-bold text-white/70 hover:text-white transition-colors">{isAr ? 'السياسة والخصوصية' : 'Privacy Policy'}</Link>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-accent text-xs font-black uppercase tracking-widest">{isAr ? "سياسات الخدمة" : "Service Standards"}</h4>
            <div className="flex flex-col gap-4">
              {serviceLinks.length > 0 ? serviceLinks.map(l => (
                <Link key={l.id} href={l.link} className="text-sm font-bold text-white/70 hover:text-white transition-colors">
                  {isAr ? l.labelAr : l.labelEn}
                </Link>
              )) : (
                <>
                  <Link href="/p/faqs" className="text-sm font-bold text-white/70 hover:text-white transition-colors">{isAr ? 'الأسئلة الشائعة (FAQs)' : 'FAQs'}</Link>
                  <Link href="/p/sla" className="text-sm font-bold text-white/70 hover:text-white transition-colors">{isAr ? 'اتفاقية مستوى الخدمة' : 'Service Level Agreement'}</Link>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-accent text-xs font-black uppercase tracking-widest">{isAr ? "روابط هامة" : "Important Links"}</h4>
            <div className="flex flex-col gap-4">
              {importantLinks.length > 0 ? importantLinks.map(l => (
                <Link key={l.id} href={l.link} className="text-sm font-bold text-white/70 hover:text-white transition-colors flex items-center gap-2">
                  {isAr ? l.labelAr : l.labelEn}
                  {l.link.startsWith('http') && <ExternalLink size={12} />}
                </Link>
              )) : (
                <>
                  <Link href="/p/governor-portal" className="text-sm font-bold text-white/70 hover:text-white transition-colors">{isAr ? 'بوابة محافظ ظفار' : 'Dhofar Governor Portal'}</Link>
                  <Link href="https://www.tajawoob.gov.om" className="text-sm font-bold text-white/70 hover:text-white transition-colors">{isAr ? 'منصة تجاوب' : 'Tajawoob Platform'}</Link>
                </>
              )}
              <Link href="/staff" className="text-sm font-black text-white bg-white/10 w-fit px-4 py-2 rounded-lg hover:bg-white/15 mt-4">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link>
              <Link href="/admin" className="text-sm font-black text-accent bg-white/5 w-fit px-4 py-2 rounded-lg hover:bg-white/10">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          <p>{isAr ? `© ${new Date().getFullYear()} بلدية ظفار - جميع الحقوق محفوظة` : `© ${new Date().getFullYear()} Dhofar Municipality - All Rights Reserved`}</p>
          <p>{isAr ? 'سلطنة عمان - محافظة ظفار' : 'Sultanate of Oman - Dhofar Governorate'}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-80 dm-wave-5 opacity-10 pointer-events-none" />
    </footer>
  );
}
