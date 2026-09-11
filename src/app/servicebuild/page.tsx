
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Sparkles, Save, ArrowLeft, 
  Upload, Type, Hash, Calendar, Layers, X, 
  CreditCard, Send, Settings, Loader2 
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceStep, FormField, Service, ServiceFlow } from '@/lib/types';
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
          
          if (flow) setSteps(flow.steps || []);
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
        console.error("Load error:", err);
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
    if (!serviceInfo.titleAr) {
        toast({ variant: "destructive", title: "Required", description: "Title missing" });
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

      toast({ title: "Saved" });
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
            <Layers className="text-accent" /> {isAr ? "محرك الخدمات" : "Service Engine"}
          </h1>
          <div className="flex gap-4">
             <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
               <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
             </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="rounded-brand shadow-md h-fit border-none">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Settings size={16} /> {isAr ? "إعدادات الخدمة" : "Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <Input placeholder="Title AR" value={serviceInfo.titleAr} onChange={e => setServiceInfo({...serviceInfo, titleAr: e.target.value})} />
               <Input placeholder="Title EN" value={serviceInfo.titleEn} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} />
               <Select value={serviceInfo.category} onValueChange={v => setServiceInfo({...serviceInfo, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CAT_CONFIG).map(cid => (
                      <SelectItem key={cid} value={cid}>{isAr ? CAT_CONFIG[cid as any].labelAr : CAT_CONFIG[cid as any].labelEn}</SelectItem>
                    ))}
                  </SelectContent>
               </Select>
               <Select value={serviceInfo.iconName} onValueChange={v => setServiceInfo({...serviceInfo, iconName: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_LIST.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                  </SelectContent>
               </Select>
               <Input placeholder="Fees (e.g. 50 OMR)" value={serviceInfo.fees} onChange={e => setServiceInfo({...serviceInfo, fees: e.target.value})} />
               <Button onClick={addStep} className="w-full dm-gradient-primary rounded-xl font-black mt-4"><Layers size={18} className="ml-2"/> {isAr ? "إضافة خطوة" : "Add Step"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            {steps.map((step, sIdx) => (
              <Card key={step.id} className="rounded-[2rem] shadow-sm border-none overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-accent text-slate-900 flex items-center justify-center font-black">{sIdx + 1}</div>
                    <Input className="bg-white/10 border-none text-white h-8" value={step.titleAr} onChange={e => { const ns = [...steps]; ns[sIdx].titleAr = e.target.value; setSteps(ns); }} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40"><Trash2 size={20} /></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="flex gap-2 mb-4 border-b pb-4">
                     <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'text')} className="gap-2"><Type size={14}/> {isAr ? "نص" : "Text"}</Button>
                     <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="gap-2"><Upload size={14}/> {isAr ? "رفع" : "Upload"}</Button>
                     <Button size="sm" variant="outline" onClick={() => addFieldToStep(step.id, 'date')} className="gap-2"><Calendar size={14}/> {isAr ? "تاريخ" : "Date"}</Button>
                     <div className="ml-auto flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase text-slate-400">{isAr ? "نوع الإجراء" : "Action"}</span>
                       <Select value={step.actionType || 'submit'} onValueChange={v => { const ns = [...steps]; ns[sIdx].actionType = v as any; setSteps(ns); }}>
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submit">{isAr ? "إرسال" : "Submit"}</SelectItem>
                            <SelectItem value="payment">{isAr ? "دفع" : "Payment"}</SelectItem>
                          </SelectContent>
                       </Select>
                     </div>
                   </div>
                   {step.fields.map((f, fIdx) => (
                     <div key={f.id} className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl relative group border">
                        <Input placeholder="Label AR" value={f.labelAr} onChange={e => { const ns = [...steps]; ns[sIdx].fields[fIdx].labelAr = e.target.value; setSteps(ns); }} />
                        <Input placeholder="Label EN" value={f.labelEn} onChange={e => { const ns = [...steps]; ns[sIdx].fields[fIdx].labelEn = e.target.value; setSteps(ns); }} />
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 h-6 w-6" onClick={() => {
                           const ns = [...steps]; ns[sIdx].fields.splice(fIdx, 1); setSteps(ns);
                        }}><X size={12}/></Button>
                     </div>
                   ))}
                </CardContent>
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
