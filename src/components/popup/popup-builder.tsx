'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, CalendarDays, Copy, Eye, EyeOff, Heading1, Image as ImageIcon,
  Loader2, Lock, MousePointerClick, Play, Redo2, Save, Shapes, Smartphone, Monitor, Sparkles, Timer, Trash2, Type, Undo2, Unlock, Upload, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { PopupMessage } from '@/lib/types';
import { PopupDesign, PopupElement, PopupElementKind, SWATCHES, newElement, elId } from '@/lib/popup-design';
import { fileToDataUrl, dataUrlKb } from '@/lib/image-data-url';
import { PopupCanvas, PopupElementView, ScaledCanvas, elementBox } from './popup-canvas';
import { DesignedPopup } from '@/components/popup-manager';
import { cn } from '@/lib/utils';

/*
 * Visual popup builder: drag elements on a canvas, resize them from the handles, snap to the
 * canvas centre and to other elements, and edit everything from the side panel.
 * Keyboard: arrows nudge (Shift ×10), Delete removes, Ctrl+D duplicates, Ctrl+Z / Ctrl+Y undo/redo.
 */

const PALETTE: { kind: PopupElementKind; icon: React.ElementType; ar: string; en: string }[] = [
  { kind: 'heading', icon: Heading1, ar: 'عنوان', en: 'Heading' },
  { kind: 'text', icon: Type, ar: 'نص', en: 'Text' },
  { kind: 'image', icon: ImageIcon, ar: 'صورة', en: 'Image' },
  { kind: 'button', icon: MousePointerClick, ar: 'زر رابط', en: 'Button' },
  { kind: 'event', icon: CalendarDays, ar: 'موعد / فعالية', en: 'Event' },
  { kind: 'countdown', icon: Timer, ar: 'عدّاد تنازلي', en: 'Countdown' },
  { kind: 'video', icon: Play, ar: 'فيديو', en: 'Video' },
  { kind: 'shape', icon: Shapes, ar: 'شكل', en: 'Shape' },
  { kind: 'icon', icon: Sparkles, ar: 'أيقونة', en: 'Icon' },
];
const KIND_LABEL = Object.fromEntries(PALETTE.map(p => [p.kind, p])) as Record<PopupElementKind, typeof PALETTE[number]>;
const ICON_CHOICES = ['Megaphone', 'Bell', 'CalendarDays', 'Info', 'AlertTriangle', 'CheckCircle2', 'Gift', 'Star', 'Heart', 'Trophy', 'Sparkles', 'MapPin', 'Phone', 'Mail', 'Globe', 'Building2', 'Landmark', 'Trees', 'Sun', 'CloudRain', 'Waves', 'ShieldCheck', 'Users', 'Clock'];
const SIZES = [
  { w: 600, h: 420, ar: 'متوسط', en: 'Medium' }, { w: 720, h: 500, ar: 'كبير', en: 'Large' },
  { w: 480, h: 640, ar: 'طولي', en: 'Portrait' }, { w: 380, h: 200, ar: 'صغير', en: 'Small' }, { w: 900, h: 140, ar: 'شريط', en: 'Bar' },
];
const SNAP = 6;

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLES: { id: Handle; cls: string; cursor: string }[] = [
  { id: 'nw', cls: '-top-1.5 -left-1.5', cursor: 'nwse-resize' }, { id: 'n', cls: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { id: 'ne', cls: '-top-1.5 -right-1.5', cursor: 'nesw-resize' }, { id: 'e', cls: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'ew-resize' },
  { id: 'se', cls: '-bottom-1.5 -right-1.5', cursor: 'nwse-resize' }, { id: 's', cls: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { id: 'sw', cls: '-bottom-1.5 -left-1.5', cursor: 'nesw-resize' }, { id: 'w', cls: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'ew-resize' },
];

interface Props { isAr: boolean; popup: PopupMessage; onSave: (p: PopupMessage) => Promise<void> | void; onClose: () => void }

export function PopupBuilder({ isAr, popup: initial, onSave, onClose }: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  // One state object so undo/redo updates stay pure
  const [doc, setDoc] = useState<{ popup: PopupMessage; past: PopupDesign[]; future: PopupDesign[] }>({ popup: initial, past: [], future: [] });
  const { popup, past, future } = doc;
  const design = popup.design!;
  const setPopup = useCallback((fn: (p: PopupMessage) => PopupMessage) => setDoc(s => ({ ...s, popup: fn(s.popup) })), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [lang, setLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [panel, setPanel] = useState<'element' | 'canvas' | 'display'>('canvas');
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 800, h: 600 });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(1, (stage.w - 64) / design.width, (stage.h - 64) / design.height);

  /** Change the design; `record` adds an undo step (drags record once, at the start) */
  const setDesign = useCallback((fn: (d: PopupDesign) => PopupDesign, record = true) => {
    setDoc(s => ({
      popup: { ...s.popup, design: fn(s.popup.design!) },
      past: record ? [...s.past.slice(-49), s.popup.design!] : s.past,
      future: record ? [] : s.future,
    }));
    setDirty(true);
  }, []);
  const patchEl = useCallback((id: string, patch: Partial<PopupElement>, record = true) =>
    setDesign(d => ({ ...d, elements: d.elements.map(e => (e.id === id ? { ...e, ...patch, style: { ...e.style, ...(patch.style || {}) } } : e)) }), record), [setDesign]);
  const undo = useCallback(() => setDoc(s => !s.past.length ? s : {
    popup: { ...s.popup, design: s.past[s.past.length - 1] }, past: s.past.slice(0, -1), future: [s.popup.design!, ...s.future],
  }), []);
  const redo = useCallback(() => setDoc(s => !s.future.length ? s : {
    popup: { ...s.popup, design: s.future[0] }, past: [...s.past, s.popup.design!], future: s.future.slice(1),
  }), []);

  const sel = design.elements.find(e => e.id === selected) || null;
  const select = (id: string | null) => { setSelected(id); setPanel(id ? 'element' : 'canvas'); };

  const add = (kind: PopupElementKind) => {
    const el = newElement(kind, design);
    setDesign(d => ({ ...d, elements: [...d.elements, el] }));
    select(el.id);
  };
  const remove = useCallback((id: string) => { setDesign(d => ({ ...d, elements: d.elements.filter(e => e.id !== id) })); setSelected(null); setPanel('canvas'); }, [setDesign]);
  const duplicate = useCallback((id: string) => {
    const src = design.elements.find(e => e.id === id);
    if (!src) return;
    const copy = { ...src, id: elId(), x: src.x + 16, y: src.y + 16, style: { ...src.style } };
    setDesign(d => ({ ...d, elements: [...d.elements, copy] }));
    setSelected(copy.id);
  }, [design.elements, setDesign]);
  const reorder = (id: string, dir: 1 | -1 | 'front' | 'back') => setDesign(d => {
    const list = [...d.elements];
    const i = list.findIndex(e => e.id === id);
    const [el] = list.splice(i, 1);
    const to = dir === 'front' ? list.length : dir === 'back' ? 0 : Math.max(0, Math.min(list.length, i + dir));
    list.splice(to, 0, el);
    return { ...d, elements: list };
  });

  // Keyboard shortcuts (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable || preview) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (!sel) return;
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(sel.id); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); if (!sel.locked) remove(sel.id); return; }
      if (e.key === 'Escape') { select(null); return; }
      const step = e.shiftKey ? 10 : 1;
      const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (move && !sel.locked) { e.preventDefault(); patchEl(sel.id, { x: sel.x + move[0], y: sel.y + move[1] }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, undo, redo, duplicate, remove, patchEl, preview]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /** Drag to move, or drag a handle to resize, with snapping to the canvas and other elements */
  const startDrag = (e: React.PointerEvent, el: PopupElement, handle?: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    select(el.id);
    if (el.locked) return;
    const start = { px: e.clientX, py: e.clientY, x: el.x, y: el.y, w: el.w, h: el.h };
    const others = design.elements.filter(o => o.id !== el.id && !o.hidden);
    const xs = [0, design.width / 2, design.width, ...others.flatMap(o => [o.x, o.x + o.w / 2, o.x + o.w])];
    const ys = [0, design.height / 2, design.height, ...others.flatMap(o => [o.y, o.y + o.h / 2, o.y + o.h])];
    let recorded = false;

    const snap = (edges: number[], targets: number[]) => {
      let best: { d: number; line: number } | null = null;
      for (const edge of edges) for (const tg of targets) {
        const d = tg - edge;
        if (Math.abs(d) <= SNAP && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, line: tg };
      }
      return best;
    };

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.px) / scale;
      const dy = (ev.clientY - start.py) / scale;
      if (!recorded && Math.abs(dx) + Math.abs(dy) < 2) return;
      let { x, y, w, h } = start;
      const gx: number[] = [], gy: number[] = [];
      if (!handle) {
        x = Math.round(start.x + dx); y = Math.round(start.y + dy);
        if (!ev.altKey) {
          const sx = snap([x, x + w / 2, x + w], xs); if (sx) { x += sx.d; gx.push(sx.line); }
          const sy = snap([y, y + h / 2, y + h], ys); if (sy) { y += sy.d; gy.push(sy.line); }
        }
        // Keep the element on the canvas (anything outside would be clipped anyway)
        x = Math.min(Math.max(x, Math.min(0, design.width - w)), Math.max(0, design.width - w));
        y = Math.min(Math.max(y, Math.min(0, design.height - h)), Math.max(0, design.height - h));
      } else {
        if (handle.includes('e')) w = Math.max(20, Math.round(start.w + dx));
        if (handle.includes('s')) h = Math.max(20, Math.round(start.h + dy));
        if (handle.includes('w')) { w = Math.max(20, Math.round(start.w - dx)); x = start.x + start.w - w; }
        if (handle.includes('n')) { h = Math.max(20, Math.round(start.h - dy)); y = start.y + start.h - h; }
        if (!ev.altKey) {
          if (handle.includes('e')) { const s = snap([x + w], xs); if (s) { w += s.d; gx.push(s.line); } }
          if (handle.includes('s')) { const s = snap([y + h], ys); if (s) { h += s.d; gy.push(s.line); } }
        }
      }
      setGuides({ x: gx, y: gy });
      patchEl(el.id, { x, y, w, h }, !recorded);
      recorded = true;
    };
    const onUp = () => {
      setGuides({ x: [], y: [] });
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const save = async () => {
    setSaving(true);
    try { await onSave(popup); setDirty(false); } finally { setSaving(false); }
  };
  const close = () => { if (!dirty || window.confirm(t('لديك تغييرات غير محفوظة. الخروج دون حفظ؟', 'You have unsaved changes. Leave without saving?'))) onClose(); };
  const langAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-[70] bg-slate-100 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} role="dialog" aria-modal aria-label={t('محرر الإعلان المنبثق', 'Popup builder')}>
      {/* Top bar */}
      <header className="h-16 shrink-0 bg-white border-b flex items-center gap-3 px-4">
        <Button variant="ghost" size="icon" onClick={close} aria-label={t('إغلاق المحرر', 'Close builder')}><X size={20} /></Button>
        <Input value={popup.titleAr} onChange={e => { setPopup(p => ({ ...p, titleAr: e.target.value })); setDirty(true); }} placeholder={t('اسم الإعلان (عربي)', 'Name (Arabic)')} aria-label={t('اسم الإعلان بالعربية', 'Arabic name')} dir="rtl" className="w-56 h-9 font-bold" />
        <Input value={popup.titleEn} onChange={e => { setPopup(p => ({ ...p, titleEn: e.target.value })); setDirty(true); }} placeholder="Name (English)" aria-label={t('اسم الإعلان بالإنجليزية', 'English name')} dir="ltr" className="w-48 h-9 font-bold hidden md:block" />
        <div className="ms-auto flex items-center gap-1.5">
          <Seg value={lang} onChange={v => setLang(v as 'ar' | 'en')} options={[['ar', 'عربي'], ['en', 'EN']]} label={t('لغة المعاينة', 'Preview language')} />
          <Seg value={device} onChange={v => setDevice(v as 'desktop' | 'mobile')} label={t('الجهاز', 'Device')}
            options={[['desktop', <Monitor key="d" size={15} aria-label={t('حاسوب', 'Desktop')} />], ['mobile', <Smartphone key="m" size={15} aria-label={t('جوال', 'Mobile')} />]]} />
          <span className="w-px h-6 bg-slate-200 mx-1" />
          <Button variant="ghost" size="icon" onClick={undo} disabled={!past.length} aria-label={t('تراجع', 'Undo')} title="Ctrl+Z"><Undo2 size={17} className={cn(isAr && '-scale-x-100')} /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!future.length} aria-label={t('إعادة', 'Redo')} title="Ctrl+Y"><Redo2 size={17} className={cn(isAr && '-scale-x-100')} /></Button>
          <Button variant="outline" onClick={() => setPreview(true)} className="h-9 rounded-xl font-black gap-1.5"><Eye size={16} />{t('معاينة', 'Preview')}</Button>
          <Button onClick={save} disabled={saving} className="h-9 rounded-xl font-black gap-1.5 bg-[#0f9e9b] hover:bg-[#0c8784]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{t('حفظ ونشر', 'Save & publish')}{dirty && <span className="size-2 rounded-full bg-amber-300" aria-label={t('تغييرات غير محفوظة', 'unsaved')} />}
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Elements + layers */}
        <aside className="w-60 shrink-0 bg-white border-e overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-xs font-black text-slate-500 mb-2">{t('إضافة عنصر', 'Add element')}</h3>
            <div className="grid grid-cols-3 gap-2">
              {PALETTE.map(p => (
                <button key={p.kind} type="button" onClick={() => add(p.kind)}
                  className="aspect-square rounded-xl bg-slate-50 ring-1 ring-slate-100 hover:bg-[#0f9e9b]/10 hover:ring-[#0f9e9b]/40 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f9e9b]">
                  <p.icon size={18} className="text-[#0f9e9b]" aria-hidden />{isAr ? p.ar : p.en}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-xs font-black text-slate-500 mb-2">{t('الطبقات', 'Layers')} ({design.elements.length})</h3>
            <ol className="space-y-1">
              {[...design.elements].reverse().map(el => {
                const K = KIND_LABEL[el.kind];
                const label = (langAr ? el.textAr : el.textEn || el.textAr) || (isAr ? K.ar : K.en);
                return (
                  <li key={el.id} className={cn('group flex items-center gap-1 rounded-lg px-2 h-9 text-xs font-bold', selected === el.id ? 'bg-[#0f9e9b]/10 text-[#005751]' : 'hover:bg-slate-50 text-slate-600')}>
                    <button type="button" onClick={() => select(el.id)} className="flex-1 min-w-0 flex items-center gap-2 text-start">
                      <K.icon size={14} className="shrink-0" aria-hidden /><span className={cn('truncate', el.hidden && 'line-through opacity-50')}>{label}</span>
                    </button>
                    <IconBtn label={el.hidden ? t('إظهار', 'Show') : t('إخفاء', 'Hide')} onClick={() => patchEl(el.id, { hidden: !el.hidden })}>{el.hidden ? <EyeOff size={13} /> : <Eye size={13} />}</IconBtn>
                    <IconBtn label={el.locked ? t('فك القفل', 'Unlock') : t('قفل', 'Lock')} onClick={() => patchEl(el.id, { locked: !el.locked })}>{el.locked ? <Lock size={13} /> : <Unlock size={13} />}</IconBtn>
                  </li>
                );
              })}
            </ol>
            {!design.elements.length && <p className="text-xs font-bold text-slate-400">{t('أضف عنصراً من الأعلى', 'Add an element above')}</p>}
          </section>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
            {t('اسحب العناصر لتحريكها ومن الزوايا لتغيير الحجم. الأسهم للتحريك الدقيق، Alt لإيقاف المحاذاة التلقائية.', 'Drag to move, drag corners to resize. Arrow keys nudge; hold Alt to disable snapping.')}
          </p>
        </aside>

        {/* Canvas */}
        <main ref={stageRef} className="flex-1 min-w-0 relative overflow-auto flex items-center justify-center"
          style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '18px 18px' }}
          onPointerDown={() => select(null)}>
          {device === 'mobile' ? (
            <div className="rounded-[2.5rem] bg-slate-900 p-3 shadow-2xl" onPointerDown={e => e.stopPropagation()}>
              <div className="w-[360px] h-[700px] rounded-[2rem] overflow-hidden relative flex items-center justify-center" style={{ background: design.overlay === 'rgba(0,0,0,0)' ? '#e2e8f0' : `linear-gradient(${design.overlay}, ${design.overlay}), #e2e8f0` }}>
                <ScaledCanvas design={design} maxWidth={328} maxHeight={660}>{() => <PopupCanvas design={design} isAr={langAr} editing />}</ScaledCanvas>
              </div>
              <p className="text-center text-[11px] font-bold text-white/60 mt-2">{t('معاينة الجوال — التحرير في وضع الحاسوب', 'Mobile preview — edit in desktop view')}</p>
            </div>
          ) : (
            <div style={{ width: design.width * scale, height: design.height * scale }} className="relative shrink-0 shadow-2xl" onPointerDown={e => e.stopPropagation()}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: design.width, height: design.height }} className="absolute top-0 left-0">
                <PopupCanvas design={design} isAr={langAr} editing>
                  {design.elements.map(el => el.hidden ? null : (
                    <div key={el.id} style={{ ...elementBox(el), cursor: el.locked ? 'default' : 'move', touchAction: 'none' }}
                      onPointerDown={e => startDrag(e, el)}
                      onDoubleClick={() => { select(el.id); setPanel('element'); }}
                      className={cn('select-none', selected === el.id ? 'outline outline-2 outline-[#0f9e9b]' : 'hover:outline hover:outline-1 hover:outline-[#0f9e9b]/60')}>
                      <div className="w-full h-full overflow-hidden pointer-events-none"><PopupElementView el={el} isAr={langAr} editing /></div>
                      {selected === el.id && !el.locked && HANDLES.map(h => (
                        <span key={h.id} onPointerDown={e => startDrag(e, el, h.id)} style={{ cursor: h.cursor, transform: `scale(${1 / scale})` }}
                          className={cn('absolute size-3 rounded-full bg-white border-2 border-[#0f9e9b] z-10', h.cls)} aria-hidden />
                      ))}
                      {selected === el.id && (
                        <span dir="ltr" className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-[#005751] text-white text-[10px] font-bold px-1.5 py-0.5 pointer-events-none" style={{ transform: `scale(${1 / scale})`, transformOrigin: 'bottom left' }}>
                          {Math.round(el.w)} × {Math.round(el.h)}
                        </span>
                      )}
                    </div>
                  ))}
                  {guides.x.map(x => <span key={`x${x}`} className="absolute top-0 bottom-0 w-px bg-fuchsia-500 pointer-events-none" style={{ left: x }} />)}
                  {guides.y.map(y => <span key={`y${y}`} className="absolute left-0 right-0 h-px bg-fuchsia-500 pointer-events-none" style={{ top: y }} />)}
                </PopupCanvas>
              </div>
              {design.closeButton && <span className="absolute top-3 right-3 size-8 rounded-full bg-black/35 text-white flex items-center justify-center pointer-events-none" aria-hidden><X size={16} /></span>}
            </div>
          )}
          <span className="absolute bottom-3 start-3 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-bold text-slate-500" dir="ltr">{design.width} × {design.height} · {Math.round(scale * 100)}%</span>
        </main>

        {/* Properties */}
        <aside className="w-80 shrink-0 bg-white border-s flex flex-col min-h-0">
          <div className="p-2 border-b grid grid-cols-3 gap-1" role="tablist">
            {([['element', t('العنصر', 'Element')], ['canvas', t('النافذة', 'Popup')], ['display', t('العرض', 'Display')]] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={panel === id} type="button" onClick={() => setPanel(id)} disabled={id === 'element' && !sel}
                className={cn('h-8 rounded-lg text-xs font-black disabled:opacity-40', panel === id ? 'bg-[#0f9e9b] text-white' : 'text-slate-600 hover:bg-slate-100')}>{label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {panel === 'element' && sel && <ElementPanel el={sel} t={t} isAr={isAr} patch={(p, r) => patchEl(sel.id, p, r)}
              onDuplicate={() => duplicate(sel.id)} onDelete={() => remove(sel.id)} onOrder={d => reorder(sel.id, d)} />}
            {panel === 'canvas' && <CanvasPanel design={design} t={t} isAr={isAr} set={setDesign} />}
            {panel === 'display' && <DisplayPanel popup={popup} t={t} set={p => { setPopup(x => ({ ...x, ...p })); setDirty(true); }} />}
          </div>
        </aside>
      </div>

      {preview && <DesignedPopup popup={{ ...popup, isActive: true }} isAr={langAr} onClose={() => setPreview(false)} />}
    </div>
  );
}

type T = (ar: string, en: string) => string;

function Seg({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, React.ReactNode][]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-slate-100 p-0.5">
      {options.map(([v, node]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn('h-8 min-w-8 px-2.5 rounded-lg text-xs font-black flex items-center justify-center', value === v ? 'bg-white shadow text-[#005751]' : 'text-slate-500')}>{node}</button>
      ))}
    </div>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={cn('size-7 rounded-md flex items-center justify-center shrink-0', danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-500 hover:bg-slate-100')}>{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-[11px] font-black text-slate-500">{label}</span>{children}</label>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h4 className="text-xs font-black text-slate-800">{title}</h4>{children}</section>;
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)} aria-label={c} title={c}
            className={cn('size-6 rounded-full ring-1 ring-slate-200', value === c && 'ring-2 ring-[#0f9e9b] ring-offset-1')}
            style={{ background: c === 'transparent' ? 'repeating-conic-gradient(#e2e8f0 0 25%, #fff 0 50%) 50% / 8px 8px' : c }} />
        ))}
        <input type="color" value={hex} onChange={e => onChange(e.target.value)} aria-label={`${label} (custom)`} className="size-7 rounded cursor-pointer bg-transparent" />
      </div>
    </Field>
  );
}

