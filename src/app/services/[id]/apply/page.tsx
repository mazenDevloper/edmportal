
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useAdminSession } from '@/lib/admin-session';
import { isPublicService, nextReference } from '@/lib/service-visibility';
import { maskPhone, useCitizen, useCitizenSession } from '@/lib/citizen-session';
import { Service, ServiceApplication, ServiceFlow } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  MapPin,
  FolderSync,
  Check,
  AlertCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { FormField } from '@/lib/types';
import { ServiceIcon } from '@/components/service/service-icon';
import { LINKED_INFO, LinkedKind, isValidCrNumber, linkedKind } from '@/lib/linked-data';
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
  // Applying needs a Thiqa sign-in; the pop-up brings the beneficiary back here afterwards
  const citizenPhone = useCitizen();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !citizenPhone) useCitizenSession.getState().openPrompt(`/services/${id}/apply`); }, [mounted, citizenPhone, id]);

  const [service, setService] = useState<Service | null>(null);
  const [flow, setFlow] = useState<ServiceFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [success, setSuccess] = useState(false);
  const [appId, setAppId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Progressive wizard: eligibility conditions → required documents → the service's form steps
  const [phase, setPhase] = useState<'conditions' | 'documents' | 'form'>('conditions');
  const [acceptedConditions, setAcceptedConditions] = useState(false);
  const [docStatus, setDocStatus] = useState<Record<string, 'pending' | 'fetching' | 'fetched' | 'manual'>>({});
  const [docsConfirmed, setDocsConfirmed] = useState(false);
  // Visited form steps, so "Back" follows the branch the applicant actually took
  const [stepHistory, setStepHistory] = useState<number[]>([]);

  const goToStep = (idx: number) => {
    setStepHistory(h => [...h, currentStepIndex]);
    setCurrentStepIndex(idx);
  };

  const goBack = () => {
    if (!stepHistory.length) { setPhase('documents'); return; }
    setCurrentStepIndex(stepHistory[stepHistory.length - 1]);
    setStepHistory(h => h.slice(0, -1));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const svc = (data.services || []).find((s: Service) => s.id === id) || null;
          // Services hidden in the control panel are only reachable by a signed-in admin (for preview)
          const foundSvc = svc && !isPublicService(svc) && useAdminSession.getState().expiresAt <= Date.now() ? null : svc;
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
      if (nextIdx !== -1) { goToStep(nextIdx); return; }
    }

    if (currentStepIndex < flow.steps.length - 1) {
      goToStep(currentStepIndex + 1);
      return;
    }

    setSubmitting(true);
    try {
      const db = await fetchBin();
      const newId = service ? nextReference(service, db.services || [], db.applications || []) : `DM-${Date.now()}`;
      await updateBin({ 
        ...db, 
        applications: [
          { 
            id: newId, 
            serviceId: service?.id || '', 
            serviceName: isAr ? service?.title || '' : service?.titleEn || service?.title || '', 
            citizenName: user?.displayName || (citizenPhone ? `Thiqa ${maskPhone(citizenPhone)}` : 'PKI User'),
            applicantPhone: citizenPhone || undefined,
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

  if (loading || !mounted) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (!citizenPhone) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <Card className="max-w-md w-full rounded-[2.5rem] shadow-xl p-10 text-center space-y-5">
        <ShieldAlert size={48} className="mx-auto text-[#005751]" aria-hidden />
        <h1 className="text-2xl font-black text-slate-900">{isAr ? 'سجّل الدخول عبر ثقة لتقديم الطلب' : 'Sign in with Thiqa to apply'}</h1>
        <p className="text-sm font-bold text-slate-500">{isAr ? 'نحتاج التحقق من هويتك قبل تقديم الطلب، وتُجلب بياناتك الشخصية تلقائياً.' : 'We need to verify your identity before you apply; your personal details are filled in automatically.'}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => useCitizenSession.getState().openPrompt(`/services/${id}/apply`)} className="h-12 rounded-xl font-black bg-[#005751]">{isAr ? 'تسجيل الدخول عبر ثقة' : 'Sign in with Thiqa'}</Button>
          <Button variant="ghost" asChild className="font-black"><Link href={`/services/${id}`}>{isAr ? 'العودة إلى دليل الخدمة' : 'Back to the service guide'}</Link></Button>
        </div>
      </Card>
    </div>
  );

  if (!service) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-slate-900">{isAr ? 'الخدمة غير متاحة' : 'This service is not available'}</h1>
        <Button asChild className="rounded-xl font-black"><Link href="/catalog">{isAr ? 'دليل الخدمات' : 'Service catalogue'}</Link></Button>
      </div>
    </div>
  );

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
        <p className="text-sm font-bold text-slate-500">{isAr ? 'احتفظ برقم المعاملة لمتابعة حالتها. أول حرفين يدلان على نوع الخدمة.' : 'Keep this number to follow your request. The first two letters show the service type.'}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-14 rounded-2xl font-black border-2"><Link href={`/track?ref=${encodeURIComponent(appId)}`}>{isAr ? 'متابعة حالة الطلب' : 'Track this request'}</Link></Button>
          <Button onClick={() => router.push('/')} className="h-14 rounded-2xl dm-gradient-primary font-black shadow-xl">{isAr ? "العودة للرئيسية" : "Back to Portal"}</Button>
        </div>
      </Card>
    </div>
  );

  const currentStep = flow?.steps[currentStepIndex];
  const isExternal = service?.type === 'link' && !!service.linkUrl;

  // ─── Wizard data ───
  const allFields = flow?.steps.flatMap(s => s.fields) || [];
  const isEligibilityField = (f: FormField) => f.type === 'info' && (f.labelEn === 'Eligibility' || f.labelAr === 'شروط الاستفادة');

  // Conditions: eligibility notes from the flow + the service's own conditions
  const conditions: string[] = [
    ...allFields.filter(isEligibilityField).map(f => (isAr ? f.content?.bodyAr : f.content?.bodyEn || f.content?.bodyAr) || ''),
    (isAr ? service?.conditionsAr : service?.conditionsEn || service?.conditionsAr) || '',
  ].map(s => s.trim()).filter(Boolean);

  // Documents: the flow's upload fields (bilingual, fillable), else the service requirement list
  // ID card / CR documents are never requested: they come from Thiqa and the CR link
  const fieldLinked = (f: FormField) => linkedKind(f.labelAr) || linkedKind(f.labelEn);
  const uploadFields = allFields.filter(f => f.type === 'upload' && !fieldLinked(f));
  const allDocs: { id: string; label: string; required: boolean; linked: LinkedKind | null }[] = allFields.some(f => f.type === 'upload')
    ? allFields.filter(f => f.type === 'upload').map(f => ({ id: f.id, label: isAr ? f.labelAr : f.labelEn || f.labelAr, required: f.required, linked: fieldLinked(f) }))
    : ((isAr ? service?.reqsAr : service?.reqsEn?.length ? service?.reqsEn : service?.reqsAr) || []).map((r, i) => ({ id: `req_${i}`, label: r, required: true, linked: linkedKind(r) || linkedKind(service?.reqsAr?.[i]) }));
  const documents = allDocs.filter(d => !d.linked);
  const linkedSources = Array.from(new Set([
    ...allDocs.map(d => d.linked),
    ...allFields.map(fieldLinked),
  ].filter(Boolean))) as LinkedKind[];

  const fetchedCount = documents.filter(d => docStatus[d.id] === 'fetched').length;
  // The CR number is the only thing asked for establishment data
  const crOk = !linkedSources.includes('cr') || isValidCrNumber(formData.__crNumber || '');
  const fetchDone = documents.length > 0 && documents.every(d => docStatus[d.id] === 'fetched' || docStatus[d.id] === 'manual');
  const fetching = documents.some(d => docStatus[d.id] === 'fetching');

  // Simulated fetch from the applicant's digital vault (no vault API yet): each document is marked
  // fetched and its upload field pre-filled; the applicant can still replace it in the form.
  const fetchDocuments = async () => {
    for (const doc of documents) {
      setDocStatus(prev => ({ ...prev, [doc.id]: 'fetching' }));
      await new Promise(r => setTimeout(r, 400));
      setDocStatus(prev => ({ ...prev, [doc.id]: 'fetched' }));
      if (uploadFields.some(f => f.id === doc.id)) setFormData(prev => ({ ...prev, [doc.id]: 'vault' }));
    }
  };

  // Or skip the vault: every document is uploaded manually in the form steps
  const uploadManually = () => {
    setDocStatus(Object.fromEntries(documents.map(d => [d.id, 'manual' as const])));
    setFormData(prev => Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== 'vault')));
  };

  const wizardSteps = [
    { key: 'conditions', label: isAr ? 'الشروط' : 'Conditions' },
    { key: 'documents', label: isAr ? 'المستندات' : 'Documents' },
    ...(flow?.steps || []).map(s => ({ key: s.id, label: isAr ? s.titleAr : s.titleEn || s.titleAr })),
  ];
  const activeWizardIndex = phase === 'conditions' ? 0 : phase === 'documents' ? 1 : 2 + currentStepIndex;
  const progress = Math.round(((activeWizardIndex + 1) / wizardSteps.length) * 100);
  const optionLabel = (f: FormField, o: string, idx: number) => (!isAr && f.optionsEn?.[idx]) || o;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3">
             <Image src="https://imagetourl.cloud/a90z81isxaf9.png" alt="Logo" width={60} height={40} className="object-contain" unoptimized />
             <span className="font-black text-xl text-primary">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
           </Link>
           <Button variant="ghost" onClick={() => router.push(`/services/${id}`)} className="font-bold rounded-xl">{isAr ? 'إلغاء' : 'Cancel'}</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sidebar - Open Always */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="bg-slate-900 text-white p-8">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg"><ServiceIcon service={service} size={28} /></div>
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

          <div className="lg:col-span-8 space-y-6 min-w-0">
            {isExternal && service && <ExternalServiceCard service={service} isAr={isAr} />}

            {!isExternal && (<>
            {/* Progress stepper */}
            <Card className="rounded-[2rem] shadow-xl border-none bg-white ring-1 ring-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-primary">{isAr ? `الخطوة ${activeWizardIndex + 1} من ${wizardSteps.length}` : `Step ${activeWizardIndex + 1} of ${wizardSteps.length}`}</span>
                <span className="text-slate-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" aria-label={isAr ? 'نسبة الإنجاز' : 'Progress'} />
              <ol className="flex gap-2 overflow-x-auto pb-1">
                {wizardSteps.map((s, i) => {
                  const done = i < activeWizardIndex, active = i === activeWizardIndex;
                  return (
                    <li key={s.key} aria-current={active ? 'step' : undefined}
                      className={cn('flex items-center gap-2 shrink-0 rounded-full px-3 py-1.5 text-xs font-black border',
                        active ? 'bg-primary text-white border-primary' : done ? 'bg-accent/10 text-primary border-accent/30' : 'bg-slate-50 text-slate-400 border-slate-100')}>
                      <span className={cn('size-5 rounded-full flex items-center justify-center text-[10px]', active ? 'bg-white/20' : done ? 'bg-accent text-white' : 'bg-slate-200')}>
                        {done ? <Check size={12} /> : i + 1}
                      </span>
                      {s.label}
                    </li>
                  );
                })}
              </ol>
            </Card>

            {phase === 'conditions' && (
              <Card className="rounded-[3rem] shadow-2xl overflow-hidden bg-white border-none ring-1 ring-slate-100">
                <CardHeader className="bg-slate-950 text-white p-10">
                  <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg text-[10px] mb-4 w-fit">{isAr ? 'قبل البدء' : 'Before you start'}</Badge>
                  <CardTitle className="text-3xl font-black flex items-center gap-4"><ShieldAlert className="text-accent" size={34} />{isAr ? 'شروط الاستفادة من الخدمة' : 'Service eligibility conditions'}</CardTitle>
                  <p className="text-white/60 font-bold text-sm mt-2">{isAr ? 'يرجى قراءة الشروط التالية والتأكد من استيفائها قبل تقديم الطلب.' : 'Please read the conditions below and make sure you meet them before applying.'}</p>
                </CardHeader>
                <CardContent className="p-10 space-y-6">
                  {conditions.length ? (
                    <ul className="space-y-4">
                      {conditions.map((c, i) => (
                        <li key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 font-bold leading-loose">
                          <span className="size-7 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-5 rounded-2xl bg-slate-50 text-slate-500 font-bold">{isAr ? 'لا توجد شروط خاصة لهذه الخدمة.' : 'This service has no special conditions.'}</p>
                  )}
                  <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-primary/15 bg-primary/5 cursor-pointer">
                    <Checkbox checked={acceptedConditions} onCheckedChange={v => setAcceptedConditions(v === true)} className="mt-1 size-5" />
                    <span className="font-black text-slate-700 leading-relaxed">{isAr ? 'أقر بأنني اطّلعت على الشروط وأستوفيها، وأتحمل مسؤولية صحة البيانات المقدمة.' : 'I confirm I have read and meet these conditions and am responsible for the accuracy of my data.'}</span>
                  </label>
                </CardContent>
                <CardFooter className="bg-slate-50 p-8 flex justify-end border-t">
                  <Button disabled={!acceptedConditions} onClick={() => setPhase('documents')} className="dm-gradient-primary rounded-2xl px-12 h-14 font-black shadow-xl gap-3 text-lg">
                    {isAr ? 'متابعة إلى المستندات' : 'Continue to documents'}<ArrowRight className={cn('size-5', isAr && 'rotate-180')} />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {phase === 'documents' && (
              <Card className="rounded-[3rem] shadow-2xl overflow-hidden bg-white border-none ring-1 ring-slate-100">
                <CardHeader className="bg-slate-950 text-white p-10">
                  <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg text-[10px] mb-4 w-fit">{isAr ? 'التحقق من المستندات' : 'Document check'}</Badge>
                  <CardTitle className="text-3xl font-black flex items-center gap-4"><ListChecks className="text-accent" size={34} />{isAr ? 'المستندات المطلوبة' : 'Required documents'}</CardTitle>
                  <p className="text-white/60 font-bold text-sm mt-2">{isAr ? 'اجلب مستنداتك من الخزانة الرقمية، أو ارفعها يدوياً في خطوات النموذج.' : 'Fetch your documents from your digital vault, or upload them yourself in the form steps.'}</p>
                </CardHeader>
                <CardContent className="p-10 space-y-6">
                  {linkedSources.length > 0 && (
                    <LinkedDataPanel kinds={linkedSources} isAr={isAr} citizenName={user?.displayName || null}
                      crNumber={formData.__crNumber || ''} onCrNumber={v => setFormData(prev => ({ ...prev, __crNumber: v }))} />
                  )}
                  {documents.length === 0 ? (
                    <p className="p-5 rounded-2xl bg-slate-50 text-slate-500 font-bold">{isAr ? 'لا تتطلب هذه الخدمة مستندات أخرى.' : 'This service needs no other documents.'}</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={fetchDocuments} disabled={fetching} className="rounded-2xl h-12 px-6 font-black gap-2 dm-gradient-primary">
                          {fetching ? <Loader2 className="animate-spin" size={18} /> : <FolderSync size={18} />}
                          {isAr ? 'جلب المستندات من الخزانة الرقمية' : 'Fetch documents from my digital vault'}
                        </Button>
                        <Button type="button" variant="outline" onClick={uploadManually} disabled={fetching} className="rounded-2xl h-12 px-6 font-black gap-2">
                          <Upload size={18} />{isAr ? 'سأرفعها يدوياً' : "I'll upload them myself"}
                        </Button>
                      </div>
                      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden" aria-live="polite">
                        {documents.map(doc => {
                          const st = docStatus[doc.id] || 'pending';
                          return (
                            <li key={doc.id} className="flex items-center gap-4 p-4 bg-white">
                              <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0',
                                st === 'fetched' ? 'bg-emerald-50 text-emerald-600' : st === 'manual' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400')}>
                                {st === 'fetching' ? <Loader2 className="animate-spin" size={18} /> : st === 'fetched' ? <CheckCircle2 size={18} /> : st === 'manual' ? <Upload size={18} /> : <FileText size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 text-sm">{doc.label}{doc.required && <span className="text-red-500"> *</span>}</p>
                                <p className="text-xs font-bold text-slate-400">
                                  {st === 'fetching' ? (isAr ? 'جاري الجلب...' : 'Fetching...')
                                    : st === 'fetched' ? (isAr ? 'تم الجلب من الخزانة الرقمية' : 'Fetched from your digital vault')
                                    : st === 'manual' ? (isAr ? 'سيُرفع يدوياً في النموذج' : 'To be uploaded in the form')
                                    : (isAr ? 'بانتظار الجلب' : 'Waiting')}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {fetchedCount > 0 && (
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><AlertCircle size={14} />{isAr ? `تم جلب ${fetchedCount} من ${documents.length} مستند. يمكنك استبدال أي مستند في خطوات النموذج.` : `${fetchedCount} of ${documents.length} documents fetched. You can replace any of them in the form.`}</p>
                      )}
                    </>
                  )}
                  <label className={cn('flex items-start gap-4 p-5 rounded-2xl border-2 border-primary/15 bg-primary/5', (documents.length && !fetchDone) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
                    <Checkbox checked={docsConfirmed} disabled={documents.length > 0 && !fetchDone} onCheckedChange={v => setDocsConfirmed(v === true)} className="mt-1 size-5" />
                    <span className="font-black text-slate-700 leading-relaxed">{isAr ? 'أؤكد أن المستندات المطلوبة صحيحة وسارية المفعول وتخصني.' : 'I confirm the required documents are correct, valid and mine.'}</span>
                  </label>
                </CardContent>
                <CardFooter className="bg-slate-50 p-8 flex justify-between border-t gap-3">
                  <Button variant="ghost" onClick={() => setPhase('conditions')} className="font-black h-14 rounded-2xl px-6 gap-2 text-slate-500">
                    <ArrowLeft className={cn('size-5', isAr && 'rotate-180')} />{isAr ? 'السابق' : 'Back'}
                  </Button>
                  <Button disabled={!docsConfirmed || !crOk || (documents.length > 0 && !fetchDone)} onClick={() => { setPhase('form'); setCurrentStepIndex(0); }} className="dm-gradient-primary rounded-2xl px-12 h-14 font-black shadow-xl gap-3 text-lg">
                    {isAr ? 'بدء تعبئة الطلب' : 'Start the application'}<ArrowRight className={cn('size-5', isAr && 'rotate-180')} />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {phase === 'form' && (
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
                   {currentStep?.fields.filter(f => !isEligibilityField(f)).map((field) => (
                      <div key={field.id} className="space-y-4">
                        <Label className="text-lg font-black text-slate-700 flex items-center gap-2">{isAr ? field.labelAr : field.labelEn}{field.required && field.type !== 'info' && !fieldLinked(field) && <span className="text-red-500">*</span>}</Label>
                        {field.type !== 'info' && fieldLinked(field) ? (
                          <LinkedFieldCard kind={fieldLinked(field)!} isAr={isAr} citizenName={user?.displayName || null} crNumber={formData.__crNumber || ''} />
                        ) : field.type === 'upload' ? (
                          <div className={cn('border-4 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer hover:bg-white transition-all relative group/upload',
                            formData[field.id] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50')}>
                            {formData[field.id] ? <CheckCircle2 size={32} className="mx-auto mb-4 text-emerald-600" /> : <Upload size={32} className="mx-auto mb-4 text-primary group-hover/upload:scale-110 transition-transform" />}
                            <p className="font-black text-slate-500">
                              {formData[field.id] === 'vault' ? (isAr ? 'تم الجلب من الخزانة الرقمية — اضغط للاستبدال' : 'Fetched from your digital vault — click to replace')
                                : formData[field.id] ? (isAr ? 'تم إرفاق المستند — اضغط للاستبدال' : 'Document attached — click to replace')
                                : (isAr ? 'اضغط هنا لرفع المستند' : 'Click to Upload')}
                            </p>
                            <input type="file" aria-label={isAr ? field.labelAr : field.labelEn} className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => setFormData({...formData, [field.id]: 'Attached'})} required={field.required && !formData[field.id]} />
                          </div>
                        ) : field.type === 'select' ? (
                          <Select value={formData[field.id] || ''} onValueChange={v => setFormData({...formData, [field.id]: v})} required={field.required}>
                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none text-lg font-bold"><SelectValue placeholder={isAr ? 'اختر خياراً...' : 'Choose option...'} /></SelectTrigger>
                            {/* Values stay Arabic so the flow's branching rules keep matching */}
                            <SelectContent className="rounded-2xl border-none shadow-2xl">{field.options?.map((o, idx) => (<SelectItem key={idx} value={o} className="font-bold py-3">{optionLabel(field, o, idx)}</SelectItem>))}</SelectContent>
                          </Select>
                        ) : field.type === 'info' ? (
                          <Card className="rounded-[2rem] border-none shadow-xl bg-primary/5 p-10 border-s-8 border-primary relative overflow-hidden">
                             <div className="absolute top-0 right-0 size-32 dm-pattern-matrix-all opacity-5 -rotate-12" />
                             <ul className="space-y-6 relative z-10">
                               { [...(field.options || []), ...(((isAr ? field.content?.bodyAr : field.content?.bodyEn || field.content?.bodyAr) || '').split('\n'))].filter(l => l.trim()).map((line, lIdx) => (
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
                   <Button type="button" variant="ghost" onClick={goBack} className="font-black h-16 rounded-2xl px-8 gap-2 hover:bg-white transition-colors text-slate-500">
                     <ArrowLeft className={cn('size-5', isAr && 'rotate-180')} />{isAr ? 'السابق' : 'Back'}
                   </Button>
                   <Button type="submit" disabled={submitting} className="dm-gradient-primary rounded-2xl px-14 h-16 font-black shadow-xl gap-4 text-xl transition-transform active:scale-95">
                      {submitting ? <Loader2 className="animate-spin" /> : <ArrowRight className={cn("size-6", isAr && "rotate-180")} />}
                      {currentStepIndex === (flow?.steps.length || 0) - 1 ? (isAr ? "إرسال الطلب النهائي" : "Submit Final Application") : (isAr ? "المرحلة التالية" : "Next Phase")}
                   </Button>
                </CardFooter>
              </form>
            </Card>
            )}
            </>)}
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}

// ─── Linked data (never uploaded by the applicant) ───

function LinkedDataPanel({ kinds, isAr, citizenName, crNumber, onCrNumber }: { kinds: LinkedKind[]; isAr: boolean; citizenName: string | null; crNumber: string; onCrNumber: (v: string) => void }) {
  return (
    <section aria-labelledby="linked-title" className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 p-5 space-y-4">
      <h3 id="linked-title" className="font-black text-emerald-800 flex items-center gap-2"><ShieldAlert size={18} />{isAr ? 'بيانات تُجلب تلقائياً — لا تحتاج إرفاقها' : 'Fetched automatically — nothing to upload'}</h3>
      {kinds.map(kind => {
        const info = LINKED_INFO[kind];
        const crInvalid = kind === 'cr' && crNumber.length > 0 && !isValidCrNumber(crNumber);
        return (
          <div key={kind} className="rounded-xl bg-white border border-emerald-100 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-slate-800">{isAr ? info.titleAr : info.titleEn}</p>
              <Badge className="bg-emerald-600">{isAr ? `المصدر: ${info.sourceAr}` : `Source: ${info.sourceEn}`}</Badge>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">{isAr ? info.noteAr : info.noteEn}</p>
            {kind === 'identity' && (
              <p className="text-sm font-black text-emerald-700 flex items-center gap-2"><CheckCircle2 size={16} />
                {citizenName ? (isAr ? `مرتبطة بحساب: ${citizenName}` : `Linked to: ${citizenName}`) : (isAr ? 'ستُجلب من ثقة عند تسجيل الدخول' : 'Will be fetched from Thiqa at sign-in')}
              </p>
            )}
            {kind === 'cr' && (
              <div className="space-y-1">
                <Label htmlFor="cr-number" className="text-xs font-black text-slate-600">{isAr ? 'رقم السجل التجاري *' : 'CR number *'}</Label>
                <Input id="cr-number" inputMode="numeric" dir="ltr" value={crNumber} onChange={e => onCrNumber(e.target.value.replace(/\D/g, ''))}
                  aria-invalid={crInvalid} aria-describedby="cr-help" placeholder="1234567" className={cn('h-12 rounded-xl font-mono text-lg max-w-xs', crInvalid && 'border-red-400')} />
                <p id="cr-help" className={cn('text-[11px] font-bold', crInvalid ? 'text-red-600' : 'text-slate-400')}>
                  {crInvalid ? (isAr ? 'رقم السجل التجاري من 4 إلى 12 رقماً' : 'The CR number is 4–12 digits') : (isAr ? 'أرقام فقط — تُجلب البيانات من وزارة التجارة والصناعة وترويج الاستثمار.' : 'Digits only — data is fetched from the Ministry of Commerce.')}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function LinkedFieldCard({ kind, isAr, citizenName, crNumber }: { kind: LinkedKind; isAr: boolean; citizenName: string | null; crNumber: string }) {
  const info = LINKED_INFO[kind];
  const value = kind === 'cr'
    ? (crNumber ? (isAr ? `رقم السجل: ${crNumber}` : `CR no. ${crNumber}`) : (isAr ? 'يُربط برقم السجل التجاري المُدخل' : 'Linked through the CR number you entered'))
    : (citizenName || (isAr ? 'من حساب ثقة' : 'From your Thiqa account'));
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/60">
      <CheckCircle2 size={28} className="text-emerald-600 shrink-0" />
      <div className="min-w-0">
        <p className="font-black text-emerald-800">{value}</p>
        <p className="text-xs font-bold text-slate-500">{isAr ? `تُجلب تلقائياً من ${info.sourceAr} — لا يلزم إرفاق مستند` : `Fetched automatically from ${info.sourceEn} — no upload needed`}</p>
      </div>
    </div>
  );
}

function ExternalServiceCard({ service, isAr }: { service: Service; isAr: boolean }) {
  let host = service.linkUrl || '';
  try { host = new URL(service.linkUrl!).hostname; } catch { /* keep raw */ }
  return (
    <Card className="rounded-[3rem] shadow-2xl overflow-hidden bg-white border-none ring-1 ring-slate-100">
      <CardHeader className="bg-slate-950 text-white p-10">
        <Badge className="bg-accent text-slate-900 font-black px-4 rounded-lg text-[10px] mb-4 w-fit">{isAr ? 'خدمة على منصة خارجية' : 'Offered on an external platform'}</Badge>
        <CardTitle className="text-3xl font-black">{isAr ? service.title : service.titleEn || service.title}</CardTitle>
        <p className="text-white/60 font-bold text-sm mt-2">{isAr ? 'تُقدَّم هذه الخدمة عبر منصة شريكة. راجع الشروط والرسوم ثم انتقل لإكمال الطلب.' : 'This service is provided on a partner platform. Review the conditions and fees, then continue there.'}</p>
      </CardHeader>
      <CardContent className="p-10 space-y-6">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <ExternalLink className="text-[#008E91] shrink-0" size={24} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">{isAr ? 'ستنتقل إلى' : "You'll go to"}</p>
            <p className="font-black text-slate-800 truncate" dir="ltr">{host}</p>
          </div>
        </div>
        <Button asChild className="dm-gradient-primary rounded-2xl h-16 px-12 font-black shadow-xl gap-3 text-lg w-full sm:w-auto">
          <a href={service.linkUrl} target="_blank" rel="noopener noreferrer">
            {isAr ? 'الانتقال إلى الخدمة' : 'Go to the service'}<ExternalLink size={20} />
            <span className="sr-only">{isAr ? '(تفتح في نافذة جديدة)' : '(opens in a new tab)'}</span>
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
