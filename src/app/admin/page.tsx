'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  CloudUpload, Star, Layout, Menu, Image as ImageIcon,
  PenTool, Database, ShieldAlert,
  ClipboardList, Edit2, FileText, Eye, X, Link as LinkIcon, Bell, ShieldCheck, Share2, Wrench
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
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    heroTitle: '', heroSubtitle: '', contactPhone: '', contactEmail: '',
    categories: ['building', 'health', 'invest', 'tech', 'elec'], isMaintenanceMode: false,
    stats: { transactions: 0, permits: 0, contracts: 0, tickets: 0 },
    footerLinks: [],
    integrations: {},
    meta: { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '' }
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  const standardPages = [
    { slug: 'privacy', titleAr: 'السياسة والخصوصية', titleEn: 'Privacy Policy' },
    { slug: 'terms', titleAr: 'الشروط والأحكام', titleEn: 'Terms & Conditions' },
    { slug: 'faqs', titleAr: 'الأسئلة الشائعة', titleEn: 'FAQs' },
    { slug: 'sla', titleAr: 'اتفاقية مستوى الخدمة', titleEn: 'SLA' },
    { slug: 'access-controls', titleAr: 'ضوابط النفاذ', titleEn: 'Access Controls' },
    { slug: 'open-data', titleAr: 'البيانات المفتوحة', titleEn: 'Open Data' }
  ];

  const MASTER_SEED_FLOWS: ServiceFlow[] = [
    { id: "svc_100", serviceId: "svc_100", titleAr: "ترخيص إقامة عرض ترويجي للسيارات", titleEn: "Car Promotion License", steps: [{ id: "step_cddab337", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_4ce0c925", type: "upload", labelAr: "رسالة من الشركة بتحديد الموقع ورساله من شرطة عمان السلطانية", labelEn: "Police & Company Letter", required: true }, { id: "field_bf7a3cad", type: "upload", labelAr: "السجل التجاري", labelEn: "Commercial CR", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_101", serviceId: "svc_101", titleAr: "تصديق البلدية لمسارات تمديدات الكهرباء", titleEn: "Electricity Route Certification", steps: [{ id: "step_c4ebe0c4", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_d90a135b", type: "upload", labelAr: "الرسم المساحي والملكية", labelEn: "Kroki & Title Deed", required: true }, { id: "field_d7cc82e1", type: "text", labelAr: "اعتماد من شركة الكهرباء", labelEn: "Utility Approval", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_102", serviceId: "svc_102", titleAr: "إصدار تصاريح ناقلات صهاريج مياة الصرف الصحي", titleEn: "Sewage Tanker Permit", steps: [{ id: "step_6df503ff", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_1b593103", type: "upload", labelAr: "البطاقة الشخصية", labelEn: "ID Card", required: true }, { id: "field_ffffefce", type: "upload", labelAr: "السجل التجاري", labelEn: "Commercial Register", required: true }, { id: "field_5a9ca123", type: "upload", labelAr: "ملكية الشاحنة", labelEn: "Truck Ownership", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_103", serviceId: "svc_103", titleAr: "اعتماد إعلانات المطبوعات و الملصقات والمنشورات", titleEn: "Publications & Ads Approval", steps: [{ id: "step_4ac0a785", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_ce109215", type: "text", labelAr: "صورة أصلية من المطبوعات + موافقة وزارة الإعلام", labelEn: "Original Sample & Media License", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_104", serviceId: "svc_104", titleAr: "طلب إقامة منشط أو فعالية خلال موسم الخريف", titleEn: "Khareef Event Request", steps: [{ id: "step_28185a70", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_a08cdeb5", type: "upload", labelAr: "السجل التجاري", labelEn: "CR Copy", required: true }, { id: "field_27512e3b", type: "text", labelAr: "مخطط توضيحي", labelEn: "Event Layout", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_105", serviceId: "svc_105", titleAr: "تسجيل طلبات المراجعين في بلدية ظفار", titleEn: "Visitor Request Registration", steps: [{ id: "step_824f6bbc", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_cc895ed6", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_106", serviceId: "svc_106", titleAr: "تصديق البلدية لتمديدات خدمات الصرف الصحي", titleEn: "Sewage Connection Approval", steps: [{ id: "step_bb28b752", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_e9c8c693", type: "upload", labelAr: "خطاب المقاول", labelEn: "Contractor Letter", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_107", serviceId: "svc_107", titleAr: "تصديق البلدية للرصف بالبلاط المتشابك", titleEn: "Interlock Paving Approval", steps: [{ id: "step_f19d7533", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_ae53a5f7", type: "upload", labelAr: "البطاقة الشخصية", labelEn: "ID Card", required: true }, { id: "field_cf9ea678", type: "upload", labelAr: "ملكية المنزل والرسم المساحي", labelEn: "Title Deed & Kroki", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_108", serviceId: "svc_108", titleAr: "ترقيم المنازل", titleEn: "House Numbering", steps: [{ id: "step_accd3b34", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_73caac80", type: "upload", labelAr: "ملكية المنزل", labelEn: "Deed", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_109", serviceId: "svc_109", titleAr: "ترخيص تسمية المباني", titleEn: "Building Naming Permit", steps: [{ id: "step_5ba226a0", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_ef8c3830", type: "upload", labelAr: "ملكية المبنى او الكروكي", labelEn: "Building Kroki", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_110", serviceId: "svc_110", titleAr: "ترخيص اللوحات الإرشادية", titleEn: "Guidance Signs Permit", steps: [{ id: "step_f4209ccd", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_95e07499", type: "text", labelAr: "الترخيص البلدي", labelEn: "Municipal License", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_111", serviceId: "svc_111", titleAr: "إدارة استثمار موقع", titleEn: "Site Investment Management", steps: [{ id: "step_2328a242", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_be725821", type: "upload", labelAr: "خطاب المنشأة + مخطط المشروع", labelEn: "Proposal & Layout", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_112", serviceId: "svc_112", titleAr: "استلام مركبة محجوزة", titleEn: "Impounded Vehicle Release", steps: [{ id: "step_1f606b52", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_41bbcd22", type: "upload", labelAr: "ملكية السيارة", labelEn: "Ownership", required: true }, { id: "field_7bb3f18d", type: "upload", labelAr: "بطاقة شخصية", labelEn: "ID Card", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_113", serviceId: "svc_113", titleAr: "طلب تصريح قطع أو ثقب الطريق", titleEn: "Road Cutting Permit", steps: [{ id: "step_0460ea0a", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_60758d7e", type: "upload", labelAr: "ملكية الأرض/كروكي", labelEn: "Title Kroki", required: true }, { id: "field_ae2ef16c", type: "upload", labelAr: "رسالة رسمية", labelEn: "Official Letter", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_114", serviceId: "svc_114", titleAr: "طلب اعتماد النسخ الإضافية من الخرائط", titleEn: "Extra Maps Approval", steps: [{ id: "step_e9731641", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_98a8d5c3", type: "upload", labelAr: "البطاقة الشخصية للمالك", labelEn: "Owner ID", required: true }, { id: "field_82b0b730", type: "text", labelAr: "رخصة البناء", labelEn: "Building Permit", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_115", serviceId: "svc_115", titleAr: "طلب التصديق على مخططات إنارة الطرق", titleEn: "Street Lighting Design Approval", steps: [{ id: "step_ca244141", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_6a078d75", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_116", serviceId: "svc_116", titleAr: "ترخيص عمل مظلات لموقف السيارات", titleEn: "Parking Shade Permit", steps: [{ id: "step_fe49117f", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_8af31380", type: "upload", labelAr: "الملكية", labelEn: "Ownership", required: true }, { id: "field_581b0eb8", type: "upload", labelAr: "البطاقة الشخصية", labelEn: "ID Card", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_117", serviceId: "svc_117", titleAr: "طلب تقييم أضرار مادية (حوادث مرورية)", titleEn: "Traffic Damage Assessment", steps: [{ id: "step_5b62f706", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_9d5749c2", type: "upload", labelAr: "تقرير من شرطة عمان السلطانية", labelEn: "Police Report", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_118", serviceId: "svc_118", titleAr: "طلب ذبح حيوانات بالمسلخ المركزي", titleEn: "Slaughterhouse Request", steps: [{ id: "step_d559923c", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_35013409", type: "text", labelAr: "إستمارة استلام ذبائح", labelEn: "Receiving Form", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_119", serviceId: "svc_119", titleAr: "شهادة إتلاف مواد", titleEn: "Materials Destruction Certificate", steps: [{ id: "step_d696403c", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_0f07e79f", type: "upload", labelAr: "رسالة من الشركة", labelEn: "Company Request", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_120", serviceId: "svc_120", titleAr: "طلب إزالة مركبات مهملة", titleEn: "Abandoned Vehicle Removal", steps: [{ id: "step_769a28c5", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_bd1a452d", type: "upload", labelAr: "البطاقة الشخصية وصور من الموقع", labelEn: "ID & Photos", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_121", serviceId: "svc_121", titleAr: "الموافقة على تنظيم الأسواق التخصصية", titleEn: "Specialized Market Org Approval", steps: [{ id: "step_bb3193d8", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_a0399d39", type: "upload", labelAr: "نسخة من البطاقة الشخصية", labelEn: "ID Card Copy", required: true }, { id: "field_bbbda41e", type: "upload", labelAr: "رسالة عدم ممانعة من التجارة", labelEn: "MOCI Approval", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_122", serviceId: "svc_122", titleAr: "الموافقة على إقامة عروض عالمية", titleEn: "International Show Approval", steps: [{ id: "step_91263d7f", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_abb92c95", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_123", serviceId: "svc_123", titleAr: "الموافقة على إقامة عروض الإضاءة والإبهار", titleEn: "Lighting Show Approval", steps: [{ id: "step_f14c8bd7", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_18e1be4d", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_124", serviceId: "svc_124", titleAr: "طلب صرف فواتير المقاولين", titleEn: "Contractor Invoice Payment Request", steps: [{ id: "step_53647ae0", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_6b0702e5", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_125", serviceId: "svc_125", titleAr: "تجديد تصريح قطع أو ثقب", titleEn: "Road Cut Permit Renewal", steps: [{ id: "step_ab122cf1", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_956fd781", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_126", serviceId: "svc_126", titleAr: "طلب فحص عينة مخبرية", titleEn: "Lab Sample Testing Request", steps: [{ id: "step_732ac245", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_dcac8f16", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_127", serviceId: "svc_127", titleAr: "تدريب طلاب مؤسسات التعليم العالي", titleEn: "Student Training Request", steps: [{ id: "step_e3097c8b", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_25c333f1", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true },
    { id: "svc_128", serviceId: "svc_128", titleAr: "طلب توفيق ومصالحة", titleEn: "Reconciliation Request", steps: [{ id: "step_b89d73b8", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", fields: [{ id: "field_6a24b891", type: "text", labelAr: "ملاحظات", labelEn: "Notes", required: true }], actionType: "submit" }], isActive: true }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = data.services || [];
          const fetchedFlows = data.serviceFlows || [];
          
          // Data Reconciliation: ensure services and flows stay in sync
          const allServiceIds = new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ]);

          const combinedServices = Array.from(allServiceIds).map(id => {
            const existingSvc = fetchedServices.find((s: any) => s.id === id);
            if (existingSvc) return {
              ...existingSvc,
              title: existingSvc.title || existingSvc.titleAr || 'Untitled',
              reqsAr: existingSvc.reqsAr || [],
              reqsEn: existingSvc.reqsEn || []
            };
            
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            return {
              id,
              title: flow?.titleAr || flow?.title || 'Untitled Service',
              titleEn: flow?.titleEn || '',
              description: 'Generated from workflow data',
              category: 'elec',
              iconName: 'FileText',
              isActive: true,
              reqsAr: [],
              reqsEn: [],
              fees: '0 OMR',
              type: 'workflow'
            } as Service;
          });

          setServices(combinedServices);
          setApplications(data.applications || []);
          setSiteConfig({
            ...siteConfig,
            ...data.siteConfig,
            integrations: data.siteConfig?.integrations || {},
            meta: data.siteConfig?.meta || { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '' }
          });
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setPopups(data.popups || []);
        }
      } catch (e) {
        console.error("Dashboard load error:", e);
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
      const db = await fetchBin();
      await updateBin({
        ...db,
        services, siteConfig, menuItems, carouselItems, surveys, customPages, popups
      });
      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تمت المزامنة بنجاح" : "Synced successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedMasterData = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const currentServices = db.services || [];
      const currentFlows = db.serviceFlows || [];

      // Logic to assign icons to seeded services
      const iconMap: Record<string, string> = {
        svc_100: "Car", svc_101: "Zap", svc_102: "Truck", svc_103: "FileImage", 
        svc_104: "Tent", svc_105: "UserPlus", svc_106: "Droplets", svc_107: "Grid3X3",
        svc_108: "Hash", svc_109: "Type", svc_110: "SignpostBig", svc_111: "Landmark",
        svc_112: "Lock", svc_113: "Construction", svc_114: "Map", svc_115: "Lightbulb",
        svc_116: "Umbrella", svc_117: "ShieldAlert", svc_118: "Utensils", svc_119: "Trash2",
        svc_120: "Truck", svc_121: "Store", svc_122: "Globe", svc_123: "Sparkles",
        svc_124: "Receipt", svc_125: "RefreshCw", svc_126: "FlaskConical", svc_127: "GraduationCap",
        svc_128: "Handshake"
      };

      const seededServices: Service[] = MASTER_SEED_FLOWS.map(flow => ({
        id: flow.id,
        title: flow.titleAr,
        titleEn: flow.titleEn,
        description: `خدمة رقمية مقدمة من بلدية ظفار لتسهيل إجراءات ${flow.titleAr}.`,
        iconName: iconMap[flow.id] || "FileText",
        category: flow.id.includes("111") ? "invest" : flow.id.includes("100") ? "invest" : "elec",
        isActive: true,
        reqsAr: flow.steps[0]?.fields.map(f => f.labelAr) || [],
        reqsEn: flow.steps[0]?.fields.map(f => f.labelEn) || [],
        fees: "10 OMR",
        type: "workflow"
      }));

      // Merge avoiding duplicates
      const finalServices = [...currentServices];
      seededServices.forEach(s => {
        if (!finalServices.some(fs => fs.id === s.id)) finalServices.push(s);
      });

      const finalFlows = [...currentFlows];
      MASTER_SEED_FLOWS.forEach(f => {
        if (!finalFlows.some(ff => ff.id === f.id)) finalFlows.push(f);
      });

      await updateBin({
        ...db,
        services: finalServices,
        serviceFlows: finalFlows
      });

      toast({ title: "Success", description: "Master services (svc_100 to svc_128) seeded successfully." });
      window.location.reload();
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed" });
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { id: `m_${Date.now()}`, labelAr: '', labelEn: '', link: '/', order: menuItems.length }]);
  };

  const addCarouselItem = () => {
    setCarouselItems([...carouselItems, { id: `c_${Date.now()}`, titleAr: '', titleEn: '', subtitleAr: '', subtitleEn: '', imageUrl: 'https://picsum.photos/seed/1/1200/600' }]);
  };

  const addFooterLink = () => {
    const newLinks = [...(siteConfig.footerLinks || []), {
      id: `fl_${Date.now()}`,
      labelAr: '',
      labelEn: '',
      link: '',
      category: 'legal' as const
    }];
    setSiteConfig({ ...siteConfig, footerLinks: newLinks });
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
             <p className="text-slate-400 font-bold mt-1">{isAr ? "تحكم كامل بمحتوى البوابة والخدمات والربط" : "Full control over portal content, services & integrations"}</p>
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
          <TabsList className="bg-white border mb-10 flex flex-wrap h-auto gap-2 p-1 rounded-xl shadow-sm overflow-x-auto">
            <TabsTrigger value="services" className="font-black"><Layout className="size-4 ml-2" /> {isAr ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="pages" className="font-black"><FileText className="size-4 ml-2" /> {isAr ? "الصفحات" : "Pages"}</TabsTrigger>
            <TabsTrigger value="menu" className="font-black"><Menu className="size-4 ml-2" /> {isAr ? "القائمة" : "Menu"}</TabsTrigger>
            <TabsTrigger value="site" className="font-black"><PenTool className="size-4 ml-2" /> {isAr ? "الموقع" : "Site"}</TabsTrigger>
            <TabsTrigger value="integrations" className="font-black"><ShieldCheck className="size-4 ml-2" /> {isAr ? "الربط" : "Integrations"}</TabsTrigger>
            <TabsTrigger value="maintenance" className="font-black"><Wrench className="size-4 ml-2" /> {isAr ? "الصيانة" : "Maintenance"}</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-primary">{isAr ? "دليل الخدمات" : "Service Catalog"}</h3>
                <Button size="sm" asChild className="rounded-full dm-gradient-primary font-black">
                  <Link href="/servicebuild"><Plus size={14} className="ml-2"/> {isAr ? "إضافة خدمة" : "Add Service"}</Link>
                </Button>
             </div>
             <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>{isAr ? "الخدمة" : "Service"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isAr ? "مميزة" : "Featured"}</TableHead>
                      <TableHead>{isAr ? "إجراء" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold">{isAr ? (s.title || s.titleAr) : (s.titleEn || s.title)}</TableCell>
                        <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                        <TableCell><Badge className="bg-slate-100 text-slate-600 border-none">{s.type || 'workflow'}</Badge></TableCell>
                        <TableCell>
                           <Button variant="ghost" size="icon" onClick={() => {
                             const ns = [...services]; ns[idx].isFeatured = !ns[idx].isFeatured; setServices(ns);
                           }}>
                             <Star className={cn("size-4", s.isFeatured ? "fill-accent text-accent" : "text-slate-200")} />
                           </Button>
                        </TableCell>
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
                       <p className="text-sm text-slate-500 font-medium">{isAr ? "سيقوم هذا الإجراء بإضافة كافة الخدمات البلدية الرسمية المفقودة إلى قاعدة بياناتك مع إعداداتها الكاملة." : "This will add all official municipal services missing from your database with full metadata."}</p>
                       <Button onClick={handleSeedMasterData} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-black mt-4">
                         {saving ? <Loader2 className="animate-spin ml-2" /> : <Database className="ml-2" />}
                         {isAr ? "بدء عملية التثبيت" : "Start Seeding Process"}
                       </Button>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          {/* ... other TabsContent remain the same as existing code ... */}
          <TabsContent value="pages" className="space-y-12">
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-primary">{isAr ? "صفحات النظام الأساسية" : "System Pages"}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {standardPages.map(p => {
                    const hasOverride = customPages.some(cp => cp.slug === p.slug);
                    return (
                      <Card key={p.slug} className="rounded-brand border shadow-sm group hover:shadow-lg transition-all border-dashed">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <Badge variant={hasOverride ? 'default' : 'outline'} className={cn("font-mono text-[9px]", hasOverride ? "bg-accent text-slate-900" : "")}>
                            {p.slug} {hasOverride && (isAr ? "(معدلة)" : "(Overridden)")}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/pagebuild?slug=${p.slug}`}><Edit2 size={12}/></Link></Button>
                            <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/${p.slug}`}><Eye size={12}/></Link></Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-black text-primary">{isAr ? p.titleAr : p.titleEn}</h4>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
