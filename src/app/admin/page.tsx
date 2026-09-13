
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
  Zap, GraduationCap, Truck, FileText,
  Search, Globe, Volume2, Video, MousePointer2,
  ChevronRight, ArrowRightLeft, Map
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Analytics Mock Data
const ANALYTICS_DATA = [
  { name: 'يناير', transactions: 400, users: 240 },
  { name: 'فبراير', transactions: 300, users: 139 },
  { name: 'مارس', transactions: 200, users: 980 },
  { name: 'أبريل', transactions: 278, users: 390 },
  { name: 'مايو', transactions: 189, users: 480 },
  { name: 'يونيو', transactions: 239, users: 380 },
  { name: 'يوليو', transactions: 349, users: 430 },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  // Master Data Definitions (Subset for Seeding)
  const MASTER_SERVICES_DATA = [
    { id: "svc_100", titleAr: "ترخيص إقامة عرض ترويجي للسيارات", titleEn: "Get a Permit for Organizing a Promotional Car Event", icon: "Car", cat: "invest" },
    { id: "svc_101", titleAr: "تصديق مسارات تمديدات خدمات الكهرباء", titleEn: "Approval for Electrical Service Installations", icon: "Zap", cat: "elec" },
    { id: "svc_127", titleAr: "تدريب طلاب مؤسسات التعليم العالي", titleEn: "Training Higher Education Institution Students", icon: "GraduationCap", cat: "admin" },
    { id: "svc_128", titleAr: "طلب توفيق ومصالحة", titleEn: "Reconciliation and Settlement Request", icon: "Handshake", cat: "admin" }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = (data.services || []).filter(Boolean);
          const fetchedFlows = (data.serviceFlows || []).filter(Boolean);
          
          // Reconciliation logic to ensure all flows appear in the service list
          const allServiceIds = Array.from(new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ])).filter(Boolean);

          const reconciled = allServiceIds.map(id => {
            const existing = fetchedServices.find((s: any) => s.id === id);
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            const master = MASTER_SERVICES_DATA.find(m => m.id === id);
            
            return {
              id,
              title: existing?.title || flow?.titleAr || master?.titleAr || 'خدمة جديدة',
              titleEn: existing?.titleEn || flow?.titleEn || master?.titleEn || '',
              description: existing?.description || (isAr ? 'خدمة بلدية رقمية.' : 'Digital municipal service.'),
              category: existing?.category || master?.cat || 'elec',
              iconName: existing?.iconName || master?.icon || 'FileText',
              isActive: true,
              isFeatured: existing?.isFeatured || false,
              reqsAr: existing?.reqsAr || [],
              reqsEn: existing?.reqsEn || [],
              fees: existing?.fees || '10 OMR',
              type: existing?.type || 'workflow'
            } as Service;
          });

          setServices(reconciled);
          setFlows(fetchedFlows);
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
  }, [isAr]);

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      await updateBin({
        ...db,
        services: services.filter(Boolean),
        serviceFlows: flows.filter(Boolean),
        siteConfig, 
        menuItems: (menuItems || []).filter(Boolean), 
        carouselItems: (carouselItems || []).filter(Boolean), 
        surveys: (surveys || []).filter(Boolean), 
        customPages: (customPages || []).filter(Boolean), 
        popups: (popups || []).filter(Boolean)
      });
      toast({ title: isAr ? "تم حفظ ومزامنة كافة البيانات" : "All components synced successfully" });
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex">
        {/* Sidebar Mini Navigation */}
        <aside className="w-20 md:w-64 bg-slate-900 min-h-screen text-white p-4 sticky top-0 flex flex-col gap-6">
           <div className="flex items-center gap-3 px-2 mb-8">
             <div className="size-10 bg-accent rounded-xl flex items-center justify-center text-slate-900"><Settings size={24} /></div>
             <span className="hidden md:block font-black text-lg tracking-tighter">Command Center</span>
           </div>
           
           <nav className="flex flex-col gap-2">
              <p className="hidden md:block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Core Management</p>
              {[
                { id: 'dash', label: isAr ? 'الرئيسية' : 'Dashboard', icon: <BarChart3 size={18}/> },
                { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Layout size={18}/> },
                { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Map size={18}/> },
                { id: 'ai', label: isAr ? 'الذكاء الاصطناعي' : 'AI Brain', icon: <Sparkles size={18}/> },
              ].map(item => (
                <Button key={item.id} variant="ghost" className="justify-start gap-4 h-12 hover:bg-white/10 rounded-xl">
                  {item.icon} <span className="hidden md:block font-bold">{item.label}</span>
                </Button>
              ))}
           </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-x-hidden">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-4xl font-black text-primary flex items-center gap-3">
                {isAr ? "لوحة الإدارة الشاملة" : "Master Portal Control"}
              </h1>
              <p className="text-slate-400 font-bold mt-1">{isAr ? "تحكم كامل بهوية البوابة والخدمات والذكاء الاصطناعي" : "End-to-end portal orchestration"}</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" asChild className="rounded-full font-black px-8">
                <Link href="/">{isAr ? "معاينة البوابة" : "Live Portal"}</Link>
              </Button>
              <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-xl h-12">
                {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
                {isAr ? "حفظ ومزامنة النظام" : "Sync Global System"}
              </Button>
            </div>
          </header>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-1 p-1 rounded-2xl shadow-sm">
              <TabsTrigger value="overview" className="font-black gap-2 rounded-xl"><BarChart3 size={14}/> {isAr ? "الرئيسية" : "Overview"}</TabsTrigger>
              <TabsTrigger value="services" className="font-black gap-2 rounded-xl"><Layout size={14}/> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
              <TabsTrigger value="pages" className="font-black gap-2 rounded-xl"><Map size={14}/> {isAr ? "الصفحات" : "Pages"}</TabsTrigger>
              <TabsTrigger value="menu" className="font-black gap-2 rounded-xl"><Menu size={14}/> {isAr ? "القائمة" : "Menu"}</TabsTrigger>
              <TabsTrigger value="branding" className="font-black gap-2 rounded-xl"><Palette size={14}/> {isAr ? "الهوية" : "Branding"}</TabsTrigger>
              <TabsTrigger value="carousel" className="font-black gap-2 rounded-xl"><ImageIcon size={14}/> {isAr ? "البنرات" : "Banners"}</TabsTrigger>
              <TabsTrigger value="popups" className="font-black gap-2 rounded-xl"><Bell size={14}/> {isAr ? "المنبثقات" : "Popups"}</TabsTrigger>
              <TabsTrigger value="polls" className="font-black gap-2 rounded-xl"><ClipboardList size={14}/> {isAr ? "الاستطلاعات" : "Polls"}</TabsTrigger>
              <TabsTrigger value="ai" className="font-black gap-2 rounded-xl text-accent"><Sparkles size={14}/> {isAr ? "الذكاء الاصطناعي" : "AI Plugins"}</TabsTrigger>
              <TabsTrigger value="maintenance" className="font-black gap-2 rounded-xl"><Wrench size={14}/> {isAr ? "الصيانة" : "Maintenance"}</TabsTrigger>
            </TabsList>

            {/* 1. Overview Tab */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95">
               <div className="grid md:grid-cols-3 gap-6">
                  <Card className="rounded-3xl border-none shadow-sm bg-primary text-white overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">{isAr ? "إجمالي الخدمات" : "Total Services"}</p>
                          <h3 className="text-5xl font-black">{services.length}</h3>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl"><Zap size={24}/></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm bg-accent text-slate-900 overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">{isAr ? "الصفحات النشطة" : "Active Pages"}</p>
                          <h3 className="text-5xl font-black">{customPages.length}</h3>
                        </div>
                        <div className="p-3 bg-black/5 rounded-2xl"><Map size={24}/></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isAr ? "المعاملات المنجزة" : "Completed Tasks"}</p>
                          <h3 className="text-5xl font-black text-primary">12.5k</h3>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl text-primary"><BarChart3 size={24}/></div>
                      </div>
                    </CardContent>
                  </Card>
               </div>

               <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                 <CardHeader className="border-b bg-slate-50/50 p-8">
                   <CardTitle className="font-black flex items-center gap-3"><BarChart3 className="text-primary"/> {isAr ? "تحليل أداء البوابة" : "Portal Performance Analytics"}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={ANALYTICS_DATA}>
                         <defs>
                           <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="hsl(var(--dm-teal-dark))" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="hsl(var(--dm-teal-dark))" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                         <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                         <Area type="monotone" dataKey="transactions" stroke="hsl(var(--dm-teal-dark))" strokeWidth={4} fillOpacity={1} fill="url(#colorTrans)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </CardContent>
               </Card>
            </TabsContent>

            {/* 2. Services Tab (Modified to include Featured toggle) */}
            <TabsContent value="services" className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder={isAr ? "ابحث عن خدمة..." : "Search services..."} 
                      className="pl-10 h-11 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/servicebuild"><Plus size={16} className="ml-2"/> {isAr ? "إضافة خدمة جديدة" : "New Service"}</Link></Button>
               </div>
               <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-xl">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-black">{isAr ? "الخدمة" : "Service"}</TableHead>
                        <TableHead className="font-black">{isAr ? "الفئة" : "Category"}</TableHead>
                        <TableHead className="font-black text-center">{isAr ? "مميزة" : "Featured"}</TableHead>
                        <TableHead className="font-black">{isAr ? "الرسوم" : "Fees"}</TableHead>
                        <TableHead className="font-black">{isAr ? "إجراء" : "Action"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map(s => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold flex items-center gap-3 py-6">
                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                               {React.createElement((Icons as any)[s.iconName] || Icons.FileText, { size: 18 })}
                            </div>
                            <div>
                               <p>{isAr ? s.title : (s.titleEn || s.title)}</p>
                               <p className="text-[10px] text-slate-400 font-mono uppercase">{s.id}</p>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="rounded-lg">{s.category}</Badge></TableCell>
                          <TableCell className="text-center">
                             <Switch 
                              checked={s.isFeatured || false} 
                              onCheckedChange={(val) => setServices(prev => prev.map(item => item.id === s.id ? {...item, isFeatured: val} : item))} 
                              className="data-[state=checked]:bg-accent mx-auto"
                             />
                          </TableCell>
                          <TableCell className="font-black text-emerald-600">{s.fees}</TableCell>
                          <TableCell className="flex gap-2">
                             <Button variant="ghost" size="icon" asChild className="text-primary hover:bg-primary/5"><Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link></Button>
                             <Button variant="ghost" size="icon" asChild className="text-accent hover:bg-accent/5"><Link href={`/services/${s.id}`}><Eye size={16}/></Link></Button>
                             <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400 hover:bg-red-50"><Trash2 size={16}/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </div>
            </TabsContent>

            {/* 3. Pages Tab */}
            <TabsContent value="pages" className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-primary">{isAr ? "إدارة المحتوى الديناميكي" : "Dynamic Page Manager"}</h3>
                  <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/pagebuild"><Plus size={16} className="ml-2"/> {isAr ? "إنشاء صفحة" : "Create Page"}</Link></Button>
               </div>
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customPages.map(page => (
                    <Card key={page.id} className="rounded-3xl border-none shadow-lg overflow-hidden group">
                       <CardHeader className="bg-slate-900 text-white p-6">
                          <CardTitle className="text-lg font-black">{isAr ? page.titleAr : page.titleEn}</CardTitle>
                          <CardDescription className="text-slate-400 font-mono text-[10px]">/p/{page.slug}</CardDescription>
                       </CardHeader>
                       <CardContent className="p-6 bg-white flex justify-between items-center">
                          <Badge variant="secondary" className="font-bold">{page.components.length} {isAr ? "مكون" : "Components"}</Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="rounded-full h-8"><Link href={`/p/${page.slug}`}><Eye size={14}/></Link></Button>
                            <Button variant="outline" size="sm" asChild className="rounded-full h-8 border-primary text-primary"><Link href={`/pagebuild?id=${page.id}`}><Edit2 size={14}/></Link></Button>
                            <Button variant="ghost" size="sm" onClick={() => setCustomPages(customPages.filter(p => p.id !== page.id))} className="rounded-full h-8 text-red-500"><Trash2 size={14}/></Button>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </TabsContent>

            {/* 5. Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
               <Card className="rounded-[2rem] border-none shadow-xl bg-white">
                  <CardHeader className="p-8 border-b">
                    <CardTitle className="font-black">{isAr ? "روابط القائمة الرئيسية" : "Main Navigation Links"}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-4">
                    {menuItems.map((item, idx) => (
                      <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-2xl bg-slate-50 items-center">
                         <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-black">{idx + 1}</div>
                         <Input value={item.labelAr} onChange={e => {
                           const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm);
                         }} className="font-bold flex-1" placeholder="Label AR" />
                         <Input value={item.labelEn} onChange={e => {
                           const nm = [...menuItems]; nm[idx].labelEn = e.target.value; setMenuItems(nm);
                         }} className="flex-1" placeholder="Label EN" />
                         <Input value={item.link} onChange={e => {
                           const nm = [...menuItems]; nm[idx].link = e.target.value; setMenuItems(nm);
                         }} className="font-mono text-xs flex-1" placeholder="/link" />
                         <Button variant="ghost" size="icon" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="text-red-400"><Trash2 size={16}/></Button>
                      </div>
                    ))}
                    <Button onClick={() => setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: '', labelEn: '', link: '', order: menuItems.length }])} variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 font-black">+ {isAr ? "إضافة رابط" : "Add Link"}</Button>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* 6. Branding / Identity Tab */}
            <TabsContent value="branding" className="space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden border-t-8 border-accent">
                 <CardHeader className="p-8 border-b bg-slate-50/50">
                    <CardTitle className="font-black flex items-center gap-3"><Palette className="text-accent"/> {isAr ? "إعدادات الهوية والبوابة" : "Global Site Branding"}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h4 className="text-xs font-black text-primary uppercase tracking-widest">{isAr ? "نصوص الهيرو" : "Hero Content"}</h4>
                          <div className="space-y-2">
                             <Label>{isAr ? "عنوان الترحيب" : "Main Title"}</Label>
                             <Input value={siteConfig?.heroTitle || ''} onChange={e => setSiteConfig(s => s ? {...s, heroTitle: e.target.value} : null)} className="font-black text-xl" />
                          </div>
                          <div className="space-y-2">
                             <Label>{isAr ? "العنوان الفرعي" : "Subtitle"}</Label>
                             <Textarea value={siteConfig?.heroSubtitle || ''} onChange={e => setSiteConfig(s => s ? {...s, heroSubtitle: e.target.value} : null)} className="font-bold" />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-xs font-black text-primary uppercase tracking-widest">{isAr ? "معلومات التواصل" : "Contact Info"}</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
                                <Input value={siteConfig?.contactPhone || ''} onChange={e => setSiteConfig(s => s ? {...s, contactPhone: e.target.value} : null)} />
                             </div>
                             <div className="space-y-2">
                                <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                                <Input value={siteConfig?.contactEmail || ''} onChange={e => setSiteConfig(s => s ? {...s, contactEmail: e.target.value} : null)} />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-8 border-t">
                       <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-6">{isAr ? "إحصائيات المنصة (العدادات)" : "Platform Global Counters"}</h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {['transactions', 'permits', 'contracts', 'tickets'].map(stat => (
                            <div key={stat} className="space-y-2">
                               <Label className="capitalize">{stat}</Label>
                               <Input 
                                type="number" 
                                value={(siteConfig?.stats as any)?.[stat] || 0} 
                                onChange={e => {
                                  const newStats = { ...siteConfig?.stats, [stat]: parseInt(e.target.value) || 0 };
                                  setSiteConfig(s => s ? {...s, stats: newStats as any} : null);
                                }} 
                                className="font-black text-center h-12"
                               />
                            </div>
                          ))}
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            {/* 9. Polls Tab */}
            <TabsContent value="polls" className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-primary">{isAr ? "إدارة استطلاعات الرأي العام" : "Public Polls & Engagement"}</h3>
                  <Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/surveybuild"><Plus size={16} className="ml-2"/> {isAr ? "إنشاء استطلاع" : "New Poll"}</Link></Button>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {surveys.map(poll => (
                    <Card key={poll.id} className="rounded-3xl border-none shadow-lg bg-white overflow-hidden flex flex-col md:flex-row">
                       <div className="md:w-64 bg-slate-900 text-white p-6 flex flex-col justify-center items-center gap-2">
                          <div className="p-4 bg-white/10 rounded-2xl"><ClipboardList size={32}/></div>
                          <Badge variant={poll.isActive ? "default" : "secondary"} className={poll.isActive ? "bg-accent text-slate-900" : ""}>{poll.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "موقف" : "Inactive")}</Badge>
                       </div>
                       <CardContent className="flex-1 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                             <h4 className="text-2xl font-black text-primary mb-2">{isAr ? poll.titleAr : poll.titleEn}</h4>
                             <p className="text-slate-500 font-bold">{poll.questions.length} {isAr ? "أسئلة" : "Questions"} • {poll.responsesCount} {isAr ? "مشاركة" : "Responses"}</p>
                          </div>
                          <div className="flex gap-2">
                             <div className="flex items-center gap-2 mr-4">
                                <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "نشر كاستطلاع عام" : "Public Poll"}</Label>
                                <Switch 
                                  checked={poll.isPublicPoll || false} 
                                  onCheckedChange={val => setSurveys(prev => prev.map(p => p.id === poll.id ? {...p, isPublicPoll: val} : p))} 
                                  className="data-[state=checked]:bg-accent"
                                />
                             </div>
                             <Button variant="outline" size="icon" asChild className="rounded-xl h-12 w-12 border-primary text-primary"><Link href={`/surveybuild?id=${poll.id}`}><Edit2 size={18}/></Link></Button>
                             <Button variant="ghost" size="icon" onClick={() => setSurveys(surveys.filter(p => p.id !== poll.id))} className="rounded-xl h-12 w-12 text-red-400"><Trash2 size={18}/></Button>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </TabsContent>

            {/* 10. AI Brain Tab */}
            <TabsContent value="ai" className="space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-accent">
                 <CardHeader className="p-8 border-b bg-slate-950 text-white relative overflow-hidden">
                    <div className="relative z-10">
                       <CardTitle className="text-3xl font-black flex items-center gap-3 text-accent"><Sparkles /> {isAr ? "لوحة تحكم الذكاء الاصطناعي" : "AI Cognitive Control Panel"}</CardTitle>
                       <CardDescription className="text-slate-400 font-bold mt-2">{isAr ? "إدارة وتخصيص إضافات الذكاء الاصطناعي المدمجة بالبوابة" : "Manage and tune Genkit AI Flows & Plugins"}</CardDescription>
                    </div>
                    <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
                 </CardHeader>
                 <CardContent className="p-8 grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> {isAr ? "الحالة والتشغيل" : "Plugin Status & Toggles"}</h4>
                       {[
                         { id: 'tts', label: isAr ? 'تحويل النص إلى صوت (TTS)' : 'Text-to-Speech (TTS)', icon: <Volume2/> },
                         { id: 'translate', label: isAr ? 'الترجمة الآلية للمحتوى' : 'AI Translation Engine', icon: <Globe/> },
                         { id: 'sl', label: isAr ? 'مساعد لغة الإشارة العمانية' : 'Oman Sign Language AI', icon: <Video/> },
                         { id: 'spatial', label: isAr ? 'المساعد المكاني الذكي (3D)' : '3D Spatial Assistant', icon: <MousePointer2/> },
                       ].map(plugin => (
                         <div key={plugin.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border group hover:border-accent transition-all">
                            <div className="flex items-center gap-4">
                               <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-slate-900 transition-colors">{plugin.icon}</div>
                               <span className="font-bold text-sm">{plugin.label}</span>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                         </div>
                       ))}
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2"><Edit2 size={14}/> {isAr ? "إعدادات النماذج" : "Model Configuration"}</h4>
                       <Card className="rounded-2xl border-dashed border-2 p-6 bg-slate-50">
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "النموذج المستخدم" : "Active LLM"}</Label>
                                <Input disabled value="Gemini 2.5 Flash (Google AI)" className="bg-white font-bold" />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "نبرة الصوت الافتراضية" : "Default TTS Voice"}</Label>
                                <Input value="Algenib (Arabic/Oman Dialect Optimized)" className="bg-white" />
                             </div>
                             <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                <ShieldAlert size={20} className="text-amber-500 shrink-0" />
                                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">{isAr ? "يتم استخدام واجهة Genkit لإدارة التدفقات. تأكد من ضبط مفاتيح الـ API في ملف .env لضمان استمرارية الخدمة." : "Using Genkit for flows orchestration. Ensure GEMINI_API_KEY is configured."}</p>
                             </div>
                          </div>
                       </Card>
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            {/* 11. Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden border-t-8 border-amber-500 bg-white">
                 <CardHeader className="bg-slate-900 text-white p-8"><CardTitle className="text-sm font-black flex items-center gap-2"><Wrench size={14}/> {isAr ? "أدوات صيانة البيانات" : "System Data Maintenance"}</CardTitle></CardHeader>
                 <CardContent className="p-8 space-y-6">
                   <div className="flex items-start gap-6 p-8 bg-amber-50 rounded-[2rem] border border-amber-100">
                      <div className="p-4 bg-amber-600 text-white rounded-2xl shadow-lg"><Database size={32} /></div>
                      <div className="space-y-2 flex-1">
                         <h4 className="text-xl font-black text-primary">{isAr ? "مزامنة خدمات MASTER الشاملة (80+ خدمة)" : "Sync Complete Master Catalog"}</h4>
                         <p className="text-sm text-slate-500 font-bold">{isAr ? "سيقوم هذا الإجراء بتحديث كافة معرفات الخدمات المعتمدة بمسمياتها الإنجليزية الرسمية وأيقوناتها وتدفقاتها الافتراضية." : "This will sync the entire municipality service catalog with official English titles and icons."}</p>
                         <div className="flex gap-4 mt-6">
                           <Button onClick={() => {}} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-black px-10 h-14 rounded-full shadow-xl">
                             {saving ? <Loader2 className="animate-spin ml-2" /> : <Database className="ml-2" />}
                             {isAr ? "بدء المزامنة الكاملة" : "Start Full System Sync"}
                           </Button>
                           <Button variant="outline" className="rounded-full h-14 px-8 border-amber-200 text-amber-700 font-bold">
                             {isAr ? "تصدير نسخة احتياطية" : "Export Backup"}
                           </Button>
                         </div>
                      </div>
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
