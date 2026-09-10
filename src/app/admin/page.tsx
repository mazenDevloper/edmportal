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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [footerSections, setFooterSections] = useState<FooterSection[]>([]);
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
          setFooterSections(data.footerSections || []);
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
        footerSections,
        carouselItems
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تمت المزامنة بنجاح" : "Synced successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = () => {
    if (!menuForm.labelAr || !menuForm.link) return;
    const item: MenuItem = { id: `menu_${Date.now()}`, ...menuForm, order: menuItems.length };
    setMenuItems([...menuItems, item]);
    setMenuForm({ labelAr: '', labelEn: '', link: '' });
  };

  const addCarouselItem = () => {
    if (!carouselForm.titleAr || !carouselForm.imageUrl) return;
    const item: CarouselItem = { id: `carousel_${Date.now()}`, ...carouselForm };
    setCarouselItems([...carouselItems, item]);
    setCarouselForm({ titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: '', linkUrl: '' });
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <header className="flex justify-between items-center mb-10">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3">
             <Settings className="h-8 w-8 text-accent" /> {isAr ? "لوحة الإدارة الشاملة" : "Portal Admin"}
           </h1>
           <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-xl">
             {saving ? <Loader2 className="animate-spin ml-2" /> : <CloudUpload className="ml-2" />}
             {isAr ? "حفظ ومزامنة" : "Save & Sync"}
           </Button>
        </header>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-2 p-1 rounded-xl">
            <TabsTrigger value="services">{isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="site">{isAr ? "الإعدادات" : "Config"}</TabsTrigger>
            <TabsTrigger value="nav">{isAr ? "القوائم والبواحث" : "Navigation"}</TabsTrigger>
            <TabsTrigger value="ticker">{isAr ? "الأخبار" : "News"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-brand shadow-lg">
                <CardHeader><CardTitle className="text-lg font-black">{isAr ? "إدارة الخدمة" : "Service Editor"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Service AR" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                  <Input placeholder="Service EN" value={newService.titleEn} onChange={e => setNewService({...newService, titleEn: e.target.value})} />
                  <Textarea placeholder="Desc" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  <Input placeholder="Link URL" value={newService.linkUrl} onChange={e => setNewService({...newService, linkUrl: e.target.value})} />
                  <Button onClick={saveService} className="w-full bg-slate-900">{isAr ? "حفظ الخدمة" : "Save Service"}</Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 rounded-brand shadow-md">
                <CardContent className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services.map(s => (
                      <div key={s.id} className="p-4 border rounded-xl bg-white flex justify-between items-center">
                        <div>
                          <p className="font-bold">{isAr ? s.title : s.titleEn}</p>
                          <p className="text-xs text-slate-400">{s.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setNewService(s)}><Edit3 size={16}/></Button>
                          <Trash2 className="text-red-500 cursor-pointer" onClick={() => setServices(services.filter(x => x.id !== s.id))} />
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
              <Card className="rounded-brand shadow-md">
                <CardHeader><CardTitle className="flex items-center gap-2"><Menu/> {isAr ? "القائمة العلوية" : "Top Menu"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Label AR" value={menuForm.labelAr} onChange={e => setMenuForm({...menuForm, labelAr: e.target.value})} />
                  <Input placeholder="Label EN" value={menuForm.labelEn} onChange={e => setMenuForm({...menuForm, labelEn: e.target.value})} />
                  <Input placeholder="Link" value={menuForm.link} onChange={e => setMenuForm({...menuForm, link: e.target.value})} />
                  <Button onClick={addMenuItem} className="w-full bg-accent">{isAr ? "إضافة للقائمة" : "Add to Menu"}</Button>
                  <div className="space-y-2 mt-4">
                    {menuItems.map(item => (
                      <div key={item.id} className="flex justify-between p-3 border rounded-lg bg-white">
                        <span className="text-sm font-bold">{item.labelAr}</span>
                        <Trash2 className="text-red-400 size-4 cursor-pointer" onClick={() => setMenuItems(menuItems.filter(i => i.id !== item.id))} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-brand shadow-md">
                <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon/> {isAr ? "الشرائح المتحركة" : "Carousel Slider"}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Title AR" value={carouselForm.titleAr} onChange={e => setCarouselForm({...carouselForm, titleAr: e.target.value})} />
                  <Input placeholder="Image URL" value={carouselForm.imageUrl} onChange={e => setCarouselForm({...carouselForm, imageUrl: e.target.value})} />
                  <Button onClick={addCarouselItem} className="w-full bg-secondary">{isAr ? "إضافة شريحة" : "Add Slide"}</Button>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {carouselItems.map(item => (
                      <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden border">
                        <img src={item.imageUrl} className="object-cover w-full h-full" alt="" />
                        <button onClick={() => setCarouselItems(carouselItems.filter(i => i.id !== item.id))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="site">
            <Card className="rounded-brand shadow-md">
              <CardContent className="p-8 space-y-6">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">{isAr ? "عنوان البطل" : "Hero Title"}</label>
                      <Input value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">{isAr ? "وصف البطل" : "Hero Subtitle"}</label>
                      <Input value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticker">
             <Card className="rounded-brand shadow-md">
                <CardContent className="p-8 space-y-4">
                  <Input placeholder="Headline" value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} />
                  <Textarea placeholder="Content" value={newsForm.text} onChange={e => setNewsForm({...newsForm, text: e.target.value})} />
                  <Button onClick={() => setNewsItems([{ id: `n_${Date.now()}`, ...newsForm, isActive: true, createdAt: new Date().toISOString() }, ...newsItems])} className="bg-primary">{isAr ? "نشر الخبر" : "Publish"}</Button>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
