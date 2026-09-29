'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import {
  ArrowRight, Copy, Eye, Globe, Languages, Layers, LayoutTemplate, Loader2, Monitor, Plus, Redo2,
  Save, Search, Settings2, Smartphone, Tablet, Trash2, Undo2, ChevronUp, ChevronDown, AlertTriangle,
  CheckCircle2, Columns2, Palette, Code2, X, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BlockStyle, BuilderComponent, CustomPage, MenuItem, PageTemplateSettings, SiteConfig } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { BLOCKS, BLOCK_CATEGORIES, BLOCK_MAP, BlockDef } from '@/components/blocks/registry';
import { effectiveStyle } from '@/components/blocks/block-renderer';
import { PageShell } from '@/components/blocks/page-shell';
import { PAGE_PRESETS, makeBlock } from '@/components/blocks/page-presets';
import { FieldEditor, collectBilingualPairs, getPath, setPath } from '@/components/blocks/field-editor';
import { PATTERNS } from '@/lib/identity/tokens';
import { translateBatch } from '@/ai/flows/translate-flow';

type Device = 'desktop' | 'tablet' | 'mobile';
type PreviewLang = 'ar' | 'en' | 'split';
interface Meta { titleAr: string; titleEn: string; slug: string; descriptionAr: string; descriptionEn: string; status: 'draft' | 'published' }
interface Snapshot { components: BuilderComponent[]; meta: Meta; template: PageTemplateSettings }

const DEVICE_WIDTH: Record<Device, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };
const EMPTY_META: Meta = { titleAr: '', titleEn: '', slug: '', descriptionAr: '', descriptionEn: '', status: 'draft' };
const META_FIELDS = [{ key: 'title', labelAr: 'عنوان الصفحة', labelEn: 'Page title', type: 'bi' as const }, { key: 'description', labelAr: 'وصف الصفحة (يظهر تحت العنوان ولمحركات البحث)', labelEn: 'Description (under the title and for search engines)', type: 'bitext' as const }];

