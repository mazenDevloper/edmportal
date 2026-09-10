
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, SiteConfig, NewsTicker, MenuItem, FooterSection, CarouselItem } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, X, Search, Megaphone, Loader2, 
  CloudUpload, Edit3, Star, Link as LinkIcon, Layout, Menu, Image as ImageIcon
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
  
  const [newsForm, setNewsForm] = useState({ title: '', text: '' });
  const [menuForm, setMenuForm] = useState({ labelAr: '', labelEn: '', link: '' });
  const [carouselForm, setCarouselForm] = useState({ titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: '', linkUrl: '' });
  const [reqArInput, setReqArInput] = useState('');
  const [reqEnInput, setReqEnInput] = useState('');
  const [iconSearch, setIconSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
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
            <TabsTrigger value="site">{isAr ? "إحصائيات الموقع" : "Site Stats"}</TabsTrigger>
            <TabsTrigger value="nav">{isAr ? "القوائم والبواحث" : "Navigation"}</TabsTrigger>
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
                    <span className="text-sm font-bold">{isAr ? "خدمة مميزة (تظهر في الأعلى)" : "Featured (Show at top)"}</span>
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

                  <Button onClick={saveService} className="w-full bg-slate-900 h-12 rounded-xl shadow-md">{isAr ? "حفظ ونشر الخدمة" : "Save Service"}</Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 rounded-brand shadow-md">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "دليل الخدمات النشطة" : "Active Services Catalog"}</CardTitle></CardHeader>
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
                          {s.isFeatured && <Star size={14} className="text-accent fill-accent" />}
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

          <TabsContent value="nav">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-brand shadow-md border-t-4 border-accent">
                <CardHeader><CardTitle className="flex items-center gap-2"><Menu/> {isAr ? "روابط القائمة العلوية" : "Main Navigation Links"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Label AR" value={menuForm.labelAr} onChange={e => setMenuForm({...menuForm, labelAr: e.target.value})} />
                  <Input placeholder="Label EN" value={menuForm.labelEn} onChange={e => setMenuForm({...menuForm, labelEn: e.target.value})} />
                  <Input placeholder="Link (e.g., /admin)" value={menuForm.link} onChange={e => setMenuForm({...menuForm, link: e.target.value})} />
                  <Button onClick={() => { if(menuForm.labelAr) { setMenuItems([...menuItems, { id: `m_${Date.now()}`, ...menuForm, order: menuItems.length }]); setMenuForm({labelAr:'', labelEn:'', link:''}); }}} className="w-full bg-accent text-accent-foreground font-black">{isAr ? "إضافة للقائمة" : "Add to Menu"}</Button>
                  <div className="space-y-2 mt-4">
                    {menuItems.map(item => (
                      <div key={item.id} className="flex justify-between p-3 border rounded-xl bg-white shadow-sm">
                        <span className="text-sm font-bold">{isAr ? item.labelAr : item.labelEn}</span>
                        <Trash2 className="text-red-400 size-4 cursor-pointer" onClick={() => setMenuItems(menuItems.filter(i => i.id !== item.id))} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-brand shadow-md border-t-4 border-secondary">
                <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon/> {isAr ? "صور البانر (الخريف)" : "Khareef Promo Banners"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Headline AR" value={carouselForm.titleAr} onChange={e => setCarouselForm({...carouselForm, titleAr: e.target.value})} />
                  <Input placeholder="Image URL (cover photo)" value={carouselForm.imageUrl} onChange={e => setCarouselForm({...carouselForm, imageUrl: e.target.value})} />
                  <Button onClick={() => { if(carouselForm.imageUrl) { setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, ...carouselForm }]); setCarouselForm({titleAr:'', titleEn:'', subtitleAr:'', subtitleEn:'', imageUrl:'', linkUrl:''}); }}} className="w-full bg-secondary text-white font-black">{isAr ? "إضافة شريحة بنر" : "Add Promo Slide"}</Button>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {carouselItems.map(item => (
                      <div key={item.id} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 shadow-lg group">
                        <img src={item.imageUrl} className="object-cover w-full h-full" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" onClick={() => setCarouselItems(carouselItems.filter(i => i.id !== item.id))}><Trash2 size={16}/></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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

          <TabsContent value="ticker">
             <Card className="rounded-brand shadow-md">
                <CardContent className="p-8 space-y-4">
                  <Input placeholder="Breaking Headline" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                  <Textarea placeholder="News Content" value={newsForm.text} onChange={e => setNewsForm({...newsForm, text: e.target.value})} />
                  <Button onClick={() => setNewsItems([{ id: `n_${Date.now()}`, ...newsForm, isActive: true, createdAt: new Date().toISOString() }, ...newsItems])} className="bg-primary px-10 h-12 rounded-full font-black">{isAr ? "نشر الخبر عاجلاً" : "Publish Urgent News"}</Button>
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
