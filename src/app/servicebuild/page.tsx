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
  Maximize, LayoutGrid, Edit2, Hash, List, MapPin
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
import { Badge } from '@/components/ui/badge';

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
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ICON_LIST = ['FileText', 'ShieldCheck', 'Users', 'TrendingUp', 'Landmark', 'MapPin', 'CreditCard', 'Building2', 'Truck', 'Trash2', 'Wrench', 'Lightbulb'];

// Color Palette for Logic Edges
const EDGE_COLORS = [
  '#be123c', // Red 700
  '#7e22ce', // Purple 700
  '#c2410c', // Orange 700
  '#1d4ed8', // Blue 700
  '#047857', // Emerald 700
  '#a21caf', // Fuchsia 700
  '#b91c1c', // Red 800
  '#4338ca', // Indigo 700
];

// Custom Node with 4 Connection Points and Step Numbering
const ServiceStepNode = ({ data }: any) => {
  return (
    <div className="group relative bg-white text-[#007375] border-2 border-[#007375] rounded-2xl p-4 font-bold w-[200px] text-center shadow-lg transition-transform hover:scale-105">
      {/* 4 Handles for better routing */}
      <Handle type="target" position={Position.Top} className="!bg-[#007375]" />
      <Handle type="target" position={Position.Left} className="!bg-[#007375]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#007375]" />
      <Handle type="source" position={Position.Right} className="!bg-[#007375]" />
      
      <div className="absolute -top-3 -left-3 bg-[#470D67] text-white size-8 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
        {data.stepIndex + 1}
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-black line-clamp-2">{data.label}</span>
        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {data.actions}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  serviceStep: ServiceStepNode,
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
    fees: '0 OMR', description: '', descriptionEn: '', type: 'workflow', linkUrl: ''
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
          if (svc) setServiceInfo(svc);
        }
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  // Fix for Canvas Dimensions in hidden tabs
  useEffect(() => {
    if (activeTab === 'canvas') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }
  }, [activeTab]);

  const addStep = useCallback(() => {
    const newStep: ServiceStep = {
      id: `step_${Date.now()}`,
      titleAr: isAr ? 'خطوة جديدة' : 'New Step',
      titleEn: 'New Step',
      fields: [],
      actionType: 'submit'
    };
    setSteps(prev => [...prev, newStep]);
  }, [isAr]);

  const updateStep = (idx: number, updates: Partial<ServiceStep>) => {
    const ns = [...steps];
    ns[idx] = { ...ns[idx], ...updates };
    setSteps(ns);
  };

  const removeStep = (id: string) => setSteps(steps.filter(s => s.id !== id));

  const addFieldToStep = (stepId: string, type: FormField['type']) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, fields: [...s.fields, {
      id: `field_${Date.now()}`, 
      type, 
      labelAr: '', 
      labelEn: '', 
      required: true,
      options: (type === 'select' || type === 'multichoice') ? [] : undefined
    }] } : s));
  };

  const addLogic = (stepIdx: number) => {
    const ns = [...steps];
    const logic: StepLogic[] = ns[stepIdx].logic || [];
    ns[stepIdx].logic = [...logic, { fieldId: '', value: '', targetStepId: '' }];
    setSteps(ns);
  };

  const handleSave = async () => {
    if (!serviceInfo.title) return toast({ variant: "destructive", title: isAr ? "العنوان مطلوب" : "Title Required" });
    setSaving(true);
    try {
      const data = await fetchBin();
      const newId = editId || `svc_${Date.now()}`;
      
      const newService: Service = {
        ...serviceInfo as Service,
        id: newId,
        isActive: true,
        reqsAr: steps.flatMap(s => s.fields.map(f => f.labelAr)),
        reqsEn: steps.flatMap(s => s.fields.map(f => f.labelEn)),
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

      toast({ title: isAr ? "تم حفظ التدفق" : "Workflow Saved" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  // Flowchart Mapping - Grid 3x
  const nodes: Node[] = useMemo(() => {
    return steps.map((step, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      
      return {
        id: step.id,
        type: 'serviceStep',
        data: { 
          stepIndex: idx,
          label: isAr ? step.titleAr : step.titleEn,
          actions: (
            <>
              <Button size="xs" variant="ghost" className="h-7 w-7 p-0 bg-slate-50 hover:bg-accent hover:text-white transition-colors" onClick={() => { setActiveTab('logic'); setTimeout(() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }), 100); }}>
                <Edit2 size={12} />
              </Button>
              <Button size="xs" variant="ghost" className="h-7 w-7 p-0 bg-slate-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors" onClick={() => removeStep(step.id)}>
                <Trash2 size={12} />
              </Button>
            </>
          )
        },
        position: { x: col * 280, y: row * 250 },
      };
    });
  }, [steps, isAr]);

  // Dynamic Colored Edges
  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];
    let logicColorIndex = 0;

    steps.forEach((step, sIdx) => {
      // Default Path (Teal)
      if (step.defaultNextStepId) {
        e.push({
          id: `e-${step.id}-${step.defaultNextStepId}`,
          source: step.id,
          target: step.defaultNextStepId,
          type: 'smoothstep',
          label: isAr ? 'مسار افتراضي' : 'Default Path',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#007375' },
          style: { stroke: '#007375', strokeWidth: 3, opacity: 0.8 }
        });
      }

      // Logic Paths (Unique Colors)
      step.logic?.forEach((rule, idx) => {
        if (rule.targetStepId) {
          const color = EDGE_COLORS[logicColorIndex % EDGE_COLORS.length];
          logicColorIndex++;

          const targetField = step.fields.find(f => f.id === rule.fieldId);
          const fieldLabel = isAr ? targetField?.labelAr : targetField?.labelEn;
          const conditionLabel = fieldLabel ? `${fieldLabel} = ${rule.value}` : `${rule.value}`;

          e.push({
            id: `e-logic-${step.id}-${rule.targetStepId}-${idx}`,
            source: step.id,
            target: rule.targetStepId,
            type: 'smoothstep',
            label: conditionLabel,
            animated: true,
            style: { stroke: color, strokeWidth: 4 },
            markerEnd: { type: MarkerType.ArrowClosed, color: color },
            labelStyle: { fill: color, fontWeight: 900, fontSize: '10px' },
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: '#fff', fillOpacity: 0.9, stroke: color, strokeWidth: 1 }
          });
        }
      });
    });
    return e;
  }, [steps, isAr]);

  const FlowControls = () => {
    const { fitView } = useReactFlow();
    
    return (
      <Panel position="top-right" className="flex gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border shadow-xl">
        <Button size="sm" variant="outline" onClick={addStep} className="rounded-xl font-black gap-2 h-9 px-4 border-primary text-primary hover:bg-primary/5">
          <Plus size={14}/> {isAr ? "إضافة مرحلة" : "Add Step"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fitView()} className="rounded-xl font-black gap-2 h-9 px-4">
          <Maximize size={14}/> {isAr ? "ملائمة" : "Fit View"}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-xl font-black gap-2 h-9 px-6 shadow-md">
          {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
          {isAr ? "حفظ" : "Save"}
        </Button>
      </Panel>
    );
  };

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
                <CardTitle className="text-xs font-black flex items-center gap-2">
                  <Settings size={14} /> {isAr ? "إعدادات الخدمة" : "Service Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "نوع التنفيذ" : "Execution Type"}</label>
                   <Select value={serviceInfo.type || 'workflow'} onValueChange={v => setServiceInfo({...serviceInfo, type: v as any})}>
                      <SelectTrigger className="h-9 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="workflow">{isAr ? "تدفق مراحل (داخلي)" : "Multi-Step Workflow"}</SelectItem>
                         <SelectItem value="link">{isAr ? "تحويل لرابط خارجي" : "External Redirect"}</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان بالعربي" : "Title AR"}</label>
                   <Input value={serviceInfo.title || ''} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="h-9 text-xs font-bold" />
                 </div>

                 {serviceInfo.type === 'link' && (
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "رابط الوجهة" : "Destination URL"}</label>
                     <div className="relative">
                       <Input value={serviceInfo.linkUrl || ''} onChange={e => setServiceInfo({...serviceInfo, linkUrl: e.target.value})} className="h-9 text-xs font-mono pr-10" />
                       <Upload className="absolute top-2.5 right-3 size-4 text-slate-300" />
                     </div>
                   </div>
                 )}

                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "الفئة" : "Category"}</label>
                   <Select value={serviceInfo.category || 'elec'} onValueChange={v => setServiceInfo({...serviceInfo, category: v})}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(CAT_CONFIG).map(cid => (
                          <SelectItem key={cid} value={cid}>{isAr ? CAT_CONFIG[cid as any].labelAr : CAT_CONFIG[cid as any].labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "أيقونة الخدمة" : "Service Icon"}</label>
                   <Select value={serviceInfo.iconName || 'FileText'} onValueChange={v => setServiceInfo({...serviceInfo, iconName: v})}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ICON_LIST.map(icon => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 </div>

                 {serviceInfo.type === 'workflow' && (
                   <Button onClick={addStep} className="w-full dm-gradient-primary rounded-xl font-black mt-4 py-6 shadow-xl">
                     <Plus size={18} className="ml-2"/> {isAr ? "إضافة مرحلة جديدة" : "Add Step"}
                   </Button>
                 )}
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
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'number')} className="h-8 text-[9px] px-3 rounded-lg"><Hash size={12} className="ml-1"/> {isAr ? "رقم" : "Number"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'upload')} className="h-8 text-[9px] px-3 rounded-lg"><Upload size={12} className="ml-1"/> {isAr ? "مرفق" : "Upload"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'date')} className="h-8 text-[9px] px-3 rounded-lg"><Calendar size={12} className="ml-1"/> {isAr ? "تاريخ" : "Date"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'select')} className="h-8 text-[9px] px-3 rounded-lg"><List size={12} className="ml-1"/> {isAr ? "قائمة" : "List"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'multichoice')} className="h-8 text-[9px] px-3 rounded-lg"><Layers size={12} className="ml-1"/> {isAr ? "متعدد" : "Multi"}</Button>
                             <Button size="xs" variant="outline" onClick={() => addFieldToStep(step.id, 'map')} className="h-8 text-[9px] px-3 rounded-lg"><MapPin size={12} className="ml-1"/> {isAr ? "خريطة" : "Map"}</Button>
                           </div>
                           <div className="space-y-3">
                            {step.fields.map((f, fIdx) => (
                              <div key={f.id} className="space-y-3 p-4 bg-slate-50 rounded-xl border group">
                                 <div className="flex gap-2 items-center">
                                    <div className="px-2 py-0.5 rounded-md bg-white border text-[8px] font-black uppercase text-slate-400">{f.type}</div>
                                    <Input 
                                      placeholder={isAr ? "تسمية الحقل" : "Field Label"} 
                                      value={(isAr ? f.labelAr : f.labelEn) || ''} 
                                      onChange={e => {
                                        const nf = [...step.fields]; 
                                        if (isAr) nf[fIdx].labelAr = e.target.value; else nf[fIdx].labelEn = e.target.value;
                                        updateStep(sIdx, { fields: nf });
                                      }} 
                                      className="h-8 text-xs font-bold bg-white" 
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, { fields: nf });
                                    }} className="text-red-400 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></Button>
                                 </div>
                                 
                                 {(f.type === 'select' || f.type === 'multichoice') && (
                                   <div className="space-y-2 pl-6 border-l-2 border-slate-200">
                                      <div className="flex flex-wrap gap-2">
                                         {(f.options || []).map((opt, oIdx) => (
                                           <Badge key={oIdx} variant="secondary" className="text-[9px] font-bold gap-1 px-2 py-1">
                                             {opt}
                                             <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => {
                                               const nf = [...step.fields];
                                               nf[fIdx].options = nf[fIdx].options?.filter((_, i) => i !== oIdx);
                                               updateStep(sIdx, { fields: nf });
                                             }} />
                                           </Badge>
                                         ))}
                                         <Button 
                                           size="xs" 
                                           variant="ghost" 
                                           className="h-6 text-[9px] font-black border-dashed border-2 px-3 rounded-full"
                                           onClick={() => {
                                             const val = prompt(isAr ? "اسم الخيار الجديد:" : "New option name:");
                                             if (val) {
                                               const nf = [...step.fields];
                                               nf[fIdx].options = [...(nf[fIdx].options || []), val];
                                               updateStep(sIdx, { fields: nf });
                                             }
                                           }}
                                         >
                                           + {isAr ? "خيار" : "Option"}
                                         </Button>
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
                                 <Select value={step.defaultNextStepId || 'none'} onValueChange={v => updateStep(sIdx, { defaultNextStepId: v === 'none' ? undefined : v })}>
                                    <SelectTrigger className="h-8 w-40 bg-white font-bold text-xs"><SelectValue placeholder="..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">{isAr ? "لا يوجد" : "None"}</SelectItem>
                                      {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                               </div>
                               
                               {(step.logic || []).map((rule, rIdx) => {
                                 const targetField = step.fields.find(f => f.id === rule.fieldId);
                                 const isListField = targetField?.type === 'select' || targetField?.type === 'multichoice';

                                 return (
                                   <div key={rIdx} className="bg-primary/5 p-4 rounded-2xl space-y-4 border border-primary/10 relative group">
                                      <div className="flex items-center justify-between text-[9px] font-black text-primary">
                                        <span>{isAr ? "قاعدة شرطية جديدة:" : "CONDITIONAL RULE:"}</span>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                          const nl = [...step.logic!]; nl.splice(rIdx, 1); updateStep(sIdx, { logic: nl });
                                        }} className="h-5 w-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></Button>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[8px] font-bold text-slate-400">{isAr ? "اسم الحقل:" : "FIELD NAME:"}</span>
                                          <Select value={rule.fieldId || 'none'} onValueChange={v => {
                                            const nl = [...step.logic!];
                                            nl[rIdx].fieldId = v === 'none' ? '' : v;
                                            nl[rIdx].value = ''; 
                                            updateStep(sIdx, { logic: nl });
                                          }}>
                                            <SelectTrigger className="h-8 text-[10px] bg-white"><SelectValue placeholder={isAr ? "اختر الحقل..." : "Select Field..."} /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                              {step.fields.map(f => <SelectItem key={f.id} value={f.id}>{isAr ? f.labelAr : f.labelEn}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-bold text-slate-400">{isAr ? "يساوي القيمة:" : "EQUALS VALUE:"}</span>
                                            {isListField ? (
                                              <Select value={rule.value || 'none'} onValueChange={v => {
                                                const nl = [...step.logic!]; nl[rIdx].value = v === 'none' ? '' : v; updateStep(sIdx, { logic: nl });
                                              }}>
                                                <SelectTrigger className="h-8 text-[10px] bg-white"><SelectValue placeholder="..." /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                                  {targetField?.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Input 
                                                placeholder={isAr ? "القيمة" : "Value"} 
                                                value={rule.value || ''} 
                                                onChange={e => {
                                                  const nl = [...step.logic!]; nl[rIdx].value = e.target.value; updateStep(sIdx, { logic: nl });
                                                }} 
                                                className="h-8 text-[11px] bg-white" 
                                              />
                                            )}
                                          </div>
                                          
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-bold text-slate-400">{isAr ? "انتقل إلى:" : "NAVIGATE TO:"}</span>
                                            <Select value={rule.targetStepId || 'none'} onValueChange={v => {
                                              const nl = [...step.logic!]; nl[rIdx].targetStepId = v === 'none' ? '' : v; updateStep(sIdx, { logic: nl });
                                            }}>
                                              <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue placeholder="..." /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                                {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          </div>
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

                {serviceInfo.type === 'link' && (
                  <Card className="rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200 bg-white">
                    <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                      <LinkIcon size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-primary mb-3">{isAr ? "خدمة الربط الخارجي نشطة" : "Active External Integration"}</h3>
                    <p className="text-slate-400 font-bold max-w-md mx-auto">{isAr ? "سيتم توجيه المواطنين مباشرة إلى الأنظمة البلدية القائمة (مثل نظام أبشر أو بوابة عمان الرقمية)." : "Citizens will be redirected to existing municipal systems or standard Omani digital portals."}</p>
                    <Button variant="outline" className="mt-8 rounded-full px-10 font-bold gap-2" asChild>
                      <a href={serviceInfo.linkUrl} target="_blank"><Eye size={16}/> {isAr ? "معاينة الوجهة" : "Preview Target"}</a>
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="canvas" className="outline-none">
                 <Card className="rounded-brand overflow-hidden h-[700px] border shadow-inner bg-slate-100 relative">
                    <ReactFlowProvider>
                      <ReactFlow 
                        nodes={nodes} 
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-50"
                      >
                        <Background />
                        <Controls />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                        <FlowControls />
                      </ReactFlow>
                    </ReactFlowProvider>
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                       <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border shadow-sm">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{isAr ? "مخطط التدفق التفاعلي" : "Interactive Orchestrator"}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{isAr ? "استخدم الأدوات لتنظيم مسار المواطن" : "Use tools to organize citizen paths"}</p>
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
      <WorkflowEngineContent />
    </Suspense>
  );
}
