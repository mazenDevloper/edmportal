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
  RefreshCw, Layers, History, ShieldCheck, Mail, Phone, ExternalLink,
  LayoutDashboard, Car, Truck, Construction, Landmark, MapPin, 
  Droplets, Scissors, GraduationCap, Gavel, Trash
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
  const [searchQuery, setSearchQuery] = useState('');

  const [services, setServices] = useState<Service[]>([]);
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
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

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const t = (isAr ? s.title : s.titleEn || s.title).toLowerCase();
      return t.includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    });
  }, [services, searchQuery, isAr]);

  const availableRoutes = useMemo(() => {
    const staticRoutes = [
      { label: isAr ? 'الرئيسية' : 'Home', value: '/' },
      { label: isAr ? 'دليل الخدمات' : 'Service Catalog', value: '/catalog' },
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
      <aside className="w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex border-r border-white/5">
         <div className="flex items-center gap-3">
           <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_25px_rgba(3,207,203,0.4)]">
             <Settings size={24} />
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
            <TabsTrigger value="menu" className="font-black gap-2 rounded-xl h-10"><Menu size={14}/> {isAr ? "الملاحة" : "Menu"}</TabsTrigger>
            <TabsTrigger value="ticker" className="font-black gap-2 rounded-xl h-10"><Megaphone size={14}/> {isAr ? "الأخبار" : "Ticker"}</TabsTrigger>
            <TabsTrigger value="ai" className="font-black gap-2 rounded-xl h-10 text-accent"><Sparkles size={14}/> {isAr ? "AI Brain" : "AI Brain"}</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b bg-slate-50">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><Menu className="text-primary" /> {isAr ? "روابط القائمة العلوية" : "Header Navigation Matrix"}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <AnimatePresence>
                    {menuItems.map((item, idx) => (
                      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.9}} key={item.id} className="flex flex-col md:flex-row gap-4 p-5 border-2 border-slate-100 rounded-[1.5rem] bg-white items-center group hover:border-primary/20 transition-all">
                        <Input value={item.labelAr || ''} onChange={e => {
                           const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm);
                        }} className="font-bold flex-1 h-12 rounded-xl" placeholder="العنوان بالعربية" />
                        
                        <Select value={item.link || '/'} onValueChange={v => {
                           const nm = [...menuItems]; nm[idx].link = v; setMenuItems(nm);
                        }}>
                           <SelectTrigger className="flex-1 h-12 rounded-xl font-bold bg-slate-50">
                              <SelectValue placeholder="اختر المسار..." />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {availableRoutes.map(route => (
                                <SelectItem key={route.value} value={route.value} className="font-bold">{route.label}</SelectItem>
                              ))}
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
        </Tabs>
      </main>
    </div>
  );
}
