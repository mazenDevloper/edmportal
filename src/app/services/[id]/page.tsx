
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
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { 
  Loader2, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Upload, 
  ListChecks, 
  Info,
  BadgeCent,
  ShieldAlert,
  Sparkles,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import Confetti from 'react-confetti';
import QRCode from 'react-qr-code';
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [success, setSuccess] = useState(false);
  const [appId, setAppId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const foundSvc = (data.services || []).find((s: Service) => s.id === id) || null;
          const foundFlow = (data.serviceFlows || []).find((f: ServiceFlow) => f.serviceId === id || f.id === id) || null;
          setService(foundSvc);
          setFlow(foundFlow);
        }
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow) return;

    const currentStep = flow.steps[currentStepIndex];
    
    // Logic routing
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
            serviceName: isAr ? service?.title || '' : service?.titleEn || service?.title || '', 
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
        <Button onClick={() => router.push('/')} className="w-full h-16 rounded-2xl dm-gradient-primary font-black shadow-xl">{isAr ? "العودة للرئيسية" : "Back to Portal"}</Button>
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
             <Image src="https://imagetourl.cloud/a90z81isxaf9.png" alt="Logo" width={60} height={40} className="object-contain" unoptimized />
             <span className="font-black text-xl text-primary">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
           </Link>
           <Button variant="ghost" onClick={() => router.push('/')} className="font-bold rounded-xl">{isAr ? 'إلغاء' : 'Cancel'}</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sidebar - Open Always */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="bg-slate-900 text-white p-8">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg"><IconComponent size={28} /></div>
                      <Badge className="bg-accent text-slate-900 font-black uppercase text-[9px] tracking-[0.2em]">{isAr ? 'بيانات الخدمة' : 'Service Intel'}</Badge>
                   </div>
                   <h1 className="text-2xl font-black leading-tight tracking-tight">{isAr ? service?.title : (service?.titleEn || service?.title)}</h1>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                   <div className="space-y-4">
                     <h5 className="flex items-center gap-3 text-primary font-black text-lg border-b pb-2"><Info size={20} className="text-accent"/> {isAr ? 'نبذة عن الخدمة' : 'About Service'}</h5>
                     <p className="text-sm font-bold text-slate-500 leading-relaxed">{isAr ? service?.description : (service?.descriptionEn || service?.description)}</p>
                   </div>
                   <div className="space-y-4">
                     <h5 className="flex items-center gap-3 text-primary font-black text-lg border-b pb-2"><ListChecks size={20} className="text-accent"/> {isAr ? 'المستندات المطلوبة' : 'Requirements'}</h5>
                     <ul className="space-y-3">{ (isAr ? service?.reqsAr : service?.reqsEn)?.map((r, i) => (<li key={i} className="text-xs font-bold text-slate-600 flex items-start gap-3"><div className="size-2 rounded-full bg-accent mt-1.5 shrink-0" /><span>{r}</span></li>)) }</ul>
                   </div>
                   <div className="space-y-4">
                     <h5 className="flex items-center gap-3 text-primary font-black text-lg border-b pb-2"><BadgeCent size={20} className="text-accent"/> {isAr ? 'الرسوم المقررة' : 'Fees'}</h5>
                     <div className="p-5 bg-emerald-50 rounded-2xl text-xl font-black text-emerald-700">{isAr ? service?.fees : (service?.feesEn || service?.fees)}</div>
                   </div>
                   <div className="space-y-4">
                     <h5 className="flex items-center gap-3 text-primary font-black text-lg border-b pb-2"><ShieldAlert size={20} className="text-accent"/> {isAr ? 'الاشتراطات' : 'Conditions'}</h5>
                     <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-bold text-amber-900 leading-loose">
                        {isAr ? service?.conditionsAr : (service?.conditionsEn || service?.conditionsAr)}
                     </div>
                   </div>
                </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="rounded-[3rem] shadow-2xl overflow-hidden min-h-[650px] flex flex-col bg-white border-none ring-1 ring-slate-100">
              <CardHeader className="bg-slate-950 text-white p-10 relative">
                <div className="relative z-10">
                  <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg uppercase text-[9px] mb-4">{isAr ? `المرحلة ${currentStepIndex + 1}` : `Phase ${currentStepIndex + 1}`}</Badge>
                  <CardTitle className="text-4xl font-black flex items-center gap-5 tracking-tighter"><FileText className="text-accent" size={40} /> {isAr ? currentStep?.titleAr : currentStep?.titleEn}</CardTitle>
                </div>
                <div className="absolute top-0 right-0 w-full h-full dm-pattern-wave-pro opacity-10 pointer-events-none" />
              </CardHeader>
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <CardContent className="p-12 space-y-12 flex-1">
                   {currentStep?.fields.map((field) => (
                      <div key={field.id} className="space-y-4">
                        <Label className="text-lg font-black text-slate-700 flex items-center gap-2">{isAr ? field.labelAr : field.labelEn}{field.required && <span className="text-red-500">*</span>}</Label>
                        {field.type === 'upload' ? (
                          <div className="border-4 border-dashed rounded-[2.5rem] p-16 text-center bg-slate-50 cursor-pointer hover:bg-white transition-all relative group/upload">
                            <Upload size={32} className="mx-auto mb-4 text-primary group-hover/upload:scale-110 transition-transform" />
                            <p className="font-black text-slate-500">{isAr ? 'اضغط هنا لرفع المستند' : 'Click to Upload'}</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => setFormData({...formData, [field.id]: 'Attached'})} required={field.required} />
                          </div>
                        ) : field.type === 'select' ? (
                          <Select onValueChange={v => setFormData({...formData, [field.id]: v})} required={field.required}>
                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none text-lg font-bold"><SelectValue placeholder={isAr ? 'اختر خياراً...' : 'Choose option...'} /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">{field.options?.map((o, idx) => (<SelectItem key={idx} value={o} className="font-bold py-3">{o}</SelectItem>))}</SelectContent>
                          </Select>
                        ) : field.type === 'info' ? (
                          <Card className="rounded-[2rem] border-none shadow-xl bg-primary/5 p-10 border-l-8 border-primary relative overflow-hidden">
                             <div className="absolute top-0 right-0 size-32 dm-pattern-matrix-all opacity-5 -rotate-12" />
                             <ul className="space-y-6 relative z-10">
                               { (field.options || [])?.map((line, lIdx) => (
                                 <li key={lIdx} className="flex items-start gap-4 font-bold text-slate-700 text-base leading-relaxed">
                                    <div className="size-2.5 rounded-full bg-primary mt-2 shrink-0 shadow-sm" />
                                    {line}
                                 </li>
                               )) }
                             </ul>
                          </Card>
                        ) : field.type === 'map' ? (
                          <div className="h-64 rounded-[2rem] bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 gap-4 group cursor-pointer hover:bg-slate-50 transition-all">
                             <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Icons.MapPin size={32}/></div>
                             <p className="font-black text-slate-400">{isAr ? 'اضغط لتحديد الموقع الجغرافي' : 'Pin Location on Map'}</p>
                             <input type="hidden" name={field.id} value="17.0151, 54.0924" />
                          </div>
                        ) : (
                          <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} required={field.required} className="h-16 rounded-2xl bg-slate-50 border-none text-lg font-bold px-6 focus:ring-2 focus:ring-primary/20" onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
                        )}
                      </div>
                   ))}
                </CardContent>
                <CardFooter className="bg-slate-50 p-10 flex justify-between items-center border-t rounded-b-[3rem]">
                   <Button type="button" variant="ghost" disabled={currentStepIndex === 0} onClick={() => setCurrentStepIndex(0)} className="font-black h-16 rounded-2xl px-8 hover:bg-white transition-colors text-slate-500">{isAr ? 'إعادة البدء' : 'Reset'}</Button>
                   <Button type="submit" disabled={submitting} className="dm-gradient-primary rounded-2xl px-14 h-16 font-black shadow-xl gap-4 text-xl transition-transform active:scale-95">
                      {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight className={cn("size-6", isAr && "rotate-180")} />}
                      {currentStepIndex === (flow?.steps.length || 0) - 1 ? (isAr ? "إرسال الطلب النهائي" : "Submit Final Application") : (isAr ? "المرحلة التالية" : "Next Phase")}
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
