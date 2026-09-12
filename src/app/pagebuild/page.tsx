
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
  Activity, UserCircle, Tag, Code
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

const STANDARD_PAGE_SEEDS: Record<string, { titleAr: string, titleEn: string, components: any[] }> = {
  'privacy': {
    titleAr: 'السياسة والخصوصية',
    titleEn: 'Privacy Policy',
    components: [
      { id: 'c1', type: 'heading', content: { level: 'h1', textAr: 'السياسة والخصوصية', textEn: 'Privacy Policy' } },
      { id: 'c2', type: 'info', content: { bodyAr: 'نحن نلتزم بحماية خصوصيتك وبياناتك الرقمية وفق أعلى المعايير.', bodyEn: 'We protect your privacy and digital data according to the highest standards.' } },
      { id: 'c3', type: 'text', content: { bodyAr: 'جمع المعلومات:\nنقوم بجمع المعلومات اللازمة فقط لتقديم الخدمات البلدية بشكل فعال ودقيق.\n\nأمن البيانات:\nنستخدم تقنيات تشفير متطورة لحماية بياناتك من الوصول غير المصرح به.', bodyEn: 'Information Collection:\nWe collect only the information necessary to provide municipal services effectively.\n\nData Security:\nWe use advanced encryption technologies to protect your data.' } }
    ]
  },
  'terms': {
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms & Conditions',
    components: [
      { id: 'c1', type: 'heading', content: { level: 'h1', textAr: 'الشروط والأحكام', textEn: 'Terms & Conditions' } },
      { id: 'c2', type: 'accordion', content: { items: [
        { titleAr: '1. مقدمة', titleEn: '1. Introduction', contentAr: 'باستخدامك لهذه البوابة، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام.', contentEn: 'By using this portal, you agree to fully comply with these terms.' },
        { titleAr: '2. الالتزامات', titleEn: '2. Obligations', contentAr: 'يجب على المستخدم تقديم بيانات صحيحة ودقيقة عند استخدام الخدمات الرقمية.', contentEn: 'Users must provide accurate data when using digital services.' }
      ] } }
    ]
  },
  'faqs': {
    titleAr: 'الأسئلة الشائعة',
    titleEn: 'FAQs',
    components: [
      { id: 'c1', type: 'heading', content: { level: 'h1', textAr: 'الأسئلة الشائعة', textEn: 'FAQs' } },
      { id: 'c2', type: 'accordion', content: { items: [
        { titleAr: 'كيف يمكنني تجديد عقد الإيجار؟', titleEn: 'How can I renew a lease?', contentAr: 'يمكنك التجديد عبر خدمة عقود الإيجار الرقمية في دليل الخدمات.', contentEn: 'You can renew via the digital lease service in the catalog.' }
      ] } }
    ]
  }
};

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
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        const data = await fetchBin();
        if (data && data.customPages) {
          const page = data.customPages.find((p: CustomPage) => p.id === editId || p.slug === editSlug);
          if (page) {
            setComponents(page.components || []);
            setPageMeta({ 
              titleAr: page.titleAr || '', 
              titleEn: page.titleEn || '', 
              slug: page.slug || '' 
            });
          } else if (editSlug && STANDARD_PAGE_SEEDS[editSlug]) {
            const seed = STANDARD_PAGE_SEEDS[editSlug];
            setPageMeta({ titleAr: seed.titleAr, titleEn: seed.titleEn, slug: editSlug });
            setComponents(seed.components);
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

  const handleAiTranslateMeta = async () => {
    if (!pageMeta.titleAr) return;
    setAiLoading(true);
    try {
      const { translatedText } = await translateToEnglish({ text: pageMeta.titleAr });
      setPageMeta({ ...pageMeta, titleEn: translatedText });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Translation Error" });
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
               type === 'stats' ? { t1: 'Label 1', v1: '100', t2: 'Label 2', v2: '200' } : 
               type === 'info' ? { bodyAr: 'معلومات هامة', bodyEn: 'Important info' } : 
               type === 'heading' ? { level: 'h2', textAr: 'عنوان', textEn: 'Heading' } :
               type === 'video' ? { url: '', captionAr: '', captionEn: '' } :
               type === 'pdf' ? { url: '', labelAr: '', labelEn: '' } :
               type === 'image' ? { url: 'https://picsum.photos/seed/1/800/400', altAr: '', altEn: '' } :
               type === 'accordion' ? { items: [{ titleAr: 'سؤال', titleEn: 'Question', contentAr: 'جواب', contentEn: 'Answer' }] } :
               type === 'table' ? { headers: ['Service', 'Fee'], rows: [{ c1: 'Permit', c2: '50 OMR' }] } :
               type === 'progress' ? { labelAr: 'الإنجاز', labelEn: 'Progress', value: 50 } :
               type === 'avatar' ? { src: '', fallback: 'DM' } :
               type === 'badge' ? { textAr: 'معتمد', textEn: 'Approved', variant: 'default' } :
               type === 'html' ? { code: '<!-- Custom HTML/Script Here -->' } :
               type === 'separator' ? {} : {}
    };
    setComponents([...components, newComp]);
  };

  const updateComponentContent = (idx: number, updates: any) => {
    const nc = [...components];
    nc[idx].content = { ...nc[idx].content, ...updates };
    setComponents(nc);
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!pageMeta.slug) {
      toast({ variant: "destructive", title: "Slug Required" });
      return;
    }
    setSaving(true);
    try {
      const data = await fetchBin();
      const existingId = editId || data.customPages?.find((p: any) => p.slug === pageMeta.slug)?.id;
      
      const newPage: CustomPage = {
        id: existingId || `page_${Date.now()}`,
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
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم تحديث محتوى الصفحة بنجاح" : "Page content updated successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save page." });
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
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <Layout className="text-accent" /> {isAr ? "باني الصفحات الشامل" : "Universal Page Builder"}
          </h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
              <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ ومزامنة" : "Save & Sync"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24 overflow-hidden border-none">
            <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-black">{isAr ? "مكتبة الويجيت" : "Widget Library"}</CardTitle></CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addComponent('hero')} className="justify-start gap-2 font-black"><ImageIcon size={14}/> {isAr ? "قسم البطل" : "Hero"}</Button>
              <Button variant="outline" onClick={() => addComponent('heading')} className="justify-start gap-2 font-black"><Heading1 size={14}/> {isAr ? "عناوين" : "Headings"}</Button>
              <Button variant="outline" onClick={() => addComponent('text')} className="justify-start gap-2 font-black"><Type size={14}/> {isAr ? "محتوى نصي" : "Text Block"}</Button>
              <Button variant="outline" onClick={() => addComponent('table')} className="justify-start gap-2 font-black"><TableIcon size={14}/> {isAr ? "جدول بيانات" : "Data Table"}</Button>
              <Button variant="outline" onClick={() => addComponent('progress')} className="justify-start gap-2 font-black"><Activity size={14}/> {isAr ? "مؤشر تقدم" : "Progress"}</Button>
              <Button variant="outline" onClick={() => addComponent('accordion')} className="justify-start gap-2 font-black"><List size={14}/> {isAr ? "أكورديون" : "Accordion"}</Button>
              <Button variant="outline" onClick={() => addComponent('html')} className="justify-start gap-2 font-black"><Code size={14}/> {isAr ? "كود مخصص HTML" : "Custom HTML/Code"}</Button>
              <Button variant="outline" onClick={() => addComponent('badge')} className="justify-start gap-2 font-black"><Tag size={14}/> {isAr ? "شارة" : "Badge"}</Button>
              <Button variant="outline" onClick={() => addComponent('avatar')} className="justify-start gap-2 font-black"><UserCircle size={14}/> {isAr ? "أفاتار" : "Avatar"}</Button>
              <Button variant="outline" onClick={() => addComponent('image')} className="justify-start gap-2 font-black"><ImageIcon size={14}/> {isAr ? "صورة" : "Image"}</Button>
              <Button variant="outline" onClick={() => addComponent('video')} className="justify-start gap-2 font-black"><Video size={14}/> {isAr ? "فيديو" : "Video"}</Button>
              <Button variant="outline" onClick={() => addComponent('pdf')} className="justify-start gap-2 font-black"><FileText size={14}/> {isAr ? "ملف PDF" : "PDF Link"}</Button>
              <Button variant="outline" onClick={() => addComponent('stats')} className="justify-start gap-2 font-black"><TrendingUp size={14}/> {isAr ? "إحصائيات" : "Stats"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 rounded-3xl shadow-sm border space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                   <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "عنوان الصفحة (AR)" : "Page Title (AR)"}</label>
                   <Input value={pageMeta.titleAr} onChange={(e) => setPageMeta({...pageMeta, titleAr: e.target.value})} className="font-bold border-2" />
                   <Button size="icon" variant="ghost" className="absolute top-7 right-2" onClick={handleAiTranslateMeta} disabled={aiLoading}>
                     {aiLoading ? <Loader2 className="animate-spin size-3" /> : <Sparkles className="size-3 text-accent" />}
                   </Button>
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الرابط اللطيف (Slug)" : "Page Slug"}</label>
                   <Input value={pageMeta.slug} onChange={(e) => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="font-mono border-2 text-primary" placeholder="e.g. privacy" />
                 </div>
               </div>
            </Card>

            {components.map((c, i) => (
              <Card key={c.id} className="rounded-[2rem] shadow-sm border-l-8 border-primary overflow-hidden group">
                <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{c.type}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeComponent(c.id)} className="text-red-400"><Trash2 size={16} /></Button>
                </div>
                <CardContent className="p-8 space-y-6">
                  {c.type === 'heading' && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <Select value={c.content.level || 'h2'} onValueChange={v => updateComponentContent(i, { level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(h => <SelectItem key={h} value={h}>{h.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Text AR" value={c.content.textAr || ''} onChange={e => updateComponentContent(i, { textAr: e.target.value })} className="font-bold" />
                      <Input placeholder="Text EN" value={c.content.textEn || ''} onChange={e => updateComponentContent(i, { textEn: e.target.value })} />
                    </div>
                  )}

                  {c.type === 'html' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">Custom HTML / Script Code</label>
                       <Textarea 
                        placeholder="<script>...</script>" 
                        value={c.content.code} 
                        onChange={e => updateComponentContent(i, { code: e.target.value })} 
                        className="font-mono text-xs bg-slate-900 text-emerald-400 min-h-[200px]" 
                       />
                    </div>
                  )}

                  {c.type === 'table' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <Input placeholder="Header 1" value={c.content.headers[0]} onChange={e => {
                           const n = [...c.content.headers]; n[0] = e.target.value; updateComponentContent(i, { headers: n });
                         }} />
                         <Input placeholder="Header 2" value={c.content.headers[1]} onChange={e => {
                           const n = [...c.content.headers]; n[1] = e.target.value; updateComponentContent(i, { headers: n });
                         }} />
                      </div>
                      {c.content.rows.map((row: any, rIdx: number) => (
                        <div key={rIdx} className="grid grid-cols-2 gap-4 relative">
                          <Input value={row.c1} onChange={e => {
                            const nr = [...c.content.rows]; nr[rIdx].c1 = e.target.value; updateComponentContent(i, { rows: nr });
                          }} />
                          <Input value={row.c2} onChange={e => {
                            const nr = [...c.content.rows]; nr[rIdx].c2 = e.target.value; updateComponentContent(i, { rows: nr });
                          }} />
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => updateComponentContent(i, { rows: [...c.content.rows, { c1: '', c2: '' }] })}>{isAr ? "+ إضافة صف" : "+ Add Row"}</Button>
                    </div>
                  )}

                  {c.type === 'progress' && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input placeholder="Label AR" value={c.content.labelAr} onChange={e => updateComponentContent(i, { labelAr: e.target.value })} />
                      <Input placeholder="Label EN" value={c.content.labelEn} onChange={e => updateComponentContent(i, { labelEn: e.target.value })} />
                      <Input type="number" placeholder="Value (0-100)" value={c.content.value} onChange={e => updateComponentContent(i, { value: parseInt(e.target.value) })} />
                    </div>
                  )}
                  
                  {c.type === 'image' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="Image URL" value={c.content.url || ''} onChange={e => updateComponentContent(i, { url: e.target.value })} />
                      <Input placeholder="Alt Text" value={c.content.altAr || ''} onChange={e => updateComponentContent(i, { altAr: e.target.value })} />
                    </div>
                  )}

                  {c.type === 'badge' && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input placeholder="Text AR" value={c.content.textAr} onChange={e => updateComponentContent(i, { textAr: e.target.value })} />
                      <Input placeholder="Text EN" value={c.content.textEn} onChange={e => updateComponentContent(i, { textEn: e.target.value })} />
                      <Select value={c.content.variant} onValueChange={v => updateComponentContent(i, { variant: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(c.type === 'text' || c.type === 'hero' || c.type === 'info') && (
                    <div className="grid md:grid-cols-2 gap-6">
                       <Textarea placeholder="Content AR..." value={c.content.bodyAr || c.content.titleAr || ''} onChange={e => {
                         if(c.type === 'hero') updateComponentContent(i, { titleAr: e.target.value });
                         else updateComponentContent(i, { bodyAr: e.target.value });
                       }} className="min-h-[120px] font-bold" />
                       <Textarea placeholder="Content EN..." value={c.content.bodyEn || c.content.titleEn || ''} onChange={e => {
                         if(c.type === 'hero') updateComponentContent(i, { titleEn: e.target.value });
                         else updateComponentContent(i, { bodyEn: e.target.value });
                       }} className="min-h-[120px]" />
                    </div>
                  )}

                  {c.type === 'accordion' && (
                    <div className="space-y-4">
                      {c.content.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded-xl space-y-2 relative group">
                           <Input placeholder="Question" value={item.titleAr || ''} onChange={e => {
                             const nItems = [...c.content.items]; nItems[idx].titleAr = e.target.value; updateComponentContent(i, { items: nItems });
                           }} />
                           <Textarea placeholder="Answer" value={item.contentAr || ''} onChange={e => {
                             const nItems = [...c.content.items]; nItems[idx].contentAr = e.target.value; updateComponentContent(i, { items: nItems });
                           }} />
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => {
                        const items = c.content.items || [];
                        updateComponentContent(i, { items: [...items, { titleAr: '', titleEn: '', contentAr: '', contentEn: '' }] });
                      }}>{isAr ? "+ إضافة بند" : "+ Add Item"}</Button>
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
