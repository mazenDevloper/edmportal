
'use client';

import React, { useState } from 'react';
import { 
  Accessibility, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Plus, 
  Upload, 
  Filter, 
  Flag,
  CreditCard,
  User,
  LayoutGrid,
  FileText,
  Clock,
  ArrowRight,
  Palette,
  Loader2,
  ExternalLink,
  ChevronLeft,
  X,
  Menu,
  MoreHorizontal,
  Contrast,
  Type,
  Maximize2
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export function IdentityShowcase({ isAr }: { isAr: boolean }) {
  const [viewCode, setViewCode] = useState<string | null>(null);

  const elements = [
    {
      id: 'accordion',
      title: isAr ? 'الأكورديون (Accordion)' : 'Accordion',
      desc: 'Used to expand and collapse detailed pieces of information dynamically.',
      code: `<Accordion type="single" collapsible>\n  <AccordionItem value="1">\n    <AccordionTrigger>How to login?</AccordionTrigger>\n    <AccordionContent>Use your Thiqa app or secure national identity smartcard.</AccordionContent>\n  </AccordionItem>\n</Accordion>`,
      render: (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-slate-100">
            <AccordionTrigger className="font-bold text-slate-800 hover:text-primary">
              {isAr ? 'كيف يمكنني تقديم طلب رخص بناء؟' : 'How to request building permit?'}
            </AccordionTrigger>
            <AccordionContent className="font-medium text-slate-500 leading-relaxed">
              {isAr ? 'يمكنك تقديم الطلب عبر تحميل المستندات المحددة ودفع رسوم البوابه الإلكترونيه البالغة 50 ريال عماني.' : 'You can submit the request by uploading the specified documents and paying the 50 OMR fee.'}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    },
    {
      id: 'avatar',
      title: isAr ? 'الأفتار (Avatar)' : 'Avatar',
      desc: 'Visual representation of user profile or municipal account avatar details.',
      code: `<Avatar>\n  <AvatarImage src="/user.jpg" />\n  <AvatarFallback>DM</AvatarFallback>\n</Avatar>`,
      render: (
        <div className="flex gap-4 items-center">
          <Avatar className="h-12 w-12 border-2 border-primary shadow-sm">
            <AvatarFallback className="bg-primary text-white font-black">ظفار</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12 border-2 border-accent shadow-sm">
            <AvatarFallback className="bg-secondary text-white font-black">OM</AvatarFallback>
          </Avatar>
        </div>
      )
    },
    {
      id: 'badge',
      title: isAr ? 'الشارة (Badge)' : 'Badge',
      desc: 'Used for system states, counts, and classification tags.',
      code: `<Badge className="bg-accent text-white">جديد</Badge>`,
      render: (
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-accent text-white px-4 py-1.5 rounded-full border-none">{isAr ? 'معتمد' : 'Approved'}</Badge>
          <Badge className="bg-secondary text-white px-4 py-1.5 rounded-full border-none">{isAr ? 'قيد المراجعة' : 'Under Review'}</Badge>
          <Badge variant="outline" className="border-red-500 text-red-600 px-4 py-1.5 rounded-full">{isAr ? 'مرفوض' : 'Rejected'}</Badge>
        </div>
      )
    },
    {
      id: 'button',
      title: isAr ? 'الزر (Button)' : 'Button',
      desc: 'Standard brand button behaviors optimized for interactive action hierarchies.',
      code: `<Button className="dm-gradient-primary rounded-full px-8 font-black">Primary Action</Button>`,
      render: (
        <div className="flex flex-wrap gap-3">
          <Button className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
            {isAr ? 'الإجراء الأساسي' : 'Primary Action'}
          </Button>
          <Button variant="outline" className="rounded-full border-primary text-primary font-bold hover:bg-primary/5">
            {isAr ? 'إجراء ثانوي' : 'Secondary action'}
          </Button>
        </div>
      )
    },
    {
      id: 'checkbox',
      title: isAr ? 'مربع الاختيار (Checkbox)' : 'Checkbox',
      desc: 'Allows selection of multiple related items or system variables in forms.',
      code: `<Checkbox id="terms" />\n<Label htmlFor="terms">Accept compliance policy</Label>`,
      render: (
        <div className="flex items-center gap-3">
          <Checkbox id="terms-id" className="border-primary data-[state=checked]:bg-primary" />
          <Label htmlFor="terms-id" className="font-bold text-slate-700 cursor-pointer">
            {isAr ? 'أوافق على كافة الشروط والأحكام والأنظمة البلدية المعمول بها.' : 'I agree to all digital service terms and regulations.'}
          </Label>
        </div>
      )
    },
    {
      id: 'stepper',
      title: isAr ? 'معالج الخطوات (Stepper)' : 'Stepper',
      desc: 'Displays sequence steps for citizens during municipal transactions workflow.',
      code: `// Custom step rendering container`,
      render: (
        <div className="flex items-center justify-between w-full max-w-md mx-auto py-2">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all",
                  step === 1 ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400"
                )}>
                  {step}
                </div>
                <span className="text-[10px] font-bold text-slate-400">{isAr ? `خطوة ${step}` : `Step ${step}`}</span>
              </div>
              {step < 3 && <div className="flex-1 h-1 bg-slate-100 mx-2 rounded-full" />}
            </React.Fragment>
          ))}
        </div>
      )
    },
    {
      id: 'progress',
      title: isAr ? 'مؤشر التقدم (Progress)' : 'Progress Bar',
      desc: 'Linear completion indicator for processing tasks or request reviews status.',
      code: `<Progress value={65} />`,
      render: (
        <div className="w-full space-y-2">
          <Progress value={65} className="h-2 rounded-full bg-slate-100" />
          <div className="flex justify-between text-[11px] font-black text-slate-400">
            <span>{isAr ? 'نسبة إنجاز المعاملة' : 'Request progress status'}</span>
            <span className="text-primary">65%</span>
          </div>
        </div>
      )
    },
    {
      id: 'switch',
      title: isAr ? 'مفتاح التبديل (Toggle Switch)' : 'Switch',
      desc: 'Instant preference switch mechanism for dynamic preferences values change.',
      code: `<Switch checked={true} />`,
      render: (
        <div className="flex items-center gap-4">
          <Switch id="notify-switch" className="data-[state=checked]:bg-accent" />
          <Label htmlFor="notify-switch" className="font-bold text-slate-600">
            {isAr ? 'تفعيل الإشعارات النصية القصيرة ببلدية ظفار' : 'Enable Dhofar Municipality SMS alerts'}
          </Label>
        </div>
      )
    },
    {
      id: 'table',
      title: isAr ? 'الجدول (Table)' : 'Dynamic Data Table',
      desc: 'Structured spreadsheet table style for municipal fees and services indices.',
      code: `<Table> ... </Table>`,
      render: (
        <div className="w-full border rounded-xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-primary">{isAr ? 'الخدمة البلديّة' : 'Service'}</TableHead>
                <TableHead className="font-bold text-primary text-center">{isAr ? 'الرسوم المقررة' : 'Fees'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-xs">{isAr ? 'ترخيص حفر وتمديد' : 'Trenching Permit'}</TableCell>
                <TableCell className="font-black text-xs text-emerald-600 text-center">50 OMR</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-xs">{isAr ? 'تجديد عقود الإيجار الرقمية' : 'Lease Renewal'}</TableCell>
                <TableCell className="font-black text-xs text-emerald-600 text-center">15 OMR</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full bg-slate-50 border mb-4 shadow-sm">
          <Palette className="text-primary" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {isAr ? 'دليل مكونات الهوية الرقمية الشاملة لبلدية ظفار' : 'Dhofar Municipality Visual Standard Assets'}
          </span>
        </div>
        <h2 className="text-4xl font-black text-primary tracking-tight mb-2">
          {isAr ? 'نظام تصميم الخدمات الحكومية لسلطنة عمان' : 'Oman Government Design System Components Library'}
        </h2>
        <p className="text-slate-500 font-bold max-w-2xl mx-auto text-sm leading-relaxed">
          {isAr 
            ? 'مجموعة متكاملة من المكونات القابلة للتخصيص بدرجة عالية لبناء واجهات الاستخدام البلدية الرقمية وفقاً لإرشادات إمكانية الوصول العالمية (WCAG 2.2).'
            : 'Highly compliant ready-tested layout atomic elements matching visual instructions rules for Omani Digital Infrastructure environments.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {elements.map((el) => (
          <Card key={el.id} className="rounded-brand border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between group">
            <CardHeader className="bg-slate-50/50 border-b py-3 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  {el.title}
                </CardTitle>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{el.desc}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-secondary font-bold hover:bg-secondary/5 rounded-lg h-8"
                onClick={() => setViewCode(viewCode === el.id ? null : el.id)}
              >
                {viewCode === el.id ? (isAr ? 'إخفاء الكود' : 'Hide Code') : (isAr ? 'عرض الكود' : 'Source Code')}
              </Button>
            </CardHeader>
            <CardContent className="p-8 flex flex-col justify-center items-center bg-white min-h-[140px]">
              {viewCode === el.id ? (
                <pre className="w-full p-4 rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono overflow-x-auto text-left direction-ltr">
                  <code>{el.code}</code>
                </pre>
              ) : (
                <div className="w-full flex justify-center">{el.render}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Corporate Pattern Showcase */}
      <div className="mt-16 p-8 md:p-12 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden shadow-xl border-t-4 border-accent">
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-black mb-3">
               {isAr ? 'أنماط الموجات المعتمدة خماسية الطبقات' : 'Unified Brand Dynamic Multi-Wave Grid'}
            </h3>
            <p className="text-slate-400 font-medium text-xs leading-relaxed mb-6">
              {isAr 
                ? 'تعتبر الموجات الخمس المتتالية في ترويسة وتذييل منصات بلدية ظفار دلالة على الانسيابية العالية والتحول الرقمي السلس.'
                : 'The structural five waves background represents visual synchronization of continuous municipal upgrades across the Sultanate.'}
            </p>
            <div className="flex gap-2">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="w-10 h-1 bg-accent rounded-full" style={{ opacity: i * 0.2 }} />
               ))}
            </div>
          </div>
          <div className="h-40 w-full dm-wave-5 opacity-40 bg-center border border-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
