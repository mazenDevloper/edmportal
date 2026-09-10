
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ClipboardList, Save, ArrowLeft, MessageSquare, List, Star } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';

export default function SurveyBuilder() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [surveyTitle, setSurveyTitle] = useState('');

  const addQuestion = (type: string) => {
    const newQ = {
      id: `q_${Date.now()}`,
      type,
      questionAr: '',
      questionEn: '',
      options: type === 'mcq' ? ['', ''] : []
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-3">
              <ClipboardList className="text-secondary" /> {isAr ? "باني الاستطلاعات" : "Survey Builder"}
            </h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild className="rounded-full font-bold shadow-sm">
              <Link href="/admin"><ArrowLeft size={16} className="ml-2" /> {isAr ? "العودة للوحة" : "Back to Admin"}</Link>
            </Button>
            <Button className="bg-secondary text-white rounded-full px-8 font-black shadow-lg">
              <Save size={16} className="ml-2" /> {isAr ? "حفظ الاستطلاع" : "Save Survey"}
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 rounded-brand shadow-md h-fit sticky top-24">
            <CardHeader className="bg-secondary text-white rounded-t-brand">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Plus size={16} /> {isAr ? "إضافة سؤال" : "Add Question"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => addQuestion('text')} className="justify-start gap-2 font-bold"><MessageSquare size={14}/> {isAr ? "سؤال مفتوح" : "Open Text"}</Button>
              <Button variant="outline" onClick={() => addQuestion('mcq')} className="justify-start gap-2 font-bold"><List size={14}/> {isAr ? "خيارات متعددة" : "Multiple Choice"}</Button>
              <Button variant="outline" onClick={() => addQuestion('rating')} className="justify-start gap-2 font-bold"><Star size={14}/> {isAr ? "تقييم" : "Rating Scale"}</Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Input 
              placeholder={isAr ? "عنوان الاستطلاع (مثلاً: رضاء المواطنين)" : "Survey Title (e.g. Citizen Satisfaction)"} 
              className="h-14 text-xl font-black border-2 rounded-xl shadow-sm bg-white"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
            />

            {questions.length === 0 ? (
              <div className="border-4 border-dashed border-slate-200 rounded-[2rem] p-20 text-center bg-white">
                <ClipboardList size={64} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 font-black text-lg">{isAr ? "لا توجد أسئلة بعد" : "No questions yet"}</p>
                <p className="text-slate-300 font-bold">{isAr ? "ابدأ ببناء استطلاع الرأي لتحسين الخدمات البلدية" : "Start building a survey to improve municipal services"}</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <Card key={q.id} className="rounded-brand shadow-sm border-r-4 border-secondary overflow-hidden group">
                  <div className="flex justify-between items-center p-3 bg-secondary/5 border-b">
                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary">
                      {isAr ? `السؤال ${idx+1}: ${q.type}` : `Question ${idx+1}: ${q.type}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="size-8 text-red-400">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <Input placeholder={isAr ? "نص السؤال..." : "Question text..."} value={q.questionAr} onChange={(e) => updateQuestion(q.id, { questionAr: e.target.value })} className="font-bold" />
                    {q.type === 'mcq' && (
                      <div className="space-y-2 pt-2 border-t">
                        <label className="text-[10px] font-black text-slate-400 uppercase">{isAr ? "الخيارات" : "Options"}</label>
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex gap-2">
                            <Input placeholder={`Option ${optIdx+1}`} value={opt} onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[optIdx] = e.target.value;
                              updateQuestion(q.id, { options: newOpts });
                            }} />
                            <Button size="icon" variant="ghost" onClick={() => {
                              const newOpts = q.options.filter((_: any, i: number) => i !== optIdx);
                              updateQuestion(q.id, { options: newOpts });
                            }}><X size={14} /></Button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => updateQuestion(q.id, { options: [...q.options, ''] })} className="text-secondary font-bold text-xs"><Plus size={12} className="ml-1"/> {isAr ? "إضافة خيار" : "Add Option"}</Button>
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
