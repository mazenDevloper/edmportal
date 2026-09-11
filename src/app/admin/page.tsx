
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Service, SiteConfig, MenuItem, CarouselItem, ServiceApplication, Survey, CustomPage } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, Search, Loader2, 
  CloudUpload, Star, Layout, Menu, Image as ImageIcon,
  BookOpen, FileCheck, Info, Sparkles, ClipboardList, PenTool, ArrowUpRight,
  TrendingUp, Accessibility, Languages, Video, LayoutDashboard, Database,
  Edit2, FileText, Eye, X, Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    heroTitle: '', heroSubtitle: '', contactPhone: '', contactEmail: '',
    categories: ['building', 'health', 'invest', 'tech', 'elec'], isMaintenanceMode: false,
    stats: { transactions: 0, permits: 0, contracts: 0, tickets: 0 },
    footerLinks: []
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setApplications(data.applications || []);
          setSiteConfig(data.siteConfig || siteConfig);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      await updateBin({
        ...db,
        services, siteConfig, menuItems, carouselItems, surveys, customPages
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تمت المزامنة بنجاح" : "Synced successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: '', labelEn: '', link: '/', order: menuItems.length }]);
  };

  const addCarouselItem = () => {
    setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: 'https://picsum.photos/seed/1/1200/600' }]);
  };

  const addFooterLink = () => {
    const newLinks = [...(siteConfig.footerLinks || []), {
      id: `fl_${Date.now()}`,
      labelAr: '',
      labelEn: '',
      link: '',
      category: 'legal' as const
    }];
    setSiteConfig({ ...siteConfig, footerLinks: newLinks });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
           <div>
             <h1 className="text-3xl font-black text-primary flex items-center gap-3">
               <Settings className="h-8 w-8 text-accent" /> {isAr ? "لوحة الإدارة الشاملة" : "Portal Admin"}
             </h1>
             <p className="text-slate-400 font-bold mt-1">{isAr ? "تحكم كامل بمحتوى البوابة والخدمات" : "Full control over portal content and services"}</p>
           </div>
           <div className="flex flex-wrap gap-4">
             <Button variant="outline" asChild className="rounded-full font-black border-primary text-primary">
               <Link href="/">{isAr ? "العودة للبوابة" : "Exit to Portal"}</Link>
             </Button>
             <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-xl">
               {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
               {isAr ? "حفظ ومزامنة" : "Save & Sync"}
             </Button>
           </div>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-2 p-1 rounded-xl shadow-sm overflow-x-auto">
            <TabsTrigger value="services" className="font-black"><Layout className="size-4 ml-2" /> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="pages" className="font-black"><FileText className="size-4 ml-2" /> {isAr ? "الصفحات" : "Pages"}</TabsTrigger>
            <TabsTrigger value="menu" className="font-black"><Menu className="size-4 ml-2" /> {isAr ? "القائمة" : "Menu"}</TabsTrigger>
            <TabsTrigger value="carousel" className="font-black"><ImageIcon className="size-4 ml-2" /> {isAr ? "البنرات" : "Banner"}</TabsTrigger>
            <TabsTrigger value="site" className="font-black"><PenTool className="size-4 ml-2" /> {isAr ? "الموقع" : "Site"}</TabsTrigger>
            <TabsTrigger value="surveys" className="font-black"><ClipboardList className="size-4 ml-2" /> {isAr ? "الاستطلاعات" : "Polls"}</TabsTrigger>
            <TabsTrigger value="apps" className="font-black"><FileCheck className="size-4 ml-2" /> {isAr ? "الطلبات" : "Apps"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "دليل الخدمات" : "Service Catalog"}</h3>
                <Button size="sm" asChild className="rounded-full dm-gradient-primary font-black">
                  <Link href="/servicebuild"><Plus size={14} className="ml-2"/> {isAr ? "إضافة خدمة" : "Add Service"}</Link>
                </Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "مميزة" : "Featured"}</TableHead>
                      <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold">{isAr ? s.title : s.titleEn}</TableCell>
                        <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                        <TableCell><Badge className="bg-slate-100 text-slate-600 border-none">{s.type || 'workflow'}</Badge></TableCell>
                        <TableCell>
                           <Button variant="ghost" size="icon" onClick={() => {
                             const ns = [...services]; ns[idx].isFeatured = !ns[idx].isFeatured; setServices(ns);
                           }}>
                             <Star className={cn("size-4", s.isFeatured ? "fill-accent text-accent" : "text-slate-200")} />
                           </Button>
                        </TableCell>
                        <TableCell className="flex gap-2">
                           <Button variant="ghost" size="icon" asChild className="text-primary"><Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link></Button>
                           <Button variant="ghost" size="icon" asChild className="text-accent"><Link href={`/services/${s.id}`}><Eye size={16}/></Link></Button>
                           <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400"><Trash2 size={16}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "الصفحات المخصصة" : "Custom Pages"}</h3>
                <Button size="sm" asChild className="rounded-full dm-gradient-primary font-black">
                  <Link href="/pagebuild"><Plus size={14} className="ml-2"/> {isAr ? "إنشاء صفحة" : "New Page"}</Link>
                </Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {customPages.map(p => (
                 <Card key={p.id} className="rounded-brand border shadow-sm group hover:shadow-lg transition-all">
                   <CardHeader className="flex flex-row items-center justify-between pb-2">
                     <Badge variant="outline" className="font-mono text-[9px]">{p.slug}</Badge>
                     <div className="flex gap-1">
                       <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/pagebuild?id=${p.id}`}><Edit2 size={12}/></Link></Button>
                       <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/p/${p.slug}`}><Eye size={12}/></Link></Button>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <h4 className="font-black text-primary">{isAr ? p.titleAr : p.titleEn}</h4>
                     <p className="text-[10px] text-slate-400 font-bold mt-2">{isAr ? "آخر تعديل: " : "Last modified: "} {new Date(p.createdAt).toLocaleDateString()}</p>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "قائمة التنقل" : "Navigation Menu"}</h3>
                <Button size="sm" onClick={addMenuItem} className="rounded-full bg-accent text-accent-foreground font-black">
                  <Plus size={14} className="ml-2"/> {isAr ? "إضافة عنصر" : "Add Item"}
                </Button>
             </div>
             <div className="bg-white border rounded-[2rem] p-6 space-y-4">
                {menuItems.map((item, idx) => (
                  <div key={item.id} className="grid md:grid-cols-4 gap-4 items-end border-b pb-4 last:border-b-0">
                    <Input placeholder="Label AR" value={item.labelAr} onChange={e => { const n = [...menuItems]; n[idx].labelAr = e.target.value; setMenuItems(n); }} />
                    <Input placeholder="Label EN" value={item.labelEn} onChange={e => { const n = [...menuItems]; n[idx].labelEn = e.target.value; setMenuItems(n); }} />
                    <Input placeholder="Link (e.g. /p/about)" value={item.link} onChange={e => { const n = [...menuItems]; n[idx].link = e.target.value; setMenuItems(n); }} />
                    <Button variant="ghost" size="icon" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="text-red-400"><Trash2 size={16}/></Button>
                  </div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="site" className="space-y-6">
             <Card className="rounded-brand border-none shadow-xl overflow-hidden">
               <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-black">{isAr ? "إعدادات الهوية والتواصل" : "Branding & Contact"}</CardTitle></CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-black text-primary flex items-center gap-2 border-b pb-2"><PenTool size={16}/> {isAr ? "نصوص البطل" : "Hero Content"}</h4>
                      <Input placeholder="Hero Title" value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} />
                      <Input placeholder="Hero Subtitle" value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-primary flex items-center gap-2 border-b pb-2"><TrendingUp size={16}/> {isAr ? "الإحصائيات" : "Platform Stats"}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Input type="number" placeholder="Trans" value={siteConfig.stats?.transactions} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, transactions: parseInt(e.target.value)}})} />
                        <Input type="number" placeholder="Permits" value={siteConfig.stats?.permits} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, permits: parseInt(e.target.value)}})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-primary flex items-center gap-2"><LinkIcon size={16}/> {isAr ? "روابط التذييل" : "Footer Links"}</h4>
                      <Button size="xs" onClick={addFooterLink} className="rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200">{isAr ? "+ إضافة" : "+ Add"}</Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      {(siteConfig.footerLinks || []).map((link, idx) => (
                        <div key={link.id} className="p-4 border rounded-xl space-y-2 relative group">
                          <Button variant="ghost" size="icon" onClick={() => {
                            const n = siteConfig.footerLinks!.filter(l => l.id !== link.id); setSiteConfig({...siteConfig, footerLinks: n});
                          }} className="absolute -top-2 -right-2 bg-white border h-6 w-6 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></Button>
                          <Input className="h-8 text-xs font-bold" placeholder="Label AR" value={link.labelAr} onChange={e => { const n = [...siteConfig.footerLinks!]; n[idx].labelAr = e.target.value; setSiteConfig({...siteConfig, footerLinks: n}); }} />
                          <Input className="h-8 text-[10px] font-mono" placeholder="Link" value={link.link} onChange={e => { const n = [...siteConfig.footerLinks!]; n[idx].link = e.target.value; setSiteConfig({...siteConfig, footerLinks: n}); }} />
                        </div>
                      ))}
                    </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>
          
          <TabsContent value="surveys" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "الاستطلاعات العامة" : "Public Surveys"}</h3>
                <Button size="sm" asChild className="rounded-full dm-gradient-primary font-black">
                  <Link href="/surveybuild"><Plus size={14} className="ml-2"/> {isAr ? "إنشاء استبيان" : "Build Survey"}</Link>
                </Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>{isAr ? "الاستبيان" : "Survey"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "استطلاع عام" : "Public Poll"}</TableHead>
                      <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveys.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold">{isAr ? s.titleAr : s.titleEn}</TableCell>
                        <TableCell><Badge variant={s.isActive ? 'default' : 'outline'}>{s.isActive ? 'Active' : 'Draft'}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const ns = surveys.map((srv, i) => ({ ...srv, isPublicPoll: i === idx })); setSurveys(ns);
                          }}>
                            <Star className={cn("size-4", s.isPublicPoll ? "fill-accent text-accent" : "text-slate-200")} />
                          </Button>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="ghost" size="icon" asChild><Link href={`/surveybuild?id=${s.id}`}><Edit2 size={16}/></Link></Button>
                          <Button variant="ghost" size="icon" onClick={() => setSurveys(surveys.filter(qi => qi.id !== s.id))} className="text-red-400"><Trash2 size={16}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
