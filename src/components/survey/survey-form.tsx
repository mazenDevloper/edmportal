'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, Send, Star } from 'lucide-react';
import { Survey, SurveyQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';

export type SurveyAnswer = string | string[] | number;
export type SurveyAnswers = Record<string, SurveyAnswer>;

export const QUESTION_TYPES: { type: SurveyQuestion['type']; ar: string; en: string; descAr: string; descEn: string; choice: boolean }[] = [
  { type: 'mcq', ar: 'اختيار واحد', en: 'Single choice', descAr: 'خيار واحد من قائمة', descEn: 'Pick one option', choice: true },
  { type: 'multi', ar: 'اختيارات متعددة', en: 'Multiple choice', descAr: 'أكثر من خيار', descEn: 'Pick several', choice: true },
  { type: 'dropdown', ar: 'قائمة منسدلة', en: 'Dropdown', descAr: 'قائمة طويلة مختصرة', descEn: 'Compact long list', choice: true },
  { type: 'yesno', ar: 'نعم / لا', en: 'Yes / No', descAr: 'إجابة ثنائية', descEn: 'Binary answer', choice: false },
  { type: 'rating', ar: 'تقييم بالنجوم', en: 'Star rating', descAr: 'من 1 إلى 5', descEn: '1 to 5 stars', choice: false },
  { type: 'nps', ar: 'مؤشر التوصية', en: 'NPS', descAr: 'من 0 إلى 10', descEn: '0 to 10 scale', choice: false },
  { type: 'text', ar: 'نص قصير', en: 'Short text', descAr: 'سطر واحد', descEn: 'One line', choice: false },
  { type: 'longtext', ar: 'نص طويل', en: 'Paragraph', descAr: 'ملاحظات مفصلة', descEn: 'Detailed feedback', choice: false },
];

export const isChoiceType = (t: SurveyQuestion['type']) => t === 'mcq' || t === 'multi' || t === 'dropdown';

export function isAnswered(q: SurveyQuestion, a: SurveyAnswer | undefined) {
  if (a == null) return false;
  if (Array.isArray(a)) return a.length > 0;
  if (typeof a === 'string') return a.trim().length > 0;
  return true;
}

/** Survey window state — inactive, not started yet, ended or open */
export function surveyWindow(s: Pick<Survey, 'isActive' | 'startsAt' | 'endsAt'>, now = Date.now()) {
  if (!s.isActive) return 'inactive' as const;
  if (s.startsAt && now < new Date(s.startsAt).getTime()) return 'scheduled' as const;
  if (s.endsAt && now > new Date(s.endsAt).getTime() + 86_399_999) return 'ended' as const;
  return 'open' as const;
}

interface Props {
  survey: Survey;
  isAr: boolean;
  /** Called with validated answers; omit for a non-submitting preview */
  onSubmit?: (answers: SurveyAnswers) => Promise<void> | void;
  compact?: boolean;
  /** Highlight a question (builder preview) */
  activeQuestionId?: string | null;
  onQuestionClick?: (id: string) => void;
  /** The host already shows the title and description (e.g. a dialog header) */
  hideHeader?: boolean;
}

export function SurveyForm({ survey, isAr, onSubmit, compact, activeQuestionId, onQuestionClick, hideHeader }: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const tx = (ar?: string, en?: string) => (isAr ? ar || en : en || ar) || '';
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const answeredCount = useMemo(() => survey.questions.filter(q => isAnswered(q, answers[q.id])).length, [survey.questions, answers]);
  const progress = survey.questions.length ? Math.round((answeredCount / survey.questions.length) * 100) : 0;

  const setAnswer = (id: string, v: SurveyAnswer) => {
    setAnswers(a => ({ ...a, [id]: v }));
    setErrors(e => ({ ...e, [id]: false }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = survey.questions.filter(q => q.required && !isAnswered(q, answers[q.id]));
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map(q => [q.id, true])));
      document.getElementById(`sq-${missing[0].id}`)?.focus();
      return;
    }
    if (!onSubmit) { setDone(true); return; }
    setBusy(true);
    try { await onSubmit(answers); setDone(true); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center text-center gap-4 py-12 px-6">
        <span className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={34} aria-hidden /></span>
        <h3 className="text-2xl font-black text-slate-900">{t('شكراً لك!', 'Thank you!')}</h3>
        <p className="text-slate-600 font-medium max-w-md">{tx(survey.thanksAr, survey.thanksEn) || t('تم استلام إجابتك، وستساعدنا على تحسين خدماتنا.', 'Your response was received and will help us improve our services.')}</p>
        <button type="button" onClick={() => { setDone(false); setAnswers({}); }} className="text-sm font-black text-secondary underline underline-offset-4">{t('إرسال إجابة أخرى', 'Submit another response')}</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'} className={cn('space-y-6', compact && 'space-y-4')}>
      <header className="space-y-2">
        {!hideHeader && <h2 className={cn('font-black text-slate-900 leading-tight', compact ? 'text-xl' : 'text-3xl')}>{tx(survey.titleAr, survey.titleEn) || t('استطلاع بدون عنوان', 'Untitled survey')}</h2>}
        {!hideHeader && tx(survey.descriptionAr, survey.descriptionEn) && <p className="text-slate-600 font-medium leading-relaxed">{tx(survey.descriptionAr, survey.descriptionEn)}</p>}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={t('نسبة الإنجاز', 'Progress')}>
            <div className="h-full bg-secondary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-black text-slate-500 tabular-nums">{answeredCount}/{survey.questions.length}</span>
        </div>
        {survey.anonymous && <p className="text-[11px] font-bold text-emerald-700">{t('هذا الاستطلاع مجهول الهوية — لا نحفظ أي بيانات شخصية.', 'This survey is anonymous — no personal data is stored.')}</p>}
      </header>

      {survey.questions.map((q, i) => (
        <QuestionField
          key={q.id} q={q} index={i} isAr={isAr} value={answers[q.id]} error={!!errors[q.id]} onChange={v => setAnswer(q.id, v)}
          active={activeQuestionId === q.id} onActivate={onQuestionClick ? () => onQuestionClick(q.id) : undefined}
        />
      ))}

      {!!survey.questions.length && (
        <button type="submit" disabled={busy}
          className="w-full h-13 py-3.5 rounded-2xl bg-secondary text-white font-black text-lg flex items-center justify-center gap-2 hover:bg-secondary/90 disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500">
          {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className={cn(isAr && '-scale-x-100')} aria-hidden />}
          {t('إرسال', 'Submit')}
        </button>
      )}
    </form>
  );
}

function QuestionField({ q, index, isAr, value, error, onChange, active, onActivate }: {
  q: SurveyQuestion; index: number; isAr: boolean; value: SurveyAnswer | undefined; error: boolean;
  onChange: (v: SurveyAnswer) => void; active?: boolean; onActivate?: () => void;
}) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const tx = (ar?: string, en?: string) => (isAr ? ar || en : en || ar) || '';
  const labelId = `sq-${q.id}-label`;
  const helpId = `sq-${q.id}-help`;
  const errId = `sq-${q.id}-err`;
  const describedBy = [tx(q.helpAr, q.helpEn) && helpId, error && errId].filter(Boolean).join(' ') || undefined;
  const options = q.options || [];
  const optionCls = (on: boolean) => cn(
    'flex items-center gap-3 min-h-12 px-4 py-2.5 rounded-2xl border-2 text-start font-bold transition-colors cursor-pointer',
    'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-amber-500',
    on ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-200 bg-white text-slate-700 hover:border-secondary/40',
  );

  let control: React.ReactNode = null;
  switch (q.type) {
    case 'mcq':
    case 'yesno': {
      const opts = q.type === 'yesno'
        ? [{ id: 'yes', textAr: 'نعم', textEn: 'Yes' }, { id: 'no', textAr: 'لا', textEn: 'No' }]
        : options;
      control = (
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} aria-required={q.required} className={cn('grid gap-2', q.type === 'yesno' && 'grid-cols-2')}>
          {opts.map(o => (
            <label key={o.id} className={optionCls(value === o.id)}>
              <input id={o === opts[0] ? `sq-${q.id}` : undefined} type="radio" name={q.id} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="size-5 accent-[#005751]" />
              {tx(o.textAr, o.textEn) || t('خيار', 'Option')}
            </label>
          ))}
        </div>
      );
      break;
    }
    case 'multi': {
      const arr = Array.isArray(value) ? value : [];
      control = (
        <div role="group" aria-labelledby={labelId} aria-describedby={describedBy} className="grid gap-2">
          {options.map((o, i) => {
            const on = arr.includes(o.id);
            return (
              <label key={o.id} className={optionCls(on)}>
                <input id={i === 0 ? `sq-${q.id}` : undefined} type="checkbox" checked={on} onChange={() => onChange(on ? arr.filter(x => x !== o.id) : [...arr, o.id])} className="size-5 rounded accent-[#005751]" />
                {tx(o.textAr, o.textEn) || t('خيار', 'Option')}
              </label>
            );
          })}
        </div>
      );
      break;
    }
    case 'dropdown':
      control = (
        <div className="relative">
          <select id={`sq-${q.id}`} aria-labelledby={labelId} aria-describedby={describedBy} aria-required={q.required} aria-invalid={error}
            value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)}
            className="w-full h-12 appearance-none rounded-2xl border-2 border-slate-200 bg-white px-4 pe-10 font-bold text-slate-700 focus:border-secondary focus:outline-none focus-visible:outline-[3px] focus-visible:outline-amber-500">
            <option value="">{t('اختر…', 'Choose…')}</option>
            {options.map(o => <option key={o.id} value={o.id}>{tx(o.textAr, o.textEn)}</option>)}
          </select>
          <ChevronDown size={18} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden />
        </div>
      );
      break;
    case 'rating': {
      const n = typeof value === 'number' ? value : 0;
      control = (
        <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="flex gap-1.5" dir="ltr">
          {[1, 2, 3, 4, 5].map(s => (
            <label key={s} className="cursor-pointer rounded-xl p-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-amber-500">
              <input id={s === 1 ? `sq-${q.id}` : undefined} type="radio" name={q.id} className="sr-only" checked={n === s} onChange={() => onChange(s)} aria-label={t(`${s} من 5`, `${s} of 5`)} />
              <Star size={36} className={cn('transition-colors', s <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300')} aria-hidden />
            </label>
          ))}
        </div>
      );
      break;
    }
    case 'nps': {
      const n = typeof value === 'number' ? value : -1;
      control = (
        <div>
          <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="grid grid-cols-11 gap-1" dir="ltr">
            {Array.from({ length: 11 }, (_, s) => (
              <label key={s} className={cn('h-11 rounded-xl border-2 flex items-center justify-center font-black text-sm cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-amber-500',
                n === s ? (s <= 6 ? 'bg-red-500 border-red-500 text-white' : s <= 8 ? 'bg-amber-400 border-amber-400 text-slate-900' : 'bg-emerald-500 border-emerald-500 text-white') : 'border-slate-200 bg-white text-slate-600 hover:border-secondary/40')}>
                <input id={s === 0 ? `sq-${q.id}` : undefined} type="radio" name={q.id} className="sr-only" checked={n === s} onChange={() => onChange(s)} />
                {s}
              </label>
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1.5">
            <span>{t('غير مرجح إطلاقاً', 'Not at all likely')}</span><span>{t('مرجح جداً', 'Extremely likely')}</span>
          </div>
        </div>
      );
      break;
    }
    case 'text':
      control = <input id={`sq-${q.id}`} aria-labelledby={labelId} aria-describedby={describedBy} aria-required={q.required} aria-invalid={error} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)} maxLength={200}
        className="w-full h-12 rounded-2xl border-2 border-slate-200 bg-white px-4 font-medium focus:border-secondary focus:outline-none" />;
      break;
    case 'longtext':
      control = <textarea id={`sq-${q.id}`} aria-labelledby={labelId} aria-describedby={describedBy} aria-required={q.required} aria-invalid={error} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)} rows={4} maxLength={2000}
        className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 font-medium focus:border-secondary focus:outline-none" />;
      break;
  }

  return (
    <fieldset
      onClickCapture={onActivate}
      className={cn('space-y-3 p-5 rounded-3xl bg-slate-50/70 border-2 transition-colors', error ? 'border-red-300 bg-red-50/40' : active ? 'border-secondary/60' : 'border-transparent')}
    >
      <legend className="sr-only">{tx(q.questionAr, q.questionEn)}</legend>
      <p id={labelId} className="font-black text-slate-900 text-[17px] leading-snug">
        <span className="text-secondary me-1.5 tabular-nums">{index + 1}.</span>
        {tx(q.questionAr, q.questionEn) || <span className="text-slate-400">{t('سؤال بدون نص', 'Question without text')}</span>}
        {q.required && <span className="text-red-500 ms-1" aria-hidden>*</span>}
        {q.required && <span className="sr-only">{t('(مطلوب)', '(required)')}</span>}
      </p>
      {tx(q.helpAr, q.helpEn) && <p id={helpId} className="text-sm font-medium text-slate-500 -mt-1">{tx(q.helpAr, q.helpEn)}</p>}
      {control}
      {error && <p id={errId} role="alert" className="text-sm font-bold text-red-600">{t('هذا السؤال مطلوب.', 'This question is required.')}</p>}
    </fieldset>
  );
}
