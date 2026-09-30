'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import {
  BookOpen, CalendarClock, CheckCircle2, ClipboardList, ExternalLink, FilePen, FileText, Gauge, Layers,
  Library, Loader2, Megaphone, Plus, Save, Search, Send, Target, Users, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { StaffShell, useStaffPortal } from '@/components/staff/staff-shell';
import {
  DEFAULT_CALLS, DEFAULT_REPOSITORY, PaperCall, PaperSubmission, RepoPaper, STATUS, SubmissionStatus, THEMES,
  WRITING_GUIDE, callState, canReview, countWords, daysUntil, paperKpis,
} from '@/lib/papers';
import type { StaffUser } from '@/lib/types';
import { cn } from '@/lib/utils';

type Tab = 'calls' | 'themes' | 'repository' | 'submissions' | 'guide' | 'kpis';
const TABS: Tab[] = ['calls', 'themes', 'repository', 'submissions', 'guide', 'kpis'];
const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const fmtDate = (d: string, isAr: boolean) =>
  new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

interface PapersData { calls: PaperCall[]; repository: RepoPaper[]; submissions: PaperSubmission[] }

/** Read-merge-write one collection so concurrent edits elsewhere in the database survive */
async function saveCollection(key: 'paperCalls' | 'paperRepository' | 'paperSubmissions', list: unknown[]) {
  const db = await fetchBin();
  await updateBin({ ...db, [key]: list });
}

