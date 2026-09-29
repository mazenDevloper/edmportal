'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Facebook, Globe, Instagram, Loader2, PlayCircle, Twitter, Youtube } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { FeedItem, FeedResult } from '@/lib/social-feed';
import { CHANNELS } from '@/lib/participation';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'youtube' | 'website' | 'facebook' | 'x' | 'instagram';

const channel = (id: string) => CHANNELS.find(c => c.id === id)!;
const SOURCE_META: Record<FeedItem['source'], { ar: string; en: string; icon: React.ElementType; tone: string }> = {
  youtube: { ar: 'يوتيوب', en: 'YouTube', icon: Youtube, tone: 'bg-[#FF0000]' },
  website: { ar: 'الموقع الرسمي', en: 'Website', icon: Globe, tone: 'bg-[#005751]' },
  instagram: { ar: 'إنستغرام', en: 'Instagram', icon: Instagram, tone: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]' },
};

/** "From the municipality's platforms": YouTube videos, website news, and the Facebook page on request */
export function SocialFeedSection({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [feed, setFeed] = useState<FeedResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [limit, setLimit] = useState(8);
  const [playing, setPlaying] = useState<FeedItem | null>(null);
  const [fbLoaded, setFbLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/social-feed').then(r => (r.ok ? r.json() : Promise.reject())).then(setFeed).catch(() => setFailed(true));
  }, []);
  useEffect(() => { setLimit(8); }, [tab]);

  const hasInstagram = feed?.sources.instagram === 'ok';
  const TABS: { id: Tab; ar: string; en: string; icon?: React.ElementType }[] = [
    { id: 'all', ar: 'الكل', en: 'All' },
    { id: 'youtube', ar: 'يوتيوب', en: 'YouTube', icon: Youtube },
    { id: 'website', ar: 'الموقع الرسمي', en: 'Website', icon: Globe },
    { id: 'facebook', ar: 'فيسبوك', en: 'Facebook', icon: Facebook },
    { id: 'x', ar: 'إكس', en: 'X', icon: Twitter },
    { id: 'instagram', ar: 'إنستغرام', en: 'Instagram', icon: Instagram },
  ];
  const items = (feed?.items || []).filter(i => tab === 'all' || i.source === tab);
  const date = (iso: string) => new Date(iso).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section aria-labelledby="social-title" className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="social-title" className="text-2xl md:text-3xl font-black text-slate-900">{t('من منصات البلدية', 'From our channels')}</h2>
            <p className="text-sm font-bold text-slate-500">{t('آخر ما نشرته بلدية ظفار على قنواتها الرسمية', 'The latest from Dhofar Municipality’s official channels')}</p>
          </div>
          <div role="tablist" aria-label={t('المنصة', 'Platform')} className="flex flex-wrap gap-1.5">
            {TABS.map(x => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}
                className={cn('h-9 px-3 rounded-full text-xs font-black flex items-center gap-1.5 ring-1 transition-colors', tab === x.id ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-400')}>
                {x.icon && <x.icon size={13} aria-hidden />}{isAr ? x.ar : x.en}
              </button>
            ))}
          </div>
        </div>

        <div role="tabpanel" aria-live="polite">
          {tab === 'facebook' ? (
            <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-6 flex flex-col items-center gap-4">
              {fbLoaded ? (
                <iframe title={t('صفحة بلدية ظفار على فيسبوك', 'Dhofar Municipality on Facebook')} className="w-full max-w-[500px] h-[640px] rounded-2xl bg-white"
                  src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(channel('facebook').href)}&tabs=timeline&width=500&height=640&small_header=false&adapt_container_width=true&hide_cover=false&locale=${isAr ? 'ar_AR' : 'en_US'}`}
                  loading="lazy" allow="encrypted-media" />
              ) : (
                <>
                  <Facebook size={36} className="text-[#1877F2]" aria-hidden />
                  <p className="max-w-lg text-center text-sm font-bold text-slate-600">{t('تُعرض منشورات فيسبوك عبر أداة فيسبوك الرسمية، وقد تضع فيسبوك ملفات تعريف ارتباط عند عرضها.', 'Facebook posts are shown with Facebook’s own widget, which may set Facebook cookies.')}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => setFbLoaded(true)} className="h-11 px-5 rounded-xl bg-[#1877F2] text-white font-black">{t('عرض منشورات فيسبوك', 'Show Facebook posts')}</button>
                    <FollowLink id="facebook" isAr={isAr} />
                  </div>
                </>
              )}
            </div>
          ) : tab === 'x' || (tab === 'instagram' && !hasInstagram) ? (
            <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-8 flex flex-col items-center gap-3 text-center">
              {tab === 'x' ? <Twitter size={34} aria-hidden /> : <Instagram size={34} className="text-[#dd2a7b]" aria-hidden />}
              <p className="max-w-lg text-sm font-bold text-slate-600">
                {tab === 'x'
                  ? t('لا تتيح منصة إكس عرض المنشورات في المواقع الأخرى دون اشتراك مدفوع في واجهتها البرمجية، لذلك تابع البلدية مباشرة على إكس.', 'X no longer lets other sites show posts without its paid API, so follow the municipality on X directly.')
                  : t('يتطلب عرض منشورات إنستغرام ربط حساب البلدية بواجهة إنستغرام الرسمية، ويمكنك متابعة الحساب مباشرة.', 'Showing Instagram posts needs the municipality’s account connected to the official Instagram API; you can follow the account directly.')}
              </p>
              <FollowLink id={tab === 'x' ? 'x' : 'instagram'} isAr={isAr} />
            </div>
          ) : failed ? (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900">{t('تعذّر جلب آخر المنشورات حالياً.', 'Could not load the latest posts right now.')}</p>
          ) : !feed ? (
            <p role="status" className="flex items-center justify-center gap-2 py-12 font-bold text-slate-400"><Loader2 className="animate-spin" size={18} aria-hidden />{t('جارٍ جلب آخر المنشورات…', 'Loading the latest posts…')}</p>
          ) : !items.length ? (
            <p className="py-12 text-center font-bold text-slate-400">{t('لا توجد منشورات', 'No posts')}</p>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.slice(0, limit).map(i => {
                  const meta = SOURCE_META[i.source];
                  const body = (
                    <>
                      <div className="relative aspect-video bg-gradient-to-br from-[#005751] to-[#470D67] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {i.image && <img src={i.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        {i.videoId && <PlayCircle size={46} className="absolute inset-0 m-auto text-white drop-shadow-lg" aria-hidden />}
                        <span className={cn('absolute top-2 start-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black text-white', meta.tone)}><meta.icon size={11} aria-hidden />{isAr ? meta.ar : meta.en}</span>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-400">{date(i.date)}{i.category ? ` · ${i.category}` : ''}</p>
                        <p className="font-black text-slate-800 leading-snug line-clamp-3">{i.title}</p>
                      </div>
                    </>
                  );
                  return (
                    <li key={i.id}>
                      {i.videoId ? (
                        <button type="button" onClick={() => setPlaying(i)} className="group w-full h-full text-start rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden hover:ring-[#008E91] hover:shadow-lg transition-shadow">
                          {body}<span className="sr-only">{t('تشغيل الفيديو', 'Play video')}</span>
                        </button>
                      ) : (
                        <a href={i.url} target="_blank" rel="noopener noreferrer" className="group block h-full rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden hover:ring-[#008E91] hover:shadow-lg transition-shadow">
                          {body}<span className="sr-only">{t('(يفتح في نافذة جديدة)', '(opens in a new tab)')}</span>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {items.length > limit && <button type="button" onClick={() => setLimit(l => l + 8)} className="h-11 px-6 rounded-xl bg-slate-900 text-white font-black">{t('عرض المزيد', 'Show more')}</button>}
                {(tab === 'youtube' || tab === 'all') && <FollowLink id="youtube" isAr={isAr} />}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!playing} onOpenChange={o => !o && setPlaying(null)}>
        <DialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <DialogTitle className="sr-only">{playing?.title}</DialogTitle>
          {playing?.videoId && (
            <div className="aspect-video">
              <iframe src={`https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1&rel=0&modestbranding=1`} title={playing.title} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FollowLink({ id, isAr }: { id: string; isAr: boolean }) {
  const c = channel(id);
  return (
    <a href={c.href} target="_blank" rel="noopener noreferrer" className="h-11 px-5 rounded-xl ring-2 ring-slate-200 font-black text-slate-700 inline-flex items-center gap-2 hover:ring-slate-400">
      {isAr ? `تابعنا على ${c.name.ar}` : `Follow us on ${c.name.en}`}<ExternalLink size={14} aria-hidden /><span className="sr-only">{isAr ? '(يفتح في نافذة جديدة)' : '(opens in a new tab)'}</span>
    </a>
  );
}