const newId = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function PageBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  // Deep links from the identity board: /pagebuild?preset=service or ?block=hero
  const presetParam = searchParams.get('preset');
  const blockParam = searchParams.get('block');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ─── Document state with undo/redo ───
  const [doc, setDoc] = useState<Snapshot>({ components: [], meta: EMPTY_META, template: {} });
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [, force] = useState(0);
  // Rapid edits with the same key (typing in one block) collapse into a single undo step
  const lastEdit = useRef<{ key?: string; at: number }>({ at: 0 });
  const commit = useCallback((updater: (d: Snapshot) => Snapshot, key?: string) => {
    setDoc(prev => {
      const next = updater(prev);
      if (next === prev) return prev;
      const now = Date.now();
      const merge = key && lastEdit.current.key === key && now - lastEdit.current.at < 1200;
      lastEdit.current = { key, at: now };
      if (!merge) past.current = [...past.current.slice(-60), prev];
      future.current = [];
      return next;
    });
    force(n => n + 1);
  }, []);
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setDoc(cur => { future.current.push(cur); return prev; });
    force(n => n + 1);
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setDoc(cur => { past.current.push(cur); return next; });
    force(n => n + 1);
  }, []);

  const { components, meta, template } = doc;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdx = components.findIndex(c => c.id === selectedId);
  const selected = selectedIdx >= 0 ? components[selectedIdx] : null;

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState<null | 'draft' | 'published'>(null);
  const [translating, setTranslating] = useState(false);
  const [device, setDevice] = useState<Device>('desktop');
  const [previewLang, setPreviewLang] = useState<PreviewLang>(isAr ? 'ar' : 'en');
  const [leftTab, setLeftTab] = useState<'blocks' | 'pages' | 'layers'>('blocks');
  const [blockQuery, setBlockQuery] = useState('');
  const [allPages, setAllPages] = useState<CustomPage[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showPresets, setShowPresets] = useState(!editId);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchBin().then(data => {
      setAllPages(data.customPages || []);
      setSiteConfig(data.siteConfig || null);
      setMenuItems(data.menuItems || []);
      if (!editId) return;
      const page: CustomPage | undefined = (data.customPages || []).find((p: CustomPage) => p.id === editId);
      if (page) {
        setDoc({
          components: page.components || [],
          meta: { titleAr: page.titleAr || '', titleEn: page.titleEn || '', slug: page.slug || '', descriptionAr: page.descriptionAr || '', descriptionEn: page.descriptionEn || '', status: page.status || 'published' },
          template: page.template || {},
        });
        setShowPresets(false);
      }
    }).finally(() => setLoading(false));
  }, [editId]);

  useEffect(() => { if (past.current.length) setDirty(true); }, [doc]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ─── Block operations ───
  const updateBlock = (id: string, patch: Partial<BuilderComponent>) =>
    commit(d => ({ ...d, components: d.components.map(c => (c.id === id ? { ...c, ...patch } : c)) }), `block:${id}`);
  const addBlock = (type: BuilderComponent['type']) => {
    const block = makeBlock(type);
    commit(d => {
      const at = selectedIdx >= 0 ? selectedIdx + 1 : d.components.length;
      return { ...d, components: [...d.components.slice(0, at), block, ...d.components.slice(at)] };
    });
    setSelectedId(block.id);
  };
  const moveBlock = (id: string, dir: -1 | 1) => commit(d => {
    const i = d.components.findIndex(c => c.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= d.components.length) return d;
    const next = [...d.components]; [next[i], next[j]] = [next[j], next[i]];
    return { ...d, components: next };
  });
  const duplicateBlock = (id: string) => {
    const copyId = newId();
    commit(d => {
      const i = d.components.findIndex(c => c.id === id);
      if (i < 0) return d;
      const copy = { ...JSON.parse(JSON.stringify(d.components[i])), id: copyId };
      return { ...d, components: [...d.components.slice(0, i + 1), copy, ...d.components.slice(i + 1)] };
    });
    setSelectedId(copyId);
  };
  const removeBlock = (id: string) => {
    commit(d => ({ ...d, components: d.components.filter(c => c.id !== id) }));
    setSelectedId(null);
  };
  const applyPreset = (presetId: string) => {
    const preset = PAGE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    commit(d => ({ ...d, components: preset.build(), template: { ...d.template, ...(preset.template || {}) }, meta: { ...d.meta, titleAr: d.meta.titleAr || preset.labelAr, titleEn: d.meta.titleEn || preset.labelEn } }));
    setShowPresets(false);
    setSelectedId(null);
  };
  const deepLinked = useRef(false);
  useEffect(() => {
    if (editId || loading || deepLinked.current) return;
    deepLinked.current = true;
    if (presetParam && PAGE_PRESETS.some(p => p.id === presetParam)) applyPreset(presetParam);
    else if (blockParam && BLOCK_MAP[blockParam]) { addBlock(blockParam as BuilderComponent['type']); setShowPresets(false); }
  }, [editId, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const setMeta = (patch: Partial<Meta>) => commit(d => ({ ...d, meta: { ...d.meta, ...patch } }), 'meta');
  const setTemplate = (patch: Partial<PageTemplateSettings>) => commit(d => ({ ...d, template: { ...d.template, ...patch } }));

  // ─── Translation coverage ───
  const pairs = useMemo(() => {
    const out: { get: () => { ar: string; en: string }; set: (d: Snapshot, lang: 'ar' | 'en', v: string) => Snapshot }[] = [];
    (['title', 'description'] as const).forEach(k => out.push({
      get: () => ({ ar: meta[`${k}Ar`], en: meta[`${k}En`] }),
      set: (d, lang, v) => ({ ...d, meta: { ...d.meta, [`${k}${lang === 'ar' ? 'Ar' : 'En'}`]: v } }),
    }));
    components.forEach(block => {
      const def = BLOCK_MAP[block.type];
      if (!def) return;
      collectBilingualPairs(def.fields, block.content).forEach(p => out.push({
        get: () => ({ ar: getPath(block.content, p.ar) ?? '', en: getPath(block.content, p.en) ?? '' }),
        set: (d, lang, v) => ({ ...d, components: d.components.map(c => (c.id === block.id ? { ...c, content: setPath(c.content, lang === 'ar' ? p.ar : p.en, v) } : c)) }),
      }));
    });
    return out;
  }, [components, meta]);
  const filled = pairs.map(p => p.get()).filter(v => v.ar?.trim() || v.en?.trim());
  const missingEn = pairs.filter(p => { const v = p.get(); return v.ar?.trim() && !v.en?.trim(); });
  const missingAr = pairs.filter(p => { const v = p.get(); return v.en?.trim() && !v.ar?.trim(); });
  const coverage = filled.length ? Math.round(((filled.length - missingEn.length - missingAr.length) / filled.length) * 100) : 100;

  const translateMissing = async () => {
    setTranslating(true);
    try {
      let next = doc;
      for (const [list, source, target] of [[missingEn, 'ar', 'en'], [missingAr, 'en', 'ar']] as const) {
        if (!list.length) continue;
        const { translations, translated } = await translateBatch({ texts: list.map(p => p.get()[source]), source, target });
        if (!translated.some(Boolean)) throw new Error('not translated');
        list.forEach((p, i) => { if (translated[i]) next = p.set(next, target, translations[i]); });
      }
      commit(() => next);
      toast({ title: t(`تمت ترجمة ${missingEn.length + missingAr.length} نصاً`, `Translated ${missingEn.length + missingAr.length} texts`) });
    } catch {
      toast({ variant: 'destructive', title: t('تعذرت الترجمة الآلية', 'Machine translation failed'), description: t('لا يوجد محرك ترجمة مفعّل أو لم تنجح الترجمة. راجع إعداد OPEN_LLM_URL في ملف ‎.env', 'No translation engine is set up, or it did not return a translation. See OPEN_LLM_URL in .env.') });
    } finally { setTranslating(false); }
  };

  // ─── Quality checks (publishing gate + author guidance) ───
  const slugTaken = allPages.some(p => p.slug === meta.slug && p.id !== editId);
  const issues = useMemo(() => {
    const out: { level: 'error' | 'warn'; msg: string; blockId?: string }[] = [];
    if (!meta.titleAr.trim()) out.push({ level: 'error', msg: t('عنوان الصفحة بالعربي مطلوب', 'Arabic page title is required') });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) out.push({ level: 'error', msg: t('الرابط يجب أن يكون أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط', 'Slug must be lowercase letters, numbers and hyphens') });
    if (slugTaken) out.push({ level: 'error', msg: t('الرابط مستخدم في صفحة أخرى', 'Slug is used by another page') });
    components.forEach(b => {
      const name = t(BLOCK_MAP[b.type]?.labelAr || b.type, BLOCK_MAP[b.type]?.labelEn || b.type);
      if (b.type === 'image' && (!b.content?.altAr?.trim() || !b.content?.altEn?.trim())) out.push({ level: 'warn', msg: t(`${name}: النص البديل ناقص (مطلوب للنفاذ الرقمي)`, `${name}: missing alt text (needed for accessibility)`), blockId: b.id });
      if (b.type === 'video' && !b.content?.titleAr?.trim()) out.push({ level: 'warn', msg: t(`${name}: أضف عنواناً للقارئ الصوتي`, `${name}: add a title for screen readers`), blockId: b.id });
      const links = JSON.stringify(b.content || {}).match(/"(url|ctaUrl|cta2Url)":"#?"/g);
      if (links) out.push({ level: 'warn', msg: t(`${name}: يحتوي رابطاً فارغاً`, `${name}: has an empty link`), blockId: b.id });
    });
    const anchors = components.map(c => c.style?.anchor).filter(Boolean);
    if (new Set(anchors).size !== anchors.length) out.push({ level: 'warn', msg: t('يوجد معرّف مرساة مكرر', 'Duplicate anchor ids') });
    if (missingEn.length) out.push({ level: 'warn', msg: t(`${missingEn.length} نص بلا ترجمة إنجليزية`, `${missingEn.length} texts lack English`) });
    if (missingAr.length) out.push({ level: 'warn', msg: t(`${missingAr.length} نص بلا ترجمة عربية`, `${missingAr.length} texts lack Arabic`) });
    return out;
  }, [meta, components, slugTaken, missingEn.length, missingAr.length, isAr]);
  const errors = issues.filter(i => i.level === 'error');

  // ─── Save ───
  const save = async (status: 'draft' | 'published') => {
    if (errors.length) {
      toast({ variant: 'destructive', title: t('لا يمكن الحفظ', 'Cannot save'), description: errors[0].msg });
      setSelectedId(null);
      return;
    }
    setSaving(status);
    try {
      const data = await fetchBin();
      const existing: CustomPage | undefined = (data.customPages || []).find((p: CustomPage) => p.id === editId);
      const page: CustomPage = {
        id: editId || `page_${Date.now()}`,
        ...meta, status, template, components,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await updateBin({ ...data, customPages: [...(data.customPages || []).filter((p: CustomPage) => p.id !== page.id), page] });
      setDirty(false);
      toast({ title: status === 'published' ? t('تم نشر الصفحة', 'Page published') : t('تم حفظ المسودة', 'Draft saved') });
      if (!editId) router.replace(`/pagebuild?id=${page.id}`);
    } catch {
      toast({ variant: 'destructive', title: t('فشل الحفظ', 'Save failed') });
    } finally { setSaving(null); }
  };

  const saveTemplateAsDefault = async () => {
    try {
      const data = await fetchBin();
      await updateBin({ ...data, siteConfig: { ...(data.siteConfig || {}), template } });
      setSiteConfig({ ...(data.siteConfig || {}), template });
      toast({ title: t('أصبح هذا القالب الافتراضي لكل الصفحات', 'Now the default template for all pages') });
    } catch { toast({ variant: 'destructive', title: t('فشل الحفظ', 'Save failed') }); }
  };

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save('draft'); return; }
      if (typing) return;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (selectedId && mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateBlock(selectedId); }
      else if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); removeBlock(selectedId); }
      else if (selectedId && e.altKey && e.key === 'ArrowUp') { e.preventDefault(); moveBlock(selectedId, -1); }
      else if (selectedId && e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveBlock(selectedId, 1); }
      else if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const effectiveTemplate: PageTemplateSettings = { ...(siteConfig?.template || {}), ...template };
  const filteredBlocks = BLOCKS.filter(b => !blockQuery || `${b.labelAr} ${b.labelEn} ${b.descAr} ${b.descEn}`.toLowerCase().includes(blockQuery.toLowerCase()));

  if (loading) return <div className="h-screen flex items-center justify-center bg-white" role="status"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  // ─── Canvas ───
  const renderCanvas = (lang: 'ar' | 'en', interactive: boolean) => {
    const pageIsAr = lang === 'ar';
    return (
      <div dir={pageIsAr ? 'rtl' : 'ltr'} lang={lang} className="bg-slate-50 flex flex-col min-h-full">
        <div className="pointer-events-none select-none" aria-hidden>
          <PortalHeader menuItems={menuItems} variant={effectiveTemplate.header} showTicker={effectiveTemplate.showTicker} showTopBar={effectiveTemplate.showTopBar} sticky={false} />
        </div>
        <PageShell
          page={{ ...meta, components }}
          template={effectiveTemplate}
          isAr={pageIsAr}
          animate={false}
          mobile={device === 'mobile'}
          wrapBlock={interactive ? (block, i, node) => (
            <BlockChrome
              key={block.id}
              block={block}
              selected={block.id === selectedId}
              isAr={isAr}
              first={i === 0}
              last={i === components.length - 1}
              onSelect={() => setSelectedId(block.id)}
              onMove={dir => moveBlock(block.id, dir)}
              onDuplicate={() => duplicateBlock(block.id)}
              onDelete={() => removeBlock(block.id)}
            >{node}</BlockChrome>
          ) : undefined}
          after={interactive && (
            <button type="button" onClick={() => { setSelectedId(null); setLeftTab('blocks'); }} className="mt-8 w-full h-28 rounded-3xl border-2 border-dashed border-slate-300 text-slate-400 font-black flex items-center justify-center gap-2 hover:border-[#03CFCB] hover:text-[#008E91] transition-colors">
              <Plus size={20} />{t('أضف عنصراً من المكتبة', 'Add a block from the library')}
            </button>
          )}
        />
        <div className="pointer-events-none select-none" aria-hidden><PortalFooter siteConfig={siteConfig} variant={effectiveTemplate.footer} /></div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ─── Top bar ─── */}
      <header className="bg-slate-950 text-white h-16 px-4 flex items-center gap-3 shrink-0 z-30">
        <Button variant="ghost" size="icon" asChild className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"><Link href="/edmPortal" aria-label={t('رجوع', 'Back')}><ArrowRight className={cn(!isAr && 'rotate-180')} size={18} /></Link></Button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-9 rounded-xl bg-[#03CFCB] text-slate-900 flex items-center justify-center shrink-0"><LayoutTemplate size={18} /></span>
          <div className="min-w-0">
            <p className="text-sm font-black truncate">{(isAr ? meta.titleAr : meta.titleEn || meta.titleAr) || t('صفحة جديدة', 'New page')}</p>
            <p className="text-[10px] font-mono text-white/40 truncate" dir="ltr">/p/{meta.slug || '…'} · {meta.status === 'draft' ? t('مسودة', 'draft') : t('منشورة', 'published')}{dirty && ' · ' + t('تغييرات غير محفوظة', 'unsaved')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 ms-4">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!past.current.length} className="text-white/70 hover:bg-white/10 rounded-xl" aria-label={t('تراجع (Ctrl+Z)', 'Undo (Ctrl+Z)')} title="Ctrl+Z"><Undo2 size={17} /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!future.current.length} className="text-white/70 hover:bg-white/10 rounded-xl" aria-label={t('إعادة (Ctrl+Shift+Z)', 'Redo (Ctrl+Shift+Z)')} title="Ctrl+Shift+Z"><Redo2 size={17} /></Button>
        </div>

        <div className="mx-auto flex items-center gap-2">
          <Segmented value={device} onChange={v => setDevice(v as Device)} label={t('الجهاز', 'Device')} options={[
            { value: 'desktop', icon: <Monitor size={15} />, label: t('حاسوب', 'Desktop') },
            { value: 'tablet', icon: <Tablet size={15} />, label: t('لوحي', 'Tablet') },
            { value: 'mobile', icon: <Smartphone size={15} />, label: t('جوال', 'Mobile') },
          ]} />
          <Segmented value={previewLang} onChange={v => setPreviewLang(v as PreviewLang)} label={t('لغة المعاينة', 'Preview language')} options={[
            { value: 'ar', label: 'ع' }, { value: 'en', label: 'EN' }, { value: 'split', icon: <Columns2 size={15} />, label: t('جنباً إلى جنب', 'Side by side') },
          ]} />
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={translateMissing} disabled={translating || (!missingEn.length && !missingAr.length)} title={t('ترجمة كل النصوص الناقصة', 'Translate all missing texts')}
            className="hidden lg:flex items-center gap-2 h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-60 text-start">
            {translating ? <Loader2 size={15} className="animate-spin text-[#03CFCB]" /> : <Languages size={15} className="text-[#03CFCB]" />}
            <span className="w-24">
              <span className="flex justify-between text-[10px] font-black"><span>{t('الترجمة', 'Translation')}</span><span>{coverage}%</span></span>
              <Progress value={coverage} className="h-1 mt-1 bg-white/10" />
            </span>
          </button>
          {editId && meta.status === 'published' && <Button variant="ghost" size="icon" asChild className="text-white/70 hover:bg-white/10 rounded-xl"><a href={`/p/${meta.slug}`} target="_blank" rel="noreferrer" aria-label={t('فتح الصفحة المنشورة', 'Open live page')}><ExternalLink size={17} /></a></Button>}
          <Button variant="ghost" onClick={() => save('draft')} disabled={!!saving} className="text-white hover:bg-white/10 rounded-xl font-black gap-2 h-10">
            {saving === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{t('مسودة', 'Draft')}
          </Button>
          <Button onClick={() => save('published')} disabled={!!saving} className="dm-gradient-primary text-slate-900 rounded-xl font-black gap-2 h-10 px-5">
            {saving === 'published' ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}{t('نشر', 'Publish')}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ─── Library ─── */}
        <aside className="w-72 bg-white border-e flex flex-col shrink-0" aria-label={t('المكتبة', 'Library')}>
          <Tabs value={leftTab} onValueChange={v => setLeftTab(v as typeof leftTab)} className="flex flex-col min-h-0 flex-1">
            <TabsList className="m-3 grid grid-cols-3 rounded-xl">
              <TabsTrigger value="blocks" className="text-xs font-black rounded-lg">{t('العناصر', 'Blocks')}</TabsTrigger>
              <TabsTrigger value="pages" className="text-xs font-black rounded-lg">{t('قوالب', 'Pages')}</TabsTrigger>
              <TabsTrigger value="layers" className="text-xs font-black rounded-lg">{t('الطبقات', 'Layers')}</TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="flex-1 overflow-y-auto px-3 pb-6 mt-0 space-y-5">
              <div className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={blockQuery} onChange={e => setBlockQuery(e.target.value)} placeholder={t('ابحث عن عنصر…', 'Search blocks…')} className="h-9 ps-9 rounded-xl text-sm" />
              </div>
              {BLOCK_CATEGORIES.map(cat => {
                const list = filteredBlocks.filter(b => b.category === cat.id);
                if (!list.length) return null;
                return (
                  <section key={cat.id}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t(cat.labelAr, cat.labelEn)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {list.map(b => <LibraryTile key={b.type} def={b} isAr={isAr} onAdd={() => addBlock(b.type)} />)}
                    </div>
                  </section>
                );
              })}
            </TabsContent>

            <TabsContent value="pages" className="flex-1 overflow-y-auto px-3 pb-6 mt-0 space-y-2">
              <p className="text-xs font-bold text-slate-500 px-1">{t('يستبدل محتوى الصفحة الحالي (يمكن التراجع).', 'Replaces the current content (undo-able).')}</p>
              {PAGE_PRESETS.map(p => <PresetTile key={p.id} preset={p} isAr={isAr} onPick={() => applyPreset(p.id)} />)}
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-y-auto px-3 pb-6 mt-0">
              {!components.length && <p className="text-xs text-slate-400 font-bold p-2">{t('لا توجد عناصر بعد.', 'No blocks yet.')}</p>}
              <ol className="space-y-1">
                {components.map((c, i) => {
                  const def = BLOCK_MAP[c.type];
                  const Icon = def?.icon || Layers;
                  const preview = c.content?.titleAr || c.content?.textAr || c.content?.bodyAr || '';
                  return (
                    <li key={c.id}>
                      <div className={cn('flex items-center gap-2 rounded-xl px-2 py-1.5 border', c.id === selectedId ? 'bg-[#03CFCB]/10 border-[#03CFCB]' : 'border-transparent hover:bg-slate-50')}>
                        <button type="button" onClick={() => setSelectedId(c.id)} className="flex-1 flex items-center gap-2 min-w-0 text-start">
                          <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}</span>
                          <Icon size={14} className="text-[#008E91] shrink-0" />
                          <span className="min-w-0"><span className="block text-xs font-black truncate">{t(def?.labelAr || c.type, def?.labelEn || c.type)}</span>{preview && <span className="block text-[10px] text-slate-400 truncate">{String(preview)}</span>}</span>
                        </button>
                        <button type="button" onClick={() => moveBlock(c.id, -1)} className="text-slate-400 hover:text-slate-700" aria-label={t('لأعلى', 'Up')}><ChevronUp size={14} /></button>
                        <button type="button" onClick={() => moveBlock(c.id, 1)} className="text-slate-400 hover:text-slate-700" aria-label={t('لأسفل', 'Down')}><ChevronDown size={14} /></button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </TabsContent>
          </Tabs>
        </aside>

        {/* ─── Canvas ─── */}
        <div className="flex-1 min-w-0 overflow-auto p-6" onClick={e => { if (e.target === e.currentTarget) setSelectedId(null); }}>
          {showPresets && !components.length ? (
            <div className="max-w-4xl mx-auto py-10 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-secondary">{t('ابدأ صفحتك', 'Start your page')}</h1>
                <p className="text-slate-500 font-bold">{t('اختر قالباً جاهزاً مبنياً من عناصر الهوية، أو ابدأ بصفحة فارغة.', 'Pick a ready page built from identity blocks, or start blank.')}</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PAGE_PRESETS.map(p => <PresetTile key={p.id} preset={p} isAr={isAr} large onPick={() => applyPreset(p.id)} />)}
              </div>
            </div>
          ) : previewLang === 'split' ? (
            <div className="grid grid-cols-2 gap-4 min-w-[1100px]">
              {(['ar', 'en'] as const).map(l => (
                <div key={l} className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-center py-1.5 bg-slate-900 text-white">{l === 'ar' ? 'العربية' : 'English'}</p>
                  {renderCanvas(l, false)}
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-white transition-[width] duration-300" style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}>
              {renderCanvas(previewLang, true)}
            </div>
          )}
        </div>

        {/* ─── Inspector ─── */}
        <aside className="w-[360px] bg-white border-s flex flex-col shrink-0" aria-label={t('الخصائص', 'Inspector')}>
          {selected ? (
            <BlockInspector
              key={selected.id}
              block={selected}
              isAr={isAr}
              onChange={patch => updateBlock(selected.id, patch)}
              onClose={() => setSelectedId(null)}
              onDelete={() => removeBlock(selected.id)}
              onDuplicate={() => duplicateBlock(selected.id)}
            />
          ) : (
            <PageInspector
              meta={meta}
              template={template}
              siteTemplate={siteConfig?.template}
              isAr={isAr}
              issues={issues}
              slugTaken={slugTaken}
              onMeta={setMeta}
              onTemplate={setTemplate}
              onSaveDefault={saveTemplateAsDefault}
              onJumpTo={id => setSelectedId(id)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Pieces ───

function Segmented({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; icon?: React.ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex bg-white/5 rounded-xl p-1">
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} title={o.label} onClick={() => onChange(o.value)}
          className={cn('h-8 min-w-8 px-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors', value === o.value ? 'bg-[#03CFCB] text-slate-900' : 'text-white/60 hover:text-white')}>
          {o.icon ?? o.label}
        </button>
      ))}
    </div>
  );
}

function LibraryTile({ def, isAr, onAdd }: { def: BlockDef; isAr: boolean; onAdd: () => void }) {
  return (
    <button type="button" onClick={onAdd} title={isAr ? def.descAr : def.descEn}
      className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-[#03CFCB] hover:shadow-md transition-all text-center">
      <span className="size-9 rounded-xl bg-white text-[#008E91] flex items-center justify-center shadow-sm group-hover:bg-[#03CFCB] group-hover:text-slate-900 transition-colors"><def.icon size={18} /></span>
      <span className="text-[11px] font-black text-slate-700 leading-tight">{isAr ? def.labelAr : def.labelEn}</span>
    </button>
  );
}

function PresetTile({ preset, isAr, onPick, large }: { preset: (typeof PAGE_PRESETS)[number]; isAr: boolean; onPick: () => void; large?: boolean }) {
  const Icon = (Icons as any)[preset.icon] || Icons.File;
  const blocks = preset.build();
  return (
    <button type="button" onClick={onPick} className={cn('w-full text-start rounded-2xl border bg-white hover:border-[#03CFCB] hover:shadow-lg transition-all', large ? 'p-5' : 'p-3')}>
      <div className="flex items-center gap-3">
        <span className={cn('rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0', large ? 'size-12' : 'size-9')}><Icon size={large ? 22 : 16} /></span>
        <div className="min-w-0"><p className="font-black text-sm">{isAr ? preset.labelAr : preset.labelEn}</p><p className="text-[11px] font-bold text-slate-400">{isAr ? preset.descAr : preset.descEn}</p></div>
      </div>
      {large && blocks.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {blocks.map(b => <Badge key={b.id} variant="secondary" className="text-[9px] font-bold">{isAr ? BLOCK_MAP[b.type]?.labelAr : BLOCK_MAP[b.type]?.labelEn}</Badge>)}
        </div>
      )}
    </button>
  );
}

function BlockChrome({ block, selected, isAr, first, last, onSelect, onMove, onDuplicate, onDelete, children }: {
  block: BuilderComponent; selected: boolean; isAr: boolean; first: boolean; last: boolean;
  onSelect: () => void; onMove: (d: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void; children: React.ReactNode;
}) {
  const def = BLOCK_MAP[block.type];
  const t = (ar: string, en: string) => (isAr ? ar : en);
  return (
    <div
      role="button" tabIndex={0} aria-pressed={selected} aria-label={t(def?.labelAr || block.type, def?.labelEn || block.type)}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) onSelect(); }}
      className={cn('relative group/chrome h-full rounded-[2.6rem] outline-none cursor-pointer transition-shadow', selected ? 'ring-2 ring-[#03CFCB] ring-offset-4' : 'hover:ring-2 hover:ring-[#03CFCB]/40 hover:ring-offset-4 focus-visible:ring-2 focus-visible:ring-[#03CFCB] focus-visible:ring-offset-4')}
    >
      <div className={cn('absolute -top-4 start-6 z-20 flex items-center gap-0.5 rounded-xl bg-slate-900 text-white shadow-xl px-1 py-0.5 transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover/chrome:opacity-100 group-focus-within/chrome:opacity-100')}>
        <span className="px-2 text-[10px] font-black text-[#03CFCB]">{t(def?.labelAr || block.type, def?.labelEn || block.type)}</span>
        <ChromeBtn label={t('لأعلى', 'Move up')} disabled={first} onClick={() => onMove(-1)}><ChevronUp size={13} /></ChromeBtn>
        <ChromeBtn label={t('لأسفل', 'Move down')} disabled={last} onClick={() => onMove(1)}><ChevronDown size={13} /></ChromeBtn>
        <ChromeBtn label={t('تكرار', 'Duplicate')} onClick={onDuplicate}><Copy size={13} /></ChromeBtn>
        <ChromeBtn label={t('حذف', 'Delete')} onClick={onDelete} danger><Trash2 size={13} /></ChromeBtn>
      </div>
      <div className="pointer-events-none h-full">{children}</div>
    </div>
  );
}

const ChromeBtn = ({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) => (
  <button type="button" aria-label={label} title={label} disabled={disabled} onClick={e => { e.stopPropagation(); onClick(); }}
    className={cn('size-7 rounded-lg flex items-center justify-center disabled:opacity-30', danger ? 'hover:bg-red-500' : 'hover:bg-white/15')}>{children}</button>
);

const BG_SWATCHES: { value: NonNullable<BlockStyle['background']>; cls: string; ar: string; en: string }[] = [
  { value: 'none', cls: 'bg-[repeating-conic-gradient(#e2e8f0_0_25%,white_0_50%)] bg-[length:10px_10px]', ar: 'بدون', en: 'None' },
  { value: 'white', cls: 'bg-white', ar: 'أبيض', en: 'White' },
  { value: 'soft', cls: 'bg-[#F3F7FB]', ar: 'رمادي فاتح', en: 'Soft' },
  { value: 'teal', cls: 'bg-[#E6FAFA]', ar: 'تيل فاتح', en: 'Teal tint' },
  { value: 'purple', cls: 'bg-[#F3EEF7]', ar: 'أرجواني فاتح', en: 'Purple tint' },
  { value: 'dark', cls: 'bg-slate-950', ar: 'داكن', en: 'Dark' },
  { value: 'gradient', cls: 'bg-gradient-to-br from-[#470D67] to-[#2a0640]', ar: 'ملكي متدرج', en: 'Royal gradient' },
];

function OptionRow<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-black text-slate-500">{label}</Label>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {options.map(o => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
            className={cn('h-8 px-3 rounded-lg text-xs font-bold border transition-colors', value === o.value ? 'bg-secondary text-white border-secondary' : 'bg-white border-slate-200 text-slate-600 hover:border-secondary/40')}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function BlockInspector({ block, isAr, onChange, onClose, onDelete, onDuplicate }: { block: BuilderComponent; isAr: boolean; onChange: (patch: Partial<BuilderComponent>) => void; onClose: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const def = BLOCK_MAP[block.type];
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const style = effectiveStyle(block);
  const setStyle = (patch: Partial<BlockStyle>) => onChange({ style: { ...(block.style || {}), ...patch } });
  const [json, setJson] = useState(() => JSON.stringify(block.content, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const Icon = def?.icon || Settings2;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="p-4 border-b flex items-center gap-3">
        <span className="size-10 rounded-xl bg-[#03CFCB]/15 text-[#008E91] flex items-center justify-center"><Icon size={18} /></span>
        <div className="flex-1 min-w-0"><p className="font-black text-sm">{t(def?.labelAr || block.type, def?.labelEn || block.type)}</p><p className="text-[11px] text-slate-400 font-bold truncate">{t(def?.descAr || '', def?.descEn || '')}</p></div>
        <Button variant="ghost" size="icon" onClick={onDuplicate} aria-label={t('تكرار', 'Duplicate')} className="rounded-xl"><Copy size={15} /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label={t('حذف', 'Delete')} className="rounded-xl text-red-500"><Trash2 size={15} /></Button>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('إغلاق', 'Close')} className="rounded-xl"><X size={15} /></Button>
      </div>
      <Tabs defaultValue="content" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-4 mt-3 grid grid-cols-3 rounded-xl">
          <TabsTrigger value="content" className="text-xs font-black gap-1 rounded-lg"><Settings2 size={12} />{t('المحتوى', 'Content')}</TabsTrigger>
          <TabsTrigger value="style" className="text-xs font-black gap-1 rounded-lg"><Palette size={12} />{t('التصميم', 'Style')}</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs font-black gap-1 rounded-lg"><Code2 size={12} />{t('متقدم', 'Advanced')}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex-1 overflow-y-auto p-4 mt-0">
          {def ? <FieldEditor fields={def.fields} value={block.content || {}} onChange={content => onChange({ content })} isAr={isAr} /> : <p className="text-xs text-slate-400">{t('نوع قديم؛ عدّل من تبويب متقدم.', 'Legacy type; edit it under Advanced.')}</p>}
        </TabsContent>

        <TabsContent value="style" className="flex-1 overflow-y-auto p-4 mt-0 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-slate-500">{t('الخلفية (ألوان الهوية فقط)', 'Background (identity colors only)')}</Label>
            <div role="radiogroup" className="grid grid-cols-7 gap-1.5">
              {BG_SWATCHES.map(s => (
                <button key={s.value} type="button" role="radio" aria-checked={style.background === s.value || (!style.background && s.value === 'none')} aria-label={t(s.ar, s.en)} title={t(s.ar, s.en)} onClick={() => setStyle({ background: s.value })}
                  className={cn('aspect-square rounded-lg border-2', s.cls, (style.background || 'none') === s.value ? 'border-[#03CFCB] ring-2 ring-[#03CFCB]/40' : 'border-slate-200')} />
              ))}
            </div>
          </div>
          <OptionRow label={t('النمط الزخرفي', 'Pattern')} value={style.pattern || 'none'} onChange={v => setStyle({ pattern: v })}
            options={[{ value: 'none', label: t('بدون', 'None') }, ...PATTERNS.map(p => ({ value: p.id as NonNullable<BlockStyle['pattern']>, label: t(p.nameAr, p.nameEn) }))]} />
          <OptionRow label={t('العرض على الشبكة', 'Width on the grid')} value={String(block.gridSpan || 12) as string} onChange={v => onChange({ gridSpan: Number(v) })}
            options={[{ value: '3', label: '¼' }, { value: '4', label: '⅓' }, { value: '6', label: '½' }, { value: '8', label: '⅔' }, { value: '9', label: '¾' }, { value: '12', label: t('كامل', 'Full') }]} />
          <OptionRow label={t('الحشو الداخلي', 'Padding')} value={style.padding || 'md'} onChange={v => setStyle({ padding: v })}
            options={[{ value: 'none', label: '0' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' }]} />
          <OptionRow label={t('المحاذاة', 'Alignment')} value={style.align || 'start'} onChange={v => setStyle({ align: v })}
            options={[{ value: 'start', label: t('بداية السطر', 'Start') }, { value: 'center', label: t('وسط', 'Center') }]} />
          <OptionRow label={t('استدارة الزوايا', 'Corner radius')} value={style.radius || 'xl'} onChange={v => setStyle({ radius: v })}
            options={[{ value: 'none', label: t('بدون', 'None') }, { value: 'md', label: t('متوسطة', 'Medium') }, { value: 'xl', label: t('واسعة', 'Large') }]} />
          <OptionRow label={t('أقل ارتفاع', 'Minimum height')} value={block.gridHeight || 'auto'} onChange={v => onChange({ gridHeight: v })}
            options={[{ value: 'auto', label: t('تلقائي', 'Auto') }, { value: 'sm', label: '200' }, { value: 'md', label: '400' }, { value: 'lg', label: '600' }, { value: 'full', label: t('شاشة', 'Screen') }]} />
          <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
            {([['shadow', t('ظل', 'Shadow')], ['animate', t('حركة عند الظهور', 'Reveal animation')], ['hideOnMobile', t('إخفاء على الجوال', 'Hide on mobile')]] as const).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between text-xs font-bold">{label}<Switch checked={k === 'animate' ? style.animate !== false : !!style[k]} onCheckedChange={v => setStyle({ [k]: v })} /></label>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-4 mt-0 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-slate-500">{t('معرّف المرساة (للروابط الداخلية #)', 'Anchor id (for #links)')}</Label>
            <Input dir="ltr" value={block.style?.anchor || ''} onChange={e => setStyle({ anchor: e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase() })} placeholder="section-id" className="h-9 rounded-xl font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-slate-500">{t('CSS خاص بهذا العنصر — استخدم & للإشارة إليه', 'CSS for this block — use & to target it')}</Label>
            <Textarea dir="ltr" spellCheck={false} value={block.customCss || ''} onChange={e => onChange({ customCss: e.target.value })} placeholder="& h2 { letter-spacing: -0.02em; }" className="font-mono text-xs min-h-[140px] rounded-xl bg-slate-950 text-sky-300" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-slate-500">{t('البيانات (JSON)', 'Data (JSON)')}</Label>
            <Textarea dir="ltr" spellCheck={false} value={json} onChange={e => {
              setJson(e.target.value);
              try { onChange({ content: JSON.parse(e.target.value) }); setJsonError(null); } catch (err) { setJsonError((err as Error).message); }
            }} className="font-mono text-[11px] min-h-[220px] rounded-xl bg-slate-950 text-emerald-300" />
            {jsonError && <p className="text-[11px] font-bold text-red-600" dir="ltr">{jsonError}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PageInspector({ meta, template, siteTemplate, isAr, issues, slugTaken, onMeta, onTemplate, onSaveDefault, onJumpTo }: {
  meta: Meta; template: PageTemplateSettings; siteTemplate?: PageTemplateSettings; isAr: boolean;
  issues: { level: 'error' | 'warn'; msg: string; blockId?: string }[]; slugTaken: boolean;
  onMeta: (p: Partial<Meta>) => void; onTemplate: (p: Partial<PageTemplateSettings>) => void; onSaveDefault: () => void; onJumpTo: (id: string) => void;
}) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const eff = { ...(siteTemplate || {}), ...template };
  return (
    <Tabs defaultValue="page" className="flex flex-col flex-1 min-h-0">
      <TabsList className="mx-4 mt-3 grid grid-cols-3 rounded-xl">
        <TabsTrigger value="page" className="text-xs font-black rounded-lg">{t('الصفحة', 'Page')}</TabsTrigger>
        <TabsTrigger value="template" className="text-xs font-black rounded-lg">{t('القالب', 'Template')}</TabsTrigger>
        <TabsTrigger value="quality" className="text-xs font-black rounded-lg gap-1">{t('الجودة', 'Checks')}{issues.length > 0 && <span className={cn('size-4 rounded-full text-[9px] text-white flex items-center justify-center', issues.some(i => i.level === 'error') ? 'bg-red-500' : 'bg-amber-500')}>{issues.length}</span>}</TabsTrigger>
      </TabsList>

      <TabsContent value="page" className="flex-1 overflow-y-auto p-4 mt-0 space-y-5">
        <FieldEditor fields={META_FIELDS} value={meta} onChange={v => onMeta(v as Partial<Meta>)} isAr={isAr} />
        <div className="space-y-1.5">
          <Label htmlFor="slug" className="text-[11px] font-black text-slate-500">{t('رابط الصفحة', 'Page URL')}</Label>
          <div className={cn('flex items-center rounded-xl border px-3 h-10 bg-slate-50 font-mono text-sm', slugTaken && 'border-red-400')} dir="ltr">
            <span className="text-slate-400">/p/</span>
            <input id="slug" value={meta.slug} onChange={e => onMeta({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="flex-1 bg-transparent outline-none" placeholder="my-page" aria-invalid={slugTaken} />
          </div>
          {slugTaken && <p className="text-[11px] font-bold text-red-600">{t('الرابط مستخدم مسبقاً', 'This URL is already used')}</p>}
        </div>
        <p className="text-[11px] font-bold text-slate-400 leading-relaxed">{t('اختصارات: Ctrl+Z تراجع · Ctrl+Shift+Z إعادة · Ctrl+D تكرار · Delete حذف · Alt+↑↓ نقل · Ctrl+S حفظ مسودة · Esc إلغاء التحديد', 'Shortcuts: Ctrl+Z undo · Ctrl+Shift+Z redo · Ctrl+D duplicate · Delete remove · Alt+↑↓ move · Ctrl+S save draft · Esc deselect')}</p>
      </TabsContent>

      <TabsContent value="template" className="flex-1 overflow-y-auto p-4 mt-0 space-y-5">
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{t('إعدادات هذه الصفحة تتجاوز القالب الافتراضي للموقع.', 'These settings override the site default template.')}</p>
        <OptionRow label={t('الترويسة', 'Header')} value={eff.header || 'full'} onChange={v => onTemplate({ header: v })}
          options={[{ value: 'full', label: t('كاملة', 'Full') }, { value: 'compact', label: t('مختصرة', 'Compact') }, { value: 'minimal', label: t('مبسطة', 'Minimal') }, { value: 'none', label: t('بدون', 'None') }]} />
        <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
          <label className="flex items-center justify-between text-xs font-bold">{t('شريط الأخبار', 'News ticker')}<Switch checked={eff.showTicker ?? (eff.header || 'full') === 'full'} onCheckedChange={v => onTemplate({ showTicker: v })} /></label>
          <label className="flex items-center justify-between text-xs font-bold">{t('الشريط العلوي', 'Top bar')}<Switch checked={eff.showTopBar ?? (eff.header || 'full') === 'full'} onCheckedChange={v => onTemplate({ showTopBar: v })} /></label>
          <label className="flex items-center justify-between text-xs font-bold">{t('ترويسة ثابتة عند التمرير', 'Sticky header')}<Switch checked={eff.stickyHeader ?? true} onCheckedChange={v => onTemplate({ stickyHeader: v })} /></label>
        </div>
        <OptionRow label={t('شريط العنوان', 'Title band')} value={eff.titleBand || 'pattern'} onChange={v => onTemplate({ titleBand: v })}
          options={[{ value: 'pattern', label: t('بنمط', 'Pattern') }, { value: 'simple', label: t('بسيط', 'Simple') }, { value: 'dark', label: t('داكن', 'Dark') }, { value: 'none', label: t('بدون', 'None') }]} />
        <label className="flex items-center justify-between text-xs font-bold rounded-2xl bg-slate-50 p-3">{t('مسار التنقل (Breadcrumb)', 'Breadcrumb')}<Switch checked={eff.showBreadcrumb !== false} onCheckedChange={v => onTemplate({ showBreadcrumb: v })} /></label>
        <OptionRow label={t('عرض المحتوى', 'Content width')} value={eff.width || 'wide'} onChange={v => onTemplate({ width: v })}
          options={[{ value: 'narrow', label: t('ضيق', 'Narrow') }, { value: 'normal', label: t('عادي', 'Normal') }, { value: 'wide', label: t('عريض', 'Wide') }, { value: 'full', label: t('كامل', 'Full') }]} />
        <OptionRow label={t('التذييل', 'Footer')} value={eff.footer || 'full'} onChange={v => onTemplate({ footer: v })}
          options={[{ value: 'full', label: t('كامل', 'Full') }, { value: 'compact', label: t('مختصر', 'Compact') }, { value: 'none', label: t('بدون', 'None') }]} />
        <Button variant="outline" onClick={onSaveDefault} className="w-full rounded-xl font-black gap-2"><LayoutTemplate size={15} />{t('اعتماد كقالب افتراضي لكل الصفحات', 'Use as the default for all pages')}</Button>
      </TabsContent>

      <TabsContent value="quality" className="flex-1 overflow-y-auto p-4 mt-0 space-y-2">
        {!issues.length && <p className="flex items-center gap-2 text-sm font-black text-emerald-600 p-3 rounded-xl bg-emerald-50"><CheckCircle2 size={16} />{t('الصفحة جاهزة للنشر', 'Ready to publish')}</p>}
        {issues.map((i, k) => (
          <button key={k} type="button" disabled={!i.blockId} onClick={() => i.blockId && onJumpTo(i.blockId)}
            className={cn('w-full flex items-start gap-2 p-3 rounded-xl text-start text-xs font-bold', i.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800', i.blockId && 'hover:ring-2 hover:ring-current/20')}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />{i.msg}
          </button>
        ))}
      </TabsContent>
    </Tabs>
  );
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <PageBuilderContent />
    </Suspense>
  );
}
