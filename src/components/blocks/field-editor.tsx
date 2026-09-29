'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Copy, Languages, Loader2, Plus, Trash2 } from 'lucide-react';
import { translateText } from '@/ai/flows/translate-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FieldDef } from './registry';

const ICON_CHOICES = ['Zap', 'ShieldCheck', 'Clock', 'FileCheck', 'Landmark', 'Building2', 'MapPin', 'Phone', 'Mail', 'Users', 'Leaf', 'Truck', 'Droplets', 'Lightbulb', 'Construction', 'CreditCard', 'Wallet', 'Calendar', 'Search', 'Sparkles', 'Award', 'HeartHandshake', 'Recycle', 'Trees', 'Sun', 'Globe', 'Smartphone', 'Accessibility'];

interface Props {
  fields: FieldDef[];
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  isAr: boolean;
}

/** Schema-driven editor for a block's content */
export function FieldEditor({ fields, value, onChange, isAr }: Props) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-5">
      {fields.map(f => <FieldRow key={f.key} field={f} value={value} set={set} isAr={isAr} />)}
    </div>
  );
}

function FieldRow({ field: f, value, set, isAr }: { field: FieldDef; value: Record<string, any>; set: (k: string, v: unknown) => void; isAr: boolean }) {
  const label = isAr ? f.labelAr : f.labelEn;
  if (f.type === 'bi' || f.type === 'bitext') return <BilingualField field={f} value={value} set={set} isAr={isAr} />;
  if (f.type === 'list') return <ListField field={f} items={value[f.key] || []} onChange={items => set(f.key, items)} isAr={isAr} />;

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-black text-slate-500">{label}</Label>
      {f.type === 'select' ? (
        <Select value={String(value[f.key] ?? '')} onValueChange={v => set(f.key, v)}>
          <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{isAr ? o.labelAr : o.labelEn}</SelectItem>)}</SelectContent>
        </Select>
      ) : f.type === 'switch' ? (
        <Switch checked={!!value[f.key]} onCheckedChange={v => set(f.key, v)} />
      ) : f.type === 'code' ? (
        <Textarea value={value[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} dir="ltr" spellCheck={false} className="font-mono text-xs min-h-[180px] rounded-xl bg-slate-950 text-emerald-300" />
      ) : f.type === 'textarea' ? (
        <Textarea value={value[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} className="rounded-xl min-h-[90px]" />
      ) : f.type === 'icon' ? (
        <IconPicker value={value[f.key]} onChange={v => set(f.key, v)} />
      ) : (
        <div className="flex gap-2 items-center">
          <Input type={f.type === 'number' ? 'number' : 'text'} dir={f.type === 'url' || f.type === 'image' ? 'ltr' : undefined} value={value[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} className="h-10 rounded-xl" />
          {f.type === 'image' && value[f.key] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value[f.key]} alt="" className="size-10 rounded-lg object-cover border shrink-0" />
          )}
        </div>
      )}
    </div>
  );
}

