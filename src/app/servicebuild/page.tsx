
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Sparkles, Save, ArrowLeft, Upload, Type, Hash, Calendar, Layers, X, CreditCard, Send, Settings, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceStep, FormField, Service, ServiceFlow } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CAT_CONFIG } from '@/lib/constants';

// List of available icons for selection
const ICON_LIST = ['FileText', 'ShieldCheck', 'Users', 'TrendingUp', 'Landmark', 'MapPin', 'CreditCard', 'Building2', 'Truck', 'Trash2', 'Wrench', 'Lightbulb'];

export default function WorkflowEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [serviceInfo, setServiceInfo] = useState({
    titleAr: '',
    titleEn: '',
    category: 'elec',
    iconName: 'FileText',
    fees: '0 OMR',
    descriptionAr: '',
    descriptionEn: ''
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
          
          if (flow) {
            setSteps(flow.steps || []);
          }
          
          if (svc) {
            setServiceInfo({
              titleAr: svc.title || '',
              titleEn: svc.titleEn || svc.title || '',
              category: svc.category || 'elec',
              iconName: svc.iconName || 'FileText',
              fees: svc.fees || '0 OMR',
              descriptionAr: svc.description || '',
              descriptionEn: svc.descriptionEn || svc.description || ''
            });
          }
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
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
    if (!serviceInfo.titleAr && !serviceInfo.titleEn) {
        toast({ variant: "destructive", title: isAr ? "مطلوب" : "Required", description: isAr ? "يرجى إدخال اسم الخدمة" : "Please enter service title" });
        return;
    }
    setSaving(true);
    try {
      const data = await fetchBin();
      const newId = editId || `svc_${Date.now()}`;
      
      const newService: Service = {
        id: newId,
        title: serviceInfo.titleAr,
        titleEn: serviceInfo.titleEn,
        description: serviceInfo.descriptionAr,
        descriptionEn: serviceInfo.descriptionEn,
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
        titleAr: serviceInfo.titleAr,
        titleEn: serviceInfo.titleEn,
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

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
                < LucideIcons.Settings size={16} /> {isAr ? "إعدادات الخدمة" : "Service Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الاسم (عربي)" : "Title (AR)"}</label>
                 <Input value={serviceInfo.titleAr} onChange={e => setServiceInfo({...serviceInfo, titleAr: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الاسم (إنجليزي)" : "Title (EN)"}</label>
                 <Input value={serviceInfo.titleEn} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الفئة" : "Category"}</label>
                 <Select value={serviceInfo.category} onValueChange={v => setServiceInfo({...serviceInfo, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CAT_CONFIG).map(cid => (
                        <SelectItem key={cid} value={cid}>{isAr ? CAT_CONFIG[cid as any].labelAr : CAT_CONFIG[cid as any].labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الأيقونة" : "Icon"}</label>
                 <Select value={serviceInfo.iconName} onValueChange={v => setServiceInfo({...serviceInfo, iconName: v})}>
                    <SelectTrigger className="flex items-center gap-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_LIST.map(icon => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            {React.createElement((LucideIcons as any)[icon] || LucideIcons.FileText, { size: 14 })}
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
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
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-slate-900 font-black text-lg shrink-0">
                        {sIdx + 1}
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Input 
                          placeholder="Step Name AR"
                          value={step.titleAr} 
                          onChange={e => {
                            const ns = [...steps];
                            ns[sIdx].titleAr = e.target.value;
                            setSteps(ns);
                          }}
                          className="bg-white/10 border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-accent"
                        />
                        <Input 
                          placeholder="Step Name EN"
                          value={step.titleEn} 
                          onChange={e => {
                            const ns = [...steps];
                            ns[sIdx].titleEn = e.target.value;
                            setSteps(ns);
                          }}
                          className="bg-white/10 border-none text-white font-bold focus-visible:ring-1 focus-visible:ring-accent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                       <Select value={step.actionType} onValueChange={v => {
                         const ns = [...steps];
                         ns[sIdx].actionType = v as any;
                         setSteps(ns);
                       }}>
                         <SelectTrigger className="w-32 bg-white/10 border-none text-white text-[10px] font-black h-8"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="submit">Standard Submit</SelectItem>
                           <SelectItem value="payment">E-Payment (Submit)</SelectItem>
                         </SelectContent>
                       </Select>
                       <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40 hover:text-red-400">
                         <Trash2 size={20} />
                       </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6 bg-white">
                    <div className="flex flex-wrap gap-4 mb-6 border-b pb-4">
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'text')} className="rounded-full border-2 font-bold"><Type className="ml-2" size={14}/> {isAr ? "نص" : "Text"}</Button>
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'number')} className="rounded-full border-2 font-bold"><Hash className="ml-2" size={14}/> {isAr ? "رقم" : "Number"}</Button>
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="rounded-full border-2 font-bold"><Upload className="ml-2" size={14}/> {isAr ? "ملف" : "Upload"}</Button>
                       <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'date')} className="rounded-full border-2 font-bold"><Calendar className="ml-2" size={14}/> {isAr ? "تاريخ" : "Date"}</Button>
                    </div>
                    <div className="space-y-4">
                      {step.fields.map((field, fIdx) => (
                        <div key={field.id} className="flex gap-4 p-5 border-2 rounded-2xl bg-slate-50 relative group border-slate-100 hover:border-primary/20 transition-colors">
                           <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان بالعربي" : "Label AR"}</label>
                                <Input value={field.labelAr} onChange={e => {
                                  const ns = [...steps];
                                  ns[sIdx].fields[fIdx].labelAr = e.target.value;
                                  setSteps(ns);
                                }} className="bg-white font-bold" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان بالإنجليزي" : "Label EN"}</label>
                                <Input value={field.labelEn} onChange={e => {
                                  const ns = [...steps];
                                  ns[sIdx].fields[fIdx].labelEn = e.target.value;
                                  setSteps(ns);
                                }} className="bg-white font-bold" />
                              </div>
                           </div>
                           <div className="flex flex-col items-center justify-center gap-2">
                             <Badge variant="outline" className="text-[9px] uppercase font-black bg-white">{field.type}</Badge>
                             <Button variant="ghost" size="icon" onClick={() => setSteps(steps.map(s => s.id === step.id ? { ...s, fields: s.fields.filter(f => f.id !== field.id) } : s))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                               <X size={16} />
                             </Button>
                           </div>
                        </div>
                      ))}
                      {step.fields.length === 0 && (
                        <p className="text-center text-slate-300 font-bold py-4 italic">{isAr ? "لم يتم إضافة حقول لهذه الخطوة بعد" : "No fields added to this step yet"}</p>
                      )}
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
