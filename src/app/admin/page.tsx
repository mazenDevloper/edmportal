
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { Settings, Plus, Save, Trash2, X, Search, Megaphone, Loader2, CloudUpload, HelpCircle } from 'lucide-react';
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

  // Form State
  const [newService, setNewService] = useState<Partial<Service>>({ 
    title: '', 
    titleEn: '', 
    description: '', 
    iconName: 'LayoutGrid', 
    category: 'building',
    fees: '0 OMR',
    reqsAr: [],
    reqsEn: []
  });
  
  const [reqArInput, setReqArInput] = useState('');
  const [reqEnInput, setReqEnInput] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [newNews, setNewNews] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setSiteConfig(data.siteConfig || siteConfig);
          setNewsItems(data.newsItems || []);
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data from Cloud Storage.", variant: "destructive" });
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
        siteConfig,
        newsItems
      });
      toast({ 
        title: isAr ? "تم الحفظ" : "Saved", 
        description: isAr ? "تمت مزامنة كافة البيانات بنجاح." : "All data synced successfully." 
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to sync with cloud storage.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!newService.title || !newService.category) {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "يرجى إكمال البيانات الأساسية" : "Please fill basic info", variant: "destructive" });
      return;
    }
    const service: Service = {
      ...newService as Service,
      id: `svc_${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setServices(prev => [service, ...prev]);
    setNewService({ title: '', titleEn: '', description: '', iconName: 'LayoutGrid', category: 'building', fees: '0 OMR', reqsAr: [], reqsEn: [] });
    toast({ title: isAr ? "تمت الإضافة" : "Added", description: isAr ? "اضغط على حفظ للمزامنة" : "Press Save to sync" });
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    toast({ title: isAr ? "تم الحذف" : "Deleted" });
  };

  const addNews = () => {
    if (!newNews) return;
    const news: NewsTicker = {
      id: `news_${Date.now()}`,
      text: newNews,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setNewsItems(prev => [news, ...prev]);
    setNewNews('');
  };

  const deleteNews = (id: string) => {
    setNewsItems(prev => prev.filter(n => n.id !== id));
  };

  const lucideIconNames = Object.keys(Icons).filter(key => typeof (Icons as any)[key] === 'function' || typeof (Icons as any)[key] === 'object');
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return lucideIconNames.slice(0, 48);
    return lucideIconNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 48);
  }, [iconSearch, lucideIconNames]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-black text-slate-500">{isAr ? "جاري التحميل..." : "Loading Data..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3">
             <Settings className="h-8 w-8 text-accent" /> {isAr ? "إدارة البوابة الرقمية" : "Portal Administration"}
           </h1>
           <div className="flex gap-4">
             <Button 
               onClick={handleGlobalSave} 
               disabled={saving}
               className="dm-gradient-primary rounded-full px-8 font-black shadow-xl hover:scale-105 transition-all h-12"
             >
               {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
               {isAr ? "حفظ ومزامنة التغييرات" : "Save & Sync Changes"}
             </Button>
             <Button variant="outline" className="rounded-full border-primary text-primary font-bold shadow-sm h-12" asChild>
               <a href="/">{isAr ? "العودة للبوابة" : "Back to Portal"}</a>
             </Button>
           </div>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border p-1 h-auto mb-10 flex flex-wrap gap-2 rounded-xl shadow-sm">
            <TabsTrigger value="services" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold transition-all">{isAr ? "إدارة الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="site" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold transition-all">{isAr ? "الهوية والإحصائيات" : "Site Config"}</TabsTrigger>
            <TabsTrigger value="ticker" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 font-bold transition-all">{isAr ? "شريط الأخبار" : "News Ticker"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="animate-in fade-in zoom-in-95">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 h-fit rounded-brand shadow-lg border-none">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="font-black text-primary text-lg">{isAr ? "إضافة خدمة جديدة" : "Add New Service"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "المعلومات الأساسية" : "Basic Info"}</label>
                    <Input placeholder={isAr ? "اسم الخدمة (عربي)" : "Name (Arabic)"} value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} className="rounded-xl h-12" />
                    <Input placeholder={isAr ? "Service Name (English)" : "Name (English)"} dir="ltr" value={newService.titleEn} onChange={e => setNewService({...newService, titleEn: e.target.value})} className="rounded-xl h-12" />
                    <Textarea placeholder={isAr ? "وصف الخدمة المختصر" : "Brief Description"} value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="rounded-xl min-h-[80px]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "التصنيف" : "Category"}</label>
                      <Select value={newService.category} onValueChange={(val) => setNewService({...newService, category: val})}>
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
                            <SelectItem key={id} value={id}>{isAr ? cfg.labelAr : cfg.labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "الرسوم" : "Fees"}</label>
                      <Input placeholder="5 OMR" value={newService.fees} onChange={e => setNewService({...newService, fees: e.target.value})} className="rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "أيقونة الخدمة" : "Service Icon"}</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input 
                        placeholder={isAr ? "ابحث عن أيقونة..." : "Search icon..."} 
                        value={iconSearch} 
                        onChange={e => setIconSearch(e.target.value)} 
                        className="pl-10 rounded-xl"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 max-h-32 overflow-y-auto p-2 border rounded-xl bg-slate-50/50">
                      {filteredIcons.map(name => {
                        const Icon = (Icons as any)[name] || HelpCircle;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setNewService({...newService, iconName: name})}
                            className={cn(
                              "p-2 rounded-lg transition-all border",
                              newService.iconName === name ? "bg-primary text-white border-primary shadow-md" : "bg-white text-slate-500 border-slate-100 hover:border-accent"
                            )}
                          >
                            <Icon size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "متطلبات الخدمة" : "Requirements"}</label>
                    <div className="space-y-2">
                      <Input placeholder={isAr ? "المتطلب (عربي)" : "Req (AR)"} value={reqArInput} onChange={e => setReqArInput(e.target.value)} className="rounded-xl" />
                      <Input placeholder={isAr ? "Requirement (English)" : "Req (EN)"} dir="ltr" value={reqEnInput} onChange={e => setReqEnInput(e.target.value)} className="rounded-xl" />
                      <Button className="w-full bg-accent text-white font-bold h-10 rounded-xl" onClick={() => {
                        if(!reqArInput || !reqEnInput) return;
                        setNewService(prev => ({
                          ...prev,
                          reqsAr: [...(prev.reqsAr || []), reqArInput],
                          reqsEn: [...(prev.reqsEn || []), reqEnInput]
                        }));
                        setReqArInput('');
                        setReqEnInput('');
                      }}>
                        <Plus size={18} className="ml-2" /> {isAr ? "إضافة متطلب" : "Add Requirement"}
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {newService.reqsAr?.map((req, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl text-xs border">
                          <span className="font-bold text-slate-700 truncate">{req}</span>
                          <button onClick={() => setNewService(prev => ({
                            ...prev,
                            reqsAr: prev.reqsAr?.filter((_, idx) => idx !== i),
                            reqsEn: prev.reqsEn?.filter((_, idx) => idx !== i)
                          }))} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={addService} className="w-full bg-slate-900 text-white rounded-full py-7 font-black h-auto text-lg shadow-lg">
                    <Save className="ml-2" /> {isAr ? "اعتماد الخدمة مؤقتاً" : "Stage Service"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md border-none overflow-hidden">
                <CardHeader className="border-b bg-white">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-black text-primary">{isAr ? "الخدمات في قائمة النشر" : "Services in Queue"}</CardTitle>
                    <span className="text-xs font-bold text-slate-400">{services.length} {isAr ? "خدمة" : "services"}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services.map(service => {
                      const Icon = (Icons as any)[service.iconName] || Icons.HelpCircle;
                      const catInfo = CAT_CONFIG[service.category as CategoryId];
                      return (
                        <div key={service.id} className="p-5 border rounded-2xl bg-white shadow-sm group hover:border-accent transition-all">
                          <div className="flex items-start justify-between mb-4">
                             <div className="bg-primary/5 p-3 rounded-2xl text-primary"><Icon className="h-6 w-6" /></div>
                             <Button variant="ghost" size="icon" className="text-red-500 rounded-full" onClick={() => deleteService(service.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          <p className="font-black text-primary mb-2 text-lg leading-tight">{service.title}</p>
                          <div className="flex flex-wrap gap-2">
                             <span className={cn("text-[9px] font-black px-3 py-1 rounded-full border", catInfo?.color)}>{isAr ? catInfo?.labelAr : catInfo?.labelEn}</span>
                             <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">{service.fees}</span>
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
              <Card className="rounded-brand shadow-md border-none overflow-hidden">
                <CardHeader><CardTitle className="font-black text-primary">{isAr ? "إعدادات الواجهة" : "Interface Settings"}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">{isAr ? "عنوان الهيرو" : "Hero Title"}</label>
                    <Input value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} className="h-12 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">{isAr ? "الوصف" : "Subtitle"}</label>
                    <Textarea value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} className="rounded-xl font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(siteConfig.stats || {}).map((key) => (
                      <div key={key} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase">{key}</label>
                        <Input 
                          type="number" 
                          value={siteConfig.stats?.[key as keyof typeof siteConfig.stats]} 
                          onChange={e => setSiteConfig({
                            ...siteConfig, 
                            stats: { ...siteConfig.stats, [key]: Number(e.target.value) } as any
                          })} 
                          className="font-black rounded-xl text-center" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-brand shadow-md border-none overflow-hidden">
                <CardHeader><CardTitle className="font-black text-primary">{isAr ? "بيانات الاتصال" : "Contact Info"}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">{isAr ? "هاتف الدعم" : "Support Phone"}</label>
                    <Input value={siteConfig.contactPhone} onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})} className="h-12 rounded-xl font-black text-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500">{isAr ? "البريد الإلكتروني" : "Email Address"}</label>
                    <Input value={siteConfig.contactEmail} onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ticker">
             <Card className="rounded-brand border-none shadow-md overflow-hidden">
                <CardHeader><CardTitle className="font-black text-primary flex items-center gap-2"><Megaphone className="text-secondary" /> {isAr ? "الأخبار العاجلة" : "Breaking News"}</CardTitle></CardHeader>
                <CardContent className="space-y-8 p-8">
                   <div className="flex gap-4">
                      <Textarea placeholder={isAr ? "اكتب الخبر العاجل هنا..." : "Type breaking news..."} value={newNews} onChange={e => setNewNews(e.target.value)} className="rounded-2xl flex-1 font-bold shadow-inner" />
                      <Button onClick={addNews} className="bg-secondary rounded-2xl px-10 font-black text-white h-auto shadow-lg hover:scale-105 transition-all">{isAr ? "نشر" : "Publish"}</Button>
                   </div>
                   <div className="grid gap-4">
                      {newsItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-5 border rounded-2xl bg-white shadow-sm">
                           <p className="text-sm font-black text-slate-700">{item.text}</p>
                           <Button variant="ghost" size="icon" className="text-red-500 rounded-full" onClick={() => deleteNews(item.id)}><Trash2 size={18} /></Button>
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
