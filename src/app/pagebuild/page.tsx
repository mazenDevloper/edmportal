'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, 
  Type, TrendingUp, Info, Loader2, Sparkles, Eye, 
  Heading1, Video, FileText, List, Minus, Table as TableIcon,
  Code, Database, User, Award, Layers, MousePointer2,
  ChevronUp, ChevronDown, GripVertical, Settings2, Globe, Edit3, X,
  ExternalLink, CheckCircle2, PlayCircle, Users, ShieldCheck, Mail
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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [compModes, setCompModes] = useState<Record<string, 'preview' | 'settings' | 'data'>>({});

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
      heading: { level: 'h2', textAr: 'عنوان قسم جديد', textEn: 'New Section Heading' },
      text: { bodyAr: 'اكتب المحتوى الخاص بك هنا ببلدية ظفار...', bodyEn: 'Enter your custom content here for Dhofar Municipality...' },
      info: { bodyAr: 'هذه بطاقة معلومات مميزة تتبع الهوية البصرية الرسمية.', bodyEn: 'This is a premium information card following the official visual identity.' },
      stats: { v1: '25,000+', t1: 'معاملة رقمية', v2: '150,000+', t2: 'مستخدم نشط' },
      pdf: { labelAr: 'تحميل دليل الخدمات الرقمي', labelEn: 'Download Digital Service Guide', url: '#' },
      avatar: { nameAr: 'معالي محافظ ظفار', nameEn: 'HE Governor of Dhofar', src: '' },
      badge: { textAr: 'خدمة معتمدة', textEn: 'Certified Service' },
      table: { headers: ['الخدمة البلديّة', 'الرسوم'], rows: [{ c1: 'تجديد عقود الإيجار', c2: '15 OMR' }, { c1: 'ترخيص البناء', c2: '50 OMR' }] },
      accordion: { items: [{ titleAr: 'كيف يمكنني الدخول للنظام؟', titleEn: 'How to access the system?', contentAr: 'عبر نظام ثقة الموحد للهوية الرقمية.', contentEn: 'Via the Unified Thiqa Digital ID System.' }] },
      tabs: { items: [{ titleAr: 'المتطلبات', titleEn: 'Requirements', contentAr: 'البطاقة الشخصية سارية المفعول.', contentEn: 'Valid Resident ID Card.' }] },
      html: { code: '<div class="p-12 border-4 border-dashed rounded-[3rem] text-center bg-slate-50 text-slate-400 font-black text-xl uppercase tracking-widest">Neural HTML Container</div>' }
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
      toast({ title: "Page Published Successfully" });
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
        {/* Advanced Widget Sidebar */}
        <aside className="w-85 bg-slate-900 text-white flex flex-col border-r border-white/5 shadow-2xl z-20">
           <div className="p-8 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-black text-xs uppercase tracking-[0.3em] text-accent block">Components Hub</span>
                <span className="text-[10px] text-white/30 font-bold">Oman Gov Design System</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-accent/30 text-accent font-black">V4.2 PRO</Badge>
           </div>
           
           <ScrollArea className="flex-1 p-8">
              <div className="space-y-10">
                <section>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Structural Elements</p>
                   <div className="grid grid-cols-2 gap-3">
                      <WidgetBtn icon={<Heading1/>} label="Heading" onClick={() => addComponent('heading')} />
                      <WidgetBtn icon={<Type/>} label="Rich Text" onClick={() => addComponent('text')} />
                      <WidgetBtn icon={<Layers/>} label="Tabs" onClick={() => addComponent('tabs')} />
                      <WidgetBtn icon={<Minus/>} label="Separator" onClick={() => addComponent('separator')} />
                   </div>
                </section>
                <section>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Interactive & Data</p>
                   <div className="grid grid-cols-2 gap-3">
                      <WidgetBtn icon={<Info/>} label="Info Card" onClick={() => addComponent('info')} />
                      <WidgetBtn icon={<TableIcon/>} label="Data Table" onClick={() => addComponent('table')} />
                      <WidgetBtn icon={<TrendingUp/>} label="Stats Grid" onClick={() => addComponent('stats')} />
                      <WidgetBtn icon={<List/>} label="FAQ Accordion" onClick={() => addComponent('accordion')} />
                   </div>
                </section>
                <section>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Branding & Media</p>
                   <div className="grid grid-cols-2 gap-3">
                      <WidgetBtn icon={<FileText/>} label="PDF Viewer" onClick={() => addComponent('pdf')} />
                      <WidgetBtn icon={<User/>} label="Avatar" onClick={() => addComponent('avatar')} />
                      <WidgetBtn icon={<Award/>} label="Status Badge" onClick={() => addComponent('badge')} />
                      <WidgetBtn icon={<Code/>} label="Neural HTML" onClick={() => addComponent('html')} />
                   </div>
                </section>
              </div>
           </ScrollArea>
           
           <div className="p-8 border-t border-white/10 bg-slate-950">
              <Button onClick={handleSave} disabled={saving} className="w-full dm-gradient-primary rounded-[1.2rem] font-black h-16 shadow-2xl text-lg gap-3">
                 {saving ? <Loader2 className="animate-spin" /> : <Globe size={24} />} {isAr ? "نشر الصفحة" : "Publish to Portal"}
              </Button>
           </div>
        </aside>

        {/* Live Canvas */}
        <div className="flex-1 flex flex-col relative bg-[#f4f7f9]">
           <header className="bg-white border-b px-10 py-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-10">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Page Name</Label>
                    <Input value={pageMeta.titleAr} onChange={e => setPageMeta({...pageMeta, titleAr: e.target.value})} className="h-11 font-black w-80 text-lg rounded-xl border-slate-100" placeholder="Page Title (AR)" />
                 </div>
                 <div className="flex bg-slate-100 p-1.5 rounded-[1.2rem] border shadow-inner">
                    <Button variant={previewLang === 'ar' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('ar')} className={cn("rounded-xl h-10 px-8 text-xs font-black", previewLang === 'ar' ? "bg-primary text-white" : "text-slate-500")}>AR PREVIEW</Button>
                    <Button variant={previewLang === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('en')} className={cn("rounded-xl h-10 px-8 text-xs font-black", previewLang === 'en' ? "bg-primary text-white" : "text-slate-500")}>EN PREVIEW</Button>
                 </div>
              </div>
              <div className="text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Permanent URL Slug</Label>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border font-mono text-xs font-bold text-primary">
                  <span>/p/</span>
                  <Input value={pageMeta.slug} onChange={e => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="h-8 w-40 border-none bg-transparent p-0 focus:ring-0" placeholder="my-page" />
                </div>
              </div>
           </header>

           <ScrollArea className="flex-1 p-16">
              <div className="max-w-5xl mx-auto space-y-12 pb-32">
                 <AnimatePresence>
                    {components.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="group/canvas relative">
                        {/* Interactive Controls Overlay */}
                        <div className="absolute -left-16 top-0 flex flex-col gap-2 opacity-0 group-hover/canvas:opacity-100 transition-all">
                           <Button variant="outline" size="icon" onClick={() => {
                             const nc = [...components];
                             if(i>0) {[nc[i], nc[i-1]] = [nc[i-1], nc[i]]; setComponents(nc);}
                           }} className="size-11 rounded-2xl bg-white shadow-xl text-primary border-none"><ChevronUp size={24}/></Button>
                           <Button variant="outline" size="icon" onClick={() => {
                             const nc = [...components];
                             if(i < components.length - 1) {[nc[i], nc[i+1]] = [nc[i+1], nc[i]]; setComponents(nc);}
                           }} className="size-11 rounded-2xl bg-white shadow-xl text-primary border-none"><ChevronDown size={24}/></Button>
                           <Button variant="outline" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="size-11 rounded-2xl bg-white text-red-500 shadow-xl border-none"><Trash2 size={24}/></Button>
                        </div>

                        <Card className="rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border-none overflow-hidden bg-white ring-1 ring-slate-100 transition-all group-hover/canvas:ring-primary/20">
                           <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <GripVertical className="text-white/20" size={20}/>
                                 <Badge className="bg-accent text-slate-900 font-black text-[9px] uppercase tracking-[0.2em] px-3">{c.type}</Badge>
                              </div>
                              <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
                                 <CompModeBtn active={compModes[c.id] === 'preview'} onClick={() => setCompModes({...compModes, [c.id]: 'preview'})} icon={<Eye size={14}/>} label="Preview" />
                                 <CompModeBtn active={compModes[c.id] === 'settings'} onClick={() => setCompModes({...compModes, [c.id]: 'settings'})} icon={<Settings2 size={14}/>} label="Settings" />
                                 <CompModeBtn active={compModes[c.id] === 'data'} onClick={() => setCompModes({...compModes, [c.id]: 'data'})} icon={<Code size={14}/>} label="Code" />
                              </div>
                           </div>
                           
                           <CardContent className="p-0">
                              {compModes[c.id] === 'preview' ? (
                                <div className={cn("p-12", previewLang === 'ar' ? "font-arabic" : "font-sans")} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                                   <ComponentRenderer type={c.type} content={c.content} lang={previewLang} />
                                </div>
                              ) : compModes[c.id] === 'settings' ? (
                                <div className="p-12 bg-slate-50 space-y-8 animate-in fade-in zoom-in-95">
                                   <div className="grid md:grid-cols-2 gap-10">
                                      {/* Dual Content Fields for Translation */}
                                      <div className="space-y-6">
                                         <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Arabic Content</Label>
                                            <Badge variant="outline" className="text-[8px]">PRIMARY</Badge>
                                         </div>
                                         {['bodyAr', 'textAr', 'labelAr'].some(k => c.content[k] !== undefined) ? (
                                           <Textarea value={c.content.bodyAr || c.content.textAr || c.content.labelAr} onChange={e => updateComp(i, { [c.content.bodyAr !== undefined ? 'bodyAr' : c.content.textAr !== undefined ? 'textAr' : 'labelAr']: e.target.value })} className="bg-white font-black min-h-[150px] rounded-2xl border-slate-200" />
                                         ) : <p className="text-xs font-bold text-slate-400 italic">No simple text fields for this component.</p>}
                                      </div>
                                      
                                      <div className="space-y-6">
                                         <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase text-accent tracking-widest">English Content</Label>
                                            <Button size="xs" variant="ghost" className="h-6 text-accent font-black gap-1" onClick={() => handleAiTranslate(c.content.bodyAr || c.content.textAr || c.content.labelAr, i)}>
                                              <Sparkles size={10}/> AI AUTO
                                            </Button>
                                         </div>
                                         {['bodyEn', 'textEn', 'labelEn'].some(k => c.content[k] !== undefined) ? (
                                           <Textarea value={c.content.bodyEn || c.content.textEn || c.content.labelEn} onChange={e => updateComp(i, { [c.content.bodyEn !== undefined ? 'bodyEn' : c.content.textEn !== undefined ? 'textEn' : 'labelEn']: e.target.value })} className="bg-white font-bold min-h-[150px] rounded-2xl border-slate-200" />
                                         ) : <p className="text-xs font-bold text-slate-400 italic">No simple text fields for this component.</p>}
                                      </div>
                                      
                                      {c.type === 'stats' && (
                                        <div className="col-span-2 grid grid-cols-4 gap-6 bg-white p-8 rounded-[2rem] shadow-inner">
                                          <div className="space-y-2"><Label className="text-[9px] font-black">VALUE 1</Label><Input value={c.content.v1} onChange={e => updateComp(i, {v1: e.target.value})} className="rounded-xl font-black text-primary" /></div>
                                          <div className="space-y-2"><Label className="text-[9px] font-black">TITLE 1</Label><Input value={c.content.t1} onChange={e => updateComp(i, {t1: e.target.value})} className="rounded-xl font-bold" /></div>
                                          <div className="space-y-2"><Label className="text-[9px] font-black">VALUE 2</Label><Input value={c.content.v2} onChange={e => updateComp(i, {v2: e.target.value})} className="rounded-xl font-black text-primary" /></div>
                                          <div className="space-y-2"><Label className="text-[9px] font-black">TITLE 2</Label><Input value={c.content.t2} onChange={e => updateComp(i, {t2: e.target.value})} className="rounded-xl font-bold" /></div>
                                        </div>
                                      )}

                                      {c.type === 'html' && (
                                        <div className="col-span-2 space-y-4">
                                          <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Neural Code Injection (HTML/CSS)</Label>
                                          <Textarea value={c.content.code} onChange={e => updateComp(i, {code: e.target.value})} className="font-mono text-sm h-64 bg-slate-900 text-emerald-400 rounded-3xl border-none shadow-2xl p-8" />
                                        </div>
                                      )}
                                   </div>
                                </div>
                              ) : (
                                <div className="p-0 animate-in fade-in slide-in-from-top-4">
                                   <Textarea 
                                     value={JSON.stringify(c.content, null, 2)} 
                                     onChange={e => {
                                        try {
                                          const parsed = JSON.parse(e.target.value);
                                          updateComp(i, parsed);
                                        } catch (err) {}
                                     }}
                                     className="font-mono text-xs h-96 bg-slate-900 text-blue-300 rounded-none border-none p-10 leading-relaxed" 
                                   />
                                </div>
                              )}
                           </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                 </AnimatePresence>
                 
                 {components.length === 0 && (
                   <div className="py-40 text-center space-y-6">
                      <div className="size-32 rounded-[2.5rem] bg-white shadow-xl mx-auto flex items-center justify-center text-slate-200 border-4 border-dashed border-slate-100">
                         <Layout size={64}/>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">Your Canvas is Ready</h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2">Select a component from the left sidebar to start building your municipal page.</p>
                      </div>
                   </div>
                 )}
              </div>
           </ScrollArea>
        </div>
      </main>
    </div>
  );
}

