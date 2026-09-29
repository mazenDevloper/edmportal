'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronDown, CircleDot, ClipboardList, Copy, ExternalLink, Gauge,
  Languages, LayoutTemplate, ListChecks, Loader2, Monitor, Redo2, Save, Settings2, Smartphone, Sparkles, Star, TextCursorInput,
  ToggleLeft, Trash2, RotateCcw, Undo2, AlignLeft, SquareCheck, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { Survey, SurveyQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { translateBatch } from '@/ai/flows/translate-flow';
import { FieldEditor } from '@/components/blocks/field-editor';
import type { FieldDef } from '@/components/blocks/registry';
import { QUESTION_TYPES, SurveyForm, isChoiceType, surveyWindow } from '@/components/survey/survey-form';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const TYPE_ICONS: Record<SurveyQuestion['type'], React.ElementType> = {
  mcq: CircleDot, multi: SquareCheck, dropdown: ChevronDown, yesno: ToggleLeft, rating: Star, nps: Gauge, text: TextCursorInput, longtext: AlignLeft,
};

const opt = (textAr: string, textEn: string) => ({ id: uid('o'), textAr, textEn });

const OPTION_PRESETS = [
  { id: 'satisfaction', ar: 'مستوى الرضا', en: 'Satisfaction', make: () => [opt('راضٍ جداً', 'Very satisfied'), opt('راضٍ', 'Satisfied'), opt('محايد', 'Neutral'), opt('غير راضٍ', 'Dissatisfied'), opt('غير راضٍ إطلاقاً', 'Very dissatisfied')] },
  { id: 'agreement', ar: 'درجة الموافقة', en: 'Agreement', make: () => [opt('أوافق بشدة', 'Strongly agree'), opt('أوافق', 'Agree'), opt('محايد', 'Neutral'), opt('لا أوافق', 'Disagree'), opt('لا أوافق بشدة', 'Strongly disagree')] },
  { id: 'frequency', ar: 'التكرار', en: 'Frequency', make: () => [opt('دائماً', 'Always'), opt('غالباً', 'Often'), opt('أحياناً', 'Sometimes'), opt('نادراً', 'Rarely'), opt('أبداً', 'Never')] },
  { id: 'channel', ar: 'قناة الخدمة', en: 'Service channel', make: () => [opt('البوابة الإلكترونية', 'Online portal'), opt('تطبيق الهاتف', 'Mobile app'), opt('مركز الخدمة', 'Service centre'), opt('مركز الاتصال', 'Call centre')] },
];

function newQuestion(type: SurveyQuestion['type']): SurveyQuestion {
  const meta = QUESTION_TYPES.find(q => q.type === type)!;
  return {
    id: uid('q'), type, questionAr: '', questionEn: '', required: false,
    options: isChoiceType(type) ? [opt('الخيار الأول', 'First option'), opt('الخيار الثاني', 'Second option')] : undefined,
    iconName: meta.type,
  };
}

const q = (type: SurveyQuestion['type'], questionAr: string, questionEn: string, extra: Partial<SurveyQuestion> = {}): SurveyQuestion =>
  ({ ...newQuestion(type), questionAr, questionEn, ...extra });

const SURVEY_TEMPLATES: { id: string; ar: string; en: string; descAr: string; descEn: string; make: () => Partial<Survey> }[] = [
  {
    id: 'csat', ar: 'رضا عن خدمة', en: 'Service satisfaction', descAr: 'تقييم تجربة خدمة إلكترونية', descEn: 'Rate an e-service experience',
    make: () => ({
      titleAr: 'قياس رضا المستفيدين عن الخدمات الإلكترونية', titleEn: 'Beneficiary satisfaction with e-services',
      descriptionAr: 'يستغرق الاستطلاع أقل من دقيقتين، ويساعدنا على تحسين خدماتنا.', descriptionEn: 'This survey takes under two minutes and helps us improve our services.',
      thanksAr: 'شكراً لوقتك! ملاحظاتك تصل مباشرة لفريق تحسين الخدمات.', thanksEn: 'Thank you for your time! Your feedback goes straight to our service-improvement team.',
      questions: [
        q('rating', 'كيف تقيّم تجربتك العامة مع الخدمة؟', 'How would you rate your overall experience?', { required: true }),
        q('mcq', 'ما مدى سهولة إنجاز الخدمة؟', 'How easy was it to complete the service?', { required: true, options: [opt('سهلة جداً', 'Very easy'), opt('سهلة', 'Easy'), opt('متوسطة', 'Moderate'), opt('صعبة', 'Difficult')] }),
        q('yesno', 'هل أنجزت الخدمة من أول محاولة؟', 'Did you complete the service on the first attempt?'),
        q('longtext', 'ما الذي يمكننا تحسينه؟', 'What could we improve?'),
      ],
    }),
  },
  {
    id: 'nps', ar: 'مؤشر التوصية', en: 'Net Promoter Score', descAr: 'سؤال NPS مع سبب التقييم', descEn: 'NPS question with a follow-up',
    make: () => ({
      titleAr: 'ما مدى احتمال أن توصي بخدماتنا؟', titleEn: 'How likely are you to recommend our services?',
      questions: [
        q('nps', 'ما مدى احتمال أن توصي بخدمات بلدية ظفار الإلكترونية لغيرك؟', 'How likely are you to recommend Dhofar Municipality e-services to others?', { required: true }),
        q('longtext', 'ما السبب الرئيسي لتقييمك؟', 'What is the main reason for your score?'),
      ],
    }),
  },
  {
    id: 'poll', ar: 'استطلاع رأي سريع', en: 'Quick poll', descAr: 'سؤال واحد يظهر في الصفحة الرئيسية', descEn: 'One question for the home page',
    make: () => ({
      titleAr: 'شاركنا رأيك', titleEn: 'Share your opinion', isPublicPoll: true, anonymous: true,
      questions: [q('mcq', 'ما الخدمة التي تود إضافتها للبوابة؟', 'Which service would you like added to the portal?', { required: true, options: OPTION_PRESETS[3].make() })],
    }),
  },
];

const EMPTY_SURVEY: Survey = {
  id: '', titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', thanksAr: '', thanksEn: '',
  questions: [], isActive: false, isPublicPoll: false, anonymous: true, responsesCount: 0,
};

const SETTINGS_FIELDS: FieldDef[] = [
  { key: 'title', labelAr: 'عنوان الاستطلاع', labelEn: 'Survey title', type: 'bi' },
  { key: 'description', labelAr: 'وصف مختصر', labelEn: 'Short description', type: 'bitext' },
  { key: 'thanks', labelAr: 'رسالة الشكر بعد الإرسال', labelEn: 'Thank-you message', type: 'bitext' },
];

const QUESTION_FIELDS: FieldDef[] = [
  { key: 'question', labelAr: 'نص السؤال', labelEn: 'Question', type: 'bi' },
  { key: 'help', labelAr: 'نص مساعد (اختياري)', labelEn: 'Help text (optional)', type: 'bi' },
];

const OPTION_FIELDS: FieldDef[] = [
  {
    key: 'options', labelAr: 'الخيارات', labelEn: 'Options', type: 'list',
    itemFields: [{ key: 'text', labelAr: 'نص الخيار', labelEn: 'Option text', type: 'bi' }],
    newItem: () => ({ id: uid('o'), textAr: '', textEn: '' }),
    itemLabel: (it, isAr) => (isAr ? it.textAr || it.textEn : it.textEn || it.textAr) || (isAr ? 'خيار' : 'Option'),
  },
];

type Issue = { level: 'error' | 'warn'; ar: string; en: string; target: string };

function checkSurvey(s: Survey): Issue[] {
  const out: Issue[] = [];
  if (!s.titleAr.trim()) out.push({ level: 'error', ar: 'العنوان العربي فارغ', en: 'Arabic title is empty', target: 'settings' });
  if (!s.titleEn.trim()) out.push({ level: 'warn', ar: 'العنوان الإنجليزي فارغ', en: 'English title is empty', target: 'settings' });
  if (!s.questions.length) out.push({ level: 'error', ar: 'لا توجد أسئلة', en: 'No questions yet', target: 'settings' });
  if (s.startsAt && s.endsAt && s.endsAt < s.startsAt) out.push({ level: 'error', ar: 'تاريخ الانتهاء قبل تاريخ البدء', en: 'End date is before start date', target: 'settings' });
  s.questions.forEach((qq, i) => {
    const n = i + 1;
    if (!qq.questionAr.trim()) out.push({ level: 'error', ar: `السؤال ${n} بلا نص عربي`, en: `Q${n} has no Arabic text`, target: qq.id });
    else if (!qq.questionEn.trim()) out.push({ level: 'warn', ar: `السؤال ${n} ينقصه الإنجليزي`, en: `Q${n} is missing English`, target: qq.id });
    if (isChoiceType(qq.type)) {
      const opts = qq.options || [];
      if (opts.length < 2) out.push({ level: 'error', ar: `السؤال ${n} يحتاج خيارين على الأقل`, en: `Q${n} needs at least two options`, target: qq.id });
      if (opts.some(o => !o.textAr.trim())) out.push({ level: 'error', ar: `السؤال ${n} فيه خيار فارغ`, en: `Q${n} has an empty option`, target: qq.id });
      else if (opts.some(o => !o.textEn.trim())) out.push({ level: 'warn', ar: `خيارات السؤال ${n} تنقصها الإنجليزية`, en: `Q${n} options are missing English`, target: qq.id });
      const texts = opts.map(o => o.textAr.trim()).filter(Boolean);
      if (new Set(texts).size !== texts.length) out.push({ level: 'warn', ar: `السؤال ${n} فيه خيارات مكررة`, en: `Q${n} has duplicate options`, target: qq.id });
    }
  });
  return out;
}

/** Every [arKey, enKey] pair inside a survey, as paths */
function bilingualPaths(s: Survey): [(string | number)[], (string | number)[]][] {
  const out: [(string | number)[], (string | number)[]][] = [
    [['titleAr'], ['titleEn']], [['descriptionAr'], ['descriptionEn']], [['thanksAr'], ['thanksEn']],
  ];
  s.questions.forEach((qq, i) => {
    out.push([['questions', i, 'questionAr'], ['questions', i, 'questionEn']]);
    out.push([['questions', i, 'helpAr'], ['questions', i, 'helpEn']]);
    (qq.options || []).forEach((_, j) => out.push([['questions', i, 'options', j, 'textAr'], ['questions', i, 'options', j, 'textEn']]));
  });
  return out;
}
const getP = (o: any, p: (string | number)[]) => p.reduce((x, k) => (x == null ? x : x[k]), o);
function setP<T>(o: T, p: (string | number)[], v: unknown): T {
  if (!p.length) return v as T;
  const [k, ...rest] = p;
  const c: any = Array.isArray(o) ? [...(o as any)] : { ...(o as any) };
  c[k] = setP(c[k], rest, v);
  return c;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function SurveyBuilder() {
  const router = useRouter();
  const editId = useSearchParams().get('id');
  const { toast } = useToast();
  const language = useSettingsStore(s => s.language);
  const setLanguage = useSettingsStore(s => s.setLanguage);
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [survey, setSurvey] = useState<Survey>(EMPTY_SURVEY);
  const [saved, setSaved] = useState<string>(JSON.stringify(EMPTY_SURVEY));
  const [selected, setSelected] = useState<string>('settings');
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  // Undo / redo with coalescing so typing is one step
  const past = useRef<Survey[]>([]);
  const future = useRef<Survey[]>([]);
  const lastKey = useRef<{ key: string; at: number } | null>(null);
  const [, force] = useState(0);

  const commit = useCallback((next: Survey | ((s: Survey) => Survey), key?: string) => {
    setSurvey(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      const now = Date.now();
      const coalesce = key && lastKey.current?.key === key && now - lastKey.current.at < 1200;
      if (!coalesce) { past.current = [...past.current.slice(-80), prev]; future.current = []; }
      lastKey.current = key ? { key, at: now } : null;
      return value;
    });
    force(x => x + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setSurvey(cur => { future.current.push(cur); return prev; });
    lastKey.current = null;
    force(x => x + 1);
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setSurvey(cur => { past.current.push(cur); return next; });
    lastKey.current = null;
    force(x => x + 1);
  }, []);

  useEffect(() => {
    if (!editId) return;
    fetchBin().then(db => {
      const found = (db.surveys || []).find((s: Survey) => s.id === editId);
      if (found) {
        const normalized: Survey = { ...EMPTY_SURVEY, ...found, questions: (found.questions || []).map((qq: SurveyQuestion) => ({ ...qq, options: qq.options?.map(o => ({ ...o, id: o.id || uid('o') })) })) };
        setSurvey(normalized);
        setSaved(JSON.stringify(normalized));
      } else {
        toast({ variant: 'destructive', title: isAr ? 'لم يتم العثور على الاستطلاع' : 'Survey not found' });
      }
    }).finally(() => setLoading(false));
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(survey) !== saved;
  const issues = useMemo(() => checkSurvey(survey), [survey]);
  const errors = issues.filter(i => i.level === 'error');
  const pairs = useMemo(() => bilingualPaths(survey), [survey]);
  const coverage = useMemo(() => {
    const filled = pairs.filter(([a]) => String(getP(survey, a) ?? '').trim());
    if (!filled.length) return 100;
    return Math.round((filled.filter(([, e]) => String(getP(survey, e) ?? '').trim()).length / filled.length) * 100);
  }, [pairs, survey]);
  const win = surveyWindow(survey);

  const selectedIndex = survey.questions.findIndex(qq => qq.id === selected);
  const current = selectedIndex >= 0 ? survey.questions[selectedIndex] : null;

  const patchQuestion = (id: string, patch: Partial<SurveyQuestion>, key?: string) =>
    commit(s => ({ ...s, questions: s.questions.map(qq => (qq.id === id ? { ...qq, ...patch } : qq)) }), key);

  const addQuestion = (type: SurveyQuestion['type']) => {
    const nq = newQuestion(type);
    const at = selectedIndex >= 0 ? selectedIndex + 1 : survey.questions.length;
    commit(s => ({ ...s, questions: [...s.questions.slice(0, at), nq, ...s.questions.slice(at)] }));
    setSelected(nq.id);
  };
  const move = (i: number, d: -1 | 1) => commit(s => {
    const qs = [...s.questions];
    const j = i + d;
    if (j < 0 || j >= qs.length) return s;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    return { ...s, questions: qs };
  });
  const duplicate = (i: number) => {
    const src = survey.questions[i];
    const copy = { ...src, id: uid('q'), options: src.options?.map(o => ({ ...o, id: uid('o') })) };
    commit(s => ({ ...s, questions: [...s.questions.slice(0, i + 1), copy, ...s.questions.slice(i + 1)] }));
    setSelected(copy.id);
  };
  const remove = (i: number) => {
    const id = survey.questions[i].id;
    commit(s => ({ ...s, questions: s.questions.filter(qq => qq.id !== id) }));
    setSelected(survey.questions[i + 1]?.id || survey.questions[i - 1]?.id || 'settings');
  };
  const changeType = (type: SurveyQuestion['type']) => {
    if (!current) return;
    const options = isChoiceType(type) ? (current.options?.length ? current.options : newQuestion(type).options) : current.options;
    patchQuestion(current.id, { type, options });
  };

  const applyTemplate = (tpl: typeof SURVEY_TEMPLATES[number]) => {
    if (survey.questions.length && !window.confirm(t('سيستبدل القالب الأسئلة الحالية. متابعة؟', 'The template replaces the current questions. Continue?'))) return;
    const made = tpl.make();
    commit(s => ({ ...s, ...made, questions: made.questions || [] }));
    setSelected('settings');
  };

  const translateMissing = async () => {
    const toEn = pairs.filter(([a, e]) => String(getP(survey, a) ?? '').trim() && !String(getP(survey, e) ?? '').trim());
    const toAr = pairs.filter(([a, e]) => !String(getP(survey, a) ?? '').trim() && String(getP(survey, e) ?? '').trim());
    if (!toEn.length && !toAr.length) { toast({ title: t('كل النصوص مترجمة', 'Everything is already translated') }); return; }
    setTranslating(true);
    try {
      let next = survey;
      if (toEn.length) {
        const { translations, translated } = await translateBatch({ texts: toEn.map(([a]) => String(getP(survey, a))), source: 'ar', target: 'en', tone: 'concise' });
        if (!translated.some(Boolean)) throw new Error('not translated');
        toEn.forEach(([, e], i) => { if (translated[i]) next = setP(next, e, translations[i]); });
      }
      if (toAr.length) {
        const { translations, translated } = await translateBatch({ texts: toAr.map(([, e]) => String(getP(survey, e))), source: 'en', target: 'ar', tone: 'concise' });
        if (!translated.some(Boolean)) throw new Error('not translated');
        toAr.forEach(([a], i) => { if (translated[i]) next = setP(next, a, translations[i]); });
      }
      commit(next);
      toast({ title: t(`تمت ترجمة ${toEn.length + toAr.length} نصاً`, `Translated ${toEn.length + toAr.length} texts`) });
    } catch {
      toast({ variant: 'destructive', title: t('تعذرت الترجمة الآلية', 'Machine translation failed'), description: t('لا يوجد محرك ترجمة مفعّل أو لم تنجح الترجمة. راجع إعداد OPEN_LLM_URL في ملف ‎.env', 'No translation engine is set up, or it did not return a translation. See OPEN_LLM_URL in .env.') });
    } finally { setTranslating(false); }
  };

  const save = useCallback(async () => {
    if (errors.length) {
      toast({ variant: 'destructive', title: t('يوجد أخطاء يجب إصلاحها قبل الحفظ', 'Fix the errors before saving'), description: isAr ? errors[0].ar : errors[0].en });
      setSelected(errors[0].target);
      return;
    }
    setSaving(true);
    try {
      const db = await fetchBin();
      const id = survey.id || uid('survey');
      const existing = (db.surveys || []).find((s: Survey) => s.id === id);
      const record: Survey = { ...survey, id, responsesCount: existing?.responsesCount ?? survey.responsesCount ?? 0 };
      const list = (db.surveys || []).filter((s: Survey) => s.id !== id);
      await updateBin({ ...db, surveys: [...list, record] });
      setSurvey(record);
      setSaved(JSON.stringify(record));
      if (!editId) router.replace(`/surveybuild?id=${id}`);
      toast({ title: t('تم حفظ الاستطلاع', 'Survey saved') });
    } catch {
      toast({ variant: 'destructive', title: t('تعذر الحفظ', 'Could not save') });
    } finally { setSaving(false); }
  }, [errors, survey, editId, router, toast, isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); save(); }
      const inField = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable="true"]');
      if (inField) return;
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, undo, redo]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-secondary" size={32} /></div>;

  const statusChip = {
    inactive: { ar: 'غير منشور', en: 'Not published', cls: 'bg-slate-100 text-slate-600' },
    scheduled: { ar: 'مجدول', en: 'Scheduled', cls: 'bg-sky-100 text-sky-700' },
    ended: { ar: 'منتهي', en: 'Ended', cls: 'bg-amber-100 text-amber-800' },
    open: { ar: 'مفتوح للإجابات', en: 'Open for responses', cls: 'bg-emerald-100 text-emerald-700' },
  }[win];

  return (
    <div className="h-screen flex flex-col bg-slate-100" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      {/* Top bar */}
      <header className="h-16 shrink-0 bg-white border-b flex items-center gap-3 px-4">
        <Button asChild variant="ghost" size="icon" className="rounded-xl" aria-label={t('رجوع', 'Back')}>
          <Link href="/edmPortal"><ArrowLeft size={18} className={cn(isAr && '-scale-x-100')} /></Link>
        </Button>
        <span className="size-9 rounded-xl bg-secondary text-white flex items-center justify-center"><ClipboardList size={18} aria-hidden /></span>
        <div className="min-w-0">
          <h1 className="font-black text-slate-900 truncate leading-tight">{(isAr ? survey.titleAr || survey.titleEn : survey.titleEn || survey.titleAr) || t('استطلاع جديد', 'New survey')}</h1>
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className={cn('px-1.5 rounded', statusChip.cls)}>{isAr ? statusChip.ar : statusChip.en}</span>
            <span className="text-slate-400">{t(`${survey.questions.length} أسئلة`, `${survey.questions.length} questions`)}</span>
            {dirty && <span className="text-amber-600">● {t('تغييرات غير محفوظة', 'Unsaved changes')}</span>}
          </div>
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!past.current.length} className="rounded-xl" aria-label={t('تراجع', 'Undo')} title="Ctrl+Z"><Undo2 size={17} /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!future.current.length} className="rounded-xl" aria-label={t('إعادة', 'Redo')} title="Ctrl+Shift+Z"><Redo2 size={17} /></Button>
          <span className="w-px h-6 bg-slate-200 mx-1" />
          <Button variant="outline" size="sm" onClick={translateMissing} disabled={translating} className="rounded-xl font-black gap-1.5 h-9">
            {translating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} className="text-accent" />}
            {t('ترجمة الناقص', 'Translate missing')}
            <span className={cn('text-[10px] px-1.5 rounded', coverage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{coverage}%</span>
          </Button>
          {survey.id && (
            <Button asChild variant="outline" size="sm" className="rounded-xl font-black gap-1.5 h-9">
              <Link href={`/survey/${survey.id}`} target="_blank"><ExternalLink size={15} />{t('فتح الرابط العام', 'Open public link')}</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="rounded-xl font-black gap-1.5 h-9" lang={isAr ? 'en' : 'ar'}><Languages size={15} />{isAr ? 'EN' : 'ع'}</Button>
          <Button onClick={save} disabled={saving || !dirty} className="rounded-xl font-black gap-1.5 h-9 bg-secondary hover:bg-secondary/90 text-white" title="Ctrl+S">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{t('حفظ', 'Save')}
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)] max-lg:grid-cols-1 max-lg:overflow-y-auto">
        {/* Left: palette + outline */}
        <aside className="bg-white border-e overflow-y-auto p-4 space-y-5" aria-label={t('الأسئلة', 'Questions')}>
          <section>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('أضف سؤالاً', 'Add a question')}</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {QUESTION_TYPES.map(qt => {
                const Icon = TYPE_ICONS[qt.type];
                return (
                  <button key={qt.type} type="button" onClick={() => addQuestion(qt.type)} title={isAr ? qt.descAr : qt.descEn}
                    className="flex items-center gap-2 h-10 px-2.5 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-700 hover:border-secondary hover:bg-secondary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary">
                    <Icon size={15} className="text-secondary shrink-0" aria-hidden /><span className="truncate">{isAr ? qt.ar : qt.en}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('هيكل الاستطلاع', 'Outline')}</h2>
            <ol className="space-y-1">
              <li>
                <button type="button" onClick={() => setSelected('settings')} aria-current={selected === 'settings'}
                  className={cn('w-full flex items-center gap-2 h-10 px-3 rounded-xl text-[13px] font-black', selected === 'settings' ? 'bg-secondary text-white' : 'text-slate-700 hover:bg-slate-100')}>
                  <Settings2 size={15} aria-hidden />{t('الإعدادات والعنوان', 'Settings & title')}
                </button>
              </li>
              {survey.questions.map((qq, i) => {
                const Icon = TYPE_ICONS[qq.type];
                const on = selected === qq.id;
                const hasError = issues.some(x => x.target === qq.id && x.level === 'error');
                return (
                  <li key={qq.id} className={cn('group flex items-center gap-1 rounded-xl', on ? 'bg-secondary/10 ring-1 ring-secondary/40' : 'hover:bg-slate-100')}>
                    <button type="button" onClick={() => setSelected(qq.id)} aria-current={on} className="flex-1 min-w-0 flex items-center gap-2 h-10 ps-3 text-start">
                      <span className="text-[11px] font-black text-slate-400 tabular-nums w-4">{i + 1}</span>
                      <Icon size={14} className="text-secondary shrink-0" aria-hidden />
                      <span className="truncate text-[13px] font-bold text-slate-700">{(isAr ? qq.questionAr || qq.questionEn : qq.questionEn || qq.questionAr) || t('سؤال بدون نص', 'Untitled question')}</span>
                      {qq.required && <span className="text-red-500 text-xs" aria-label={t('مطلوب', 'required')}>*</span>}
                      {hasError && <AlertTriangle size={13} className="text-red-500 shrink-0" aria-label={t('يحتاج إصلاحاً', 'Needs fixing')} />}
                    </button>
                    <div className={cn('flex items-center pe-1', !on && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100')}>
                      <IconBtn label={t('أعلى', 'Move up')} onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={13} /></IconBtn>
                      <IconBtn label={t('أسفل', 'Move down')} onClick={() => move(i, 1)} disabled={i === survey.questions.length - 1}><ArrowDown size={13} /></IconBtn>
                      <IconBtn label={t('تكرار', 'Duplicate')} onClick={() => duplicate(i)}><Copy size={13} /></IconBtn>
                      <IconBtn label={t('حذف', 'Delete')} onClick={() => remove(i)} danger><Trash2 size={13} /></IconBtn>
                    </div>
                  </li>
                );
              })}
            </ol>
            {!survey.questions.length && <p className="text-xs font-bold text-slate-400 p-3 text-center border-2 border-dashed rounded-xl mt-2">{t('أضف سؤالاً أو ابدأ من قالب', 'Add a question or start from a template')}</p>}
          </section>

          <section>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><LayoutTemplate size={13} />{t('قوالب جاهزة', 'Templates')}</h2>
            <div className="space-y-1.5">
              {SURVEY_TEMPLATES.map(tpl => (
                <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                  className="w-full text-start p-2.5 rounded-xl border border-slate-200 hover:border-secondary hover:bg-secondary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary">
                  <span className="block text-[13px] font-black text-slate-800">{isAr ? tpl.ar : tpl.en}</span>
                  <span className="block text-[11px] font-bold text-slate-500">{isAr ? tpl.descAr : tpl.descEn}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><ListChecks size={13} />{t('فحص الجودة', 'Quality checks')}</h2>
            {issues.length ? (
              <ul className="space-y-1">
                {issues.map((iss, k) => (
                  <li key={k}>
                    <button type="button" onClick={() => setSelected(iss.target)} className={cn('w-full flex items-start gap-2 p-2 rounded-lg text-start text-[12px] font-bold', iss.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800')}>
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden />{isAr ? iss.ar : iss.en}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold"><CheckCircle2 size={14} />{t('جاهز للنشر', 'Ready to publish')}</p>
            )}
          </section>
        </aside>

        {/* Center: editor */}
        <section className="overflow-y-auto p-6" aria-label={t('المحرر', 'Editor')}>
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm ring-1 ring-slate-200 p-6 space-y-6">
            {!current ? (
              <>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Settings2 size={18} className="text-secondary" />{t('إعدادات الاستطلاع', 'Survey settings')}</h2>
                <FieldEditor fields={SETTINGS_FIELDS} value={survey} isAr={isAr} onChange={v => commit(v as Survey, 'settings')} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <SwitchRow label={t('منشور (يقبل الإجابات)', 'Published (accepting responses)')} checked={survey.isActive} onChange={v => commit(s => ({ ...s, isActive: v }))} />
                  <SwitchRow label={t('يظهر في الصفحة الرئيسية', 'Show on the home page')} checked={!!survey.isPublicPoll} onChange={v => commit(s => ({ ...s, isPublicPoll: v }))} />
                  <SwitchRow label={t('مجهول الهوية', 'Anonymous')} hint={t('لا يُطلب تسجيل الدخول ولا تُحفظ بيانات شخصية', 'No sign-in, no personal data stored')} checked={!!survey.anonymous} onChange={v => commit(s => ({ ...s, anonymous: v }))} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="starts" className="text-[11px] font-black text-slate-500">{t('يبدأ في (اختياري)', 'Starts on (optional)')}</Label>
                    <Input id="starts" type="date" dir="ltr" value={survey.startsAt || ''} onChange={e => commit(s => ({ ...s, startsAt: e.target.value || undefined }))} className="h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ends" className="text-[11px] font-black text-slate-500">{t('ينتهي في (اختياري)', 'Ends on (optional)')}</Label>
                    <Input id="ends" type="date" dir="ltr" value={survey.endsAt || ''} min={survey.startsAt} onChange={e => commit(s => ({ ...s, endsAt: e.target.value || undefined }))} className="h-10 rounded-xl" />
                  </div>
                </div>
                {!!survey.id && <p className="text-[11px] font-bold text-slate-400">{t('المعرّف', 'ID')}: <span className="font-mono">{survey.id}</span> · {t('الإجابات', 'Responses')}: {survey.responsesCount || 0}</p>}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-900">{t(`السؤال ${selectedIndex + 1}`, `Question ${selectedIndex + 1}`)}</h2>
                  <SwitchRow compact label={t('إجابة مطلوبة', 'Required')} checked={!!current.required} onChange={v => patchQuestion(current.id, { required: v })} />
                </div>

                <div>
                  <p className="text-[11px] font-black text-slate-500 mb-1.5">{t('نوع السؤال', 'Question type')}</p>
                  <div role="radiogroup" aria-label={t('نوع السؤال', 'Question type')} className="grid grid-cols-4 gap-1.5">
                    {QUESTION_TYPES.map(qt => {
                      const Icon = TYPE_ICONS[qt.type];
                      const on = current.type === qt.type;
                      return (
                        <button key={qt.type} type="button" role="radio" aria-checked={on} onClick={() => changeType(qt.type)}
                          className={cn('flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-[11px] font-black', on ? 'border-secondary bg-secondary/10 text-secondary' : 'border-slate-200 text-slate-600 hover:border-secondary/40')}>
                          <Icon size={16} aria-hidden />{isAr ? qt.ar : qt.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <FieldEditor fields={QUESTION_FIELDS} value={current} isAr={isAr} onChange={v => patchQuestion(current.id, v as SurveyQuestion, `q:${current.id}`)} />

                {isChoiceType(current.type) && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-black text-slate-500 me-1">{t('خيارات جاهزة:', 'Presets:')}</span>
                      {OPTION_PRESETS.map(p => (
                        <button key={p.id} type="button" onClick={() => patchQuestion(current.id, { options: p.make() })}
                          className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-secondary/10 hover:text-secondary text-[11px] font-black text-slate-600">{isAr ? p.ar : p.en}</button>
                      ))}
                    </div>
                    <FieldEditor fields={OPTION_FIELDS} value={current} isAr={isAr} onChange={v => patchQuestion(current.id, { options: (v as SurveyQuestion).options }, `opts:${current.id}`)} />
                  </div>
                )}
                {current.type === 'nps' && <Hint>{t('يعرض مقياساً من 0 إلى 10؛ يُحسب مؤشر التوصية = نسبة المروّجين (9–10) − نسبة المنتقدين (0–6).', 'Shows a 0–10 scale; NPS = % promoters (9–10) − % detractors (0–6).')}</Hint>}
                {current.type === 'rating' && <Hint>{t('يعرض 5 نجوم قابلة للاختيار بلوحة المفاتيح.', 'Shows 5 keyboard-accessible stars.')}</Hint>}

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => duplicate(selectedIndex)} className="rounded-xl font-bold gap-1.5"><Copy size={14} />{t('تكرار', 'Duplicate')}</Button>
                  <Button variant="outline" size="sm" onClick={() => remove(selectedIndex)} className="rounded-xl font-bold gap-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} />{t('حذف', 'Delete')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => addQuestion(current.type)} className="rounded-xl font-bold gap-1.5 ms-auto"><Plus size={14} />{t('سؤال مماثل بعده', 'Add similar below')}</Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Right: live preview */}
        <section className="bg-slate-200/60 border-s overflow-y-auto p-6 flex flex-col items-center gap-4" aria-label={t('المعاينة', 'Preview')}>
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
            {(['ar', 'en'] as const).map(l => (
              <button key={l} type="button" aria-pressed={previewLang === l} onClick={() => setPreviewLang(l)} className={cn('h-8 px-3 rounded-lg text-xs font-black', previewLang === l ? 'bg-secondary text-white' : 'text-slate-500')}>{l === 'ar' ? 'العربية' : 'English'}</button>
            ))}
            <span className="w-px h-5 bg-slate-200" />
            <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} aria-label={t('سطح المكتب', 'Desktop')} className={cn('size-8 rounded-lg flex items-center justify-center', device === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-500')}><Monitor size={15} /></button>
            <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} aria-label={t('الجوال', 'Mobile')} className={cn('size-8 rounded-lg flex items-center justify-center', device === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-500')}><Smartphone size={15} /></button>
            <button type="button" onClick={() => setPreviewKey(k => k + 1)} className="h-8 px-2 rounded-lg text-xs font-black text-slate-500 hover:text-slate-800"><RotateCcw size={13} className="inline me-1" />{t('إعادة', 'Reset')}</button>
          </div>
          <div className={cn('w-full bg-white rounded-3xl shadow-xl p-6 transition-all', device === 'mobile' ? 'max-w-[380px]' : 'max-w-2xl')}>
            <SurveyForm key={`${previewKey}-${previewLang}`} survey={survey} isAr={previewLang === 'ar'} compact={device === 'mobile'}
              activeQuestionId={current?.id} onQuestionClick={id => setSelected(id)} />
          </div>
          <p className="text-[11px] font-bold text-slate-500">{t('المعاينة تفاعلية ولا ترسل أي إجابات.', 'The preview is interactive and sends no responses.')}</p>
        </section>
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={cn('size-7 rounded-lg flex items-center justify-center text-slate-500 disabled:opacity-25 hover:bg-white', danger && 'hover:text-red-600')}>
      {children}
    </button>
  );
}

function SwitchRow({ label, hint, checked, onChange, compact }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', !compact && 'p-3 rounded-2xl border-2 border-slate-100 bg-slate-50/60')}>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-black text-slate-700">{label}</span>
        {hint && <span className="block text-[11px] font-bold text-slate-400">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-bold text-slate-500 bg-slate-50 rounded-xl p-3">{children}</p>;
}

export default function SurveyBuildPage() {
  return <Suspense fallback={null}><SurveyBuilder /></Suspense>;
}
