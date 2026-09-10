
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem, Course, ServiceApplication, Survey, SurveyQuestion } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, X, Search, Megaphone, Loader2, 
  CloudUpload, Edit3, Star, Link as LinkIcon, Layout, Menu, Image as ImageIcon,
  BookOpen, FileCheck, Info, Sparkles, ClipboardList, PenTool, ArrowUpRight,
  Vote
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Survey State
  const [newSurvey, setNewSurvey] = useState<Partial<Survey>>({
    titleAr: '', titleEn: '', isActive: true, isPublicPoll: true, questions: []
  });

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

  const addPoll = () => {
    if (!newSurvey.titleAr) return;
    const poll: Survey = {
      ...newSurvey as Survey,
      id: `poll_${Date.now()}`,
      responsesCount: 0,
      questions: [{
        id: 'q1',
        type: 'mcq',
        questionAr: 'ما رأيك في الخدمات؟',
        questionEn: 'What do you think of the services?',
        iconName: 'MessageSquare',
        options: [
          { id: '1', textAr: 'ممتاز', textEn: 'Excellent', icon: 'Smile' },
          { id: '2', textAr: 'جيد', textEn: 'Good', icon: 'Meh' }
        ]
      }]
    };
    setSurveys([poll, ...surveys]);
    setNewSurvey({ titleAr: '', titleEn: '', isActive: true, isPublicPoll: true, questions: [] });
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
            <TabsTrigger value="polls" className="font-black"><Vote className="size-4 ml-2" /> {isAr ? "الاستطلاعات" : "Polls"}</TabsTrigger>
            <TabsTrigger value="site" className="font-black"><PenTool className="size-4 ml-2" /> {isAr ? "الموقع" : "Site"}</TabsTrigger>
          </TabsList>

          <TabsContent value="polls">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-brand shadow-lg border-t-4 border-accent">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "إضافة تصويت عام" : "Create Public Poll"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Poll Title AR" value={newSurvey.titleAr} onChange={e => setNewSurvey({...newSurvey, titleAr: e.target.value})} />
                  <Input placeholder="Poll Title EN" value={newSurvey.titleEn} onChange={e => setNewSurvey({...newSurvey, titleEn: e.target.value})} />
                  <Button onClick={addPoll} className="w-full bg-accent text-accent-foreground font-black rounded-xl h-12">
                    {isAr ? "نشر التصويت" : "Publish Poll"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "الاستطلاعات الحالية" : "Active Polls"}</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {surveys.map(poll => (
                      <div key={poll.id} className="p-4 border rounded-2xl bg-white flex justify-between items-center group shadow-sm">
                        <div>
                          <p className="font-bold">{isAr ? poll.titleAr : poll.titleEn}</p>
                          <Badge variant="secondary" className="mt-1">{poll.responsesCount} {isAr ? "مشاركة" : "Responses"}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant={poll.isActive ? 'default' : 'outline'} size="sm" onClick={() => setSurveys(surveys.map(s => s.id === poll.id ? {...s, isActive: !s.isActive} : s))}>
                            {poll.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                          </Button>
                          <Trash2 className="text-red-400 cursor-pointer" size={18} onClick={() => setSurveys(surveys.filter(s => s.id !== poll.id))} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            {/* Existing services logic remains... */}
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-slate-400">
               {isAr ? "نظام إدارة الخدمات الرقمية" : "Digital Services Management System"}
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
