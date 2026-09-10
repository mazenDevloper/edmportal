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
  ArrowRight
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

export function IdentityShowcase({ isAr }: { isAr: boolean }) {
  const components = [
    {
      title: isAr ? 'الأزرار (Buttons)' : 'Buttons',
      render: (
        <div className="flex flex-wrap gap-4">
          <Button className="dm-gradient-primary rounded-full px-8">Primary Action</Button>
          <Button variant="outline" className="rounded-full border-primary text-primary">Secondary</Button>
          <Button variant="ghost" className="rounded-full">Ghost Link</Button>
          <Button className="bg-secondary rounded-full">Purple Accent</Button>
        </div>
      )
    },
    {
      title: isAr ? 'الحقول والبحث (Inputs & Search)' : 'Inputs & Search',
      render: (
        <div className="space-y-4 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder={isAr ? "بحث..." : "Search..."} className="pl-10 rounded-xl" />
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
            <AccordionContent>
              يمكنك الدخول عبر الهوية الرقمية أو استخدام حسابك في البوابة.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-bold">هل هناك رسوم إضافية؟</AccordionTrigger>
            <AccordionContent>
              تختلف الرسوم حسب نوع الخدمة المقدمة.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    },
    {
      title: isAr ? 'الشارات والأوسمة (Badges)' : 'Badges',
      render: (
        <div className="flex gap-3">
          <Badge className="bg-accent text-white">Active</Badge>
          <Badge variant="outline" className="border-emerald-500 text-emerald-600">Approved</Badge>
          <Badge variant="destructive">Rejected</Badge>
          <Badge className="bg-secondary">New Service</Badge>
        </div>
      )
    },
    {
      title: isAr ? 'الجداول (Tables)' : 'Tables',
      render: (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الخدمة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold">ترخيص بناء</TableCell>
              <TableCell><Badge className="bg-emerald-500">مكتمل</Badge></TableCell>
              <TableCell>2024/05/10</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">عقد إيجار</TableCell>
              <TableCell><Badge className="bg-orange-500">قيد المراجعة</Badge></TableCell>
              <TableCell>2024/05/12</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    },
    {
      title: isAr ? 'معالج الخطوات (Stepper)' : 'Stepper',
      render: (
        <div className="flex items-center justify-between w-full max-w-lg mx-auto">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                step === 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
              )}>
                {step}
              </div>
              {step < 3 && <div className="flex-1 h-1 bg-slate-100 mx-2" />}
            </React.Fragment>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-50 border border-slate-200 mb-6">
          <Palette className="text-primary" size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Design System Components (GUP-DS)</span>
        </div>
        <h2 className="text-6xl font-black text-primary tracking-tighter mb-4">الهوية الرقمية لبلدية ظفار</h2>
        <p className="text-slate-500 font-bold max-w-2xl mx-auto">
          تستعرض هذه الصفحة عناصر واجهة الاستخدام (UI) المصممة خصيصاً لهوية محافظة ظفار، مع مراعاة معايير النفاذ الرقمي WCAG 2.2.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {components.map((comp, idx) => (
          <Card key={idx} className="rounded-brand border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg font-black text-primary">{comp.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {comp.render}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-20 p-10 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-6">أنماط الموجات (Mult-Wave Pattern)</h3>
          <p className="text-slate-400 font-bold mb-10 max-w-xl">
            تعتبر الموجات الخمس المتتالية رمزاً للانسيابية والخدمات المتكاملة في محافظة ظفار، وهي جزء أساسي من الهوية البصرية الموحدة.
          </p>
          <div className="h-20 w-full dm-wave-5 opacity-40" />
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
