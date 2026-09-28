'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarClock, Loader2 } from 'lucide-react';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig, Survey } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { SurveyAnswers, SurveyForm, surveyWindow } from '@/components/survey/survey-form';
import { useSettingsStore } from '@/lib/settings-store';

export default function PublicSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBin().then(db => {
      setSurvey((db.surveys || []).find((s: Survey) => s.id === id) || null);
      setSiteConfig(db.siteConfig || null);
      setMenuItems(db.menuItems || []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (survey) document.title = `${isAr ? survey.titleAr : survey.titleEn || survey.titleAr} | ${t('بلدية ظفار', 'Dhofar Municipality')}`;
  }, [survey, isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (answers: SurveyAnswers) => {
    const db = await fetchBin();
    const response = { id: `resp_${Date.now().toString(36)}`, surveyId: id, submittedAt: new Date().toISOString(), answers };
    await updateBin({
      ...db,
      surveyResponses: [...(db.surveyResponses || []), response],
      surveys: (db.surveys || []).map((s: Survey) => (s.id === id ? { ...s, responsesCount: (s.responsesCount || 0) + 1 } : s)),
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-secondary" /></div>;

  const state = survey ? surveyWindow(survey) : 'inactive';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} variant="compact" showTicker={false} />
      <main id="main" className="flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 p-6 sm:p-10">
          {survey && state === 'open' ? (
            <SurveyForm survey={survey} isAr={isAr} onSubmit={submit} />
          ) : (
            <div className="text-center py-12 space-y-4">
              <CalendarClock size={40} className="mx-auto text-slate-300" aria-hidden />
              <h1 className="text-2xl font-black text-slate-900">
                {!survey ? t('الاستطلاع غير موجود', 'Survey not found')
                  : state === 'scheduled' ? t('لم يبدأ الاستطلاع بعد', 'This survey has not started yet')
                  : state === 'ended' ? t('انتهى هذا الاستطلاع', 'This survey has ended')
                  : t('الاستطلاع غير متاح حالياً', 'This survey is not available')}
              </h1>
              {survey?.startsAt && state === 'scheduled' && <p className="font-bold text-slate-500">{t('يبدأ في', 'Starts on')} {new Date(survey.startsAt).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB')}</p>}
              <Link href="/" className="inline-block font-black text-secondary underline underline-offset-4">{t('العودة للرئيسية', 'Back to home')}</Link>
            </div>
          )}
        </div>
      </main>
      <PortalFooter siteConfig={siteConfig} variant="compact" />
    </div>
  );
}
