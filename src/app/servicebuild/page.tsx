
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
  ChevronUp, ChevronDown, Sparkles, Network
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Master data mapping for automatic English titles recovery
const MASTER_TITLES_MAP: Record<string, string> = {
  "svc_100": "Get a Permit for Organizing a Promotional Car Event",
  "svc_101": "Municipality Approval for Electrical Service Installations Paths",
  "svc_102": "Get a Permit for a Sewage Tanker",
  "svc_103": "Approval of Print Advertisements, Posters, and Publications",
  "svc_104": "Request to Hold an Activity or Exhibition During Khareef",
  "svc_105": "Registration of Citizens' Requests",
  "svc_106": "Municipal Approval for Sanitary Sewer Service Extensions",
  "svc_107": "Approval for Paving with Interlocking Tiles",
  "svc_108": "Get House Numbering",
  "svc_109": "Building Naming License",
  "svc_127": "Training Higher Education Institution Students",
  "svc_128": "Reconciliation and Settlement Request",
  "svc_119": "Material Destruction Certificate"
};

const ALL_ICON_KEYS = Object.keys(Icons).filter(key => typeof (Icons as any)[key] !== 'undefined');

const EDGE_COLORS = ['#03CFCB', '#470D67', '#007375', '#f59e0b', '#ef4444', '#3b82f6'];

