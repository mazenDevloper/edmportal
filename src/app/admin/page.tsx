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
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem, Course, ServiceApplication } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, X, Search, Megaphone, Loader2, 
  CloudUpload, Edit3, Star, Link as LinkIcon, Layout, Menu, Image as ImageIcon,
  BookOpen, FileCheck, Info
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
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    heroTitle: '',
    heroSubtitle: '',
    contactPhone: '',
    contactEmail: '',
    categories: ['الكل'],
    isMaintenanceMode: false,
    stats: { transactions: 0, permits: 0, contracts: 0, tickets: 0 }
  });
  const [newsItems, setNewsItems] = useState<NewsTicker[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  // Form States
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({ 
    title: '', titleEn: '', description: '', iconName: 'LayoutGrid', category: 'building', fees: '0 OMR', isFeatured: false, reqsAr: [], reqsEn: [], linkUrl: ''
  });
  
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', imageUrl: '', durationAr: '', durationEn: '', isOpen: true
  });

  const [newsForm, setNewsForm] = useState({ title: '', text: '' });
  const [menuForm, setMenuForm] = useState({ labelAr: '', labelEn: '', link: '' });
  const [carouselForm, setCarouselForm] = useState({ titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: '', linkUrl: '' });
  const [reqArInput, setReqArInput] = useState('');
  const [iconSearch, setIconSearch] = useState('');

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
        services,
        courses,
        applications,
        siteConfig,
        newsItems,
        menuItems,
        carouselItems
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تمت المزامنة بنجاح" : "Synced successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveService = () => {
    if (!newService.title) return;
    if (editingServiceId) {
      setServices(prev => prev.map(s => s.id === editingServiceId ? { ...s, ...newService } as Service : s));
      setEditingServiceId(null);
    } else {
      setServices([{ ...newService as Service, id: `svc_${Date.now()}`, isActive: true }, ...services]);
    }
    setNewService({ title: '', titleEn: '', description: '', iconName: 'LayoutGrid', category: 'building', fees: '0 OMR', isFeatured: false, reqsAr: [], reqsEn: [], linkUrl: '' });
  };

  const saveCourse = () => {
    if (!newCourse.titleAr) return;
    if (editingCourseId) {
      setCourses(prev => prev.map(c => c.id === editingCourseId ? { ...c, ...newCourse } as Course : c));
      setEditingCourseId(null);
    } else {
      setCourses([{ ...newCourse as Course, id: `course_${Date.now()}` }, ...courses]);
    }
    setNewCourse({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', imageUrl: '', durationAr: '', durationEn: '', isOpen: true });
  };

  const filteredIcons = useMemo(() => {
    return Object.keys(Icons).filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 50);
  }, [iconSearch]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <header className="flex justify-between items-center mb-10">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3">
             <Settings className="h-8 w-8 text-accent" /> {isAr ? "لوحة الإدارة الشاملة" : "Portal Admin"}
           </h1>
           <div className="flex gap-4">
             <Button variant="outline" asChild className="rounded-full border-primary text-primary font-black">
               <Link href="/">{isAr ? "العودة للبوابة" : "Exit to Portal"}</Link>
             </Button>
             <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-xl">
               {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
               {isAr ? "حفظ ومزامنة" : "Save & Sync"}
             </Button>
           </div>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-2 p-1 rounded-xl">
            <TabsTrigger value="services">{isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="courses">{isAr ? "الدورات" : "Courses"}</TabsTrigger>
            <TabsTrigger value="applications">{isAr ? "الطلبات" : "Applications"}</TabsTrigger>
            <TabsTrigger value="site">{isAr ? "الموقع" : "Site"}</TabsTrigger>
            <TabsTrigger value="nav">{isAr ? "القوائم" : "Navigation"}</TabsTrigger>
            <TabsTrigger value="ticker">{isAr ? "الأخبار" : "News"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-brand shadow-lg border-t-4 border-primary">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "إدارة الخدمة" : "Service Editor"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">{isAr ? "العنوان" : "Title"}</label>
                    <Input placeholder="Service AR" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                    <Input placeholder="Service EN" value={newService.titleEn} onChange={e => setNewService({...newService, titleEn: e.target.value})} />
                  </div>
                  <Textarea placeholder="Description" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  
                  <Select value={newService.category} onValueChange={v => setNewService({...newService, category: v})}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CAT_CONFIG).map(([id, cat]) => (
                        <SelectItem key={id} value={id}>{isAr ? cat.labelAr : cat.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-slate-50">
                    <Star className={cn("cursor-pointer", newService.isFeatured ? "fill-accent text-accent" : "text-slate-300")} onClick={() => setNewService({...newService, isFeatured: !newService.isFeatured})} />
                    <span className="text-sm font-bold">{isAr ? "خدمة مميزة" : "Featured"}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold">{isAr ? "أيقونة الخدمة" : "Service Icon"}</label>
                    <Input placeholder="Search icon..." value={iconSearch} onChange={e => setIconSearch(e.target.value)} className="h-8" />
                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                      {filteredIcons.map(name => {
                        const Icon = (Icons as any)[name];
                        return (
                          <button key={name} onClick={() => setNewService({...newService, iconName: name})} className={cn("p-2 border rounded-md hover:bg-slate-100", newService.iconName === name ? "bg-accent/20 border-accent" : "")}>
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold">{isAr ? "المتطلبات" : "Requirements"}</label>
                    <div className="flex gap-2">
                      <Input placeholder="Add requirement..." value={reqArInput} onChange={e => setReqArInput(e.target.value)} />
                      <Button size="icon" onClick={() => { if(reqArInput) { setNewService({...newService, reqsAr: [...(newService.reqsAr || []), reqArInput]}); setReqArInput(''); }}}><Plus size={16}/></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newService.reqsAr?.map((r, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">{r} <X size={10} className="cursor-pointer" onClick={() => setNewService({...newService, reqsAr: newService.reqsAr?.filter((_, idx) => idx !== i)})}/></Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={saveService} className="w-full bg-slate-900 h-12 rounded-xl shadow-md">{isAr ? "حفظ الخدمة" : "Save Service"}</Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "دليل الخدمات" : "Services Catalog"}</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services.map(s => (
                      <div key={s.id} className="p-4 border rounded-2xl bg-white flex justify-between items-center group hover:border-primary transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {React.createElement((Icons as any)[s.iconName] || Icons.Info, { size: 20, className: "text-primary" })}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{isAr ? s.title : s.titleEn}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{s.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingServiceId(s.id); setNewService(s); }}><Edit3 size={16}/></Button>
                          <Trash2 className="text-red-400 cursor-pointer hover:text-red-600 transition-colors" onClick={() => setServices(services.filter(x => x.id !== s.id))} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-brand shadow-lg border-t-4 border-secondary">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "إدارة البرامج التدريبية" : "Course Editor"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Title AR" value={newCourse.titleAr} onChange={e => setNewCourse({...newCourse, titleAr: e.target.value})} />
                  <Input placeholder="Title EN" value={newCourse.titleEn} onChange={e => setNewCourse({...newCourse, titleEn: e.target.value})} />
                  <Textarea placeholder="Description AR" value={newCourse.descriptionAr} onChange={e => setNewCourse({...newCourse, descriptionAr: e.target.value})} />
                  <Input placeholder="Image URL" value={newCourse.imageUrl} onChange={e => setNewCourse({...newCourse, imageUrl: e.target.value})} />
                  <Input placeholder="Duration (e.g. 5 days)" value={newCourse.durationAr} onChange={e => setNewCourse({...newCourse, durationAr: e.target.value})} />
                  <Button onClick={saveCourse} className="w-full bg-secondary text-white h-12 rounded-xl shadow-md">{isAr ? "حفظ الدورة" : "Save Course"}</Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "قائمة الدورات" : "Course List"}</CardTitle></CardHeader>
                <CardContent className="p-6">
                   <div className="grid sm:grid-cols-2 gap-4">
                     {courses.map(c => (
                       <div key={c.id} className="p-4 border rounded-2xl bg-white flex justify-between items-center group">
                         <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
                             {c.imageUrl ? <img src={c.imageUrl} className="w-full h-full object-cover" /> : <BookOpen className="p-3 text-slate-400" />}
                           </div>
                           <div>
                             <p className="font-bold text-sm">{isAr ? c.titleAr : c.titleEn}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{c.durationAr}</p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingCourseId(c.id); setNewCourse(c); }}><Edit3 size={16}/></Button>
                            <Trash2 className="text-red-400 cursor-pointer" onClick={() => setCourses(courses.filter(x => x.id !== c.id))} />
                         </div>
                       </div>
                     ))}
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications">
             <Card className="rounded-brand shadow-md">
                <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2"><FileCheck/> {isAr ? "طلبات المواطنين" : "Citizen Applications"}</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isAr ? "المواطن" : "Citizen"}</TableHead>
                        <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                        <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead className="text-right">{isAr ? "إجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">{isAr ? "لا توجد طلبات حالياً" : "No applications found"}</TableCell></TableRow>
                      ) : (
                        applications.map(app => (
                          <TableRow key={app.id}>
                            <TableCell className="font-bold">{app.citizenName}</TableCell>
                            <TableCell>{app.serviceName}</TableCell>
                            <TableCell className="text-xs text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">{isAr ? "معاينة" : "Review"}</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="site">
            <Card className="rounded-brand shadow-md border-t-4 border-primary">
              <CardContent className="p-8 space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 bg-slate-50 rounded-2xl">
                       <h3 className="font-black text-primary flex items-center gap-2"><Layout size={18}/> {isAr ? "إحصائيات المنصة" : "Platform Counters"}</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-[10px] font-bold uppercase">{isAr ? "المعاملات" : "Transactions"}</label><Input type="number" value={siteConfig.stats?.transactions} onChange={e => setSiteConfig({...siteConfig, stats: {...(siteConfig.stats || {transactions:0, permits:0, contracts:0, tickets:0}), transactions: parseInt(e.target.value)}})} /></div>
                          <div><label className="text-[10px] font-bold uppercase">{isAr ? "التراخيص" : "Permits"}</label><Input type="number" value={siteConfig.stats?.permits} onChange={e => setSiteConfig({...siteConfig, stats: {...(siteConfig.stats || {transactions:0, permits:0, contracts:0, tickets:0}), permits: parseInt(e.target.value)}})} /></div>
                       </div>
                    </div>
                    <div className="space-y-4 p-6 bg-slate-50 rounded-2xl">
                       <h3 className="font-black text-primary flex items-center gap-2"><Megaphone size={18}/> {isAr ? "نصوص البطل" : "Hero Branding"}</h3>
                       <Input placeholder="Hero Title" value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} />
                       <Input placeholder="Hero Subtitle" value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nav">
            <Card className="rounded-brand shadow-md">
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><Menu size={18}/> {isAr ? "روابط التنقل" : "Navigation Links"}</h3>
                    <div className="space-y-2">
                      <Input placeholder="Label AR" value={menuForm.labelAr} onChange={e => setMenuForm({...menuForm, labelAr: e.target.value})} />
                      <Input placeholder="Link" value={menuForm.link} onChange={e => setMenuForm({...menuForm, link: e.target.value})} />
                      <Button onClick={() => { if(menuForm.labelAr) { setMenuItems([...menuItems, { id: `m_${Date.now()}`, ...menuForm, labelEn: menuForm.labelAr, order: menuItems.length }]); setMenuForm({labelAr:'', labelEn:'', link:''}); }}} className="w-full">{isAr ? "إضافة" : "Add"}</Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {menuItems.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-2 border rounded-lg bg-white">
                          <span className="text-xs font-bold">{m.labelAr}</span>
                          <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={() => setMenuItems(menuItems.filter(x => x.id !== m.id))} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><ImageIcon size={18}/> {isAr ? "شرائح العرض" : "Carousel Slides"}</h3>
                    <div className="space-y-2">
                      <Input placeholder="Title AR" value={carouselForm.titleAr} onChange={e => setCarouselForm({...carouselForm, titleAr: e.target.value})} />
                      <Input placeholder="Image URL" value={carouselForm.imageUrl} onChange={e => setCarouselForm({...carouselForm, imageUrl: e.target.value})} />
                      <Button onClick={() => { if(carouselForm.titleAr) { setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, ...carouselForm, titleEn: carouselForm.titleAr, subtitleAr: '', subtitleEn: '' }]); setCarouselForm({titleAr:'', titleEn:'', subtitleAr:'', subtitleEn:'', imageUrl:'', linkUrl:''}); }}} className="w-full">{isAr ? "إضافة" : "Add"}</Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {carouselItems.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-2 border rounded-lg bg-white">
                          <span className="text-xs font-bold">{c.titleAr}</span>
                          <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={() => setCarouselItems(carouselItems.filter(x => x.id !== c.id))} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticker">
             <Card className="rounded-brand shadow-md">
                <CardContent className="p-8 space-y-4">
                  <Input placeholder="Breaking Headline" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                  <Textarea placeholder="News Content" value={newsForm.text} onChange={e => setNewsForm({...newsForm, text: e.target.value})} />
                  <Button onClick={() => setNewsItems([{ id: `n_${Date.now()}`, ...newsForm, isActive: true, createdAt: new Date().toISOString() }, ...newsItems])} className="bg-primary px-10 h-12 rounded-full font-black">{isAr ? "نشر الخبر" : "Publish News"}</Button>
                  <div className="space-y-3 mt-6">
                    {newsItems.map(item => (
                      <div key={item.id} className="p-4 border-l-4 border-l-accent bg-white rounded-xl shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-black text-primary">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.text}</p>
                        </div>
                        <Trash2 className="text-red-300 cursor-pointer" onClick={() => setNewsItems(newsItems.filter(i => i.id !== item.id))} />
                      </div>
                    ))}
                  </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
