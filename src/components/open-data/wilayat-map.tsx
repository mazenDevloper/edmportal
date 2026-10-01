'use client';

import React, { useEffect, useRef } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DHOFAR_CENTER, geoOf } from '@/lib/open-data/wilayat-geo';

export interface WilayaValue { wilaya: string; value: number; lines: { label: string; value: number }[] }

/**
 * Proportional-symbol map: one circle per wilayat at its main town, area proportional to the value.
 * OpenStreetMap tiles; the circles still draw on a plain background when tiles cannot load.
 */
export function WilayatMap({ rows, color, isAr, unit }: { rows: WilayaValue[]; color: string; isAr: boolean; unit: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const L = useRef<typeof Leaflet | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('leaflet').then(mod => {
      if (cancelled || !el.current || map.current) return;
      const lf = (mod as unknown as { default?: typeof Leaflet }).default ?? mod;
      L.current = lf;
      const m = lf.map(el.current, { center: DHOFAR_CENTER, zoom: 7, minZoom: 6, maxZoom: 12, scrollWheelZoom: false, attributionControl: true });
      lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(m);
      layer.current = lf.layerGroup().addTo(m);
      map.current = m;
      draw();
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; layer.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draw = () => {
    const lf = L.current, group = layer.current;
    if (!lf || !group) return;
    group.clearLayers();
    const max = Math.max(1, ...rows.map(r => r.value));
    const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-OM' : 'en-US');
    // Largest first so small circles stay on top and clickable
    [...rows].sort((a, b) => b.value - a.value).forEach(r => {
      const g = geoOf(r.wilaya);
      if (!g || r.value <= 0) return;
      const name = isAr ? g.ar : g.en;
      const marker = lf.circleMarker([g.lat, g.lon], {
        radius: 6 + 38 * Math.sqrt(r.value / max), color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.72,
      });
      const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
      marker.bindTooltip(`<strong>${esc(name)}</strong><br>${fmt(r.value)} ${esc(unit)}`, { direction: 'top', sticky: true });
      marker.bindPopup(
        `<div dir="${isAr ? 'rtl' : 'ltr'}" style="min-width:170px;font-family:inherit"><strong style="font-size:15px">${esc(name)}</strong>` +
        r.lines.map(l => `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px"><span>${esc(l.label)}</span><strong>${fmt(l.value)}</strong></div>`).join('') + '</div>');
      marker.addTo(group);
    });
  };
  useEffect(draw, [rows, color, isAr, unit]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} dir="ltr" className="h-[30rem] w-full rounded-3xl overflow-hidden z-0 bg-[#e8eef5]" role="application" aria-label={isAr ? 'خريطة ولايات ظفار' : 'Map of Dhofar wilayat'} />;
}
