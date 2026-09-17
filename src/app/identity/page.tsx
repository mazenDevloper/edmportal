'use client';

import React, { useState, useMemo } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { 
  Palette, Code2, Braces, LayoutPanelTop, Landmark, CreditCard, ListChecks, 
  BarChart3, Table2, LayoutTemplate, Fingerprint, Globe, User2, Layers3, Zap, 
  Type, Search, ExternalLink, Activity, LayoutGrid, ArrowUpRight, TrendingUp,
  ShieldCheck, Mail, Phone, Box, Search as SearchIcon, FileText, Upload,
  MoreHorizontal, ChevronRight, CheckCircle2, User, PlayCircle, Award, Users,
  Star, Bell, Calendar, MousePointer2, RefreshCw, Layers
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function IdentityGuide() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'css'>('code');
  const [activeFilter, setActiveFilter] = useState('municipality');

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
           <div className="h-28 rounded-[2rem] bg-[#470D67] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Royal Purple</span><span className="text-[10px] text-white/50 font-mono">#470D67</span></div>
           <div className="h-28 rounded-[2rem] bg-[#03CFCB] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-slate-900 font-black uppercase tracking-widest">Vital Teal</span><span className="text-[10px] text-slate-900/50 font-mono">#03CFCB</span></div>
           <div className="h-28 rounded-[2rem] bg-[#00843D] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Oman Green</span><span className="text-[10px] text-white/50 font-mono">#00843D</span></div>
           <div className="h-28 rounded-[2rem] bg-slate-900 flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Slate Matrix</span><span className="text-[10px] text-white/50 font-mono">#0F172A</span></div>
        </div>
      )
    },
    {
      id: 'brand-typography', category: 'municipality', name: isAr ? 'الخط الرسمي (Readex Pro)' : 'Official Font Face',
      render: (
        <div className="space-y-8 w-full text-center py-6">
           <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Arabic Readex Pro</p>
              <h4 className="font-black text-4xl text-[#470D67]">بلدية ظفار الرقمية</h4>
           </div>
           <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">English Readex Pro</p>
              <h4 className="font-bold text-3xl text-[#03CFCB] tracking-tighter uppercase">Dhofar Digital Matrix</h4>
           </div>
        </div>
      )
    },
    {
      id: 'pattern-wave-cover', category: 'municipality', name: isAr ? 'نمط الموجة الرسمية' : 'Official Wave Pattern',
      render: (
        <div className="w-full h-56 rounded-[3rem] bg-[#470D67] relative overflow-hidden flex flex-col justify-end p-10 shadow-2xl border-4 border-white">
           <div className="absolute inset-0 dm-wave opacity-20 bg-repeat-x scale-150" />
           <div className="relative z-10 space-y-2">
              <Badge className="bg-white text-[#470D67] font-black px-4 py-1 rounded-lg">.dm-wave Cover</Badge>
              <p className="text-white/60 text-[10px] font-bold">Standard identity background</p>
           </div>
        </div>
      )
    },
    {
      id: 'pattern-polygon-cover', category: 'municipality', name: isAr ? 'نمط المضلعات' : 'Polygon Grid Pattern',
      render: (
        <div className="w-full h-56 rounded-[3rem] bg-[#03CFCB] relative overflow-hidden flex flex-col justify-end p-10 shadow-2xl border-4 border-white">
           <div className="absolute inset-0 dm-pattern-polygon opacity-10 bg-center bg-cover" />
           <div className="relative z-10 space-y-2">
              <Badge className="bg-slate-900 text-white font-black px-4 py-1 rounded-lg">.dm-pattern-polygon</Badge>
              <p className="text-slate-900/60 text-[10px] font-bold">Geometric matrix background</p>
           </div>
        </div>
      )
    },

    // 2. GOV.OM COMPONENTS
    {
      id: 'tajawoob-card-royal', category: 'gov', name: isAr ? 'كرت منصة تجاوب' : 'Tajawoob Citizen Hub',
      render: (
        <div className="p-10 bg-[#470D67] rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden group hover:scale-[1.02] transition-transform">
           <div className="absolute top-0 right-0 w-full h-full dm-wave opacity-10" />
           <div className="relative w-56 h-14">
              <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <p className="text-center text-[10px] font-black text-white/50 relative z-10 leading-relaxed uppercase tracking-[0.4em]">Integrated Suggestions & Complaint System</p>
           <Button className="w-full bg-white text-[#470D67] hover:bg-[#03CFCB] hover:text-white rounded-2xl h-14 font-black relative z-10 shadow-xl transition-all">Connect to Tajawoob</Button>
        </div>
      )
    },
    {
      id: 'vision-2040-card-green', category: 'gov', name: isAr ? 'رؤية عُمان 2040' : 'Oman Vision 2040',
      render: (
        <div className="p-10 bg-[#00843D] rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden">
           <div className="absolute inset-0 dm-pattern-polygon opacity-10" />
           <div className="relative w-48 h-24">
              <Image src="https://oman2040.om/themes/v2040/images/logo_en.png" alt="Vision 2040" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <div className="text-center text-white relative z-10 space-y-2">
              <h5 className="font-black text-xl">Moving Forward</h5>
              <Badge variant="outline" className="text-white/60 border-white/20">Strategic Hub</Badge>
           </div>
        </div>
      )
    },
    {
      id: 'thiqa-white-block', category: 'gov', name: isAr ? 'بوابة توثيق ثقة' : 'Thiqa National Auth',
      render: (
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden">
           <div className="size-20 bg-primary/5 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Fingerprint size={48} className="text-[#03CFCB]" />
           </div>
           <div className="text-center space-y-2">
              <h4 className="font-black text-slate-800 text-2xl">Digital Identity</h4>
              <Badge className="bg-[#03CFCB] text-slate-900 border-none rounded-lg text-[9px] px-4 font-black uppercase">ACTIVE & SECURE</Badge>
           </div>
           <Button variant="outline" className="w-full rounded-2xl h-14 font-black border-slate-200 hover:bg-[#03CFCB] hover:text-white transition-all">Verify via Thiqa</Button>
        </div>
      )
    },

    // 3. BASIC COMPONENTS
    {
      id: `buttons-stack`, category: 'basic', name: isAr ? 'مصفوفة الأزرار' : 'Neural Button Stack',
      render: (
        <div className="flex flex-wrap gap-4 justify-center w-full">
           <Button className="dm-gradient-primary rounded-2xl px-10 h-14 font-black shadow-xl">Teal Action</Button>
           <Button className="dm-gradient-royal rounded-2xl px-10 h-14 font-black shadow-xl text-white">Royal Action</Button>
           <Button variant="outline" className="rounded-2xl px-10 h-14 font-black border-[#470D67]/20 text-[#470D67]">Secondary</Button>
           <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-slate-50 text-[#03CFCB] hover:bg-[#470D67] hover:text-white transition-all shadow-md"><Zap size={24}/></Button>
        </div>
      )
    },

    // 4. CHARTS & COUNTERS
    {
      id: 'counter-modern-trans', category: 'charts', name: isAr ? 'عداد معاملات عصري' : 'Smart KPI Counter',
      render: (
        <div className="text-center p-12 bg-slate-950 rounded-[3.5rem] text-white w-full border-t-8 border-[#03CFCB] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 size-32 dm-wave opacity-5 -rotate-45" />
           <TrendingUp className="mx-auto text-[#03CFCB] mb-6 animate-pulse" size={48} />
           <h3 className="text-6xl font-black mb-2 tracking-tighter">42.5K</h3>
           <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em]">Digital Applications Processed</p>
        </div>
      )
    },
    {
        id: 'chart-bar-main', category: 'charts', name: isAr ? 'مؤشرات الأداء البيانية' : 'Performance Analytics',
        render: (
          <div className="w-full h-64 p-4 bg-white rounded-[2.5rem] shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                   {CHART_DATA.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#470D67' : '#03CFCB'} />)}
                </Bar>
                <Tooltip cursor={{fill: 'transparent'}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
    },

    // 5. FORMS
    {
      id: 'form-headers-stack', category: 'forms', name: isAr ? 'تدرجات العناوين' : 'Typography Headers',
      render: (
        <div className="space-y-6 w-full text-left">
           <h1 className="text-4xl font-black text-[#470D67] tracking-tighter">H1 Header Heading</h1>
           <h2 className="text-3xl font-bold text-[#03CFCB]">H2 Section Heading</h2>
           <h3 className="text-2xl font-black text-slate-800">H3 Subsection Content</h3>
           <h4 className="text-xl font-bold text-slate-600">H4 Small Feature Title</h4>
           <h5 className="text-sm font-black uppercase text-[#03CFCB] tracking-[0.2em]">H5 Micro Label Tag</h5>
        </div>
      )
    },
    {
      id: 'form-ready-input', category: 'forms', name: isAr ? 'حقل بحث ذكي' : 'Neural Search Bar',
      render: (
        <div className="space-y-6 w-full">
           <div className="relative group">
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#03CFCB] transition-colors" size={20} />
              <input className="w-full h-16 bg-slate-50 border-none rounded-[1.5rem] px-14 font-black shadow-inner focus:ring-4 focus:ring-[#03CFCB]/10 outline-none transition-all" placeholder="Search Data Matrix..." />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                 <Badge className="bg-slate-200 text-slate-500 font-mono text-[8px] px-2 py-0.5 rounded">CTRL</Badge>
                 <Badge className="bg-slate-200 text-slate-500 font-mono text-[8px] px-2 py-0.5 rounded">K</Badge>
              </div>
           </div>
        </div>
      )
    },

    // 6. CARDS
    {
      id: 'user-id-card', category: 'cards', name: isAr ? 'بطاقة المواطن الذكية' : 'Digital ID Card',
      render: (
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[4rem] shadow-2xl w-full relative overflow-hidden group">
           <div className="flex justify-between items-start mb-16 relative z-10">
              <Avatar className="size-20 border-8 border-slate-50 shadow-2xl ring-4 ring-[#03CFCB]/10"><AvatarImage src="https://picsum.photos/seed/oman/400/400" /><AvatarFallback>AM</AvatarFallback></Avatar>
              <Badge className="bg-[#470D67] text-white rounded-full font-black px-4 py-1 uppercase text-[9px] tracking-widest">CITIZEN NODE</Badge>
           </div>
           <div className="space-y-2 relative z-10">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Ahmed Salim Al-Maashani</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">National Resident Matrix: #12345678</p>
           </div>
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-polygon opacity-20 pointer-events-none" />
        </div>
      )
    },
    {
        id: 'balance-card-royal', category: 'cards', name: isAr ? 'محفظة الخدمات الملكية' : 'Digital Wallet Hub',
        render: (
          <div className="p-10 bg-[#470D67] rounded-[3.5rem] text-white w-full relative overflow-hidden border-b-[12px] border-[#03CFCB] shadow-2xl">
             <div className="absolute top-0 right-0 w-full h-full dm-wave opacity-10" />
             <p className="text-[9px] font-black opacity-60 uppercase tracking-[0.4em] mb-6">Current Portal Credit</p>
             <h3 className="text-5xl font-black text-[#03CFCB] tracking-tighter">4,290.00 OMR</h3>
             <div className="mt-12 flex justify-between items-center relative z-10">
                <div className="flex -space-x-4">
                   {[1,2,3].map(i => <Avatar key={i} className="size-10 border-4 border-[#470D67]"><AvatarImage src={`https://picsum.photos/seed/${i}/100/100`} /></Avatar>)}
                </div>
                <Button size="icon" variant="ghost" className="size-12 rounded-2xl bg-white/5 text-white hover:bg-[#03CFCB] hover:text-slate-900 transition-all shadow-xl"><ArrowUpRight size={24}/></Button>
             </div>
          </div>
        )
      },

    // 7. TEMPLATES
    {
      id: 'table-report-matrix', category: 'templates', name: isAr ? 'جدول التقارير المفلتر' : 'Data Ledger Template',
      render: (
        <div className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white w-full">
           <div className="bg-slate-950 text-white p-6 font-black text-[10px] uppercase tracking-[0.3em] flex justify-between items-center">
              <span>Transaction Ledger</span>
              <div className="flex gap-2">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[#03CFCB]">LIVE SYNC</span>
              </div>
           </div>
           <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center p-5 border-2 border-slate-50 rounded-2xl group hover:border-[#03CFCB]/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-[#470D67] group-hover:text-white transition-colors">#0{i}</div>
                    <div className="flex flex-col"><span className="text-xs font-black text-slate-800">Lease Contract Renewal</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MAY 24, 2024</span></div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black">+25.00 OMR</Badge>
                </div>
              ))}
           </div>
        </div>
      )
    }
  ], [isAr]);

  const filteredLibrary = useMemo(() => {
    return LIBRARY.filter(item => item.category === activeFilter);
  }, [activeFilter, LIBRARY]);

  return (
    <div className={cn("min-h-screen bg-slate-50")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        {/* Hub Hero */}
        <div className="max-w-[1600px] mx-auto px-6 mb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 p-16 bg-white rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group">
            <div className="relative z-10 space-y-8 flex-1">
              <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full bg-[#470D67]/5 text-[#470D67] font-black text-[11px] uppercase tracking-[0.4em] shadow-sm">
                <LayoutPanelTop size={18} className="text-[#03CFCB]" /> Dhofar Municipality Matrix Hub v10.0
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-[#470D67] tracking-tighter leading-[0.9] uppercase max-w-4xl">
                {isAr ? 'موسوعة المكونات الهندسية' : 'Unified Component Hub'}
              </h1>
              <p className="text-2xl font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'أكبر مرجع هندسي برمجياتي يضم أكثر من 300 مكون مخصص لهوية بلدية ظفار الرقمية.' : 'The largest engineering reference featuring 300+ custom widgets for Dhofar digital ecosystem.'}
              </p>
            </div>
            <div className="relative z-10 size-64 rounded-[4.5rem] bg-[#03CFCB] text-slate-900 flex items-center justify-center shadow-[0_30px_80px_rgba(3,207,203,0.4)] rotate-6 group-hover:rotate-0 transition-all duration-1000">
              <Palette size={100} />
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full dm-pattern-polygon opacity-[0.03] pointer-events-none scale-150" />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 space-y-16">
          {/* Category Navigation - Glassy Sticky */}
          <div className="bg-white/60 backdrop-blur-2xl p-4 rounded-[3.5rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-wrap gap-3 justify-center sticky top-24 z-40 transition-all ring-1 ring-slate-100/50">
             {CATEGORIES.map(cat => (
               <Button 
                key={cat.id} 
                variant="ghost" 
                onClick={() => setActiveFilter(cat.id)}
                className={cn(
                  "rounded-full px-10 font-black text-[12px] uppercase tracking-[0.1em] transition-all gap-3 h-14",
                  activeFilter === cat.id ? "bg-[#470D67] text-white shadow-2xl scale-105" : "text-slate-500 hover:bg-white"
                )}
               >
                 {cat.icon} {cat.label}
               </Button>
             ))}
          </div>

          {/* Masonry Layout for Components */}
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-10 space-y-10">
            {filteredLibrary.map((comp) => (
              <div key={comp.id} className="break-inside-avoid animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <Card className="rounded-[4rem] border-none shadow-[0_30px_70px_rgba(0,0,0,0.03)] bg-white overflow-hidden group hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] transition-all duration-700 hover:-translate-y-4 h-fit flex flex-col ring-1 ring-slate-100">
                  <div className="p-12 flex-1 flex items-center justify-center bg-slate-50/30 relative overflow-hidden min-h-[220px]">
                     {comp.render}
                  </div>
                  
                  <CardContent className="p-10 space-y-8">
                    <div className="flex justify-between items-center">
                       <div className="space-y-1">
                          <h4 className="font-black text-[#470D67] text-xl tracking-tighter uppercase">{comp.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             <Layers size={12} className="text-[#03CFCB]"/> {CATEGORIES.find(c => c.id === comp.category)?.label}
                          </p>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-[#470D67] size-12 shadow-sm" onClick={() => { setSelectedComponent(comp); setActiveTab('code'); }}>
                            <Code2 size={22}/>
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-[#03CFCB] size-12 shadow-sm" onClick={() => { setSelectedComponent(comp); setActiveTab('css'); }}>
                            <Braces size={22}/>
                          </Button>
                       </div>
                    </div>
                    
                    <Button className="w-full rounded-2xl h-14 font-black text-[11px] tracking-[0.2em] uppercase border-2 border-slate-100 bg-white text-slate-500 hover:bg-[#470D67] hover:text-white hover:border-[#470D67] transition-all duration-500 shadow-sm">
                       {isAr ? 'نسخ الكود الموحد' : 'Copy Hub Stack'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 rounded-[4rem] border-none shadow-[0_50px_150px_rgba(0,0,0,0.5)] flex flex-col bg-slate-950">
          <DialogHeader className="p-12 bg-slate-900 border-b border-white/5 relative overflow-hidden">
             <div className="relative z-10">
                <DialogTitle className="text-white text-4xl font-black uppercase tracking-tighter">{selectedComponent?.name}</DialogTitle>
                <DialogDescription className="text-[#03CFCB] font-black mt-3 uppercase text-[11px] tracking-[0.4em] flex items-center gap-2">
                   <ShieldCheck size={14}/> Enterprise Component Architecture v10.2
                </DialogDescription>
             </div>
             <div className="absolute top-0 right-0 w-full h-full dm-wave opacity-5 pointer-events-none" />
          </DialogHeader>

          <div className="flex-1 overflow-auto p-12 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-2 rounded-[2rem] mb-10 h-16 w-fit ring-1 ring-white/10">
                  <TabsTrigger value="react" className="font-black h-12 px-10 rounded-[1.5rem] data-[state=active]:bg-[#470D67] data-[state=active]:text-white">React TSX</TabsTrigger>
                  <TabsTrigger value="html" className="font-black h-12 px-10 rounded-[1.5rem] data-[state=active]:bg-[#03CFCB] data-[state=active]:text-slate-900">Tailwind HTML</TabsTrigger>
                  <TabsTrigger value="dotnet" className="font-black h-12 px-10 rounded-[1.5rem] data-[state=active]:bg-slate-700 data-[state=active]:text-white">C# .NET</TabsTrigger>
                </TabsList>
                <TabsContent value="react">
                   <pre className="p-10 bg-black rounded-[3rem] text-emerald-400 font-mono text-sm overflow-x-auto border border-white/5 shadow-inner leading-loose">
                     <code>{`/**\n * Dhofar Municipality Component Hub\n * Component: ${selectedComponent?.id}\n */\n\nexport const Component = () => (\n  <div className="p-12 bg-primary rounded-[3rem] shadow-2xl relative overflow-hidden">\n    <div className="dm-wave opacity-10" />\n    {/* Content Architecture */}\n  </div>\n);`}</code>
                   </pre>
                </TabsContent>
              </Tabs>
            ) : (
              <pre className="p-10 bg-black rounded-[3rem] text-blue-300 font-mono text-sm overflow-x-auto border border-white/5 shadow-inner leading-loose">
                <code>{`.dm-component-${selectedComponent?.id} {\n  backdrop-filter: blur(20px);\n  background: rgba(255, 255, 255, 0.05);\n  border-radius: 4rem;\n  box-shadow: 0 40px 100px rgba(0,0,0,0.1);\n  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);\n}`}</code>
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PortalFooter siteConfig={null} />
    </div>
  );
}