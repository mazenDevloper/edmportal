
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ClipboardList, Save, ArrowLeft, MessageSquare, List, Star, X, Info, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { Survey, SurveyQuestion } from '@/lib/types';

export default function SurveyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyMeta, setSurveyMeta] = useState({ 
    titleAr: '', 
    titleEn: '', 
    descriptionAr: '', 
    descriptionEn: '',
    isPublicPoll: false 
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data && data.surveys) {
          const found = data.surveys.find((s: Survey) => s.id === editId);
          if (found) {
            setQuestions(found.questions || []);
            setSurveyMeta({
              titleAr: found.titleAr,
              titleEn: found.titleEn,
              descriptionAr: found.descriptionAr || '',
              descriptionEn: found.descriptionEn || '',
              isPublicPoll: found.isPublicPoll || false
            });
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [editId]);

  const addQuestion = (type: SurveyQuestion['type']) => {
    const newQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      type,
      questionAr: '',
      questionEn: '',
      options: type === 'mcq' ? [{ id: `opt_${Date.now()}`, textAr: 'خيار جديد', textEn: 'New Option', icon: 'Circle' }] : []
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSave = async () => {
    if (!surveyMeta.titleAr && !surveyMeta.titleEn) {
      toast({ variant: "destructive", title: "Required", description: "Please enter survey title." });
      return;
    }
    setSaving(true);
    try {
      const db = await fetchBin();
      const newId = editId || `survey_${Date.now()}`;
      const newSurvey: Survey = {
        id: newId,
        ...surveyMeta,
        questions,
        isActive: true,
        responsesCount: db.surveys?.find((s: any) => s.id === newId)?.responsesCount || 0
      };

      const filtered = (db.surveys || []).filter((s: any) => s.id !== newId);
      
      // If this is set as the public poll, disable other public polls
      const updatedSurveys = surveyMeta.isPublicPoll 
        ? filtered.map((s: any) => ({ ...s, isPublicPoll: false }))
        : filtered;

      await updateBin({
        ...db,
        surveys: [...updatedSurveys, newSurvey]
      });

      toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم تحديث الاستطلاع بنجاح" : "Survey updated successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save survey." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-3">
              <ClipboardList className="text-secondary" /> {isAr ? "باني الاستطلاعات والقرارات" : "Survey & Poll Architect"}
            </h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
              <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-secondary text-white hover:bg-secondary/90 rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ الاستطلاع" : "Save Survey"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24 overflow-hidden border-none">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "إضافة سؤال" : "Add Question"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addQuestion('text')} className="justify-start gap-2 font-black border-2"><MessageSquare size={14}/> {isAr ? "سؤال مفتوح" : "Open Text"}</Button>
              <Button variant="outline" onClick={() => addQuestion('mcq')} className="justify-start gap-2 font-black border-2"><List size={14}/> {isAr ? "خيارات متعددة" : "Multiple Choice"}</Button>
              <Button variant="outline" onClick={() => addQuestion('rating')} className="justify-start gap-2 font-black border-2"><Star size={14}/> {isAr ? "تقييم" : "Rating Scale"}</Button>
              
              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500">{isAr ? "استطلاع عام" : "Public Poll"}</span>
                  <input 
                    type="checkbox" 
                    checked={surveyMeta.isPublicPoll} 
                    onChange={e => setSurveyMeta({...surveyMeta, isPublicPoll: e.target.checked})}
                    className="w-5 h-5 accent-secondary"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold">{isAr ? "تفعيل هذا الخيار سيظهر الاستطلاع في الصفحة الرئيسية" : "Enabling this shows the poll on the home page"}</p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "عنوان الاستطلاع (AR)" : "Survey Title (AR)"}</label>
                   <Input value={surveyMeta.titleAr} onChange={e => setSurveyMeta({...surveyMeta, titleAr: e.target.value})} className="h-12 font-bold" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "عنوان الاستطلاع (EN)" : "Survey Title (EN)"}</label>
                   <Input value={surveyMeta.titleEn} onChange={e => setSurveyMeta({...surveyMeta, titleEn: e.target.value})} className="h-12" />
                 </div>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الوصف (AR)" : "Description (AR)"}</label>
                   <Input value={surveyMeta.descriptionAr} onChange={e => setSurveyMeta({...surveyMeta, descriptionAr: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "الوصف (EN)" : "Description (EN)"}</label>
                   <Input value={surveyMeta.descriptionEn} onChange={e => setSurveyMeta({...surveyMeta, descriptionEn: e.target.value})} />
                 </div>
               </div>
            </div>

            {questions.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[3rem] p-32 text-center bg-white">
                <ClipboardList size={64} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-black text-lg">{isAr ? "لا توجد أسئلة بعد" : "No questions added yet"}</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <Card key={q.id} className="rounded-[2.5rem] shadow-xl border-none overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-secondary/10 p-4 border-b flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary">
                      {isAr ? `سؤال ${idx+1}: ${q.type}` : `Question ${idx+1}: ${q.type}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="text-red-400">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder="Question AR" value={q.questionAr} onChange={e => updateQuestion(q.id, { questionAr: e.target.value })} className="font-bold" />
                      <Input placeholder="Question EN" value={q.questionEn} onChange={e => updateQuestion(q.id, { questionEn: e.target.value })} />
                    </div>

                    {q.type === 'mcq' && (
                      <div className="space-y-4 pt-6 border-t">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase text-slate-400">{isAr ? "خيارات الإجابة" : "Answer Options"}</label>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const newOpt = { id: `opt_${Date.now()}`, textAr: '', textEn: '', icon: 'Circle' };
                            updateQuestion(q.id, { options: [...(q.options || []), newOpt] });
                          }} className="text-secondary font-black text-xs">
                            <Plus size={14} className="ml-1" /> {isAr ? "إضافة خيار" : "Add Option"}
                          </Button>
                        </div>
                        <div className="grid gap-3">
                          {q.options?.map((opt, optIdx) => (
                            <div key={opt.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl group/opt">
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <Input placeholder="Option AR" value={opt.textAr} onChange={e => {
                                  const newOpts = [...q.options!];
                                  newOpts[optIdx].textAr = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }} className="bg-white" />
                                <Input placeholder="Option EN" value={opt.textEn} onChange={e => {
                                  const newOpts = [...q.options!];
                                  newOpts[optIdx].textEn = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }} className="bg-white" />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => {
                                const newOpts = q.options!.filter(o => o.id !== opt.id);
                                updateQuestion(q.id, { options: newOpts });
                              }} className="text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                <X size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
      <PortalFooter siteConfig={null} />
    </div>
  );
}
