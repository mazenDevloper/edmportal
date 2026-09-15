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

const ALL_ICON_KEYS = Object.keys(Icons).filter(key => typeof (Icons as any)[key] !== 'undefined');

const EDGE_COLORS = ['#03CFCB', '#470D67', '#007375', '#f59e0b', '#ef4444', '#3b82f6'];

const ServiceStepNode = ({ data }: any) => {
  return (
    <div 
      className={cn(
        "group relative bg-white border-2 rounded-[1.5rem] p-5 font-bold w-[240px] text-center shadow-xl transition-all duration-500",
        data.isFocused ? "border-accent scale-105 z-50 ring-8 ring-accent/10" : "border-slate-200 opacity-20 grayscale"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3" />
      
      <div className="absolute -top-4 -left-4 bg-primary text-white size-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg border-4 border-white">
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
          if (svc) setServiceInfo({ ...svc });
        }
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  // AUTO-SYNC REQUIRED DOCS
  useEffect(() => {
    const autoReqsAr: string[] = [];
    const autoReqsEn: string[] = [];
    steps.forEach(step => {
      (step.fields || []).forEach(f => {
        if (f.type === 'upload') {
          if (f.labelAr) autoReqsAr.push(f.labelAr);
          if (f.labelEn || f.labelAr) autoReqsEn.push(f.labelEn || f.labelAr);
        }
      });
    });
    setServiceInfo(prev => ({ 
      ...prev, 
      reqsAr: Array.from(new Set([...(prev.reqsAr || []), ...autoReqsAr])).filter(Boolean),
      reqsEn: Array.from(new Set([...(prev.reqsEn || []), ...autoReqsEn])).filter(Boolean)
    }));
  }, [steps]);

  const handleAiTranslate = async (text: string, fieldKey: string) => {
    if (!text) return;
    setAiLoading(fieldKey);
    try {
      const { translatedText } = await translateToEnglish({ text });
      setServiceInfo(prev => ({ ...prev, [fieldKey === 'title' ? 'titleEn' : 'descriptionEn']: translatedText }));
      toast({ title: isAr ? "تمت الترجمة بنجاح" : "Translation complete" });
    } catch (e) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

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
        style: { ...edge.style, strokeWidth: highlighted.has(edge.id) ? 10 : 2, opacity: highlighted.has(edge.id) ? 1 : 0.05 },
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
    let cols = 3;
    if (total <= 3) cols = 1;
    else if (total <= 6) cols = 2;

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
          label: isAr ? step.titleAr : (step.titleEn || step.titleAr),
          onEdit: () => { setActiveTab('logic'); setTimeout(() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }), 100); },
          onRemove: () => setSteps(prev => prev.filter(s => s.id !== step.id))
        },
        position: { x: col * 350, y: row * 300 },
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

  const handleAddOption = (sIdx: number, fIdx: number) => {
    const val = prompt(isAr ? "أدخل قيمة الخيار:" : "Enter option value:");
    if (!val) return;
    
    const ns = [...steps];
    const field = ns[sIdx].fields[fIdx];
    field.options = [...(field.options || []), val];
    setSteps(ns);
  };

  const handleAddVisualChoice = (sIdx: number, fIdx: number) => {
    const icon = prompt(isAr ? "اسم الأيقونة (مثال: User, Building2):" : "Icon name (e.g. User, Building2):", "LayoutGrid");
    const label = prompt(isAr ? "نص الخيار:" : "Option Label:");
    if (!label) return;
    
    const ns = [...steps];
    const field = ns[sIdx].fields[fIdx];
    field.options = [...(field.options || []), `${icon}|${label}`];
    setSteps(ns);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
           <h1 className="text-3xl font-black text-primary flex items-center gap-3"><GitBranch className="text-accent" /> {isAr ? "محرك التدفقات والعمليات" : "Process Logic Factory"}</h1>
           <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold h-12 px-8">Back</Button>
              <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-12 font-black shadow-xl h-12">
                 {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                 {isAr ? "حفظ ومزامنة" : "Save & Sync"}
              </Button>
           </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden sticky top-24">
                 <CardHeader className="bg-slate-900 text-white p-6">
                    <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-accent"><Settings size={14}/> {isAr ? "إعدادات الخدمة" : "Service Settings"}</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                       <div className="relative">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "العنوان بالعربية" : "Title (AR)"}</Label>
                          <Input value={serviceInfo.title || ''} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="font-bold h-11 pr-10 border-slate-200" />
                          <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(serviceInfo.title || '', 'title')} disabled={aiLoading === 'title'}>
                             {aiLoading === 'title' ? <Loader2 className="animate-spin size-4"/> : <Sparkles size={16}/>}
                          </Button>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title (EN)</Label>
                          <Input value={serviceInfo.titleEn || ''} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} className="h-11 border-slate-200" />
                       </div>
                    </div>
                    <div className="space-y-4 pt-4">
                       <div className="relative">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "الوصف المختصر (AR)" : "Description (AR)"}</Label>
                          <Textarea value={serviceInfo.description || ''} onChange={e => setServiceInfo({...serviceInfo, description: e.target.value})} className="font-bold text-xs border-slate-200 min-h-[80px]" />
                          <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(serviceInfo.description || '', 'desc')} disabled={aiLoading === 'description'}>
                             <Sparkles size={16}/>
                          </Button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "الفئة" : "Category"}</Label>
                          <Select value={serviceInfo.category} onValueChange={v => setServiceInfo({...serviceInfo, category: v})}>
                             <SelectTrigger className="h-10 font-bold border-slate-200"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                {Object.entries(CAT_CONFIG).map(([id, conf]) => (
                                  <SelectItem key={id} value={id}>{isAr ? conf.labelAr : conf.labelEn}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "الرسوم" : "Fees"}</Label>
                          <Input value={serviceInfo.fees || ''} onChange={e => setServiceInfo({...serviceInfo, fees: e.target.value})} className="h-10 font-black text-emerald-600 border-slate-200" />
                       </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "المستندات المطلوبة" : "Required Docs"}</Label>
                       <div className="space-y-2">
                          {(isAr ? serviceInfo.reqsAr : serviceInfo.reqsEn)?.map((req, i) => (
                            <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border text-[10px] font-black text-primary group">
                               <div className="size-2 bg-accent rounded-full" /> {req}
                               <Trash2 size={12} className="ml-auto text-red-300 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={() => {
                                  const nr = (serviceInfo.reqsAr || []).filter((_, idx) => idx !== i);
                                  setServiceInfo({...serviceInfo, reqsAr: nr, reqsEn: nr});
                               }} />
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setServiceInfo({...serviceInfo, reqsAr: [...(serviceInfo.reqsAr || []), 'New Document']})} className="w-full h-8 text-[9px] border-dashed">+ {isAr ? 'إضافة يدوي' : 'Add Manual'}</Button>
                       </div>
                    </div>
                    <Button onClick={addStep} className="w-full h-14 rounded-2xl dm-gradient-primary font-black shadow-lg mt-4">+ Add Phase</Button>
                 </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-3 space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                 <TabsList className="bg-white border rounded-[1.5rem] p-1 mb-8 shadow-sm">
                    <TabsTrigger value="logic" className="rounded-xl font-black px-12 h-11"><GitBranch size={16} className="ml-2"/> {isAr ? "بناء المنطق" : "Logic Editor"}</TabsTrigger>
                    <TabsTrigger value="canvas" className="rounded-xl font-black px-12 h-11"><Network size={16} className="ml-2"/> {isAr ? "المخطط التفاعلي" : "Visual Orchestrator"}</TabsTrigger>
                 </TabsList>

                 <TabsContent value="logic" className="space-y-6">
                    {steps.map((step, sIdx) => (
                      <Card key={step.id} id={step.id} className="rounded-[2.5rem] shadow-xl border-none overflow-hidden animate-in slide-in-from-bottom-4">
                         <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                               <Badge className="bg-accent text-slate-900 font-black h-10 w-10 rounded-2xl flex items-center justify-center text-lg">{sIdx+1}</Badge>
                               <Input value={isAr ? step.titleAr : (step.titleEn || step.titleAr)} onChange={e => isAr ? updateStep(sIdx, {titleAr: e.target.value}) : updateStep(sIdx, {titleEn: e.target.value})} className="bg-white/10 border-none text-white font-black w-80 h-11 text-lg" />
                            </div>
                            <div className="flex gap-2">
                               <Button variant="ghost" size="icon" onClick={() => moveStep(sIdx, 'up')} className="text-white/40 hover:text-accent h-10 w-10"><ChevronUp/></Button>
                               <Button variant="ghost" size="icon" onClick={() => moveStep(sIdx, 'down')} className="text-white/40 hover:text-accent h-10 w-10"><ChevronDown/></Button>
                               <Button variant="ghost" size="icon" onClick={() => setSteps(steps.filter(s => s.id !== step.id))} className="text-red-400 hover:bg-red-500/20 h-10 w-10"><Trash2/></Button>
                            </div>
                         </CardHeader>
                         <CardContent className="p-10 grid md:grid-cols-2 gap-12">
                            <div className="space-y-8 border-r pr-10">
                               <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2"><LayoutGrid size={14}/> {isAr ? "حقول مدخلات المرحلة" : "Form Field Factory"}</h4>
                               <div className="flex flex-wrap gap-2">
                                  {[
                                    {id: 'text', icon: <Type size={12}/>}, 
                                    {id: 'number', icon: <Hash size={12}/>}, 
                                    {id: 'upload', icon: <Upload size={12}/>}, 
                                    {id: 'date', icon: <Calendar size={12}/>}, 
                                    {id: 'select', icon: <List size={12}/>}, 
                                    {id: 'visual_choice', icon: <MousePointer2 size={12}/>, labelAr: 'خيار بصري'},
                                    {id: 'map', icon: <MapPin size={12}/>}
                                  ].map(fType => (
                                    <Button key={fType.id} size="sm" variant="outline" className="rounded-xl font-black text-[9px] h-9 gap-2 border-slate-200" onClick={() => {
                                      const nf = [...(step.fields || []), { id: `f_${Date.now()}`, type: fType.id as any, labelAr: '', labelEn: '', required: true, options: [] }];
                                      updateStep(sIdx, { fields: nf });
                                    }}>
                                      {fType.icon} {fType.labelAr || fType.id.toUpperCase()}
                                    </Button>
                                  ))}
                               </div>
                               <div className="space-y-4">
                                  {(step.fields || []).map((f, fIdx) => (
                                    <div key={f.id} className="p-5 bg-slate-50/50 rounded-2xl border-2 border-slate-100 space-y-4 group hover:border-accent/30 transition-all">
                                       <div className="flex gap-3 items-center">
                                          <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-1">{f.type}</Badge>
                                          <Input 
                                            value={isAr ? f.labelAr : f.labelEn} 
                                            onChange={e => {
                                              const nf = [...step.fields]; if (isAr) nf[fIdx].labelAr = e.target.value; else nf[fIdx].labelEn = e.target.value;
                                              updateStep(sIdx, {fields: nf});
                                            }} 
                                            className="h-9 text-xs font-black bg-white" 
                                            placeholder={isAr ? "تسمية الحقل (مثال: نوع الهوية)" : "Field Label"} 
                                          />
                                          <Button variant="ghost" size="icon" onClick={() => {
                                            const nf = step.fields.filter(fi => fi.id !== f.id); updateStep(sIdx, {fields: nf});
                                          }} className="text-red-400 h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></Button>
                                       </div>

                                       {f.type === 'select' && (
                                         <div className="space-y-3 pl-6 border-l-4 border-accent/20">
                                            <div className="flex flex-wrap gap-2">
                                               {(f.options || []).map((opt, oIdx) => (
                                                 <Badge key={oIdx} className="bg-white border-2 border-slate-200 text-slate-700 font-bold gap-2 py-1.5 px-3 rounded-xl shadow-sm">
                                                    {opt}
                                                    <X size={12} className="cursor-pointer text-red-400" onClick={() => {
                                                       const nf = [...step.fields]; nf[fIdx].options = nf[fIdx].options?.filter((_, i) => i !== oIdx);
                                                       updateStep(sIdx, {fields: nf});
                                                    }}/>
                                                 </Badge>
                                               ))}
                                               <Button size="xs" variant="ghost" className="h-8 border-dashed border-2 rounded-xl text-[9px] font-black text-accent" onClick={() => handleAddOption(sIdx, fIdx)}>+ {isAr ? "إضافة خيار" : "Add Option"}</Button>
                                            </div>
                                         </div>
                                       )}

                                       {f.type === 'visual_choice' && (
                                         <div className="space-y-3 pl-6 border-l-4 border-accent/20">
                                            <div className="grid grid-cols-2 gap-2">
                                               {(f.options || []).map((opt, oIdx) => {
                                                 const [icon, label] = opt.split('|');
                                                 return (
                                                  <div key={oIdx} className="bg-white p-3 rounded-xl border flex items-center gap-3 relative group/opt">
                                                     {React.createElement((Icons as any)[icon] || Icons.LayoutGrid, { size: 14, className: 'text-primary' })}
                                                     <span className="text-[10px] font-black">{label}</span>
                                                     <X size={10} className="absolute top-1 right-1 text-red-300 cursor-pointer opacity-0 group-hover/opt:opacity-100" onClick={() => {
                                                       const nf = [...step.fields]; nf[fIdx].options = nf[fIdx].options?.filter((_, i) => i !== oIdx);
                                                       updateStep(sIdx, {fields: nf});
                                                     }} />
                                                  </div>
                                                 );
                                               })}
                                               <Button size="xs" variant="ghost" className="h-10 border-dashed border-2 rounded-xl text-[9px] font-black text-accent flex flex-col" onClick={() => handleAddVisualChoice(sIdx, fIdx)}>
                                                  <MousePointer2 size={12} />
                                                  {isAr ? "إضافة خيار بصري" : "Add Visual"}
                                               </Button>
                                            </div>
                                         </div>
                                       )}
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-8">
                               <h4 className="text-xs font-black uppercase text-accent tracking-[0.2em] flex items-center gap-2"><GitBranch size={14}/> {isAr ? "منطق الانتقال والموصلات" : "Route Orchestration"}</h4>
                               <div className="space-y-5">
                                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "المسار الافتراضي" : "DEFAULT PATH"}</span>
                                     <Select value={step.defaultNextStepId || 'none'} onValueChange={v => updateStep(sIdx, {defaultNextStepId: v === 'none' ? undefined : v})}>
                                        <SelectTrigger className="w-48 h-10 font-bold bg-white rounded-xl"><SelectValue placeholder="..." /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                           <SelectItem value="none">Terminal Point</SelectItem>
                                           {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : (s.titleEn || s.titleAr)}</SelectItem>)}
                                        </SelectContent>
                                     </Select>
                                  </div>
                                  
                                  {(step.logic || []).map((rule, rIdx) => (
                                    <div key={rIdx} className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/10 space-y-5 relative group transition-all hover:bg-primary/10">
                                       <div className="flex justify-between items-center text-[9px] font-black text-primary uppercase tracking-widest">
                                          <span>{isAr ? "قاعدة شرطية ذكية" : "NEURAL BRANCH RULE"}</span>
                                          <Button variant="ghost" size="icon" onClick={() => {
                                            const nl = [...(step.logic || [])]; nl.splice(rIdx, 1); updateStep(sIdx, {logic: nl});
                                          }} className="h-7 w-7 text-red-400 opacity-0 group-hover:opacity-100"><X size={16}/></Button>
                                       </div>
                                       <div className="space-y-4">
                                          <div className="space-y-2">
                                             <Label className="text-[9px] font-black text-slate-400 uppercase">{isAr ? "إذا كان الحقل" : "IF FIELD"}</Label>
                                             <Select value={rule.fieldId} onValueChange={v => {
                                               const nl = [...(step.logic || [])]; nl[rIdx].fieldId = v; updateStep(sIdx, {logic: nl});
                                             }}>
                                                <SelectTrigger className="h-10 bg-white font-bold rounded-xl"><SelectValue placeholder="..." /></SelectTrigger>
                                                <SelectContent className="rounded-2xl">
                                                   {step.fields.map(f => <SelectItem key={f.id} value={f.id}>{isAr ? f.labelAr : (f.labelEn || f.labelAr)}</SelectItem>)}
                                                </SelectContent>
                                             </Select>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                             <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-slate-400 uppercase">{isAr ? "يساوي" : "EQUALS"}</Label>
                                                <Input value={rule.value} onChange={e => {
                                                   const nl = [...(step.logic || [])]; nl[rIdx].value = e.target.value; updateStep(sIdx, {logic: nl});
                                                }} className="h-10 font-bold bg-white rounded-xl" placeholder="Value..." />
                                             </div>
                                             <div className="space-y-2">
                                                <Label className="text-[9px] font-black text-slate-400 uppercase">{isAr ? "اذهب إلى" : "GO TO"}</Label>
                                                <Select value={rule.targetStepId} onValueChange={v => {
                                                  const nl = [...(step.logic || [])]; nl[rIdx].targetStepId = v; updateStep(sIdx, {logic: nl});
                                                }}>
                                                   <SelectTrigger className="h-10 bg-white font-bold rounded-xl"><SelectValue placeholder="..." /></SelectTrigger>
                                                   <SelectContent className="rounded-2xl">
                                                      {steps.filter(s => s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : (s.titleEn || s.titleAr)}</SelectItem>)}
                                                   </SelectContent>
                                                </Select>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                                  <Button variant="ghost" onClick={() => {
                                    const nl = [...(step.logic || []), { fieldId: '', value: '', targetStepId: '' }];
                                    updateStep(sIdx, { logic: nl });
                                  }} className="w-full border-dashed border-2 rounded-[1.5rem] h-14 font-black text-accent border-accent/20 hover:bg-accent/5 hover:border-accent transition-all">+ Add Logic Node</Button>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                    ))}
                 </TabsContent>

                 <TabsContent value="canvas">
                    <Card className="rounded-[3.5rem] overflow-hidden h-[800px] border-4 border-white shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative bg-slate-100">
                       <ReactFlowProvider>
                          <ReactFlow 
                            nodes={nodes} 
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
                            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                            fitView
                          >
                             <Background color="#cbd5e1" gap={30} size={1} />
                             <Controls />
                             <MiniMap nodeStrokeWidth={3} zoomable pannable nodeColor="#007375" maskColor="rgba(255, 255, 255, 0.8)" />
                             <FlowControls />
                          </ReactFlow>
                       </ReactFlowProvider>
                       <div className="absolute bottom-10 left-10 z-10 pointer-events-none max-w-sm">
                          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-accent/30 shadow-2xl">
                             <div className="flex items-center gap-3 mb-3">
                                <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Flow Path Intelligence</p>
                             </div>
                             <p className="text-[11px] text-slate-500 font-bold leading-loose">قم بتمرير الماوس فوق أي مسار لتسليط الضوء على رحلة المواطن الكاملة وفهم الفروع الشرطية والتبعيات التقنية.</p>
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
    <Panel position="top-right" className="flex gap-2 bg-white/90 backdrop-blur-md p-4 rounded-3xl border shadow-2xl">
       <Button variant="outline" size="sm" onClick={() => fitView()} className="rounded-2xl font-black gap-2 h-11 px-8 border-slate-200"><Maximize size={18}/> Fit View</Button>
    </Panel>
  );
};

export default function WorkflowEngine() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-accent" size={48} /></div>}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
