
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, Type, TrendingUp, Info, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CustomPage, BuilderComponent } from '@/lib/types';

export default function PageBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [pageMeta, setPageMeta] = useState({ title: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data && data.customPages) {
          const page = data.customPages.find((p: CustomPage) => p.id === editId);
          if (page) {
            setComponents(page.components || []);
            setPageMeta({ title: page.titleAr || '', slug: page.slug || '' });
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [editId]);

  const addComponent = (type: BuilderComponent['type']) => {
    const newComp: BuilderComponent = {
      id: `comp_${Date.now()}`,
      type,
      content: type === 'hero' ? { title: 'New Hero', subtitle: 'Subtitle' } : 
               type === 'text' ? { body: 'Sample text content' } : 
               type === 'stats' ? { t1: 'Stats Label', v1: '100' } : {}
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
        titleAr: pageMeta.title,
        titleEn: pageMeta.title,
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
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
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24">
            <CardHeader className="bg-slate-900 text-white rounded-t-brand">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "إضافة مكون" : "Add Component"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addComponent('hero')} className="justify-start gap-2 font-bold"><ImageIcon size={14}/> {isAr ? "قسم البطل" : "Hero Section"}</Button>
              <Button variant="outline" onClick={() => addComponent('text')} className="justify-start gap-2 font-bold"><Type size={14}/> {isAr ? "محتوى نصي" : "Text Block"}</Button>
              <Button variant="outline" onClick={() => addComponent('stats')} className="justify-start gap-2 font-bold"><TrendingUp size={14}/> {isAr ? "إحصائيات" : "Statistics"}</Button>
              <Button variant="outline" onClick={() => addComponent('info')} className="justify-start gap-2 font-bold"><Info size={14}/> {isAr ? "معلومات" : "Info Card"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Input 
                placeholder={isAr ? "عنوان الصفحة" : "Page Title"} 
                className="h-14 text-xl font-black border-2 rounded-xl"
                value={pageMeta.title}
                onChange={(e) => setPageMeta({...pageMeta, title: e.target.value})}
              />
              <Input 
                placeholder={isAr ? "الرابط اللطيف (slug)" : "Page Slug"} 
                className="h-14 text-xl font-mono border-2 rounded-xl"
                value={pageMeta.slug}
                onChange={(e) => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
              />
            </div>

            {components.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[2rem] p-20 text-center bg-white">
                <Layout size={64} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-bold text-lg">{isAr ? "لم تقم بإضافة أي مكونات بعد" : "No components added yet"}</p>
              </div>
            ) : (
              components.map((c, i) => (
                <Card key={c.id} className="rounded-brand shadow-sm border-l-4 border-primary overflow-hidden group">
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {isAr ? `مكون رقم ${i+1}: ${c.type}` : `Component ${i+1}: ${c.type}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeComponent(c.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    {c.type === 'hero' ? (
                      <div className="space-y-4">
                        <Input placeholder="Hero Title" value={c.content.title} onChange={e => {
                           const nc = [...components]; nc[i].content.title = e.target.value; setComponents(nc);
                        }} className="font-bold" />
                        <Input placeholder="Hero Subtitle" value={c.content.subtitle} onChange={e => {
                           const nc = [...components]; nc[i].content.subtitle = e.target.value; setComponents(nc);
                        }} />
                      </div>
                    ) : (
                      <Textarea placeholder="Content..." value={c.content.body} onChange={e => {
                        const nc = [...components]; nc[i].content.body = e.target.value; setComponents(nc);
                      }} className="min-h-[100px]" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
      <PortalFooter siteConfig={null} />
    </div>
  );
}
