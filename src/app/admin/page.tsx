'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem, Course, ServiceApplication, Survey } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, X, Search, Loader2, 
  CloudUpload, Star, Layout, Menu, Image as ImageIcon,
  BookOpen, FileCheck, Info, Sparkles, ClipboardList, PenTool, ArrowUpRight,
  Vote, TrendingUp, Accessibility, Languages, Video
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
        services, courses, applications, siteConfig, newsItems, menuItems, carouselItems, surveys
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
           </div>
           <div className="flex flex-wrap gap-4">
             <Button variant="outline" asChild className="rounded-full font-black">
               <Link href="/">{isAr ? "العودة للبوابة" : "Exit to Portal"}</Link>
             </Button>
             <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-xl">
               {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
               {isAr ? "حفظ ومزامنة" : "Save & Sync"}
             </Button>
           </div>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-2 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="services" className="font-black"><Layout className="size-4 ml-2" /> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="courses" className="font-black"><BookOpen className="size-4 ml-2" /> {isAr ? "الدورات" : "Courses"}</TabsTrigger>
            <TabsTrigger value="accessibility" className="font-black"><Accessibility className="size-4 ml-2" /> {isAr ? "إمكانية الوصول" : "Accessibility"}</TabsTrigger>
            <TabsTrigger value="builders" className="font-black"><Sparkles className="size-4 ml-2" /> {isAr ? "المصممات" : "Builders"}</TabsTrigger>
            <TabsTrigger value="site" className="font-black"><PenTool className="size-4 ml-2" /> {isAr ? "الموقع" : "Site"}</TabsTrigger>
          </TabsList>

          <TabsContent value="accessibility">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="rounded-brand shadow-lg">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <ImageIcon className="text-accent" /> {isAr ? "مولد النصوص البديلة AI" : "AI Alt-Text Generator"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500">{isAr ? "استخدم الذكاء الاصطناعي لوصف الصور لضعاف البصر." : "Use AI to describe images for the visually impaired."}</p>
                  <div className="p-4 border-2 border-dashed rounded-2xl text-center">
                    <CloudUpload className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-xs font-bold">{isAr ? "النظام يقوم بتوليد النصوص تلقائياً عند رفع الصور" : "System generates alt-text automatically"}</p>
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
                  <p className="text-sm text-slate-500">{isAr ? "توليد فيديوهات لغة الإشارة العمانية للخدمات." : "Generate Oman Sign Language videos for services."}</p>
                  <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold rounded-xl">
                    <Video className="text-primary" size={18} />
                    {isAr ? "إدارة فيديوهات الإشارة" : "Manage Sign Videos"}
                  </Button>
                </CardContent>
              </Card>
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

          <TabsContent value="services">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "إدارة دليل الخدمات" : "Service Catalog Management"}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                    <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                    <TableHead>{isAr ? "الرسوم" : "Fees"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{isAr ? s.title : s.titleEn}</TableCell>
                      <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                      <TableCell className="text-emerald-600 font-black">{s.fees}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="site">
            <Card className="rounded-brand shadow-md">
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><PenTool size={18}/> {isAr ? "نصوص البطل" : "Hero Text"}</h3>
                    <Input placeholder="Title" value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} />
                    <Input placeholder="Subtitle" value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18}/> {isAr ? "أرقام المنصة" : "Platform Stats"}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold">{isAr ? "المعاملات" : "Transactions"}</label><Input type="number" value={siteConfig.stats?.transactions} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, transactions: parseInt(e.target.value)}})} /></div>
                      <div><label className="text-xs font-bold">{isAr ? "التراخيص" : "Permits"}</label><Input type="number" value={siteConfig.stats?.permits} onChange={e => setSiteConfig({...siteConfig, stats: {...siteConfig.stats!, permits: parseInt(e.target.value)}})} /></div>
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
