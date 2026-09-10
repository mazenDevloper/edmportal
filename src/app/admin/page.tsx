'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, SiteConfig, ServiceApplication, NewsTicker } from '@/lib/types';
import { Settings, Plus, Save, Trash2, LayoutGrid, FileText, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig } = useDoc<SiteConfig>(siteConfigRef);
  
  const newsQuery = useMemo(() => collection(firestore, 'news_ticker'), [firestore]);
  const { data: newsItems } = useCollection<NewsTicker>(newsQuery);

  const servicesQuery = useMemo(() => collection(firestore, 'services'), [firestore]);
  const { data: services } = useCollection<Service>(servicesQuery);

  const [newService, setNewService] = useState<Partial<Service>>({ 
    title: '', 
    titleEn: '', 
    description: '', 
    iconName: 'LayoutGrid', 
    category: 'الرخص',
    fees: '0 OMR',
    reqsAr: [],
    reqsEn: []
  });
  
  const [reqArInput, setReqArInput] = useState('');
  const [reqEnInput, setReqEnInput] = useState('');
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

  const addRequirement = () => {
    if (!reqArInput || !reqEnInput) return;
    setNewService(prev => ({
      ...prev,
      reqsAr: [...(prev.reqsAr || []), reqArInput],
      reqsEn: [...(prev.reqsEn || []), reqEnInput]
    }));
    setReqArInput('');
    setReqEnInput('');
  };

  const removeRequirement = (index: number) => {
    setNewService(prev => ({
      ...prev,
      reqsAr: (prev.reqsAr || []).filter((_, i) => i !== index),
      reqsEn: (prev.reqsEn || []).filter((_, i) => i !== index)
    }));
  };

  const createService = () => {
    if (!newService.title) return;
    addDoc(collection(firestore, 'services'), { ...newService, isActive: true });
    setNewService({ 
      title: '', 
      titleEn: '', 
      description: '', 
      iconName: 'LayoutGrid', 
      category: 'الرخص', 
      fees: '0 OMR', 
      reqsAr: [], 
      reqsEn: [] 
    });
    toast({ title: "Service Created" });
  };

  const categories = ['الرخص', 'المباني', 'الاستثمار', 'البيانات المفتوحة', 'أخرى'];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-arabic" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3">
             <Settings className="h-8 w-8 text-accent" /> إدارة البوابة الرقمية
           </h1>
           <Button variant="outline" className="rounded-full border-primary text-primary font-bold" asChild>
             <a href="/">العودة للبوابة</a>
           </Button>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border p-1 h-auto mb-10 flex flex-wrap gap-2 rounded-xl shadow-sm">
            <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold">دليل الخدمات</TabsTrigger>
            <TabsTrigger value="site" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold">الهوية والإحصائيات</TabsTrigger>
            <TabsTrigger value="ticker" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold">شريط الأخبار</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="animate-in fade-in zoom-in-95">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 h-fit rounded-brand shadow-lg border-none">
                <CardHeader><CardTitle className="font-black text-primary">إضافة خدمة جديدة</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase">المعلومات الأساسية</label>
                    <Input placeholder="اسم الخدمة (عربي)" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                    <Input placeholder="Service Name (English)" dir="ltr" value={newService.titleEn} onChange={e => setNewService({...newService, titleEn: e.target.value})} />
                    <Textarea placeholder="وصف الخدمة" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">التصنيف</label>
                      <Select onValueChange={(val) => setNewService({...newService, category: val})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">الرسوم</label>
                      <Input placeholder="مثال: 5 OMR" value={newService.fees} onChange={e => setNewService({...newService, fees: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <label className="text-[10px] font-black text-slate-400 uppercase">إضافة متطلبات الخدمة</label>
                    <div className="flex gap-2">
                      <Input placeholder="المتطلب (عربي)" value={reqArInput} onChange={e => setReqArInput(e.target.value)} />
                      <Input placeholder="Req (English)" dir="ltr" value={reqEnInput} onChange={e => setReqEnInput(e.target.value)} />
                      <Button size="icon" className="shrink-0 bg-accent hover:bg-primary" onClick={addRequirement}>
                        <Plus size={18} />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {newService.reqsAr?.map((req, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border">
                          <span className="font-bold">{req}</span>
                          <button onClick={() => removeRequirement(i)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">أيقونة الخدمة</label>
                    <Input placeholder="مثال: Building2" value={newService.iconName} onChange={e => setNewService({...newService, iconName: e.target.value})} />
                  </div>
                  
                  <Button onClick={createService} className="w-full dm-gradient-primary rounded-full py-6 font-black h-auto text-lg">
                    <Plus className="ml-2" /> إضافة للكتالوج الرقمي
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md border-none">
                <CardHeader><CardTitle className="font-black text-primary">الخدمات النشطة</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services?.map(service => (
                      <div key={service.id} className="p-4 border rounded-xl bg-white shadow-sm group hover:border-accent transition-all relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4 relative z-10">
                           <div className="bg-primary/5 p-3 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <LayoutGrid className="h-6 w-6" />
                           </div>
                           <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-lg" onClick={() => deleteDoc(doc(firestore, 'services', service.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-black text-primary mb-1 relative z-10">{service.title}</p>
                        <div className="flex gap-2 relative z-10">
                           <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{service.category}</span>
                           <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{service.fees}</span>
                        </div>
                        <div className="mt-3 text-[9px] text-slate-400 font-bold relative z-10">
                           {service.reqsAr?.length} متطلبات مضافة
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="site">
            <div className="grid gap-8">
              <Card className="rounded-brand shadow-md border-none overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader><CardTitle className="font-black text-primary">إعدادات الواجهة الرئيسية</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={updateConfig} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase">عنوان الهيرو الرئيسي</label>
                        <Input name="heroTitle" defaultValue={siteConfig?.heroTitle} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase">هاتف الدعم</label>
                        <Input name="contactPhone" defaultValue={siteConfig?.contactPhone} className="h-12 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase">الوصف التعريفي</label>
                      <Textarea name="heroSubtitle" defaultValue={siteConfig?.heroSubtitle} className="min-h-[100px] rounded-xl" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t bg-slate-50/50 rounded-xl px-4">
                      {[
                        { name: 'statTransactions', label: 'المعاملات' },
                        { name: 'statPermits', label: 'التراخيص' },
                        { name: 'statContracts', label: 'العقود' },
                        { name: 'statTickets', label: 'التذاكر' },
                      ].map((stat) => (
                        <div key={stat.name} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase">{stat.label}</label>
                          <Input name={stat.name} type="number" defaultValue={siteConfig?.stats?.[stat.name.replace('stat', '').toLowerCase() as keyof typeof siteConfig.stats]} className="font-black rounded-lg bg-white" />
                        </div>
                      ))}
                    </div>

                    <Button type="submit" className="dm-gradient-primary rounded-full px-10 py-6 font-black h-auto text-lg">
                      <Save className="ml-2" /> حفظ كافة الإعدادات
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ticker">
             <Card className="rounded-brand border-none shadow-md">
                <CardHeader><CardTitle className="font-black text-primary">شريط الأخبار العاجلة</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex gap-4">
                      <Textarea placeholder="اكتب الخبر العاجل هنا..." value={newNews} onChange={e => setNewNews(e.target.value)} className="rounded-xl flex-1" />
                      <Button onClick={() => {
                        if(!newNews) return;
                        addDoc(collection(firestore, 'news_ticker'), { text: newNews, isActive: true, createdAt: new Date().toISOString() });
                        setNewNews('');
                        toast({ title: "تمت الإضافة", description: "سيظهر الخبر في شريط الموقع." });
                      }} className="bg-secondary hover:bg-primary transition-colors rounded-xl px-8 font-bold text-white">إضافة</Button>
                   </div>
                   <div className="space-y-2">
                      {newsItems?.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 hover:bg-white transition-colors">
                           <p className="text-sm font-bold text-slate-700">{item.text}</p>
                           <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => deleteDoc(doc(firestore, 'news_ticker', item.id))}>
                              <Trash2 size={16} />
                           </Button>
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
