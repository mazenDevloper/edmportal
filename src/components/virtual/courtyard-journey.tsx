'use client';

/*
 * The courtyard of the new Dhofar Municipality building at night, with neon LED lighting, as the
 * stage for "رحلة التحول الرقمي". Built procedurally from the site photos: a stone façade with
 * rows of rectangular, arched and slit windows, a central recessed portal with three pointed
 * terracotta arches, a steel frame on the roof, the ring fountain, planters and pergolas.
 * Timeline stations are holographic panels along a lit path; the last station is a live board of
 * transaction numbers from the open-data API. Supports WebXR headsets (immersive-vr).
 */

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { JourneyStage } from '@/lib/digital-journey';

export interface LiveFigure { labelAr: string; labelEn: string; value: number | null; color: string }
export interface CourtyardHandle { enterVR: () => Promise<void> }
interface Props {
  stages: JourneyStage[];
  index: number;
  isAr: boolean;
  figures: LiveFigure[] | null;
  asOfLabel?: string;
  reducedMotion?: boolean;
  onReady?: () => void;
  /** A VR controller trigger asks for the next station */
  onNext?: () => void;
  onVRChange?: (inVR: boolean) => void;
}

// ── Dimensions (metres) ──
const W = 72, H = 26, D = 12, FZ = -30;           // façade width/height/depth, front plane z
const PW = 24, PH = 18, PD = 4;                   // central portal opening and recess depth
const FOUNTAIN = new THREE.Vector3(0, 0, -12);
const AQUA = '#03CFCB', PURPLE = '#A855F7', PINK = '#EC4899', WARM = '#FFB86B';
const FONT = '"Readex Pro", "Segoe UI", Tahoma, sans-serif';

const neon = (hex: string, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });

/** Pointed (ogee-like) arch outline from bottom-left, over the apex, to bottom-right */
function archPoints(cx: number, w: number, spring: number, apex: number, n = 24): [number, number][] {
  const pts: [number, number][] = [[cx - w / 2, 0], [cx - w / 2, spring]];
  const q = (a: number, b: number, c: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  const ctrlY = spring + (apex - spring) * 0.8;
  for (let i = 1; i <= n; i++) { const t = i / n; pts.push([q(cx - w / 2, cx - w / 2, cx, t), q(spring, ctrlY, apex, t)]); }
  for (let i = 1; i <= n; i++) { const t = i / n; pts.push([q(cx, cx + w / 2, cx + w / 2, t), q(apex, ctrlY, spring, t)]); }
  pts.push([cx + w / 2, 0]);
  return pts;
}
const PORTAL_ARCHES = [
  { cx: 0, w: 7.5, spring: 9, apex: 14.8, color: AQUA },
  { cx: -6.9, w: 5.4, spring: 6.4, apex: 11, color: PURPLE },
  { cx: 6.9, w: 5.4, spring: 6.4, apex: 11, color: PURPLE },
];

function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }

