
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ClipboardList, Save, ArrowLeft, MessageSquare, List, Star, X, Info, Loader2, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { Survey, SurveyQuestion } from '@/lib/types';
import { translateToEnglish } from '@/ai/flows/translate-flow';

export default function SurveyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { toast } = useToast();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyMeta, setSurveyMeta] = useState({ 
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', isPublicPoll: false 
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        if (data && data.surveys) {
          const found = data.surveys.find((s: Survey) => s.id === editId);
          if (found) {
            setQuestions(found.questions || []);
            setSurveyMeta({
              titleAr: found.titleAr, titleEn: found.titleEn,
              descriptionAr: found.descriptionAr || '', descriptionEn: found.descriptionEn || '',
              isPublicPoll: found.isPublicPoll || false
            });
          }
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [editId]);

  const handleAiTranslate = async () => {
    if (!surveyMeta.titleAr) return;
    setAiLoading(true);
    try {
      const { translatedText } = await translateToEnglish({ text: surveyMeta.titleAr });
      setSurveyMeta({ ...surveyMeta, titleEn: translatedText });
    } finally {
      setAiLoading(false);
    }
  };

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

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const newId = editId || `survey_${Date.now()}`;
      const newSurvey = { id: newId, ...surveyMeta, questions, isActive: true, responsesCount: 0 };
      const filtered = (db.surveys || []).filter((s: any) => s.id !== newId);
      await updateBin({ ...db, surveys: [...filtered, newSurvey] });
      toast({ title: "Saved" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
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
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <ClipboardList className="text-secondary" /> {isAr ? "باني الاستطلاعات" : "Survey Builder"}
          </h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">
              <ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة" : "Back"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
              {saving ? <Loader2 className="animate-spin ml-2" /> : <Save size={16} className="ml-2" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="rounded-brand shadow-md h-fit border-none">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-sm font-black flex items-center gap-2"><Plus size={16} /> {isAr ? "إضافة سؤال" : "Add"}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button variant="outline" className="w-full justify-start font-black" onClick={() => addQuestion('mcq')}><List size={14} className="ml-2"/> {isAr ? "خيارات" : "Choices"}</Button>
              <Button variant="outline" className="w-full justify-start font-black" onClick={() => addQuestion('text')}><MessageSquare size={14} className="ml-2"/> {isAr ? "نص" : "Text"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
               <div className="relative">
                 <Input placeholder="Survey Title AR" value={surveyMeta.titleAr} onChange={e => setSurveyMeta({...surveyMeta, titleAr: e.target.value})} className="font-bold" />
                 <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={handleAiTranslate} disabled={aiLoading}><Sparkles className="size-4 text-accent" /></Button>
               </div>
               <Input placeholder="Survey Title EN" value={surveyMeta.titleEn} onChange={e => setSurveyMeta({...surveyMeta, titleEn: e.target.value})} />
            </div>

            {questions.map((q, idx) => (
              <Card key={q.id} className="rounded-3xl shadow-xl overflow-hidden border-none animate-in slide-in-from-bottom-2">
                <CardHeader className="bg-secondary/10 flex flex-row items-center justify-between p-4">
                  <span className="text-[10px] font-black uppercase text-secondary">Q{idx+1}: {q.type}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))}><Trash2 size={16} className="text-red-400" /></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Input placeholder="Question AR" value={q.questionAr} onChange={e => updateQuestion(q.id, { questionAr: e.target.value })} className="font-bold" />
                  <Input placeholder="Question EN" value={q.questionEn} onChange={e => updateQuestion(q.id, { questionEn: e.target.value })} />
                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      {q.options?.map((opt, oIdx) => (
                        <div key={opt.id} className="flex gap-2 items-center">
                          <Input className="flex-1" value={opt.textAr} onChange={e => {
                            const no = [...q.options!]; no[oIdx].textAr = e.target.value; updateQuestion(q.id, { options: no });
                          }} />
                          <Button variant="ghost" size="icon" onClick={() => {
                            const no = q.options!.filter(oi => oi.id !== opt.id); updateQuestion(q.id, { options: no });
                          }}><LucideIcons.X size={14}/></Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => {
                         const no = [...(q.options || []), { id: `o_${Date.now()}`, textAr: '', textEn: '', icon: 'Circle' }];
                         updateQuestion(q.id, { options: no });
                      }} className="text-accent font-black">{isAr ? "+ إضافة خيار" : "+ Add Option"}</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
