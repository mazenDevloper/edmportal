
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin, updateBin } from '@/lib/jsonbin';
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
  AlertCircle,
  FileText,
  ArrowRight,
  CreditCard,
  ListChecks,
  Upload,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Confetti from 'react-confetti';
import QRCode from 'react-qr-code';

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
  const [success, setSuccess] = useState(false);
  const [appId, setAppId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const foundSvc = (data.services || []).find((s: Service) => s.id === id);
          const foundFlow = (data.serviceFlows || []).find((f: ServiceFlow) => f.serviceId === id || f.id === id);
          
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
        serviceName: isAr ? service?.title || '' : service?.titleEn || '',
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
      toast({
        title: isAr ? "تم تقديم الطلب" : "Application Submitted",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (success) {
    return (
      <div className={cn("min-h-screen bg-slate-50 flex items-center justify-center p-6", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
        <Confetti recycle={false} numberOfPieces={200} />
        <Card className="max-w-xl w-full rounded-[3rem] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
           <div className="p-12 text-center space-y-8">
              <div className="size-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                 <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-4xl font-black text-primary">{isAr ? "شكراً لك!" : "Thank You!"}</h2>
                 <p className="text-slate-500 font-bold">{isAr ? "تم تقديم طلبك بنجاح" : "Your application has been submitted"}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center gap-6">
                 <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <QRCode value={appId} size={150} />
                 </div>
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
                   <IconComponent size={24} />
                </div>
                <CardTitle className="text-xl font-black">{isAr ? service?.title : service?.titleEn}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{isAr ? service?.description : service?.descriptionEn}</p>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "الرسوم" : "Fees"}</span>
                  <span className="text-emerald-600 font-black">{service?.fees || '10 OMR'}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><ListChecks size={14}/> {isAr ? "المستندات المطلوبة" : "Required Docs"}</h4>
                <ul className="space-y-2">
                  {((isAr ? service?.reqsAr : service?.reqsEn) || [])?.map((req, idx) => (
                    <li key={idx} className="text-xs font-bold text-slate-600 flex items-start gap-2">
                      <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <Card className="rounded-brand shadow-xl overflow-hidden border-none">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <FileText className="text-accent" /> {isAr ? currentStep?.titleAr : currentStep?.titleEn}
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-8 space-y-6 min-h-[300px]">
                   {currentStep?.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="font-bold text-slate-700">{isAr ? field.labelAr : field.labelEn}</Label>
                        {field.type === 'upload' ? (
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 cursor-pointer hover:border-accent transition-colors group relative">
                            <Upload size={24} className="mx-auto text-slate-300 mb-2 group-hover:text-accent" />
                            <p className="text-xs text-slate-400 font-bold">{isAr ? "اسحب الملفات هنا أو اضغط للرفع" : "Drag files here or click to upload"}</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => setFormData({...formData, [field.id]: 'attached'})} />
                          </div>
                        ) : (
                          <Input required={field.required} placeholder="..." className="h-12 bg-slate-50" onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
                        )}
                      </div>
                   ))}
                </CardContent>
                <CardFooter className="bg-slate-50 p-8 flex justify-between">
                   <Button type="button" variant="ghost" disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex(0)} className="font-black gap-2">
                     <ArrowLeft className={cn("size-4", isAr && "rotate-180")} /> {isAr ? "إعادة" : "Restart"}
                   </Button>
                   <Button type="submit" disabled={submitting} className="dm-gradient-primary rounded-full px-12 h-14 font-black shadow-xl gap-3">
                     {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} className={cn(isAr && "rotate-180")} />}
                     {currentStepIndex === (flow?.steps.length || 0) - 1 ? (isAr ? "إرسال الطلب" : "Submit") : (isAr ? "التالي" : "Next")}
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
