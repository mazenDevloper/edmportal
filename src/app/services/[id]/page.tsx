'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { Service, ServiceApplication } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ShieldCheck,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ServiceApplicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    fullName: '',
    nationalId: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data) {
        const found = data.services.find((s: Service) => s.id === id);
        setService(found || null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const db = await fetchBin();
      const newApp: ServiceApplication = {
        id: `app_${Date.now()}`,
        serviceId: service?.id || '',
        serviceName: isAr ? service?.title || '' : service?.titleEn || '',
        citizenName: formData.fullName,
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit application."
      });
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

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
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

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Service Info Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <Card className="rounded-brand shadow-sm border-t-4 border-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck size={24} />
                </div>
                <CardTitle className="text-xl font-black">{isAr ? service.title : service.titleEn}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{isAr ? service.description : service.descriptionEn}</p>
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{isAr ? "المتطلبات الأساسية" : "Core Requirements"}</h4>
                  <ul className="space-y-2">
                    {(isAr ? service.reqsAr : service.reqsEn)?.map((req, idx) => (
                      <li key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-accent" /> {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "الرسوم" : "Fees"}</span>
                  <span className="text-emerald-600 font-black">{service.fees}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex gap-4">
               <div className="p-2 h-fit bg-emerald-500 rounded-lg text-white">
                 <CheckCircle2 size={18} />
               </div>
               <div>
                 <p className="text-xs font-black text-emerald-900 mb-1">{isAr ? "نظام آمن" : "Secure System"}</p>
                 <p className="text-[10px] text-emerald-700 font-bold leading-relaxed">{isAr ? "سيتم معالجة بياناتك بأمان وسرية تامة." : "Your data will be processed securely."}</p>
               </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="md:col-span-2">
            <Card className="rounded-brand shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <FileText className="text-accent" /> {isAr ? "نموذج تقديم الطلب الرقمي" : "Digital Application Form"}
                </CardTitle>
                <p className="text-sm text-white/50 font-bold mt-2">{isAr ? "يرجى تعبئة كافة الحقول المطلوبة بدقة" : "Please fill in all required fields accurately"}</p>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-8 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
                      <Input 
                        required 
                        placeholder="John Doe" 
                        value={formData.fullName} 
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        className="h-12 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">{isAr ? "الرقم المدني" : "National ID"}</Label>
                      <Input 
                        required 
                        placeholder="12345678" 
                        value={formData.nationalId} 
                        onChange={e => setFormData({...formData, nationalId: e.target.value})}
                        className="h-12 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">{isAr ? "رقم الهاتف" : "Phone Number"}</Label>
                      <Input 
                        required 
                        type="tel" 
                        placeholder="+968" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="h-12 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">{isAr ? "البريد الإلكتروني" : "Email Address"}</Label>
                      <Input 
                        required 
                        type="email" 
                        placeholder="email@example.com" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="h-12 border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-black text-primary mb-4">{isAr ? "بيانات إضافية خاصة بالخدمة" : "Service Specific Data"}</h3>
                    <div className="space-y-4">
                      {service.reqsAr?.map((req, idx) => (
                        <div key={idx} className="space-y-2">
                          <Label className="font-bold text-slate-700">{req}</Label>
                          <Input 
                            placeholder={isAr ? `أدخل ${req}...` : `Enter ${req}...`} 
                            className="h-12 border-slate-200 bg-slate-50"
                            onChange={e => setFormData({...formData, [`req_${idx}`]: e.target.value})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 p-8 flex justify-end">
                   <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="dm-gradient-primary rounded-full px-12 h-14 font-black shadow-xl gap-3"
                  >
                     {submitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                     {isAr ? "إرسال الطلب الآن" : "Submit Application Now"}
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
