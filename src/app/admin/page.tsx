'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Service, SiteConfig, MenuItem, CarouselItem, 
  Survey, CustomPage, PopupMessage, ServiceFlow, ServiceApplication, NewsItem 
} from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Settings, Plus, Save, Trash2, Loader2, 
  CloudUpload, Star, Layout, Menu, 
  Database, ShieldAlert, Edit2, Eye, 
  Wrench, BarChart3, Image as ImageIcon, 
  Bell, ClipboardList, Sparkles, Palette,
  Zap, FileText, Search, Globe, Volume2, Video, 
  MousePointer2, ArrowUpRight, Megaphone, ListChecks,
  RefreshCw, Layers, History, ShieldCheck, Mail, Phone, ExternalLink,
  LayoutDashboard, Newspaper, List, Grid, CheckCircle2, AlertTriangle, Info, Clock, Lock,
  FlaskConical, Bone, CarFront, Ticket, BadgeCent
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const ANALYTICS_DATA = [
  { name: 'يناير', transactions: 400 },
  { name: 'فبراير', transactions: 700 },
  { name: 'مارس', transactions: 1200 },
  { name: 'أبريل', transactions: 900 },
  { name: 'مايو', transactions: 1500 },
  { name: 'يونيو', transactions: 2100 },
];

