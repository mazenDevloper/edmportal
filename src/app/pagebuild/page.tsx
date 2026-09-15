
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, 
  Type, TrendingUp, Info, Loader2, Sparkles, Eye, 
  Heading1, Video, FileText, List, Minus, Table as TableIcon,
  Code, Database, User, Award, Layers, MousePointer2,
  ChevronUp, ChevronDown, GripVertical, Settings2, Globe, Edit3
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
import { motion, AnimatePresence } from 'framer-motion';

// Component Renderer used for Live Preview
import DynamicComponentRenderer from '@/app/p/[slug]/page';

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
  
  // Tab state for each component
  const [compModes, setCompModes] = useState<Record<string, 'preview' | 'edit' | 'code'>>({});

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
            // Initialize modes
            const modes: any = {};
            page.components.forEach((c: any) => modes[c.id] = 'preview');
            setCompModes(modes);
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

  const handleAiTranslate = async (text: string, idx: number) => {
    if (!text) return;
    setAiLoading(idx.toString());
    try {
      const { translatedText } = await translateToEnglish({ text });
      const nc = [...components];
      if (nc[idx].content.bodyAr) nc[idx].content.bodyEn = translatedText;
      if (nc[idx].content.textAr) nc[idx].content.textEn = translatedText;
      if (nc[idx].content.labelAr) nc[idx].content.labelEn = translatedText;
      setComponents(nc);
      toast({ title: isAr ? "تمت الترجمة" : "AI Translation Done" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setAiLoading(null);
    }
  };

  const addComponent = (type: BuilderComponent['type']) => {
    const id = `c_${Date.now()}`;
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
      tabs: { items: [{ titleAr: 'تبويب 1', titleEn: 'Tab 1', contentAr: 'محتوى', contentEn: 'Content' }] },
      html: { code: '<div class="p-4 border rounded">HTML Code</div>' }
    };
    setComponents([...components, { id, type, content: defaultContents[type] || {} }]);
    setCompModes(prev => ({ ...prev, [id]: 'edit' }));
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
      toast({ title: isAr ? "تم حفظ الصفحة بنجاح" : "Page Saved Successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Save Error" });
    } finally {
      setSaving(false);
    }
  };

  const updateComp = (idx: number, updates: any) => {
    const nc = [...components];
    nc[idx].content = { ...nc[idx].content, ...updates };
    setComponents(nc);
  };

  const moveComponent = (idx: number, dir: 'up' | 'down') => {
    const nc = [...components];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target >= 0 && target < nc.length) {
      [nc[idx], nc[target]] = [nc[target], nc[idx]];
      setComponents(nc);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-100 flex flex-col", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Widgets */}
        <aside className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl z-20 border-r border-white/5">
           <div className="p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="size-8 rounded-lg bg-accent text-slate-900 flex items-center justify-center"><Layers size={18}/></div>
                 <span className="font-black text-xs uppercase tracking-widest text-accent">Widgets Hub</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-accent/30 text-accent">v5.0</Badge>
           </div>
           <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-2 gap-3">
                 <WidgetBtn icon={<Heading1/>} label="Heading" onClick={() => addComponent('heading')} />
                 <WidgetBtn icon={<Type/>} label="Text Block" onClick={() => addComponent('text')} />
                 <WidgetBtn icon={<Info/>} label="Info Card" onClick={() => addComponent('info')} />
                 <WidgetBtn icon={<TableIcon/>} label="Data Table" onClick={() => addComponent('table')} />
                 <WidgetBtn icon={<TrendingUp/>} label="Stats" onClick={() => addComponent('stats')} />
                 <WidgetBtn icon={<List/>} label="Accordion" onClick={() => addComponent('accordion')} />
                 <WidgetBtn icon={<Award/>} label="Tabs" onClick={() => addComponent('tabs')} />
                 <WidgetBtn icon={<FileText/>} label="PDF Viewer" onClick={() => addComponent('pdf')} />
                 <WidgetBtn icon={<User/>} label="Avatar" onClick={() => addComponent('avatar')} />
                 <WidgetBtn icon={<Code/>} label="HTML/Embed" onClick={() => addComponent('html')} />
              </div>
           </ScrollArea>
           <div className="p-6 border-t border-white/10 space-y-3">
              <Button onClick={handleSave} disabled={saving} className="w-full dm-gradient-primary rounded-xl font-black h-12 shadow-lg">
                 {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={18} className="ml-2" />}
                 {isAr ? "نشر التغييرات" : "Publish Changes"}
              </Button>
           </div>
        </aside>

        {/* Workspace: Live Canvas */}
        <div className="flex-1 flex flex-col relative bg-slate-50 overflow-hidden">
           <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-6">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'عنوان الصفحة' : 'Page Title'}</label>
                    <Input value={pageMeta.titleAr} onChange={e => setPageMeta({...pageMeta, titleAr: e.target.value})} className="h-10 font-black text-md w-64 border-slate-200" placeholder="Title (AR)" />
                 </div>
                 <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border shadow-inner">
                    <Button variant={previewLang === 'ar' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('ar')} className="rounded-full h-8 px-5 font-black text-xs">AR</Button>
                    <Button variant={previewLang === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('en')} className="rounded-full h-8 px-5 font-black text-xs">EN</Button>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Endpoint</p>
                    <p className="text-xs font-mono font-black text-primary">/p/{pageMeta.slug || '...'}</p>
                 </div>
                 <Input value={pageMeta.slug} onChange={e => setPageMeta({...pageMeta, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})} className="h-10 w-40 font-mono text-xs text-center bg-slate-50 border-dashed" placeholder="slug" />
              </div>
           </header>

           <ScrollArea className="flex-1 p-12 bg-[#f8fafc] custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-10">
                 <AnimatePresence>
                    {components.map((c, i) => (
                      <motion.div 
                        key={c.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group/canvas relative"
                      >
                        {/* Control Toolbar */}
                        <div className="absolute -left-14 top-0 flex flex-col gap-1 opacity-0 group-hover/canvas:opacity-100 transition-all">
                           <Button variant="outline" size="icon" onClick={() => moveComponent(i, 'up')} disabled={i === 0} className="size-9 rounded-xl bg-white shadow-xl hover:bg-primary hover:text-white"><ChevronUp size={18}/></Button>
                           <Button variant="outline" size="icon" onClick={() => moveComponent(i, 'down')} disabled={i === components.length - 1} className="size-9 rounded-xl bg-white shadow-xl hover:bg-primary hover:text-white"><ChevronDown size={18}/></Button>
                           <Button variant="outline" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="size-9 rounded-xl bg-white shadow-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={18}/></Button>
                        </div>

                        {/* Widget Wrapper */}
                        <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white ring-1 ring-slate-100">
                           <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <GripVertical className="text-white/20 cursor-move" size={16}/>
                                 <Badge className="bg-accent text-slate-900 font-black text-[9px] px-3 tracking-widest">{c.type.toUpperCase()}</Badge>
                              </div>
                              
                              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                 <CompModeBtn active={compModes[c.id] === 'preview'} onClick={() => setCompModes({...compModes, [c.id]: 'preview'})} icon={<Eye size={12}/>} label="Preview" />
                                 <CompModeBtn active={compModes[c.id] === 'edit'} onClick={() => setCompModes({...compModes, [c.id]: 'edit'})} icon={<Settings2 size={12}/>} label="Settings" />
                                 <CompModeBtn active={compModes[c.id] === 'code'} onClick={() => setCompModes({...compModes, [c.id]: 'code'})} icon={<Code size={12}/>} label="JSON" />
                              </div>
                           </div>

                           <CardContent className="p-0">
                              {compModes[c.id] === 'preview' && (
                                <div className={cn("p-10 transition-all", previewLang === 'ar' ? "font-arabic" : "font-sans")} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                                   {/* RENDER COMPONENT AS IT APPEARS ON THE PAGE */}
                                   <ComponentRenderer type={c.type} content={c.content} lang={previewLang} />
                                </div>
                              )}

                              {compModes[c.id] === 'edit' && (
                                <div className="p-10 bg-slate-50 space-y-6">
                                   <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-xs font-black text-primary flex items-center gap-2"><Edit3 size={14}/> Edit Component Properties</h4>
                                      <Button size="xs" variant="ghost" className="text-accent gap-2" onClick={() => handleAiTranslate(c.content.bodyAr || c.content.textAr || c.content.labelAr, i)}>
                                         <Sparkles size={12}/> {isAr ? 'ترجمة بالذكاء الاصطناعي' : 'AI Translate'}
                                      </Button>
                                   </div>
                                   <div className="grid md:grid-cols-2 gap-8">
                                      {(c.type === 'text' || c.type === 'info') && (
                                        <>
                                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Content (AR)</label><Textarea value={c.content.bodyAr} onChange={e => updateComp(i, {bodyAr: e.target.value})} className="min-h-[120px] text-sm font-bold bg-white" /></div>
                                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Content (EN)</label><Textarea value={c.content.bodyEn} onChange={e => updateComp(i, {bodyEn: e.target.value})} className="min-h-[120px] text-sm bg-white" /></div>
                                        </>
                                      )}
                                      {c.type === 'heading' && (
                                        <>
                                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400">Text (AR)</label><Input value={c.content.textAr} onChange={e => updateComp(i, {textAr: e.target.value})} className="bg-white font-bold" /></div>
                                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400">Text (EN)</label><Input value={c.content.textEn} onChange={e => updateComp(i, {textEn: e.target.value})} className="bg-white" /></div>
                                        </>
                                      )}
                                      {c.type === 'stats' && (
                                        <div className="col-span-2 grid grid-cols-4 gap-4">
                                          <div className="space-y-1"><label className="text-[9px] font-black">Value 1</label><Input value={c.content.v1} onChange={e => updateComp(i, {v1: e.target.value})} className="bg-white" /></div>
                                          <div className="space-y-1"><label className="text-[9px] font-black">Title 1</label><Input value={c.content.t1} onChange={e => updateComp(i, {t1: e.target.value})} className="bg-white" /></div>
                                          <div className="space-y-1"><label className="text-[9px] font-black">Value 2</label><Input value={c.content.v2} onChange={e => updateComp(i, {v2: e.target.value})} className="bg-white" /></div>
                                          <div className="space-y-1"><label className="text-[9px] font-black">Title 2</label><Input value={c.content.t2} onChange={e => updateComp(i, {t2: e.target.value})} className="bg-white" /></div>
                                        </div>
                                      )}
                                      {/* more specialized editors could go here */}
                                   </div>
                                </div>
                              )}

                              {compModes[c.id] === 'code' && (
                                <div className="p-0 bg-slate-950 font-mono text-xs">
                                   <Textarea 
                                      value={JSON.stringify(c.content, null, 2)} 
                                      onChange={e => {
                                        try {
                                          const parsed = JSON.parse(e.target.value);
                                          updateComp(i, parsed);
                                        } catch (err) {}
                                      }}
                                      className="min-h-[300px] bg-transparent border-none text-emerald-400 focus:ring-0 p-8 custom-scrollbar" 
                                   />
                                </div>
                              )}
                           </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                 </AnimatePresence>

                 {components.length === 0 && (
                   <div className="py-40 text-center border-4 border-dashed rounded-[3rem] border-slate-200 text-slate-300">
                      <Layout size={64} className="mx-auto mb-4 opacity-10" />
                      <p className="font-black text-xl">Drag widgets or click from the hub to start building.</p>
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

function CompModeBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button 
      variant="ghost" 
      size="xs" 
      onClick={onClick}
      className={cn("h-7 px-3 gap-2 rounded-md font-black text-[9px] uppercase", active ? "bg-accent text-slate-900" : "text-white/40 hover:text-white")}
    >
      {icon} {label}
    </Button>
  );
}

// Simplified Renderer for the Builder
function ComponentRenderer({ type, content, lang }: { type: string, content: any, lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  
  switch (type) {
    case 'heading':
      return <h2 className={cn("font-black text-primary tracking-tighter", content.level === 'h1' ? "text-5xl" : "text-3xl")}>{isAr ? content.textAr : content.textEn}</h2>;
    case 'text':
      return <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{isAr ? content.bodyAr : content.bodyEn}</p>;
    case 'info':
      return (
        <div className="bg-slate-50 p-8 rounded-[2rem] border-r-8 border-primary text-2xl font-bold text-slate-800 leading-loose shadow-sm">
           {isAr ? content.bodyAr : content.bodyEn}
        </div>
      );
    case 'stats':
      return (
        <div className="grid grid-cols-2 gap-8 text-center">
           <div className="p-8 bg-primary text-white rounded-[2rem] shadow-xl">
              <h3 className="text-5xl font-black mb-2">{content.v1}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{content.t1}</p>
           </div>
           <div className="p-8 bg-accent text-slate-900 rounded-[2rem] shadow-xl">
              <h3 className="text-5xl font-black mb-2">{content.v2}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{content.t2}</p>
           </div>
        </div>
      );
    case 'pdf':
      return (
        <div className="flex items-center gap-6 p-6 border-2 border-dashed rounded-[2rem] bg-slate-50 group hover:border-primary transition-colors cursor-pointer">
           <div className="size-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center"><FileText size={32}/></div>
           <div>
              <p className="font-black text-xl">{isAr ? content.labelAr : content.labelEn}</p>
              <p className="text-[10px] font-bold text-slate-400">OFFICIAL DOCUMENT (PDF)</p>
           </div>
        </div>
      );
    case 'avatar':
       return (
         <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-slate-200 border-4 border-white shadow-xl" />
            <div>
               <p className="font-black text-2xl text-primary">{isAr ? content.nameAr : content.nameEn}</p>
               <Badge className="bg-accent text-slate-900 font-bold mt-1">Authorized Official</Badge>
            </div>
         </div>
       );
    default:
      return <div className="p-10 border rounded-3xl bg-slate-50 text-slate-400 italic">Widget {type} ready for deployment.</div>;
  }
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>}>
      <PageBuilderContent />
    </Suspense>
  );
}
