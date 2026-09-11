'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, Type, TrendingUp, Info, Loader2, Sparkles, MessageSquare, ListChecks } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CustomPage, BuilderComponent } from '@/lib/types';
import { translateToEnglish } from '@/ai/flows/translate-flow';

export default function PageBuilder() {
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
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data && data.customPages) {
          const page = data.customPages.find((p: CustomPage) => p.id === editId);
          if (page) {
            setComponents(page.components || []);
            setPageMeta({ 
              titleAr: page.titleAr || '', 
              titleEn: page.titleEn || '', 
              slug: page.slug || '' 
            });
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [editId]);

  const handleAiTranslateMeta = async () => {
    if (!pageMeta.titleAr) return;
    setAiLoading(true);
    try {
      const { translatedText } = await translateToEnglish({ text: pageMeta.titleAr });
      setPageMeta({ ...pageMeta, titleEn: translatedText });
      toast({ title: "AI Success", description: "Meta translated" });
    } finally {
      setAiLoading(false);
    }
  };

  const addComponent = (type: BuilderComponent['type']) => {
    const newComp: BuilderComponent = {
      id: `comp_${Date.now()}`,
      type,
      content: type === 'hero' ? { titleAr: 'New Hero', titleEn: 'New Hero', subtitleAr: 'Subtitle', subtitleEn: 'Subtitle' } : 
               type === 'text' ? { bodyAr: 'محتوى نصي جديد', bodyEn: 'New text content' } : 
               type === 'stats' ? { t1: 'Stats Label', v1: '100', t2: 'Label 2', v2: '200' } : 
               type === 'info' ? { bodyAr: 'معلومات هامة', bodyEn: 'Important info' } : {}
    };
    setComponents([...components, newComp]);
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!pageMeta.slug) {
      toast({ variant: "destructive", title: "Slug Required", description: "Please provide a page slug." });
      return;
    }
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
      await updateBin({
        ...data,
        customPages: [...filtered, newPage]
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم تحديث الصفحة بنجاح" : "Page updated successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save page." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-3">
              <Layout className="text-accent" /> {isAr ? "باني الصفحات" : "Page Builder"}
            </h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
              <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ الصفحة" : "Save Page"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24 overflow-hidden border-none">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "إضافة مكون" : "Add Component"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addComponent('hero')} className="justify-start gap-2 font-black border-2"><ImageIcon size={14}/> {isAr ? "قسم البطل" : "Hero Section"}</Button>
              <Button variant="outline" onClick={() => addComponent('text')} className="justify-start gap-2 font-black border-2"><Type size={14}/> {isAr ? "محتوى نصي" : "Text Block"}</Button>
              <Button variant="outline" onClick={() => addComponent('stats')} className="justify-start gap-2 font-black border-2"><TrendingUp size={14}/> {isAr ? "إحصائيات" : "Statistics"}</Button>
              <Button variant="outline" onClick={() => addComponent('info')} className="justify-start gap-2 font-black border-2"><Info size={14}/> {isAr ? "معلومات" : "Info Card"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid md:grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-sm border">
               <div className="space-y-1 relative">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "عنوان الصفحة (AR)" : "Title (AR)"}</label>
                 <Input value={pageMeta.titleAr} onChange={(e) => setPageMeta({...pageMeta, titleAr: e.target.value})} className="font-bold border-2" />
                 <Button size="icon" variant="ghost" className="absolute top-7 right-2" onClick={handleAiTranslateMeta} disabled={aiLoading}>
                   {aiLoading ? <Loader2 className="animate-spin size-3" /> : <Sparkles className="size-3 text-accent" />}
                 </Button>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "عنوان الصفحة (EN)" : "Title (EN)"}</label>
                 <Input value={pageMeta.titleEn} onChange={(e) => setPageMeta({...pageMeta, titleEn: e.target.value})} className="font-bold border-2" />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الرابط اللطيف (Slug)" : "Page Slug"}</label>
                 <Input value={pageMeta.slug} onChange={(e) => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="font-mono border-2 text-primary" />
               </div>
            </div>

            {components.map((c, i) => (
              <Card key={c.id} className="rounded-[2rem] shadow-sm border-l-8 border-primary overflow-hidden group animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {isAr ? `المكون ${i+1}: ${c.type}` : `Component ${i+1}: ${c.type}`}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => removeComponent(c.id)} className="text-red-400">
                    <Trash2 size={16} />
                  </Button>
                </div>
                <CardContent className="p-8 space-y-6">
                  {c.type === 'hero' ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Input placeholder="Hero Title AR" value={c.content.titleAr} onChange={e => {
                           const nc = [...components]; nc[i].content.titleAr = e.target.value; setComponents(nc);
                        }} className="font-bold" />
                        <Textarea placeholder="Hero Subtitle AR" value={c.content.subtitleAr} onChange={e => {
                           const nc = [...components]; nc[i].content.subtitleAr = e.target.value; setComponents(nc);
                        }} />
                      </div>
                      <div className="space-y-4">
                        <Input placeholder="Hero Title EN" value={c.content.titleEn} onChange={e => {
                           const nc = [...components]; nc[i].content.titleEn = e.target.value; setComponents(nc);
                        }} className="font-bold" />
                        <Textarea placeholder="Hero Subtitle EN" value={c.content.subtitleEn} onChange={e => {
                           const nc = [...components]; nc[i].content.subtitleEn = e.target.value; setComponents(nc);
                        }} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                       <Textarea placeholder="Content AR..." value={c.content.bodyAr} onChange={e => {
                         const nc = [...components]; nc[i].content.bodyAr = e.target.value; setComponents(nc);
                       }} className="min-h-[120px] font-bold" />
                       <Textarea placeholder="Content EN..." value={c.content.bodyEn} onChange={e => {
                         const nc = [...components]; nc[i].content.bodyEn = e.target.value; setComponents(nc);
                       }} className="min-h-[120px]" />
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
