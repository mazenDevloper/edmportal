
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
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
  LayoutDashboard, Newspaper, List, Grid, CheckCircle2, AlertTriangle, Info, Clock, Lock
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Comprehensive Global State for 13 Sections
  const [services, setServices] = useState<Service[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [tickerText, setTickerText] = useState('');
  const [flows, setFlows] = useState<ServiceFlow[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setNews(data.news || []);
          setCarouselItems(data.carouselItems || []);
          setMenuItems(data.menuItems || []);
          setApplications(data.applications || []);
          setCustomPages(data.customPages || []);
          setSurveys(data.surveys || []);
          setPopups(data.popups || []);
          setSiteConfig(data.siteConfig || null);
          setTickerText(data.newsTickerText || '');
          setFlows(data.serviceFlows || []);
        }
      } catch (e) {
        toast({ title: "Error Loading Matrix", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleGlobalSync = async () => {
    setSaving(true);
    try {
      await updateBin({
        services,
        news,
        carouselItems,
        menuItems,
        applications,
        customPages,
        surveys,
        popups,
        siteConfig,
        newsTickerText: tickerText,
        serviceFlows: flows
      });
      toast({ title: isAr ? "تمت مزامنة كافة الأنظمة بنجاح" : "Global Matrix Synced Successfully" });
    } catch (e) {
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: 'overview', labelAr: 'الإحصائيات', labelEn: 'Overview', icon: <BarChart3 size={18}/> },
    { id: 'services', labelAr: 'الخدمات', labelEn: 'Services', icon: <Zap size={18}/> },
    { id: 'news', labelAr: 'الأخبار', labelEn: 'News Matrix', icon: <Newspaper size={18}/> },
    { id: 'apps', labelAr: 'الطلبات', labelEn: 'Applications', icon: <History size={18}/> },
    { id: 'pages', labelAr: 'الصفحات', labelEn: 'Pages', icon: <Layout size={18}/> },
    { id: 'menu', labelAr: 'الملاحة', labelEn: 'Navigation', icon: <Menu size={18}/> },
    { id: 'branding', labelAr: 'الهوية', labelEn: 'Identity', icon: <Palette size={18}/> },
    { id: 'carousel', labelAr: 'البنرات', labelEn: 'Banners', icon: <ImageIcon size={18}/> },
    { id: 'popups', labelAr: 'المنبثقات', labelEn: 'Popups', icon: <Bell size={18}/> },
    { id: 'surveys', labelAr: 'الاستطلاعات', labelEn: 'Polls', icon: <ClipboardList size={18}/> },
    { id: 'ticker', labelAr: 'شريط الأخبار', labelEn: 'Ticker', icon: <Megaphone size={18}/> },
    { id: 'footer', labelAr: 'التذييل', labelEn: 'Footer', icon: <Layout size={18}/> },
    { id: 'system', labelAr: 'النظام', labelEn: 'System', icon: <Wrench size={18}/> },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-primary" size={64} /></div>;

  return (
    <div className={cn("min-h-screen bg-[#F8FAFC] flex", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* 1. Side Command Center Navigation */}
      <aside className="w-80 bg-slate-950 text-white p-8 sticky top-0 h-screen flex flex-col gap-10 hidden lg:flex border-r border-white/5 z-50">
         <div className="flex items-center gap-4">
           <div className="size-14 bg-primary rounded-2xl flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(3,207,203,0.4)] transition-transform hover:rotate-6">
             <Settings size={28} />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-2xl tracking-tighter leading-none">MATRIX</span>
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80 mt-1">Dhofar Cmd v8.0</span>
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-2">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 px-4">{isAr ? 'إدارة المنظومة الرقمية' : 'Global Matrix Controls'}</p>
               {navItems.map(item => (
                 <Button 
                   key={item.id} 
                   variant="ghost" 
                   onClick={() => setActiveTab(item.id)}
                   className={cn(
                     "justify-start gap-4 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all",
                     activeTab === item.id ? "bg-white/10 text-primary shadow-lg border-l-4 border-primary" : "text-slate-400 hover:bg-white/5 hover:text-white"
                   )}
                 >
                   {item.icon} {isAr ? item.labelAr : item.labelEn}
                 </Button>
               ))}
            </nav>
         </div>

         <div className="pt-6 border-t border-white/5">
            <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 relative overflow-hidden group">
               <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
               <div className="flex items-center gap-2 mb-2 relative z-10">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Neural Link Active</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold leading-relaxed relative z-10">Matrix connected to Gemini 2.5 Flash. Real-time translation ready.</p>
            </div>
         </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {/* 2. Global Header Action Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full dm-pattern-wave-pro opacity-[0.02] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
              {isAr ? "لوحة القيادة المركزية" : "Central Command Dash"}
              <Badge variant="outline" className="text-[10px] rounded-lg bg-slate-50 border-slate-200">BETA ACCESS</Badge>
            </h1>
            <p className="text-slate-400 font-bold mt-2 uppercase text-xs tracking-widest">{isAr ? "تحكم كامل في كافة مفاصل البوابة الرقمية لبلدية ظفار" : "End-to-end portal orchestration for Dhofar Municipality"}</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <Button variant="outline" asChild className="rounded-full font-black px-10 border-slate-200 h-14 shadow-sm hover:bg-slate-50">
              <Link href="/">{isAr ? "معاينة البوابة" : "Live Preview"}</Link>
            </Button>
            <Button onClick={handleGlobalSync} disabled={saving} className="dm-gradient-primary rounded-full px-12 font-black shadow-[0_15px_40px_rgba(3,207,203,0.3)] h-14 gap-3 text-lg transition-transform active:scale-95">
              {saving ? <Loader2 className="animate-spin" /> : <CloudUpload />}
              {isAr ? "مزامنة النظام" : "Global Sync"}
            </Button>
          </div>
        </header>

        {/* 3. Detailed Tab Contents (13 Sections) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                 <div className="grid md:grid-cols-4 gap-8">
                    {[
                      { label: isAr ? 'الخدمات' : 'Services', val: services.length, icon: <Zap/>, color: 'bg-primary' },
                      { label: isAr ? 'الطلبات' : 'Applications', val: applications.length, icon: <History/>, color: 'bg-secondary' },
                      { label: isAr ? 'الأخبار' : 'News', val: news.length, icon: <Newspaper/>, color: 'bg-slate-900' },
                      { label: isAr ? 'المستخدمين' : 'Users', val: 1250, icon: <Star/>, color: 'bg-emerald-600' },
                    ].map((card, i) => (
                      <Card key={i} className={cn("rounded-[3rem] border-none shadow-xl text-white overflow-hidden relative group", card.color)}>
                         <div className="absolute top-0 right-0 size-32 dm-pattern-matrix-all opacity-10 -rotate-12 group-hover:scale-110 transition-transform" />
                         <CardContent className="p-10 space-y-2 relative z-10">
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{card.label}</p>
                            <h3 className="text-6xl font-black tracking-tighter">{card.val}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold mt-4 bg-black/10 w-fit px-3 py-1 rounded-full">
                               <RefreshCw size={10} className="animate-spin-slow"/> Live Tracking
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 2. SERVICES CRUD */}
            {activeTab === 'services' && (
               <div className="space-y-8">
                  <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                     <h3 className="text-xl font-black text-slate-800">{isAr ? "دليل الخدمات (80+ خدمة)" : "Municipal Service Catalog"}</h3>
                     <Button onClick={() => setServices([{ id: `svc_${Date.now()}`, title: 'خدمة جديدة', description: '', category: 'elec', iconName: 'FileText', isActive: true, reqsAr: [], reqsEn: [], fees: '0 OMR' }, ...services])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة خدمة" : "Add Service"}</Button>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {services.map((svc, idx) => (
                       <Card key={svc.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white hover:ring-2 hover:ring-primary/20 transition-all">
                          <CardHeader className="bg-slate-50 border-b p-8 flex flex-row justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary"><Zap size={24}/></div>
                                <Input value={svc.title} onChange={e => { const ns = [...services]; ns[idx].title = e.target.value; setServices(ns); }} className="font-black bg-transparent border-none text-lg h-8 focus:ring-0" />
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(s => s.id !== svc.id))} className="text-red-400"><Trash2 size={18}/></Button>
                          </CardHeader>
                          <CardContent className="p-8 space-y-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Description</Label>
                                <Textarea value={svc.description} onChange={e => { const ns = [...services]; ns[idx].description = e.target.value; setServices(ns); }} className="min-h-[80px] rounded-2xl text-xs font-bold bg-slate-50 border-none" />
                             </div>
                             <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400">Fees</Label>
                                   <Input value={svc.fees} onChange={e => { const ns = [...services]; ns[idx].fees = e.target.value; setServices(ns); }} className="rounded-xl h-10 border-slate-100 text-xs font-black" />
                                </div>
                                <div className="flex-1 space-y-2">
                                   <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                                   <Select value={svc.category} onValueChange={v => { const ns = [...services]; ns[idx].category = v; setServices(ns); }}>
                                      <SelectTrigger className="h-10 rounded-xl border-slate-100 text-[10px] font-black"><SelectValue/></SelectTrigger>
                                      <SelectContent className="rounded-xl"><SelectItem value="building">Building</SelectItem><SelectItem value="elec">Electronic</SelectItem></SelectContent>
                                   </Select>
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                     ))}
                  </div>
               </div>
            )}

            {/* 3. NEWS MATRIX (50/50) */}
            {activeTab === 'news' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-black text-slate-800">{isAr ? "إدارة مصفوفة الأخبار (50%)" : "News Matrix Orchestration"}</h3>
                    <Button onClick={() => setNews([{ id: `n_${Date.now()}`, titleAr: 'خبر جديد', titleEn: 'New Story', contentAr: '', contentEn: '', imageUrl: '', createdAt: new Date().toISOString() }, ...news])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة خبر" : "Add News"}</Button>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    {news.map((item, idx) => (
                      <Card key={item.id} className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white group">
                         <div className="h-64 bg-slate-100 relative overflow-hidden">
                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={64}/></div>}
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                               <Input value={item.imageUrl || ''} onChange={e => { const nn = [...news]; nn[idx].imageUrl = e.target.value; setNews(nn); }} className="bg-white/90 backdrop-blur-md h-10 text-[10px] rounded-xl border-none shadow-lg" placeholder="Image URL (Direct)..." />
                            </div>
                         </div>
                         <CardContent className="p-10 space-y-6">
                            <Input value={item.titleAr} onChange={e => { const nn = [...news]; nn[idx].titleAr = e.target.value; setNews(nn); }} className="font-black h-14 rounded-2xl text-xl shadow-inner border-slate-50" placeholder="عنوان الخبر (AR)" />
                            <Textarea value={item.contentAr} onChange={e => { const nn = [...news]; nn[idx].contentAr = e.target.value; setNews(nn); }} className="min-h-[120px] font-bold rounded-2xl text-sm border-slate-50 shadow-inner" placeholder="محتوى الخبر..." />
                            <div className="flex gap-4 pt-4">
                               <Button variant="outline" className="flex-1 rounded-2xl h-12 border-slate-100 font-bold"><Sparkles size={16} className="ml-2 text-primary"/> AI Translate</Button>
                               <Button variant="ghost" onClick={() => setNews(news.filter(n => n.id !== item.id))} className="flex-1 text-red-500 font-black hover:bg-red-50 rounded-2xl h-12"><Trash2 size={16} className="ml-2"/> {isAr ? "حذف" : "Delete"}</Button>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 4. APPLICATIONS TRACKER */}
            {activeTab === 'apps' && (
              <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
                 <div className="bg-slate-950 p-8 flex justify-between items-center">
                    <h3 className="text-white text-xl font-black">{isAr ? "سجل طلبات المواطنين (ثقة)" : "Citizen Requests Ledger"}</h3>
                    <Badge className="bg-primary text-slate-950 font-black px-4">{applications.length} TOTAL</Badge>
                 </div>
                 <Table>
                    <TableHeader className="bg-slate-50">
                       <TableRow>
                          <TableHead className="p-8 font-black">Ref ID</TableHead>
                          <TableHead className="p-8 font-black">Citizen</TableHead>
                          <TableHead className="p-8 font-black">Service</TableHead>
                          <TableHead className="p-8 font-black">Status</TableHead>
                          <TableHead className="p-8 font-black text-center">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {applications.map((app, idx) => (
                         <TableRow key={app.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="p-8 font-mono text-xs text-primary">{app.id}</TableCell>
                            <TableCell className="p-8 font-black">{app.citizenName}</TableCell>
                            <TableCell className="p-8 font-bold">{app.serviceName}</TableCell>
                            <TableCell className="p-8">
                               <Select value={app.status} onValueChange={v => { const na = [...applications]; na[idx].status = v as any; setApplications(na); }}>
                                  <SelectTrigger className="h-8 rounded-lg border-none bg-slate-100 text-[10px] font-black uppercase"><SelectValue/></SelectTrigger>
                                  <SelectContent className="rounded-xl"><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-review">In-Review</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent>
                               </Select>
                            </TableCell>
                            <TableCell className="p-8 text-center flex justify-center gap-2">
                               <Button variant="outline" size="sm" className="rounded-lg h-8 px-4 font-black text-[10px] border-slate-200">VIEW DATA</Button>
                               <Button variant="ghost" size="sm" className="rounded-lg h-8 text-red-500" onClick={() => setApplications(applications.filter(a => a.id !== app.id))}><Trash2 size={14}/></Button>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
            )}

            {/* 5. PAGES MANAGER */}
            {activeTab === 'pages' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-black text-slate-800">{isAr ? "إدارة الصفحات الديناميكية" : "Dynamic Custom Pages"}</h3>
                    <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/pagebuild">+ {isAr ? "بناء صفحة جديدة" : "New Page"}</Link></Button>
                 </div>
                 <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {customPages.map(page => (
                      <Card key={page.id} className="rounded-[3rem] border-none shadow-xl bg-white group hover:-translate-y-2 transition-all">
                         <CardContent className="p-10 space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="size-16 rounded-3xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Layout size={32}/></div>
                               <Badge variant="outline" className="rounded-lg text-[9px] font-black bg-slate-50 border-slate-200">/p/{page.slug}</Badge>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">{isAr ? page.titleAr : page.titleEn}</h4>
                            <div className="flex gap-2">
                               <Button variant="outline" asChild className="flex-1 rounded-2xl h-12 border-slate-100 font-bold"><Link href={`/pagebuild?id=${page.id}`}>Edit Build</Link></Button>
                               <Button variant="outline" asChild className="size-12 rounded-2xl border-slate-100"><Link href={`/p/${page.slug}`}><Eye size={18}/></Link></Button>
                               <Button variant="ghost" onClick={() => setCustomPages(customPages.filter(p => p.id !== page.id))} className="size-12 rounded-2xl text-red-500 hover:bg-red-50"><Trash2 size={18}/></Button>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 6. NAVIGATION (MENU) */}
            {activeTab === 'menu' && (
              <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                 <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                    <h3 className="text-xl font-black">{isAr ? "إدارة القائمة الرئيسية" : "Global Navigation Hub"}</h3>
                    <Button onClick={() => setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '/', order: menuItems.length + 1 }])} className="bg-primary text-slate-900 font-black">+ {isAr ? "إضافة رابط" : "Add Link"}</Button>
                 </div>
                 <div className="p-8 space-y-4">
                    {menuItems.map((item, idx) => (
                       <div key={item.id} className="flex gap-4 items-center bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-primary/20 transition-all group">
                          <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">{idx+1}</div>
                          <Input value={item.labelAr} onChange={e => { const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm); }} className="flex-1 font-black bg-white rounded-xl border-none shadow-sm" placeholder="Label AR" />
                          <Input value={item.link} onChange={e => { const nm = [...menuItems]; nm[idx].link = e.target.value; setMenuItems(nm); }} className="flex-1 font-mono text-xs bg-white rounded-xl border-none shadow-sm" placeholder="/url-path" />
                          <Button variant="ghost" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="text-red-400"><Trash2 size={18}/></Button>
                       </div>
                    ))}
                 </div>
              </Card>
            )}

            {/* 7. BRANDING & SITE CONFIG */}
            {activeTab === 'branding' && (
              <div className="grid md:grid-cols-2 gap-10">
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Globe size={24} className="text-primary"/> {isAr ? "إعدادات الواجهة" : "Global Portal Brand"}</h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Hero Main Title (AR)</Label>
                          <Input value={siteConfig?.heroTitle} onChange={e => setSiteConfig({...siteConfig!, heroTitle: e.target.value})} className="h-14 rounded-2xl font-black text-lg border-slate-100 shadow-sm" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Hero Subtitle (AR)</Label>
                          <Textarea value={siteConfig?.heroSubtitle} onChange={e => setSiteConfig({...siteConfig!, heroSubtitle: e.target.value})} className="min-h-[100px] rounded-2xl font-bold text-sm border-slate-100 shadow-sm" />
                       </div>
                    </div>
                 </Card>
                 
                 <Card className="rounded-[3rem] border-none shadow-xl bg-slate-950 p-10 text-white space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
                    <h3 className="text-2xl font-black text-primary flex items-center gap-3 relative z-10"><Phone size={24}/> {isAr ? "معلومات التواصل" : "Contact Matrix"}</h3>
                    <div className="space-y-6 relative z-10">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-white/40">Hotline Number</Label>
                          <Input value={siteConfig?.contactPhone} onChange={e => setSiteConfig({...siteConfig!, contactPhone: e.target.value})} className="h-12 rounded-xl font-black bg-white/5 border-white/10 text-primary" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-white/40">Official Email</Label>
                          <Input value={siteConfig?.contactEmail} onChange={e => setSiteConfig({...siteConfig!, contactEmail: e.target.value})} className="h-12 rounded-xl font-bold bg-white/5 border-white/10" />
                       </div>
                    </div>
                 </Card>
              </div>
            )}

            {/* 8. CAROUSEL (100% BANNERS) */}
            {activeTab === 'carousel' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-black text-slate-800">{isAr ? "إدارة البنرات العريضة (100%)" : "Full-Width Banner Carousel"}</h3>
                    <Button onClick={() => setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: 'بنر جديد', titleEn: 'New Banner', subtitleAr: '', subtitleEn: '', imageUrl: '' }])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة بنر" : "Add Banner"}</Button>
                 </div>
                 <div className="space-y-6">
                    {carouselItems.map((item, idx) => (
                      <Card key={item.id} className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white grid md:grid-cols-3 gap-0">
                         <div className="h-64 bg-slate-100 relative group">
                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>}
                            <Input value={item.imageUrl || ''} onChange={e => { const ni = [...carouselItems]; ni[idx].imageUrl = e.target.value; setCarouselItems(ni); }} className="absolute bottom-4 left-4 right-4 bg-white/80 h-10 text-[10px] rounded-xl border-none shadow-lg" placeholder="Banner Image URL..." />
                         </div>
                         <div className="md:col-span-2 p-10 flex flex-col justify-center gap-6 relative">
                            <Input placeholder="عنوان البنر (AR)" value={item.titleAr} onChange={e => { const ni = [...carouselItems]; ni[idx].titleAr = e.target.value; setCarouselItems(ni); }} className="font-black h-14 rounded-2xl text-2xl shadow-inner border-slate-50" />
                            <div className="flex justify-between items-center pt-4">
                               <Badge className="bg-slate-900 text-white rounded-full">ACTIVE BANNER #{idx+1}</Badge>
                               <Button variant="ghost" onClick={() => setCarouselItems(carouselItems.filter(ci => ci.id !== item.id))} className="text-red-500 font-black hover:bg-red-50 rounded-2xl px-6 h-12"><Trash2 size={16} className="ml-2"/> {isAr ? "إزالة البنر" : "Remove"}</Button>
                            </div>
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 9. POPUPS MANAGER */}
            {activeTab === 'popups' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-black text-slate-800">{isAr ? "نظام الإعلانات المنبثقة" : "Announcement Popup System"}</h3>
                    <Button onClick={() => setPopups([{ id: `p_${Date.now()}`, type: 'text', titleAr: 'تنبيه جديد', titleEn: 'New Alert', contentAr: '', contentEn: '', isActive: true, displayDelay: 2 }, ...popups])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة منبثقة" : "Add Popup"}</Button>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    {popups.map((pop, idx) => (
                      <Card key={pop.id} className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                         <div className="bg-slate-950 p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="size-10 rounded-xl bg-primary text-slate-950 flex items-center justify-center"><Bell size={20}/></div>
                               <span className="text-white font-black text-xs uppercase tracking-widest">Popup Config</span>
                            </div>
                            <Switch checked={pop.isActive} onCheckedChange={v => { const np = [...popups]; np[idx].isActive = v; setPopups(np); }} />
                         </div>
                         <CardContent className="p-10 space-y-6">
                            <div className="flex gap-4">
                               <Select value={pop.type} onValueChange={v => { const np = [...popups]; np[idx].type = v as any; setPopups(np); }}>
                                  <SelectTrigger className="flex-1 h-12 rounded-xl font-bold bg-slate-50 border-none"><SelectValue/></SelectTrigger>
                                  <SelectContent className="rounded-xl"><SelectItem value="text">Text Only</SelectItem><SelectItem value="image">Image Display</SelectItem><SelectItem value="video">Video Modal</SelectItem></SelectContent>
                               </Select>
                               <Input type="number" value={pop.displayDelay} onChange={e => { const np = [...popups]; np[idx].displayDelay = parseInt(e.target.value); setPopups(np); }} className="w-32 h-12 rounded-xl text-center font-black" placeholder="Delay (sec)" />
                            </div>
                            <Input value={pop.titleAr} onChange={e => { const np = [...popups]; np[idx].titleAr = e.target.value; setPopups(np); }} className="h-12 rounded-xl font-black" placeholder="Title (AR)" />
                            <Textarea value={pop.contentAr} onChange={e => { const np = [...popups]; np[idx].contentAr = e.target.value; setPopups(np); }} className="min-h-[80px] rounded-xl text-xs font-bold" placeholder="Content Body..." />
                            <Button variant="ghost" onClick={() => setPopups(popups.filter(p => p.id !== pop.id))} className="w-full text-red-500 font-black mt-4 rounded-xl border border-red-100 hover:bg-red-50"><Trash2 size={16} className="ml-2"/> Remove System Popup</Button>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 10. SURVEYS (POLLS) */}
            {activeTab === 'surveys' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xl font-black text-slate-800">{isAr ? "منصة استطلاع الرأي العام" : "Public Sentiment Polls"}</h3>
                    <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/surveybuild">+ {isAr ? "بناء استبيان" : "Create Poll"}</Link></Button>
                 </div>
                 <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {surveys.map((sv, idx) => (
                      <Card key={sv.id} className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                         <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="size-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-primary shadow-inner"><ClipboardList size={32}/></div>
                               <Switch checked={sv.isActive} onCheckedChange={v => {
                                 const ns = surveys.map((s, i) => i === idx ? {...s, isActive: v} : {...s, isActive: false});
                                 setSurveys(ns);
                               }} />
                            </div>
                            <div>
                               <h4 className="text-2xl font-black text-slate-900 tracking-tight">{isAr ? sv.titleAr : sv.titleEn}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{sv.questions.length} Questions • {sv.responsesCount} Responses</p>
                            </div>
                            <div className="flex gap-2">
                               <Button variant="outline" asChild className="flex-1 rounded-2xl h-12 border-slate-100 font-bold"><Link href={`/surveybuild?id=${sv.id}`}>Edit Questions</Link></Button>
                               <Button variant="ghost" onClick={() => setSurveys(surveys.filter(s => s.id !== sv.id))} className="size-12 rounded-2xl text-red-500 hover:bg-red-50"><Trash2 size={18}/></Button>
                            </div>
                         </div>
                         <div className="bg-slate-50 p-4 border-t flex justify-center">
                            <Badge className={cn("rounded-full font-black text-[9px] uppercase px-4", sv.isActive ? "bg-emerald-600" : "bg-slate-400")}>{sv.isActive ? 'LIVE ON HOME' : 'ARCHIVED'}</Badge>
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 11. NEWS TICKER (TEXT) */}
            {activeTab === 'ticker' && (
              <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                 <div className="bg-primary p-8 text-slate-950 flex items-center gap-4 relative">
                    <div className="absolute top-0 right-0 w-32 h-full dm-pattern-wave-pro opacity-10 pointer-events-none" />
                    <Megaphone size={32} className="relative z-10" />
                    <div className="relative z-10">
                       <h3 className="text-2xl font-black tracking-tight">{isAr ? "شريط الأخبار العاجلة" : "Breaking News Ticker"}</h3>
                       <p className="text-[10px] font-bold uppercase opacity-60">Global Marquee Broadcast</p>
                    </div>
                 </div>
                 <CardContent className="p-12 space-y-8">
                    <div className="space-y-4">
                       <Label className="text-sm font-black text-slate-700">{isAr ? "نص الشريط المتحرك" : "Marquee Display Text"}</Label>
                       <Textarea 
                         value={tickerText} 
                         onChange={e => setTickerText(e.target.value)} 
                         className="min-h-[150px] rounded-[2rem] font-black text-xl p-8 bg-slate-50 border-none shadow-inner leading-relaxed"
                         placeholder={isAr ? "أدخل الأخبار العاجلة هنا..." : "Enter breaking news broadcast here..."}
                       />
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="size-4 bg-primary rounded-full animate-ping" />
                          <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Real-time Broadcast Sync Enabled</span>
                       </div>
                       <Button variant="ghost" onClick={() => setTickerText('')} className="text-red-400 font-black">RESET TRACK</Button>
                    </div>
                 </CardContent>
              </Card>
            )}

            {/* 12. FOOTER MANAGER */}
            {activeTab === 'footer' && (
              <div className="space-y-10">
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><LayoutDashboard size={24} className="text-primary"/> {isAr ? "روابط التذييل (Footer)" : "Global Footer Matrix"}</h3>
                       <Button onClick={() => setSiteConfig({...siteConfig!, footerLinks: [...(siteConfig?.footerLinks || []), { id: `fl_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '#', category: 'legal' }]})} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة رابط" : "Add Link"}</Button>
                    </div>
                    <div className="space-y-4">
                       {siteConfig?.footerLinks?.map((link, idx) => (
                          <div key={link.id} className="grid md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[2rem] items-center group hover:bg-white hover:ring-2 hover:ring-primary/20 transition-all shadow-sm">
                             <Input value={link.labelAr} onChange={e => { const nl = [...siteConfig.footerLinks!]; nl[idx].labelAr = e.target.value; setSiteConfig({...siteConfig, footerLinks: nl}); }} className="font-black bg-white rounded-xl border-none shadow-sm h-10" placeholder="Label AR" />
                             <Input value={link.link} onChange={e => { const nl = [...siteConfig.footerLinks!]; nl[idx].link = e.target.value; setSiteConfig({...siteConfig, footerLinks: nl}); }} className="font-mono text-[10px] bg-white rounded-xl border-none shadow-sm h-10" placeholder="https://..." />
                             <Select value={link.category} onValueChange={v => { const nl = [...siteConfig.footerLinks!]; nl[idx].category = v as any; setSiteConfig({...siteConfig, footerLinks: nl}); }}>
                                <SelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm text-[10px] font-black uppercase"><SelectValue/></SelectTrigger>
                                <SelectContent className="rounded-xl"><SelectItem value="legal">Legal</SelectItem><SelectItem value="services">Services</SelectItem><SelectItem value="important">Important</SelectItem></SelectContent>
                             </Select>
                             <Button variant="ghost" onClick={() => setSiteConfig({...siteConfig!, footerLinks: siteConfig?.footerLinks?.filter(fl => fl.id !== link.id)})} className="text-red-400 self-center"><Trash2 size={18}/></Button>
                          </div>
                       ))}
                    </div>
                 </Card>
              </div>
            )}

            {/* 13. SYSTEM & MAINTENANCE */}
            {activeTab === 'system' && (
              <div className="grid md:grid-cols-2 gap-10">
                 <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-10 space-y-10 relative overflow-hidden">
                    <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                       <h3 className="text-2xl font-black text-primary flex items-center gap-3"><ShieldAlert size={24}/> {isAr ? "إدارة الصيانة" : "Security & System"}</h3>
                       <Switch checked={siteConfig?.isMaintenanceMode} onCheckedChange={v => setSiteConfig({...siteConfig!, isMaintenanceMode: v})} className="data-[state=checked]:bg-red-500" />
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 relative z-10">
                       <div className="flex items-center justify-between">
                          <span className="font-black text-xs uppercase tracking-widest text-white/60">{isAr ? "وضع الصيانة" : "Maintenance Mode"}</span>
                          <Badge className={cn("rounded-full font-black px-4", siteConfig?.isMaintenanceMode ? "bg-red-500 animate-pulse" : "bg-emerald-500")}>{siteConfig?.isMaintenanceMode ? 'ENABLED' : 'DISABLED'}</Badge>
                       </div>
                       <p className="text-xs text-white/40 font-medium leading-relaxed italic">{isAr ? "تفعيل هذا الخيار سيغلق كافة الخدمات الرقمية وسيظهر رسالة اعتذار للمواطنين." : "Enabling this will shut down all e-services and show an apology message to users."}</p>
                    </div>
                 </Card>
                 
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Lock size={24} className="text-primary"/> {isAr ? "مفاتيح التكامل API" : "API Integration Hub"}</h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Accessibility Integration Key</Label>
                          <Input value="DM-ACCESS-PRO-128X-2024" readOnly className="bg-slate-50 border-none rounded-xl font-mono text-[10px] text-slate-400" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Google AI Engine (Gemini)</Label>
                          <Badge className="bg-emerald-50 text-emerald-600 font-black">STABLE LINK</Badge>
                       </div>
                    </div>
                    <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 font-black text-xs uppercase tracking-widest"><RefreshCw size={14} className="ml-2"/> Rotate System Keys</Button>
                 </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 4. Persistence Toast Notification */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
           <AnimatePresence>
             {saving && (
               <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="font-black tracking-tight text-lg">Pushing Matrix Updates to Cloud...</span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

