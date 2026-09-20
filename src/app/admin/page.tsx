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
  LayoutDashboard, Newspaper, List, Grid, CheckCircle2, AlertTriangle, Info, Clock, Lock
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

const MASTER_SERVICES_CATALOG = [
  { id: 'svc_100', title: 'ترخيص إقامة عرض ترويجي للسيارات', titleEn: 'Get a Permit for Organizing a Promotional Car Event', icon: 'Car', cat: 'invest' },
  { id: 'svc_101', title: 'تصديق مسارات تمديدات الكهرباء', titleEn: 'Get the Municipality\'s Approval for the Paths of Electrical Service Installations (Household Connections)', icon: 'Zap', cat: 'tech' },
  { id: 'svc_102', title: 'إصدار تصاريح صهاريج مياة الصرف الصحي', titleEn: 'Get a Permit for a Sewage Tanker', icon: 'Truck', cat: 'health' },
  { id: 'svc_103', title: 'اعتماد إعلانات المطبوعات والمنشورات', titleEn: 'Get Approval of Print Advertisements, Posters, and Publications Service', icon: 'Megaphone', cat: 'admin' },
  { id: 'svc_104', title: 'طلب إقامة منشط أو فعالية في الخريف', titleEn: 'Request to Hold an Activity, Event or Exhibition During the Fall Season', icon: 'Landmark', cat: 'invest' },
  { id: 'svc_105', title: 'تواصل معنا', titleEn: 'Contact Us / Support Support', icon: 'Phone', cat: 'admin' },
  { id: 'svc_106', title: 'تصديق تمديدات الصرف الصحي', titleEn: 'Get Municipal Approval for Sanitary Sewer Service Extensions (Household Connections)', icon: 'Droplets', cat: 'tech' },
  { id: 'svc_107', title: 'تصديق رصف البلاط المتشابك', titleEn: 'Application for obtaining the Municipality\'s approval for paving with interlocking tiles in front of houses.', icon: 'Construction', cat: 'tech' },
  { id: 'svc_108', title: 'ترقيم المنازل', titleEn: 'Get House Numbering', icon: 'MapPin', cat: 'admin' },
  { id: 'svc_109', title: 'ترخيص تسمية المباني', titleEn: 'Building Naming License', icon: 'Landmark', cat: 'invest' },
  { id: 'svc_127', title: 'تدريب طلاب مؤسسات التعليم العالي', titleEn: 'Training Higher Education Institution Students', icon: 'GraduationCap', cat: 'admin' },
  { id: 'svc_128', title: 'طلب توفيق ومصالحة', titleEn: 'Reconciliation and Settlement Request', icon: 'Gavel', cat: 'admin' },
  { id: 'svc_119', title: 'شهادة إتلاف مواد', titleEn: 'Material Destruction Certificate', icon: 'Trash', cat: 'health' },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Global State
  const [services, setServices] = useState<Service[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
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
          setNews(data.news || []);
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
        news,
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

  const handleExecuteMasterSeed = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const existingIds = new Set(services.map(s => s.id));
      
      const newServices: Service[] = [...services];
      const newFlows: ServiceFlow[] = [...flows];

      MASTER_SERVICES_CATALOG.forEach(master => {
        if (!existingIds.has(master.id)) {
          newServices.push({
            id: master.id,
            title: master.title,
            titleEn: master.titleEn,
            description: `خدمة رقمية من بلدية ظفار: ${master.title}`,
            descriptionEn: `Digital Service: ${master.titleEn}`,
            iconName: master.icon,
            category: master.cat,
            isActive: true,
            reqsAr: ['البطاقة الشخصية', 'السجل التجاري (إن وجد)'],
            reqsEn: ['ID Card', 'Commercial Register (if applicable)'],
            fees: '10 OMR',
            durationAr: 'فوري',
            durationEn: 'Instant',
            conditionsAr: 'سلطنة عمان',
            conditionsEn: 'Oman Citizen'
          });

          newFlows.push({
            id: master.id,
            serviceId: master.id,
            titleAr: master.title,
            titleEn: master.titleEn,
            isActive: true,
            steps: [
              {
                id: `step_${master.id}_1`,
                titleAr: 'المستندات المطلوبة',
                titleEn: 'Required Documents',
                fields: [
                  { id: `f_${master.id}_1`, type: 'upload', labelAr: 'مرفق المستند الأول', labelEn: 'Doc Attachment 1', required: true }
                ],
                actionType: 'submit'
              }
            ]
          });
        }
      });

      await updateBin({ ...db, services: newServices, serviceFlows: newFlows });
      setServices(newServices);
      setFlows(newFlows);
      toast({ title: "Master Seeding Complete" });
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed" });
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

  const navItems = [
    { id: 'overview', label: isAr ? 'الإحصائيات' : 'Overview', icon: <BarChart3 size={18}/> },
    { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Zap size={18}/> },
    { id: 'news', label: isAr ? 'الأخبار' : 'News Matrix', icon: <Newspaper size={18}/> },
    { id: 'apps', label: isAr ? 'الطلبات' : 'Applications', icon: <History size={18}/> },
    { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Layout size={18}/> },
    { id: 'menu', label: isAr ? 'الملاحة' : 'Navigation', icon: <Menu size={18}/> },
    { id: 'branding', label: isAr ? 'الهوية' : 'Identity', icon: <Palette size={18}/> },
    { id: 'carousel', label: isAr ? 'البنرات' : 'Banners', icon: <ImageIcon size={18}/> },
    { id: 'popups', label: isAr ? 'المنبثقات' : 'Popups', icon: <Bell size={18}/> },
    { id: 'surveys', label: isAr ? 'الاستطلاعات' : 'Polls', icon: <ClipboardList size={18}/> },
    { id: 'ticker', label: isAr ? 'شريط الأخبار' : 'Ticker', icon: <Megaphone size={18}/> },
    { id: 'footer', label: isAr ? 'التذييل' : 'Footer', icon: <Layers size={18}/> },
    { id: 'ai', label: isAr ? 'AI Brain' : 'AI Brain', icon: <Sparkles size={18}/> },
    { id: 'system', label: isAr ? 'النظام' : 'System', icon: <Wrench size={18}/> },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50 flex", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Side Command Center Sidebar */}
      <aside className="w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex border-r border-white/5 z-50">
         <div className="flex items-center gap-3">
           <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_25px_rgba(3,207,203,0.4)] transition-transform hover:rotate-6">
             <Settings size={24} />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter leading-none uppercase">Matrix</span>
             <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-80 mt-1">Dhofar Cmd v4.5</span>
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-1">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">{isAr ? 'إدارة المنظومة الرقمية' : 'Global Matrix Controls'}</p>
               {navItems.map(item => (
                 <Button 
                   key={item.id} 
                   variant="ghost" 
                   onClick={() => setActiveTab(item.id)}
                   className={cn(
                     "justify-start gap-4 h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all",
                     activeTab === item.id ? "bg-white/10 text-accent shadow-lg border-l-4 border-accent" : "text-slate-400 hover:bg-white/5 hover:text-white"
                   )}
                 >
                   {item.icon} {item.label}
                 </Button>
               ))}
            </nav>
         </div>

         <div className="pt-6 border-t border-white/5">
            <div className="p-5 bg-accent/5 rounded-3xl border border-accent/10 relative overflow-hidden group">
               <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
               <div className="flex items-center gap-2 mb-2 relative z-10">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-accent uppercase tracking-widest">Neural Link Active</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold leading-relaxed relative z-10">Matrix connected to Gemini 2.5 Flash. Real-time translation ready.</p>
            </div>
         </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full dm-pattern-wave-pro opacity-[0.02] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-primary tracking-tighter flex items-center gap-4">
              {isAr ? "لوحة الإدارة المركزية" : "Central Portal Admin"}
              <Badge variant="outline" className="text-[9px] rounded-lg bg-slate-50 border-slate-200">PRO MODE</Badge>
            </h1>
            <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">{isAr ? "تحكم كامل بهوية البوابة والخدمات والذكاء الاصطناعي" : "End-to-end portal orchestration"}</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <Button variant="outline" asChild className="rounded-full font-black px-8 border-slate-200 h-12 shadow-sm hover:bg-slate-50">
              <Link href="/">{isAr ? "معاينة البوابة" : "Live Preview"}</Link>
            </Button>
            <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-[0_10px_30px_rgba(3,207,203,0.3)] h-12 gap-2 transition-transform active:scale-95">
              {saving ? <Loader2 className="animate-spin" /> : <CloudUpload size={20}/>}
              {isAr ? "حفظ ومزامنة النظام" : "Sync Matrix"}
            </Button>
          </div>
        </header>

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
                 <div className="grid md:grid-cols-4 gap-6">
                    {[
                      { label: isAr ? 'الخدمات' : 'Services', val: services.length, icon: <Zap/>, color: 'bg-primary' },
                      { label: isAr ? 'الطلبات' : 'Applications', val: applications.length, icon: <History/>, color: 'bg-accent' },
                      { label: isAr ? 'الأخبار' : 'News', val: news.length, icon: <Newspaper/>, color: 'bg-slate-900' },
                      { label: isAr ? 'الصفحات' : 'Pages', val: customPages.length, icon: <Layout/>, color: 'bg-emerald-600' },
                    ].map((card, i) => (
                      <Card key={i} className={cn("rounded-[2rem] border-none shadow-xl text-white overflow-hidden relative group", card.color)}>
                         <div className="absolute top-0 right-0 size-32 dm-pattern-matrix-all opacity-10 -rotate-12 group-hover:scale-110 transition-transform" />
                         <CardContent className="p-8 space-y-1 relative z-10">
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{card.label}</p>
                            <h3 className="text-5xl font-black tracking-tighter">{card.val}</h3>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ANALYTICS_DATA}>
                          <defs>
                            <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#03CFCB" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#03CFCB" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                          <YAxis hide />
                          <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                          <Area type="monotone" dataKey="transactions" stroke="#03CFCB" fillOpacity={1} fill="url(#colorTrans)" strokeWidth={5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </Card>
              </div>
            )}

            {/* 2. SERVICES CRUD */}
            {activeTab === 'services' && (
               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                     <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <Input placeholder={isAr ? "ابحث عن خدمة..." : "Search services..."} className="pl-10 rounded-xl h-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                     </div>
                     <div className="flex gap-3">
                        <Button variant="outline" onClick={handleExecuteMasterSeed} className="rounded-full px-6 font-black border-slate-200">MASTER SEED</Button>
                        <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/servicebuild">+ {isAr ? "إضافة خدمة" : "Add Service"}</Link></Button>
                     </div>
                  </div>
                  <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-xl">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="p-6 font-black">{isAr ? "الخدمة" : "Service"}</TableHead>
                          <TableHead className="p-6 font-black">{isAr ? "الفئة" : "Category"}</TableHead>
                          <TableHead className="p-6 font-black text-center">{isAr ? "مميزة" : "Featured"}</TableHead>
                          <TableHead className="p-6 font-black">{isAr ? "إجراء" : "Action"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map(s => (
                          <TableRow key={s.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="p-6 font-bold">
                               <div className="flex items-center gap-4">
                                  <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                     {React.createElement((Icons as any)[s.iconName] || Icons.FileText, { size: 20 })}
                                  </div>
                                  <div>
                                    <p className="text-sm">{isAr ? s.title : (s.titleEn || s.title)}</p>
                                    <p className="text-[9px] text-slate-400 uppercase font-mono tracking-tighter">{s.id}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="p-6"><Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-500">{s.category}</Badge></TableCell>
                            <TableCell className="p-6 text-center">
                              <Switch checked={s.isFeatured || false} onCheckedChange={(val) => setServices(prev => prev.map(item => item.id === s.id ? {...item, isFeatured: val} : item))} className="mx-auto data-[state=checked]:bg-accent" />
                            </TableCell>
                            <TableCell className="p-6">
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
               </div>
            )}

            {/* 3. NEWS MATRIX */}
            {activeTab === 'news' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-xl font-black text-primary">{isAr ? "إدارة مصفوفة الأخبار (50%)" : "News Matrix Hub"}</h3>
                    <Button onClick={() => setNews([{ id: `n_${Date.now()}`, titleAr: 'خبر جديد', titleEn: 'New Story', contentAr: '', contentEn: '', imageUrl: '', createdAt: new Date().toISOString() }, ...news])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة خبر" : "Add News"}</Button>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    {news.map((item, idx) => (
                      <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white group">
                         <div className="h-56 bg-slate-100 relative overflow-hidden">
                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>}
                            <div className="absolute bottom-4 left-4 right-4">
                               <Input value={item.imageUrl || ''} onChange={e => { const nn = [...news]; nn[idx].imageUrl = e.target.value; setNews(nn); }} className="bg-white/90 backdrop-blur-md h-10 text-[10px] rounded-xl border-none shadow-lg" placeholder="Image URL..." />
                            </div>
                         </div>
                         <CardContent className="p-8 space-y-4">
                            <Input value={item.titleAr} onChange={e => { const nn = [...news]; nn[idx].titleAr = e.target.value; setNews(nn); }} className="font-black h-12 rounded-xl text-lg" placeholder="عنوان الخبر (AR)" />
                            <Textarea value={item.contentAr} onChange={e => { const nn = [...news]; nn[idx].contentAr = e.target.value; setNews(nn); }} className="min-h-[100px] font-bold rounded-xl text-sm" placeholder="محتوى الخبر..." />
                            <Button variant="ghost" onClick={() => setNews(news.filter(n => n.id !== item.id))} className="w-full text-red-500 font-black hover:bg-red-50 rounded-xl"><Trash2 size={16} className="ml-2"/> {isAr ? "حذف" : "Delete"}</Button>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 4. APPLICATIONS TRACKER */}
            {activeTab === 'apps' && (
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                 <CardHeader className="p-8 border-b bg-slate-900 text-white flex flex-row items-center justify-between">
                    <CardTitle className="font-black text-2xl flex items-center gap-3"><History className="text-accent" /> {isAr ? "سجل طلبات المواطنين (ثقة)" : "Citizen Ledger"}</CardTitle>
                    <Badge className="bg-accent text-slate-900 font-black px-4">{applications.length} TOTAL</Badge>
                 </CardHeader>
                 <Table>
                    <TableHeader className="bg-slate-50">
                       <TableRow>
                          <TableHead className="p-8 font-black">Ref ID</TableHead>
                          <TableHead className="p-8 font-black">Citizen</TableHead>
                          <TableHead className="p-8 font-black">Service</TableHead>
                          <TableHead className="p-8 font-black">Status</TableHead>
                          <TableHead className="p-8 font-black">Date</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {applications.map(app => (
                         <TableRow key={app.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="p-8 font-mono text-xs font-black text-primary">{app.id}</TableCell>
                            <TableCell className="p-8 font-bold">{app.citizenName}</TableCell>
                            <TableCell className="p-8 font-bold text-slate-500">{app.serviceName}</TableCell>
                            <TableCell className="p-8">
                               <Badge className={cn("rounded-full font-black px-4", app.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>{app.status.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell className="p-8 text-xs text-slate-400 font-bold">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
            )}

            {/* 5. PAGES MANAGER */}
            {activeTab === 'pages' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-xl font-black text-primary">{isAr ? "إدارة الصفحات الديناميكية" : "Page Repository"}</h3>
                    <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/pagebuild">+ {isAr ? "بناء صفحة" : "New Page"}</Link></Button>
                 </div>
                 <div className="grid md:grid-cols-3 gap-6">
                    {customPages.map(page => (
                      <Card key={page.id} className="rounded-[2rem] border-none shadow-xl bg-white group hover:-translate-y-2 transition-all">
                         <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Layout size={24}/></div>
                               <Badge variant="outline" className="rounded-lg text-[9px] font-black">/p/{page.slug}</Badge>
                            </div>
                            <h4 className="text-xl font-black text-slate-800">{isAr ? page.titleAr : page.titleEn}</h4>
                            <div className="flex gap-2">
                               <Button asChild variant="outline" className="flex-1 rounded-xl h-11 font-black"><Link href={`/pagebuild?id=${page.id}`}>Edit</Link></Button>
                               <Button variant="ghost" onClick={() => setCustomPages(customPages.filter(p => p.id !== page.id))} className="size-11 rounded-xl text-red-500 hover:bg-red-50"><Trash2 size={16}/></Button>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 6. NAVIGATION (MENU) */}
            {activeTab === 'menu' && (
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                 <CardHeader className="p-8 border-b bg-slate-900 text-white flex justify-between items-center flex-row">
                    <CardTitle className="font-black text-2xl flex items-center gap-3"><Menu className="text-accent" /> {isAr ? "إدارة القائمة الرئيسية" : "Navigation Hub"}</CardTitle>
                    <Button onClick={() => setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '/', order: menuItems.length }])} className="bg-accent text-slate-900 font-black">+ {isAr ? "إضافة رابط" : "Add Link"}</Button>
                 </CardHeader>
                 <CardContent className="p-8 space-y-4">
                    {menuItems.map((item, idx) => (
                       <div key={item.id} className="flex gap-4 items-center bg-slate-50 p-5 rounded-[1.5rem] border-2 border-transparent hover:border-primary/20 transition-all group">
                          <div className="size-8 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-slate-400">{idx+1}</div>
                          <Input value={item.labelAr} onChange={e => { const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm); }} className="flex-1 font-black bg-white rounded-xl h-11" placeholder="Label AR" />
                          <Input value={item.link} onChange={e => { const nm = [...menuItems]; nm[idx].link = e.target.value; setMenuItems(nm); }} className="flex-1 font-mono text-xs bg-white rounded-xl h-11" placeholder="/url-path" />
                          <Button variant="ghost" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="text-red-400 size-11 rounded-xl"><Trash2 size={18}/></Button>
                       </div>
                    ))}
                 </CardContent>
              </Card>
            )}

            {/* 7. BRANDING & SITE CONFIG */}
            {activeTab === 'branding' && (
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6">
                    <h3 className="text-xl font-black text-primary flex items-center gap-3"><Globe size={20}/> {isAr ? "إعدادات الواجهة" : "Portal Messaging"}</h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Hero Main Title (AR)</Label>
                          <Input value={siteConfig?.heroTitle} onChange={e => setSiteConfig({...siteConfig!, heroTitle: e.target.value})} className="h-12 rounded-xl font-black text-lg" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Hero Subtitle (AR)</Label>
                          <Textarea value={siteConfig?.heroSubtitle} onChange={e => setSiteConfig({...siteConfig!, heroSubtitle: e.target.value})} className="min-h-[100px] rounded-xl font-bold text-sm" />
                       </div>
                    </div>
                 </Card>
                 
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary p-8 text-white space-y-8">
                    <h3 className="text-xl font-black text-accent flex items-center gap-3"><Phone size={20}/> {isAr ? "معلومات التواصل" : "Contact Hub"}</h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase opacity-60">Hotline Number</Label>
                          <Input value={siteConfig?.contactPhone} onChange={e => setSiteConfig({...siteConfig!, contactPhone: e.target.value})} className="h-12 rounded-xl font-black bg-white/10 border-none" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase opacity-60">Official Email</Label>
                          <Input value={siteConfig?.contactEmail} onChange={e => setSiteConfig({...siteConfig!, contactEmail: e.target.value})} className="h-12 rounded-xl font-bold bg-white/10 border-none" />
                       </div>
                    </div>
                 </Card>
              </div>
            )}

            {/* 8. CAROUSEL (BANNERS) */}
            {activeTab === 'carousel' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-xl font-black text-primary">{isAr ? "إدارة البنرات العريضة (100%)" : "Banner Matrix"}</h3>
                    <Button onClick={() => setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: 'بنر جديد', titleEn: 'New Banner', subtitleAr: '', subtitleEn: '', imageUrl: '' }])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة بنر" : "Add Banner"}</Button>
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    {carouselItems.map((item, idx) => (
                      <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                         <div className="h-48 bg-slate-100 relative group">
                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>}
                            <Input value={item.imageUrl || ''} onChange={e => { const ni = [...carouselItems]; ni[idx].imageUrl = e.target.value; setCarouselItems(ni); }} className="absolute bottom-4 left-4 right-4 bg-white/90 h-10 text-[10px] rounded-xl border-none shadow-lg" placeholder="Banner Image URL..." />
                         </div>
                         <CardContent className="p-8 flex flex-col gap-4">
                            <Input placeholder="عنوان البنر (AR)" value={item.titleAr} onChange={e => { const ni = [...carouselItems]; ni[idx].titleAr = e.target.value; setCarouselItems(ni); }} className="font-black h-12 rounded-xl" />
                            <Button variant="ghost" onClick={() => setCarouselItems(carouselItems.filter(ci => ci.id !== item.id))} className="text-red-500 font-bold hover:bg-red-50 rounded-xl h-11"><Trash2 size={16} className="ml-2"/> {isAr ? "حذف" : "Remove"}</Button>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 9. POPUPS MANAGER */}
            {activeTab === 'popups' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-xl font-black text-primary">{isAr ? "نظام الإعلانات المنبثقة" : "Popup Overlay System"}</h3>
                    <Button onClick={() => setPopups([{ id: `p_${Date.now()}`, type: 'text', titleAr: 'تنبيه جديد', titleEn: 'New Alert', contentAr: '', contentEn: '', isActive: true, displayDelay: 2 }, ...popups])} className="dm-gradient-primary rounded-full px-8 font-black">+ {isAr ? "إضافة منبثقة" : "Add Popup"}</Button>
                 </div>
                 <div className="bg-white border rounded-[2.5rem] shadow-xl p-10 space-y-6">
                    {popups.map((pop, idx) => (
                      <div key={pop.id} className="p-8 border-2 border-slate-100 rounded-[2rem] bg-slate-50/50 flex gap-8 items-center group hover:border-primary/20 transition-all">
                         <div className="flex-1 space-y-4">
                            <div className="flex gap-4">
                               <Select value={pop.type} onValueChange={v => { const np = [...popups]; np[idx].type = v as any; setPopups(np); }}>
                                  <SelectTrigger className="flex-1 h-11 rounded-xl font-bold bg-white"><SelectValue/></SelectTrigger>
                                  <SelectContent className="rounded-xl"><SelectItem value="text">Text Only</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
                               </Select>
                               <Switch checked={pop.isActive} onCheckedChange={v => { const np = [...popups]; np[idx].isActive = v; setPopups(np); }} className="data-[state=checked]:bg-emerald-500" />
                            </div>
                            <Input value={pop.titleAr} onChange={e => { const np = [...popups]; np[idx].titleAr = e.target.value; setPopups(np); }} className="h-11 rounded-xl font-black bg-white" placeholder="Title (AR)" />
                         </div>
                         <Button variant="ghost" onClick={() => setPopups(popups.filter(p => p.id !== pop.id))} className="text-red-400 size-12 rounded-xl"><Trash2 size={20}/></Button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 10. SURVEYS (POLLS) */}
            {activeTab === 'surveys' && (
              <div className="space-y-8">
                 <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-xl font-black text-primary">{isAr ? "منصة استطلاع الرأي العام" : "Poll Matrix"}</h3>
                    <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/surveybuild">+ {isAr ? "بناء استبيان" : "Create Poll"}</Link></Button>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    {surveys.map(sv => (
                      <Card key={sv.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group">
                         <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary"><ClipboardList size={24}/></div>
                               <Switch checked={sv.isActive} onCheckedChange={v => setSurveys(surveys.map(s => s.id === sv.id ? {...s, isActive: v} : s))} className="data-[state=checked]:bg-accent" />
                            </div>
                            <h4 className="text-xl font-black text-slate-800">{isAr ? sv.titleAr : sv.titleEn}</h4>
                            <div className="flex gap-2">
                               <Button variant="outline" asChild className="flex-1 rounded-xl h-11 font-black"><Link href={`/surveybuild?id=${sv.id}`}>Edit Questions</Link></Button>
                               <Button variant="ghost" onClick={() => setSurveys(surveys.filter(s => s.id !== sv.id))} className="size-11 rounded-xl text-red-500 hover:bg-red-50"><Trash2 size={16}/></Button>
                            </div>
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
            )}

            {/* 11. NEWS TICKER */}
            {activeTab === 'ticker' && (
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                 <CardHeader className="p-8 border-b bg-primary text-white">
                    <CardTitle className="font-black text-2xl flex items-center gap-3"><Megaphone className="text-white" /> {isAr ? "شريط الأخبار العاجلة" : "Marquee Broadcast"}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-12 space-y-6 text-center">
                    <Label className="text-sm font-black text-slate-400 uppercase tracking-widest">{isAr ? "نص الشريط المتحرك" : "Marquee Display Text"}</Label>
                    <Textarea value={tickerText} onChange={e => setTickerText(e.target.value)} className="min-h-[150px] rounded-[2rem] font-black text-xl p-8 bg-slate-50 border-none shadow-inner" placeholder="..." />
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 w-fit mx-auto px-6 py-2 rounded-full">
                       <div className="size-2 bg-emerald-500 rounded-full animate-pulse" /> {isAr ? "البث المباشر مفعل" : "Real-time Sync Enabled"}
                    </div>
                 </CardContent>
              </Card>
            )}

            {/* 12. FOOTER MANAGER */}
            {activeTab === 'footer' && (
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-10">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-primary flex items-center gap-3"><Layers size={24}/> {isAr ? "روابط التذييل (Footer)" : "Footer Matrix"}</h3>
                    <Button onClick={() => setSiteConfig({...siteConfig!, footerLinks: [...(siteConfig?.footerLinks || []), { id: `fl_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '#', category: 'legal' }]})} className="dm-gradient-primary rounded-full px-8 font-black h-11">+ {isAr ? "إضافة رابط" : "Add Link"}</Button>
                 </div>
                 <div className="grid md:grid-cols-3 gap-8">
                    {['legal', 'services', 'important'].map(cat => (
                       <div key={cat} className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{cat.toUpperCase()} Links</h4>
                          <div className="space-y-3">
                             {siteConfig?.footerLinks?.filter(l => l.category === cat).map((link, lIdx) => (
                                <div key={link.id} className="p-4 border rounded-2xl bg-slate-50 flex flex-col gap-2 relative group">
                                   <Input value={link.labelAr || ''} onChange={e => {
                                      const nfl = siteConfig?.footerLinks?.map(l => l.id === link.id ? {...l, labelAr: e.target.value} : l);
                                      setSiteConfig(s => s ? {...s, footerLinks: nfl} : null);
                                   }} className="h-9 font-bold bg-white rounded-lg" />
                                   <Input value={link.link || ''} onChange={e => {
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
              </Card>
            )}

            {/* 13. SYSTEM & AI BRAIN */}
            {activeTab === 'ai' && (
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-accent">
                    <CardHeader className="p-10 border-b bg-slate-950 text-white relative overflow-hidden">
                       <div className="relative z-10">
                          <CardTitle className="text-3xl font-black flex items-center gap-3 text-accent"><Sparkles /> {isAr ? "مركز معالجة الذكاء الاصطناعي" : "AI Cognitive Hub"}</CardTitle>
                          <CardDescription className="text-slate-400 font-bold mt-2">{isAr ? "إدارة وتخصيص إضافات الذكاء الاصطناعي المدمجة" : "Orchestrate Genkit AI Flows"}</CardDescription>
                       </div>
                       <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
                    </CardHeader>
                    <CardContent className="p-10 space-y-6">
                       {[
                          { id: 'tts', label: isAr ? 'تحويل النص إلى صوت (TTS)' : 'Text-to-Speech', icon: <Volume2/> },
                          { id: 'trans', label: isAr ? 'محرك الترجمة العصبية' : 'Neural Translation', icon: <Globe/> },
                          { id: 'sl', label: isAr ? 'مساعد لغة الإشارة' : 'Sign Language AI', icon: <Video/> },
                       ].map(p => (
                          <div key={p.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:border-accent transition-all group">
                             <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-slate-900 transition-colors">{p.icon}</div>
                                <span className="font-bold text-sm">{p.label}</span>
                             </div>
                             <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                          </div>
                       ))}
                    </CardContent>
                 </Card>
                 
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Wrench size={24}/> {isAr ? "الصيانة الفنية" : "System Tools"}</h3>
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                          <h4 className="font-black flex items-center gap-2"><Database size={18} className="text-primary"/> {isAr ? "بذر البيانات (Master Seed)" : "Database Seeding"}</h4>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">{isAr ? "إعادة تعيين كافة الخدمات الـ 80+ بمسمياتها الأصلية واشتراطاتها." : "Restore all 80+ master services with original configuration."}</p>
                          <Button onClick={handleExecuteMasterSeed} className="w-full h-11 rounded-xl dm-gradient-primary font-black shadow-lg">START MASTER SEED</Button>
                       </div>
                       <div className="p-6 bg-red-50 rounded-[2rem] border-2 border-red-100 space-y-4">
                          <h4 className="font-black flex items-center gap-2 text-red-600"><ShieldAlert size={18}/> {isAr ? "منطقة الخطر" : "Danger Zone"}</h4>
                          <Button variant="ghost" onClick={() => setApplications([])} className="w-full h-11 rounded-xl font-black text-red-600 border border-red-200 hover:bg-red-100">PURGE ALL APPLICATIONS</Button>
                       </div>
                    </div>
                 </Card>
              </div>
            )}

            {/* DEFAULT TAB CASE (SYSTEM) */}
            {activeTab === 'system' && (
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="rounded-[3rem] border-none shadow-xl bg-slate-950 text-white p-10 space-y-10 relative overflow-hidden">
                    <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                       <h3 className="text-2xl font-black text-accent flex items-center gap-3"><ShieldAlert size={24}/> {isAr ? "وضع الصيانة" : "Security & Maintenance"}</h3>
                       <Switch checked={siteConfig?.isMaintenanceMode} onCheckedChange={v => setSiteConfig({...siteConfig!, isMaintenanceMode: v})} className="data-[state=checked]:bg-red-500" />
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 relative z-10">
                       <div className="flex items-center justify-between">
                          <span className="font-black text-xs uppercase tracking-widest text-white/60">{isAr ? "حالة النظام" : "Maintenance Status"}</span>
                          <Badge className={cn("rounded-full font-black px-4", siteConfig?.isMaintenanceMode ? "bg-red-500 animate-pulse" : "bg-emerald-500")}>{siteConfig?.isMaintenanceMode ? 'MAINTENANCE' : 'ONLINE'}</Badge>
                       </div>
                       <p className="text-xs text-white/40 font-medium leading-relaxed italic">{isAr ? "تفعيل هذا الخيار سيغلق كافة الخدمات الرقمية وسيظهر رسالة اعتذار للمواطنين." : "Enabling this will shut down all e-services and show an apology message to users."}</p>
                    </div>
                 </Card>
                 
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Lock size={24} className="text-primary"/> {isAr ? "التراخيص والتكامل" : "API Integration Hub"}</h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Accessibility Integration Key</Label>
                          <Input value="DM-ACCESS-PRO-128X-2024" readOnly className="bg-slate-50 border-none rounded-xl font-mono text-[10px] text-slate-400 h-10" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Genkit AI Connection</Label>
                          <div className="flex items-center gap-2"><div className="size-2 bg-emerald-500 rounded-full" /><span className="text-xs font-black text-emerald-600">STABLE CLOUD LINK</span></div>
                       </div>
                    </div>
                    <Button variant="outline" className="w-full h-11 rounded-xl border-slate-100 font-black text-xs uppercase tracking-widest hover:bg-slate-50">Rotate Keys</Button>
                 </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Persistence Overlay */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
           <AnimatePresence>
             {saving && (
               <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl">
                  <Loader2 className="animate-spin text-accent" size={24} />
                  <span className="font-black tracking-tight text-lg">Pushing Matrix Updates to Cloud...</span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