const ServiceStepNode = ({ data }: any) => {
  return (
    <div 
      className={cn(
        "group relative bg-white border-2 rounded-2xl p-4 font-bold w-[220px] text-center shadow-xl transition-all duration-500",
        data.isFocused ? "border-accent scale-105 z-50 ring-8 ring-accent/10" : "border-slate-200 opacity-40 grayscale"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3" />
      
      <div className="absolute -top-4 -left-4 bg-primary text-white size-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg border-4 border-white">
        {data.stepIndex + 1}
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
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<Partial<Service>>({
    title: '', titleEn: '', category: 'elec', iconName: 'FileText',
    fees: '10 OMR', description: '', descriptionEn: '', type: 'workflow',
    reqsAr: [], reqsEn: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data) {
          const flow = (data.serviceFlows || []).find((f: any) => f.id === editId || f.serviceId === editId);
          const svc = (data.services || []).find((s: any) => s.id === editId);
          if (flow) {
            setSteps((flow.steps || []).map((s: any) => ({
              ...s,
              id: s.id || `step_${Math.random()}`,
              fields: (s.fields || []).map((f: any) => ({ ...f, options: f.options || [] })),
              logic: (s.logic || []),
              actionType: s.actionType || 'submit'
            })));
          }
          if (svc) setServiceInfo({ ...svc, titleEn: svc.titleEn || (editId ? MASTER_TITLES_MAP[editId] : '') || '' });
        }
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  // AUTO-SYNC REQUIRED DOCS
  useEffect(() => {
    const autoReqsAr: string[] = [];
    steps.forEach(step => {
      const isDocStep = (step.titleAr || '').includes('مستند') || (step.titleAr || '').includes('طلبات');
      (step.fields || []).forEach(f => {
        if (f.type === 'upload' || isDocStep) {
          if (f.labelAr) autoReqsAr.push(f.labelAr);
        }
      });
    });
    setServiceInfo(prev => ({ ...prev, reqsAr: Array.from(new Set(autoReqsAr)) }));
  }, [steps]);

  const addStep = useCallback(() => {
    const newStep: ServiceStep = {
      id: `step_${Date.now()}`,
      titleAr: isAr ? 'خطوة جديدة' : 'New Step',
      titleEn: 'New Step',
      fields: [],
      logic: [],
      actionType: 'submit'
    };
    setSteps(prev => [...prev, newStep]);
  }, [isAr]);

  const updateStep = (idx: number, updates: Partial<ServiceStep>) => {
    const ns = [...steps];
    if (ns[idx]) {
      ns[idx] = { ...ns[idx], ...updates };
      setSteps(ns);
    }
  };

  const moveStep = (idx: number, direction: 'up' | 'down') => {
    const ns = [...steps];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx >= 0 && targetIdx < ns.length) {
      const temp = ns[idx];
      ns[idx] = ns[targetIdx];
      ns[targetIdx] = temp;
      setSteps(ns);
    }
  };

  // PATH TRACKING LOGIC
  const getDescendantEdges = useCallback((startEdgeId: string, currentEdges: Edge[]) => {
    const descendants = new Set<string>([startEdgeId]);
    const edge = currentEdges.find(e => e.id === startEdgeId);
    if (!edge) return descendants;

    const traverse = (targetId: string) => {
      currentEdges.filter(e => e.source === targetId).forEach(e => {
        if (!descendants.has(e.id)) {
          descendants.add(e.id);
          traverse(e.target);
        }
      });
    };
    traverse(edge.target);
    return descendants;
  }, []);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];
    let logicColorIndex = 0;

    steps.forEach((step) => {
      if (step.defaultNextStepId) {
        e.push({
          id: `e-${step.id}-${step.defaultNextStepId}`,
          source: step.id,
          target: step.defaultNextStepId,
          type: 'smoothstep',
          label: isAr ? 'افتراضي' : 'Default',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#007375' },
          style: { stroke: '#007375', strokeWidth: 4, opacity: 0.8 }
        });
      }
      (step.logic || []).forEach((rule, idx) => {
        if (rule.targetStepId) {
          const color = EDGE_COLORS[logicColorIndex % EDGE_COLORS.length];
          logicColorIndex++;
          e.push({
            id: `e-logic-${step.id}-${rule.targetStepId}-${idx}`,
            source: step.id,
            target: rule.targetStepId,
            type: 'smoothstep',
            label: rule.value || 'Condition',
            animated: true,
            style: { stroke: color, strokeWidth: 5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: color },
            labelStyle: { fill: color, fontWeight: 900 }
          });
        }
      });
    });

    if (hoveredEdgeId) {
      const highlighted = getDescendantEdges(hoveredEdgeId, e);
      return e.map(edge => ({
        ...edge,
        style: { ...edge.style, strokeWidth: highlighted.has(edge.id) ? 10 : 2, opacity: highlighted.has(edge.id) ? 1 : 0.1 },
        label: highlighted.has(edge.id) ? edge.label : ''
      }));
    }

    return e;
  }, [steps, isAr, hoveredEdgeId, getDescendantEdges]);

  const nodes: Node[] = useMemo(() => {
    const highlightedNodeIds = new Set<string>();
    if (hoveredEdgeId) {
      const descendants = getDescendantEdges(hoveredEdgeId, edges);
      descendants.forEach(eid => {
        const edge = edges.find(e => e.id === eid);
        if (edge) { highlightedNodeIds.add(edge.source); highlightedNodeIds.add(edge.target); }
      });
    }

    const total = steps.length;
    const cols = total <= 3 ? 1 : (total <= 8 ? 2 : 3);

    return steps.map((step, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const isFocused = hoveredEdgeId ? highlightedNodeIds.has(step.id) : true;

      return {
        id: step.id,
        type: 'serviceStep',
        data: { 
          stepIndex: idx,
          isFocused,
          label: isAr ? step.titleAr : step.titleEn,
          onEdit: () => { setActiveTab('logic'); setTimeout(() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }), 100); },
          onRemove: () => setSteps(prev => prev.filter(s => s.id !== step.id))
        },
        position: { x: col * 380, y: row * 320 },
      };
    });
  }, [steps, isAr, hoveredEdgeId, edges, getDescendantEdges]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const id = editId || `svc_${Date.now()}`;
      const newService = { ...serviceInfo, id, isActive: true };
      const newFlow = { id, serviceId: id, titleAr: serviceInfo.title, titleEn: serviceInfo.titleEn, steps, isActive: true };
      await updateBin({
        ...db,
        services: [...(db.services || []).filter((s: any) => s.id !== id), newService],
        serviceFlows: [...(db.serviceFlows || []).filter((f: any) => f.id !== id), newFlow]
      });
      toast({ title: "Saved Successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3"><GitBranch className="text-accent" /> {isAr ? "محرك التدفقات والعمليات" : "Neural Logic Engine"}</h1>
           <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">Back</Button>
              <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-10 font-black shadow-xl">
                 {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                 {isAr ? "حفظ التغييرات" : "Save Logic"}
              </Button>
           </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-[2rem] shadow-xl border-none overflow-hidden sticky top-24">
                 <CardHeader className="bg-primary text-white"><CardTitle className="text-xs font-black uppercase flex items-center gap-2"><Settings size={14}/> {isAr ? "إعدادات الخدمة" : "Service Config"}</CardTitle></CardHeader>
                 <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase">Title AR</Label>
                       <Input value={serviceInfo.title || ''} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="font-bold h-10" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase">Title EN</Label>
                       <Input value={serviceInfo.titleEn || ''} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} className="h-10" />
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                       <Label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "المستندات المطلوبة (تلقائي)" : "Required Docs (Auto)"}</Label>
                       <div className="space-y-2">
                          {(serviceInfo.reqsAr || []).map((req, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border text-[10px] font-bold text-slate-600">
                               <div className="size-2 bg-accent rounded-full" /> {req}
                            </div>
                          ))}
                       </div>
                    </div>
                    <Button onClick={addStep} className="w-full h-14 rounded-2xl dm-gradient-primary font-black shadow-lg mt-4">+ Add Step</Button>
                 </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-3 space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                 <TabsList className="bg-white border rounded-full p-1 mb-8">
                    <TabsTrigger value="logic" className="rounded-full font-black px-10"><GitBranch size={16} className="ml-2"/> {isAr ? "بناء المنطق" : "Editor"}</TabsTrigger>
                    <TabsTrigger value="canvas" className="rounded-full font-black px-10"><Network size={16} className="ml-2"/> {isAr ? "المخطط التفاعلي" : "Visual Map"}</TabsTrigger>
                 </TabsList>

                 <TabsContent value="logic" className="space-y-6">
                    {steps.map((step, sIdx) => (
                      <Card key={step.id} id={step.id} className="rounded-[2.5rem] shadow-sm border-none overflow-hidden animate-in slide-in-from-bottom-4">
                         <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                               <Badge className="bg-accent text-slate-900 font-black h-8 w-8 rounded-xl flex items-center justify-center">{sIdx+1}</Badge>
                               <Input value={step.titleAr} onChange={e => updateStep(sIdx, {titleAr: e.target.value})} className="bg-white/10 border-none text-white font-black w-64" />
                            </div>
                            <div className="flex gap-2">
                               <Button variant="ghost" size="icon" onClick={() => moveStep(sIdx, 'up')} className="text-white/40 hover:text-accent"><ChevronUp/></Button>
                               <Button variant="ghost" size="icon" onClick={() => moveStep(sIdx, 'down')} className="text-white/40 hover:text-accent"><ChevronDown/></Button>
                               <Button variant="ghost" size="icon" onClick={() => setSteps(steps.filter(s => s.id !== step.id))} className="text-red-400 hover:bg-red-500/20"><Trash2/></Button>
                            </div>
                         </CardHeader>
                         <CardContent className="p-8 grid md:grid-cols-2 gap-10">
                            <div className="space-y-6 border-r pr-10">
                               <h4 className="text-xs font-black uppercase text-primary tracking-widest">Form Fields</h4>
                               <div className="flex flex-wrap gap-2">
                                  {['text', 'number', 'upload', 'date', 'select', 'map'].map(type => (
                                    <Button key={type} size="sm" variant="outline" className="rounded-xl font-bold text-[10px]" onClick={() => {
                                      const nf = [...(step.fields || []), { id: `f_${Date.now()}`, type, labelAr: '', labelEn: '', required: true }];
                                      updateStep(sIdx, { fields: nf as any });
                                    }}>{type.toUpperCase()}</Button>
                                  ))}
                               </div>
                               <div className="space-y-3">
                                  {(step.fields || []).map((f, fIdx) => (
                                    <div key={f.id} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border">
                                       <Badge variant="secondary" className="text-[8px] uppercase">{f.type}</Badge>
                                       <Input value={f.labelAr} onChange={e => {
                                         const nf = [...step.fields]; nf[fIdx].labelAr = e.target.value; updateStep(sIdx, {fields: nf});
                                       }} className="h-8 text-xs font-bold" placeholder="Label AR" />
                                       <Button variant="ghost" size="icon" onClick={() => {
                                         const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, {fields: nf});
                                       }} className="text-red-400 h-8 w-8"><X size={14}/></Button>
                                    </div>
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-6">
                               <h4 className="text-xs font-black uppercase text-accent tracking-widest">Routing Logic</h4>
                               <div className="space-y-4">
                                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                                     <span className="text-[10px] font-black text-slate-400">DEFAULT NEXT</span>
                                     <Select value={step.defaultNextStepId || 'none'} onValueChange={v => updateStep(sIdx, {defaultNextStepId: v === 'none' ? undefined : v})}>
                                        <SelectTrigger className="w-40 h-10 font-bold bg-white"><SelectValue placeholder="..." /></SelectTrigger>
                                        <SelectContent>
                                           <SelectItem value="none">None</SelectItem>
                                           {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{s.titleAr}</SelectItem>)}
                                        </SelectContent>
                                     </Select>
                                  </div>
                                  {(step.logic || []).map((rule, rIdx) => (
                                    <div key={rIdx} className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4 relative group">
                                       <div className="flex justify-between items-center text-[10px] font-black text-primary">
                                          <span>IF FIELD EQUALS</span>
                                          <Button variant="ghost" size="icon" onClick={() => {
                                            const nl = [...(step.logic || [])]; nl.splice(rIdx, 1); updateStep(sIdx, {logic: nl});
                                          }} className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></Button>
                                       </div>
                                       <div className="grid grid-cols-2 gap-3">
                                          <Input value={rule.value} onChange={e => {
                                            const nl = [...(step.logic || [])]; nl[rIdx].value = e.target.value; updateStep(sIdx, {logic: nl});
                                          }} className="h-10 text-xs font-bold" placeholder="Value" />
                                          <Select value={rule.targetStepId} onValueChange={v => {
                                            const nl = [...(step.logic || [])]; nl[rIdx].targetStepId = v; updateStep(sIdx, {logic: nl});
                                          }}>
                                             <SelectTrigger className="h-10 text-xs font-bold"><SelectValue placeholder="Go to..." /></SelectTrigger>
                                             <SelectContent>
                                                {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{s.titleAr}</SelectItem>)}
                                             </SelectContent>
                                          </Select>
                                       </div>
                                    </div>
                                  ))}
                                  <Button variant="ghost" onClick={() => {
                                    const nl = [...(step.logic || []), { fieldId: '', value: '', targetStepId: '' }];
                                    updateStep(sIdx, { logic: nl });
                                  }} className="w-full border-dashed border-2 text-[10px] font-black text-accent">+ Add Branch</Button>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </TabsContent>

                 <TabsContent value="canvas">
                    <Card className="rounded-[3rem] overflow-hidden h-[750px] border shadow-2xl relative bg-slate-100">
                       <ReactFlowProvider>
                          <ReactFlow 
                            nodes={nodes} 
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
                            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                            fitView
                          >
                             <Background />
                             <Controls />
                             <MiniMap nodeStrokeWidth={3} zoomable pannable />
                             <FlowControls />
                          </ReactFlow>
                       </ReactFlowProvider>
                       <div className="absolute bottom-6 left-6 z-10 pointer-events-none max-w-xs">
                          <div className="bg-white/90 backdrop-blur-md p-5 rounded-[2rem] border-2 border-accent/20 shadow-2xl">
                             <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Path Insight Engine</p>
                             <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Hover over any path to visualize the full citizen journey and conditional branches.</p>
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

const FlowControls = () => {
  const { fitView } = useReactFlow();
  return (
    <Panel position="top-right" className="flex gap-2 bg-white/90 backdrop-blur-md p-3 rounded-2xl border shadow-xl">
       <Button variant="outline" size="sm" onClick={() => fitView()} className="rounded-xl font-black gap-2 h-10 px-6"><Maximize size={16}/> Fit View</Button>
    </Panel>
  );
};

export default function WorkflowEngine() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
