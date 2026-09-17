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
  PlusCircle, MinusCircle, FileBox, LineChart, RefreshCw, Box, ArrowUpRight
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
           <div className="h-20 rounded-[1.5rem] bg-[#470D67] flex items-end p-4 border border-white/10 shadow-lg"><span className="text-[9px] text-white font-black uppercase tracking-widest">Royal Purple #470D67</span></div>
           <div className="h-20 rounded-[1.5rem] bg-[#03CFCB] flex items-end p-4 border border-white/10 shadow-lg"><span className="text-[9px] text-slate-900 font-black uppercase tracking-widest">Vital Teal #03CFCB</span></div>
           <div className="h-20 rounded-[1.5rem] bg-[#00843D] flex items-end p-4 border border-white/10 shadow-lg"><span className="text-[9px] text-white font-black uppercase tracking-widest">Oman Green #00843D</span></div>
           <div className="h-20 rounded-[1.5rem] bg-white flex items-end p-4 border border-slate-100 shadow-lg"><span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Pure White #FFFFFF</span></div>
        </div>
      ),
      codeReact: `// Primary: #470D67 | Accent: #03CFCB`,
      codeCss: `:root { --primary: #470D67; --accent: #03CFCB; }`
    },
    {
      id: 'brand-typography', category: 'municipality', name: isAr ? 'الخط الرسمي (Readex Pro)' : 'Official Font: Readex Pro',
      render: (
        <div className="space-y-6 w-full text-center">
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Arabic Font Face</p>
              <h4 className="font-black text-4xl text-[#470D67] font-readex">بلدية ظفار الرقمية</h4>
           </div>
           <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">English Font Face</p>
              <h4 className="font-bold text-3xl text-[#470D67] font-readex tracking-tighter uppercase">Dhofar Digital Matrix</h4>
           </div>
        </div>
      ),
      codeReact: `<h1 className="font-readex font-black">...</h1>`,
      codeCss: `body { font-family: 'Readex Pro', sans-serif !important; }`
    },
    {
      id: 'pattern-wave-white', category: 'municipality', name: isAr ? 'نمط الموجة (.dm-wave)' : 'Wave Pattern Cover',
      render: (
        <Card className="w-full h-48 rounded-[3rem] bg-[#470D67] relative overflow-hidden flex flex-col justify-end p-8 border-4 border-white shadow-2xl">
           <div className="absolute inset-0 dm-wave opacity-20 bg-[url('data:image/svg+xml,...')] bg-repeat-x scale-150" />
           <Badge className="bg-white text-[#470D67] font-black w-fit relative z-10 text-[10px] tracking-widest uppercase">.dm-wave Pattern</Badge>
        </Card>
      ),
      codeReact: `<div className="dm-wave" />`,
      codeCss: `.dm-wave { background-image: url(...); opacity: 0.2; }`
    },
    {
      id: 'pattern-polygon-white', category: 'municipality', name: isAr ? 'نمط المضلعات (.dm-pattern-polygon)' : 'Polygon Pattern Cover',
      render: (
        <Card className="w-full h-48 rounded-[3rem] bg-[#470D67] relative overflow-hidden flex flex-col justify-end p-8 border-4 border-white shadow-2xl">
           <div className="absolute inset-0 dm-pattern-polygon opacity-10 bg-[url('data:image/svg+xml,...')] bg-center bg-cover" />
           <Badge className="bg-white text-[#470D67] font-black w-fit relative z-10 text-[10px] tracking-widest uppercase">.dm-pattern-polygon</Badge>
        </Card>
      ),
      codeReact: `<div className="dm-pattern-polygon" />`,
      codeCss: `.dm-pattern-polygon { mask-image: ...; }`
    },

    // 2. GOV.OM COMPONENTS
    {
      id: 'vision-2040-card', category: 'gov', name: isAr ? 'كرت رؤية عُمان 2040' : 'Oman Vision 2040 Hub',
      render: (
        <div className="p-10 bg-[#470D67] rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden group border-t-[12px] border-[#03CFCB]">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-polygon opacity-10" />
           <div className="relative w-48 h-16">
              <Image src="https://oman2040.om/themes/v2040/images/logo_en.png" alt="Vision 2040" fill className="object-contain brightness-0 invert" unoptimized />
           </div>
           <p className="text-center text-[10px] font-black text-white/50 relative z-10 leading-relaxed uppercase tracking-[0.4em]">Moving Forward with Confidence</p>
           <Button className="w-full bg-white text-[#470D67] hover:bg-[#03CFCB] hover:text-white rounded-2xl h-14 font-black relative z-10 shadow-xl transition-all">Launch Strategic Portal</Button>
        </div>
      ),
      codeReact: `<Vision2040Card />`,
      codeCss: `.gov-vision-hub { background: #470D67; border-top: 12px solid #03CFCB; }`
    },
    {
      id: 'tajawoob-card', category: 'gov', name: isAr ? 'كرت منصة تجاوب' : 'Tajawoob Citizen Voice',
      render: (
        <div className="p-10 bg-white border-2 border-slate-100 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-8 w-full relative overflow-hidden">
           <div className="relative w-48 h-12">
              <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" fill className="object-contain" unoptimized />
           </div>
           <p className="text-center text-xs font-bold text-slate-500 leading-loose max-w-[200px]">
             {isAr ? 'المنصة الوطنية الموحدة للمقترحات والشكاوى في سلطنة عُمان.' : 'The national unified platform for citizens voice in Oman.'}
           </p>
           <Button className="w-full bg-[#00843D] hover:bg-[#006e32] text-white rounded-2xl h-14 font-black relative z-10 shadow-xl">إرسال مقترح / بلاغ</Button>
        </div>
      ),
      codeReact: `<TajawoobCard />`,
      codeCss: `.card-tajawoob { border: 2px solid #f1f5f9; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }`
    },

    // 3. BASIC COMPONENTS
    {
      id: `basic-btn-stack`, category: 'basic', name: isAr ? 'مصفوفة الأزرار' : 'Neural Button Stack',
      render: (
        <div className="flex flex-wrap gap-4 justify-center w-full">
           <Button className="dm-gradient-primary rounded-xl px-8 h-12 font-black shadow-lg">Confirm Action</Button>
           <Button variant="outline" className="rounded-xl px-8 h-12 font-black border-[#470D67]/20 text-[#470D67]">Cancel Request</Button>
           <Button variant="ghost" size="icon" className="size-12 rounded-xl bg-slate-50 text-accent hover:bg-[#470D67] hover:text-white"><Zap size={20}/></Button>
        </div>
      ),
      codeReact: `<Button className="dm-gradient-primary">...</Button>`
    },

    // 4. CHARTS & KPI
    {
      id: 'chart-area-main', category: 'charts', name: isAr ? 'منحنى المعاملات' : 'Digital Transactions Area',
      render: (
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="colTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#03CFCB" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#03CFCB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#03CFCB" fill="url(#colTeal)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )
    },

    // 5. FORMS
    {
      id: 'form-neural-search', category: 'forms', name: isAr ? 'حقل بحث عصبي' : 'Neural Matrix Search',
      render: (
        <div className="relative w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input className="w-full h-14 bg-slate-50 border-none rounded-2xl px-12 font-bold shadow-inner outline-none focus:ring-2 focus:ring-[#03CFCB]/20" placeholder="Search Matrix..." />
           <div className="absolute right-3 top-1/2 -translate-y-1/2"><Badge className="bg-primary text-white text-[9px] px-2 rounded-md tracking-tighter">ENTER</Badge></div>
        </div>
      )
    },

    // 6. CARDS
    {
      id: 'card-balance-royal', category: 'cards', name: isAr ? 'بطاقة الرصيد الملكية' : 'Royal Wallet Balance',
      render: (
        <div className="p-8 bg-[#470D67] rounded-[2.5rem] text-white w-full relative overflow-hidden border-b-[8px] border-[#03CFCB] shadow-2xl">
           <div className="absolute top-0 right-0 w-full h-full dm-pattern-polygon opacity-10" />
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
      id: 'table-report-financial', category: 'templates', name: isAr ? 'جدول تقارير المعاملات' : 'Data Matrix: Financial',
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
    <div className={cn("min-h-screen bg-[#F8FAFC] font-readex")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[#470D67]/10 text-[#470D67] font-black text-[10px] uppercase tracking-[0.3em]">
                <LayoutPanelTop size={16} /> Dhofar Municipality Identity v6.0
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-[#470D67] tracking-tighter leading-none uppercase">
                {isAr ? 'موسوعة الأصول الهندسية' : 'Unified Engineering Hub'}
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
          <DialogHeader className="p-10 bg-slate-900 border-b border-white/5 relative overflow-hidden">
             <div className="relative z-10">
                <DialogTitle className="text-white text-3xl font-black uppercase tracking-tighter">{selectedComponent?.name}</DialogTitle>
                <DialogDescription className="text-[#03CFCB] font-black mt-2 uppercase text-[10px] tracking-[0.3em]">Component Architecture v6.2.1</DialogDescription>
             </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-10 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1.5 rounded-[1.5rem] mb-8 h-14 w-fit">
                  <TabsTrigger value="react" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-[#470D67]">React TSX</TabsTrigger>
                  <TabsTrigger value="html" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-[#03CFCB] data-[state=active]:text-slate-900">Tailwind HTML</TabsTrigger>
                  <TabsTrigger value="dotnet" className="font-black h-11 px-8 rounded-xl data-[state=active]:bg-slate-800">.NET Model</TabsTrigger>
                </TabsList>
                
                <TabsContent value="react" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto border border-white/5 shadow-2xl">
                     <code>{selectedComponent?.codeReact || `export const Component = () => (\n  <div className="p-6 bg-primary rounded-xl">\n    {/* Content for ${selectedComponent?.id} */}\n  </div>\n);`}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeReact || '')} className="absolute top-6 right-6 bg-white/10 text-white rounded-xl size-12 p-0 border border-white/10 hover:bg-white/20 transition-all"><Copy size={20}/></Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative group h-full">
                <pre className="p-8 bg-black rounded-[2rem] text-blue-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[400px] border border-white/5 shadow-2xl">
                  <code>{selectedComponent?.codeCss || `.dm-component-${selectedComponent?.id} {\n  backdrop-filter: blur(10px);\n  background: rgba(255, 255, 255, 0.1);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n}`}</code>
                </pre>
                <Button onClick={() => handleCopy(selectedComponent?.codeCss || '')} className="absolute top-6 right-6 bg-white/10 text-white rounded-xl size-12 p-0 border border-white/10 hover:bg-white/20 transition-all"><Copy size={20}/></Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
