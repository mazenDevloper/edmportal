
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem, Course, ServiceApplication, Survey, CustomPage, ServiceFlow } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, X, Search, Loader2, 
  CloudUpload, Star, Layout, Menu, Image as ImageIcon,
  BookOpen, FileCheck, Info, Sparkles, ClipboardList, PenTool, ArrowUpRight,
  Vote, TrendingUp, Accessibility, Languages, Video, LayoutDashboard, Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateAltText } from '@/ai/flows/alt-text-flow';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [altTextLoading, setAltTextLoading] = useState(false);

  // Global State
  const [services, setServices] = useState<Service[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [serviceFlows, setServiceFlows] = useState<ServiceFlow[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    heroTitle: '', heroSubtitle: '', contactPhone: '', contactEmail: '',
    categories: ['الكل'], isMaintenanceMode: false,
    stats: { transactions: 0, permits: 0, contracts: 0, tickets: 0 }
  });
  const [newsItems, setNewsItems] = useState<NewsTicker[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setCourses(data.courses || []);
          setApplications(data.applications || []);
          setSiteConfig(data.siteConfig || siteConfig);
          setNewsItems(data.newsItems || []);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setServiceFlows(data.serviceFlows || []);
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
      await updateBin({
        services, courses, applications, siteConfig, newsItems, menuItems, carouselItems, surveys, customPages, serviceFlows
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تمت المزامنة بنجاح" : "Synced successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAltTextGeneration = async (url: string, index: number, type: 'course' | 'carousel') => {
    if (!url) return;
    setAltTextLoading(true);
    try {
      const { altText } = await generateAltText({ photoDataUri: url, language: isAr ? 'ar' : 'en' });
      if (type === 'course') {
        const newCourses = [...courses];
        newCourses[index] = { ...newCourses[index], descriptionAr: altText };
        setCourses(newCourses);
      }
      toast({ title: isAr ? "تم توليد النص" : "Alt Text Generated", description: altText });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate alt text." });
    } finally {
      setAltTextLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

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
            <TabsTrigger value="navigation" className="font-black"><Menu className="size-4 ml-2" /> {isAr ? "التنقل" : "Navigation"}</TabsTrigger>
            <TabsTrigger value="courses" className="font-black"><BookOpen className="size-4 ml-2" /> {isAr ? "الدورات" : "Courses"}</TabsTrigger>
            <TabsTrigger value="accessibility" className="font-black"><Accessibility className="size-4 ml-2" /> {isAr ? "إمكانية الوصول" : "Accessibility"}</TabsTrigger>
            <TabsTrigger value="builders" className="font-black"><Sparkles className="size-4 ml-2" /> {isAr ? "المصممات" : "Builders"}</TabsTrigger>
            <TabsTrigger value="site" className="font-black"><PenTool className="size-4 ml-2" /> {isAr ? "الموقع" : "Site"}</TabsTrigger>
            <TabsTrigger value="applications" className="font-black"><FileCheck className="size-4 ml-2" /> {isAr ? "الطلبات" : "Apps"}</TabsTrigger>
          </TabsList>

          <TabsContent value="navigation" className="space-y-8">
             <Card className="rounded-brand shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-black flex items-center gap-2"><Menu className="text-accent" /> {isAr ? "القائمة الرئيسية" : "Main Menu"}</CardTitle>
                  <Button size="sm" onClick={() => setMenuItems([...menuItems, { id: Date.now().toString(), labelAr: 'جديد', labelEn: 'New', link: '/', order: menuItems.length }])}>
                    <Plus size={14} className="ml-1" /> {isAr ? "إضافة عنصر" : "Add Item"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {menuItems.map((item, idx) => (
                      <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-2xl bg-slate-50 group">
                        <Input placeholder="Label AR" value={item.labelAr} onChange={e => { const nm = [...menuItems]; nm[idx].labelAr = e.target.value; setMenuItems(nm); }} />
                        <Input placeholder="Label EN" value={item.labelEn} onChange={e => { const nm = [...menuItems]; nm[idx].labelEn = e.target.value; setMenuItems(nm); }} />
                        <Input placeholder="Link" value={item.link} onChange={e => { const nm = [...menuItems]; nm[idx].link = e.target.value; setMenuItems(nm); }} />
                        <Button variant="ghost" size="icon" onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="text-red-400"><Trash2 size={16}/></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
             </Card>

             <Card className="rounded-brand shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-black flex items-center gap-2"><ImageIcon className="text-accent" /> {isAr ? "صور البانر (الخريف)" : "Banner Banners"}</CardTitle>
                  <Button size="sm" onClick={() => setCarouselItems([...carouselItems, { id: Date.now().toString(), titleAr: 'بانر جديد', titleEn: 'New Banner', subtitleAr: '', subtitleEn: '', imageUrl: '' }])}>
                    <Plus size={14} className="ml-1" /> {isAr ? "إضافة بانر" : "Add Banner"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {carouselItems.map((item, idx) => (
                      <div key={item.id} className="p-6 border rounded-3xl space-y-4 bg-white shadow-sm">
                        <Input placeholder="Title AR" value={item.titleAr} onChange={e => { const nc = [...carouselItems]; nc[idx].titleAr = e.target.value; setCarouselItems(nc); }} />
                        <Input placeholder="Image URL" value={item.imageUrl} onChange={e => { const nc = [...carouselItems]; nc[idx].imageUrl = e.target.value; setCarouselItems(nc); }} />
                        {item.imageUrl && <div className="h-20 w-full rounded-xl overflow-hidden relative"><img src={item.imageUrl} alt="preview" className="object-cover w-full h-full" /></div>}
                        <Button variant="ghost" size="sm" onClick={() => setCarouselItems(carouselItems.filter(c => c.id !== item.id))} className="text-red-400 w-full"><Trash2 size={14} className="ml-2"/> {isAr ? "حذف البانر" : "Delete"}</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="accessibility">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="rounded-brand shadow-lg">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <ImageIcon className="text-accent" /> {isAr ? "مولد النصوص البديلة AI" : "AI Alt-Text Generator"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500 font-bold">{isAr ? "استخدم الذكاء الاصطناعي لوصف الصور لضعاف البصر." : "Use AI to describe images for the visually impaired."}</p>
                  <div className="p-8 border-2 border-dashed rounded-3xl text-center bg-slate-50">
                    <CloudUpload className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-sm font-black text-slate-600">{isAr ? "ارفع صورة لتحليلها" : "Upload image to analyze"}</p>
                    <p className="text-xs text-slate-400 mt-2">{isAr ? "سيتم توليد النص البديل تلقائياً في قاعدة البيانات" : "Alt-text will be saved to bin automatically"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-brand shadow-lg">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Video className="text-accent" /> {isAr ? "مساعد لغة الإشارة" : "Sign Language Assistant"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500 font-bold">{isAr ? "توليد فيديوهات لغة الإشارة العمانية للخدمات." : "Generate Oman Sign Language videos for services."}</p>
                  <Button variant="outline" className="w-full justify-start gap-3 h-14 font-black rounded-2xl border-2 hover:bg-slate-50">
                    <Video className="text-primary" size={20} />
                    {isAr ? "إدارة فيديوهات الإشارة" : "Manage Sign Videos"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="builders">
             <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: isAr ? 'باني الصفحات' : 'Page Builder', icon: Layout, link: '/pagebuild', color: 'text-primary' },
                  { title: isAr ? 'محرك الخدمات' : 'Service Engine', icon: Sparkles, link: '/servicebuild', color: 'text-accent' },
                  { title: isAr ? 'باني الاستطلاعات' : 'Survey Builder', icon: ClipboardList, link: '/surveybuild', color: 'text-secondary' }
                ].map((b, i) => (
                  <Card key={i} className="rounded-brand shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden group">
                    <Link href={b.link}>
                      <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className={cn("p-4 rounded-2xl bg-slate-50 group-hover:bg-slate-100 transition-colors", b.color)}>
                          <b.icon size={48} />
                        </div>
                        <h4 className="text-xl font-black">{b.title}</h4>
                        <ArrowUpRight className="text-slate-300" />
                      </CardContent>
                    </Link>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="courses">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة البرامج التدريبية" : "Training Programs Management"}</h3>
                <Button onClick={() => setCourses([...courses, { id: Date.now().toString(), titleAr: 'دورة جديدة', titleEn: 'New Course', descriptionAr: '', descriptionEn: '', imageUrl: '', durationAr: 'شهر', durationEn: '1 Month', isOpen: true }])} className="rounded-full bg-primary font-bold"><Plus className="size-4 ml-2"/> {isAr ? "دورة جديدة" : "New Course"}</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course, i) => (
                  <Card key={course.id} className="rounded-brand shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <Input placeholder="Course Title AR" value={course.titleAr} onChange={e => { const nc = [...courses]; nc[i].titleAr = e.target.value; setCourses(nc); }} />
                      <Input placeholder="Image URL" value={course.imageUrl} onChange={e => { const nc = [...courses]; nc[i].imageUrl = e.target.value; setCourses(nc); }} />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleAltTextGeneration(course.imageUrl, i, 'course')} disabled={altTextLoading}>
                          {altTextLoading ? <Loader2 className="animate-spin size-4" /> : <Sparkles size={14} className="ml-2" />}
                          {isAr ? "توليد وصف للصورة" : "AI Alt-Text"}
                        </Button>
                        <Trash2 className="text-red-400 mt-2 cursor-pointer" onClick={() => setCourses(courses.filter(c => c.id !== course.id))} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="applications">
             <Card className="rounded-brand shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6">
                  <CardTitle className="font-black flex items-center gap-2"><FileCheck className="text-accent" /> {isAr ? "طلبات المواطنين" : "Citizen Applications"}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>{isAr ? "المواطن" : "Citizen"}</TableHead>
                        <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-bold">{app.citizenName}</TableCell>
                          <TableCell>{app.serviceName}</TableCell>
                          <TableCell>
                            <Badge variant={app.status === 'pending' ? 'secondary' : app.status === 'approved' ? 'default' : 'destructive'} className="rounded-full">
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة دليل الخدمات" : "Service Catalog Management"}</h3>
                <Button size="sm" onClick={() => setServices([...services, { id: `svc_${Date.now()}`, title: 'خدمة جديدة', description: '', iconName: 'FileText', category: 'building', isActive: true, isFeatured: false, reqsAr: [], reqsEn: [], fees: '0 OMR' }])}>
                  <Plus size={14} className="ml-2"/> {isAr ? "إضافة خدمة" : "Add Service"}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                    <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead>{isAr ? "الرسوم" : "Fees"}</TableHead>
                    <TableHead>{isAr ? "مميزة" : "Featured"}</TableHead>
                    <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s, idx) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">
                        <Input value={s.title} onChange={e => { const ns = [...services]; ns[idx].title = e.target.value; setServices(ns); }} className="h-8 text-xs" />
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline">{s.category}</Badge>
                      </TableCell>
                      <TableCell className="text-emerald-600 font-black">{s.fees}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { const ns = [...services]; ns[idx].isFeatured = !ns[idx].isFeatured; setServices(ns); }}>
                          <Star className={cn("size-4", s.isFeatured ? "fill-accent text-accent" : "text-slate-200")} />
                        </Button>
                      </TableCell>
                      <TableCell>
                         <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400"><Trash2 size={16}/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="site">
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
        </Tabs>
      </div>
    </div>
  );
}
