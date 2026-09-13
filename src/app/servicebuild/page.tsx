
'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Upload, Type, Calendar, Layers, X, 
  CreditCard, Settings, Loader2, GitBranch,
  Maximize, Edit2, Hash, List, MapPin, FileText,
  ChevronUp, ChevronDown, Sparkles, Network, RefreshCw
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
import { Badge } from '@/components/ui/badge';
import { translateToEnglish } from '@/ai/flows/translate-flow';

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Panel,
  ReactFlowProvider,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ServiceStepNode = ({ data }: any) => (
  <div className="bg-white text-[#007375] border-2 border-[#007375] rounded-2xl p-4 font-bold w-[220px] text-center shadow-lg relative">
    <Handle type="target" position={Position.Top} />
    <div className="absolute -top-3 -left-3 bg-[#470D67] text-white size-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-md">
      {data.stepIndex + 1}
    </div>
    <span className="text-[11px] font-black uppercase tracking-tight">{data.label}</span>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

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
  const [serviceInfo, setServiceInfo] = useState<Partial<Service>>({
    title: '', titleEn: '', category: 'elec', iconName: 'FileText',
    fees: '10 OMR', description: '', type: 'workflow', reqsAr: [], reqsEn: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        const flow = data.serviceFlows?.find((f: any) => f.serviceId === editId || f.id === editId);
        const svc = data.services?.find((s: any) => s.id === editId);
        if (flow) setSteps(flow.steps || []);
        if (svc) setServiceInfo(svc);
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  // AUTO-SYNC LOGIC: Sync required docs from steps automatically
  useEffect(() => {
    const autoReqsAr: string[] = [];
    const autoReqsEn: string[] = [];

    steps.forEach(step => {
      const stepTitleAr = (step.titleAr || '').toLowerCase();
      const stepTitleEn = (step.titleEn || '').toLowerCase();
      const isDocStep = stepTitleAr.includes('مستند') || stepTitleAr.includes('وثائق') || 
                        stepTitleEn.includes('doc') || stepTitleEn.includes('requirement');

      step.fields.forEach(field => {
        if (field.type === 'upload' || isDocStep) {
          if (field.labelAr) autoReqsAr.push(field.labelAr);
          if (field.labelEn) autoReqsEn.push(field.labelEn);
        }
      });
    });

    setServiceInfo(prev => ({
      ...prev,
      reqsAr: Array.from(new Set(autoReqsAr)),
      reqsEn: Array.from(new Set(autoReqsEn))
    }));
  }, [steps]);

  const handleAiTranslate = async (text: string, target: 'title' | 'desc' | number) => {
    if (!text) return;
    setAiLoading(target.toString());
    try {
      const { translatedText } = await translateToEnglish({ text });
      if (target === 'title') setServiceInfo({ ...serviceInfo, titleEn: translatedText });
      else if (target === 'desc') setServiceInfo({ ...serviceInfo, descriptionEn: translatedText });
      toast({ title: isAr ? "تمت الترجمة الذكية" : "AI Translation Done" });
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setAiLoading(null);
    }
  };

  const addStep = useCallback(() => {
    setSteps(prev => [...prev, { id: `step_${Date.now()}`, titleAr: isAr ? 'خطوة جديدة' : 'New Step', titleEn: 'New Step', fields: [], actionType: 'submit' }]);
  }, [isAr]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await fetchBin();
      const newId = editId || `svc_${Date.now()}`;
      const newService = { ...serviceInfo as Service, id: newId, isActive: true };
      const newFlow = { id: newId, serviceId: newId, titleAr: serviceInfo.title || '', titleEn: serviceInfo.titleEn || '', steps, isActive: true };
      
      const filteredSvcs = (data.services || []).filter((s: any) => s.id !== newId);
      const filteredFlows = (data.serviceFlows || []).filter((f: any) => f.id !== newId);
      
      await updateBin({ ...data, services: [...filteredSvcs, newService], serviceFlows: [...filteredFlows, newFlow] });
      toast({ title: isAr ? "تم حفظ الخدمة والتدفق بنجاح" : "Service & Flow Saved Successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  const nodes: Node[] = useMemo(() => steps.map((step, idx) => ({
    id: step.id,
    type: 'serviceStep',
    data: { stepIndex: idx, label: isAr ? step.titleAr : step.titleEn },
    position: step.position || { x: (idx % 3) * 280, y: Math.floor(idx / 3) * 250 },
  })), [steps, isAr]);

  const edges: Edge[] = useMemo(() => {
    const e: Edge[] = [];
    steps.forEach(step => {
      if (step.defaultNextStepId) {
        e.push({ id: `e-${step.id}`, source: step.id, target: step.defaultNextStepId, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#007375' } });
      }
    });
    return e;
  }, [steps]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3"><GitBranch /> {isAr ? "محرك المنطق والتدفقات" : "Process Logic Engine"}</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold"><ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}</Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />} {isAr ? "حفظ وتثبيت" : "Save & Sync"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md border-none sticky top-24 overflow-hidden h-fit bg-white">
            <CardHeader className="bg-primary text-white"><CardTitle className="text-xs font-black flex items-center gap-2"><Settings size={14}/> {isAr ? "إعدادات الخدمة" : "Service Meta"}</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="relative">
                 <Label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">{isAr ? "العنوان بالعربي" : "Title (AR)"}</Label>
                 <Input value={serviceInfo.title || ''} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="h-10 font-bold pr-10 rounded-xl" />
                 <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(serviceInfo.title || '', 'title')} disabled={aiLoading === 'title'}>
                   {aiLoading === 'title' ? <Loader2 className="animate-spin size-4" /> : <Sparkles size={14} />}
                 </Button>
               </div>
               <div>
                 <Label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">{isAr ? "العنوان بالإنجليزي (AI)" : "Title (EN - AI)"}</Label>
                 <Input value={serviceInfo.titleEn || ''} onChange={e => setServiceInfo({...serviceInfo, titleEn: e.target.value})} className="h-10 font-bold bg-slate-50 rounded-xl" />
               </div>
               <div className="space-y-4 pt-4 border-t">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                   <Upload size={12}/> {isAr ? "المستندات المطلوبة (تلقائي)" : "Required Docs (Auto)"}
                 </Label>
                 <div className="space-y-2">
                   {((isAr ? serviceInfo.reqsAr : serviceInfo.reqsEn) || []).map((req, ri) => (
                     <div key={ri} className="p-2 bg-slate-50 border rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-2">
                       <div className="size-1.5 bg-accent rounded-full shrink-0" />
                       {req}
                     </div>
                   ))}
                   {((isAr ? serviceInfo.reqsAr : serviceInfo.reqsEn) || []).length === 0 && (
                     <p className="text-[9px] text-slate-400 italic">{isAr ? "سيتم الجلب فور إضافة حقول رفع" : "Will sync when upload fields added"}</p>
                   )}
                 </div>
               </div>
               <Button onClick={addStep} className="w-full dm-gradient-primary rounded-xl font-black mt-4 h-12 shadow-lg"><Plus size={16} className="ml-2"/> {isAr ? "إضافة مرحلة جديدة" : "Add Step"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border rounded-full p-1 mb-6 h-12 shadow-sm">
                   <TabsTrigger value="logic" className="rounded-full font-black px-10 data-[state=active]:bg-primary data-[state=active]:text-white">Logic & Steps</TabsTrigger>
                   <TabsTrigger value="canvas" className="rounded-full font-black px-10 data-[state=active]:bg-primary data-[state=active]:text-white">Visual Flow</TabsTrigger>
                </TabsList>
                <TabsContent value="logic" className="space-y-6">
                   {steps.map((step, sIdx) => (
                     <Card key={step.id} className="rounded-3xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 border-none">
                        <CardHeader className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="size-8 bg-accent text-slate-900 rounded-full flex items-center justify-center font-black text-xs">{sIdx + 1}</div>
                              <div className="flex flex-col">
                                <Input 
                                  value={step.titleAr} 
                                  onChange={e => { const ns = [...steps]; ns[sIdx].titleAr = e.target.value; setSteps(ns); }} 
                                  className="bg-transparent border-none text-white font-black text-lg h-auto p-0 focus-visible:ring-0" 
                                />
                                <Input 
                                  value={step.titleEn} 
                                  onChange={e => { const ns = [...steps]; ns[sIdx].titleEn = e.target.value; setSteps(ns); }} 
                                  className="bg-transparent border-none text-white/50 font-bold text-xs h-auto p-0 focus-visible:ring-0" 
                                />
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => setSteps(steps.filter(s => s.id !== step.id))} className="text-white/20 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={18}/></Button>
                        </CardHeader>
                        <CardContent className="p-8 bg-white space-y-6">
                           <div className="grid grid-cols-1 gap-4">
                              {step.fields.map((field, fIdx) => (
                                <div key={field.id} className="flex gap-4 p-4 border rounded-2xl bg-slate-50 items-center group">
                                   <div className="size-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                      {field.type === 'upload' ? <Upload size={18}/> : <Type size={18}/>}
                                   </div>
                                   <div className="flex-1 grid grid-cols-2 gap-3">
                                      <Input value={field.labelAr} onChange={e => {
                                         const ns = [...steps]; ns[sIdx].fields[fIdx].labelAr = e.target.value; setSteps(ns);
                                      }} className="h-9 font-bold bg-white" placeholder="Label AR" />
                                      <Input value={field.labelEn} onChange={e => {
                                         const ns = [...steps]; ns[sIdx].fields[fIdx].labelEn = e.target.value; setSteps(ns);
                                      }} className="h-9 font-medium bg-white" placeholder="Label EN" />
                                   </div>
                                   <Select value={field.type} onValueChange={v => {
                                      const ns = [...steps]; ns[sIdx].fields[fIdx].type = v as any; setSteps(ns);
                                   }}>
                                      <SelectTrigger className="w-32 h-9 rounded-lg bg-white"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="text">Text</SelectItem>
                                         <SelectItem value="upload">Upload</SelectItem>
                                         <SelectItem value="date">Date</SelectItem>
                                         <SelectItem value="number">Number</SelectItem>
                                      </SelectContent>
                                   </Select>
                                   <Button variant="ghost" size="icon" onClick={() => {
                                      const nf = step.fields.filter(f => f.id !== field.id);
                                      const ns = [...steps]; ns[sIdx].fields = nf; setSteps(ns);
                                   }} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></Button>
                                </div>
                              ))}
                           </div>
                           <Button variant="outline" onClick={() => {
                              const nf = [...step.fields, { id: `f_${Date.now()}`, type: 'text', labelAr: isAr ? 'بيانات' : 'Data', labelEn: 'Data', required: true }];
                              const ns = [...steps]; ns[sIdx].fields = nf; setSteps(ns);
                           }} className="w-full h-12 border-dashed border-2 rounded-2xl font-black text-slate-400 hover:text-primary hover:border-primary transition-all">+ {isAr ? "إضافة حقول بيانات للمرحلة" : "Add Form Field"}</Button>
                        </CardContent>
                     </Card>
                   ))}
                </TabsContent>
                <TabsContent value="canvas">
                   <Card className="rounded-brand h-[700px] bg-slate-100 overflow-hidden border-none shadow-2xl relative">
                      <ReactFlowProvider>
                        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
                          <Background color="#ccc" gap={20} />
                          <Controls />
                          <Panel position="top-right" className="bg-white/80 p-2 rounded-xl backdrop-blur-md border shadow-sm flex gap-2">
                             <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-lg text-accent text-[10px] font-black uppercase tracking-widest"><Network size={12}/> Visual Engine</div>
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
    <Suspense fallback={<Loader2 className="animate-spin text-primary" />}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
