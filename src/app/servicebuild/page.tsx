
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Save, ArrowLeft, Upload, Type, Hash, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';

export default function ServiceFlowBuilder() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [fields, setFields] = useState<any[]>([]);
  const [flowTitle, setFlowTitle] = useState('');

  const addField = (type: string) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      labelAr: '',
      labelEn: '',
      required: true
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-3">
              <Sparkles className="text-accent" /> {isAr ? "محرك الخدمات الرقمية" : "Service Engine"}
            </h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="rounded-full font-bold shadow-sm">
              <Link href="/admin"><ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة للوحة" : "Back to Admin"}</Link>
            </Button>
            <Button className="bg-slate-900 text-white rounded-full px-8 font-black shadow-lg">
              <Save size={16} className="ml-2" /> {isAr ? "حفظ التدفق" : "Save Flow"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24">
            <CardHeader className="bg-primary text-white rounded-t-brand">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "إضافة حقل إدخال" : "Add Input Field"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addField('text')} className="justify-start gap-2 font-bold"><Type size={14}/> {isAr ? "حقل نصي" : "Text Input"}</Button>
              <Button variant="outline" onClick={() => addField('number')} className="justify-start gap-2 font-bold"><Hash size={14}/> {isAr ? "حقل أرقام" : "Number Input"}</Button>
              <Button variant="outline" onClick={() => addField('upload')} className="justify-start gap-2 font-bold"><Upload size={14}/> {isAr ? "رفع ملفات" : "File Upload"}</Button>
              <Button variant="outline" onClick={() => addField('date')} className="justify-start gap-2 font-bold"><Calendar size={14}/> {isAr ? "تاريخ" : "Date Picker"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Input 
              placeholder={isAr ? "اسم الخدمة الرقمية (مثلاً: رخصة بناء)" : "Service Flow Name (e.g. Building Permit)"} 
              className="h-14 text-xl font-black border-2 rounded-xl shadow-inner bg-white"
              value={flowTitle}
              onChange={(e) => setFlowTitle(e.target.value)}
            />

            {fields.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[2rem] p-20 text-center bg-white">
                <Sparkles size={64} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-black text-lg">{isAr ? "لم تصمم التدفق بعد" : "No flow designed yet"}</p>
                <p className="text-slate-300 font-bold">{isAr ? "اختر الحقول من القائمة الجانبية لبناء تجربة الخدمة" : "Select fields from sidebar to build experience"}</p>
              </div>
            ) : (
              fields.map((field, idx) => (
                <Card key={field.id} className="rounded-brand shadow-sm border-r-4 border-accent overflow-hidden group animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-center p-3 bg-accent/5 border-b">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">
                      {isAr ? `الحقل ${idx+1}: ${field.type}` : `Field ${idx+1}: ${field.type}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="size-8 text-red-400">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "التسمية بالعربية" : "Label AR"}</label>
                      <Input placeholder="أدخل التسمية..." value={field.labelAr} onChange={(e) => updateField(field.id, { labelAr: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "التسمية بالإنجليزية" : "Label EN"}</label>
                      <Input placeholder="Enter label..." value={field.labelEn} onChange={(e) => updateField(field.id, { labelEn: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2 col-span-full">
                      <label className="text-xs font-bold">{isAr ? "حقل إلزامي" : "Required"}</label>
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="size-4 accent-accent" />
                    </div>
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
