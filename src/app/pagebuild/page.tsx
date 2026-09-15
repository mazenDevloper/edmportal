
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
  ChevronUp, ChevronDown, GripVertical, Settings2, Globe, Edit3, X
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function PageBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [pageMeta, setPageMeta] = useState({ titleAr: '', titleEn: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [compModes, setCompModes] = useState<Record<string, 'preview' | 'edit' | 'code'>>({});

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        const data = await fetchBin();
        if (data && data.customPages) {
          const page = data.customPages.find((p: CustomPage) => p.id === editId);
          if (page) {
            setComponents(page.components || []);
            setPageMeta({ titleAr: page.titleAr || '', titleEn: page.titleEn || '', slug: page.slug || '' });
            const modes: any = {};
            page.components.forEach((c: any) => modes[c.id] = 'preview');
            setCompModes(modes);
          }
        }
      } finally { setLoading(false); }
    };
    loadPage();
  }, [editId]);

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
      html: { code: '<div class="p-8 border-2 border-dashed rounded-3xl text-center text-slate-400 font-bold bg-slate-50">CUSTOM HTML PREVIEW</div>' }
    };
    const newComp = { id, type, content: defaultContents[type] || {} };
    setComponents([...components, newComp]);
    setCompModes(prev => ({ ...prev, [id]: 'preview' }));
  };

  const handleSave = async () => {
    if (!pageMeta.slug) return toast({ variant: "destructive", title: "Slug Required" });
    setSaving(true);
    try {
      const data = await fetchBin();
      const newPage = { id: editId || `page_${Date.now()}`, ...pageMeta, components, createdAt: new Date().toISOString() };
      const filtered = (data.customPages || []).filter((p: any) => p.id !== newPage.id);
      await updateBin({ ...data, customPages: [...filtered, newPage] });
      toast({ title: "Page Saved Successfully" });
      router.push('/admin');
    } finally { setSaving(false); }
  };

  const updateComp = (idx: number, updates: any) => {
    const nc = [...components];
    nc[idx].content = { ...nc[idx].content, ...updates };
    setComponents(nc);
  };

  return (
    <div className={cn("min-h-screen bg-slate-100 flex flex-col", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-slate-900 text-white flex flex-col border-r border-white/5 shadow-2xl">
           <div className="p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-widest text-accent">Widgets Hub</span>
              <Badge variant="outline" className="text-[9px] border-accent/30 text-accent">v5.2</Badge>
           </div>
           <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-2 gap-3">
                 <WidgetBtn icon={<Heading1/>} label="Heading" onClick={() => addComponent('heading')} />
                 <WidgetBtn icon={<Type/>} label="Text Block" onClick={() => addComponent('text')} />
                 <WidgetBtn icon={<Info/>} label="Info Card" onClick={() => addComponent('info')} />
                 <WidgetBtn icon={<TableIcon/>} label="Data Table" onClick={() => addComponent('table')} />
                 <WidgetBtn icon={<TrendingUp/>} label="Stats" onClick={() => addComponent('stats')} />
                 <WidgetBtn icon={<List/>} label="FAQ" onClick={() => addComponent('accordion')} />
                 <WidgetBtn icon={<Award/>} label="Tabs" onClick={() => addComponent('tabs')} />
                 <WidgetBtn icon={<FileText/>} label="PDF" onClick={() => addComponent('pdf')} />
                 <WidgetBtn icon={<User/>} label="Avatar" onClick={() => addComponent('avatar')} />
                 <WidgetBtn icon={<Code/>} label="HTML" onClick={() => addComponent('html')} />
              </div>
           </ScrollArea>
           <div className="p-6 border-t border-white/10">
              <Button onClick={handleSave} disabled={saving} className="w-full dm-gradient-primary rounded-xl font-black h-12">
                 {saving ? <Loader2 className="animate-spin" /> : <Save className="ml-2" />} {isAr ? "نشر" : "Publish"}
              </Button>
           </div>
        </aside>

        <div className="flex-1 flex flex-col relative bg-slate-50">
           <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-6">
                 <Input value={pageMeta.titleAr} onChange={e => setPageMeta({...pageMeta, titleAr: e.target.value})} className="h-10 font-black w-64" placeholder="Page Title (AR)" />
                 <div className="flex bg-slate-100 p-1 rounded-full border">
                    <Button variant={previewLang === 'ar' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('ar')} className="rounded-full h-8 px-5 text-xs">AR</Button>
                    <Button variant={previewLang === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('en')} className="rounded-full h-8 px-5 text-xs">EN</Button>
                 </div>
              </div>
              <Input value={pageMeta.slug} onChange={e => setPageMeta({...pageMeta, slug: e.target.value})} className="h-10 w-40 font-mono text-xs" placeholder="slug" />
           </header>

           <ScrollArea className="flex-1 p-12 bg-[#f8fafc]">
              <div className="max-w-5xl mx-auto space-y-10">
                 <AnimatePresence>
                    {components.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group/canvas relative">
                        <div className="absolute -left-14 top-0 flex flex-col gap-1 opacity-0 group-hover/canvas:opacity-100 transition-all">
                           <Button variant="outline" size="icon" onClick={() => {
                             const nc = [...components];
                             if(i>0) {[nc[i], nc[i-1]] = [nc[i-1], nc[i]]; setComponents(nc);}
                           }} className="size-9 rounded-xl bg-white shadow-xl"><ChevronUp size={18}/></Button>
                           <Button variant="outline" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="size-9 rounded-xl bg-white text-red-500 shadow-xl"><Trash2 size={18}/></Button>
                        </div>
                        <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white ring-1 ring-slate-100">
                           <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
                              <Badge className="bg-accent text-slate-900 font-black text-[9px] uppercase tracking-widest">{c.type}</Badge>
                              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                 <CompModeBtn active={compModes[c.id] === 'preview'} onClick={() => setCompModes({...compModes, [c.id]: 'preview'})} icon={<Eye size={12}/>} label="Preview" />
                                 <CompModeBtn active={compModes[c.id] === 'edit'} onClick={() => setCompModes({...compModes, [c.id]: 'edit'})} icon={<Settings2 size={12}/>} label="Settings" />
                              </div>
                           </div>
                           <CardContent className="p-0">
                              {compModes[c.id] === 'preview' ? (
                                <div className={cn("p-10", previewLang === 'ar' ? "font-arabic" : "font-sans")} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                                   <ComponentRenderer type={c.type} content={c.content} lang={previewLang} />
                                </div>
                              ) : (
                                <div className="p-10 bg-slate-50 space-y-6">
                                   <div className="grid md:grid-cols-2 gap-6">
                                      {['bodyAr', 'textAr', 'labelAr'].some(k => c.content[k] !== undefined) && (
                                        <div className="space-y-4">
                                          <Label className="text-[10px] font-black uppercase text-slate-400">Content Arabic</Label>
                                          <Textarea value={c.content.bodyAr || c.content.textAr || c.content.labelAr} onChange={e => updateComp(i, { [c.content.bodyAr !== undefined ? 'bodyAr' : c.content.textAr !== undefined ? 'textAr' : 'labelAr']: e.target.value })} className="bg-white font-bold" />
                                        </div>
                                      )}
                                      {['bodyEn', 'textEn', 'labelEn'].some(k => c.content[k] !== undefined) && (
                                        <div className="space-y-4">
                                          <Label className="text-[10px] font-black uppercase text-slate-400">Content English</Label>
                                          <Textarea value={c.content.bodyEn || c.content.textEn || c.content.labelEn} onChange={e => updateComp(i, { [c.content.bodyEn !== undefined ? 'bodyEn' : c.content.textEn !== undefined ? 'textEn' : 'labelEn']: e.target.value })} className="bg-white" />
                                        </div>
                                      )}
                                      {c.type === 'stats' && (
                                        <div className="col-span-2 grid grid-cols-4 gap-4">
                                          <Input value={c.content.v1} onChange={e => updateComp(i, {v1: e.target.value})} placeholder="V1" />
                                          <Input value={c.content.t1} onChange={e => updateComp(i, {t1: e.target.value})} placeholder="T1" />
                                          <Input value={c.content.v2} onChange={e => updateComp(i, {v2: e.target.value})} placeholder="V2" />
                                          <Input value={c.content.t2} onChange={e => updateComp(i, {t2: e.target.value})} placeholder="T2" />
                                        </div>
                                      )}
                                      {c.type === 'html' && (
                                        <div className="col-span-2">
                                          <Label className="text-[10px] font-black uppercase text-slate-400">HTML Code</Label>
                                          <Textarea value={c.content.code} onChange={e => updateComp(i, {code: e.target.value})} className="font-mono text-xs h-40 bg-slate-900 text-emerald-400" />
                                        </div>
                                      )}
                                   </div>
                                </div>
                              )}
                           </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                 </AnimatePresence>
              </div>
           </ScrollArea>
        </div>
      </main>
    </div>
  );
}

function WidgetBtn({ icon, label, onClick }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className="flex flex-col h-24 gap-3 bg-white/5 hover:bg-accent hover:text-slate-900 border border-white/10 rounded-2xl transition-all">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Button>
  );
}

function CompModeBtn({ active, onClick, icon, label }: any) {
  return (
    <Button variant="ghost" size="xs" onClick={onClick} className={cn("h-7 px-3 gap-2 rounded-md font-black text-[9px] uppercase", active ? "bg-accent text-slate-900" : "text-white/40 hover:text-white")}>
      {icon} {label}
    </Button>
  );
}

function ComponentRenderer({ type, content, lang }: any) {
  const isAr = lang === 'ar';
  switch (type) {
    case 'heading': return <h2 className={cn("font-black text-primary tracking-tighter", content.level === 'h1' ? "text-5xl" : "text-3xl")}>{isAr ? content.textAr : content.textEn}</h2>;
    case 'text': return <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{isAr ? content.bodyAr : content.bodyEn}</p>;
    case 'info': return <div className="bg-slate-50 p-8 rounded-[2rem] border-r-8 border-primary text-2xl font-bold text-slate-800 shadow-sm">{isAr ? content.bodyAr : content.bodyEn}</div>;
    case 'stats': return <div className="grid grid-cols-2 gap-8 text-center"><div className="p-8 bg-primary text-white rounded-[2rem] shadow-xl"><h3 className="text-5xl font-black mb-2">{content.v1}</h3><p className="text-[10px] uppercase opacity-60">{content.t1}</p></div><div className="p-8 bg-accent text-slate-900 rounded-[2rem] shadow-xl"><h3 className="text-5xl font-black mb-2">{content.v2}</h3><p className="text-[10px] uppercase opacity-60">{content.t2}</p></div></div>;
    case 'accordion': return <Accordion type="single" collapsible className="w-full">{content.items?.map((item: any, idx: number) => (<AccordionItem key={idx} value={`i-${idx}`} className="border-slate-100 last:border-0 py-2"><AccordionTrigger className="text-2xl font-black text-primary">{isAr ? item.titleAr : item.titleEn}</AccordionTrigger><AccordionContent className="text-xl text-slate-500 font-medium pt-6">{isAr ? item.contentAr : item.contentEn}</AccordionContent></AccordionItem>))}</Accordion>;
    case 'html': return <div dangerouslySetInnerHTML={{ __html: content.code }} />;
    case 'avatar': return <div className="flex items-center gap-4"><div className="size-20 rounded-full bg-slate-200 border-4 border-white shadow-xl" /><div><p className="font-black text-2xl text-primary">{isAr ? content.nameAr : content.nameEn}</p><Badge className="bg-accent text-slate-900 font-bold mt-1">Official</Badge></div></div>;
    default: return <div className="p-10 border rounded-3xl bg-slate-50 text-slate-400 italic">Widget {type} ready.</div>;
  }
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <PageBuilderContent />
    </Suspense>
  );
}
