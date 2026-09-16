'use client';

import React, { useMemo } from 'react';
import { 
  CheckCircle2, Plus, Upload, CreditCard, User, LayoutGrid, FileText, 
  ArrowRight, Palette, ExternalLink, ChevronRight, MoreHorizontal, 
  Contrast, Bell, Search, Settings, ShieldCheck, TrendingUp, Activity, 
  Calendar as CalendarIcon, Layers, MousePointer2, Code2, Braces, Type, Mail, Phone,
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
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
    { id: 'gov', label: isAr ? 'هوية عُمان' : 'Gov.om UI', icon: <Landmark size={14}/> },
    { id: 'patterns', label: isAr ? 'الأنماط' : 'Patterns', icon: <Palette size={14}/> },
    { id: 'cards', label: isAr ? 'البطاقات' : 'Smart Cards', icon: <CreditCard size={14}/> },
    { id: 'forms', label: isAr ? 'النماذج' : 'Forms & Tools', icon: <ListChecks size={14}/> },
    { id: 'charts', label: isAr ? 'الإحصائيات' : 'Data Viz', icon: <BarChart3 size={14}/> },
    { id: 'tables', label: isAr ? 'الجداول' : 'Tables', icon: <Table2 size={14}/> },
    { id: 'layout', label: isAr ? 'القوالب' : 'Layouts', icon: <LayoutTemplate size={14}/> }
  ];

  const LIBRARY = useMemo(() => {
    return [
      // PATTERNS FROM IMAGE
      {
        id: 'pattern-chevron', category: 'patterns', name: isAr ? 'نمط الأقواس (شيفرون)' : 'Chevron Pattern',
        render: <div className="w-full h-40 rounded-3xl border dm-pattern-chevron bg-slate-50 flex items-center justify-center"><Badge className="bg-white/80 backdrop-blur-md text-primary">Purple Chevron</Badge></div>,
        codeReact: `<div className="dm-pattern-chevron" />`,
        codeHtml: `<div class="dm-pattern-chevron"></div>`,
        codeDotNet: `string Pattern = "Chevron";`,
        codeCss: `.dm-pattern-chevron { background-image: url(...); }`
      },
      {
        id: 'pattern-waves-thick', category: 'patterns', name: isAr ? 'الأمواج الرسمية السميكة' : 'Official Thick Waves',
        render: <div className="w-full h-40 rounded-3xl border dm-pattern-waves-thick bg-slate-50 flex items-center justify-center"><Badge className="bg-white/80 backdrop-blur-md text-primary">Teal Waves</Badge></div>,
        codeReact: `<div className="dm-pattern-waves-thick" />`,
        codeHtml: `<div class="dm-pattern-waves-thick"></div>`,
        codeDotNet: `string Pattern = "ThickWaves";`,
        codeCss: `.dm-pattern-waves-thick { background-image: url(...); }`
      },
      {
        id: 'pattern-zigzag', category: 'patterns', name: isAr ? 'الزجزاج الهندسي' : 'Geometric Zigzag',
        render: <div className="w-full h-40 rounded-3xl border dm-pattern-zigzag bg-slate-50 flex items-center justify-center"><Badge className="bg-white/80 backdrop-blur-md text-primary">Turquoise Zigzag</Badge></div>,
        codeReact: `<div className="dm-pattern-zigzag" />`,
        codeHtml: `<div class="dm-pattern-zigzag"></div>`,
        codeDotNet: `string Pattern = "Zigzag";`,
        codeCss: `.dm-pattern-zigzag { background-image: url(...); }`
      },
      {
        id: 'pattern-waves-dense', category: 'patterns', name: isAr ? 'الأمواج المتراصة الخفيفة' : 'Dense Soft Waves',
        render: <div className="w-full h-40 rounded-3xl border dm-pattern-waves-dense bg-slate-50 flex items-center justify-center"><Badge className="bg-white/80 backdrop-blur-md text-primary">Cyan Dense</Badge></div>,
        codeReact: `<div className="dm-pattern-waves-dense" />`,
        codeHtml: `<div class="dm-pattern-waves-dense"></div>`,
        codeDotNet: `string Pattern = "DenseWaves";`,
        codeCss: `.dm-pattern-waves-dense { background-image: url(...); }`
      },

      // GOV.OM COMPONENTS
      {
        id: 'thiqa-auth', category: 'gov', name: isAr ? 'كتلة توثيق ثقة' : 'Thiqa Authentication Block',
        render: (
          <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-6 w-full max-w-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-full h-full dm-pattern-waves-dense opacity-30" />
             <div className="size-20 bg-primary/5 rounded-3xl flex items-center justify-center relative z-10">
                <Fingerprint size={48} className="text-primary" />
             </div>
             <div className="text-center space-y-2 relative z-10">
                <h4 className="font-black text-primary text-xl">Thiqa Identity</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Unified National PKI</p>
             </div>
             <Button className="w-full dm-gradient-primary rounded-2xl h-14 font-black relative z-10">Link Digital ID</Button>
          </div>
        ),
        codeReact: `<ThiqaAuthBlock />`,
        codeHtml: `<div class="thiqa-container">...</div>`,
        codeDotNet: `public class ThiqaService { }`,
        codeCss: `.thiqa-container { border-radius: 2.5rem; }`
      },
      {
        id: 'gov-badge', category: 'gov', name: isAr ? 'شارة الهوية الوطنية' : 'Oman National Badge',
        render: <Badge className="bg-[#470D67] text-white px-6 py-2 rounded-xl border-none shadow-lg gap-2 font-black"><Globe size={14}/> {isAr ? 'حكومة عُمان' : 'Oman Government'}</Badge>,
        codeReact: `<Badge variant="gov">Oman Government</Badge>`,
        codeHtml: `<span class="badge-gov">...</span>`,
        codeDotNet: `string GovLabel = "Oman Government";`,
        codeCss: `.badge-gov { background: #470D67; }`
      },

      // CARDS
      {
        id: 'citizen-id', category: 'cards', name: isAr ? 'بطاقة الهوية الرقمية' : 'Digital Citizen ID',
        render: (
          <div className="p-8 bg-gradient-to-br from-primary to-accent text-white rounded-[3rem] shadow-2xl w-80 relative overflow-hidden group">
             <div className="relative z-10 space-y-12">
                <div className="flex justify-between items-start">
                   <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center"><User2 size={24}/></div>
                   <Badge variant="outline" className="border-white/30 text-white font-black">RESIDENT</Badge>
                </div>
                <div className="space-y-1">
                   <p className="font-mono text-xl tracking-widest font-black">1234 - 5678 - 9012</p>
                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">AHMED BIN SALIM AL-MAASHANI</p>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-full h-full dm-pattern-waves-thick opacity-10 -rotate-12" />
          </div>
        ),
        codeReact: `<CitizenCard user={data} />`,
        codeHtml: `<div class="card-citizen">...</div>`,
        codeDotNet: `public class IdentityCard { public string NationalID { get; set; } }`,
        codeCss: `.card-citizen { background: linear-gradient(to right, #007375, #03CFCB); }`
      },

      // FORMS
      {
        id: 'calendar-standard', category: 'forms', name: isAr ? 'منتقي التاريخ' : 'Official Calendar Picker',
        render: <div className="p-4 bg-white border rounded-[2rem] shadow-xl"><Calendar mode="single" className="rounded-xl border-none" /></div>,
        codeReact: `<Calendar mode="single" />`,
        codeHtml: `<div class="calendar-ui">...</div>`,
        codeDotNet: `public DateTime SelectedDate { get; set; }`,
        codeCss: `.calendar-ui { border-radius: 2rem; }`
      }
    ];
  }, [isAr]);

  const [activeTab, setActiveTab] = React.useState('all');

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return LIBRARY;
    return LIBRARY.filter(item => item.category === activeTab);
  }, [activeTab, LIBRARY]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 space-y-12">
      <div className="bg-white/60 backdrop-blur-xl p-3 rounded-[2.5rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-wrap gap-2 justify-center sticky top-24 z-40">
         <Button variant="ghost" onClick={() => setActiveTab('all')} className={cn("rounded-full px-8 font-black text-[11px] uppercase tracking-widest transition-all", activeTab === 'all' ? "bg-primary text-white shadow-xl" : "text-slate-500")}>
           Full Portal Matrix
         </Button>
         {CATEGORIES.map(cat => (
           <Button key={cat.id} variant="ghost" onClick={() => setActiveTab(cat.id)} className={cn("rounded-full px-8 font-black text-[11px] uppercase tracking-widest transition-all gap-3", activeTab === cat.id ? "bg-primary text-white shadow-xl" : "text-slate-500")}>
             {cat.icon} {cat.label}
           </Button>
         ))}
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
        {filteredItems.map((comp) => (
          <div key={comp.id} className="break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-fit flex flex-col ring-1 ring-slate-100/50">
              <div className={cn("p-12 flex-1 flex items-center justify-center bg-slate-50/20 relative overflow-hidden min-h-[220px]", comp.category === 'patterns' ? 'p-0' : '')}>
                 {comp.render}
                 <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="rounded-xl font-mono text-[9px] bg-white/80 backdrop-blur-sm border-slate-100 text-slate-400">UI-{comp.id}</Badge>
                 </div>
              </div>
              
              <CardContent className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="flex-1 mr-4">
                      <h4 className="font-black text-primary text-lg leading-tight tracking-tight">{comp.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                        <Grid size={12}/> {CATEGORIES.find(c => c.id === comp.category)?.label}
                      </p>
                   </div>
                   <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-primary size-11 shadow-sm transition-all" onClick={() => onViewCode(comp)}>
                        <Code2 size={20}/>
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 text-slate-400 hover:text-accent size-11 shadow-sm transition-all" onClick={() => onViewCss(comp)}>
                        <Braces size={20}/>
                      </Button>
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Badge variant="outline" className="flex-1 justify-center rounded-lg font-mono text-[8px] border-slate-100 text-slate-400">TSX</Badge>
                        <Badge variant="outline" className="flex-1 justify-center rounded-lg font-mono text-[8px] border-slate-100 text-slate-400">HTML</Badge>
                        <Badge variant="outline" className="flex-1 justify-center rounded-lg font-mono text-[8px] border-slate-100 text-slate-400">C#</Badge>
                    </div>
                    <Button className="w-full rounded-[1.5rem] h-12 font-black text-[10px] tracking-[0.2em] uppercase border-2 border-slate-100 bg-white text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 group/btn shadow-sm">
                       {isAr ? 'نسخ الكود الموحد' : 'Copy Multi-Stack'}
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="p-20 rounded-[5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl mt-20 border-t-8 border-accent">
         <div className="relative z-10 grid md:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
               <Badge className="bg-accent text-slate-900 font-black px-8 py-2.5 rounded-2xl text-[10px] tracking-[0.4em]">GOVERNMENT DESIGN SYSTEM</Badge>
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
         <div className="absolute top-0 right-0 w-1/2 h-full dm-pattern-waves-thick opacity-10 pointer-events-none" />
      </div>
    </div>
  );
}
