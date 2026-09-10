
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Layout, Save, ArrowLeft, Image as ImageIcon, Type, TrendingUp, Info } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';

export default function PageBuilder() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [components, setComponents] = useState<any[]>([]);
  const [pageTitle, setPageTitle] = useState('');

  const addComponent = (type: string) => {
    const newComp = {
      id: `comp_${Date.now()}`,
      type,
      content: type === 'hero' ? { title: 'New Hero', subtitle: 'Subtitle' } : 
               type === 'text' ? { body: 'Sample text content' } : {}
    };
    setComponents([...components, newComp]);
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-3">
              <Layout className="text-accent" /> {isAr ? "باني الصفحات" : "Page Builder"}
            </h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="rounded-full font-bold">
              <Link href="/admin"><ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة للوحة" : "Back to Admin"}</Link>
            </Button>
            <Button className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              <Save size={16} className="ml-2" /> {isAr ? "حفظ الصفحة" : "Save Page"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24">
            <CardHeader className="bg-slate-900 text-white rounded-t-brand">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "إضافة مكون" : "Add Component"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addComponent('hero')} className="justify-start gap-2 font-bold"><ImageIcon size={14}/> {isAr ? "قسم البطل" : "Hero Section"}</Button>
              <Button variant="outline" onClick={() => addComponent('text')} className="justify-start gap-2 font-bold"><Type size={14}/> {isAr ? "محتوى نصي" : "Text Block"}</Button>
              <Button variant="outline" onClick={() => addComponent('stats')} className="justify-start gap-2 font-bold"><TrendingUp size={14}/> {isAr ? "إحصائيات" : "Statistics"}</Button>
              <Button variant="outline" onClick={() => addComponent('info')} className="justify-start gap-2 font-bold"><Info size={14}/> {isAr ? "معلومات" : "Info Card"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Input 
              placeholder={isAr ? "عنوان الصفحة (مثلاً: مرافقنا)" : "Page Title (e.g. Our Facilities)"} 
              className="h-14 text-xl font-black border-2 rounded-xl"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
            />

            {components.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[2rem] p-20 text-center">
                <Layout size={64} className="mx-auto text-slate-200 mb-6" />
                <p className="text-slate-400 font-bold text-lg">{isAr ? "لم تقم بإضافة أي مكونات بعد" : "No components added yet"}</p>
                <p className="text-slate-300 text-sm">{isAr ? "ابدأ بالضغط على خيارات الإضافة من القائمة الجانبية" : "Start by clicking add from the sidebar"}</p>
              </div>
            ) : (
              components.map((c, i) => (
                <Card key={c.id} className="rounded-brand shadow-sm border-l-4 border-primary overflow-hidden group">
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-b">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {isAr ? `مكون رقم ${i+1}: ${c.type}` : `Component ${i+1}: ${c.type}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeComponent(c.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    {c.type === 'hero' ? (
                      <div className="space-y-4">
                        <Input placeholder="Hero Title" defaultValue={c.content.title} className="font-bold" />
                        <Input placeholder="Hero Subtitle" defaultValue={c.content.subtitle} />
                      </div>
                    ) : (
                      <Textarea placeholder="Content..." defaultValue={c.content.body} className="min-h-[100px]" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
      <PortalFooter siteConfig={null} />
    </div>
  );
}
