
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
  Survey, CustomPage, PopupMessage, ServiceFlow, ServiceApplication 
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
  MousePointer2, ArrowUpRight, Megaphone, ListChecks,
  RefreshCw, Layers, History, ShieldCheck, Mail, Phone, ExternalLink
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [applications, setApplications] = useState<ServiceApplication[]>([]);

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
          setApplications(data.applications || []);
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
        popups,
        applications
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
      {/* 13-Tab Navigation Command Sidebar */}
      <aside className="w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex border-r border-white/5">
         <div className="flex items-center gap-3">
           <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_25px_rgba(3,207,203,0.4)]">
             <Settings size={24} className="animate-spin-slow" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter leading-none">COMMAND</span>
             <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-80">Matrix v4.0</span>
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-1">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-4">{isAr ? 'إدارة النظام المركزية' : 'Global Matrix Management'}</p>
               {[
                 { id: 'overview', label: isAr ? 'الرئيسية' : 'Overview', icon: <BarChart3 size={18}/> },
                 { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Zap size={18}/> },
                 { id: 'apps', label: isAr ? 'طلبات المواطنين' : 'Applications', icon: <History size={18}/> },
                 { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Layout size={18}/> },
                 { id: 'menu', label: isAr ? 'الملاحة' : 'Navigation', icon: <Menu size={18}/> },
                 { id: 'branding', label: isAr ? 'الهوية' : 'Identity', icon: <Palette size={18}/> },
                 { id: 'carousel', label: isAr ? 'البنرات' : 'Banners', icon: <ImageIcon size={18}/> },
                 { id: 'popups', label: isAr ? 'المنبثقات' : 'Popups', icon: <Bell size={18}/> },
                 { id: 'surveys', label: isAr ? 'الاستطلاعات' : 'Polls', icon: <ClipboardList size={18}/> },
                 { id: 'ticker', label: isAr ? 'شريط الأخبار' : 'Ticker', icon: <Megaphone size={18}/> },
                 { id: 'footer', label: isAr ? 'التذييل' : 'Footer', icon: <Layers size={18}/> },
                 { id: 'ai', label: isAr ? 'الذكاء الاصطناعي' : 'AI Plugins', icon: <Sparkles size={18}/> },
                 { id: 'system', label: isAr ? 'الصيانة' : 'System', icon: <Wrench size={18}/> },
               ].map(item => (
                 <Button key={item.id} variant="ghost" className="justify-start gap-4 h-12 hover:bg-white/5 rounded-2xl font-bold text-slate-400 hover:text-white transition-all">
                   {item.icon} {item.label}
                 </Button>
               ))}
            </nav>
         </div>

         <div className="pt-6 border-t border-white/5">
            <div className="p-5 bg-accent/5 rounded-3xl border border-accent/10">
               <div className="flex items-center gap-2 mb-2">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-accent uppercase tracking-widest">AI Engine Active</span>
               </div>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Connected: Gemini 2.5 Flash. Real-time translation ready.</p>
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
            <Button variant="outline" asChild className="rounded-full font-black px-8 border-slate-200 h-12 shadow-sm">
              <Link href="/">{isAr ? "معاينة البوابة" : "Live Portal"}</Link>
            </Button>
            <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-xl h-12">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
              {isAr ? "حفظ ومزامنة النظام" : "Sync Global System"}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-1 p-1 rounded-[1.5rem] shadow-sm sticky top-0 z-30 overflow-x-auto">
            <TabsTrigger value="overview" className="font-black gap-2 rounded-xl h-10"><BarChart3 size={14}/> {isAr ? "الإحصائيات" : "Stats"}</TabsTrigger>
            <TabsTrigger value="services" className="font-black gap-2 rounded-xl h-10"><Zap size={14}/> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="apps" className="font-black gap-2 rounded-xl h-10"><History size={14}/> {isAr ? "الطلبات" : "Apps"}</TabsTrigger>
            <TabsTrigger value="pages" className="font-black gap-2 rounded-xl h-10"><Layout size={14}/> {isAr ? "الصفحات" : "Pages"}</TabsTrigger>
            <TabsTrigger value="menu" className="font-black gap-2 rounded-xl h-10"><Menu size={14}/> {isAr ? "الملاحة" : "Menu"}</TabsTrigger>
            <TabsTrigger value="branding" className="font-black gap-2 rounded-xl h-10"><Palette size={14}/> {isAr ? "الهوية" : "Identity"}</TabsTrigger>
            <TabsTrigger value="carousel" className="font-black gap-2 rounded-xl h-10"><ImageIcon size={14}/> {isAr ? "البنرات" : "Banners"}</TabsTrigger>
            <TabsTrigger value="popups" className="font-black gap-2 rounded-xl h-10"><Bell size={14}/> {isAr ? "المنبثقات" : "Popups"}</TabsTrigger>
            <TabsTrigger value="surveys" className="font-black gap-2 rounded-xl h-10"><ClipboardList size={14}/> {isAr ? "الاستطلاعات" : "Polls"}</TabsTrigger>
            <TabsTrigger value="ticker" className="font-black gap-2 rounded-xl h-10"><Megaphone size={14}/> {isAr ? "الأخبار" : "Ticker"}</TabsTrigger>
            <TabsTrigger value="footer" className="font-black gap-2 rounded-xl h-10"><Layers size={14}/> {isAr ? "التذييل" : "Footer"}</TabsTrigger>
            <TabsTrigger value="ai" className="font-black gap-2 rounded-xl h-10 text-accent"><Sparkles size={14}/> {isAr ? "AI Brain" : "AI Brain"}</TabsTrigger>
            <TabsTrigger value="system" className="font-black gap-2 rounded-xl h-10"><Wrench size={14}/> {isAr ? "النظام" : "System"}</TabsTrigger>
          </TabsList>

          {/* 1. Overview */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95">
             <div className="grid md:grid-cols-4 gap-6">
                <Card className="rounded-[2rem] border-none shadow-sm bg-primary text-white overflow-hidden">
                  <CardContent className="p-8">
                    <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">{isAr ? "الخدمات النشطة" : "Active Services"}</p>
                    <h3 className="text-5xl font-black">{services.length}</h3>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-accent text-slate-900 overflow-hidden">
                  <CardContent className="p-8">
                    <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">{isAr ? "طلبات المواطنين" : "Applications"}</p>
                    <h3 className="text-5xl font-black">{applications.length}</h3>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border-l-4 border-emerald-500">
                  <CardContent className="p-8">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isAr ? "الصفحات النشطة" : "Active Pages"}</p>
                    <h3 className="text-5xl font-black text-primary">{customPages.length}</h3>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border-l-4 border-accent">
                  <CardContent className="p-8">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isAr ? "المقترحات" : "User Surveys"}</p>
                    <h3 className="text-5xl font-black text-primary">{surveys.length}</h3>
                  </CardContent>
                </Card>
             </div>
             <Card className="rounded-[3rem] border-none shadow-xl bg-white p-8">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ANALYTICS_DATA}>
                      <defs>
                        <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--dm-teal-dark))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--dm-teal-dark))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="transactions" stroke="hsl(var(--dm-teal-dark))" fillOpacity={1} fill="url(#colorTrans)" strokeWidth={5} />
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
                  <Input placeholder={isAr ? "ابحث عن خدمة..." : "Search services..."} className="pl-10 rounded-2xl h-12" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button asChild className="dm-gradient-primary rounded-full px-8 font-black h-12 shadow-lg"><Link href="/servicebuild"><Plus size={16} className="ml-2"/> {isAr ? "إضافة خدمة جديدة" : "Add Service"}</Link></Button>
             </div>
             <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-xl">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-black h-14">{isAr ? "الخدمة" : "Service"}</TableHead>
                      <TableHead className="font-black">{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead className="font-black text-center">{isAr ? "مميزة" : "Featured"}</TableHead>
                      <TableHead className="font-black">{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map(s => (
                      <TableRow key={s.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold py-6">
                           <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                 {React.createElement((Icons as any)[s.iconName] || Icons.FileText, { size: 20 })}
                              </div>
                              <div>
                                <p className="text-sm">{isAr ? s.title : (s.titleEn || s.title)}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-tighter">{s.id}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="rounded-lg">{s.category}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={s.isFeatured || false} 
                            onCheckedChange={(val) => setServices(prev => prev.map(item => item.id === s.id ? {...item, isFeatured: val} : item))} 
                            className="mx-auto data-[state=checked]:bg-accent"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                             <Button variant="ghost" size="icon" asChild className="text-primary hover:bg-primary/5 rounded-xl"><Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link></Button>
                             <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>

          {/* 3. Applications (Citizen History) */}
          <TabsContent value="apps" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><History className="text-accent" /> {isAr ? "سجل طلبات المواطنين" : "Citizen Request Logs"}</CardTitle>
                </CardHeader>
                <Table>
                   <TableHeader className="bg-slate-50">
                      <TableRow>
                         <TableHead className="font-black">{isAr ? "رقم الطلب" : "App ID"}</TableHead>
                         <TableHead className="font-black">{isAr ? "المواطن" : "Citizen"}</TableHead>
                         <TableHead className="font-black">{isAr ? "الخدمة" : "Service"}</TableHead>
                         <TableHead className="font-black">{isAr ? "الحالة" : "Status"}</TableHead>
                         <TableHead className="font-black">{isAr ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {applications.map(app => (
                        <TableRow key={app.id}>
                           <TableCell className="font-mono text-xs font-bold text-slate-400">{app.id}</TableCell>
                           <TableCell className="font-bold">{app.citizenName}</TableCell>
                           <TableCell className="font-bold text-primary">{app.serviceName}</TableCell>
                           <TableCell>
                              <Badge className={cn(
                                "rounded-full font-black",
                                app.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              )}>{app.status}</Badge>
                           </TableCell>
                           <TableCell className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString(isAr ? 'ar-OM' : 'en-US')}</TableCell>
                        </TableRow>
                      ))}
                      {applications.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-bold">{isAr ? 'لا يوجد طلبات حالياً' : 'No applications found'}</TableCell></TableRow>
                      )}
                   </TableBody>
                </Table>
             </Card>
          </TabsContent>

          {/* 4. Pages */}
          <TabsContent value="pages" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة الصفحات الديناميكية" : "Dynamic Page Repository"}</h3>
                <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/pagebuild">+ {isAr ? "إنشاء صفحة" : "New Page"}</Link></Button>
             </div>
             <div className="grid md:grid-cols-3 gap-6">
                {customPages.map(page => (
                  <Card key={page.id} className="rounded-3xl border-none shadow-lg overflow-hidden group hover:shadow-2xl transition-all">
                     <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                           <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center"><Layout size={24}/></div>
                           <Badge variant="outline" className="rounded-lg font-mono text-[10px]">/{page.slug}</Badge>
                        </div>
                        <h4 className="text-xl font-black mb-2">{isAr ? page.titleAr : page.titleEn}</h4>
                        <p className="text-xs text-slate-400 font-bold mb-8">Created: {new Date(page.createdAt).toLocaleDateString()}</p>
                        <div className="flex gap-2">
                           <Button asChild variant="outline" className="flex-1 rounded-xl h-11 font-black"><Link href={`/pagebuild?id=${page.id}`}><Edit2 size={14} className="ml-2"/> {isAr ? "تعديل" : "Edit"}</Link></Button>
                           <Button variant="ghost" onClick={() => setCustomPages(customPages.filter(p => p.id !== page.id))} className="size-11 rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={16}/></Button>
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          {/* 5. Navigation / Menu */}
          <TabsContent value="menu" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b bg-slate-50">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><Menu className="text-primary" /> {isAr ? "روابط القائمة العلوية" : "Header Navigation Matrix"}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <AnimatePresence>
                    {menuItems.map((item, idx) => (
                      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.9}} key={item.id} className="flex flex-col md:flex-row gap-4 p-5 border-2 border-slate-100 rounded-[1.5rem] bg-white items-center group hover:border-primary/20 transition-all">
                        <div className="size-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-black">{idx + 1}</div>
                        <Input value={item.labelAr} onChange={e => {
                           const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm);
                        }} className="font-bold flex-1 h-12 rounded-xl" placeholder="العنوان بالعربية" />
                        
                        <Select value={item.link} onValueChange={v => {
                           const nm = [...menuItems]; nm[idx].link = v; setMenuItems(nm);
                        }}>
                           <SelectTrigger className="flex-1 h-12 rounded-xl font-bold bg-slate-50">
                              <SelectValue placeholder="اختر المسار..." />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {availableRoutes.map(route => (
                                <SelectItem key={route.value} value={route.value} className="font-bold">{route.label}</SelectItem>
                              ))}
                              <SelectItem value="custom" className="text-accent font-black">{isAr ? 'رابط مخصص...' : 'Custom URL...'}</SelectItem>
                           </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="size-12 rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={18}/></Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button onClick={() => setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '/', order: menuItems.length }])} variant="outline" className="w-full h-16 rounded-[1.5rem] border-dashed border-2 border-slate-200 font-black text-slate-400 hover:text-primary hover:border-primary transition-all">+ {isAr ? "إضافة رابط جديد للملاحة" : "Add Navigation Node"}</Button>
                </CardContent>
             </Card>
          </TabsContent>

          {/* 6. Branding / Identity */}
          <TabsContent value="branding" className="space-y-6">
             <div className="grid md:grid-cols-2 gap-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6">
                   <h3 className="text-xl font-black flex items-center gap-3 text-primary"><LayoutDashboard /> {isAr ? "عناوين الهيرو (الرئيسية)" : "Hero & Site Messaging"}</h3>
                   <div className="space-y-4">
                      <div className="relative">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? "عنوان الهيرو الرئيسي" : "Hero Title (AR)"}</Label>
                        <Input value={siteConfig?.heroTitle} onChange={e => setSiteConfig(s => s ? {...s, heroTitle: e.target.value} : null)} className="h-12 font-black text-xl pr-12" />
                        <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(siteConfig?.heroTitle || '', 'heroTitle')}><Sparkles size={16}/></Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? "العنوان الفرعي" : "Hero Subtitle (AR)"}</Label>
                        <Textarea value={siteConfig?.heroSubtitle} onChange={e => setSiteConfig(s => s ? {...s, heroSubtitle: e.target.value} : null)} className="font-bold min-h-[100px]" />
                      </div>
                   </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary text-white p-8 space-y-8">
                   <h3 className="text-xl font-black flex items-center gap-3"><ShieldCheck className="text-accent" /> {isAr ? "بيانات التواصل المركزية" : "Contact & Support Hub"}</h3>
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-60">{isAr ? "رقم الهاتف" : "Phone"}</Label>
                            <Input value={siteConfig?.contactPhone} onChange={e => setSiteConfig(s => s ? {...s, contactPhone: e.target.value} : null)} className="bg-white/10 border-none font-black h-12" />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-60">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                            <Input value={siteConfig?.contactEmail} onChange={e => setSiteConfig(s => s ? {...s, contactEmail: e.target.value} : null)} className="bg-white/10 border-none font-bold h-12" />
                         </div>
                      </div>
                      <div className="p-6 bg-accent/10 rounded-3xl border border-accent/20">
                         <p className="text-xs font-bold text-accent leading-relaxed">{isAr ? "سيتم تحديث هذه البيانات فوراً في كافة أنحاء البوابة والفوتر عند الحفظ." : "These contact details are globally synced across the portal and footer."}</p>
                      </div>
                   </div>
                </Card>
             </div>
          </TabsContent>

          {/* 7. Carousel / Banners */}
          <TabsContent value="carousel" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة شريط الصور (Carousel)" : "Home Banner Management"}</h3>
                <Button onClick={() => setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: 'بنر جديد', titleEn: 'New Banner', subtitleAr: '', subtitleEn: '', imageUrl: 'https://picsum.photos/seed/salalah/1200/600' }])} className="dm-gradient-primary rounded-full px-8 font-black h-12 shadow-lg">+ {isAr ? "إضافة بنر جديد" : "Add Banner"}</Button>
             </div>
             <div className="grid md:grid-cols-2 gap-8">
                {carouselItems.map((item, idx) => (
                  <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white group">
                     <div className="h-56 bg-slate-100 relative overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-8">
                           <div className="w-full space-y-2">
                             <Label className="text-white text-[10px] font-black uppercase">{isAr ? 'رابط الصورة المباشر' : 'IMAGE URL'}</Label>
                             <Input value={item.imageUrl} onChange={e => {
                               const ni = [...carouselItems]; ni[idx].imageUrl = e.target.value; setCarouselItems(ni);
                             }} className="bg-white text-xs h-10 rounded-xl" placeholder="https://..." />
                           </div>
                        </div>
                     </div>
                     <CardContent className="p-8 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <Input placeholder="العنوان (AR)" value={item.titleAr} onChange={e => {
                             const ni = [...carouselItems]; ni[idx].titleAr = e.target.value; setCarouselItems(ni);
                           }} className="font-black h-12 rounded-xl" />
                           <Input placeholder="Title (EN)" value={item.titleEn} onChange={e => {
                             const ni = [...carouselItems]; ni[idx].titleEn = e.target.value; setCarouselItems(ni);
                           }} className="font-bold h-12 rounded-xl" />
                        </div>
                        <Button variant="ghost" onClick={() => setCarouselItems(carouselItems.filter(ci => ci.id !== item.id))} className="w-full text-red-500 font-bold hover:bg-red-50 rounded-xl h-11"><Trash2 size={16} className="ml-2"/> {isAr ? "حذف البنر" : "Remove Banner"}</Button>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          {/* 8. Popups */}
          <TabsContent value="popups" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "نظام المنبثقات والتنبيهات" : "Announcement Overlay System"}</h3>
                <Button onClick={() => setPopups([...popups, { id: `p_${Date.now()}`, titleAr: 'تنبيه جديد', titleEn: 'New Alert', type: 'text', isActive: false, displayDelay: 2 }])} className="dm-gradient-primary rounded-full px-8 font-black h-12 shadow-lg">+ {isAr ? "إنشاء منبثقة" : "Create Popup"}</Button>
             </div>
             <div className="bg-white border rounded-[3rem] shadow-xl p-10 space-y-6">
                {popups.map((popup, idx) => (
                  <div key={popup.id} className="p-8 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50 grid md:grid-cols-4 gap-8 items-start group hover:border-primary/20 transition-all">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "نوع المحتوى" : "CONTENT TYPE"}</Label>
                        <Select value={popup.type} onValueChange={v => {
                           const np = [...popups]; np[idx].type = v as any; setPopups(np);
                        }}>
                           <SelectTrigger className="bg-white font-bold h-12 rounded-xl"><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-2xl">
                              <SelectItem value="text">Text Only</SelectItem>
                              <SelectItem value="image">Image Display</SelectItem>
                              <SelectItem value="video">Video Embed</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                           <Input placeholder="العنوان (AR)" value={popup.titleAr} onChange={e => { const np = [...popups]; np[idx].titleAr = e.target.value; setPopups(np); }} className="bg-white font-black h-12 rounded-xl" />
                           <Input placeholder="Title (EN)" value={popup.titleEn} onChange={e => { const np = [...popups]; np[idx].titleEn = e.target.value; setPopups(np); }} className="bg-white font-bold h-12 rounded-xl" />
                        </div>
                        <Input placeholder="Media URL / Link" value={popup.mediaUrl} onChange={e => { const np = [...popups]; np[idx].mediaUrl = e.target.value; setPopups(np); }} className="bg-white font-mono text-xs h-10 rounded-xl" />
                     </div>
                     <div className="flex flex-col gap-4 items-end">
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm">
                           <Label className="text-[10px] font-black text-slate-400">{isAr ? "نشط" : "ACTIVE"}</Label>
                           <Switch checked={popup.isActive} onCheckedChange={v => { const np = [...popups]; np[idx].isActive = v; setPopups(np); }} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setPopups(popups.filter(p => p.id !== popup.id))} className="size-12 rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={20}/></Button>
                     </div>
                  </div>
                ))}
                {popups.length === 0 && <div className="py-20 text-center text-slate-300 font-black italic">{isAr ? 'لا يوجد منبثقات نشطة حالياً' : 'No active popups defined.'}</div>}
             </div>
          </TabsContent>

          {/* 9. Surveys / Polls */}
          <TabsContent value="surveys" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة الاستطلاعات (صوتك يهمنا)" : "Public Sentiment & Polls"}</h3>
                <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/surveybuild">+ {isAr ? "استطلاع جديد" : "New Poll"}</Link></Button>
             </div>
             <div className="grid md:grid-cols-2 gap-8">
                {surveys.map(survey => (
                  <Card key={survey.id} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group">
                     <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-xl bg-accent text-slate-900 flex items-center justify-center"><ClipboardList size={20}/></div>
                           <h4 className="font-black">{isAr ? survey.titleAr : survey.titleEn}</h4>
                        </div>
                        <Switch checked={survey.isActive} onCheckedChange={v => setSurveys(prev => prev.map(s => s.id === survey.id ? {...s, isActive: v} : s))} className="data-[state=checked]:bg-accent" />
                     </div>
                     <CardContent className="p-8">
                        <div className="flex justify-between mb-6">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "إجمالي الردود" : "TOTAL RESPONSES"}</p>
                              <h5 className="text-3xl font-black text-primary">{survey.responsesCount || 0}</h5>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "نوع الاستطلاع" : "TYPE"}</p>
                              <Badge className="bg-primary text-white rounded-lg mt-1">{survey.isPublicPoll ? 'Public' : 'Internal'}</Badge>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button asChild variant="outline" className="flex-1 rounded-xl h-12 font-black"><Link href={`/surveybuild?id=${survey.id}`}>{isAr ? "تعديل الأسئلة" : "Edit Questions"}</Link></Button>
                           <Button variant="ghost" onClick={() => setSurveys(surveys.filter(s => s.id !== survey.id))} className="size-12 rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={18}/></Button>
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          {/* 10. News Ticker */}
          <TabsContent value="ticker" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b bg-slate-900 text-white">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><Megaphone className="text-accent" /> {isAr ? "إدارة شريط الأخبار العاجلة" : "Breaking News Ticker"}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 space-y-4">
                      <Label className="font-black text-primary">{isAr ? "نص الخبر النشط حالياً" : "Current Active Ticker Text"}</Label>
                      <Textarea placeholder="أدخل الخبر هنا..." className="font-bold min-h-[100px] rounded-[1.5rem] bg-white border-none shadow-sm" />
                      <div className="flex items-center gap-4 pt-2">
                         <Button className="dm-gradient-primary rounded-full px-10 font-black h-12 shadow-md">{isAr ? "تحديث شريط الأخبار" : "Push to Ticker"}</Button>
                         <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">
                            <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                            {isAr ? "شريط الأخبار نشط" : "Ticker is LIVE"}
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* 11. Footer Management */}
          <TabsContent value="footer" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><Layers className="text-primary" /> {isAr ? "إدارة روابط التذييل (Footer)" : "Footer Link Architecture"}</CardTitle>
                   <Button onClick={() => {
                     const nc = siteConfig ? {...siteConfig, footerLinks: [...(siteConfig.footerLinks || []), { id: `fl_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '/', category: 'legal' }]} : null;
                     setSiteConfig(nc);
                   }} className="dm-gradient-primary rounded-full px-6 font-black h-11">+ {isAr ? "إضافة رابط" : "Add Link"}</Button>
                </CardHeader>
                <CardContent className="p-8">
                   <div className="grid md:grid-cols-3 gap-8">
                      {['legal', 'services', 'important'].map(cat => (
                        <div key={cat} className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{cat} Links</h4>
                           <div className="space-y-2">
                              {siteConfig?.footerLinks?.filter(l => l.category === cat).map((link, lIdx) => (
                                <div key={link.id} className="p-4 border rounded-2xl bg-slate-50 flex flex-col gap-2 relative group">
                                   <Input value={link.labelAr} onChange={e => {
                                      const nfl = siteConfig?.footerLinks?.map(l => l.id === link.id ? {...l, labelAr: e.target.value} : l);
                                      setSiteConfig(s => s ? {...s, footerLinks: nfl} : null);
                                   }} className="h-9 font-bold bg-white rounded-lg" />
                                   <Input value={link.link} onChange={e => {
                                      const nfl = siteConfig?.footerLinks?.map(l => l.id === link.id ? {...l, link: e.target.value} : l);
                                      setSiteConfig(s => s ? {...s, footerLinks: nfl} : null);
                                   }} className="h-8 font-mono text-[10px] bg-white rounded-lg" />
                                   <Button variant="ghost" onClick={() => {
                                      const nfl = siteConfig?.footerLinks?.filter(l => l.id !== link.id);
                                      setSiteConfig(s => s ? {...s, footerLinks: nfl} : null);
                                   }} className="absolute top-1 right-1 size-6 p-0 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></Button>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* 12. AI Brain Control */}
          <TabsContent value="ai" className="space-y-6">
             <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-accent">
               <CardHeader className="p-10 border-b bg-slate-950 text-white relative overflow-hidden">
                  <div className="relative z-10">
                     <CardTitle className="text-3xl font-black flex items-center gap-3 text-accent"><Sparkles /> {isAr ? "مركز معالجة الذكاء الاصطناعي" : "AI Cognitive Control Hub"}</CardTitle>
                     <CardDescription className="text-slate-400 font-bold mt-2">{isAr ? "إدارة وتخصيص إضافات الذكاء الاصطناعي المدمجة بالبوابة" : "Orchestrate Genkit AI Flows & Assistant Plugins"}</CardDescription>
                  </div>
                  <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
               </CardHeader>
               <CardContent className="p-10 grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> {isAr ? "نظام الإضافات النشطة" : "Active Neural Plugins"}</h4>
                     {[
                       { id: 'tts', label: isAr ? 'تحويل النص إلى صوت (TTS)' : 'Text-to-Speech (TTS)', icon: <Volume2/>, status: 'Active' },
                       { id: 'translate', label: isAr ? 'محرك الترجمة العصبية' : 'AI Translation Neural Flow', icon: <Globe/>, status: 'Active' },
                       { id: 'sl', label: isAr ? 'مساعد لغة الإشارة (Oman SL)' : 'Oman Sign Language AI', icon: <Video/>, status: 'Beta' },
                       { id: 'spatial', label: isAr ? 'المساعد المكاني الغامر' : '3D Spatial Neural Assistant', icon: <MousePointer2/>, status: 'Active' },
                     ].map(plugin => (
                       <div key={plugin.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:border-accent transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-slate-900 transition-colors">{plugin.icon}</div>
                             <div className="flex flex-col">
                               <span className="font-bold text-sm">{plugin.label}</span>
                               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><div className="size-1.5 bg-emerald-500 rounded-full" /> {plugin.status}</span>
                             </div>
                          </div>
                          <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                       </div>
                     ))}
                  </div>

                  <div className="space-y-8">
                     <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2"><Megaphone size={14}/> {isAr ? "تخصيص المساعد الذكي" : "AI Assistant Neural Tuning"}</h4>
                     <div className="space-y-6 p-8 border-2 border-dashed rounded-[2.5rem] bg-slate-50">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "نبرة الصوت الافتراضية (TTS)" : "DEFAULT NEURAL VOICE"}</Label>
                           <Select defaultValue="algenib">
                              <SelectTrigger className="bg-white font-bold h-12 rounded-xl border-none shadow-sm"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-2xl">
                                 <SelectItem value="algenib" className="font-bold">Algenib (Omani Arabic Optimized)</SelectItem>
                                 <SelectItem value="achernar" className="font-bold">Achernar (Global English Neural)</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                           <ShieldAlert size={24} className="text-amber-500 shrink-0" />
                           <p className="text-[11px] text-amber-700 font-bold leading-relaxed">{isAr ? "يتم تشغيل كافة العمليات العصبية عبر Genkit. تأكد من تفعيل مفاتيح البيئة لضمان استمرارية الترجمة التلقائية." : "All neural operations powered by Genkit. Neural translation flows require active API keys in environment config."}</p>
                        </div>
                     </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>

          {/* 13. System / Maintenance */}
          <TabsContent value="system" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-10 border-b bg-slate-900 text-white">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><Wrench className="text-accent" /> {isAr ? "أدوات النظام والصيانة" : "Global System & Maintenance"}</CardTitle>
                </CardHeader>
                <CardContent className="p-10 grid md:grid-cols-2 gap-10">
                   <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                         <Database className="text-primary" size={24} />
                         <h4 className="text-lg font-black">{isAr ? "بذر البيانات الأساسية (SEED)" : "Seed Master Services"}</h4>
                      </div>
                      <p className="text-sm text-slate-500 font-bold leading-relaxed">{isAr ? "سيقوم هذا الإجراء بإعادة بناء كافة الخدمات الـ 80+ بمسمياتها الإنجليزية الصحيحة والمستندات المطلوبة والمراحل الافتراضية." : "Rebuild all 80+ master services with correct English naming, documentation requirements, and neural logic flows."}</p>
                      <Button className="w-full h-14 rounded-2xl dm-gradient-primary font-black shadow-lg gap-2 text-lg">
                         <RefreshCw size={20} />
                         {isAr ? "بدء عملية التثبيت الشاملة" : "Execute Master Global Seed"}
                      </Button>
                   </div>

                   <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                         <ShieldCheck className="text-red-500" size={24} />
                         <h4 className="text-lg font-black text-red-500">{isAr ? "أدوات التطهير والمسح" : "Danger Zone: System Purge"}</h4>
                      </div>
                      <p className="text-sm text-slate-500 font-bold leading-relaxed">{isAr ? "هذا الإجراء سيقوم بمسح كافة طلبات المواطنين المسجلة أو تصفير العدادات العالمية. لا يمكن التراجع عن هذا الإجراء." : "Purge all citizen application logs or reset global transaction counters. This action is irreversible."}</p>
                      <div className="flex gap-4">
                         <Button variant="outline" className="flex-1 h-12 rounded-xl font-black text-red-500 border-red-200 hover:bg-red-50">{isAr ? "مسح الطلبات" : "Purge Apps"}</Button>
                         <Button variant="outline" className="flex-1 h-12 rounded-xl font-black border-slate-200">{isAr ? "تصفير العدادات" : "Reset Stats"}</Button>
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

