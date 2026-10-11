
'use client';

import { FooterWaves } from '@/components/footer-waves';
import React, { useEffect, useState } from 'react';
import { useAdminSession } from '@/lib/admin-session';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/settings-store';
import { SiteConfig, FooterVariant } from '@/lib/types';
import { ExternalLink, Mail, Phone, MessageCircle, Globe, Headset, Facebook, Twitter, Youtube, Instagram, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHANNELS } from '@/lib/participation';
import { CONTACT, FOOTER_GROUPS, SITE_LAST_UPDATED } from '@/lib/footer-pages';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import PAGE_DATES from '@/lib/page-dates.json';

// Routes from the generated map (scripts/build-page-dates.js); "[id]" segments match any value.
// Exact routes are checked before dynamic ones.
const ROUTE_DATES = Object.entries(PAGE_DATES as Record<string, string>)
  .map(([route, date]) => ({ parts: route.split('/'), dynamic: route.includes('['), date }))
  .sort((a, b) => Number(a.dynamic) - Number(b.dynamic));

function routeDate(pathname: string) {
  const parts = pathname.replace(/\/$/, '').split('/');
  if (parts.length === 1) parts.push(''); // "/" → ["", ""]
  return ROUTE_DATES.find(r => r.parts.length === parts.length && r.parts.every((p, i) => p === parts[i] || /^\[.+\]$/.test(p)))?.date;
}

interface PortalFooterProps {
  siteConfig: SiteConfig | null;
  /** full = four columns (default); compact = one row; none = hidden */
  variant?: FooterVariant;
  /** When the page's own content changed (database pages, legal documents); defaults to the route's last change */
  lastUpdated?: string;
}

