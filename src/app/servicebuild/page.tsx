
'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Upload, Type, Calendar, Layers, X, 
  Settings, Loader2, GitBranch, ArrowRight,
  Maximize, Edit2, Hash, List, MapPin, FileText, Image as ImageIcon,
  ChevronUp, ChevronDown, Sparkles, Network, MousePointer2,
  Building2, User2, Landmark, HelpCircle, LayoutGrid,
  RefreshCw, Database, ShieldCheck, Search, GripVertical, Info
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { ServiceStep, FormField, Service, ServiceFlow, StepLogic } from '@/lib/types';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { CAT_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import * as Icons from 'lucide-react';

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

const ServiceStepNode = ({ data }: any) => {
  return (
    <div 
      className={cn(
        "group relative bg-white border-2 rounded-[1.8rem] p-6 font-bold w-[260px] text-center shadow-xl transition-all duration-500",
        data.isFocused ? "border-accent scale-105 z-50 ring-[12px] ring-accent/10 opacity-100 grayscale-0" : "border-slate-200 opacity-30 grayscale"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
      
      <div className="absolute -top-5 -left-5 bg-primary text-white size-12 rounded-[1.2rem] flex items-center justify-center text-lg font-black shadow-[0_10px_20px_rgba(0,0,0,0.2)] border-4 border-white transition-all group-hover:rotate-12">
        {data.dynamicIndex !== undefined ? data.dynamicIndex : data.stepIndex + 1}
      </div>

      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center justify-center gap-2 mb-1">
           <Badge variant="outline" className="text-[8px] uppercase tracking-widest px-2 border-slate-200">{data.actionType || 'submit'}</Badge>
        </div>
        <span className="text-sm font-black line-clamp-2 leading-relaxed text-slate-800">{data.label}</span>
        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          <Button size="icon" variant="ghost" className="h-9 w-9 bg-slate-50 hover:bg-accent hover:text-white rounded-xl shadow-sm" onClick={data.onEdit}>
            <Edit2 size={16} />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 bg-slate-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl shadow-sm" onClick={data.onRemove}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { serviceStep: ServiceStepNode };

function WorkflowEngineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [activeTab, setActiveTab] = useState('logic');
  const [steps, setSteps] = useState<ServiceStep[]>([]);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<Partial<Service>>({
    title: '', titleEn: '', category: 'elec', iconName: 'FileText',
    fees: '10 OMR', description: '', descriptionEn: '', type: 'workflow',
    reqsAr: [], reqsEn: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data) {
          const flow = (data.serviceFlows || []).find((f: any) => f.id === editId || f.serviceId === editId);
          const svc = (data.services || []).find((s: any) => s.id === editId);
          if (flow) {
            setSteps(flow.steps || []);
          }
          if (svc) setServiceInfo(svc);
        }
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  const handleAiTranslate = async (text: string, fieldKey: string) => {
    if (!text) return;
    setAiLoading(fieldKey);
    try {
      const { translatedText } = await translateToEnglish({ text });
      setServiceInfo(prev => ({ ...prev, [fieldKey === 'title' ? 'titleEn' : 'descriptionEn']: translatedText }));
    } finally { setAiLoading(null); }
  };

  const addStep = useCallback(() => {
    setSteps(prev => [...prev, {
      id: `step_${Date.now()}`,
      titleAr: isAr ? 'خطوة جديدة' : 'New Step',
      titleEn: 'New Step',
      fields: [],
      logic: [],
      actionType: 'submit'
    }]);
  }, [isAr]);

  const updateStep = (idx: number, updates: Partial<ServiceStep>) => {
    const ns = [...steps];
    if (ns[idx]) { 
      ns[idx] = { ...ns[idx], ...updates }; 
      setSteps(ns); 
    }
  };

  const handleAddFieldToStep = (stepId: string, type: FormField['type']) => {
    setSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      fields: [...s.fields, { id: `f_${Date.now()}`, type, labelAr: 'حقل جديد', labelEn: 'New Field', required: true, options: [] }]
    } : s));
  };

  const handleAddOption = (sIdx: number, fIdx: number) => {
    const val = prompt(isAr ? "أدخل قيمة الخيار (أو سطر المعلومات):" : "Enter option value (or info line):");
    if (!val) return;
    const ns = [...steps];
    const field = ns[sIdx].fields[fIdx];
    if (!field.options) field.options = [];
    field.options = [...field.options, val];
    setSteps(ns);
  };

  const addLogic = (sIdx: number) => {
    const ns = [...steps];
    if (!ns[sIdx].logic) ns[sIdx].logic = [];
    ns[sIdx].logic!.push({ fieldId: '', value: '', targetStepId: '' });
    setSteps(ns);
  };

  const pathData = useMemo(() => {
    if (!hoveredEdgeId) return { nodeIds: new Set(), edgeIds: new Set(), dynamicMap: new Map() };
    
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const dynamicMap = new Map<string, number>();

    const parts = hoveredEdgeId.split('-');
    const sourceId = parts[1];
    const targetId = parts[2];

    const findReachable = (currentId: string, depth: number) => {
      if (nodeIds.has(currentId)) return;
      nodeIds.add(currentId);
      dynamicMap.set(currentId, depth);

      const step = steps.find(s => s.id === currentId);
      if (!step) return;

      if (currentId === sourceId) {
        if (targetId) findReachable(targetId, depth + 1);
        return;
      }

      if (step.defaultNextStepId) findReachable(step.defaultNextStepId, depth + 1);
      step.logic?.forEach(l => {
        if (l.targetStepId) findReachable(l.targetStepId, depth + 1);
      });
    };

    if (steps[0]) {
      let currentDepth = 1;
      const traverse = (id: string, depth: number) => {
          if (nodeIds.has(id)) return;
          nodeIds.add(id);
          dynamicMap.set(id, depth);

          const step = steps.find(s => s.id === id);
          if (!step) return;

          if (id === sourceId) {
            findReachable(targetId, depth + 1);
            return;
          }

          const nextIds = [step.defaultNextStepId, ...(step.logic?.map(l => l.targetStepId) || [])].filter(Boolean) as string[];
          nextIds.forEach(nextId => traverse(nextId, depth + 1));
      };
      traverse(steps[0].id, 1);
    }

    edgeIds.add(hoveredEdgeId);
    return { nodeIds, edgeIds, dynamicMap };
  }, [hoveredEdgeId, steps]);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];
    steps.forEach((step) => {
      if (step.defaultNextStepId) {
        const id = `e-${step.id}-${step.defaultNextStepId}`;
        const isActive = hoveredEdgeId === id;
        
        e.push({
          id, source: step.id, target: step.defaultNextStepId, type: 'smoothstep',
          label: isActive ? (isAr ? 'افتراضي' : 'Default') : '',
          style: { 
            stroke: isActive ? '#03CFCB' : '#007375', 
            strokeWidth: isActive ? 8 : 2, 
            opacity: hoveredEdgeId ? (isActive ? 1 : 0.05) : 0.8 
          },
          labelStyle: { fill: '#007375', fontWeight: 900, fontSize: 12, display: isActive ? 'block' : 'none' }
        });
      }
      (step.logic || []).forEach((rule, idx) => {
        if (rule.targetStepId) {
          const id = `e-${rule.targetStepId}-${idx}`; 
          const isActive = hoveredEdgeId === id;
          
          e.push({
            id, source: step.id, target: rule.targetStepId, type: 'smoothstep', animated: true,
            label: isActive ? rule.value : '',
            style: { 
              stroke: '#470D67', 
              strokeWidth: isActive ? 10 : 3, 
              opacity: hoveredEdgeId ? (isActive ? 1 : 0.05) : 1 
            },
            labelStyle: { fill: '#470D67', fontWeight: 900, fontSize: 14, display: isActive ? 'block' : 'none' }
          });
        }
      });
    });
    return e;
  }, [steps, isAr, hoveredEdgeId]);

  const nodes: Node[] = useMemo(() => {
    return steps.map((step, idx) => ({
      id: step.id,
      type: 'serviceStep',
      data: { 
        stepIndex: idx,
        dynamicIndex: pathData.dynamicMap.get(step.id),
        isFocused: hoveredEdgeId ? pathData.nodeIds.has(step.id) : true,
        label: isAr ? step.titleAr : (step.titleEn || step.titleAr),
        actionType: step.actionType,
        onEdit: () => { setActiveTab('logic'); document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }); },
        onRemove: () => setSteps(prev => prev.filter(s => s.id !== step.id))
      },
      position: step.position || { x: (idx % 2) * 400, y: Math.floor(idx / 2) * 300 },
    }));
  }, [steps, isAr, hoveredEdgeId, pathData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const id = editId || `svc_${Date.now()}`;
      
      await updateBin({
        ...db,
        services: [...(db.services || []).filter((s: any) => s.id !== id), { ...serviceInfo, id, isActive: true }],
        serviceFlows: [...(db.serviceFlows || []).filter((f: any) => f.id !== id || f.serviceId !== id), { id, serviceId: id, steps, isActive: true }]
      });
      toast({ title: "Saved Successfully" });
      router.push('/admin');
    } finally { setSaving(false); }
  };

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h1 className="text-4xl font-black text-primary flex items-center gap-3 tracking-tighter">
                <GitBranch size={40} className="text-accent" /> {isAr ? "مصنع هندسة العمليات" : "Process Neural Matrix"}
              </h1>
              <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">Enterprise Workflow Architect v4.0</p>
           </div>
           <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()} className="rounded-2xl font-black px-8 h-12 shadow-sm border-slate-200">Back</Button>
              <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-2xl px-12 font-black shadow-xl h-12 gap-2">
                 {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} {isAr ? "حفظ النظام" : "Save Matrix"}
              </Button>
           </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
           <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden h-fit sticky top-24 ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-3">
                  <Settings className="text-accent animate-spin-slow" size={20}/>
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em]">Matrix Config</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="space-y-4">
                    <div className="relative">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Title AR</Label>
                       <Input value={serviceInfo.title} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="font-black h-12 rounded-xl pr-10 border-slate-100" />
                       <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(serviceInfo.title || '', 'title')}><Sparkles size={16}/></Button>
                    </div>
                    <Input value={serviceInfo.titleEn} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} placeholder="English Mapping..." className="rounded-xl h-11 border-slate-100" />
                 </div>
                 
                 <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirements</Label>
                       <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px]">{serviceInfo.reqsAr?.length} ACTIVE</Badge>
                    </div>
                    <div className="flex gap-2">
                       <Input id="new-doc" placeholder="Add custom doc..." className="h-10 text-xs rounded-xl" onKeyDown={e => {
                         if(e.key === 'Enter') {
                           const val = (e.target as HTMLInputElement).value;
                           if(val) {
                             setServiceInfo({...serviceInfo, reqsAr: [...(serviceInfo.reqsAr || []), val]});
                             (e.target as HTMLInputElement).value = '';
                           }
                         }
                       }} />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                       {serviceInfo.reqsAr?.map((r, i) => (
                         <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[10px] font-bold border border-slate-100 group">
                           <span className="truncate max-w-[150px]">{r}</span>
                           <X size={14} className="cursor-pointer text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setServiceInfo({...serviceInfo, reqsAr: serviceInfo.reqsAr?.filter((_, idx) => idx !== i)})} />
                         </div>
                       ))}
                    </div>
                 </div>
                 <Button onClick={addStep} className="w-full dm-gradient-primary rounded-2xl font-black h-14 shadow-lg group">
                    <Plus className="mr-2 group-hover:rotate-90 transition-transform" /> {isAr ? "إضافة مرحلة جديدة" : "Add Phase"}
                 </Button>
              </CardContent>
           </Card>

           <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                 <TabsList className="bg-white border rounded-[2rem] p-1.5 mb-10 shadow-sm inline-flex ring-1 ring-slate-100">
                    <TabsTrigger value="logic" className="rounded-[1.5rem] font-black px-12 h-12 data-[state=active]:bg-primary data-[state=active]:text-white">Neural Logic Editor</TabsTrigger>
                    <TabsTrigger value="canvas" className="rounded-[1.5rem] font-black px-12 h-12 data-[state=active]:bg-accent data-[state=active]:text-slate-900">Visual Blueprint</TabsTrigger>
                 </TabsList>

                 <TabsContent value="logic" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {steps.map((step, sIdx) => (
                      <Card key={step.id} id={step.id} className="rounded-[3rem] shadow-2xl border-none overflow-hidden bg-white ring-1 ring-slate-100 group/card">
                         <CardHeader className="bg-slate-900 text-white p-8 flex flex-row justify-between items-center">
                            <div className="flex items-center gap-6">
                               <div className="size-14 rounded-2xl bg-accent text-slate-900 flex items-center justify-center text-2xl font-black shadow-lg">{sIdx+1}</div>
                               <div className="space-y-1">
                                  <Input value={isAr ? step.titleAr : step.titleEn} onChange={e => isAr ? updateStep(sIdx, {titleAr: e.target.value}) : updateStep(sIdx, {titleEn: e.target.value})} className="bg-white/5 border-none text-white font-black w-96 h-12 text-xl focus:bg-white/10" />
                                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] px-3">Phase Identification</p>
                               </div>
                            </div>
                            <Button variant="ghost" onClick={() => setSteps(steps.filter(s => s.id !== step.id))} className="text-red-400 hover:bg-red-500/10 rounded-2xl size-12"><Trash2/></Button>
                         </CardHeader>
                         
                         <CardContent className="p-12 grid md:grid-cols-2 gap-16">
                            <div className="space-y-10 border-r border-slate-100 pr-12">
                               <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2"><LayoutGrid size={16}/> Form Field Factory</h4>
                                  <Badge className="bg-primary/5 text-primary border-primary/10 rounded-full px-4">{step.fields.length} FIELDS</Badge>
                               </div>
                               
                               <div className="flex flex-wrap gap-2">
                                  {[
                                    { id: 'text', icon: <Type size={12}/> },
                                    { id: 'number', icon: <Hash size={12}/> },
                                    { id: 'upload', icon: <Upload size={12}/> },
                                    { id: 'date', icon: <Calendar size={12}/> },
                                    { id: 'select', icon: <List size={12}/> },
                                    { id: 'map', icon: <MapPin size={12}/> },
                                    { id: 'info', icon: <Info size={12}/> }
                                  ].map(fType => (
                                    <Button key={fType.id} size="sm" variant="outline" className="h-10 px-4 rounded-xl gap-2 font-black border-slate-200 hover:border-primary transition-all" onClick={() => handleAddFieldToStep(step.id, fType.id as any)}>
                                      {fType.icon} {fType.id.toUpperCase()}
                                    </Button>
                                  ))}
                               </div>

                               <div className="space-y-6">
                                  {step.fields.map((f, fIdx) => (
                                    <div key={f.id} className="p-6 bg-slate-50/50 rounded-[2rem] border-2 border-slate-100 group relative">
                                       <div className="flex gap-4 items-center mb-4">
                                          <div className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary"><Search size={14}/></div>
                                          <Input value={isAr ? f.labelAr : f.labelEn} onChange={e => {
                                             const nf = [...step.fields]; if(isAr) nf[fIdx].labelAr = e.target.value; else nf[fIdx].labelEn = e.target.value;
                                             updateStep(sIdx, {fields: nf});
                                          }} className="h-10 text-sm font-black rounded-xl bg-white" />
                                          <Button variant="ghost" size="icon" onClick={() => { const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, {fields: nf}); }} className="text-red-400 hover:bg-red-50 rounded-lg"><X size={16}/></Button>
                                       </div>
                                       
                                       {(f.type === 'select' || f.type === 'info') && (
                                         <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.type === 'info' ? 'Content Lines' : 'Options Management'}</p>
                                            <div className="flex flex-col gap-2">
                                               {f.options?.map((opt, oIdx) => (
                                                 <div key={oIdx} className="flex gap-2 items-center bg-white p-2 border-slate-200 rounded-xl font-bold shadow-sm">
                                                   <span className="flex-1 text-xs">{opt}</span> 
                                                   <X size={14} className="cursor-pointer text-red-400" onClick={() => {
                                                     const nf = [...step.fields];
                                                     nf[fIdx].options = nf[fIdx].options?.filter((_, i) => i !== oIdx);
                                                     updateStep(sIdx, {fields: nf});
                                                   }}/>
                                                 </div>
                                               ))}
                                               <Button size="xs" variant="ghost" className="h-10 border-dashed border-2 rounded-xl text-[9px] font-black text-accent" onClick={() => handleAddOption(sIdx, fIdx)}>+ ADD {f.type === 'info' ? 'LINE' : 'OPTION'}</Button>
                                            </div>
                                         </div>
                                       )}
                                       <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-full" />
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-10">
                               <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black uppercase text-accent tracking-[0.2em] flex items-center gap-2"><Network size={16}/> Logic Controller</h4>
                                  <Badge className="bg-accent/10 text-accent border-accent/20 rounded-full px-4">NEURAL ROUTING</Badge>
                               </div>

                               <div className="space-y-6">
                                  <div className="p-6 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] flex flex-col gap-3">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Default Continuation</span>
                                     <Select value={step.defaultNextStepId || 'none'} onValueChange={v => updateStep(sIdx, {defaultNextStepId: v === 'none' ? undefined : v})}>
                                        <SelectTrigger className="h-14 rounded-2xl font-black bg-white border-none shadow-sm"><SelectValue placeholder="End of Workflow" /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                           <SelectItem value="none" className="font-black text-red-500">TERMINAL (End)</SelectItem>
                                           {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id} className="font-bold">{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                        </SelectContent>
                                     </Select>
                                  </div>

                                  <div className="space-y-4">
                                     {step.logic?.map((rule, rIdx) => (
                                       <div key={rIdx} className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 space-y-6 relative overflow-hidden animate-in zoom-in-95">
                                          <div className="flex items-center justify-between relative z-10">
                                             <Badge className="bg-primary text-white font-black">IF LOGIC #{rIdx+1}</Badge>
                                             <Button variant="ghost" size="icon" onClick={() => { const nl = step.logic?.filter((_, i) => i !== rIdx); updateStep(sIdx, {logic: nl}); }} className="text-red-400"><X size={14}/></Button>
                                          </div>
                                          
                                          <div className="space-y-4 relative z-10">
                                             <Select value={rule.fieldId} onValueChange={v => { const nl = [...(step.logic || [])]; nl[rIdx].fieldId = v; updateStep(sIdx, {logic: nl}); }}>
                                                <SelectTrigger className="bg-white h-12 rounded-xl font-bold"><SelectValue placeholder="Select Trigger Field..." /></SelectTrigger>
                                                <SelectContent>{step.fields.map(f => <SelectItem key={f.id} value={f.id}>{isAr ? f.labelAr : f.labelEn}</SelectItem>)}</SelectContent>
                                             </Select>
                                             
                                             <div className="grid grid-cols-2 gap-4">
                                                <Input value={rule.value} onChange={e => { const nl = [...(step.logic || [])]; nl[rIdx].value = e.target.value; updateStep(sIdx, {logic: nl}); }} placeholder="Equals Value..." className="bg-white h-12 rounded-xl font-bold" />
                                                <Select value={rule.targetStepId} onValueChange={v => { const nl = [...(step.logic || [])]; nl[rIdx].targetStepId = v; updateStep(sIdx, {logic: nl}); }}>
                                                   <SelectTrigger className="bg-white h-12 rounded-xl font-black text-accent"><SelectValue placeholder="Jump to Phase..." /></SelectTrigger>
                                                   <SelectContent>{steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}</SelectContent>
                                                </Select>
                                             </div>
                                          </div>
                                          <div className="absolute top-0 right-0 size-32 dm-wave-5 opacity-5 pointer-events-none" />
                                       </div>
                                     ))}
                                  </div>
                                  
                                  <Button variant="outline" onClick={() => addLogic(sIdx)} className="w-full h-14 rounded-[1.5rem] border-dashed border-2 border-primary/30 font-black text-primary hover:bg-primary/5">
                                    + ADD NEURAL BRANCH
                                  </Button>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </TabsContent>

                 <TabsContent value="canvas">
                    <Card className="rounded-[4rem] overflow-hidden h-[850px] border-[12px] border-white shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative bg-slate-100 ring-1 ring-slate-200">
                       <ReactFlowProvider>
                          <ReactFlow 
                            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
                            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                            fitView
                          >
                             <Background color="#cbd5e1" gap={40} size={1} />
                             <Controls className="bg-white border-none shadow-2xl rounded-2xl overflow-hidden" />
                             <MiniMap nodeStrokeWidth={3} zoomable pannable nodeColor="#007375" maskColor="rgba(241, 245, 249, 0.7)" className="rounded-[2rem] border-4 border-white shadow-2xl" />
                             <Panel position="top-right" className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 m-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Visualization Mode</p>
                                <p className="text-xs font-bold text-primary">Hover on branches to see logical paths</p>
                             </Panel>
                          </ReactFlow>
                       </ReactFlowProvider>
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
