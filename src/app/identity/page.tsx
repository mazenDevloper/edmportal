'use client';

import React, { useState, useMemo } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { 
  Palette, Code2, Braces, LayoutPanelTop, Copy, Check,
  Grid, Landmark, CreditCard, ListChecks, BarChart3, Table2, LayoutTemplate,
  Fingerprint, Globe, User2, Layers3, Zap, Timer, Map, Database, Type, MousePointer2,
  FileText, ExternalLink, Activity, LayoutGrid, CheckCircle2, AlertTriangle, MessageSquare,
  Search, Check as CheckIcon, X, Info, Clock, Download, Share2, MapPin, Eye,
  Volume2, Video, Sparkles, Home, ArrowUp, ArrowDown, Wallet, Shield, ShoppingBag, 
  PlusCircle, MinusCircle, FileBox, LineChart, RefreshCw, Box, ArrowUpRight,
  TrendingUp, Users, ShieldCheck, Mail, Phone, Calendar, Star, Bell, MoreHorizontal
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Line, LineChart as ReLineChart
} from 'recharts';

export default function IdentityGuide() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'css'>('code');
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('municipality');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CATEGORIES = [
    { id: 'municipality', label: isAr ? 'هوية البلدية' : 'Municipality Identity', icon: <Palette size={14}/> },
    { id: 'gov', label: isAr ? 'هوية عُمان' : 'Gov.om UI', icon: <Landmark size={14}/> },
    { id: 'basic', label: isAr ? 'المكونات الأساسية' : '40+ Basic Components', icon: <Box size={14}/> },
    { id: 'charts', label: isAr ? 'الرسوم البيانية' : '40+ Charts & KPI', icon: <BarChart3 size={14}/> },
    { id: 'forms', label: isAr ? 'النماذج' : '40+ Forms', icon: <ListChecks size={14}/> },
    { id: 'cards', label: isAr ? 'البطاقات' : '20+ Smart Cards', icon: <CreditCard size={14}/> },
    { id: 'templates', label: isAr ? 'القوالب' : '100+ Templates', icon: <LayoutTemplate size={14}/> },
  ];

  const CHART_DATA = [
    { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 }, { name: 'May', value: 500 }, { name: 'Jun', value: 900 }
  ];

  const LIBRARY = useMemo(() => [
    // 1. MUNICIPALITY IDENTITY
    {
      id: 'brand-palette', category: 'municipality', name: isAr ? 'لوحة الألوان الملكية' : 'Royal Color Palette',
      render: (
        <div className="grid grid-cols-2 gap-4 w-full">
           <div className="h-24 rounded-[1.5rem] bg-[#470D67] flex flex-col justify-end p-4 border border-white/10 shadow-lg group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Royal Purple</span><span className="text-[10px] text-white/50 font-mono">#470D67</span></div>
           <div className="h-24 rounded-[1.5rem] bg-[#03CFCB] flex flex-col justify-end p-4 border border-white/10 shadow-lg group hover:scale-105 transition-transform"><span className="text-[9px] text-slate-900 font-black uppercase tracking-widest">Vital Teal</span><span className="text-[10px] text-slate-900/50 font-mono">#03CFCB</span></div>
           <div className="h-24 rounded-[1.5rem] bg-[#00843D] flex flex-col justify-end p-4 border border-white/10 shadow-lg group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Oman Green</span><span className="text-[10px] text-white/50 font-mono">#00843D</span></div>
           <div className="h-24 rounded-[1.5rem] bg-slate-900 flex flex-col justify-end p-4 border border-white/10 shadow-lg group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Night Blue</span><span className="text-[10px] text-white/50 font-mono">#0F172A</span></div>
        </div>
      )
    },
    {
      id: 'brand-typography', category: 'municipality', name: isAr ? 'الخط الرسمي (Readex Pro)' : 'Official Font: Readex Pro',
      render: (
        <div className="space-y-6 w-full text-center py-4">
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Arabic Font Face</p>
              <h4 className="font-black text-4xl text-[#470D67]">بلدية ظفار الرقمية</h4>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">English Font Face</p>
              <h4 className="font-bold text-3xl text-[#470D67] tracking-tighter uppercase">Dhofar Digital Matrix</h4>
           </div>
        </div>
      )
    },
    {
      id: 'pattern-wave-cover', category: 'municipality', name: isAr ? 'نمط الموجة (.dm-wave)' : 'Wave Pattern Cover',
      render: (
        <Card className="w-full h-48 rounded-[2.5rem] bg-[#470D67] relative overflow-hidden flex flex-col justify-end p-8 border-4 border-white shadow-2xl">
           <div className="absolute inset-0 dm-wave opacity-20 bg-repeat-x scale-150" />
           <Badge className="bg-white text-[#470D67] font-black w-fit relative z-10 text-[10px] tracking-widest uppercase">.dm-wave Cover</Badge>
        </Card>
      )
    },
    {
      id: 'pattern-polygon-cover', category: 'municipality', name: isAr ? 'نمط المضلعات (.dm-pattern-polygon)' : 'Polygon Pattern Cover',
      render: (
        <Card className="w-full h-48 rounded-[2.5rem] bg-[#470D67] relative overflow-hidden flex flex-col justify-end p-8 border-4 border-white shadow-2xl">
           <div className="absolute inset-0 dm-pattern-polygon opacity-10 bg-center bg-cover" />
           <Badge className="bg-white text-[#470D67] font-black w-fit relative z-10 text-[10px] tracking-widest uppercase">.dm-pattern-polygon</Badge>
        </Card>
      )
    },

    // 2. GOV.OM COMPONENTS
    {
      id: 'tajawoob-card-royal', category: 'gov', name: isAr ? 'كرت منصة تجاوب' : 'Tajawoob Citizen Voice',
      render: (
        <div className="p-10 bg-[#470D67] rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-full h-full dm-wave opacity-10" />
           <div className="relative w-48 h-12">
              <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <p className="text-center text-[10px] font-black text-white/50 relative z-10 leading-relaxed uppercase tracking-[0.4em]">Integrated Suggestions System</p>
           <Button className="w-full bg-white text-[#470D67] hover:bg-[#03CFCB] hover:text-white rounded-2xl h-14 font-black relative z-10 shadow-xl transition-all">Submit Feedback</Button>
        </div>
      )
    },
    {
      id: 'vision-2040-card-green', category: 'gov', name: isAr ? 'رؤية عُمان 2040' : 'Oman Vision 2040',
      render: (
        <div className="p-10 bg-[#00843D] rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden">
           <div className="absolute inset-0 dm-pattern-polygon opacity-10" />
           <div className="relative w-40 h-20">
              <Image src="https://oman2040.om/themes/v2040/images/logo_en.png" alt="Vision 2040" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <div className="text-center text-white relative z-10">
              <h5 className="font-black text-lg">Moving Forward</h5>
              <p className="text-[10px] opacity-70">Strategic Transformation Hub</p>
           </div>
        </div>
      )
    },
    {
      id: 'thiqa-white-block', category: 'gov', name: isAr ? 'كتلة توثيق ثقة' : 'Thiqa White Portal',
      render: (
        <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-6 w-full relative overflow-hidden">
           <div className="size-16 bg-primary/5 rounded-3xl flex items-center justify-center">
              <Fingerprint size={40} className="text-[#470D67]" />
           </div>
           <div className="text-center">
              <h4 className="font-black text-slate-800 text-lg">Digital Identity</h4>
              <Badge className="bg-[#03CFCB] text-slate-900 border-none rounded-lg text-[8px] px-3">ACTIVE & SECURE</Badge>
           </div>
           <Button variant="outline" className="w-full rounded-xl h-12 font-black border-slate-200">Connect via Thiqa</Button>
        </div>
      )
    },

    // 3. BASIC COMPONENTS
    {
      id: `buttons-stack`, category: 'basic', name: isAr ? 'مصفوفة الأزرار' : 'Neural Button Stack',
      render: (
        <div className="flex flex-wrap gap-4 justify-center w-full">
           <Button className="dm-gradient-primary rounded-xl px-8 h-12 font-black shadow-lg">Royal Action</Button>
           <Button className="dm-gradient-teal rounded-xl px-8 h-12 font-black shadow-lg">Teal Action</Button>
           <Button variant="outline" className="rounded-xl px-8 h-12 font-black border-[#470D67]/20 text-[#470D67]">Outline Node</Button>
           <Button variant="ghost" size="icon" className="size-12 rounded-xl bg-slate-50 text-accent hover:bg-[#470D67] hover:text-white"><Zap size={20}/></Button>
        </div>
      )
    },
    {
        id: 'header-preview', category: 'basic', name: isAr ? 'ترويسة النظام الحالية' : 'Active System Header',
        render: (
          <div className="w-full bg-white border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="size-8 bg-primary rounded-lg"/><span className="font-black text-xs">Dhofar Portal</span></div>
              <div className="flex gap-4"><div className="w-12 h-2 bg-slate-100 rounded-full"/><div className="w-12 h-2 bg-slate-100 rounded-full"/></div>
            </div>
          </div>
        )
    },

    // 4. CHARTS & COUNTERS
    {
      id: 'counter-modern-trans', category: 'charts', name: isAr ? 'عداد معاملات عصري' : 'Modern Transactions Counter',
      render: (
        <div className="text-center p-8 bg-slate-900 rounded-[2.5rem] text-white w-full border-t-4 border-[#03CFCB] shadow-2xl">
           <TrendingUp className="mx-auto text-[#03CFCB] mb-4" size={32} />
           <h3 className="text-5xl font-black mb-2">42.5K</h3>
           <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Digital Applications</p>
        </div>
      )
    },
    {
        id: 'chart-bar-main', category: 'charts', name: isAr ? 'مخطط الأعمدة الملون' : 'Main Performance Bar',
        render: (
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                   {CHART_DATA.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#470D67' : '#03CFCB'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
    },
    {
        id: 'chart-pie-votes', category: 'charts', name: isAr ? 'مخطط التصويت الدائري' : 'Sentiment Pie Chart',
        render: (
          <div className="w-full h-48 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={[{v:60},{v:40}]} dataKey="v" innerRadius={40} outerRadius={60} paddingAngle={5}>
                    <Cell fill="#470D67" /><Cell fill="#03CFCB" />
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute text-center"><span className="text-xl font-black text-primary">85%</span></div>
          </div>
        )
    },

    // 5. FORMS
    {
      id: 'form-headers-stack', category: 'forms', name: isAr ? 'تدرجات العناوين (H1-H6)' : 'Typography Headers Hub',
      render: (
        <div className="space-y-4 w-full text-left">
           <h1 className="text-3xl font-black text-primary">Heading 1</h1>
           <h2 className="text-2xl font-bold text-primary">Heading 2</h2>
           <h3 className="text-xl font-black text-slate-800">Heading 3</h3>
           <h4 className="text-lg font-bold text-slate-600">Heading 4</h4>
           <h5 className="text-sm font-black uppercase text-accent tracking-widest">Heading 5</h5>
           <h6 className="text-xs font-bold text-slate-400">Heading 6 / Small Caption</h6>
        </div>
      )
    },
    {
      id: 'form-ready-input', category: 'forms', name: isAr ? 'حقل إدخال ذكي' : 'Neural Ready Input',
      render: (
        <div className="space-y-4 w-full">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="w-full h-14 bg-slate-50 border-none rounded-2xl px-12 font-bold shadow-inner focus:ring-2 focus:ring-accent/20 outline-none" placeholder="Search Data Matrix..." />
           </div>
           <div className="flex gap-2">
              <Badge className="bg-primary text-white text-[9px] px-3 py-1">CTRL</Badge>
              <Badge className="bg-primary text-white text-[9px] px-3 py-1">K</Badge>
           </div>
        </div>
      )
    },

    // 6. CARDS
    {
      id: 'user-id-card', category: 'cards', name: isAr ? 'بطاقة هوية المستخدم' : 'Neural Citizen Card',
      render: (
        <div className="p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-2xl w-full relative overflow-hidden group">
           <div className="flex justify-between items-start mb-12">
              <Avatar className="size-16 border-4 border-primary/10 shadow-xl"><AvatarImage src="https://picsum.photos/seed/user/200/200" /><AvatarFallback>AM</AvatarFallback></Avatar>
              <Badge className="bg-primary text-white rounded-lg">PRO USER</Badge>
           </div>
           <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-800">Ahmed Al-Maashani</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident ID: 12345678</p>
           </div>
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-polygon opacity-20 pointer-events-none" />
        </div>
      )
    },
    {
        id: 'balance-card-royal', category: 'cards', name: isAr ? 'بطاقة الرصيد الملكية' : 'Royal Wallet Balance',
        render: (
          <div className="p-8 bg-[#470D67] rounded-[2.5rem] text-white w-full relative overflow-hidden border-b-[8px] border-[#03CFCB] shadow-2xl">
             <div className="absolute top-0 right-0 w-full h-full dm-wave opacity-10" />
             <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em] mb-4">Current Portal Credit</p>
             <h3 className="text-4xl font-black text-[#03CFCB] tracking-tighter">$4,290.00</h3>
             <div className="mt-8 flex justify-between items-center relative z-10">
                <Avatar className="size-10 border-2 border-white/20"><AvatarFallback className="bg-white/10 text-[10px] font-black">AM</AvatarFallback></Avatar>
                <Button size="icon" variant="ghost" className="size-10 rounded-xl bg-white/5 text-white hover:bg-white/20"><ArrowUpRight size={18}/></Button>
             </div>
          </div>
        )
      },

    // 7. TEMPLATES
    {
      id: 'table-report-matrix', category: 'templates', name: isAr ? 'جدول تقارير المعاملات' : 'Data Matrix: Financial',
      render: (
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white w-full">
           <div className="bg-slate-900 text-white p-4 font-black text-[9px] uppercase tracking-widest flex justify-between items-center">
              <span>Request Ledger</span>
              <Badge className="bg-[#03CFCB] text-slate-900 text-[8px] rounded-sm px-2">LIVE</Badge>
           </div>
           <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-none group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">#0{i}</div>
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-800">Lease Renewal</span><span className="text-[8px] font-black text-slate-400">MAY 24, 2024</span></div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600">$25.00</span>
                </div>
              ))}
           </div>
        </Card>
      )
    }
  ], [isAr]);

  const filteredLibrary = useMemo(() => {
    return LIBRARY.filter(item => item.category === activeFilter);
  }, [activeFilter, LIBRARY]);

  return (
    <div className={cn("min-h-screen bg-[#F8FAFC]")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[#470D67]/10 text-[#470D67] font-black text-[10px] uppercase tracking-[0.3em]">
                <LayoutPanelTop size={16} /> Dhofar Municipality Engineering Matrix v8.0
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-[#470D67] tracking-tighter leading-none uppercase">
                {isAr ? 'موسوعة المكونات الهندسية' : 'Unified Component Hub'}
              </h1>
              <p className="text-xl font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'مرجع هندسي شامل يضم أكثر من 300 مكون مخصص لهوية بلدية ظفار الرقمية.' : 'Comprehensive engineering reference featuring 300+ custom components for Dhofar Municipality.'}
              </p>
            </div>
            <div className="relative z-10 size-48 rounded-[3.5rem] bg-[#03CFCB] text-slate-900 flex items-center justify-center shadow-xl rotate-6 group hover:rotate-0 transition-transform duration-700">
              <Palette size={80} />
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 space-y-12">
          {/* Category Navigation */}
          <div className="bg-white/60 backdrop-blur-xl p-3 rounded-[3rem] border border-white shadow-sm flex flex-wrap gap-2 justify-center sticky top-24 z-40">
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
                <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-fit flex flex-col ring-1 ring-slate-100">
                  <div className="p-10 flex-1 flex items-center justify-center bg-slate-50/20 relative overflow-hidden min-h-[150px]">
                     {comp.render}
                  </div>
                  
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                       <div>
                          <h4 className="font-black text-[#470D67] text-lg leading-tight tracking-tighter uppercase">{comp.name}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{CATEGORIES.find(c => c.id === comp.category)?.label}</p>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-[#470D67] size-10 shadow-sm" onClick={() => { setSelectedComponent(comp); setActiveTab('code'); }}>
                            <Code2 size={18}/>
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-[#03CFCB] size-10 shadow-sm" onClick={() => { setSelectedComponent(comp); setActiveTab('css'); }}>
                            <Braces size={18}/>
                          </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0 rounded-[3rem] border-none shadow-2xl flex flex-col bg-slate-950">
          <DialogHeader className="p-10 bg-slate-900 border-b border-white/5">
             <DialogTitle className="text-white text-3xl font-black uppercase tracking-tighter">{selectedComponent?.name}</DialogTitle>
             <DialogDescription className="text-[#03CFCB] font-black mt-2 uppercase text-[10px] tracking-[0.3em]">Component Architecture v8.2.1</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-10 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1.5 rounded-[1.5rem] mb-8 h-14 w-fit">
                  <TabsTrigger value="react" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-[#470D67]">React TSX</TabsTrigger>
                  <TabsTrigger value="html" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-[#03CFCB] data-[state=active]:text-slate-900">Tailwind HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="react">
                   <pre className="p-8 bg-black rounded-[2rem] text-emerald-400 font-mono text-xs overflow-x-auto border border-white/5">
                     <code>{`export const Component = () => (\n  <div className="p-6 bg-primary rounded-xl">\n    {/* Content for ${selectedComponent?.id} */}\n  </div>\n);`}</code>
                   </pre>
                </TabsContent>
              </Tabs>
            ) : (
              <pre className="p-8 bg-black rounded-[2rem] text-blue-300 font-mono text-xs overflow-x-auto min-h-[400px]">
                <code>{`.dm-component-${selectedComponent?.id} {\n  backdrop-filter: blur(10px);\n  background: rgba(255, 255, 255, 0.1);\n}`}</code>
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PortalFooter siteConfig={null} />
    </div>
  );
}