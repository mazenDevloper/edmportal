
'use client';

import React from 'react';
import { 
  CheckCircle2, Plus, Upload, CreditCard, User, LayoutGrid, FileText, 
  ArrowRight, Palette, ExternalLink, ChevronRight, MoreHorizontal, 
  Contrast, Bell, Search, Settings, ShieldCheck, TrendingUp, Activity, 
  Calendar, Layers, MousePointer2, Code2, CSS3, Type, Mail, Phone,
  Database, User2, Landmark, HelpCircle, RefreshCw, Zap, Image as ImageIcon,
  Check, X, AlertTriangle, Info, Clock, Download, Share2, MapPin, Eye,
  LayoutTemplate, Fingerprint, Globe, Volume2, Video, Sparkles
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

export function IdentityShowcase({ isAr, onViewCode, onViewCss }: ShowcaseProps) {

  const COMPONENT_DATA = [
    // 1. Primary Action Button
    {
      id: 'btn-primary',
      name: isAr ? 'زر الإجراء الرئيسي' : 'Primary Action Button',
      category: 'Interactive',
      render: (
        <Button className="dm-gradient-primary rounded-2xl h-14 px-10 font-black shadow-lg">
          {isAr ? 'تأكيد العملية' : 'Confirm Action'}
        </Button>
      ),
      codeReact: `<Button className="dm-gradient-primary rounded-2xl h-14 px-10 font-black shadow-lg">
  {isAr ? 'تأكيد العملية' : 'Confirm Action'}
</Button>`,
      codeHtml: `<button class="bg-gradient-to-r from-[#007375] to-[#03CFCB] text-white font-black px-10 h-14 rounded-[1.5rem] shadow-lg transition-all hover:scale-105">
  Confirm Action
</button>`,
      codeDotNet: `public class ActionButton {
  public string Text { get; set; } = "Confirm Action";
  public string Type { get; set; } = "Primary";
}`,
      codeCss: `.dm-gradient-primary {
  background: linear-gradient(90deg, #007375 0%, #03CFCB 100%);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(3, 207, 203, 0.3);
}`
    },
    // 2. Glass Search Bar
    {
      id: 'search-glass',
      name: isAr ? 'شريط بحث زجاجي' : 'Glass Search Bar',
      category: 'Forms',
      render: (
        <div className="relative group w-full">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent" size={20} />
          <input 
            className="w-full h-16 rounded-3xl border-2 border-slate-100 bg-white px-14 font-bold outline-none focus:border-accent transition-all shadow-sm" 
            placeholder={isAr ? 'ابحث عن خدمة...' : 'Search services...'} 
          />
        </div>
      ),
      codeReact: `<div className="relative group w-full">
  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
  <input 
    className="w-full h-16 rounded-3xl border-2 border-slate-100 px-14 font-bold focus:border-accent outline-none" 
    placeholder="Search..." 
  />
</div>`,
      codeHtml: `<div class="relative">
  <input type="text" class="w-full h-16 rounded-[2rem] border-2 border-gray-100 px-14 font-bold outline-none focus:border-[#03CFCB]" />
</div>`,
      codeDotNet: `public class SearchBar {
  public string Placeholder { get; set; } = "Search services...";
}`,
      codeCss: `input:focus {
  border-color: hsl(var(--accent));
  box-shadow: 0 0 0 4px rgba(3, 207, 203, 0.1);
}`
    },
    // 3. Status Badge (Pending)
    {
      id: 'badge-pending',
      name: isAr ? 'شارة حالة (قيد المعالجة)' : 'Status Badge (Pending)',
      category: 'Data',
      render: (
        <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-full px-4 py-1.5 font-black uppercase text-[10px] tracking-widest">
           {isAr ? 'قيد المعالجة' : 'Pending Review'}
        </Badge>
      ),
      codeReact: `<Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-full px-4 py-1.5 font-black text-[10px]">
  {isAr ? 'قيد المعالجة' : 'Pending Review'}
</Badge>`,
      codeHtml: `<span class="bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-4 py-1.5 text-[10px] font-black">
  PENDING REVIEW
</span>`,
      codeDotNet: `public enum AppStatus { Pending, Approved, Rejected }`,
      codeCss: `.badge-amber {
  background-color: #FFFBEB;
  color: #D97706;
  border: 1px solid #FEF3C7;
}`
    },
    // 4. Circular Progress Indicator
    {
      id: 'progress-ring',
      name: isAr ? 'مؤشر تقدم دائري' : 'Circular Progress Ring',
      category: 'Visuals',
      render: (
        <div className="size-24 rounded-full border-[10px] border-primary/10 border-t-primary flex items-center justify-center font-black text-xl text-primary rotate-45">
          75%
        </div>
      ),
      codeReact: `<div className="size-24 rounded-full border-[10px] border-primary/10 border-t-primary flex items-center justify-center font-black">
  75%
</div>`,
      codeHtml: `<div class="w-24 h-24 rounded-full border-[10px] border-gray-100 border-t-[#007375] flex items-center justify-center font-black text-xl">
  75%
</div>`,
      codeDotNet: `public class ProgressModel { public int Percentage { get; set; } = 75; }`,
      codeCss: `.progress-ring {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}`
    },
    // 5. User Identity Card (Small)
    {
      id: 'user-id-small',
      name: isAr ? 'هوية المستخدم (مصغرة)' : 'Identity Node (Small)',
      category: 'Identity',
      render: (
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
          <Avatar className="size-10 border-2 border-primary">
            <AvatarFallback className="bg-primary text-white font-black text-xs">SA</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-black text-xs text-primary">{isAr ? 'سالم العامري' : 'Salim Al-Amri'}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Verified ID</span>
          </div>
        </div>
      ),
      codeReact: `<div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
  <Avatar><AvatarFallback>SA</AvatarFallback></Avatar>
  <div className="flex flex-col">
    <span className="font-black text-xs">Salim Al-Amri</span>
    <span className="text-[9px] font-bold text-slate-400">Verified ID</span>
  </div>
</div>`,
      codeHtml: `<div class="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
  <div class="w-10 h-10 rounded-full bg-[#007375] text-white flex items-center justify-center font-black">SA</div>
  <div>
    <p class="font-black text-sm text-[#007375]">Salim Al-Amri</p>
    <p class="text-[9px] text-gray-400 font-bold uppercase">Verified ID</p>
  </div>
</div>`,
      codeDotNet: `public class UserProfile { public string Name { get; set; } public string Avatar { get; set; } }`,
      codeCss: `.id-node {
  transition: all 0.3s ease;
  cursor: pointer;
}`
    },
    // 6. Neural Stats Card
    {
      id: 'stats-neural',
      name: isAr ? 'بطاقة إحصائيات عصبية' : 'Neural Stats Card',
      category: 'Data',
      render: (
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-8 relative overflow-hidden group h-full">
           <div className="relative z-10 space-y-4">
              <TrendingUp className="text-accent group-hover:scale-125 transition-transform" size={32} />
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'إجمالي المعاملات' : 'TOTAL TRANSACTIONS'}</p>
                 <h4 className="text-4xl font-black text-accent mt-1">42.5K+</h4>
              </div>
           </div>
           <div className="absolute top-0 right-0 size-40 dm-wave-5 opacity-10 -rotate-45" />
        </Card>
      ),
      codeReact: `<Card className="rounded-[2.5rem] bg-slate-900 text-white p-8 overflow-hidden relative">
  <TrendingUp className="text-accent" />
  <h4 className="text-4xl font-black text-accent">42.5K+</h4>
  <div className="absolute top-0 right-0 dm-wave-5 opacity-10" />
</Card>`,
      codeHtml: `<div class="bg-gray-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
  <h4 class="text-4xl font-black text-[#03CFCB]">42.5K+</h4>
  <p class="text-xs uppercase text-gray-400 font-bold">Total Transactions</p>
</div>`,
      codeDotNet: `public class StatCard { public string Title { get; set; } public string Value { get; set; } }`,
      codeCss: `.dm-wave-5 {
  background-image: url("data:image/svg+xml,...");
  background-repeat: repeat-x;
}`
    },
    // 7. Interactive Toggle (Teal)
    {
      id: 'toggle-teal',
      name: isAr ? 'مفتاح تبديل ذكي' : 'Smart Toggle Switch',
      category: 'Forms',
      render: (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-slate-100 w-full max-w-xs group">
           <span className="font-black text-sm text-slate-700 group-hover:text-primary transition-colors">{isAr ? 'الإشعارات الحية' : 'Live Notifications'}</span>
           <Switch defaultChecked className="data-[state=checked]:bg-accent" />
        </div>
      ),
      codeReact: `<div className="flex items-center justify-between p-4 rounded-2xl border-2">
  <span className="font-black text-sm">Live Notifications</span>
  <Switch defaultChecked className="data-[state=checked]:bg-accent" />
</div>`,
      codeHtml: `<div class="flex items-center justify-between p-4 rounded-xl border border-gray-100">
  <span class="font-bold text-sm text-gray-700">Notifications</span>
  <div class="w-10 h-5 bg-[#03CFCB] rounded-full relative"></div>
</div>`,
      codeDotNet: `public class SettingsConfig { public bool Notifications { get; set; } }`,
      codeCss: `.switch-accent[data-state=checked] { background-color: #03CFCB; }`
    },
    // 8. PDF Download Link
    {
      id: 'pdf-link',
      name: isAr ? 'رابط ملف PDF رسمي' : 'Official PDF Link',
      category: 'Data',
      render: (
        <div className="group flex items-center gap-4 p-5 rounded-2xl bg-white shadow-md border-2 border-transparent hover:border-primary transition-all cursor-pointer">
           <div className="size-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
             <FileText size={24} />
           </div>
           <div>
             <p className="font-black text-xs text-slate-800">{isAr ? 'دليل المستخدم الرقمي' : 'Digital User Guide'}</p>
             <p className="text-[10px] font-bold text-slate-400">PDF • 2.4 MB</p>
           </div>
           <Download size={16} className="text-slate-300 mr-auto" />
        </div>
      ),
      codeReact: `<div className="group flex items-center gap-4 p-5 rounded-2xl border-2">
  <FileText className="text-red-600" />
  <div>
    <p className="font-black text-xs">Digital User Guide</p>
    <p className="text-[10px] text-slate-400">PDF • 2.4 MB</p>
  </div>
</div>`,
      codeHtml: `<div class="flex items-center gap-4 p-5 rounded-xl bg-white border border-gray-100 hover:border-[#007375]">
  <div class="bg-red-50 p-2 rounded-lg"><svg>...</svg></div>
  <p class="font-bold">User Guide</p>
</div>`,
      codeDotNet: `public class Document { public string Name { get; set; } public string Url { get; set; } }`,
      codeCss: `.pdf-card:hover { border-color: hsl(var(--primary)); }`
    },
    // 9. Service Category Tag
    {
      id: 'cat-tag',
      name: isAr ? 'وسم تصنيف الخدمات' : 'Service Category Tag',
      category: 'Visuals',
      render: (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 text-primary border border-primary/10 font-black text-[10px] uppercase tracking-widest">
           <Zap size={14} className="text-accent" />
           {isAr ? 'خدمات إلكترونية' : 'E-SERVICES'}
        </div>
      ),
      codeReact: `<div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 text-primary border border-primary/10 font-black text-[10px] uppercase tracking-widest">
  <Zap size={14} className="text-accent" />
  E-SERVICES
</div>`,
      codeHtml: `<span class="bg-[#00737510] text-[#007375] px-4 py-2 rounded-lg font-black text-[10px] flex items-center gap-2">
  E-SERVICES
</span>`,
      codeDotNet: `public class Category { public string Title { get; set; } public string Color { get; set; } }`,
      codeCss: `.tag-matrix { letter-spacing: 0.1em; border-radius: 0.75rem; }`
    },
    // 10. Horizontal Service Card
    {
      id: 'svc-card-horiz',
      name: isAr ? 'بطاقة خدمة أفقية' : 'Horizontal Service Card',
      category: 'Complex',
      render: (
        <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group w-full">
           <div className="flex items-center gap-6">
              <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg group-hover:bg-accent group-hover:text-slate-900 transition-colors">
                <Landmark size={28}/>
              </div>
              <div>
                <h5 className="font-black text-sm text-primary">{isAr ? 'ترخيص البناء' : 'Building Permit'}</h5>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{isAr ? 'الموافقات الهندسية الفورية' : 'Instant Engineering Approvals'}</p>
              </div>
           </div>
           <ChevronRight className="text-slate-200 group-hover:text-accent group-hover:translate-x-2 transition-all" />
        </div>
      ),
      codeReact: `<div className="flex items-center justify-between p-6 rounded-[2rem] bg-white group shadow-sm transition-all">
  <div className="flex items-center gap-6">
    <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center">
      <Landmark size={28}/>
    </div>
    <div>
      <h5 className="font-black text-sm text-primary">Building Permit</h5>
    </div>
  </div>
</div>`,
      codeHtml: `<div class="p-6 rounded-[2rem] border border-gray-100 flex items-center gap-6 hover:shadow-lg">
  <div class="bg-[#007375] p-4 rounded-xl text-white">...</div>
  <h5 class="font-black">Building Permit</h5>
</div>`,
      codeDotNet: `public class ServiceCard { public string Id { get; set; } public string Title { get; set; } }`,
      codeCss: `.card-hover { transform: translateY(0); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }`
    },
    // Additional components placeholder definitions...
    { id: 'btn-ghost', name: 'Ghost Button', category: 'Interactive' },
    { id: 'input-date', name: 'Date Picker Field', category: 'Forms' },
    { id: 'tab-modern', name: 'Modern Tab System', category: 'Navigation' },
    { id: 'alert-success', name: 'Success Alert Toast', category: 'Feedback' },
    { id: 'tooltip-brand', name: 'Brand Tooltip', category: 'Feedback' },
    { id: 'progress-bar-flat', name: 'Flat Progress Bar', category: 'Visuals' },
    { id: 'avatar-group', name: 'Avatar Group', category: 'Identity' },
    { id: 'checkbox-brand', name: 'Brand Checkbox', category: 'Forms' },
    { id: 'radio-neural', name: 'Neural Radio Group', category: 'Forms' },
    { id: 'breadcrumb-node', name: 'Breadcrumb Node', category: 'Navigation' },
    { id: 'pagination-pill', name: 'Pill Pagination', category: 'Navigation' },
    { id: 'social-icon-box', name: 'Social Icon Card', category: 'Complex' },
    { id: 'footer-logo-col', name: 'Footer Brand Section', category: 'Complex' },
    { id: 'header-nav-link', name: 'Header Active Link', category: 'Navigation' },
    { id: 'ticker-item', name: 'News Ticker Block', category: 'Complex' },
    { id: 'skeleton-glow', name: 'Skeleton Glow Loader', category: 'Visuals' },
    { id: 'modal-header-brand', name: 'Modal Brand Header', category: 'Complex' },
    { id: 'divider-wave', name: 'Wave Divider', category: 'Visuals' },
    { id: 'map-pin-pulse', name: 'Pulsing Map Pin', category: 'Visuals' },
    { id: 'file-dropzone', name: 'Neural File Dropzone', category: 'Forms' },
    { id: 'lang-switch', name: 'Language Switcher', category: 'Interactive' },
    { id: 'pki-status-ring', name: 'PKI Connectivity Indicator', category: 'Identity' },
    { id: 'info-tooltip-box', name: 'Rich Info Tooltip', category: 'Feedback' },
    { id: 'table-header-dark', name: 'Dark Table Header', category: 'Data' },
    { id: 'table-row-zebra', name: 'Zebra Data Row', category: 'Data' },
    { id: 'card-glass-blur', name: 'Glass Blur Container', category: 'Visuals' },
    { id: 'btn-icon-circular', name: 'Circular Icon Button', category: 'Interactive' },
    { id: 'input-email-icon', name: 'Iconized Email Input', category: 'Forms' },
    { id: 'badge-count-red', name: 'Notification Counter', category: 'Feedback' },
    { id: 'tab-vertical', name: 'Vertical Tab Node', category: 'Navigation' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-12">
      {/* Search & Filter bar for Components */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 gap-6">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input className="w-full h-12 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold outline-none" placeholder={isAr ? 'ابحث عن مكون برمي...' : 'Filter components...'} />
         </div>
         <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Interactive', 'Forms', 'Data', 'Visuals', 'Identity'].map(cat => (
              <Button key={cat} variant="ghost" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-primary">
                {cat}
              </Button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {COMPONENT_DATA.map((comp) => (
          <Card key={comp.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 border-t-2 border-transparent hover:border-accent/20 h-full flex flex-col">
            <div className="p-10 flex-1 flex items-center justify-center bg-slate-50/50 relative overflow-hidden min-h-[220px]">
               {comp.render || <div className="text-slate-300 italic font-black uppercase text-[10px] tracking-widest">Preview: {comp.name}</div>}
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="rounded-lg font-mono text-[9px] bg-white/80 backdrop-blur-sm">ID: {comp.id}</Badge>
               </div>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                 <div>
                    <h4 className="font-black text-primary text-md">{comp.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{comp.category}</p>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-primary" onClick={() => onViewCode(comp)}>
                      <Code2 size={16}/>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:text-accent" onClick={() => onViewCss(comp)}>
                      <CSS3 size={16}/>
                    </Button>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Button className="flex-1 rounded-xl h-11 font-black text-[10px] tracking-widest uppercase border-2 border-slate-100 bg-white text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all">
                    {isAr ? 'استخدام المكون' : 'Use Component'}
                 </Button>
                 <Button variant="ghost" size="icon" className="rounded-xl size-11 bg-slate-50 text-slate-400 hover:bg-accent/10 hover:text-accent">
                    <Share2 size={16}/>
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Stack Identity Pattern Showcase */}
      <div className="p-20 rounded-[4rem] bg-slate-900 text-white relative overflow-hidden">
         <div className="relative z-10 grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <Badge className="bg-accent text-slate-900 font-black px-6 py-2 rounded-xl text-[10px] tracking-[0.3em]">PATTERN REGISTRY</Badge>
               <h3 className="text-5xl font-black leading-none tracking-tighter">
                  {isAr ? 'نظام التصميم الموحد لبلدية ظفار' : 'Dhofar Municipality Unified Design System'}
               </h3>
               <p className="text-xl text-slate-400 font-bold leading-relaxed max-w-xl">
                  {isAr ? 'أكثر من 40 مكوناً ذرياً ونمطاً بصرياً تم تصميمها هندسياً لضمان تجربة مستخدم عالمية تليق بسلطنة عمان.' : 'Over 40 atomic components and visual patterns engineered for a world-class user experience in Oman.'}
               </p>
               <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                     <CheckCircle2 className="text-accent" size={20}/>
                     <span className="text-xs font-black uppercase tracking-widest text-slate-300">WCAG 2.2 Compliant</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                     <Sparkles className="text-accent" size={20}/>
                     <span className="text-xs font-black uppercase tracking-widest text-slate-300">AI Component Ready</span>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
               {[
                 { icon: <Database/>, label: 'JSON State' },
                 { icon: <Globe/>, label: 'i18n Ready' },
                 { icon: <ShieldCheck/>, label: 'PKI Validated' },
                 { icon: <Zap/>, label: 'High Perf' }
               ].map(item => (
                 <div key={item.label} className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-4 group hover:border-accent/40 transition-all cursor-pointer">
                    <div className="size-16 rounded-3xl bg-accent text-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                       {React.cloneElement(item.icon as any, { size: 32 })}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">{item.label}</span>
                 </div>
               ))}
            </div>
         </div>
         <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
      </div>
    </div>
  );
}
