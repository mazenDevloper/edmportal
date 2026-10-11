'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FONT = '"Readex Pro", "Segoe UI", Tahoma, sans-serif';
const MAX_H = 6, SPAN = 20, ROW_GAP = 2.4;

export interface Series3D { id: string; label: string; color: string }
export interface Period3D { key: string; label: string; values: Record<string, number> }

function labelSprite(text: string, opts: { size?: number; weight?: number; color?: string; w?: number } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d')!;
  g.font = `${opts.weight ?? 700} ${opts.size ?? 44}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.strokeText(text, 256, 50);
  g.fillStyle = opts.color ?? '#0f172a'; g.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const w = opts.w ?? 4.4; s.scale.set(w, w * 96 / 512, 1);
  return s;
}

/**
 * A 3D block chart: time runs along one axis and each source has its own row, so the four series
 * can be read side by side. Every row is scaled to its own peak (the sources differ by orders of
 * magnitude); the exact counts are in the hover card and in the table under the charts.
 * Drag to rotate, scroll or pinch to zoom, hover or tap a block for its figure.
 */
export function Transactions3D({ periods, series, isAr }: { periods: Period3D[]; series: Series3D[]; isAr: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef<{ update: (p: Period3D[], s: Series3D[]) => void; reset: () => void } | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; series: Series3D; period: Period3D } | null>(null);

  useEffect(() => {
    const el = mount.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 300);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d6, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-10, 18, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
    scene.add(sun);

    const base = new THREE.Mesh(new THREE.BoxGeometry(SPAN + 4, 0.3, ROW_GAP * 4 + 2), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 }));
    base.position.y = -0.16; base.receiveShadow = true; scene.add(base);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, 0);
    controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 12; controls.maxDistance = 60;
    controls.minPolarAngle = 0.35; controls.maxPolarAngle = 1.45;
    controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.5;
    const home = new THREE.Vector3(-11, 13, 23);
    const fit = () => { camera.position.copy(home).sub(controls.target).setLength(30 * Math.max(1, 1.9 / camera.aspect)).add(controls.target); };

    const group = new THREE.Group(); scene.add(group);
    type Block = { mesh: THREE.Mesh; target: number; h: number; delay: number };
    let blocks: Block[] = [], started = performance.now();
    const update = (periods: Period3D[], series: Series3D[]) => {
      for (const o of [...group.children]) {
        group.remove(o);
        const m = o as THREE.Mesh;
        if (!(o instanceof THREE.Sprite)) m.geometry?.dispose();
        (m.material as THREE.SpriteMaterial).map?.dispose();
        (m.material as THREE.Material)?.dispose?.();
      }
      blocks = []; started = performance.now();
      const n = Math.max(1, periods.length), step = SPAN / Math.max(n, 6), bw = Math.min(1.3, step * 0.72);
      const x0 = -((n - 1) * step) / 2, z0 = -((series.length - 1) * ROW_GAP) / 2;
      const every = Math.ceil(n / 9);
      series.forEach((s, si) => {
        const z = z0 + si * ROW_GAP, peak = Math.max(1, ...periods.map(p => p.values[s.id] || 0));
        const mat = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.4, metalness: 0.08 });
        // Row rail and its name
        const rail = new THREE.Mesh(new THREE.BoxGeometry(SPAN + 1.5, 0.04, bw + 0.3), new THREE.MeshStandardMaterial({ color: s.color, transparent: true, opacity: 0.14 }));
        rail.position.set(0, 0.02, z); group.add(rail);
        const name = labelSprite(s.label, { size: 40, color: s.color, w: 5 }); name.position.set(-SPAN / 2 - 3.4, 0.5, z); group.add(name);
        periods.forEach((p, pi) => {
          const v = p.values[s.id] || 0;
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, 1, bw), mat.clone());
          mesh.position.set(x0 + pi * step, 0, z); mesh.castShadow = true; mesh.userData = { series: s, period: p };
          group.add(mesh);
          blocks.push({ mesh, target: v ? Math.max(0.08, (v / peak) * MAX_H) : 0.02, h: 0.02, delay: pi * (900 / n) + si * 120 });
        });
      });
      periods.forEach((p, pi) => {
        if (pi % every && pi !== n - 1) return;
        const lab = labelSprite(p.label, { size: 36, weight: 400, color: '#475569', w: 3.6 });
        lab.position.set(x0 + pi * step, 0.3, z0 + (series.length - 1) * ROW_GAP + 1.9); group.add(lab);
      });
    };
    state.current = { update, reset: () => { controls.autoRotate = false; fit(); } };

    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let hovered: THREE.Mesh | null = null;
    const glow = (m: THREE.Mesh | null, on: boolean) => m && (m.material as THREE.MeshStandardMaterial).emissive.set(on ? 0x3a3a3a : 0x000000);
    const pick = (e: PointerEvent) => {
      const b = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(blocks.map(c => c.mesh))[0]?.object as THREE.Mesh | undefined;
      if (hovered !== hit) glow(hovered, false);
      hovered = hit ?? null; glow(hovered, true);
      setTip(hit ? { x: e.clientX - b.left, y: e.clientY - b.top, series: hit.userData.series, period: hit.userData.period } : null);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };
    const leave = () => { glow(hovered, false); hovered = null; setTip(null); };
    renderer.domElement.addEventListener('pointermove', pick);
    renderer.domElement.addEventListener('pointerdown', pick);
    renderer.domElement.addEventListener('pointerleave', leave);
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    renderer.setAnimationLoop(() => {
      const now = performance.now() - started;
      for (const c of blocks) {
        if (reduced) c.h = c.target; else if (now > c.delay) c.h += (c.target - c.h) * 0.1;
        c.mesh.scale.y = c.h; c.mesh.position.y = c.h / 2;
      }
      controls.update();
      renderer.render(scene, camera);
    });
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);
    fit();

    return () => {
      ro.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
      scene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material as THREE.Material | undefined; (mat as THREE.SpriteMaterial | undefined)?.map?.dispose(); mat?.dispose?.(); });
      renderer.dispose(); renderer.domElement.remove(); state.current = null;
    };
  }, [isAr]);

  useEffect(() => { state.current?.update(periods, series); }, [periods, series, isAr]);

  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-OM' : 'en-US');
  return (
    <div className="relative h-[28rem] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#eef4fb] to-[#dfe9f5]">
      <div ref={mount} className="absolute inset-0 touch-none" />
      {tip && (
        <div role="status" dir={isAr ? 'rtl' : 'ltr'} className="pointer-events-none absolute z-10 min-w-[10rem] rounded-xl bg-white/95 shadow-xl ring-1 ring-slate-200 px-3 py-2 text-xs"
          style={{ left: Math.min(Math.max(tip.x + 14, 8), (mount.current?.clientWidth ?? 600) - 180), top: Math.max(tip.y - 20, 8) }}>
          <p className="flex items-center gap-1.5 font-black text-slate-900"><span className="size-2.5 rounded-sm" style={{ background: tip.series.color }} aria-hidden />{tip.series.label}</p>
          <p className="font-bold text-slate-500">{tip.period.label}</p>
          <p className="text-lg font-black text-slate-900 tabular-nums">{fmt(tip.period.values[tip.series.id] || 0)}</p>
        </div>
      )}
      <ul className="absolute top-3 start-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-black text-slate-700">
        {series.map(s => <li key={s.id} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />{s.label}</li>)}
      </ul>
      <button type="button" onClick={() => state.current?.reset()} className="absolute top-3 end-3 h-8 px-3 rounded-lg bg-white/90 ring-1 ring-slate-200 text-[11px] font-black text-slate-700 hover:bg-white">{isAr ? 'إعادة الزاوية' : 'Reset view'}</button>
      <p className="absolute bottom-2 start-3 end-3 text-[11px] font-bold text-slate-500">{isAr ? 'اسحب للتدوير · كبّر بالعجلة · مرّر على المكعب لعرض العدد. كل صف مقيس على أعلى قيمة فيه.' : 'Drag to rotate · scroll to zoom · hover a block for its count. Each row is scaled to its own peak.'}</p>
    </div>
  );
}
