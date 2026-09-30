import type { PopupMessage } from './types';

/*
 * Visual popup designs (the announcements builder). A design is a fixed-size canvas with
 * absolutely positioned elements; the renderer scales the whole canvas to fit the screen,
 * so what the editor shows is exactly what visitors see.
 */

export type PopupElementKind = 'heading' | 'text' | 'image' | 'button' | 'countdown' | 'event' | 'video' | 'shape' | 'icon';

export interface PopupElementStyle {
  color?: string;
  bg?: string;
  fontSize?: number;
  fontWeight?: 400 | 700 | 900;
  align?: 'start' | 'center' | 'end';
  radius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  fit?: 'cover' | 'contain';
  shadow?: boolean;
}

export interface PopupElement {
  id: string;
  kind: PopupElementKind;
  x: number; y: number; w: number; h: number;
  textAr?: string;
  textEn?: string;
  /** Image or video address */
  src?: string;
  /** Buttons: open a link or close the popup */
  action?: 'link' | 'close';
  url?: string;
  newTab?: boolean;
  /** Countdown target / event start, local time "YYYY-MM-DDTHH:mm" */
  date?: string;
  locationAr?: string;
  locationEn?: string;
  icon?: string;
  hidden?: boolean;
  locked?: boolean;
  style: PopupElementStyle;
}

export interface PopupDesign {
  width: number;
  height: number;
  background: string;
  backgroundImage?: string;
  radius: number;
  overlay: string;
  position: 'center' | 'bottom-end' | 'bottom-start' | 'top';
  animation: 'fade' | 'zoom' | 'slide-up' | 'none';
  closeButton: boolean;
  closeOnOverlay: boolean;
  elements: PopupElement[];
}

export const BRAND = { teal: '#0f9e9b', dark: '#005751', purple: '#470D67', aqua: '#03CFCB', red: '#C8102E' };
export const SWATCHES = ['#ffffff', '#0f172a', '#475569', BRAND.teal, BRAND.dark, BRAND.aqua, BRAND.purple, '#C2560C', BRAND.red, '#FACC15', 'transparent'];

export const elId = () => `el_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const inDays = (d: number, h = 10) => {
  const x = new Date(Date.now() + d * 86_400_000);
  x.setHours(h, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:00`;
};

/** A new element of the given kind, centred on the canvas */
export function newElement(kind: PopupElementKind, design: Pick<PopupDesign, 'width' | 'height'>): PopupElement {
  const base = { id: elId(), kind, style: {} as PopupElementStyle };
  const at = (w: number, h: number) => ({ w, h, x: Math.round((design.width - w) / 2), y: Math.round((design.height - h) / 2) });
  switch (kind) {
    case 'heading': return { ...base, ...at(440, 60), textAr: 'عنوان الإعلان', textEn: 'Announcement title', style: { color: '#0f172a', fontSize: 32, fontWeight: 900, align: 'center' } };
    case 'text': return { ...base, ...at(440, 90), textAr: 'اكتب نص الإعلان هنا، ويمكنك تنسيقه وتحريكه بحرية.', textEn: 'Write the announcement text here.', style: { color: '#475569', fontSize: 17, fontWeight: 700, align: 'center' } };
    case 'image': return { ...base, ...at(300, 180), src: '', style: { radius: 16, fit: 'cover' } };
    case 'button': return { ...base, ...at(200, 52), textAr: 'اعرف المزيد', textEn: 'Learn more', action: 'link', url: 'https://', newTab: true, style: { color: '#ffffff', bg: BRAND.teal, fontSize: 17, fontWeight: 900, radius: 999, align: 'center', shadow: true } };
    case 'countdown': return { ...base, ...at(420, 96), date: inDays(7), style: { color: '#ffffff', bg: BRAND.dark, fontSize: 30, radius: 18 } };
    case 'event': return { ...base, ...at(440, 110), date: inDays(10), textAr: 'اسم الفعالية أو الموعد', textEn: 'Event name', locationAr: 'مبنى بلدية ظفار، صلالة', locationEn: 'Dhofar Municipality, Salalah', style: { color: '#0f172a', bg: '#ffffff', radius: 20, borderColor: '#e2e8f0', borderWidth: 1 } };
    case 'video': return { ...base, ...at(420, 236), src: '', style: { radius: 16 } };
    case 'shape': return { ...base, ...at(200, 120), style: { bg: BRAND.aqua, radius: 24, opacity: 0.25 } };
    case 'icon': return { ...base, ...at(72, 72), icon: 'Megaphone', style: { color: '#ffffff', bg: BRAND.teal, radius: 999 } };
  }
}

