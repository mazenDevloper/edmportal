'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Languages, X } from 'lucide-react';
import { translateBatch } from '@/ai/flows/translate-flow';
import { useSettingsStore } from '@/lib/settings-store';

/*
 * English mode safety net: any Arabic text still on the page (content with no English field,
 * database text, service details…) is translated in place. Runs after render and on changes,
 * in batches, with a per-session cache. Explicit English fields always win because they are
 * already English. Skips form fields, code, and anything marked lang="ar" or translate="no".
 */

const ARABIC = /[؀-ۿ]/;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG']);
const CACHE_KEY = 'dm-auto-translate';
const BATCH = 40;

function loadCache(): Map<string, string> {
  try { return new Map(JSON.parse(sessionStorage.getItem(CACHE_KEY) || '[]')); } catch { return new Map(); }
}
function saveCache(m: Map<string, string>) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify([...m.entries()].slice(-3000))); } catch { /* storage full or blocked */ }
}

function skippable(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || e.getAttribute('translate') === 'no' || e.getAttribute('lang') === 'ar' || (e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

export function AutoTranslate() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const pathname = usePathname();
  const [translatedCount, setTranslatedCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const cache = useRef<Map<string, string> | null>(null);
  const originals = useRef(new WeakMap<Text, string>());
  // Text we produced: never sent back for translation, even if it still contains Arabic (names, places)
  const produced = useRef(new Set<string>());

  useEffect(() => { setTranslatedCount(0); }, [pathname, isAr]);

  useEffect(() => {
    if (isAr) {
      // Back to Arabic: put the original text back where React didn't already
      document.querySelectorAll('body *').forEach(el => el.childNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) { const o = originals.current.get(n as Text); if (o !== undefined) (n as Text).nodeValue = o; }
      }));
      return;
    }
    if (!cache.current) cache.current = loadCache();
    const memo = cache.current;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;
    let stopped = false;

    const collect = () => {
      const nodes: Text[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: n => {
          const v = (n.nodeValue || '').trim();
          return ARABIC.test(v) && !produced.current.has(v) && !skippable(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      return nodes;
    };

    const apply = (nodes: Text[]) => {
      let n = 0;
      nodes.forEach(node => {
        const src = (node.nodeValue || '').trim();
        const out = memo.get(src);
        if (out && out !== src && node.isConnected) {
          originals.current.set(node, node.nodeValue || '');
          produced.current.add(out.trim());
          node.nodeValue = (node.nodeValue || '').replace(src, out);
          n++;
        }
      });
      if (n) setTranslatedCount(c => c + n);
    };

    const run = async () => {
      if (running || stopped) return;
      running = true;
      try {
        const nodes = collect();
        apply(nodes);
        const todo = [...new Set(nodes.map(n => (n.nodeValue || '').trim()).filter(s => s && ARABIC.test(s) && !memo.has(s)))];
        for (let i = 0; i < todo.length && !stopped; i += BATCH) {
          const chunk = todo.slice(i, i + BATCH);
          const { translations } = await translateBatch({ texts: chunk, source: 'ar', target: 'en', tone: 'friendly' });
          // An untranslated result (no engine configured) is remembered too, so we don't retry it on every change
          chunk.forEach((s, j) => memo.set(s, translations[j] || s));
          apply(collect());
        }
        saveCache(memo);
      } catch (e) {
        console.warn('[auto-translate]', e);
      } finally {
        running = false;
      }
    };

    const schedule = () => { if (timer) clearTimeout(timer); timer = setTimeout(run, 500); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();
    return () => { stopped = true; observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [isAr, pathname]);

  if (isAr || !translatedCount || dismissed) return null;
  return (
    <div role="status" className="fixed bottom-5 start-5 z-[9990] flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-3 py-2 text-xs font-bold shadow-xl print:hidden" translate="no">
      <Languages size={14} className="text-[#03CFCB]" aria-hidden />
      Some content on this page was translated automatically.
      <button type="button" onClick={() => setDismissed(true)} className="size-6 rounded-lg hover:bg-white/15 flex items-center justify-center" aria-label="Dismiss"><X size={13} /></button>
    </div>
  );
}
