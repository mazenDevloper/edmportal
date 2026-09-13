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

  // Full Master List 100-186
  const MASTER_SERVICES_DATA = [
    { id: "svc_100", titleAr: "طلب رسالة عدم ممانعة لتوصيل تيار كهربائي مؤقت", titleEn: "Request for Approval Letter for Temporary Electrical Connection", icon: "Zap", cat: "elec" },
    { id: "svc_101", titleAr: "طلب سيارة نقل موتى", titleEn: "Request for Funeral Vehicle", icon: "Truck", cat: "admin" },
    { id: "svc_102", titleAr: "تقديم طلب شهادة دفن", titleEn: "Submit a Request for a Burial Certificate", icon: "FileText", cat: "admin" },
    { id: "svc_103", titleAr: "مكافحة الحشرات والقوارض وآفات الصحة العامة", titleEn: "Control of Insects, Rodents, and Public Health Pests", icon: "Bug", cat: "health" },
    { id: "svc_104", titleAr: "ترخيص صهريج مياه صالحة للشرب", titleEn: "Get a License for a Potable Water Tanker", icon: "Droplets", cat: "health" },
    { id: "svc_105", titleAr: "ترخيص صهريج مياه غير صالحة للشرب", titleEn: "Get a License for a Non-Potable Water Tanker", icon: "Droplets", cat: "health" },
    { id: "svc_106", titleAr: "إقامة تنزيلات وعروض ترويجية", titleEn: "Holding Discounts and Promotions", icon: "Tag", cat: "invest" },
    { id: "svc_107", titleAr: "التصاريح المؤقتة لموسم الخريف", titleEn: "Temporary Permits for Khareef Season", icon: "Tent", cat: "invest" },
    { id: "svc_108", titleAr: "ترخيص إقامة عرض ترويجي للسيارات", titleEn: "Get a Permit for Organizing a Promotional Car Event", icon: "Car", cat: "invest" },
    { id: "svc_109", titleAr: "الموافقة النهائية والترخيص بالحفر بمسارات تمديد الخدمات العامة", titleEn: "Get Final Approval and License for Excavation on Public Service Extension Routes", icon: "Pickaxe", cat: "tech" },
    { id: "svc_110", titleAr: "تصديق تمديدات خدمات الصرف الصحي (التوصيلات المنزلية)", titleEn: "Get Municipal Approval for Sanitary Sewer Service Extensions (Household Connections)", icon: "Waves", cat: "tech" },
    { id: "svc_111", titleAr: "تصديق مسارات تمديدات خدمات الكهرباء (التوصيلات المنزلية)", titleEn: "Get the Municipality's Approval for the Paths of Electrical Service Installations (Household Connections)", icon: "Zap", cat: "elec" },
    { id: "svc_112", titleAr: "تصديق الرصف بالبلاط المتشابك أمام واجهات المنازل", titleEn: "Application for obtaining the Municipality's approval for paving with interlocking tiles in front of houses.", icon: "Grid3X3", cat: "tech" },
    { id: "svc_113", titleAr: "تصديق زراعة الأشجار أمام واجهات المنازل", titleEn: "Requesting Municipal Certification for Tree Planting in Front of Residential Facades", icon: "Trees", cat: "tech" },
    { id: "svc_114", titleAr: "ترقيم المنازل", titleEn: "Get House Numbering", icon: "Hash", cat: "admin" },
    { id: "svc_115", titleAr: "ترخيص تسمية المباني", titleEn: "Building Naming License", icon: "Type", cat: "admin" },
    { id: "svc_116", titleAr: "ترخيص اللوحات الإرشادية", titleEn: "Directional Signage Permit", icon: "Signpost", cat: "invest" },
    { id: "svc_117", titleAr: "تصاريح ناقلات صهاريج مياة الصرف الصحي", titleEn: "Get a Permit for a Sewage Tanker", icon: "Truck", cat: "health" },
    { id: "svc_118", titleAr: "تركيب عداد مياه للمبنى", titleEn: "Water Meter Installation Service for the Building", icon: "Pipette", cat: "tech" },
    { id: "svc_119", titleAr: "إباحة بناء كبرى (محطة وقود)", titleEn: "A Major Building Permit (Gas Station)", icon: "Fuel", cat: "building" },
    { id: "svc_120", titleAr: "إباحة بناء صغرى (برج اتصالات)", titleEn: "Minor Building Permit (Transmission Tower)", icon: "TowerControl", cat: "building" },
    { id: "svc_121", titleAr: "إباحة بناء صغرى (تسوير)", titleEn: "Minor Building Permit (Fencing)", icon: "Fence", cat: "building" },
    { id: "svc_122", titleAr: "إباحة بناء صغرى (هدم)", titleEn: "Minor building permit (Demolition)", icon: "Hammer", cat: "building" },
    { id: "svc_123", titleAr: "إباحة بناء صغرى (محطة توزيع كهرباء)", titleEn: "(Minor Building License (Power Distribution Station", icon: "Zap", cat: "elec" },
    { id: "svc_124", titleAr: "تثبيت علائم مساحية لموقع أرض", titleEn: "Get Confirmation of Cadastral Marking for Land Plot Site", icon: "MapPin", cat: "tech" },
    { id: "svc_125", titleAr: "تقرير فني لمبنى قائم أو أرض فضاء", titleEn: "Get Technical Report of Existing Building or Vacant Land", icon: "FileSearch", cat: "tech" },
    { id: "svc_126", titleAr: "طلب بدء عمل", titleEn: "Getting Started Service", icon: "Play", cat: "building" },
    { id: "svc_127", titleAr: "شهادة إتمام بناء", titleEn: "Get a Building Completion Certificate", icon: "CheckCircle", cat: "building" },
    { id: "svc_128", titleAr: "إدارة استثمار موقع", titleEn: "Manage Site Investment", icon: "Landmark", cat: "invest" },
    { id: "svc_129", titleAr: "توثيق عقد إيجار (سكني، تجاري، صناعي أو مهني)", titleEn: "Document a Lease Contract (Residential, Commercial, Industrial or Professional)", icon: "FileSignature", cat: "invest" },
    { id: "svc_130", titleAr: "طلب الموافقة على عبور أو قطع أو ثقب قائم للطريق لتوصيل الخدمات", titleEn: "Request Approval for Existing Crossing, Cutting, or Perforation of the Road for Service Connections", icon: "Road", cat: "tech" },
    { id: "svc_131", titleAr: "تجديد ترخيص مركبة نقل مياه صالحة للشرب", titleEn: "Renewal of Potable Water Transport Vehicle License", icon: "RefreshCcw", cat: "health" },
    { id: "svc_132", titleAr: "تجديد ترخيص مركبة نقل مياه غير صالحة للشرب", titleEn: "Renewal of License for Non-Potable Water Transport Vehicle", icon: "RefreshCcw", cat: "health" },
    { id: "svc_133", titleAr: "الموافقة على عقد إيجار (نشاط تجاري)", titleEn: "Get Approval for Lease Contract (Commercial Activity)", icon: "CheckCircle", cat: "invest" },
    { id: "svc_134", titleAr: "استلام مركبة محجوزة", titleEn: "Receiving a Reserved Vehicle", icon: "Lock", cat: "admin" },
    { id: "svc_135", titleAr: "إزالة الحشائش والأجسام المشوهة للمنظر العام", titleEn: "Request for the Removal of Weeds and Unsightly Objects in Public Areas", icon: "Trash2", cat: "health" },
    { id: "svc_136", titleAr: "إباحة بناء كبرى", titleEn: "Get a Major Building Permit", icon: "Home", cat: "building" },
    { id: "svc_137", titleAr: "طلب كاسر سرعة", titleEn: "Request Speed Breaker", icon: "AlertTriangle", cat: "tech" },
    { id: "svc_138", titleAr: "إباحة بناء كبرى (تسوير)", titleEn: "Major Building Permit (Fencing)", icon: "Fence", cat: "building" },
    { id: "svc_139", titleAr: "اعتماد إعلانات المطبوعات والملصقات والمنشورات", titleEn: "Get Approval of Print Advertisements, Posters, and Publications Service", icon: "Image", cat: "invest" },
    { id: "svc_140", titleAr: "تصريح قطع أو ثقب الطريق", titleEn: "Request Road Cutting or Perforation Permit", icon: "Construction", cat: "tech" },
    { id: "svc_141", titleAr: "فعالية أو معرض خلال موسم الخريف", titleEn: "Request to Hold an Activity, Event or Exhibition During the Fall Season", icon: "Calendar", cat: "invest" },
    { id: "svc_142", titleAr: "اعتمادات الطرق الإسفلتية", titleEn: "Request Approvals Related to Asphalt Roads", icon: "CheckCircle", cat: "tech" },
    { id: "svc_143", titleAr: "خفض مستوى حجر الرصيف", titleEn: "Request for Lowering Curb Level", icon: "MoveDown", cat: "tech" },
    { id: "svc_144", titleAr: "تجديد إباحة بناء", titleEn: "Request for Renewal of Building Permit", icon: "RefreshCw", cat: "building" },
    { id: "svc_145", titleAr: "رصف طريق ترابي", titleEn: "Request to Pave a Dirt Road", icon: "Route", cat: "tech" },
    { id: "svc_146", titleAr: "اعتماد النسخ الإضافية من الخرائط", titleEn: "Get Approval for Additional Copies of Maps", icon: "Map", cat: "tech" },
    { id: "svc_147", titleAr: "رصف طريق إسفلتي", titleEn: "Request an Asphalt Road Paving", icon: "Road", cat: "tech" },
    { id: "svc_148", titleAr: "التصديق على مخططات إنارة الطرق والمجمعات", titleEn: "Request Road and Complex Lighting Plans Approval", icon: "Lightbulb", cat: "tech" },
    { id: "svc_149", titleAr: "ترخيص مظلات مواقف السيارات", titleEn: "License for the Installation of Car Park Shelters", icon: "Umbrella", cat: "tech" },
    { id: "svc_150", titleAr: "استئجار محلات بمواقع خاصة بالبلدية (الأسواق العامة)", titleEn: "Rent Shops in Special Locations in the Municipality (Public Markets)", icon: "Store", cat: "invest" },
    { id: "svc_151", titleAr: "تغيير مقاول المشروع", titleEn: "Request to Change the Project Contractor", icon: "UserRoundPen", cat: "building" },
    { id: "svc_152", titleAr: "توصيل التيار الكهربائي", titleEn: "Connect the power supply", icon: "Zap", cat: "elec" },
    { id: "svc_153", titleAr: "تغيير استشاري المشرف على المشروع", titleEn: "Request for Change of Project Supervisor Consultant", icon: "UserRoundPen", cat: "building" },
    { id: "svc_154", titleAr: "إنارة الطرق", titleEn: "Request Street Lighting", icon: "Lightbulb", cat: "tech" },
    { id: "svc_155", titleAr: "إنارة التجمعات السكنية (كشافات)", titleEn: "Request for Residential Community Lighting (Light fixture)", icon: "Lightbulb", cat: "tech" },
    { id: "svc_156", titleAr: "نقل عمود إنارة", titleEn: "Request for the Relocation of a Streetlight Pole", icon: "ArrowRightLeft", cat: "tech" },
    { id: "svc_157", titleAr: "نقل وحدة إنارة كهربائية", titleEn: "Relocate Electrical Lighting Unit", icon: "ArrowRightLeft", cat: "tech" },
    { id: "svc_158", titleAr: "تقييم أضرار مادية مرورية", titleEn: "Request for Assessment of Material Damages (Traffic Accidents)", icon: "ShieldAlert", cat: "admin" },
    { id: "svc_159", titleAr: "اعتمادات الإنارة", titleEn: "Request for Lighting Approvals", icon: "CheckCircle", cat: "tech" },
    { id: "svc_160", titleAr: "ذبح حيوانات بالمسلخ المركزي", titleEn: "Request to Slaughter Animals at the Central Slaughterhouse", icon: "Beef", cat: "health" },
    { id: "svc_161", titleAr: "تجديد ترخيص صهريج مياه الصرف الصحي", titleEn: "Renew the Wastewater Tanker License", icon: "RefreshCw", cat: "health" },
    { id: "svc_162", titleAr: "الموافقة المبدئية على مسارات تمديد الخدمات العامة", titleEn: "Get Initial Approval on Extension Routes for Public Services", icon: "CheckCircle", cat: "tech" },
    { id: "svc_163", titleAr: "تراخيص مركبات نقل المواد الغذائية", titleEn: "Get Licenses for Food Transport Vehicles", icon: "Truck", cat: "health" },
    { id: "svc_164", titleAr: "تجديد ترخيص مركبات نقل المواد الغذائية", titleEn: "Renew Food Transport Vehicles License", icon: "RefreshCw", cat: "health" },
    { id: "svc_165", titleAr: "شهادة إتلاف مواد", titleEn: "Material Destruction Certificate", icon: "Trash2", cat: "health" },
    { id: "svc_166", titleAr: "تجديد ترخيص الحفر بمسارات تمديد الخدمات العامة", titleEn: "Renew the License for Excavation on Public Service Extension Routes", icon: "RefreshCw", cat: "tech" },
    { id: "svc_167", titleAr: "تغيير اسم المالك في إباحة البناء", titleEn: "Request to Change the Owner’s Name on the Building Permit", icon: "UserRoundPen", cat: "building" },
    { id: "svc_168", titleAr: "بدل فاقد إباحة بناء", titleEn: "Get a Replacement for a Lost Building Permit", icon: "FileQuestion", cat: "building" },
    { id: "svc_169", titleAr: "إزالة مركبات مهملة مركونة لفترات طويلة", titleEn: "Request the Removal of Abandoned and Long-Term Parked Vehicles in Public Areas", icon: "Truck", cat: "health" },
    { id: "svc_170", titleAr: "تنظيم الأسواق التخصصية المؤقتة", titleEn: "Get Approval for Organizing Temporary Specialized Markets", icon: "Store", cat: "invest" },
    { id: "svc_171", titleAr: "تسجيل طلبات المراجعين في بلدية ظفار", titleEn: "Registration of Citizens' Requests at Dhofar Municipality", icon: "UserPlus", cat: "admin" },
    { id: "svc_172", titleAr: "إقامة عروض عالمية", titleEn: "Get Approval to Organize International Shows", icon: "Globe", cat: "invest" },
    { id: "svc_173", titleAr: "عروض الإضاءة والإبهار", titleEn: "Get Approval for Hosting Lightning and Visual Shows", icon: "Sparkles", cat: "invest" },
    { id: "svc_174", titleAr: "تقرير براءة ذمة للمقاولين", titleEn: "Report to Release Contractors", icon: "UserCheck", cat: "building" },
    { id: "svc_175", titleAr: "صرف فواتير المقاولين والشركات الاستشارية", titleEn: "Request for Payment of Contractors’ and Consulting Companies’ Invoices", icon: "Receipt", cat: "admin" },
    { id: "svc_176", titleAr: "تجديد تصريح قطع أو ثقب الطريق", titleEn: "Renewal of Cutting or Drilling Permit", icon: "RefreshCw", cat: "tech" },
    { id: "svc_177", titleAr: "إباحة بناء صغرى", titleEn: "Get Minor Building Permit", icon: "FilePlus", cat: "building" },
    { id: "svc_178", titleAr: "تحويل طريق إسفلتي", titleEn: "Relocating an Asphalt Road", icon: "MoveRight", cat: "tech" },
    { id: "svc_179", titleAr: "تصديق تذاكر أماكن اللهو والسينما والفعاليات", titleEn: "Authenticate and Stamp Tickets for Amusement Venues, Cinemas, and Events", icon: "Ticket", cat: "invest" },
    { id: "svc_180", titleAr: "فحص عينة مخبرية (أغذية / مياه)", titleEn: "Submit a Request for Laboratory Sample Testing (Food/ Water)", icon: "FlaskConical", cat: "health" },
    { id: "svc_181", titleAr: "تدريب طلاب مؤسسات التعليم العالي", titleEn: "Training Higher Education Institution Students", icon: "GraduationCap", cat: "admin" },
    { id: "svc_182", titleAr: "إباحة بناء صغرى (ترميم)", titleEn: "Minor building permit (restoration)", icon: "Hammer", cat: "building" },
    { id: "svc_183", titleAr: "طلب توفيق ومصالحة", titleEn: "Reconciliation and Settlement Request", icon: "Handshake", cat: "admin" },
    { id: "svc_184", titleAr: "أمر تشغيل مشروع", titleEn: "Get Work Order for Project", icon: "FileText", cat: "tech" },
    { id: "svc_185", titleAr: "دفع غرامة مخالفة صحية", titleEn: "Pay the Fine for a Health Violation", icon: "ShieldAlert", cat: "health" },
    { id: "svc_186", titleAr: "دفع أو استرداد مبلغ تأمين", titleEn: "Pay or Refund the Insurance Fee", icon: "ShieldCheck", cat: "admin" }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = (data.services || []).filter(Boolean);
          const fetchedFlows = (data.serviceFlows || []).filter(Boolean);
          
          const allServiceIds = Array.from(new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ])).filter(Boolean);

          const reconciledServices = allServiceIds.map(id => {
            const existing = fetchedServices.find((s: any) => s.id === id);
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            const master = MASTER_SERVICES_DATA.find(m => m.id === id);
            
            return {
              id,
              title: flow?.titleAr || existing?.title || master?.titleAr || 'خدمة جديدة',
              titleEn: flow?.titleEn || existing?.titleEn || master?.titleEn || '',
              description: existing?.description || (isAr ? 'خدمة بلدية رقمية معتمدة.' : 'Approved digital municipal service.'),
              category: existing?.category || master?.cat || 'elec',
              iconName: existing?.iconName || master?.icon || 'FileText',
              isActive: true,
              reqsAr: existing?.reqsAr || [],
              reqsEn: existing?.reqsEn || [],
              fees: existing?.fees || '10 OMR',
              type: existing?.type || 'workflow'
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
        const existingSvcIdx = currentServices.findIndex(s => s.id === master.id);
        const svcData: Service = {
          id: master.id,
          title: master.titleAr,
          titleEn: master.titleEn,
          description: isAr ? `خدمة رقمية معتمدة لـ ${master.titleAr}.` : `Certified digital service for ${master.titleEn}.`,
          iconName: master.icon,
          category: master.cat,
          isActive: true,
          reqsAr: [],
          reqsEn: [],
          fees: "10 OMR",
          type: "workflow"
        };

        if (existingSvcIdx > -1) {
          currentServices[existingSvcIdx] = { ...currentServices[existingSvcIdx], ...svcData };
        } else {
          currentServices.push(svcData);
        }

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
                fields: [
                  { id: `f_${master.id}_0`, type: "upload", labelAr: "البطاقة الشخصية", labelEn: "National ID", required: true }
                ],
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

      toast({ title: isAr ? "تم التثبيت" : "Success", description: isAr ? "تم تحديث كافة خدمات MASTER." : "All master services updated." });
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
                       <h4 className="font-black text-primary">{isAr ? "مزامنة خدمات MASTER الشاملة (80+ خدمة)" : "Sync Complete Master Services (80+ Services)"}</h4>
                       <p className="text-sm text-slate-500 font-medium">{isAr ? "سيقوم هذا الإجراء بتحديث كافة خدمات بلدية ظفار المعتمدة بمسمياتها الإنجليزية الرسمية وأيقوناتها." : "This will sync all Dhofar Municipality accredited services with their official English titles and icons."}</p>
                       <Button onClick={handleSeedMasterData} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white font-black mt-4">
                         {saving ? <Loader2 className="animate-spin ml-2" /> : <Database className="ml-2" />}
                         {isAr ? "بدء عملية المزامنة الكاملة" : "Start Full Sync Process"}
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
