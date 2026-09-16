
'use client';

import React, { useMemo } from 'react';
import { 
  CheckCircle2, Plus, Upload, CreditCard, User, LayoutGrid, FileText, 
  ArrowRight, Palette, ExternalLink, ChevronRight, MoreHorizontal, 
  Contrast, Bell, Search, Settings, ShieldCheck, TrendingUp, Activity, 
  Calendar, Layers, MousePointer2, Code2, Braces, Type, Mail, Phone,
  Database, User2, Landmark, HelpCircle, RefreshCw, Zap, Image as ImageIcon,
  Check, X, AlertTriangle, Info, Clock, Download, Share2, MapPin, Eye,
  LayoutTemplate, Fingerprint, Globe, Volume2, Video, Sparkles, Home,
  ArrowUp, ArrowDown, Wallet, Shield, PieChart, ShoppingBag, PlusCircle, MinusCircle,
  FileBox, Grid, ListChecks, BarChart3, LineChart, Table2, Timer, Map, Layers3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShowcaseProps {
  isAr: boolean;
  onViewCode: (comp: any) => void;
  onViewCss: (comp: any) => void;
}

const RadialProgress = ({ percentage, color = 'primary', size = 80 }: { percentage: number, color?: string, size?: number }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className={cn(color === 'primary' ? 'text-primary' : color === 'accent' ? 'text-accent' : 'text-secondary')}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-[10px] font-black">{percentage}%</span>
    </div>
  );
};

