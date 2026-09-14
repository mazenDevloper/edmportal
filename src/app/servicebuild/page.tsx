
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
  CreditCard, Settings, Loader2, GitBranch, ArrowRight,
  MoveUp, MoveDown, Search, Link as LinkIcon, Eye, Network,
  Maximize, LayoutGrid, Edit2, Hash, List, MapPin, FileText, Image as ImageIcon,
  ChevronUp, ChevronDown, Sparkles
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
  "svc_119": "Material Destruction Certificate",
  "svc_113": "Request Road Cutting or Perforation Permit",
  "svc_115": "Request Road and Complex Lighting Plans Approval",
  "svc_116": "License for the Installation of Car Park Shelters"
};

// Extract valid icons safely
const ALL_ICON_KEYS = Object.keys(Icons).filter(key => 
  key !== 'createLucideIcon' && 
  key !== 'LucideIcon' && 
  typeof (Icons as any)[key] !== 'undefined'
);

const EDGE_COLORS = [
  '#be123c', '#7e22ce', '#c2410c', '#1d4ed8', '#047857', '#a21caf', '#b91c1c', '#4338ca',
];

const ServiceStepNode = ({ data }: any) => {
  return (
    <div 
      className="group relative bg-white text-[#007375] border-2 border-[#007375] rounded-2xl p-4 font-bold w-[220px] text-center shadow-xl transition-all duration-300"
      style={{ opacity: data.isFocused === false ? 0.1 : 1 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#007375] !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-[#007375] !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#007375] !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-[#007375] !w-3 !h-3" />
      
      <div className="absolute -top-4 -left-4 bg-[#470D67] text-white size-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg border-4 border-white">
        {data.stepIndex + 1}
      </div>

      <div className="flex flex-col gap-3 py-2">
        <span className="text-xs font-black line-clamp-2 leading-relaxed">{data.label}</span>
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
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<Partial<Service>>({
    title: '', titleEn: '', category: 'elec', iconName: 'FileText',
    fees: '10 OMR', description: '', descriptionEn: '', type: 'workflow', linkUrl: '',
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
            const sanitizedSteps = (flow.steps || []).filter(Boolean).map((s: any) => ({
              ...s,
              id: s.id || `step_${Math.random()}`,
              titleAr: s.titleAr || '',
              titleEn: s.titleEn || '',
              fields: (s.fields || []).filter(Boolean).map((f: any) => ({ ...f, options: f.options || [] })),
              logic: (s.logic || []).filter(Boolean),
              actionType: s.actionType || 'submit'
            }));
            setSteps(sanitizedSteps);
          }
          
          if (svc) {
            setServiceInfo({
              ...svc,
              titleEn: svc.titleEn || (editId ? MASTER_TITLES_MAP[editId] : '') || '', // Smart Title EN recovery
              type: svc.type || 'workflow',
              reqsAr: svc.reqsAr || [],
              reqsEn: svc.reqsEn || svc.reqsAr || []
            });
          }
        }
      }).catch(err => {
        console.error("Load error:", err);
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  // AUTO-SYNC LOGIC for Required Docs
  useEffect(() => {
    const autoReqsAr: string[] = [];
    const autoReqsEn: string[] = [];

    steps.forEach(step => {
      const stepTitleAr = (step.titleAr || '').toLowerCase();
      const stepTitleEn = (step.titleEn || '').toLowerCase();
      const isDocStep = stepTitleAr.includes('مستند') || stepTitleAr.includes('وثائق') || 
                        stepTitleAr.includes('طلبات') || stepTitleEn.includes('doc') || 
                        stepTitleEn.includes('requirement');

      (step.fields || []).forEach(field => {
        if (field.type === 'upload' || isDocStep) {
          if (field.labelAr) autoReqsAr.push(field.labelAr);
          if (field.labelEn) autoReqsEn.push(field.labelEn);
        }
      });
    });

    if (autoReqsAr.length > 0 || autoReqsEn.length > 0) {
      setServiceInfo(prev => ({
        ...prev,
        reqsAr: Array.from(new Set(autoReqsAr)),
        reqsEn: Array.from(new Set(autoReqsEn))
      }));
    }
  }, [steps]);

  useEffect(() => {
    if (activeTab === 'canvas') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [activeTab]);

  const handleAiTranslate = async (text: string, target: 'title' | 'desc') => {
    if (!text) return;
    setAiLoading(target);
    try {
      const { translatedText } = await translateToEnglish({ text });
      if (target === 'title') setServiceInfo(prev => ({ ...prev, titleEn: translatedText }));
      else if (target === 'desc') setServiceInfo(prev => ({ ...prev, descriptionEn: translatedText }));
      toast({ title: isAr ? "تمت الترجمة الذكية" : "AI Translation Done" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
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
    if (targetIdx < 0 || targetIdx >= ns.length) return;
    
    const temp = ns[idx];
    ns[idx] = ns[targetIdx];
    ns[targetIdx] = temp;
    setSteps(ns);
  };

  const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));

  const addFieldToStep = (stepId: string, type: FormField['type']) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { 
      ...s, 
      fields: [...(s.fields || []), {
        id: `field_${Date.now()}`, 
        type, 
        labelAr: '', 
        labelEn: '', 
        required: true,
        options: (type === 'select' || type === 'multichoice') ? [] : undefined
      }] 
    } : s));
  };

  const addLogic = (stepIdx: number) => {
    const ns = [...steps];
    if (ns[stepIdx]) {
      const logic = ns[stepIdx].logic || [];
      ns[stepIdx].logic = [...logic, { fieldId: '', value: '', targetStepId: '' }];
      setSteps(ns);
    }
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
        reqsAr: serviceInfo.reqsAr || [],
        reqsEn: serviceInfo.reqsEn || serviceInfo.reqsAr || [],
      };

      const newFlow: ServiceFlow = {
        id: newId, 
        serviceId: newId, 
        titleAr: serviceInfo.title || '', 
        titleEn: serviceInfo.titleEn || '',
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

      toast({ title: isAr ? "تم حفظ التغييرات" : "Changes Saved" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to sync data." });
    } finally {
      setSaving(false);
    }
  };

  const filteredIcons = useMemo(() => {
    const query = iconSearch.toLowerCase();
    if (!query) return ALL_ICON_KEYS.slice(0, 48);
    return ALL_ICON_KEYS.filter(icon => icon.toLowerCase().includes(query)).slice(0, 48);
  }, [iconSearch]);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];
    let logicColorIndex = 0;

    (steps || []).filter(Boolean).forEach((step) => {
      if (step.defaultNextStepId) {
        const edgeId = `e-${step.id}-${step.defaultNextStepId}`;
        const isHovered = hoveredEdgeId === edgeId;
        const otherHovered = hoveredEdgeId && hoveredEdgeId !== edgeId;

        e.push({
          id: edgeId,
          source: step.id,
          target: step.defaultNextStepId,
          type: 'smoothstep',
          label: isAr ? 'افتراضي' : 'Default',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#007375' },
          style: { 
            stroke: '#007375', 
            strokeWidth: isHovered ? 8 : 4, 
            opacity: otherHovered ? 0.05 : 0.8,
            transition: 'opacity 0.2s, stroke-width 0.2s'
          }
        });
      }

      (step.logic || []).filter(Boolean).forEach((rule, idx) => {
        if (rule.targetStepId) {
          const edgeId = `e-logic-${step.id}-${rule.targetStepId}-${idx}`;
          const isHovered = hoveredEdgeId === edgeId;
          const otherHovered = hoveredEdgeId && hoveredEdgeId !== edgeId;
          
          const color = EDGE_COLORS[logicColorIndex % EDGE_COLORS.length];
          logicColorIndex++;

          const targetField = (step.fields || []).find(f => f.id === rule.fieldId);
          const fieldLabel = isAr ? targetField?.labelAr : targetField?.labelEn;
          const conditionLabel = fieldLabel ? `${fieldLabel} = ${rule.value}` : `${rule.value}`;

          e.push({
            id: edgeId,
            source: step.id,
            target: rule.targetStepId,
            type: 'smoothstep',
            label: conditionLabel,
            animated: true,
            style: { 
              stroke: color, 
              strokeWidth: isHovered ? 10 : 5,
              opacity: otherHovered ? 0.05 : 1,
              transition: 'opacity 0.2s, stroke-width 0.2s'
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: color },
            labelStyle: { fill: color, fontWeight: 900, fontSize: isHovered ? '16px' : '11px' },
            labelBgPadding: [10, 6],
            labelBgBorderRadius: 6,
            labelBgStyle: { fill: '#fff', fillOpacity: 0.95, stroke: color, strokeWidth: 2 }
          });
        }
      });
    });
    return e;
  }, [steps, isAr, hoveredEdgeId]);

  const nodes: Node[] = useMemo(() => {
    const hoveredEdge = hoveredEdgeId ? edges.find(e => e.id === hoveredEdgeId) : null;
    const connectedNodeIds = hoveredEdge ? [hoveredEdge.source, hoveredEdge.target] : null;

    const totalNodes = (steps || []).filter(Boolean).length;
    // SMART DYNAMIC LAYOUT:
    // 1-3 nodes: Vertical Single Col
    // 4-8 nodes: 2 Cols Grid
    // 9+ nodes: 3 Cols Grid
    const cols = totalNodes <= 3 ? 1 : (totalNodes <= 8 ? 2 : 3);

    return (steps || []).filter(Boolean).map((step, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const isFocused = connectedNodeIds ? connectedNodeIds.includes(step.id) : !hoveredEdgeId;

      return {
        id: step.id,
        type: 'serviceStep',
        data: { 
          stepIndex: idx,
          isFocused,
          label: isAr ? step.titleAr : step.titleEn,
          actions: (
            <>
              <Button size="xs" variant="ghost" className="h-8 w-8 p-0 bg-slate-50 hover:bg-accent hover:text-white" onClick={() => { setActiveTab('logic'); setTimeout(() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' }), 100); }}>
                <Edit2 size={14} />
              </Button>
              <Button size="xs" variant="ghost" className="h-8 w-8 p-0 bg-slate-50 text-red-400 hover:bg-red-500 hover:text-white" onClick={() => removeStep(step.id)}>
                <Trash2 size={14} />
              </Button>
            </>
          )
        },
        position: { x: col * 380, y: row * 320 }, // Increased spacing for clear edges
      };
    });
  }, [steps, isAr, hoveredEdgeId, edges]);

  const FlowControls = () => {
    const { fitView } = useReactFlow();
    return (
      <Panel position="top-right" className="flex gap-2 bg-white/90 backdrop-blur-md p-3 rounded-2xl border shadow-2xl">
        <Button size="sm" variant="outline" onClick={addStep} className="rounded-xl font-black gap-2 h-10 px-5 border-primary text-primary">
          <Plus size={16}/> {isAr ? "إضافة مرحلة" : "Add Step"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fitView()} className="rounded-xl font-black gap-2 h-10 px-5">
          <Maximize size={16}/> {isAr ? "ملائمة" : "Fit View"}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-xl font-black gap-2 h-10 px-8 shadow-md">
          {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
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
                   <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "نوع التنفيذ" : "Execution Type"}</Label>
                   <Select value={serviceInfo.type || 'workflow'} onValueChange={v => setServiceInfo({...serviceInfo, type: v as any})}>
                      <SelectTrigger className="h-9 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="workflow">{isAr ? "تدفق مراحل (داخلي)" : "Multi-Step Workflow"}</SelectItem>
                         <SelectItem value="link">{isAr ? "تحويل لرابط خارجي" : "External Redirect"}</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان بالعربي" : "Title AR"}</Label>
                     <Button size="icon" variant="ghost" className="h-4 w-4 text-accent" onClick={() => handleAiTranslate(serviceInfo.title || '', 'title')} disabled={aiLoading === 'title'}>
                       {aiLoading === 'title' ? <Loader2 className="animate-spin size-3" /> : <Sparkles size={12} />}
                     </Button>
                   </div>
                   <Input value={serviceInfo.title || ''} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="h-9 text-xs font-bold" />
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "العنوان بالإنجليزي" : "Title EN"}</Label>
                   <Input value={serviceInfo.titleEn || ''} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} className="h-9 text-xs" />
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "الرسوم" : "Fees"}</Label>
                   <Input value={serviceInfo.fees || ''} onChange={e => setServiceInfo({...serviceInfo, fees: e.target.value})} className="h-9 text-xs font-black text-emerald-600" />
                 </div>

                 {serviceInfo.type === 'link' && (
                   <div className="space-y-2">
                     <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "رابط الوجهة" : "Destination URL"}</Label>
                     <Input value={serviceInfo.linkUrl || ''} onChange={e => setServiceInfo({...serviceInfo, linkUrl: e.target.value})} className="h-9 text-xs font-mono" />
                   </div>
                 )}

                 <div className="space-y-2">
                   <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "الفئة" : "Category"}</Label>
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
                   <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "أيقونة الخدمة" : "Service Icon"}</Label>
                   <div className="flex gap-2">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="flex-1 h-9 gap-2 justify-start overflow-hidden">
                              {serviceInfo.customIconUrl ? (
                                <img src={serviceInfo.customIconUrl} className="size-4 object-contain" alt="" />
                              ) : (
                                React.createElement((Icons as any)[serviceInfo.iconName || 'FileText'] || FileText, { size: 16 })
                              )}
                              <span className="text-[10px] truncate">{serviceInfo.iconName || 'Select...'}</span>
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                           <div className="p-2 border-b">
                              <Input 
                                placeholder={isAr ? "ابحث عن أيقونة..." : "Search icons..."} 
                                value={iconSearch} 
                                onChange={e => setIconSearch(e.target.value)}
                                className="h-8 text-xs"
                              />
                           </div>
                           <ScrollArea className="h-64 p-2">
                              <div className="grid grid-cols-4 gap-1">
                                 {(filteredIcons || []).map(icon => {
                                   const IconComp = (Icons as any)[icon];
                                   if (!IconComp) return null;
                                   return (
                                     <Button 
                                      key={icon} 
                                      variant="ghost" 
                                      className={cn("h-12 w-full p-0", serviceInfo.iconName === icon && "bg-primary/10")}
                                      onClick={() => setServiceInfo({...serviceInfo, iconName: icon, customIconUrl: undefined})}
                                     >
                                        <IconComp size={18} />
                                     </Button>
                                   );
                                 })}
                              </div>
                           </ScrollArea>
                        </PopoverContent>
                     </Popover>
                     <Button variant="outline" size="icon" className="h-9 w-9 relative overflow-hidden">
                        <Upload size={14} />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setServiceInfo({...serviceInfo, customIconUrl: reader.result as string, iconName: 'ImageIcon'});
                            reader.readAsDataURL(file);
                          }
                        }} />
                     </Button>
                   </div>
                 </div>

                 <div className="space-y-2 pt-2 border-t">
                    <Label className="text-[9px] font-black uppercase text-slate-400">{isAr ? "المستندات المطلوبة (تلقائي)" : "Required Docs (Auto)"}</Label>
                    <div className="space-y-1">
                       {(serviceInfo.reqsAr || []).filter(Boolean).map((req, idx) => (
                         <div key={idx} className="flex gap-1 items-center p-1.5 bg-slate-50 rounded-lg border">
                            <div className="size-1.5 bg-accent rounded-full shrink-0" />
                            <span className="text-[9px] font-bold text-slate-600 flex-1 truncate">{req}</span>
                         </div>
                       ))}
                       {((serviceInfo.reqsAr || []).length === 0) && (
                         <p className="text-[8px] text-slate-400 italic text-center py-2">{isAr ? "سيتم جلب المتطلبات من مراحل العمل" : "Docs will be synced from steps"}</p>
                       )}
                    </div>
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
                {serviceInfo.type === 'workflow' && (steps || []).filter(Boolean).map((step, sIdx) => (
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
                        <Button variant="ghost" size="icon" onClick={() => moveStep(sIdx, 'up')} disabled={sIdx === 0} className="text-white/40 h-8 w-8 hover:text-accent"><ChevronUp size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => moveStep(sIdx, 'down')} disabled={sIdx === (steps || []).length - 1} className="text-white/40 h-8 w-8 hover:text-accent"><ChevronDown size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => removeStep(step.id)} className="text-white/40 h-8 w-8 hover:text-red-400"><Trash2 size={16} /></Button>
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
                            {(step.fields || []).filter(Boolean).map((f, fIdx) => (
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
                                         {(f.options || []).filter(Boolean).map((opt, oIdx) => (
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
                                      {(steps || []).filter(s => s && s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                               </div>
                               
                               {(step.logic || []).filter(Boolean).map((rule, rIdx) => {
                                 const targetField = (step.fields || []).find(f => f.id === rule.fieldId);
                                 const isListField = targetField?.type === 'select' || targetField?.type === 'multichoice';

                                 return (
                                   <div key={rIdx} className="bg-primary/5 p-4 rounded-2xl space-y-4 border border-primary/10 relative group">
                                      <div className="flex items-center justify-between text-[9px] font-black text-primary">
                                        <span>{isAr ? "قاعدة شرطية:" : "RULE:"}</span>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                          const nl = [...(step.logic || [])]; nl.splice(rIdx, 1); updateStep(sIdx, { logic: nl });
                                        }} className="h-5 w-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></Button>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[8px] font-bold text-slate-400">{isAr ? "اسم الحقل:" : "FIELD NAME:"}</span>
                                          <Select value={rule.fieldId || 'none'} onValueChange={v => {
                                            const nl = [...(step.logic || [])];
                                            nl[rIdx].fieldId = v === 'none' ? '' : v;
                                            nl[rIdx].value = ''; 
                                            updateStep(sIdx, { logic: nl });
                                          }}>
                                            <SelectTrigger className="h-8 text-[10px] bg-white"><SelectValue placeholder={isAr ? "اختر الحقل..." : "Select Field..."} /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                              {(step.fields || []).filter(Boolean).map(f => <SelectItem key={f.id} value={f.id}>{isAr ? f.labelAr : f.labelEn}</SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-bold text-slate-400">{isAr ? "يساوي القيمة:" : "EQUALS VALUE:"}</span>
                                            {isListField ? (
                                              <Select value={rule.value || 'none'} onValueChange={v => {
                                                const nl = [...(step.logic || [])]; nl[rIdx].value = v === 'none' ? '' : v; updateStep(sIdx, { logic: nl });
                                              }}>
                                                <SelectTrigger className="h-8 text-[10px] bg-white"><SelectValue placeholder="..." /></SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                                  {(targetField?.options || []).filter(Boolean).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Input 
                                                placeholder={isAr ? "القيمة" : "Value"} 
                                                value={rule.value || ''} 
                                                onChange={e => {
                                                  const nl = [...(step.logic || [])]; nl[rIdx].value = e.target.value; updateStep(sIdx, { logic: nl });
                                                }} 
                                                className="h-8 text-[11px] bg-white" 
                                              />
                                            )}
                                          </div>
                                          
                                          <div className="flex flex-col gap-1">
                                            <span className="text-[8px] font-bold text-slate-400">{isAr ? "انتقل إلى:" : "NAVIGATE TO:"}</span>
                                            <Select value={rule.targetStepId || 'none'} onValueChange={v => {
                                              const nl = [...(step.logic || [])]; nl[rIdx].targetStepId = v === 'none' ? '' : v; updateStep(sIdx, { logic: nl });
                                            }}>
                                              <SelectTrigger className="h-8 text-[11px] bg-white"><SelectValue placeholder="..." /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">{isAr ? "اختر..." : "Select..."}</SelectItem>
                                                {(steps || []).filter(s => s && s.id !== step.id).map(s => <SelectItem key={s.id} value={s.id}>{isAr ? s.titleAr : s.titleEn}</SelectItem>)}
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
                    <p className="text-slate-400 font-bold max-w-md mx-auto">{isAr ? "سيتم توجيه المواطنين مباشرة إلى الأنظمة البلدية القائمة." : "Citizens will be redirected to existing systems."}</p>
                    <Button variant="outline" className="mt-8 rounded-full px-10 font-bold gap-2" asChild>
                      <a href={serviceInfo.linkUrl} target="_blank"><Eye size={16}/> {isAr ? "معاينة الوجهة" : "Preview Target"}</a>
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="canvas" className="outline-none">
                 <Card className="rounded-brand overflow-hidden h-[750px] border shadow-inner bg-slate-100 relative">
                    <ReactFlowProvider>
                      <ReactFlow 
                        nodes={nodes} 
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
                        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                        fitView
                        className="bg-slate-50"
                      >
                        <Background />
                        <Controls />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                        <FlowControls />
                      </ReactFlow>
                    </ReactFlowProvider>
                    <div className="absolute top-6 left-6 z-10 pointer-events-none">
                       <div className="bg-white/90 backdrop-blur-md p-4 rounded-[1.5rem] border-2 border-[#007375]/20 shadow-xl">
                          <p className="text-xs font-black text-[#007375] uppercase tracking-widest mb-1">{isAr ? "مخطط التدفق التفاعلي" : "Interactive Orchestrator"}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{isAr ? "ترتيب ذكي للمراحل لضمان وضوح المسار" : "Smart adaptive layout for process clarity"}</p>
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
