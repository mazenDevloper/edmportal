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
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect.js';
import type { JourneyAward, JourneyIcon, JourneyModel, JourneyStage } from '@/lib/digital-journey';

export interface LiveFigure { labelAr: string; labelEn: string; value: number | null; color: string }
/** walk: move with the keyboard at eye height; look: turn the view with the head (phone sensors) or by dragging; stereo: side-by-side for a phone headset */
export interface ViewMode { walk: boolean; look: boolean; stereo: boolean }
/** What turns the view in head-look mode: the device's motion sensor, or the pointer when there is none ("insecure": the page is not on HTTPS, so the browser withholds the sensor) */
export type LookSource = 'sensor' | 'pointer' | 'insecure';
export interface CourtyardHandle { enterVR: () => Promise<void>; setMode: (m: Partial<ViewMode>) => Promise<LookSource | null>; /** Walking input from the on-screen stick: x to the right, y towards the visitor, each −1…1 */ move: (x: number, y: number) => void; /** The visitor's own walking speed in m/s, from the phone's GPS: it carries them forward the way they face */ gps: (speed: number) => void }
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
  /** A station picked on the hub screen in the courtyard */
  onSelect?: (i: number) => void;
  /** Height in pixels of the caption and buttons at the foot of the screen; the hub screen is framed clear above it */
  bottomInset?: number;
}

// ── Dimensions (metres) ──
const W = 72, H = 26, D = 12, FZ = -30;           // façade width/height/depth, front plane z
const PW = 24, PH = 18, PD = 4;                   // central portal opening and recess depth
const FOUNTAIN = new THREE.Vector3(0, 0, -12);
const STEPS = 9, RISE = 0.15, TREAD = 0.42;       // nine granite steps up to the lobby
const LOBBY_Y = STEPS * RISE, STAIR_RUN = (STEPS - 1) * TREAD;
const EZ = 38;                                    // inner face of the entry block (the courtyard runs from FZ to EZ)
// Soft tints of the brand teal and purple; nothing in the scene is fully saturated
const AQUA = '#6FD3CF', PURPLE = '#B3A4DC', PINK = '#8CCFD6', WARM = '#EBC98F';
const FONT = '"Readex Pro", "Segoe UI", Tahoma, sans-serif';

/** LED strip material. GLOW tones every strip down together: the light reads as a line, not a haze */
const GLOW = 0.42;
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
function facadeTextures(portal = true) {
  const PX = 28, cw = W * PX, ch = H * PX;
  const map = document.createElement('canvas'); map.width = cw; map.height = ch;
  const em = document.createElement('canvas'); em.width = cw; em.height = ch;
  // Gloss map (green = roughness, blue = metalness): rough stone, polished reflective glass
  const gl = document.createElement('canvas'); gl.width = cw; gl.height = ch;
  const m = map.getContext('2d')!, e = em.getContext('2d')!, q = gl.getContext('2d')!;
  const r = rng(7);
  m.fillStyle = '#c9b497'; m.fillRect(0, 0, cw, ch);
  e.fillStyle = '#000'; e.fillRect(0, 0, cw, ch);
  q.fillStyle = 'rgb(0,196,0)'; q.fillRect(0, 0, cw, ch);
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
  const lit = () => { const v = r(); return v < 0.8 ? null : `rgba(255, ${190 + Math.round(r() * 40)}, ${120 + Math.round(r() * 50)}, ${0.3 + r() * 0.3})`; };
  const win = (cx: number, cy: number, w: number, h: number, arched = false) => {
    const path = (ctx: CanvasRenderingContext2D, pad: number) => {
      ctx.beginPath();
      const l = X(cx - w / 2) - pad, rr = X(cx + w / 2) + pad, b = Y(cy - h / 2) + pad, t = Y(cy + h / 2) - pad;
      if (arched) { const rad = (rr - l) / 2; ctx.moveTo(l, b); ctx.lineTo(l, t + rad); ctx.arc((l + rr) / 2, t + rad, rad, Math.PI, 0); ctx.lineTo(rr, b); }
      else ctx.rect(l, t, rr - l, b - t);
      ctx.closePath();
    };
    m.fillStyle = '#b0614a'; path(m, 4); m.fill();
    // The reveal: the stone of the opening's sides, in shadow, with the glass set back inside it
    m.fillStyle = '#6b5b4e'; path(m, 0); m.fill();
    m.fillStyle = '#131b26'; path(m, -4); m.fill();
    m.save(); path(m, 0); m.clip();
    const sh = m.createLinearGradient(0, Y(cy + h / 2), 0, Y(cy + h / 2) + 0.5 * PX); sh.addColorStop(0, 'rgba(0,0,0,0.75)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = sh; m.fillRect(X(cx - w / 2), Y(cy + h / 2), w * PX, 0.5 * PX);
    m.fillStyle = 'rgba(0,0,0,0.4)'; m.fillRect(X(cx - w / 2), Y(cy + h / 2), 0.16 * PX, h * PX);
    m.fillStyle = 'rgba(255,240,220,0.22)'; m.fillRect(X(cx - w / 2), Y(cy - h / 2) - 3, w * PX, 3);
    m.restore();
    q.fillStyle = 'rgb(0,70,170)'; path(q, -4); q.fill();
    const glow = lit();
    if (glow) { e.fillStyle = glow; path(e, -4); e.fill(); }
  };
  const inPortal = (x: number, y: number) => portal && Math.abs(x) < PW / 2 + 0.6 && y < PH + 0.3;
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
    if (portal && Math.abs(x) < PW / 2 + 1.5) continue;
    const l = X(x - 1.3), rr = X(x + 1.3), rad = (rr - l) / 2;
    const draw = (ctx: CanvasRenderingContext2D) => { ctx.beginPath(); ctx.moveTo(l, Y(0)); ctx.lineTo(l, Y(3.2)); ctx.arc((l + rr) / 2, Y(3.2), rad, Math.PI, 0); ctx.lineTo(rr, Y(0)); ctx.closePath(); };
    // A deep arched recess: shadowed stone sides, a dark doorway inside, and a low warm light from within
    const inner = (ctx: CanvasRenderingContext2D) => { const p = 0.3 * PX; ctx.beginPath(); ctx.moveTo(l + p, Y(0)); ctx.lineTo(l + p, Y(3.2)); ctx.arc((l + rr) / 2, Y(3.2), rad - p, Math.PI, 0); ctx.lineTo(rr - p, Y(0)); ctx.closePath(); };
    m.fillStyle = '#75604f'; draw(m); m.fill();
    m.save(); draw(m); m.clip();
    const as = m.createLinearGradient(0, Y(3.2) - rad, 0, Y(1.6)); as.addColorStop(0, 'rgba(0,0,0,0.8)'); as.addColorStop(1, 'rgba(0,0,0,0.15)'); m.fillStyle = as; m.fillRect(l, Y(3.2) - rad, rr - l, 4 * PX);
    m.restore();
    m.fillStyle = '#16130f'; inner(m); m.fill();
    const ag = e.createRadialGradient((l + rr) / 2, Y(0.2), 2, (l + rr) / 2, Y(0.2), 3.6 * PX); ag.addColorStop(0, 'rgba(255,190,120,0.5)'); ag.addColorStop(1, 'rgba(255,170,100,0.04)');
    e.fillStyle = ag; inner(e); e.fill();
  }
  const mk = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const gloss = new THREE.CanvasTexture(gl); gloss.anisotropy = 4;
  return { map: mk(map), emissive: mk(em), gloss };
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
  const R = 8.2, SPRING = 7.4;
  const round = (ctx: CanvasRenderingContext2D, r: number) => { ctx.beginPath(); ctx.moveTo(X(-r), Y(0)); ctx.lineTo(X(-r), Y(SPRING)); ctx.arc(X(0), Y(SPRING), r * PX, Math.PI, 0); ctx.lineTo(X(r), Y(0)); ctx.closePath(); };
  m.fillStyle = '#b25c43'; round(m, R + 1.4); m.fill();
  m.fillStyle = '#e2d3bd'; round(m, R + 0.5); m.fill();
  const g = m.createLinearGradient(0, Y(SPRING + R), 0, Y(0)); g.addColorStop(0, '#2a3a52'); g.addColorStop(1, '#0a1220');
  m.fillStyle = g; round(m, R); m.fill();
  const ge = e.createLinearGradient(0, Y(SPRING + R), 0, Y(0)); ge.addColorStop(0, 'rgba(255,196,150,0.45)'); ge.addColorStop(0.6, 'rgba(120,110,200,0.2)'); ge.addColorStop(1, 'rgba(255,190,120,0.5)');
  e.fillStyle = ge; round(e, R); e.fill();
  // The two bridges crossing behind the arch
  m.save(); round(m, R); m.clip();
  for (const by of [5.6, 10.4]) { m.fillStyle = '#9aa0a8'; m.fillRect(X(-R), Y(by + 1.0), 2 * R * PX, 1.0 * PX); m.fillStyle = '#cfd4da'; m.fillRect(X(-R), Y(by + 1.9), 2 * R * PX, 0.12 * PX); }
  m.restore();
  e.save(); round(e, R); e.clip();
  for (const by of [5.6, 10.4]) { e.fillStyle = 'rgba(255,225,180,0.7)'; e.fillRect(X(-R), Y(by + 0.05), 2 * R * PX, 0.14 * PX); }
  e.restore();
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
  if (plate) { g.fillStyle = '#0a1122'; g.fillRect(0, 0, w, h); }
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = 'center';
  lines.forEach((l, i) => {
    const size = fitFont(g, l, 700, Math.round((h / lines.length) * (i === 0 && lines.length > 1 ? 0.7 : 0.56)), w - 30);
    g.fillStyle = i === 0 && lines.length > 1 ? color : '#ffffff';
    if (!plate) { g.lineWidth = 8; g.strokeStyle = 'rgba(3,7,18,0.9)'; g.strokeText(l, w / 2, (h / lines.length) * (i + 0.5) + size * 0.34); }
    g.fillText(l, w / 2, (h / lines.length) * (i + 0.5) + size * 0.34);
  });
}

/** A holographic station panel */
function drawStage(c: HTMLCanvasElement, s: JourneyStage, isAr: boolean, reveal = 1) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, 'rgba(10,22,42,0.96)'); bg.addColorStop(1, 'rgba(8,16,32,0.96)');
  g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 36); g.fill();
  g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = isAr ? 'right' : 'left';
  const x0 = isAr ? w - 60 : 60, maxW = w - 120;
  // Year on one side, title and summary beside it, so the points get the height of the card
  g.font = `700 150px ${FONT}`; emboss(g, s.year, x0, 160, s.color, 150);
  const yearW = g.measureText(s.year).width + 44, tx = isAr ? x0 - yearW : x0 + yearW, tw = maxW - yearW;
  g.fillStyle = '#ffffff'; fitFont(g, isAr ? s.titleAr : s.titleEn, 700, 58, tw); g.fillText(isAr ? s.titleAr : s.titleEn, tx, 96);
  g.fillStyle = 'rgba(255,255,255,0.82)'; g.font = `400 34px ${FONT}`;
  wrap(g, isAr ? s.summaryAr : s.summaryEn, tw).slice(0, 2).forEach((l, i) => g.fillText(l, tx, 146 + i * 44));
  g.fillStyle = s.color; g.fillRect(60, 214, w - 120, 4);
  if (!isAr) return;
  const items = s.items.slice(0, 6), top = 236, bottom = h - (s.visits ? 150 : 40);
  const rowH = Math.min(118, (bottom - top) / items.length), chip = rowH * 0.31;
  items.forEach((it, i) => {
    const a = Math.max(0, Math.min(1, reveal * (items.length + 1.5) - i));
    if (a <= 0) return;
    const e = 1 - Math.pow(1 - a, 3), ry = top + i * rowH;
    g.save(); g.globalAlpha = e; g.translate((1 - e) * 110, 0);
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'; g.beginPath(); g.roundRect(60, ry + 6, w - 120, rowH - 12, 20); g.fill();
    const cx = w - 60 - rowH / 2;
    g.fillStyle = s.color; g.beginPath(); g.arc(cx, ry + rowH / 2, chip, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#08101e'; g.textAlign = 'center'; g.font = `700 ${Math.round(chip * 1.15)}px ${FONT}`; g.fillText(String(i + 1), cx, ry + rowH / 2 + chip * 0.4);
    g.textAlign = 'right'; g.fillStyle = '#ffffff';
    const size = fitFont(g, it, 600, Math.min(50, Math.round(rowH * 0.46)), w - 120 - rowH - 50);
    g.fillText(it, w - 60 - rowH - 8, ry + rowH / 2 + size * 0.34);
    g.restore();
  });
}

function drawBoard(c: HTMLCanvasElement, figures: LiveFigure[] | null, isAr: boolean, asOf?: string) {
  const g = c.getContext('2d')!; const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, 'rgba(10,22,42,0.92)'); bg.addColorStop(1, 'rgba(8,16,32,0.92)');
  g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 40); g.fill();
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
  g.font = `400 64px ${FONT}`; g.shadowColor = PURPLE; g.shadowBlur = 6; g.fillStyle = '#e8edf5';
  g.fillText(isAr ? 'بلدية ظفار · 2020 — 2040' : 'Dhofar Municipality · 2020 — 2040', c.width / 2, 280);
}

interface Station { cam: THREE.Vector3; target: THREE.Vector3; /** Already worked out for this screen: not stepped back again */ exact?: boolean }

