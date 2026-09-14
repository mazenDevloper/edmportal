
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, 
  Type, TrendingUp, Info, Loader2, Sparkles, Eye, 
  Heading1, Video, FileText, List, Minus, Table as TableIcon,
  Code, Database, User, Award, Layers, MousePointer2,
  ChevronRight, ChevronLeft, GripVertical, Settings2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CustomPage, BuilderComponent } from '@/lib/types';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        // Special case for components with text properties
        if (nc[targetKey].content.bodyAr) nc[targetKey].content.bodyEn = translatedText;
        if (nc[targetKey].content.textAr) nc[targetKey].content.textEn = translatedText;
        setComponents(nc);
      }
      toast({ title: isAr ? "تمت الترجمة بالذكاء الاصطناعي" : "AI Translation Complete" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setAiLoading(null);
    }
  };

  const addComponent = (type: BuilderComponent['type']) => {
    const defaultContents: Record<string, any> = {
      heading: { level: 'h2', textAr: 'عنوان جديد', textEn: 'New Heading' },
      text: { bodyAr: 'محتوى نصي جديد للمنصة...', bodyEn: 'New platform text content...' },
      info: { bodyAr: 'معلومات هامة لبلدية ظفار...', bodyEn: 'Important Dhofar Municipality info...' },
      accordion: { items: [{ titleAr: 'سؤال افتراضي', titleEn: 'Default Question', contentAr: 'إجابة افتراضية', contentEn: 'Default Answer' }] },
      table: { headers: ['الخدمة', 'الرسوم'], rows: [{ c1: 'خدمة تجريبية', c2: '10 OMR' }] },
      stats: { v1: '100+', t1: 'معاملة', v2: '500+', t2: 'مستخدم' },
      pdf: { labelAr: 'تحميل الدليل', labelEn: 'Download Guide', url: '#' },
      video: { url: '#' },
      avatar: { nameAr: 'ظفار', nameEn: 'Dhofar', src: '' },
      badge: { textAr: 'معتمد', textEn: 'Approved', variant: 'default' },
      stepper: { current: 1, steps: ['تقديم', 'مراجعة', 'إنجاز'] },
      tabs: { items: [{ titleAr: 'تبويب 1', titleEn: 'Tab 1', contentAr: 'محتوى 1', contentEn: 'Content 1' }] },
      cards_scroller: { items: [{ titleAr: 'بطاقة 1', titleEn: 'Card 1', descAr: 'وصف', descEn: 'Desc' }] },
      html: { code: '<div class="p-4 bg-slate-100 rounded-lg">Custom HTML</div>' }
    };

    const newComp: BuilderComponent = {
      id: `comp_${Date.now()}`,
      type,
      content: defaultContents[type] || {}
    };
    setComponents([...components, newComp]);
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
      toast({ title: isAr ? "تم الحفظ والتثبيت بنجاح" : "Page Saved & Deployed Successfully" });
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-[1600px] mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-primary flex items-center gap-4">
              <Layout className="text-accent size-10" /> 
              {isAr ? "باني الصفحات التفاعلي (Universal Builder)" : "Universal Page Orchestrator"}
            </h1>
            <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Omni-Channel Content Factory v4.0</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold h-12 px-8 border-slate-200 shadow-sm">
              <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة للوحة الإدارة" : "Back to Control Room"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-12 font-black shadow-xl h-12">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={18} className="ml-2" />}
              {isAr ? "نشر وتثبيت الصفحة" : "Push & Deploy Content"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Widget Toolbox Sidebar */}
          <aside className="lg:col-span-3 space-y-6 sticky top-28 h-[calc(100vh-160px)] overflow-hidden flex flex-col">
            <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-slate-900 text-white flex-1 flex flex-col">
              <CardHeader className="bg-slate-950 p-6 border-b border-white/5">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-accent flex items-center gap-3">
                  <Layers size={14}/> {isAr ? "مكتبة المكونات العصبية" : "Neural Widget Library"}
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-6">
                <Tabs defaultValue="basic" className="space-y-6">
                  <TabsList className="bg-white/5 border-none p-1 rounded-xl w-full">
                    <TabsTrigger value="basic" className="flex-1 text-[10px] font-black">{isAr ? 'أساسي' : 'BASIC'}</TabsTrigger>
                    <TabsTrigger value="advanced" className="flex-1 text-[10px] font-black">{isAr ? 'متقدم' : 'ADV'}</TabsTrigger>
                    <TabsTrigger value="branding" className="flex-1 text-[10px] font-black">{isAr ? 'براند' : 'BRAND'}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <WidgetBtn icon={<Heading1/>} label={isAr ? "عنوان" : "Heading"} onClick={() => addComponent('heading')} />
                    <WidgetBtn icon={<Type/>} label={isAr ? "نص حر" : "Rich Text"} onClick={() => addComponent('text')} />
                    <WidgetBtn icon={<Info/>} label={isAr ? "بطاقة" : "Info Card"} onClick={() => addComponent('info')} />
                    <WidgetBtn icon={<TableIcon/>} label={isAr ? "جدول" : "Data Table"} onClick={() => addComponent('table')} />
                    <WidgetBtn icon={<Minus/>} label={isAr ? "فاصل" : "Separator"} onClick={() => addComponent('separator')} />
                    <WidgetBtn icon={<List/>} label={isAr ? "أكورديون" : "Accordion"} onClick={() => addComponent('accordion')} />
                  </TabsContent>

                  <TabsContent value="advanced" className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <WidgetBtn icon={<TrendingUp/>} label={isAr ? "إحصائيات" : "Counters"} onClick={() => addComponent('stats')} />
                    <WidgetBtn icon={<Video/>} label={isAr ? "فيديو" : "Video"} onClick={() => addComponent('video')} />
                    <WidgetBtn icon={<FileText/>} label={isAr ? "ملف PDF" : "PDF Doc"} onClick={() => addComponent('pdf')} />
                    <WidgetBtn icon={<Code/>} label={isAr ? "HTML" : "Code Block"} onClick={() => addComponent('html')} />
                    <WidgetBtn icon={<MousePointer2/>} label={isAr ? "تبويبات" : "Tabs"} onClick={() => addComponent('tabs')} />
                    <WidgetBtn icon={<ImageIcon/>} label={isAr ? "معرض" : "Scroller"} onClick={() => addComponent('cards_scroller')} />
                  </TabsContent>

                  <TabsContent value="branding" className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <WidgetBtn icon={<User/>} label={isAr ? "أفتار" : "Avatar"} onClick={() => addComponent('avatar')} />
                    <WidgetBtn icon={<Award/>} label={isAr ? "شارة" : "Badge"} onClick={() => addComponent('badge')} />
                    <WidgetBtn icon={<Database/>} label={isAr ? "خدمات" : "Services"} onClick={() => addComponent('services')} />
                  </TabsContent>
                </Tabs>
              </ScrollArea>

              <div className="p-6 bg-accent/10 border-t border-white/5">
                 <div className="flex items-center gap-3 text-accent animate-pulse">
                    <div className="size-1.5 bg-accent rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Canvas Live Sync</span>
                 </div>
              </div>
            </Card>
          </aside>

          {/* Canvas & Editor Area */}
          <div className="lg:col-span-9 space-y-8">
            <Card className="p-8 rounded-[2.5rem] shadow-sm border bg-white border-primary/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-full dm-wave-5 opacity-5 pointer-events-none" />
               <div className="grid md:grid-cols-3 gap-8 relative z-10">
                 <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{isAr ? "اسم الصفحة التعريفي (AR)" : "INTERNAL PAGE TITLE (AR)"}</label>
                      <Input value={pageMeta.titleAr} onChange={(e) => setPageMeta({...pageMeta, titleAr: e.target.value})} className="font-black text-xl h-14 border-slate-200 pr-12 focus:ring-4 focus:ring-accent/5 rounded-2xl" placeholder="..." />
                      <Button size="icon" variant="ghost" className="absolute bottom-2 right-2 text-accent" onClick={() => handleAiTranslate(pageMeta.titleAr, 'meta')} disabled={aiLoading === 'meta'}>
                        {aiLoading === 'meta' ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-5" />}
                      </Button>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">PAGE SLUG / ROUTE</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">/p/</span>
                         <Input value={pageMeta.slug} onChange={(e) => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="h-14 font-mono pl-12 border-slate-200 rounded-2xl" placeholder="my-page-url" />
                      </div>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Global Deployment Status</p>
                    <div className="flex items-center justify-center gap-3">
                       <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
                       <span className="text-sm font-black text-primary">LIVE IN DATABASE</span>
                    </div>
                 </div>
               </div>
            </Card>

            <div className="space-y-6">
              {components.map((c, i) => (
                <Card key={c.id} className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white animate-in slide-in-from-bottom-4 group/card hover:ring-2 hover:ring-primary/20 transition-all">
                  <div className="flex justify-between items-center px-8 py-5 bg-slate-900 text-white">
                    <div className="flex items-center gap-4">
                       <div className="cursor-move text-white/30 hover:text-white transition-colors"><GripVertical size={20}/></div>
                       <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg uppercase text-[10px] tracking-[0.2em]">{c.type}</Badge>
                       <span className="text-white/40 text-[10px] font-bold">NODE ID: {c.id}</span>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" size="icon" onClick={() => moveComponent(i, 'up')} disabled={i === 0} className="text-white/40 hover:text-accent h-10 w-10"><ChevronUp/></Button>
                       <Button variant="ghost" size="icon" onClick={() => moveComponent(i, 'down')} disabled={i === components.length - 1} className="text-white/40 hover:text-accent h-10 w-10"><ChevronDown/></Button>
                       <Button variant="ghost" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="text-red-400 hover:bg-red-500/20 h-10 w-10"><Trash2 size={18}/></Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-10">
                    <div className="grid lg:grid-cols-12 gap-12">
                       <div className="lg:col-span-8 space-y-8">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4"><Settings2 size={14}/> Content Properties</h4>
                          
                          {(c.type === 'text' || c.type === 'info') && (
                            <div className="grid md:grid-cols-2 gap-8">
                               <div className="relative">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{isAr ? 'المحتوى (AR)' : 'Body (AR)'}</Label>
                                 <Textarea value={c.content.bodyAr} onChange={e => updateComp(i, { bodyAr: e.target.value })} className="min-h-[200px] font-bold text-lg rounded-[1.5rem] border-slate-200 pr-12" />
                                 <Button size="icon" variant="ghost" className="absolute bottom-2 right-2 text-accent" onClick={() => handleAiTranslate(c.content.bodyAr, i)}>
                                   <Sparkles size={18} />
                                 </Button>
                               </div>
                               <div>
                                 <Label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">BODY (EN - AI)</Label>
                                 <Textarea value={c.content.bodyEn} onChange={e => updateComp(i, { bodyEn: e.target.value })} className="min-h-[200px] font-medium text-lg rounded-[1.5rem] border-slate-200" />
                               </div>
                            </div>
                          )}

                          {c.type === 'heading' && (
                            <div className="grid md:grid-cols-3 gap-6">
                               <div className="relative col-span-2 grid grid-cols-2 gap-4">
                                  <div className="relative">
                                    <Input value={c.content.textAr} onChange={e => updateComp(i, { textAr: e.target.value })} className="h-12 font-black rounded-xl" />
                                    <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(c.content.textAr, i)}><Sparkles/></Button>
                                  </div>
                                  <Input value={c.content.textEn} onChange={e => updateComp(i, { textEn: e.target.value })} className="h-12 font-bold rounded-xl" />
                               </div>
                               <Select value={c.content.level} onValueChange={v => updateComp(i, { level: v })}>
                                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                     <SelectItem value="h1">H1 - Giant</SelectItem>
                                     <SelectItem value="h2">H2 - Medium</SelectItem>
                                     <SelectItem value="h3">H3 - Small</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>
                          )}

                          {c.type === 'stats' && (
                             <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2"><Label className="text-[9px]">VALUE 1</Label><Input value={c.content.v1} onChange={e => updateComp(i, { v1: e.target.value })} /></div>
                                <div className="space-y-2"><Label className="text-[9px]">LABEL 1 (AR)</Label><Input value={c.content.t1} onChange={e => updateComp(i, { t1: e.target.value })} /></div>
                                <div className="space-y-2"><Label className="text-[9px]">VALUE 2</Label><Input value={c.content.v2} onChange={e => updateComp(i, { v2: e.target.value })} /></div>
                                <div className="space-y-2"><Label className="text-[9px]">LABEL 2 (AR)</Label><Input value={c.content.t2} onChange={e => updateComp(i, { t2: e.target.value })} /></div>
                             </div>
                          )}

                          {c.type === 'pdf' && (
                            <div className="grid grid-cols-2 gap-6">
                               <Input placeholder="Label (AR)" value={c.content.labelAr} onChange={e => updateComp(i, { labelAr: e.target.value })} />
                               <Input placeholder="Document URL / Link" value={c.content.url} onChange={e => updateComp(i, { url: e.target.value })} />
                            </div>
                          )}
                       </div>

                       <div className="lg:col-span-4 bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Eye size={14}/> Blueprint Preview</p>
                          <div className="w-full flex flex-col items-center justify-center opacity-60 pointer-events-none scale-90">
                             {/* Mini-mockup of the widget */}
                             <div className="w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                                {c.type === 'heading' && <div className="h-6 w-3/4 bg-primary/20 rounded" />}
                                {c.type === 'text' && <div className="space-y-2"><div className="h-2 w-full bg-slate-200 rounded" /><div className="h-2 w-full bg-slate-200 rounded" /><div className="h-2 w-1/2 bg-slate-200 rounded" /></div>}
                                {c.type === 'stats' && <div className="flex gap-4"><div className="h-12 w-12 bg-accent/20 rounded-xl" /><div className="h-12 w-12 bg-accent/20 rounded-xl" /></div>}
                             </div>
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {components.length === 0 && (
                <div className="py-40 text-center border-4 border-dashed rounded-[4rem] border-slate-100 bg-slate-50/50">
                  <div className="size-24 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-200"><Layout size={48}/></div>
                  <h3 className="text-2xl font-black text-slate-300">{isAr ? "ابدأ ببناء صفحتك الآن" : "Your Canvas is Empty"}</h3>
                  <p className="text-slate-400 font-bold mt-2">{isAr ? "اسحب المكونات من المكتبة الجانبية للبدء" : "Add components from the left sidebar to start building"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );

  function updateComp(idx: number, updates: any) {
    const nc = [...components];
    nc[idx].content = { ...nc[idx].content, ...updates };
    setComponents(nc);
  }
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

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={cn("text-sm font-black text-slate-700", className)}>{children}</label>;
}