/** Arabic + English pair with one-click translation in either direction */
function BilingualField({ field: f, value, set, isAr }: { field: FieldDef; value: Record<string, any>; set: (k: string, v: unknown) => void; isAr: boolean }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<'ar' | 'en' | null>(null);
  const arKey = `${f.key}Ar`, enKey = `${f.key}En`;
  const multiline = f.type === 'bitext';

  const translate = async (target: 'ar' | 'en') => {
    const source = target === 'en' ? 'ar' : 'en';
    const text = value[source === 'ar' ? arKey : enKey];
    if (!text?.trim()) return;
    setBusy(target);
    try {
      const { translatedText, ok } = await translateText({ text, source, target, tone: multiline ? 'official' : 'concise' });
      // Never copy the untranslated text into the other language's field
      if (!ok) throw new Error('not translated');
      set(target === 'ar' ? arKey : enKey, translatedText);
    } catch {
      toast({ variant: 'destructive', title: isAr ? 'تعذرت الترجمة الآلية' : 'Machine translation failed', description: isAr ? 'لا يوجد محرك ترجمة مفعّل أو لم تنجح الترجمة. راجع إعداد OPEN_LLM_URL في ملف ‎.env' : 'No translation engine is set up, or it did not return a translation. See OPEN_LLM_URL in .env.' });
    } finally { setBusy(null); }
  };

  const Field = multiline ? Textarea : Input;
  const missingEn = !!value[arKey]?.trim() && !value[enKey]?.trim();
  const missingAr = !!value[enKey]?.trim() && !value[arKey]?.trim();

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[11px] font-black text-slate-500 flex items-center gap-2">
        {isAr ? f.labelAr : f.labelEn}
        {(missingEn || missingAr) && <span className="text-[9px] font-black text-amber-600 bg-amber-50 rounded px-1.5">{missingEn ? (isAr ? 'ينقصه الإنجليزي' : 'EN missing') : (isAr ? 'ينقصه العربي' : 'AR missing')}</span>}
      </legend>
      <div className="grid gap-2">
        {([['ar', arKey, 'عربي', 'rtl'], ['en', enKey, 'English', 'ltr']] as const).map(([lang, key, tag, dir]) => (
          <div key={lang} className="relative">
            <span className="absolute top-2 end-2 z-10 text-[9px] font-black text-slate-400 bg-white/80 rounded px-1">{tag}</span>
            <Field
              dir={dir}
              lang={lang}
              value={value[key] ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => set(key, e.target.value)}
              className={cn('rounded-xl pe-24', multiline ? 'min-h-[80px] text-sm' : 'h-10')}
            />
            <Button
              type="button" size="sm" variant="ghost" disabled={busy !== null}
              onClick={() => translate(lang)}
              title={lang === 'en' ? 'ترجمة من العربي' : 'Translate from English'}
              className="absolute bottom-1 end-10 h-7 px-2 gap-1 text-[10px] font-black text-[#008E91]"
            >
              {busy === lang ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}{lang === 'en' ? 'AR→EN' : 'EN→AR'}
            </Button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function ListField({ field: f, items, onChange, isAr }: { field: FieldDef; items: any[]; onChange: (items: any[]) => void; isAr: boolean }) {
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null);
  const update = (i: number, next: any) => onChange(items.map((it, j) => (j === i ? next : it)));
  const move = (i: number, d: -1 | 1) => {
    const t = i + d;
    if (t < 0 || t >= items.length) return;
    const n = [...items]; [n[i], n[t]] = [n[t], n[i]]; onChange(n); setOpen(t);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-black text-slate-500">{isAr ? f.labelAr : f.labelEn} <span className="text-slate-300">({items.length})</span></Label>
        <Button type="button" size="sm" variant="outline" className="h-7 rounded-lg gap-1 text-[10px] font-black" onClick={() => { onChange([...items, f.newItem?.() ?? {}]); setOpen(items.length); }}>
          <Plus size={12} />{isAr ? 'إضافة' : 'Add'}
        </Button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50">
            <button type="button" className="flex-1 text-start text-xs font-bold truncate py-1" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span className="text-slate-400 me-1">{i + 1}.</span>{f.itemLabel?.(it, isAr) || (isAr ? 'عنصر' : 'Item')}
            </button>
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => move(i, -1)} aria-label={isAr ? 'تحريك لأعلى' : 'Move up'}><ChevronUp size={13} /></Button>
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => move(i, 1)} aria-label={isAr ? 'تحريك لأسفل' : 'Move down'}><ChevronDown size={13} /></Button>
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => onChange([...items.slice(0, i + 1), JSON.parse(JSON.stringify(it)), ...items.slice(i + 1)])} aria-label={isAr ? 'تكرار' : 'Duplicate'}><Copy size={13} /></Button>
            <Button type="button" size="icon" variant="ghost" className="size-7 text-red-500" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={isAr ? 'حذف' : 'Delete'}><Trash2 size={13} /></Button>
          </div>
          {open === i && f.itemFields && (
            <div className="p-3">
              <FieldEditor fields={f.itemFields} value={it} onChange={next => update(i, next)} isAr={isAr} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IconPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {ICON_CHOICES.map(name => {
        const Cmp = (Icons as any)[name] || Icons.Sparkles;
        return (
          <button key={name} type="button" onClick={() => onChange(name)} title={name} aria-pressed={value === name}
            className={cn('aspect-square rounded-lg border flex items-center justify-center transition-colors', value === name ? 'bg-[#03CFCB] border-[#03CFCB] text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-[#03CFCB]')}>
            <Cmp size={16} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Translation coverage (used for "translate the whole page") ───

/** Every bilingual string in a content tree: [path to Ar, path to En] pairs */
export function collectBilingualPairs(fields: FieldDef[], content: any, base: (string | number)[] = []): { ar: (string | number)[]; en: (string | number)[] }[] {
  const out: { ar: (string | number)[]; en: (string | number)[] }[] = [];
  fields.forEach(f => {
    if (f.type === 'bi' || f.type === 'bitext') out.push({ ar: [...base, `${f.key}Ar`], en: [...base, `${f.key}En`] });
    if (f.type === 'list' && f.itemFields) (content?.[f.key] || []).forEach((it: any, i: number) => out.push(...collectBilingualPairs(f.itemFields!, it, [...base, f.key, i])));
  });
  return out;
}

export const getPath = (obj: any, path: (string | number)[]) => path.reduce((o, k) => (o == null ? o : o[k]), obj);

export function setPath<T>(obj: T, path: (string | number)[], v: unknown): T {
  if (!path.length) return v as T;
  const [k, ...rest] = path;
  const copy: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  copy[k] = setPath(copy[k] ?? (typeof rest[0] === 'number' ? [] : {}), rest, v);
  return copy;
}
