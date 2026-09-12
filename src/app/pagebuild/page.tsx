
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
  Activity, UserCircle, Tag, Code, Upload, Database, Lock, ShieldAlert, Handshake, HelpCircle, UserCheck
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
  'open-data': {
    titleAr: 'رخصة البيانات المفتوحة',
    titleEn: 'Open Data License',
    components: [
      { id: 'c1', type: 'html', content: { code: '<div class="flex justify-center mb-8"><div class="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg></div></div>' } },
      { id: 'c2', type: 'heading', content: { level: 'h1', textAr: 'رخصة البيانات المفتوحة', textEn: 'Open Data License' } },
      { id: 'c3', type: 'heading', content: { level: 'h3', textAr: 'نشارك البيانات لتعزيز الابتكار والشفافية', textEn: 'Sharing data to promote innovation and transparency' } },
      { id: 'c4', type: 'info', content: { bodyAr: 'تسمح هذه الرخصة باستخدام البيانات المفتوحة لبلدية ظفار لأغراض تجارية وغير تجارية بشرط الإشارة إلى المصدر.', bodyEn: 'This license allows the use of Dhofar Municipality open data for commercial and non-commercial purposes, provided the source is cited.' } }
    ]
  },
  'privacy': {
    titleAr: 'السياسة والخصوصية',
    titleEn: 'Privacy Policy',
    components: [
      { id: 'c1', type: 'html', content: { code: '<div class="flex justify-center mb-8"><div class="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div></div>' } },
      { id: 'c2', type: 'heading', content: { level: 'h1', textAr: 'السياسة والخصوصية', textEn: 'Privacy Policy' } },
      { id: 'c3', type: 'info', content: { bodyAr: 'نحن نلتزم بحماية خصوصيتك وبياناتك الرقمية وفق أعلى المعايير الأمنية المتبعة في سلطنة عمان.', bodyEn: 'We are committed to protecting your privacy and digital data according to the highest security standards in Oman.' } },
      { id: 'c4', type: 'text', content: { bodyAr: 'جمع المعلومات:\nنقوم بجمع المعلومات اللازمة فقط لتقديم الخدمات البلدية بشكل فعال ودقيق.\n\nأمن البيانات:\nنستخدم تقنيات تشفير متطورة لحماية بياناتك من الوصول غير المصرح به.', bodyEn: 'Information Collection:\nWe collect only the information necessary to provide municipal services effectively.\n\nData Security:\nWe use advanced encryption technologies to protect your data.' } }
    ]
  },
  'terms': {
    titleAr: 'الشروط والأحكام',
    titleEn: 'Terms & Conditions',
    components: [
      { id: 'c1', type: 'html', content: { code: '<div class="flex justify-center mb-8"><div class="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"></path><path d="m3 3 3 3"></path><path d="m21 21-3-3"></path><path d="M13 5.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z"></path><path d="M5.5 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5Z"></path><path d="m14 7 7 7-4 4-7-7-4 4-3-3"></path></svg></div></div>' } },
      { id: 'c2', type: 'heading', content: { level: 'h1', textAr: 'الشروط والأحكام', textEn: 'Terms & Conditions' } },
      { id: 'c3', type: 'accordion', content: { items: [
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
  },
  'sla': {
    titleAr: 'اتفاقية مستوى الخدمة',
    titleEn: 'Service Level Agreement',
    components: [
      { id: 'c1', type: 'heading', content: { level: 'h1', textAr: 'اتفاقية مستوى الخدمة (SLA)', textEn: 'Service Level Agreement' } },
      { id: 'c2', type: 'stats', content: { v1: '99.9%', t1: 'Availability', v2: '24/7', t2: 'Support' } },
      { id: 'c3', type: 'info', content: { bodyAr: 'نلتزم بتوفير الخدمات بنسبة توفر 99.9% ومعالجة الطلبات خلال الفترات الزمنية المحددة.', bodyEn: 'We are committed to providing services with 99.9% availability and timely processing.' } }
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
               type === 'stats' ? { t1: 'إحصائية 1', v1: '100', t2: 'إحصائية 2', v2: '200' } : 
               type === 'info' ? { bodyAr: 'محتوى البطاقة الرئيسية هنا', bodyEn: 'Main card content here' } : 
               type === 'heading' ? { level: 'h2', textAr: 'عنوان جديد', textEn: 'New Heading' } :
               type === 'video' ? { url: '', captionAr: '', captionEn: '' } :
               type === 'pdf' ? { url: '', labelAr: 'تحميل ملف PDF', labelEn: 'Download PDF' } :
               type === 'image' ? { url: 'https://picsum.photos/seed/1/800/400', altAr: '', altEn: '' } :
               type === 'accordion' ? { items: [{ titleAr: 'سؤال', titleEn: 'Question', contentAr: 'جواب', contentEn: 'Answer' }] } :
               type === 'table' ? { headers: ['الخدمة', 'الرسوم'], rows: [{ c1: 'بند 1', c2: 'قيمة 1' }] } :
               type === 'progress' ? { labelAr: 'الإنجاز', labelEn: 'Progress', value: 50 } :
               type === 'avatar' ? { src: '', fallback: 'DM' } :
               type === 'badge' ? { textAr: 'حالة', textEn: 'Status', variant: 'default' } :
               type === 'html' ? { code: '<!-- Custom HTML/Script Code -->' } :
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
              <Button variant="outline" onClick={() => addComponent('table')} className="justify-start gap-2 font-black text-xs"><TableIcon size={14}/> {isAr ? "جدول" : "Table"}</Button>
              <Button variant="outline" onClick={() => addComponent('stats')} className="justify-start gap-2 font-black text-xs"><TrendingUp size={14}/> {isAr ? "إحصائيات" : "Stats"}</Button>
              <Button variant="outline" onClick={() => addComponent('html')} className="justify-start gap-2 font-black text-xs"><Code size={14}/> {isAr ? "كود مخصص" : "HTML/Script"}</Button>
              <Button variant="outline" onClick={() => addComponent('pdf')} className="justify-start gap-2 font-black text-xs"><FileText size={14}/> {isAr ? "ملف PDF" : "PDF"}</Button>
              <Button variant="outline" onClick={() => addComponent('image')} className="justify-start gap-2 font-black text-xs"><ImageIcon size={14}/> {isAr ? "صورة" : "Image"}</Button>
              <Button variant="outline" onClick={() => addComponent('video')} className="justify-start gap-2 font-black text-xs"><Video size={14}/> {isAr ? "فيديو" : "Video"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8 rounded-brand shadow-sm border bg-white space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="relative">
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{isAr ? "عنوان الصفحة (AR)" : "Page Title (AR)"}</label>
                   <Input value={pageMeta.titleAr} onChange={(e) => setPageMeta({...pageMeta, titleAr: e.target.value})} className="font-black text-lg h-12" />
                   <Button size="icon" variant="ghost" className="absolute top-8 right-2" onClick={handleAiTranslateMeta} disabled={aiLoading}>
                     {aiLoading ? <Loader2 className="animate-spin size-4" /> : <Sparkles className="size-4 text-accent" />}
                   </Button>
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">{isAr ? "الرابط اللطيف (Slug)" : "Page Slug"}</label>
                   <Input value={pageMeta.slug} onChange={(e) => setPageMeta({...pageMeta, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="font-mono text-primary h-12" placeholder="e.g. open-data" />
                 </div>
               </div>
            </Card>

            {components.map((c, i) => (
              <Card key={c.id} className="rounded-brand shadow-sm border-l-8 border-primary overflow-hidden bg-white animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{c.type}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => removeComponent(c.id)} className="text-red-400"><Trash2 size={16} /></Button>
                  </div>
                </div>
                <CardContent className="p-8 space-y-6">
                  {c.type === 'heading' && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <Select value={c.content.level || 'h2'} onValueChange={v => updateComponentContent(i, { level: v })}>
                        <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['h1', 'h2', 'h3', 'h4'].map(h => <SelectItem key={h} value={h}>{h.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Text AR" value={c.content.textAr || ''} onChange={e => updateComponentContent(i, { textAr: e.target.value })} className="font-black" />
                      <Input placeholder="Text EN" value={c.content.textEn || ''} onChange={e => updateComponentContent(i, { textEn: e.target.value })} />
                    </div>
                  )}

                  {c.type === 'html' && (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-400">Custom HTML / Script Block</label>
                       <Textarea 
                        placeholder="<script>...</script> or <div class='...'>...</div>" 
                        value={c.content.code} 
                        onChange={e => updateComponentContent(i, { code: e.target.value })} 
                        className="font-mono text-xs bg-slate-900 text-emerald-400 min-h-[150px] rounded-xl" 
                       />
                    </div>
                  )}

                  {(c.type === 'text' || c.type === 'info') && (
                    <div className="grid md:grid-cols-2 gap-6">
                       <Textarea placeholder="Content AR..." value={c.content.bodyAr || ''} onChange={e => updateComponentContent(i, { bodyAr: e.target.value })} className="min-h-[150px] font-bold text-lg" />
                       <Textarea placeholder="Content EN..." value={c.content.bodyEn || ''} onChange={e => updateComponentContent(i, { bodyEn: e.target.value })} className="min-h-[150px]" />
                    </div>
                  )}

                  {c.type === 'accordion' && (
                    <div className="space-y-4">
                      {c.content.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-6 border rounded-2xl space-y-4 bg-slate-50 relative group">
                           <Input placeholder="Question" value={item.titleAr || ''} onChange={e => {
                             const nItems = [...c.content.items]; nItems[idx].titleAr = e.target.value; updateComponentContent(i, { items: nItems });
                           }} className="font-black" />
                           <Textarea placeholder="Answer" value={item.contentAr || ''} onChange={e => {
                             const nItems = [...c.content.items]; nItems[idx].contentAr = e.target.value; updateComponentContent(i, { items: nItems });
                           }} />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                        const items = c.content.items || [];
                        updateComponentContent(i, { items: [...items, { titleAr: '', titleEn: '', contentAr: '', contentEn: '' }] });
                      }} className="rounded-full font-black text-xs">+ {isAr ? "إضافة سؤال" : "Add FAQ"}</Button>
                    </div>
                  )}

                  {c.type === 'table' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <Input placeholder="Header 1" value={c.content.headers?.[0]} onChange={e => {
                           const n = [...(c.content.headers || ['', ''])]; n[0] = e.target.value; updateComponentContent(i, { headers: n });
                         }} className="font-black" />
                         <Input placeholder="Header 2" value={c.content.headers?.[1]} onChange={e => {
                           const n = [...(c.content.headers || ['', ''])]; n[1] = e.target.value; updateComponentContent(i, { headers: n });
                         }} className="font-black" />
                      </div>
                      {c.content.rows?.map((row: any, rIdx: number) => (
                        <div key={rIdx} className="grid grid-cols-2 gap-4">
                          <Input value={row.c1} onChange={e => {
                            const nr = [...c.content.rows]; nr[rIdx].c1 = e.target.value; updateComponentContent(i, { rows: nr });
                          }} className="font-bold" />
                          <Input value={row.c2} onChange={e => {
                            const nr = [...c.content.rows]; nr[rIdx].c2 = e.target.value; updateComponentContent(i, { rows: nr });
                          }} className="font-black text-emerald-600" />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => updateComponentContent(i, { rows: [...(c.content.rows || []), { c1: '', c2: '' }] })} className="rounded-full font-black text-xs">{isAr ? "+ إضافة صف" : "+ Add Row"}</Button>
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
