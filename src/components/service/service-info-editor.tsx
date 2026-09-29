'use client';

import React, { useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { AlertTriangle, ExternalLink, Image as ImageIcon, Link2, Loader2, Plus, Search, Trash2, Upload, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service } from '@/lib/types';
import { CAT_CONFIG } from '@/lib/constants';
import { FieldEditor } from '@/components/blocks/field-editor';
import { FieldDef } from '@/components/blocks/registry';
import { linkedKind, LINKED_INFO } from '@/lib/linked-data';
import { ServiceIcon, SERVICE_ICON_CHOICES } from './service-icon';
import { cn } from '@/lib/utils';

interface Props {
  isAr: boolean;
  value: Partial<Service>;
  onChange: (next: Partial<Service>) => void;
}

// Service stores some texts as `title`/`titleEn`; the field editor works with `<key>Ar`/`<key>En`
const TEXT_FIELDS: FieldDef[] = [
  { key: 'title', labelAr: 'اسم الخدمة', labelEn: 'Service name', type: 'bi' },
  { key: 'description', labelAr: 'وصف الخدمة', labelEn: 'Description', type: 'bitext' },
  { key: 'fees', labelAr: 'رسوم الخدمة', labelEn: 'Service fees', type: 'bi' },
  { key: 'duration', labelAr: 'مدة الإنجاز', labelEn: 'Processing time', type: 'bi' },
  { key: 'conditions', labelAr: 'شروط الاستفادة من الخدمة', labelEn: 'Eligibility conditions', type: 'bitext' },
];

const toEditor = (s: Partial<Service>) => ({
  titleAr: s.title ?? '', titleEn: s.titleEn ?? '',
  descriptionAr: s.description ?? '', descriptionEn: s.descriptionEn ?? '',
  feesAr: s.fees ?? '', feesEn: s.feesEn ?? '',
  durationAr: s.durationAr ?? '', durationEn: s.durationEn ?? '',
  conditionsAr: s.conditionsAr ?? '', conditionsEn: s.conditionsEn ?? '',
});
const fromEditor = (v: Record<string, any>): Partial<Service> => ({
  title: v.titleAr, titleEn: v.titleEn, description: v.descriptionAr, descriptionEn: v.descriptionEn,
  fees: v.feesAr, feesEn: v.feesEn, durationAr: v.durationAr, durationEn: v.durationEn,
  conditionsAr: v.conditionsAr, conditionsEn: v.conditionsEn,
});

const MAX_ICON_BYTES = 40_000;

/** Reads an image file and returns a ≤128px WebP/PNG data URL, small enough to store with the service */
async function fileToIcon(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 128 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', 0.9);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

export function ServiceInfoEditor({ isAr, value, onChange }: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const set = (patch: Partial<Service>) => onChange({ ...value, ...patch });
  const [iconTab, setIconTab] = useState<'library' | 'upload' | 'url'>(value.customIconUrl ? (value.customIconUrl.startsWith('data:') ? 'upload' : 'url') : 'library');
  const [iconQuery, setIconQuery] = useState('');
  const [iconError, setIconError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLink = value.type === 'link';
  const urlInvalid = isLink && !!value.linkUrl && !/^https?:\/\/\S+\.\S+/.test(value.linkUrl);
  const reqsAr = value.reqsAr || [];
  const reqsEn = value.reqsEn || [];
  const reqCount = Math.max(reqsAr.length, reqsEn.length);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setIconError(null);
    if (!/^image\/(png|jpe?g|webp|svg\+xml|gif)$/.test(file.type)) { setIconError(t('الصيغ المسموحة: PNG، JPG، WebP، SVG', 'Allowed: PNG, JPG, WebP, SVG')); return; }
    setUploading(true);
    try {
      const data = file.type === 'image/svg+xml'
        ? await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); })
        : await fileToIcon(file);
      if (data.length > MAX_ICON_BYTES) { setIconError(t('الأيقونة كبيرة جداً بعد الضغط (الحد 40KB) — استخدم صورة أبسط أو رابطاً خارجياً', 'Icon too large after compression (40KB max) — use a simpler image or an external URL')); return; }
      set({ customIconUrl: data });
    } catch { setIconError(t('تعذرت قراءة الصورة', 'Could not read the image')); }
    finally { setUploading(false); }
  };

  const setReq = (i: number, lang: 'Ar' | 'En', v: string) => {
    const ar = [...reqsAr], en = [...reqsEn];
    while (ar.length < reqCount) ar.push('');
    while (en.length < reqCount) en.push('');
    (lang === 'Ar' ? ar : en)[i] = v;
    set({ reqsAr: ar, reqsEn: en });
  };
  const removeReq = (i: number) => set({ reqsAr: reqsAr.filter((_, j) => j !== i), reqsEn: reqsEn.filter((_, j) => j !== i) });

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <section className="rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 p-6 space-y-5">
        <h3 className="font-black text-lg text-secondary">{t('بيانات الخدمة', 'Service details')}</h3>
        <FieldEditor fields={TEXT_FIELDS} value={toEditor(value)} onChange={v => set(fromEditor(v))} isAr={isAr} />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-slate-500">{t('التصنيف', 'Category')}</Label>
            <Select value={value.category || 'elec'} onValueChange={v => set({ category: v })}>
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CAT_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{isAr ? c.labelAr : c.labelEn}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pt-5">
            <label className="flex items-center justify-between text-xs font-bold">{t('الخدمة مفعّلة', 'Active')}<Switch checked={value.isActive !== false} onCheckedChange={v => set({ isActive: v })} /></label>
            <label className="flex items-center justify-between text-xs font-bold">{t('ظاهرة للعامة', 'Visible to the public')}<Switch checked={value.isPublic === true} onCheckedChange={v => set({ isPublic: v })} /></label>
            <label className="flex items-center justify-between gap-2 text-xs font-bold">{t('رمز رقم المعاملة (حرفان)', 'Transaction number code (2 letters)')}<input value={value.refPrefix || ''} onChange={e => set({ refPrefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || undefined })} placeholder={t('تلقائي', 'Auto')} dir="ltr" maxLength={2} className="w-16 h-8 rounded-lg border px-2 text-center font-mono font-black uppercase" /></label>
            <label className="flex items-center justify-between text-xs font-bold">{t('خدمة مميزة', 'Featured')}<Switch checked={!!value.isFeatured} onCheckedChange={v => set({ isFeatured: v })} /></label>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {/* Delivery: in-portal workflow or an external platform */}
        <section className="rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 p-6 space-y-4">
          <h3 className="font-black text-lg text-secondary">{t('طريقة تقديم الخدمة', 'How the service is delivered')}</h3>
          <div role="radiogroup" aria-label={t('طريقة التقديم', 'Delivery')} className="grid grid-cols-2 gap-3">
            {([['workflow', Workflow, t('نموذج إلكتروني في البوابة', 'Online form in the portal'), t('المتقدم يعبئ مسار الخدمة', 'Applicant fills the service flow')],
               ['link', ExternalLink, t('رابط خارجي', 'External link'), t('الخدمة تُقدَّم عبر منصة أخرى', 'Offered on another platform')]] as const).map(([v, Icon, label, desc]) => (
              <button key={v} type="button" role="radio" aria-checked={(value.type || 'workflow') === v} onClick={() => set({ type: v })}
                className={cn('text-start p-4 rounded-2xl border-2 transition-colors', (value.type || 'workflow') === v ? 'border-[#03CFCB] bg-[#03CFCB]/5' : 'border-slate-100 hover:border-slate-200')}>
                <Icon size={20} className="text-[#008E91] mb-2" />
                <p className="font-black text-sm">{label}</p>
                <p className="text-[11px] font-bold text-slate-400">{desc}</p>
              </button>
            ))}
          </div>
          {isLink && (
            <div className="space-y-1.5">
              <Label htmlFor="svc-url" className="text-[11px] font-black text-slate-500">{t('رابط الخدمة الخارجي (URL)', 'External service URL')}</Label>
              <div className="relative">
                <Link2 size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input id="svc-url" dir="ltr" value={value.linkUrl || ''} onChange={e => set({ linkUrl: e.target.value.trim() })} placeholder="https://" aria-invalid={urlInvalid} className={cn('h-11 ps-9 rounded-xl font-mono text-sm', urlInvalid && 'border-red-400')} />
              </div>
              <p className={cn('text-[11px] font-bold', urlInvalid ? 'text-red-600' : 'text-slate-400')}>{urlInvalid ? t('يجب أن يبدأ الرابط بـ https://', 'The URL must start with https://') : t('سيرى المتقدم صفحة تعريفية ثم زراً للانتقال للمنصة الخارجية في نافذة جديدة.', 'Applicants see the service details, then a button that opens the platform in a new tab.')}</p>
            </div>
          )}
        </section>

        {/* Icon */}
        <section className="rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-lg text-secondary">{t('أيقونة الخدمة', 'Service icon')}</h3>
            <div className="size-16 rounded-2xl bg-[#03CFCB]/10 text-[#008E91] flex items-center justify-center" aria-label={t('معاينة الأيقونة', 'Icon preview')}>
              <ServiceIcon service={value} size={34} />
            </div>
          </div>
          <div role="tablist" className="flex bg-slate-100 rounded-xl p-1">
            {([['library', t('من المكتبة', 'Library')], ['upload', t('رفع صورة', 'Upload')], ['url', t('رابط خارجي', 'External URL')]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={iconTab === k} onClick={() => setIconTab(k)}
                className={cn('flex-1 h-8 rounded-lg text-xs font-black', iconTab === k ? 'bg-white shadow text-secondary' : 'text-slate-500')}>{label}</button>
            ))}
          </div>

          {iconTab === 'library' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={iconQuery} onChange={e => setIconQuery(e.target.value)} placeholder={t('ابحث (بالإنجليزية)…', 'Search…')} dir="ltr" className="h-9 ps-9 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-10 gap-1.5 max-h-48 overflow-y-auto">
                {SERVICE_ICON_CHOICES.filter(n => n.toLowerCase().includes(iconQuery.toLowerCase())).map(name => {
                  const Cmp = (Icons as any)[name] || Icons.FileText;
                  const active = !value.customIconUrl && value.iconName === name;
                  return (
                    <button key={name} type="button" title={name} aria-pressed={active} onClick={() => set({ iconName: name, customIconUrl: undefined })}
                      className={cn('aspect-square rounded-lg border flex items-center justify-center', active ? 'bg-[#03CFCB] border-[#03CFCB] text-slate-900' : 'border-slate-200 text-slate-500 hover:border-[#03CFCB]')}>
                      <Cmp size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {iconTab === 'upload' && (
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden onChange={e => onUpload(e.target.files?.[0])} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-20 rounded-2xl border-2 border-dashed gap-2 font-black">
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}{t('اختر صورة الأيقونة', 'Choose an icon image')}
              </Button>
              <p className="text-[11px] font-bold text-slate-400">{t('تُصغَّر تلقائياً إلى 128px وتُحفظ مع الخدمة. يفضّل خلفية شفافة.', 'Scaled to 128px automatically and saved with the service. Transparent background recommended.')}</p>
            </div>
          )}

          {iconTab === 'url' && (
            <div className="space-y-1.5">
              <Label htmlFor="icon-url" className="text-[11px] font-black text-slate-500">{t('رابط صورة الأيقونة', 'Icon image URL')}</Label>
              <Input id="icon-url" dir="ltr" value={value.customIconUrl?.startsWith('data:') ? '' : value.customIconUrl || ''} onChange={e => set({ customIconUrl: e.target.value.trim() || undefined })} placeholder="https://…/icon.svg" className="h-10 rounded-xl font-mono text-sm" />
            </div>
          )}

          {iconError && <p role="alert" className="text-xs font-bold text-red-600">{iconError}</p>}
          {value.customIconUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { set({ customIconUrl: undefined }); setIconTab('library'); }} className="text-red-500 font-bold gap-1 h-8">
              <Trash2 size={13} />{t('إزالة الأيقونة المخصصة والعودة لأيقونة المكتبة', 'Remove the custom icon')}
            </Button>
          )}
        </section>

        {/* Requirements */}
        <section className="rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-secondary">{t('المستندات المطلوبة', 'Required documents')}</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => set({ reqsAr: [...reqsAr, ''], reqsEn: [...reqsEn, ''] })} className="h-8 rounded-lg gap-1 font-black text-xs"><Plus size={13} />{t('مستند', 'Document')}</Button>
          </div>
          <p className="text-[11px] font-bold text-slate-400">{t('لا تضف البطاقة الشخصية أو السجل التجاري: تُجلب تلقائياً من ثقة والربط مع وزارة التجارة.', 'Do not add the ID card or Commercial Registration: they come from Thiqa and the CR link.')}</p>
          {Array.from({ length: reqCount }).map((_, i) => {
            const kind = linkedKind(reqsAr[i]) || linkedKind(reqsEn[i]);
            return (
              <div key={i} className={cn('rounded-xl border p-2 space-y-1.5', kind ? 'border-amber-300 bg-amber-50' : 'border-slate-100')}>
                <div className="flex gap-2">
                  <Input value={reqsAr[i] || ''} onChange={e => setReq(i, 'Ar', e.target.value)} dir="rtl" lang="ar" placeholder="بالعربي" className="h-9 rounded-lg text-sm" />
                  <Input value={reqsEn[i] || ''} onChange={e => setReq(i, 'En', e.target.value)} dir="ltr" lang="en" placeholder="English" className="h-9 rounded-lg text-sm" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeReq(i)} className="size-9 text-red-500 shrink-0" aria-label={t('حذف', 'Remove')}><Trash2 size={14} /></Button>
                </div>
                {kind && (
                  <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={12} />{t(`لن يُطلب من المتقدم — يُجلب من ${LINKED_INFO[kind].sourceAr}`, `Not asked from applicants — fetched from ${LINKED_INFO[kind].sourceEn}`)}
                    <Badge variant="outline" className="text-[9px] ms-auto border-amber-400 text-amber-800">{t('ربط تلقائي', 'Auto-linked')}</Badge>
                  </p>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