export const CourtyardJourney = forwardRef<CourtyardHandle, Props>(function CourtyardJourney(
  { stages, index, isAr, figures, asOfLabel, reducedMotion, onReady, onNext, onVRChange, onSelect, bottomInset }, ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const api = useRef<{
    goTo: (i: number) => void; setFigures: (f: LiveFigure[] | null, asOf?: string) => void; enterVR: () => Promise<void>; setMode: (m: Partial<ViewMode>) => void; hasSensor: () => boolean; move: (x: number, y: number) => void; setInset: (px: number) => void; gps: (speed: number) => void;
  } | null>(null);
  const insetRef = useRef(bottomInset);
  insetRef.current = bottomInset;
  const indexRef = useRef(index);
  indexRef.current = index;
  const cb = useRef({ onNext, onVRChange, onReady, onSelect });
  cb.current = { onNext, onVRChange, onReady, onSelect };

  useImperativeHandle(ref, () => ({
    enterVR: () => api.current?.enterVR() ?? Promise.resolve(),
    move: (x, y) => api.current?.move(x, y),
    gps: speed => api.current?.gps(speed),
    setMode: async m => {
      // iOS only hands out motion data after the visitor agrees, and only from a tap
      if (m.look) { const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent; try { await D?.requestPermission?.(); } catch { /* refused: dragging still turns the view */ } }
      api.current?.setMode(m);
      if (!m.look) return null;
      // Give the sensor a moment to report before deciding what is steering the view
      await new Promise(r => setTimeout(r, 1200));
      return api.current?.hasSensor() ? 'sensor' : window.isSecureContext ? 'pointer' : 'insecure';
    },
  }), []);

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
    scene.fog = new THREE.FogExp2(0x060a18, 0.0030);
    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 900);
    const dolly = new THREE.Group(); dolly.add(camera); scene.add(dolly);

    // ── Sky and stars ──
    const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      // Night, with the glow of the city along the horizon
      uniforms: { top: { value: new THREE.Color('#01030a') }, mid: { value: new THREE.Color('#081028') }, hor: { value: new THREE.Color('#2a1d55') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP; void main(){ float h = max(vP.y, 0.0); vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.7, h)); gl_FragColor = vec4(c, 1.0); }',
    }));
    scene.add(sky);
    const starGeo = new THREE.BufferGeometry(); const sp: number[] = []; const sr = rng(99);
    for (let i = 0; i < 1400; i++) { const th = sr() * Math.PI * 2, ph = Math.acos(0.15 + sr() * 0.85); sp.push(400 * Math.sin(ph) * Math.cos(th), 400 * Math.cos(ph), 400 * Math.sin(ph) * Math.sin(th)); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 28, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff3d6').multiplyScalar(1.5), toneMapped: false, fog: false }));
    moon.position.set(-170, 190, -300); scene.add(moon);

    // Reflections for the gold trophies, medallion rims and the glass tower (not applied scene-wide)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.22, envMap, envMapIntensity: 1.15 });
    /** Reception robots gliding in front of the entrance */
    const bots: { o: THREE.Object3D; cap: THREE.Object3D; x0: number; z0: number; sx: number }[] = [];
    /** Laser beams that sway about their foot */
    const sweepers: { o: THREE.Object3D; tilt: number; lean: number; amp: number; sp: number; ph: number }[] = [];
    /** Moves the cloth of the flag */
    let flagWave: ((t: number) => void) | null = null;
    /** Laser drawings: they breathe slowly, and the wave bands drift sideways */
    const lasers: { m: THREE.Material; base: number; ph: number; scroll?: THREE.Texture; rate?: number; steady?: boolean }[] = [];
    /** Air traffic circling over the city */
    const fliers: { o: THREE.Object3D; r: number; h: number; sp: number; ph: number }[] = [];
    /** Things that turn or bob in the animation loop */
    const movers: { o: THREE.Object3D; spin?: number; bob?: number; y0: number; phase: number }[] = [];

    // ── Lights ──
    // Mostly sky light, so the four walls of the courtyard read as the same stone; the low sun only warms them
    // Night: a dim cool sky light and moonlight; the warm light comes from the lamps and windows
    scene.add(new THREE.HemisphereLight(0x3b4a80, 0x16121c, 0.74));
    const moonLight = new THREE.DirectionalLight(0x9fb4ff, 0.28); moonLight.position.set(-60, 80, 60); scene.add(moonLight);
    scene.environment = envMap; scene.environmentIntensity = 0.16;
    // Polished and reflective finishes used around the entrance
    const marble = new THREE.MeshPhysicalMaterial({ color: 0xd9d2cb, roughness: 0.16, metalness: 0.1, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1 });
    const granite = new THREE.MeshPhysicalMaterial({ color: 0x7c3f3a, roughness: 0.18, metalness: 0.15, clearcoat: 0.9, clearcoatRoughness: 0.12, envMapIntensity: 1 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xe3e7ec, metalness: 1, roughness: 0.08, envMapIntensity: 1.5 });
    const cladding = new THREE.MeshStandardMaterial({ color: 0x8f959d, metalness: 1, roughness: 0.2, envMapIntensity: 1.2 });
    const pane = new THREE.MeshPhysicalMaterial({ color: 0xcfeef0, transparent: true, opacity: 0.2, roughness: 0.02, metalness: 0, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false });
    for (const x of [-30, -18, 18, 30]) {
      const s = new THREE.SpotLight(0xffc890, 12, 30, 0.55, 0.7, 1.2);
      s.position.set(x, 0.3, FZ + 6); s.target.position.set(x, 18, FZ); scene.add(s, s.target);
    }
    const portalSpot = new THREE.SpotLight(0x9ff5ff, 26, 40, 0.6, 0.7, 1.2);
    portalSpot.position.set(0, 0.5, FZ + 8); portalSpot.target.position.set(0, 12, FZ - PD); scene.add(portalSpot, portalSpot.target);
    const fountainLights = [AQUA, PURPLE, '#8fb4e6'].map((c, i) => {
      const l = new THREE.PointLight(c, 7, 22, 1.4); l.position.set(Math.cos(i * 2.1) * 4, 0.6, FOUNTAIN.z + Math.sin(i * 2.1) * 4); scene.add(l); return l;
    });

    // ── Ground ──
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 240), new THREE.MeshPhysicalMaterial({ map: tileTexture(), roughness: 0.22, metalness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.2, color: 0x8c857c }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = 30; scene.add(ground);
    (ground.material as THREE.MeshPhysicalMaterial).map!.repeat.set(48, 52);

    // ── Building ──
    const fac = facadeTextures(), facWing = facadeTextures(false);
    const stone = new THREE.MeshStandardMaterial({ color: 0x5f5b64, roughness: 0.92 });
    const facadePiece = (x0: number, x1: number, y0: number, y1: number, depth = D) => {
      const map = fac.map.clone(), em = fac.emissive.clone(), gl = fac.gloss.clone();
      for (const t of [map, em, gl]) { t.repeat.set((x1 - x0) / W, (y1 - y0) / H); t.offset.set((x0 + W / 2) / W, y0 / H); t.needsUpdate = true; }
      const front = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffffff, color: 0x62657e, emissiveIntensity: 0.5, roughnessMap: gl, metalnessMap: gl, roughness: 1, metalness: 1, envMap, envMapIntensity: 0.45 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, depth), [stone, stone, stone, stone, front, stone]);
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, FZ - depth / 2);
      scene.add(mesh);
      return mesh;
    };
    /** Height of the arcade, and how deep the walkway behind it is */
    const AH = 4.9, AD = 3.2;
    const arcStone = new THREE.MeshStandardMaterial({ color: 0x7b747a, roughness: 0.8 }), arcDark = new THREE.MeshStandardMaterial({ color: 0x2f2a2c, roughness: 0.9 });
    const drumMat = new THREE.MeshStandardMaterial({ color: 0xa8553f, roughness: 0.7 }), capitalMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.55 });
    const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.3, 24), capitalGeo = new THREE.CylinderGeometry(0.98, 0.44, 0.56, 28), plinthGeo = new THREE.CylinderGeometry(0.5, 0.56, 0.22, 24);
    const bayC = document.createElement('canvas'); bayC.width = 144; bayC.height = 196;
    {
      // One bay of the walkway's back wall: stone, a dark window, and the low warm light of the passage
      const x = bayC.getContext('2d')!; x.fillStyle = '#3a3533'; x.fillRect(0, 0, 144, 196);
      const lg = x.createLinearGradient(0, 196, 0, 30); lg.addColorStop(0, 'rgba(255,186,118,0.5)'); lg.addColorStop(1, 'rgba(255,186,118,0)'); x.fillStyle = lg; x.fillRect(0, 0, 144, 196);
      x.fillStyle = '#12151a'; x.fillRect(38, 56, 68, 112); x.strokeStyle = '#5b5f66'; x.lineWidth = 3; x.strokeRect(38, 56, 68, 112); x.beginPath(); x.moveTo(72, 56); x.lineTo(72, 168); x.stroke();
    }
    const bayTex = new THREE.CanvasTexture(bayC); bayTex.colorSpace = THREE.SRGBColorSpace; bayTex.wrapS = THREE.RepeatWrapping;
    const downlight = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a8).multiplyScalar(1.4), toneMapped: false });
    /** Built along local x and opening towards local +z, with the wall's face at z = 0 */
    const arcade = (len: number, place: (g: THREE.Group) => void) => {
      const g = new THREE.Group(); place(g); scene.add(g);
      const n = Math.max(1, Math.floor((len - 0.6) / 3.6)), start = -((n - 1) * 3.6) / 2, R = 1.5, SPRING = 3.0;
      // The arches: one wall panel from the springing line up, scalloped by a half circle over each bay
      const sh = new THREE.Shape(); sh.moveTo(-len / 2, AH); sh.lineTo(len / 2, AH); sh.lineTo(len / 2, SPRING);
      for (let k = n - 1; k >= 0; k--) { const c = start + k * 3.6; sh.lineTo(c + R, SPRING); sh.absarc(c, SPRING, R, 0, Math.PI, false); }
      sh.lineTo(-len / 2, SPRING); sh.closePath();
      const front = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false, curveSegments: 20 }), arcStone); front.position.z = -0.6; g.add(front);
      // A column under every springing point, so each stands midway between two openings
      for (let k = 0; k <= n; k++) {
        const x = start + (k - 0.5) * 3.6;
        const drum = new THREE.Mesh(drumGeo, drumMat); drum.position.set(x, 1.35, -0.3);
        const capital = new THREE.Mesh(capitalGeo, capitalMat); capital.position.set(x, 2.76, -0.3);
        const plinth = new THREE.Mesh(plinthGeo, capitalMat); plinth.position.set(x, 0.11, -0.3);
        g.add(drum, capital, plinth);
      }
      // The walkway: back wall with its windows, ceiling with a light in each bay, and closed ends
      const bt = bayTex.clone(); bt.repeat.set(len / 3.6, 1); bt.needsUpdate = true;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(len, AH), new THREE.MeshBasicMaterial({ map: bt, color: new THREE.Color(0.85, 0.85, 0.85) })); back.position.set(0, AH / 2, -AD); g.add(back);
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(len, AD), arcDark); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, AH - 0.01, -AD / 2); g.add(ceil);
      for (const sx of [-1, 1]) { const end = new THREE.Mesh(new THREE.PlaneGeometry(AD, AH), arcDark); end.rotation.y = -sx * Math.PI / 2; end.position.set(sx * len / 2, AH / 2, -AD / 2); g.add(end); }
      for (let k = 0; k < n; k++) { const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), downlight); lamp.rotation.x = Math.PI / 2; lamp.position.set(start + k * 3.6, AH - 0.03, -AD / 2); g.add(lamp); }
    };
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -W / 2 : PW / 2, x1 = sx < 0 ? -PW / 2 : W / 2;
      facadePiece(x0, x1, AH, H);
      const low = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, AH, D - AD), stone); low.position.set((x0 + x1) / 2, AH / 2, FZ - AD - (D - AD) / 2); scene.add(low);
      arcade(x1 - x0, g => g.position.set((x0 + x1) / 2, 0, FZ));
    }
    facadePiece(-PW / 2, PW / 2, PH, H);
    // Recess: side walls, ceiling and the arched back wall
    const recessMat = new THREE.MeshStandardMaterial({ color: 0x57514d, roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, PH, PD), recessMat);
      wall.position.set(sx * (PW / 2 - 0.2), PH / 2, FZ - PD / 2); scene.add(wall);
    }
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.4, PD), recessMat); ceil.position.set(0, PH - 0.2, FZ - PD / 2); scene.add(ceil);
    const pw = portalWallTextures();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: pw.map, emissiveMap: pw.emissive, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.85 }));
    back.position.set(0, PH / 2, FZ - PD); scene.add(back);
    // LED along the great arch
    {
      const pts = [new THREE.Vector3(-9.6, 0, FZ - PD + 0.12), ...Array.from({ length: 41 }, (_, i) => { const a = Math.PI - (i / 40) * Math.PI; return new THREE.Vector3(Math.cos(a) * 9.6, 7.4 + Math.sin(a) * 9.6, FZ - PD + 0.12); }), new THREE.Vector3(9.6, 0, FZ - PD + 0.12)];
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 200, 0.07, 6), neon(AQUA, 3.2)));
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
    const steel = new THREE.MeshStandardMaterial({ color: 0xc9d0d8, metalness: 1, roughness: 0.28, envMapIntensity: 1.1 });
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
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, EZ - FZ), steel); rafter.position.set(x, H + 4.5, (FZ + EZ) / 2); scene.add(rafter);
    }
    for (let z = FZ + 7; z <= EZ; z += 8) {
      const purlin = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, 0.1), steel); purlin.position.set(0, H + 4.5, z); scene.add(purlin);
    }
    // Arcade columns with white capitals in front of the side blocks
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xa8553f, roughness: 0.8 }), capMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.7 });
    const shaftGeo = new THREE.CylinderGeometry(0.3, 0.33, 3.0, 20), capGeo = new THREE.CylinderGeometry(0.5, 0.34, 0.36, 20), footGeo = new THREE.CylinderGeometry(0.4, 0.44, 0.22, 20);
    void shaftGeo; void capGeo; void footGeo; void shaftMat; void capMat;
    // Wings: dark glass on the left, stone on the right (as in the photos)
    const glassMap = glassTexture(); glassMap.wrapS = glassMap.wrapT = THREE.RepeatWrapping; glassMap.repeat.set(3, 2);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(10, 22, 26), new THREE.MeshStandardMaterial({ map: glassMap, metalness: 0.9, roughness: 0.1, envMap, envMapIntensity: 0.9 }));
    glass.position.set(-W / 2 - 5, 11, FZ + 11); scene.add(glass);
    for (let y = 3.6; y < 22; y += 3.6) strip(0.08, 0.08, 26, -W / 2 + 0.05, y, FZ + 11, AQUA, 1.6);
    // The two long sides of the courtyard, from the far façade to the entry block
    const wingSide = (sx: number, z0: number, z1: number) => {
      const len = z1 - z0, map = facWing.map.clone(), em = facWing.emissive.clone(), gl = facWing.gloss.clone();
      for (const t of [map, em, gl]) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(len / W, (H - AH) / H); t.offset.y = AH / H; t.needsUpdate = true; }
      const inner = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffffff, color: 0x62657e, emissiveIntensity: 0.5, roughnessMap: gl, metalnessMap: gl, roughness: 1, metalness: 1, envMap, envMapIntensity: 0.45 });
      const outer = inner.clone(); outer.color.set(0x7c86a3); outer.roughness = 0.6; outer.envMapIntensity = 0.55;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, H - AH, len), sx > 0 ? [outer, inner, stone, stone, stone, stone] : [inner, outer, stone, stone, stone, stone]);
      // Under it: the solid ground floor behind the walkway (its outside face keeps the foot of the façade), and the arcade itself
      const lowOut = outer.clone();
      for (const key of ['map', 'emissiveMap', 'roughnessMap', 'metalnessMap'] as const) { const t = (outer[key] as THREE.Texture).clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(len / W, AH / H); t.offset.y = 0; t.needsUpdate = true; lowOut[key] = t; }
      const lowBox = new THREE.Mesh(new THREE.BoxGeometry(10 - AD, AH, len), sx > 0 ? [lowOut, stone, stone, stone, stone, stone] : [stone, lowOut, stone, stone, stone, stone]);
      lowBox.position.set(sx * (W / 2 + AD + (10 - AD) / 2), AH / 2, (z0 + z1) / 2); scene.add(lowBox);
      arcade(len, g => { g.position.set(sx * W / 2, 0, (z0 + z1) / 2); g.rotation.y = -sx * Math.PI / 2; });
      mesh.position.set(sx * (W / 2 + 5), (H + AH) / 2, (z0 + z1) / 2); scene.add(mesh);
      strip(0.12, 0.12, len, sx * (W / 2 - 0.05), H + 0.05, (z0 + z1) / 2, AQUA, 2.2);

    };
    wingSide(1, FZ - 2, EZ + D);
    wingSide(-1, FZ + 24, EZ + D);

    {
      const leafA = new THREE.MeshStandardMaterial({ color: 0x1f5a2e, roughness: 0.95, flatShading: true }), leafB = new THREE.MeshStandardMaterial({ color: 0x2c6d36, roughness: 0.95, flatShading: true });
      const barkA = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.9 }), blob = new THREE.IcosahedronGeometry(1, 1);
      for (const sx of [-1, 1]) for (const z of [-20, -6, 22, 32]) {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.7, 5.4), marble); bed.position.set(sx * 31.5, 0.35, z); scene.add(bed);
        const soil = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5), leafA); soil.rotation.x = -Math.PI / 2; soil.position.set(sx * 31.5, 0.71, z); scene.add(soil);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.4, 8), barkA); trunk.position.set(sx * 31.5, 1.9, z); scene.add(trunk);
        const crown = new THREE.Mesh(blob, leafB); crown.scale.set(1.5, 1.3, 1.5); crown.position.set(sx * 31.5, 3.6, z); scene.add(crown);
        for (const dz of [-1.9, 1.9]) { const shrub = new THREE.Mesh(blob, leafA); shrub.scale.set(0.75, 0.6, 0.75); shrub.position.set(sx * 31.5, 1.15, z + dz); scene.add(shrub); }
      }
    }
    // Night inside the courtyard: warm uplights wash only the foot of the walls
    {
      const wc = document.createElement('canvas'); wc.width = 256; wc.height = 256; const wx = wc.getContext('2d')!;
      const cone = wx.createRadialGradient(128, 256, 4, 128, 256, 250);
      cone.addColorStop(0, 'rgba(255,196,128,0.95)'); cone.addColorStop(0.35, 'rgba(255,170,100,0.32)'); cone.addColorStop(1, 'rgba(255,150,80,0)');
      wx.translate(128, 256); wx.scale(0.42, 1); wx.translate(-128, -256); wx.fillStyle = cone; wx.fillRect(-300, 0, 900, 256);
      const washTex = new THREE.CanvasTexture(wc); washTex.colorSpace = THREE.SRGBColorSpace;
      const wash = (len: number, x: number, z: number, ry: number, n = Math.max(1, Math.round(len / 7.2)), h = 10, y0 = 0) => {
        const t = washTex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(n, 1); t.needsUpdate = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        m.position.set(x, y0 + h / 2, z); m.rotation.y = ry; scene.add(m);
      };
      // A light glass skin with slim metal mullions over the outside walls
      const skin = pane.clone(); skin.color.set(0x9fd8e6); skin.opacity = 0.13; skin.envMapIntensity = 2.6;
      const curtain = (len: number, x: number, z: number, ry: number) => {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(len, H - 0.4), skin); sheet.position.y = H / 2; g.add(sheet);
        // A slim metal edge top and bottom only: the glass itself is one piece
        for (const y of [0.06, H - 0.06]) { const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.1), cladding); m.position.y = y; g.add(m); }
      };
      const LZ0 = FZ + 24, SIDE = W / 2 + 10;
      for (const sx of [-1, 1]) curtain((W - PW) / 2, sx * (W + PW) / 4, EZ + D + 0.28, 0);
      curtain(EZ + D - FZ, SIDE + 0.28, (EZ + D + FZ) / 2, Math.PI / 2);
      curtain(EZ + D - LZ0, -(SIDE + 0.28), (EZ + D + LZ0) / 2, -Math.PI / 2);
      for (const sx of [-1, 1]) { wash((W - PW) / 2, sx * (W + PW) / 4, FZ + 0.08, 0, undefined, 8, AH); wash((W - PW) / 2, sx * (W + PW) / 4, EZ - 0.08, Math.PI); }
      wash(EZ - FZ, W / 2 - 0.08, (EZ + FZ) / 2, -Math.PI / 2, undefined, 8, AH);
      wash(EZ - FZ - 24, -(W / 2 - 0.08), (EZ + FZ + 24) / 2, Math.PI / 2, undefined, 8, AH);
      // Outside: the entrance front and the two long sides
      for (const sx of [-1, 1]) { wash((W - PW) / 2, sx * (W + PW) / 4, EZ + D + 0.08, 0); wash((W - PW) / 2, sx * (W + PW) / 4, EZ + D + 0.1, 0, 3, 17); }
      wash(EZ + D - FZ, SIDE + 0.1, (EZ + D + FZ) / 2, Math.PI / 2, 6, 17);
      wash(EZ + D - LZ0, -(SIDE + 0.1), (EZ + D + LZ0) / 2, -Math.PI / 2, 4, 17);
      // The entrance: warm floodlights graze the stone of the three arches, and a cooler light fills the lobby mouth
      for (const sx of [-1, 1]) {
        const flood = new THREE.SpotLight(0xffc890, 90, 40, 0.62, 0.75, 1.25); flood.position.set(sx * 13, 0.5, EZ + D + 7); flood.target.position.set(sx * 4, 13, EZ + D); scene.add(flood, flood.target);
        const fit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.9), cladding); fit.position.set(sx * 13, 0.15, EZ + D + 7); scene.add(fit);
      }
      const crownLight = new THREE.SpotLight(0xfff0dc, 40, 30, 0.7, 0.8, 1.3); crownLight.position.set(0, 0.6, EZ + D + 10); crownLight.target.position.set(0, 16, EZ + D); scene.add(crownLight, crownLight.target);
      wash(EZ + D - FZ, SIDE + 0.08, (EZ + D + FZ) / 2, Math.PI / 2, 2, 20);
      wash(EZ + D - LZ0, -(SIDE + 0.08), (EZ + D + LZ0) / 2, -Math.PI / 2, 2, 20);
      for (const sx of [-1, 1]) for (const z of sx > 0 ? [(EZ + D + FZ) / 2 - (EZ + D - FZ) / 4, (EZ + D + FZ) / 2 + (EZ + D - FZ) / 4] : [(EZ + D + LZ0) / 2 - (EZ + D - LZ0) / 4, (EZ + D + LZ0) / 2 + (EZ + D - LZ0) / 4]) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 1.4), cladding); lamp.position.set(sx * (SIDE + 1.6), 0.18, z);
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a8).multiplyScalar(1.6), toneMapped: false })); lens.rotation.x = -Math.PI / 2; lens.position.set(sx * (SIDE + 1.6), 0.37, z);
        scene.add(lamp, lens);
      }
    }

    const dark0s = new THREE.MeshStandardMaterial({ color: 0x0b0d12, metalness: 0.6, roughness: 0.3 });
    // A very faint laser show high on the walls in the municipality's identity:
    // moving waves, Burj Al Nahdha, the gate and the pattern
    {
      const art = (w: number, h: number, draw: (x: CanvasRenderingContext2D) => void) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!;
        x.strokeStyle = '#fff'; x.lineWidth = 3; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = '#fff'; x.shadowBlur = 5; draw(x);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
      };
      const show = (tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number, ry: number, hex: string, op: number, ph: number, scroll = false) => {
        const mat = new THREE.MeshBasicMaterial({ map: tex, color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m);
        lasers.push({ m: mat, base: op, ph, scroll: scroll ? tex : undefined });
        return m;
      };
      // Waves: the brand wave lines running round the top of the courtyard
      const waveTex = () => { const t = art(512, 128, x => { for (let i = 0; i < 4; i++) { x.beginPath(); for (let px = 0; px <= 512; px += 4) { const y = 24 + i * 26 + Math.sin((px / 512) * Math.PI * 4 + i * 0.6) * 9; if (px) x.lineTo(px, y); else x.moveTo(px, y); } x.stroke(); } }); t.wrapS = THREE.RepeatWrapping; return t; };
      const w1 = waveTex(); w1.repeat.set(6, 1); show(w1, W - 2, 3.2, 0, H - 3, FZ + 0.5, 0, AQUA, 0.2, 0, true);
      for (const sx of [-1, 1]) { const w2 = waveTex(); w2.repeat.set(5, 1); show(w2, EZ - FZ - (sx < 0 ? 24 : 0), 3.2, sx * (W / 2 - 0.14), H - 3, (EZ + FZ + (sx < 0 ? 24 : 0)) / 2, -sx * Math.PI / 2, AQUA, 0.16, sx, true); }
      // The gate: the three pointed arches of the entrance
      const gate = art(512, 384, x => {
        const arch = (cx: number, w: number, h: number, k = 1) => { const a = (w / 2) * k, top = 350 - h * k; x.beginPath(); x.moveTo(cx - a, 350); x.lineTo(cx - a, 350 - h * k * 0.55); x.quadraticCurveTo(cx - a, top + h * k * 0.1, cx, top); x.quadraticCurveTo(cx + a, top + h * k * 0.1, cx + a, 350 - h * k * 0.55); x.lineTo(cx + a, 350); x.stroke(); };
        for (const k of [1, 0.84]) { arch(256, 150, 300, k); arch(104, 110, 215, k); arch(408, 110, 215, k); }
        x.beginPath(); x.moveTo(12, 350); x.lineTo(500, 350); x.moveTo(12, 366); x.lineTo(500, 366); x.stroke();
      });
      show(gate, 13, 9.75, W / 2 - 0.5, 15, 8, -Math.PI / 2, PURPLE, 0.2, 1.5);
      // The pattern: an eight-pointed star lattice, slowly turning over the courtyard and still on the entry wall
      const lattice = () => { const t = art(256, 256, x => {
        x.lineWidth = 2;
        for (const rot of [0, Math.PI / 4]) { x.beginPath(); for (let i = 0; i <= 4; i++) { const a = rot + i * Math.PI / 2, px = 128 + Math.cos(a) * 92, py = 128 + Math.sin(a) * 92; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); }
        x.beginPath(); x.arc(128, 128, 34, 0, Math.PI * 2); x.stroke();
        x.beginPath(); for (const [a, b] of [[0, 128], [128, 0], [256, 128], [128, 256]]) { x.moveTo(a, b); x.lineTo(128 + (a - 128) * 0.28, 128 + (b - 128) * 0.28); } x.stroke();
      }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
      const p1 = lattice(); p1.repeat.set(6, 1); show(p1, 30, 5, 0, 20, EZ - 0.5, Math.PI, PURPLE, 0.12, 3);
      const p2 = lattice(); p2.repeat.set(3, 3);
      const rose = show(p2, 30, 30, 0, H + 0.6, 4, 0, AQUA, 0.09, 4); rose.rotation.order = 'YXZ'; rose.rotation.x = Math.PI / 2;
      movers.push({ o: rose, spin: 0.03, y0: H + 0.6, phase: 0 });
      // Burj Al Nahdha, traced in light from the real model
      new OBJLoader().load('/models/burj.obj', obj => {
        const line = new THREE.LineBasicMaterial({ color: AQUA, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        const hidden = new THREE.MeshBasicMaterial({ visible: false });
        const meshes: THREE.Mesh[] = []; obj.traverse(o => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
        for (const m of meshes) { m.material = hidden; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), line)); }
        const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), k = 12 / size.y;
        obj.scale.setScalar(k); obj.position.set(-(box.min.x + size.x / 2) * k, -box.min.y * k, -(box.min.z + size.z / 2) * k);
        const flat = new THREE.Group(); flat.add(obj); flat.scale.x = 0.03; flat.position.set(-(W / 2 - 0.6), 8.5, 10); scene.add(flat);
        lasers.push({ m: line, base: 0.28, ph: 2 });
      });
      { const w3 = waveTex(); w3.repeat.set(6, 1); show(w3, W - 2, 3.2, 0, H - 3, EZ + D + 0.5, 0, AQUA, 0.2, 2, true); }
      {
        const SX = -(W / 2 + 10.5), out = -Math.PI / 2;
        // LED screen high on the side wall: the title, and a ticker running under it
        const sc = document.createElement('canvas'); sc.width = 1280; sc.height = 256;
        const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace; st.anisotropy = 4;
        const tc = document.createElement('canvas'); tc.width = 2048; tc.height = 64;
        const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace; tt.wrapS = THREE.RepeatWrapping; tt.repeat.set(0.5, 1);
        const dots = (x: CanvasRenderingContext2D, w: number, h: number) => { x.fillStyle = 'rgba(0,0,0,0.42)'; for (let i = 0; i < w; i += 4) x.fillRect(i, 0, 1, h); for (let j = 0; j < h; j += 4) x.fillRect(0, j, w, 1); };
        const paint = () => {
          const x = sc.getContext('2d')!; const bg = x.createLinearGradient(0, 0, 1280, 0); bg.addColorStop(0, '#062b33'); bg.addColorStop(0.5, '#0c1c3c'); bg.addColorStop(1, '#2a1650'); x.fillStyle = bg; x.fillRect(0, 0, 1280, 256);
          x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = isAr ? 'rtl' : 'ltr';
          x.fillStyle = '#7ff5f2'; x.font = `700 104px ${FONT}`; x.fillText(isAr ? 'بلدية ظفار' : 'Dhofar Municipality', 640, 96);
          x.fillStyle = '#e9e2ff'; x.font = `500 50px ${FONT}`; x.fillText(isAr ? 'رحلة التحول الرقمي 2020 — 2040' : 'Digital transformation journey 2020 — 2040', 640, 198);
          dots(x, 1280, 256); st.needsUpdate = true;
          const y = tc.getContext('2d')!; y.fillStyle = '#04121c'; y.fillRect(0, 0, 2048, 64); y.textBaseline = 'middle'; y.direction = isAr ? 'rtl' : 'ltr'; y.textAlign = 'center'; y.font = `600 34px ${FONT}`;
          const msg = isAr ? ['خدمات بلدية رقمية', 'بيانات مفتوحة', 'مدينة ذكية', 'رؤية 2040'] : ['Digital municipal services', 'Open data', 'Smart city', 'Vision 2040'];
          msg.forEach((m, i) => { y.fillStyle = i % 2 ? '#ffd9a0' : '#7ff5f2'; y.fillText(m, 256 + i * 512, 34); });
          dots(y, 2048, 64); tt.needsUpdate = true;
        };
        paint(); document.fonts?.ready.then(paint);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.6, 28.8), dark0s); frame.position.set(SX + 0.1, 19.4, 30); scene.add(frame);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(28, 5.6), new THREE.MeshBasicMaterial({ map: st, toneMapped: false, color: new THREE.Color(0.8, 0.8, 0.8) })); screen.position.set(SX - 0.12, 20, 30); screen.rotation.y = out; scene.add(screen);
        const tickerMat = new THREE.MeshBasicMaterial({ map: tt, toneMapped: false, color: new THREE.Color(0.8, 0.8, 0.8) });
        const ticker = new THREE.Mesh(new THREE.PlaneGeometry(28, 1.1), tickerMat); ticker.position.set(SX - 0.12, 16.5, 30); ticker.rotation.y = out; scene.add(ticker);
        lasers.push({ m: tickerMat, base: 1, ph: 0, scroll: tt, rate: isAr ? -0.05 : 0.05, steady: true });
        // The logo drawn on the wall by lasers from two projectors on the lawn
        const lc = document.createElement('canvas'); lc.width = 654; lc.height = 396;
        const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace; lt.anisotropy = 4;
        const li = new Image();
        li.onload = () => { const x = lc.getContext('2d')!; x.drawImage(li, 0, 0, 654, 396); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#c9fffb'; x.fillRect(0, 0, 654, 396); lt.needsUpdate = true; };
        li.src = '/brand/dhofar-municipality-logo.png';
        const LW = 15, LH = LW * 396 / 654, LY = 8.4, LZ = 6;
        for (let k = 0; k < 4; k++) show(lt, LW, LH, SX - 0.15 - k * 0.07, LY, LZ, out, AQUA, k === 3 ? 0.85 : 0.2, k * 0.2);
        const ray = new THREE.MeshBasicMaterial({ color: new THREE.Color(AQUA).multiplyScalar(1.8), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
        for (const pz of [LZ - 9, LZ + 9]) {
          const a = new THREE.Vector3(SX - 13, 0.6, pz), box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), dark0s); box.position.set(a.x, 0.3, a.z); scene.add(box);
          for (const [dy, dz] of [[-LH / 2, -LW / 2], [-LH / 2, LW / 2], [LH / 2, -LW / 2], [LH / 2, LW / 2]]) {
            const b = new THREE.Vector3(SX - 0.2, LY + dy, LZ + dz), m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, a.distanceTo(b), 5), ray);
            m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); scene.add(m);
          }
        }
        lasers.push({ m: ray, base: 0.4, ph: 1 });
      }
      // Sweeping beams: from the roofline into the sky, and thinner ones down into the courtyard
      const sweep = (x: number, y: number, z: number, len: number, hex: string, op: number, tilt: number, lean: number, amp: number, sp: number) => {
        const geo = new THREE.CylinderGeometry(0.05, 0.05, len, 6, 1, true); geo.translate(0, len / 2, 0);
        const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(1.6), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
        beam.position.set(x, y, z); scene.add(beam);
        sweepers.push({ o: beam, tilt, lean, amp, sp, ph: x * 0.3 + z * 0.1 });
      };
      for (const sx of [-1, 1]) {
        sweep(sx * W / 2, H, EZ + D, 150, AQUA, 0.2, -sx * 0.35, 0.25, 0.3, 0.22);
        sweep(sx * 13, H, EZ + D, 150, PURPLE, 0.18, -sx * 0.1, 0.4, 0.26, 0.3);
        sweep(sx * W / 2, H, FZ - D, 150, PURPLE, 0.18, -sx * 0.3, -0.3, 0.3, 0.19);
        sweep(sx * 9, H + 1, 14, 36, AQUA, 0.1, Math.PI + sx * 0.25, 0.2, 0.3, 0.33);
        sweep(sx * 9, H + 1, -8, 36, PURPLE, 0.1, Math.PI + sx * 0.25, -0.2, 0.3, 0.27);
      }
      // Burj Al Nahdha on its roundabout behind the building, where the map puts it; tall enough to show over the roofline
      {
        const BX = -124, BZ0 = -103;
        const rt = lattice(); rt.repeat.set(4, 4);
        const garden = new THREE.Mesh(new THREE.CircleGeometry(20, 64), new THREE.MeshBasicMaterial({ map: rt, color: AQUA, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
        garden.rotation.x = -Math.PI / 2; garden.position.set(BX, 0.05, BZ0); scene.add(garden);
        const road = new THREE.Mesh(new THREE.RingGeometry(21, 28, 64), new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 0.6, metalness: 0.2 })); road.rotation.x = -Math.PI / 2; road.position.set(BX, 0.04, BZ0); scene.add(road);
        for (const r of [21, 28]) { const kerb = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 6, 96), neon(r === 21 ? AQUA : WARM, 2.4)); kerb.rotation.x = Math.PI / 2; kerb.position.set(BX, 0.1, BZ0); scene.add(kerb); }
        new OBJLoader().load('/models/burj.obj', obj => {
          // Floodlit stone: a warm glow of its own so it reads from the courtyard at night
          const lit0 = new THREE.MeshPhysicalMaterial({ color: 0x22c4cc, emissive: 0x0b9aa2, emissiveIntensity: 0.1, roughness: 0.06, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.1, envMap, envMapIntensity: 0.7, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, fog: false });
          const edge = new THREE.LineBasicMaterial({ color: AQUA, transparent: true, opacity: 0.6, fog: false });
          const meshes: THREE.Mesh[] = []; obj.traverse(o => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
          for (const m of meshes) { if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); m.material = lit0; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edge)); }
          const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), k = (H + 7) / size.y;
          const kw = k; obj.scale.set(kw, k, kw); obj.position.set(BX - (box.min.x + size.x / 2) * kw, -box.min.y * k, BZ0 - (box.min.z + size.z / 2) * kw); scene.add(obj);
        });
        for (let i = 0; i < 4; i++) sweep(BX + Math.cos(i * 1.57) * 16, 0.3, BZ0 + Math.sin(i * 1.57) * 16, 130, i % 2 ? AQUA : WARM, 0.14, -Math.cos(i * 1.57) * 0.14, Math.sin(i * 1.57) * 0.14, 0.1, 0.25);
      }
      // Thin beams from the roof frame to each drawing
      const emitter = new THREE.Vector3(0, H + 1.2, 4), up = new THREE.Vector3(0, 1, 0);
      for (const [x, y, z] of [[W / 2 - 0.5, 15, 8], [-(W / 2 - 0.6), 14.5, 10], [0, H - 3, FZ + 0.5], [0, 20, EZ - 0.5]]) {
        const b = new THREE.Vector3(x, y, z), mat = new THREE.MeshBasicMaterial({ color: AQUA, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
        const ray = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 0.04, emitter.distanceTo(b), 12, 1, true), mat);
        ray.position.copy(emitter).add(b).multiplyScalar(0.5); ray.quaternion.setFromUnitVectors(up, b.clone().sub(emitter).normalize()); scene.add(ray);
        lasers.push({ m: mat, base: 0.035, ph: x + z });
      }
    }

    // The entry block: the visitor comes in from outside through three pointed arches, crosses the
    // lobby and steps into the courtyard. Both faces carry the façade; the arches are real openings.
    const entryPiece = (x0: number, x1: number, y0: number, y1: number) => {
      const map = fac.map.clone(), em = fac.emissive.clone(), gl = fac.gloss.clone();
      for (const t of [map, em, gl]) { t.repeat.set((x1 - x0) / W, (y1 - y0) / H); t.offset.set((x0 + W / 2) / W, y0 / H); t.needsUpdate = true; }
      const face = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: 0xffffff, color: 0x62657e, emissiveIntensity: 0.5, roughnessMap: gl, metalnessMap: gl, roughness: 1, metalness: 1, envMap, envMapIntensity: 0.45 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, D), [recessMat, recessMat, stone, recessMat, face, face]);
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, EZ + D / 2); scene.add(mesh);
    };
    entryPiece(-W / 2, -PW / 2, 0, H);
    entryPiece(PW / 2, W / 2, 0, H);
    entryPiece(-PW / 2, PW / 2, PH, H);
    {
      const wall = new THREE.Shape();
      wall.moveTo(-PW / 2, 0); wall.lineTo(PW / 2, 0); wall.lineTo(PW / 2, PH); wall.lineTo(-PW / 2, PH); wall.closePath();
      for (const a of PORTAL_ARCHES) { const hole = new THREE.Path(); archPoints(a.cx, a.w, a.spring, a.apex, 18).forEach(([x, y], i) => (i ? hole.lineTo(x, y) : hole.moveTo(x, y))); hole.closePath(); wall.holes.push(hole); }
      const wallGeo = new THREE.ExtrudeGeometry(wall, { depth: 0.9, bevelEnabled: false });
      const rc = document.createElement('canvas'); rc.width = rc.height = 256; const rx = rc.getContext('2d')!, rr = rng(31);
      // Pale pink stone laid in courses, each block a slightly different tone
      for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
        const t = 150 + Math.floor(rr() * 34); rx.fillStyle = `rgb(${t + 52}, ${t + 24}, ${t + 4})`;
        rx.fillRect(col * 64 + (row % 2 ? 32 : 0), row * 32, 63, 31);
      }
      const redStone = new THREE.CanvasTexture(rc); redStone.colorSpace = THREE.SRGBColorSpace; redStone.wrapS = redStone.wrapT = THREE.RepeatWrapping; redStone.repeat.set(0.3, 0.3);
      const wallMat = new THREE.MeshStandardMaterial({ map: redStone, color: 0xb8aaa4, roughness: 0.8 }), band = new THREE.MeshStandardMaterial({ color: 0x8a4038, roughness: 0.7 }), paleTrim = new THREE.MeshPhysicalMaterial({ color: 0xe6dccd, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 });
      const dark0 = new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.8, roughness: 0.4 });
      for (const z of [EZ, EZ + D - 0.9]) {
        const mesh = new THREE.Mesh(wallGeo, wallMat); mesh.position.z = z; scene.add(mesh);
        for (const a of PORTAL_ARCHES) {
          // Each arch: a broad surround of red stone, lined on the inside with a slim pale band
          const zf = z + (z === EZ ? -0.02 : 0.92), line = (grow: number, rise: number) => new THREE.CatmullRomCurve3(archPoints(a.cx, a.w + grow, a.spring, a.apex + rise, 30).map(([x, y]) => new THREE.Vector3(x, y, zf)), false, 'catmullrom', 0.1);
          const red = new THREE.Mesh(new THREE.TubeGeometry(line(1.7, 1.05), 160, 0.85, 10), band); red.scale.z = 0.16; red.position.z = zf * 0.84;
          scene.add(red, new THREE.Mesh(new THREE.TubeGeometry(line(0.1, 0.05), 160, 0.2, 8), paleTrim));
        }
      }
      // Warm light in the lobby, and the zebra paving and flag outside
      const lobby = new THREE.PointLight(0xffd2a0, 24, 30, 1.5); lobby.position.set(0, 9, EZ + D / 2); scene.add(lobby);
      const zc = document.createElement('canvas'); zc.width = 64; zc.height = 256; const zg = zc.getContext('2d')!;
      zg.fillStyle = '#cfc8c2'; zg.fillRect(0, 0, 64, 256); zg.fillStyle = '#7c3f3a'; for (let i = 0; i < 8; i++) zg.fillRect(0, i * 32 + 24, 64, 8);
      const zt = new THREE.CanvasTexture(zc); zt.colorSpace = THREE.SRGBColorSpace;
      const zebra = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), new THREE.MeshPhysicalMaterial({ map: zt, roughness: 0.14, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 }));
      zebra.rotation.x = -Math.PI / 2; zebra.position.set(0, 0.013, EZ + D + 12); scene.add(zebra);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 9, 10), steel); pole.position.set(0, H + 4.5, EZ + D - 1); scene.add(pole);
      const fc = document.createElement('canvas'); fc.width = 600; fc.height = 300; const fg = fc.getContext('2d')!;
      // Oman: white, red and green bands with the red band at the hoist, and the weave of the cloth
      fg.fillStyle = '#f4f4f1'; fg.fillRect(0, 0, 600, 100); fg.fillStyle = '#c8141a'; fg.fillRect(0, 100, 600, 100); fg.fillStyle = '#0a7d2c'; fg.fillRect(0, 200, 600, 100); fg.fillStyle = '#c8141a'; fg.fillRect(0, 0, 160, 300);
      fg.strokeStyle = '#f4f4f1'; fg.lineWidth = 5; fg.lineCap = 'round';
      fg.beginPath(); fg.moveTo(52, 30); fg.lineTo(108, 86); fg.moveTo(108, 30); fg.lineTo(52, 86); fg.stroke();
      fg.beginPath(); fg.moveTo(80, 26); fg.lineTo(80, 66); fg.quadraticCurveTo(80, 92, 98, 84); fg.stroke();
      fg.globalAlpha = 0.06; fg.fillStyle = '#000'; for (let k = 0; k < 600; k += 3) fg.fillRect(k, 0, 1, 300); for (let k = 0; k < 300; k += 3) fg.fillRect(0, k, 600, 1); fg.globalAlpha = 1;
      const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 4;
      const FW = 5.4, FH = 2.7, flagGeo = new THREE.PlaneGeometry(FW, FH, 36, 14);
      const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ map: ft, side: THREE.DoubleSide, roughness: 0.85, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0.22 }));
      flag.position.set(FW / 2 + 0.06, H + 7.55, EZ + D - 1); scene.add(flag);
      const flagLamp = new THREE.SpotLight(0xfff0dc, 60, 22, 0.4, 0.6, 1.2); flagLamp.position.set(1.5, H + 0.4, EZ + D + 2); flagLamp.target = flag; scene.add(flagLamp);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), gold); finial.position.set(0, H + 9.1, EZ + D - 1); scene.add(finial);
      const fp0 = flagGeo.attributes.position, rest = Float32Array.from(fp0.array as Float32Array);
      flagWave = t => {
        for (let k = 0; k < fp0.count; k++) {
          const x = rest[k * 3], y = rest[k * 3 + 1], u = x / FW + 0.5;
          fp0.setZ(k, (Math.sin(u * 7 - t * 4.2 + y * 0.9) * 0.3 + Math.sin(u * 13 - t * 6.5) * 0.08) * u);
          fp0.setY(k, y + Math.sin(u * 5 - t * 3.1) * 0.07 * u - u * u * 0.22);
        }
        fp0.needsUpdate = true; flagGeo.computeVertexNormals();
      };
      flagWave(0);

      // Raised marble floor through the lobby, with the granite steps down on each side
      const slab = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.8, LOBBY_Y, D + 3), marble); slab.position.set(0, LOBBY_Y / 2, EZ + D / 2); scene.add(slab);
      for (const side of [1, -1]) {
        const edge = side > 0 ? EZ + D + 1.5 : EZ - 1.5;
        for (let i = 0; i < STEPS - 1; i++) {
          const hgt = RISE * (STEPS - 1 - i), z = edge + side * (TREAD / 2 + i * TREAD), step = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.8, hgt, TREAD), granite);
          step.position.set(0, hgt / 2, z); scene.add(step);
          // The pale nosing strip on each tread
          const nose = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.8, 0.012, 0.05), marble); nose.position.set(0, hgt + 0.006, z + side * (TREAD / 2 - 0.03)); scene.add(nose);
        }
        const slope = Math.atan2(LOBBY_Y, STAIR_RUN), runLen = Math.hypot(LOBBY_Y, STAIR_RUN);
        // Glass balustrades with steel handrails either side of the middle arch, and marble planters beyond them
        for (const sx of [-1, 1]) {
          const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.0, runLen), pane); glassPanel.position.set(sx * 3.5, LOBBY_Y / 2 + 0.6, edge + side * STAIR_RUN / 2); glassPanel.rotation.x = side * slope; scene.add(glassPanel);
          const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, runLen + 0.2, 10), chrome); rail.rotation.x = Math.PI / 2 + side * slope; rail.position.set(sx * 3.5, LOBBY_Y / 2 + 1.14, edge + side * STAIR_RUN / 2); scene.add(rail);
          for (const u of [0.04, 0.5, 0.96]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), chrome); post.position.set(sx * 3.5, LOBBY_Y * (1 - u) + 0.58, edge + side * STAIR_RUN * u); scene.add(post); }
          const planter = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.9, 1.7), marble); planter.position.set(sx * 4.75, 0.95, edge + side * (STAIR_RUN - 0.9)); scene.add(planter);
          for (let k = 0; k < 5; k++) { const leafMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.95, 5), new THREE.MeshStandardMaterial({ color: k % 2 ? 0x8e2a2a : 0x3f6b35, roughness: 0.7 })); leafMesh.position.set(sx * 4.75 + Math.cos(k * 1.26) * 0.3, 2.3, edge + side * (STAIR_RUN - 0.9) + Math.sin(k * 1.26) * 0.3); leafMesh.rotation.set(Math.sin(k * 1.26) * 0.5, 0, -Math.cos(k * 1.26) * 0.5); scene.add(leafMesh); }
        }
      }
      // The two metal-clad bridges that cross the lobby behind the arches, with glass railings
      for (const by of [6.3, 11.4]) {
        const deck = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.8, 1.5, 3.4), cladding); deck.position.set(0, by, EZ + D / 2); scene.add(deck);
        for (let x = -PW / 2 + 2; x < PW / 2 - 1; x += 2.6) { const joint = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 3.42), dark0); joint.position.set(x, by, EZ + D / 2); scene.add(joint); }
        for (const dz of [-1.68, 1.68]) {
          const railGlass = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.8, 1.0, 0.03), pane); railGlass.position.set(0, by + 1.25, EZ + D / 2 + dz); scene.add(railGlass);
          const top = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.8, 0.05, 0.06), chrome); top.position.set(0, by + 1.77, EZ + D / 2 + dz); scene.add(top);
        }
      }
      // A light stone moulding inside each red arch band, on both faces
      const trim = new THREE.MeshStandardMaterial({ color: 0xefe7da, roughness: 0.6 });
      for (const z of [EZ - 0.06, EZ + D + 0.06]) for (const a of PORTAL_ARCHES) {
        const pts = archPoints(a.cx, a.w + 0.08, a.spring, a.apex + 0.04, 30).map(([x, y]) => new THREE.Vector3(x, y, z));
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 160, 0.16, 8), trim));
      }
    }

    // ── Fountain ──
    const water = new THREE.Mesh(new THREE.CircleGeometry(10, 96), new THREE.MeshStandardMaterial({ map: plazaTexture(), color: 0x8f8a84, metalness: 0.15, roughness: 0.3 }));
    water.rotation.x = -Math.PI / 2; water.position.set(FOUNTAIN.x, 0.012, FOUNTAIN.z); scene.add(water);
    const star = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshPhysicalMaterial({ map: starTexture(), transparent: true, roughness: 0.15, clearcoat: 1, depthWrite: false }));
    star.rotation.x = -Math.PI / 2; star.position.set(0, LOBBY_Y + 0.012, EZ + D / 2); scene.add(star);
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

    // ── Stacked cubes at the entrance, as in the beneficiary-experience event ──
    const cubeFace = (text: string[], bg: string) => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const draw = () => {
        const g = c.getContext('2d')!; g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
        g.textAlign = 'center'; g.direction = isAr ? 'rtl' : 'ltr'; g.fillStyle = '#ffffff';
        text.forEach((l, i) => { const size = fitFont(g, l, 700, text.length > 1 ? 44 : 54, 216); g.fillText(l, 128, 128 + (i - (text.length - 1) / 2) * 58 + size * 0.34); });
        tex.needsUpdate = true;
      };
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      labelsEarly.push(draw);
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 });
    };
    const labelsEarly: (() => void)[] = [];
    const CUBES: [string[], string][] = isAr
      ? [[['عِش', 'التجربة'], '#2b3fa3'], [['تجاوب'], '#17968f'], [['تجربة', 'المستفيد'], '#3b2a7a'], [['بلدية ظفار'], '#17968f'], [['خدمات', 'رقمية'], '#2b3fa3'], [['رؤية 2040'], '#3b2a7a']]
      : [[['Live the', 'experience'], '#2b3fa3'], [['Tajawob'], '#17968f'], [['Beneficiary', 'experience'], '#3b2a7a'], [['Dhofar', 'Municipality'], '#17968f'], [['Digital', 'services'], '#2b3fa3'], [['Vision 2040'], '#3b2a7a']];
    [-1, 1].forEach((sx, si) => {
      for (let k = 0; k < 3; k++) {
        const [text, bg] = CUBES[si * 3 + k];
        const cube = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 1.25), cubeFace(text, bg));
        cube.position.set(sx * 12.5 + (k === 1 ? sx * 0.15 : 0), 0.625 + k * 1.25, 25.5); cube.rotation.y = sx * (0.5 - k * 0.32);
        scene.add(cube);
      }
    });

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
    /** A screen bent on a vertical axis so its edges come towards the viewer */
    const bend = (w: number, h: number, r: number, seg = 40) => {
      const geo = new THREE.PlaneGeometry(w, h, seg, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const a = p.getX(i) / r; p.setX(i, Math.sin(a) * r); p.setZ(i, (1 - Math.cos(a)) * r); }
      geo.computeVertexNormals(); return geo;
    };
    const raised = (w: number, h: number, cw: number, ch: number, depth = 0.18) => {
      const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), new THREE.MeshStandardMaterial({ color: 0x0b1326, metalness: 0.7, roughness: 0.3, envMap, envMapIntensity: 0.6 }));
      const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) })); faceMesh.position.z = depth / 2 + 0.004;
      group.add(body, faceMesh);
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
      const navy = new THREE.MeshStandardMaterial({ color: 0x1b1d45, metalness: 0.4, roughness: 0.4 });
      if (shape === 'text') {
        // "SAG GIS Award" lettering on a gold-edged slab
        g.remove(stem);
        const c = document.createElement('canvas'); c.width = 512; c.height = 300;
        const x = c.getContext('2d')!; x.fillStyle = '#10142e'; x.fillRect(0, 0, 512, 300);
        x.textAlign = 'left'; x.font = '700 118px "Readex Pro", "Segoe UI", sans-serif';
        const grad = x.createLinearGradient(0, 40, 0, 270); grad.addColorStop(0, '#fff1a8'); grad.addColorStop(0.5, '#d9b92a'); grad.addColorStop(1, '#a8870f');
        x.fillStyle = '#000'; x.fillText('SAG GIS', 34, 136); x.fillText('Award', 34, 254);
        x.fillStyle = grad; x.fillText('SAG GIS', 30, 130); x.fillText('Award', 30, 248);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        top = new THREE.Group();
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.52, 0.07), gold);
        const face = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.46), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) })); face.position.z = 0.037;
        const back = face.clone(); back.position.z = -0.037; back.rotation.y = Math.PI;
        (top as THREE.Group).add(slab, face, back); top.position.y = 0.38;
      } else if (shape === 'plaque') {
        // Gold plaque in a navy frame with a fine gold outline, leaning back on its foot
        g.remove(stem);
        top = new THREE.Group();
        const outline = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.54, 0.02), gold);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.46, 0.05), navy);
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.36, 0.07), gold);
        (top as THREE.Group).add(outline, frame, plate); top.position.y = 0.4; top.rotation.x = -0.16;
      } else if (shape === 'sail') {
        // A solid leaning sail with an open lattice wing beside it
        g.remove(stem); g.remove(foot);
        top = new THREE.Group();
        const slabBase = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.07, 0.3), gold); slabBase.position.y = 0.035;
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.24), gold); step.position.y = 0.085;
        const sh = new THREE.Shape(); sh.moveTo(-0.22, 0); sh.lineTo(0.12, 0); sh.lineTo(0.18, 0.6); sh.lineTo(-0.1, 0.46); sh.closePath();
        const sail = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }), gold); sail.position.set(0, 0.1, -0.05);
        const wire = (a: [number, number], b: [number, number]) => {
          const v = new THREE.Vector3(b[0] - a[0], b[1] - a[1], 0), rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, v.length(), 6), gold);
          rod.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.1, 0); rod.rotation.z = Math.atan2(v.y, v.x) - Math.PI / 2; return rod;
        };
        const P: [number, number][] = [[0.1, 0.9], [0.3, 0.72], [0.3, 0.42], [0.2, 0.1], [0.1, 0.6], [0.2, 0.62], [0.24, 0.5]];
        for (const [a, b] of [[0, 1], [1, 2], [2, 3], [0, 4], [4, 1], [4, 5], [5, 2], [5, 6], [6, 3], [0, 5]] as const) (top as THREE.Group).add(wire(P[a], P[b]));
        (top as THREE.Group).add(slabBase, step, sail);
      } else if (shape === 'gate') {
        // A block with a fan of pins rising to a peak (smart cities award)
        g.remove(stem); g.remove(foot);
        top = new THREE.Group();
        const slabBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.3), gold); slabBase.position.y = 0.06;
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.5, 0.2), gold); block.position.y = 0.37;
        (top as THREE.Group).add(slabBase, block);
        const N = 19;
        for (let i = 0; i < N; i++) {
          const u = (i / (N - 1)) * 2 - 1, x = u * 0.29, h = 0.42 + (1 - Math.abs(u)) * 0.5;
          const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 6), gold); pin.position.set(x, 0.12 + h / 2, Math.abs(u) < 0.5 ? -0.08 : 0);
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), gold); bead.position.set(x, 0.12 + h, pin.position.z);
          (top as THREE.Group).add(pin, bead);
        }
      } else if (shape === 'cup') {
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
    const white = new THREE.MeshPhysicalMaterial({ color: 0xbcc1c8, roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.18, envMap, envMapIntensity: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0b0d12, metalness: 0.6, roughness: 0.25, envMap, envMapIntensity: 0.8 });
    const lit = (hex: string, k = 1.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
    const logoTex = new THREE.TextureLoader().load('/brand/dhofar-municipality-logo.png'); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 4;
    /** The object that stands in front of a station. Built about 2–3 m tall, standing on y = 0 */
    const landmark = (kind: JourneyModel['kind'], color: string) => {
      const g = new THREE.Group();
      if (kind === 'robot') {
        // Cruzr service robot: bell-shaped white body on a chrome-banded base, round head with a black
        // visor and chevron eyes, a sensor window on the chest, jointed arms hung from the head rings
        const P = (pts: number[][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));
        const visorMat = new THREE.MeshPhysicalMaterial({ color: 0x030405, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.15, envMap, envMapIntensity: 0.35 });
        const band = new THREE.MeshStandardMaterial({ color: 0xc4c9cf, metalness: 1, roughness: 0.2, envMap, envMapIntensity: 0.8 });
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.41, 0.07, 48), dark); foot.position.y = 0.035;
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.408, 0.408, 0.07, 48), band); ring.position.y = 0.105;
        const body = new THREE.Mesh(new THREE.LatheGeometry(P([[0.4, 0.14], [0.402, 0.24], [0.39, 0.5], [0.36, 0.82], [0.325, 1.04], [0.3, 1.13], [0.27, 1.18], [0.2, 1.205], [0, 1.21]]), 56), white);
        const groove = new THREE.Mesh(new THREE.TorusGeometry(0.401, 0.006, 6, 56), dark); groove.rotation.x = Math.PI / 2; groove.position.y = 0.27;
        const lid = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.008, 6, 48), dark); lid.rotation.x = Math.PI / 2; lid.position.y = 1.185;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.12, 28), dark); neck.position.y = 1.26;
        const sensor = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2, 6, 16), visorMat); sensor.rotation.z = Math.PI / 2; sensor.scale.z = 0.35; sensor.position.set(0, 0.93, 0.338);
        const lens = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), band); lens.position.set(-0.05, 0.93, 0.353);
        const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.151), new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.5 })); badge.position.set(0, 0.7, 0.377); badge.rotation.x = -0.08;
        const HY = 1.63, HR = 0.335;
        const head = new THREE.Mesh(new THREE.SphereGeometry(HR, 44, 32), white); head.scale.set(1.05, 0.95, 0.98); head.position.y = HY;
        const visor = new THREE.Mesh(new THREE.SphereGeometry(HR + 0.014, 44, 18, 0, Math.PI * 2, 0, 0.84), visorMat); visor.rotation.x = Math.PI / 2 - 0.08; visor.scale.set(1.05, 0.95, 0.98); visor.position.y = HY;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(HR * Math.sin(0.84) + 0.004, 0.012, 8, 56), band); rim.scale.set(1.05, 0.95, 1); rim.position.set(0, HY + 0.018, HR * Math.cos(0.84) * 0.98); rim.rotation.x = -0.08;
        const ec = document.createElement('canvas'); ec.width = 256; ec.height = 128;
        { const x = ec.getContext('2d')!; x.strokeStyle = '#eef2f5'; x.lineWidth = 15; x.lineCap = 'round'; x.lineJoin = 'round';
          x.beginPath(); x.moveTo(52, 34); x.lineTo(88, 64); x.lineTo(52, 94); x.moveTo(204, 34); x.lineTo(168, 64); x.lineTo(204, 94); x.stroke();
          x.fillStyle = '#2b3036'; x.beginPath(); x.arc(128, 64, 17, 0, Math.PI * 2); x.fill(); x.fillStyle = '#11151a'; x.beginPath(); x.arc(128, 64, 9, 0, Math.PI * 2); x.fill(); }
        const eyeTex = new THREE.CanvasTexture(ec); eyeTex.colorSpace = THREE.SRGBColorSpace;
        const eyes = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.125), new THREE.MeshBasicMaterial({ map: eyeTex, transparent: true, color: 0xbfc4c9 })); eyes.position.set(0, HY + 0.035, HR * 0.98 + 0.016); eyes.rotation.x = -0.08;
        const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.034, 14, 10), visorMat); mouth.scale.set(1.5, 0.7, 0.5); mouth.position.set(0, HY - 0.215, 0.252);
        const headG = new THREE.Group(); headG.add(head, visor, rim, eyes, mouth); g.userData.head = headG;
        g.add(foot, ring, body, groove, lid, neck, sensor, lens, badge, headG);
        for (const sx of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.03, 12, 36), band); ear.rotation.y = Math.PI / 2; ear.position.set(sx * 0.345, HY - 0.03, 0);
          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 28), dark); hub.rotation.z = Math.PI / 2; hub.position.set(sx * 0.35, HY - 0.03, 0);
          const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.078, 18, 14), white); shoulder.position.set(sx * 0.42, HY - 0.05, 0);
          const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 6, 14), white); upper.position.set(sx * 0.47, 1.36, 0.01); upper.rotation.z = sx * 0.2;
          const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.054, 14, 12), band); elbow.position.set(sx * 0.51, 1.15, 0.02);
          // The left arm is held out in welcome, the right hangs by the body
          const out = sx < 0;
          const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.26, 6, 14), white); fore.position.set(sx * 0.52, out ? 1.08 : 0.95, out ? 0.17 : 0.07); fore.rotation.x = out ? -1.2 : -0.3;
          const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 12), white); hand.scale.set(0.55, 1.25, 1); hand.position.set(sx * 0.52, out ? 1.01 : 0.76, out ? 0.37 : 0.13); hand.rotation.x = out ? -1.2 : -0.3;
          headG.add(ear, hub);
          if (out) { const wv = new THREE.Group(); wv.position.copy(elbow.position); fore.position.sub(elbow.position); hand.position.sub(elbow.position); wv.add(fore, hand); g.userData.wave = wv; g.add(shoulder, upper, elbow, wv); }
          else g.add(shoulder, upper, elbow, fore, hand);
        }
        g.scale.setScalar(1.25);
      } else if (kind === 'burj') {
        // Burj Al Nahdha, loaded from the supplied model and stood on the plinth
        new OBJLoader().load('/models/burj.obj', obj => {
          // Translucent green glass, with the lit parts a brighter green
          const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x22c4cc, emissive: 0x0b9aa2, emissiveIntensity: 0.1, roughness: 0.06, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.1, envMap, envMapIntensity: 0.7, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
          const warm = glassMat;
          const pick = (x: THREE.Material) => (/glass/i.test(x.name) ? glassMat : warm);
          obj.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) m.material = Array.isArray(m.material) ? m.material.map(pick) : pick(m.material); });
          const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), k = 3.3 / size.y;
          obj.scale.setScalar(k); obj.position.set(-(box.min.x + size.x / 2) * k, -box.min.y * k, -(box.min.z + size.z / 2) * k);
          // Fine edge lines keep the shape readable through the glass
          const edgeMat = new THREE.LineBasicMaterial({ color: AQUA, transparent: true, opacity: 0.6 });
          const meshes: THREE.Mesh[] = []; obj.traverse(o => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });
          for (const m of meshes) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edgeMat));
          g.add(obj);
        });
      } else if (kind === 'cloud') {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.5), dark); rack.position.y = 0.65; g.add(rack);
        for (let i = 0; i < 6; i++) { const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.02), lit(i % 2 ? color : '#59e6c8', 1.4)); led.position.set(0, 0.2 + i * 0.19, 0.255); g.add(led); }
        const cloud = new THREE.Group();
        for (const [x, y, r] of [[-0.42, 0, 0.3], [0, 0.14, 0.42], [0.44, 0, 0.32], [0.05, -0.1, 0.34]]) { const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), white); puff.position.set(x, y, 0); cloud.add(puff); }
        cloud.position.y = 2.25; g.add(cloud); movers.push({ o: cloud, bob: 0.08, y0: 2.25, phase: 1 });
        const link = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), lit(color, 1.4)); link.position.y = 1.62; g.add(link);
      } else if (kind === 'qr') {
        const c = document.createElement('canvas'); c.width = c.height = 290;
        const x = c.getContext('2d')!; x.fillStyle = '#fff'; x.fillRect(0, 0, 290, 290); x.fillStyle = '#0b1020';
        const r = rng(42);
        for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) {
          const fi = (a: number, b: number) => a < 7 && b < 7, finder = fi(i, j) || fi(24 - i, j) || fi(i, 24 - j);
          const u = Math.min(i, 24 - i) % 24, v = Math.min(j, 24 - j) % 24, ring = finder && (u === 0 || u === 6 || v === 0 || v === 6 || (u > 1 && u < 5 && v > 1 && v < 5));
          if (finder ? ring : r() > 0.52) x.fillRect(20 + i * 10, 20 + j * 10, 10, 10);
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); cube.position.y = 1.5; cube.rotation.z = 0.2;
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.9, 10), dark); stand.position.y = 0.45;
        g.add(cube, stand); movers.push({ o: cube, spin: 0.4, y0: 1.5, phase: 0 });
      } else if (kind === 'palm') {
        const bark = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 }), frondMat = new THREE.MeshStandardMaterial({ color: 0x2f7a3b, roughness: 0.8, side: THREE.DoubleSide });
        for (let i = 0; i < 9; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.1 - i * 0.004, 0.12 - i * 0.004, 0.34, 10), bark); seg.position.set(Math.sin(i * 0.22) * 0.18, 0.17 + i * 0.31, 0); seg.rotation.z = -Math.cos(i * 0.22) * 0.12; g.add(seg); }
        const crown = new THREE.Vector3(Math.sin(8 * 0.22) * 0.18 + 0.04, 2.92, 0);
        for (let i = 0; i < 10; i++) {
          const fr = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.5, 4), frondMat); fr.scale.set(1, 1, 0.12);
          const hold = new THREE.Group(); fr.position.y = 0.75; hold.add(fr); hold.position.copy(crown); hold.rotation.set(0, (i / 10) * Math.PI * 2, 0); hold.rotateZ(1.05 + (i % 2) * 0.35); g.add(hold);
        }
        for (let i = 0; i < 4; i++) { const nut = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a2c, roughness: 0.7 })); nut.position.set(crown.x + Math.cos(i * 1.6) * 0.14, crown.y - 0.12, Math.sin(i * 1.6) * 0.14); g.add(nut); }
      } else if (kind === 'vr') {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.2, 10), dark); stand.position.y = 0.6;
        const headForm = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 22), white); headForm.scale.set(0.9, 1.1, 1); headForm.position.y = 1.55;
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.3), dark); visor.position.set(0, 1.62, 0.26);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 40), dark); strap.rotation.x = Math.PI / 2; strap.position.y = 1.62;
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.08), lit(color, 1.6)); lens.position.set(0, 1.62, 0.412);
        g.add(stand, headForm, visor, strap, lens);
      } else {
        // A small smart-city skyline for the 2040 vision
        const tower = new THREE.MeshStandardMaterial({ color: 0x16223d, metalness: 0.6, roughness: 0.3, envMap, envMapIntensity: 0.8 });
        ([[-0.55, 1.5, 0.1], [-0.15, 2.5, -0.1], [0.3, 1.9, 0.15], [0.62, 1.2, -0.15], [-0.4, 0.9, -0.45], [0.1, 1.3, 0.5], [0.5, 0.8, 0.5]] as const).forEach(([x, h, z], i) => {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, h, 0.32), tower); b.position.set(x, h / 2, z); g.add(b);
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.34), lit(i % 2 ? color : '#59e6c8', 1.4)); cap.position.set(x, h + 0.015, z); g.add(cap);
          for (let y = 0.25; y < h - 0.1; y += 0.3) { const band = new THREE.Mesh(new THREE.BoxGeometry(0.325, 0.02, 0.325), lit('#ffd9a0', 1.1)); band.position.set(x, y, z); g.add(band); }
        });
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.012, 6, 64), lit(color, 1.5)); orbit.rotation.x = Math.PI / 2.4; orbit.position.y = 1.5; g.add(orbit);
        movers.push({ o: orbit, spin: 0.5, y0: 1.5, phase: 0 });
      }
      return g;
    };
    /** Per station: the full panel (detail) and its small year sign; k eases 0 → 1 as the station comes into focus */
    const focusables: { group: THREE.Group; y: number; detail: THREE.Group; sign: THREE.Group; k: number; reveal: number; redraw: (reveal: number) => void }[] = [];
    const addPanel = (s: JourneyStage, pos: THREE.Vector3, face: THREE.Vector3) => {
      const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 1000;
      const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const group = new THREE.Group(); group.position.copy(pos);
      const detail = new THREE.Group(); group.add(detail);
      const plane = new THREE.Mesh(bend(PANEL_W, PANEL_H, 8.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: new THREE.Color(0.92, 0.92, 0.92), side: THREE.DoubleSide }));
      detail.add(plane);
      // A slim post under the panel
      const frameMat = neon(s.color, 2), hw = PANEL_W / 2, hh = PANEL_H / 2;
      for (const sy of [-1, 1]) { const rail = new THREE.Mesh(bend(PANEL_W - 0.6, 0.035, 8.5), frameMat); rail.position.set(0, sy * (hh + 0.03), 0.012); detail.add(rail); }
      const beamG = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, pos.y - hh, 8), frameMat); beamG.position.set(0, -(pos.y - hh) / 2 - hh, -0.2); detail.add(beamG);
      const base = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 48), frameMat); base.rotation.x = Math.PI / 2; base.position.set(0, -pos.y + 0.03, -0.2); detail.add(base);

      // The year's figures as two raised cards on the lower edge
      if (s.visits && s.transactions) {
        const note = s.statsNoteAr && isAr ? ` (${s.statsNoteAr})` : '';
        const stats: [number, string][] = [[s.visits, (isAr ? 'زيارة للبوابة' : 'portal visits') + note], [s.transactions, isAr ? 'معاملة رقمية' : 'digital transactions']];
        stats.forEach(([v, label], k) => {
          const card = raised(2.85, 1.3, 760, 346);
          card.group.position.set((isAr ? 1 : -1) * (k ? -1.52 : 1.52), -hh - 0.05, 0.68); card.group.rotation.y = (isAr ? 1 : -1) * (k ? 1 : -1) * 0.18;
          detail.add(card.group);
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
        detail.add(m, name);
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

      // Headline figures of the stage: a column of raised cards on the other side
      const highlights = s.highlights || [];
      highlights.forEach((hl, k) => {
        const card = raised(2.5, 1.02, 640, 262);
        card.group.position.set(hw + 1.5, 1.7 - k * 1.14, 0.45); card.group.rotation.y = -0.28;
        detail.add(card.group);
        labels.push(() => { drawFigure(card.canvas, isAr ? hl.value : hl.valueEn, isAr ? hl.ar : hl.en, s.color, isAr); card.tex.needsUpdate = true; });
      });
      // A landmark of the stage on a low plinth, in front of the card and to its side
      if (s.model) {
        const mx = -(hw + 1.05), floor = -pos.y, mz = 1.9;
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.92, 0.3, 36), new THREE.MeshStandardMaterial({ color: 0x141b2e, metalness: 0.6, roughness: 0.35, envMap, envMapIntensity: 0.5 }));
        plinth.position.set(mx, floor + 0.15, mz);
        const model = landmark(s.model.kind, s.color); model.position.set(mx, floor + 0.3, mz); model.rotation.y = 0.35;
        const tag = caption(1.5, 0.36, [isAr ? s.model.ar : s.model.en], s.color); tag.position.set(mx, floor + 0.16, mz + 0.95); tag.rotation.x = -0.5;
        const lamp = new THREE.SpotLight(0xfff1dc, 26, 9, 0.6, 0.6, 1.4); lamp.position.set(mx + 0.6, floor + 5, mz + 2.2); lamp.target.position.set(mx, floor + 1.4, mz);
        group.add(plinth, model, tag, lamp, lamp.target);
      }

      // The year on a small sign, shown while the visitor is elsewhere
      const sign = new THREE.Group();
      const signFace = caption(1.7, 0.8, [s.year], s.color); signFace.position.y = 2.5 - pos.y;
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1, 8), frameMat); signPost.position.y = 1.05 - pos.y;
      sign.add(signFace, signPost); group.add(sign);
      focusables.push({ group, y: pos.y, detail, sign, k: 0, reveal: reducedMotion ? 1 : 0, redraw: r => { drawStage(canvas, s, isAr, r); tex.needsUpdate = true; } });

      const dir = face.clone().sub(pos); dir.y = 0; dir.normalize();
      group.rotation.y = Math.atan2(dir.x, dir.z);
      scene.add(group);
      panelTex.push({ canvas, tex, stage: s });
      // Step back far enough to take in the medallions above and the cards or trophies below
      const top = pos.y + hh + (logos.length ? 1.5 : 0.2), low = awards.length || s.model ? 0.2 : pos.y - hh - (s.visits ? 0.8 : 0.2);
      const mid = (top + low) / 2, dist = Math.max(7.2, ((top - low) / 2) / Math.tan(THREE.MathUtils.degToRad(29)) + (awards.length ? 2.2 : 1.0));
      // With a landmark beside the card the view shifts toward it and steps back a little
      const side = new THREE.Vector3(dir.z, 0, -dir.x).multiplyScalar(s.model && !highlights.length ? -0.75 : highlights.length && !s.model ? 0.75 : 0);
      const cam = pos.clone().add(dir.clone().multiplyScalar((dist + (s.model ? 1.4 : 0) + (highlights.length ? 1.6 : 0)) * 1.14)).add(side); cam.y = Math.max(1.9, mid - 0.4);
      return { cam, target: pos.clone().add(side).setY(mid) };
    };
    {
      const ARC = { x: 0, z: 31, r: 25 }, cards = [...years, ...extras], step = Math.min(0.315, 2.25 / Math.max(1, cards.length - 1));
      cards.forEach((s, i) => {
        const a = (i - (cards.length - 1) / 2) * step * (isAr ? -1 : 1);
        const p = new THREE.Vector3(ARC.x + Math.sin(a) * ARC.r, 3.9, ARC.z - Math.cos(a) * ARC.r);
        stations.push(addPanel(s, p, new THREE.Vector3(ARC.x, 3, ARC.z)));
      });
      // A lit arc on the floor ties the cards together
      const arcLine = new THREE.Mesh(new THREE.RingGeometry(ARC.r - 2.3, ARC.r - 2.12, 96, 1, Math.PI / 2 - 1.28, 2.56), neon(AQUA, 2)); arcLine.rotation.x = -Math.PI / 2; arcLine.position.set(ARC.x, 0.03, ARC.z); scene.add(arcLine);
    }
    // Live board in front of the portal
    const BW = 17.4, BH = 8.6, BY = 15.2, BZ = FZ + 5, AWY = BY - BH / 2 - 1.75;
    const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1800; boardCanvas.height = Math.round((1800 * BH) / BW);
    const boardTex = new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 4;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, toneMapped: false, color: new THREE.Color(0.92, 0.92, 0.92) }));
    board.position.set(0, BY, BZ); scene.add(board);
    // The awards float in a row under the figures
    {
      const list = [...years, ...extras].flatMap(st => st.awards || []);
      list.forEach((aw, k) => {
        const x = ((list.length - 1) / 2 - k) * 2.6 * (isAr ? 1 : -1);
        const cup = trophy(aw.shape); cup.scale.setScalar(1.45); cup.position.set(x, AWY, BZ + 1.4);
        const plate = caption(2.1, 0.62, [aw.year, isAr ? aw.ar : aw.en], WARM, true); plate.position.set(x, AWY - 0.55, BZ + 1.5);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 6, 48), neon(WARM, 2)); halo.rotation.x = Math.PI / 2; halo.position.set(x, AWY - 0.13, BZ + 1.4);
        scene.add(cup, plate, halo);
        movers.push({ o: cup, spin: 0.3, bob: 0.1, y0: AWY, phase: k * 0.8 });
      });
      const glow = new THREE.SpotLight(0xffe2a8, 40, 18, 1.0, 0.7, 1.3); glow.position.set(0, AWY - 5, BZ + 6); glow.target.position.set(0, AWY + 0.4, BZ + 1.4); scene.add(glow, glow.target);
    }
    // Six figures as cards standing proud of the board
    const figureCards = Array.from({ length: 6 }, (_, i) => {
      const card = raised(5.3, 2.75, 1000, 520, 0.3);
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
        drawFigure(card.canvas, f.value === null ? '—' : fmt(Math.round(f.value * e), isAr), isAr ? f.labelAr : f.labelEn, f.color, isAr);
        card.tex.needsUpdate = true;
      });
    };
    // The municipality logo, raised on a plaque over the board
    const plaque = raised(5.2, 3.0, 780, 450, 0.3);
    plaque.group.position.set(0, BY + BH / 2 + 1.9, BZ + 0.1); scene.add(plaque.group);
    { const g = plaque.canvas.getContext('2d')!; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 780, 450); plaque.tex.needsUpdate = true; }
    const logoImg = new Image();
    logoImg.onload = () => {
      const g = plaque.canvas.getContext('2d')!; const k = Math.min(680 / logoImg.width, 370 / logoImg.height), w = logoImg.width * k, h = logoImg.height * k;
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 780, 450); g.drawImage(logoImg, (780 - w) / 2, (450 - h) / 2, w, h); plaque.tex.needsUpdate = true;
    };
    logoImg.src = '/brand/dhofar-municipality-logo.png';
    const boardView: Station = { cam: new THREE.Vector3(0, 9, 8), target: new THREE.Vector3(0, BY - 1.6, BZ) };
    stations.push(boardView);
    // The journey opens on the board too, reached by a fly-in (see the intro below)
    stations[0] = { cam: new THREE.Vector3(0, 5, EZ - 2.5), target: new THREE.Vector3(0, 3.4, 27), exact: true };

    {
      const cr = rng(2040);
      // Lit-window textures in three tints
      const windows = ['#7ff5f2', '#ffd9a0', '#bda8ff'].map(hue => {
        const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d')!;
        x.fillStyle = '#000'; x.fillRect(0, 0, 64, 256); x.fillStyle = hue;
        for (let r = 0; r < 40; r++) for (let col = 0; col < 8; col++) if (cr() > 0.5) { x.globalAlpha = 0.35 + cr() * 0.65; x.fillRect(col * 8 + 1.5, r * 6.4 + 1.5, 5, 3.4); }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      });
      const towerMats = windows.map(w => new THREE.MeshStandardMaterial({ color: 0x0a1122, metalness: 0.9, roughness: 0.22, envMap, envMapIntensity: 1, emissive: 0xffffff, emissiveMap: w, emissiveIntensity: 1.2 }));
      for (let i = 0; i < 96; i++) {
        const a = cr() * Math.PI * 2, r = 150 + cr() * 190, x = Math.cos(a) * r, z = 10 + Math.sin(a) * r;
        const h = 24 + cr() * cr() * 130, w = 9 + cr() * 15, round = cr() > 0.7, twist = cr() * 3, crown = cr();
        // The avenue in front of the entrance stays open
        if (Math.abs(x) < 50 && z > 40) continue;
        // Nor is anything built on the Burj Al Nahdha roundabout
        if (Math.hypot(x + 124, z + 103) < 52) continue;
        const tower = new THREE.Mesh(round ? new THREE.CylinderGeometry(w / 2, (w / 2) * (0.72 + cr() * 0.28), h, 20) : new THREE.BoxGeometry(w, h, 9 + cr() * 14), towerMats[i % 3]);
        tower.position.set(x, h / 2, z); tower.rotation.y = twist; scene.add(tower);
        if (crown > 0.45) { const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 8 + crown * 22, 6), neon(i % 2 ? AQUA : PURPLE, 3)); spire.position.set(x, h + 4 + crown * 11, z); scene.add(spire); }
        if (crown > 0.82) { const halo = new THREE.Mesh(new THREE.TorusGeometry(w * 0.85, 0.22, 6, 48), neon(AQUA, 3)); halo.rotation.x = Math.PI / 2; halo.position.set(x, h * 0.72, z); scene.add(halo); }
      }
      // The jebel behind the city, the wider ground and its light grid
      const rock = new THREE.MeshBasicMaterial({ color: 0x060914 });
      for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2, hgt = 34 + cr() * 46; const hill = new THREE.Mesh(new THREE.ConeGeometry(70 + cr() * 50, hgt, 7), rock); hill.position.set(Math.cos(a) * 430, hgt / 2 - 2, 10 + Math.sin(a) * 430); scene.add(hill); }
      const outer = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500), new THREE.MeshStandardMaterial({ color: 0x05080f, metalness: 0.6, roughness: 0.4 }));
      outer.rotation.x = -Math.PI / 2; outer.position.y = -0.06; scene.add(outer);
      const grid = new THREE.GridHelper(1500, 150, 0x1f7f88, 0x103845); grid.position.y = -0.03;
      (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.5; scene.add(grid);
      // Light beams over the skyline and slow air traffic
      for (let i = 0; i < 7; i++) {
        const a = cr() * Math.PI * 2, r = 170 + cr() * 120;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 0.5, 300, 14, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x6fd3cf : 0xb3a4dc, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        beam.position.set(Math.cos(a) * r, 150, 10 + Math.sin(a) * r); beam.rotation.set((cr() - 0.5) * 0.35, 0, (cr() - 0.5) * 0.35); scene.add(beam);
      }
      for (let i = 0; i < 16; i++) {
        const craft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.7), lit(i % 3 ? '#7ff5f2' : '#ffd9a0', 2)); scene.add(craft);
        fliers.push({ o: craft, r: 110 + cr() * 190, h: 34 + cr() * 60, sp: (0.03 + cr() * 0.05) * (i % 2 ? 1 : -1), ph: cr() * 6.28 });
      }

      // Two reception robots at the foot of the steps
      for (const sx of [-1, 1]) {
        const bot = landmark('robot', AQUA); bot.scale.setScalar(0.92); bot.position.set(sx * 7.6, 0, EZ + D + 6.5); bot.rotation.y = -sx * 0.35; scene.add(bot);
        const hello = caption(2.2, 0.5, [isAr ? 'مرحباً بك' : 'Welcome'], AQUA); hello.scale.setScalar(0.7); hello.position.set(sx * 7.6, 2.75, EZ + D + 6.5); hello.rotation.y = -sx * 0.35; scene.add(hello);
        const key = new THREE.SpotLight(0xfff1dc, 18, 16, 0.5, 0.6, 1.4); key.position.set(sx * 9, 7.5, EZ + D + 12); key.target.position.set(sx * 7.6, 1.6, EZ + D + 6.5); scene.add(key, key.target);
        bots.push({ o: bot, cap: hello, x0: sx * 7.6, z0: EZ + D + 6.5, sx });
      }

      // The municipality logo drawn in the air by lasers: stacked light layers give it depth
      const holder = new THREE.Group(); holder.position.set(-19, 0, EZ + D + 17); holder.rotation.y = 0.42; scene.add(holder);
      const lc = document.createElement('canvas'); lc.width = 654; lc.height = 396;
      const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace; lt.anisotropy = 4;
      const li = new Image();
      li.onload = () => { const x = lc.getContext('2d')!; x.drawImage(li, 0, 0, 654, 396); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#c9fffb'; x.fillRect(0, 0, 654, 396); lt.needsUpdate = true; };
      li.src = '/brand/dhofar-municipality-logo.png';
      const LW = 9, LH = LW * 396 / 654, LY = 5.2;
      for (let k = 0; k < 9; k++) {
        const layer = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), new THREE.MeshBasicMaterial({ map: lt, color: new THREE.Color(AQUA).multiplyScalar(k === 8 ? 1.9 : 1.1), transparent: true, opacity: k === 8 ? 1 : 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
        layer.position.set(0, LY, (k - 8) * 0.07); holder.add(layer);
      }
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.5, 44), dark); base.position.y = 0.25; holder.add(base);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.04, 6, 64), neon(AQUA, 3)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.52; holder.add(rim);
      const laser = new THREE.MeshBasicMaterial({ color: new THREE.Color(AQUA).multiplyScalar(2), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const from = [[-1.9, 0.7, 1.2], [1.9, 0.7, 1.2], [-1.9, 0.7, -1.2], [1.9, 0.7, -1.2]], to = [[-LW / 2, LY - LH / 2], [LW / 2, LY - LH / 2], [-LW / 2, LY + LH / 2], [LW / 2, LY + LH / 2], [0, LY + LH / 2], [0, LY - LH / 2]];
      from.forEach((f, i) => [to[i], to[4 + (i % 2)]].forEach(tp => {
        const a = new THREE.Vector3(f[0], f[1], f[2]), b = new THREE.Vector3(tp[0], tp[1], 0), ray = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, a.distanceTo(b), 5), laser);
        ray.position.copy(a).add(b).multiplyScalar(0.5); ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); holder.add(ray);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), chrome); head.position.copy(a); holder.add(head);
      }));
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(LW + 0.4, 0.05), laser); scan.position.set(0, LY, 0.03); holder.add(scan);
      movers.push({ o: scan, bob: LH / 2, y0: LY, phase: 0 });
    }
    {
      const gr = rng(77), gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d')!;
      gx.fillStyle = '#24512c'; gx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 5200; i++) { gx.fillStyle = `rgba(${30 + gr() * 50 | 0}, ${80 + gr() * 80 | 0}, ${30 + gr() * 40 | 0}, 0.55)`; gx.fillRect(gr() * 256, gr() * 256, 1.4, 2.6); }
      const grassTex = new THREE.CanvasTexture(gc); grassTex.colorSpace = THREE.SRGBColorSpace; grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
      const lawn = (x0: number, x1: number, z0: number, z1: number) => {
        const t = grassTex.clone(); t.repeat.set((x1 - x0) / 9, (z1 - z0) / 9); t.needsUpdate = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: t, roughness: 1, color: 0x9fb89a }));
        m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.09, (z0 + z1) / 2); scene.add(m);
        const kerb = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.3, 0.16, z1 - z0 + 0.3), marble); kerb.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(kerb);
      };
      const OUT = W / 2 + 10, F0 = EZ + D;
      // Lawns either side of the avenue, down both sides and behind, with a paved walk kept round the building
      // Small lawns either side of the avenue; the garden proper is the crescent drawn further down
      const lawns: [number, number, number, number][] = [[-50, -17, F0 + 5, F0 + 62], [17, 50, F0 + 5, F0 + 62]];
      for (const l of lawns) lawn(...l);
      const leaf = [0x1f5a2e, 0x2a6b35, 0x1a4d2a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }));
      const bark = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.9 });
      const crown = new THREE.IcosahedronGeometry(1, 1), trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1, 8);
      const lampHead = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(1.5), toneMapped: false });
      const petals = ['#ff8fb0', '#ffd36a', '#c9a6ff', '#ffffff'].map(c => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(0.55) }));
      const free = (x: number, z: number) => !(Math.hypot(x + 19, z - (F0 + 17)) < 6 || (x < -OUT - 5 && x > -OUT - 20 && z > -6 && z < 18));
      for (const [x0, x1, z0, z1] of lawns) {
        const area = (x1 - x0) * (z1 - z0);
        // Trees
        for (let i = 0; i < area / 520; i++) {
          const x = x0 + 4 + gr() * (x1 - x0 - 8), z = z0 + 4 + gr() * (z1 - z0 - 8), h = 3.4 + gr() * 3.2; if (!free(x, z)) continue;
          const trunk = new THREE.Mesh(trunkGeo, bark); trunk.scale.set(1, h, 1); trunk.position.set(x, h / 2, z); scene.add(trunk);
          for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(crown, leaf[(i + k) % 3]); const r = 1.5 + gr() * 1.3; c.scale.set(r, r * 0.85, r); c.position.set(x + (gr() - 0.5) * 1.6, h + r * 0.45 + k * 0.5, z + (gr() - 0.5) * 1.6); c.rotation.y = gr() * 6; scene.add(c); }
        }
        // Flower beds
        for (let i = 0; i < area / 1500; i++) {
          const x = x0 + 5 + gr() * (x1 - x0 - 10), z = z0 + 5 + gr() * (z1 - z0 - 10), r = 1.6 + gr() * 1.4; if (!free(x, z)) continue;
          const bed = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.1, 0.3, 24), marble); bed.position.set(x, 0.15, z); scene.add(bed);
          const soil = new THREE.Mesh(new THREE.CircleGeometry(r - 0.12, 24), leaf[2]); soil.rotation.x = -Math.PI / 2; soil.position.set(x, 0.31, z); scene.add(soil);
          for (let k = 0; k < 26; k++) { const a = gr() * 6.28, d = Math.sqrt(gr()) * (r - 0.3); const f = new THREE.Mesh(new THREE.SphereGeometry(0.11 + gr() * 0.07, 6, 5), petals[(i + k) % 4]); f.position.set(x + Math.cos(a) * d, 0.42 + gr() * 0.2, z + Math.sin(a) * d); scene.add(f); }
        }
        // Low lights along the lawn edges
        for (let z = z0 + 3; z < z1; z += 11) for (const x of [x0 + 0.6, x1 - 0.6]) {
          if (Math.abs(x) > 104) continue;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 8), cladding); post.position.set(x, 0.4, z);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lampHead); head.position.set(x, 0.86, z); scene.add(post, head);
        }
      }
      // The garden as the site plan draws it: a crescent that wraps the north side of the building (the visitor's left)
      // round to the back, with a lattice of paths at its front end, curved terraces at the back, and paths fanning out
      // from a small plaza with an obelisk
      {
        const X0 = -100, Z0 = -84, GW = 108, GD = 164, S = 12, rad = THREE.MathUtils.degToRad;
        const pc = document.createElement('canvas'); pc.width = GW * S; pc.height = GD * S; const px = pc.getContext('2d')!;
        const cx = (x: number) => (x - X0) * S, cz = (z: number) => (z - Z0) * S;
        const CO = { x: -17, z: -1.1, r: 76.5 }, CI = { x: -8.5, z: 9.1, r: 58.7 }, A0 = rad(114), A1 = rad(262), FOC = { x: -66.3, z: -26.6 }, ZB = -22;
        const crescent = () => { px.beginPath(); px.arc(cx(CO.x), cz(CO.z), CO.r * S, A0, A1); px.arc(cx(CI.x), cz(CI.z), CI.r * S, A1, A0, true); px.closePath(); };
        px.save(); crescent(); px.clip();
        px.fillStyle = '#21502a'; px.fillRect(0, 0, pc.width, pc.height);
        for (let i = 0; i < 30000; i++) { px.fillStyle = `rgba(${30 + gr() * 50 | 0}, ${84 + gr() * 80 | 0}, ${30 + gr() * 40 | 0}, 0.5)`; px.fillRect(gr() * pc.width, gr() * pc.height, 2, 4); }
        px.strokeStyle = '#b9b0a2'; px.lineCap = 'round';
        // Front end: a lattice of crossing paths
        px.save(); px.beginPath(); px.rect(0, cz(ZB), pc.width, pc.height); px.clip(); px.lineWidth = 1.5 * S;
        for (let k = -6; k < 26; k++) for (const dir of [-1, 1]) { px.beginPath(); px.moveTo(k * 9 * S, cz(ZB)); px.lineTo(k * 9 * S + dir * 100 * S, cz(ZB) + 100 * S); px.stroke(); }
        px.restore();
        // Back end: curved terraces following the inner edge
        px.save(); px.beginPath(); px.rect(0, 0, pc.width, cz(ZB)); px.clip(); px.lineWidth = 2 * S;
        for (let r = CI.r + 7; r < CO.r + 30; r += 7) { px.beginPath(); px.arc(cx(CI.x), cz(CI.z), r * S, 0, Math.PI * 2); px.stroke(); }
        px.restore();
        // Paths fanning out from the plaza, and the plaza
        px.lineWidth = 1.8 * S;
        for (const a of [150, 178, 205, 232, 258, 282]) { px.beginPath(); px.moveTo(cx(FOC.x), cz(FOC.z)); px.lineTo(cx(FOC.x) + Math.cos(rad(a)) * 60 * S, cz(FOC.z) + Math.sin(rad(a)) * 60 * S); px.stroke(); }
        px.fillStyle = '#c6bdaf'; px.beginPath(); px.arc(cx(FOC.x), cz(FOC.z), 6.5 * S, 0, Math.PI * 2); px.fill();
        px.restore();
        px.strokeStyle = '#c6bdaf'; px.lineWidth = 1.6 * S; crescent(); px.stroke();
        // The building and the walk round it stay paved
        px.clearRect(cx(-60.5), cz(-46), 80 * S, 100 * S);
        const gt = new THREE.CanvasTexture(pc); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = 8;
        const park = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshStandardMaterial({ map: gt, alphaTest: 0.5, roughness: 1, color: 0xb6c2b2 }));
        park.rotation.x = -Math.PI / 2; park.position.set(X0 + GW / 2, 0.1, Z0 + GD / 2); scene.add(park);

        const inside = (x: number, z: number, m = 3) => {
          let a = Math.atan2(z - CO.z, x - CO.x); if (a < 0) a += Math.PI * 2;
          return Math.hypot(x - CO.x, z - CO.z) < CO.r - m && Math.hypot(x - CI.x, z - CI.z) > CI.r + m && a > A0 + 0.04 && a < A1 - 0.04 && !(x > -63 && z > -48 && z < 56);
        };
        let trees = 0, beds = 0;
        for (let i = 0; i < 700 && trees < 48; i++) {
          const x = -96 + gr() * 88, z = -80 + gr() * 152, h = 3.4 + gr() * 3.4;
          if (!inside(x, z) || !free(x, z) || Math.hypot(x - FOC.x, z - FOC.z) < 9) continue;
          trees++;
          const trunk = new THREE.Mesh(trunkGeo, bark); trunk.scale.set(1, h, 1); trunk.position.set(x, h / 2, z); scene.add(trunk);
          for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(crown, leaf[(i + k) % 3]); const r = 1.5 + gr() * 1.3; c.scale.set(r, r * 0.85, r); c.position.set(x + (gr() - 0.5) * 1.6, h + r * 0.45 + k * 0.5, z + (gr() - 0.5) * 1.6); c.rotation.y = gr() * 6; scene.add(c); }
        }
        for (let i = 0; i < 300 && beds < 9; i++) {
          const x = -96 + gr() * 88, z = -80 + gr() * 152, r = 1.6 + gr() * 1.3;
          if (!inside(x, z, 5) || !free(x, z) || Math.hypot(x - FOC.x, z - FOC.z) < 11) continue;
          beds++;
          const bed = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.1, 0.3, 24), marble); bed.position.set(x, 0.15, z); scene.add(bed);
          const soil = new THREE.Mesh(new THREE.CircleGeometry(r - 0.12, 24), leaf[2]); soil.rotation.x = -Math.PI / 2; soil.position.set(x, 0.31, z); scene.add(soil);
          for (let k = 0; k < 26; k++) { const a = gr() * 6.28, d = Math.sqrt(gr()) * (r - 0.3); const f = new THREE.Mesh(new THREE.SphereGeometry(0.11 + gr() * 0.07, 6, 5), petals[(i + k) % 4]); f.position.set(x + Math.cos(a) * d, 0.42 + gr() * 0.2, z + Math.sin(a) * d); scene.add(f); }
        }
        // The boundary: a low wall between posts, each post carrying a lamp, with palms along the street side
        {
          const RB = CO.r + 2.4, stepA = 0.072, pts: THREE.Vector3[] = [];
          for (let a = A0 + 0.03; a < A1 - 0.02; a += stepA) pts.push(new THREE.Vector3(CO.x + Math.cos(a) * RB, 0, CO.z + Math.sin(a) * RB));
          const postGeo = new THREE.BoxGeometry(0.55, 1.35, 0.55), capGeo = new THREE.BoxGeometry(0.7, 0.1, 0.7), lampGeo = new THREE.SphereGeometry(0.2, 12, 10);
          pts.forEach((p, i) => {
            const post = new THREE.Mesh(postGeo, marble); post.position.set(p.x, 0.675, p.z);
            const cap = new THREE.Mesh(capGeo, cladding); cap.position.set(p.x, 1.4, p.z);
            const lamp = new THREE.Mesh(lampGeo, lampHead); lamp.position.set(p.x, 1.66, p.z);
            post.rotation.y = cap.rotation.y = -Math.atan2(p.z - CO.z, p.x - CO.x); scene.add(post, cap, lamp);
            const q = pts[i + 1];
            if (q) {
              const len = p.distanceTo(q), wall = new THREE.Mesh(new THREE.BoxGeometry(len - 0.5, 0.75, 0.24), marble);
              wall.position.set((p.x + q.x) / 2, 0.375, (p.z + q.z) / 2); wall.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x); scene.add(wall);
            }
            if (i % 4 === 2) { const palm = landmark('palm', AQUA); palm.scale.setScalar(2.3 + (i % 3) * 0.2); palm.position.set(CO.x + (p.x - CO.x) * 1.045, 0, CO.z + (p.z - CO.z) * 1.045); palm.rotation.y = i; scene.add(palm); }
          });
        }
        // The tall landmark by the street: a slim pylon whose faces are stacked LED panels in the municipality's blues
        {
          const PYH = 31, pylon = new THREE.Group(); pylon.position.set(FOC.x, 0, FOC.z); pylon.rotation.y = 0.85; scene.add(pylon);
          const core = new THREE.Mesh(new THREE.BoxGeometry(2.7, PYH, 1.1), new THREE.MeshStandardMaterial({ color: 0x0c1018, metalness: 0.7, roughness: 0.35 })); core.position.y = PYH / 2; pylon.add(core);
          const lc2 = document.createElement('canvas'); lc2.width = 128; lc2.height = 192; const lx = lc2.getContext('2d')!;
          const lg = lx.createLinearGradient(0, 0, 0, 192); lg.addColorStop(0, '#8fe9ff'); lg.addColorStop(0.5, '#35b6f0'); lg.addColorStop(1, '#1f7fd6'); lx.fillStyle = lg; lx.fillRect(0, 0, 128, 192);
          lx.fillStyle = 'rgba(255,255,255,0.22)'; for (let i = 0; i < 40; i++) lx.fillRect(gr() * 128, gr() * 192, 6 + gr() * 26, 3 + gr() * 10);
          lx.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 128; i += 4) lx.fillRect(i, 0, 1, 192); for (let j = 0; j < 192; j += 4) lx.fillRect(0, j, 128, 1);
          const lt2 = new THREE.CanvasTexture(lc2); lt2.colorSpace = THREE.SRGBColorSpace;
          const panelMat = new THREE.MeshBasicMaterial({ map: lt2, toneMapped: false, color: new THREE.Color(0.95, 0.95, 0.95) });
          for (let k = 0; k < 8; k++) for (const sz of [-1, 1]) { const pnl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2), panelMat); pnl.position.set(0, 3.2 + k * 3.45, sz * 0.56); if (sz < 0) pnl.rotation.y = Math.PI; pylon.add(pnl); }
          const plinthO = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 2), marble); plinthO.position.y = 0.25; pylon.add(plinthO);
          const collar = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.05, 6, 56), neon(AQUA, 2.2)); collar.rotation.x = Math.PI / 2; collar.position.y = 0.16; pylon.add(collar);
          const glowO = new THREE.PointLight(0x6fd0ff, 40, 30, 1.5); glowO.position.set(FOC.x + 3, 6, FOC.z + 3); scene.add(glowO);
        }

        // The two streets that meet at the roundabout: Airport Street along the back of the site, Al Rubat Street along the north
        const asphalt = new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 0.6, metalness: 0.2 });
        const street = (x0: number, z0: number, x1: number, z1: number, w: number) => {
          const len = Math.hypot(x1 - x0, z1 - z0), g = new THREE.Group(); g.position.set((x0 + x1) / 2, 0.05, (z0 + z1) / 2); g.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(g);
          const bed = new THREE.Mesh(new THREE.PlaneGeometry(len, w), asphalt); bed.rotation.x = -Math.PI / 2; g.add(bed);
          for (const sz of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.12), neon(WARM, 1.6)); k.position.set(0, 0.03, sz * w / 2); g.add(k); }
          for (let u = -len / 2 + 3; u < len / 2 - 3; u += 7) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.22), lampHead); d.rotation.x = -Math.PI / 2; d.position.set(u, 0.02, 0); g.add(d); }
        };
        street(-100, -87, 104, -87, 9);
        street(-113, -78, -113, 96, 10);
      }
      // Clipped hedges lining the avenue
      const hedge = new THREE.MeshStandardMaterial({ color: 0x1d5a2c, roughness: 1 });
      for (const sx of [-1, 1]) for (let z = F0 + 24; z < F0 + 58; z += 12) { const h = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 9), hedge); h.position.set(sx * 18.4, 0.55, z + 4.5); scene.add(h); }
      for (const [px, pz, k] of [[-34, 30, 2.6], [34, 30, 2.6], [-48, 52, 2.2], [48, 52, 2.2], [-30, 74, 2.4], [30, 74, 2.4], [-70, 20, 2.3], [70, 20, 2.3]] as const) {
        const palm = landmark('palm', AQUA); palm.scale.setScalar(k); palm.position.set(px, 0, F0 + pz); palm.rotation.y = px; scene.add(palm);
      }
    }
    for (const [px, pz, k] of [[-15, 9, 2.3], [15, 9, 2.3], [-27, 6, 2.0], [27, 6, 2.0], [-21, 16, 1.8], [21, 16, 1.8]] as const) {
      const palm = landmark('palm', AQUA); palm.scale.setScalar(k); palm.position.set(px, 0, EZ + D + pz); palm.rotation.y = px; scene.add(palm);
    }

    // Text needs the web font loaded before drawing on canvases
    let figuresState: LiveFigure[] | null = null, asOfState: string | undefined, boardStart = 0;
    const redrawText = () => {
      drawSign(signCanvas, isAr); signTex.needsUpdate = true;
      for (const f of focusables) f.redraw(f.reveal);
      for (const l of labels) l();
      for (const l of labelsEarly) l();
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
    controls.minDistance = 2; controls.maxDistance = 300; controls.maxPolarAngle = Math.PI * 0.53;
    controls.rotateSpeed = 0.5;
    // Taking hold of the view ends the opening fly-in
    renderer.domElement.addEventListener('pointerdown', () => { intro = null; });
    camera.position.copy(stations[0].cam).add(new THREE.Vector3(0, 8, 22));
    controls.target.copy(stations[0].target);
    let tween: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; start: number; dur: number } | null = null;
    let intro: { cam: THREE.CatmullRomCurve3; target: THREE.CatmullRomCurve3; start: number; dur: number } | null = null;
    let current = 0;
    // First-person modes: walking with the keyboard, turning the view with the head or by dragging
    const mode: ViewMode = { walk: false, look: false, stereo: false };
    const stereo = new StereoEffect(renderer);
    const fp = { yaw: 0, pitch: 0, pos: new THREE.Vector3(), gyro: null as THREE.Quaternion | null, yawOffset: null as number | null, baseYaw: 0, basePitch: 0 };
    /** Height of the floor under a point: the lobby slab, with a short ramp over its steps */
    const floorY = (x: number, z: number) => (Math.abs(x) > PW / 2 ? 0 : LOBBY_Y * THREE.MathUtils.clamp(Math.min(z - (EZ - 1.5 - STAIR_RUN), (EZ + D + 1.5 + STAIR_RUN) - z) / STAIR_RUN, 0, 1));
    const keys = new Set<string>();
    /** The on-screen stick; a game controller's sticks are added to it */
    const stick = { x: 0, y: 0 }; let padA = false;
    /** Real walking speed from the phone's GPS and when it was reported; one metre walked is GPS_GAIN metres in the courtyard */
    const gps = { v: 0, at: 0 }, GPS_GAIN = 1.6, gpsDir = new THREE.Vector3();
    /** A spot on the ground the visitor pressed to walk to, and the ring that marks it */
    let walkTo: THREE.Vector3 | null = null;
    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 40), neon(AQUA, 2.4)); marker.rotation.x = Math.PI / 2; marker.visible = false; scene.add(marker);
    const ground0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let walkFocus = -1;
    const firstPerson = () => mode.walk || mode.look;
    const faceFrom = (pos: THREE.Vector3, target: THREE.Vector3) => { const d = target.clone().sub(pos).normalize(); fp.yaw = Math.atan2(-d.x, -d.z); fp.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)); fp.yawOffset = null; fp.baseYaw = fp.yaw; fp.basePitch = fp.pitch; };
    const setMode = (next: Partial<ViewMode>) => {
      const was = firstPerson();
      Object.assign(mode, next);
      if (firstPerson() && !was) {
        const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
        fp.pos.copy(camera.position); faceFrom(fp.pos, fp.pos.clone().add(dir));
        controls.enabled = false; tween = null; intro = null;
      }
      if (mode.walk) fp.pos.y = 1.7 + floorY(fp.pos.x, fp.pos.z);
      if (next.look) { fp.baseYaw = fp.yaw; fp.basePitch = fp.pitch; fp.yawOffset = null; }
      if (!firstPerson() && was) { controls.enabled = true; goTo(current, true); }
      if (!mode.stereo) { const w = mount.clientWidth, h = mount.clientHeight; renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h); }
      keys.clear(); stick.x = stick.y = 0; walkTo = null; marker.visible = false;
      placeHub();
    };
    // Letters are read by their place on the keyboard, so W A S D work on an Arabic layout too
    const keyOf = (e: KeyboardEvent) => (/^Key[A-Z]$/.test(e.code) ? e.code.slice(3) : e.key).toLowerCase();
    const onKeyDown = (e: KeyboardEvent) => { if (mode.walk && !(e.target as HTMLElement)?.closest?.('input, textarea, select')) keys.add(keyOf(e)); };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(keyOf(e));
    const onWheel = (e: WheelEvent) => {
      if (!mode.walk) return;
      e.preventDefault(); walkTo = null; marker.visible = false;
      const st = THREE.MathUtils.clamp(-e.deltaY * 0.012, -2.4, 2.4); fp.pos.x += -Math.sin(fp.yaw) * st; fp.pos.z += -Math.cos(fp.yaw) * st;
    };
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    let dragAt: { x: number; y: number } | null = null;
    const onLookDown = (e: PointerEvent) => { if (firstPerson()) dragAt = { x: e.clientX, y: e.clientY }; };
    const onLookMove = (e: PointerEvent) => {
      // No motion sensor (a laptop, or a phone that withholds it): the pointer steers the view around where it was facing
      if (!dragAt && mode.look && !mode.walk && !fp.gyro) {
        const b = renderer.domElement.getBoundingClientRect();
        fp.yaw = fp.baseYaw - (((e.clientX - b.left) / b.width) * 2 - 1) * 1.25; fp.pitch = fp.basePitch - (((e.clientY - b.top) / b.height) * 2 - 1) * 0.6;
        return;
      }
      if (!dragAt || !firstPerson()) return;
      fp.yaw += (e.clientX - dragAt.x) * 0.004; fp.pitch = THREE.MathUtils.clamp(fp.pitch + (e.clientY - dragAt.y) * 0.004, -1.3, 1.3);
      dragAt = { x: e.clientX, y: e.clientY };
    };
    const onLookUp = () => { dragAt = null; };
    renderer.domElement.addEventListener('pointerdown', onLookDown); window.addEventListener('pointermove', onLookMove); window.addEventListener('pointerup', onLookUp);
    // Phone sensors → camera orientation (the usual alpha/beta/gamma conversion, corrected for screen rotation)
    const zee = new THREE.Vector3(0, 0, 1), upY = new THREE.Vector3(0, 1, 0), eul = new THREE.Euler(), q0 = new THREE.Quaternion(), qY = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      const rad = THREE.MathUtils.degToRad, turn = (window as unknown as { orientation?: number }).orientation, orient = rad(typeof turn === 'number' ? turn : screen.orientation?.angle ?? 0);
      eul.set(rad(e.beta), rad(e.alpha), -rad(e.gamma), 'YXZ');
      fp.gyro = (fp.gyro || new THREE.Quaternion()).setFromEuler(eul).multiply(q1).multiply(q0.setFromAxisAngle(zee, -orient));
    };
    window.addEventListener('deviceorientation', onOrient);
    // Some Android browsers only fire the absolute variant
    window.addEventListener('deviceorientationabsolute', onOrient as EventListener);
    /** Narrow (portrait) screens step back so the whole panel fits */
    const fitted = (s: Station): Station => {
      if (s.exact) return s;
      const k = Math.max(1, 1.35 / camera.aspect);
      // The caption covers the lower part of a tall screen, so the subject is framed higher there
      const target = s.target.clone(); target.y -= Math.min(2.2, (k - 1) * 2.4);
      // Never step back so far that the panels across the path come between the camera and the subject
      const off = s.cam.clone().sub(s.target), len = off.length();
      return { cam: target.clone().add(off.setLength(len < 14 ? Math.min(len * k, Math.max(len, 12.5)) : len * k)), target };
    };
    let hubRedraw: (() => void) | null = null;
    let placeHub: () => void = () => {};
    let bottomInsetPx = insetRef.current ?? mount.clientHeight * 0.4;
    const goTo = (i: number, instant = false) => {
      // The opening fly-in already ends at the first station
      if (intro && i === 0 && !instant) return;
      const s = fitted(stations[Math.max(0, Math.min(stations.length - 1, i))]);
      current = i; hubRedraw?.();
      if (renderer.xr.isPresenting) { placeDolly(s); return; }
      // In a first-person mode a station is a place to stand, facing its card
      if (firstPerson()) { fp.pos.copy(s.cam); if (mode.walk) fp.pos.y = 1.7; faceFrom(fp.pos, s.target); intro = null; tween = null; return; }
      intro = null;
      if (instant || reducedMotion) { camera.position.copy(s.cam); controls.target.copy(s.target); tween = null; return; }
      tween = { from: camera.position.clone(), to: s.cam.clone(), tFrom: controls.target.clone(), tTo: s.target.clone(), start: performance.now(), dur: 2600 };
    };
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // ── The hub: a curved touch screen floating over the fountain. Each tile is a station; press one to go there ──
    {
      const HW = 10.4, HH = 2.2, HR = 9, tiles = stations.length, CW = 2400, CH = 500, PAD = 40;
      const hc = document.createElement('canvas'); hc.width = CW; hc.height = CH;
      const ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.SRGBColorSpace; ht.anisotropy = 8;
      const hub = new THREE.Group(); hub.rotation.x = -0.12; scene.add(hub);
      const screen = new THREE.Mesh(bend(HW, HH, HR, 64), new THREE.MeshBasicMaterial({ map: ht, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
      screen.renderOrder = 5; hub.add(screen);
      for (const sy of [-1, 1]) { const rail = new THREE.Mesh(bend(HW - 0.5, 0.03, HR, 64), neon(sy > 0 ? AQUA : PURPLE, 2.4)); rail.position.set(0, sy * (HH / 2 + 0.05), 0.01); hub.add(rail); }
      // The projector under it: a ring on the water and a faint cone of light
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 6, 64), neon(AQUA, 2.6)); ring.rotation.x = Math.PI / 2; scene.add(ring);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 1.4, 2.0, 40, 1, true), new THREE.MeshBasicMaterial({ color: AQUA, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      scene.add(cone);
      const HYC = 3.6, startView = stations[0];
      const hubMover = { o: hub as THREE.Object3D, bob: 0.04, y0: HYC, phase: 0.5 }; movers.push(hubMover);
      // The hub hangs at the start of the path at head height. The opening view is worked out from the shape of the screen and
      // from how much of its foot the caption and buttons cover, so the hub sits clear above them with the board over it.
      placeHub = () => {
        const k = Math.max(1, 1.35 / camera.aspect), CZ = EZ - 2.5, need = 6.4 * k, hz = Math.max(24, CZ - need), dist = CZ - hz, sc = Math.min(1, dist / need) * 0.5;
        // Seen from eye height the full-size hub towers over the visitor: there it is under half the size, centred just above the eyes
        const foot = mode.walk, hy = foot ? 1.05 : 1.3;
        hub.position.set(0, hy, hz); hub.scale.setScalar(foot ? sc * 0.7 : sc);
        for (const b of bots) { b.x0 = b.sx * ((HW / 2) * (foot ? sc * 0.7 : sc) + 1.2); b.z0 = hz + 0.5; } hub.rotation.x = foot ? -0.6 : -0.35; hubMover.y0 = hy;
        ring.position.set(0, 0.06, hz); cone.visible = false;
        const camY = hy + dist * 0.2, half = (HH / 2) * sc + 0.15, tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        // Where on the screen (0 top … 1 bottom) the hub's lower edge should land
        const fb = 1 - THREE.MathUtils.clamp(bottomInsetPx / Math.max(1, mount.clientHeight), 0.12, 0.6) - 0.035;
        const pitch = Math.atan2(hy - half - camY, dist) - Math.atan((0.5 - fb) * 2 * tanHalf);
        startView.cam.set(0, camY, CZ); startView.target.set(0, camY + Math.tan(pitch) * dist, hz);
        if (intro) { intro.cam.points[intro.cam.points.length - 1].copy(startView.cam); intro.target.points[intro.target.points.length - 1].copy(startView.target); }
        else if (current === 0 && !firstPerson() && !renderer.xr.isPresenting) goTo(0);
      };
      placeHub();

      let hover = -1;
      const label = (i: number): [string, string, string] => {
        if (i === 0) return [isAr ? 'البداية' : 'Start', isAr ? 'ساحة المبنى الجديد' : 'The new courtyard', AQUA];
        const st = stages[i - 1];
        return st ? [st.year, isAr ? st.titleAr : st.titleEn, st.color] : ['●', isAr ? 'الأرقام المباشرة' : 'Live figures', WARM];
      };
      hubRedraw = () => {
        const g = hc.getContext('2d')!; g.clearRect(0, 0, CW, CH);
        const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, 'rgba(8,22,44,0.9)'); bg.addColorStop(1, 'rgba(5,10,26,0.96)');
        g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, CW - 8, CH - 8, 46); g.fill(); g.strokeStyle = 'rgba(111,211,207,0.5)'; g.lineWidth = 3; g.stroke();
        g.direction = isAr ? 'rtl' : 'ltr'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = 'rgba(255,255,255,0.72)'; g.font = `500 30px ${FONT}`; g.fillText(isAr ? 'اضغط على محطة للانتقال إليها' : 'Press a station to go there', CW / 2, 48);
        const tw = (CW - PAD * 2) / tiles, lineY = 104;
        g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 3; g.beginPath(); g.moveTo(PAD + tw / 2, lineY); g.lineTo(CW - PAD - tw / 2, lineY); g.stroke();
        for (let i = 0; i < tiles; i++) {
          const col = isAr ? tiles - 1 - i : i, x = PAD + col * tw, cx = x + tw / 2, [big, small, color] = label(i), on = i === current, hot = i === hover;
          // Passed stations are joined by a lit line
          if (i > 0 && i <= current) { const px = PAD + (isAr ? tiles - i : i - 1) * tw + tw / 2; g.strokeStyle = color; g.lineWidth = 4; g.beginPath(); g.moveTo(px, lineY); g.lineTo(cx, lineY); g.stroke(); }
          g.fillStyle = i <= current ? color : 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(cx, lineY, on ? 13 : 8, 0, Math.PI * 2); g.fill();
          if (on) { g.strokeStyle = color; g.globalAlpha = 0.45; g.lineWidth = 5; g.beginPath(); g.arc(cx, lineY, 23, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
          g.beginPath(); g.roundRect(x + 8, 140, tw - 16, 332, 26);
          g.fillStyle = color; g.globalAlpha = on ? 0.3 : hot ? 0.16 : 0.05; g.fill(); g.globalAlpha = 1;
          g.lineWidth = on || hot ? 4 : 2; g.strokeStyle = on || hot ? color : 'rgba(255,255,255,0.2)'; g.stroke();
          if (on || hot) { g.save(); g.shadowColor = color; g.shadowBlur = 26; g.stroke(); g.restore(); }
          g.fillStyle = on ? '#ffffff' : color; g.font = `700 ${big.length > 4 ? 52 : 80}px ${FONT}`; g.fillText(big, cx, 226);
          // The title, wrapped to the tile
          g.fillStyle = 'rgba(255,255,255,0.88)'; g.font = `500 27px ${FONT}`;
          const words = small.split(' '), rows: string[] = []; let row = '';
          for (const w of words) { const next = row ? row + ' ' + w : w; if (g.measureText(next).width > tw - 44 && row) { rows.push(row); row = w; } else row = next; }
          rows.push(row); if (rows.length > 3) { rows.length = 3; rows[2] += '…'; }
          rows.forEach((r, k) => g.fillText(r, cx, 316 + k * 38 - (rows.length - 1) * 6));
        }
        ht.needsUpdate = true;
      };
      hubRedraw(); document.fonts?.ready.then(() => hubRedraw?.());

      const caster = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down: [number, number] | null = null;
      const tileAt = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        caster.setFromCamera(ptr, camera); const hit = caster.intersectObject(screen)[0];
        if (!hit?.uv || hit.uv.y > 0.74 || hit.uv.x < PAD / CW || hit.uv.x > 1 - PAD / CW) return -1;
        const col = Math.min(tiles - 1, Math.floor(((hit.uv.x - PAD / CW) / (1 - (2 * PAD) / CW)) * tiles));
        return isAr ? tiles - 1 - col : col;
      };
      const el = renderer.domElement;
      el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
      el.addEventListener('pointermove', e => { const i = e.buttons ? -1 : tileAt(e); if (i !== hover) { hover = i; el.style.cursor = i >= 0 ? 'pointer' : ''; hubRedraw?.(); } });
      el.addEventListener('pointerup', e => {
        // A press, not the end of a drag
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
        const i = tileAt(e);
        if (i < 0) {
          // While walking, a press on the ground is a place to walk to
          const p = new THREE.Vector3();
          if (mode.walk && caster.ray.direction.y < -0.03 && caster.ray.intersectPlane(ground0, p) && p.distanceTo(fp.pos) < 90) { walkTo = p; marker.position.set(p.x, 0.12 + floorY(p.x, p.z), p.z); marker.visible = true; }
          return;
        }
        if (cb.current.onSelect) cb.current.onSelect(i); else goTo(i);
        if (i === current) goTo(i);
      });
    }

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
      setMode,
      hasSensor: () => !!fp.gyro,
      move: (x, y) => { stick.x = x; stick.y = y; },
      gps: v => { gps.v = v; gps.at = performance.now(); },
      setInset: px => { bottomInsetPx = px; placeHub(); },
    };

    // ── Animation loop ──
    const clock = new THREE.Clock();
    let readySent = false, prev = performance.now();
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      const now = performance.now();
      // dt drives movement (capped so a stall cannot throw the walker through a wall); slow frames still finish card animations on time
      const raw = Math.min(0.5, (now - prev) / 1000), dt = Math.min(0.1, raw); prev = now;
      if (intro) {
        // The clock starts with the first drawn frame, so loading time does not eat the fly-in
        if (!Number.isFinite(intro.start)) intro.start = now + 500;
        const k = Math.max(0, Math.min(1, (now - intro.start) / intro.dur)), e = ease(k);
        intro.cam.getPoint(e, camera.position); intro.target.getPoint(e, controls.target);
        if (k >= 1) intro = null;
      }
      if (tween) {
        const k = Math.min(1, (now - tween.start) / tween.dur), e = ease(k);
        camera.position.lerpVectors(tween.from, tween.to, e);
        // Rise slightly mid-flight so the camera clears planters and panels
        camera.position.y += Math.sin(Math.PI * e) * 1.6;
        controls.target.lerpVectors(tween.tFrom, tween.tTo, e);
        if (k >= 1) tween = null;
      }
      // A game controller: sticks walk and turn while walking, the A button goes to the next station
      const pad = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).find(g => g && g.connected) ?? null;
      if (pad) { const a = !!pad.buttons[0]?.pressed; if (a && !padA) cb.current.onNext?.(); padA = a; }
      if (firstPerson() && !renderer.xr.isPresenting) {
        if (mode.walk) {
          // W/S or ↑/↓ walk, A/D step sideways, ←/→ turn, Shift runs
          const has = (...k: string[]) => k.some(x => keys.has(x));
          const dead = (v: number | undefined) => (v === undefined || Math.abs(v) < 0.18 ? 0 : v), c1 = (v: number) => THREE.MathUtils.clamp(v, -1, 1);
          const f = c1((has('w', 'arrowup') ? 1 : 0) - (has('s', 'arrowdown') ? 1 : 0) - stick.y - dead(pad?.axes[1])), r = c1((has('d') ? 1 : 0) - (has('a') ? 1 : 0) + stick.x + dead(pad?.axes[0]));
          fp.yaw += ((has('arrowleft', 'q') ? 1 : 0) - (has('arrowright', 'e') ? 1 : 0) - dead(pad?.axes[2])) * 1.7 * dt;
          fp.pitch = THREE.MathUtils.clamp(fp.pitch - dead(pad?.axes[3]) * 1.2 * dt, -1.3, 1.3);
          // A pressed spot on the ground: walk there unless the visitor steers
          if (f || r) walkTo = null;
          else if (walkTo) { const dx = walkTo.x - fp.pos.x, dz = walkTo.z - fp.pos.z, d = Math.hypot(dx, dz); if (d < 0.4) walkTo = null; else { const st = Math.min(d, 7 * dt); fp.pos.x += (dx / d) * st; fp.pos.z += (dz / d) * st; } }
          marker.visible = !!walkTo; if (walkTo) marker.scale.setScalar(1 + Math.sin(t * 5) * 0.12);
          const sp = (has('shift') ? 11 : 5.5) * dt, sin = Math.sin(fp.yaw), cos = Math.cos(fp.yaw);
          fp.pos.x += (-sin * f + cos * r) * sp; fp.pos.z += (-cos * f - sin * r) * sp;
          // Stay inside the courtyard, the lobby's middle arch and the forecourt
          // Walking for real (GPS): forward the way the head faces. A reading older than a few seconds no longer counts.
          if (gps.v > 0 && now - gps.at < 4000) {
            camera.getWorldDirection(gpsDir); gpsDir.y = 0;
            if (gpsDir.lengthSq() > 1e-4) { gpsDir.normalize(); fp.pos.x += gpsDir.x * gps.v * GPS_GAIN * dt; fp.pos.z += gpsDir.z * gps.v * GPS_GAIN * dt; walkTo = null; }
          }
          fp.pos.z = THREE.MathUtils.clamp(fp.pos.z, FZ + 2, EZ + D + 70);
          const inLobby = fp.pos.z > EZ - 0.6 && fp.pos.z < EZ + D + 0.6;
          fp.pos.x = THREE.MathUtils.clamp(fp.pos.x, inLobby ? -3.2 : -W / 2 + 1.5, inLobby ? 3.2 : W / 2 - 1.5);
          fp.pos.y = 1.7 + floorY(fp.pos.x, fp.pos.z);
          walkFocus = -1; let near = 11;
          stations.forEach((st, i) => { if (i === 0 || i === stations.length - 1) return; const d = Math.hypot(st.target.x - fp.pos.x, st.target.z - fp.pos.z); if (d < near) { near = d; walkFocus = i; } });
        }
        camera.position.copy(fp.pos);
        if (mode.look && fp.gyro) {
          // Keep facing the way the visitor was looking when head-turning started
          if (fp.yawOffset === null) fp.yawOffset = fp.yaw - new THREE.Euler().setFromQuaternion(fp.gyro, 'YXZ').y;
          camera.quaternion.copy(qY.setFromAxisAngle(upY, fp.yawOffset)).multiply(fp.gyro);
        } else camera.rotation.set(fp.pitch, fp.yaw, 0, 'YXZ');
      } else if (!renderer.xr.isPresenting) controls.update();

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
      fountainLights.forEach((l, i) => { l.intensity = 12 + 5 * Math.sin(t * 1.3 + i * 2); });

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
      const focus = mode.walk ? walkFocus : current;
      focusables.forEach((f, i) => {
        // Open always; the card the visitor is at only decides nothing here any more
        const want = 1; void i; void focus;
        const gs = mode.walk ? 0.5 : 1; if (f.group.scale.x !== gs) { f.group.scale.setScalar(gs); f.group.position.y = f.y * gs; }
        f.k = reducedMotion ? want : f.k + (want - f.k) * (1 - Math.exp(-raw * 5.5));
        // The points arrive one after another once the card has opened, and reset when it closes
        if (want && f.k > 0.55 && f.reveal < 1) { f.reveal = Math.min(1, f.reveal + raw / 2.2); f.redraw(f.reveal); }
        else if (!want && f.k < 0.05 && f.reveal > 0 && !reducedMotion) { f.reveal = 0; f.redraw(0); }
        f.detail.visible = f.k > 0.02; f.detail.scale.setScalar(0.55 + 0.45 * f.k);
        f.sign.visible = f.k < 0.9; f.sign.scale.setScalar(1 - f.k * 0.6);
      });
      for (const L of lasers) { L.m.opacity = L.base * (0.7 + 0.3 * Math.sin(t * 0.6 + L.ph) * motion); if (L.scroll) L.scroll.offset.x = t * (L.rate ?? 0.09) * motion; if (L.steady) L.m.opacity = L.base; }
      for (const S of sweepers) { S.o.rotation.z = S.tilt + Math.sin(t * S.sp + S.ph) * S.amp * motion; S.o.rotation.x = S.lean + Math.cos(t * S.sp * 0.7 + S.ph) * S.amp * 0.6 * motion; }
      if (motion) flagWave?.(t);
      for (const b of bots) {
        // A slow figure of eight, turning with the path; the head looks about and the arm waves
        const a = t * 0.35 + (b.sx > 0 ? 0 : 2.4), dx = Math.sin(a) * 0.55 * motion, dz = Math.sin(a * 2) * 0.3 * motion;
        b.o.position.set(b.x0 + dx, 0, b.z0 + dz); b.o.rotation.y = -b.sx * 0.35 + Math.cos(a) * 0.55 * motion; b.o.rotation.z = -Math.cos(a) * 0.03 * motion;
        b.cap.position.set(b.x0 + dx, 2.75 + Math.sin(t * 1.1 + b.sx) * 0.05 * motion, b.z0 + dz);
        const hd = b.o.userData.head as THREE.Object3D | undefined, wv = b.o.userData.wave as THREE.Object3D | undefined;
        if (hd) hd.rotation.y = Math.sin(t * 0.8 + b.sx) * 0.45 * motion;
        if (wv) wv.rotation.x = Math.sin(t * 3.2 + b.sx) * 0.4 * motion;
      }
      for (const fl of fliers) { const a = t * fl.sp * motion + fl.ph; fl.o.position.set(Math.cos(a) * fl.r, fl.h, 10 + Math.sin(a) * fl.r); fl.o.rotation.y = -a; }
      for (const m of movers) {
        if (m.spin) m.o.rotation.y = t * m.spin * motion + m.phase;
        if (m.bob) m.o.position.y = m.y0 + Math.sin(t * 1.1 + m.phase) * m.bob * motion;
      }

      if (renderer.xr.isPresenting) renderer.render(scene, camera);
      else if (mode.stereo) stereo.render(scene, camera);
      else composer.render();
      if (!readySent) { readySent = true; cb.current.onReady?.(); }
    });

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h); stereo.setSize(w, h);
    };
    const ro = new ResizeObserver(() => { onResize(); placeHub(); }); ro.observe(mount);

    // A rebuilt scene (language or motion setting changed) returns to the station the visitor was at
    if (indexRef.current || reducedMotion) goTo(indexRef.current, true);
    else {
      // Opening shot: the building from outside, in through the middle arch and the lobby, then the courtyard and the live board
      const end = fitted(stations[0]);
      intro = {
        cam: new THREE.CatmullRomCurve3([new THREE.Vector3(95, 46, EZ + D + 150), new THREE.Vector3(40, 16, EZ + D + 96), new THREE.Vector3(8, 3.6, EZ + D + 34), new THREE.Vector3(0, 3.2, EZ + D + 6), new THREE.Vector3(0, 3.4, EZ + 5), end.cam.clone()], false, 'catmullrom', 0.35),
        target: new THREE.CatmullRomCurve3([new THREE.Vector3(0, 14, EZ), new THREE.Vector3(-6, 9, EZ + D + 10), new THREE.Vector3(0, 7, EZ + D), new THREE.Vector3(0, 5, EZ - 8), new THREE.Vector3(0, 4.2, 26), end.target.clone()], false, 'catmullrom', 0.35),
        start: Infinity, dur: 20000,
      };
      intro.cam.getPoint(0, camera.position); intro.target.getPoint(0, controls.target);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onLookMove); window.removeEventListener('pointerup', onLookUp);
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('deviceorientationabsolute', onOrient as EventListener);
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
  useEffect(() => { if (bottomInset !== undefined) api.current?.setInset(bottomInset); }, [bottomInset]);
  useEffect(() => { api.current?.setFigures(figures, asOfLabel); }, [figures, asOfLabel, isAr]);

  return <div ref={mountRef} className="absolute inset-0" />;
});