export default function PapersPortal() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { user, loading } = useStaffPortal({ requireAuth: true });
  const { toast } = useToast();
  const [papers, setPapers] = useState<PapersData | null>(null);
  const [tab, setTab] = useState<Tab>('calls');
  const [editing, setEditing] = useState<Partial<PaperSubmission> | null>(null);

  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    if (TABS.includes(h)) setTab(h);
  }, []);
  const changeTab = (v: string) => { setTab(v as Tab); history.replaceState(null, '', `#${v}`); };

  useEffect(() => {
    if (!user) return;
    fetchBin().then(db => setPapers({
      calls: db.paperCalls?.length ? db.paperCalls : DEFAULT_CALLS,
      repository: db.paperRepository?.length ? db.paperRepository : DEFAULT_REPOSITORY,
      submissions: db.paperSubmissions || [],
    }));
  }, [user]);

  const reviewer = canReview(user);
  const kpis = useMemo(() => (papers ? paperKpis(papers.submissions, papers.calls) : null), [papers]);

  if (loading || !user || !papers) {
    return <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-[#0f9e9b]" size={36} /></div>;
  }

  const persist = async <K extends keyof PapersData>(key: K, list: PapersData[K], ok: string) => {
    const dbKey = key === 'calls' ? 'paperCalls' : key === 'repository' ? 'paperRepository' : 'paperSubmissions';
    try {
      await saveCollection(dbKey, list);
      setPapers(p => p && { ...p, [key]: list });
      toast({ title: ok });
      return true;
    } catch {
      toast({ variant: 'destructive', title: t('تعذّر الحفظ، حاول مرة أخرى', 'Could not save, try again') });
      return false;
    }
  };

  const startSubmission = (callId?: string, themeId?: string) => {
    setEditing({ callId: callId || papers.calls[0]?.id, themeId: themeId || THEMES[0].id, title: '', abstract: '', body: '', draftLink: '' });
    changeTab('submissions');
  };

  return (
    <StaffShell user={user}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f9e9b] to-[#005751] text-white p-8">
          <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <p className="text-xs font-black tracking-widest text-white/70">{t('قسم التنسيق والمتابعة', 'Coordination & Follow-up Section')}</p>
              <h1 className="text-3xl md:text-4xl font-black">{t('بوابة المشاركات وأوراق العمل التنظيمية', 'Participations & Working Papers')}</h1>
              <p className="font-medium text-white/85 leading-relaxed">
                {t('مساحة موحّدة لاستقبال دعوات النشر والمشاركة الإقليمية والدولية، وتوزيع محاورها على الأقسام المختصة، وإعداد الأوراق ومراجعتها واعتمادها قبل الإرسال، مع بنك معرفي للأوراق المعتمدة.',
                  'One place for regional and international calls: route themes to the right departments, draft, review and approve papers before sending, and keep a knowledge bank of approved papers.')}
              </p>
            </div>
            <Button onClick={() => startSubmission()} className="bg-white text-[#005751] hover:bg-white/90 font-black h-12 px-6 rounded-2xl gap-2">
              <FilePen size={18} />{t('ابدأ ورقة جديدة', 'Start a new paper')}
            </Button>
          </div>
          {kpis && (
            <dl className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <HeroStat label={t('دعوات مفتوحة', 'Open calls')} value={papers.calls.filter(c => callState(c) !== 'closed').length} />
              <HeroStat label={t('مشاركات مقدّمة', 'Papers submitted')} value={kpis.submissions} />
              <HeroStat label={t('أقسام مشاركة', 'Departments taking part')} value={kpis.departments} />
              <HeroStat label={t('أوراق في البنك المعرفي', 'Papers in the bank')} value={papers.repository.length} />
            </dl>
          )}
        </header>

        <Tabs value={tab} onValueChange={changeTab} dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
          <TabsList className="h-auto flex flex-wrap justify-start gap-1 bg-white ring-1 ring-slate-100 rounded-2xl p-1.5">
            {([
              ['calls', Megaphone, t('الدعوات والإعلانات', 'Calls')],
              ['themes', Layers, t('مصفوفة المحاور', 'Themes matrix')],
              ['repository', Library, t('البنك المعرفي', 'Knowledge bank')],
              ['submissions', ClipboardList, t('التقديم والاعتماد', 'Submit & approve')],
              ['guide', BookOpen, t('دليل الكتابة', 'Writing guide')],
              ['kpis', Gauge, t('المؤشرات ومراحل التنفيذ', 'KPIs & phases')],
            ] as const).map(([id, Icon, label]) => (
              <TabsTrigger key={id} value={id} className="h-10 px-4 rounded-xl font-black gap-2 data-[state=active]:bg-[#0f9e9b] data-[state=active]:text-white">
                <Icon size={16} aria-hidden />{label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="calls">
            <CallsTab calls={papers.calls} isAr={isAr} t={t} reviewer={reviewer} user={user}
              onApply={startSubmission}
              onAdd={c => persist('calls', [c, ...papers.calls], t('أُضيفت الدعوة', 'Call added'))} />
          </TabsContent>

          <TabsContent value="themes">
            <ThemesTab submissions={papers.submissions} t={t} onApply={themeId => startSubmission(undefined, themeId)} />
          </TabsContent>

          <TabsContent value="repository">
            <RepositoryTab repository={papers.repository} t={t} reviewer={reviewer}
              onAdd={r => persist('repository', [r, ...papers.repository], t('أُضيفت الورقة إلى البنك المعرفي', 'Paper added to the bank'))} />
          </TabsContent>

          <TabsContent value="submissions">
            <SubmissionsTab papers={papers} user={user} reviewer={reviewer} isAr={isAr} t={t}
              editing={editing} setEditing={setEditing}
              onSave={list => persist('submissions', list, t('تم الحفظ', 'Saved'))}
              onBank={r => persist('repository', [r, ...papers.repository], t('أُضيفت الورقة إلى البنك المعرفي', 'Paper added to the bank'))} />
          </TabsContent>

          <TabsContent value="guide"><GuideTab t={t} /></TabsContent>

          <TabsContent value="kpis">{kpis && <KpisTab kpis={kpis} t={t} />}</TabsContent>
        </Tabs>
      </div>
    </StaffShell>
  );
}

type T = (ar: string, en: string) => string;

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
      <dt className="text-xs font-bold text-white/70">{label}</dt>
      <dd className="text-2xl font-black">{value.toLocaleString('en')}</dd>
    </div>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm p-6', className)}>{children}</div>;
}

const fieldCls = 'w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold';

/* ─────────────── Calls ─────────────── */

function CallsTab({ calls, isAr, t, reviewer, user, onApply, onAdd }: {
  calls: PaperCall[]; isAr: boolean; t: T; reviewer: boolean; user: StaffUser;
  onApply: (callId: string) => void; onAdd: (c: PaperCall) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', organizer: '', description: '', wordsMin: '', wordsMax: '', eoiDeadline: '', submissionDeadline: '', link: '' });

  const submit = async () => {
    if (!form.title.trim() || !form.organizer.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.submissionDeadline)) return;
    const ok = await onAdd({
      id: newId('call'), title: form.title.trim(), organizer: form.organizer.trim(), description: form.description.trim(),
      wordsMin: Number(form.wordsMin) || undefined, wordsMax: Number(form.wordsMax) || undefined,
      assets: [], eoiDeadline: form.eoiDeadline || undefined, submissionDeadline: form.submissionDeadline,
      link: /^https?:\/\//.test(form.link) ? form.link : undefined, themeIds: THEMES.map(x => x.id),
      createdAt: new Date().toISOString(), createdBy: user.id,
    });
    if (ok) { setAdding(false); setForm({ title: '', organizer: '', description: '', wordsMin: '', wordsMax: '', eoiDeadline: '', submissionDeadline: '', link: '' }); }
  };

  return (
    <div className="space-y-5">
      {reviewer && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setAdding(a => !a)} className="rounded-xl font-black gap-2"><Plus size={16} />{t('إضافة دعوة', 'Add a call')}</Button>
        </div>
      )}
      {adding && (
        <Card className="grid gap-3 md:grid-cols-2">
          <Labeled label={t('عنوان الدعوة', 'Call title')}><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Labeled>
          <Labeled label={t('الجهة الداعية', 'Organiser')}><Input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} /></Labeled>
          <Labeled label={t('الوصف والمتطلبات', 'Description & requirements')} className="md:col-span-2"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Labeled>
          <Labeled label={t('أقل عدد كلمات', 'Min words')}><Input type="number" min={0} value={form.wordsMin} onChange={e => setForm({ ...form, wordsMin: e.target.value })} /></Labeled>
          <Labeled label={t('أقصى عدد كلمات', 'Max words')}><Input type="number" min={0} value={form.wordsMax} onChange={e => setForm({ ...form, wordsMax: e.target.value })} /></Labeled>
          <Labeled label={t('آخر موعد لإبداء الاهتمام', 'Expression of interest by')}><Input type="date" value={form.eoiDeadline} onChange={e => setForm({ ...form, eoiDeadline: e.target.value })} /></Labeled>
          <Labeled label={t('الموعد النهائي للتقديم', 'Submission deadline')}><Input type="date" required value={form.submissionDeadline} onChange={e => setForm({ ...form, submissionDeadline: e.target.value })} /></Labeled>
          <Labeled label={t('رابط الدعوة (اختياري)', 'Call link (optional)')} className="md:col-span-2"><Input dir="ltr" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://" /></Labeled>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>{t('إلغاء', 'Cancel')}</Button>
            <Button onClick={submit} className="font-black gap-2"><Save size={16} />{t('حفظ الدعوة', 'Save call')}</Button>
          </div>
        </Card>
      )}

      {calls.map(c => {
        const state = callState(c);
        const left = daysUntil(c.submissionDeadline);
        return (
          <Card key={c.id} className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-black text-[#0f9e9b]">{c.organizer}</p>
                <h2 className="text-2xl font-black text-slate-800">{c.title}</h2>
                {c.description && <p className="text-slate-600 font-medium leading-relaxed max-w-3xl">{c.description}</p>}
              </div>
              <span className={cn('px-3 py-1 rounded-full text-xs font-black',
                state === 'closed' ? 'bg-slate-100 text-slate-600' : state === 'soon' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>
                {state === 'closed' ? t('انتهى موعد التقديم', 'Closed') : state === 'soon' ? t(`يُغلق خلال ${left} يوم`, `Closes in ${left} days`) : t(`مفتوحة · متبقٍ ${left} يوم`, `Open · ${left} days left`)}
              </span>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {c.wordsMin || c.wordsMax ? <Fact icon={FileText} label={t('عدد الكلمات', 'Length')} value={`${c.wordsMin?.toLocaleString('en') ?? '—'} – ${c.wordsMax?.toLocaleString('en') ?? '—'} ${t('كلمة', 'words')}`} /> : null}
              {c.style && <Fact icon={Target} label={t('أسلوب الكتابة', 'Style')} value={c.style} />}
              {c.eoiDeadline && <Fact icon={CalendarClock} label={t('إبداء الاهتمام', 'Expression of interest')} value={fmtDate(c.eoiDeadline, isAr)} past={daysUntil(c.eoiDeadline) < 0} />}
              <Fact icon={CalendarClock} label={t('الموعد النهائي للتسليم', 'Final submission')} value={fmtDate(c.submissionDeadline, isAr)} past={left < 0} />
            </dl>

            {c.assets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-500">{t('المرفقات المطلوبة:', 'Required visuals:')}</span>
                {c.assets.map(a => <span key={a} className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">{a}</span>)}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs font-bold text-slate-500">
                {state === 'closed'
                  ? t('انتهى الموعد. يمكنك إعداد مسودة للأرشفة أو للدورة القادمة من الدعوة.', 'The deadline has passed. You can still draft for the archive or the next round.')
                  : t('اختر محوراً من مصفوفة المحاور وابدأ المسودة.', 'Pick a theme from the matrix and start your draft.')}
              </p>
              <div className="flex gap-2">
                {c.link && <Button asChild variant="outline" className="rounded-xl font-black gap-2"><a href={c.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />{t('نص الدعوة', 'Call text')}</a></Button>}
                <Button onClick={() => onApply(c.id)} className="rounded-xl font-black gap-2"><FilePen size={16} />{t('إعداد مشاركة', 'Prepare a paper')}</Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Fact({ icon: Icon, label, value, past }: { icon: React.ElementType; label: string; value: string; past?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 flex gap-3">
      <Icon size={18} className="text-[#0f9e9b] shrink-0 mt-0.5" aria-hidden />
      <div>
        <dt className="text-xs font-bold text-slate-500">{label}</dt>
        <dd className={cn('font-black text-slate-800', past && 'line-through decoration-slate-400 text-slate-500')}>{value}</dd>
      </div>
    </div>
  );
}

function Labeled({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={cn('space-y-1.5 block', className)}><span className="text-xs font-black text-slate-600">{label}</span>{children}</label>;
}

/* ─────────────── Themes ─────────────── */

function ThemesTab({ submissions, t, onApply }: { submissions: PaperSubmission[]; t: T; onApply: (themeId: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-slate-600 font-medium">{t('توزيع محاور الكتابة على الأقسام المسؤولة عن المحتوى، لضمان دقة المعلومات وتكامل الأدوار.', 'Each writing theme is owned by the departments responsible for its content.')}</p>
      <div className="overflow-x-auto rounded-3xl ring-1 ring-slate-100 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('مصفوفة المحاور والأقسام المسؤولة', 'Themes and responsible departments')}</caption>
          <thead className="bg-slate-50 text-slate-500 text-xs font-black">
            <tr>
              <th scope="col" className="p-4 text-start">{t('المحور', 'Theme')}</th>
              <th scope="col" className="p-4 text-start">{t('تفاصيل المحتوى', 'Content')}</th>
              <th scope="col" className="p-4 text-start">{t('الأقسام المسؤولة', 'Responsible departments')}</th>
              <th scope="col" className="p-4 text-start">{t('المشاركات', 'Papers')}</th>
              <th scope="col" className="p-4"><span className="sr-only">{t('إجراء', 'Action')}</span></th>
            </tr>
          </thead>
          <tbody>
            {THEMES.map(th => {
              const Icon = (Icons as unknown as Record<string, React.ElementType>)[th.icon] || Layers;
              const count = submissions.filter(s => s.themeId === th.id).length;
              return (
                <tr key={th.id} className="border-t align-top">
                  <th scope="row" className="p-4 text-start">
                    <span className="flex items-center gap-3 font-black text-slate-800">
                      <span className="size-10 rounded-xl bg-[#0f9e9b]/10 text-[#0f9e9b] flex items-center justify-center shrink-0"><Icon size={18} aria-hidden /></span>
                      {th.title}
                    </span>
                  </th>
                  <td className="p-4 text-slate-600 font-medium leading-relaxed">{th.details}</td>
                  <td className="p-4">
                    <ul className="flex flex-wrap gap-1.5">{th.departments.map(d => <li key={d} className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">{d}</li>)}</ul>
                  </td>
                  <td className="p-4 font-black text-slate-800">{count}</td>
                  <td className="p-4"><Button size="sm" variant="outline" onClick={() => onApply(th.id)} className="rounded-xl font-black gap-1.5"><FilePen size={14} />{t('اكتب', 'Write')}</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────── Knowledge bank ─────────────── */

function RepositoryTab({ repository, t, reviewer, onAdd }: { repository: RepoPaper[]; t: T; reviewer: boolean; onAdd: (r: RepoPaper) => Promise<boolean> }) {
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', year: String(new Date().getFullYear()), summary: '', referenceValue: '', tags: '', link: '', themeId: THEMES[0].id });
  const list = repository.filter(r =>
    (!theme || r.themeIds.includes(theme)) &&
    (!q.trim() || `${r.title} ${r.summary} ${r.referenceValue} ${r.tags.join(' ')} ${r.department}`.includes(q.trim())));

  const submit = async () => {
    if (!form.title.trim() || !form.department.trim()) return;
    const ok = await onAdd({
      id: newId('repo'), title: form.title.trim(), department: form.department.trim(), year: Number(form.year) || new Date().getFullYear(),
      summary: form.summary.trim(), referenceValue: form.referenceValue.trim(), themeIds: [form.themeId],
      tags: form.tags.split(/[،,]/).map(x => x.trim()).filter(Boolean), link: /^https?:\/\//.test(form.link) ? form.link : undefined,
    });
    if (ok) setAdding(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('ابحث في الأوراق المرجعية…', 'Search reference papers…')} aria-label={t('بحث', 'Search')} className="ps-9 rounded-xl" />
        </div>
        <select value={theme} onChange={e => setTheme(e.target.value)} className={cn(fieldCls, 'w-auto')} aria-label={t('المحور', 'Theme')}>
          <option value="">{t('كل المحاور', 'All themes')}</option>
          {THEMES.map(th => <option key={th.id} value={th.id}>{th.title}</option>)}
        </select>
        {reviewer && <Button variant="outline" onClick={() => setAdding(a => !a)} className="rounded-xl font-black gap-2"><Plus size={16} />{t('إضافة ورقة', 'Add paper')}</Button>}
      </div>

      {adding && (
        <Card className="grid gap-3 md:grid-cols-2">
          <Labeled label={t('العنوان', 'Title')} className="md:col-span-2"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Labeled>
          <Labeled label={t('الجهة المعدّة', 'Prepared by')}><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Labeled>
          <Labeled label={t('السنة', 'Year')}><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></Labeled>
          <Labeled label={t('الملخص', 'Summary')} className="md:col-span-2"><Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></Labeled>
          <Labeled label={t('القيمة المرجعية', 'Reference value')} className="md:col-span-2"><Textarea value={form.referenceValue} onChange={e => setForm({ ...form, referenceValue: e.target.value })} /></Labeled>
          <Labeled label={t('المحور', 'Theme')}>
            <select value={form.themeId} onChange={e => setForm({ ...form, themeId: e.target.value })} className={fieldCls}>{THEMES.map(th => <option key={th.id} value={th.id}>{th.title}</option>)}</select>
          </Labeled>
          <Labeled label={t('الوسوم (مفصولة بفاصلة)', 'Tags (comma separated)')}><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></Labeled>
          <Labeled label={t('رابط الملف (اختياري)', 'File link (optional)')} className="md:col-span-2"><Input dir="ltr" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://" /></Labeled>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>{t('إلغاء', 'Cancel')}</Button>
            <Button onClick={submit} className="font-black gap-2"><Save size={16} />{t('حفظ', 'Save')}</Button>
          </div>
        </Card>
      )}

      {list.length === 0 && <p className="text-center text-slate-500 font-bold py-10">{t('لا توجد أوراق مطابقة', 'No matching papers')}</p>}
      {list.map(r => (
        <Card key={r.id} className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-500">{r.department} · {r.year}</p>
              <h3 className="text-xl font-black text-slate-800 leading-snug">{r.title}</h3>
            </div>
            {r.link && <Button asChild size="sm" variant="outline" className="rounded-xl font-black gap-1.5"><a href={r.link} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />{t('فتح الورقة', 'Open paper')}</a></Button>}
          </div>
          {r.summary && <p className="text-slate-600 font-medium leading-relaxed">{r.summary}</p>}
          {r.referenceValue && (
            <div className="rounded-2xl bg-[#0f9e9b]/5 ring-1 ring-[#0f9e9b]/15 p-4">
              <p className="text-xs font-black text-[#005751] mb-1">{t('القيمة المرجعية', 'Why use it as a reference')}</p>
              <p className="text-slate-700 font-medium leading-relaxed">{r.referenceValue}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {r.themeIds.map(id => <span key={id} className="px-2.5 py-1 rounded-full bg-[#0f9e9b]/10 text-[#005751] text-xs font-black">{THEMES.find(x => x.id === id)?.title}</span>)}
            {r.tags.map(tag => <span key={tag} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">#{tag}</span>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Submission & approval workflow ─────────────── */

const FLOW: SubmissionStatus[] = ['draft', 'review', 'approved', 'sent', 'accepted'];

function SubmissionsTab({ papers, user, reviewer, isAr, t, editing, setEditing, onSave, onBank }: {
  papers: PapersData; user: StaffUser; reviewer: boolean; isAr: boolean; t: T;
  editing: Partial<PaperSubmission> | null; setEditing: (s: Partial<PaperSubmission> | null) => void;
  onSave: (list: PaperSubmission[]) => Promise<boolean>; onBank: (r: RepoPaper) => Promise<boolean>;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const mine = papers.submissions.filter(s => s.authorId === user.id);
  const queue = reviewer ? papers.submissions.filter(s => s.authorId !== user.id && ['review', 'approved', 'sent'].includes(s.status)) : [];
  const author = isAr ? user.nameAr : user.nameEn || user.nameAr;

  const event = (action: SubmissionEvent['action'], note?: string): SubmissionEvent =>
    ({ at: new Date().toISOString(), byId: user.id, byName: author, action, ...(note ? { note } : {}) });

  const saveDraft = async (send: boolean) => {
    const e = editing!;
    if (!e.title?.trim() || !e.callId || !e.themeId) return;
    const now = new Date().toISOString();
    const words = countWords(e.body || '');
    const prev = papers.submissions.find(s => s.id === e.id);
    const status: SubmissionStatus = send ? 'review' : prev?.status === 'changes' ? 'changes' : 'draft';
    const next: PaperSubmission = {
      id: prev?.id || newId('paper'), callId: e.callId, themeId: e.themeId, title: e.title.trim(),
      abstract: (e.abstract || '').trim(), body: e.body || '', draftLink: /^https?:\/\//.test(e.draftLink || '') ? e.draftLink : undefined,
      wordCount: words, authorId: user.id, authorName: author, department: user.department,
      status, history: [...(prev?.history || []), event(send ? 'review' : 'draft')],
      createdAt: prev?.createdAt || now, updatedAt: now, submittedAt: prev?.submittedAt || (send ? now : undefined),
    };
    const list = prev ? papers.submissions.map(s => (s.id === prev.id ? next : s)) : [next, ...papers.submissions];
    if (await onSave(list)) setEditing(null);
  };

  const move = async (s: PaperSubmission, status: SubmissionStatus) => {
    const note = notes[s.id]?.trim();
    if (status === 'changes' && !note) return;
    const list = papers.submissions.map(x => (x.id === s.id ? { ...x, status, updatedAt: new Date().toISOString(), history: [...x.history, event(status, note)] } : x));
    if (await onSave(list)) setNotes(n => ({ ...n, [s.id]: '' }));
  };

  return (
    <div className="space-y-8">
      <FlowStrip t={t} />

      {editing && <Editor papers={papers} editing={editing} setEditing={setEditing} onSave={saveDraft} t={t} isAr={isAr} />}

      <section aria-labelledby="mine-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="mine-title" className="text-lg font-black text-slate-800">{t('مشاركاتي', 'My papers')}</h2>
          {!editing && <Button onClick={() => setEditing({ callId: papers.calls[0]?.id, themeId: THEMES[0].id, title: '', abstract: '', body: '' })} className="rounded-xl font-black gap-2"><Plus size={16} />{t('ورقة جديدة', 'New paper')}</Button>}
        </div>
        {mine.length === 0 && <p className="text-slate-500 font-bold py-6">{t('لم تبدأ أي ورقة بعد. ابدأ من دعوة أو من مصفوفة المحاور.', 'No papers yet. Start from a call or the themes matrix.')}</p>}
        {mine.map(s => (
          <SubmissionCard key={s.id} s={s} papers={papers} t={t} isAr={isAr}>
            {(s.status === 'draft' || s.status === 'changes') && (
              <Button size="sm" variant="outline" onClick={() => setEditing(s)} className="rounded-xl font-black gap-1.5"><FilePen size={14} />{t('تعديل', 'Edit')}</Button>
            )}
          </SubmissionCard>
        ))}
      </section>

      {reviewer && (
        <section aria-labelledby="queue-title" className="space-y-3">
          <h2 id="queue-title" className="text-lg font-black text-slate-800 flex items-center gap-2"><Users size={18} className="text-[#0f9e9b]" aria-hidden />{t('المراجعة والاعتماد', 'Review & approval')}</h2>
          {queue.length === 0 && <p className="text-slate-500 font-bold py-6">{t('لا توجد أوراق بانتظار إجراء', 'Nothing waiting for action')}</p>}
          {queue.map(s => (
            <SubmissionCard key={s.id} s={s} papers={papers} t={t} isAr={isAr}>
              <div className="w-full space-y-2">
                <Textarea value={notes[s.id] || ''} onChange={e => setNotes(n => ({ ...n, [s.id]: e.target.value }))}
                  placeholder={t('ملاحظات المراجعة (مطلوبة عند طلب التعديل)', 'Review notes (required to request changes)')} className="min-h-[70px]" aria-label={t('ملاحظات المراجعة', 'Review notes')} />
                <div className="flex flex-wrap gap-2 justify-end">
                  {s.status === 'review' && <>
                    <Button size="sm" variant="outline" disabled={!notes[s.id]?.trim()} onClick={() => move(s, 'changes')} className="rounded-xl font-black gap-1.5"><FilePen size={14} />{t('طلب تعديلات', 'Request changes')}</Button>
                    <Button size="sm" onClick={() => move(s, 'approved')} className="rounded-xl font-black gap-1.5 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 size={14} />{t('اعتماد', 'Approve')}</Button>
                  </>}
                  {s.status === 'approved' && <Button size="sm" onClick={() => move(s, 'sent')} className="rounded-xl font-black gap-1.5"><Send size={14} className={cn(isAr && '-scale-x-100')} />{t('تسجيل الإرسال للجهة الداعية', 'Mark as sent')}</Button>}
                  {s.status === 'sent' && <>
                    <Button size="sm" variant="outline" onClick={() => move(s, 'rejected')} className="rounded-xl font-black gap-1.5"><XCircle size={14} />{t('لم تُقبل', 'Not accepted')}</Button>
                    <Button size="sm" onClick={async () => {
                      await move(s, 'accepted');
                      await onBank({ id: newId('repo'), title: s.title, department: s.department || s.authorName, year: new Date().getFullYear(), summary: s.abstract, referenceValue: '', themeIds: [s.themeId], tags: [], link: s.draftLink });
                    }} className="rounded-xl font-black gap-1.5 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 size={14} />{t('قُبلت ونُشرت (إضافة للبنك)', 'Accepted (add to bank)')}</Button>
                  </>}
                </div>
              </div>
            </SubmissionCard>
          ))}
        </section>
      )}
      {!reviewer && (
        <p className="text-xs font-bold text-slate-500">{t('تتم المراجعة والاعتماد من قسم التنسيق والمتابعة قبل الإرسال للجهة الداعية.', 'Papers are reviewed and approved by the Coordination & Follow-up Section before sending.')}</p>
      )}
    </div>
  );
}

type SubmissionEvent = PaperSubmission['history'][number];

function FlowStrip({ t }: { t: T }) {
  const steps = [
    [t('رفع المسودة', 'Upload draft'), t('المعد وفق دليل الكتابة', 'Author, following the guide')],
    [t('المراجعة', 'Review'), t('قسم التنسيق والمتابعة', 'Coordination & Follow-up')],
    [t('الاعتماد', 'Approval'), t('بعد استيفاء الملاحظات', 'Once comments are resolved')],
    [t('الإرسال', 'Send'), t('للجهة الداعية قبل الموعد', 'To the organiser, before the deadline')],
    [t('القبول والأرشفة', 'Acceptance & archive'), t('تُضاف للبنك المعرفي', 'Added to the knowledge bank')],
  ];
  return (
    <ol className="grid gap-2 sm:grid-cols-5" aria-label={t('مسار الاعتماد', 'Approval path')}>
      {steps.map(([a, b], i) => (
        <li key={a} className="rounded-2xl bg-white ring-1 ring-slate-100 p-4 flex gap-3">
          <span className="size-8 rounded-full bg-[#0f9e9b] text-white font-black flex items-center justify-center shrink-0">{i + 1}</span>
          <span><span className="block font-black text-slate-800 text-sm">{a}</span><span className="block text-xs font-bold text-slate-500">{b}</span></span>
        </li>
      ))}
    </ol>
  );
}

function Editor({ papers, editing, setEditing, onSave, t, isAr }: {
  papers: PapersData; editing: Partial<PaperSubmission>; setEditing: (s: Partial<PaperSubmission> | null) => void;
  onSave: (send: boolean) => Promise<void>; t: T; isAr: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const call = papers.calls.find(c => c.id === editing.callId);
  const words = countWords(editing.body || '');
  const min = call?.wordsMin, max = call?.wordsMax;
  const inRange = (!min || words >= min) && (!max || words <= max);
  const pct = max ? Math.min(100, Math.round((words / max) * 100)) : 0;
  const lastNote = [...(editing.history || [])].reverse().find(h => h.action === 'changes')?.note;
  const valid = !!editing.title?.trim() && (!!editing.body?.trim() || !!editing.draftLink?.trim());
  const run = async (send: boolean) => { setBusy(true); try { await onSave(send); } finally { setBusy(false); } };

  return (
    <Card className="space-y-4 ring-2 ring-[#0f9e9b]/30">
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><FilePen size={18} className="text-[#0f9e9b]" aria-hidden />{editing.id ? t('تعديل المشاركة', 'Edit paper') : t('مشاركة جديدة', 'New paper')}</h2>
      {lastNote && editing.status === 'changes' && (
        <p className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-3 text-sm font-bold text-amber-900">{t('ملاحظات المراجع:', 'Reviewer notes:')} {lastNote}</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Labeled label={t('الدعوة', 'Call')}>
          <select value={editing.callId} onChange={e => setEditing({ ...editing, callId: e.target.value })} className={fieldCls}>
            {papers.calls.map(c => <option key={c.id} value={c.id}>{c.title}{callState(c) === 'closed' ? ` (${t('مغلقة', 'closed')})` : ''}</option>)}
          </select>
        </Labeled>
        <Labeled label={t('المحور', 'Theme')}>
          <select value={editing.themeId} onChange={e => setEditing({ ...editing, themeId: e.target.value })} className={fieldCls}>
            {THEMES.map(th => <option key={th.id} value={th.id}>{th.title} — {th.departments.join('، ')}</option>)}
          </select>
        </Labeled>
        <Labeled label={t('عنوان الورقة', 'Paper title')} className="md:col-span-2"><Input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} /></Labeled>
        <Labeled label={t('الملخص التنفيذي', 'Executive summary')} className="md:col-span-2">
          <Textarea value={editing.abstract || ''} onChange={e => setEditing({ ...editing, abstract: e.target.value })} className="min-h-[80px]" />
        </Labeled>
        <Labeled label={t('نص المسودة', 'Draft text')} className="md:col-span-2">
          <Textarea value={editing.body || ''} onChange={e => setEditing({ ...editing, body: e.target.value })} className="min-h-[260px] leading-relaxed" />
        </Labeled>
      </div>
      <div className="space-y-1.5" aria-live="polite">
        <div className="flex justify-between text-xs font-black">
          <span className={inRange ? 'text-emerald-700' : 'text-amber-700'}>
            {words.toLocaleString('en')} {t('كلمة', 'words')}
            {(min || max) && ` · ${t('المطلوب', 'required')} ${min?.toLocaleString('en') ?? 0}–${max?.toLocaleString('en') ?? '∞'}`}
          </span>
          {!inRange && words > 0 && <span className="text-amber-700">{max && words > max ? t('تجاوزت الحد الأقصى', 'Over the limit') : t('أقل من الحد الأدنى', 'Below the minimum')}</span>}
        </div>
        {max && <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={cn('h-full rounded-full', inRange ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} /></div>}
      </div>
      <Labeled label={t('رابط ملف المسودة والمرفقات (OneDrive / SharePoint)', 'Draft & visuals link (OneDrive / SharePoint)')}>
        <Input dir="ltr" value={editing.draftLink || ''} onChange={e => setEditing({ ...editing, draftLink: e.target.value })} placeholder="https://" />
      </Labeled>
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>{t('إلغاء', 'Cancel')}</Button>
        <Button variant="outline" onClick={() => run(false)} disabled={busy || !valid} className="rounded-xl font-black gap-2"><Save size={16} />{t('حفظ كمسودة', 'Save draft')}</Button>
        <Button onClick={() => run(true)} disabled={busy || !valid} className="rounded-xl font-black gap-2">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={cn(isAr && '-scale-x-100')} />}{t('إرسال للمراجعة', 'Send for review')}
        </Button>
      </div>
    </Card>
  );
}

function SubmissionCard({ s, papers, t, isAr, children }: { s: PaperSubmission; papers: PapersData; t: T; isAr: boolean; children?: React.ReactNode }) {
  const call = papers.calls.find(c => c.id === s.callId);
  const theme = THEMES.find(x => x.id === s.themeId);
  const st = STATUS[s.status];
  const reached = FLOW.indexOf(s.status === 'changes' ? 'review' : s.status === 'rejected' ? 'sent' : s.status);
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-black text-slate-500">{call?.title} · {theme?.title}</p>
          <h3 className="text-lg font-black text-slate-800">{s.title}</h3>
          <p className="text-xs font-bold text-slate-500">{s.authorName}{s.department && ` · ${s.department}`} · {s.wordCount.toLocaleString('en')} {t('كلمة', 'words')}</p>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-xs font-black', st.tone)}>{isAr ? st.ar : st.en}</span>
      </div>
      <ol className="flex gap-1" aria-label={t('مرحلة الورقة', 'Stage')}>
        {FLOW.map((f, i) => <li key={f} title={isAr ? STATUS[f].ar : STATUS[f].en} className={cn('h-1.5 flex-1 rounded-full', i <= reached ? (s.status === 'rejected' && i === reached ? 'bg-red-400' : 'bg-[#0f9e9b]') : 'bg-slate-100')} />)}
      </ol>
      {s.abstract && <p className="text-sm text-slate-600 font-medium leading-relaxed">{s.abstract}</p>}
      {s.draftLink && <a href={s.draftLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-black text-[#0f9e9b] hover:underline"><ExternalLink size={14} />{t('ملف المسودة', 'Draft file')}</a>}
      <details className="text-xs">
        <summary className="cursor-pointer font-black text-slate-500">{t('سجل الإجراءات', 'History')} ({s.history.length})</summary>
        <ol className="mt-2 space-y-1.5 border-s-2 border-slate-100 ps-3">
          {s.history.map((h, i) => (
            <li key={i} className="font-bold text-slate-600">
              <span className="text-slate-400" dir="ltr">{new Date(h.at).toLocaleString(isAr ? 'ar-OM' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              {' · '}{h.byName} · {h.action === 'note' ? t('ملاحظة', 'Note') : isAr ? STATUS[h.action].ar : STATUS[h.action].en}
              {h.note && <span className="block text-slate-500 font-medium">“{h.note}”</span>}
            </li>
          ))}
        </ol>
      </details>
      {children && <div className="flex flex-wrap gap-2 justify-end border-t pt-3">{children}</div>}
    </Card>
  );
}

/* ─────────────── Writing guide ─────────────── */

function GuideTab({ t }: { t: T }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {WRITING_GUIDE.map((g, i) => (
        <Card key={g.title} className="space-y-3">
          <h2 className="font-black text-slate-800 flex items-center gap-2"><span className="size-7 rounded-lg bg-[#0f9e9b]/10 text-[#0f9e9b] text-sm flex items-center justify-center">{i + 1}</span>{g.title}</h2>
          <ul className="space-y-2">{g.points.map(p => <li key={p} className="flex gap-2 text-sm font-medium text-slate-600 leading-relaxed"><CheckCircle2 size={16} className="text-[#0f9e9b] shrink-0 mt-0.5" aria-hidden />{p}</li>)}</ul>
        </Card>
      ))}
      <p className="md:col-span-2 text-xs font-bold text-slate-500">{t('يُرجع إلى الورقة المرجعية «صلالة الكبرى 2040» في البنك المعرفي كنموذج للصياغة.', 'See the “Greater Salalah 2040” paper in the knowledge bank as a model.')}</p>
    </div>
  );
}

/* ─────────────── KPIs & phases ─────────────── */

function KpisTab({ kpis, t }: { kpis: ReturnType<typeof paperKpis>; t: T }) {
  const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
  const phases = [
    { title: t('المرحلة الأولى: التأسيس', 'Phase 1: Set-up'), items: [t('إطلاق البوابة ضمن بوابة الموظفين', 'Launch inside the staff portal'), t('اعتماد مصفوفة المحاور والأقسام المسؤولة', 'Adopt the themes matrix and owners'), t('نشر دليل الكتابة والورقة المرجعية', 'Publish the writing guide and reference paper')] },
    { title: t('المرحلة الثانية: التشغيل', 'Phase 2: Operation'), items: [t('نشر الدعوات فور ورودها وتوزيعها على الأقسام', 'Post calls as they arrive and route them'), t('استقبال المسودات ومراجعتها واعتمادها', 'Receive, review and approve drafts'), t('الإرسال قبل المواعيد النهائية', 'Send before deadlines')] },
    { title: t('المرحلة الثالثة: الاستدامة', 'Phase 3: Sustain'), items: [t('بناء البنك المعرفي من الأوراق المقبولة', 'Grow the knowledge bank from accepted papers'), t('قياس المؤشرات وتقرير دوري للإدارة', 'Measure KPIs and report periodically'), t('توسيع الشراكات مع شبكات المدن الإقليمية والدولية', 'Widen city-network partnerships')] },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard icon={Users} title={t('معدل المشاركة', 'Participation rate')} value={kpis.submissions.toLocaleString('en')}
          note={t(`ورقة مقدّمة من ${kpis.authors} موظف و${kpis.departments} قسم`, `papers from ${kpis.authors} staff in ${kpis.departments} departments`)} />
        <KpiCard icon={CalendarClock} title={t('الالتزام بالمواعيد', 'Timeliness')} value={pct(kpis.onTimeRate)}
          note={kpis.avgDaysBeforeDeadline === null ? t('لا توجد بيانات بعد', 'No data yet') : t(`متوسط ${kpis.avgDaysBeforeDeadline} يوم قبل الموعد النهائي`, `on average ${kpis.avgDaysBeforeDeadline} days before the deadline`)} />
        <KpiCard icon={CheckCircle2} title={t('نسبة القبول', 'Acceptance rate')} value={pct(kpis.acceptanceRate)}
          note={t(`${kpis.approved} ورقة معتمدة داخلياً`, `${kpis.approved} approved internally`)} />
      </div>
      <p className="text-xs font-bold text-slate-500">{t('تُحسب المؤشرات تلقائياً من المشاركات: الالتزام = الأوراق المرسلة للمراجعة قبل الموعد النهائي للدعوة، والقبول = المقبولة من الأوراق التي صدر فيها قرار الجهة الداعية.',
        'Computed from the papers: timeliness = sent for review before the call deadline; acceptance = accepted out of papers with an organiser decision.')}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {phases.map(p => (
          <Card key={p.title} className="space-y-3">
            <h3 className="font-black text-slate-800">{p.title}</h3>
            <ul className="space-y-2">{p.items.map(i => <li key={i} className="flex gap-2 text-sm font-medium text-slate-600"><CheckCircle2 size={16} className="text-[#0f9e9b] shrink-0 mt-0.5" aria-hidden />{i}</li>)}</ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, note }: { icon: React.ElementType; title: string; value: string; note: string }) {
  return (
    <Card className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-black text-slate-500"><Icon size={16} className="text-[#0f9e9b]" aria-hidden />{title}</p>
      <p className="text-4xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-bold text-slate-500">{note}</p>
    </Card>
  );
}
