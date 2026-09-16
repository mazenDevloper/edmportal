
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
  ExternalLink, CheckCircle2, PlayCircle, Users, ShieldCheck, Mail, Brush, Palette,
  Maximize2, Height, Smartphone, Monitor, Code2
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [compModes, setCompModes] = useState<Record<string, 'preview' | 'settings' | 'css' | 'code'>>({});

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
      avatar: { nameAr: 'معالي محافظ ظفار', nameEn: 'HE Governor of Dhofar', src: 'https://picsum.photos/seed/gov/200/200' },
      badge: { textAr: 'خدمة معتمدة', textEn: 'Certified Service' },
      table: { headers: ['الخدمة البلديّة', 'الرسوم'], rows: [{ c1: 'تجديد عقود الإيجار', c2: '15 OMR' }, { c1: 'ترخيص البناء', c2: '50 OMR' }] },
      accordion: { items: [{ titleAr: 'كيف يمكنني الدخول للنظام؟', titleEn: 'How to access the system?', contentAr: 'عبر نظام ثقة الموحد للهوية الرقمية.', contentEn: 'Via the Unified Thiqa Digital ID System.' }] },
      tabs: { items: [{ titleAr: 'المتطلبات', titleEn: 'Requirements', contentAr: 'البطاقة الشخصية سارية المفعول.', contentEn: 'Valid Resident ID Card.' }] },
      html: { code: '<div class="p-12 border-4 border-dashed rounded-[3rem] text-center bg-slate-50 text-slate-400 font-black text-xl uppercase tracking-widest">Neural HTML Container</div>' },
      style: { code: '/* Custom Global CSS */\n.custom-widget {\n  border: 1px solid transparent;\n}' }
    };
    const newComp = { 
      id, type, content: defaultContents[type] || {}, 
      customCss: '', gridSpan: 12, gridHeight: 'auto', 
      codeType: 'react' 
    };
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
    nc[idx] = { ...nc[idx], ...updates };
    setComponents(nc);
  };

  const handleAiTranslate = async (text: string, compIdx: number) => {
    if (!text) return;
    try {
      const { translatedText } = await translateToEnglish({ text });
      const comp = components[compIdx];
      const fieldKey = comp.content.bodyAr !== undefined ? 'bodyEn' : comp.content.textAr !== undefined ? 'textEn' : 'labelEn';
      const newContent = { ...comp.content, [fieldKey]: translatedText };
      updateComp(compIdx, { content: newContent });
      toast({ title: "AI Translation Done" });
    } catch (e) {
      toast({ variant: "destructive", title: "Translation Failed" });
    }
  };

  return (
    <div className={cn("min-h-screen bg-slate-100 flex flex-col", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="flex-1 flex overflow-hidden">
        {/* Widget Sidebar */}
        <aside className="w-80 bg-slate-900 text-white flex flex-col border-r border-white/5 shadow-2xl z-20">
           <div className="p-8 bg-slate-950 border-b border-white/10">
              <span className="font-black text-xs uppercase tracking-[0.3em] text-accent block">Components Hub</span>
              <span className="text-[10px] text-white/30 font-bold uppercase">Dhofar Neural Library</span>
           </div>
           
           <ScrollArea className="flex-1 p-8">
              <div className="space-y-10">
                <section>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Structural</p>
                   <div className="grid grid-cols-2 gap-3">
                      <WidgetBtn icon={<Heading1/>} label="Heading" onClick={() => addComponent('heading')} />
                      <WidgetBtn icon={<Type/>} label="Rich Text" onClick={() => addComponent('text')} />
                      <WidgetBtn icon={<Layers/>} label="Tabs" onClick={() => addComponent('tabs')} />
                      <WidgetBtn icon={<Minus/>} label="Separator" onClick={() => addComponent('separator')} />
                   </div>
                </section>
                <section>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Interactive</p>
                   <div className="grid grid-cols-2 gap-3">
                      <WidgetBtn icon={<Info/>} label="Info Card" onClick={() => addComponent('info')} />
                      <WidgetBtn icon={<TableIcon/>} label="Data Table" onClick={() => addComponent('table')} />
                      <WidgetBtn icon={<TrendingUp/>} label="Stats Grid" onClick={() => addComponent('stats')} />
                      <WidgetBtn icon={<List/>} label="FAQ List" onClick={() => addComponent('accordion')} />
                   </div>
                </section>
                <section>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Branding</p>
                   <div className="grid grid-cols-2 gap-3">
                      <WidgetBtn icon={<FileText/>} label="PDF Link" onClick={() => addComponent('pdf')} />
                      <WidgetBtn icon={<User/>} label="Avatar" onClick={() => addComponent('avatar')} />
                      <WidgetBtn icon={<Code/>} label="Raw HTML" onClick={() => addComponent('html')} />
                      <WidgetBtn icon={<Brush/>} label="Style Inject" onClick={() => addComponent('style')} />
                   </div>
                </section>
              </div>
           </ScrollArea>
           
           <div className="p-8 border-t border-white/10 bg-slate-950">
              <Button onClick={handleSave} disabled={saving} className="w-full dm-gradient-primary rounded-2xl font-black h-16 shadow-2xl text-lg gap-3">
                 {saving ? <Loader2 className="animate-spin" /> : <Globe size={24} />} {isAr ? "نشر الصفحة" : "Publish Page"}
              </Button>
           </div>
        </aside>

        {/* Live Canvas */}
        <div className="flex-1 flex flex-col relative bg-[#f4f7f9]">
           <header className="bg-white border-b px-10 py-6 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-8">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Title</Label>
                    <Input value={pageMeta.titleAr} onChange={e => setPageMeta({...pageMeta, titleAr: e.target.value})} className="h-11 font-black w-80 text-lg rounded-xl border-slate-100" />
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-2xl border">
                    <Button variant={previewLang === 'ar' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('ar')} className={cn("rounded-xl h-9 px-6 text-xs font-black", previewLang === 'ar' ? "bg-primary text-white" : "text-slate-500")}>AR PREVIEW</Button>
                    <Button variant={previewLang === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewLang('en')} className={cn("rounded-xl h-9 px-6 text-xs font-black", previewLang === 'en' ? "bg-primary text-white" : "text-slate-500")}>EN PREVIEW</Button>
                 </div>
              </div>
              <div className="text-right">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Slug URL</Label>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border font-mono text-xs font-bold">
                  <span className="text-slate-400">/p/</span>
                  <Input value={pageMeta.slug} onChange={e => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="h-6 w-40 border-none bg-transparent p-0 focus:ring-0" placeholder="url-slug" />
                </div>
              </div>
           </header>

           <ScrollArea className="flex-1 p-12">
              <div className="max-w-6xl mx-auto grid grid-cols-12 gap-8 pb-32">
                 <AnimatePresence>
                    {components.map((c, i) => (
                      <motion.div 
                        key={c.id} 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        style={{ 
                          width: c.gridSpan === 0 ? (c.customWidth || '100%') : undefined,
                          height: c.gridHeight === 'custom' ? (c.customHeight || 'auto') : undefined
                        }}
                        className={cn(
                          "group/canvas relative", 
                          c.gridSpan === 3 ? "col-span-3" : 
                          c.gridSpan === 4 ? "col-span-4" : 
                          c.gridSpan === 6 ? "col-span-6" : 
                          c.gridSpan === 9 ? "col-span-9" : 
                          c.gridSpan === 12 ? "col-span-12" : "col-span-12"
                        )}
                      >
                        {/* Interactive Controls Overlay */}
                        <div className="absolute -left-12 top-0 flex flex-col gap-2 opacity-0 group-hover/canvas:opacity-100 transition-all z-20">
                           <Button variant="outline" size="icon" onClick={() => {
                             const nc = [...components];
                             if(i>0) {[nc[i], nc[i-1]] = [nc[i-1], nc[i]]; setComponents(nc);}
                           }} className="size-10 rounded-xl bg-white shadow-xl text-primary border-none"><ChevronUp size={20}/></Button>
                           <Button variant="outline" size="icon" onClick={() => {
                             const nc = [...components];
                             if(i < components.length - 1) {[nc[i], nc[i+1]] = [nc[i+1], nc[i]]; setComponents(nc);}
                           }} className="size-10 rounded-xl bg-white shadow-xl text-primary border-none"><ChevronDown size={20}/></Button>
                           <Button variant="outline" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="size-10 rounded-xl bg-white text-red-500 shadow-xl border-none"><Trash2 size={20}/></Button>
                        </div>

                        <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white ring-1 ring-slate-100 group-hover/canvas:ring-primary/20 h-full flex flex-col transition-all">
                           <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <GripVertical className="text-white/20" size={16}/>
                                 
                                 {/* Width Control */}
                                 <Select value={(c.gridSpan || 12).toString()} onValueChange={v => updateComp(i, { gridSpan: parseInt(v) })}>
                                    <SelectTrigger className="h-7 w-28 bg-white/5 border-none text-white/50 text-[9px] font-black uppercase rounded-lg">
                                       <div className="flex items-center gap-1.5"><Monitor size={10}/> Width: {v => v === '0' ? 'Custom' : `${Math.round((parseInt(v)/12)*100)}%`}</div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                       <SelectItem value="3">25% (Narrow)</SelectItem>
                                       <SelectItem value="4">33% (Third)</SelectItem>
                                       <SelectItem value="6">50% (Half)</SelectItem>
                                       <SelectItem value="9">75% (Wide)</SelectItem>
                                       <SelectItem value="12">100% (Full)</SelectItem>
                                       <SelectItem value="0" className="text-accent font-bold">CUSTOM WIDTH</SelectItem>
                                    </SelectContent>
                                 </Select>

                                 {/* Height Control */}
                                 <Select value={c.gridHeight || 'auto'} onValueChange={v => updateComp(i, { gridHeight: v })}>
                                    <SelectTrigger className="h-7 w-28 bg-white/5 border-none text-white/50 text-[9px] font-black uppercase rounded-lg">
                                       <div className="flex items-center gap-1.5"><Maximize2 size={10}/> Height: {c.gridHeight?.toUpperCase()}</div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                       <SelectItem value="auto">Auto (Content)</SelectItem>
                                       <SelectItem value="sm">Small (200px)</SelectItem>
                                       <SelectItem value="md">Medium (400px)</SelectItem>
                                       <SelectItem value="lg">Large (600px)</SelectItem>
                                       <SelectItem value="full">Full Screen</SelectItem>
                                       <SelectItem value="custom" className="text-accent font-bold">CUSTOM HEIGHT</SelectItem>
                                    </SelectContent>
                                 </Select>

                                 {c.gridSpan === 0 && (
                                   <Input value={c.customWidth || ''} onChange={e => updateComp(i, { customWidth: e.target.value })} className="h-7 w-20 bg-white/10 border-none text-white text-[10px] rounded-lg" placeholder="e.g. 200px" />
                                 )}
                                 {c.gridHeight === 'custom' && (
                                   <Input value={c.customHeight || ''} onChange={e => updateComp(i, { customHeight: e.target.value })} className="h-7 w-20 bg-white/10 border-none text-white text-[10px] rounded-lg" placeholder="e.g. 50vh" />
                                 )}
                              </div>
                              <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                 <CompModeBtn active={compModes[c.id] === 'preview'} onClick={() => setCompModes({...compModes, [c.id]: 'preview'})} icon={<Eye size={12}/>} label="Preview" />
                                 <CompModeBtn active={compModes[c.id] === 'settings'} onClick={() => setCompModes({...compModes, [c.id]: 'settings'})} icon={<Settings2 size={12}/>} label="Settings" />
                                 <CompModeBtn active={compModes[c.id] === 'css'} onClick={() => setCompModes({...compModes, [c.id]: 'css'})} icon={<Palette size={12}/>} label="CSS" />
                                 <CompModeBtn active={compModes[c.id] === 'code'} onClick={() => setCompModes({...compModes, [c.id]: 'code'})} icon={<Code2 size={12}/>} label="Edit Stack" />
                              </div>
                           </div>
                           
                           <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                              {compModes[c.id] === 'preview' ? (
                                <div className={cn("p-10 flex-1 overflow-auto", previewLang === 'ar' ? "font-arabic" : "font-sans")} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                                   <ComponentRenderer type={c.type} content={c.content} lang={previewLang} customCss={c.customCss} />
                                </div>
                              ) : compModes[c.id] === 'settings' ? (
                                <div className="p-10 bg-slate-50 space-y-6 animate-in fade-in zoom-in-95 flex-1 overflow-auto">
                                   <div className="grid md:grid-cols-2 gap-8">
                                      {c.type === 'style' || c.type === 'html' ? (
                                        <div className="col-span-2 space-y-4">
                                          <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Raw Component Editor</Label>
                                          <Textarea 
                                            value={c.content.code} 
                                            onChange={e => updateComp(i, { content: { ...c.content, code: e.target.value } })} 
                                            className="font-mono text-sm h-96 bg-slate-950 text-emerald-400 rounded-[2.5rem] border-none shadow-2xl p-10 leading-relaxed resize-none focus:ring-0" 
                                          />
                                        </div>
                                      ) : ['accordion', 'tabs'].includes(c.type) ? (
                                        <div className="col-span-2 space-y-6">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-xs font-black uppercase text-primary">Dynamic Elements Management</Label>
                                            <Button size="sm" onClick={() => updateComp(i, { content: { ...c.content, items: [...(c.content.items || []), { titleAr: 'عنوان جديد', titleEn: 'New Item', contentAr: 'محتوى جديد', contentEn: 'New Body' }] } })} className="h-8 rounded-lg bg-primary text-[10px] font-black uppercase tracking-widest">+ Add New</Button>
                                          </div>
                                          <div className="space-y-4">
                                            {c.content.items?.map((item: any, itemIdx: number) => (
                                              <div key={itemIdx} className="p-6 bg-white border rounded-2xl shadow-sm relative group/item">
                                                <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-red-400 opacity-0 group-hover/item:opacity-100" onClick={() => {
                                                  const ni = c.content.items.filter((_: any, idx: number) => idx !== itemIdx);
                                                  updateComp(i, { content: { ...c.content, items: ni } });
                                                }}><X size={14}/></Button>
                                                <div className="grid grid-cols-2 gap-4">
                                                  <Input value={item.titleAr} onChange={e => {
                                                    const ni = [...c.content.items]; ni[itemIdx].titleAr = e.target.value; updateComp(i, { content: { ...c.content, items: ni } });
                                                  }} className="h-9 rounded-lg font-bold" placeholder="Title AR" />
                                                  <Input value={item.titleEn} onChange={e => {
                                                    const ni = [...c.content.items]; ni[itemIdx].titleEn = e.target.value; updateComp(i, { content: { ...c.content, items: ni } });
                                                  }} className="h-9 rounded-lg font-bold" placeholder="Title EN" />
                                                  <Textarea value={item.contentAr} onChange={e => {
                                                    const ni = [...c.content.items]; ni[itemIdx].contentAr = e.target.value; updateComp(i, { content: { ...c.content, items: ni } });
                                                  }} className="min-h-[60px] rounded-lg text-xs col-span-2" placeholder="Body AR" />
                                                  <Textarea value={item.contentEn} onChange={e => {
                                                    const ni = [...c.content.items]; ni[itemIdx].contentEn = e.target.value; updateComp(i, { content: { ...c.content, items: ni } });
                                                  }} className="min-h-[60px] rounded-lg text-xs col-span-2" placeholder="Body EN" />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="space-y-4">
                                             <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Arabic Meta Content</Label>
                                             {['bodyAr', 'textAr', 'labelAr'].some(k => c.content[k] !== undefined) ? (
                                               <Textarea value={c.content.bodyAr || c.content.textAr || c.content.labelAr} onChange={e => updateComp(i, { content: { ...c.content, [c.content.bodyAr !== undefined ? 'bodyAr' : c.content.textAr !== undefined ? 'textAr' : 'labelAr']: e.target.value } })} className="bg-white font-black min-h-[140px] rounded-2xl border-slate-200" />
                                             ) : <p className="text-xs font-bold text-slate-400 italic">Static element (No text fields).</p>}
                                          </div>
                                          
                                          <div className="space-y-4">
                                             <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase text-accent tracking-widest">English Meta Content</Label>
                                                <Button variant="ghost" className="h-6 text-accent font-black gap-1 text-[9px]" onClick={() => handleAiTranslate(c.content.bodyAr || c.content.textAr || c.content.labelAr, i)}>
                                                  <Sparkles size={10}/> NEURAL TRANSLATE
                                                </Button>
                                             </div>
                                             {['bodyEn', 'textEn', 'labelEn'].some(k => c.content[k] !== undefined) ? (
                                               <Textarea value={c.content.bodyEn || c.content.textEn || c.content.labelEn} onChange={e => updateComp(i, { content: { ...c.content, [c.content.bodyEn !== undefined ? 'bodyEn' : c.content.textEn !== undefined ? 'textEn' : 'labelEn']: e.target.value } })} className="bg-white font-bold min-h-[140px] rounded-2xl border-slate-200" />
                                             ) : null}
                                          </div>
                                        </>
                                      )}
                                   </div>
                                </div>
                              ) : compModes[c.id] === 'css' ? (
                                <div className="flex-1 bg-slate-950 flex flex-col">
                                   <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                                      <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Custom Component CSS</Label>
                                      <p className="text-[8px] text-white/30 uppercase">Scoped Styles</p>
                                   </div>
                                   <Textarea 
                                      value={c.customCss || ''} 
                                      onChange={e => updateComp(i, { customCss: e.target.value })} 
                                      className="flex-1 font-mono text-sm bg-transparent text-blue-300 border-none p-10 leading-relaxed resize-none focus:ring-0" 
                                      placeholder="/* Write custom CSS for this widget here... */"
                                   />
                                </div>
                              ) : (
                                <div className="flex-1 bg-slate-950 flex flex-col">
                                   <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                                      <div className="flex gap-2">
                                         {['html', 'react', 'dotnet'].map(stack => (
                                           <Button key={stack} variant="ghost" size="xs" onClick={() => updateComp(i, { codeType: stack })} className={cn("h-7 px-4 rounded-lg font-black text-[9px] uppercase", c.codeType === stack ? "bg-accent text-slate-900" : "text-white/40 hover:text-white")}>
                                              {stack.toUpperCase()}
                                           </Button>
                                         ))}
                                      </div>
                                      <Label className="text-[10px] font-black uppercase text-accent tracking-widest">PRO Code Stack</Label>
                                   </div>
                                   <Textarea 
                                     value={typeof c.content === 'object' ? JSON.stringify(c.content, null, 2) : c.content} 
                                     onChange={e => {
                                        try {
                                          // If it's pure text/code (React/Dotnet/HTML), just store as string
                                          if (['react', 'dotnet', 'html'].includes(c.codeType || '')) {
                                            updateComp(i, { content: e.target.value });
                                          } else {
                                            const parsed = JSON.parse(e.target.value);
                                            updateComp(i, { content: parsed });
                                          }
                                        } catch (err) {
                                          // Fallback to string if JSON fails
                                          updateComp(i, { content: e.target.value });
                                        }
                                     }}
                                     className="flex-1 font-mono text-xs bg-transparent text-emerald-400 border-none p-10 leading-relaxed focus:ring-0 resize-none" 
                                   />
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
    <Button variant="ghost" size="xs" onClick={onClick} className={cn("h-8 px-4 gap-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all", active ? "bg-accent text-slate-900 shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5")}>
      {icon} {label}
    </Button>
  );
}

function ComponentRenderer({ type, content, lang, customCss }: any) {
  const isAr = lang === 'ar';
  
  const RenderContent = () => {
    switch (type) {
      case 'style': return <div className="p-8 border-2 border-dashed rounded-3xl bg-slate-50 text-center"><Brush className="mx-auto mb-2 text-accent" /><p className="text-[10px] font-black text-slate-400 uppercase">Neural Style Injector Active</p></div>;
      case 'heading': return <h2 className={cn("font-black text-primary tracking-tighter text-center", content.level === 'h1' ? "text-6xl md:text-8xl" : "text-4xl md:text-5xl")}>{isAr ? content.textAr : content.textEn}</h2>;
      case 'text': return <p className="text-slate-600 leading-loose text-2xl text-center font-medium max-w-4xl mx-auto whitespace-pre-wrap">{isAr ? content.bodyAr : content.bodyEn}</p>;
      case 'info': return (
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white max-w-4xl mx-auto overflow-hidden border-t-8 border-primary">
          <CardContent className="p-16 text-center text-3xl font-black text-slate-800 italic leading-relaxed">"{isAr ? content.bodyAr : content.bodyEn}"</CardContent>
        </Card>
      );
      case 'stats': return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
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
      case 'accordion': return (
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-12 w-full">
          <Accordion type="single" collapsible className="w-full">
            {content.items?.map((item: any, idx: number) => (
              <AccordionItem key={idx} value={`i-${idx}`} className="border-slate-100 py-4">
                <AccordionTrigger className="text-2xl font-black text-primary hover:text-accent no-underline">{isAr ? item.titleAr : item.titleEn}</AccordionTrigger>
                <AccordionContent className="text-xl text-slate-500 font-bold leading-loose pt-6">{isAr ? item.contentAr : item.contentEn}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      );
      case 'tabs': return (
        <Card className="w-full rounded-[3.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <Tabs defaultValue="tab-0" className="w-full">
            <TabsList className="w-full h-24 bg-slate-950 rounded-none p-0 flex">
              {content.items?.map((item: any, idx: number) => (
                <TabsTrigger key={idx} value={`tab-${idx}`} className="flex-1 rounded-none text-white/40 data-[state=active]:bg-accent data-[state=active]:text-slate-900 font-black text-xl h-full border-x border-white/5 transition-all">
                  {isAr ? item.titleAr : item.titleEn}
                </TabsTrigger>
              ))}
            </TabsList>
            {content.items?.map((item: any, idx: number) => (
              <TabsContent key={idx} value={`tab-${idx}`} className="p-20 text-center animate-in fade-in zoom-in-95">
                <div className="text-3xl text-slate-700 font-medium leading-loose">{isAr ? item.contentAr : item.contentEn}</div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      );
      case 'html': return <div className="rounded-[2rem] overflow-hidden w-full" dangerouslySetInnerHTML={{ __html: content.code || '' }} />;
      case 'avatar': return (
        <div className="flex flex-col items-center gap-6">
           <Avatar className="size-48 border-[12px] border-white shadow-2xl">
              <AvatarImage src={content.src} />
              <AvatarFallback className="bg-primary text-white text-6xl font-black">{isAr ? content.nameAr?.[0] : content.nameEn?.[0]}</AvatarFallback>
           </Avatar>
           <div className="text-center">
              <h4 className="text-3xl font-black text-primary tracking-tighter">{isAr ? content.nameAr : content.nameEn}</h4>
              <Badge className="bg-accent text-slate-900 font-black mt-2 px-6 py-1 rounded-full uppercase tracking-widest text-[10px]">Neural Identity Active</Badge>
           </div>
        </div>
      );
      case 'pdf': return (
        <div className="flex justify-center w-full">
           <a href={content.url} target="_blank" className="group flex items-center gap-10 p-12 rounded-[3.5rem] bg-white shadow-2xl border-4 border-transparent hover:border-primary transition-all">
                <div className="size-24 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                  <FileText size={48} />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-slate-800">{isAr ? content.labelAr : content.labelEn}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Official Document Hub <ExternalLink size={12}/></p>
                </div>
           </a>
        </div>
      );
      case 'badge': return <div className="flex justify-center w-full"><Badge className="bg-accent text-slate-900 font-black text-xl px-10 py-3 rounded-2xl shadow-lg animate-pulse">{isAr ? content.textAr : content.textEn}</Badge></div>;
      case 'table': return (
        <Card className="w-full rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-900"><TableRow>{content.headers?.map((h: string, idx: number) => (<TableHead key={idx} className="font-black p-6 text-white text-lg">{h}</TableHead>))}</TableRow></TableHeader>
            <TableBody>{content.rows?.map((row: any, idx: number) => (<TableRow key={idx} className="hover:bg-slate-50 transition-colors"><TableCell className="font-bold p-6 text-lg">{row.c1}</TableCell><TableCell className="font-black text-emerald-600 p-6 text-lg">{row.c2}</TableCell></TableRow>))}</TableBody>
          </Table>
        </Card>
      );
      case 'separator': return <Separator className="w-full h-px bg-slate-200 my-16" />;
      default: return <div className="p-16 border-4 border-dashed rounded-[3rem] bg-slate-50 text-slate-300 font-black text-center text-2xl uppercase">Component: {type}</div>;
    }
  };

  return (
    <div className="custom-widget-container h-full">
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      <RenderContent />
    </div>
  );
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <PageBuilderContent />
    </Suspense>
  );
}