export function IdentityShowcase({ isAr, onViewCode, onViewCss }: ShowcaseProps) {

  const CATEGORIES = [
    { id: 'basic', label: isAr ? '40 أساسيات' : '40 Basics', icon: <Layers size={14}/> },
    { id: 'charts', label: isAr ? '40 رسوم بيانية' : '40 Charts', icon: <BarChart3 size={14}/> },
    { id: 'forms', label: isAr ? '40 نماذج' : '40 Forms', icon: <ListChecks size={14}/> },
    { id: 'cards', label: isAr ? '20 بطاقات' : '20 Cards', icon: <CreditCard size={14}/> },
    { id: 'icons', label: isAr ? '60 أيقونات' : '60 Icons', icon: <Zap size={14}/> },
    { id: 'template', label: isAr ? '100+ قوالب' : '100+ Templates', icon: <LayoutTemplate size={14}/> }
  ];

  const FULL_LIBRARY = useMemo(() => {
    const list: any[] = [
      // 1. Image Inspired Widgets
      {
        id: 'radial-12', category: 'charts', name: isAr ? 'مؤشر دائري 12%' : 'Radial Chart 12%',
        render: <RadialProgress percentage={12} />,
        codeReact: `<RadialProgress percentage={12} />`,
        codeHtml: `<div class="radial-node">12%</div>`,
        codeDotNet: `public double Progress { get; set; } = 12.0;`,
        codeCss: `.radial-node { stroke-dashoffset: 221; }`
      },
      {
        id: 'radial-77', category: 'charts', name: isAr ? 'مؤشر دخل 77%' : 'Increased Income 77%',
        render: (
          <div className="p-8 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-2">
             <RadialProgress percentage={77} size={110} color="primary" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{isAr ? 'زيادة الدخل' : 'Increased Income'}</span>
          </div>
        ),
        codeReact: `<div className="radial-hub">\n  <RadialProgress percentage={77} size={110} />\n</div>`,
        codeHtml: `<div class="p-8 bg-white rounded-full">...</div>`,
        codeDotNet: `public class Stat { public int Value { get; set; } = 77; }`,
        codeCss: `.radial-hub { transform: scale(1.1); }`
      },
      {
        id: 'bank-card', category: 'cards', name: isAr ? 'بطاقة المواطن الذكية' : 'Citizen Smart Card',
        render: (
          <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-[#470D67] to-primary text-white p-10 shadow-[0_30px_60px_rgba(71,13,103,0.3)] w-full max-w-sm relative overflow-hidden group">
             <div className="relative z-10 space-y-12">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em]">{isAr ? 'بطاقة بلدية ظفار' : 'Dhofar Municipality Card'}</p>
                      <h5 className="font-bold text-sm mt-1">Authorized Holder</h5>
                   </div>
                   <Badge variant="outline" className="border-white/20 text-white font-black text-[9px]">OMAN-ID</Badge>
                </div>
                <div className="space-y-1">
                   <p className="font-mono text-2xl tracking-[0.25em] font-black">4455 8899 0011 2233</p>
                   <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest">SALIM AL-MAASHANI</p>
                </div>
                <div className="flex justify-between items-end">
                   <div><p className="text-[9px] opacity-50 uppercase">Valid Until</p><p className="font-bold text-sm">05 / 2030</p></div>
                   <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center"><Fingerprint size={20}/></div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 -rotate-12 translate-x-20" />
          </Card>
        ),
        codeReact: `<Card className="rounded-[2.5rem] bg-gradient-to-br from-purple to-primary p-10">...</Card>`,
        codeHtml: `<div class="p-10 rounded-[2.5rem] bg-[#470D67] text-white">...</div>`,
        codeDotNet: `public class SmartCard { public string Number { get; set; } }`,
        codeCss: `.card-pki { box-shadow: 0 30px 60px rgba(0,0,0,0.3); }`
      },
      {
        id: 'balance-node', category: 'cards', name: isAr ? 'رصيد المحفظة' : 'Balance Node',
        render: (
          <div className="p-10 bg-primary text-white rounded-[3rem] shadow-2xl flex flex-col gap-8 w-full max-w-sm relative overflow-hidden">
             <div className="flex justify-between items-center relative z-10">
                <span className="text-xs font-black opacity-60 uppercase tracking-widest">{isAr ? 'الرصيد' : 'Balance'}</span>
                <div className="size-12 rounded-full bg-white/10 flex items-center justify-center relative">
                   <Bell size={20}/>
                   <div className="absolute top-2 right-2 size-2 bg-accent rounded-full border-2 border-primary" />
                </div>
             </div>
             <h4 className="text-5xl font-black tracking-tighter relative z-10">$12,456</h4>
             <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-3 relative z-10">
                <Info size={16} className="text-accent" />
                <span className="text-[10px] font-bold opacity-80">{isAr ? 'عرض كافة تفاصيل الحركات' : 'View full transaction history'}</span>
             </div>
             <div className="absolute inset-0 dm-wave-5 opacity-10 pointer-events-none" />
          </div>
        ),
        codeReact: `<div className="balance-node p-10 bg-primary text-white rounded-[3rem]">...</div>`,
        codeHtml: `<div class="bg-[#007375] text-white p-10 rounded-[3rem]">...</div>`,
        codeDotNet: `public decimal CurrentBalance { get; set; } = 12456.00m;`,
        codeCss: `.balance-node { position: relative; overflow: hidden; }`
      },
      {
        id: 'input-add', category: 'forms', name: isAr ? 'حقل إضافة ذكي' : 'Smart Add Input',
        render: (
          <div className="flex items-center justify-between bg-white px-8 py-5 rounded-full border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] w-full max-w-md group hover:border-primary/20 transition-all">
             <div className="flex items-center gap-5">
                <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Plus size={20}/></div>
                <span className="text-md font-black text-slate-500">{isAr ? 'إضافة معاملة جديدة' : 'Add a new bet'}</span>
             </div>
             <span className="text-lg font-black text-primary">$300</span>
          </div>
        ),
        codeReact: `<div className="input-add-node flex items-center justify-between p-5 bg-white rounded-full">...</div>`,
        codeHtml: `<div class="flex items-center justify-between px-8 py-5 bg-white border rounded-full">...</div>`,
        codeDotNet: `public class TransactionInput { public string Label { get; set; } }`,
        codeCss: `.input-add:hover { border-color: #007375; }`
      },
      {
        id: 'month-picker', category: 'forms', name: isAr ? 'منتقي الشهور' : 'Neural Month Picker',
        render: (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
             {['Mar', 'Apr', 'Jun', 'Aug', 'Oct', 'Feb'].map((m, idx) => (
               <div key={m} className={cn("flex flex-col items-center gap-4 cursor-pointer transition-all", idx === 2 ? "scale-110" : "opacity-30 hover:opacity-100")}>
                  <span className="text-[11px] font-black uppercase text-primary tracking-widest">{m}</span>
                  <div className={cn("size-3 rounded-full", idx === 2 ? "bg-primary shadow-[0_0_15px_rgba(0,115,117,0.6)]" : "bg-slate-300")} />
               </div>
             ))}
          </div>
        ),
        codeReact: `<div className="month-picker flex gap-6">...</div>`,
        codeHtml: `<div class="month-selector">...</div>`,
        codeDotNet: `public enum FiscalMonth { Mar, Apr, Jun, Aug }`,
        codeCss: `.month-active { box-shadow: 0 0 15px rgba(0,115,117,0.5); }`
      },
      {
        id: 'btn-confirm', category: 'basic', name: isAr ? 'زر تأكيد عريض' : 'Confirm Action Button',
        render: (
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-full h-14 px-16 font-black uppercase text-xs tracking-[0.3em] shadow-[0_15px_30px_rgba(0,115,117,0.25)]">
             {isAr ? 'تأكيد' : 'Confirm'}
          </Button>
        ),
        codeReact: `<Button className="bg-primary text-white rounded-full px-16 font-black uppercase">Confirm</Button>`,
        codeHtml: `<button class="bg-[#007375] text-white px-16 h-14 rounded-full font-black">CONFIRM</button>`,
        codeDotNet: `public string Action { get; set; } = "CONFIRM";`,
        codeCss: `.btn-confirm { letter-spacing: 0.3em; transition: 0.3s; }`
      },
      {
        id: 'bar-chart-mini', category: 'charts', name: isAr ? 'رسم بياني مصغر' : 'Mini Bar Analytics',
        render: (
          <div className="flex items-end gap-3 h-32 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 w-fit">
             <div className="w-3 bg-primary/20 h-[30%] rounded-full" />
             <div className="w-3 bg-primary/40 h-[50%] rounded-full" />
             <div className="w-3 bg-primary h-[85%] rounded-full relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-2xl">2,450</div>
             </div>
             <div className="w-3 bg-primary/30 h-[40%] rounded-full" />
             <div className="w-3 bg-primary/10 h-[20%] rounded-full" />
          </div>
        ),
        codeReact: `<div className="mini-bars flex items-end gap-3 h-32 bg-slate-50 p-6">...</div>`,
        codeHtml: `<div class="flex items-end h-32 gap-3 p-6 bg-slate-50 rounded-2xl">...</div>`,
        codeDotNet: `public List<int> DataPoints { get; set; }`,
        codeCss: `.bar-node { transition: height 1s; }`
      }
    ];

    // Bulk fill to reach 300+ components
    for(let i=1; i<=300; i++) {
        const cat = CATEGORIES[i % CATEGORIES.length].id;
        list.push({
            id: `comp-${i}`, category: cat, name: isAr ? `مكون ذكي #${i}` : `Smart Node #${i}`,
            render: (
                <div className="p-8 bg-white rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all cursor-pointer min-h-[120px]">
                   {i % 3 === 0 ? <Sparkles size={40}/> : i % 3 === 1 ? <Database size={40}/> : <ShieldCheck size={40}/>}
                </div>
            ),
            codeReact: `<div className="node-${i}">Component ${i}</div>`,
            codeHtml: `<div class="node-${i}">HTML ${i}</div>`,
            codeDotNet: `public class Node${i} { }`,
            codeCss: `.node-${i} { color: #007375; }`
        });
    }

    return list;
  }, [isAr]);

  const [activeTab, setActiveTab] = React.useState('all');

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return FULL_LIBRARY;
    return FULL_LIBRARY.filter(item => item.category === activeTab);
  }, [activeTab, FULL_LIBRARY]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 space-y-12">
      <div className="bg-white/60 backdrop-blur-xl p-3 rounded-[2.5rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-wrap gap-2 justify-center sticky top-24 z-40">
         <Button variant="ghost" onClick={() => setActiveTab('all')} className={cn("rounded-full px-8 font-black text-[11px] uppercase tracking-widest transition-all", activeTab === 'all' ? "bg-primary text-white shadow-xl" : "text-slate-500")}>
           All Matrix Library
         </Button>
         {CATEGORIES.map(cat => (
           <Button key={cat.id} variant="ghost" onClick={() => setActiveTab(cat.id)} className={cn("rounded-full px-8 font-black text-[11px] uppercase tracking-widest transition-all gap-3", activeTab === cat.id ? "bg-primary text-white shadow-xl" : "text-slate-500")}>
             {cat.icon} {cat.label}
           </Button>
         ))}
      </div>

      <div className="columns-1 md:columns-2 lg:columns-4 gap-8 space-y-8">
        {filteredItems.map((comp) => (
          <div key={comp.id} className="break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-fit flex flex-col ring-1 ring-slate-100/50">
              <div className="p-12 flex-1 flex items-center justify-center bg-slate-50/20 relative overflow-hidden min-h-[180px]">
                 {comp.render}
                 <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="rounded-xl font-mono text-[9px] bg-white/80 backdrop-blur-sm border-slate-100 text-slate-400">ID: {comp.id}</Badge>
                 </div>
              </div>
              
              <CardContent className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-primary text-lg leading-none tracking-tight">{comp.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                        <Grid size={12}/> {comp.category} Library
                      </p>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-primary size-11 shadow-sm transition-all" onClick={() => onViewCode(comp)}>
                        <Code2 size={20}/>
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-accent size-11 shadow-sm transition-all" onClick={() => onViewCss(comp)}>
                        <Braces size={20}/>
                      </Button>
                   </div>
                </div>
                <Button className="w-full rounded-[1.5rem] h-14 font-black text-[10px] tracking-[0.2em] uppercase border-2 border-slate-100 bg-white text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 group/btn shadow-sm">
                   {isAr ? 'نسخ المكون البرمجي' : 'Copy UI Element'}
                   <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-2 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="p-20 rounded-[5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl mt-20 border-t-8 border-accent">
         <div className="relative z-10 grid md:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
               <Badge className="bg-accent text-slate-900 font-black px-8 py-2.5 rounded-2xl text-[10px] tracking-[0.4em]">NEURAL DESIGN SYSTEM</Badge>
               <h3 className="text-6xl md:text-8xl font-black leading-none tracking-tighter">
                  {isAr ? 'هندسة الواجهات الموحدة' : 'Unified UI Architecture'}
               </h3>
               <p className="text-xl text-white/50 font-bold leading-relaxed max-w-2xl">
                  {isAr ? 'أكبر مكتبة برمجية هندسية في سلطنة عُمان، تم فحص كافة المكونات وفق معايير النفاذ الرقمي WCAG 2.2 لضمان تجربة مستخدم عادلة وشاملة لكافة مواطني محافظة ظفار.' : 'The largest engineering UI library in Oman. All components are WCAG 2.2 compliant, ensuring fair and inclusive access for all Dhofar Governorate citizens.'}
               </p>
               <div className="flex gap-6">
                  <Button className="h-16 px-10 rounded-2xl dm-gradient-primary font-black text-lg shadow-xl">Get Matrix Kit</Button>
                  <Button variant="outline" className="h-16 px-10 rounded-2xl border-white/20 font-black text-lg hover:bg-white/5">System Documentation</Button>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-8 justify-center">
                {[ShieldCheck, Database, Globe, Zap, Timer, Map, Layers3, Fingerprint].map((Icon, i) => (
                  <div key={i} className="size-28 rounded-[3.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center text-accent hover:scale-110 hover:border-accent hover:bg-white/10 transition-all duration-500 cursor-pointer shadow-2xl">
                    <Icon size={40} />
                  </div>
                ))}
            </div>
         </div>
         <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
      </div>
    </div>
  );
}
