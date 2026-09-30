'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { CalendarPlus, Clock, ImageIcon, MapPin, PlayCircle } from 'lucide-react';
import { PopupDesign, PopupElement, icsFor } from '@/lib/popup-design';
import { parseVideo } from '@/lib/video';
import { cn } from '@/lib/utils';

/*
 * Renders a popup design at its own pixel size. The builder and the live popup both use it,
 * so the editor preview is exactly what visitors get. `editing` swaps live widgets (video,
 * links) for inert previews so dragging works.
 */

const ALIGN = { start: 'start', center: 'center', end: 'end' } as const;

export function elementBox(el: PopupElement): React.CSSProperties {
  const s = el.style;
  return {
    position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
    color: s.color, background: s.bg, borderRadius: s.radius,
    border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor || '#e2e8f0'}` : undefined,
    opacity: s.opacity ?? 1,
    boxShadow: s.shadow ? '0 12px 28px -8px rgba(15,23,42,0.35)' : undefined,
  };
}

export function PopupElementView({ el, isAr, editing, onClose }: { el: PopupElement; isAr: boolean; editing?: boolean; onClose?: () => void }) {
  const s = el.style;
  const text = (isAr ? el.textAr : el.textEn || el.textAr) || '';
  const textStyle: React.CSSProperties = { fontSize: s.fontSize, fontWeight: s.fontWeight, textAlign: ALIGN[s.align || 'center'] };
  const dir = isAr ? 'rtl' : 'ltr';

  switch (el.kind) {
    case 'heading':
    case 'text':
      return (
        <div dir={dir} role={el.kind === 'heading' ? 'heading' : undefined} aria-level={el.kind === 'heading' ? 2 : undefined}
          className="w-full h-full whitespace-pre-wrap leading-snug overflow-hidden" style={textStyle}>{text}</div>
      );
    case 'image':
      return el.src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={el.src} alt={text} draggable={false} className="w-full h-full" style={{ objectFit: s.fit || 'cover', borderRadius: s.radius }} />
        : <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 text-sm font-bold" style={{ borderRadius: s.radius }}><ImageIcon size={28} />{isAr ? 'أضف صورة' : 'Add an image'}</div>;
    case 'button': {
      const cls = 'w-full h-full flex items-center justify-center px-4 transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#03CFCB]';
      const style = { ...textStyle, color: s.color, background: s.bg, borderRadius: s.radius };
      if (editing) return <span dir={dir} className={cls} style={style}>{text}</span>;
      if (el.action === 'close' || !el.url || el.url === 'https://') return <button type="button" dir={dir} onClick={onClose} className={cls} style={style}>{text}</button>;
      return (
        <a href={el.url} dir={dir} target={el.newTab ? '_blank' : undefined} rel={el.newTab ? 'noopener noreferrer' : undefined} onClick={() => !el.newTab && onClose?.()} className={cls} style={style}>
          {text}{el.newTab && <span className="sr-only">{isAr ? '(يفتح في نافذة جديدة)' : '(opens in a new tab)'}</span>}
        </a>
      );
    }
    case 'countdown': return <Countdown el={el} isAr={isAr} />;
    case 'event': return <EventCard el={el} isAr={isAr} editing={editing} />;
    case 'video': {
      const v = el.src ? parseVideo(el.src) : null;
      if (editing || !v) {
        return <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900 text-white/70 text-sm font-bold" style={{ borderRadius: s.radius }}><PlayCircle size={40} />{v ? (isAr ? 'فيديو' : 'Video') : (isAr ? 'أضف رابط الفيديو' : 'Add a video link')}</div>;
      }
      return (
        <div className="w-full h-full overflow-hidden bg-black" style={{ borderRadius: s.radius }}>
          {v.kind === 'youtube'
            ? <iframe src={v.embedUrl} title={text || (isAr ? 'فيديو' : 'Video')} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            : v.kind === 'file' ? <video src={v.url} controls playsInline className="w-full h-full" />
            : <a href={v.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center text-white font-black underline">{isAr ? 'مشاهدة الفيديو' : 'Watch the video'}</a>}
        </div>
      );
    }
    case 'shape': return <div className="w-full h-full" aria-hidden />;
    case 'icon': {
      const Icon = (el.icon && (Icons as unknown as Record<string, React.ElementType>)[el.icon]) || Icons.Megaphone;
      return <div className="w-full h-full flex items-center justify-center" aria-hidden><Icon style={{ width: '50%', height: '50%' }} /></div>;
    }
  }
}

function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}

function Countdown({ el, isAr }: { el: PopupElement; isAr: boolean }) {
  const now = useNow(1000);
  const target = el.date ? new Date(el.date).getTime() : NaN;
  const left = Math.max(0, target - now);
  const parts = [
    [Math.floor(left / 86_400_000), isAr ? 'يوم' : 'days'],
    [Math.floor(left / 3_600_000) % 24, isAr ? 'ساعة' : 'hours'],
    [Math.floor(left / 60_000) % 60, isAr ? 'دقيقة' : 'min'],
    [Math.floor(left / 1000) % 60, isAr ? 'ثانية' : 'sec'],
  ] as const;
  const fs = el.style.fontSize || 30;
  if (!Number.isFinite(target)) return <div className="w-full h-full flex items-center justify-center font-bold">{isAr ? 'حدد التاريخ' : 'Set a date'}</div>;
  if (left === 0) return <div className="w-full h-full flex items-center justify-center font-black" style={{ fontSize: fs * 0.7 }}>{isAr ? 'بدأ الموعد' : 'It has started'}</div>;
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} role="timer" aria-live="off" className="w-full h-full flex items-center justify-around px-2">
      {parts.map(([n, label]) => (
        <div key={label} className="text-center leading-none">
          <div className="font-black tabular-nums" style={{ fontSize: fs }}>{String(n).padStart(2, '0')}</div>
          <div className="font-bold opacity-75 mt-1.5" style={{ fontSize: Math.max(11, fs * 0.4) }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function EventCard({ el, isAr, editing }: { el: PopupElement; isAr: boolean; editing?: boolean }) {
  const d = el.date ? new Date(el.date) : null;
  const loc = isAr ? el.locationAr : el.locationEn || el.locationAr;
  const locale = isAr ? 'ar-OM' : 'en-GB';
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full h-full flex items-stretch gap-3 p-3 overflow-hidden">
      <div className="shrink-0 w-20 rounded-2xl bg-[#0f9e9b] text-white flex flex-col items-center justify-center leading-none">
        <span className="text-3xl font-black">{d ? d.getDate() : '--'}</span>
        <span className="text-xs font-bold mt-1">{d ? d.toLocaleDateString(locale, { month: 'short' }) : ''}</span>
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 text-start">
        <p className="font-black text-base leading-snug line-clamp-2">{(isAr ? el.textAr : el.textEn || el.textAr) || ''}</p>
        {d && <p className="text-xs font-bold opacity-75 flex items-center gap-1.5"><Clock size={13} aria-hidden />{d.toLocaleDateString(locale, { weekday: 'long' })} · {d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</p>}
        {loc && <p className="text-xs font-bold opacity-75 flex items-center gap-1.5 truncate"><MapPin size={13} aria-hidden />{loc}</p>}
      </div>
      {d && (editing
        ? <span className="self-center shrink-0 size-9 rounded-xl bg-slate-100 text-[#005751] flex items-center justify-center"><CalendarPlus size={18} /></span>
        : <a href={icsFor(el, isAr)} download="event.ics" title={isAr ? 'أضف إلى التقويم' : 'Add to calendar'} className="self-center shrink-0 size-9 rounded-xl bg-slate-100 text-[#005751] flex items-center justify-center hover:bg-slate-200">
            <CalendarPlus size={18} aria-hidden /><span className="sr-only">{isAr ? 'أضف إلى التقويم' : 'Add to calendar'}</span>
          </a>)}
    </div>
  );
}

/** The design at 1:1 size (positioning always left-to-right; text inside follows the language) */
export function PopupCanvas({ design, isAr, editing, onClose, children, className }: {
  design: PopupDesign; isAr: boolean; editing?: boolean; onClose?: () => void; children?: React.ReactNode; className?: string;
}) {
  return (
    <div dir="ltr" className={cn('relative overflow-hidden', className)}
      style={{ width: design.width, height: design.height, borderRadius: design.radius, backgroundColor: design.background,
        backgroundImage: design.backgroundImage ? `url("${design.backgroundImage}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {children ?? design.elements.filter(e => !e.hidden).map(el => (
        <div key={el.id} style={elementBox(el)} className="overflow-hidden">
          <PopupElementView el={el} isAr={isAr} editing={editing} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

/** Scales a canvas down to fit its container or the viewport */
export function ScaledCanvas({ design, maxWidth, maxHeight, children }: { design: PopupDesign; maxWidth?: number; maxHeight?: number; children: (scale: number) => React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const w = maxWidth ?? window.innerWidth - 32;
      const h = maxHeight ?? window.innerHeight - 32;
      setScale(Math.min(1, w / design.width, h / design.height));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [design.width, design.height, maxWidth, maxHeight]);
  return (
    <div ref={ref} style={{ width: design.width * scale, height: design.height * scale }} className="relative">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: design.width, height: design.height }} className="absolute top-0 left-0">
        {children(scale)}
      </div>
    </div>
  );
}
