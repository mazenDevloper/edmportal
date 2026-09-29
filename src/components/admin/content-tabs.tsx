'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  NewsItem, MenuItem, CarouselItem, PopupMessage, SiteConfig, Survey, CustomPage,
  ServiceApplication, Service, ServiceFlow, ServiceRole, StaffUser, UserRoleAssignment,
} from '@/lib/types';
import { classifyActor, getStageAssignees } from '@/lib/rbac';
import { CollectionEditor } from './collection-editor';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, ExternalLink, Download, Upload, RefreshCw, Loader2, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { DEFAULT_FIGURES, FIGURE_LABELS, FigureKey } from '@/lib/open-data/official-figures';
import { cn } from '@/lib/utils';

const uid = (prefix: string) => `${prefix}_${Date.now()}`;
const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '—');

// ─── News ───
export function NewsTab({ isAr, news, setNews }: { isAr: boolean; news: NewsItem[]; setNews: (v: NewsItem[]) => void }) {
  return (
    <CollectionEditor
      isAr={isAr} items={news} onChange={setNews}
      newItem={() => ({ id: uid('n'), titleAr: '', titleEn: '', contentAr: '', contentEn: '', imageUrl: '', createdAt: new Date().toISOString() })}
      titleOf={n => (isAr ? n.titleAr : n.titleEn || n.titleAr)}
      subtitleOf={n => fmtDate(n.createdAt)}
      addLabel={isAr ? 'خبر جديد' : 'New article'}
      fields={[
        { key: 'titleAr', label: isAr ? 'العنوان (عربي)' : 'Title (AR)', dir: 'rtl' },
        { key: 'titleEn', label: isAr ? 'العنوان (إنجليزي)' : 'Title (EN)', dir: 'ltr' },
        { key: 'contentAr', label: isAr ? 'المحتوى (عربي)' : 'Content (AR)', type: 'textarea', dir: 'rtl' },
        { key: 'contentEn', label: isAr ? 'المحتوى (إنجليزي)' : 'Content (EN)', type: 'textarea', dir: 'ltr' },
        { key: 'imageUrl', label: isAr ? 'رابط الصورة' : 'Image URL', type: 'image', wide: true },
      ]}
    />
  );
}

// ─── Applications ───
const STATUS: Record<ServiceApplication['status'], { ar: string; en: string; cls: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending', cls: 'bg-amber-500' },
  'in-review': { ar: 'قيد المراجعة', en: 'In review', cls: 'bg-blue-500' },
  approved: { ar: 'معتمد', en: 'Approved', cls: 'bg-emerald-500' },
  rejected: { ar: 'مرفوض', en: 'Rejected', cls: 'bg-red-500' },
};

