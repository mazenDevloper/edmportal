'use client';

/*
 * Virtual services space: service cards float on a curved wall in front of the viewer, over a
 * glowing network globe. Cards are real DOM links placed in 3D (CSS3DRenderer), so text stays
 * sharp, screen readers and the keyboard work, and a click opens the service guide.
 *
 * Controls: drag / swipe, arrow keys, the ‹ › buttons, or Tab (the focused card turns to the centre).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { ArrowUpRight, BadgeCent, ChevronLeft, ChevronRight, Clock, LayoutGrid, Search, X } from 'lucide-react';
import { Service, ServiceFlow } from '@/lib/types';
import { requireCitizen } from '@/lib/citizen-session';
import { JourneyPanelView, PANEL_H, PANEL_W, buildJourney } from './service-journey';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { buildServiceGuide } from '@/lib/service-guide';
import { ServiceIcon } from '@/components/service/service-icon';
import { cn } from '@/lib/utils';

const RADIUS = 1100;
const CARD_W = 260;
const CARD_H = 300;
const GAP = 44;
const ROW_H = CARD_H + 40;
const STEP = (CARD_W + GAP) / RADIUS; // angle between columns
const FADE_FROM = (50 * Math.PI) / 180;
const FADE_TO = (78 * Math.PI) / 180;
// A service's journey: its panels stand side by side on the same wall, one step apart
const JSTEP = (PANEL_W + 90) / RADIUS;
const MAX_PANELS = 24;

interface Props { services: Service[]; flows?: ServiceFlow[]; isAr: boolean; preview?: boolean; onExit: () => void }

export function ServiceSpace({ services, flows, isAr, preview, onExit }: Props) {
  const router = useRouter();
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const rootRef = useRef<HTMLDivElement>(null);
  const cssRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [ready, setReady] = useState(false);

  // The service being walked through, and where the visitor is in it (all inside this space)
  const [open, setOpen] = useState<Service | null>(null);
  const [step, setStep] = useState(0);
  const guide = useMemo(() => (open ? buildServiceGuide(open, (flows || []).find(f => f.serviceId === open.id || f.id === open.id) || null, isAr) : null), [open, flows, isAr]);
  const journey = useMemo(() => { const j = guide ? buildJourney(guide, isAr) : null; return j ? { ...j, panels: j.panels.slice(0, MAX_PANELS) } : null; }, [guide, isAr]);
  const journeyHosts = useMemo(() => Array.from({ length: MAX_PANELS }, () => document.createElement('div')), []);
  const journeyRef = useRef<{ count: number; step: number } | null>(null);
  journeyRef.current = journey ? { count: journey.panels.length, step } : null;
  const last = journey ? journey.panels.length - 1 : 0;
  const stepChips = useRef<HTMLOListElement>(null);
  useEffect(() => { stepChips.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }, [step, open]);
  const openService = (svc: Service) => { setStep(0); setOpen(svc); };
  const closeService = () => { setOpen(null); setStep(0); };
  const go = (d: number) => setStep(v => Math.max(0, Math.min(last, v + d)));
  const startService = () => {
    if (!open || !guide) return;
    if (guide.isExternal && open.linkUrl) { window.open(open.linkUrl, '_blank', 'noopener,noreferrer'); return; }
    requireCitizen(`/services/${open.id}/apply`, p => router.push(p));
  };

  // One host element per card: React renders into it (portal), three.js places it in 3D
  const hosts = useMemo(() => new Map(services.map(s => [s.id, document.createElement('div')])), [services]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return services.filter(s => (cat === 'all' || s.category === cat)
      && (!needle || [s.title, s.titleEn, s.description].some(v => (v || '').toLowerCase().includes(needle))));
  }, [services, q, cat]);
  const categories = useMemo(() => Array.from(new Set(services.map(s => s.category))).filter(Boolean), [services]);

  // Shared between the render loop and the handlers
  const state = useRef({ yaw: 0, target: 0, min: 0, max: 0, cols: 1, rows: 3, fitRows: 3, jScale: 1, dir: 1, reduced: false, dragged: false, angles: new Map<string, number>(), layout: () => {} });

  useEffect(() => {
    const root = rootRef.current!, cssHost = cssRef.current!, glHost = glRef.current!;
    const s = state.current;
    s.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    s.dir = isAr ? -1 : 1;

    const camera = new THREE.PerspectiveCamera(55, 1, 1, 8000);
    const cssScene = new THREE.Scene();
    const wall = new THREE.Group();
    cssScene.add(wall);
    const cssRenderer = new CSS3DRenderer();
    cssHost.appendChild(cssRenderer.domElement);

    // ─── Background: glowing points, network globe, orange nodes ───
    const glScene = new THREE.Scene();
    const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    glHost.appendChild(gl.domElement);

    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d')!; const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const pointsOf = (positions: number[], color: string, size: number, opacity = 1) => {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: glowTex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
    };

    const bokeh: number[] = [];
    for (let i = 0; i < 900; i++) {
      const r = 1800 + Math.random() * 2800, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      bokeh.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th));
    }
    const stars = pointsOf(bokeh, '#cfe8ff', 40, 0.55);
    glScene.add(stars);

    const globe = new THREE.Group();
    globe.position.set(0, -80, -2700);
    const nodes: THREE.Vector3[] = [];
    const N = 420, GR = 820;
    for (let i = 0; i < N; i++) { // Fibonacci sphere: evenly spread nodes
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
      nodes.push(new THREE.Vector3(Math.cos(th) * r * GR, y * GR, Math.sin(th) * r * GR));
    }
    globe.add(pointsOf(nodes.flatMap(v => [v.x, v.y, v.z]), '#ffffff', 26, 0.75));
    globe.add(pointsOf(nodes.filter((_, i) => i % 23 === 0).flatMap(v => [v.x, v.y, v.z]), '#ff9a4d', 90, 0.95));
    const links: number[] = [];
    nodes.forEach((a, i) => { if (i % 3) return; const b = nodes[(i * 7 + 11) % N]; if (a.distanceTo(b) < GR * 0.9) links.push(a.x, a.y, a.z, b.x, b.y, b.z); });
    const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(links, 3));
    globe.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: '#7cc4ff', transparent: true, opacity: 0.18 })));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(GR * 0.99, 48, 32), new THREE.MeshBasicMaterial({ color: '#1b6fb8', transparent: true, opacity: 0.08 }));
    globe.add(shell);
    glScene.add(globe);

    // ─── Cards on a curved wall ───
    const objects = new Map<string, CSS3DObject>();
    hosts.forEach((el, id) => { const o = new CSS3DObject(el); objects.set(id, o); wall.add(o); });
    const jObjects = journeyHosts.map(el => { const o = new CSS3DObject(el); o.visible = false; wall.add(o); return o; });

    s.layout = () => {
      const j = journeyRef.current;
      jObjects.forEach((o, i) => { o.visible = !!j && i < j.count; });
      if (j) {
        // Journey: the service cards step aside and the panels line up along the wall
        objects.forEach(o => { o.visible = false; });
        s.angles.clear();
        jObjects.forEach((o, i) => {
          if (i >= j.count) return;
          const theta = s.dir * i * JSTEP * s.jScale;
          o.position.set(RADIUS * Math.sin(theta), 0, -RADIUS * Math.cos(theta));
          o.rotation.set(0, -theta, 0); o.scale.setScalar(s.jScale);
          o.userData = { baseY: 0, phase: 0, theta };
        });
        const end = s.dir * (j.count - 1) * JSTEP * s.jScale;
        s.min = Math.min(0, end); s.max = Math.max(0, end);
        s.target = s.dir * j.step * JSTEP * s.jScale;
        return;
      }
      const rows = s.fitRows;
      const list = visibleRef.current;
      const cols = Math.max(1, Math.ceil(list.length / rows));
      s.rows = rows; s.cols = cols; s.angles.clear();
      const ids = new Set(list.map(x => x.id));
      objects.forEach((o, id) => { o.visible = ids.has(id); });
      list.forEach((svc, i) => {
        const col = Math.floor(i / rows), row = i % rows;
        const theta = s.dir * (col - (cols - 1) / 2) * STEP;
        const o = objects.get(svc.id)!;
        o.position.set(RADIUS * Math.sin(theta), ((rows - 1) / 2 - row) * ROW_H, -RADIUS * Math.cos(theta));
        o.rotation.set(0, -theta, 0);
        o.userData = { baseY: o.position.y, phase: i * 0.7, theta };
        s.angles.set(svc.id, theta);
      });
      const half = ((cols - 1) / 2) * STEP;
      s.min = -half; s.max = half;
      // Start at the first columns, in reading order
      const startCol = Math.min(1, Math.floor((cols - 1) / 2));
      s.target = s.dir * (startCol - (cols - 1) / 2) * STEP;
      if (s.reduced) s.yaw = s.target;
    };

    const resize = () => {
      const w = root.clientWidth, h = root.clientHeight;
      camera.aspect = w / h;
      camera.fov = w < h ? 75 : 55; // portrait phones: see more of the wall
      camera.updateProjectionMatrix();
      cssRenderer.setSize(w, h); gl.setSize(w, h);
      // Centre the wall in the free space between the top bar and the bottom controls
      const top = topRef.current?.offsetHeight || 0, bottom = (bottomRef.current?.offsetHeight || 0) + 20;
      const pxPerUnit = h / 2 / Math.tan((camera.fov * Math.PI) / 360) / RADIUS;
      wall.position.y = -((top - bottom) / 2) / pxPerUnit;
      // Fit the rows into the space left over
      s.fitRows = Math.max(1, Math.min(3, Math.floor((h - top - bottom) / (ROW_H * pxPerUnit))));
      // A journey panel fills most of the free space, whatever the screen
      s.jScale = Math.max(0.8, Math.min(2.2, ((h - top - 150) * 0.86) / (PANEL_H * pxPerUnit), (w * 0.9) / (PANEL_W * pxPerUnit)));
      s.layout();
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── Loop ───
    let raf = 0; const clock = new THREE.Clock();
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.5);
      const time = clock.elapsedTime;
      s.target = Math.max(s.min, Math.min(s.max, s.target));
      // Time-based easing: same feel at any frame rate
      s.yaw += (s.target - s.yaw) * (s.reduced ? 1 : 1 - Math.exp(-dt * 5));
      wall.rotation.y = s.yaw;
      // Fade cards towards the sides; cards behind the viewer would be mis-projected, so they are hidden
      // (opacity, not visibility, so they stay in the Tab order and turn to the centre when focused)
      [...objects.values(), ...jObjects].forEach(o => {
        if (!o.visible) return;
        const off = Math.abs(o.userData.theta - s.yaw);
        const alpha = off < FADE_FROM ? 1 : off > FADE_TO ? 0 : 1 - (off - FADE_FROM) / (FADE_TO - FADE_FROM);
        const el = o.element as HTMLElement;
        if (el.style.opacity !== String(alpha)) { el.style.opacity = String(alpha); el.style.pointerEvents = alpha < 0.3 ? 'none' : ''; }
      });
      if (!s.reduced) {
        objects.forEach(o => { if (o.visible) o.position.y = o.userData.baseY + Math.sin(time * 0.9 + o.userData.phase) * 7; });
        globe.rotation.y = time * 0.05;
        stars.rotation.y = time * 0.004;
      }
      glScene.rotation.y = s.yaw * 0.35; // background moves slower: depth
      cssRenderer.render(cssScene, camera);
      gl.render(glScene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();
    setReady(true);

    // ─── Drag / swipe to turn ───
    let down: { x: number; yaw: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-ui]')) return;
      down = { x: e.clientX, yaw: s.target }; s.dragged = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 6) s.dragged = true;
      s.target = down.yaw - dx * 0.0022;
    };
    const onUp = () => { down = null; };
    // A drag that ends on a card must not open it
    const onClick = (e: MouseEvent) => { if (s.dragged) { e.preventDefault(); e.stopPropagation(); s.dragged = false; } };
    const onWheel = (e: WheelEvent) => { s.target += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.0012; };
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    root.addEventListener('click', onClick, true);
    root.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      root.removeEventListener('click', onClick, true);
      root.removeEventListener('wheel', onWheel);
      objects.forEach(o => wall.remove(o));
      jObjects.forEach(o => wall.remove(o));
      glScene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose?.(); });
      glowTex.dispose(); gl.dispose();
      cssHost.innerHTML = ''; glHost.innerHTML = '';
    };
  }, [hosts, isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-lay the wall when the filter changes
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  useEffect(() => { if (ready) state.current.layout(); }, [visible, ready, open, journey?.panels.length, step]);

  // Turning left brings the cards on the left into view (the wall moves right)
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input')) return;
    if (open) {
      // Inside a service: the arrows follow the reading direction, Escape returns to the services
      if (e.key === 'ArrowLeft') { go(isAr ? 1 : -1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(isAr ? -1 : 1); e.preventDefault(); }
      if (e.key === 'Escape') closeService();
      return;
    }
    if (e.key === 'ArrowLeft') { state.current.target -= STEP; e.preventDefault(); }
    if (e.key === 'ArrowRight') { state.current.target += STEP; e.preventDefault(); }
    if (e.key === 'Escape') onExit();
  };
  const centre = (id: string) => { const a = state.current.angles.get(id); if (a !== undefined) state.current.target = a; };

  return (
    <div ref={rootRef} onKeyDown={onKey} className="fixed inset-0 z-[9990] overflow-hidden select-none bg-[radial-gradient(ellipse_at_50%_40%,#0b4f86_0%,#062a4d_45%,#020d1c_100%)] touch-pan-y cursor-grab active:cursor-grabbing"
      role="region" aria-label={t('الخدمات في بيئة افتراضية', 'Services in a virtual space')} dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <div ref={glRef} aria-hidden className="absolute inset-0 pointer-events-none" />
      {/* The 3D layer positions from the top-left: keep it LTR even on Arabic pages (cards set their own direction) */}
      <div ref={cssRef} dir="ltr" className="absolute inset-0" />

      {/* Top bar */}
      <div ref={topRef} data-ui className="absolute top-0 inset-x-0 p-3 md:p-5 flex flex-wrap items-center gap-2 md:gap-3 bg-gradient-to-b from-[#020d1c]/80 to-transparent cursor-auto">
        <h1 className="text-white font-black text-lg md:text-2xl me-auto">{t('العرض الافتراضي للخدمات', 'Virtual services view')}{preview && <span className="ms-2 align-middle text-[10px] px-2 py-0.5 rounded bg-amber-400 text-slate-900">{t('معاينة المشرف', 'Admin preview')}</span>}</h1>
        <div className={cn('relative order-3 md:order-none w-full md:w-72', open && 'hidden')}>
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-white/60" aria-hidden />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('ابحث عن خدمة', 'Search services')} aria-label={t('ابحث عن خدمة', 'Search services')}
            className="w-full h-11 ps-9 pe-3 rounded-xl bg-white/10 ring-1 ring-white/20 text-white placeholder:text-white/50 font-bold outline-none focus:ring-2 focus:ring-[#03CFCB]" />
        </div>
        <Link href="/catalog" className="h-11 px-4 rounded-xl bg-white/10 ring-1 ring-white/20 text-white font-black text-sm flex items-center gap-2 hover:bg-white/20"><LayoutGrid size={16} aria-hidden /><span className="hidden sm:inline">{t('عرض كقائمة', 'List view')}</span></Link>
        <button type="button" onClick={onExit} className="h-11 px-4 rounded-xl bg-white text-slate-900 font-black text-sm flex items-center gap-2"><X size={16} aria-hidden />{t('خروج', 'Exit')}</button>
        {categories.length > 1 && !open && (
          <div role="group" aria-label={t('الفئات', 'Categories')} className="order-4 w-full flex gap-2 overflow-x-auto pb-1">
            {['all', ...categories].map(c => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
                className={cn('shrink-0 h-9 px-3 rounded-full text-xs font-black ring-1 transition-colors', cat === c ? 'bg-[#03CFCB] text-slate-900 ring-[#03CFCB]' : 'bg-white/10 text-white ring-white/20 hover:bg-white/20')}>
                {c === 'all' ? t('الكل', 'All') : (isAr ? CAT_CONFIG[c as CategoryId]?.labelAr : CAT_CONFIG[c as CategoryId]?.labelEn) || c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Turn controls */}
      {/* Inside a service: where you are, and the way forward and back */}
      {open && journey && (
        <div data-ui className="absolute bottom-0 inset-x-0 p-3 md:p-5 space-y-3 bg-gradient-to-t from-[#020d1c]/90 to-transparent cursor-auto">
          <div className="mx-auto max-w-3xl flex items-center gap-3">
            <button type="button" onClick={() => go(-1)} disabled={step === 0} aria-label={t('السابق', 'Previous')} className="size-12 shrink-0 rounded-full bg-white/10 ring-1 ring-white/25 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30">
              {isAr ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
            </button>
            <div className="min-w-0 flex-1 text-center text-white" aria-live="polite">
              <p className="truncate text-sm font-black">{open.title && (isAr ? open.title : open.titleEn || open.title)}</p>
              <p className="truncate text-xs font-bold text-white/70">{t(`${step + 1} من ${journey.panels.length}: ${journey.panels[step]?.label}`, `${step + 1} of ${journey.panels.length}: ${journey.panels[step]?.label}`)}</p>
            </div>
            <button type="button" onClick={() => go(1)} disabled={step === last} aria-label={t('التالي', 'Next')} className="size-12 shrink-0 rounded-full bg-[#7FDAD6] text-slate-900 flex items-center justify-center hover:bg-[#9be6e2] disabled:opacity-30">
              {isAr ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
            </button>
          </div>
          <ol ref={stepChips} className="mx-auto max-w-3xl flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t('مراحل الرحلة', 'Journey steps')}>
            {journey.panels.map((p, i) => (
              <li key={i} className="shrink-0">
                <button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}
                  className={cn('h-8 max-w-[9rem] truncate rounded-full px-3 text-[11px] font-black ring-1 transition-colors', i === step ? 'bg-white text-slate-900 ring-white' : i < step ? 'bg-white/20 text-white ring-white/30' : 'bg-white/5 text-white/70 ring-white/15 hover:bg-white/15')}>
                  {p.kind === 'stage' ? `${p.n}. ${p.label}` : p.label}
                </button>
              </li>
            ))}
            <li className="shrink-0 ms-auto"><button type="button" onClick={closeService} className="h-8 rounded-full px-3 text-[11px] font-black bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20">{t('كل الخدمات', 'All services')}</button></li>
          </ol>
        </div>
      )}
      <div ref={bottomRef} data-ui className={cn('absolute bottom-5 inset-x-0 flex items-center justify-center gap-3 cursor-auto', open && 'hidden')}>
        <button type="button" onClick={() => { state.current.target -= STEP * 2; }} aria-label={t('إدارة إلى اليسار', 'Turn left')} className="size-12 rounded-full bg-white/10 ring-1 ring-white/25 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft size={22} /></button>
        <p className="text-white/80 text-xs md:text-sm font-bold text-center" aria-live="polite">
          {visible.length ? t(`${visible.length} خدمة · اسحب أو استخدم الأسهم للتنقل`, `${visible.length} services · drag or use the arrows`) : t('لا توجد خدمات مطابقة', 'No matching services')}
        </p>
        <button type="button" onClick={() => { state.current.target += STEP * 2; }} aria-label={t('إدارة إلى اليمين', 'Turn right')} className="size-12 rounded-full bg-white/10 ring-1 ring-white/25 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight size={22} /></button>
      </div>

      {/* Card contents, rendered by React into the 3D-placed hosts */}
      {services.map(svc => createPortal(
        <SpaceCard service={svc} isAr={isAr} onFocus={() => centre(svc.id)} onOpen={() => openService(svc)} />,
        hosts.get(svc.id)!, svc.id,
      ))}
      {open && guide && journey && journey.panels.map((p, i) => createPortal(
        <div dir={isAr ? 'rtl' : 'ltr'} onClick={() => { if (i !== step) setStep(i); }} className={cn(i !== step && 'cursor-pointer')}>
          <JourneyPanelView panel={p} service={open} guide={guide} isAr={isAr} current={i === step} assumed={journey.assumed}
            onNext={() => go(1)} onStart={startService} onClose={closeService} />
        </div>,
        journeyHosts[i], `journey-${i}`,
      ))}
    </div>
  );
}

function SpaceCard({ service, isAr, onFocus, onOpen }: { service: Service; isAr: boolean; onFocus: () => void; onOpen: () => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const guide = buildServiceGuide(service, null, isAr);
  const catLabel = isAr ? CAT_CONFIG[service.category as CategoryId]?.labelAr : CAT_CONFIG[service.category as CategoryId]?.labelEn;
  return (
    <button type="button" onClick={onOpen} onFocus={onFocus} dir={isAr ? 'rtl' : 'ltr'} draggable={false}
      style={{ width: CARD_W, height: CARD_H, textAlign: 'start' }}
      className="group flex flex-col p-5 rounded-[28px] text-white bg-gradient-to-b from-[#1d5f93]/70 to-[#0a2a4a]/80 ring-1 ring-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] transition-[transform,box-shadow] duration-300 hover:scale-[1.06] hover:ring-[#03CFCB] hover:shadow-[0_0_50px_rgba(3,207,203,0.45)] focus-visible:scale-[1.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400">
      <div className="flex items-start justify-between gap-2">
        <span className="size-14 rounded-2xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-[#7ff5f2] shadow-[0_0_24px_rgba(3,207,203,0.35)]"><ServiceIcon service={service} size={28} /></span>
        {catLabel && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/10 text-white/80 truncate max-w-[120px]">{catLabel}</span>}
      </div>
      <h2 className="mt-4 text-lg font-black leading-snug line-clamp-3">{guide.title}</h2>
      <dl className="mt-auto space-y-1.5 text-xs font-bold text-white/80">
        <div className="flex items-center gap-1.5"><BadgeCent size={14} className="text-[#ffb070]" aria-hidden /><dt className="sr-only">{t('الرسوم', 'Fees')}</dt><dd className="truncate">{guide.fees || t('تُحدد عند المراجعة', 'Set during review')}</dd></div>
        <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#7ff5f2]" aria-hidden /><dt className="sr-only">{t('المدة', 'Duration')}</dt><dd className="truncate">{guide.duration || t('حسب طبيعة الطلب', 'Depends on the request')}</dd></div>
      </dl>
      <span className="mt-3 flex items-center justify-between text-sm font-black text-[#03CFCB]">
        {t('ابدأ الرحلة', 'Start the journey')}<ArrowUpRight size={16} className={cn('transition-transform group-hover:-translate-y-0.5', isAr && '-scale-x-100')} aria-hidden />
      </span>
    </button>
  );
}