/** Stone façade (map) and its lit windows at night (emissive map) */
function facadeTextures() {
  const PX = 28, cw = W * PX, ch = H * PX;
  const map = document.createElement('canvas'); map.width = cw; map.height = ch;
  const em = document.createElement('canvas'); em.width = cw; em.height = ch;
  const m = map.getContext('2d')!, e = em.getContext('2d')!;
  const r = rng(7);
  m.fillStyle = '#c9b497'; m.fillRect(0, 0, cw, ch);
  e.fillStyle = '#000'; e.fillRect(0, 0, cw, ch);
  // Stone courses
  for (let y = 0; y < H; y += 0.45) {
    let x = -r() * 1.2;
    while (x < W) {
      const bw = 0.8 + r() * 0.9, l = 66 + r() * 12;
      m.fillStyle = `hsl(33, ${22 + r() * 10}%, ${l}%)`;
      m.fillRect(x * PX + 1, ch - (y + 0.45) * PX + 1, bw * PX - 2, 0.45 * PX - 2);
      x += bw;
    }
  }
  const X = (x: number) => (x + W / 2) * PX, Y = (y: number) => ch - y * PX;
  const lit = () => { const v = r(); return v < 0.28 ? null : `rgba(255, ${190 + Math.round(r() * 40)}, ${120 + Math.round(r() * 50)}, ${0.55 + r() * 0.4})`; };
  const win = (cx: number, cy: number, w: number, h: number, arched = false) => {
    const path = (ctx: CanvasRenderingContext2D, pad: number) => {
      ctx.beginPath();
      const l = X(cx - w / 2) - pad, rr = X(cx + w / 2) + pad, b = Y(cy - h / 2) + pad, t = Y(cy + h / 2) - pad;
      if (arched) { const rad = (rr - l) / 2; ctx.moveTo(l, b); ctx.lineTo(l, t + rad); ctx.arc((l + rr) / 2, t + rad, rad, Math.PI, 0); ctx.lineTo(rr, b); }
      else ctx.rect(l, t, rr - l, b - t);
      ctx.closePath();
    };
    m.fillStyle = '#b0614a'; path(m, 4); m.fill();
    m.fillStyle = '#1a222d'; path(m, 0); m.fill();
    const glow = lit();
    if (glow) { e.fillStyle = glow; path(e, 0); e.fill(); }
  };
  const inPortal = (x: number, y: number) => Math.abs(x) < PW / 2 + 0.6 && y < PH + 0.3;
  for (let x = -W / 2 + 1.8; x < W / 2 - 1; x += 3.2) {
    for (const y of [7, 10.5, 14]) if (!inPortal(x, y)) win(x, y, 1.25, 1.8);
    win(x, 19.6, 1.3, 2.1, true);
  }
  // Slit windows in threes with terracotta caps
  for (let g = -W / 2 + 3; g < W / 2 - 2; g += 7) {
    for (let k = 0; k < 3; k++) {
      const x = g + k * 1.05;
      win(x, 23.1, 0.45, 2.3);
      m.fillStyle = '#b0614a'; m.fillRect(X(x - 0.16), Y(25.3), 0.32 * PX, 0.55 * PX);
    }
  }
  // Ground arcade on the side blocks
  for (let x = -W / 2 + 2.2; x < W / 2 - 1; x += 3.6) {
    if (Math.abs(x) < PW / 2 + 1.5) continue;
    const l = X(x - 1.3), rr = X(x + 1.3), rad = (rr - l) / 2;
    const draw = (ctx: CanvasRenderingContext2D) => { ctx.beginPath(); ctx.moveTo(l, Y(0)); ctx.lineTo(l, Y(3.2)); ctx.arc((l + rr) / 2, Y(3.2), rad, Math.PI, 0); ctx.lineTo(rr, Y(0)); ctx.closePath(); };
    m.fillStyle = '#2a2622'; draw(m); m.fill();
    e.fillStyle = 'rgba(255,196,130,0.75)'; draw(e); e.fill();
  }
  const mk = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  return { map: mk(map), emissive: mk(em) };
}

/** The portal's back wall with the three pointed arches (terracotta bands, glass openings) */
function portalWallTextures() {
  const PX = 32, cw = PW * PX, ch = PH * PX;
  const map = document.createElement('canvas'); map.width = cw; map.height = ch;
  const em = document.createElement('canvas'); em.width = cw; em.height = ch;
  const m = map.getContext('2d')!, e = em.getContext('2d')!;
  const r = rng(11);
  m.fillStyle = '#d3c0a4'; m.fillRect(0, 0, cw, ch);
  for (let y = 0; y < PH; y += 0.5) for (let x = -r(); x < PW; x += 1.1) {
    m.fillStyle = `hsl(35, 25%, ${70 + r() * 9}%)`; m.fillRect(x * PX + 1, ch - (y + 0.5) * PX + 1, 1.1 * PX - 2, 0.5 * PX - 2);
  }
  e.fillStyle = '#000'; e.fillRect(0, 0, cw, ch);
  const X = (x: number) => (x + PW / 2) * PX, Y = (y: number) => ch - y * PX;
  const trace = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.closePath(); };
  for (const a of PORTAL_ARCHES) {
    const outer = archPoints(a.cx, a.w + 1.4, a.spring, a.apex + 0.9);
    const inner = archPoints(a.cx, a.w, a.spring, a.apex);
    m.fillStyle = '#b25c43'; trace(m, outer); m.fill();
    m.fillStyle = '#e2d3bd'; trace(m, archPoints(a.cx, a.w + 0.5, a.spring, a.apex + 0.35)); m.fill();
    const g = m.createLinearGradient(0, Y(a.apex), 0, Y(0));
    g.addColorStop(0, '#0e2231'); g.addColorStop(1, '#05090f');
    m.fillStyle = g; trace(m, inner); m.fill();
    const ge = e.createLinearGradient(0, Y(a.apex), 0, Y(0));
    ge.addColorStop(0, 'rgba(3,207,203,0.25)'); ge.addColorStop(0.55, 'rgba(120,90,255,0.18)'); ge.addColorStop(1, 'rgba(255,190,120,0.55)');
    e.fillStyle = ge; trace(e, inner); e.fill();
  }
  // The glass bridge seen through the arches
  e.fillStyle = 'rgba(255,220,170,0.7)'; e.fillRect(X(-10), Y(5.2), 20 * PX, 0.18 * PX);
  const mk = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: mk(map), emissive: mk(em) };
}

function tileTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!; const r = rng(3);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = `hsl(38, 20%, ${72 + r() * 8}%)`; g.fillRect(x * 128 + 1, y * 128 + 1, 126, 126);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 20); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function dotSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!; const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Wraps text into lines of at most `max` pixels */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let line = '';
  for (const w of words) { const tryLine = line ? `${line} ${w}` : w; if (ctx.measureText(tryLine).width > max && line) { lines.push(line); line = w; } else line = tryLine; }
  if (line) lines.push(line);
  return lines;
}

