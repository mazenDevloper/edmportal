'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Service, SiteConfig, MenuItem, CarouselItem, ServiceApplication, Survey, CustomPage, PopupMessage, ServiceFlow } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, Loader2, 
  CloudUpload, Star, Layout, Menu, 
  PenTool, Database, ShieldAlert,
  Edit2, FileText, Eye, Wrench, ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);

  // Master List for Seeding
  const MASTER_SERVICES_DATA = [
    { id: "svc_100", titleAr: "ترخيص إقامة عرض ترويجي للسيارات", titleEn: "Car Promotion License", icon: "Car", cat: "invest", reqAr: ["رسالة الشركة وتحديد الموقع", "السجل التجاري"] },
    { id: "svc_101", titleAr: "تصديق مسارات تمديدات الكهرباء", titleEn: "Electricity Route Certification", icon: "Zap", cat: "elec", reqAr: ["الرسم المساحي والملكية", "اعتماد شركة الكهرباء"] },
    { id: "svc_102", titleAr: "تصاريح ناقلات مياه الصرف الصحي", titleEn: "Sewage Tanker Permit", icon: "Truck", cat: "health", reqAr: ["البطاقة الشخصية", "السجل التجاري", "ملكية الشاحنة"] },
    { id: "svc_103", titleAr: "اعتماد إعلانات المطبوعات والملصقات", titleEn: "Ads & Publications Approval", icon: "FileImage", cat: "invest", reqAr: ["صورة من المطبوعات", "موافقة وزارة الإعلام"] },
    { id: "svc_104", titleAr: "فعالية أو معرض خلال موسم الخريف", titleEn: "Khareef Event Request", icon: "Tent", cat: "invest", reqAr: ["السجل التجاري", "مخطط توضيحي"] },
    { id: "svc_105", titleAr: "تسجيل طلبات المراجعين", titleEn: "Visitor Request Registration", icon: "UserPlus", cat: "admin", reqAr: ["تفاصيل المراجعة"] },
    { id: "svc_106", titleAr: "تصديق تمديدات الصرف الصحي", titleEn: "Sewage Connection Approval", icon: "Droplets", cat: "tech", reqAr: ["خطاب المقاول", "اعتمادات الجهات المختصة"] },
    { id: "svc_107", titleAr: "تصديق الرصف بالبلاط المتشابك", titleEn: "Interlock Paving Approval", icon: "Grid3X3", cat: "tech", reqAr: ["البطاقة الشخصية", "ملكية المنزل"] },
    { id: "svc_108", titleAr: "ترقيم المنازل", titleEn: "House Numbering", icon: "Hash", cat: "admin", reqAr: ["ملكية المنزل", "الرسم المساحي"] },
    { id: "svc_109", titleAr: "ترخيص تسمية المباني", titleEn: "Building Naming Permit", icon: "Type", cat: "admin", reqAr: ["ملكية المبنى", "البطاقة الشخصية"] },
    { id: "svc_110", titleAr: "ترخيص اللوحات الإرشادية", titleEn: "Guidance Signs Permit", icon: "SignpostBig", cat: "invest", reqAr: ["الترخيص البلدي", "السجل التجاري"] },
    { id: "svc_111", titleAr: "إدارة استثمار موقع", titleEn: "Site Investment Management", icon: "Landmark", cat: "invest", reqAr: ["خطاب المنشأة", "مخطط كروكي تفصيلي"] },
    { id: "svc_112", titleAr: "استلام مركبة محجوزة", titleEn: "Impounded Vehicle Release", icon: "Lock", cat: "admin", reqAr: ["ملكية السيارة", "البطاقة الشخصية"] },
    { id: "svc_113", titleAr: "تصريح قطع أو ثقب الطريق", titleEn: "Road Cutting Permit", icon: "Construction", cat: "tech", reqAr: ["ملكية الأرض", "رسالة رسمية"] },
    { id: "svc_114", titleAr: "اعتماد النسخ الإضافية من الخرائط", titleEn: "Extra Maps Approval", icon: "Map", cat: "tech", reqAr: ["البطاقة الشخصية", "رخصة البناء"] },
    { id: "svc_115", titleAr: "التصديق على مخططات إنارة الطرق", titleEn: "Street Lighting Design Approval", icon: "Lightbulb", cat: "tech", reqAr: ["المخطط الهندسي"] },
    { id: "svc_116", titleAr: "ترخيص مظلات مواقف السيارات", titleEn: "Parking Shade Permit", icon: "Umbrella", cat: "tech", reqAr: ["صور الكروكي", "الملكية"] },
    { id: "svc_117", titleAr: "تقييم أضرار مادية مرورية", titleEn: "Traffic Damage Assessment", icon: "ShieldAlert", cat: "admin", reqAr: ["تقرير الشرطة"] },
    { id: "svc_118", titleAr: "ذبح حيوانات بالمسلخ المركزي", titleEn: "Slaughterhouse Request", icon: "Utensils", cat: "health", reqAr: ["استمارة الاستلام"] },
    { id: "svc_119", titleAr: "شهادة إتلاف مواد", titleEn: "Materials Destruction Certificate", icon: "Trash2", cat: "health", reqAr: ["رسالة الشركة", "تفاصيل المواد"] },
    { id: "svc_120", titleAr: "إزالة مركبات مهملة", titleEn: "Abandoned Vehicle Removal", icon: "Truck", cat: "health", reqAr: ["صور الموقع", "البطاقة الشخصية"] },
    { id: "svc_121", titleAr: "تنظيم الأسواق التخصصية", titleEn: "Specialized Market Org Approval", icon: "Store", cat: "invest", reqAr: ["تصور الفكرة", "السجل التجاري"] },
    { id: "svc_122", titleAr: "إقامة عروض عالمية", titleEn: "International Show Approval", icon: "Globe", cat: "invest", reqAr: ["موافقات الجهات"] },
    { id: "svc_123", titleAr: "عروض الإضاءة والإبهار", titleEn: "Lighting Show Approval", icon: "Sparkles", cat: "invest", reqAr: ["تفاصيل العرض"] },
    { id: "svc_124", titleAr: "صرف فواتير المقاولين", titleEn: "Contractor Invoice Payment", icon: "Receipt", cat: "admin", reqAr: ["الفواتير المعتمدة"] },
    { id: "svc_125", titleAr: "تجديد تصريح قطع الطريق", titleEn: "Road Cut Permit Renewal", icon: "RefreshCw", cat: "tech", reqAr: ["التصريح السابق"] },
    { id: "svc_126", titleAr: "فحص عينة مخبرية", titleEn: "Lab Sample Testing Request", icon: "FlaskConical", cat: "health", reqAr: ["بيانات العينة"] },
    { id: "svc_127", titleAr: "تدريب طلاب التعليم العالي", titleEn: "Student Training Request", icon: "GraduationCap", cat: "admin", reqAr: ["رسالة المؤسسة التعليمية"] },
    { id: "svc_128", titleAr: "طلب توفيق ومصالحة", titleEn: "Reconciliation Request", icon: "Handshake", cat: "admin", reqAr: ["البطاقة الشخصية", "بيانات الدعوى"] }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = data.services || [];
          const fetchedFlows = data.serviceFlows || [];
          
          // Data Reconciliation: Ensuring all flows have service entries
          const allServiceIds = new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ]);

          const combinedServices = Array.from(allServiceIds).map(id => {
            const existingSvc = fetchedServices.find((s: any) => s.id === id);
            if (existingSvc) return existingSvc;
            
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            const master = MASTER_SERVICES_DATA.find(m => m.id === id);
            
            return {
              id,
              title: flow?.titleAr || master?.titleAr || 'Untitled Service',
              titleEn: flow?.titleEn || master?.titleEn || '',
              description: 'خدمة رقمية مقدمة من بلدية ظفار.',
              category: master?.cat || 'elec',
              iconName: master?.icon || 'FileText',
              isActive: true,
              reqsAr: master?.reqAr || [],
              reqsEn: [],
              fees: '10 OMR',
              type: 'workflow'
            } as Service;
          });

          setServices(combinedServices);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setPopups(data.popups || []);
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load database.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      await updateBin({
        ...db,
        services, siteConfig, menuItems, carouselItems, surveys, customPages, popups
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedMasterData = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const currentServices = [...(db.services || [])];
      const currentFlows = [...(db.serviceFlows || [])];

      MASTER_SERVICES_DATA.forEach(master => {
        // 1. Check/Add Service Metadata
        if (!currentServices.some(s => s.id === master.id)) {
          currentServices.push({
            id: master.id,
            title: master.titleAr,
            titleEn: master.titleEn,
            description: `خدمة رقمية رسمية لـ ${master.titleAr}.`,
            iconName: master.icon,
            category: master.cat,
            isActive: true,
            reqsAr: master.reqAr,
            reqsEn: master.reqAr.map(r => `Document for ${r}`),
            fees: "10 OMR",
            type: "workflow"
          });
        }

        // 2. Check/Add Workflow Flow
        if (!currentFlows.some(f => (f.serviceId || f.id) === master.id)) {
          currentFlows.push({
            id: master.id,
            serviceId: master.id,
            titleAr: master.titleAr,
            titleEn: master.titleEn,
            isActive: true,
            steps: [
              {
                id: `step_${master.id}_initial`,
                titleAr: "المستندات المطلوبة",
                titleEn: "Required Documents",
                fields: master.reqAr.map((r, i) => ({
                  id: `f_${master.id}_${i}`,
                  type: "upload",
                  labelAr: r,
                  labelEn: `Upload ${r}`,
                  required: true
                })),
                actionType: "submit"
              }
            ]
          });
        }
      });

      await updateBin({
        ...db,
        services: currentServices,
        serviceFlows: currentFlows
      });

      toast({ title: "Success", description: "All master services seeded successfully." });
      window.location.reload();
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
           <div>
             <h1 className="text-3xl font-black text-primary flex items-center gap-3">
               <Settings className="h-8 w-8 text-accent" /> {isAr ? "لوحة الإدارة الشاملة" : "Portal Admin"}
             </h1>
             <p className="text-slate-400 font-bold mt-1">{isAr ? "تحكم كامل بمحتوى البوابة والخدمات والربط" : "Full control over portal content & services"}</p>
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
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-2 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="services" className="font-black"><Layout className="size-4 ml-2" /> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="maintenance" className="font-black"><Wrench className="size-4 ml-2" /> {isAr ? "الصيانة" : "Maintenance"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "دليل الخدمات (الإجمالي: " + services.length + ")" : "Service Catalog (" + services.length + ")"}</h3>
                <Button size="sm" asChild className="rounded-full dm-gradient-primary font-black">
                  <Link href="/servicebuild"><Plus size={14} className="ml-2"/> {isAr ? "إضافة خدمة" : "Add Service"}</Link>
                </Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>{isAr ? "المعرف" : "ID"}</TableHead>
                      <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.sort((a,b) => a.id.localeCompare(b.id)).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-[10px] text-slate-400">{s.id}</TableCell>
                        <TableCell className="font-bold">{isAr ? s.title : (s.titleEn || s.title)}</TableCell>
                        <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                        <TableCell className="flex gap-2">
                           <Button variant="ghost" size="icon" asChild className="text-primary" title={isAr ? "تعديل التدفق" : "Edit Workflow"}><Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link></Button>
                           <Button variant="ghost" size="icon" asChild className="text-accent" title={isAr ? "معاينة" : "Preview"}><Link href={`/services/${s.id}`}><Eye size={16}/></Link></Button>
                           <Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400" title={isAr ? "حذف" : "Delete"}><Trash2 size={16}/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
             <Card className="rounded-brand border-none shadow-xl overflow-hidden border-t-8 border-amber-500">
               <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-black">{isAr ? "إجراءات صيانة البيانات" : "Data Maintenance"}</CardTitle></CardHeader>
               <CardContent className="p-8 space-y-6">
                 <div className="flex items-start gap-6 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <ShieldAlert className="text-amber-500 shrink-0" size={32} />
                    <div className="space-y-2">
                       <h4 className="font-black text-primary">{isAr ? "تثبيت خدمات MASTER (svc_100 - svc_128)" : "Seed Master Services"}</h4>
                       <p className="text-sm text-slate-500 font-medium">{isAr ? "سيقوم هذا الإجراء بإعادة إضافة كافة الخدمات البلدية الرسمية المفقودة إلى قاعدة بياناتك." : "This will ensure all 29 master services are present in your database."}</p>
                       <Button onClick={handleSeedMasterData} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-black mt-4">
                         {saving ? <Loader2 className="animate-spin ml-2" /> : <Database className="ml-2" />}
                         {isAr ? "بدء عملية التثبيت" : "Start Seeding Process"}
                       </Button>
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
