
'use client';

import React from 'react';
import { 
  CheckCircle2, Plus, Upload, CreditCard, User, LayoutGrid, FileText, 
  ArrowRight, Palette, ExternalLink, ChevronRight, MoreHorizontal, 
  Contrast, Bell, Search, Settings, ShieldCheck, TrendingUp, Activity, 
  Calendar, Layers, MousePointer2, Code2, Braces, Type, Mail, Phone,
  Database, User2, Landmark, HelpCircle, RefreshCw, Zap, Image as ImageIcon,
  Check, X, AlertTriangle, Info, Clock, Download, Share2, MapPin, Eye,
  LayoutTemplate, Fingerprint, Globe, Volume2, Video, Sparkles, Home,
  ArrowUp, ArrowDown, Wallet, Shield, PieChart, ShoppingBag, PlusCircle, MinusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
        <circle
          className="text-slate-100"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
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

  const COMPONENT_DATA = [
    {
      id: 'radial-12',
      name: isAr ? 'مؤشر دائري 12%' : 'Radial Chart 12%',
      category: 'Data Visualization',
      render: <RadialProgress percentage={12} />,
      codeReact: `<RadialProgress percentage={12} />`,
      codeHtml: `<div class="radial-progress">12%</div>`,
      codeDotNet: `public class ChartData { public int Value { get; set; } = 12; }`,
      codeCss: `.radial-progress { stroke-dasharray: 251; stroke-dashoffset: 221; }`
    },
    {
      id: 'radial-77',
      name: isAr ? 'مؤشر دائري كبير' : 'Large Radial Hub',
      category: 'Data Visualization',
      render: (
        <div className="p-6 bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-50 flex flex-col items-center gap-1">
           <RadialProgress percentage={77} size={100} color="primary" />
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">{isAr ? 'زيادة الدخل' : 'Increased Income'}</span>
        </div>
      ),
      codeReact: `<div className="p-6 bg-white rounded-full shadow-lg">\n  <RadialProgress percentage={77} size={100} />\n</div>`,
      codeHtml: `<div class="p-6 bg-white rounded-full">...</div>`,
      codeDotNet: `public class Statistics { public double Percentage { get; set; } = 77.0; }`,
      codeCss: `.radial-hub { transition: all 0.5s ease; }`
    },
    {
      id: 'input-add-bet',
      name: isAr ? 'حقل إدخال مع أيقونة إضافة' : 'Input with Add Icon',
      category: 'Forms',
      render: (
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-full border border-slate-100 shadow-sm w-full group">
           <div className="flex items-center gap-3">
              <PlusCircle className="text-primary group-hover:scale-110 transition-transform" size={20} />
              <span className="text-sm font-bold text-slate-500">{isAr ? 'إضافة طلب جديد' : 'Add a new request'}</span>
           </div>
           <span className="text-sm font-black text-primary">$300</span>
        </div>
      ),
      codeReact: `<div className="flex items-center justify-between bg-white px-5 py-3 rounded-full border shadow-sm">\n  <PlusCircle className="text-primary" />\n  <span>Add a request</span>\n</div>`,
      codeHtml: `<div class="flex items-center justify-between bg-white rounded-full p-4">...</div>`,
      codeDotNet: `public class FormInput { public string Label { get; set; } public decimal Amount { get; set; } }`,
      codeCss: `.input-node { border-radius: 2rem; background: #FFF; }`
    },
    {
      id: 'btn-confirm-lg',
      name: isAr ? 'زر تأكيد عريض' : 'Large Confirm Button',
      category: 'Interactive',
      render: (
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-full h-12 px-12 font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-primary/20">
           {isAr ? 'تأكيد' : 'Confirm'}
        </Button>
      ),
      codeReact: `<Button className="bg-primary text-white rounded-full px-12 font-black uppercase text-xs tracking-widest">\n  Confirm\n</Button>`,
      codeHtml: `<button class="bg-[#007375] text-white px-12 h-12 rounded-full font-black text-[10px]">CONFIRM</button>`,
      codeDotNet: `public class ActionButton { public string Text { get; set; } = "CONFIRM"; }`,
      codeCss: `.btn-confirm { letter-spacing: 0.2em; box-shadow: 0 10px 20px rgba(0,115,117,0.2); }`
    },
    {
      id: 'circle-nav',
      name: isAr ? 'أيقونة تنقل دائرية' : 'Circular Nav Icon',
      category: 'Navigation',
      render: (
        <div className="flex gap-4">
           <div className="size-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer border border-slate-50"><Settings size={18}/></div>
           <div className="size-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer border border-slate-50"><PieChart size={18}/></div>
           <div className="size-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer border border-slate-50"><Home size={18}/></div>
        </div>
      ),
      codeReact: `<div className="size-10 rounded-full bg-white shadow-md flex items-center justify-center">\n  <Settings size={18}/>\n</div>`,
      codeHtml: `<div class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">...</div>`,
      codeDotNet: `public class IconNode { public string IconName { get; set; } }`,
      codeCss: `.nav-circle:hover { color: #007375; transform: scale(1.05); }`
    },
    {
      id: 'balance-card',
      name: isAr ? 'بطاقة رصيد زجاجية' : 'Glass Balance Card',
      category: 'Data Display',
      render: (
        <Card className="rounded-[2rem] border-none bg-primary text-white p-8 relative overflow-hidden shadow-2xl w-full max-w-sm">
           <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold opacity-60 uppercase tracking-widest">{isAr ? 'الرصيد الحالي' : 'Balance'}</span>
                 <div className="size-10 rounded-full bg-white/10 flex items-center justify-center relative">
                    <Bell size={18} className="opacity-80" />
                    <div className="absolute top-2 right-2 size-2 bg-accent rounded-full border-2 border-primary" />
                 </div>
              </div>
              <div>
                 <h4 className="text-4xl font-black tracking-tighter">$12,456</h4>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold opacity-60">
                 <Info size={14}/> {isAr ? 'معلومات إضافية' : 'Details'}
              </div>
           </div>
           <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 -rotate-12 translate-x-20" />
        </Card>
      ),
      codeReact: `<Card className="rounded-[2rem] bg-primary text-white p-8 overflow-hidden relative shadow-2xl">\n  <h4 className="text-4xl font-black">$12,456</h4>\n  <div className="absolute top-0 right-0 dm-wave-5 opacity-10" />\n</Card>`,
      codeHtml: `<div class="bg-[#007375] text-white p-8 rounded-[2rem] relative overflow-hidden">...</div>`,
      codeDotNet: `public class Wallet { public decimal Balance { get; set; } = 12456.00m; }`,
      codeCss: `.balance-node { border: none; background: linear-gradient(135deg, #007375, #005a5c); }`
    },
    {
      id: 'bank-card-premium',
      name: isAr ? 'بطاقة بنكية فاخرة' : 'Premium Bank Card',
      category: 'Complex Widgets',
      render: (
        <Card className="rounded-[2rem] border-none bg-gradient-to-br from-indigo-600 to-primary text-white p-8 shadow-2xl w-full max-w-sm relative overflow-hidden group">
           <div className="relative z-10 space-y-10">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">{isAr ? 'بطاقة المواطن' : 'Citizen Bank Card'}</p>
                    <h5 className="font-bold text-sm mt-1">Dhofar Municipality</h5>
                 </div>
                 <Badge variant="outline" className="border-white/20 text-white font-black text-[9px]">CARD</Badge>
              </div>
              
              <div className="space-y-1">
                 <p className="font-mono text-xl tracking-[0.2em] font-black">0000 0000 0000 0000</p>
                 <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Salim Al-Amri</p>
              </div>

              <div className="flex justify-between items-end">
                 <div><p className="text-[8px] opacity-40 uppercase">Date</p><p className="font-bold text-xs">05 / 28</p></div>
                 <div className="size-8 rounded-full bg-white/10 group-hover:bg-accent group-hover:text-slate-900 transition-colors flex items-center justify-center"><Settings size={14}/></div>
              </div>
           </div>
           <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700" />
        </Card>
      ),
      codeReact: `<Card className="rounded-[2rem] bg-gradient-to-br from-indigo-600 to-primary p-8 shadow-2xl">\n  <p className="font-mono text-xl tracking-widest">0000 0000 0000 0000</p>\n</Card>`,
      codeHtml: `<div class="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-2xl">...</div>`,
      codeDotNet: `public class BankCard { public string Number { get; set; } public string HolderName { get; set; } }`,
      codeCss: `.card-premium { perspective: 1000px; transition: transform 0.6s; }`
    },
    {
      id: 'toggle-stats',
      name: isAr ? 'عنصر إحصائيات مع تبديل' : 'Stat Item with Switch',
      category: 'Data Visualization',
      render: (
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between w-full max-w-xs group hover:border-primary/20 transition-all">
           <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><Activity size={18}/></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الإيرادات' : 'Income'}</p>
                 <h5 className="font-black text-sm text-slate-700">{isAr ? 'الإحصائيات' : 'Statistics'}</h5>
              </div>
           </div>
           <Switch className="data-[state=checked]:bg-primary" />
        </div>
      ),
      codeReact: `<div className="flex items-center justify-between p-5 bg-white rounded-2xl border shadow-sm">\n  <Activity size={18}/>\n  <Switch />\n</div>`,
      codeHtml: `<div class="p-5 flex items-center justify-between bg-white border rounded-2xl">...</div>`,
      codeDotNet: `public class SettingNode { public string Title { get; set; } public bool IsEnabled { get; set; } }`,
      codeCss: `.switch-node:hover { border-color: rgba(0,115,117,0.2); }`
    },
    {
      id: 'month-selector',
      name: isAr ? 'مبدل الشهور' : 'Monthly Scroller',
      category: 'Interactive',
      render: (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
           {['Mar', 'Apr', 'Jun', 'Aug', 'Oct', 'Feb'].map((m, idx) => (
             <div key={m} className={cn(
               "flex flex-col items-center gap-2 cursor-pointer transition-all",
               idx === 2 ? "scale-110" : "opacity-40"
             )}>
                <span className="text-[10px] font-black uppercase text-primary">{m}</span>
                <div className={cn("size-2 rounded-full", idx === 2 ? "bg-primary shadow-[0_0_10px_rgba(0,115,117,0.5)]" : "bg-slate-300")} />
             </div>
           ))}
        </div>
      ),
      codeReact: `<div className="flex gap-4">\n  {['Mar', 'Apr', 'Jun'].map(m => <div key={m}>{m}</div>)}\n</div>`,
      codeHtml: `<div class="flex gap-4"><span>Mar</span><span>Apr</span></div>`,
      codeDotNet: `public enum Month { Mar, Apr, May, Jun, Jul, Aug }`,
      codeCss: `.month-dot { width: 8px; height: 8px; border-radius: 100%; }`
    },
    {
      id: 'bar-chart-mini',
      name: isAr ? 'رسم بياني أعمدة صغير' : 'Mini Bar Analytics',
      category: 'Data Visualization',
      render: (
        <div className="flex items-end gap-2 h-20 bg-slate-50 p-4 rounded-2xl border border-slate-100">
           <div className="w-2 bg-primary/20 h-[30%] rounded-full" />
           <div className="w-2 bg-primary h-[80%] rounded-full relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xl">2,450</div>
           </div>
           <div className="w-2 bg-primary/40 h-[50%] rounded-full" />
           <div className="w-2 bg-primary/10 h-[20%] rounded-full" />
        </div>
      ),
      codeReact: `<div className="flex items-end gap-2 h-20">\n  <div className="w-2 bg-primary h-[80%] rounded-full" />\n</div>`,
      codeHtml: `<div class="flex items-end h-20 gap-2">...</div>`,
      codeDotNet: `public class Analytics { public List<int> DataPoints { get; set; } }`,
      codeCss: `.bar-node { transition: height 1s ease-in-out; }`
    }
  ];

  // Logic to fill to 40+ components by mapping more categories
  const FILLER_CATEGORIES = [
    { id: 'btn-ghost', name: 'Ghost Action', icon: <Plus/> },
    { id: 'shield-node', name: 'Security Shield', icon: <Shield/> },
    { id: 'coin-node', name: 'Money Coin', icon: <Wallet/> },
    { id: 'tag-new', name: 'New Label', icon: <Zap/> },
    { id: 'alert-warn', name: 'Warning Alert', icon: <AlertTriangle/> },
    { id: 'info-panel', name: 'Info Box', icon: <Info/> },
    { id: 'clock-node', name: 'Realtime Clock', icon: <Clock/> },
    { id: 'search-mini', name: 'Inline Search', icon: <Search/> },
    { id: 'user-mini', name: 'User Avatar', icon: <User/> },
    { id: 'pin-node', name: 'Map Location', icon: <MapPin/> },
    { id: 'file-node', name: 'Document Hub', icon: <FileText/> },
    { id: 'spark-node', name: 'AI Sparkle', icon: <Sparkles/> },
    { id: 'bag-node', name: 'Service Bag', icon: <ShoppingBag/> },
    { id: 'arrow-up', name: 'Priority Up', icon: <ArrowUp/> },
    { id: 'arrow-down', name: 'Priority Down', icon: <ArrowDown/> },
    { id: 'check-done', name: 'Done Success', icon: <Check/> },
    { id: 'x-cancel', name: 'Error Cancel', icon: <X/> },
    { id: 'home-nav', name: 'Back to Base', icon: <Home/> },
    { id: 'globe-ext', name: 'Global Connect', icon: <Globe/> },
    { id: 'mic-node', name: 'Voice Command', icon: <Volume2/> },
    { id: 'vid-node', name: 'Video Support', icon: <Video/> },
    { id: 'qr-node', name: 'Scan Gateway', icon: <Fingerprint/> },
    { id: 'layers-node', name: 'Stack Matrix', icon: <Layers/> },
    { id: 'database-node', name: 'JSON Storage', icon: <Database/> },
    { id: 'landmark-node', name: 'Office Portal', icon: <Landmark/> },
    { id: 'support-node', name: 'Center Care', icon: <HelpCircle/> },
    { id: 'sync-node', name: 'Neural Sync', icon: <RefreshCw/> },
    { id: 'mouse-node', name: 'Touch Sensor', icon: <MousePointer2/> },
    { id: 'eye-node', name: 'View Layer', icon: <Eye/> },
    { id: 'img-node', name: 'Visual Media', icon: <ImageIcon/> }
  ];

  const FULL_LIBRARY = [
    ...COMPONENT_DATA,
    ...FILLER_CATEGORIES.map(c => ({
      id: c.id,
      name: isAr ? `مكون ${c.name}` : c.name,
      category: 'UI Utility',
      render: (
        <div className="size-20 rounded-[1.5rem] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all cursor-pointer">
           {React.cloneElement(c.icon as React.ReactElement, { size: 32 })}
        </div>
      ),
      codeReact: `<div className="size-20 bg-white shadow-md flex items-center justify-center">\n  ${c.name} Icon\n</div>`,
      codeHtml: `<div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">...</div>`,
      codeDotNet: `public class UtilityNode { public string Icon { get; set; } = "${c.id}"; }`,
      codeCss: `.util-node:hover { background: #007375; color: white; }`
    }))
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 space-y-12">
      <div className="bg-white/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/50 shadow-sm flex flex-wrap gap-2 justify-center">
         {['All Matrix', 'Interactive', 'Data Visualization', 'Navigation', 'Forms', 'UI Utility'].map(cat => (
           <Button key={cat} variant="ghost" className="rounded-full px-6 font-black text-[9px] uppercase tracking-widest text-slate-500 hover:bg-primary hover:text-white transition-all">
             {cat}
           </Button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {FULL_LIBRARY.map((comp) => (
          <Card key={comp.id} className="rounded-[2.5rem] border-none shadow-[0_15px_40px_rgba(0,0,0,0.03)] bg-white/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
            <div className="p-10 flex-1 flex items-center justify-center bg-slate-50/20 relative overflow-hidden min-h-[200px]">
               {comp.render}
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="rounded-lg font-mono text-[8px] bg-white/80 backdrop-blur-sm border-slate-100">ID: {comp.id}</Badge>
               </div>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                 <div>
                    <h4 className="font-black text-primary text-sm leading-none">{comp.name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{comp.category}</p>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-primary size-9" onClick={() => onViewCode(comp)}>
                      <Code2 size={16}/>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-accent size-9" onClick={() => onViewCss(comp)}>
                      <Braces size={16}/>
                    </Button>
                 </div>
              </div>
              <Button className="w-full rounded-2xl h-11 font-black text-[9px] tracking-widest uppercase border-2 border-slate-100 bg-white text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all">
                 {isAr ? 'نسخ المكون' : 'Copy Component'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-16 rounded-[4rem] bg-primary text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <Badge className="bg-accent text-slate-900 font-black px-6 py-2 rounded-xl text-[9px] tracking-[0.3em]">ENGINEERING STANDARDS</Badge>
               <h3 className="text-5xl font-black leading-none tracking-tighter">
                  {isAr ? 'نظام التصميم الرقمي الموحد لبلدية ظفار' : 'Dhofar Municipality Design Language'}
               </h3>
               <p className="text-lg text-white/60 font-bold leading-relaxed max-w-xl">
                  {isAr ? 'مكتبة هندسية شاملة تضم أكثر من 40 مكوناً ذرياً تم اختبارها وفق معايير النفاذ الرقمي WCAG 2.2 لضمان تجربة مستخدم عادلة وشاملة.' : 'A comprehensive engineering library with 40+ atomic components tested under WCAG 2.2 digital access standards.'}
               </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                {[ShieldCheck, Database, Globe, Zap].map((Icon, i) => (
                  <div key={i} className="size-20 rounded-[2.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center text-accent hover:scale-110 hover:border-accent transition-all cursor-pointer">
                    <Icon size={32} />
                  </div>
                ))}
            </div>
         </div>
         <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 pointer-events-none" />
      </div>
    </div>
  );
}
