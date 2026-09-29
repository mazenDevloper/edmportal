
'use client';

import React, { useEffect, useState } from 'react';
import { useAdminSession } from '@/lib/admin-session';
import Link from 'next/link';
import Image from 'next/image';
import { useSettingsStore } from '@/lib/settings-store';
import { SiteConfig, FooterVariant } from '@/lib/types';
import { ExternalLink, Mail, Phone, MessageCircle } from 'lucide-react';
import { CONTACT, FOOTER_GROUPS, SITE_LAST_UPDATED } from '@/lib/footer-pages';

interface PortalFooterProps {
  siteConfig: SiteConfig | null;
  /** full = four columns (default); compact = one row; none = hidden */
  variant?: FooterVariant;
}

export function PortalFooter({ siteConfig, variant = 'full' }: PortalFooterProps) {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const adminExpires = useAdminSession(s => s.expiresAt);
  const isAdmin = mounted && adminExpires > Date.now();

  // The standard footer pages always show; links added in the database are appended to their group
  const dbLinks = siteConfig?.footerLinks || [];
  const known = new Set(FOOTER_GROUPS.flatMap(g => g.links.map(l => l.href)));
  const groups = FOOTER_GROUPS.map(g => ({
    ...g,
    links: [
      ...g.links.map(l => ({ id: l.href, labelAr: l.label.ar, labelEn: l.label.en, link: l.href })),
      ...dbLinks.filter(l => l.category === g.id && !known.has(l.link) && !known.has(l.link.replace(/^\/p\//, '/'))),
    ],
  }));
  const lastUpdated = new Date(SITE_LAST_UPDATED).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (variant === 'none') return null;

  if (variant === 'compact') {
    const links = [
      { id: 'terms', labelAr: 'الشروط والأحكام', labelEn: 'Terms', link: '/terms' },
      { id: 'privacy', labelAr: 'الخصوصية', labelEn: 'Privacy', link: '/privacy' },
      { id: 'faqs', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQs', link: '/faqs' },
      { id: 'a11y', labelAr: 'بيان النفاذ الرقمي', labelEn: 'Accessibility statement', link: '/accessibility-statement' },
      { id: 'sitemap', labelAr: 'خريطة الموقع', labelEn: 'Sitemap', link: '/sitemap' },
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
                 <span className="text-sm font-bold">{siteConfig?.contactEmail || CONTACT.infoEmail}</span>
               </div>
               <a href={`https://wa.me/968${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/80 hover:text-white">
                 <MessageCircle size={16} className="text-accent" aria-hidden />
                 <span className="text-sm font-bold" dir="ltr">{CONTACT.whatsapp}</span>
                 <span className="sr-only">{isAr ? 'واتساب' : 'WhatsApp'}</span>
               </a>
             </div>
          </div>
          
          {groups.map(g => (
            <nav key={g.id} aria-labelledby={`footer-${g.id}`} className="flex flex-col gap-6">
              <h4 id={`footer-${g.id}`} className="text-accent text-xs font-black uppercase tracking-widest">{isAr ? g.title.ar : g.title.en}</h4>
              <ul className="flex flex-col gap-4">
                {g.links.map(l => {
                  const external = l.link.startsWith('http');
                  return (
                    <li key={l.id}>
                      <Link href={l.link} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
                        className="text-sm font-bold text-white/70 hover:text-white transition-colors inline-flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                        {isAr ? l.labelAr : l.labelEn}
                        {external && <ExternalLink size={12} aria-label={isAr ? 'رابط خارجي' : 'External link'} />}
                      </Link>
                    </li>
                  );
                })}
                {g.id === 'important' && (
                  <>
                    <li className="mt-4"><Link href="/staff" className="text-sm font-black text-white bg-white/10 inline-block px-4 py-2 rounded-lg hover:bg-white/15">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link></li>
                    {isAdmin && <li><Link href="/edmPortal" className="text-sm font-black text-accent bg-white/5 inline-block px-4 py-2 rounded-lg hover:bg-white/10">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link></li>}
                  </>
                )}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-white/50 text-xs font-bold">
          <p>{isAr ? `© ${new Date().getFullYear()} بلدية ظفار - جميع الحقوق محفوظة` : `© ${new Date().getFullYear()} Dhofar Municipality - All Rights Reserved`}</p>
          <p className="text-accent">{isAr ? 'آخر تعديل:' : 'Last updated:'} <time dateTime={SITE_LAST_UPDATED}>{lastUpdated}</time></p>
          <p>{isAr ? 'سلطنة عمان - محافظة ظفار' : 'Sultanate of Oman - Dhofar Governorate'}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-80 dm-wave-5 opacity-10 pointer-events-none" />
    </footer>
  );
}
