
'use client';

import React, { useState } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { IdentityShowcase } from '@/components/identity-showcase';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Palette, Box, Code2, Braces, Globe, Copy, Check, LayoutPanelTop } from 'lucide-react';
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
    <div className={cn("min-h-screen bg-[#F0F2FA]", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-12">
        <div className="max-w-[1400px] mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white/50 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest">
                <LayoutPanelTop size={14} /> {isAr ? 'نظام التصميم الرقمي لبلدية ظفار' : 'Dhofar Municipality UI Kit v4.0'}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter leading-none">
                {isAr ? 'مكونات الواجهة الموحدة' : 'Unified UI Matrix'}
              </h1>
              <p className="text-md font-bold text-slate-400 max-w-xl leading-relaxed">
                {isAr ? 'استكشف أكثر من 40 مكوناً ذكياً تم تصميمها هندسياً لخدمة مواطني محافظة ظفار وفق أرقى المعايير.' : 'Explore 40+ smart components engineered for Dhofar Governorate citizens with premium standards.'}
              </p>
            </div>
            <div className="relative z-10 size-32 rounded-[2.5rem] bg-accent text-slate-900 flex items-center justify-center shadow-2xl rotate-3 group hover:rotate-0 transition-transform duration-500">
              <Palette size={50} className="group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <IdentityShowcase 
          isAr={isAr} 
          onViewCode={(comp) => { setSelectedComponent(comp); setActiveTab('code'); }} 
          onViewCss={(comp) => { setSelectedComponent(comp); setActiveTab('css'); }} 
        />
      </main>

      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 rounded-[2.5rem] border-none shadow-2xl flex flex-col bg-slate-950">
          <DialogHeader className="p-8 bg-slate-900 border-b border-white/5">
             <div className="flex items-center justify-between">
                <div>
                   <DialogTitle className="text-white text-2xl font-black">{selectedComponent?.name}</DialogTitle>
                   <DialogDescription className="text-slate-400 font-bold mt-1">Source Code Explorer v4.0</DialogDescription>
                </div>
                <div className="flex gap-2">
                   <Button variant={activeTab === 'code' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('code')} className="rounded-xl gap-2 font-black h-10 px-6"><Code2 size={16}/> {isAr ? 'الكود' : 'Code'}</Button>
                   <Button variant={activeTab === 'css' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('css')} className="rounded-xl gap-2 font-black h-10 px-6"><Braces size={16}/> CSS</Button>
                </div>
             </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1 rounded-xl mb-6 h-12">
                  <TabsTrigger value="react" className="font-black gap-2 h-10 px-6">React (TSX)</TabsTrigger>
                  <TabsTrigger value="html" className="font-black gap-2 h-10 px-6">HTML / Tailwind</TabsTrigger>
                  <TabsTrigger value="dotnet" className="font-black gap-2 h-10 px-6">.NET Model</TabsTrigger>
                </TabsList>
                
                <TabsContent value="react" className="relative group">
                   <pre className="p-6 bg-black rounded-2xl text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeReact}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeReact)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-10 p-0">
                     {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                   </Button>
                </TabsContent>

                <TabsContent value="html" className="relative group">
                   <pre className="p-6 bg-black rounded-2xl text-blue-400 font-mono text-xs leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeHtml}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeHtml)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-10 p-0">
                     {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                   </Button>
                </TabsContent>

                <TabsContent value="dotnet" className="relative group">
                   <pre className="p-6 bg-black rounded-2xl text-purple-400 font-mono text-xs leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeDotNet}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeDotNet)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-10 p-0">
                     {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                   </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative group h-full">
                <pre className="p-6 bg-black rounded-2xl text-blue-300 font-mono text-xs leading-relaxed overflow-x-auto h-full min-h-[300px]">
                  <code>{selectedComponent?.codeCss || '/* No custom CSS required for this component. */'}</code>
                </pre>
                <Button onClick={() => handleCopy(selectedComponent?.codeCss)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-10 p-0">
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
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
