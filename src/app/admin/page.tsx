
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const removeFooterLink = (id: string) => {
    const newLinks = (siteConfig.footerLinks || []).filter(l => l.id !== id);
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
            <TabsTrigger value="builders" className="font-black"><Sparkles className="size-4 ml-2" /> {isAr ? "المصممات" : "Builders"}</TabsTrigger>
            <TabsTrigger value="site" className="font-black"><PenTool className="size-4 ml-2" /> {isAr ? "الموقع" : "Site"}</TabsTrigger>
            <TabsTrigger value="footer" className="font-black"><LinkIcon className="size-4 ml-2" /> {isAr ? "التذييل" : "Footer"}</TabsTrigger>
            <TabsTrigger value="applications" className="font-black"><FileCheck className="size-4 ml-2" /> {isAr ? "الطلبات" : "Apps"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "دليل الخدمات" : "Service Catalog"}</h3>
                <Button size="sm" asChild className="rounded-full bg-accent text-accent-foreground font-black">
                  <Link href="/servicebuild"><Plus size={14} className="ml-2"/> {isAr ? "صناعة خدمة" : "Build Service"}</Link>
                </Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead>{isAr ? "مميزة" : "Featured"}</TableHead>
                      <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-primary">
                            <FileText size={16} />
                          </div>
                          {isAr ? s.title : (s.titleEn || s.title)}
                        </TableCell>
                        <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => { const ns = [...services]; ns[idx].isFeatured = !ns[idx].isFeatured; setServices(ns); }}>
                            <Star className={cn("size-4", s.isFeatured ? "fill-accent text-accent" : "text-slate-200")} />
                          </Button>
                        </TableCell>
                        <TableCell className="flex gap-2">
                           <Button variant="ghost" size="icon" asChild className="text-primary">
                             <Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link>
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400"><Trash2 size={16}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>

          <TabsContent value="builders" className="space-y-8">
             <div className="grid md:grid-cols-3 gap-6">
                <Card className="rounded-brand shadow-md hover:shadow-xl transition-all cursor-pointer border-none bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
                  <Link href="/pagebuild">
                    <CardContent className="p-10 text-center space-y-4">
                       <Layout size={48} className="mx-auto" />
                       <h4 className="text-xl font-black">{isAr ? "باني الصفحات" : "Page Builder"}</h4>
                       <p className="text-xs text-white/60 font-medium">{isAr ? "إنشاء وتعديل محتوى الصفحات الفرعية" : "Create and edit sub-page content"}</p>
                    </CardContent>
                  </Link>
                </Card>
                <Card className="rounded-brand shadow-md hover:shadow-xl transition-all cursor-pointer border-none bg-gradient-to-br from-accent to-accent/80 text-slate-900 overflow-hidden">
                  <Link href="/servicebuild">
                    <CardContent className="p-10 text-center space-y-4">
                       <Sparkles size={48} className="mx-auto" />
                       <h4 className="text-xl font-black">{isAr ? "محرك الخدمات" : "Service Engine"}</h4>
                       <p className="text-xs text-slate-900/60 font-medium">{isAr ? "تصميم خطوات العمل والنماذج" : "Design workflow steps and forms"}</p>
                    </CardContent>
                  </Link>
                </Card>
                <Card className="rounded-brand shadow-md hover:shadow-xl transition-all cursor-pointer border-none bg-gradient-to-br from-secondary to-secondary/80 text-white overflow-hidden">
                  <Link href="/surveybuild">
                    <CardContent className="p-10 text-center space-y-4">
                       <ClipboardList size={48} className="mx-auto" />
                       <h4 className="text-xl font-black">{isAr ? "باني الاستطلاعات" : "Survey Builder"}</h4>
                       <p className="text-xs text-white/60 font-medium">{isAr ? "صناعة الاستبيانات واستطلاعات الرأي" : "Build questionnaires and polls"}</p>
                    </CardContent>
                  </Link>
                </Card>
             </div>

             <div className="grid lg:grid-cols-2 gap-8">
                <Card className="rounded-brand border-none shadow-sm overflow-hidden">
                   <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-black">{isAr ? "الصفحات المنشأة" : "Custom Pages"}</CardTitle></CardHeader>
                   <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {customPages.map(page => (
                            <TableRow key={page.id}>
                              <TableCell className="font-bold">{isAr ? page.titleAr : page.titleEn}</TableCell>
                              <TableCell className="text-xs text-slate-400 font-mono">/p/{page.slug}</TableCell>
                              <TableCell className="text-right flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" asChild className="text-slate-400"><Link href={`/p/${page.slug}`}><Eye size={14}/></Link></Button>
                                <Button variant="ghost" size="icon" asChild><Link href={`/pagebuild?id=${page.id}`}><Edit2 size={14}/></Link></Button>
                                <Button variant="ghost" size="icon" onClick={() => setCustomPages(customPages.filter(p => p.id !== page.id))} className="text-red-400"><Trash2 size={14}/></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                   </CardContent>
                </Card>
                <Card className="rounded-brand border-none shadow-sm overflow-hidden">
                   <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-black">{isAr ? "الاستبيانات الفعالة" : "Active Surveys"}</CardTitle></CardHeader>
                   <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {surveys.map((survey, sIdx) => (
                            <TableRow key={survey.id}>
                              <TableCell className="font-bold">{isAr ? survey.titleAr : survey.titleEn}</TableCell>
                              <TableCell>
                                <Badge className={survey.isPublicPoll ? "bg-accent" : "bg-slate-100 text-slate-400"}>
                                  {isAr ? "تصويت عام" : "Public Poll"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => {
                                   const ns = [...surveys];
                                   const current = ns[sIdx].isPublicPoll;
                                   ns.forEach(s => s.isPublicPoll = false);
                                   ns[sIdx].isPublicPoll = !current;
                                   setSurveys(ns);
                                }}><Star size={14} className={survey.isPublicPoll ? "fill-accent text-accent" : ""}/></Button>
                                <Button variant="ghost" size="icon" asChild><Link href={`/surveybuild?id=${survey.id}`}><Edit2 size={14}/></Link></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="site" className="space-y-6">
            <Card className="rounded-brand shadow-md">
              <CardContent className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h3 className="font-black flex items-center gap-2 text-primary"><PenTool size={20}/> {isAr ? "نصوص البطل" : "Hero Text"}</h3>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "العنوان الرئيسي" : "Hero Title"}</label>
                       <Input placeholder="Title" value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "العنوان الفرعي" : "Hero Subtitle"}</label>
                       <Input placeholder="Subtitle" value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-black flex items-center gap-2 text-primary"><TrendingUp size={20}/> {isAr ? "أرقام المنصة" : "Platform Stats"}</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "المعاملات" : "Transactions"}</label>
                        <Input type="number" value={siteConfig.stats?.transactions} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, transactions: parseInt(e.target.value)}})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "التراخيص" : "Permits"}</label>
                        <Input type="number" value={siteConfig.stats?.permits} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, permits: parseInt(e.target.value)}})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "العقود" : "Contracts"}</label>
                        <Input type="number" value={siteConfig.stats?.contracts} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, contracts: parseInt(e.target.value)}})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "التذاكر" : "Tickets"}</label>
                        <Input type="number" value={siteConfig.stats?.tickets} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, tickets: parseInt(e.target.value)}})} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة روابط التذييل" : "Footer Links Management"}</h3>
                <Button size="sm" onClick={addFooterLink} className="rounded-full dm-gradient-primary font-black">
                  <Plus size={14} className="ml-2"/> {isAr ? "إضافة رابط" : "Add Link"}
                </Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(siteConfig.footerLinks || []).map((link, idx) => (
                  <Card key={link.id} className="rounded-xl border-2 hover:border-accent transition-colors overflow-hidden">
                    <CardHeader className="bg-slate-50 py-3 px-4 flex flex-row items-center justify-between border-b">
                      <Badge variant="outline">{link.category}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeFooterLink(link.id)} className="text-red-400 h-8 w-8"><Trash2 size={14}/></Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                       <Input placeholder="Label AR" value={link.labelAr} onChange={e => {
                         const n = [...siteConfig.footerLinks!]; n[idx].labelAr = e.target.value; setSiteConfig({...siteConfig, footerLinks: n});
                       }} />
                       <Input placeholder="Label EN" value={link.labelEn} onChange={e => {
                         const n = [...siteConfig.footerLinks!]; n[idx].labelEn = e.target.value; setSiteConfig({...siteConfig, footerLinks: n});
                       }} />
                       <Input placeholder="URL (e.g. /terms or /p/slug)" value={link.link} onChange={e => {
                         const n = [...siteConfig.footerLinks!]; n[idx].link = e.target.value; setSiteConfig({...siteConfig, footerLinks: n});
                       }} className="font-mono text-xs text-primary" />
                       <Select value={link.category} onValueChange={v => {
                         const n = [...siteConfig.footerLinks!]; n[idx].category = v as any; setSiteConfig({...siteConfig, footerLinks: n});
                       }}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="legal">{isAr ? "قانوني" : "Legal"}</SelectItem>
                           <SelectItem value="services">{isAr ? "خدمات" : "Services"}</SelectItem>
                           <SelectItem value="important">{isAr ? "هامة" : "Important"}</SelectItem>
                         </SelectContent>
                       </Select>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
