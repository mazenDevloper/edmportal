
'use client';

import React, { useState } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { IdentityShowcase } from '@/components/identity-showcase';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Palette, Box, Code2, CSS3, Globe, Copy, Check } from 'lucide-react';
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
    <div className={cn("min-h-screen bg-[#F8FAFC]", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white rounded-[3.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="relative z-10 space-y-4 text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent font-black text-[10px] uppercase tracking-widest mx-auto md:mx-0">
                <Box size={14} /> {isAr ? 'نظام التصميم الرقمي لبلدية ظفار' : 'Dhofar Municipality Digital Design System'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-none">
                {isAr ? 'معرض المكونات الذكي' : 'Smart Component Matrix'}
              </h1>
              <p className="text-lg font-bold text-slate-400 max-w-2xl leading-relaxed">
                {isAr ? 'استكشف وانسخ أكثر من 40 مكوناً هندسياً مبنياً وفق أعلى معايير النفاذ الرقمي والهوية البصرية العمانية.' : 'Explore and copy 40+ engineered components built with Omani visual identity and accessibility standards.'}
              </p>
            </div>
            <div className="relative z-10 size-40 rounded-[3rem] bg-primary text-white flex items-center justify-center shadow-2xl rotate-6 group hover:rotate-0 transition-transform duration-500">
              <Palette size={70} className="group-hover:scale-110 transition-transform" />
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-5 pointer-events-none" />
          </div>
        </div>

        {/* The Component Gallery */}
        <IdentityShowcase 
          isAr={isAr} 
          onViewCode={(comp) => { setSelectedComponent(comp); setActiveTab('code'); }} 
          onViewCss={(comp) => { setSelectedComponent(comp); setActiveTab('css'); }} 
        />
      </main>

      {/* Code Viewer Modal */}
      <Dialog open={!!selectedComponent} onOpenChange={() => setSelectedComponent(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 rounded-[2.5rem] border-none shadow-2xl flex flex-col bg-slate-950">
          <DialogHeader className="p-8 bg-slate-900 border-b border-white/5">
             <div className="flex items-center justify-between">
                <div>
                   <DialogTitle className="text-white text-2xl font-black">{selectedComponent?.name}</DialogTitle>
                   <DialogDescription className="text-slate-400 font-bold mt-1">Source Code Explorer v4.0</DialogDescription>
                </div>
                <div className="flex gap-2">
                   <Button variant={activeTab === 'code' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('code')} className="rounded-xl gap-2 font-black"><Code2 size={16}/> Component</Button>
                   <Button variant={activeTab === 'css' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('css')} className="rounded-xl gap-2 font-black"><CSS3 size={16}/> CSS</Button>
                </div>
             </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
            {activeTab === 'code' ? (
              <Tabs defaultValue="react" className="w-full">
                <TabsList className="bg-white/5 border-none p-1 rounded-xl mb-6">
                  <TabsTrigger value="react" className="font-black gap-2">React (TSX)</TabsTrigger>
                  <TabsTrigger value="html" className="font-black gap-2">HTML / Tailwind</TabsTrigger>
                  <TabsTrigger value="dotnet" className="font-black gap-2">.NET / Structure</TabsTrigger>
                </TabsList>
                
                <TabsContent value="react" className="relative group">
                   <pre className="p-6 bg-black rounded-2xl text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeReact}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeReact)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-8 p-0">
                     {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                   </Button>
                </TabsContent>

                <TabsContent value="html" className="relative group">
                   <pre className="p-6 bg-black rounded-2xl text-blue-400 font-mono text-xs leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeHtml}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeHtml)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-8 p-0">
                     {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                   </Button>
                </TabsContent>

                <TabsContent value="dotnet" className="relative group">
                   <pre className="p-6 bg-black rounded-2xl text-purple-400 font-mono text-xs leading-relaxed overflow-x-auto">
                     <code>{selectedComponent?.codeDotNet}</code>
                   </pre>
                   <Button onClick={() => handleCopy(selectedComponent?.codeDotNet)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-8 p-0">
                     {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                   </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative group h-full">
                <pre className="p-6 bg-black rounded-2xl text-blue-300 font-mono text-xs leading-relaxed overflow-x-auto h-full">
                  <code>{selectedComponent?.codeCss || '/* No custom CSS required for this component. */'}</code>
                </pre>
                <Button onClick={() => handleCopy(selectedComponent?.codeCss)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg size-8 p-0">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
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
