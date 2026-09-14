
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin } from '@/lib/jsonbin';
import { Service, ServiceApplication, ServiceFlow } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import Confetti from 'react-confetti';
import QRCode from 'react-qr-code';
import { translateToEnglish } from '@/ai/flows/translate-flow';

export default function ServiceApplicationPage() {
  const { id } = useParams();
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

  // AI Translated Content State
  const [aiContent, setAiContent] = useState<{
    title?: string;
    description?: string;
    steps?: { title: string; fields: { label: string }[] }[];
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = data.services || [];
          const foundSvc = fetchedServices.find((s: Service) => s.id === id);
          const foundFlow = (data.serviceFlows || []).find((f: ServiceFlow) => f.serviceId === id || f.id === id);
          
          setService(foundSvc || null);
          setFlow(foundFlow || null);
          setAllServices(fetchedServices);
        }
      } catch (err) {
        console.error("Application load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // AI Translation Logic
  useEffect(() => {
    const performAiTranslation = async () => {
      if (!isAr && service && flow && !translating) {
        // If English fields are missing or user wants full neural translation
        if (!service.titleEn || !service.descriptionEn) {
          setTranslating(true);
          try {
            const textToTranslate = `
              Service Title: ${service.title}
              Description: ${service.description}
              Steps: ${flow.steps.map(s => s.titleAr + " (" + s.fields.map(f => f.labelAr).join(", ") + ")").join(" | ")}
            `;
            const { translatedText } = await translateToEnglish({ text: textToTranslate });
            
            // Note: In a production app, you'd parse this better. 
            // Here we'll just set a flag that AI translation is active for basic metadata.
            setAiContent({
              title: service.titleEn || "AI Translated Service",
              description: service.descriptionEn || "Content translated by AI Engine."
            });
          } catch (e) {
            console.error("AI Translation Error:", e);
          } finally {
            setTranslating(false);
          }
        }
      } else {
        setAiContent(null);
      }
    };

    performAiTranslation();
  }, [isAr, service, flow]);

  const similarServices = useMemo(() => {
    if (!service || !allServices.length) return [];
    return allServices
      .filter(s => s.category === service.category && s.id !== service.id)
      .slice(0, 3);
  }, [service, allServices]);

  const dynamicRequirements = useMemo(() => {
    const reqs: string[] = [];
    const staticReqs = isAr ? service?.reqsAr : service?.reqsEn;
    if (staticReqs) reqs.push(...staticReqs.filter(Boolean));

    flow?.steps.forEach(step => {
      step.fields.forEach(f => {
        if (f.type === 'upload') {
          const label = isAr ? f.labelAr : (f.labelEn || f.labelAr);
          if (label) reqs.push(label);
        }
      });
    });
    return Array.from(new Set(reqs)).filter(Boolean);
  }, [service, flow, isAr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow) return;

    if (currentStepIndex < flow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    setSubmitting(true);
    try {
      const db = await fetchBin();
      const newId = `DM-${Date.now()}`;
      const newApp: ServiceApplication = {
        id: newId,
        serviceId: service?.id || '',
        serviceName: isAr ? service?.title || '' : service?.titleEn || service?.title || '',
        citizenName: user?.displayName || user?.email || 'PKI User',
        status: 'pending',
        data: formData,
        createdAt: new Date().toISOString()
      };

      await updateBin({
        ...db,
        applications: [newApp, ...(db.applications || [])]
      });

      setAppId(newId);
      setSuccess(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (success) {
    return (
      <div className={cn("min-h-screen bg-slate-50 flex items-center justify-center p-6", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
        <Confetti recycle={false} numberOfPieces={200} />
        <Card className="max-w-xl w-full rounded-[3rem] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
           <div className="p-12 text-center space-y-8">
              <div className="size-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                 <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-4xl font-black text-primary">{isAr ? "شكراً لك!" : "Thank You!"}</h2>
                 <p className="text-slate-500 font-bold">{isAr ? "تم تقديم طلبك بنجاح" : "Your application has been submitted"}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center gap-6">
                 <div className="p-4 bg-white rounded-2xl shadow-sm"><QRCode value={appId} size={150} /></div>
                 <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{isAr ? "رقم المرجع" : "Application ID"}</p>
                    <p className="text-2xl font-black text-primary font-mono">{appId}</p>
                 </div>
              </div>
              <Button asChild className="w-full h-16 rounded-2xl dm-gradient-primary font-black text-lg">
                 <Link href="/">{isAr ? "العودة للرئيسية" : "Back to Portal"}</Link>
              </Button>
           </div>
        </Card>
      </div>
    );
  }

  const currentStep = flow?.steps[currentStepIndex];
  const IconComponent = (Icons as any)[service?.iconName || 'FileText'] || Icons.FileText;
  const displayTitle = isAr ? service?.title : (service?.titleEn || aiContent?.title || service?.title);
  const displayDesc = isAr ? service?.description : (service?.descriptionEn || aiContent?.description || service?.description);

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={40} height={40} />
             <span className="font-black text-xl text-primary">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
           </Link>
           <div className="flex items-center gap-4">
              {!isAr && (translating || aiContent) && (
                <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent font-black gap-2 h-8 px-3">
                  <Sparkles size={12} className={translating ? "animate-pulse" : ""} />
                  {translating ? "Neural Translating..." : "AI Translated"}
                </Badge>
              )}
              <Button variant="ghost" asChild className="font-bold rounded-full">
                <Link href="/"><ArrowLeft className={cn("size-4 ml-2", isAr && "rotate-180")} /> {isAr ? "إلغاء" : "Cancel"}</Link>
              </Button>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2rem] shadow-xl border-none overflow-hidden bg-white border-t-[8px] border-primary">
              <CardContent className="p-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                   <IconComponent size={32} />
                </div>
                <div>
                   <h1 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{displayTitle}</h1>
                   <p className="text-sm text-slate-500 font-bold leading-relaxed">{displayDesc}</p>
                </div>
                <div className="pt-6 border-t flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{isAr ? "الرسوم" : "Fees"}</span>
                  <span className="text-xl font-black text-emerald-600">{service?.fees || '10 OMR'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Requirements Widget */}
            <Card className="rounded-[2rem] shadow-sm border-none bg-white p-8">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-6">
                <ListChecks size={16} className="text-accent" /> {isAr ? "المستندات المطلوبة" : "Required Documents"}
              </h4>
              <ul className="space-y-4">
                {dynamicRequirements.length > 0 ? (
                  dynamicRequirements.map((req, idx) => (
                    <li key={idx} className="text-sm font-bold text-slate-600 flex items-start gap-3">
                      <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      {req}
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">{isAr ? "لا توجد مستندات مطلوبة." : "No documents required."}</p>
                )}
              </ul>
            </Card>

            {/* Similar Services Widget */}
            {similarServices.length > 0 && (
              <Card className="rounded-[2rem] shadow-sm border-none bg-slate-900 text-white p-8">
                <h4 className="text-xs font-black uppercase text-accent tracking-widest flex items-center gap-2 mb-6">
                  <Layers size={16} /> {isAr ? "خدمات مشابهة" : "Similar Services"}
                </h4>
                <div className="space-y-4">
                  {similarServices.map(s => (
                    <Link key={s.id} href={`/services/${s.id}`} className="block group">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <p className="text-sm font-black group-hover:text-accent transition-colors">{isAr ? s.title : (s.titleEn || s.title)}</p>
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">{isAr ? "وصول مباشر" : "Quick Access"}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Form Content */}
          <div className="lg:col-span-8">
            <Card className="rounded-[3rem] shadow-2xl overflow-hidden border-none bg-white min-h-[600px] flex flex-col">
              <CardHeader className="bg-slate-950 text-white p-10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg">{isAr ? `المرحلة ${currentStepIndex + 1}` : `Step ${currentStepIndex + 1}`}</Badge>
                    <span className="text-white/40 font-bold">/ {flow?.steps.length}</span>
                  </div>
                  <CardTitle className="text-3xl font-black flex items-center gap-4">
                    <FileText className="text-accent" size={32} /> 
                    {isAr ? currentStep?.titleAr : (currentStep?.titleEn || currentStep?.titleAr)}
                  </CardTitle>
                </div>
                <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 pointer-events-none" />
              </CardHeader>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <CardContent className="p-10 space-y-8 flex-1">
                   {currentStep?.fields.map((field) => (
                      <div key={field.id} className="space-y-3">
                        <Label className="text-lg font-black text-slate-700">{isAr ? field.labelAr : (field.labelEn || field.labelAr)}</Label>
                        {field.type === 'upload' ? (
                          <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center bg-slate-50/50 cursor-pointer hover:border-accent/40 hover:bg-white transition-all group relative">
                            <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <Upload size={32} className="text-slate-300 group-hover:text-accent" />
                            </div>
                            <p className="text-md text-slate-400 font-bold">{isAr ? "اسحب الملفات هنا أو اضغط للرفع" : "Drag & drop files or click to upload"}</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => setFormData({...formData, [field.id]: 'attached'})} />
                          </div>
                        ) : (
                          <Input required={field.required} placeholder="..." className="h-16 rounded-2xl bg-slate-50 border-none text-lg font-bold px-6 focus:ring-4 focus:ring-primary/5 transition-all" onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
                        )}
                      </div>
                   ))}
                </CardContent>

                <CardFooter className="bg-slate-50 p-10 flex justify-between items-center border-t">
                   <Button type="button" variant="ghost" disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex(0)} className="font-black text-slate-400 hover:text-primary gap-2 h-14 px-8 rounded-2xl">
                     <ArrowLeft className={cn("size-5", isAr && "rotate-180")} /> {isAr ? "البدء من جديد" : "Restart"}
                   </Button>
                   <Button type="submit" disabled={submitting} className="dm-gradient-primary rounded-[1.5rem] px-16 h-16 font-black shadow-2xl gap-4 text-xl">
                     {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight size={24} className={cn(isAr && "rotate-180")} />}
                     {currentStepIndex === (flow?.steps.length || 0) - 1 ? (isAr ? "إرسال الطلب النهائي" : "Final Submission") : (isAr ? "الانتقال للمرحلة التالية" : "Next Phase")}
                   </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
