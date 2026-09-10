'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Service, SiteConfig, ServiceApplication, NewsTicker } from '@/lib/types';
import { Settings, Plus, Save, Trash2, Clock, Megaphone, BarChart3, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig } = useDoc<SiteConfig>(siteConfigRef);
  
  const newsQuery = useMemo(() => collection(firestore, 'news_ticker'), [firestore]);
  const { data: newsItems } = useCollection<NewsTicker>(newsQuery);

  const servicesQuery = useMemo(() => collection(firestore, 'services'), [firestore]);
  const { data: services } = useCollection<Service>(servicesQuery);

  const applicationsQuery = useMemo(() => collection(firestore, 'applications'), [firestore]);
  const { data: applications } = useCollection<ServiceApplication>(applicationsQuery);

  const [newService, setNewService] = useState({ title: '', description: '', iconName: 'Info', category: 'الرخص' });
  const [newNews, setNewNews] = useState('');

  const updateConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setDoc(siteConfigRef, {
      heroTitle: formData.get('heroTitle'),
      heroSubtitle: formData.get('heroSubtitle'),
      contactPhone: formData.get('contactPhone'),
      stats: {
        transactions: Number(formData.get('statTransactions')),
        permits: Number(formData.get('statPermits')),
        contracts: Number(formData.get('statContracts')),
        tickets: Number(formData.get('statTickets')),
      },
      isMaintenanceMode: false
    }, { merge: true });
    toast({ title: "Config Saved", description: "Site identity and stats updated." });
  };

  const addTickerItem = () => {
    if (!newNews) return;
    addDoc(collection(firestore, 'news_ticker'), {
      text: newNews,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setNewNews('');
    toast({ title: "News Added" });
  };

  const createService = () => {
    addDoc(collection(firestore, 'services'), { ...newService, isActive: true });
    setNewService({ title: '', description: '', iconName: 'Info', category: 'الرخص' });
    toast({ title: "Service Created" });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3">
             <Settings className="h-8 w-8 text-accent" /> لوحة التحكم الإدارية
           </h1>
           <Button variant="outline" className="rounded-full border-primary text-primary" asChild>
             <a href="/">العودة للبوابة الرئيسية</a>
           </Button>
        </header>

        <Tabs defaultValue="site" className="w-full">
          <TabsList className="bg-white border p-1 h-auto mb-10 flex flex-wrap gap-2 rounded-xl">
            <TabsTrigger value="site" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">الهوية البصرية</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">إحصائيات البوابة</TabsTrigger>
            <TabsTrigger value="ticker" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">شريط الأخبار</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">كتالوج الخدمات</TabsTrigger>
            <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6">طلبات المواطنين</TabsTrigger>
          </TabsList>

          <TabsContent value="site">
            <Card className="rounded-brand shadow-md border-none overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader><CardTitle className="font-black text-primary">إعدادات الواجهة والبطولات</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={updateConfig} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase">عنوان الهيرو الرئيسي</label>
                      <Input name="heroTitle" defaultValue={siteConfig?.heroTitle} className="rounded-xl border-slate-200 h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-500 uppercase">رقم هاتف الدعم</label>
                      <Input name="contactPhone" defaultValue={siteConfig?.contactPhone} className="rounded-xl border-slate-200 h-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500 uppercase">الوصف الفرعي (Subtitle)</label>
                    <Textarea name="heroSubtitle" defaultValue={siteConfig?.heroSubtitle} className="rounded-xl border-slate-200 min-h-[100px]" />
                  </div>
                  <Button type="submit" className="dm-gradient-primary rounded-full px-8 py-6 font-black h-auto">
                    <Save className="h-5 w-5 mr-2" /> حفظ التغييرات
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="rounded-brand shadow-md border-none overflow-hidden">
              <div className="h-2 bg-accent" />
              <CardHeader><CardTitle className="font-black text-primary">تحديث أرقام الإحصائيات</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={updateConfig} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { name: 'statTransactions', label: 'المعاملات الإلكترونية', color: 'text-primary' },
                      { name: 'statPermits', label: 'تراخيص البناء', color: 'text-accent' },
                      { name: 'statContracts', label: 'عقود الإيجار', color: 'text-secondary' },
                      { name: 'statTickets', label: 'تذاكر إلكترونية', color: 'text-orange-500' },
                    ].map((stat) => (
                      <div key={stat.name} className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <label className={cn("text-xs font-black uppercase", stat.color)}>{stat.label}</label>
                        <Input 
                          name={stat.name} 
                          type="number" 
                          defaultValue={siteConfig?.stats?.[stat.name.replace('stat', '').toLowerCase() as keyof typeof siteConfig.stats]} 
                          className="rounded-lg border-white shadow-sm font-black"
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="submit" className="dm-gradient-primary rounded-full px-8 py-6 font-black h-auto">
                    <BarChart3 className="h-5 w-5 mr-2" /> مزامنة الإحصائيات الحية
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticker">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-brand shadow-md border-none h-fit">
                <CardHeader><CardTitle className="font-black text-primary">إضافة إعلان جديد</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="اكتب نص الخبر العاجل هنا..." 
                    value={newNews} 
                    onChange={e => setNewNews(e.target.value)} 
                    className="rounded-xl border-slate-200 min-h-[120px]"
                  />
                  <Button onClick={addTickerItem} className="w-full bg-secondary rounded-full py-6 font-black h-auto">
                    <Plus className="h-5 w-5 mr-2" /> إضافة للشريط
                  </Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 rounded-brand shadow-md border-none">
                <CardHeader><CardTitle className="font-black text-primary">الإعلانات النشطة حالياً</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {newsItems?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-white group hover:border-primary transition-colors">
                        <p className="text-sm font-bold text-slate-700 line-clamp-1 flex-1">{item.text}</p>
                        <div className="flex gap-2 mr-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("rounded-lg font-black text-xs", item.isActive ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50")}
                            onClick={() => updateDoc(doc(firestore, 'news_ticker', item.id), { isActive: !item.isActive })}
                          >
                            {item.isActive ? 'مباشر' : 'مخفي'}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-lg" onClick={() => deleteDoc(doc(firestore, 'news_ticker', item.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {newsItems?.length === 0 && <p className="text-center py-10 text-slate-300">لا توجد إعلانات نشطة</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 h-fit rounded-brand shadow-md border-none">
                <CardHeader><CardTitle className="font-black text-primary">إضافة خدمة جديدة</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <Input placeholder="عنوان الخدمة" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} className="rounded-xl" />
                  <Textarea placeholder="وصف الخدمة" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="rounded-xl" />
                  <Input placeholder="اسم الأيقونة (Building2, FileText)" value={newService.iconName} onChange={e => setNewService({...newService, iconName: e.target.value})} className="rounded-xl" />
                  <Input placeholder="التصنيف (الرخص, المباني...)" value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} className="rounded-xl" />
                  <Button onClick={createService} className="w-full dm-gradient-primary rounded-full py-6 font-black h-auto">
                    <Plus className="h-5 w-5 mr-2" /> إضافة للكتالوج
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md border-none">
                <CardHeader><CardTitle className="font-black text-primary">الخدمات المتاحة للجمهور</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services?.map(service => (
                      <div key={service.id} className="p-4 border rounded-xl bg-white shadow-sm group hover:border-accent transition-all">
                        <div className="flex items-start justify-between mb-4">
                           <div className="bg-primary/5 p-3 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <LayoutGrid className="h-6 w-6" />
                           </div>
                           <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteDoc(doc(firestore, 'services', service.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-black text-primary mb-1">{service.title}</p>
                        <p className="text-xs font-black text-accent uppercase">{service.category}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="rounded-brand shadow-md border-none overflow-hidden">
              <div className="h-2 bg-secondary" />
              <CardHeader><CardTitle className="font-black text-primary">طلبات الخدمات المستلمة</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications?.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-5">
                        <div className="bg-accent/10 p-3 rounded-full">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800">طلب رقم #{app.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm text-slate-500">الخدمة: <span className="font-bold text-primary">{app.serviceId}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase bg-accent/20 text-primary px-4 py-1.5 rounded-full tracking-wider">{app.status}</span>
                        <div className="h-8 w-px bg-slate-100" />
                        <p className="text-xs text-slate-400">{new Date(app.createdAt?.seconds * 1000).toLocaleDateString('ar-OM')}</p>
                      </div>
                    </div>
                  ))}
                  {applications?.length === 0 && (
                    <div className="text-center py-20">
                      <Megaphone className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">لا توجد طلبات جديدة حالياً</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}