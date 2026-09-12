'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { Service, ServiceApplication, ServiceFlow, ServiceStep } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { PortalFooter } from '@/components/portal-footer';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Send,
  ArrowRight,
  CreditCard,
  ListChecks,
  MapPin,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

export default function ServiceApplicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const { user } = useUser();
  const isAr = language === 'ar';

  const [service, setService] = useState<Service | null>(null);
  const [flow, setFlow] = useState<ServiceFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const foundSvc = data.services?.find((s: Service) => s.id === id);
          const foundFlow = data.serviceFlows?.find((f: ServiceFlow) => f.serviceId === id || f.id === id);
          setService(foundSvc || null);
          setFlow(foundFlow || null);
        }
      } catch (err) {
        console.error("Application load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleNextStep = () => {
    if (!flow) return;
    const currentStep = flow.steps[currentStepIndex];
    
    // Logic for branching (Conditional Flowchart)
    let nextStepId = currentStep.defaultNextStepId;
    if (currentStep.logic) {
      for (const rule of currentStep.logic) {
        // Evaluate condition: if formData[fieldId] matches rule.value
        if (formData[rule.fieldId] === rule.value) {
          nextStepId = rule.targetStepId;
          break;
        }
      }
    }

    if (nextStepId) {
      const nextIdx = flow.steps.findIndex(s => s.id === nextStepId);
      if (nextIdx !== -1) {
        setCurrentStepIndex(nextIdx);
        return;
      }
    }

    if (currentStepIndex < flow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow) return;

    if (currentStepIndex < flow.steps.length - 1) {
      handleNextStep();
      return;
    }

    setSubmitting(true);
    try {
      const db = await fetchBin();
      const newApp: ServiceApplication = {
        id: `app_${Date.now()}`,
        serviceId: service?.id || '',
        serviceName: isAr ? service?.title || '' : service?.titleEn || '',
        citizenName: user?.displayName || user?.email || 'PKI Authenticated User',
        status: 'pending',
        data: formData,
        createdAt: new Date().toISOString()
      };

      await updateBin({
        ...db,
        applications: [newApp, ...(db.applications || [])]
      });

      toast({
        title: isAr ? "تم تقديم الطلب" : "Application Submitted",
        description: isAr ? "تم استلام طلبك بنجاح وسيتم مراجعته قريباً." : "Your application has been received and will be reviewed soon."
      });
      
      router.push('/');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit application." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!service) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="text-red-500 size-12" />
      <h2 className="text-2xl font-black">{isAr ? "الخدمة غير موجودة" : "Service Not Found"}</h2>
      <Button asChild><Link href="/">{isAr ? "العودة للرئيسية" : "Back to Home"}</Link></Button>
    </div>
  );

  const currentStep = flow?.steps[currentStepIndex];
  const IconComponent = (Icons as any)[service.iconName] || Icons.FileText;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={40} height={40} className="object-contain" />
             <span className="font-black text-primary">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
           </Link>
           <Button variant="ghost" size="sm" asChild className="font-bold gap-2">
             <Link href="/">
               <ArrowLeft className={cn("size-4", isAr && "rotate-180")} />
               {isAr ? "إلغاء والعودة" : "Cancel & Back"}
             </Link>
           </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card className="rounded-brand shadow-sm border-t-4 border-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {service.customIconUrl ? (
                    <div className="relative w-8 h-8">
                       <Image src={service.customIconUrl} alt="" fill className="object-contain" />
                    </div>
                  ) : (
                    <IconComponent size={24} />
                  )}
                </div>
                <CardTitle className="text-xl font-black">{isAr ? service.title : service.titleEn}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{isAr ? service.description : service.descriptionEn}</p>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "الرسوم" : "Fees"}</span>
                  <span className="text-emerald-600 font-black">{service.fees}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><ListChecks size={14}/> {isAr ? "المستندات المطلوبة" : "Required Docs"}</h4>
                <ul className="space-y-2">
                  {(isAr ? service.reqsAr : service.reqsEn)?.map((req, idx) => (
                    <li key={idx} className="text-xs font-bold text-slate-600 flex items-start gap-2">
                      <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {flow && (
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? "خطوات العمل" : "Workflow Progress"}</h4>
                  <div className="space-y-4">
                    {flow.steps.map((step, idx) => {
                      const isActive = step.id === currentStep?.id;
                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className={cn(
                            "size-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors",
                            isActive ? "bg-accent text-white" : "bg-slate-100 text-slate-400"
                          )}>
                            {idx + 1}
                          </div>
                          <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-slate-400")}>
                            {isAr ? step.titleAr : step.titleEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <Card className="rounded-brand shadow-xl overflow-hidden border-none">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <FileText className="text-accent" /> {isAr ? (currentStep?.titleAr || "تقديم الطلب") : (currentStep?.titleEn || "Application Step")}
                </CardTitle>
                <p className="text-sm text-white/50 font-bold mt-2">
                    {isAr ? "يرجى تعبئة الحقول المطلوبة للمتابعة" : "Please fill in required fields to continue"}
                </p>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-8 space-y-6 min-h-[300px]">
                  <div className="space-y-6 pt-4">
                    {currentStep?.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="font-bold text-slate-700">{isAr ? field.labelAr : field.labelEn}</Label>
                        
                        {field.type === 'date' && (
                          <Input type="date" required={field.required} className="h-12 bg-slate-50" onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
                        )}

                        {field.type === 'select' && (
                          <Select onValueChange={val => setFormData({...formData, [field.id]: val})} required={field.required}>
                             <SelectTrigger className="h-12 bg-slate-50 font-bold">
                               <SelectValue placeholder={isAr ? "اختر..." : "Select..."} />
                             </SelectTrigger>
                             <SelectContent>
                               {field.options?.map(opt => (
                                 <SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>
                               ))}
                             </SelectContent>
                          </Select>
                        )}

                        {field.type === 'multichoice' && (
                          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border">
                             {field.options?.map(opt => (
                               <div key={opt} className="flex items-center gap-2">
                                 <Checkbox id={`${field.id}-${opt}`} onCheckedChange={(checked) => {
                                   const current = formData[field.id] || [];
                                   const next = checked ? [...current, opt] : current.filter((o: any) => o !== opt);
                                   setFormData({...formData, [field.id]: next});
                                 }} />
                                 <Label htmlFor={`${field.id}-${opt}`} className="text-xs font-bold cursor-pointer">{opt}</Label>
                               </div>
                             ))}
                          </div>
                        )}

                        {field.type === 'map' && (
                           <div className="border-2 rounded-xl p-6 bg-slate-50 space-y-4 text-center border-dashed group hover:border-primary transition-all">
                              <MapPin size={32} className="mx-auto text-primary group-hover:animate-bounce" />
                              <p className="text-xs font-bold text-slate-500">{isAr ? "تم تحديد الموقع الجغرافي تلقائياً عبر GIS" : "Geolocation captured via GIS Integration"}</p>
                              <Button type="button" variant="outline" size="sm" className="rounded-full font-black text-[10px]">{isAr ? "فتح الخريطة" : "Open Map"}</Button>
                              <input type="hidden" value="23.5880,58.3829" />
                           </div>
                        )}

                        {field.type === 'upload' && (
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 cursor-pointer hover:border-accent transition-colors group relative">
                            <Upload size={24} className="mx-auto text-slate-300 mb-2 group-hover:text-accent transition-colors" />
                            <p className="text-xs text-slate-400 font-bold">{isAr ? "اضغط لرفع الملفات المطلوبة" : "Click to upload required files"}</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFormData({...formData, [field.id]: 'attached_file_pki'})} />
                          </div>
                        )}

                        {field.type === 'text' && (
                          <Input required={field.required} placeholder="..." className="h-12 bg-slate-50" onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
                        )}
                        
                        {field.type === 'number' && (
                          <Input type="number" required={field.required} className="h-12 bg-slate-50" onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
                        )}
                      </div>
                    ))}

                    {!currentStep?.fields.length && currentStepIndex > 0 && (
                      <div className="text-center py-12">
                        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                        <p className="font-bold text-slate-500">{isAr ? "اضغط على زر الإرسال لإتمام العملية" : "Click submit to complete the process"}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 p-8 flex justify-between">
                   <Button 
                    type="button" 
                    variant="ghost" 
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex(0)}
                    className="font-black gap-2"
                  >
                     <ArrowLeft className={cn("size-4", isAr && "rotate-180")} />
                     {isAr ? "إعادة" : "Restart"}
                   </Button>
                   <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="dm-gradient-primary rounded-full px-12 h-14 font-black shadow-xl gap-3"
                  >
                     {submitting ? <Loader2 className="animate-spin" /> : currentStep?.actionType === 'payment' ? <CreditCard size={20} /> : <ArrowRight size={20} className={cn(isAr && "rotate-180")} />}
                     {currentStepIndex === (flow?.steps.length || 0) - 1 ? (isAr ? "إرسال الطلب" : "Submit Request") : (isAr ? "الخطوة التالية" : "Next Step")}
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
