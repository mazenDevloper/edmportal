'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpLeft, ArrowUpRight, ExternalLink, FileText, Folder } from 'lucide-react';
import { InfoPageShell, useLang } from '@/components/legal/info-page';
import { fetchBin } from '@/lib/jsonbin';
import { Bi, FOOTER_GROUPS, SITE_LAST_UPDATED } from '@/lib/footer-pages';
import { CustomPage, Service } from '@/lib/types';
import { isPublicService } from '@/lib/service-visibility';

type Entry = { href: string; label: Bi; external?: boolean };

const MAIN: Entry[] = [
  { href: '/', label: { ar: 'الرئيسية', en: 'Home' } },
  { href: '/catalog', label: { ar: 'دليل الخدمات', en: 'Service catalogue' } },
  { href: '/staff', label: { ar: 'بوابة الموظف', en: 'Staff portal' } },
  { href: '/identity', label: { ar: 'دليل الهوية البصرية', en: 'Visual identity guide' } },
];

export default function SitemapPage() {
  const { isAr, t, tt } = useLang();
  const [services, setServices] = useState<Service[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const Arrow = isAr ? ArrowUpLeft : ArrowUpRight;

  useEffect(() => {
    fetchBin().then(db => {
      setServices((db.services || []).filter(isPublicService));
      setPages((db.customPages || []).filter((p: CustomPage) => p.status !== 'draft'));
    }).catch(() => {});
  }, []);

  const groups: { id: string; title: Bi; entries: Entry[] }[] = [
    { id: 'main', title: { ar: 'الصفحات الرئيسية', en: 'Main pages' }, entries: MAIN },
    ...FOOTER_GROUPS.map(g => ({ id: g.id, title: g.title, entries: g.links })),
    ...(pages.length ? [{ id: 'pages', title: { ar: 'صفحات المحتوى', en: 'Content pages' }, entries: pages.map(p => ({ href: `/p/${p.slug}`, label: { ar: p.titleAr, en: p.titleEn || p.titleAr } })) }] : []),
    ...(services.length ? [{ id: 'services', title: { ar: 'الخدمات الإلكترونية', en: 'E-services' }, entries: services.map(s => {
      const external = s.type === 'link' && !!s.linkUrl;
      return { href: external ? s.linkUrl! : `/services/${s.id}`, label: { ar: s.title, en: s.titleEn || s.title }, external };
    }) }] : []),
  ];

  return (
    <InfoPageShell icon="Network" updated={SITE_LAST_UPDATED}
      title={{ ar: 'خريطة الموقع', en: 'Sitemap' }}
      intro={{ ar: 'جميع صفحات البوابة وخدماتها في مكان واحد.', en: 'Every page and service of the portal in one place.' }}
      toc={groups.map(g => ({ id: `sm-${g.id}`, title: g.title }))}>
      <div className="space-y-6">
        {groups.map(g => (
          <section key={g.id} id={`sm-${g.id}`} aria-labelledby={`sm-${g.id}-h`} className="scroll-mt-28 bg-white rounded-3xl ring-1 ring-slate-200/70 shadow-sm p-6 md:p-8">
            <h2 id={`sm-${g.id}-h`} className="flex items-center gap-2 text-xl font-black text-slate-900 mb-4">
              <Folder size={20} className="text-[#008E91]" aria-hidden />{t(g.title)}
              <span className="text-xs font-black text-slate-400 tabular-nums">({g.entries.length})</span>
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {g.entries.map(e => (
                <li key={e.href + t(e.label)}>
                  <Link href={e.href} target={e.external ? '_blank' : undefined} rel={e.external ? 'noopener noreferrer' : undefined}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008E91]">
                    <FileText size={16} className="shrink-0 text-slate-400 group-hover:text-[#008E91]" aria-hidden />
                    <span className="flex-1 font-bold text-slate-700 group-hover:text-slate-900">{t(e.label)}</span>
                    {e.external ? <ExternalLink size={14} className="text-slate-400" aria-label={tt('رابط خارجي', 'External link')} /> : <Arrow size={14} className="text-slate-300 group-hover:text-[#008E91]" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </InfoPageShell>
  );
}