const fmt = (n: number, isAr: boolean) => n.toLocaleString(isAr ? 'ar-OM' : 'en-US');

/** A holographic station panel */
function drawStage(c: HTMLCanvasElement, s: JourneyStage, isAr: boolean) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, 'rgba(6,18,38,0.94)'); bg.addColorStop(1, 'rgba(18,8,40,0.94)');
  g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 36); g.fill();
  g.strokeStyle = s.color; g.lineWidth = 6; g.stroke();
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = isAr ? 'right' : 'left';
  const x0 = isAr ? w - 60 : 60, maxW = w - 120;
  g.fillStyle = s.color; g.font = `700 120px ${FONT}`; g.fillText(s.year, x0, 150);
  g.fillStyle = '#ffffff'; g.font = `700 50px ${FONT}`;
  let y = 225;
  for (const l of wrap(g, isAr ? s.titleAr : s.titleEn, maxW).slice(0, 2)) { g.fillText(l, x0, y); y += 60; }
  g.fillStyle = 'rgba(255,255,255,0.78)'; g.font = `400 32px ${FONT}`; y += 6;
  for (const l of wrap(g, isAr ? s.summaryAr : s.summaryEn, maxW).slice(0, 3)) { g.fillText(l, x0, y); y += 44; }
  if (isAr) {
    y += 14; g.font = `400 30px ${FONT}`;
    for (const it of s.items.slice(0, 6)) {
      if (y > h - (s.visits ? 150 : 60)) break;
      g.fillStyle = s.color; g.fillText('◆', x0, y); g.fillStyle = 'rgba(255,255,255,0.92)';
      g.fillText(wrap(g, it, maxW - 50)[0], x0 - 44, y); y += 44;
    }
  }
  if (s.visits && s.transactions) {
    const by = h - 70; g.font = `700 44px ${FONT}`; g.fillStyle = s.color;
    const stat = (label: string, v: number, x: number) => { g.fillText(fmt(v, isAr), x, by); g.font = `400 24px ${FONT}`; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText(label, x, by + 36); g.font = `700 44px ${FONT}`; g.fillStyle = s.color; };
    const note = s.statsNoteAr && isAr ? ` (${s.statsNoteAr})` : '';
    stat((isAr ? 'زيارة للبوابة' : 'portal visits') + note, s.visits, x0);
    stat(isAr ? 'معاملة رقمية' : 'digital transactions', s.transactions, isAr ? w / 2 - 20 : w / 2 + 20);
  }
}

function drawBoard(c: HTMLCanvasElement, figures: LiveFigure[] | null, isAr: boolean, progress: number, asOf?: string) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, 'rgba(4,12,28,0.9)'); bg.addColorStop(1, 'rgba(20,6,38,0.9)');
  g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 40); g.fill();
  g.strokeStyle = AQUA; g.lineWidth = 6; g.stroke();
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = 'center';
  g.fillStyle = '#ffffff'; g.font = `700 64px ${FONT}`;
  g.fillText(isAr ? 'أرقام المعاملات الإلكترونية' : 'E-transactions in numbers', w / 2, 100);
  g.fillStyle = 'rgba(255,255,255,0.65)'; g.font = `400 30px ${FONT}`;
  g.fillText(isAr ? `مباشر من البيانات المفتوحة لبلدية ظفار${asOf ? ` · حتى ${asOf}` : ''}` : `Live from Dhofar Municipality open data${asOf ? ` · to ${asOf}` : ''}`, w / 2, 150);
  if (!figures) { g.font = `400 40px ${FONT}`; g.fillText(isAr ? 'جارٍ الاتصال بالبيانات المفتوحة…' : 'Connecting to open data…', w / 2, h / 2 + 60); return; }
  const cols = 3, cellW = (w - 120) / cols, cellH = (h - 220) / 2;
  const ease = 1 - Math.pow(1 - progress, 3);
  figures.slice(0, 6).forEach((f, i) => {
    const col = isAr ? cols - 1 - (i % cols) : i % cols, row = Math.floor(i / cols);
    const cx = 60 + cellW * col + cellW / 2, cy = 200 + cellH * row;
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.roundRect(cx - cellW / 2 + 14, cy + 10, cellW - 28, cellH - 20, 24); g.fill();
    g.fillStyle = f.color; g.font = `700 78px ${FONT}`;
    g.fillText(f.value === null ? '—' : fmt(Math.round(f.value * ease), isAr), cx, cy + cellH / 2 + 12);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = `400 32px ${FONT}`;
    g.fillText(isAr ? f.labelAr : f.labelEn, cx, cy + cellH / 2 + 62);
  });
}

