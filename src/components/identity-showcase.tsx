
'use client';

import React from 'react';
import { 
  Accessibility, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  MoreHorizontal, 
  Plus, 
  Upload, 
  Filter, 
  Flag,
  CreditCard,
  User,
  Table as TableIcon,
  LayoutGrid,
  FileText,
  Clock,
  ArrowRight,
  Palette,
  Loader2,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function IdentityShowcase({ isAr }: { isAr: boolean }) {
  const components = [
    {
      title: isAr ? 'الأزرار (Buttons)' : 'Buttons',
      render: (
        <div className="flex flex-wrap gap-4">
          <Button className="dm-gradient-primary rounded-full px-8 shadow-md">Primary Action</Button>
          <Button variant="outline" className="rounded-full border-primary text-primary font-bold hover:bg-primary/5 transition-all">Secondary</Button>
          <Button variant="ghost" className="rounded-full font-bold">Ghost Link</Button>
          <Button className="bg-secondary rounded-full font-bold shadow-sm hover:opacity-90">Purple Accent</Button>
        </div>
      )
    },
    {
      title: isAr ? 'الحقول والبحث (Inputs & Search)' : 'Inputs & Search',
      render: (
        <div className="space-y-4 max-w-md w-full">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isAr ? "right-4" : "left-4")} size={18} />
            <Input placeholder={isAr ? "ابحث عن خدمة..." : "Search services..."} className={cn("rounded-2xl h-12 border-slate-200 shadow-inner", isAr ? "pr-12" : "pl-12")} />
          </div>
          <div className="flex gap-2">
            <Input placeholder={isAr ? "الاسم الكامل" : "Full Name"} className="rounded-xl border-slate-200" />
            <Button className="bg-accent text-white rounded-xl h-10 px-6">إرسال</Button>
          </div>
        </div>
      )
    },
    {
      title: isAr ? 'الأكورديون (Accordion)' : 'Accordion',
      render: (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-slate-100">
            <AccordionTrigger className="font-bold text-slate-800 hover:text-primary">كيف يمكنني الوصول للخدمة؟</AccordionTrigger>
            <AccordionContent className="font-medium text-slate-500 leading-relaxed">
              يمكنك الدخول عبر الهوية الرقمية أو استخدام حسابك الموحد في البوابة الحكومية لضمان أعلى مستويات الأمان.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-slate-100">
            <AccordionTrigger className="font-bold text-slate-800 hover:text-primary">هل هناك رسوم إضافية؟</AccordionTrigger>
            <AccordionContent className="font-medium text-slate-500">
              تختلف الرسوم حسب نوع الخدمة المقدمة، وجميع الرسوم تظهر بوضوح قبل بدء المعاملة.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    },
    {
      title: isAr ? 'الشارات والأوسمة (Badges)' : 'Badges',
      render: (
        <div className="flex flex-wrap gap-3">
          <Badge className="bg-accent text-white px-4 py-1.5 rounded-full border-none shadow-sm">Active</Badge>
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 px-4 py-1.5 rounded-full bg-emerald-50">Approved</Badge>
          <Badge variant="destructive" className="px-4 py-1.5 rounded-full shadow-sm">Rejected</Badge>
          <Badge className="bg-secondary px-4 py-1.5 rounded-full border-none shadow-sm">New Service</Badge>
        </div>
      )
    },
    {
      title: isAr ? 'معالج الخطوات (Stepper)' : 'Stepper',
      render: (
        <div className="flex items-center justify-between w-full max-w-lg mx-auto py-4">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-md",
                  step === 1 ? "bg-primary text-white scale-110 shadow-primary/20" : "bg-slate-100 text-slate-400"
                )}>
                  {step}
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Step {step}</span>
              </div>
              {step < 3 && <div className="flex-1 h-1 bg-slate-100 mx-2 rounded-full mb-6" />}
            </React.Fragment>
          ))}
        </div>
      )
    },
    {
      title: isAr ? 'التلميحات والتحميل (Indicators)' : 'Indicators',
      render: (
        <div className="flex flex-col gap-8 w-full">
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-[10px] font-black uppercase text-slate-400">Loading</span>
            </div>
            <div className="space-y-4 flex-1">
               <Progress value={65} className="h-2 rounded-full" />
               <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Processing Progress</span>
                  <span className="text-primary">65%</span>
               </div>
            </div>
          </div>
          <div className="flex gap-4">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button variant="outline" size="icon" className="rounded-xl border-slate-200"><Info size={20}/></Button>
                 </TooltipTrigger>
                 <TooltipContent className="bg-slate-900 text-white border-none rounded-lg p-3">
                   <p className="text-xs font-bold">Help context tooltip</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
             <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
               <AlertCircle size={18} className="text-secondary" />
               <p className="text-[11px] font-bold text-slate-600">Verification is required for this action.</p>
             </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-50 border border-slate-200 mb-6 shadow-sm">
          <Palette className="text-primary" size={20} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Oman Gov Design System (GUP-DS)</span>
        </div>
        <h2 className="text-6xl font-black text-primary tracking-tighter mb-4 leading-tight">الهوية الرقمية لبلدية ظفار</h2>
        <p className="text-slate-500 font-bold max-w-2xl mx-auto text-lg leading-relaxed">
          استعراض شامل لعناصر واجهة الاستخدام المصممة لتتوافق مع معايير النفاذ الرقمي العالمية WCAG 2.2 AA والهوية البصرية الموحدة لمحافظة ظفار.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {components.map((comp, idx) => (
          <Card key={idx} className="rounded-brand border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
            <CardHeader className="bg-slate-50/50 border-b py-4 px-8 transition-colors group-hover:bg-slate-100">
              <CardTitle className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                {comp.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 flex items-center justify-center">
              {comp.render}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wave Pattern Showcase */}
      <div className="mt-24 p-12 md:p-20 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl border-t-4 border-accent">
        <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-16 h-1 bg-accent mb-8 rounded-full" />
            <h3 className="text-4xl font-black mb-8 flex flex-col gap-2">
               أنماط الموجات المعتمدة
               <span className="text-accent text-sm font-bold border border-accent/30 w-fit px-4 py-1.5 rounded-full uppercase tracking-widest">Multi-Wave Pattern (V5)</span>
            </h3>
            <p className="text-slate-400 font-bold mb-12 text-lg leading-relaxed">
              تعتبر الموجات الخمس المتتالية رمزاً للانسيابية والخدمات المتكاملة في محافظة ظفار. تم تصميمها لتعبر عن الطبيعة الساحرة للمحافظة والتحول الرقمي السلس في كافة المعاملات البلدية.
            </p>
            <div className="flex gap-4">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="w-12 h-1.5 bg-accent rounded-full transition-all hover:scale-125" style={{ opacity: i * 0.2 }} />
               ))}
            </div>
          </div>
          <div className="h-64 w-full dm-wave-5 opacity-40 bg-center border border-white/5 rounded-3xl" />
        </div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-accent/10 rounded-full blur-[140px]" />
      </div>

      {/* Accessibility Statement */}
      <div className="mt-12 p-10 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
         <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-emerald-600 shadow-md">
               <Accessibility size={40} />
            </div>
            <div>
               <h4 className="text-xl font-black text-emerald-900 mb-1">{isAr ? "بيان النفاذ الرقمي" : "Accessibility Statement"}</h4>
               <p className="text-emerald-700/70 font-bold text-sm max-w-lg leading-relaxed">{isAr ? "تلتزم هذه المنصة بمعايير WCAG 2.2 AA لضمان وصول كافة فئات المجتمع للخدمات الرقمية بسهولة ويسر." : "Platform compliant with international WCAG 2.2 AA standards for digital inclusion."}</p>
            </div>
         </div>
         <Button variant="outline" className="rounded-full border-emerald-200 text-emerald-700 font-bold h-14 px-10 hover:bg-emerald-100 transition-all shadow-sm">
            {isAr ? "عرض تفاصيل الامتثال" : "View Compliance Details"}
         </Button>
      </div>
    </div>
  );
}