function Num({ label, value, onChange, min, max, step = 1 }: { label: string; value: number | undefined; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return <Field label={label}><Input type="number" dir="ltr" value={value ?? ''} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="h-8 text-xs font-bold" /></Field>;
}

function ImageSource({ value, onChange, t, maxSide = 1200 }: { value?: string; onChange: (v: string) => void; t: T; maxSide?: number }) {
  const [busy, setBusy] = useState(false);
  const [kb, setKb] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      <Input dir="ltr" value={value?.startsWith('data:') ? '' : value || ''} onChange={e => onChange(e.target.value)} placeholder={value?.startsWith('data:') ? t('صورة مرفوعة', 'Uploaded image') : 'https://…'} className="h-8 text-xs" aria-label={t('رابط الصورة', 'Image URL')} />
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black cursor-pointer">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{t('رفع صورة', 'Upload')}
          <input type="file" accept="image/*" className="sr-only" onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            setBusy(true);
            try { const url = await fileToDataUrl(f, maxSide); setKb(dataUrlKb(url)); onChange(url); } finally { setBusy(false); e.target.value = ''; }
          }} />
        </label>
        {value && <button type="button" onClick={() => onChange('')} className="text-xs font-bold text-red-500">{t('إزالة', 'Remove')}</button>}
      </div>
      {kb !== null && <p className={cn('text-[11px] font-bold', kb > 250 ? 'text-amber-600' : 'text-slate-400')}>{kb} KB{kb > 250 ? t(' — كبيرة؛ يفضّل رابط صورة', ' — large; a link is better') : ''}</p>}
    </div>
  );
}

