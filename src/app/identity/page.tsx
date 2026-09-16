
'use client';

import React, { useState } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { IdentityShowcase } from '@/components/identity-showcase';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Palette, Code2, Braces, LayoutPanelTop, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IdentityPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'css'>('code');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("min-h-screen bg-[#F4F6FC]", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white/80 backdrop-blur-2xl rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.03)] border border-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                <LayoutPanelTop size={16} /> {isAr ? 'نظام التصميم الرقمي لبلدية ظفار' : 'Dhofar Municipality UI Matrix v4.2'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-none">
                {isAr ? 'مكتبة المكونات الموحدة' : 'Unified Component Library'}
              </h1>
              <p className="text-xl font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'أكثر من 300 مكون برمجى تم تصميمها هندسياً لخدمة مواطني محافظة ظفار، مع تحكم كامل في الأبعاد والكود.' : '300+ engineering-grade components crafted for Dhofar citizens with full dimension and code control.'}
              </p>
            </div>
            <div className="relative z-10 size-48 rounded-[3.5rem] bg-accent text-slate-900 flex items-center justify-center shadow-[0_30px_60px_rgba(3,207,203,0.3)] rotate-6 group hover:rotate-0 transition-transform duration-700">
              <Palette size={80} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full dm-wave-5 opacity-5 pointer-events-none" />
          </div>
        </div>

        <IdentityShowcase 
          isAr={isAr} 
          onViewCode={(comp) => { setSelectedComponent(comp); setActiveTab('code'); }} 
          onViewCss={(comp) => { setSelectedComponent(comp); setActiveTab('css'); }} 
        />
      </main>

      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0 rounded-[3rem] border-none shadow-2xl flex flex-col bg-slate-950">
          <DialogHeader className="p-10 bg-slate-900 border-b border-white/5 relative overflow-hidden">
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <DialogTitle className="text-white text-3xl font-black">{selectedComponent?.name}</DialogTitle>
                   <DialogDescription className="text-accent font-black mt-2 uppercase text-[10px] tracking-widest">Global Component Metadata v4.2</DialogDescription>
                </div>
                <div className="flex gap-3">
                   <Button variant={activeTab === 'code' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('code')} className="rounded-xl gap-2 font-black h-12 px-8 transition-all"><Code2 size={18}/> {isAr ? 'الكود المصدر' : 'Source Code'}</Button>
                   <Button variant={activeTab === 'css' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('css')} className="rounded-xl gap-2 font-black h-12 px-8 transition-all"><Braces size={18}/> CSS</Button>
                </div>
             </div>
             <div className="absolute top-0 left-0 w-full h-full dm-wave-5 opacity-5 pointer-events-none" />
          </DialogHeader>

          <div className="flex-1 overflow-auto p-10 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1.5 rounded-[1.5rem] mb-8 h-14 w-fit">
                  <TabsTrigger value="react" className="font-black gap-3 h-11 px-8 rounded-xl data-[state=active]:bg-primary">React (TSX)</TabsTrigger>
                  <TabsTrigger value="html" className="font-black gap-3 h-11 px-8 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-slate-900">HTML / Tailwind</TabsTrigger>
                  <TabsTrigger value="dotnet" className="font-black gap-3 h-11 px-8 rounded-xl data-[state=active]:bg-indigo-600">.NET Logic</TabsTrigger>
                </TabsList>
                
                <TabsContent value="react" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner border border-white/5">
                     <code>{selectedComponent?.codeReact}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeReact)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white rounded-xl size-12 p-0 shadow-2xl">
                     {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                   </Button>
                </TabsContent>

                <TabsContent value="html" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-blue-400 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner border border-white/5">
                     <code>{selectedComponent?.codeHtml}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeHtml)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white rounded-xl size-12 p-0 shadow-2xl">
                     {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                   </Button>
                </TabsContent>

                <TabsContent value="dotnet" className="relative group">
                   <pre className="p-8 bg-black rounded-[2rem] text-purple-400 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner border border-white/5">
                     <code>{selectedComponent?.codeDotNet}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeDotNet)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white rounded-xl size-12 p-0 shadow-2xl">
                     {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                   </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative group h-full">
                <pre className="p-8 bg-black rounded-[2rem] text-blue-300 font-mono text-sm leading-relaxed overflow-x-auto h-full min-h-[400px] shadow-inner border border-white/5">
                  <code>{selectedComponent?.codeCss || '/* Standard Dhofar UI variables applied. No additional CSS. */'}</code>
                </pre>
                <Button onClick={() => handleCopy(selectedComponent?.codeCss)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white rounded-xl size-12 p-0 shadow-2xl">
                  {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
