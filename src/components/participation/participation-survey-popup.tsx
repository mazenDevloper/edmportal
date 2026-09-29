'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SurveyAnswers, SurveyForm, surveyWindow } from '@/components/survey/survey-form';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { Survey } from '@/lib/types';
import { PARTICIPATION_SURVEY, PARTICIPATION_SURVEY_ID } from '@/lib/participation';
import { useCitizenSession } from '@/lib/citizen-session';

const SEEN_KEY = 'dm-participation-survey';
const DELAY_MS = 6000;

const readSeen = () => { try { return localStorage.getItem(SEEN_KEY); } catch { return null; } };
const writeSeen = (v: 'dismissed' | 'answered') => { try { localStorage.setItem(SEEN_KEY, v); } catch { /* storage blocked */ } };

/**
 * Pop-up survey on the digital participation page: best topic for public participation and the
 * smartest municipal idea to put to the public. Opens once per visitor after a few seconds, and any
 * time from the "شارك برأيك" button. Uses the survey saved in the database if an admin edited it.
 */
export function ParticipationSurveyPopup({ isAr, open, onOpenChange }: { isAr: boolean; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [survey, setSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    fetchBin().then(db => {
      const saved = (db.surveys || []).find((s: Survey) => s.id === PARTICIPATION_SURVEY_ID);
      setSurvey(saved || PARTICIPATION_SURVEY);
    }).catch(() => setSurvey(PARTICIPATION_SURVEY));
  }, []);

  const available = !!survey && surveyWindow(survey) === 'open';

  // First visit: open after a short delay, unless already seen or another dialog (Thiqa) is open
  useEffect(() => {
    if (!available || readSeen()) return;
    const id = setTimeout(() => { if (!useCitizenSession.getState().promptOpen) onOpenChange(true); }, DELAY_MS);
    return () => clearTimeout(id);
  }, [available, onOpenChange]);

  const submit = async (answers: SurveyAnswers) => {
    const db = await fetchBin();
    const response = { id: `resp_${Date.now().toString(36)}`, surveyId: PARTICIPATION_SURVEY_ID, submittedAt: new Date().toISOString(), answers };
    const surveys: Survey[] = db.surveys || [];
    const exists = surveys.some(s => s.id === PARTICIPATION_SURVEY_ID);
    await updateBin({
      ...db,
      surveyResponses: [...(db.surveyResponses || []), response],
      // First answer adds the survey to the surveys list, so it shows in the survey builder with its results
      surveys: exists
        ? surveys.map(s => (s.id === PARTICIPATION_SURVEY_ID ? { ...s, responsesCount: (s.responsesCount || 0) + 1 } : s))
        : [...surveys, { ...PARTICIPATION_SURVEY, responsesCount: 1 }],
    });
    writeSeen('answered');
  };

  const close = (o: boolean) => {
    if (!o && readSeen() !== 'answered') writeSeen('dismissed');
    onOpenChange(o);
  };

  if (!available || !survey) return null;
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'} className="max-w-2xl max-h-[90dvh] overflow-y-auto rounded-[2rem] p-0 border-none [&>button:last-child]:!text-white [&>button:last-child]:!bg-white/15 [&>button:last-child]:!opacity-100 [&>button:last-child]:size-9 [&>button:last-child]:rounded-xl [&>button:last-child]:flex [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:top-3 rtl:[&>button:last-child]:!right-auto rtl:[&>button:last-child]:left-3">
        <div className="relative bg-gradient-to-br from-[#1b0f5c] to-[#470D67] text-white px-6 pt-6 pb-5">
          <div aria-hidden className="absolute inset-0 dm-pattern-wave-pro opacity-15" />
          <p className="relative text-xs font-black tracking-widest text-[#03CFCB]">{isAr ? 'صوتك اليوم… قرارنا غداً' : 'Your voice today… our decision tomorrow'}</p>
          <DialogTitle className="relative mt-1 text-2xl font-black">{isAr ? survey.titleAr : survey.titleEn || survey.titleAr}</DialogTitle>
          <DialogDescription className="relative mt-1 text-sm font-bold text-white/80">{isAr ? survey.descriptionAr : survey.descriptionEn || survey.descriptionAr}</DialogDescription>
        </div>
        <div className="p-6">
          {/* The dialog header above carries the title, so the form starts at the questions */}
          <SurveyForm survey={survey} isAr={isAr} onSubmit={submit} compact hideHeader />
        </div>
      </DialogContent>
    </Dialog>
  );
}