function ElementPanel({ el, t, isAr, patch, onDuplicate, onDelete, onOrder }: {
  el: PopupElement; t: T; isAr: boolean; patch: (p: Partial<PopupElement>, record?: boolean) => void;
  onDuplicate: () => void; onDelete: () => void; onOrder: (d: 1 | -1 | 'front' | 'back') => void;
}) {
  const s = el.style;
  const st = (p: Partial<PopupElement['style']>) => patch({ style: p });
  const hasText = ['heading', 'text', 'button', 'event'].includes(el.kind);
  const typed = ['heading', 'text', 'button', 'countdown'].includes(el.kind);
  const K = KIND_LABEL[el.kind];
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-black text-slate-800"><K.icon size={16} className="text-[#0f9e9b]" />{isAr ? K.ar : K.en}</p>
        <div className="flex">
          <IconBtn label={t('إلى الأمام', 'Bring forward')} onClick={() => onOrder(1)}><ArrowUp size={14} /></IconBtn>
          <IconBtn label={t('إلى الخلف', 'Send backward')} onClick={() => onOrder(-1)}><ArrowDown size={14} /></IconBtn>
          <IconBtn label={t('نسخ (Ctrl+D)', 'Duplicate (Ctrl+D)')} onClick={onDuplicate}><Copy size={14} /></IconBtn>
          <IconBtn label={t('حذف', 'Delete')} onClick={onDelete} danger><Trash2 size={14} /></IconBtn>
        </div>
      </div>

      <Group title={t('المحتوى', 'Content')}>
        {hasText && <>
          <Field label={el.kind === 'button' ? t('نص الزر (عربي)', 'Label (Arabic)') : el.kind === 'event' ? t('اسم الموعد (عربي)', 'Event name (Arabic)') : t('النص (عربي)', 'Text (Arabic)')}>
            <Textarea dir="rtl" value={el.textAr || ''} onChange={e => patch({ textAr: e.target.value })} className="min-h-[60px] text-sm" />
          </Field>
          <Field label={t('النص (إنجليزي)', 'Text (English)')}>
            <Textarea dir="ltr" value={el.textEn || ''} onChange={e => patch({ textEn: e.target.value })} className="min-h-[60px] text-sm" />
          </Field>
        </>}
        {el.kind === 'image' && <><ImageSource value={el.src} onChange={v => patch({ src: v })} t={t} />
          <Field label={t('وصف الصورة (لقارئ الشاشة)', 'Alt text')}><Input value={el.textAr || ''} onChange={e => patch({ textAr: e.target.value })} className="h-8 text-xs" /></Field></>}
        {el.kind === 'video' && <Field label={t('رابط يوتيوب أو ملف MP4', 'YouTube or MP4 link')}><Input dir="ltr" value={el.src || ''} onChange={e => patch({ src: e.target.value })} placeholder="https://youtube.com/watch?v=…" className="h-8 text-xs" /></Field>}
        {el.kind === 'button' && <>
          <Field label={t('عند الضغط', 'On click')}>
            <select value={el.action || 'link'} onChange={e => patch({ action: e.target.value as 'link' | 'close' })} className="w-full h-8 rounded-md border px-2 text-xs font-bold">
              <option value="link">{t('فتح رابط', 'Open a link')}</option>
              <option value="close">{t('إغلاق النافذة', 'Close the popup')}</option>
            </select>
          </Field>
          {el.action !== 'close' && <>
            <Field label={t('الرابط URL', 'Link URL')}><Input dir="ltr" value={el.url || ''} onChange={e => patch({ url: e.target.value })} placeholder="https://" className="h-8 text-xs" /></Field>
            <label className="flex items-center justify-between text-xs font-bold text-slate-600">{t('فتح في نافذة جديدة', 'Open in a new tab')}<Switch checked={!!el.newTab} onCheckedChange={v => patch({ newTab: v })} /></label>
          </>}
        </>}
        {(el.kind === 'countdown' || el.kind === 'event') && (
          <Field label={el.kind === 'countdown' ? t('العدّ حتى', 'Count down to') : t('تاريخ ووقت الموعد', 'Date & time')}>
            <Input type="datetime-local" dir="ltr" value={el.date || ''} onChange={e => patch({ date: e.target.value })} className="h-8 text-xs" />
          </Field>
        )}
        {el.kind === 'event' && <>
          <Field label={t('المكان (عربي)', 'Location (Arabic)')}><Input dir="rtl" value={el.locationAr || ''} onChange={e => patch({ locationAr: e.target.value })} className="h-8 text-xs" /></Field>
          <Field label={t('المكان (إنجليزي)', 'Location (English)')}><Input dir="ltr" value={el.locationEn || ''} onChange={e => patch({ locationEn: e.target.value })} className="h-8 text-xs" /></Field>
          <p className="text-[11px] font-bold text-slate-400">{t('يظهر للزائر زر «أضف إلى التقويم».', 'Visitors get an “Add to calendar” button.')}</p>
        </>}
        {el.kind === 'icon' && (
          <div className="grid grid-cols-6 gap-1.5">
            {ICON_CHOICES.map(name => {
              const I = (Icons as unknown as Record<string, React.ElementType>)[name];
              return I ? <button key={name} type="button" onClick={() => patch({ icon: name })} aria-label={name} title={name}
                className={cn('aspect-square rounded-lg flex items-center justify-center', el.icon === name ? 'bg-[#0f9e9b] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100')}><I size={16} /></button> : null;
            })}
          </div>
        )}
      </Group>

      <Group title={t('التنسيق', 'Style')}>
        {(typed || el.kind === 'event' || el.kind === 'icon') && <ColorField label={t('لون النص', 'Text colour')} value={s.color} onChange={v => st({ color: v })} />}
        {el.kind !== 'image' && el.kind !== 'video' && <ColorField label={t('الخلفية', 'Background')} value={s.bg} onChange={v => st({ bg: v })} />}
        {typed && <>
          <Field label={`${t('حجم الخط', 'Font size')} · ${s.fontSize ?? 16}px`}>
            <input type="range" min={10} max={72} value={s.fontSize ?? 16} onChange={e => st({ fontSize: Number(e.target.value) })} className="w-full accent-[#0f9e9b]" />
          </Field>
          {el.kind !== 'countdown' && <div className="flex items-center gap-2">
            <select value={s.fontWeight ?? 700} onChange={e => st({ fontWeight: Number(e.target.value) as 400 | 700 | 900 })} className="h-8 rounded-md border px-2 text-xs font-bold flex-1" aria-label={t('سماكة الخط', 'Weight')}>
              <option value={400}>{t('عادي', 'Regular')}</option><option value={700}>{t('عريض', 'Bold')}</option><option value={900}>{t('عريض جداً', 'Black')}</option>
            </select>
            <Seg value={s.align || 'center'} onChange={v => st({ align: v as 'start' | 'center' | 'end' })} label={t('المحاذاة', 'Alignment')}
              options={[['start', isAr ? <AlignRight key="s" size={14} /> : <AlignLeft key="s" size={14} />], ['center', <AlignCenter key="c" size={14} />], ['end', isAr ? <AlignLeft key="e" size={14} /> : <AlignRight key="e" size={14} />]]} />
          </div>}
        </>}
        {el.kind === 'image' && <Field label={t('ملاءمة الصورة', 'Fit')}>
          <Seg value={s.fit || 'cover'} onChange={v => st({ fit: v as 'cover' | 'contain' })} label={t('ملاءمة', 'Fit')} options={[['cover', t('ملء', 'Cover')], ['contain', t('احتواء', 'Contain')]]} />
        </Field>}
        <div className="grid grid-cols-2 gap-2">
          <Num label={t('استدارة الزوايا', 'Corner radius')} value={s.radius ?? 0} min={0} max={999} onChange={v => st({ radius: v })} />
          <Num label={t('الشفافية %', 'Opacity %')} value={Math.round((s.opacity ?? 1) * 100)} min={0} max={100} onChange={v => st({ opacity: Math.max(0, Math.min(100, v)) / 100 })} />
          <Num label={t('سماكة الإطار', 'Border')} value={s.borderWidth ?? 0} min={0} max={20} onChange={v => st({ borderWidth: v })} />
          <label className="flex items-end justify-between gap-2 text-[11px] font-black text-slate-500 pb-1.5">{t('ظل', 'Shadow')}<Switch checked={!!s.shadow} onCheckedChange={v => st({ shadow: v })} /></label>
        </div>
        {!!s.borderWidth && <ColorField label={t('لون الإطار', 'Border colour')} value={s.borderColor} onChange={v => st({ borderColor: v })} />}
      </Group>

      <Group title={t('الموضع والحجم', 'Position & size')}>
        <div className="grid grid-cols-2 gap-2">
          <Num label="X" value={el.x} onChange={v => patch({ x: v })} />
          <Num label="Y" value={el.y} onChange={v => patch({ y: v })} />
          <Num label={t('العرض', 'Width')} value={el.w} min={20} onChange={v => patch({ w: Math.max(20, v) })} />
          <Num label={t('الارتفاع', 'Height')} value={el.h} min={20} onChange={v => patch({ h: Math.max(20, v) })} />
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" className="flex-1 h-8 text-xs font-bold" onClick={() => onOrder('front')}>{t('للأمام تماماً', 'To front')}</Button>
          <Button type="button" size="sm" variant="outline" className="flex-1 h-8 text-xs font-bold" onClick={() => onOrder('back')}>{t('للخلف تماماً', 'To back')}</Button>
        </div>
      </Group>
    </>
  );
}