export function PortalFooter({ siteConfig, variant = 'full', lastUpdated: pageUpdated }: PortalFooterProps) {
  const pathname = usePathname() || '/';
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const adminExpires = useAdminSession(s => s.expiresAt);
  const isAdmin = mounted && adminExpires > Date.now();
  // Collapsed by default: essentials + section titles; a title expands the full footer
  const [expanded, setExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

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
  const updatedIso = pageUpdated || routeDate(pathname) || SITE_LAST_UPDATED;
  const lastUpdated = new Date(updatedIso).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

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
      <><FooterWaves /><footer className="bg-[#3b0a57] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <BrandLogo height={40} onDark />
            <SocialLinks isAr={isAr} size="sm" />
          </div>
          <nav aria-label={isAr ? 'روابط التذييل' : 'Footer links'} className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map(l => <Link key={l.id} href={l.link} className="text-sm font-bold text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded">{isAr ? l.labelAr : l.labelEn}</Link>)}
            <Link href="/staff" className="text-sm font-bold text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link>
          </nav>
          <p className="text-xs font-bold text-white/50">© {new Date().getFullYear()} {isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</p>
          <p className="text-xs font-bold text-accent">{isAr ? 'آخر تحديث لهذه الصفحة:' : 'This page was last updated:'} <time dateTime={updatedIso}>{lastUpdated}</time></p>
        </div>
      </footer></>
    );
  }

  const phone = siteConfig?.contactPhone || CONTACT.callCenter;
  const email = siteConfig?.contactEmail || CONTACT.infoEmail;
  const SECTIONS = [
    { id: 'contact', title: { ar: 'تواصل معنا', en: 'Contact us' } },
    ...groups.map(g => ({ id: g.id, title: g.title })),
  ];
  // Opening any title expands the whole footer and brings that section into view; the open title closes it
  const toggle = (id: string) => {
    if (expanded && openSection === id) { setExpanded(false); return; }
    setExpanded(true);
    setOpenSection(id);
    setTimeout(() => document.getElementById(`footer-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  };

  return (
    <><FooterWaves /><footer className="bg-[#3b0a57] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Always visible: the essentials */}
        <div className="py-7 flex flex-wrap items-center justify-between gap-6">
          <BrandLogo height={52} onDark />
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-white/80">
            <li><a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-white"><Phone size={15} className="text-accent" aria-hidden />{isAr ? 'مركز الاتصال' : 'Call centre'} <span dir="ltr">{phone}</span></a></li>
            <li><a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-white"><Mail size={15} className="text-accent" aria-hidden /><span dir="ltr">{email}</span></a></li>
            <li><a href={`https://wa.me/968${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white"><MessageCircle size={15} className="text-accent" aria-hidden /><span className="sr-only">{isAr ? 'واتساب' : 'WhatsApp'}</span><span dir="ltr">{CONTACT.whatsapp}</span></a></li>
          </ul>
          <SocialLinks isAr={isAr} size="sm" />
        </div>

        {/* Section titles: the arrow opens the full footer */}
        <div className="border-t border-white/10 py-3 flex flex-wrap gap-2" role="group" aria-label={isAr ? 'أقسام التذييل' : 'Footer sections'}>
          {SECTIONS.map(sec => {
            const open = expanded && openSection === sec.id;
            return (
              <button key={sec.id} type="button" onClick={() => toggle(sec.id)} aria-expanded={expanded} aria-controls="footer-details"
                className={cn('h-10 px-4 rounded-xl text-sm font-black flex items-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                  open ? 'bg-accent text-slate-900' : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white')}>
                {isAr ? sec.title.ar : sec.title.en}
                <ChevronDown size={16} className={cn('transition-transform', expanded && 'rotate-180')} aria-hidden />
              </button>
            );
          })}
        </div>

        {expanded && (
          <div id="footer-details" className="border-t border-white/10 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
            <section id="footer-contact" aria-labelledby="footer-contact-title" className={cn('space-y-4 rounded-2xl p-1 scroll-mt-24', openSection === 'contact' && 'ring-1 ring-accent/40 p-4')}>
              <h4 id="footer-contact-title" className="text-accent text-xs font-black uppercase tracking-widest">{isAr ? 'تواصل معنا' : 'Contact us'}</h4>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                {isAr ? 'نعمل بجد لتطوير محافظة ظفار وتقديم أفضل الخدمات الرقمية التي تساهم في تحسين جودة الحياة للمواطنين والمقيمين.' : 'We work to develop Dhofar and offer the best digital services to improve quality of life for citizens and residents.'}
              </p>
              <address className="not-italic space-y-3 text-sm font-bold text-white/80">
                <a href={`mailto:${CONTACT.itsEmail}`} className="flex items-center gap-3 hover:text-white"><Headset size={16} className="text-accent" aria-hidden />{isAr ? 'الدعم الفني' : 'Technical support'} <span dir="ltr">{CONTACT.itsEmail}</span></a>
                <a href={`https://${CONTACT.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white"><Globe size={16} className="text-accent" aria-hidden /><span dir="ltr">{CONTACT.website}</span><span className="sr-only">{isAr ? '(يفتح في نافذة جديدة)' : '(opens in a new tab)'}</span></a>
              </address>
              <p className="text-[10px] text-accent font-black tracking-widest uppercase">{isAr ? 'حكومة سلطنة عمان' : 'OMAN GOVERNMENT'}</p>
            </section>

            {groups.map(g => (
              <nav key={g.id} id={`footer-${g.id}`} aria-labelledby={`footer-${g.id}-title`} className={cn('flex flex-col gap-5 rounded-2xl p-1 scroll-mt-24', openSection === g.id && 'ring-1 ring-accent/40 p-4')}>
                <h4 id={`footer-${g.id}-title`} className="text-accent text-xs font-black uppercase tracking-widest">{isAr ? g.title.ar : g.title.en}</h4>
                <ul className="flex flex-col gap-3">
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
                      <li className="mt-3"><Link href="/staff" className="text-sm font-black text-white bg-white/10 inline-block px-4 py-2 rounded-lg hover:bg-white/15">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link></li>
                      {isAdmin && <li><Link href="/edmPortal" className="text-sm font-black text-accent bg-white/5 inline-block px-4 py-2 rounded-lg hover:bg-white/10">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link></li>}
                    </>
                  )}
                </ul>
              </nav>
            ))}
          </div>
        )}

        <div className="border-t border-white/10 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-white/50 text-xs font-bold">
          <p>{isAr ? `© ${new Date().getFullYear()} بلدية ظفار - جميع الحقوق محفوظة` : `© ${new Date().getFullYear()} Dhofar Municipality - All Rights Reserved`}</p>
          <p className="text-accent">{isAr ? 'آخر تحديث لهذه الصفحة:' : 'This page was last updated:'} <time dateTime={updatedIso}>{lastUpdated}</time></p>
          <p>{isAr ? 'سلطنة عمان - محافظة ظفار' : 'Sultanate of Oman - Dhofar Governorate'}</p>
        </div>
      </div>
    </footer></>
  );
}

const SOCIAL_ICON: Record<string, React.ElementType> = { facebook: Facebook, x: Twitter, youtube: Youtube, instagram: Instagram, whatsapp: MessageCircle };

/** The municipality's official social media accounts */
function SocialLinks({ isAr, size = 'md' }: { isAr: boolean; size?: 'sm' | 'md' }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={isAr ? 'حسابات البلدية في وسائل التواصل' : 'Social media'}>
      {CHANNELS.map(c => {
        const Icon = SOCIAL_ICON[c.id] || MessageCircle;
        return (
          <li key={c.id}>
            <a href={c.href} target="_blank" rel="noopener noreferrer" title={isAr ? c.name.ar : c.name.en}
              className={size === 'sm' ? 'size-8 rounded-lg bg-white/10 hover:bg-accent hover:text-slate-900 flex items-center justify-center transition-colors' : 'size-10 rounded-xl bg-white/10 hover:bg-accent hover:text-slate-900 flex items-center justify-center transition-colors'}>
              <Icon size={size === 'sm' ? 15 : 18} aria-hidden />
              <span className="sr-only">{isAr ? c.name.ar : c.name.en}{isAr ? ' (يفتح في نافذة جديدة)' : ' (opens in a new tab)'}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
