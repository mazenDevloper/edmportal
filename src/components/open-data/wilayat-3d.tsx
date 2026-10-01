'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { geoOf } from '@/lib/open-data/wilayat-geo';
import type { WilayaValue } from './wilayat-map';

const FONT = '"Readex Pro", "Segoe UI", Tahoma, sans-serif';
const MAX_H = 8, DEG = 5.2;
const place = (lat: number, lon: number) => new THREE.Vector3((lon - 54.2) * DEG, 0, -(lat - 17.9) * DEG);

function labelSprite(text: string, opts: { size?: number; weight?: number; color?: string } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d')!;
  g.font = `${opts.weight ?? 700} ${opts.size ?? 44}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.strokeText(text, 256, 50);
  g.fillStyle = opts.color ?? '#0f172a'; g.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(5.2, 0.98, 1);
  return s;
}

/**
 * 3D columns over the governorate: one column per wilayat at its main town, height = value.
 * Drag to rotate; hover or tap a column for its figures.
 */
export function Wilayat3D({ rows, color, isAr, unit, compress }: { rows: WilayaValue[]; color: string; isAr: boolean; unit: string; compress: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef<{ update: (rows: WilayaValue[], color: string, compress: boolean) => void } | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; row: WilayaValue } | null>(null);

  useEffect(() => {
    const el = mount.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(2, 15, 21);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4d6, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(8, 16, 10); scene.add(sun);

    // Base plate with a light grid (a schematic plane, not a boundary map)
    const base = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 18), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 }));
    base.position.set(0, -0.16, -1.5); scene.add(base);
    const grid = new THREE.GridHelper(22, 22, 0xcbd5e1, 0xe2e8f0); grid.scale.z = 18 / 22; grid.position.set(0, 0.005, -1.5); scene.add(grid);
    const north = labelSprite(isAr ? 'الشمال ↑' : 'North ↑', { size: 34, weight: 400, color: '#64748b' }); north.position.set(0, 0.4, -10); scene.add(north);
    const sea = labelSprite(isAr ? 'بحر العرب' : 'Arabian Sea', { size: 34, weight: 400, color: '#0e7490' }); sea.position.set(2.5, 0.4, 6.6); scene.add(sea);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, -1.5);
    controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;
    controls.minPolarAngle = 0.5; controls.maxPolarAngle = 1.45;
    controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.6;

    /** Narrower canvases step back so the whole plate stays in view */
    const fit = () => {
      const dist = 22 * Math.max(1, 1.75 / camera.aspect);
      camera.position.sub(controls.target).setLength(dist).add(controls.target);
    };

    const group = new THREE.Group(); scene.add(group);
    type Col = { mesh: THREE.Mesh; top: THREE.Sprite; target: number; h: number; row: WilayaValue };
    let cols: Col[] = [];
    const update = (rows: WilayaValue[], color: string, compress: boolean) => {
      for (const o of [...group.children]) {
        group.remove(o);
        const m = o as THREE.Mesh;
        if (!(o instanceof THREE.Sprite)) m.geometry?.dispose();
        (m.material as THREE.SpriteMaterial).map?.dispose();
        (m.material as THREE.Material)?.dispose?.();
      }
      const max = Math.max(1, ...rows.map(r => r.value));
      const prev = new Map(cols.map(c => [c.row.wilaya, c.h]));
      cols = [];
      for (const r of rows) {
        const g = geoOf(r.wilaya);
        if (!g) continue;
        const p = place(g.lat, g.lon);
        const share = r.value / max;
        const target = Math.max(0.06, (compress ? Math.sqrt(share) : share) * MAX_H);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 }));
        mesh.position.copy(p); mesh.userData.row = r; group.add(mesh);
        const name = labelSprite(isAr ? g.ar : g.en, { size: 38 }); name.position.set(p.x, 0.35, p.z + 0.95); group.add(name);
        const top = labelSprite(r.value.toLocaleString(isAr ? 'ar-OM' : 'en-US'), { size: 40, color: '#334155' }); top.position.set(p.x, 0.6, p.z); group.add(top);
        cols.push({ mesh, top, target, h: prev.get(r.wilaya) ?? 0.02, row: r });
      }
    };
    state.current = { update };

    // Hover / tap
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let hovered: THREE.Mesh | null = null;
    const pick = (e: PointerEvent) => {
      const b = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(cols.map(c => c.mesh))[0]?.object as THREE.Mesh | undefined;
      if (hovered && hovered !== hit) (hovered.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
      hovered = hit ?? null;
      if (hit) {
        (hit.material as THREE.MeshStandardMaterial).emissive.set(0x333333);
        setTip({ x: e.clientX - b.left, y: e.clientY - b.top, row: hit.userData.row });
      } else setTip(null);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };
    const leave = () => { if (hovered) (hovered.material as THREE.MeshStandardMaterial).emissive.set(0x000000); hovered = null; setTip(null); };
    renderer.domElement.addEventListener('pointermove', pick);
    renderer.domElement.addEventListener('pointerdown', pick);
    renderer.domElement.addEventListener('pointerleave', leave);
    controls.addEventListener('start', () => { controls.autoRotate = false; });

    renderer.setAnimationLoop(() => {
      for (const c of cols) {
        c.h += (c.target - c.h) * (reduced ? 1 : 0.09);
        c.mesh.scale.y = c.h; c.mesh.position.y = c.h / 2;
        c.top.position.y = c.h + 0.5;
      }
      controls.update();
      renderer.render(scene, camera);
    });
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight);
      fit();
    });
    ro.observe(el);
    fit();

    return () => {
      ro.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
      scene.traverse(o => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material as THREE.Material | undefined; (mat as THREE.SpriteMaterial | undefined)?.map?.dispose(); mat?.dispose?.(); });
      renderer.dispose(); renderer.domElement.remove(); state.current = null;
    };
  }, [isAr]);

  useEffect(() => { state.current?.update(rows, color, compress); }, [rows, color, compress, isAr]);

  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-OM' : 'en-US');
  return (
    <div className="relative h-[30rem] w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#eef4fb] to-[#dfe9f5]">
      <div ref={mount} className="absolute inset-0 touch-none" />
      {tip && (
        <div role="status" dir={isAr ? 'rtl' : 'ltr'} className="pointer-events-none absolute z-10 min-w-[11rem] rounded-xl bg-white/95 shadow-xl ring-1 ring-slate-200 px-3 py-2 text-xs"
          style={{ left: Math.min(Math.max(tip.x + 14, 8), (mount.current?.clientWidth ?? 600) - 190), top: Math.max(tip.y - 20, 8) }}>
          <p className="font-black text-slate-900 text-sm">{isAr ? tip.row.wilaya : geoOf(tip.row.wilaya)?.en}</p>
          <p className="font-black text-slate-700">{fmt(tip.row.value)} {unit}</p>
          {tip.row.lines.map(l => <p key={l.label} className="flex justify-between gap-4 font-bold text-slate-500"><span>{l.label}</span><span className="text-slate-800">{fmt(l.value)}</span></p>)}
        </div>
      )}
      <p className="absolute bottom-2 start-3 text-[11px] font-bold text-slate-500">{isAr ? 'اسحب للتدوير · مرّر على العمود لعرض الأرقام' : 'Drag to rotate · hover a column for figures'}</p>
    </div>
  );
}
