
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
    fees: '10 OMR', description: '', type: 'workflow', reqsAr: []
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
      toast({ title: "Saved" });
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
    position: { x: (idx % 3) * 280, y: Math.floor(idx / 3) * 250 },
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3"><GitBranch /> {isAr ? "محرك المنطق والتدفقات" : "Process Logic Engine"}</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold"><ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}</Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />} {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md border-none sticky top-24 overflow-hidden">
            <CardHeader className="bg-primary text-white"><CardTitle className="text-xs font-black flex items-center gap-2"><Settings size={14}/> {isAr ? "الإعدادات والذكاء الاصطناعي" : "AI & Settings"}</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-4">
               <div className="relative">
                 <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "العنوان" : "Title"}</Label>
                 <Input value={serviceInfo.title} onChange={e => setServiceInfo({...serviceInfo, title: e.target.value})} className="h-9 font-bold pr-10" />
                 <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(serviceInfo.title || '', 'title')} disabled={aiLoading === 'title'}>
                   <Sparkles size={14} />
                 </Button>
               </div>
               <Input value={serviceInfo.titleEn} readOnly className="h-9 font-bold bg-slate-50" placeholder="English Title (Auto-AI)" />
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الرسوم" : "Fees"}</Label>
                 <Input value={serviceInfo.fees} onChange={e => setServiceInfo({...serviceInfo, fees: e.target.value})} className="h-9 text-emerald-600 font-black" />
               </div>
               <Button onClick={addStep} className="w-full dm-gradient-primary rounded-xl font-black mt-4"><Plus size={16} className="ml-2"/> {isAr ? "إضافة مرحلة" : "Add Step"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border rounded-full p-1 mb-6">
                   <TabsTrigger value="logic" className="rounded-full font-black px-8">Logic Editor</TabsTrigger>
                   <TabsTrigger value="canvas" className="rounded-full font-black px-8">Visual Canvas</TabsTrigger>
                </TabsList>
                <TabsContent value="logic" className="space-y-6">
                   {steps.map((step, sIdx) => (
                     <Card key={step.id} className="rounded-3xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
                        <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
                           <span className="font-black text-sm">{sIdx + 1}. {isAr ? step.titleAr : step.titleEn}</span>
                           <Button variant="ghost" size="icon" onClick={() => setSteps(steps.filter(s => s.id !== step.id))} className="text-white/40"><Trash2 size={16}/></Button>
                        </CardHeader>
                        <CardContent className="p-6">
                           <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                const nf = [...step.fields, { id: `f_${Date.now()}`, type: 'text', labelAr: 'حقل جديد', labelEn: 'New Field', required: true }];
                                const ns = [...steps]; ns[sIdx].fields = nf; setSteps(ns);
                              }}>+ Add Field</Button>
                           </div>
                        </CardContent>
                     </Card>
                   ))}
                </TabsContent>
                <TabsContent value="canvas">
                   <Card className="rounded-brand h-[600px] bg-slate-100 overflow-hidden border">
                      <ReactFlowProvider>
                        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
                          <Background />
                          <Controls />
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
    <Suspense fallback={<Loader2 className="animate-spin" />}>
      <WorkflowEngineContent />
    </Suspense>
  );
}
