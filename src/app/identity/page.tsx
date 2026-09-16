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
  TrendingUp, Layers3, Zap, Timer, Map, Database
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
import { Calendar } from '@/components/ui/calendar';

export default function IdentityPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'css'>('code');
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CATEGORIES = [
    { id: 'all', label: isAr ? 'الكل' : 'All', icon: <Grid size={14}/> },
    { id: 'gov', label: isAr ? 'هوية عُمان' : 'Gov.om', icon: <Landmark size={14}/> },
    { id: 'patterns', label: isAr ? 'الأنماط' : 'Patterns', icon: <Palette size={14}/> },
    { id: 'cards', label: isAr ? 'البطاقات' : 'Cards', icon: <CreditCard size={14}/> },
    { id: 'forms', label: isAr ? 'النماذج' : 'Forms', icon: <ListChecks size={14}/> },
    { id: 'charts', label: isAr ? 'الإحصائيات' : 'Charts', icon: <BarChart3 size={14}/> },
    { id: 'tables', label: isAr ? 'الجداول' : 'Tables', icon: <Table2 size={14}/> },
  ];

  const LIBRARY = useMemo(() => [
    // PATTERNS
    {
      id: 'pattern-polygon', category: 'patterns', name: isAr ? 'النمط المضلع الرسمي' : 'Official Polygon Pattern',
      render: <div className="w-full h-48 rounded-[2rem] border dm-pattern-polygon-card relative overflow-hidden flex flex-col justify-end p-6"><Badge className="bg-white/80 backdrop-blur-md text-primary w-fit">SVG Data Path</Badge></div>,
      codeReact: `<div className="dm-pattern-polygon-card" />`,
      codeHtml: `<div class="dm-pattern-polygon-card"></div>`,
      codeDotNet: `public string BgClass = "dm-pattern-polygon-card";`,
      codeCss: `.dm-pattern-polygon-card { background-image: url("data:image/svg+xml,..."); }`
    },
    {
      id: 'pattern-wave-pro', category: 'patterns', name: isAr ? 'نمط الموجة الاحترافي' : 'Pro Wave Asset',
      render: <div className="w-full h-48 rounded-[2rem] border dm-pattern-wave-pro bg-slate-50 flex items-center justify-center"><Badge className="bg-white/80 backdrop-blur-md text-primary">Master Wave</Badge></div>,
      codeReact: `<div className="dm-pattern-wave-pro" />`,
      codeHtml: `<div class="dm-pattern-wave-pro"></div>`,
      codeDotNet: `public string Asset = "WavePro";`,
      codeCss: `.dm-pattern-wave-pro { background-image: url("data:image/svg+xml,..."); }`
    },
    // GOV
    {
      id: 'thiqa-block', category: 'gov', name: isAr ? 'كتلة توثيق ثقة' : 'Thiqa Auth Matrix',
      render: (
        <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-6 w-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-wave-pro opacity-10" />
           <div className="size-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg relative z-10"><Fingerprint size={32}/></div>
           <div className="text-center relative z-10">
              <h4 className="font-black text-primary text-lg">Thiqa Login</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unified Identity</p>
           </div>
           <Button className="w-full dm-gradient-primary rounded-xl h-12 font-black relative z-10">Sign In</Button>
        </div>
      ),
      codeReact: `<ThiqaAuth />`,
      codeHtml: `<div class="thiqa-auth">...</div>`,
      codeDotNet: `[Authorize]`,
      codeCss: `.thiqa-auth { border-radius: 2.5rem; }`
    },
    // FORMS
    {
      id: 'calendar-standard', category: 'forms', name: isAr ? 'التقويم الموحد' : 'Standard Calendar',
      render: <div className="p-4 bg-white border rounded-[2rem] shadow-xl"><Calendar mode="single" className="rounded-xl" /></div>,
      codeReact: `<Calendar mode="single" />`,
      codeHtml: `<div class="calendar-ui">...</div>`,
      codeDotNet: `public DateTime SelectedDate { get; set; }`,
      codeCss: `.calendar-ui { border-radius: 2rem; }`
    },
    // CARDS
    {
      id: 'citizen-card', category: 'cards', name: isAr ? 'بطاقة المواطن' : 'Citizen Digital ID',
      render: (
        <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl w-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-polygon-card opacity-20" />
           <div className="relative z-10 flex justify-between items-start mb-12">
              <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center"><User2/></div>
              <Badge className="bg-accent text-slate-900 font-black">ACTIVE</Badge>
           </div>
           <p className="relative z-10 font-mono text-xl tracking-widest mb-1">1234 5678 9012</p>
           <p className="relative z-10 text-[10px] opacity-60 uppercase font-black">Ahmed Bin Salim</p>
        </div>
      ),
      codeReact: `<IDCard />`,
      codeHtml: `<div class="id-card">...</div>`,
      codeDotNet: `public string CID { get; set; }`,
      codeCss: `.id-card { background: #0f172a; }`
    },
  ], [isAr]);

  const filteredLibrary = useMemo(() => {
    if (activeFilter === 'all') return LIBRARY;
    return LIBRARY.filter(item => item.category === activeFilter);
  }, [activeFilter, LIBRARY]);

  return (
    <div className={cn("min-h-screen bg-[#F4F6FC]", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white/80 backdrop-blur-2xl rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.03)] border border-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                <LayoutPanelTop size={16} /> {isAr ? 'نظام التصميم الرقمي لبلدية ظفار' : 'Dhofar Municipality UI Matrix v4.5'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-none">
                {isAr ? 'مكتبة الأصول الموحدة' : 'Unified Assets Library'}
              </h1>
              <p className="text-xl font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'مرجع هندسي شامل يضم الأنماط والودجيت والمكونات البرمجية للهوية الرقمية.' : 'Comprehensive engineering reference featuring patterns, widgets, and digital ID components.'}
              </p>
            </div>
            <div className="relative z-10 size-48 rounded-[3.5rem] bg-accent text-slate-900 flex items-center justify-center shadow-[0_30px_60px_rgba(3,207,203,0.3)] rotate-6 group hover:rotate-0 transition-transform duration-700">
              <Palette size={80} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full dm-pattern-wave-pro opacity-5 pointer-events-none" />
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
                  activeFilter === cat.id ? "bg-primary text-white shadow-xl" : "text-slate-500 hover:bg-white"
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
                          <h4 className="font-black text-primary text-lg leading-tight">{comp.name}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{CATEGORIES.find(c => c.id === comp.category)?.label}</p>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-primary size-10" onClick={() => { setSelectedComponent(comp); setActiveTab('code'); }}>
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
             <div className="absolute top-0 right-0 w-1/2 h-full dm-pattern-wave-pro opacity-10 pointer-events-none" />
          </div>
        </div>
      </main>

      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0 rounded-[3rem] border-none shadow-2xl flex flex-col bg-slate-950">
          <DialogHeader className="p-10 bg-slate-900 border-b border-white/5 relative overflow-hidden">
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <DialogTitle className="text-white text-3xl font-black">{selectedComponent?.name}</DialogTitle>
                   <DialogDescription className="text-accent font-black mt-2 uppercase text-[10px] tracking-widest">Global Component Metadata v4.2</DialogDescription>
                </div>
             </div>
             <div className="absolute top-0 left-0 w-full h-full dm-wave-5 opacity-5 pointer-events-none" />
          </DialogHeader>

          <div className="flex-1 overflow-auto p-10 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1.5 rounded-[1.5rem] mb-8 h-14 w-fit">
                  <TabsTrigger value="react" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-primary">React (TSX)</TabsTrigger>
                  <TabsTrigger value="html" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-slate-900">HTML</TabsTrigger>
                  <TabsTrigger value="dotnet" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-indigo-600">.NET</TabsTrigger>
                </TabsList>
                
                <TabsContent value="react" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeReact}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeReact)} className="absolute top-6 right-6 bg-white/10 text-white rounded-xl size-12 p-0"><Copy size={20}/></Button>
                </TabsContent>
                {/* Other tab contents similar... */}
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
