'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchBin } from '@/lib/jsonbin';
import { CustomPage, MenuItem, PageTemplateSettings, SiteConfig } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { PageShell } from '@/components/blocks/page-shell';
import { useSettingsStore } from '@/lib/settings-store';
import { Loader2 } from 'lucide-react';

export default function DynamicCustomPage() {
  const { slug } = useParams();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [page, setPage] = useState<CustomPage | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data) {
        // Drafts are only visible in the page builder
        const found = (data.customPages || []).find((p: CustomPage) => p.slug === slug && p.status !== 'draft');
        setPage(found || null);
        setSiteConfig(data.siteConfig || null);
        setMenuItems(data.menuItems || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (page) document.title = `${isAr ? page.titleAr : page.titleEn || page.titleAr} | ${isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}`;
  }, [page, isAr]);

  if (loading) return <div className="h-screen flex items-center justify-center" role="status" aria-label={isAr ? 'جارٍ التحميل' : 'Loading'}><Loader2 className="animate-spin text-primary" /></div>;

  if (!page) return (
    <div className="min-h-screen flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
        <h1 className="text-6xl font-black text-primary">404</h1>
        <p className="font-bold text-slate-500">{isAr ? 'الصفحة غير موجودة' : 'Page not found'}</p>
        <Link href="/" className="font-black text-secondary underline">{isAr ? 'العودة للرئيسية' : 'Back to home'}</Link>
      </main>
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );

  const template: PageTemplateSettings = { ...(siteConfig?.template || {}), ...(page.template || {}) };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} variant={template.header} showTicker={template.showTicker} showTopBar={template.showTopBar} sticky={template.stickyHeader ?? true} />
      <PageShell page={page} template={template} isAr={isAr} />
      <PortalFooter siteConfig={siteConfig} variant={template.footer} />
    </div>
  );
}
