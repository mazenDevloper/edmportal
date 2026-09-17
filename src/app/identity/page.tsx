'use client';

import React, { useState, useMemo } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { 
  Palette, Code2, Braces, LayoutPanelTop, Copy, Check,
  Grid, Landmark, CreditCard, ListChecks, BarChart3, Table2, LayoutTemplate,
  Fingerprint, Globe, User2, Calendar as CalendarIcon, PieChart, ShieldCheck,
  TrendingUp, Layers3, Zap, Timer, Map, Database, Type, MousePointer2,
  FileText, ExternalLink, Activity, LayoutGrid, CheckCircle2, AlertTriangle, MessageSquare,
  Search, Check as CheckIcon, X, Info, Clock, Download, Share2, MapPin, Eye,
  Volume2, Video, Sparkles, Home, ArrowUp, ArrowDown, Wallet, Shield, ShoppingBag, 
  PlusCircle, MinusCircle, FileBox, LineChart, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function IdentityPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'css'>('code');
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('brand');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CATEGORIES = [
    { id: 'brand', label: isAr ? 'هوية البلدية' : 'Municipality Identity', icon: <Palette size={14}/> },
    { id: 'gov', label: isAr ? 'هوية عُمان' : 'Gov.om Components', icon: <Landmark size={14}/> },
    { id: 'patterns', label: isAr ? 'الأنماط' : 'Patterns', icon: <Grid size={14}/> },
    { id: 'cards', label: isAr ? 'البطاقات' : 'Cards', icon: <CreditCard size={14}/> },
    { id: 'forms', label: isAr ? 'النماذج' : 'Forms', icon: <ListChecks size={14}/> },
    { id: 'charts', label: isAr ? 'الإحصائيات' : 'Charts', icon: <BarChart3 size={14}/> },
    { id: 'tables', label: isAr ? 'الجداول' : 'Tables', icon: <Table2 size={14}/> },
  ];

  const LIBRARY = useMemo(() => [
    // BRAND IDENTITY
    {
      id: 'brand-colors', category: 'brand', name: isAr ? 'لوحة الألوان' : 'Color Palette',
      render: (
        <div className="grid grid-cols-2 gap-3 w-full">
           <div className="h-16 rounded-xl bg-[#470D67] flex items-end p-2"><span className="text-[8px] text-white font-black">PRIMARY (PURPLE)</span></div>
           <div className="h-16 rounded-xl bg-[#00843D] flex items-end p-2"><span className="text-[8px] text-white font-black">SECONDARY (GREEN)</span></div>
           <div className="h-16 rounded-xl bg-[#03CFCB] flex items-end p-2"><span className="text-[8px] text-slate-900 font-black">ACCENT (TEAL)</span></div>
           <div className="h-16 rounded-xl bg-white border flex items-end p-2"><span className="text-[8px] text-slate-400 font-black">NEUTRAL (WHITE)</span></div>
        </div>
      ),
      codeReact: `// Purple #470D67 | Green #00843D | Teal #03CFCB`,
      codeCss: `.bg-primary { background: #470D67; }`
    },
    {
      id: 'brand-typography', category: 'brand', name: isAr ? 'الخطوط الرسمية' : 'Official Typography',
      render: (
        <div className="space-y-4 w-full">
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Arabic Readex Pro</p>
              <h4 className="font-black text-xl text-[#470D67]">بلدية ظفار الرقمية</h4>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">English Readex Pro</p>
              <h4 className="font-bold text-xl text-[#470D67]">Dhofar Digital Matrix</h4>
           </div>
        </div>
      ),
      codeReact: `<h1 className="font-bold">...</h1>`,
      codeCss: `body { font-family: 'Readex Pro', sans-serif; }`
    },

    // GOV COMPONENTS
    {
      id: 'vision-2040-card', category: 'gov', name: isAr ? 'كرت رؤية عُمان 2040' : 'Oman Vision 2040 Card',
      render: (
        <div className="p-8 bg-[#470D67] rounded-[2.5rem] shadow-xl flex flex-col items-center gap-6 w-full relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-matrix-all opacity-10" />
           <Image src="https://oman2040.om/themes/v2040/images/logo_en.png" alt="Vision 2040" width={150} height={50} className="brightness-0 invert relative z-10" unoptimized />
           <p className="text-center text-[10px] font-bold text-white/70 relative z-10 leading-relaxed uppercase tracking-widest">Moving Forward with Confidence</p>
           <Button className="w-full bg-white text-[#470D67] hover:bg-slate-100 rounded-xl h-12 font-black relative z-10">Learn More</Button>
        </div>
      ),
      codeReact: `<Vision2040Card />`,
      codeCss: `.card-vision { background: #470D67; }`
    },
    {
      id: 'tajawoob-card', category: 'gov', name: isAr ? 'كرت منصة تجاوب' : 'Tajawoob Card',
      render: (
        <div className="p-8 bg-white border-2 border-emerald-100 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-6 w-full relative overflow-hidden group">
           <div className="relative w-48 h-12">
              <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" fill className="object-contain" unoptimized />
           </div>
           <p className="text-center text-xs font-bold text-slate-600 relative z-10 leading-relaxed">
             {isAr ? 'المنصة الوطنية الموحدة للمقترحات والشكاوى في سلطنة عُمان.' : 'The unified national platform for suggestions and complaints in Oman.'}
           </p>
           <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-black relative z-10">إرسال مقترح</Button>
        </div>
      ),
      codeReact: `<TajawoobCard />`,
      codeCss: `.card-tajawoob { border: 2px solid #ecfdf5; }`
    },

    // PATTERNS (White on Purple Card)
    {
      id: 'pattern-matrix-white', category: 'patterns', name: isAr ? 'نمط المصفوفة (أبيض)' : 'Matrix Pattern White',
      render: <div className="w-full h-48 rounded-[2.5rem] bg-[#470D67] dm-pattern-matrix-all relative overflow-hidden flex flex-col justify-end p-6 border-4 border-white shadow-2xl"><Badge className="bg-white text-[#470D67] font-black w-fit">White Cover Asset</Badge></div>,
      codeReact: `<div className="dm-pattern-matrix-all" />`,
      codeCss: `.dm-pattern-matrix-all { opacity: 0.1; }`
    },
    {
      id: 'pattern-wave-white', category: 'patterns', name: isAr ? 'نمط الموجة (أبيض)' : 'Wave Pattern White',
      render: <div className="w-full h-48 rounded-[2.5rem] bg-[#470D67] dm-pattern-wave-pro relative overflow-hidden flex flex-col justify-end p-6 border-4 border-white shadow-2xl"><Badge className="bg-white text-[#470D67] font-black w-fit">Wave Pro White</Badge></div>,
      codeReact: `<div className="dm-pattern-wave-pro" />`,
      codeCss: `.dm-pattern-wave-pro { background-repeat: repeat-x; }`
    },

    // CARDS (7 Additional)
    ...Array.from({length: 7}).map((_, i) => ({
      id: `card-extra-${i}`, category: 'cards', name: isAr ? `بطاقة خدمية ${i+1}` : `Service Card ${i+1}`,
      render: (
        <Card className="w-full rounded-[2rem] border-none shadow-lg overflow-hidden bg-white group hover:shadow-2xl transition-all">
           <div className="h-32 bg-[#470D67] relative flex items-center justify-center">
              <div className="absolute inset-0 dm-pattern-matrix-all opacity-10" />
              <Layers3 className="text-white relative z-10" size={40} />
           </div>
           <CardContent className="p-6 space-y-3">
              <h5 className="font-black text-[#470D67]">Smart Service ${i+1}</h5>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Efficient digital municipal processing system for Dhofar citizens.</p>
              <Button size="sm" variant="outline" className="w-full rounded-xl border-[#470D67]/20 text-[#470D67] font-black">View Details</Button>
           </CardContent>
        </Card>
      ),
      codeReact: `<ServiceCard id={${i}} />`,
      codeCss: `.card-hover { transform: translateY(-5px); }`
    })),

    // FORMS (7 Additional)
    ...Array.from({length: 7}).map((_, i) => ({
      id: `form-extra-${i}`, category: 'forms', name: isAr ? `نموذج إدخال ${i+1}` : `Input Form ${i+1}`,
      render: (
        <div className="w-full space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Field Mapping ${i+1}</label>
           <div className="relative">
              <input className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-[#470D67]/20 outline-none" placeholder="Enter meta data..." />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" size={12} />
           </div>
        </div>
      ),
      codeReact: `<SmartInput label="Field ${i}" />`,
      codeCss: `.input-focus { border-color: #470D67; }`
    })),

    // CHARTS & COUNTERS
    {
      id: 'kpi-radial', category: 'charts', name: isAr ? 'مؤشر أداء دائري' : 'Radial KPI Tracker',
      render: (
        <div className="flex flex-col items-center gap-4">
           <div className="size-24 rounded-full border-8 border-[#470D67] border-r-transparent animate-spin-slow flex items-center justify-center font-black text-[#470D67]">89%</div>
           <span className="text-[10px] font-black text-slate-400 uppercase">Growth Rate</span>
        </div>
      ),
      codeReact: `<RadialChart value={89} />`,
      codeCss: `.radial-spin { animation: spin 3s linear infinite; }`
    },
    {
      id: 'counter-matrix', category: 'charts', name: isAr ? 'عداد معاملات حي' : 'Live Transaction Counter',
      render: (
        <div className="text-center p-8 bg-[#470D67] rounded-[2rem] text-white w-full relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full dm-pattern-matrix-all opacity-10" />
           <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em] mb-2">Total Digital Requests</p>
           <h3 className="text-4xl font-black text-accent tracking-tighter">42,981</h3>
           <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-bold"><TrendingUp size={12}/> +12% this month</div>
        </div>
      ),
      codeReact: `<Counter value={42981} />`,
      codeCss: `.text-gradient { color: #03CFCB; }`
    },

    // TABLES (Data, Report, Filtered)
    {
      id: 'data-table-report', category: 'tables', name: isAr ? 'جدول تقارير مفصل' : 'Financial Report Table',
      render: (
        <Card className="rounded-[1.5rem] border-none shadow-lg overflow-hidden bg-white w-full">
           <div className="bg-slate-900 text-white p-3 font-black text-[9px] uppercase tracking-widest flex justify-between">
              <span>Financial Matrix</span>
              <Badge className="bg-accent text-slate-900 text-[7px]">LIVE</Badge>
           </div>
           <div className="p-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-none">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">#0{i}</div>
                    <span className="text-[10px] font-bold">Renewal Svc</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600">25.00 OMR</span>
                </div>
              ))}
           </div>
        </Card>
      ),
      codeReact: `<ReportTable data={matrix} />`,
      codeCss: `.table-row:hover { background: #f8fafc; }`
    }
  ], [isAr]);

  const filteredLibrary = useMemo(() => {
    return LIBRARY.filter(item => item.category === activeFilter);
  }, [activeFilter, LIBRARY]);

  return (
    <div className={cn("min-h-screen bg-[#F4F6FC] font-readex")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white/80 backdrop-blur-2xl rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.03)] border border-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[#470D67]/10 text-[#470D67] font-black text-[10px] uppercase tracking-[0.2em]">
                <LayoutPanelTop size={16} /> {isAr ? 'نظام التصميم الرقمي لبلدية ظفار' : 'Dhofar Municipality UI Matrix v5.0'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-[#470D67] tracking-tighter leading-none">
                {isAr ? 'مكتبة الأصول الموحدة' : 'Unified Assets Library'}
              </h1>
              <p className="text-xl font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'مرجع هندسي شامل يضم الأنماط والودجيت والمكونات البرمجية للهوية الرقمية.' : 'Comprehensive engineering reference featuring patterns, widgets, and digital components.'}
              </p>
            </div>
            <div className="relative z-10 size-48 rounded-[3.5rem] bg-accent text-slate-900 flex items-center justify-center shadow-[0_30px_60px_rgba(3,207,203,0.3)] rotate-6 group hover:rotate-0 transition-transform duration-700">
              <Palette size={80} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full dm-pattern-matrix-all opacity-5 pointer-events-none" />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 space-y-12">
          {/* Category Filter */}
          <div className="bg-white/60 backdrop-blur-xl p-3 rounded-[2.5rem] border border-white shadow-sm flex flex-wrap gap-2 justify-center sticky top-24 z-40">
             {CATEGORIES.map(cat => (
               <Button 
                key={cat.id} 
                variant="ghost" 
                onClick={() => setActiveFilter(cat.id)}
                className={cn(
                  "rounded-full px-8 font-black text-[11px] uppercase tracking-widest transition-all gap-3 h-12",
                  activeFilter === cat.id ? "bg-[#470D67] text-white shadow-xl" : "text-slate-500 hover:bg-white"
                )}
               >
                 {cat.icon} {cat.label}
               </Button>
             ))}
          </div>

          {/* Flexible Masonry Grid */}
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
            {filteredLibrary.map((comp) => (
              <div key={comp.id} className="break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="rounded-[3rem] border-none shadow-sm bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-fit flex flex-col ring-1 ring-slate-100/50">
                  <div className="p-10 flex-1 flex items-center justify-center bg-slate-50/20 relative overflow-hidden">
                     {comp.render}
                  </div>
                  
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                       <div>
                          <h4 className="font-black text-[#470D67] text-lg leading-tight">{comp.name}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{CATEGORIES.find(c => c.id === comp.category)?.label}</p>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-[#470D67] size-10" onClick={() => { setSelectedComponent(comp); setActiveTab('code'); }}>
                            <Code2 size={18}/>
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-accent size-10" onClick={() => { setSelectedComponent(comp); setActiveTab('css'); }}>
                            <Braces size={18}/>
                          </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Gov UI Branding Footer */}
          <div className="p-20 rounded-[5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl mt-20 border-t-8 border-accent">
             <div className="relative z-10 grid md:grid-cols-2 gap-24 items-center">
                <div className="space-y-10">
                   <Badge className="bg-accent text-slate-900 font-black px-8 py-2.5 rounded-2xl text-[10px] tracking-[0.4em]">NATIONAL DESIGN SYSTEM</Badge>
                   <h3 className="text-6xl md:text-8xl font-black leading-none tracking-tighter">
                      {isAr ? 'الموسوعة التقنية للبلدية' : 'Unified Gov UI Kit'}
                   </h3>
                   <p className="text-xl text-white/50 font-bold leading-relaxed max-w-2xl">
                      {isAr ? 'مجموعة مختارة من أفضل المكونات البرمجية التي تضمن تجربة مستخدم موحدة عبر كافة الأنظمة الحكومية والبلدية في سلطنة عُمان.' : 'A curated selection of the finest UI components ensuring a unified user experience across all governmental and municipal systems in Oman.'}
                   </p>
                </div>
                <div className="grid grid-cols-2 gap-8 justify-center">
                    {[ShieldCheck, Database, Globe, Zap, Timer, Map, Layers3, Fingerprint].map((Icon, i) => (
                      <div key={i} className="size-28 rounded-[3.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center text-accent hover:scale-110 hover:border-accent hover:bg-white/10 transition-all duration-500 cursor-pointer shadow-2xl">
                        <Icon size={40} />
                      </div>
                    ))}
                </div>
             </div>
             <div className="absolute top-0 right-0 w-1/2 h-full dm-pattern-matrix-all opacity-10 pointer-events-none" />
          </div>
        </div>
      </main>

      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0 rounded-[3rem] border-none shadow-2xl flex flex-col bg-slate-950">
          <DialogHeader className="p-10 bg-slate-900 border-b border-white/5 relative overflow-hidden">
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <DialogTitle className="text-white text-3xl font-black">{selectedComponent?.name}</DialogTitle>
                   <DialogDescription className="text-accent font-black mt-2 uppercase text-[10px] tracking-widest">Global Component Metadata v5.2</DialogDescription>
                </div>
             </div>
             <div className="absolute top-0 left-0 w-full h-full dm-wave-5 opacity-5 pointer-events-none" />
          </DialogHeader>

          <div className="flex-1 overflow-auto p-10 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1.5 rounded-[1.5rem] mb-8 h-14 w-fit">
                  <TabsTrigger value="react" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-[#470D67]">React (TSX)</TabsTrigger>
                  <TabsTrigger value="html" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-slate-900">HTML</TabsTrigger>
                </TabsList>
                
                <TabsContent value="react" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeReact}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeReact)} className="absolute top-6 right-6 bg-white/10 text-white rounded-xl size-12 p-0"><Copy size={20}/></Button>
                </TabsContent>
                <TabsContent value="html" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-orange-400 font-mono text-sm leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeHtml || '<!-- HTML code not available -->'}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeHtml)} className="absolute top-6 right-6 bg-white/10 text-white rounded-xl size-12 p-0"><Copy size={20}/></Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative group h-full">
                <pre className="p-8 bg-black rounded-[2rem] text-blue-300 font-mono text-sm leading-relaxed overflow-x-auto min-h-[400px]">
                  <code>{selectedComponent?.codeCss}</code>
                </pre>
                <Button onClick={() => handleCopy(selectedComponent?.codeCss)} className="absolute top-6 right-6 bg-white/10 text-white rounded-xl size-12 p-0"><Copy size={20}/></Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
