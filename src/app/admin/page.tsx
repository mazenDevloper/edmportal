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

  // Comprehensive Master List matching user English Titles
  const MASTER_SERVICES_DATA = [
    { id: "svc_100", titleAr: "ترخيص إقامة عرض ترويجي للسيارات", titleEn: "Get a Permit for Organizing a Promotional Car Event", icon: "Car", cat: "invest", reqAr: ["رسالة الشركة وتحديد الموقع", "السجل التجاري"] },
    { id: "svc_101", titleAr: "تصديق مسارات تمديدات الكهرباء", titleEn: "Get the Municipality's Approval for the Paths of Electrical Service Installations (Household Connections)", icon: "Zap", cat: "elec", reqAr: ["الرسم المساحي والملكية", "اعتماد شركة الكهرباء"] },
    { id: "svc_102", titleAr: "تصاريح ناقلات مياه الصرف الصحي", titleEn: "Get a Permit for a Sewage Tanker", icon: "Truck", cat: "health", reqAr: ["البطاقة الشخصية", "السجل التجاري", "ملكية الشاحنة"] },
    { id: "svc_103", titleAr: "اعتماد إعلانات المطبوعات والملصقات", titleEn: "Get Approval of Print Advertisements, Posters, and Publications Service", icon: "FileImage", cat: "invest", reqAr: ["صورة من المطبوعات", "موافقة وزارة الإعلام"] },
    { id: "svc_104", titleAr: "فعالية أو معرض خلال موسم الخريف", titleEn: "Request to Hold an Activity, Event or Exhibition During the Fall Season", icon: "Tent", cat: "invest", reqAr: ["السجل التجاري", "البطاقة الشخصية", "مخطط توضيحي", "مخطط هندسي"] },
    { id: "svc_105", titleAr: "تسجيل طلبات المراجعين", titleEn: "Registration of Citizens' Requests at Dhofar Municipality", icon: "UserPlus", cat: "admin", reqAr: ["تفاصيل المراجعة"] },
    { id: "svc_106", titleAr: "تصديق تمديدات الصرف الصحي", titleEn: "Get Municipal Approval for Sanitary Sewer Service Extensions (Household Connections)", icon: "Droplets", cat: "tech", reqAr: ["خطاب المقاول", "اعتمادات الجهات المختصة"] },
    { id: "svc_107", titleAr: "تصديق الرصف بالبلاط المتشابك", titleEn: "Application for obtaining the Municipality's approval for paving with interlocking tiles in front of houses.", icon: "Grid3X3", cat: "tech", reqAr: ["البطاقة الشخصية", "ملكية المنزل"] },
    { id: "svc_108", titleAr: "ترقيم المنازل", titleEn: "Get House Numbering", icon: "Hash", cat: "admin", reqAr: ["ملكية المنزل", "الرسم المساحي"] },
    { id: "svc_109", titleAr: "ترخيص تسمية المباني", titleEn: "Building Naming License", icon: "Type", cat: "admin", reqAr: ["ملكية المبنى", "البطاقة الشخصية", "عقد استثمار"] },
    { id: "svc_110", titleAr: "ترخيص اللوحات الإرشادية", titleEn: "Directional Signage Permit", icon: "SignpostBig", cat: "invest", reqAr: ["الترخيص البلدي", "السجل التجاري"] },
    { id: "svc_111", titleAr: "إدارة استثمار موقع", titleEn: "Manage Site Investment", icon: "Landmark", cat: "invest", reqAr: ["خطاب المنشأة", "مخطط كروكي تفصيلي"] },
    { id: "svc_112", titleAr: "استلام مركبة محجوزة", titleEn: "Receiving a Reserved Vehicle", icon: "Lock", cat: "admin", reqAr: ["ملكية السيارة", "البطاقة الشخصية"] },
    { id: "svc_113", titleAr: "تصريح قطع أو ثقب الطريق", titleEn: "Request Road Cutting or Perforation Permit", icon: "Construction", cat: "tech", reqAr: ["ملكية الأرض", "رسالة رسمية", "موافقة دائرة الطرق"] },
    { id: "svc_114", titleAr: "اعتماد النسخ الإضافية من الخرائط", titleEn: "Get Approval for Additional Copies of Maps", icon: "Map", cat: "tech", reqAr: ["البطاقة الشخصية", "رخصة البناء"] },
    { id: "svc_115", titleAr: "التصديق على مخططات إنارة الطرق", titleEn: "Request Road and Complex Lighting Plans Approval", icon: "Lightbulb", cat: "tech", reqAr: ["المخطط الهندسي"] },
    { id: "svc_116", titleAr: "ترخيص مظلات مواقف السيارات", titleEn: "License for the Installation of Car Park Shelters", icon: "Umbrella", cat: "tech", reqAr: ["صور الكروكي", "الملكية", "البطاقة الشخصية"] },
    { id: "svc_117", titleAr: "تقييم أضرار مادية مرورية", titleEn: "Request for Assessment of Material Damages (Traffic Accidents)", icon: "ShieldAlert", cat: "admin", reqAr: ["تقرير الشرطة"] },
    { id: "svc_118", titleAr: "ذبح حيوانات بالمسلخ المركزي", titleEn: "Request to Slaughter Animals at the Central Slaughterhouse", icon: "Utensils", cat: "health", reqAr: ["استمارة الاستلام", "إيصال ذبح"] },
    { id: "svc_119", titleAr: "شهادة إتلاف مواد", titleEn: "Material Destruction Certificate", icon: "Trash2", cat: "health", reqAr: ["رسالة الشركة", "تفاصيل المواد", "رسالة دائرة البيئة"] },
    { id: "svc_120", titleAr: "إزالة مركبات مهملة", titleEn: "Request the Removal of Abandoned and Long-Term Parked Vehicles in Public Areas", icon: "Truck", cat: "health", reqAr: ["صور الموقع", "البطاقة الشخصية", "طلب ورقي"] },
    { id: "svc_121", titleAr: "تنظيم الأسواق التخصصية", titleEn: "Get Approval for Organizing Temporary Specialized Markets", icon: "Store", cat: "invest", reqAr: ["تصور الفكرة", "السجل التجاري", "شهادة الدفاع المدني والاسعاف"] },
    { id: "svc_122", titleAr: "إقامة عروض عالمية", titleEn: "Get Approval to Organize International Shows", icon: "Globe", cat: "invest", reqAr: ["موافقات الجهات المختصة"] },
    { id: "svc_123", titleAr: "عروض الإضاءة والإبهار", titleEn: "Get Approval for Hosting Lightning and Visual Shows", icon: "Sparkles", cat: "invest", reqAr: ["تفاصيل العرض"] },
    { id: "svc_124", titleAr: "صرف فواتير المقاولين", titleEn: "Request for Payment of Contractors’ and Consulting Companies’ Invoices", icon: "Receipt", cat: "admin", reqAr: ["الفواتير المعتمدة"] },
    { id: "svc_125", titleAr: "تجديد تصريح قطع الطريق", titleEn: "Renewal of Cutting or Drilling Permit", icon: "RefreshCw", cat: "tech", reqAr: ["التصريح السابق"] },
    { id: "svc_126", titleAr: "فحص عينة مخبرية", titleEn: "Submit a Request for Laboratory Sample Testing (Food/ Water)", icon: "FlaskConical", cat: "health", reqAr: ["بيانات العينة"] },
    { id: "svc_127", titleAr: "تدريب طلاب التعليم العالي", titleEn: "Training Higher Education Institution Students", icon: "GraduationCap", cat: "admin", reqAr: ["رسالة المؤسسة التعليمية"] },
    { id: "svc_128", titleAr: "طلب توفيق ومصالحة", titleEn: "Reconciliation and Settlement Request", icon: "Handshake", cat: "admin", reqAr: ["البطاقة الشخصية", "بيانات الدعوى"] }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = (data.services || []).filter(Boolean);
          const fetchedFlows = (data.serviceFlows || []).filter(Boolean);
          
          // Data Reconciliation: Merge explicit services and implicit ones from flows
          const allServiceIds = Array.from(new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ])).filter(Boolean);

          const reconciledServices = allServiceIds.map(id => {
            const existing = fetchedServices.find((s: any) => s.id === id);
            if (existing) return existing;
            
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            const master = MASTER_SERVICES_DATA.find(m => m.id === id);
            
            return {
              id,
              title: flow?.titleAr || master?.titleAr || 'خدمة جديدة',
              titleEn: flow?.titleEn || master?.titleEn || '',
              description: isAr ? 'خدمة بلدية رقمية معتمدة.' : 'Approved digital municipal service.',
              category: master?.cat || 'elec',
              iconName: master?.icon || 'FileText',
              isActive: true,
              reqsAr: master?.reqAr || [],
              reqsEn: master?.reqAr?.map((r: string) => `Document: ${r}`) || [],
              fees: '10 OMR',
              type: 'workflow'
            } as Service;
          });

          setServices(reconciledServices);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setPopups(data.popups || []);
        }
      } catch (e) {
        console.error("Load Error:", e);
        toast({ title: "Error Loading Data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAr]);

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      await updateBin({
        ...db,
        services: services.filter(Boolean),
        siteConfig, 
        menuItems: (menuItems || []).filter(Boolean), 
        carouselItems: (carouselItems || []).filter(Boolean), 
        surveys: (surveys || []).filter(Boolean), 
        customPages: (customPages || []).filter(Boolean), 
        popups: (popups || []).filter(Boolean)
      });
      toast({ title: isAr ? "تم حفظ كافة التغييرات" : "All changes saved" });
    } catch (e) {
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedMasterData = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const currentServices = [...(db.services || [])].filter(Boolean);
      const currentFlows = [...(db.serviceFlows || [])].filter(Boolean);

      MASTER_SERVICES_DATA.forEach(master => {
        // 1. Reconcile Service Definition
        const existingSvcIdx = currentServices.findIndex(s => s.id === master.id);
        const svcData: Service = {
          id: master.id,
          title: master.titleAr,
          titleEn: master.titleEn,
          description: isAr ? `خدمة رقمية معتمدة لـ ${master.titleAr}.` : `Certified digital service for ${master.titleEn}.`,
          iconName: master.icon,
          category: master.cat,
          isActive: true,
          reqsAr: master.reqAr,
          reqsEn: master.reqAr.map(r => `Required: ${r}`),
          fees: "10 OMR",
          type: "workflow"
        };

        if (existingSvcIdx > -1) {
          currentServices[existingSvcIdx] = { ...currentServices[existingSvcIdx], ...svcData };
        } else {
          currentServices.push(svcData);
        }

        // 2. Reconcile Workflow Flow
        const existingFlowIdx = currentFlows.findIndex(f => (f.serviceId || f.id) === master.id);
        if (existingFlowIdx === -1) {
          currentFlows.push({
            id: master.id,
            serviceId: master.id,
            titleAr: master.titleAr,
            titleEn: master.titleEn,
            isActive: true,
            steps: [
              {
                id: `step_${master.id}_main`,
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
        } else {
           currentFlows[existingFlowIdx].titleAr = master.titleAr;
           currentFlows[existingFlowIdx].titleEn = master.titleEn;
        }
      });

      await updateBin({
        ...db,
        services: currentServices,
        serviceFlows: currentFlows
      });

      toast({ title: isAr ? "تم التثبيت" : "Success", description: isAr ? "تم تحديث كافة خدمات MASTER." : "All 29 master services updated." });
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
                    {services.sort((a,b) => (a.id || '').localeCompare(b.id || '')).map((s) => (
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
                       <h4 className="font-black text-primary">{isAr ? "مزامنة خدمات MASTER مع المسميات الرسمية" : "Sync Master Services with Official Titles"}</h4>
                       <p className="text-sm text-slate-500 font-medium">{isAr ? "سيقوم هذا الإجراء بتحديث كافة الخدمات الـ 29 بمسمياتها الإنجليزية الرسمية وأيقوناتها المعتمدة." : "This will sync all 29 master services with their official English titles and icons."}</p>
                       <Button onClick={handleSeedMasterData} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-black mt-4">
                         {saving ? <Loader2 className="animate-spin ml-2" /> : <Database className="ml-2" />}
                         {isAr ? "بدء عملية المزامنة" : "Start Sync Process"}
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
