
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Service, SiteConfig, MenuItem, CarouselItem, 
  Survey, CustomPage, PopupMessage, ServiceFlow 
} from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, Loader2, 
  CloudUpload, Star, Layout, Menu, 
  Database, ShieldAlert, Edit2, Eye, 
  Wrench, BarChart3, Image as ImageIcon, 
  Bell, ClipboardList, Sparkles, Palette,
  Zap, FileText, Search, Globe, Volume2, Video, 
  MousePointer2, ArrowUpRight, Megaphone
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const ANALYTICS_DATA = [
  { name: 'يناير', transactions: 400 },
  { name: 'فبراير', transactions: 700 },
  { name: 'مارس', transactions: 1200 },
  { name: 'أبريل', transactions: 900 },
  { name: 'مايو', transactions: 1500 },
  { name: 'يونيو', transactions: 2100 },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Global State
  const [services, setServices] = useState<Service[]>([]);
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setFlows(data.serviceFlows || []);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setPopups(data.popups || []);
        }
      } catch (e) {
        toast({ title: "Error Loading Data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const currentDb = await fetchBin();
      await updateBin({
        ...currentDb,
        services,
        serviceFlows: flows,
        siteConfig, 
        menuItems, 
        carouselItems, 
        surveys, 
        customPages, 
        popups
      });
      toast({ title: isAr ? "تم حفظ كافة التغييرات بنجاح" : "All changes saved successfully" });
    } catch (e) {
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAiTranslate = async (text: string, fieldKey: string) => {
    if (!text) return;
    setAiLoading(fieldKey);
    try {
      const { translatedText } = await translateToEnglish({ text });
      if (fieldKey === 'heroTitle') setSiteConfig(s => s ? {...s, heroTitleEn: translatedText} : null);
      if (fieldKey === 'heroSubtitle') setSiteConfig(s => s ? {...s, heroSubtitleEn: translatedText} : null);
      toast({ title: isAr ? "تمت الترجمة بنجاح" : "Translation complete" });
    } catch (e) {
      toast({ title: "AI Translation Failed", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const t = (isAr ? s.title : s.titleEn || s.title).toLowerCase();
      return t.includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    });
  }, [services, searchQuery, isAr]);

  // Combined Route List for Select List
  const availableRoutes = useMemo(() => {
    const staticRoutes = [
      { label: isAr ? 'الرئيسية' : 'Home', value: '/' },
      { label: isAr ? 'المساحة الذكية' : 'Spatial Workspace', value: '/template' },
      { label: isAr ? 'خريطة الموقع' : 'Sitemap', value: '/sitemap' },
    ];
    const pages = customPages.map(p => ({ label: `${isAr ? 'صفحة:' : 'Page:'} ${isAr ? p.titleAr : p.titleEn}`, value: `/p/${p.slug}` }));
    const svcs = services.map(s => ({ label: `${isAr ? 'خدمة:' : 'Service:'} ${isAr ? s.title : s.titleEn}`, value: `/services/${s.id}` }));
    return [...staticRoutes, ...pages, ...svcs];
  }, [customPages, services, isAr]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50 flex", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Sidebar Command Center */}
      <aside className="w-64 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex">
         <div className="flex items-center gap-3">
           <div className="size-10 bg-accent rounded-xl flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(3,207,203,0.3)]">
             <Settings size={22} className="animate-spin-slow" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-lg tracking-tighter leading-none">COMMAND</span>
             <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-80">Center v3.0</span>
           </div>
         </div>
         
         <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{isAr ? 'إدارة النظام' : 'System Management'}</p>
            {[
              { id: 'overview', label: isAr ? 'الرئيسية' : 'Overview', icon: <BarChart3 size={18}/> },
              { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Zap size={18}/> },
              { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Layout size={18}/> },
              { id: 'menu', label: isAr ? 'الملاحة' : 'Navigation', icon: <Menu size={18}/> },
              { id: 'ai', label: isAr ? 'الذكاء الاصطناعي' : 'AI Plugins', icon: <Sparkles size={18}/> },
            ].map(item => (
              <Button key={item.id} variant="ghost" className="justify-start gap-4 h-11 hover:bg-white/5 rounded-xl font-bold text-slate-400 hover:text-white transition-all">
                {item.icon} {item.label}
              </Button>
            ))}
         </nav>

         <div className="pt-6 border-t border-white/5">
            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles size={14} className="text-accent" />
                 <span className="text-[10px] font-black text-accent">{isAr ? 'الحالة الذكية' : 'AI ENGINE'}</span>
               </div>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Genkit Model: Gemini 2.5 Flash Connected & Ready.</p>
            </div>
         </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-primary flex items-center gap-3">
              {isAr ? "لوحة الإدارة المركزية" : "Central Portal Admin"}
            </h1>
            <p className="text-slate-400 font-bold mt-1">{isAr ? "تحكم كامل بهوية البوابة والخدمات والذكاء الاصطناعي" : "End-to-end portal orchestration"}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="rounded-full font-black px-8 border-slate-200">
              <Link href="/">{isAr ? "معاينة البوابة" : "Live Portal"}</Link>
            </Button>
            <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-xl h-12">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
              {isAr ? "حفظ ومزامنة النظام" : "Sync Global System"}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-1 p-1 rounded-2xl shadow-sm sticky top-0 z-30">
            <TabsTrigger value="overview" className="font-black gap-2 rounded-xl"><BarChart3 size={14}/> {isAr ? "الرئيسية" : "Stats"}</TabsTrigger>
            <TabsTrigger value="services" className="font-black gap-2 rounded-xl"><Zap size={14}/> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="pages" className="font-black gap-2 rounded-xl"><Layout size={14}/> {isAr ? "الصفحات" : "Pages"}</TabsTrigger>
            <TabsTrigger value="menu" className="font-black gap-2 rounded-xl"><Menu size={14}/> {isAr ? "الملاحة" : "Menu"}</TabsTrigger>
            <TabsTrigger value="branding" className="font-black gap-2 rounded-xl"><Palette size={14}/> {isAr ? "الهوية" : "Identity"}</TabsTrigger>
            <TabsTrigger value="carousel" className="font-black gap-2 rounded-xl"><ImageIcon size={14}/> {isAr ? "البنرات" : "Banners"}</TabsTrigger>
            <TabsTrigger value="popups" className="font-black gap-2 rounded-xl"><Bell size={14}/> {isAr ? "المنبثقات" : "Popups"}</TabsTrigger>
            <TabsTrigger value="ai" className="font-black gap-2 rounded-xl text-accent"><Sparkles size={14}/> {isAr ? "AI Plugins" : "AI Plugins"}</TabsTrigger>
          </TabsList>

          {/* 1. Overview */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95">
             <div className="grid md:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-sm bg-primary text-white overflow-hidden">
                  <CardContent className="p-8">
                    <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">{isAr ? "الخدمات النشطة" : "Active Services"}</p>
                    <h3 className="text-5xl font-black">{services.length}</h3>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-none shadow-sm bg-accent text-slate-900 overflow-hidden">
                  <CardContent className="p-8">
                    <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">{isAr ? "الصفحات الديناميكية" : "Dynamic Pages"}</p>
                    <h3 className="text-5xl font-black">{customPages.length}</h3>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-8">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isAr ? "طلبات المواطنين" : "Applications"}</p>
                    <h3 className="text-5xl font-black text-primary">1,248</h3>
                  </CardContent>
                </Card>
             </div>
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ANALYTICS_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="transactions" stroke="hsl(var(--dm-teal-dark))" fill="hsl(var(--dm-teal-dark))" fillOpacity={0.1} strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </Card>
          </TabsContent>

          {/* 2. Services */}
          <TabsContent value="services" className="space-y-6">
             <div className="flex justify-between items-center gap-4">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input placeholder={isAr ? "ابحث عن خدمة..." : "Search services..."} className="pl-10 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/servicebuild"><Plus size={16} className="ml-2"/> {isAr ? "إضافة خدمة" : "Add Service"}</Link></Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden shadow-xl">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-black">{isAr ? "الخدمة" : "Service"}</TableHead>
                      <TableHead className="font-black">{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead className="font-black text-center">{isAr ? "مميزة" : "Featured"}</TableHead>
                      <TableHead className="font-black">{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold py-6">
                           <p>{isAr ? s.title : (s.titleEn || s.title)}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-mono">{s.id}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={s.isFeatured || false} 
                            onCheckedChange={(val) => setServices(prev => prev.map(item => item.id === s.id ? {...item, isFeatured: val} : item))} 
                            className="mx-auto data-[state=checked]:bg-accent"
                          />
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="ghost" size="icon" asChild className="text-primary"><Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link></Button>
                          <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400"><Trash2 size={16}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>

          {/* 4. Menu / Navigation */}
          <TabsContent value="menu" className="space-y-6">
             <Card className="rounded-[2rem] border-none shadow-xl bg-white">
                <CardHeader className="p-8 border-b">
                   <CardTitle className="font-black">{isAr ? "روابط القائمة الرئيسية" : "Main Navigation Links"}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {menuItems.map((item, idx) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-2xl bg-slate-50 items-center">
                       <Input value={item.labelAr} onChange={e => {
                         const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm);
                       }} className="font-bold flex-1" placeholder="AR Label" />
                       
                       <Select value={item.link} onValueChange={v => {
                         const nm = [...menuItems]; nm[idx].link = v; setMenuItems(nm);
                       }}>
                         <SelectTrigger className="flex-1 font-mono text-xs">
                           <SelectValue placeholder="Choose Route..." />
                         </SelectTrigger>
                         <SelectContent>
                            {availableRoutes.map(route => (
                              <SelectItem key={route.value} value={route.value}>{route.label}</SelectItem>
                            ))}
                            <SelectItem value="custom">{isAr ? 'رابط خارجي...' : 'Custom Link...'}</SelectItem>
                         </SelectContent>
                       </Select>

                       {item.link === 'custom' && (
                         <Input placeholder="https://..." className="flex-1 font-mono text-xs" onChange={e => {
                           const nm = [...menuItems]; nm[idx].link = e.target.value; setMenuItems(nm);
                         }} />
                       )}

                       <Button variant="ghost" size="icon" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="text-red-400"><Trash2 size={16}/></Button>
                    </div>
                  ))}
                  <Button onClick={() => setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: '', labelEn: '', link: '', order: menuItems.length }])} variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 font-black">+ {isAr ? "إضافة رابط للقائمة" : "Add Navigation Link"}</Button>
                </CardContent>
             </Card>
          </TabsContent>

          {/* 6. Carousel / Banners */}
          <TabsContent value="carousel" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة شريط الصور (Carousel)" : "Home Carousel Manager"}</h3>
                <Button onClick={() => setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: 'https://picsum.photos/seed/1/1200/600' }])} className="dm-gradient-primary rounded-full px-6 font-black">+ {isAr ? "إضافة بنر" : "Add Banner"}</Button>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                {carouselItems.map((item, idx) => (
                  <Card key={item.id} className="rounded-3xl border-none shadow-lg overflow-hidden bg-white">
                     <div className="h-40 bg-slate-100 relative group">
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Input value={item.imageUrl} onChange={e => {
                             const ni = [...carouselItems]; ni[idx].imageUrl = e.target.value; setCarouselItems(ni);
                           }} className="w-3/4 bg-white text-xs" placeholder="Image URL" />
                        </div>
                     </div>
                     <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <Input placeholder="العنوان (AR)" value={item.titleAr} onChange={e => {
                             const ni = [...carouselItems]; ni[idx].titleAr = e.target.value; setCarouselItems(ni);
                           }} className="font-bold" />
                           <Input placeholder="العنوان (EN)" value={item.titleEn} onChange={e => {
                             const ni = [...carouselItems]; ni[idx].titleEn = e.target.value; setCarouselItems(ni);
                           }} />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCarouselItems(carouselItems.filter(ci => ci.id !== item.id))} className="w-full text-red-500 font-bold"><Trash2 size={14} className="ml-2"/> {isAr ? "حذف البنر" : "Delete Banner"}</Button>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          {/* 7. Popups */}
          <TabsContent value="popups" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "نظام التنبيهات والمنبثقات" : "Announcement Popups"}</h3>
                <Button onClick={() => setPopups([...popups, { id: `p_${Date.now()}`, titleAr: 'تنبيه جديد', titleEn: 'New Alert', type: 'text', isActive: false, displayDelay: 2 }])} className="dm-gradient-primary rounded-full px-6 font-black">+ {isAr ? "إنشاء منبثقة" : "New Popup"}</Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden shadow-xl p-8 space-y-6">
                {popups.map((popup, idx) => (
                  <div key={popup.id} className="p-6 border rounded-3xl bg-slate-50 grid md:grid-cols-4 gap-6 items-start">
                     <div className="space-y-2">
                        <Label>{isAr ? "النوع" : "Type"}</Label>
                        <Select value={popup.type} onValueChange={v => {
                           const np = [...popups]; np[idx].type = v as any; setPopups(np);
                        }}>
                           <SelectTrigger className="bg-white font-bold"><SelectValue /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="text">Text Only</SelectItem>
                              <SelectItem value="image">Image Card</SelectItem>
                              <SelectItem value="video">Video Embed</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                           <Input placeholder="العنوان (AR)" value={popup.titleAr} onChange={e => { const np = [...popups]; np[idx].titleAr = e.target.value; setPopups(np); }} className="bg-white font-black" />
                           <Input placeholder="العنوان (EN)" value={popup.titleEn} onChange={e => { const np = [...popups]; np[idx].titleEn = e.target.value; setPopups(np); }} className="bg-white" />
                        </div>
                        <Input placeholder="Media URL (Image or YouTube)" value={popup.mediaUrl} onChange={e => { const np = [...popups]; np[idx].mediaUrl = e.target.value; setPopups(np); }} className="bg-white font-mono text-xs" />
                     </div>
                     <div className="flex flex-col gap-4 items-end">
                        <div className="flex items-center gap-2">
                           <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "تفعيل" : "ACTIVE"}</Label>
                           <Switch checked={popup.isActive} onCheckedChange={v => { const np = [...popups]; np[idx].isActive = v; setPopups(np); }} className="data-[state=checked]:bg-accent" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setPopups(popups.filter(p => p.id !== popup.id))} className="text-red-400"><Trash2 size={16}/></Button>
                     </div>
                  </div>
                ))}
             </div>
          </TabsContent>

          {/* 8. AI Brain Control */}
          <TabsContent value="ai" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-accent">
               <CardHeader className="p-8 border-b bg-slate-950 text-white relative overflow-hidden">
                  <div className="relative z-10">
                     <CardTitle className="text-3xl font-black flex items-center gap-3 text-accent"><Sparkles /> {isAr ? "لوحة تحكم الذكاء الاصطناعي" : "AI Cognitive Control"}</CardTitle>
                     <CardDescription className="text-slate-400 font-bold mt-2">{isAr ? "إدارة وتخصيص إضافات الذكاء الاصطناعي المدمجة بالبوابة" : "Manage Genkit AI Flows & Assistant Plugins"}</CardDescription>
                  </div>
                  <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
               </CardHeader>
               <CardContent className="p-8 grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> {isAr ? "حالة الإضافات (Plugins)" : "Plugin Ecosystem"}</h4>
                     {[
                       { id: 'tts', label: isAr ? 'تحويل النص إلى صوت (TTS)' : 'Text-to-Speech (TTS)', icon: <Volume2/>, status: 'Active' },
                       { id: 'translate', label: isAr ? 'محرك الترجمة الذكي' : 'AI Translation Flow', icon: <Globe/>, status: 'Active' },
                       { id: 'sl', label: isAr ? 'مساعد لغة الإشارة العمانية' : 'Oman Sign Language AI', icon: <Video/>, status: 'Beta' },
                       { id: 'spatial', label: isAr ? 'المساعد المكاني (3D)' : '3D Spatial Assistant', icon: <MousePointer2/>, status: 'Active' },
                     ].map(plugin => (
                       <div key={plugin.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border group hover:border-accent transition-all">
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-slate-900 transition-colors">{plugin.icon}</div>
                             <div className="flex flex-col">
                               <span className="font-bold text-sm">{plugin.label}</span>
                               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{plugin.status}</span>
                             </div>
                          </div>
                          <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                       </div>
                     ))}
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2"><Megaphone size={14}/> {isAr ? "تخصيص مساعد الذكاء الاصطناعي" : "AI Assistant Tuning"}</h4>
                     <div className="space-y-4 p-6 border-2 border-dashed rounded-3xl bg-slate-50">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "نبرة الصوت الافتراضية" : "TTS Voice Model"}</Label>
                           <Select defaultValue="algenib">
                              <SelectTrigger className="bg-white font-bold h-12 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="algenib">Algenib (Oman/Arabic Optimized)</SelectItem>
                                 <SelectItem value="achernar">Achernar (English Professional)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                           <ShieldAlert size={20} className="text-amber-500 shrink-0" />
                           <p className="text-[10px] text-amber-700 font-bold leading-relaxed">{isAr ? "يتم تشغيل كافة العمليات عبر Genkit. تأكد من تفعيل GEMINI_API_KEY في ملف البيئة لضمان عمل الترجمة التلقائية." : "AI operations powered by Genkit. Translation flows require a valid GEMINI_API_KEY."}</p>
                        </div>
                     </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
