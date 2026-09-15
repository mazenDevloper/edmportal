
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, 
  Type, TrendingUp, Info, Loader2, Sparkles, Eye, 
  Heading1, Video, FileText, List, Minus, Table as TableIcon,
  Code, Database, User, Award, Layers, MousePointer2,
  ChevronUp, ChevronDown, GripVertical, Settings2, Globe
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CustomPage, BuilderComponent } from '@/lib/types';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Helper component for live widget rendering
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

function PageBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const editSlug = searchParams.get('slug');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [pageMeta, setPageMeta] = useState({ titleAr: '', titleEn: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        const data = await fetchBin();
        if (data && data.customPages) {
          const page = data.customPages.find((p: CustomPage) => p.id === editId || p.slug === editSlug);
          if (page) {
            setComponents(page.components || []);
            setPageMeta({ titleAr: page.titleAr || '', titleEn: page.titleEn || '', slug: page.slug || '' });
          } else if (editSlug) {
            setPageMeta(prev => ({ ...prev, slug: editSlug }));
          }
        }
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [editId, editSlug]);

  const handleAiTranslate = async (text: string, targetKey: 'meta' | number) => {
    if (!text) return;
    setAiLoading(targetKey.toString());
    try {
      const { translatedText } = await translateToEnglish({ text });
      if (targetKey === 'meta') {
        setPageMeta({ ...pageMeta, titleEn: translatedText });
      } else {
        const nc = [...components];
        if (nc[targetKey].content.bodyAr) nc[targetKey].content.bodyEn = translatedText;
        if (nc[targetKey].content.textAr) nc[targetKey].content.textEn = translatedText;
        setComponents(nc);
      }
      toast({ title: isAr ? "تمت الترجمة" : "AI Translation Done" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setAiLoading(null);
    }
  };

  const addComponent = (type: BuilderComponent['type']) => {
    const defaultContents: Record<string, any> = {
      heading: { level: 'h2', textAr: 'عنوان جديد', textEn: 'New Heading' },
      text: { bodyAr: 'نص افتراضي هنا...', bodyEn: 'Default text content here...' },
      info: { bodyAr: 'بطاقة معلومات بلدية...', bodyEn: 'Municipal info card content...' },
      stats: { v1: '100+', t1: 'معاملة', v2: '500+', t2: 'مستخدم' },
      pdf: { labelAr: 'تحميل الدليل', labelEn: 'Download Guide', url: '#' },
      avatar: { nameAr: 'ظفار', nameEn: 'Dhofar', src: '' },
      badge: { textAr: 'معتمد', textEn: 'Approved' },
      table: { headers: ['الخدمة', 'الرسوم'], rows: [{ c1: 'تجديد عقد', c2: '15 OMR' }] },
      accordion: { items: [{ titleAr: 'سؤال؟', titleEn: 'Question?', contentAr: 'إجابة', contentEn: 'Answer' }] },
      html: { code: '<div class="p-4 border rounded">HTML Code</div>' }
    };
    setComponents([...components, { id: `c_${Date.now()}`, type, content: defaultContents[type] || {} }]);
  };

  const handleSave = async () => {
    if (!pageMeta.slug) return toast({ variant: "destructive", title: "Slug Required" });
    setSaving(true);
    try {
      const data = await fetchBin();
      const newPage: CustomPage = {
        id: editId || `page_${Date.now()}`,
        titleAr: pageMeta.titleAr,
        titleEn: pageMeta.titleEn,
        slug: pageMeta.slug,
        components,
        createdAt: new Date().toISOString()
      };
      const filtered = (data.customPages || []).filter((p: any) => p.id !== newPage.id);
      await updateBin({ ...data, customPages: [...filtered, newPage] });
      toast({ title: "Success" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Save Error" });
    } finally {
      setSaving(false);
    }
  };

  const moveComponent = (idx: number, dir: 'up' | 'down') => {
    const nc = [...components];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target >= 0 && target < nc.length) {
      [nc[idx], nc[target]] = [nc[target], nc[idx]];
      setComponents(nc);
    }
  };

  const updateComp = (idx: number, updates: any) => {
    const nc = [...components];
    nc[idx].content = { ...nc[idx].content, ...updates };
    setComponents(nc);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-100 flex flex-col", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Components */}
        <aside className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl z-20 border-r border-white/5">
           <div className="p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-widest text-accent">Widgets Matrix</span>
              <Badge variant="outline" className="text-[9px] border-accent/30 text-accent">v4.5</Badge>
           </div>
           <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-2 gap-3">
                 <WidgetBtn icon={<Heading1/>} label="Heading" onClick={() => addComponent('heading')} />
                 <WidgetBtn icon={<Type/>} label="Text" onClick={() => addComponent('text')} />
                 <WidgetBtn icon={<Info/>} label="Card" onClick={() => addComponent('info')} />
                 <WidgetBtn icon={<TableIcon/>} label="Table" onClick={() => addComponent('table')} />
                 <WidgetBtn icon={<TrendingUp/>} label="Stats" onClick={() => addComponent('stats')} />
                 <WidgetBtn icon={<List/>} label="Accordion" onClick={() => addComponent('accordion')} />
                 <WidgetBtn icon={<FileText/>} label="PDF" onClick={() => addComponent('pdf')} />
                 <WidgetBtn icon={<User/>} label="Avatar" onClick={() => addComponent('avatar')} />
                 <WidgetBtn icon={<Award/>} label="Badge" onClick={() => addComponent('badge')} />
                 <WidgetBtn icon={<Code/>} label="HTML" onClick={() => addComponent('html')} />
              </div>
           </ScrollArea>
           <div className="p-6 border-t border-white/10">
              <Button onClick={handleSave} disabled={saving} className="w-full dm-gradient-primary rounded-xl font-black h-12 shadow-lg">
                 {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={18} className="ml-2" />}
                 {isAr ? "نشر وتثبيت" : "Push & Deploy"}
              </Button>
           </div>
        </aside>

        {/* Center: Live Preview & Editor */}
        <div className="flex-1 flex flex-col relative bg-slate-50 overflow-hidden">
           <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-6">
                 <Input value={pageMeta.titleAr} onChange={e => setPageMeta({...pageMeta, titleAr: e.target.value})} className="h-10 font-black text-md w-64 border-slate-200" placeholder="Page Title (AR)" />
                 <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border">
                    <Button variant={previewLang === 'ar' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('ar')} className="rounded-full h-8 px-4 font-bold">AR</Button>
                    <Button variant={previewLang === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('en')} className="rounded-full h-8 px-4 font-bold">EN</Button>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route: /p/{pageMeta.slug}</span>
                 <Input value={pageMeta.slug} onChange={e => setPageMeta({...pageMeta, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})} className="h-8 w-40 font-mono text-xs" />
              </div>
           </header>

           <ScrollArea className="flex-1 p-12 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-12">
                 <AnimatePresence>
                    {components.map((c, i) => (
                      <div key={c.id} className="relative group/canvas">
                        <div className="absolute -left-16 top-0 flex flex-col gap-1 opacity-0 group-hover/canvas:opacity-100 transition-all">
                           <Button variant="outline" size="icon" onClick={() => moveComponent(i, 'up')} disabled={i === 0} className="size-8 rounded-lg bg-white shadow-md"><ChevronUp size={14}/></Button>
                           <Button variant="outline" size="icon" onClick={() => moveComponent(i, 'down')} disabled={i === components.length - 1} className="size-8 rounded-lg bg-white shadow-md"><ChevronDown size={14}/></Button>
                           <Button variant="outline" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="size-8 rounded-lg bg-white shadow-md text-red-500"><Trash2 size={14}/></Button>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 ring-4 ring-transparent hover:ring-accent/20 transition-all border border-slate-100 overflow-hidden relative">
                           {/* LIVE RENDERER */}
                           <div className="mb-6 pb-6 border-b border-dashed border-slate-100 flex items-center justify-between">
                              <Badge className="bg-slate-900 text-white rounded-lg px-3">{c.type.toUpperCase()}</Badge>
                              <div className="flex gap-2">
                                 {c.content.bodyAr && <Button size="icon" variant="ghost" className="size-8 text-accent" onClick={() => handleAiTranslate(c.content.bodyAr || c.content.textAr, i)}><Sparkles size={14}/></Button>}
                              </div>
                           </div>

                           <div className={cn(previewLang === 'ar' ? 'font-arabic text-right' : 'font-sans text-left')} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                              {c.type === 'heading' && <h2 className={cn("font-black text-primary", c.content.level === 'h1' ? 'text-4xl' : 'text-2xl')}>{previewLang === 'ar' ? c.content.textAr : c.content.textEn}</h2>}
                              {c.type === 'text' && <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{previewLang === 'ar' ? c.content.bodyAr : c.content.bodyEn}</p>}
                              {c.type === 'info' && <div className="bg-slate-50 p-6 rounded-3xl border-r-4 border-primary text-slate-800 font-bold">{previewLang === 'ar' ? c.content.bodyAr : c.content.bodyEn}</div>}
                              {c.type === 'stats' && <div className="grid grid-cols-2 gap-4 text-center"><div className="p-4 bg-primary text-white rounded-2xl"><h3 className="text-2xl font-black">{c.content.v1}</h3><p className="text-[10px] uppercase">{c.content.t1}</p></div><div className="p-4 bg-accent text-slate-900 rounded-2xl"><h3 className="text-2xl font-black">{c.content.v2}</h3><p className="text-[10px] uppercase">{c.content.t2}</p></div></div>}
                              {c.type === 'pdf' && <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-2xl"><FileText className="text-red-500"/><span className="font-black">{previewLang === 'ar' ? c.content.labelAr : c.content.labelEn}</span></div>}
                              {c.type === 'avatar' && <div className="flex items-center gap-4"><div className="size-16 rounded-full bg-slate-200" /><span className="font-black">{previewLang === 'ar' ? c.content.nameAr : c.content.nameEn}</span></div>}
                           </div>

                           {/* DIRECT EDITOR (Mini) */}
                           <div className="mt-8 pt-8 border-t border-slate-50 grid md:grid-cols-2 gap-6 opacity-40 hover:opacity-100 transition-opacity">
                              {(c.type === 'text' || c.type === 'info') && (
                                <>
                                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Content AR</label><Textarea value={c.content.bodyAr} onChange={e => updateComp(i, {bodyAr: e.target.value})} className="h-24 text-xs font-bold" /></div>
                                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Content EN</label><Textarea value={c.content.bodyEn} onChange={e => updateComp(i, {bodyEn: e.target.value})} className="h-24 text-xs" /></div>
                                </>
                              )}
                              {c.type === 'heading' && (
                                <>
                                  <div className="space-y-2"><label className="text-[9px]">Text AR</label><Input value={c.content.textAr} onChange={e => updateComp(i, {textAr: e.target.value})} /></div>
                                  <div className="space-y-2"><label className="text-[9px]">Text EN</label><Input value={c.content.textEn} onChange={e => updateComp(i, {textEn: e.target.value})} /></div>
                                </>
                              )}
                              {c.type === 'stats' && (
                                <div className="col-span-2 grid grid-cols-4 gap-2">
                                  <Input value={c.content.v1} onChange={e => updateComp(i, {v1: e.target.value})} placeholder="V1" />
                                  <Input value={c.content.t1} onChange={e => updateComp(i, {t1: e.target.value})} placeholder="T1" />
                                  <Input value={c.content.v2} onChange={e => updateComp(i, {v2: e.target.value})} placeholder="V2" />
                                  <Input value={c.content.t2} onChange={e => updateComp(i, {t2: e.target.value})} placeholder="T2" />
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    ))}
                 </AnimatePresence>
                 {components.length === 0 && (
                   <div className="py-40 text-center border-4 border-dashed rounded-[3rem] border-slate-200 text-slate-300">
                      <Layout size={64} className="mx-auto mb-4 opacity-20" />
                      <p className="font-black text-xl">Start building your canvas...</p>
                   </div>
                 )}
              </div>
           </ScrollArea>
        </div>
      </main>
    </div>
  );
}

function WidgetBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className="flex flex-col h-24 gap-3 bg-white/5 hover:bg-accent hover:text-slate-900 border border-white/10 rounded-2xl transition-all group"
    >
      <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-slate-900/10 transition-colors">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Button>
  );
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>}>
      <PageBuilderContent />
    </Suspense>
  );
}
