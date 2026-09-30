'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight, ExternalLink, Eye, Facebook, FileSpreadsheet, FileText, Instagram, Lightbulb, Megaphone,
  MessageCircle, MessagesSquare, Twitter, Users, Vote, Youtube,
} from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig, Survey } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { AXES, CHANNELS, GOALS, PARTICIPATION_BANNER, PARTICIPATION_SURVEY_ID, PRINCIPLES, REPORTS, STEPS } from '@/lib/participation';
import { EXTERNAL_LINKS } from '@/lib/footer-pages';
import { surveyWindow } from '@/components/survey/survey-form';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ParticipationSurveyPopup } from '@/components/participation/participation-survey-popup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'goals', ar: 'الأهداف والمبادئ', en: 'Goals & principles' },
  { id: 'axes', ar: 'محاور المشاركة الرقمية', en: 'Participation areas' },
  { id: 'steps', ar: 'خطوات المشاركة', en: 'How it works' },
  { id: 'channels', ar: 'قنوات المشاركة', en: 'Channels' },
  { id: 'reports', ar: 'التقارير', en: 'Reports' },
] as const;

const PRINCIPLE_ICON = { inclusion: Users, engagement: MessagesSquare, transparency: Eye };
const CHANNEL_ICON: Record<string, React.ElementType> = { facebook: Facebook, x: Twitter, youtube: Youtube, instagram: Instagram, whatsapp: MessageCircle };
const CHANNEL_TONE: Record<string, string> = { facebook: 'bg-[#1877F2]', x: 'bg-slate-900', youtube: 'bg-[#FF0000]', instagram: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]', whatsapp: 'bg-[#25D366]' };

export default function ParticipationPage() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [polls, setPolls] = useState<Survey[]>([]);
  const [tab, setTab] = useState<string>('goals');
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBin().then(db => {
      setMenuItems(db.menuItems || []);
      setSiteConfig(db.siteConfig || null);
      // Other open surveys the public can take part in
      setPolls((db.surveys || []).filter((s: Survey) => s.id !== PARTICIPATION_SURVEY_ID && surveyWindow(s) === 'open'));
    }).catch(() => {});
  }, []);
  useEffect(() => { document.title = `${t('المشاركة الرقمية', 'Digital participation')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToReports = () => { setTab('reports'); document.getElementById('participation-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />

      <main id="main" className="flex-1">
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-12 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-black tracking-widest text-[#00a870]">{t('صوتك اليوم… قرارنا غداً', 'Your voice today… our decision tomorrow')}</p>
            <h1 className="text-3xl md:text-5xl font-black text-[#1b0f5c] leading-tight">{t('المشاركة الرقمية في بلدية ظفار', 'Digital participation at Dhofar Municipality')}</h1>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PARTICIPATION_BANNER} alt={t('المشاركة الرقمية في بلدية ظفار: صوتك اليوم… قرارنا غداً', 'Digital participation at Dhofar Municipality: your voice today, our decision tomorrow')}
            width={1080} height={346} className="w-full h-auto rounded-[2rem] shadow-xl" />

          {/* Quick actions */}
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <li>
              <button type="button" onClick={() => setSurveyOpen(true)} className="w-full h-full text-start rounded-3xl bg-gradient-to-br from-[#1b0f5c] to-[#470D67] text-white p-5 space-y-2 shadow-lg hover:shadow-xl transition-shadow">
                <Vote size={26} className="text-[#03CFCB]" aria-hidden />
                <p className="font-black text-lg">{t('شارك برأيك', 'Have your say')}</p>
                <p className="text-sm font-bold text-white/75">{t('اختر موضوع المشاركة القادم وأذكى فكرة بلدية', 'Pick the next topic and the smartest municipal idea')}</p>
              </button>
            </li>
            <li>
              <Link href="/tajawoob" className="block h-full rounded-3xl bg-white ring-1 ring-slate-200 p-5 space-y-2 hover:ring-[#008E91] transition-shadow">
                <Megaphone size={26} className="text-[#008E91]" aria-hidden />
                <p className="font-black text-lg text-slate-900">{t('منصة تجاوب', 'Tajawob')}</p>
                <p className="text-sm font-bold text-slate-500">{t('المقترحات والشكاوى والبلاغات عبر المنصة الوطنية', 'Suggestions, complaints and reports on the national platform')}</p>
              </Link>
            </li>
            <li>
              <button type="button" onClick={goToReports} className="w-full h-full text-start rounded-3xl bg-white ring-1 ring-slate-200 p-5 space-y-2 hover:ring-[#008E91]">
                <FileSpreadsheet size={26} className="text-[#008E91]" aria-hidden />
                <p className="font-black text-lg text-slate-900">{t('التقارير والنتائج', 'Reports & results')}</p>
                <p className="text-sm font-bold text-slate-500">{t('نتائج الاستبيانات والتقارير السنوية', 'Survey results and annual reports')}</p>
              </button>
            </li>
            <li>
              <Link href="/open-data/hub" className="block h-full rounded-3xl bg-white ring-1 ring-slate-200 p-5 space-y-2 hover:ring-[#008E91]">
                <Lightbulb size={26} className="text-[#008E91]" aria-hidden />
                <p className="font-black text-lg text-slate-900">{t('البيانات المفتوحة', 'Open data')}</p>
                <p className="text-sm font-bold text-slate-500">{t('بيانات التراخيص والعقود والإحصاءات', 'Licence, contract and statistics data')}</p>
              </Link>
            </li>
          </ul>

          {mounted && polls.length > 0 && (
            <div className="rounded-3xl bg-emerald-50 ring-1 ring-emerald-200 p-5 flex flex-wrap items-center gap-3">
              <p className="font-black text-emerald-900 me-auto">{t('استطلاعات مفتوحة الآن', 'Open surveys')}</p>
              {polls.map(p => (
                <Link key={p.id} href={`/survey/${p.id}`} className="h-10 px-4 rounded-xl bg-white ring-1 ring-emerald-200 text-sm font-black text-emerald-800 flex items-center gap-1.5 hover:ring-emerald-500">
                  {isAr ? p.titleAr : p.titleEn || p.titleAr}<ArrowUpRight size={14} className={cn(isAr && '-scale-x-100')} aria-hidden />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section id="participation-tabs" className="max-w-6xl mx-auto px-4 md:px-6 py-10 scroll-mt-24">
          <Tabs value={tab} onValueChange={setTab} dir={isAr ? 'rtl' : 'ltr'}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 p-1.5">
              {TABS.map(x => (
                <TabsTrigger key={x.id} value={x.id} className="shrink-0 rounded-xl px-4 py-2.5 font-black text-sm text-[#0d5968] data-[state=active]:bg-[#1b0f5c] data-[state=active]:text-white">{isAr ? x.ar : x.en}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="goals" className="mt-6 space-y-10">
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-6 md:p-8">
                <h2 className="text-2xl font-black text-[#00a870] mb-5">{t('الأهداف الرئيسية', 'Main goals')}</h2>
                <ol className="space-y-4">
                  {GOALS.map((g, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="size-9 shrink-0 rounded-full bg-[#0d5968] text-white font-black flex items-center justify-center">{i + 1}</span>
                      <p className="text-lg leading-relaxed text-[#0d5968]"><span className="font-black">{isAr ? g.lead.ar : g.lead.en}</span> {isAr ? g.text.ar : g.text.en}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#00a870] mb-5 text-center">{t('مبادئ المشاركة الرقمية – بلدية ظفار', 'Principles of digital participation')}</h2>
                <ul className="grid md:grid-cols-3 gap-4">
                  {PRINCIPLES.map(p => {
                    const Icon = PRINCIPLE_ICON[p.id];
                    return (
                      <li key={p.id} className="rounded-3xl bg-white ring-1 ring-slate-200 p-6 text-center space-y-3">
                        <span className="mx-auto size-16 rounded-2xl bg-[#085e58]/10 text-[#085e58] flex items-center justify-center"><Icon size={30} aria-hidden /></span>
                        <h3 className="font-black text-xl text-[#085e58]">{isAr ? p.name.ar : p.name.en} <span className="block text-sm font-bold text-slate-400" dir="ltr">{p.name.en}</span></h3>
                        <p className="font-medium text-slate-600 leading-relaxed">{isAr ? p.text.ar : p.text.en}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="axes" className="mt-6 space-y-8">
              {AXES.map(axis => (
                <section key={axis.id} aria-labelledby={`axis-${axis.id}`} className="rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden">
                  <h2 id={`axis-${axis.id}`} className="px-6 py-4 text-xl font-black text-[#1a6986] bg-slate-50 border-b">{isAr ? axis.title.ar : axis.title.en}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="text-start text-[#5f9ea0]">
                          <th scope="col" className="px-4 py-3 text-start w-10">#</th>
                          <th scope="col" className="px-4 py-3 text-start w-48">{t('النوع', 'Type')}</th>
                          <th scope="col" className="px-4 py-3 text-start">{t('الوصف', 'Description')}</th>
                          <th scope="col" className="px-4 py-3 text-start">{t('آلية التنفيذ في بلدية ظفار', 'How Dhofar Municipality does it')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {axis.rows.map((r, i) => (
                          <tr key={i} className="align-top">
                            <td className="px-4 py-4 font-black text-slate-400">{i + 1}</td>
                            <th scope="row" className="px-4 py-4 text-start font-black text-slate-800">{isAr ? r.type.ar : r.type.en}</th>
                            <td className="px-4 py-4 text-slate-600 leading-relaxed">{isAr ? r.desc.ar : r.desc.en}</td>
                            <td className="px-4 py-4 text-slate-600 leading-relaxed">{isAr ? r.how.ar : r.how.en}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </TabsContent>

            <TabsContent value="steps" className="mt-6">
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-6 md:p-8">
                <h2 className="text-2xl font-black text-[#00a870]">{t('خطوات عمل حملات المشاركة المجتمعية', 'How community engagement campaigns run')}</h2>
                <ol className="mt-6 grid gap-4 md:grid-cols-5">
                  {STEPS.map((s, i) => (
                    <li key={i} className="relative rounded-2xl bg-slate-50 p-4 space-y-2">
                      <span className="size-9 rounded-full bg-[#00a870] text-white font-black flex items-center justify-center">{i + 1}</span>
                      <h3 className="font-black text-slate-900">{isAr ? s.title.ar : s.title.en}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{isAr ? s.points[0].ar : s.points[0].en}</p>
                      {s.points.length > 1 && (
                        <ul className="list-disc ps-5 text-sm text-slate-600">
                          {s.points.slice(1).map((pt, j) => <li key={j}>{isAr ? pt.ar : pt.en}</li>)}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="channels" className="mt-6 space-y-4">
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHANNELS.map(c => {
                  const Icon = CHANNEL_ICON[c.id] || MessageCircle;
                  return (
                    <li key={c.id}>
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-3xl bg-white ring-1 ring-slate-200 p-4 hover:ring-[#008E91]">
                        <span className={cn('size-12 shrink-0 rounded-2xl text-white flex items-center justify-center', CHANNEL_TONE[c.id])}><Icon size={22} aria-hidden /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-black text-slate-900">{isAr ? c.name.ar : c.name.en}</span>
                          <span className="block text-sm font-bold text-slate-500 truncate" dir="ltr">{c.handle}</span>
                        </span>
                        <ExternalLink size={16} className="text-slate-400" aria-hidden /><span className="sr-only">{t('(يفتح في نافذة جديدة)', '(opens in a new tab)')}</span>
                      </a>
                    </li>
                  );
                })}
                <li>
                  <a href={EXTERNAL_LINKS.tajawob.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-3xl bg-[#005751] text-white p-4 hover:bg-[#005751]/90">
                    <span className="size-12 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center"><Megaphone size={22} aria-hidden /></span>
                    <span className="flex-1 min-w-0"><span className="block font-black">{t('منصة تجاوب', 'Tajawob')}</span><span className="block text-sm font-bold text-white/75">{t('المقترحات والشكاوى والبلاغات', 'Suggestions, complaints, reports')}</span></span>
                    <ExternalLink size={16} className="text-white/70" aria-hidden /><span className="sr-only">{t('(يفتح في نافذة جديدة)', '(opens in a new tab)')}</span>
                  </a>
                </li>
              </ul>
              <p className="text-sm font-bold text-slate-500">{t('ويمكنك أيضاً التواصل عبر مركز الاتصالات 1771.', 'You can also call the contact centre on 1771.')}</p>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <ul className="space-y-3">
                {REPORTS.map(r => (
                  <li key={r.href}>
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-3xl bg-white ring-1 ring-slate-200 p-5 hover:ring-[#008E91]">
                      <span className="size-12 shrink-0 rounded-2xl bg-[#0d5968]/10 text-[#0d5968] flex items-center justify-center">{r.kind === 'Excel' ? <FileSpreadsheet size={22} aria-hidden /> : <FileText size={22} aria-hidden />}</span>
                      <span className="flex-1 font-black text-slate-800">{isAr ? r.title.ar : r.title.en}</span>
                      <span className="text-xs font-black text-slate-400" dir="ltr">{r.kind}{r.size ? ` · ${r.size}` : ''}</span>
                      <ExternalLink size={16} className="text-slate-400" aria-hidden /><span className="sr-only">{t('(يفتح في نافذة جديدة)', '(opens in a new tab)')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <ParticipationSurveyPopup isAr={isAr} open={surveyOpen} onOpenChange={setSurveyOpen} />
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
