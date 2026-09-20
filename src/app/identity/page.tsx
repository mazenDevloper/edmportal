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
  Star, Bell, Calendar, MousePointer2, RefreshCw, Layers, Grid, List, MapPin,
  TrendingDown, FileSpreadsheet, Lock, Volume2, Video, Sparkles, Smartphone,
  Monitor, Maximize2, Check, X, Shield, Info, Clock, AlertTriangle, Share2,
  Download, PieChart, ShoppingBag, PlusCircle, MinusCircle, FileBox, Grid3X3,
  LineChart, Timer, Map
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
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line, RadialBarChart, RadialBar, Legend,
  ComposedChart, Scatter
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

  const RADIAL_DATA = [
    { name: 'Completed', value: 80, fill: '#03CFCB' },
    { name: 'Pending', value: 45, fill: '#470D67' },
    { name: 'Delayed', value: 20, fill: '#FF5733' }
  ];

  const LIBRARY = useMemo(() => [
    // 1. MUNICIPALITY IDENTITY
    {
      id: 'brand-palette', category: 'municipality', name: isAr ? 'لوحة الألوان الملكية' : 'Royal Color Palette',
      render: (
        <div className="grid grid-cols-2 gap-4 w-full">
           <div className="h-28 rounded-[2rem] bg-[#03CFCB] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-slate-900 font-black uppercase tracking-widest">Primary Teal</span><span className="text-[10px] text-slate-900/50 font-mono">#03CFCB</span></div>
           <div className="h-28 rounded-[2rem] bg-[#470D67] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Secondary Purple</span><span className="text-[10px] text-white/50 font-mono">#470D67</span></div>
           <div className="h-28 rounded-[2rem] bg-[#008E91] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Teal Shade 1</span><span className="text-[10px] text-white/50 font-mono">#008E91</span></div>
           <div className="h-28 rounded-[2rem] bg-[#005751] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-white font-black uppercase tracking-widest">Teal Shade 2</span><span className="text-[10px] text-white/50 font-mono">#005751</span></div>
           <div className="h-28 rounded-[2rem] bg-[#A187B2] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-slate-900 font-black uppercase tracking-widest">Purple Shade 1</span><span className="text-[10px] text-slate-900/50 font-mono">#A187B2</span></div>
           <div className="h-28 rounded-[2rem] bg-[#BCA3CC] flex flex-col justify-end p-5 border border-white/10 shadow-xl group hover:scale-105 transition-transform"><span className="text-[9px] text-slate-900 font-black uppercase tracking-widest">Purple Shade 2</span><span className="text-[10px] text-slate-900/50 font-mono">#BCA3CC</span></div>
        </div>
      )
    },
    {
      id: 'pattern-landmark', category: 'municipality', name: isAr ? 'نمط المعالم' : 'Landmark Pattern',
      render: (
        <div className="w-full h-56 rounded-[3rem] bg-secondary relative overflow-hidden flex flex-col justify-end p-10 shadow-2xl border-4 border-white">
           <div className="absolute inset-0 dm-pattern-landmark opacity-100" />
           <Badge className="relative z-10 bg-white text-secondary font-black px-4 py-1 rounded-lg w-fit">.dm-pattern-landmark</Badge>
        </div>
      )
    },
    {
      id: 'pattern-wave-pro', category: 'municipality', name: isAr ? 'نمط الأمواج' : 'Wave Pro Pattern',
      render: (
        <div className="w-full h-56 rounded-[3rem] bg-primary relative overflow-hidden flex flex-col justify-end p-10 shadow-2xl border-4 border-white">
           <div className="absolute inset-0 dm-pattern-wave-pro opacity-100" />
           <Badge className="relative z-10 bg-white text-primary font-black px-4 py-1 rounded-lg w-fit">.dm-pattern-wave-pro</Badge>
        </div>
      )
    },

    // 2. GOV.OM COMPONENTS
    {
      id: 'tajawoob-card-royal', category: 'gov', name: isAr ? 'كرت منصة تجاوب' : 'Tajawoob Citizen Hub',
      render: (
        <div className="p-10 bg-[#470D67] rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden group hover:scale-[1.02] transition-transform">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-wave-pro opacity-20" />
           <div className="relative w-56 h-14">
              <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <p className="text-center text-[10px] font-black text-white/50 relative z-10 leading-relaxed uppercase tracking-[0.4em]">National Suggestions & Complaints Platform</p>
           <Button className="w-full bg-white text-[#470D67] hover:bg-primary hover:text-white rounded-2xl h-14 font-black relative z-10 shadow-xl transition-all">Connect to Tajawoob</Button>
        </div>
      )
    },
    {
      id: 'vision-2040-card-green', category: 'gov', name: isAr ? 'رؤية عُمان 2040' : 'Oman Vision 2040',
      render: (
        <div className="p-10 bg-[#00843D] rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden">
           <div className="absolute inset-0 dm-pattern-tree-pro opacity-30" />
           <div className="relative w-48 h-24">
              <Image src="https://oman2040.om/themes/v2040/images/logo_en.png" alt="Vision 2040" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <div className="text-center text-white relative z-10 space-y-2">
              <h5 className="font-black text-xl">Moving Forward</h5>
              <Badge variant="outline" className="text-white/60 border-white/20">National Strategy Hub</Badge>
           </div>
        </div>
      )
    },
    {
      id: 'thiqa-white-card', category: 'gov', name: isAr ? 'كرت ثقة (الأبيض)' : 'Thiqa White Node',
      render: (
        <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-6 w-full relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-matrix-all opacity-5 pointer-events-none" />
           <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm relative z-10">
              <Fingerprint size={32}/>
           </div>
           <div className="text-center relative z-10">
              <h4 className="text-lg font-black text-slate-800 tracking-tight">Identity Authentication</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unified Digital Gateway</p>
           </div>
           <Button variant="outline" className="w-full rounded-xl border-slate-200 font-black h-12 relative z-10">Sign In with Thiqa</Button>
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
           <Button variant="outline" className="rounded-2xl px-10 h-14 font-black border-secondary/20 text-secondary">Secondary Outline</Button>
           <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-slate-50 text-primary hover:bg-secondary hover:text-white transition-all shadow-md"><Zap size={24}/></Button>
        </div>
      )
    },

    // 4. CHARTS & KPI
    {
      id: 'counter-modern-trans', category: 'charts', name: isAr ? 'عداد معاملات عصري' : 'Smart KPI Counter',
      render: (
        <div className="text-center p-12 bg-slate-950 rounded-[3.5rem] text-white w-full border-t-8 border-primary shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 size-32 dm-pattern-wave-pro opacity-5 -rotate-45" />
           <TrendingUp className="mx-auto text-primary mb-6 animate-pulse" size={48} />
           <h3 className="text-6xl font-black mb-2 tracking-tighter">42,590</h3>
           <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em]">Applications Processed</p>
        </div>
      )
    },
    {
        id: 'chart-radial-progress', category: 'charts', name: isAr ? 'مخطط إنجاز دائري' : 'Radial Goal Tracker',
        render: (
          <div className="w-full h-64 bg-white rounded-[3rem] p-4 flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={10} data={RADIAL_DATA}>
                  <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="value" />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                </RadialBarChart>
             </ResponsiveContainer>
          </div>
        )
    },

    // 5. SMART CARDS (ALL PATTERNS)
    {
      id: 'user-id-card-matrix', category: 'cards', name: isAr ? 'بطاقة المواطن (مصفوفة)' : 'Digital ID (Matrix)',
      render: (
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[4rem] shadow-2xl w-full relative overflow-hidden group">
           <div className="flex justify-between items-start mb-16 relative z-10">
              <Avatar className="size-20 border-8 border-slate-50 shadow-2xl ring-4 ring-primary/10"><AvatarFallback className="bg-slate-100 font-black">AM</AvatarFallback></Avatar>
              <Badge className="bg-secondary text-white rounded-full font-black px-4 py-1 uppercase text-[9px] tracking-widest">CITIZEN NODE</Badge>
           </div>
           <div className="space-y-2 relative z-10">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Ahmed Salim Al-Maashani</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">National Resident Matrix: #12345678</p>
           </div>
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-matrix-all opacity-20 pointer-events-none" />
        </div>
      )
    },
    {
      id: 'user-id-card-landmark', category: 'cards', name: isAr ? 'بطاقة المواطن (معالم)' : 'Digital ID (Landmark)',
      render: (
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[4rem] shadow-2xl w-full relative overflow-hidden group">
           <div className="flex justify-between items-start mb-16 relative z-10">
              <Avatar className="size-20 border-8 border-slate-50 shadow-2xl ring-4 ring-primary/10"><AvatarFallback className="bg-slate-100 font-black">AM</AvatarFallback></Avatar>
              <Badge className="bg-secondary text-white rounded-full font-black px-4 py-1 uppercase text-[9px] tracking-widest">CITIZEN NODE</Badge>
           </div>
           <div className="space-y-2 relative z-10">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Ahmed Salim Al-Maashani</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">National Resident Matrix: #12345678</p>
           </div>
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-landmark opacity-15 pointer-events-none" />
        </div>
      )
    },
    {
      id: 'user-id-card-wave', category: 'cards', name: isAr ? 'بطاقة المواطن (أمواج)' : 'Digital ID (Wave)',
      render: (
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[4rem] shadow-2xl w-full relative overflow-hidden group">
           <div className="flex justify-between items-start mb-16 relative z-10">
              <Avatar className="size-20 border-8 border-slate-50 shadow-2xl ring-4 ring-primary/10"><AvatarFallback className="bg-slate-100 font-black">AM</AvatarFallback></Avatar>
              <Badge className="bg-secondary text-white rounded-full font-black px-4 py-1 uppercase text-[9px] tracking-widest">CITIZEN NODE</Badge>
           </div>
           <div className="space-y-2 relative z-10">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Ahmed Salim Al-Maashani</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">National Resident Matrix: #12345678</p>
           </div>
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-wave-pro opacity-15 pointer-events-none" />
        </div>
      )
    },

    // 6. TEMPLATES (LEDGERS & REPORTS)
    {
      id: 'table-report-matrix', category: 'templates', name: isAr ? 'جدول التقارير المفلتر' : 'Data Ledger Template',
      render: (
        <div className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white w-full">
           <div className="bg-slate-950 text-white p-6 font-black text-[10px] uppercase tracking-widest flex justify-between items-center">
              <span>Transaction Ledger</span>
              <div className="flex gap-2">
                 <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-primary">LIVE SYNC</span>
              </div>
           </div>
           <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center p-5 border-2 border-slate-50 rounded-2xl group hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-secondary group-hover:text-white transition-colors">#0{i}</div>
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
    if (activeFilter === 'all') return LIBRARY;
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
              <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full bg-secondary/5 text-secondary font-black text-[11px] uppercase tracking-widest shadow-sm">
                <LayoutPanelTop size={18} className="text-primary" /> Matrix Component Hub v12.0
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-secondary tracking-tighter leading-[0.9] uppercase max-w-4xl">
                {isAr ? 'موسوعة المكونات الهندسية' : 'Unified Component Hub'}
              </h1>
              <p className="text-2xl font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'المرجع الهندسي الشامل لبناء المنظومات الرقمية لبلدية ظفار بـ 300+ مكون.' : 'The comprehensive engineering reference for Dhofar digital systems with 300+ components.'}
              </p>
            </div>
            <div className="relative z-10 size-64 rounded-[4.5rem] bg-primary text-slate-900 flex items-center justify-center shadow-[0_30px_80px_rgba(3,207,203,0.4)] rotate-6 group-hover:rotate-0 transition-all duration-1000">
              <Palette size={100} />
            </div>
            <div className="absolute top-0 right-0 w-1/2 h-full dm-pattern-matrix-all opacity-[0.03] pointer-events-none scale-150" />
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 space-y-16">
          <div className="bg-white/60 backdrop-blur-2xl p-4 rounded-[3.5rem] border border-white shadow-sm flex flex-wrap gap-3 justify-center sticky top-24 z-40">
             {CATEGORIES.map(cat => (
               <Button 
                key={cat.id} 
                variant="ghost" 
                onClick={() => setActiveFilter(cat.id)}
                className={cn(
                  "rounded-full px-10 font-black text-[12px] uppercase tracking-widest transition-all gap-3 h-14",
                  activeFilter === cat.id ? "bg-secondary text-white shadow-2xl scale-105" : "text-slate-500 hover:bg-white"
                )}
               >
                 {cat.icon} {cat.label}
               </Button>
             ))}
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-10 space-y-10">
            {filteredLibrary.map((comp) => (
              <div key={comp.id} className="break-inside-avoid animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <Card className="rounded-[4rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-700 hover:-translate-y-4 h-fit flex flex-col ring-1 ring-slate-100">
                  <div className="p-12 flex-1 flex items-center justify-center bg-slate-50/30 relative overflow-hidden min-h-[220px]">
                     {comp.render}
                  </div>
                  <CardContent className="p-10 space-y-8">
                    <div className="flex justify-between items-center">
                       <div className="space-y-1">
                          <h4 className="font-black text-secondary text-xl tracking-tighter uppercase">{comp.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Layers size={12} className="text-primary"/> {CATEGORIES.find(c => c.id === comp.category)?.label}
                          </p>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-secondary size-12 shadow-sm">
                            <Code2 size={22}/>
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-primary size-12 shadow-sm">
                            <Braces size={22}/>
                          </Button>
                       </div>
                    </div>
                    <Button className="w-full rounded-2xl h-14 font-black text-[11px] tracking-widest uppercase border-2 border-slate-100 bg-white text-slate-500 hover:bg-secondary hover:text-white transition-all duration-500 shadow-sm">
                       {isAr ? 'نسخ الكود الموحد' : 'Copy Hub Stack'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}