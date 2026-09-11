
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Sparkles, Save, ArrowLeft, Upload, Type, Hash, Calendar, Layers, X } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceStep, FormField } from '@/lib/types';

export default function WorkflowEngine() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [flowTitle, setFlowTitle] = useState('');

  const addStep = () => {
    const newStep: ServiceStep = {
      id: `step_${Date.now()}`,
      titleAr: 'خطوة جديدة',
      titleEn: 'New Step',
      fields: []
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const addFieldToStep = (stepId: string, type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      labelAr: '',
      labelEn: '',
      required: true
    };
    setSteps(steps.map(s => s.id === stepId ? { ...s, fields: [...s.fields, newField] } : s));
  };

  const removeFieldFromStep = (stepId: string, fieldId: string) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s));
  };

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-3">
              <Sparkles className="text-accent" /> {isAr ? "محرك الخدمات (Workflow Engine)" : "Service Workflow Engine"}
            </h1>
            <p className="text-slate-400 font-bold mt-1">{isAr ? "صمم خطوات الخدمة والحقول التفاعلية" : "Design service steps and interactive fields"}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="rounded-full font-bold shadow-sm">
              <Link href="/admin"><ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة للوحة" : "Back to Admin"}</Link>
            </Button>
            <Button className="bg-slate-900 text-white rounded-full px-8 font-black shadow-lg">
              <Save size={16} className="ml-2" /> {isAr ? "حفظ المحرك" : "Save Workflow"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24 overflow-hidden border-none">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "أدوات التصميم" : "Design Tools"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <Button onClick={addStep} className="w-full justify-start gap-3 rounded-xl h-12 font-black dm-gradient-primary">
                <Layers size={18} /> {isAr ? "إضافة خطوة عمل" : "Add Step"}
              </Button>
              <div className="h-px bg-slate-100 my-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isAr ? "الحقول المتاحة للخطوات" : "Available Fields"}</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" onClick={() => {}} className="justify-start gap-2 h-10 text-xs font-bold border-2 rounded-xl border-dashed opacity-50 cursor-not-allowed"><Type size={14}/> Text</Button>
                <Button variant="outline" onClick={() => {}} className="justify-start gap-2 h-10 text-xs font-bold border-2 rounded-xl border-dashed opacity-50 cursor-not-allowed"><Upload size={14}/> Upload</Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-8">
            <Input 
              placeholder={isAr ? "اسم الخدمة الرقمية الكلي" : "Full Service Flow Name"} 
              className="h-16 text-2xl font-black border-2 rounded-2xl shadow-inner bg-white"
              value={flowTitle}
              onChange={(e) => setFlowTitle(e.target.value)}
            />

            {steps.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[3rem] p-32 text-center bg-white shadow-sm">
                <Sparkles size={80} className="mx-auto text-slate-100 mb-8" />
                <h3 className="text-2xl font-black text-slate-300 mb-2">{isAr ? "لا توجد خطوات عمل بعد" : "No workflow steps yet"}</h3>
                <p className="text-slate-200 font-bold">{isAr ? "ابدأ بإضافة أول خطوة عمل من القائمة الجانبية" : "Start by adding the first workflow step from the sidebar"}</p>
              </div>
            ) : (
              steps.map((step, sIdx) => (
                <Card key={step.id} className="rounded-[2.5rem] shadow-xl border-none overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="bg-slate-900 text-white p-6 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-slate-900 font-black text-lg">
                        {sIdx + 1}
                      </div>
                      <Input 
                        value={step.titleAr} 
                        onChange={e => {
                          const ns = [...steps];
                          ns[sIdx].titleAr = e.target.value;
                          setSteps(ns);
                        }}
                        className="bg-transparent border-none text-xl font-black focus-visible:ring-0 w-64"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40 hover:text-red-400">
                      <Trash2 size={20} />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6 bg-white">
                    <div className="flex flex-wrap gap-4 mb-6">
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'text')} className="rounded-full border-2 font-bold"><Type className="ml-2" size={14}/> {isAr ? "حقل نصي" : "Text"}</Button>
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="rounded-full border-2 font-bold"><Upload className="ml-2" size={14}/> {isAr ? "رفع ملفات" : "Upload"}</Button>
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'date')} className="rounded-full border-2 font-bold"><Calendar className="ml-2" size={14}/> {isAr ? "تاريخ" : "Date"}</Button>
                    </div>

                    <div className="space-y-4">
                      {step.fields.map((field, fIdx) => (
                        <div key={field.id} className="flex gap-4 p-4 border-2 rounded-2xl bg-slate-50 relative group">
                           <div className="flex-1 grid grid-cols-2 gap-4">
                              <Input placeholder="Label AR" value={field.labelAr} onChange={e => {
                                const ns = [...steps];
                                ns[sIdx].fields[fIdx].labelAr = e.target.value;
                                setSteps(ns);
                              }} className="bg-white" />
                              <Input placeholder="Label EN" value={field.labelEn} onChange={e => {
                                const ns = [...steps];
                                ns[sIdx].fields[fIdx].labelEn = e.target.value;
                                setSteps(ns);
                              }} className="bg-white" />
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => removeFieldFromStep(step.id, field.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                             <X size={16} />
                           </Button>
                        </div>
                      ))}
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
