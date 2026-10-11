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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { JourneyAward, JourneyIcon, JourneyStage } from '@/lib/digital-journey';

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

/** LED strip material. GLOW tones every strip down together: the light reads as a line, not a haze */
const GLOW = 0.5;
const neon = (hex: string, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(Math.max(1, k * GLOW)), toneMapped: false });

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

/** The round plaza: white stone rings alternating with striped drainage bands (as on site) */
function plazaTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!; const m = S / 2, px = m / 10;
  const bands: [number, number, boolean][] = [[8, 10, true], [6.6, 8, false], [5, 6.6, true], [3.6, 5, false], [2, 3.6, true], [0, 2, false]];
  for (const [, r1, striped] of bands) {
    g.fillStyle = striped ? '#8f9296' : '#d9d5cc'; g.beginPath(); g.arc(m, m, r1 * px, 0, Math.PI * 2); g.fill();
  }
  // Radial slats on the striped bands
  g.strokeStyle = '#3d4044'; g.lineWidth = 2.2;
  for (const [r0, r1, striped] of bands) {
    if (!striped) continue;
    const n = Math.round(r1 * 46);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.beginPath(); g.moveTo(m + Math.cos(a) * r0 * px, m + Math.sin(a) * r0 * px); g.lineTo(m + Math.cos(a) * r1 * px, m + Math.sin(a) * r1 * px); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** The star inlay of the entrance floor: interlaced squares in light stone on the paving */
function starTexture() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!; g.translate(S / 2, S / 2);
  g.strokeStyle = 'rgba(236,230,218,0.95)'; g.lineWidth = 9; g.lineJoin = 'miter';
  for (const [r, turns] of [[230, 2], [150, 2], [78, 2]] as const) for (let k = 0; k < turns; k++) {
    g.save(); g.rotate((k * Math.PI) / 4); g.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); g.restore();
  }
  g.fillStyle = 'rgba(176,97,74,0.55)';
  for (let k = 0; k < 8; k++) { g.save(); g.rotate((k * Math.PI) / 4); g.beginPath(); g.moveTo(0, -200); g.lineTo(26, -150); g.lineTo(-26, -150); g.closePath(); g.fill(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** Curtain-wall grid of the glass tower */
function glassTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d')!; const r = rng(5);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { g.fillStyle = `hsl(205, 35%, ${7 + r() * 9}%)`; g.fillRect(x * 32, y * 32, 32, 32); }
  g.strokeStyle = '#3a4756'; g.lineWidth = 2;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 512); g.stroke(); }
  for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(256, i * 32); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
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

/** Raised lettering: a dark drop edge under a light-to-colour face, so figures read as embossed */
function emboss(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.9)';
  for (let d = Math.max(3, Math.round(size * 0.06)); d > 0; d--) g.fillText(text, x, y + d);
  const face = g.createLinearGradient(0, y - size * 0.78, 0, y + size * 0.08);
  face.addColorStop(0, '#ffffff'); face.addColorStop(0.5, color); face.addColorStop(1, new THREE.Color(color).multiplyScalar(0.62).getStyle());
  g.fillStyle = face; g.fillText(text, x, y);
  g.restore();
}

/** Shrinks the font until the text fits `max` pixels; returns the size used */
function fitFont(g: CanvasRenderingContext2D, text: string, weight: number, size: number, max: number) {
  let s = size;
  do { g.font = `${weight} ${s}px ${FONT}`; s -= 4; } while (g.measureText(text).width > max && s > 24);
  return s + 4;
}

/** A raised figure card: one large embossed number and its label */
function drawFigure(c: HTMLCanvasElement, value: string, label: string, color: string, isAr: boolean) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#101c36'); bg.addColorStop(1, '#070b18');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.fillRect(0, 0, w, Math.round(h * 0.035));
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = 'center';
  const size = fitFont(g, value, 700, Math.round(h * 0.46), w - 70);
  emboss(g, value, w / 2, h * 0.58, color, size);
  g.fillStyle = 'rgba(255,255,255,0.92)'; fitFont(g, label, 700, Math.round(h * 0.15), w - 60);
  g.fillText(label, w / 2, h * 0.86);
}

