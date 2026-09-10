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
          <Button className="dm-gradient-primary rounded-full px-8">Primary Action</Button>
          <Button variant="outline" className="rounded-full border-primary text-primary font-bold">Secondary</Button>
          <Button variant="ghost" className="rounded-full font-bold">Ghost Link</Button>
          <Button className="bg-secondary rounded-full font-bold">Purple Accent</Button>
        </div>
      )
    },
    {
      title: isAr ? 'الحقول والبحث (Inputs & Search)' : 'Inputs & Search',
      render: (
        <div className="space-y-4 max-w-md">
          <div className="relative">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isAr ? "right-3" : "left-3")} size={18} />
            <Input placeholder={isAr ? "بحث..." : "Search..."} className={cn("rounded-xl", isAr ? "pr-10" : "pl-10")} />
          </div>
          <Input placeholder={isAr ? "حقل نصي" : "Text Field"} className="rounded-xl" />
        </div>
      )
    },
    {
      title: isAr ? 'الأكورديون (Accordion)' : 'Accordion',
      render: (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-bold">كيف يمكنني الوصول للخدمة؟</AccordionTrigger>
            <AccordionContent className="font-medium text-slate-600">
              يمكنك الدخول عبر الهوية الرقمية أو استخدام حسابك في البوابة.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-bold">هل هناك رسوم إضافية؟</AccordionTrigger>
            <AccordionContent className="font-medium text-slate-600">
              تختلف الرسوم حسب نوع الخدمة المقدمة.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    },
    {
      title: isAr ? 'الشارات والأوسمة (Badges)' : 'Badges',
      render: (
        <div className="flex flex-wrap gap-3">
          <Badge className="bg-accent text-white px-4 py-1">Active</Badge>
          <Badge variant="outline" className="border-emerald-500 text-emerald-600 px-4 py-1">Approved</Badge>
          <Badge variant="destructive" className="px-4 py-1">Rejected</Badge>
          <Badge className="bg-secondary px-4 py-1">New Service</Badge>
        </div>
      )
    },
    {
      title: isAr ? 'معالج الخطوات (Stepper)' : 'Stepper',
      render: (
        <div className="flex items-center justify-between w-full max-w-lg mx-auto py-4">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md",
                step === 1 ? "bg-primary text-white scale-110 shadow-primary/20" : "bg-slate-100 text-slate-400"
              )}>
                {step}
              </div>
              {step < 3 && <div className="flex-1 h-1 bg-slate-100 mx-2 rounded-full" />}
            </React.Fragment>
          ))}
        </div>
      )
    },
    {
      title: isAr ? 'التلميحات والتحميل (Indicators)' : 'Indicators',
      render: (
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-[10px] font-black uppercase text-slate-400">Loading</span>
          </div>
          <div className="space-y-4 flex-1">
             <Progress value={65} className="h-2" />
             <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                <span>Progress</span>
                <span>65%</span>
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
        <p className="text-slate-500 font-bold max-w-2xl mx-auto text-lg">
          استعراض شامل لعناصر واجهة الاستخدام المصممة لتتوافق مع معايير النفاذ الرقمي العالمية WCAG 2.2 AA والهوية البصرية الموحدة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {components.map((comp, idx) => (
          <Card key={idx} className="rounded-brand border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <CardTitle className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                {comp.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              {comp.render}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wave Pattern Showcase */}
      <div className="mt-20 p-12 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl border-t-4 border-accent">
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-black mb-6 flex items-center gap-4">
               أنماط الموجات <span className="text-accent text-sm font-bold border border-accent/30 px-3 py-1 rounded-full">Multi-Wave Pattern</span>
            </h3>
            <p className="text-slate-400 font-bold mb-10 text-lg leading-relaxed">
              تعتبر الموجات الخمس المتتالية رمزاً للانسيابية والخدمات المتكاملة في محافظة ظفار. تم تصميمها لتعبر عن الطبيعة الساحرة للمحافظة والتحول الرقمي السلس.
            </p>
            <div className="flex gap-4">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="w-12 h-1 bg-accent rounded-full opacity-20" style={{ opacity: i * 0.2 }} />
               ))}
            </div>
          </div>
          <div className="h-48 w-full dm-wave-5 opacity-40 bg-center" />
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent/10 rounded-full blur-[120px]" />
      </div>

      {/* Accessibility Statement */}
      <div className="mt-10 p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
               <Accessibility size={32} />
            </div>
            <div>
               <h4 className="font-black text-emerald-900">{isAr ? "بيان النفاذ الرقمي" : "Accessibility Statement"}</h4>
               <p className="text-emerald-700/70 font-bold text-sm">{isAr ? "هذه المنصة تلتزم بمعايير WCAG 2.2 AA لضمان وصول الجميع." : "Platform compliant with WCAG 2.2 AA standards."}</p>
            </div>
         </div>
         <Button variant="outline" className="rounded-full border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors">
            {isAr ? "عرض التفاصيل" : "View Details"}
         </Button>
      </div>
    </div>
  );
}
