
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
  RefreshCw, Database, ShieldCheck, Search
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
import { translateToEnglish } from '@/ai/flows/translate-flow';
import * as Icons from 'lucide-react';

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

const EDGE_COLORS = ['#03CFCB', '#470D67', '#007375', '#f59e0b', '#ef4444', '#3b82f6'];

const ServiceStepNode = ({ data }: any) => {
  return (
    <div 
      className={cn(
        "group relative bg-white border-2 rounded-[1.5rem] p-5 font-bold w-[240px] text-center shadow-xl transition-all duration-500",
        data.isFocused ? "border-accent scale-105 z-50 ring-8 ring-accent/10 opacity-100 grayscale-0" : "border-slate-200 opacity-20 grayscale"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
      
      <div className="absolute -top-4 -left-4 bg-primary text-white size-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg border-4 border-white transition-all">
        {data.dynamicIndex !== undefined ? data.dynamicIndex : data.stepIndex + 1}
      </div>

      <div className="flex flex-col gap-3 py-2">
        <span className="text-xs font-black line-clamp-2 leading-relaxed text-slate-700">{data.label}</span>
        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-8 w-8 bg-slate-50 hover:bg-accent hover:text-white rounded-lg shadow-sm" onClick={data.onEdit}>
            <Edit2 size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 bg-slate-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg shadow-sm" onClick={data.onRemove}>
            <Trash2 size={14} />
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
          if (flow) setSteps(flow.steps || []);
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
    if (ns[idx]) { ns[idx] = { ...ns[idx], ...updates }; setSteps(ns); }
  };

  const handleAddFieldToStep = (stepId: string, type: FormField['type']) => {
    setSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      fields: [...s.fields, { id: `f_${Date.now()}`, type, labelAr: 'حقل جديد', labelEn: 'New Field', required: true, options: [] }]
    } : s));
  };

  const handleAddOption = (sIdx: number, fIdx: number) => {
    const val = prompt(isAr ? "أدخل قيمة الخيار:" : "Enter option value:");
    if (!val) return;
    const ns = [...steps];
    const field = ns[sIdx].fields[fIdx];
    if (!field.options) field.options = [];
    field.options.push(val);
    setSteps(ns);
  };

  const addLogic = (sIdx: number) => {
    const ns = [...steps];
    if (!ns[sIdx].logic) ns[sIdx].logic = [];
    ns[sIdx].logic!.push({ fieldId: '', value: '', targetStepId: '' });
    setSteps(ns);
  };

  // Logic for Path Highlighting
  const pathData = useMemo(() => {
    if (!hoveredEdgeId) return { nodeIds: new Set(), edgeIds: new Set(), dynamicMap: new Map() };
    
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const dynamicMap = new Map<string, number>();

    // Basic BFS to find all upstream and downstream nodes for this edge
    const edgeParts = hoveredEdgeId.split('-');
    const sourceId = edgeParts[1];
    const targetId = edgeParts[2];

    const findPath = (startId: string, currentPath: string[], depth: number) => {
      nodeIds.add(startId);
      dynamicMap.set(startId, depth);
      const step = steps.find(s => s.id === startId);
      if (!step) return;

      const nextIds = [step.defaultNextStepId, ...(step.logic?.map(l => l.targetStepId) || [])].filter(Boolean) as string[];
      nextIds.forEach(id => {
        if (!nodeIds.has(id)) findPath(id, [...currentPath, startId], depth + 1);
      });
    };

    // For simplicity, highlight all nodes if they are in the sequence from step 1
    if (steps[0]) findPath(steps[0].id, [], 1);

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
          label: (hoveredEdgeId && !isActive) ? '' : (isAr ? 'افتراضي' : 'Default'),
          style: { stroke: '#007375', strokeWidth: isActive ? 6 : 2, opacity: hoveredEdgeId ? (isActive ? 1 : 0.1) : 0.8 },
          labelStyle: { fill: '#007375', fontWeight: 900, display: (hoveredEdgeId && !isActive) ? 'none' : 'block' }
        });
      }
      (step.logic || []).forEach((rule, idx) => {
        if (rule.targetStepId) {
          const id = `e-${step.id}-${rule.targetStepId}-${idx}`;
          const isActive = hoveredEdgeId === id;
          e.push({
            id, source: step.id, target: rule.targetStepId, type: 'smoothstep', animated: true,
            label: (hoveredEdgeId && !isActive) ? '' : rule.value,
            style: { stroke: '#470D67', strokeWidth: isActive ? 8 : 3, opacity: hoveredEdgeId ? (isActive ? 1 : 0.1) : 1 },
            labelStyle: { fill: '#470D67', fontWeight: 900, display: (hoveredEdgeId && !isActive) ? 'none' : 'block' }
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
        onEdit: () => { setActiveTab('logic'); document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }); },
        onRemove: () => setSteps(prev => prev.filter(s => s.id !== step.id))
      },
      position: { x: (idx % 2) * 400, y: Math.floor(idx / 2) * 250 },
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
        serviceFlows: [...(db.serviceFlows || []).filter((f: any) => f.id !== id), { id, serviceId: id, steps, isActive: true }]
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
           <h1 className="text-3xl font-black text-primary flex items-center gap-3"><GitBranch /> {isAr ? "محرك التدفقات والعمليات" : "Process Factory"}</h1>
           <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">Back</Button>
              <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-12 font-black shadow-xl">
                 {saving ? <Loader2 className="animate-spin" /> : <Save />} {isAr ? "حفظ" : "Save"}
              </Button>
           </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
           <Card className="rounded-[2rem] shadow-xl border-none overflow-hidden h-fit sticky top-24">
              <CardHeader className="bg-slate-900 text-white p-6"><CardTitle className="text-xs font-black uppercase tracking-widest text-accent">Service Logic</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div className="space-y-4">
                    <div className="relative">
                       <Label className="text-[10px] font-black text-slate-400">TITLE AR</Label>
                       <Input value={serviceInfo.title} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="font-bold pr-10" />
                       <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(serviceInfo.title || '', 'title')}><Sparkles size={16}/></Button>
                    </div>
                    <Input value={serviceInfo.titleEn} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} placeholder="Title EN" />
                 </div>
                 <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black text-slate-400">DOCUMENTS</Label>
                    <div className="flex gap-2">
                       <Input id="new-doc" placeholder="Add Doc..." className="h-8 text-xs" onKeyDown={e => {
                         if(e.key === 'Enter') {
                           const val = (e.target as HTMLInputElement).value;
                           if(val) {
                             setServiceInfo({...serviceInfo, reqsAr: [...(serviceInfo.reqsAr || []), val]});
                             (e.target as HTMLInputElement).value = '';
                           }
                         }
                       }} />
                    </div>
                    <div className="space-y-1">
                       {serviceInfo.reqsAr?.map((r, i) => (
                         <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[10px] font-bold">
                           <span>{r}</span>
                           <X size={10} className="cursor-pointer text-red-400" onClick={() => setServiceInfo({...serviceInfo, reqsAr: serviceInfo.reqsAr?.filter((_, idx) => idx !== i)})} />
                         </div>
                       ))}
                    </div>
                 </div>
                 <Button onClick={addStep} className="w-full dm-gradient-primary rounded-xl font-black">+ Add Step</Button>
              </CardContent>
           </Card>

           <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                 <TabsList className="bg-white border rounded-[1.5rem] p-1 mb-8 shadow-sm">
                    <TabsTrigger value="logic" className="rounded-xl font-black px-12 h-11">Logic Editor</TabsTrigger>
                    <TabsTrigger value="canvas" className="rounded-xl font-black px-12 h-11">Visual Workspace</TabsTrigger>
                 </TabsList>

                 <TabsContent value="logic" className="space-y-6">
                    {steps.map((step, sIdx) => (
                      <Card key={step.id} id={step.id} className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
                         <CardHeader className="bg-slate-900 text-white p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                               <Badge className="bg-accent text-slate-900 h-10 w-10 rounded-2xl flex items-center justify-center text-lg">{sIdx+1}</Badge>
                               <Input value={isAr ? step.titleAr : step.titleEn} onChange={e => isAr ? updateStep(sIdx, {titleAr: e.target.value}) : updateStep(sIdx, {titleEn: e.target.value})} className="bg-white/10 border-none text-white font-black w-80 h-11 text-lg" />
                            </div>
                            <Button variant="ghost" onClick={() => setSteps(steps.filter(s => s.id !== step.id))} className="text-red-400"><Trash2/></Button>
                         </CardHeader>
                         <CardContent className="p-10 grid md:grid-cols-2 gap-12">
                            <div className="space-y-6 border-r pr-10">
                               <h4 className="text-xs font-black uppercase text-primary">Form Fields</h4>
                               <div className="flex flex-wrap gap-2">
                                  {['text', 'number', 'upload', 'date', 'select', 'map'].map(fType => (
                                    <Button key={fType} size="sm" variant="outline" className="text-[9px] font-black" onClick={() => handleAddFieldToStep(step.id, fType as any)}>{fType.toUpperCase()}</Button>
                                  ))}
                               </div>
                               <div className="space-y-4">
                                  {step.fields.map((f, fIdx) => (
                                    <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 group">
                                       <div className="flex gap-2 items-center mb-2">
                                          <Badge className="text-[8px] uppercase">{f.type}</Badge>
                                          <Input value={isAr ? f.labelAr : f.labelEn} onChange={e => {
                                             const nf = [...step.fields]; if(isAr) nf[fIdx].labelAr = e.target.value; else nf[fIdx].labelEn = e.target.value;
                                             updateStep(sIdx, {fields: nf});
                                          }} className="h-8 text-xs font-bold" />
                                          <Button variant="ghost" size="icon" onClick={() => { const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, {fields: nf}); }} className="text-red-400"><X size={14}/></Button>
                                       </div>
                                       {f.type === 'select' && (
                                         <div className="flex flex-wrap gap-2 pt-2 border-t">
                                            {f.options?.map((opt, oIdx) => (
                                              <Badge key={oIdx} variant="outline" className="gap-1 rounded-lg">
                                                {opt} <X size={10} className="cursor-pointer" onClick={() => {
                                                  const nf = [...step.fields]; nf[fIdx].options = nf[fIdx].options?.filter((_, i) => i !== oIdx);
                                                  updateStep(sIdx, {fields: nf});
                                                }}/>
                                              </Badge>
                                            ))}
                                            <Button size="xs" variant="ghost" className="h-6 border-dashed border-2 text-[8px] font-black" onClick={() => handleAddOption(sIdx, fIdx)}>+ Option</Button>
                                         </div>
                                       )}
                                    </div>
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-6">
                               <h4 className="text-xs font-black uppercase text-accent">Routing Logic</h4>
                               <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                  <span className="text-[10px] font-black text-slate-400">DEFAULT NEXT</span>
                                  <Select value={step.defaultNextStepId || 'none'} onValueChange={v => updateStep(sIdx, {defaultNextStepId: v === 'none' ? undefined : v})}>
                                     <SelectTrigger className="w-40 h-10 font-bold bg-white"><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="none">Terminal</SelectItem>
                                        {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                     </SelectContent>
                                  </Select>
                               </div>
                               {step.logic?.map((rule, rIdx) => (
                                 <div key={rIdx} className="p-4 bg-primary/5 rounded-xl border-2 border-primary/10 space-y-4">
                                    <Select value={rule.fieldId} onValueChange={v => { const nl = [...(step.logic || [])]; nl[rIdx].fieldId = v; updateStep(sIdx, {logic: nl}); }}>
                                       <SelectTrigger className="bg-white"><SelectValue placeholder="If Field..." /></SelectTrigger>
                                       <SelectContent>{step.fields.map(f => <SelectItem key={f.id} value={f.id}>{isAr ? f.labelAr : f.labelEn}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                       <Input value={rule.value} onChange={e => { const nl = [...(step.logic || [])]; nl[rIdx].value = e.target.value; updateStep(sIdx, {logic: nl}); }} placeholder="Value..." className="bg-white" />
                                       <Select value={rule.targetStepId} onValueChange={v => { const nl = [...(step.logic || [])]; nl[rIdx].targetStepId = v; updateStep(sIdx, {logic: nl}); }}>
                                          <SelectTrigger className="bg-white"><SelectValue placeholder="Go To..." /></SelectTrigger>
                                          <SelectContent>{steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}</SelectContent>
                                       </Select>
                                    </div>
                                 </div>
                               ))}
                               <Button variant="ghost" onClick={() => addLogic(sIdx)} className="w-full border-dashed border-2">+ Add Branch</Button>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </TabsContent>

                 <TabsContent value="canvas">
                    <Card className="rounded-[3.5rem] overflow-hidden h-[800px] border-4 border-white shadow-2xl relative bg-slate-100">
                       <ReactFlowProvider>
                          <ReactFlow 
                            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
                            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                            fitView
                          >
                             <Background color="#cbd5e1" gap={30} size={1} />
                             <Controls />
                             <MiniMap nodeStrokeWidth={3} zoomable pannable nodeColor="#007375" />
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