function drawSign(c: HTMLCanvasElement, isAr: boolean) {
  const g = c.getContext('2d')!; g.clearRect(0, 0, c.width, c.height);
  g.textAlign = 'center'; g.direction = isAr ? 'rtl' : 'ltr';
  g.font = `700 150px ${FONT}`; g.shadowColor = AQUA; g.shadowBlur = 30; g.fillStyle = '#b8fffd';
  g.fillText(isAr ? 'رحلة التحول الرقمي' : 'Digital Transformation Journey', c.width / 2, 170);
  g.font = `400 64px ${FONT}`; g.shadowColor = PURPLE; g.fillStyle = '#f0ddff';
  g.fillText(isAr ? 'بلدية ظفار · 2020 — 2040' : 'Dhofar Municipality · 2020 — 2040', c.width / 2, 280);
}

interface Station { cam: THREE.Vector3; target: THREE.Vector3 }

export const CourtyardJourney = forwardRef<CourtyardHandle, Props>(function CourtyardJourney(
  { stages, index, isAr, figures, asOfLabel, reducedMotion, onReady, onNext, onVRChange }, ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const api = useRef<{
    goTo: (i: number) => void; setFigures: (f: LiveFigure[] | null, asOf?: string) => void; enterVR: () => Promise<void>;
  } | null>(null);
  const cb = useRef({ onNext, onVRChange, onReady });
  cb.current = { onNext, onVRChange, onReady };

  useImperativeHandle(ref, () => ({ enterVR: () => api.current?.enterVR() ?? Promise.resolve() }), []);

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b1a, 0.0075);
    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 900);
    const dolly = new THREE.Group(); dolly.add(camera); scene.add(dolly);

    // ── Sky and stars ──
    const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#01030b') }, mid: { value: new THREE.Color('#0b0e2c') }, hor: { value: new THREE.Color('#2a1350') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP; void main(){ float h = max(vP.y, 0.0); vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.7, h)); gl_FragColor = vec4(c, 1.0); }',
    }));
    scene.add(sky);
    const starGeo = new THREE.BufferGeometry(); const sp: number[] = []; const sr = rng(99);
    for (let i = 0; i < 1400; i++) { const th = sr() * Math.PI * 2, ph = Math.acos(0.15 + sr() * 0.85); sp.push(400 * Math.sin(ph) * Math.cos(th), 400 * Math.cos(ph), 400 * Math.sin(ph) * Math.sin(th)); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff3d6').multiplyScalar(1.6), toneMapped: false, fog: false }));
    moon.position.set(-160, 170, -300); scene.add(moon);

    // ── Lights ──
    scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x120e18, 0.9));
    const moonLight = new THREE.DirectionalLight(0x9fb4ff, 0.5); moonLight.position.set(-60, 80, 40); scene.add(moonLight);
    for (const x of [-30, -18, 18, 30]) {
      const s = new THREE.SpotLight(0xffc48a, 60, 45, 0.55, 0.6, 1.2);
      s.position.set(x, 0.3, FZ + 6); s.target.position.set(x, 18, FZ); scene.add(s, s.target);
    }
    const portalSpot = new THREE.SpotLight(0x9ff5ff, 70, 40, 0.6, 0.7, 1.2);
    portalSpot.position.set(0, 0.5, FZ + 8); portalSpot.target.position.set(0, 12, FZ - PD); scene.add(portalSpot, portalSpot.target);
    const fountainLights = [AQUA, PURPLE, '#3B82F6'].map((c, i) => {
      const l = new THREE.PointLight(c, 30, 26, 1.4); l.position.set(Math.cos(i * 2.1) * 4, 0.6, FOUNTAIN.z + Math.sin(i * 2.1) * 4); scene.add(l); return l;
    });

    // ── Ground ──
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), new THREE.MeshStandardMaterial({ map: tileTexture(), roughness: 0.32, metalness: 0.08, color: 0x9c948a }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -5; scene.add(ground);

    // ── Building ──
    const fac = facadeTextures();
    const stone = new THREE.MeshStandardMaterial({ color: 0xc9b497, roughness: 0.92 });
    const facadePiece = (x0: number, x1: number, y0: number, y1: number, depth = D) => {
      const map = fac.map.clone(), em = fac.emissive.clone();
      for (const t of [map, em]) { t.repeat.set((x1 - x0) / W, (y1 - y0) / H); t.offset.set((x0 + W / 2) / W, y0 / H); t.needsUpdate = true; }
      const front = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.9 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, depth), [stone, stone, stone, stone, front, stone]);
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, FZ - depth / 2);
      scene.add(mesh);
      return mesh;
    };
    facadePiece(-W / 2, -PW / 2, 0, H);
    facadePiece(PW / 2, W / 2, 0, H);
    facadePiece(-PW / 2, PW / 2, PH, H);
    // Recess: side walls, ceiling and the arched back wall
    const recessMat = new THREE.MeshStandardMaterial({ color: 0xcab79c, roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, PH, PD), recessMat);
      wall.position.set(sx * (PW / 2 - 0.2), PH / 2, FZ - PD / 2); scene.add(wall);
    }
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.4, PD), recessMat); ceil.position.set(0, PH - 0.2, FZ - PD / 2); scene.add(ceil);
    const pw = portalWallTextures();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: pw.map, emissiveMap: pw.emissive, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.85 }));
    back.position.set(0, PH / 2, FZ - PD); scene.add(back);
    // Neon LED along the arches
    for (const a of PORTAL_ARCHES) {
      const pts = archPoints(a.cx, a.w + 1.5, a.spring, a.apex + 0.95, 40).map(([x, y]) => new THREE.Vector3(x, y, FZ - PD + 0.12));
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.07, 6), neon(a.color, 3.2)));
    }
    // Neon LED lines: roofline, portal frame, corners, arcade
    const strip = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, k = 3) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), neon(color, k)); s.position.set(x, y, z); scene.add(s); return s;
    };
    strip(W, 0.12, 0.12, 0, H + 0.05, FZ + 0.1, AQUA, 2.2);
    strip(PW + 0.4, 0.12, 0.12, 0, PH + 0.1, FZ + 0.12, PINK);
    for (const sx of [-1, 1]) {
      strip(0.12, PH, 0.12, sx * (PW / 2 + 0.1), PH / 2, FZ + 0.12, PINK);
      strip(0.14, H, 0.14, sx * W / 2, H / 2, FZ + 0.1, PURPLE, 2.5);
    }
    strip(W - PW - 2, 0.1, 0.1, -(W + PW) / 4, 4.4, FZ + 0.15, WARM, 2).scale.x = 0.95;
    strip(W - PW - 2, 0.1, 0.1, (W + PW) / 4, 4.4, FZ + 0.15, WARM, 2).scale.x = 0.95;
    // Steel frame over the roof
    const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.7, roughness: 0.35 });
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 12) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.5, 0.18), steel); post.position.set(x, H + 2.25, FZ + 1); scene.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.18, 0.18), steel); beam.position.set(0, H + 4.5, FZ + 1); scene.add(beam);
    for (let x = -W / 2; x < W / 2; x += 12) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 12.8, 0.06), steel);
      brace.position.set(x + 6, H + 2.25, FZ + 1); brace.rotation.z = Math.atan2(12, 4.5) * (x % 24 === 0 ? 1 : -1); scene.add(brace);
    }
    // Wings: dark glass on the left, stone on the right (as in the photos)
    const glass = new THREE.Mesh(new THREE.BoxGeometry(10, 22, 26), new THREE.MeshStandardMaterial({ color: 0x0b1624, metalness: 0.85, roughness: 0.12 }));
    glass.position.set(-W / 2 - 5, 11, FZ + 11); scene.add(glass);
    for (let y = 3.6; y < 22; y += 3.6) strip(0.08, 0.08, 26, -W / 2 + 0.05, y, FZ + 11, AQUA, 1.6);
    const wingMap = fac.map.clone(), wingEm = fac.emissive.clone();
    for (const t of [wingMap, wingEm]) { t.repeat.set(26 / W, 1); t.offset.set(0.02, 0); t.needsUpdate = true; }
    const wingFront = new THREE.MeshStandardMaterial({ map: wingMap, emissiveMap: wingEm, emissive: 0xffffff, roughness: 0.9 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(10, H, 26), [stone, wingFront, stone, stone, stone, stone]);
    wing.position.set(W / 2 + 5, H / 2, FZ + 11); scene.add(wing);
    strip(0.14, 0.14, 26, W / 2 + 0.05, H + 0.05, FZ + 11, AQUA);

    // ── Fountain ──
    const water = new THREE.Mesh(new THREE.CircleGeometry(10, 72), new THREE.MeshStandardMaterial({ color: 0x0a1b2a, metalness: 0.7, roughness: 0.08 }));
    water.rotation.x = -Math.PI / 2; water.position.set(FOUNTAIN.x, 0.012, FOUNTAIN.z); scene.add(water);
    for (const rr of [2.5, 5.5, 8.5]) {
      const grate = new THREE.Mesh(new THREE.RingGeometry(rr - 0.28, rr + 0.28, 96), new THREE.MeshStandardMaterial({ color: 0x0d1015, roughness: 0.6, metalness: 0.4 }));
      grate.rotation.x = -Math.PI / 2; grate.position.set(FOUNTAIN.x, 0.02, FOUNTAIN.z); scene.add(grate);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(10.1, 0.06, 8, 160), neon(AQUA, 2.6));
    ring.rotation.x = -Math.PI / 2; ring.position.set(FOUNTAIN.x, 0.05, FOUNTAIN.z); scene.add(ring);
    const JET_RINGS = [{ r: 2.5, n: 10, h: 4.2 }, { r: 5.5, n: 18, h: 3.2 }, { r: 8.5, n: 26, h: 2.4 }];
    const PER = 34, G = 9.8;
    const jets: { x: number; z: number; h: number; a: number; ring: number }[] = [];
    JET_RINGS.forEach((jr, ri) => { for (let i = 0; i < jr.n; i++) { const a = (i / jr.n) * Math.PI * 2; jets.push({ x: FOUNTAIN.x + Math.cos(a) * jr.r, z: FOUNTAIN.z + Math.sin(a) * jr.r, h: jr.h, a, ring: ri }); } });
    const nP = jets.length * PER;
    const jetPos = new Float32Array(nP * 3), jetCol = new Float32Array(nP * 3);
    const jetGeo = new THREE.BufferGeometry();
    jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPos, 3));
    jetGeo.setAttribute('color', new THREE.BufferAttribute(jetCol, 3));
    const jetMat = new THREE.PointsMaterial({ size: 0.2, map: dotSprite(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    scene.add(new THREE.Points(jetGeo, jetMat));
    const cA = new THREE.Color(AQUA), cB = new THREE.Color(PURPLE), cC = new THREE.Color('#ffffff'), tmp = new THREE.Color();

    // ── Planters, plants, pergolas ──
    const planterMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.8 });
    const leaf = new THREE.MeshStandardMaterial({ color: 0x1f4d2b, roughness: 0.9 });
    const plantGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const pr = rng(21);
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 30), planterMat); p.position.set(sx * 16, 0.45, -8); scene.add(p);
      strip(0.06, 0.06, 30, sx * (16 - 1.25), 0.82, -8, WARM, 1.8);
      const plants = new THREE.InstancedMesh(plantGeo, leaf, 46); const mtx = new THREE.Matrix4();
      for (let i = 0; i < 46; i++) { const s = 0.6 + pr() * 0.9; mtx.compose(new THREE.Vector3(sx * 16 + (pr() - 0.5) * 1.8, 0.9 + s * 0.3, -22 + i * 0.62), new THREE.Quaternion().setFromEuler(new THREE.Euler(pr(), pr(), pr())), new THREE.Vector3(s, s * 1.3, s)); plants.setMatrixAt(i, mtx); }
      scene.add(plants);
    }
    const wood = new THREE.MeshStandardMaterial({ color: 0x3b2f28, roughness: 0.7 });
    for (const sx of [-1, 1]) for (const pz of [14, 20]) {
      const cx = sx * 19;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.22, 4.4), wood); roof.position.set(cx, 3.3, pz); scene.add(roof);
      for (const [dx, dz] of [[-3.3, -2], [3.3, -2], [-3.3, 2], [3.3, 2]]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.3, 0.16), wood); post.position.set(cx + dx, 1.65, pz + dz); scene.add(post);
      }
      strip(6.6, 0.05, 0.05, cx, 3.17, pz - 1.9, WARM, 2.2); strip(6.6, 0.05, 0.05, cx, 3.17, pz + 1.9, WARM, 2.2);
      const down = new THREE.PointLight(0xffbf80, 6, 8, 1.6); down.position.set(cx, 3, pz); scene.add(down);
    }

    // ── The lit path of the journey ──
    const TILE_N = 44;
    const pathTiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.03, 0.22), new THREE.MeshBasicMaterial({ toneMapped: false }), TILE_N * 2);
    const tileZ = (i: number) => 22 - i * 0.6;
    { const m4 = new THREE.Matrix4(); for (let i = 0; i < TILE_N; i++) for (const [k, sx] of [[0, -2.6], [1, 2.6]] as const) { m4.makeTranslation(sx, 0.02, tileZ(i)); pathTiles.setMatrixAt(i * 2 + k, m4); pathTiles.setColorAt(i * 2 + k, new THREE.Color(0, 0, 0)); } }
    scene.add(pathTiles);

    // ── Title sign ──
    const signCanvas = document.createElement('canvas'); signCanvas.width = 2048; signCanvas.height = 330;
    const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.2), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false, depthWrite: false }));
    sign.position.set(0, H + 7.5, FZ + 1); scene.add(sign);

    // ── Station panels ──
    const stations: Station[] = [{ cam: new THREE.Vector3(0, 6, 34), target: new THREE.Vector3(0, 12, FZ) }];
    const panelTex: { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; stage: JourneyStage }[] = [];
    const years = stages.filter(s => /^\d{4}$/.test(s.year) && s.year < '2030');
    const extras = stages.filter(s => !years.includes(s));
    const placeYear = (i: number) => new THREE.Vector3(i % 2 ? -7.8 : 7.8, 3, 17 - i * 4.2);
    const placeExtra = (i: number) => new THREE.Vector3(i % 2 ? 12 : -12, 3.2, -17.5);
    const addPanel = (s: JourneyStage, pos: THREE.Vector3, face: THREE.Vector3) => {
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 840;
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const group = new THREE.Group(); group.position.copy(pos);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.78), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: new THREE.Color(0.92, 0.92, 0.92), side: THREE.DoubleSide }));
      group.add(plane);
      // Neon frame and a floor beam under the panel
      const frameMat = neon(s.color, 2);
      for (const [w, h, x, y] of [[5.6, 0.06, 0, 1.92], [5.6, 0.06, 0, -1.92], [0.06, 3.9, 2.78, 0], [0.06, 3.9, -2.78, 0]] as const) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameMat); f.position.set(x, y, -0.03); group.add(f);
      }
      const beamG = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, pos.y - 1.9, 8), frameMat); beamG.position.y = -(pos.y - 1.9) / 2 - 1.9; group.add(beamG);
      const base = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 48), frameMat); base.rotation.x = Math.PI / 2; base.position.y = -pos.y + 0.03; group.add(base);
      const dir = face.clone().sub(pos); dir.y = 0; dir.normalize();
      group.rotation.y = Math.atan2(dir.x, dir.z);
      scene.add(group);
      panelTex.push({ canvas, tex, stage: s });
      const cam = pos.clone().add(dir.clone().multiplyScalar(6.4)); cam.y = 2.3;
      return { cam, target: pos.clone().setY(2.9) };
    };
    years.forEach((s, i) => { const p = placeYear(i); stations.push(addPanel(s, p, new THREE.Vector3(0, 3, p.z + 6))); });
    extras.forEach((s, i) => { const p = placeExtra(i); stations.push(addPanel(s, p, new THREE.Vector3(0, 3, p.z + 9))); });
    // Live board in front of the portal
    const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1800; boardCanvas.height = 760;
    const boardTex = new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 4;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(15, 6.33), new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, toneMapped: false, color: new THREE.Color(0.92, 0.92, 0.92) }));
    board.position.set(0, 8.6, FZ + 5); scene.add(board);
    for (const [w, h, x, y] of [[15.3, 0.08, 0, 3.2], [15.3, 0.08, 0, -3.2], [0.08, 6.5, 7.62, 0], [0.08, 6.5, -7.62, 0]] as const) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), neon(AQUA, 3)); f.position.set(x, 8.6 + y, FZ + 4.95); scene.add(f);
    }
    stations.push({ cam: new THREE.Vector3(0, 5.2, -5), target: new THREE.Vector3(0, 8, FZ + 5) });

    // Text needs the web font loaded before drawing on canvases
    let figuresState: LiveFigure[] | null = null, asOfState: string | undefined, boardStart = 0;
    const redrawText = () => {
      drawSign(signCanvas, isAr); signTex.needsUpdate = true;
      for (const p of panelTex) { drawStage(p.canvas, p.stage, isAr); p.tex.needsUpdate = true; }
      drawBoard(boardCanvas, figuresState, isAr, 1, asOfState); boardTex.needsUpdate = true;
    };
    redrawText();
    document.fonts?.ready.then(redrawText).catch(() => {});

    // ── Post-processing ──
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.7, 0.4, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // ── Controls and camera moves ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 2; controls.maxDistance = 40; controls.maxPolarAngle = Math.PI * 0.53;
    controls.rotateSpeed = 0.5;
    camera.position.copy(stations[0].cam).add(new THREE.Vector3(0, 8, 22));
    controls.target.copy(stations[0].target);
    let tween: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; start: number; dur: number } | null = null;
    let current = 0;
    /** Narrow (portrait) screens step back so the whole panel fits */
    const fitted = (s: Station): Station => {
      const k = Math.max(1, 1.35 / camera.aspect);
      return { cam: s.target.clone().add(s.cam.clone().sub(s.target).multiplyScalar(k)), target: s.target };
    };
    const goTo = (i: number, instant = false) => {
      const s = fitted(stations[Math.max(0, Math.min(stations.length - 1, i))]);
      current = i;
      if (renderer.xr.isPresenting) { placeDolly(s); return; }
      if (instant || reducedMotion) { camera.position.copy(s.cam); controls.target.copy(s.target); tween = null; return; }
      tween = { from: camera.position.clone(), to: s.cam.clone(), tFrom: controls.target.clone(), tTo: s.target.clone(), start: performance.now(), dur: 2600 };
    };
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // ── VR ──
    const placeDolly = (s: Station) => {
      const dir = s.target.clone().sub(s.cam); dir.y = 0; dir.normalize();
      dolly.position.set(s.cam.x, 0, s.cam.z);
      dolly.rotation.set(0, Math.atan2(-dir.x, -dir.z), 0);
    };
    for (const i of [0, 1]) {
      const c = renderer.xr.getController(i);
      c.addEventListener('select', () => cb.current.onNext?.());
      dolly.add(c);
    }
    renderer.xr.addEventListener('sessionstart', () => { placeDolly(stations[current]); cb.current.onVRChange?.(true); });
    renderer.xr.addEventListener('sessionend', () => {
      dolly.position.set(0, 0, 0); dolly.rotation.set(0, 0, 0); goTo(current, true); cb.current.onVRChange?.(false);
    });
    const enterVR = async () => {
      const xr = (navigator as Navigator & { xr?: { requestSession: (m: string, o: object) => Promise<XRSession> } }).xr;
      if (!xr) return;
      const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      renderer.xr.setReferenceSpaceType('local-floor');
      await renderer.xr.setSession(session);
    };

    api.current = {
      goTo,
      setFigures: (f, asOf) => { const first = !figuresState && f; figuresState = f; asOfState = asOf; boardStart = first ? performance.now() : 0; drawBoard(boardCanvas, f, isAr, first ? 0 : 1, asOf); boardTex.needsUpdate = true; },
      enterVR,
    };

    // ── Animation loop ──
    const clock = new THREE.Clock();
    let readySent = false;
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const now = performance.now();
      if (tween) {
        const k = Math.min(1, (now - tween.start) / tween.dur), e = ease(k);
        camera.position.lerpVectors(tween.from, tween.to, e);
        // Rise slightly mid-flight so the camera clears planters and panels
        camera.position.y += Math.sin(Math.PI * e) * 1.6;
        controls.target.lerpVectors(tween.tFrom, tween.tTo, e);
        if (k >= 1) tween = null;
      }
      if (!renderer.xr.isPresenting) controls.update();

      // Fountain jets: waves travelling around the rings, colours cycling teal → purple
      const motion = reducedMotion ? 0.25 : 1;
      let p = 0;
      for (const j of jets) {
        const wave = 0.55 + 0.45 * Math.sin(t * 0.9 * motion + j.a * 3 + j.ring * 1.3);
        const v0 = Math.sqrt(2 * G * j.h), T = (2 * v0) / G;
        tmp.copy(cA).lerp(cB, 0.5 + 0.5 * Math.sin(t * 0.5 + j.ring + j.a));
        for (let k = 0; k < PER; k++) {
          const tt = ((t * motion + (k / PER) * T) % T);
          const y = (v0 * tt - 0.5 * G * tt * tt) * wave;
          const spread = tt * 0.08;
          jetPos[p * 3] = j.x + Math.cos(j.a) * spread; jetPos[p * 3 + 1] = Math.max(0.02, y); jetPos[p * 3 + 2] = j.z + Math.sin(j.a) * spread;
          const top = 1 - Math.abs(tt / T - 0.5) * 2;
          const c = tmp.clone().lerp(cC, top * 0.45).multiplyScalar(0.5 + top * 0.9);
          jetCol[p * 3] = c.r; jetCol[p * 3 + 1] = c.g; jetCol[p * 3 + 2] = c.b;
          p++;
        }
      }
      jetGeo.attributes.position.needsUpdate = true; jetGeo.attributes.color.needsUpdate = true;
      fountainLights.forEach((l, i) => { l.intensity = 22 + 10 * Math.sin(t * 1.3 + i * 2); });

      // Flowing path lights toward the current station
      const col = new THREE.Color();
      for (let i = 0; i < TILE_N; i++) {
        const v = Math.max(0, Math.sin(i * 0.45 - t * 3 * motion)) ** 6;
        col.set(AQUA).multiplyScalar(0.25 + v * 2.6);
        pathTiles.setColorAt(i * 2, col); pathTiles.setColorAt(i * 2 + 1, col);
      }
      pathTiles.instanceColor!.needsUpdate = true;
      sign.position.y = H + 7.5 + Math.sin(t * 0.8) * 0.15 * motion;

      if (boardStart) {
        const k = Math.min(1, (now - boardStart) / 2500);
        drawBoard(boardCanvas, figuresState, isAr, k, asOfState); boardTex.needsUpdate = true;
        if (k >= 1) boardStart = 0;
      }

      if (renderer.xr.isPresenting) renderer.render(scene, camera);
      else composer.render();
      if (!readySent) { readySent = true; cb.current.onReady?.(); }
    });

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize); ro.observe(mount);

    goTo(0);

    return () => {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      renderer.xr.getSession()?.end().catch(() => {});
      controls.dispose();
      composer.dispose();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const mat of mats) { for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose(); mat.dispose(); }
      });
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  // The scene is rebuilt only when the language changes (text is drawn into textures)
  }, [isAr, stages, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { api.current?.goTo(index); }, [index, isAr]);
  useEffect(() => { api.current?.setFigures(figures, asOfLabel); }, [figures, asOfLabel, isAr]);

  return <div ref={mountRef} className="absolute inset-0" />;
});
