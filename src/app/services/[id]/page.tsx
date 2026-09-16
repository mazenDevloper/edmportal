'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { Service, ServiceApplication, ServiceFlow } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Upload, 
  ListChecks, 
  Sparkles,
  Layers,
  ChevronRight,
  MapPin,
  Info,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import Confetti from 'react-confetti';
import QRCode from 'react-qr-code';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalFooter } from '@/components/portal-footer';

export default function ServiceApplicationPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const { user } = useUser();
  const isAr = language === 'ar';

  const [service, setService] = useState<Service | null>(null);
  const [flow, setFlow] = useState<ServiceFlow | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [success, setSuccess] = useState(false);
  const [appId, setAppId] = useState('');
  const [aiContent, setAiContent] = useState<{ title?: string; description?: string; } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const foundSvc = (data.services || []).find((s: Service) => s.id === id) || null;
          const foundFlow = (data.serviceFlows || []).find((f: ServiceFlow) => f.serviceId === id || f.id === id) || null;
          setService(foundSvc);
          setFlow(foundFlow);
          setAllServices(data.services || []);
        }
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!isAr && service && !aiContent && !translating) {
      if (!service.titleEn || !service.descriptionEn) {
        setTranslating(true);
        translateToEnglish({ text: `Title: ${service.title} | Description: ${service.description}` })
          .then(({ translatedText }) => {
            const parts = translatedText.split('|');
            setAiContent({ title: parts[0]?.replace('Title:', '').trim(), description: parts[1]?.replace('Description:', '').trim() });
          }).finally(() => setTranslating(false));
      }
    }
  }, [isAr, service, aiContent, translating]);

  const dynamicRequirements = useMemo(() => {
    const reqs = new Set(service?.reqsAr || []);
    flow?.steps.forEach(step => {
      step.fields.forEach(field => {
        if (field.type === 'upload') reqs.add(isAr ? field.labelAr : field.labelEn);
      });
    });
    return Array.from(reqs);
  }, [service, flow, isAr]);

  const similarServices = useMemo(() => {
    if (!service) return [];
    return allServices.filter(s => s.category === service.category && s.id !== service.id).slice(0, 3);
  }, [service, allServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow) return;

    const currentStep = flow.steps[currentStepIndex];
    
    // Neural logic routing - jumping steps based on data
    let nextStepId = currentStep.defaultNextStepId;
    (currentStep.logic || []).forEach(rule => {
      if (formData[rule.fieldId] === rule.value) nextStepId = rule.targetStepId;
    });

    if (nextStepId) {
      const nextIdx = flow.steps.findIndex(s => s.id === nextStepId);
      if (nextIdx !== -1) { setCurrentStepIndex(nextIdx); return; }
    }

    if (currentStepIndex < flow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    setSubmitting(true);
    try {
      const db = await fetchBin();
      const newId = `DM-${Date.now()}`;
      await updateBin({ 
        ...db, 
        applications: [
          { 
            id: newId, 
            serviceId: service?.id || '', 
            serviceName: isAr ? service?.title || '' : aiContent?.title || service?.titleEn || service?.title || '', 
            citizenName: user?.displayName || 'PKI User', 
            status: 'pending', 
            data: formData, 
            createdAt: new Date().toISOString() 
          }, 
          ...(db.applications || [])
        ] 
      });
      setAppId(newId); 
      setSuccess(true);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (success) return (
    <div className={cn("min-h-screen bg-slate-50 flex items-center justify-center p-6", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <Confetti recycle={false} />
      <Card className="max-w-xl w-full rounded-[3rem] shadow-2xl p-12 text-center space-y-8">
        <CheckCircle2 size={64} className="text-emerald-600 mx-auto" />
        <h2 className="text-4xl font-black text-primary">{isAr ? "تم تقديم طلبك بنجاح" : "Request Submitted!"}</h2>
        <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center gap-4">
           <QRCode value={appId} size={150} />
           <p className="text-2xl font-black text-primary font-mono tracking-tighter">{appId}</p>
        </div>
        <Button onClick={() => router.push('/')} className="w-full h-16 rounded-2xl dm-gradient-primary font-black shadow-xl">
          {isAr ? "العودة للرئيسية" : "Back to Portal"}
        </Button>
      </Card>
    </div>
  );

  const currentStep = flow?.steps[currentStepIndex];
  const IconComponent = (Icons as any)[service?.iconName || 'FileText'] || Icons.FileText;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={40} height={40} />
             <span className="font-black text-xl text-primary">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
           </Link>
           <Button variant="ghost" onClick={() => router.push('/')} className="font-bold rounded-xl">{isAr ? 'إلغاء' : 'Cancel'}</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2rem] shadow-xl p-8 space-y-6 border-t-[8px] border-primary bg-white">
                <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <IconComponent size={32} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 leading-tight">
                  {isAr ? service?.title : aiContent?.title || service?.titleEn || service?.title}
                </h1>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                  {isAr ? service?.description : aiContent?.description || service?.descriptionEn || service?.description}
                </p>
                <div className="pt-6 border-t flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? 'الرسوم المقررة' : 'ESTIMATED FEES'}</span>
                  <span className="text-xl font-black text-emerald-600">{service?.fees || '10 OMR'}</span>
                </div>
            </Card>
            
            <Card className="rounded-[2rem] p-8 space-y-6 bg-white shadow-sm border border-slate-100">
              <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                <ListChecks size={16} className="text-accent" /> {isAr ? 'المستندات المطلوبة' : 'Requirements'}
              </h4>
              <ul className="space-y-4">
                {dynamicRequirements.map((r, i) => (
                  <li key={i} className="text-sm font-bold text-slate-600 flex items-start gap-3">
                    <div className="size-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {similarServices.length > 0 && (
              <Card className="rounded-[2rem] p-8 bg-slate-900 text-white space-y-6 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 size-32 dm-wave-5 opacity-10 pointer-events-none" />
                <h4 className="text-xs font-black uppercase text-accent tracking-[0.2em] relative z-10 flex items-center gap-2">
                  <Layers size={14}/> {isAr ? 'خدمات مشابهة' : 'Related Services'}
                </h4>
                <div className="space-y-3 relative z-10">
                  {similarServices.map(s => (
                    <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group">
                      <p className="text-xs font-black text-white/80 group-hover:text-white truncate max-w-[200px]">{isAr ? s.title : s.titleEn || s.title}</p>
                      <ChevronRight size={14} className="text-accent group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="rounded-[3rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col bg-white border-none">
              <CardHeader className="bg-slate-950 text-white p-10 relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg uppercase text-[10px] tracking-widest">
                      {isAr ? `المرحلة ${currentStepIndex + 1}` : `Phase ${currentStepIndex + 1}`}
                    </Badge>
                    <span className="text-white/40 font-black text-xs uppercase">/ {flow?.steps.length} Phases</span>
                  </div>
                  <CardTitle className="text-3xl font-black flex items-center gap-4">
                    <FileText className="text-accent" size={32} /> 
                    {isAr ? currentStep?.titleAr : currentStep?.titleEn}
                  </CardTitle>
                </div>
                <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 pointer-events-none" />
              </CardHeader>
              
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <CardContent className="p-12 space-y-10 flex-1">
                   {currentStep?.fields.map((field) => (
                      <div key={field.id} className="space-y-4">
                        <Label className="text-lg font-black text-slate-700 flex items-center gap-2">
                          {isAr ? field.labelAr : field.labelEn}
                          {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {field.type === 'upload' ? (
                          <div className="border-4 border-dashed rounded-[2.5rem] p-16 text-center bg-slate-50 cursor-pointer hover:bg-white hover:border-primary/20 transition-all relative group shadow-inner">
                            <div className="size-16 rounded-full bg-primary/5 text-primary mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload size={32} />
                            </div>
                            <p className="text-md font-black text-slate-500 mb-1">{isAr ? 'اضغط هنا لرفع المستند' : 'Click or Drag to Upload'}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PDF, PNG, JPG (MAX 10MB)</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => setFormData({...formData, [field.id]: 'Document Attached'})} required={field.required} />
                            {formData[field.id] && (
                              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-black text-sm">
                                <CheckCircle2 size={16} /> {isAr ? 'تم إرفاق المستند' : 'Document Attached'}
                              </div>
                            )}
                          </div>
                        ) : field.type === 'select' ? (
                          <Select onValueChange={v => setFormData({...formData, [field.id]: v})} required={field.required}>
                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none shadow-sm text-lg font-bold focus:ring-accent/20">
                              <SelectValue placeholder={isAr ? 'اختر خياراً...' : 'Choose option...'} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {field.options?.map((o, idx) => (
                                <SelectItem key={idx} value={o} className="font-bold py-3">{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'map' ? (
                          <div className="h-72 bg-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed relative overflow-hidden group hover:border-primary/20 transition-all">
                             <div className="size-14 rounded-full bg-white shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3">
                               <MapPin size={24}/>
                             </div>
                             <p className="font-black text-slate-500 uppercase tracking-widest">{isAr ? 'تحديد الموقع على الخريطة' : 'Locate on Smart Map'}</p>
                             <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <Input 
                            type={field.type === 'number' ? 'number' : 'text'}
                            required={field.required} 
                            placeholder={isAr ? 'أدخل البيانات هنا...' : 'Enter data here...'}
                            className="h-16 rounded-2xl bg-slate-50 border-none shadow-sm text-lg font-bold focus:ring-accent/20 px-6" 
                            onChange={e => setFormData({...formData, [field.id]: e.target.value})} 
                          />
                        )}
                      </div>
                   ))}
                </CardContent>

                <CardFooter className="bg-slate-50 p-10 flex justify-between items-center border-t rounded-b-[3rem]">
                   <Button type="button" variant="ghost" disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex(0)} className="font-black h-16 rounded-2xl px-8 hover:bg-slate-100 text-slate-400">
                     {isAr ? 'إعادة البدء' : 'Restart'}
                   </Button>
                   <Button type="submit" disabled={submitting} className="dm-gradient-primary rounded-[1.5rem] px-12 h-16 font-black shadow-2xl gap-4 text-xl">
                     {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight />} 
                     {currentStepIndex === (flow?.steps.length || 0) - 1 ? (isAr ? "إرسال الطلب النهائي" : "Submit Final Request") : (isAr ? "المرحلة التالية" : "Next Phase")}
                   </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