const blankDesign = (): PopupDesign => ({
  width: 600, height: 420, background: '#ffffff', radius: 32, overlay: 'rgba(15,23,42,0.6)',
  position: 'center', animation: 'zoom', closeButton: true, closeOnOverlay: true, elements: [],
});

export interface PopupTemplate { id: string; ar: string; en: string; build: () => PopupDesign }

export const TEMPLATES: PopupTemplate[] = [
  { id: 'blank', ar: 'تصميم فارغ', en: 'Blank', build: blankDesign },
  {
    id: 'notice', ar: 'تنبيه نصي', en: 'Text notice', build: () => {
      const d = blankDesign();
      d.elements = [
        { ...newElement('icon', d), y: 40, icon: 'Bell' },
        { ...newElement('heading', d), y: 130 },
        { ...newElement('text', d), y: 200 },
        { ...newElement('button', d), y: 320, textAr: 'فهمت', textEn: 'Got it', action: 'close', url: undefined },
      ];
      return d;
    },
  },
  {
    id: 'image', ar: 'إعلان بصورة', en: 'Image announcement', build: () => {
      const d = { ...blankDesign(), height: 520 };
      d.elements = [
        { ...newElement('image', d), x: 0, y: 0, w: 600, h: 300, style: { fit: 'cover', radius: 0 } },
        { ...newElement('heading', d), y: 320 },
        { ...newElement('text', d), y: 380, h: 60 },
        { ...newElement('button', d), y: 450 },
      ];
      return d;
    },
  },
  {
    id: 'event', ar: 'فعالية مع عدّاد تنازلي', en: 'Event with countdown', build: () => {
      const d = { ...blankDesign(), height: 540, background: '#f0fdfa' };
      d.elements = [
        { ...newElement('shape', d), x: 0, y: 0, w: 600, h: 150, style: { bg: BRAND.dark, radius: 0, opacity: 1 } },
        { ...newElement('heading', d), y: 45, textAr: 'انضم إلينا', textEn: 'Join us', style: { color: '#ffffff', fontSize: 36, fontWeight: 900, align: 'center' } },
        { ...newElement('event', d), y: 180 },
        { ...newElement('countdown', d), y: 315 },
        { ...newElement('button', d), y: 440, textAr: 'سجّل الآن', textEn: 'Register now' },
      ];
      return d;
    },
  },
  {
    id: 'video', ar: 'فيديو', en: 'Video', build: () => {
      const d = { ...blankDesign(), width: 720, height: 500, background: '#0f172a' };
      d.elements = [
        { ...newElement('heading', d), y: 24, style: { color: '#ffffff', fontSize: 28, fontWeight: 900, align: 'center' } },
        { ...newElement('video', d), x: 40, y: 96, w: 640, h: 360 },
      ];
      return d;
    },
  },
  {
    id: 'corner', ar: 'شريط جانبي صغير', en: 'Corner slide-in', build: () => {
      const d: PopupDesign = { ...blankDesign(), width: 380, height: 200, radius: 24, position: 'bottom-end', animation: 'slide-up', overlay: 'rgba(0,0,0,0)', closeOnOverlay: false };
      d.elements = [
        { ...newElement('icon', d), x: 24, y: 24, w: 56, h: 56 },
        { ...newElement('heading', d), x: 96, y: 22, w: 260, h: 40, style: { color: '#0f172a', fontSize: 20, fontWeight: 900, align: 'start' } },
        { ...newElement('text', d), x: 96, y: 62, w: 260, h: 60, style: { color: '#475569', fontSize: 14, fontWeight: 700, align: 'start' } },
        { ...newElement('button', d), x: 96, y: 132, w: 160, h: 44, style: { color: '#ffffff', bg: BRAND.teal, fontSize: 15, fontWeight: 900, radius: 999, align: 'center' } },
      ];
      return d;
    },
  },
];