const MASTER_SERVICES_CATALOG = [
  { id: 'svc_100', title: 'ترخيص إقامة عرض ترويجي للسيارات', titleEn: 'Permit for Organizing a Promotional Car Event', icon: 'Car', cat: 'invest' },
  { id: 'svc_101', title: 'تصديق مسارات تمديدات الكهرباء', titleEn: 'Approval for Paths of Electrical Service Installations', icon: 'Zap', cat: 'tech' },
  { id: 'svc_102', title: 'إصدار تصاريح صهاريج مياة الصرف الصحي', titleEn: 'Permit for a Sewage Tanker', icon: 'Truck', cat: 'health' },
  { id: 'svc_103', title: 'اعتماد إعلانات المطبوعات والمنشورات', titleEn: 'Approval of Print Advertisements & Publications', icon: 'Megaphone', cat: 'admin' },
  { id: 'svc_104', title: 'طلب إقامة منشط أو فعالية في الخريف', titleEn: 'Request to Hold an Activity or Exhibition During Khareef', icon: 'Landmark', cat: 'invest' },
  { id: 'svc_105', title: 'تواصل معنا', titleEn: 'Contact Us / Support', icon: 'Phone', cat: 'admin' },
  { id: 'svc_106', title: 'تصديق تمديدات الصرف الصحي', titleEn: 'Approval for Sanitary Sewer Service Extensions', icon: 'Droplets', cat: 'tech' },
  { id: 'svc_107', title: 'تصديق رصف البلاط المتشابك', titleEn: 'Approval for paving with interlocking tiles', icon: 'Construction', cat: 'tech' },
  { id: 'svc_108', title: 'ترقيم المنازل', titleEn: 'House Numbering Service', icon: 'MapPin', cat: 'admin' },
  { id: 'svc_109', title: 'ترخيص تسمية المباني', titleEn: 'Building Naming License', icon: 'Landmark', cat: 'invest' },
  { id: 'svc_127', title: 'تدريب طلاب مؤسسات التعليم العالي', titleEn: 'Training Higher Education Students', icon: 'GraduationCap', cat: 'admin' },
  { id: 'svc_128', title: 'طلب توفيق ومصالحة', titleEn: 'Reconciliation and Settlement Request', icon: 'Gavel', cat: 'admin' },
  { id: 'svc_119', title: 'شهادة إتلاف مواد', titleEn: 'Material Destruction Certificate', icon: 'Trash', cat: 'health' },
  { id: 'svc_126', title: 'طلب فحص عينة مخبرية (أغذية / مياه)', titleEn: 'Laboratory Sample Testing (Food/Water)', icon: 'FlaskConical', cat: 'health' },
  { id: 'svc_118', title: 'طلب ذبح حيوانات بالمسلخ المركزي', titleEn: 'Request Animal Slaughter at Central Slaughterhouse', icon: 'Bone', cat: 'health' },
  { id: 'svc_117', title: 'طلب تقييم أضرار مادية (حوادث مرورية)', titleEn: 'Material Damage Evaluation Request (Traffic Accidents)', icon: 'CarFront', cat: 'tech' },
  { id: 'svc_ticket_stamp', title: 'ختم تذاكر محلات التسلية ودور السينما والحفلات والتصديق عليها', titleEn: 'Stamping and Authenticating Tickets', icon: 'Ticket', cat: 'invest' },
  { id: 'svc_pay_fines', title: 'دفع الغرامات والضرائب والرسوم البلدية', titleEn: 'Pay Municipal Fines, Taxes and Fees', icon: 'BadgeCent', cat: 'admin' },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [services, setServices] = useState<Service[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [tickerText, setTickerText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setNews(data.news || []);
          setFlows(data.serviceFlows || []);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setCustomPages(data.customPages || []);
          setPopups(data.popups || []);
          setApplications(data.applications || []);
          setTickerText(data.newsTickerText || '');
        }
      } catch (e) {
        toast({ title: "Error Loading Data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const currentDb = await fetchBin();
      await updateBin({
        ...currentDb,
        services,
        news,
        serviceFlows: flows,
        siteConfig, 
        menuItems, 
        carouselItems, 
        surveys, 
        customPages, 
        popups,
        applications,
        newsTickerText: tickerText
      });
      toast({ title: isAr ? "تم حفظ كافة التغييرات بنجاح" : "All changes saved successfully" });
    } catch (e) {
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteMasterSeed = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      
      const newServices: Service[] = [...(db.services || [])];
      const newFlows: ServiceFlow[] = [...(db.serviceFlows || [])];

      const SPECIAL_FLOWS: Record<string, ServiceFlow> = {
        'svc_117': {
          id: "svc_117", serviceId: "svc_117", titleAr: "طلب تقييم أضرار مادية (حوادث مرورية)", titleEn: "Material Damage Evaluation Request (Traffic Accidents)", isActive: true,
          steps: [
            {
              id: "step_7e7ad952", titleAr: "بيانات الطلب", titleEn: "Application Details", actionType: "submit", defaultNextStepId: "step_79f1ce0d",
              fields: [
                { id: "field_9ade187a", type: "map", labelAr: "موقع الحادث", labelEn: "Accident Location", required: true },
                { id: "field_d2ddcbf6", type: "date", labelAr: "تاريخ الحادث", labelEn: "Accident Date", required: true },
                { id: "field_4325af6c", type: "text", labelAr: "رقم بلاغ / تقرير الحادث", labelEn: "Accident Report Number", required: true },
                { id: "field_710b6447", type: "text", labelAr: "وصف الأضرار في الممتلكات البلدية", labelEn: "Description of Damage to Municipal Assets", required: true }
              ]
            },
            {
              id: "step_79f1ce0d", titleAr: "المستندات المطلوبة", titleEn: "Required Documents", actionType: "submit", defaultNextStepId: "step_9baf85d1",
              fields: [
                { id: "field_9d5749c2", type: "upload", labelAr: "تقرير او خطاب من شرطة عمان السلطانية", labelEn: "Royal Oman Police Report / Letter", required: true },
                { id: "field_79036c67", type: "upload", labelAr: "صور الحادث والأضرار", labelEn: "Accident & Damage Photos", required: true }
              ]
            },
            {
              id: "step_9baf85d1", titleAr: "المراجعة وتقديم الطلب", titleEn: "Review & Submit", actionType: "submit",
              fields: [
                { 
                  id: "field_c5bd6ce1", type: "info", labelAr: "مسار معالجة الطلب", labelEn: "Processing Path", required: false,
                  options: [
                    "1. التحقق من موقع الحادث وتحديد اختصاص البلدية وإنشاء مهمة تلقائياً",
                    "2. مراجعة بيانات الطلب والخرائط وطلب معلومات إضافية عند الحاجة",
                    "3. زيارة / معاينة ميدانية وإعداد التقدير التفصيلي لتكلفة إصلاح الضرر",
                    "4. إنشاء تقرير تقييم موحد عند تأثر عناصر متعددة",
                    "5. مراجعة الميزانية المُعدة والتحقق من تقرير الزيارة",
                    "6. إشعار المتقدم باكتمال الطلب"
                  ]
                },
                { id: "field_c8d9ce81", type: "select", labelAr: "مدى رضاك عن تجربة تقديم الطلب", labelEn: "Satisfaction with the application experience", required: false, options: ["راضٍ جداً", "راضٍ", "محايد", "غير راضٍ"] },
                { id: "field_a0734275", type: "text", labelAr: "ملاحظات العميل", labelEn: "Customer Comments", required: false },
                { id: "field_32b25eec", type: "select", labelAr: "أقر بصحة البيانات والمستندات المقدمة", labelEn: "I confirm the submitted data and documents are correct", required: true, options: ["أقر وأوافق"] }
              ]
            }
          ]
        },
        'svc_126': {
          id: 'svc_126', serviceId: 'svc_126', titleAr: 'طلب فحص عينة مخبرية (أغذية / مياه)', titleEn: 'Laboratory Sample Testing (Food/Water)', isActive: true,
          steps: [{ id: 'step_submit_126', titleAr: 'تقديم الطلب', titleEn: 'Submit Application', actionType: 'submit', fields: [
            { id: 'field_product_details', type: 'text', labelAr: 'تفاصيل المنتج الغذائي المطلوب', labelEn: 'Food Product Details', required: true },
            { id: 'field_req_docs', type: 'upload', labelAr: 'المستندات المطلوبة للخدمة', labelEn: 'Required Documents', required: true }
          ]}]
        },
        'svc_118': {
          id: 'svc_118', serviceId: 'svc_118', titleAr: 'طلب ذبح حيوانات بالمسلخ المركزي', titleEn: 'Request Animal Slaughter at Central Slaughterhouse', isActive: true,
          steps: [{ id: 'step_submit_118', titleAr: 'تقديم الطلب', titleEn: 'Submit Application', actionType: 'submit', fields: [
            { id: 'field_animal_details', type: 'text', labelAr: 'تفاصيل الحيوان', labelEn: 'Animal Details', required: true },
            { id: 'field_agri_approval', type: 'upload', labelAr: 'موافقات وزارة الثروة الزراعية', labelEn: 'Ministry of Agriculture Approvals', required: true }
          ]}]
        },
        'svc_ticket_stamp': {
          id: 'svc_ticket_stamp', serviceId: 'svc_ticket_stamp', titleAr: 'ختم تذاكر محلات التسلية ودور السينما والحفلات والتصديق عليها', titleEn: 'Stamping and Authenticating Tickets', isActive: true,
          steps: [
            { id: 'step_submit_ticket', titleAr: 'تقديم الطلب', titleEn: 'Submit Request', actionType: 'submit', defaultNextStepId: 'step_pay_ticket', fields: [
              { id: 'field_event_details', type: 'text', labelAr: 'التفاصيل المتعلقة بالفعالية', labelEn: 'Event Details', required: true },
              { id: 'field_authorities_approval', type: 'upload', labelAr: 'موافقة الجهة المعنية', labelEn: 'Relevant Authority Approval', required: true }
            ]},
            { id: 'step_pay_ticket', titleAr: 'دفع الغرامات والضرائب والرسوم', titleEn: 'Pay Fines, Taxes and Fees', actionType: 'payment', fields: [] }
          ]
        },
        'svc_pay_fines': {
          id: 'svc_pay_fines', serviceId: 'svc_pay_fines', titleAr: 'دفع الغرامات والضرائب والرسوم البلدية', titleEn: 'Pay Municipal Fines, Taxes and Fees', isActive: true,
          steps: [
            { id: 'step_select_fines', titleAr: 'تحديد الغرامات أو الرسوم', titleEn: 'Select Fines or Fees', actionType: 'submit', defaultNextStepId: 'step_pay_fines', fields: [
              { id: 'field_fines_selection', type: 'select', labelAr: 'تحديد الغرامات أو الضرائب أو المستحقات', labelEn: 'Select Fines, Taxes or Dues', required: true, options: ["غرامات (مخالفات صحية، مواقف، حوادث)", "ضرائب بلدية (فنون، ترفيه، سينما)", "رسوم بلدية (فنادق، مطاعم، عقود استثمار)"] }
            ]},
            { id: 'step_pay_fines', titleAr: 'الدفع الإلكتروني', titleEn: 'Online Payment', actionType: 'payment', fields: [] }
          ]
        }
      };

      MASTER_SERVICES_CATALOG.forEach(master => {
          const sIdx = newServices.findIndex(s => s.id === master.id);
          const serviceData = {
            id: master.id, title: master.title, titleEn: master.titleEn,
            description: `خدمة رقمية من بلدية ظفار: ${master.title}`, descriptionEn: `Digital Service: ${master.titleEn}`,
            iconName: master.icon, category: master.cat, isActive: true,
            reqsAr: ['البطاقة الشخصية', 'السجل التجاري (إن وجد)'], reqsEn: ['ID Card', 'Commercial Register'],
            fees: '10 OMR', durationAr: 'فوري', durationEn: 'Instant',
            conditionsAr: 'سلطنة عمان', conditionsEn: 'Oman Citizen'
          };
          if (sIdx > -1) newServices[sIdx] = serviceData; else newServices.push(serviceData);

          const fIdx = newFlows.findIndex(f => f.serviceId === master.id);
          const flowData = SPECIAL_FLOWS[master.id] || {
            id: master.id, serviceId: master.id, titleAr: master.title, titleEn: master.titleEn, isActive: true,
            steps: [{ id: `step_${master.id}_1`, titleAr: 'المستندات المطلوبة', titleEn: 'Required Documents', fields: [{ id: `f_${master.id}_1`, type: 'upload', labelAr: 'مرفق المستند الأول', labelEn: 'Doc Attachment 1', required: true }], actionType: 'submit' }]
          };
          if (fIdx > -1) newFlows[fIdx] = flowData; else newFlows.push(flowData);
      });

      await updateBin({ ...db, services: newServices, serviceFlows: newFlows });
      setServices(newServices);
      setFlows(newFlows);
      toast({ title: "Master Seeding Complete - All Flows Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed" });
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const t = (isAr ? s.title : s.titleEn || s.title).toLowerCase();
      return t.includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    });
  }, [services, searchQuery, isAr]);

  const navItems = [
    { id: 'overview', label: isAr ? 'الإحصائيات' : 'Overview', icon: <BarChart3 size={18}/> },
    { id: 'services', label: isAr ? 'الخدمات' : 'Services', icon: <Zap size={18}/> },
    { id: 'news', label: isAr ? 'الأخبار' : 'News Matrix', icon: <Newspaper size={18}/> },
    { id: 'apps', label: isAr ? 'الطلبات' : 'Applications', icon: <History size={18}/> },
    { id: 'pages', label: isAr ? 'الصفحات' : 'Pages', icon: <Layout size={18}/> },
    { id: 'menu', label: isAr ? 'الملاحة' : 'Navigation', icon: <Menu size={18}/> },
    { id: 'branding', label: isAr ? 'الهوية' : 'Identity', icon: <Palette size={18}/> },
    { id: 'carousel', label: isAr ? 'البنرات' : 'Banners', icon: <ImageIcon size={18}/> },
    { id: 'popups', label: isAr ? 'المنبثقات' : 'Popups', icon: <Bell size={18}/> },
    { id: 'surveys', label: isAr ? 'الاستطلاعات' : 'Polls', icon: <ClipboardList size={18}/> },
    { id: 'ticker', label: isAr ? 'شريط الأخبار' : 'Ticker', icon: <Megaphone size={18}/> },
    { id: 'footer', label: isAr ? 'التذييل' : 'Footer', icon: <Layers size={18}/> },
    { id: 'ai', label: isAr ? 'AI Brain' : 'AI Brain', icon: <Sparkles size={18}/> },
    { id: 'system', label: isAr ? 'النظام' : 'System', icon: <Wrench size={18}/> },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50 flex", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <aside className="w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen flex flex-col gap-8 hidden lg:flex border-r border-white/5 z-50">
         <div className="flex items-center gap-3">
           <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-slate-900 shadow-[0_0_25px_rgba(3,207,203,0.4)] transition-transform hover:rotate-6">
             <Settings size={24} />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter leading-none uppercase">Matrix</span>
             <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-80 mt-1">Dhofar Cmd v4.5</span>
           </div>
         </div>
         
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-1">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">{isAr ? 'إدارة المنظومة الرقمية' : 'Global Matrix Controls'}</p>
               {navItems.map(item => (
                 <Button 
                   key={item.id} 
                   variant="ghost" 
                   onClick={() => setActiveTab(item.id)}
                   className={cn(
                     "justify-start gap-4 h-12 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all",
                     activeTab === item.id ? "bg-white/10 text-accent shadow-lg border-l-4 border-accent" : "text-slate-400 hover:bg-white/5 hover:text-white"
                   )}
                 >
                   {item.icon} {item.label}
                 </Button>
               ))}
            </nav>
         </div>

         <div className="pt-6 border-t border-white/5">
            <div className="p-5 bg-accent/5 rounded-3xl border border-accent/10 relative overflow-hidden group">
               <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
               <div className="flex items-center gap-2 mb-2 relative z-10">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-accent uppercase tracking-widest">Neural Link Active</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold leading-relaxed relative z-10">Matrix connected to Gemini 2.5 Flash. Real-time translation ready.</p>
            </div>
         </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full dm-pattern-wave-pro opacity-[0.02] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-primary tracking-tighter flex items-center gap-4">
              {isAr ? "لوحة الإدارة المركزية" : "Central Portal Admin"}
              <Badge variant="outline" className="text-[9px] rounded-lg bg-slate-50 border-slate-200">PRO MODE</Badge>
            </h1>
            <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">{isAr ? "تحكم كامل بهوية البوابة والخدمات والذكاء الاصطناعي" : "End-to-end portal orchestration"}</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <Button variant="outline" asChild className="rounded-full font-black px-8 border-slate-200 h-12 shadow-sm hover:bg-slate-50">
              <Link href="/">{isAr ? "معاينة البوابة" : "Live Preview"}</Link>
            </Button>
            <Button onClick={handleGlobalSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-[0_10px_30px_rgba(3,207,203,0.3)] h-12 gap-2 transition-transform active:scale-95">
              {saving ? <Loader2 className="animate-spin" /> : <CloudUpload size={20}/>}
              {isAr ? "حفظ ومزامنة النظام" : "Sync Matrix"}
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                 <div className="grid md:grid-cols-4 gap-6">
                    {[
                      { label: isAr ? 'الخدمات' : 'Services', val: services.length, icon: <Zap/>, color: 'bg-primary' },
                      { label: isAr ? 'الطلبات' : 'Applications', val: applications.length, icon: <History/>, color: 'bg-accent' },
                      { label: isAr ? 'الأخبار' : 'News', val: news.length, icon: <Newspaper/>, color: 'bg-slate-900' },
                      { label: isAr ? 'الصفحات' : 'Pages', val: customPages.length, icon: <Layout/>, color: 'bg-emerald-600' },
                    ].map((card, i) => (
                      <Card key={i} className={cn("rounded-[2rem] border-none shadow-xl text-white overflow-hidden relative group", card.color)}>
                         <div className="absolute top-0 right-0 size-32 dm-pattern-matrix-all opacity-10 -rotate-12 group-hover:scale-110 transition-transform" />
                         <CardContent className="p-8 space-y-1 relative z-10">
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{card.label}</p>
                            <h3 className="text-5xl font-black tracking-tighter">{card.val}</h3>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10">
                    <div className="h-[400px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={ANALYTICS_DATA}><defs><linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#03CFCB" stopOpacity={0.3}/><stop offset="95%" stopColor="#03CFCB" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} /><YAxis hide /><Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} /><Area type="monotone" dataKey="transactions" stroke="#03CFCB" fillOpacity={1} fill="url(#colorTrans)" strokeWidth={5} /></AreaChart></ResponsiveContainer></div>
                 </Card>
              </div>
            )}

            {activeTab === 'services' && (
               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm">
                     <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><Input placeholder={isAr ? "ابحث عن خدمة..." : "Search services..."} className="pl-10 rounded-xl h-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                     <div className="flex gap-3"><Button variant="outline" onClick={handleExecuteMasterSeed} className="rounded-full px-6 font-black border-slate-200">MASTER SEED</Button><Button asChild className="dm-gradient-primary rounded-full px-8 font-black"><Link href="/servicebuild">+ {isAr ? "إضافة خدمة" : "Add Service"}</Link></Button></div>
                  </div>
                  <div className="bg-white border rounded-[2.5rem] overflow-hidden shadow-xl"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="p-6 font-black">{isAr ? "الخدمة" : "Service"}</TableHead><TableHead className="p-6 font-black">{isAr ? "الفئة" : "Category"}</TableHead><TableHead className="p-6 font-black text-center">{isAr ? "مميزة" : "Featured"}</TableHead><TableHead className="p-6 font-black">{isAr ? "إجراء" : "Action"}</TableHead></TableRow></TableHeader><TableBody>{filteredServices.map(s => (<TableRow key={s.id} className="hover:bg-slate-50 transition-colors"><TableCell className="p-6 font-bold"><div className="flex items-center gap-4"><div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">{React.createElement((Icons as any)[s.iconName] || Icons.FileText, { size: 20 })}</div><div><p className="text-sm">{isAr ? s.title : (s.titleEn || s.title)}</p><p className="text-[9px] text-slate-400 uppercase font-mono tracking-tighter">{s.id}</p></div></div></TableCell><TableCell className="p-6"><Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-500">{s.category}</Badge></TableCell><TableCell className="p-6 text-center"><Switch checked={s.isFeatured || false} onCheckedChange={(val) => setServices(prev => prev.map(item => item.id === s.id ? {...item, isFeatured: val} : item))} className="mx-auto data-[state=checked]:bg-accent" /></TableCell><TableCell className="p-6"><div className="flex gap-2"><Button variant="ghost" size="icon" asChild className="text-primary hover:bg-primary/5 rounded-xl"><Link href={`/servicebuild?id=${s.id}`}><Edit2 size={16}/></Link></Button><Button variant="ghost" size="icon" onClick={() => setServices(services.filter(svc => svc.id !== s.id))} className="text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></Button></div></TableCell></TableRow>))}</TableBody></Table></div>
               </div>
            )}

            {activeTab === 'system' && (
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="rounded-[3rem] border-none shadow-xl bg-slate-950 text-white p-10 space-y-10 relative overflow-hidden">
                    <div className="absolute inset-0 dm-pattern-matrix-all opacity-5 pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                       <h3 className="text-2xl font-black text-accent flex items-center gap-3"><ShieldAlert size={24}/> {isAr ? "وضع الصيانة" : "Security & Maintenance"}</h3>
                       <Switch checked={siteConfig?.isMaintenanceMode} onCheckedChange={v => setSiteConfig({...siteConfig!, isMaintenanceMode: v})} className="data-[state=checked]:bg-red-500" />
                    </div>
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 relative z-10">
                       <div className="flex items-center justify-between"><span className="font-black text-xs uppercase tracking-widest text-white/60">{isAr ? "حالة النظام" : "Maintenance Status"}</span><Badge className={cn("rounded-full font-black px-4", siteConfig?.isMaintenanceMode ? "bg-red-500 animate-pulse" : "bg-emerald-500")}>{siteConfig?.isMaintenanceMode ? 'MAINTENANCE' : 'ONLINE'}</Badge></div>
                       <p className="text-xs text-white/40 font-medium leading-relaxed italic">{isAr ? "تفعيل هذا الخيار سيغلق كافة الخدمات الرقمية وسيظهر رسالة اعتذار للمواطنين." : "Enabling this will shut down all e-services and show an apology message to users."}</p>
                    </div>
                 </Card>
                 <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Wrench size={24}/> {isAr ? "الصيانة الفنية" : "System Tools"}</h3>
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-4">
                          <h4 className="font-black flex items-center gap-2"><Database size={18} className="text-primary"/> {isAr ? "بذر البيانات (Master Seed)" : "Database Seeding"}</h4>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">{isAr ? "إعادة تعيين كافة الخدمات الـ 80+ بمسارات التدفق المنطقي المتقدمة." : "Restore all 80+ master services with advanced neural logic flows."}</p>
                          <Button onClick={handleExecuteMasterSeed} className="w-full h-11 rounded-xl dm-gradient-primary font-black shadow-lg">START MASTER SEED</Button>
                       </div>
                       <div className="p-6 bg-red-50 rounded-[2rem] border-2 border-red-100 space-y-4">
                          <h4 className="font-black flex items-center gap-2 text-red-600"><ShieldAlert size={18}/> {isAr ? "منطقة الخطر" : "Danger Zone"}</h4>
                          <Button variant="ghost" onClick={() => setApplications([])} className="w-full h-11 rounded-xl font-black text-red-600 border border-red-200 hover:bg-red-100">PURGE ALL APPLICATIONS</Button>
                       </div>
                    </div>
                 </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
