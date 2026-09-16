
'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Upload, 
  CreditCard,
  User,
  LayoutGrid,
  FileText,
  ArrowRight,
  Palette,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Contrast,
  Bell,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function IdentityShowcase({ isAr }: { isAr: boolean }) {
  return (
    <div className="max-w-7xl mx-auto px-6 space-y-12">
      {/* Dynamic Component Grid - Matching requested visual style */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
        
        {/* Card 1: Main Stats / Circular Rings */}
        <Card className="col-span-1 md:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-8 h-full">
          <div className="flex justify-between items-center">
             <h4 className="font-black text-primary text-lg">{isAr ? 'مؤشرات الأداء' : 'Service Metrics'}</h4>
             <MoreHorizontal className="text-slate-300" />
          </div>
          <div className="flex flex-wrap justify-around gap-8 py-4">
             {[
               { val: 77, label: isAr ? 'المعاملات المنجزة' : 'Transactions', color: 'text-accent' },
               { val: 42, label: isAr ? 'رضا المواطن' : 'User Satisfaction', color: 'text-primary' },
               { val: 95, label: isAr ? 'النفاذ الرقمي' : 'Accessibility', color: 'text-secondary' }
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center gap-4">
                  <div className={cn("size-24 rounded-full border-[8px] flex items-center justify-center font-black text-xl", stat.color, "border-slate-50")}>
                    {stat.val}%
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</span>
               </div>
             ))}
          </div>
        </Card>

        {/* Card 2: Quick Actions / Buttons */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6">
           <h4 className="font-black text-primary text-lg">{isAr ? 'أدوات التحكم' : 'Interactive Controls'}</h4>
           <div className="space-y-4">
             <Button className="w-full dm-gradient-primary rounded-2xl h-14 font-black shadow-lg">CONFIRM</Button>
             <Button variant="outline" className="w-full rounded-2xl h-14 font-black border-2 border-slate-100 hover:bg-slate-50">CANCEL</Button>
             <div className="flex gap-2">
                <Button size="icon" className="rounded-xl size-12 bg-accent"><Plus /></Button>
                <Button size="icon" className="rounded-xl size-12 bg-secondary"><Settings /></Button>
                <Button size="icon" className="rounded-xl size-12 bg-primary"><Bell /></Button>
             </div>
           </div>
        </Card>

        {/* Card 3: User Profiles / Identity */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary text-white p-8 space-y-8">
           <div className="flex justify-between items-center">
              <ShieldCheck className="text-accent" size={32} />
              <Badge className="bg-white/10 text-white rounded-full px-4 text-[10px]">VERIFIED</Badge>
           </div>
           <div className="space-y-4">
              <h4 className="text-2xl font-black">{isAr ? 'الهوية الرقمية' : 'Neural Identity'}</h4>
              <p className="text-xs opacity-60 leading-relaxed">{isAr ? 'نظام المصادقة الموحد لبوابة بلدية ظفار.' : 'Unified authentication for Dhofar Municipality.'}</p>
           </div>
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <Avatar className="size-12 border-2 border-accent">
                 <AvatarFallback className="bg-white text-primary font-black">DM</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                 <p className="font-black text-sm">{isAr ? 'المواطن الرقمي' : 'Digital Citizen'}</p>
                 <p className="text-[10px] opacity-40 font-mono">ID: 987654321</p>
              </div>
              <ChevronRight size={16} className="text-accent" />
           </div>
        </Card>

        {/* Card 4: Navigation / Tags */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6">
           <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{isAr ? 'التصنيفات' : 'CATEGORIES'}</h4>
           <nav className="flex flex-col gap-2">
              {['Building', 'Environment', 'Financial', 'Corporate'].map(tag => (
                <div key={tag} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-accent/10 transition-colors group">
                   <span className="font-bold text-sm text-slate-600 group-hover:text-primary">{tag}</span>
                   <div className="size-2 rounded-full bg-slate-300 group-hover:bg-accent" />
                </div>
              ))}
           </nav>
        </Card>

        {/* Card 5: Form Elements */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-8 col-span-1 md:col-span-2">
           <h4 className="font-black text-primary text-lg">{isAr ? 'نماذج البيانات' : 'Form Elements'}</h4>
           <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 bg-white">
                    <span className="font-black text-sm text-slate-700">Income Level</span>
                    <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                 </div>
                 <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 bg-white">
                    <span className="font-black text-sm text-slate-700">Online Wallet</span>
                    <Switch className="data-[state=checked]:bg-accent" />
                 </div>
              </div>
              <div className="space-y-6">
                 <Progress value={65} className="h-2 bg-slate-100" />
                 <div className="flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Growth Rate</p>
                       <h5 className="text-3xl font-black text-primary">+12.5%</h5>
                    </div>
                    <TrendingUp className="text-emerald-500 mb-1" />
                 </div>
              </div>
           </div>
        </Card>

        {/* Card 6: Charts / Visuals */}
        <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-10 space-y-6 h-full flex flex-col justify-between">
           <div className="space-y-2">
              <h4 className="text-2xl font-black">{isAr ? 'الإحصائيات' : 'Data Insight'}</h4>
              <p className="text-xs text-slate-500">{isAr ? 'تحديث لحظي لكافة المعاملات.' : 'Real-time sync of all transactions.'}</p>
           </div>
           <div className="flex items-end gap-3 h-32 px-4">
              {[40, 70, 45, 90, 60, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-accent/20 rounded-t-xl group relative">
                   <div 
                     className="absolute bottom-0 left-0 w-full bg-accent rounded-t-xl transition-all duration-1000" 
                     style={{ height: `${h}%` }} 
                   />
                </div>
              ))}
           </div>
           <Button variant="ghost" className="w-full text-accent font-black hover:text-white hover:bg-white/5">VIEW FULL REPORT</Button>
        </Card>
      </div>

      {/* Corporate Pattern Showcase */}
      <div className="p-16 rounded-[4rem] bg-white shadow-2xl relative overflow-hidden border border-white/50">
        <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h3 className="text-4xl font-black text-primary leading-tight">
               {isAr ? 'نظام التصميم الرقمي لبلدية ظفار' : 'Dhofar Municipality Digital DS'}
            </h3>
            <p className="text-slate-500 font-bold leading-relaxed">
              {isAr 
                ? 'مجموعة متكاملة من العناصر البصرية والودجيت البرمجية التي تضمن توحيد التجربة الرقمية في كافة منصات البلدية.'
                : 'A cohesive set of visual elements and functional widgets that ensure a unified digital experience across all municipal platforms.'}
            </p>
            <div className="flex gap-4">
               <Badge className="bg-primary text-white px-6 py-2 rounded-xl">v4.5 Stable</Badge>
               <Badge variant="outline" className="border-accent text-accent px-6 py-2 rounded-xl">WCAG 2.2 Compliant</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-4 group hover:border-primary/20 transition-all">
                <MousePointer2 className="text-primary group-hover:scale-110 transition-transform" size={40} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interaction</span>
             </div>
             <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-4 group hover:border-accent/20 transition-all">
                <Palette className="text-accent group-hover:scale-110 transition-transform" size={40} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visuals</span>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
      </div>
    </div>
  );
}
