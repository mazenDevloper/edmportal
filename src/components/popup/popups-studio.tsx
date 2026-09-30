'use client';

import React, { useState } from 'react';
import { CalendarClock, Copy, Edit2, Plus, Repeat, Trash2, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import type { PopupMessage } from '@/lib/types';
import { TEMPLATES, designFromLegacy, popupEligible } from '@/lib/popup-design';
import { PopupCanvas, ScaledCanvas } from './popup-canvas';
import { PopupBuilder } from './popup-builder';
import { cn } from '@/lib/utils';

const FREQ: Record<string, [string, string]> = { always: ['كل زيارة', 'Every visit'], session: ['مرة لكل جلسة', 'Once per session'], day: ['مرة يومياً', 'Once a day'], once: ['مرة واحدة', 'Only once'] };

/** Announcements (popups): gallery of designs, templates, and the visual builder */
export function PopupsStudio({ isAr, items, setItems }: { isAr: boolean; items: PopupMessage[]; setItems: (v: PopupMessage[]) => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const [editing, setEditing] = useState<PopupMessage | null>(null);
  const [picking, setPicking] = useState(false);

  /** Saves the popups list straight to the database (read-merge-write of this key only) */
  const publish = async (list: PopupMessage[], ok = t('تم الحفظ والنشر', 'Saved and published')) => {
    setItems(list);
    try {
      const db = await fetchBin();
      await updateBin({ ...db, popups: list });
      toast({ title: ok });
    } catch {
      toast({ variant: 'destructive', title: t('تعذّر الحفظ، حاول مرة أخرى', 'Could not save, try again') });
      throw new Error('save failed');
    }
  };

  const create = (tplId: string) => {
    const tpl = TEMPLATES.find(x => x.id === tplId)!;
    setPicking(false);
    setEditing({ id: `p_${Date.now()}`, type: 'text', titleAr: isAr ? tpl.ar : '', titleEn: isAr ? '' : tpl.en, isActive: false, displayDelay: 2, frequency: 'session', design: tpl.build() });
  };
  const open = (p: PopupMessage) => setEditing(p.design ? p : { ...p, design: designFromLegacy(p) });
  const saveOne = async (p: PopupMessage) => {
    const exists = items.some(x => x.id === p.id);
    await publish(exists ? items.map(x => (x.id === p.id ? p : x)) : [p, ...items]);
    setEditing(p);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[2rem] shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800">{t('منصة الإعلانات المنبثقة', 'Popup announcements')}</h2>
          <p className="text-xs font-bold text-slate-500">{t('صمّم الإعلان بالسحب والإفلات: نصوص وصور وأزرار روابط ومواعيد وعدّاد تنازلي وفيديو.', 'Design by drag and drop: text, images, link buttons, events, countdowns and video.')}</p>
        </div>
        <Button onClick={() => setPicking(true)} className="dm-gradient-primary rounded-full px-6 font-black gap-2"><Plus size={16} />{t('إعلان جديد', 'New popup')}</Button>
      </div>

      {items.length === 0 && (
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <Wand2 className="mx-auto text-slate-300" size={36} />
          <p className="font-black text-slate-600">{t('لا توجد إعلانات بعد', 'No popups yet')}</p>
          <Button variant="outline" onClick={() => setPicking(true)} className="rounded-xl font-black">{t('ابدأ من قالب', 'Start from a template')}</Button>
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(p => {
          const d = p.design ?? designFromLegacy(p);
          const live = popupEligible({ ...p, frequency: 'always' });
          const scheduled = p.isActive && !live;
          return (
            <li key={p.id} className="rounded-[2rem] bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden flex flex-col">
              <button type="button" onClick={() => open(p)} className="h-52 flex items-center justify-center bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f9e9b]"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '14px 14px' }} aria-label={t('تعديل التصميم', 'Edit design')}>
                <ScaledCanvas design={d} maxWidth={300} maxHeight={180}>{() => <PopupCanvas design={d} isAr={isAr} editing className="shadow-xl" />}</ScaledCanvas>
              </button>
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-slate-800 leading-snug">{(isAr ? p.titleAr : p.titleEn || p.titleAr) || t('بدون اسم', 'Untitled')}</p>
                  <Switch checked={p.isActive} onCheckedChange={v => publish(items.map(x => (x.id === p.id ? { ...x, isActive: v } : x)), v ? t('تم تفعيل الإعلان', 'Popup activated') : t('تم إيقاف الإعلان', 'Popup paused')).catch(() => {})}
                    aria-label={t('تفعيل', 'Active')} />
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
                  <span className={cn('px-2 py-0.5 rounded-full', p.isActive ? (scheduled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') : 'bg-slate-100 text-slate-500')}>
                    {p.isActive ? (scheduled ? t('مجدول / منتهٍ', 'Scheduled / ended') : t('يظهر الآن', 'Live')) : t('متوقف', 'Paused')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-1"><Repeat size={11} />{(isAr ? FREQ[p.frequency || 'always'][0] : FREQ[p.frequency || 'always'][1])}</span>
                  {(p.startAt || p.endAt) && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-1"><CalendarClock size={11} />
                    {[p.startAt, p.endAt].map(x => (x ? new Date(x).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'short' }) : '…')).join(' – ')}</span>}
                  {!p.design && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">{t('تصميم قديم — افتحه للتحويل', 'Legacy — open to convert')}</span>}
                </div>
                <div className="mt-auto flex gap-2 pt-1">
                  <Button size="sm" onClick={() => open(p)} className="rounded-xl font-black gap-1.5 flex-1"><Edit2 size={14} />{t('تصميم', 'Design')}</Button>
                  <Button size="sm" variant="outline" onClick={() => publish([{ ...p, id: `p_${Date.now()}`, isActive: false, titleAr: `${p.titleAr} (نسخة)`, titleEn: p.titleEn && `${p.titleEn} (copy)`, design: d }, ...items], t('تم النسخ', 'Duplicated')).catch(() => {})}
                    className="rounded-xl" aria-label={t('نسخ', 'Duplicate')}><Copy size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => { if (window.confirm(t('حذف هذا الإعلان؟', 'Delete this popup?'))) publish(items.filter(x => x.id !== p.id), t('تم الحذف', 'Deleted')).catch(() => {}); }}
                    className="rounded-xl text-red-500" aria-label={t('حذف', 'Delete')}><Trash2 size={14} /></Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {picking && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4" role="dialog" aria-modal aria-label={t('اختر قالباً', 'Choose a template')} onClick={() => setPicking(false)}>
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">{t('اختر قالباً للبدء', 'Choose a starting template')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setPicking(false)} aria-label={t('إغلاق', 'Close')}><X size={18} /></Button>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {TEMPLATES.map(tpl => {
                const d = tpl.build();
                return (
                  <li key={tpl.id}>
                    <button type="button" onClick={() => create(tpl.id)} className="w-full rounded-2xl ring-1 ring-slate-200 hover:ring-2 hover:ring-[#0f9e9b] overflow-hidden text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f9e9b]">
                      <span className="h-36 flex items-center justify-center bg-slate-100"><ScaledCanvas design={d} maxWidth={220} maxHeight={120}>{() => <PopupCanvas design={d} isAr={isAr} editing className="shadow-lg" />}</ScaledCanvas></span>
                      <span className="block p-3 font-black text-sm text-slate-700">{isAr ? tpl.ar : tpl.en}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {editing && <PopupBuilder key={editing.id} isAr={isAr} popup={editing} onSave={saveOne} onClose={() => setEditing(null)} />}
    </div>
  );
}
