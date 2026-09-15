
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Service, SiteConfig, MenuItem, CarouselItem, 
  Survey, CustomPage, PopupMessage, ServiceFlow, ServiceApplication 
} from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, Loader2, 
  CloudUpload, Layout, Menu, 
  Database, BarChart3, Image as ImageIcon, 
  Bell, ClipboardList, Sparkles, Palette,
  Zap, FileText, Megaphone, Layers, History, 
  ShieldCheck, ExternalLink, LayoutDashboard, Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
      const t = (isAr ? s.title : (s.titleEn || s.title)).toLowerCase();
      return t.includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    });
  }, [services, searchQuery, isAr]);

  const availableRoutes = [
    { label: isAr ? 'الرئيسية' : 'Home', value: '/' },
    { label: isAr ? 'دليل الخدمات' : 'Service Catalog', value: '/catalog' },
    ...customPages.map(p => ({ label: `Page: ${p.slug}`, value: `/p/${p.slug}` }))
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50 flex", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <aside className="w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex border-r border-white/5">
         <div className="flex items-center gap-3">
           <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-xl">
             <Settings size={24} />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter">COMMAND</span>
             <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-80">Portal Matrix</span>
           </div>
         </div>
         
         <nav className="flex-1 space-y-1">
            {[
              { id: 'overview', label: isAr ? 'الرئيسية' : 'Overview', icon: <BarChart3 size={18}/> },
              { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Zap size={18}/> },
              { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Layout size={18}/> },
              { id: 'navigation', label: isAr ? 'الملاحة' : 'Navigation', icon: <Menu size={18}/> },
              { id: 'apps', label: isAr ? 'الطلبات' : 'Applications', icon: <History size={18}/> }
            ].map(item => (
              <Button key={item.id} variant="ghost" className="w-full justify-start gap-4 h-12 hover:bg-white/5 rounded-xl font-bold text-slate-400 hover:text-white">
                {item.icon} {item.label}
              </Button>
            ))}
         </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-primary flex items-center gap-3">Central Admin</h1>
            <p className="text-slate-400 font-bold mt-1">Orchestrate your portal experience</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="rounded-full font-black px-8">
              <Link href="/">Live Site</Link>
            </Button>
            <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-xl h-12">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
              {isAr ? "حفظ ومزامنة" : "Sync Global System"}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border mb-10 flex h-auto gap-1 p-1 rounded-2xl shadow-sm">
            <TabsTrigger value="services" className="font-black gap-2"><Database size={14}/> Services</TabsTrigger>
            <TabsTrigger value="pages" className="font-black gap-2"><Layout size={14}/> Pages</TabsTrigger>
            <TabsTrigger value="navigation" className="font-black gap-2"><Menu size={14}/> Navigation</TabsTrigger>
            <TabsTrigger value="ticker" className="font-black gap-2"><Megaphone size={14}/> Ticker</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                   <div>
                      <CardTitle className="font-black text-2xl">Digital Services Matrix</CardTitle>
                      <CardDescription>Manage municipal workflows and integration points</CardDescription>
                   </div>
                   <Button asChild className="dm-gradient-primary rounded-full font-black">
                      <Link href="/servicebuild">+ Create Service</Link>
                   </Button>
                </CardHeader>
                <CardContent>
                   <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <Input placeholder="Search services..." className="pl-10 h-12 rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredServices.map(svc => (
                        <Card key={svc.id} className="rounded-3xl border-slate-100 hover:shadow-2xl transition-all group overflow-hidden">
                           <div className="p-6 flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-slate-900 transition-colors">
                                    <Zap size={24}/>
                                 </div>
                                 <div>
                                    <h4 className="font-black text-sm">{isAr ? svc.title : (svc.titleEn || svc.title)}</h4>
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{svc.category}</Badge>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild><Link href={`/servicebuild?id=${svc.id}`}><Edit2 size={14}/></Link></Button>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400" onClick={() => setServices(services.filter(s => s.id !== svc.id))}><Trash2 size={14}/></Button>
                              </div>
                           </div>
                        </Card>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b p-8">
                   <CardTitle className="font-black text-2xl flex items-center gap-3"><Menu className="text-primary" /> Navigation Nodes</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <AnimatePresence>
                    {menuItems.map((item, idx) => (
                      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.9}} key={item.id} className="flex flex-col md:flex-row gap-4 p-5 border-2 border-slate-100 rounded-2xl bg-white items-center group">
                        <Input value={item.labelAr || ''} onChange={e => {
                           const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm);
                        }} className="font-bold flex-1 h-12 rounded-xl" placeholder="Label AR" />
                        
                        <Select value={item.link || '/'} onValueChange={v => {
                           const nm = [...menuItems]; nm[idx].link = v; setMenuItems(nm);
                        }}>
                           <SelectTrigger className="flex-1 h-12 rounded-xl font-bold bg-slate-50">
                              <SelectValue placeholder="Select Route..." />
                           </SelectTrigger>
                           <SelectContent>
                              {availableRoutes.map(route => (
                                <SelectItem key={route.value} value={route.value}>{route.label}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="h-12 w-12 rounded-xl text-red-400"><Trash2 size={18}/></Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button onClick={() => setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: 'رابط جديد', labelEn: 'New Link', link: '/', order: menuItems.length }])} variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2">+ Add Navigation Link</Button>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