/** Converts an old text/image/video popup into an editable design */
export function designFromLegacy(p: PopupMessage): PopupDesign {
  const d = blankDesign();
  const withText = (h: PopupElement, t: PopupElement): PopupElement[] => [
    { ...h, textAr: p.titleAr || h.textAr, textEn: p.titleEn || h.textEn },
    { ...t, textAr: p.contentAr || '', textEn: p.contentEn || '' },
  ];
  if (p.type === 'image') {
    d.height = 520;
    d.elements = [{ ...newElement('image', d), x: 0, y: 0, w: 600, h: 340, src: p.mediaUrl, style: { fit: 'cover', radius: 0 } },
      ...withText({ ...newElement('heading', d), y: 360 }, { ...newElement('text', d), y: 420, h: 70 })];
  } else if (p.type === 'video') {
    d.width = 720; d.height = 500; d.background = '#0f172a';
    d.elements = [{ ...newElement('heading', d), y: 24, textAr: p.titleAr, textEn: p.titleEn, style: { color: '#ffffff', fontSize: 28, fontWeight: 900, align: 'center' } },
      { ...newElement('video', d), x: 40, y: 96, w: 640, h: 360, src: p.mediaUrl }];
  } else {
    d.elements = [{ ...newElement('icon', d), y: 40, icon: 'Bell' },
      ...withText({ ...newElement('heading', d), y: 130 }, { ...newElement('text', d), y: 200 }),
      { ...newElement('button', d), y: 320, textAr: 'فهمت', textEn: 'Got it', action: 'close', url: undefined }];
  }
  return d;
}

/** Whether a popup may show now: active, inside its schedule, and not already seen per its frequency */
export function popupEligible(p: PopupMessage, now = Date.now()) {
  if (!p.isActive) return false;
  if (p.startAt && now < Date.parse(p.startAt)) return false;
  if (p.endAt && now > Date.parse(p.endAt)) return false;
  const key = `dm-popup-seen:${p.id}`;
  try {
    if (p.frequency === 'session' && sessionStorage.getItem(key)) return false;
    if (p.frequency === 'once' && localStorage.getItem(key)) return false;
    if (p.frequency === 'day' && localStorage.getItem(key) === new Date().toDateString()) return false;
  } catch { /* storage blocked: show it */ }
  return true;
}

export function markPopupSeen(p: PopupMessage) {
  const key = `dm-popup-seen:${p.id}`;
  try {
    if (p.frequency === 'session') sessionStorage.setItem(key, '1');
    if (p.frequency === 'once') localStorage.setItem(key, '1');
    if (p.frequency === 'day') localStorage.setItem(key, new Date().toDateString());
  } catch { /* storage blocked */ }
}

/** An .ics calendar file for an event element */
export function icsFor(el: PopupElement, isAr: boolean) {
  if (!el.date) return '';
  const start = new Date(el.date);
  const end = new Date(start.getTime() + 2 * 3600e3);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s = '') => s.replace(/[,;\\]/g, m => `\\${m}`).replace(/\n/g, '\\n');
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dhofar Municipality//Portal//AR', 'BEGIN:VEVENT',
    `UID:${el.id}@dm.gov.om`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(isAr ? el.textAr : el.textEn || el.textAr)}`, `LOCATION:${esc(isAr ? el.locationAr : el.locationEn || el.locationAr)}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}
