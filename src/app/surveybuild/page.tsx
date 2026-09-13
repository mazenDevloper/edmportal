
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ClipboardList, Save, ArrowLeft, MessageSquare, List, Loader2, Sparkles, X } from 'lucide-react';
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
  const [surveyMeta, setSurveyMeta] = useState({ titleAr: '', titleEn: '', isActive: true, isPublicPoll: true });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetchBin().then(data => {
        const found = data.surveys?.find((s: Survey) => s.id === editId);
        if (found) {
          setQuestions(found.questions || []);
          setSurveyMeta(found);
        }
      }).finally(() => setLoading(false));
    }
  }, [editId]);

  const handleAiTranslate = async (text: string, targetKey: 'meta' | number) => {
    if (!text) return;
    setAiLoading(targetKey.toString());
    try {
      const { translatedText } = await translateToEnglish({ text });
      if (targetKey === 'meta') setSurveyMeta({ ...surveyMeta, titleEn: translatedText });
      else {
        const nq = [...questions];
        nq[targetKey].questionEn = translatedText;
        setQuestions(nq);
      }
      toast({ title: "AI Translation Done" });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = await fetchBin();
      const newId = editId || `survey_${Date.now()}`;
      const newSurvey = { ...surveyMeta, id: newId, questions, responsesCount: 0 };
      const filtered = (db.surveys || []).filter((s: any) => s.id !== newId);
      await updateBin({ ...db, surveys: [...filtered, newSurvey] });
      toast({ title: "Saved Successfully" });
      router.push('/admin');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3"><ClipboardList /> {isAr ? "باني الاستطلاعات" : "Survey Builder"}</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full font-bold">Back</Button>
            <Button onClick={handleSave} disabled={saving} className="dm-gradient-primary rounded-full px-8 font-black">
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
           <Card className="rounded-brand bg-white border-none shadow-md h-fit">
              <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-xs">Add Question</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                 <Button variant="outline" className="w-full justify-start" onClick={() => setQuestions([...questions, { id: `q_${Date.now()}`, type: 'mcq', questionAr: 'سؤال جديد', questionEn: '', options: [] }])}><List size={14} className="ml-2"/> Choices</Button>
                 <Button variant="outline" className="w-full justify-start" onClick={() => setQuestions([...questions, { id: `q_${Date.now()}`, type: 'text', questionAr: 'سؤال نصي', questionEn: '' }])}><MessageSquare size={14} className="ml-2"/> Text</Button>
              </CardContent>
           </Card>

           <div className="lg:col-span-3 space-y-6">
              <Card className="p-6 bg-white rounded-3xl space-y-4">
                 <div className="relative">
                    <Input value={surveyMeta.titleAr} onChange={e => setSurveyMeta({...surveyMeta, titleAr: e.target.value})} className="font-bold h-12 pr-12" placeholder="Survey Title AR" />
                    <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(surveyMeta.titleAr, 'meta')} disabled={aiLoading === 'meta'}>
                      <Sparkles size={16} />
                    </Button>
                 </div>
                 <Input value={surveyMeta.titleEn} readOnly className="bg-slate-50 h-12" placeholder="AI English Title" />
              </Card>

              {questions.map((q, idx) => (
                <Card key={q.id} className="rounded-3xl bg-white shadow-xl overflow-hidden border-none animate-in slide-in-from-bottom-2">
                   <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-primary">Q{idx+1}: {q.type}</span>
                      <Button variant="ghost" size="icon" onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))}><X size={16}/></Button>
                   </div>
                   <CardContent className="p-8 space-y-4">
                      <div className="relative">
                         <Input value={q.questionAr} onChange={e => { const nq = [...questions]; nq[idx].questionAr = e.target.value; setQuestions(nq); }} className="font-bold pr-12" />
                         <Button size="icon" variant="ghost" className="absolute bottom-1 right-1 text-accent" onClick={() => handleAiTranslate(q.questionAr, idx)} disabled={aiLoading === idx.toString()}>
                           <Sparkles size={16} />
                         </Button>
                      </div>
                      <Input value={q.questionEn} readOnly className="bg-slate-50" placeholder="AI Translated Question" />
                   </CardContent>
                </Card>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
}