function CanvasPanel({ design: d, t, isAr, set }: { design: PopupDesign; t: T; isAr: boolean; set: (fn: (d: PopupDesign) => PopupDesign) => void }) {
  const patch = (p: Partial<PopupDesign>) => set(x => ({ ...x, ...p }));
  const overlayAlpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(d.overlay)?.[1] ?? 0.6);
  return (
    <>
      <Group title={t('المقاس', 'Size')}>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map(s => (
            <button key={`${s.w}x${s.h}`} type="button" onClick={() => patch({ width: s.w, height: s.h })}
              className={cn('h-8 px-2.5 rounded-lg text-[11px] font-black', d.width === s.w && d.height === s.h ? 'bg-[#0f9e9b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
              {isAr ? s.ar : s.en} <span dir="ltr" className="opacity-70">{s.w}×{s.h}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Num label={t('العرض', 'Width')} value={d.width} min={200} max={1200} onChange={v => patch({ width: Math.max(200, Math.min(1200, v)) })} />
          <Num label={t('الارتفاع', 'Height')} value={d.height} min={80} max={1000} onChange={v => patch({ height: Math.max(80, Math.min(1000, v)) })} />
        </div>
      </Group>
      <Group title={t('الخلفية', 'Background')}>
        <ColorField label={t('لون الخلفية', 'Colour')} value={d.background} onChange={v => patch({ background: v })} />
        <Field label={t('صورة خلفية', 'Background image')}><ImageSource value={d.backgroundImage} onChange={v => patch({ backgroundImage: v || undefined })} t={t} maxSide={1400} /></Field>
        <Num label={t('استدارة الزوايا', 'Corner radius')} value={d.radius} min={0} max={80} onChange={v => patch({ radius: v })} />
      </Group>
      <Group title={t('الموضع والحركة', 'Placement & motion')}>
        <Field label={t('مكان الظهور', 'Position')}>
          <select value={d.position} onChange={e => patch({ position: e.target.value as PopupDesign['position'] })} className="w-full h-8 rounded-md border px-2 text-xs font-bold">
            <option value="center">{t('وسط الشاشة', 'Centre')}</option>
            <option value="top">{t('أعلى الشاشة', 'Top')}</option>
            <option value="bottom-end">{t('الزاوية السفلية (نهاية)', 'Bottom corner (end)')}</option>
            <option value="bottom-start">{t('الزاوية السفلية (بداية)', 'Bottom corner (start)')}</option>
          </select>
        </Field>
        <Field label={t('حركة الظهور', 'Entrance')}>
          <select value={d.animation} onChange={e => patch({ animation: e.target.value as PopupDesign['animation'] })} className="w-full h-8 rounded-md border px-2 text-xs font-bold">
            <option value="zoom">{t('تكبير', 'Zoom')}</option><option value="fade">{t('تلاشٍ', 'Fade')}</option>
            <option value="slide-up">{t('انزلاق للأعلى', 'Slide up')}</option><option value="none">{t('بدون', 'None')}</option>
          </select>
        </Field>
        <Field label={`${t('تعتيم الخلفية', 'Backdrop dimming')} · ${Math.round(overlayAlpha * 100)}%`}>
          <input type="range" min={0} max={90} value={Math.round(overlayAlpha * 100)} onChange={e => patch({ overlay: `rgba(15,23,42,${Number(e.target.value) / 100})` })} className="w-full accent-[#0f9e9b]" />
        </Field>
        <label className="flex items-center justify-between text-xs font-bold text-slate-600">{t('زر الإغلاق', 'Close button')}<Switch checked={d.closeButton} onCheckedChange={v => patch({ closeButton: v })} /></label>
        <label className="flex items-center justify-between text-xs font-bold text-slate-600">{t('الإغلاق بالنقر خارج النافذة', 'Close on outside click')}<Switch checked={d.closeOnOverlay} onCheckedChange={v => patch({ closeOnOverlay: v })} /></label>
      </Group>
    </>
  );
}

function DisplayPanel({ popup: p, t, set }: { popup: PopupMessage; t: T; set: (p: Partial<PopupMessage>) => void }) {
  // datetime-local wants local "YYYY-MM-DDTHH:mm"; stored as ISO
  const toLocal = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const fromLocal = (v: string) => (v ? new Date(v).toISOString() : undefined);
  return (
    <>
      <Group title={t('النشر', 'Publishing')}>
        <label className="flex items-center justify-between text-sm font-black text-slate-700">{t('مفعّل على الصفحة الرئيسية', 'Active on the home page')}<Switch checked={p.isActive} onCheckedChange={v => set({ isActive: v })} /></label>
        <p className="text-[11px] font-bold text-slate-400">{t('إذا فُعّل أكثر من إعلان يظهر أول إعلان مؤهل حسب الترتيب والجدولة.', 'If several are active, the first eligible one shows.')}</p>
      </Group>
      <Group title={t('التوقيت', 'Timing')}>
        <Num label={t('الظهور بعد (ثوانٍ)', 'Show after (seconds)')} value={p.displayDelay ?? 0} min={0} max={120} onChange={v => set({ displayDelay: Math.max(0, v) })} />
        <Field label={t('تكرار الظهور للزائر', 'How often per visitor')}>
          <select value={p.frequency || 'always'} onChange={e => set({ frequency: e.target.value as PopupMessage['frequency'] })} className="w-full h-8 rounded-md border px-2 text-xs font-bold">
            <option value="always">{t('في كل زيارة', 'Every visit')}</option>
            <option value="session">{t('مرة في كل جلسة', 'Once per session')}</option>
            <option value="day">{t('مرة يومياً', 'Once a day')}</option>
            <option value="once">{t('مرة واحدة فقط', 'Only once')}</option>
          </select>
        </Field>
      </Group>
      <Group title={t('الجدولة', 'Schedule')}>
        <Field label={t('يبدأ الظهور', 'Starts')}><Input type="datetime-local" dir="ltr" value={toLocal(p.startAt)} onChange={e => set({ startAt: fromLocal(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label={t('ينتهي الظهور', 'Ends')}><Input type="datetime-local" dir="ltr" value={toLocal(p.endAt)} onChange={e => set({ endAt: fromLocal(e.target.value) })} className="h-8 text-xs" /></Field>
        <p className="text-[11px] font-bold text-slate-400">{t('اتركهما فارغين للظهور دون قيود زمنية.', 'Leave empty for no time limits.')}</p>
      </Group>
    </>
  );
}
