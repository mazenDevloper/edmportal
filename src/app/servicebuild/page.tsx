
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Upload, Type, Calendar, Layers, X, 
  CreditCard, Settings, Loader2, GitBranch, ArrowRight,
  MoveUp, MoveDown
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceStep, FormField, Service, ServiceFlow, StepLogic } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CAT_CONFIG } from '@/lib/constants';

const ICON_LIST = ['FileText', 'ShieldCheck', 'Users', 'TrendingUp', 'Landmark', 'MapPin', 'CreditCard', 'Building2', 'Truck', 'Trash2', 'Wrench', 'Lightbulb'];

function WorkflowEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [serviceInfo, setServiceInfo] = useState({
    titleAr: '', titleEn: '', category: 'elec', iconName: 'FileText',
    fees: '0 OMR', descriptionAr: '', descriptionEn: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data) {
          const flow = data.serviceFlows?.find((f: ServiceFlow) => f.id === editId || f.serviceId === editId);
          const svc = data.services?.find((s: Service) => s.id === editId);
          if (flow) setSteps(flow.steps || []);
          if (svc) setServiceInfo({
            titleAr: svc.title || '', titleEn: svc.titleEn || '',
            category: svc.category || 'elec', iconName: svc.iconName || 'FileText',
            fees: svc.fees || '0 OMR', descriptionAr: svc.description || '',
            descriptionEn: svc.descriptionEn || ''
          });
        }
      }).finally(() => setLoading(false));
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

  const updateStep = (idx: number, updates: Partial<ServiceStep>) => {
    const ns = [...steps];
    ns[idx] = { ...ns[idx], ...updates };
    setSteps(ns);
  };

  const removeStep = (id: string) => setSteps(steps.filter(s => s.id !== id));

  const addFieldToStep = (stepId: string, type: FormField['type']) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, fields: [...s.fields, {
      id: `field_${Date.now()}`, type, labelAr: '', labelEn: '', required: true
    }] } : s));
  };

  const addLogic = (stepIdx: number) => {
    const ns = [...steps];
    const logic: StepLogic[] = ns[stepIdx].logic || [];
    ns[stepIdx].logic = [...logic, { fieldId: '', value: '', targetStepId: '' }];
    setSteps(ns);
  };

  const handleSave = async () => {
    if (!serviceInfo.titleAr) return toast({ variant: "destructive", title: "Required" });
    setSaving(true);
    try {
      const data = await fetchBin();
      const newId = editId || `svc_${Date.now()}`;
      
      const newService: Service = {
        id: newId, title: serviceInfo.titleAr, titleEn: serviceInfo.titleEn,
        description: serviceInfo.descriptionAr, descriptionEn: serviceInfo.descriptionEn,
        category: serviceInfo.category, iconName: serviceInfo.iconName, fees: serviceInfo.fees,
        isActive: true, reqsAr: steps.flatMap(s => s.fields.map(f => f.labelAr)),
        reqsEn: steps.flatMap(s => s.fields.map(f => f.labelEn)),
      };

      const newFlow: ServiceFlow = {
        id: newId, serviceId: newId, titleAr: serviceInfo.titleAr, titleEn: serviceInfo.titleEn,
        steps: steps, isActive: true
      };

      const filteredServices = (data.services || []).filter((s: any) => s.id !== newId);
      const filteredFlows = (data.serviceFlows || []).filter((f: any) => f.id !== newId);

      await updateBin({
        ...data,
        services: [...filteredServices, newService],
        serviceFlows: [...filteredFlows, newFlow]
      });

      toast({ title: "Workflow Saved" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <GitBranch className="text-accent" /> {isAr ? "محرك التدفقات المنطقي" : "Logic Workflow Engine"}
          </h1>
          <div className="flex gap-4">
             <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
               <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
             </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ التدفق" : "Save Flow"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="rounded-brand shadow-md h-fit border-none sticky top-24">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-xs font-black flex items-center gap-2">
                <Settings size={14} /> {isAr ? "خصائص الخدمة" : "Service Props"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان" : "Title"}</label>
                 <Input value={serviceInfo.titleAr} onChange={e => setServiceInfo({...serviceInfo, titleAr: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "الفئة" : "Category"}</label>
                 <Select value={serviceInfo.category} onValueChange={v => setServiceInfo({...serviceInfo, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CAT_CONFIG).map(cid => (
                        <SelectItem key={cid} value={cid}>{isAr ? CAT_CONFIG[cid as any].labelAr : CAT_CONFIG[cid as any].labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "الأيقونة" : "Icon"}</label>
                 <Select value={serviceInfo.iconName} onValueChange={v => setServiceInfo({...serviceInfo, iconName: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_LIST.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <Button onClick={addStep} className="w-full dm-gradient-primary rounded-xl font-black mt-4"><Plus size={18} className="ml-2"/> {isAr ? "إضافة مرحلة" : "Add Step"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            {steps.map((step, sIdx) => (
              <Card key={step.id} className="rounded-3xl shadow-sm border-none overflow-hidden relative">
                <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-6 rounded-lg bg-accent text-slate-900 flex items-center justify-center font-black text-xs">{sIdx + 1}</div>
                    <Input className="bg-white/10 border-none text-white h-7 text-sm font-bold w-48" value={step.titleAr} onChange={e => updateStep(sIdx, { titleAr: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40 h-8 w-8"><Trash2 size={16} /></Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4 border-r pr-8">
                       <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">{isAr ? "الحقول" : "Form Fields"}</h4>
                       <div className="flex gap-2 mb-4">
                         <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'text')} className="h-7 text-[9px] px-2"><Type size={12}/> {isAr ? "نص" : "Text"}</Button>
                         <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="h-7 text-[9px] px-2"><Upload size={12}/> {isAr ? "رفع" : "Upload"}</Button>
                         <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'date')} className="h-7 text-[9px] px-2"><Calendar size={12}/> {isAr ? "تاريخ" : "Date"}</Button>
                       </div>
                       {step.fields.map((f, fIdx) => (
                         <div key={f.id} className="flex gap-2 items-center">
                            <Input placeholder="Field Label AR" value={f.labelAr} onChange={e => {
                              const nf = [...step.fields]; nf[fIdx].labelAr = e.target.value; updateStep(sIdx, { fields: nf });
                            }} className="h-8 text-xs font-bold" />
                            <Button variant="ghost" size="icon" onClick={() => {
                              const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, { fields: nf });
                            }} className="text-red-400 h-8 w-8"><X size={14}/></Button>
                         </div>
                       ))}
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-accent tracking-widest">{isAr ? "منطق الانتقال" : "Next Step Logic"}</h4>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400">{isAr ? "الخطوة الافتراضية" : "Default Next"}</span>
                             <Select value={step.defaultNextStepId || ''} onValueChange={v => updateStep(sIdx, { defaultNextStepId: v })}>
                                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{s.titleAr}</SelectItem>)}
                                </SelectContent>
                             </Select>
                           </div>
                           
                           {(step.logic || []).map((rule, rIdx) => (
                             <div key={rIdx} className="bg-slate-50 p-3 rounded-xl space-y-2 border relative group">
                                <div className="flex items-center justify-between text-[9px] font-black text-primary">
                                  <span>IF FIELD VALUE IS:</span>
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    const nl = [...step.logic!]; nl.splice(rIdx, 1); updateStep(sIdx, { logic: nl });
                                  }} className="h-4 w-4 text-red-400"><X size={10}/></Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input placeholder="Value" value={rule.value} onChange={e => {
                                    const nl = [...step.logic!]; nl[rIdx].value = e.target.value; updateStep(sIdx, { logic: nl });
                                  }} className="h-7 text-[10px]" />
                                  <Select value={rule.targetStepId} onValueChange={v => {
                                    const nl = [...step.logic!]; nl[rIdx].targetStepId = v; updateStep(sIdx, { logic: nl });
                                  }}>
                                    <SelectTrigger className="h-7"><SelectValue placeholder="Go to..." /></SelectTrigger>
                                    <SelectContent>
                                      {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{s.titleAr}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                             </div>
                           ))}
                           <Button variant="ghost" size="xs" onClick={() => addLogic(sIdx)} className="text-[9px] font-black text-accent">+ {isAr ? "إضافة شرط منطقي" : "Add Condition"}</Button>
                        </div>
                     </div>
                   </div>
                   <div className="mt-6 pt-4 border-t flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "نوع الإجراء" : "Action Type"}</span>
                     <Select value={step.actionType} onValueChange={v => updateStep(sIdx, { actionType: v as any })}>
                        <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="submit">{isAr ? "إرسال الطلب" : "Submit Request"}</SelectItem>
                           <SelectItem value="payment">{isAr ? "الدفع الإلكتروني" : "E-Payment"}</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                </CardContent>
                {sIdx < steps.length - 1 && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-white border rounded-full p-1 shadow-sm"><ArrowRight className="rotate-90 size-4 text-slate-300" /></div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}

export default function WorkflowEngine() {
  return (
    <Suspense fallback={<Loader2 className="animate-spin" />}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
