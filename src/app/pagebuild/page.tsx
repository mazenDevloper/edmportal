
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, 
  Type, TrendingUp, Info, Loader2, Sparkles, Eye, 
  Heading1, Video, FileText, List, Minus, Table as TableIcon,
  Code, Database
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
        nc[targetKey].content.bodyEn = translatedText;
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
    const newComp: BuilderComponent = {
      id: `comp_${Date.now()}`,
      type,
      content: type === 'heading' ? { level: 'h2', textAr: 'عنوان جديد', textEn: 'New Heading' } : 
               type === 'text' || type === 'info' ? { bodyAr: 'محتوى نصي جديد', bodyEn: 'New text content' } : 
               type === 'accordion' ? { items: [{ titleAr: 'سؤال', titleEn: 'Question', contentAr: 'جواب', contentEn: 'Answer' }] } :
               type === 'html' ? { code: '<div></div>' } : {}
    };
    setComponents([...components, newComp]);
  };

  const updateComponentContent = (idx: number, updates: any) => {
    const nc = [...components];
    nc[idx].content = { ...nc[idx].content, ...updates };
    setComponents(nc);
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
      toast({ title: isAr ? "تم الحفظ والتثبيت" : "Page Saved & Deployed" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Save Error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <Layout className="text-accent" /> {isAr ? "باني الصفحات الذكي" : "Universal Page Builder"}
          </h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
              <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ وتثبيت" : "Save & Deploy"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24 overflow-hidden border-none bg-white">
            <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-xs font-black uppercase tracking-widest">{isAr ? "المكتبة" : "Widgets"}</CardTitle></CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addComponent('heading')} className="justify-start gap-2 font-black text-xs"><Heading1 size={14}/> {isAr ? "عناوين" : "Headings"}</Button>
              <Button variant="outline" onClick={() => addComponent('info')} className="justify-start gap-2 font-black text-xs"><Info size={14}/> {isAr ? "البطاقة الرئيسية" : "Main Card"}</Button>
              <Button variant="outline" onClick={() => addComponent('text')} className="justify-start gap-2 font-black text-xs"><Type size={14}/> {isAr ? "نص عادي" : "Text"}</Button>
              <Button variant="outline" onClick={() => addComponent('accordion')} className="justify-start gap-2 font-black text-xs"><List size={14}/> {isAr ? "أكورديون" : "Accordion"}</Button>
              <Button variant="outline" onClick={() => addComponent('html')} className="justify-start gap-2 font-black text-xs"><Code size={14}/> {isAr ? "كود مخصص" : "HTML Block"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8 rounded-brand shadow-sm border bg-white space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="relative">
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{isAr ? "عنوان الصفحة (AR)" : "Page Title (AR)"}</label>
                   <Input value={pageMeta.titleAr} onChange={(e) => setPageMeta({...pageMeta, titleAr: e.target.value})} className="font-black text-lg h-12 pr-12" />
                   <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 h-10 w-10 text-accent hover:bg-accent/5" onClick={() => handleAiTranslate(pageMeta.titleAr, 'meta')} disabled={aiLoading === 'meta'}>
                     {aiLoading === 'meta' ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
                   </Button>
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{isAr ? "العنوان بالإنجليزية (AI)" : "Page Title (EN)"}</label>
                   <Input value={pageMeta.titleEn} onChange={(e) => setPageMeta({...pageMeta, titleEn: e.target.value})} className="font-bold text-lg h-12" />
                 </div>
               </div>
            </Card>

            {components.map((c, i) => (
              <Card key={c.id} className="rounded-brand shadow-sm border-l-8 border-primary overflow-hidden bg-white animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{c.type}</span>
                  <Button variant="ghost" size="icon" onClick={() => setComponents(components.filter(cp => cp.id !== c.id))} className="text-red-400"><Trash2 size={16} /></Button>
                </div>
                <CardContent className="p-8 space-y-6">
                  {(c.type === 'text' || c.type === 'info') && (
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="relative">
                         <Textarea placeholder="Content AR..." value={c.content.bodyAr} onChange={e => updateComponentContent(i, { bodyAr: e.target.value })} className="min-h-[150px] font-bold text-lg pr-12" />
                         <Button size="icon" variant="ghost" className="absolute bottom-2 right-2 text-accent" onClick={() => handleAiTranslate(c.content.bodyAr, i)} disabled={aiLoading === i.toString()}>
                           {aiLoading === i.toString() ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4" />}
                         </Button>
                       </div>
                       <Textarea placeholder="Content EN..." value={c.content.bodyEn} onChange={e => updateComponentContent(i, { bodyEn: e.target.value })} className="min-h-[150px]" />
                    </div>
                  )}
                  {c.type === 'heading' && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <Select value={c.content.level || 'h2'} onValueChange={v => updateComponentContent(i, { level: v })}>
                        <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['h1', 'h2', 'h3'].map(h => <SelectItem key={h} value={h}>{h.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Text AR" value={c.content.textAr} onChange={e => updateComponentContent(i, { textAr: e.target.value })} className="font-black" />
                      <Input placeholder="Text EN" value={c.content.textEn} onChange={e => updateComponentContent(i, { textEn: e.target.value })} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}

export default function PageBuilder() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin" />}>
      <PageBuilderContent />
    </Suspense>
  );
}
