
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Sparkles, Save, ArrowLeft, Upload, Type, Hash, Calendar, Layers, X, CreditCard, Send, CheckCircle2, Settings, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceStep, FormField, Service, ServiceFlow } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CAT_CONFIG } from '@/lib/constants';

export default function WorkflowEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [serviceInfo, setServiceInfo] = useState({
    title: '',
    category: 'elec',
    iconName: 'FileText',
    fees: '0 OMR',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      fetchBin().then(data => {
        if (data) {
          const flow = data.serviceFlows?.find((f: ServiceFlow) => f.id === editId || f.serviceId === editId);
          const svc = data.services?.find((s: Service) => s.id === editId);
          if (flow) setSteps(flow.steps || []);
          if (svc) setServiceInfo({
            title: svc.title || '',
            category: svc.category || 'elec',
            iconName: svc.iconName || 'FileText',
            fees: svc.fees || '0 OMR',
            description: svc.description || ''
          });
        }
      });
    }
  }, [editId]);

  const addStep = () => {
    const newStep: ServiceStep = {
      id: `step_${Date.now()}`,
      titleAr: isAr ? 'خطوة جديدة' : 'New Step',
      titleEn: 'New Step',
      fields: [],
      actionType: 'submit'
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

  const handleSave = async () => {
    if (!serviceInfo.title) {
        toast({ variant: "destructive", title: isAr ? "مطلوب" : "Required", description: isAr ? "يرجى إدخال اسم الخدمة" : "Please enter service title" });
        return;
    }
    setSaving(true);
    try {
      const data = await fetchBin();
      const newId = editId || `svc_${Date.now()}`;
      
      const newService: Service = {
        id: newId,
        title: serviceInfo.title,
        titleEn: serviceInfo.title,
        description: serviceInfo.description,
        descriptionEn: serviceInfo.description,
        category: serviceInfo.category,
        iconName: serviceInfo.iconName,
        fees: serviceInfo.fees,
        isActive: true,
        reqsAr: steps.flatMap(s => s.fields.map(f => f.labelAr)),
        reqsEn: steps.flatMap(s => s.fields.map(f => f.labelEn)),
      };

      const newFlow: ServiceFlow = {
        id: newId,
        serviceId: newId,
        titleAr: serviceInfo.title,
        titleEn: serviceInfo.title,
        steps: steps,
        isActive: true
      };

      const filteredServices = (data.services || []).filter((s: any) => s.id !== newId);
      const filteredFlows = (data.serviceFlows || []).filter((f: any) => f.id !== newId);

      await updateBin({
        ...data,
        services: [...filteredServices, newService],
        serviceFlows: [...filteredFlows, newFlow]
      });

      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم تحديث محرك الخدمة بنجاح" : "Service engine updated successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save workflow." });
    } finally {
      setSaving(false);
    }
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
          </div>
          <div className="flex gap-4">
             <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
               <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
             </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ المحرك" : "Save Workflow"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24 overflow-hidden border-none">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Settings size={16} /> {isAr ? "إعدادات الخدمة" : "Service Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الاسم" : "Title"}</label>
                 <Input value={serviceInfo.title} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الفئة" : "Category"}</label>
                 <Select value={serviceInfo.category} onValueChange={v => setServiceInfo({...serviceInfo, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CAT_CONFIG).map(cid => (
                        <SelectItem key={cid} value={cid}>{CAT_CONFIG[cid as any].labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الرسوم" : "Fees"}</label>
                 <Input value={serviceInfo.fees} onChange={e => setServiceInfo({...serviceInfo, fees: e.target.value})} />
               </div>
               <Button onClick={addStep} className="w-full justify-start gap-3 rounded-xl h-12 font-black dm-gradient-primary mt-4">
                 <Layers size={18} /> {isAr ? "إضافة خطوة" : "Add Step"}
               </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-8">
            {steps.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[3rem] p-32 text-center bg-white shadow-sm">
                <Sparkles size={80} className="mx-auto text-slate-100 mb-8" />
                <h3 className="text-2xl font-black text-slate-300 mb-2">{isAr ? "ابدأ التصميم" : "Start Designing"}</h3>
                <p className="text-slate-200 font-bold">{isAr ? "أضف خطوات العمل من القائمة الجانبية" : "Add workflow steps from the sidebar"}</p>
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
                    <div className="flex items-center gap-2">
                       <Select value={step.actionType} onValueChange={v => {
                         const ns = [...steps];
                         ns[sIdx].actionType = v as any;
                         setSteps(ns);
                       }}>
                         <SelectTrigger className="w-32 bg-white/10 border-none text-white text-xs h-8"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="submit">Submit</SelectItem>
                           <SelectItem value="payment">E-Payment</SelectItem>
                         </SelectContent>
                       </Select>
                       <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40 hover:text-red-400">
                         <Trash2 size={20} />
                       </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6 bg-white">
                    <div className="flex flex-wrap gap-4 mb-6">
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'text')} className="rounded-full border-2 font-bold"><Type className="ml-2" size={14}/> {isAr ? "نص" : "Text"}</Button>
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="rounded-full border-2 font-bold"><Upload className="ml-2" size={14}/> {isAr ? "ملف" : "Upload"}</Button>
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
                           <Button variant="ghost" size="icon" onClick={() => setSteps(steps.map(s => s.id === step.id ? { ...s, fields: s.fields.filter(f => f.id !== field.id) } : s))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
