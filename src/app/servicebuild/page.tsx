'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Upload, Type, Calendar, Layers, X, 
  CreditCard, Settings, Loader2, GitBranch, ArrowRight,
  MoveUp, MoveDown, Search, Link as LinkIcon, Eye, Network,
  Maximize, LayoutGrid, Edit2, ListChecks, ImageIcon, FileText, 
  ShieldCheck, Users, TrendingUp, Landmark, MapPin, Building2, 
  Truck, Wrench, Lightbulb, Hexagon, List, Map, MousePointer2,
  CheckSquare, RefreshCw
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceStep, FormField, Service, ServiceFlow, StepLogic } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';

// React Flow Imports
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ICON_LIST = {
  'FileText': FileText,
  'ShieldCheck': ShieldCheck,
  'Users': Users,
  'TrendingUp': TrendingUp,
  'Landmark': Landmark,
  'MapPin': MapPin,
  'CreditCard': CreditCard,
  'Building2': Building2,
  'Truck': Truck,
  'Trash2': Trash2,
  'Wrench': Wrench,
  'Lightbulb': Lightbulb
};

// Internal Flow Controls Component
const FlowControls = ({ onAdd, onSave, saving, isAr }: { onAdd: () => void, onSave: () => void, saving: boolean, isAr: boolean }) => {
  const { fitView } = useReactFlow();
  
  return (
    <Panel position="top-right" className="flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl border shadow-xl">
      <Button size="sm" variant="outline" onClick={onAdd} className="rounded-xl font-black gap-2 h-9 px-4 border-primary text-primary hover:bg-primary/5">
        <Plus size={14}/> {isAr ? "إضافة مرحلة" : "Add Step"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => fitView({ padding: 0.2, duration: 800 })} className="rounded-xl font-black gap-2 h-9 px-4">
        <Maximize size={14}/> {isAr ? "ملائمة" : "Fit View"}
      </Button>
      <Button size="sm" onClick={onSave} disabled={saving} className="dm-gradient-primary rounded-xl font-black gap-2 h-9 px-6 shadow-md">
        {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
        {isAr ? "حفظ" : "Save"}
      </Button>
    </Panel>
  );
};

function WorkflowEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [activeTab, setActiveTab] = useState('logic');
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [serviceInfo, setServiceInfo] = useState<Partial<Service>>({
    title: '', titleEn: '', category: 'elec', iconName: 'FileText',
    fees: '0 OMR', description: '', descriptionEn: '', type: 'workflow', linkUrl: '',
    reqsAr: [], reqsEn: [], customIconUrl: '', isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const data = await fetchBin();
      if (data) {
        const foundSvc = data.services?.find((s: Service) => s.id === editId);
        const foundFlow = data.serviceFlows?.find((f: ServiceFlow) => f.id === editId || f.serviceId === editId);
        
        if (foundSvc) {
          setServiceInfo({
            ...foundSvc,
            title: foundSvc.title || '',
            titleEn: foundSvc.titleEn || '',
            description: foundSvc.description || '',
            descriptionEn: foundSvc.descriptionEn || '',
            linkUrl: foundSvc.linkUrl || '',
            customIconUrl: foundSvc.customIconUrl || '',
            reqsAr: foundSvc.reqsAr || [],
            reqsEn: foundSvc.reqsEn || [],
            category: foundSvc.category || 'elec',
            iconName: foundSvc.iconName || 'FileText'
          });
        }
        
        if (foundFlow) {
          setSteps(foundFlow.steps || []);
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Load Error", description: "Failed to fetch service data." });
    } finally {
      setLoading(false);
    }
  }, [editId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addStep = useCallback(() => {
    const newStep: ServiceStep = {
      id: `step_${Date.now()}`,
      titleAr: isAr ? 'خطوة جديدة' : 'New Step',
      titleEn: 'New Step',
      fields: [],
      actionType: 'submit',
      position: { x: 250, y: steps.length * 150 },
      logic: []
    };
    setSteps(prev => [...prev, newStep]);
  }, [isAr, steps.length]);

  const updateStep = (idx: number, updates: Partial<ServiceStep>) => {
    setSteps(prev => {
      const ns = [...prev];
      ns[idx] = { ...ns[idx], ...updates };
      return ns;
    });
  };

  const removeStep = (id: string) => {
    setSteps(prev => {
      return prev
        .filter(s => s.id !== id)
        .map(s => ({
          ...s,
          defaultNextStepId: s.defaultNextStepId === id ? '' : s.defaultNextStepId,
          logic: (s.logic || []).filter(l => l.targetStepId !== id)
        }));
    });
  };

  const addFieldToStep = (stepId: string, type: FormField['type']) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, fields: [...(s.fields || []), {
      id: `field_${Date.now()}`, type, labelAr: '', labelEn: '', required: true, options: []
    }] } : s));
  };

  const addLogic = (stepIdx: number) => {
    setSteps(prev => {
      const ns = [...prev];
      const logic: StepLogic[] = ns[stepIdx].logic || [];
      ns[stepIdx].logic = [...logic, { fieldId: '', value: '', targetStepId: '' }];
      return ns;
    });
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setSteps((prevSteps) => {
        const nextSteps = [...prevSteps];
        changes.forEach((change) => {
          if (change.type === 'position' && change.position) {
            const index = nextSteps.findIndex((s) => s.id === change.id);
            if (index !== -1) {
              nextSteps[index] = { ...nextSteps[index], position: change.position };
            }
          }
        });
        return nextSteps;
      });
    },
    []
  );

  const handleSave = async () => {
    if (!serviceInfo.title) return toast({ variant: "destructive", title: isAr ? "العنوان مطلوب" : "Title Required" });
    setSaving(true);
    try {
      const data = await fetchBin();
      const newId = editId || `svc_${Date.now()}`;
      
      const newService: Service = {
        ...serviceInfo as Service,
        id: newId,
        isActive: serviceInfo.isActive ?? true,
      };

      const newFlow: ServiceFlow = {
        id: newId, serviceId: newId, titleAr: serviceInfo.title || '', titleEn: serviceInfo.titleEn || '',
        steps: steps, isActive: true
      };

      const filteredServices = (data.services || []).filter((s: any) => s.id !== newId);
      const filteredFlows = (data.serviceFlows || []).filter((f: any) => f.id !== newId);

      await updateBin({
        ...data,
        services: [...filteredServices, newService],
        serviceFlows: [...filteredFlows, newFlow]
      });

      toast({ title: isAr ? "تم حفظ الخدمة والتدفق" : "Service & Flow Saved" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  const nodes = useMemo(() => {
    return steps.map((step, idx) => {
      const hasLogic = step.logic && step.logic.length > 0;
      return {
        id: step.id,
        type: 'default',
        data: { 
          label: (
            <div className="flex flex-col gap-2 pointer-events-auto">
              <div className="flex items-center justify-center gap-2">
                {hasLogic && <GitBranch size={10} className="text-secondary" />}
                <span className="text-[10px] font-black">{isAr ? step.titleAr : step.titleEn}</span>
              </div>
              <div className="flex justify-center gap-1">
                <Button size="xs" variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); setActiveTab('logic'); setTimeout(() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }), 100); }}>
                  <Edit2 size={10} />
                </Button>
                <Button size="xs" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}>
                  <Trash2 size={10} />
                </Button>
              </div>
            </div>
          )
        },
        position: step.position || { x: 250, y: idx * 180 },
        className: cn('group transition-shadow hover:shadow-lg', hasLogic ? 'border-secondary' : 'border-primary'),
        style: { 
          background: '#fff', 
          color: hasLogic ? '#470D67' : '#007375', 
          border: `2px solid ${hasLogic ? '#470D67' : '#007375'}`, 
          borderRadius: hasLogic ? '4px' : '12px', 
          padding: '10px', 
          width: 160,
          textAlign: 'center',
          fontSize: '10px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }
      };
    });
  }, [steps, isAr]);

  const edges = useMemo(() => {
    const e: Edge[] = [];
    const stepIds = new Set(steps.map(s => s.id));

    steps.forEach(step => {
      if (step.defaultNextStepId && step.defaultNextStepId !== 'none' && stepIds.has(step.defaultNextStepId)) {
        e.push({
          id: `e-${step.id}-${step.defaultNextStepId}`,
          source: step.id,
          target: step.defaultNextStepId,
          label: isAr ? 'المسار الافتراضي' : 'Default Path',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#007375' },
          style: { stroke: '#007375', strokeWidth: 2, opacity: 0.5 },
          type: 'smoothstep'
        });
      }

      step.logic?.forEach((rule, idx) => {
        if (rule.targetStepId && rule.targetStepId !== 'none' && stepIds.has(rule.targetStepId)) {
          e.push({
            id: `e-logic-${step.id}-${rule.targetStepId}-${idx}`,
            source: step.id,
            target: rule.targetStepId,
            label: `${isAr ? 'في حال: ' : 'If: '}${rule.value || '...'}`,
            animated: true,
            labelStyle: { fill: '#470D67', fontWeight: 900, fontSize: '9px' },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: '#fff', fillOpacity: 0.9, stroke: '#470D67', strokeWidth: 1 },
            style: { stroke: '#470D67', strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#470D67' },
            type: 'smoothstep'
          });
        }
      });
    });
    return e;
  }, [steps, isAr]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <GitBranch className="text-accent" /> {isAr ? "محرك التدفقات والعمليات" : "Process & Logic Engine"}
          </h1>
          <div className="flex flex-wrap gap-4">
             <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
               <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
             </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-brand shadow-md border-none sticky top-24 overflow-hidden">
              <CardHeader className="bg-primary text-white">
                <CardTitle className="text-xs font-black flex items-center justify-between">
                  <div className="flex items-center gap-2"><Settings size={14} /> {isAr ? "خصائص الخدمة" : "Service Identity"}</div>
                  <Button size="icon" variant="ghost" onClick={loadData} className="h-6 w-6 text-white/50 hover:text-white"><RefreshCw size={12}/></Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "نوع التنفيذ" : "Execution Type"}</label>
                   <Select value={serviceInfo.type || 'workflow'} onValueChange={v => setServiceInfo(prev => ({...prev, type: v as any}))}>
                      <SelectTrigger className="h-9 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="workflow">{isAr ? "تدفق مراحل (داخلي)" : "Multi-Step Workflow"}</SelectItem>
                         <SelectItem value="link">{isAr ? "تحويل لرابط خارجي" : "External Redirect"}</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان بالعربي" : "Title AR"}</label>
                   <Input value={serviceInfo.title || ''} onChange={e => setServiceInfo(prev => ({...prev, title: e.target.value}))} className="h-9 text-xs font-bold" />
                 </div>

                 {serviceInfo.type === 'link' && (
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "رابط الوجهة" : "Destination URL"}</label>
                     <div className="relative">
                       <Input value={serviceInfo.linkUrl || ''} onChange={e => setServiceInfo(prev => ({...prev, linkUrl: e.target.value}))} className="h-9 text-xs font-mono pr-10" />
                       <Upload className="absolute top-2.5 right-3 size-4 text-slate-300" />
                     </div>
                   </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "أيقونة الخدمة" : "Service Icon"}</label>
                    <div className="grid grid-cols-4 gap-2 p-2 border rounded-xl bg-slate-50">
                      {Object.keys(ICON_LIST).map(iconName => {
                        const IconComp = (ICON_LIST as any)[iconName];
                        return (
                          <Button 
                            key={iconName} 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-8 w-8 rounded-lg", serviceInfo.iconName === iconName ? "bg-primary text-white" : "hover:bg-primary/10")}
                            onClick={() => setServiceInfo(prev => ({...prev, iconName}))}
                          >
                            <IconComp size={16} />
                          </Button>
                        );
                      })}
                      <div className="col-span-4 mt-2 pt-2 border-t flex flex-col gap-2">
                        <label className="text-[8px] font-black text-slate-400">{isAr ? "أو رفع أيقونة مخصصة (PNG/SVG)" : "Or Upload Custom (PNG/SVG)"}</label>
                        <div className="relative flex gap-1">
                          <Input className="h-8 text-[9px] pr-8" placeholder="URL or Base64..." value={serviceInfo.customIconUrl || ''} onChange={e => setServiceInfo(prev => ({...prev, customIconUrl: e.target.value}))} />
                          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0"><Upload size={12}/></Button>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                       <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "متطلبات الخدمة" : "Requirements"}</label>
                       <Button size="xs" variant="ghost" onClick={() => setServiceInfo(prev => ({...prev, reqsAr: [...(prev.reqsAr || []), '']}))} className="h-5 text-accent font-black">+ {isAr ? "إضافة" : "Add"}</Button>
                    </div>
                    {(serviceInfo.reqsAr || []).map((req, idx) => (
                      <div key={idx} className="flex gap-1 items-center">
                        <Input className="h-8 text-[10px] font-bold" value={req || ''} onChange={e => {
                          setServiceInfo(prev => {
                            const n = [...(prev.reqsAr || [])];
                            n[idx] = e.target.value;
                            return { ...prev, reqsAr: n };
                          });
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => {
                          setServiceInfo(prev => {
                            const n = [...(prev.reqsAr || [])];
                            n.splice(idx, 1);
                            return { ...prev, reqsAr: n };
                          });
                        }} className="h-8 w-8 text-red-400"><X size={12}/></Button>
                      </div>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white border rounded-full p-1 mb-6">
                <TabsTrigger value="logic" className="rounded-full font-black px-8"><GitBranch size={16} className="ml-2"/> {isAr ? "بناء المنطق" : "Logic Editor"}</TabsTrigger>
                <TabsTrigger value="canvas" className="rounded-full font-black px-8"><Network size={16} className="ml-2"/> {isAr ? "عرض المخطط" : "Flowchart Visual"}</TabsTrigger>
              </TabsList>

              <TabsContent value="logic" className="space-y-6 outline-none">
                {serviceInfo.type === 'workflow' && steps.map((step, sIdx) => (
                  <Card key={step.id} id={step.id} className="rounded-3xl shadow-sm border-none overflow-hidden relative animate-in slide-in-from-bottom-2 scroll-mt-24">
                    <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-6 rounded-lg bg-accent text-slate-900 flex items-center justify-center font-black text-xs">{sIdx + 1}</div>
                        <Input 
                          className="bg-white/10 border-none text-white h-8 text-sm font-bold w-64" 
                          value={(isAr ? step.titleAr : step.titleEn) || ''} 
                          onChange={e => isAr ? updateStep(sIdx, { titleAr: e.target.value }) : updateStep(sIdx, { titleEn: e.target.value })} 
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40 h-8 w-8 hover:text-red-400 transition-colors"><Trash2 size={16} /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                       <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-4 border-r pr-8">
                           <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">{isAr ? "مدخلات النموذج" : "Form Inputs"}</h4>
                           <div className="flex flex-wrap gap-2 mb-4">
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'text')} className="h-8 text-[9px] px-3 rounded-lg"><Type size={12} className="ml-1"/> {isAr ? "نص" : "Text"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'select')} className="h-8 text-[9px] px-3 rounded-lg"><List size={12} className="ml-1"/> {isAr ? "قائمة" : "Select"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'multichoice')} className="h-8 text-[9px] px-3 rounded-lg"><CheckSquare size={12} className="ml-1"/> {isAr ? "متعدد" : "Multi"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="h-8 text-[9px] px-3 rounded-lg"><Upload size={12} className="ml-1"/> {isAr ? "مرفق" : "Upload"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'date')} className="h-8 text-[9px] px-3 rounded-lg"><Calendar size={12} className="ml-1"/> {isAr ? "تاريخ" : "Date"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'map')} className="h-8 text-[9px] px-3 rounded-lg"><MapPin size={12} className="ml-1"/> {isAr ? "خريطة" : "Map"}</Button>
                           </div>
                           <div className="space-y-3">
                            {(step.fields || []).map((f, fIdx) => (
                              <div key={f.id} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border">
                                 <div className="flex gap-2 items-center">
                                   <div className="size-5 rounded bg-white border flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">{f.type}</div>
                                   <Input placeholder={isAr ? "تسمية الحقل" : "Field Label"} value={(isAr ? f.labelAr : f.labelEn) || ''} onChange={e => {
                                     const nf = [...step.fields]; 
                                     if (isAr) nf[fIdx].labelAr = e.target.value; else nf[fIdx].labelEn = e.target.value;
                                     updateStep(sIdx, { fields: nf });
                                   }} className="h-8 text-xs font-bold bg-white" />
                                   <Button variant="ghost" size="icon" onClick={() => {
                                     const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, { fields: nf });
                                   }} className="text-red-400 h-8 w-8"><X size={14}/></Button>
                                 </div>
                                 {(f.type === 'select' || f.type === 'multichoice') && (
                                   <div className="space-y-2 pt-2 border-t mt-1">
                                      <div className="flex justify-between items-center mb-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase">{isAr ? "الخيارات" : "Options"}</label>
                                        <Button size="xs" variant="ghost" onClick={() => {
                                          const nf = [...step.fields]; nf[fIdx].options = [...(nf[fIdx].options || []), ''];
                                          updateStep(sIdx, { fields: nf });
                                        }} className="h-4 text-[8px] text-accent font-black">+ {isAr ? "إضافة خيار" : "Add"}</Button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {(f.options || []).map((opt, oIdx) => (
                                          <div key={oIdx} className="relative group/opt">
                                            <Input className="h-7 text-[10px] pr-6" value={opt || ''} onChange={e => {
                                              const nf = [...step.fields]; const opts = [...(nf[fIdx].options || [])]; opts[oIdx] = e.target.value; nf[fIdx].options = opts;
                                              updateStep(sIdx, { fields: nf });
                                            }} />
                                            <Button variant="ghost" size="icon" onClick={() => {
                                              const nf = [...step.fields]; const opts = [...(nf[fIdx].options || [])]; opts.splice(oIdx, 1); nf[fIdx].options = opts;
                                              updateStep(sIdx, { fields: nf });
                                            }} className="absolute top-1 right-1 h-5 w-5 text-red-300 opacity-0 group-hover/opt:opacity-100"><X size={10}/></Button>
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                 )}
                              </div>
                            ))}
                           </div>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-accent tracking-widest">{isAr ? "منطق الانتقال للمرحلة التالية" : "Next Step Orchestration"}</h4>
                            <div className="space-y-4">
                               <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                                 <span className="text-[10px] font-bold text-slate-500">{isAr ? "المسار الافتراضي" : "Default Path"}</span>
                                 <Select value={step.defaultNextStepId || 'none'} onValueChange={v => updateStep(sIdx, { defaultNextStepId: v === 'none' ? '' : v })}>
                                    <SelectTrigger className="h-8 w-40 bg-white font-bold text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">{isAr ? "نهاية التدفق" : "End Flow"}</SelectItem>
                                      {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                               </div>
                               
                               {(step.logic || []).map((rule, rIdx) => {
                                 const targetField = step.fields.find(f => f.id === rule.fieldId);
                                 return (
                                   <div key={rIdx} className="bg-primary/5 p-4 rounded-2xl space-y-3 border border-primary/10 relative group">
                                      <div className="flex items-center justify-between text-[9px] font-black text-primary">
                                        <span>{isAr ? "في حال كانت قيمة الحقل تساوي:" : "IF VALUE EQUALS:"}</span>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                          const nl = [...(step.logic || [])]; nl.splice(rIdx, 1); updateStep(sIdx, { logic: nl });
                                        }} className="h-5 w-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></Button>
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                        <Select value={rule.fieldId || 'none'} onValueChange={v => {
                                          const nl = [...(step.logic || [])]; nl[rIdx].fieldId = v === 'none' ? '' : v; nl[rIdx].value = ''; 
                                          updateStep(sIdx, { logic: nl });
                                        }}>
                                          <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue placeholder={isAr ? "اختر الحقل..." : "Select Field..."} /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                            {step.fields.map(f => <SelectItem key={f.id} value={f.id}>{isAr ? f.labelAr : f.labelEn}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          {targetField?.type === 'select' ? (
                                            <Select value={rule.value || 'none'} onValueChange={v => {
                                              const nl = [...(step.logic || [])]; nl[rIdx].value = v === 'none' ? '' : v; updateStep(sIdx, { logic: nl });
                                            }}>
                                              <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue placeholder={isAr ? "اختر القيمة..." : "Select Value..."} /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                                {(targetField.options || []).filter(o => o !== '').map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Input placeholder={isAr ? "القيمة" : "Value"} value={rule.value || ''} onChange={e => {
                                              const nl = [...(step.logic || [])]; nl[rIdx].value = e.target.value; updateStep(sIdx, { logic: nl });
                                            }} className="h-8 text-[11px] bg-white" />
                                          )}
                                          
                                          <Select value={rule.targetStepId || 'none'} onValueChange={v => {
                                            const nl = [...(step.logic || [])]; nl[rIdx].targetStepId = v === 'none' ? '' : v; updateStep(sIdx, { logic: nl });
                                          }}>
                                            <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue placeholder={isAr ? "انتقل إلى..." : "Navigate to..."} /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                              {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                   </div>
                                 );
                               })}
                               <Button variant="ghost" size="sm" onClick={() => addLogic(sIdx)} className="text-[10px] font-black text-accent h-8 border-dashed border-2 w-full border-accent/20 hover:bg-accent/5">+ {isAr ? "إضافة مسار شرطي" : "Add Conditional Branch"}</Button>
                            </div>
                         </div>
                       </div>
                       <div className="mt-6 pt-4 border-t flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "إجراء نهاية المرحلة" : "Phase Terminal Action"}</span>
                         </div>
                         <Select value={step.actionType || 'submit'} onValueChange={v => updateStep(sIdx, { actionType: v as any })}>
                            <SelectTrigger className="h-9 w-48 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="submit">{isAr ? "إرسال للمراجعة" : "Submit for Review"}</SelectItem>
                               <SelectItem value="payment">{isAr ? "بوابة الدفع الإلكتروني" : "E-Payment Gateway"}</SelectItem>
                            </SelectContent>
                         </Select>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="canvas" className="outline-none">
                 <Card className="rounded-brand overflow-hidden h-[700px] border shadow-inner bg-slate-100 relative">
                    <ReactFlow 
                      nodes={nodes} 
                      edges={edges}
                      onNodesChange={onNodesChange}
                      fitView
                      className="bg-slate-50"
                    >
                      <Background />
                      <Controls />
                      <MiniMap nodeStrokeWidth={3} zoomable pannable />
                      <FlowControls onAdd={addStep} onSave={handleSave} saving={saving} isAr={isAr} />
                    </ReactFlow>
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                       <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border shadow-sm">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{isAr ? "مخطط التدفق التفاعلي" : "Interactive Orchestrator"}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{isAr ? "المربعات تعبر عن مراحل العمل والخطوط تعبر عن المسارات" : "Nodes represent steps, lines represent the flow"}</p>
                       </div>
                    </div>
                 </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}

export default function WorkflowEngine() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <ReactFlowProvider>
        <WorkflowEngineContent />
      </ReactFlowProvider>
    </Suspense>
  );
}