export function ApplicationsTab({ isAr, applications, setApplications, flows, staffUsers, serviceRoles, roleAssignments }: {
  isAr: boolean; applications: ServiceApplication[]; setApplications: (v: ServiceApplication[]) => void;
  flows: ServiceFlow[]; staffUsers: StaffUser[]; serviceRoles: ServiceRole[]; roleAssignments: UserRoleAssignment[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ServiceApplication['status']>('all');
  const accessData = { staffUsers, serviceRoles, roleAssignments };
  const visible = applications.filter(a => filter === 'all' || a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-[2rem] shadow-sm">
        {(['all', 'pending', 'in-review', 'approved', 'rejected'] as const).map(s => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)} className="rounded-full font-black">
            {s === 'all' ? (isAr ? 'الكل' : 'All') : isAr ? STATUS[s].ar : STATUS[s].en}
            <Badge variant="secondary" className="ms-2">{s === 'all' ? applications.length : applications.filter(a => a.status === s).length}</Badge>
          </Button>
        ))}
      </div>
      <div className="bg-white border rounded-[2rem] overflow-x-auto shadow-xl">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow>
            <TableHead className="font-black">{isAr ? 'رقم الطلب' : 'Ref'}</TableHead>
            <TableHead className="font-black">{isAr ? 'الخدمة' : 'Service'}</TableHead>
            <TableHead className="font-black">{isAr ? 'المتقدم' : 'Applicant'}</TableHead>
            <TableHead className="font-black">{isAr ? 'التاريخ' : 'Date'}</TableHead>
            <TableHead className="font-black">{isAr ? 'الحالة' : 'Status'}</TableHead>
            <TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">{isAr ? 'لا توجد طلبات' : 'No applications'}</TableCell></TableRow>}
            {visible.map(app => {
              const flow = flows.find(f => f.serviceId === app.serviceId);
              const staffStages = (flow?.processStages || []).filter(s => classifyActor(s) === 'staff');
              const open = openId === app.id;
              return (
                <React.Fragment key={app.id}>
                  <TableRow className="cursor-pointer" onClick={() => setOpenId(open ? null : app.id)}>
                    <TableCell className="font-mono text-xs">{app.id}</TableCell>
                    <TableCell className="font-bold text-sm">{app.serviceName}</TableCell>
                    <TableCell className="text-sm">{app.citizenName}</TableCell>
                    <TableCell className="text-xs">{fmtDate(app.createdAt)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Select value={app.status} onValueChange={v => setApplications(applications.map(a => a.id === app.id ? { ...a, status: v as ServiceApplication['status'] } : a))}>
                        <SelectTrigger className="h-8 w-36 rounded-lg text-xs font-bold"><span className={cn('size-2 rounded-full me-1', STATUS[app.status].cls)} /><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()} className="whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => setOpenId(open ? null : app.id)}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Button>
                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setApplications(applications.filter(a => a.id !== app.id))}><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                      <TableCell colSpan={6} className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isAr ? 'بيانات الطلب' : 'Submitted data'}</p>
                            <div className="space-y-1">
                              {Object.entries(app.data || {}).map(([k, v]) => {
                                const label = flow?.steps.flatMap(s => s.fields).find(f => f.id === k);
                                return <div key={k} className="flex gap-2 text-xs"><span className="font-bold text-slate-500 min-w-[140px]">{label ? (isAr ? label.labelAr : label.labelEn) : k}</span><span className="font-mono">{String(v)}</span></div>;
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isAr ? 'المسؤولون عن المعالجة' : 'Responsible staff'}</p>
                            {staffStages.length === 0 && <p className="text-xs text-slate-400">{isAr ? 'لا توجد مراحل معالجة لهذه الخدمة' : 'No processing stages for this service'}</p>}
                            {staffStages.map(s => {
                              const users = getStageAssignees(accessData, s);
                              return (
                                <div key={s.order} className="text-xs mb-2">
                                  <span className="font-black text-primary">{s.order}. {isAr ? s.actorAr : s.actorEn}</span>
                                  <span className="text-slate-500"> — {isAr ? s.titleAr : s.titleEn}</span>
                                  <div className="mt-1">{users.length ? users.map(u => <Badge key={u.id} variant="outline" className="me-1 font-mono">{u.employeeNumber}</Badge>) : <span className="text-amber-600 font-bold">{isAr ? 'غير مسند' : 'Unassigned'}</span>}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Pages ───
export function PagesTab({ isAr, pages, setPages }: { isAr: boolean; pages: CustomPage[]; setPages: (v: CustomPage[]) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end bg-white p-4 rounded-[2rem] shadow-sm">
        <Button asChild className="dm-gradient-primary rounded-full px-6 font-black gap-2"><Link href="/pagebuild"><Plus size={16} />{isAr ? 'صفحة جديدة' : 'New page'}</Link></Button>
      </div>
      <div className="bg-white border rounded-[2rem] overflow-x-auto shadow-xl">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow>
            <TableHead className="font-black">{isAr ? 'الصفحة' : 'Page'}</TableHead>
            <TableHead className="font-black">{isAr ? 'الرابط' : 'Slug'}</TableHead>
            <TableHead className="font-black text-center">{isAr ? 'المكونات' : 'Blocks'}</TableHead>
            <TableHead className="font-black">{isAr ? 'التاريخ' : 'Created'}</TableHead>
            <TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {pages.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-bold">{isAr ? p.titleAr : p.titleEn || p.titleAr}</TableCell>
                <TableCell><Link href={`/p/${p.slug}`} target="_blank" className="font-mono text-xs text-primary hover:underline flex items-center gap-1">/p/{p.slug}<ExternalLink size={12} /></Link></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">{p.components.length}</Badge></TableCell>
                <TableCell className="text-xs">{fmtDate(p.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button variant="ghost" size="icon" asChild className="text-primary"><Link href={`/pagebuild?id=${p.id}`}><Edit2 size={16} /></Link></Button>
                  <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setPages(pages.filter(x => x.id !== p.id))}><Trash2 size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Navigation menu ───
export function MenuTab({ isAr, items, setItems }: { isAr: boolean; items: MenuItem[]; setItems: (v: MenuItem[]) => void }) {
  return (
    <CollectionEditor
      isAr={isAr} sortable items={items}
      onChange={next => setItems(next.map((m, i) => ({ ...m, order: i })))}
      newItem={() => ({ id: uid('m'), labelAr: '', labelEn: '', link: '/', order: 0 })}
      titleOf={m => (isAr ? m.labelAr : m.labelEn || m.labelAr)}
      subtitleOf={m => <span dir="ltr">{m.link}</span>}
      addLabel={isAr ? 'رابط جديد' : 'New link'}
      fields={[
        { key: 'labelAr', label: isAr ? 'النص (عربي)' : 'Label (AR)', dir: 'rtl' },
        { key: 'labelEn', label: isAr ? 'النص (إنجليزي)' : 'Label (EN)', dir: 'ltr' },
        { key: 'link', label: isAr ? 'الرابط' : 'Link', wide: true, dir: 'ltr' },
      ]}
    />
  );
}

// ─── Branding / site identity ───
export function BrandingTab({ isAr, siteConfig, setSiteConfig }: { isAr: boolean; siteConfig: SiteConfig | null; setSiteConfig: (v: SiteConfig) => void }) {
  const cfg: SiteConfig = siteConfig || { heroTitle: '', heroSubtitle: '', contactPhone: '', contactEmail: '', categories: [], isMaintenanceMode: false };
  const set = (patch: Partial<SiteConfig>) => setSiteConfig({ ...cfg, ...patch });
  const stats = cfg.stats || {};
  const meta = cfg.meta || { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '' };

  const field = (label: string, value: string, onChange: (v: string) => void, dir?: 'ltr' | 'rtl') => (
    <div className="space-y-1"><Label className="text-xs font-bold text-slate-500">{label}</Label><Input value={value} dir={dir} onChange={e => onChange(e.target.value)} className="rounded-xl h-11" /></div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8 space-y-4">
        <h3 className="font-black text-lg">{isAr ? 'الواجهة الرئيسية' : 'Hero'}</h3>
        {field(isAr ? 'العنوان الرئيسي' : 'Hero title', cfg.heroTitle, v => set({ heroTitle: v }))}
        {field(isAr ? 'العنوان الفرعي' : 'Hero subtitle', cfg.heroSubtitle, v => set({ heroSubtitle: v }))}
        <h3 className="font-black text-lg pt-4">{isAr ? 'التواصل' : 'Contact'}</h3>
        <div className="grid grid-cols-2 gap-4">
          {field(isAr ? 'الهاتف' : 'Phone', cfg.contactPhone, v => set({ contactPhone: v }), 'ltr')}
          {field(isAr ? 'البريد الإلكتروني' : 'Email', cfg.contactEmail, v => set({ contactEmail: v }), 'ltr')}
        </div>
      </Card>
      <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8 space-y-4">
        <h3 className="font-black text-lg">{isAr ? 'إحصائيات الصفحة الرئيسية' : 'Home statistics'}</h3>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(FIGURE_LABELS) as FigureKey[]).map(k => (
            <div key={k} className="space-y-1"><Label className="text-xs font-bold text-slate-500">{isAr ? FIGURE_LABELS[k].ar : FIGURE_LABELS[k].en}</Label>
              <Input type="number" min={0} value={stats[k] ?? DEFAULT_FIGURES[k]} onChange={e => set({ stats: { ...stats, [k]: Number(e.target.value) } })} className="rounded-xl h-11" dir="ltr" /></div>
          ))}
          {field(isAr ? 'تاريخ الأرقام (عربي)' : 'Figures as of (AR)', stats.figuresAsOfAr ?? DEFAULT_FIGURES.asOfAr, v => set({ stats: { ...stats, figuresAsOfAr: v } }), 'rtl')}
          {field(isAr ? 'تاريخ الأرقام (إنجليزي)' : 'Figures as of (EN)', stats.figuresAsOfEn ?? DEFAULT_FIGURES.asOfEn, v => set({ stats: { ...stats, figuresAsOfEn: v } }), 'ltr')}
        </div>
        <p className="text-xs font-bold text-slate-500">{isAr ? 'عقود الإيجار وتراخيص الحفر تُحسب مباشرة من واجهات البيانات المفتوحة ولا تحتاج إدخالاً.' : 'Rent contracts and excavation permits are counted live from the open-data APIs; nothing to enter.'}</p>
        <h3 className="font-black text-lg pt-4">{isAr ? 'بيانات SEO' : 'SEO meta'}</h3>
        <div className="grid grid-cols-2 gap-4">
          {field(isAr ? 'عنوان الصفحة (عربي)' : 'Title (AR)', meta.titleAr, v => set({ meta: { ...meta, titleAr: v } }), 'rtl')}
          {field(isAr ? 'عنوان الصفحة (إنجليزي)' : 'Title (EN)', meta.titleEn, v => set({ meta: { ...meta, titleEn: v } }), 'ltr')}
          {field(isAr ? 'الوصف (عربي)' : 'Description (AR)', meta.descriptionAr, v => set({ meta: { ...meta, descriptionAr: v } }), 'rtl')}
          {field(isAr ? 'الوصف (إنجليزي)' : 'Description (EN)', meta.descriptionEn, v => set({ meta: { ...meta, descriptionEn: v } }), 'ltr')}
        </div>
      </Card>
    </div>
  );
}

// ─── Banners ───
export function CarouselTab({ isAr, items, setItems }: { isAr: boolean; items: CarouselItem[]; setItems: (v: CarouselItem[]) => void }) {
  return (
    <CollectionEditor
      isAr={isAr} sortable items={items} onChange={setItems}
      newItem={() => ({ id: uid('c'), titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: '', linkUrl: '' })}
      titleOf={c => (isAr ? c.titleAr : c.titleEn || c.titleAr)}
      subtitleOf={c => (isAr ? c.subtitleAr : c.subtitleEn)}
      addLabel={isAr ? 'بنر جديد' : 'New banner'}
      fields={[
        { key: 'titleAr', label: isAr ? 'العنوان (عربي)' : 'Title (AR)', dir: 'rtl' },
        { key: 'titleEn', label: isAr ? 'العنوان (إنجليزي)' : 'Title (EN)', dir: 'ltr' },
        { key: 'subtitleAr', label: isAr ? 'الوصف (عربي)' : 'Subtitle (AR)', dir: 'rtl' },
        { key: 'subtitleEn', label: isAr ? 'الوصف (إنجليزي)' : 'Subtitle (EN)', dir: 'ltr' },
        { key: 'imageUrl', label: isAr ? 'رابط الصورة' : 'Image URL', type: 'image', wide: true },
        { key: 'linkUrl', label: isAr ? 'رابط عند النقر' : 'Click-through link', wide: true, dir: 'ltr' },
      ]}
    />
  );
}

// ─── Popups ───
export function PopupsTab({ isAr, items, setItems }: { isAr: boolean; items: PopupMessage[]; setItems: (v: PopupMessage[]) => void }) {
  return (
    <CollectionEditor
      isAr={isAr} items={items} onChange={setItems}
      newItem={(): PopupMessage => ({ id: uid('p'), type: 'text', titleAr: '', titleEn: '', contentAr: '', contentEn: '', mediaUrl: '', isActive: false, displayDelay: 2 })}
      titleOf={p => (isAr ? p.titleAr : p.titleEn || p.titleAr)}
      subtitleOf={p => <>{p.type} · {p.isActive ? <span className="text-emerald-600">{isAr ? 'مفعّلة' : 'active'}</span> : (isAr ? 'متوقفة' : 'inactive')}</>}
      addLabel={isAr ? 'رسالة منبثقة' : 'New popup'}
      fields={[
        { key: 'type', label: isAr ? 'النوع' : 'Type', type: 'select', options: [{ value: 'text', label: isAr ? 'نص' : 'Text' }, { value: 'image', label: isAr ? 'صورة' : 'Image' }, { value: 'video', label: isAr ? 'فيديو' : 'Video' }] },
        { key: 'isActive', label: isAr ? 'مفعّلة (تظهر واحدة فقط)' : 'Active (first active one shows)', type: 'switch' },
        { key: 'titleAr', label: isAr ? 'العنوان (عربي)' : 'Title (AR)', dir: 'rtl' },
        { key: 'titleEn', label: isAr ? 'العنوان (إنجليزي)' : 'Title (EN)', dir: 'ltr' },
        { key: 'contentAr', label: isAr ? 'المحتوى (عربي)' : 'Content (AR)', type: 'textarea', dir: 'rtl' },
        { key: 'contentEn', label: isAr ? 'المحتوى (إنجليزي)' : 'Content (EN)', type: 'textarea', dir: 'ltr' },
        { key: 'mediaUrl', label: isAr ? 'رابط الصورة / الفيديو' : 'Media URL', dir: 'ltr' },
        { key: 'displayDelay', label: isAr ? 'التأخير (ثوانٍ)' : 'Delay (seconds)', type: 'number' },
      ]}
    />
  );
}

// ─── Surveys ───
export function SurveysTab({ isAr, surveys, setSurveys }: { isAr: boolean; surveys: Survey[]; setSurveys: (v: Survey[]) => void }) {
  const patch = (id: string, p: Partial<Survey>) => setSurveys(surveys.map(s => s.id === id ? { ...s, ...p } : s));
  return (
    <div className="space-y-4">
      <div className="flex justify-end bg-white p-4 rounded-[2rem] shadow-sm">
        <Button asChild className="dm-gradient-primary rounded-full px-6 font-black gap-2"><Link href="/surveybuild"><Plus size={16} />{isAr ? 'استطلاع جديد' : 'New survey'}</Link></Button>
      </div>
      <div className="bg-white border rounded-[2rem] overflow-x-auto shadow-xl">
        <Table>
          <TableHeader className="bg-slate-50"><TableRow>
            <TableHead className="font-black">{isAr ? 'الاستطلاع' : 'Survey'}</TableHead>
            <TableHead className="font-black text-center">{isAr ? 'الأسئلة' : 'Questions'}</TableHead>
            <TableHead className="font-black text-center">{isAr ? 'الردود' : 'Responses'}</TableHead>
            <TableHead className="font-black text-center">{isAr ? 'مفعّل' : 'Active'}</TableHead>
            <TableHead className="font-black text-center">{isAr ? 'في الرئيسية' : 'On home'}</TableHead>
            <TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {surveys.map(s => (
              <TableRow key={s.id}>
                <TableCell><p className="font-bold">{isAr ? s.titleAr : s.titleEn || s.titleAr}</p><p className="text-xs text-slate-400 line-clamp-1">{isAr ? s.descriptionAr : s.descriptionEn}</p></TableCell>
                <TableCell className="text-center"><Badge variant="secondary">{s.questions.length}</Badge></TableCell>
                <TableCell className="text-center font-bold">{s.responsesCount}</TableCell>
                <TableCell className="text-center"><Switch checked={s.isActive} onCheckedChange={v => patch(s.id, { isActive: v })} /></TableCell>
                <TableCell className="text-center"><Switch checked={!!s.isPublicPoll} onCheckedChange={v => patch(s.id, { isPublicPoll: v })} /></TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button variant="ghost" size="icon" asChild className="text-primary"><Link href={`/surveybuild?id=${s.id}`}><Edit2 size={16} /></Link></Button>
                  <Button variant="ghost" size="icon" className="text-red-400" onClick={() => setSurveys(surveys.filter(x => x.id !== s.id))}><Trash2 size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Ticker ───
export interface TickerItem { id: string; title?: string; text: string; isActive: boolean; createdAt: string }

export function TickerTab({ isAr, tickerText, setTickerText, items, setItems }: {
  isAr: boolean; tickerText: string; setTickerText: (v: string) => void; items: TickerItem[]; setItems: (v: TickerItem[]) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8 space-y-3">
        <h3 className="font-black text-lg">{isAr ? 'نص شريط الأخبار العلوي' : 'Top bar ticker text'}</h3>
        <p className="text-xs text-slate-400 font-bold">{isAr ? 'يظهر في أعلى كل صفحات البوابة، ويُترجم آلياً للإنجليزية.' : 'Shown at the top of every page and auto-translated to English.'}</p>
        <Textarea value={tickerText} onChange={e => setTickerText(e.target.value)} className="rounded-xl min-h-[90px]" />
      </Card>
      <div>
        <h3 className="font-black text-lg mb-3 px-2">{isAr ? 'عناصر الأخبار العاجلة' : 'Breaking news items'}</h3>
        <CollectionEditor
          isAr={isAr} items={items} onChange={setItems}
          newItem={() => ({ id: uid('n'), title: '', text: '', isActive: true, createdAt: new Date().toISOString() })}
          titleOf={n => n.title || n.text}
          subtitleOf={n => `${fmtDate(n.createdAt)} · ${n.isActive ? (isAr ? 'مفعّل' : 'active') : (isAr ? 'متوقف' : 'inactive')}`}
          fields={[
            { key: 'title', label: isAr ? 'العنوان' : 'Title' },
            { key: 'isActive', label: isAr ? 'مفعّل' : 'Active', type: 'switch' },
            { key: 'text', label: isAr ? 'النص' : 'Text', type: 'textarea' },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Footer links ───
type FooterLink = NonNullable<SiteConfig['footerLinks']>[number];

export function FooterTab({ isAr, siteConfig, setSiteConfig }: { isAr: boolean; siteConfig: SiteConfig | null; setSiteConfig: (v: SiteConfig) => void }) {
  if (!siteConfig) return null;
  return (
    <CollectionEditor<FooterLink>
      isAr={isAr} sortable items={siteConfig.footerLinks || []}
      onChange={footerLinks => setSiteConfig({ ...siteConfig, footerLinks })}
      newItem={() => ({ id: uid('fl'), labelAr: '', labelEn: '', link: '/', category: 'important' })}
      titleOf={l => (isAr ? l.labelAr : l.labelEn || l.labelAr)}
      subtitleOf={l => <span dir="ltr">{l.category} · {l.link}</span>}
      addLabel={isAr ? 'رابط تذييل' : 'Footer link'}
      fields={[
        { key: 'labelAr', label: isAr ? 'النص (عربي)' : 'Label (AR)', dir: 'rtl' },
        { key: 'labelEn', label: isAr ? 'النص (إنجليزي)' : 'Label (EN)', dir: 'ltr' },
        { key: 'link', label: isAr ? 'الرابط' : 'Link', dir: 'ltr' },
        { key: 'category', label: isAr ? 'القسم' : 'Group', type: 'select', options: [
          { value: 'legal', label: isAr ? 'قانوني' : 'Legal' },
          { value: 'services', label: isAr ? 'الخدمات' : 'Services' },
          { value: 'important', label: isAr ? 'روابط مهمة' : 'Important' },
        ] },
      ]}
    />
  );
}

// ─── AI tools ───
export function AiTab({ isAr, services, setServices }: { isAr: boolean; services: Service[]; setServices: (v: Service[]) => void }) {
  const { toast } = useToast();
  const [source, setSource] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const missing = services.filter(s => !s.titleEn?.trim());

  const translate = async () => {
    if (!source.trim()) return;
    setBusy('tool');
    try { setResult((await translateToEnglish({ text: source })).translatedText); }
    catch { toast({ variant: 'destructive', title: isAr ? 'تعذرت الترجمة' : 'Translation failed' }); }
    finally { setBusy(null); }
  };

  const fillMissing = async () => {
    setBusy('fill');
    try {
      const next = [...services];
      for (const s of missing) {
        const { translatedText } = await translateToEnglish({ text: s.title });
        const i = next.findIndex(x => x.id === s.id);
        next[i] = { ...next[i], titleEn: translatedText };
      }
      setServices(next);
      toast({ title: isAr ? `تمت ترجمة ${missing.length} خدمة` : `Translated ${missing.length} services` });
    } catch { toast({ variant: 'destructive', title: isAr ? 'تعذرت الترجمة' : 'Translation failed' }); }
    finally { setBusy(null); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8 space-y-4">
        <h3 className="font-black text-lg flex items-center gap-2"><Sparkles size={18} className="text-accent" />{isAr ? 'مترجم عربي ← إنجليزي' : 'Arabic → English translator'}</h3>
        <Textarea value={source} onChange={e => setSource(e.target.value)} dir="rtl" placeholder={isAr ? 'اكتب النص العربي...' : 'Arabic text...'} className="rounded-xl min-h-[120px]" />
        <Button onClick={translate} disabled={busy !== null} className="rounded-xl dm-gradient-primary font-black gap-2">{busy === 'tool' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}{isAr ? 'ترجمة' : 'Translate'}</Button>
        <Textarea value={result} readOnly dir="ltr" className="rounded-xl min-h-[120px] bg-slate-50" />
      </Card>
      <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8 space-y-4">
        <h3 className="font-black text-lg">{isAr ? 'استكمال العناوين الإنجليزية للخدمات' : 'Fill missing English service titles'}</h3>
        {missing.length === 0 ? (
          <p className="text-sm text-emerald-600 font-bold flex items-center gap-2"><CheckCircle2 size={16} />{isAr ? 'كل الخدمات لها عنوان إنجليزي' : 'Every service has an English title'}</p>
        ) : (
          <>
            <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">{missing.map(s => <li key={s.id} className="font-bold">• {s.title}</li>)}</ul>
            <Button onClick={fillMissing} disabled={busy !== null} className="rounded-xl dm-gradient-primary font-black gap-2">{busy === 'fill' ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}{isAr ? `ترجمة ${missing.length} عنوان` : `Translate ${missing.length} titles`}</Button>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Raw JSON database ───
export function JsonTab({ isAr, db, onApply, onReload }: { isAr: boolean; db: Record<string, unknown>; onApply: (next: Record<string, unknown>) => void; onReload: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState(() => JSON.stringify(db, null, 2));
  const [error, setError] = useState<string | null>(null);

  const apply = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) throw new Error(isAr ? 'يجب أن يكون الجذر كائناً {}' : 'Root must be an object {}');
      setError(null);
      onApply(parsed);
      toast({ title: isAr ? 'تم تطبيق JSON — اضغط "حفظ ومزامنة النظام" للحفظ' : 'JSON applied — press "Sync Matrix" to persist' });
    } catch (e) { setError((e as Error).message); }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `dhofar-portal-db-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (file: File) => file.text().then(t => { setText(t); apply(t); });

  const summary = Object.entries(db).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === 'object' && v ? '{}' : typeof v] as const);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-[2rem] shadow-sm items-center">
        {summary.map(([k, n]) => <Badge key={k} variant="outline" className="font-mono text-[10px]">{k}: {n}</Badge>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => apply(text)} className="rounded-full dm-gradient-primary font-black gap-2"><CheckCircle2 size={16} />{isAr ? 'تطبيق التعديلات' : 'Apply'}</Button>
        <Button variant="outline" onClick={() => { setText(JSON.stringify(db, null, 2)); setError(null); }} className="rounded-full font-black gap-2"><RefreshCw size={16} />{isAr ? 'إعادة من الحالة الحالية' : 'Reset from current state'}</Button>
        <Button variant="outline" onClick={onReload} className="rounded-full font-black gap-2"><RefreshCw size={16} />{isAr ? 'تحميل من قاعدة البيانات' : 'Reload from database'}</Button>
        <Button variant="outline" onClick={download} className="rounded-full font-black gap-2"><Download size={16} />{isAr ? 'تنزيل' : 'Download'}</Button>
        <Button variant="outline" asChild className="rounded-full font-black gap-2 cursor-pointer">
          <label><Upload size={16} />{isAr ? 'استيراد ملف' : 'Import file'}<input type="file" accept="application/json,.json" hidden onChange={e => e.target.files?.[0] && importFile(e.target.files[0])} /></label>
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 font-bold font-mono bg-red-50 p-3 rounded-xl" dir="ltr">{error}</p>}
      <Textarea value={text} onChange={e => setText(e.target.value)} dir="ltr" spellCheck={false} className="font-mono text-xs rounded-2xl min-h-[65vh] bg-slate-950 text-emerald-200" />
    </div>
  );
}
