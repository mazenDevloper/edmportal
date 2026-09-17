
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
  Survey, CustomPage, PopupMessage, ServiceFlow, ServiceApplication, NewsItem 
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
  RefreshCw, Layers, History, ShieldCheck, Mail, Phone, ExternalLink,
  LayoutDashboard, Car, Truck, Construction, Landmark, MapPin, 
  Droplets, Scissors, GraduationCap, Gavel, Trash, Newspaper
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [tickerText, setTickerText] = useState('');

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
          setNews(data.news || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setPopups(data.popups || []);
          setApplications(data.applications || []);
          setTickerText(data.newsTickerText || '');
        }
      } catch (e) {
        toast({ title: "Error Loading Data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

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
        news,
        surveys, 
        customPages, 
        popups,
        applications,
        newsTickerText: tickerText
      });
      toast({ title: isAr ? "تم حفظ كافة التغييرات بنجاح" : "All changes saved successfully" });
    } catch (e) {
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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
      {/* Command Sidebar */}
      <aside className="w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex border-r border-white/5">
         <div className="flex items-center gap-3">
           <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_25px_rgba(3,207,203,0.4)]">
             <Settings size={24} />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter leading-none">COMMAND</span>
             <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-80">Matrix v5.0</span>
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-1">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-4">{isAr ? 'إدارة النظام المركزية' : 'Global Matrix Management'}</p>
               {[
                 { id: 'overview', label: isAr ? 'الرئيسية' : 'Overview', icon: <BarChart3 size={18}/> },
                 { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Zap size={18}/> },
                 { id: 'news', label: isAr ? 'الأخبار' : 'News Matrix', icon: <Newspaper size={18}/> },
                 { id: 'apps', label: isAr ? 'طلبات المواطنين' : 'Applications', icon: <History size={18}/> },
                 { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Layout size={18}/> },
                 { id: 'menu', label: isAr ? 'الملاحة' : 'Navigation', icon: <Menu size={18}/> },
                 { id: 'branding', label: isAr ? 'الهوية' : 'Identity', icon: <Palette size={18}/> },
                 { id: 'carousel', label: isAr ? 'البنرات' : 'Banners', icon: <ImageIcon size={18}/> },
                 { id: 'popups', label: isAr ? 'المنبثقات' : 'Popups', icon: <Bell size={18}/> },
                 { id: 'surveys', label: isAr ? 'الاستطلاعات' : 'Polls', icon: <ClipboardList size={18}/> },
                 { id: 'ticker', label: isAr ? 'شريط الأخبار' : 'Ticker', icon: <Megaphone size={18}/> },
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
            <TabsTrigger value="news" className="font-black gap-2 rounded-xl h-10"><Newspaper size={14}/> {isAr ? "الأخبار" : "News"}</TabsTrigger>
            <TabsTrigger value="apps" className="font-black gap-2 rounded-xl h-10"><History size={14}/> {isAr ? "الطلبات" : "Apps"}</TabsTrigger>
            <TabsTrigger value="branding" className="font-black gap-2 rounded-xl h-10"><Palette size={14}/> {isAr ? "الهوية" : "Identity"}</TabsTrigger>
            <TabsTrigger value="carousel" className="font-black gap-2 rounded-xl h-10"><ImageIcon size={14}/> {isAr ? "البنرات" : "Banners"}</TabsTrigger>
            <TabsTrigger value="ticker" className="font-black gap-2 rounded-xl h-10"><Megaphone size={14}/> {isAr ? "الأخبار" : "Ticker"}</TabsTrigger>
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
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isAr ? "الأخبار المنشورة" : "News Published"}</p>
                    <h3 className="text-5xl font-black text-primary">{news.length}</h3>
                  </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden border-l-4 border-accent">
                  <CardContent className="p-8">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isAr ? "المقترحات" : "User Surveys"}</p>
                    <h3 className="text-5xl font-black text-primary">{surveys.length}</h3>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* 2. News Matrix Management */}
          <TabsContent value="news" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة مصفوفة الأخبار (50% Matrix)" : "News Matrix Orchestration"}</h3>
                <Button onClick={() => setNews([{ id: `n_${Date.now()}`, titleAr: 'خبر جديد', titleEn: 'New Story', contentAr: '', contentEn: '', imageUrl: '', createdAt: new Date().toISOString() }, ...news])} className="dm-gradient-primary rounded-full px-8 font-black h-12 shadow-lg">+ {isAr ? "إضافة خبر" : "Add News"}</Button>
             </div>
             <div className="grid md:grid-cols-2 gap-8">
                {news.map((item, idx) => (
                  <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white group">
                     <div className="h-48 bg-slate-100 relative">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>
                        )}
                        <Input value={item.imageUrl || ''} onChange={e => {
                           const nn = [...news]; nn[idx].imageUrl = e.target.value; setNews(nn);
                        }} className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur-md h-8 text-[10px] rounded-lg border-none" placeholder="Image URL (Any source allowed)..." />
                     </div>
                     <CardContent className="p-8 space-y-4">
                        <Input value={item.titleAr} onChange={e => {
                           const nn = [...news]; nn[idx].titleAr = e.target.value; setNews(nn);
                        }} className="font-black h-12 rounded-xl" placeholder="عنوان الخبر (AR)" />
                        <Textarea value={item.contentAr} onChange={e => {
                           const nn = [...news]; nn[idx].contentAr = e.target.value; setNews(nn);
                        }} className="min-h-[100px] font-bold rounded-xl" placeholder="محتوى الخبر..." />
                        <Button variant="ghost" onClick={() => setNews(news.filter(n => n.id !== item.id))} className="w-full text-red-500 font-bold hover:bg-red-50 rounded-xl h-11"><Trash2 size={16} className="ml-2"/> {isAr ? "حذف الخبر" : "Remove"}</Button>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          {/* 3. Carousel / Banners (100% Width) */}
          <TabsContent value="carousel" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة البنرات العريضة (100% Width)" : "Full Width Banners"}</h3>
                <Button onClick={() => setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: 'بنر جديد', titleEn: 'New Banner', subtitleAr: '', subtitleEn: '', imageUrl: '' }])} className="dm-gradient-primary rounded-full px-8 font-black h-12 shadow-lg">+ {isAr ? "إضافة بنر" : "Add Banner"}</Button>
             </div>
             <div className="space-y-6">
                {carouselItems.map((item, idx) => (
                  <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white grid md:grid-cols-3 gap-6">
                     <div className="h-48 bg-slate-100 relative">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>}
                        <Input value={item.imageUrl || ''} onChange={e => {
                           const ni = [...carouselItems]; ni[idx].imageUrl = e.target.value; setCarouselItems(ni);
                        }} className="absolute bottom-2 left-2 right-2 bg-white/80 h-8 text-[10px] rounded-lg" placeholder="Banner Image URL..." />
                     </div>
                     <div className="md:col-span-2 p-8 flex flex-col justify-center gap-4">
                        <Input placeholder="عنوان البنر (AR)" value={item.titleAr} onChange={e => { const ni = [...carouselItems]; ni[idx].titleAr = e.target.value; setCarouselItems(ni); }} className="font-black h-12 rounded-xl" />
                        <Button variant="ghost" onClick={() => setCarouselItems(carouselItems.filter(ci => ci.id !== item.id))} className="text-red-500 font-bold self-end"><Trash2 size={16}/> {isAr ? "حذف" : "Remove"}</Button>
                     </div>
                  </Card>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
