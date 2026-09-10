
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { Settings, Plus, Save, Trash2, LayoutGrid, FileText, X, Check, Search, Palette, Megaphone } from 'lucide-react';
import * as Icons from 'lucide-react';
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

  // Service State
  const [newService, setNewService] = useState<Partial<Service>>({ 
    title: '', 
    titleEn: '', 
    description: '', 
    iconName: 'LayoutGrid', 
    category: '',
    fees: '0 OMR',
    reqsAr: [],
    reqsEn: []
  });
  
  const [reqArInput, setReqArInput] = useState('');
  const [reqEnInput, setReqEnInput] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [newNews, setNewNews] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Icon List for search
  const lucideIconNames = Object.keys(Icons).filter(key => typeof (Icons as any)[key] === 'function' || typeof (Icons as any)[key] === 'object');
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return lucideIconNames.slice(0, 50);
    return lucideIconNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 50);
  }, [iconSearch]);

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
      categories: siteConfig?.categories || ['الكل'],
      isMaintenanceMode: false
    }, { merge: true });
    toast({ title: "Config Saved", description: "Site identity and stats updated." });
  };

  const addCategory = () => {
    if (!newCategory) return;
    const currentCats = siteConfig?.categories || [];
    if (currentCats.includes(newCategory)) return;
    
    setDoc(siteConfigRef, {
      categories: [...currentCats, newCategory]
    }, { merge: true });
    setNewCategory('');
    toast({ title: "Category Added" });
  };

  const removeCategory = (cat: string) => {
    const currentCats = siteConfig?.categories || [];
    setDoc(siteConfigRef, {
      categories: currentCats.filter(c => c !== cat)
    }, { merge: true });
    toast({ title: "Category Removed" });
  };

  const addRequirement = () => {
    if (!reqArInput || !reqEnInput) {
      toast({ title: "Error", description: "Please enter requirement in both languages", variant: "destructive" });
      return;
    }
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
    if (!newService.title || !newService.category) {
      toast({ title: "Error", description: "Title and Category are required", variant: "destructive" });
      return;
    }
    addDoc(collection(firestore, 'services'), { 
      ...newService, 
      isActive: true,
      createdAt: new Date().toISOString() 
    });
    setNewService({ 
      title: '', 
      titleEn: '', 
      description: '', 
      iconName: 'LayoutGrid', 
      category: '', 
      fees: '0 OMR', 
      reqsAr: [], 
      reqsEn: [] 
    });
    toast({ title: "Service Created", description: "The new service is now live." });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-arabic" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3">
             <Settings className="h-8 w-8 text-accent" /> إدارة البوابة الرقمية
           </h1>
           <Button variant="outline" className="rounded-full border-primary text-primary font-bold shadow-sm" asChild>
             <a href="/">العودة للبوابة</a>
           </Button>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border p-1 h-auto mb-10 flex flex-wrap gap-2 rounded-xl shadow-sm">
            <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold transition-all">إدارة الخدمات</TabsTrigger>
            <TabsTrigger value="site" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold transition-all">الهوية والتصنيفات</TabsTrigger>
            <TabsTrigger value="ticker" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold transition-all">شريط الأخبار</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="animate-in fade-in zoom-in-95">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Service Creation Form */}
              <Card className="lg:col-span-1 h-fit rounded-brand shadow-lg border-none">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="font-black text-primary text-lg">إضافة خدمة جديدة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعلومات الأساسية</label>
                    <Input placeholder="اسم الخدمة (عربي)" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} className="rounded-xl h-12" />
                    <Input placeholder="Service Name (English)" dir="ltr" value={newService.titleEn} onChange={e => setNewService({...newService, titleEn: e.target.value})} className="rounded-xl h-12" />
                    <Textarea placeholder="وصف الخدمة المختصر" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="rounded-xl min-h-[80px]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">التصنيف</label>
                      <Select onValueChange={(val) => setNewService({...newService, category: val})}>
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {siteConfig?.categories?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">الرسوم</label>
                      <Input placeholder="مثال: 5 OMR" value={newService.fees} onChange={e => setNewService({...newService, fees: e.target.value})} className="rounded-xl" />
                    </div>
                  </div>

                  {/* Icon Search Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">أيقونة الخدمة (Lucide Search)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input 
                        placeholder="ابحث عن أيقونة..." 
                        value={iconSearch} 
                        onChange={e => setIconSearch(e.target.value)} 
                        className="pl-10 rounded-xl"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto p-2 border rounded-xl bg-slate-50/50">
                      {filteredIcons.map(name => {
                        const Icon = (Icons as any)[name];
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              setNewService({...newService, iconName: name});
                              toast({ title: "Icon Selected", description: name });
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-all border",
                              newService.iconName === name ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-100 hover:border-accent"
                            )}
                          >
                            <Icon size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <label className="text-[10px] font-black text-slate-400 uppercase">متطلبات الخدمة</label>
                    <div className="space-y-2">
                      <Input placeholder="المتطلب (عربي)" value={reqArInput} onChange={e => setReqArInput(e.target.value)} className="rounded-xl" />
                      <Input placeholder="Requirement (English)" dir="ltr" value={reqEnInput} onChange={e => setReqEnInput(e.target.value)} className="rounded-xl" />
                      <Button className="w-full bg-accent text-white font-bold h-10 rounded-xl" onClick={addRequirement}>
                        <Plus size={18} className="ml-2" /> إضافة متطلب للقائمة
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {newService.reqsAr?.map((req, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl text-xs border shadow-sm">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-700">{req}</span>
                            <span className="text-slate-400 italic" dir="ltr">{newService.reqsEn?.[i]}</span>
                          </div>
                          <button onClick={() => removeRequirement(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={createService} className="w-full dm-gradient-primary rounded-full py-7 font-black h-auto text-lg shadow-lg hover:scale-[1.02] transition-transform">
                    <Save className="ml-2" /> حفظ الخدمة ونشرها
                  </Button>
                </CardContent>
              </Card>

              {/* Active Services List */}
              <Card className="lg:col-span-2 rounded-brand shadow-md border-none overflow-hidden">
                <CardHeader className="border-b bg-white">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-black text-primary">الخدمات المتاحة حالياً</CardTitle>
                    <span className="text-xs font-bold text-slate-400">{services?.length || 0} خدمة مفعلة</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services?.map(service => {
                      const Icon = (Icons as any)[service.iconName] || Icons.HelpCircle;
                      return (
                        <div key={service.id} className="p-5 border rounded-2xl bg-white shadow-sm group hover:border-accent transition-all relative overflow-hidden">
                          <div className="flex items-start justify-between mb-4 relative z-10">
                             <div className="bg-primary/5 p-3 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                <Icon className="h-6 w-6" />
                             </div>
                             <div className="flex gap-2">
                               <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-full" onClick={() => deleteDoc(doc(firestore, 'services', service.id))}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                          <p className="font-black text-primary mb-1 relative z-10 text-lg leading-tight">{service.title}</p>
                          <div className="flex flex-wrap gap-2 relative z-10 mt-3">
                             <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">{service.category}</span>
                             <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">{service.fees}</span>
                          </div>
                          <div className="mt-4 pt-4 border-t flex justify-between items-center">
                             <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-2">
                               <Check size={12} className="text-[#10b981]" /> {service.reqsAr?.length} متطلبات
                             </div>
                             <span className="text-[9px] text-slate-300 font-bold">{service.iconName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="site">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Site Config Form */}
              <Card className="rounded-brand shadow-md border-none overflow-hidden h-fit">
                <div className="h-2 bg-primary" />
                <CardHeader><CardTitle className="font-black text-primary">إعدادات الهوية والواجهة</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={updateConfig} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">عنوان الهيرو الرئيسي</label>
                        <Input name="heroTitle" defaultValue={siteConfig?.heroTitle} className="h-14 rounded-2xl border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">هاتف الدعم الموحد</label>
                        <Input name="contactPhone" defaultValue={siteConfig?.contactPhone} className="h-14 rounded-2xl border-slate-200 font-black text-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الوصف التعريفي (الترويسي)</label>
                      <Textarea name="heroSubtitle" defaultValue={siteConfig?.heroSubtitle} className="min-h-[100px] rounded-2xl border-slate-200 p-4 font-bold" />
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block">إحصائيات البوابة (أرقام حقيقية)</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: 'statTransactions', label: 'المعاملات' },
                          { name: 'statPermits', label: 'التراخيص' },
                          { name: 'statContracts', label: 'العقود' },
                          { name: 'statTickets', label: 'التذاكر' },
                        ].map((stat) => (
                          <div key={stat.name} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500">{stat.label}</label>
                            <Input name={stat.name} type="number" defaultValue={siteConfig?.stats?.[stat.name.replace('stat', '').toLowerCase() as keyof typeof siteConfig.stats]} className="font-black rounded-xl bg-white border-none shadow-sm h-12 text-center text-primary" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full dm-gradient-primary rounded-full py-8 font-black h-auto text-xl shadow-lg hover:scale-[1.01] transition-transform">
                      <Save className="ml-2" /> حفظ كافة الإعدادات
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Categories Management */}
              <Card className="rounded-brand shadow-md border-none overflow-hidden h-fit">
                <div className="h-2 bg-accent" />
                <CardHeader>
                  <CardTitle className="font-black text-primary flex items-center gap-2">
                    <Palette className="text-accent" /> إدارة تصنيفات الخدمات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="اسم التصنيف الجديد (مثال: الاستثمار)" 
                      value={newCategory} 
                      onChange={e => setNewCategory(e.target.value)}
                      className="h-14 rounded-2xl border-slate-200 font-bold"
                    />
                    <Button onClick={addCategory} className="bg-accent hover:bg-primary text-white font-bold h-14 px-8 rounded-2xl shadow-md">إضافة</Button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {siteConfig?.categories?.map(cat => (
                      <div key={cat} className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in scale-in-95 transition-all hover:border-red-200">
                        <span className="font-black text-sm text-slate-700">{cat}</span>
                        {cat !== 'الكل' && (
                          <button onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {(!siteConfig?.categories || siteConfig.categories.length === 0) && (
                      <p className="text-slate-400 text-xs italic">لا توجد تصنيفات مخصصة بعد.</p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed border-t pt-4">
                    * ملاحظة: إزالة تصنيف لن يحذف الخدمات المرتبطة به، بل سيخفي التصفية الخاصة به فقط.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ticker">
             <Card className="rounded-brand border-none shadow-md overflow-hidden">
                <div className="h-2 bg-secondary" />
                <CardHeader><CardTitle className="font-black text-primary flex items-center gap-2"><Megaphone className="text-secondary" /> شريط الأخبار العاجلة</CardTitle></CardHeader>
                <CardContent className="space-y-8 p-8">
                   <div className="flex gap-4">
                      <Textarea placeholder="اكتب الخبر العاجل هنا... سيظهر فوراً في شريط الموقع." value={newNews} onChange={e => setNewNews(e.target.value)} className="rounded-[1.5rem] flex-1 min-h-[120px] p-6 font-bold border-slate-200 shadow-inner" />
                      <Button onClick={() => {
                        if(!newNews) return;
                        addDoc(collection(firestore, 'news_ticker'), { text: newNews, isActive: true, createdAt: new Date().toISOString() });
                        setNewNews('');
                        toast({ title: "تمت الإضافة", description: "سيظهر الخبر في شريط الموقع الآن." });
                      }} className="bg-secondary hover:bg-primary transition-all rounded-[1.5rem] px-10 font-black text-white h-auto shadow-lg">نشر الخبر</Button>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأخبار النشطة حالياً</label>
                      <div className="grid gap-4">
                        {newsItems?.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-6 border rounded-[1.5rem] bg-white shadow-sm hover:shadow-md transition-all group">
                             <div className="flex items-center gap-4">
                               <div className="w-1.5 h-10 rounded-full bg-secondary" />
                               <p className="text-sm font-black text-slate-700 leading-relaxed">{item.text}</p>
                             </div>
                             <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-full h-12 w-12" onClick={() => deleteDoc(doc(firestore, 'news_ticker', item.id))}>
                                <Trash2 size={18} />
                             </Button>
                          </div>
                        ))}
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