function WidgetBtn({ icon, label, onClick }: any) {
  return (
    <Button variant="ghost" onClick={onClick} className="flex flex-col h-28 gap-4 bg-white/5 hover:bg-accent hover:text-slate-900 border border-white/10 rounded-[1.5rem] transition-all group">
      <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-slate-900/10 transition-colors">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </Button>
  );
}

function CompModeBtn({ active, onClick, icon, label }: any) {
  return (
    <Button variant="ghost" size="xs" onClick={onClick} className={cn("h-10 px-6 gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", active ? "bg-accent text-slate-900 shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
      {icon} {label}
    </Button>
  );
}

function ComponentRenderer({ type, content, lang }: any) {
  const isAr = lang === 'ar';
  
  switch (type) {
    case 'heading': 
      return <h2 className={cn("font-black text-primary tracking-tighter text-center", content.level === 'h1' ? "text-6xl md:text-8xl" : "text-4xl md:text-5xl")}>{isAr ? content.textAr : content.textEn}</h2>;
    
    case 'text': 
      return <p className="text-slate-600 leading-loose text-2xl text-center font-medium max-w-4xl mx-auto whitespace-pre-wrap">{isAr ? content.bodyAr : content.bodyEn}</p>;
    
    case 'info': 
      return (
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white max-w-4xl mx-auto overflow-hidden border-t-8 border-primary relative">
           <div className="absolute top-0 right-0 size-40 dm-wave-5 opacity-5 -rotate-45" />
           <CardContent className="p-16 text-center">
              <div className="text-3xl font-black text-slate-800 leading-relaxed italic">
                "{isAr ? content.bodyAr : content.bodyEn}"
              </div>
           </CardContent>
        </Card>
      );
    
    case 'stats': 
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
           <div className="p-10 bg-primary text-white rounded-[2.5rem] shadow-2xl space-y-2">
              <h3 className="text-5xl font-black text-accent">{content.v1}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{content.t1}</p>
           </div>
           <div className="p-10 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl space-y-2 border-t-4 border-accent">
              <h3 className="text-5xl font-black text-accent">{content.v2}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{content.t2}</p>
           </div>
        </div>
      );
    
    case 'accordion': 
      return (
        <Card className="max-w-4xl mx-auto rounded-[2.5rem] border-none shadow-xl bg-white p-12">
          <Accordion type="single" collapsible className="w-full">
            {content.items?.map((item: any, idx: number) => (
              <AccordionItem key={idx} value={`i-${idx}`} className="border-slate-100 last:border-0 py-4">
                <AccordionTrigger className="text-2xl font-black text-primary hover:text-accent transition-colors no-underline">
                  {isAr ? item.titleAr : item.titleEn}
                </AccordionTrigger>
                <AccordionContent className="text-xl text-slate-500 font-bold leading-loose pt-6">
                  {isAr ? item.contentAr : item.contentEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      );

    case 'tabs':
      return (
        <Card className="max-w-5xl mx-auto rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
          <Tabs defaultValue="tab-0" className="w-full">
            <TabsList className="w-full h-24 bg-slate-950 rounded-none p-0 flex">
              {content.items?.map((item: any, idx: number) => (
                <TabsTrigger key={idx} value={`tab-${idx}`} className="flex-1 rounded-none text-white/40 data-[state=active]:bg-accent data-[state=active]:text-slate-900 font-black text-xl h-full border-x border-white/5 transition-all">
                  {isAr ? item.titleAr : item.titleEn}
                </TabsTrigger>
              ))}
            </TabsList>
            {content.items?.map((item: any, idx: number) => (
              <TabsContent key={idx} value={`tab-${idx}`} className="p-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="text-3xl text-slate-700 font-medium leading-loose">
                   {isAr ? item.contentAr : item.contentEn}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      );
    
    case 'html': 
      return <div className="rounded-[3rem] overflow-hidden border shadow-inner" dangerouslySetInnerHTML={{ __html: content.code }} />;
    
    case 'avatar': 
      return (
        <div className="flex flex-col items-center gap-6">
           <Avatar className="size-48 border-[12px] border-white shadow-2xl">
              <AvatarImage src={content.src} />
              <AvatarFallback className="bg-primary text-white text-6xl font-black">{isAr ? content.nameAr?.[0] : content.nameEn?.[0]}</AvatarFallback>
           </Avatar>
           <div className="text-center">
              <h4 className="text-3xl font-black text-primary tracking-tighter">{isAr ? content.nameAr : content.nameEn}</h4>
              <Badge className="bg-accent text-slate-900 font-black mt-2 px-6 py-1 rounded-full uppercase tracking-widest text-[10px]">Authorized Identity</Badge>
           </div>
        </div>
      );

    case 'pdf':
      return (
        <div className="flex justify-center">
           <div className="group flex items-center gap-10 p-12 rounded-[3.5rem] bg-white shadow-2xl border-4 border-transparent hover:border-primary transition-all">
              <div className="size-24 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                <FileText size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-800">{isAr ? content.labelAr : content.labelEn}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Official Document Viewer <ExternalLink size={14}/></p>
              </div>
           </div>
        </div>
      );

    case 'separator':
      return <Separator className="max-w-4xl mx-auto h-px bg-slate-200 my-16" />;
    
    default: 
      return <div className="p-16 border-4 border-dashed rounded-[3rem] bg-slate-50 text-slate-300 font-black text-center text-2xl uppercase tracking-[0.3em]">Widget Area: {type}</div>;
  }
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <PageBuilderContent />
    </Suspense>
  );
}