// Icon outlines on a 24-unit grid (lucide geometry): p = path, c = circle, r = rounded rect
type IconPart = ['p', string] | ['c', number, number, number] | ['r', number, number, number, number, number];
const ICONS: Record<JourneyIcon, IconPart[]> = {
  globe: [['c', 12, 12, 10], ['p', 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'], ['p', 'M2 12h20']],
  file: [['p', 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'], ['p', 'M14 2v4a2 2 0 0 0 2 2h4'], ['p', 'M10 9H8'], ['p', 'M16 13H8'], ['p', 'M16 17H8']],
  building: [['p', 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z'], ['p', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2'], ['p', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2'], ['p', 'M10 6h4'], ['p', 'M10 10h4'], ['p', 'M10 14h4'], ['p', 'M10 18h4']],
  card: [['r', 2, 5, 20, 14, 2], ['p', 'M2 10h20']],
  chat: [['p', 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z']],
  bot: [['p', 'M12 8V4H8'], ['r', 4, 8, 16, 12, 2], ['p', 'M2 14h2'], ['p', 'M20 14h2'], ['p', 'M15 13v2'], ['p', 'M9 13v2']],
  cloud: [['p', 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z']],
  map: [['p', 'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z'], ['p', 'M15 5.764v15'], ['p', 'M9 3.236v15']],
  qr: [['r', 3, 3, 5, 5, 1], ['r', 16, 3, 5, 5, 1], ['r', 3, 16, 5, 5, 1], ['p', 'M21 16h-3a2 2 0 0 0-2 2v3'], ['p', 'M12 7v3a2 2 0 0 1-2 2H7'], ['p', 'M16 12h1'], ['p', 'M12 21v-1'], ['p', 'M12 16v.01'], ['p', 'M21 21v.01'], ['p', 'M21 12v.01'], ['p', 'M3 12h.01'], ['p', 'M12 3h.01']],
  leaf: [['p', 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'], ['p', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12']],
  handshake: [['p', 'm11 17 2 2a1 1 0 1 0 3-3'], ['p', 'm14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4'], ['p', 'm21 3 1 11h-2'], ['p', 'M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3'], ['p', 'M3 4h8']],
  chart: [['p', 'M3 3v16a2 2 0 0 0 2 2h16'], ['p', 'M18 17V9'], ['p', 'M13 17V5'], ['p', 'M8 17v-3']],
  award: [['p', 'm15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526'], ['c', 12, 8, 6]],
  sparkles: [['p', 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'], ['p', 'M20 3v4'], ['p', 'M22 5h-4']],
  camera: [['p', 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'], ['c', 12, 13, 3]],
  users: [['p', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'], ['c', 9, 7, 4], ['p', 'M22 21v-2a4 4 0 0 0-3-3.87'], ['p', 'M16 3.13a4 4 0 0 1 0 7.75']],
  wallet: [['p', 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1'], ['p', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4']],
  zap: [['p', 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']],
};

/** The face of a logo medallion: the icon embossed on a dark enamel disc */
function drawMedallion(c: HTMLCanvasElement, icon: JourneyIcon, color: string) {
  const g = c.getContext('2d')!; const S = c.width;
  g.clearRect(0, 0, S, S);
  const bg = g.createRadialGradient(S * 0.4, S * 0.35, S * 0.05, S / 2, S / 2, S / 2);
  bg.addColorStop(0, '#1d2c50'); bg.addColorStop(1, '#070b18');
  g.fillStyle = bg; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.fill();
  const k = (S * 0.52) / 24, o = S * 0.24;
  const stroke = (dx: number, dy: number, style: string) => {
    g.save(); g.translate(o + dx, o + dy); g.scale(k, k);
    g.strokeStyle = style; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const p of ICONS[icon]) {
      if (p[0] === 'p') g.stroke(new Path2D(p[1]));
      else if (p[0] === 'c') { g.beginPath(); g.arc(p[1], p[2], p[3], 0, Math.PI * 2); g.stroke(); }
      else { g.beginPath(); g.roundRect(p[1], p[2], p[3], p[4], p[5]); g.stroke(); }
    }
    g.restore();
  };
  stroke(0, S * 0.014, 'rgba(0,0,0,0.9)'); stroke(0, 0, '#ffffff');
  g.strokeStyle = color; g.lineWidth = S * 0.03; g.beginPath(); g.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2); g.stroke();
}

/** A small caption (logo name, trophy plate) */
function drawCaption(c: HTMLCanvasElement, lines: string[], color: string, isAr: boolean, plate = false) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  if (plate) { g.fillStyle = '#0a1122'; g.fillRect(0, 0, w, h); g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); }
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = 'center';
  lines.forEach((l, i) => {
    const size = fitFont(g, l, 700, Math.round((h / lines.length) * (i === 0 && lines.length > 1 ? 0.7 : 0.56)), w - 30);
    g.fillStyle = i === 0 && lines.length > 1 ? color : '#ffffff';
    if (!plate) { g.lineWidth = 8; g.strokeStyle = 'rgba(3,7,18,0.9)'; g.strokeText(l, w / 2, (h / lines.length) * (i + 0.5) + size * 0.34); }
    g.fillText(l, w / 2, (h / lines.length) * (i + 0.5) + size * 0.34);
  });
}

/** A holographic station panel */
function drawStage(c: HTMLCanvasElement, s: JourneyStage, isAr: boolean) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, 'rgba(6,18,38,0.94)'); bg.addColorStop(1, 'rgba(18,8,40,0.94)');
  g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 36); g.fill();
  g.strokeStyle = s.color; g.lineWidth = 6; g.stroke();
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = isAr ? 'right' : 'left';
  const x0 = isAr ? w - 60 : 60, maxW = w - 120;
  g.font = `700 190px ${FONT}`; emboss(g, s.year, x0, 205, s.color, 190);
  g.fillStyle = '#ffffff'; g.font = `700 62px ${FONT}`;
  let y = 300;
  for (const l of wrap(g, isAr ? s.titleAr : s.titleEn, maxW).slice(0, 2)) { g.fillText(l, x0, y); y += 74; }
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = `400 38px ${FONT}`; y += 4;
  for (const l of wrap(g, isAr ? s.summaryAr : s.summaryEn, maxW).slice(0, 3)) { g.fillText(l, x0, y); y += 52; }
  const bottom = h - (s.visits ? 150 : 50);
  if (isAr) {
    y += 16; g.font = `400 36px ${FONT}`;
    for (const it of s.items.slice(0, 6)) {
      if (y > bottom) break;
      g.fillStyle = s.color; g.fillText('◆', x0, y); g.fillStyle = 'rgba(255,255,255,0.94)';
      g.fillText(wrap(g, it, maxW - 56)[0], x0 - 50, y); y += 52;
    }
  }
}

function drawBoard(c: HTMLCanvasElement, figures: LiveFigure[] | null, isAr: boolean, asOf?: string) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, 'rgba(4,12,28,0.9)'); bg.addColorStop(1, 'rgba(20,6,38,0.9)');
  g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 40); g.fill();
  g.strokeStyle = AQUA; g.lineWidth = 6; g.stroke();
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = 'center';
  g.font = `700 84px ${FONT}`; emboss(g, isAr ? 'أرقام المعاملات الإلكترونية' : 'E-transactions in numbers', w / 2, 112, '#9ff3f1', 84);
  g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = `400 34px ${FONT}`;
  g.fillText(isAr ? `مباشر من البيانات المفتوحة لبلدية ظفار${asOf ? ` · حتى ${asOf}` : ''}` : `Live from Dhofar Municipality open data${asOf ? ` · to ${asOf}` : ''}`, w / 2, 150);
  if (!figures) { g.font = `400 40px ${FONT}`; g.fillText(isAr ? 'جارٍ الاتصال بالبيانات المفتوحة…' : 'Connecting to open data…', w / 2, h / 2 + 60); }
}

function drawSign(c: HTMLCanvasElement, isAr: boolean) {
  const g = c.getContext('2d')!; g.clearRect(0, 0, c.width, c.height);
  g.textAlign = 'center'; g.direction = isAr ? 'rtl' : 'ltr';
  g.font = `700 150px ${FONT}`; g.shadowColor = AQUA; g.shadowBlur = 10; g.fillStyle = '#d9fffe';
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

    // Reflections for the gold trophies, medallion rims and the glass tower (not applied scene-wide)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.22, envMap, envMapIntensity: 1.15 });
    /** Things that turn or bob in the animation loop */
    const movers: { o: THREE.Object3D; spin?: number; bob?: number; y0: number; phase: number }[] = [];

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
    // The space frame continues over the courtyard: rafters from the roof beam and purlins across them
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 12) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 38), steel); rafter.position.set(x, H + 4.5, FZ + 20); scene.add(rafter);
    }
    for (let z = FZ + 7; z <= FZ + 39; z += 8) {
      const purlin = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, 0.1), steel); purlin.position.set(0, H + 4.5, z); scene.add(purlin);
    }
    // Arcade columns with white capitals in front of the side blocks
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xa8553f, roughness: 0.8 }), capMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.7 });
    const shaftGeo = new THREE.CylinderGeometry(0.3, 0.33, 3.0, 20), capGeo = new THREE.CylinderGeometry(0.5, 0.34, 0.36, 20), footGeo = new THREE.CylinderGeometry(0.4, 0.44, 0.22, 20);
    for (let x = -W / 2 + 2.2 + 1.8; x < W / 2 - 1; x += 3.6) {
      if (Math.abs(x) < PW / 2 + 1) continue;
      const shaft = new THREE.Mesh(shaftGeo, shaftMat); shaft.position.set(x, 1.72, FZ + 0.5);
      const cap = new THREE.Mesh(capGeo, capMat); cap.position.set(x, 3.4, FZ + 0.5);
      const foot = new THREE.Mesh(footGeo, capMat); foot.position.set(x, 0.11, FZ + 0.5);
      scene.add(shaft, cap, foot);
    }
    // Wings: dark glass on the left, stone on the right (as in the photos)
    const glassMap = glassTexture(); glassMap.wrapS = glassMap.wrapT = THREE.RepeatWrapping; glassMap.repeat.set(3, 2);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(10, 22, 26), new THREE.MeshStandardMaterial({ map: glassMap, metalness: 0.9, roughness: 0.1, envMap, envMapIntensity: 0.9 }));
    glass.position.set(-W / 2 - 5, 11, FZ + 11); scene.add(glass);
    for (let y = 3.6; y < 22; y += 3.6) strip(0.08, 0.08, 26, -W / 2 + 0.05, y, FZ + 11, AQUA, 1.6);
    const wingMap = fac.map.clone(), wingEm = fac.emissive.clone();
    for (const t of [wingMap, wingEm]) { t.repeat.set(26 / W, 1); t.offset.set(0.02, 0); t.needsUpdate = true; }
    const wingFront = new THREE.MeshStandardMaterial({ map: wingMap, emissiveMap: wingEm, emissive: 0xffffff, roughness: 0.9 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(10, H, 26), [stone, wingFront, stone, stone, stone, stone]);
    wing.position.set(W / 2 + 5, H / 2, FZ + 11); scene.add(wing);
    strip(0.14, 0.14, 26, W / 2 + 0.05, H + 0.05, FZ + 11, AQUA);

    // ── Fountain ──
    const water = new THREE.Mesh(new THREE.CircleGeometry(10, 96), new THREE.MeshStandardMaterial({ map: plazaTexture(), color: 0x8f8a84, metalness: 0.15, roughness: 0.3 }));
    water.rotation.x = -Math.PI / 2; water.position.set(FOUNTAIN.x, 0.012, FOUNTAIN.z); scene.add(water);
    const star = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshStandardMaterial({ map: starTexture(), transparent: true, roughness: 0.4, depthWrite: false }));
    star.rotation.x = -Math.PI / 2; star.position.set(0, 0.014, 27.5); scene.add(star);
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
    const placeYear = (i: number) => new THREE.Vector3(i % 2 ? -8.4 : 8.4, 3.9, 17 - i * 4.2);
    const placeExtra = (i: number) => new THREE.Vector3(i % 2 ? 12 : -12, i % 2 ? 3.9 : 4.9, -17.5);
    const PANEL_W = 6.2, PANEL_H = 4.43;
    /** Text drawn again once the web font is ready */
    const labels: (() => void)[] = [];
    /** A card that stands proud of its board: dark body, lit rim, canvas face */
    const raised = (w: number, h: number, color: string, cw: number, ch: number, depth = 0.18) => {
      const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const group = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, depth * 0.5), neon(color, 2.4)); rim.position.z = -depth * 0.3;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), new THREE.MeshStandardMaterial({ color: 0x0b1326, metalness: 0.7, roughness: 0.3, envMap, envMapIntensity: 0.6 }));
      const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) })); faceMesh.position.z = depth / 2 + 0.004;
      group.add(rim, body, faceMesh);
      return { group, canvas, tex };
    };
    const caption = (w: number, h: number, lines: string[], color: string, plate = false) => {
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = Math.round((512 * h) / w);
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      labels.push(() => { drawCaption(canvas, lines, color, isAr, plate); tex.needsUpdate = true; });
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !plate, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9), depthWrite: plate }));
    };
    /** A trophy of the given shape, about 0.9 m tall, standing on y = 0 */
    const trophy = (shape: JourneyAward['shape']) => {
      const g = new THREE.Group();
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 24), gold); foot.position.y = 0.05;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.3, 16), gold); stem.position.y = 0.25;
      g.add(foot, stem);
      let top: THREE.Object3D;
      if (shape === 'cup') {
        const pts = [[0.05, 0], [0.12, 0.04], [0.22, 0.2], [0.27, 0.42], [0.28, 0.5], [0.25, 0.5], [0.2, 0.22], [0.02, 0.06]].map(([x, y]) => new THREE.Vector2(x, y));
        top = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), gold); top.position.y = 0.38;
        for (const sx of [-1, 1]) { const handle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 20, Math.PI), gold); handle.position.set(sx * 0.27, 0.72, 0); handle.rotation.z = -sx * Math.PI / 2; g.add(handle); }
      } else if (shape === 'star') {
        const sh = new THREE.Shape();
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.13 : 0.3; if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        top = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), gold); top.position.set(0, 0.68, -0.045);
      } else if (shape === 'shield') {
        const sh = new THREE.Shape();
        sh.moveTo(-0.24, 0.3); sh.lineTo(0.24, 0.3); sh.lineTo(0.24, 0.02); sh.quadraticCurveTo(0.22, -0.2, 0, -0.3); sh.quadraticCurveTo(-0.22, -0.2, -0.24, 0.02); sh.closePath();
        top = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), gold); top.position.set(0, 0.7, -0.035);
      } else if (shape === 'medal') {
        top = new THREE.Group();
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 40), gold); disc.rotation.x = Math.PI / 2;
        const inner = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 40), gold); inner.position.z = 0.035;
        const ribbon = new THREE.MeshStandardMaterial({ color: 0x008e91, roughness: 0.6 });
        for (const sx of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.02), ribbon); r.position.set(sx * 0.08, 0.36, -0.02); r.rotation.z = -sx * 0.25; (top as THREE.Group).add(r); }
        (top as THREE.Group).add(disc, inner); top.position.y = 0.68;
      } else if (shape === 'globe') {
        top = new THREE.Group();
        (top as THREE.Group).add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 28, 20), gold));
        for (const rot of [[Math.PI / 2, 0], [0.5, 0.4], [1.1, -0.6]]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.012, 6, 48), gold); ring.rotation.set(rot[0], rot[1], 0); (top as THREE.Group).add(ring); }
        top.position.y = 0.68;
      } else {
        top = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: 0xbfefff, metalness: 0.2, roughness: 0.05, envMap, envMapIntensity: 1.6, transparent: true, opacity: 0.85, flatShading: true }));
        top.scale.y = 1.5; top.position.y = 0.8;
      }
      g.add(top);
      return g;
    };
    const addPanel = (s: JourneyStage, pos: THREE.Vector3, face: THREE.Vector3) => {
      const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 1000;
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const group = new THREE.Group(); group.position.copy(pos);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_W, PANEL_H), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: new THREE.Color(0.92, 0.92, 0.92), side: THREE.DoubleSide }));
      group.add(plane);
      // Neon frame and a floor beam under the panel
      const frameMat = neon(s.color, 2), hw = PANEL_W / 2, hh = PANEL_H / 2;
      for (const [w, h, x, y] of [[PANEL_W + 0.2, 0.06, 0, hh + 0.07], [PANEL_W + 0.2, 0.06, 0, -hh - 0.07], [0.06, PANEL_H + 0.2, hw + 0.07, 0], [0.06, PANEL_H + 0.2, -hw - 0.07, 0]] as const) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameMat); f.position.set(x, y, -0.03); group.add(f);
      }
      const beamG = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, pos.y - hh, 8), frameMat); beamG.position.set(0, -(pos.y - hh) / 2 - hh, -0.2); group.add(beamG);
      const base = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 48), frameMat); base.rotation.x = Math.PI / 2; base.position.set(0, -pos.y + 0.03, -0.2); group.add(base);

      // The year's figures as two raised cards on the lower edge
      if (s.visits && s.transactions) {
        const note = s.statsNoteAr && isAr ? ` (${s.statsNoteAr})` : '';
        const stats: [number, string][] = [[s.visits, (isAr ? 'زيارة للبوابة' : 'portal visits') + note], [s.transactions, isAr ? 'معاملة رقمية' : 'digital transactions']];
        stats.forEach(([v, label], k) => {
          const card = raised(2.85, 1.3, s.color, 760, 346);
          card.group.position.set((isAr ? 1 : -1) * (k ? -1.52 : 1.52), -hh - 0.05, 0.3);
          group.add(card.group);
          labels.push(() => { drawFigure(card.canvas, fmt(v, isAr), label, s.color, isAr); card.tex.needsUpdate = true; });
        });
      }
      // Logos of what was launched: metal medallions above the panel
      const logos = s.logos || [];
      logos.forEach((lg, k) => {
        const m = new THREE.Group();
        const rimMat = new THREE.MeshStandardMaterial({ color: s.color, metalness: 1, roughness: 0.25, envMap, envMapIntensity: 1.1 });
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 48), rimMat); coin.rotation.x = Math.PI / 2;
        const fc = document.createElement('canvas'); fc.width = fc.height = 256; drawMedallion(fc, lg.icon, s.color);
        const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 4;
        const faceMat = new THREE.MeshBasicMaterial({ map: ft, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) });
        const front = new THREE.Mesh(new THREE.CircleGeometry(0.4, 48), faceMat); front.position.z = 0.062;
        const backFace = new THREE.Mesh(new THREE.CircleGeometry(0.4, 48), faceMat); backFace.position.z = -0.062; backFace.rotation.y = Math.PI;
        m.add(coin, front, backFace);
        const x = ((logos.length - 1) / 2 - k) * 1.2 * (isAr ? 1 : -1);
        m.position.set(x, hh + 0.95, 0.12);
        const name = caption(1.18, 0.3, [isAr ? lg.ar : lg.en], s.color); name.position.set(x, hh + 0.3, 0.12);
        group.add(m, name);
        movers.push({ o: m, bob: 0.05, y0: m.position.y, phase: k * 0.9 });
      });
      // Awards: gold trophies on lit plinths in front of the panel
      const awards = s.awards || [];
      awards.forEach((aw, k) => {
        const x = ((awards.length - 1) / 2 - k) * 1.12 * (isAr ? 1 : -1), floor = -pos.y;
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 1.0, 28), new THREE.MeshStandardMaterial({ color: 0x141b2e, metalness: 0.6, roughness: 0.35, envMap, envMapIntensity: 0.5 }));
        plinth.position.set(x, floor + 0.5, 1.5);
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 6, 40), neon(s.color, 2)); band.rotation.x = Math.PI / 2; band.position.set(x, floor + 1.0, 1.5);
        const cup = trophy(aw.shape); cup.position.set(x, floor + 1.0, 1.5);
        const plate = caption(1.02, 0.42, [aw.year, isAr ? aw.ar : aw.en], s.color, true); plate.position.set(x, floor + 0.5, 1.5 + 0.45); plate.rotation.x = -0.12;
        const spot = new THREE.PointLight(0xffe2a8, 2.2, 3.2, 1.6); spot.position.set(x, floor + 2.6, 2.1);
        group.add(plinth, band, cup, plate, spot);
        movers.push({ o: cup, spin: 0.35 + k * 0.03, y0: cup.position.y, phase: k });
      });

      const dir = face.clone().sub(pos); dir.y = 0; dir.normalize();
      group.rotation.y = Math.atan2(dir.x, dir.z);
      scene.add(group);
      panelTex.push({ canvas, tex, stage: s });
      // Step back far enough to take in the medallions above and the cards or trophies below
      const top = pos.y + hh + (logos.length ? 1.5 : 0.2), low = awards.length ? 0.2 : pos.y - hh - (s.visits ? 0.8 : 0.2);
      const mid = (top + low) / 2, dist = Math.max(7.2, ((top - low) / 2) / Math.tan(THREE.MathUtils.degToRad(29)) + (awards.length ? 2.2 : 1.0));
      const cam = pos.clone().add(dir.clone().multiplyScalar(dist)); cam.y = Math.max(1.9, mid - 0.4);
      return { cam, target: pos.clone().setY(mid) };
    };
    years.forEach((s, i) => { const p = placeYear(i); stations.push(addPanel(s, p, new THREE.Vector3(0, 3, p.z + 6))); });
    extras.forEach((s, i) => { const p = placeExtra(i); stations.push(addPanel(s, p, new THREE.Vector3(0, 3, p.z + 9))); });
    // Live board in front of the portal
    const BW = 17.4, BH = 8.6, BY = 8.9, BZ = FZ + 5;
    const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1800; boardCanvas.height = Math.round((1800 * BH) / BW);
    const boardTex = new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 4;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, toneMapped: false, color: new THREE.Color(0.92, 0.92, 0.92) }));
    board.position.set(0, BY, BZ); scene.add(board);
    for (const [w, h, x, y] of [[BW + 0.3, 0.08, 0, BH / 2 + 0.05], [BW + 0.3, 0.08, 0, -BH / 2 - 0.05], [0.08, BH + 0.2, BW / 2 + 0.1, 0], [0.08, BH + 0.2, -BW / 2 - 0.1, 0]] as const) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), neon(AQUA, 3)); f.position.set(x, BY + y, BZ - 0.05); scene.add(f);
    }
    // Six figures as cards standing proud of the board
    const figureCards = Array.from({ length: 6 }, (_, i) => {
      const card = raised(5.3, 2.75, AQUA, 1000, 520, 0.3);
      const col = i % 3, row = Math.floor(i / 3);
      card.group.position.set((isAr ? 1 : -1) * (1 - col) * 5.6, BY + 0.55 - row * 3.05, BZ + 0.3);
      card.group.visible = false; scene.add(card.group);
      return card;
    });
    const drawFigures = (progress: number) => {
      const e = 1 - Math.pow(1 - progress, 3);
      figureCards.forEach((card, i) => {
        const f = figuresState?.[i];
        card.group.visible = !!f;
        if (!f) return;
        (card.group.children[0] as THREE.Mesh).material = rimFor(f.color);
        drawFigure(card.canvas, f.value === null ? '—' : fmt(Math.round(f.value * e), isAr), isAr ? f.labelAr : f.labelEn, f.color, isAr);
        card.tex.needsUpdate = true;
      });
    };
    const rims = new Map<string, THREE.MeshBasicMaterial>();
    const rimFor = (c: string) => { if (!rims.has(c)) rims.set(c, neon(c, 2.4)); return rims.get(c)!; };
    // The municipality logo, raised on a plaque over the board
    const plaque = raised(5.2, 3.0, AQUA, 780, 450, 0.3);
    plaque.group.position.set(0, BY + BH / 2 + 1.9, BZ + 0.1); scene.add(plaque.group);
    { const g = plaque.canvas.getContext('2d')!; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 780, 450); plaque.tex.needsUpdate = true; }
    const logoImg = new Image();
    logoImg.onload = () => {
      const g = plaque.canvas.getContext('2d')!; const k = Math.min(680 / logoImg.width, 370 / logoImg.height), w = logoImg.width * k, h = logoImg.height * k;
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 780, 450); g.drawImage(logoImg, (780 - w) / 2, (450 - h) / 2, w, h); plaque.tex.needsUpdate = true;
    };
    logoImg.src = '/brand/dhofar-municipality-logo.png';
    stations.push({ cam: new THREE.Vector3(0, 6.2, -7), target: new THREE.Vector3(0, BY + 0.8, BZ) });

    // Text needs the web font loaded before drawing on canvases
    let figuresState: LiveFigure[] | null = null, asOfState: string | undefined, boardStart = 0;
    const redrawText = () => {
      drawSign(signCanvas, isAr); signTex.needsUpdate = true;
      for (const p of panelTex) { drawStage(p.canvas, p.stage, isAr); p.tex.needsUpdate = true; }
      for (const l of labels) l();
      drawBoard(boardCanvas, figuresState, isAr, asOfState); boardTex.needsUpdate = true;
      drawFigures(boardStart ? 0 : 1);
    };
    redrawText();
    document.fonts?.ready.then(redrawText).catch(() => {});

    // ── Post-processing ──
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.28, 0.22, 0.97);
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
      // The caption covers the lower part of a tall screen, so the subject is framed higher there
      const target = s.target.clone(); target.y -= Math.min(2.2, (k - 1) * 2.4);
      return { cam: target.clone().add(s.cam.clone().sub(s.target).multiplyScalar(k)), target };
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
      setFigures: (f, asOf) => { const first = !figuresState && f; figuresState = f; asOfState = asOf; boardStart = first ? performance.now() : 0; drawBoard(boardCanvas, f, isAr, asOf); boardTex.needsUpdate = true; drawFigures(first ? 0 : 1); },
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
        drawFigures(k);
        if (k >= 1) boardStart = 0;
      }
      for (const m of movers) {
        if (m.spin) m.o.rotation.y = t * m.spin * motion + m.phase;
        if (m.bob) m.o.position.y = m.y0 + Math.sin(t * 1.1 + m.phase) * m.bob * motion;
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
