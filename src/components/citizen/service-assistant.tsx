'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BadgeCent, Bot, Clock, ExternalLink, Fingerprint, ListChecks, Loader2, MessageCircle, Phone, Send, ShieldCheck, X } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { Service, ServiceFlow } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { isPublicService } from '@/lib/service-visibility';
import { AssistantAnswer, Intent, answer } from '@/lib/assistant-engine';
import { CONTACT } from '@/lib/footer-pages';
import { maskPhone, requireCitizen, useCitizen, useCitizenSession } from '@/lib/citizen-session';
import { useAssistant } from './assistant-store';
import { TrackLookup } from './track-lookup';
import { cn } from '@/lib/utils';

type Message = { id: number; role: 'user' | 'bot'; text?: string; answer?: AssistantAnswer };

// Staff and admin areas have their own tools
const HIDDEN_ON = /^\/(edmPortal|edmEmp|staff|pagebuild|servicebuild|surveybuild|identity\/board)(\/|$)/;

/** Floating service assistant, beside the accessibility button. Answers from the portal's own service data. */
export function ServiceAssistant() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const citizen = useCitizen();
  const { open, setOpen, takeQueued } = useAssistant();
  const queued = useAssistant(s => s.queued);

  const [services, setServices] = useState<Service[] | null>(null);
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [lastServiceId, setLastServiceId] = useState<string | null>(null);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Service data is loaded the first time the assistant opens
  useEffect(() => {
    if (!open || services) return;
    fetchBin().then(db => {
      setServices((db.services || []).filter(isPublicService));
      setFlows(db.serviceFlows || []);
    }).catch(() => setServices([]));
  }, [open, services]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || !services) return;
    const a = answer(q, { services, flows, isAr, lastServiceId });
    if (a.kind === 'service') setLastServiceId(a.service.id);
    setMessages(m => [...m, { id: nextId.current++, role: 'user', text: q }, { id: nextId.current++, role: 'bot', answer: a }]);
    setInput('');
  };

  // A question asked from a page ("Ask the assistant") is sent once the data is ready
  useEffect(() => {
    if (open && services && queued) send(takeQueued() || '');
  }, [open, services, queued]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (HIDDEN_ON.test(pathname)) return null;

  const suggestions = [
    t('ما هي الخدمات المتاحة؟', 'What services are available?'),
    t('الاستعلام عن حالة معاملة', 'Track my request'),
    t('كيف أسجل الدخول عبر ثقة؟', 'How do I sign in with Thiqa?'),
  ];

  return (
    <>
      <button
        ref={triggerRef} type="button" onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open} aria-controls="service-assistant"
        aria-label={open ? t('إغلاق مساعد الخدمات', 'Close the service assistant') : t('مساعد الخدمات: اسأل عن أي خدمة', 'Service assistant: ask about any service')}
        className="fixed bottom-5 end-[5.5rem] z-[9999] size-14 rounded-full bg-[#470D67] text-white border-4 border-white shadow-[0_10px_30px_rgba(71,13,103,0.45)] flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-500 print:hidden"
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-7" aria-hidden />}
      </button>

      {open && (
        <section
          id="service-assistant" role="dialog" aria-modal="false" aria-labelledby="assistant-title"
          dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}
          className="fixed z-[9999] bottom-24 end-3 sm:end-5 w-[min(420px,calc(100vw-24px))] h-[min(640px,calc(100dvh-120px))] flex flex-col rounded-3xl bg-slate-50 shadow-[0_30px_80px_rgba(0,0,0,0.3)] overflow-hidden print:hidden"
        >
          <header className="flex items-center gap-3 px-4 py-3 bg-[#470D67] text-white">
            <span className="size-10 rounded-xl bg-white/15 flex items-center justify-center"><Bot size={22} aria-hidden /></span>
            <div className="flex-1 min-w-0">
              <h2 id="assistant-title" className="font-black leading-tight">{t('مساعد الخدمات', 'Service assistant')}</h2>
              <p className="text-[11px] font-bold text-white/70 truncate">{t('إجابات من دليل خدمات البلدية', 'Answers from the municipality service guide')}</p>
            </div>
            <button type="button" onClick={close} className="size-9 rounded-xl hover:bg-white/15 flex items-center justify-center" aria-label={t('إغلاق', 'Close')}><X size={18} /></button>
          </header>

          {citizen ? (
            <p className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-black"><ShieldCheck size={14} aria-hidden />{t('مسجل عبر ثقة', 'Signed in with Thiqa')} <span dir="ltr">{maskPhone(citizen)}</span></p>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-900">
              <p className="flex-1 text-xs font-bold">{t('سجّل دخولك عبر ثقة لتقديم الطلبات ومتابعة معاملاتك.', 'Sign in with Thiqa to apply and follow your requests.')}</p>
              <button type="button" onClick={() => useCitizenSession.getState().openPrompt()} className="shrink-0 h-8 px-3 rounded-lg bg-[#005751] text-white text-xs font-black flex items-center gap-1"><Fingerprint size={14} aria-hidden />{t('دخول', 'Sign in')}</button>
            </div>
          )}

          <div ref={logRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 overflow-y-auto p-4 space-y-3">
            <Bubble role="bot">
              <p className="font-bold">{t('مرحباً! اسألني عن أي خدمة: المستندات المطلوبة، الاشتراطات، الرسوم، أو المدة. ويمكنني الاستعلام عن حالة معاملتك برقمها.', 'Hi! Ask me about any service: documents, conditions, fees or how long it takes. I can also check a request by its number.')}</p>
            </Bubble>
            {messages.map(m => m.role === 'user'
              ? <Bubble key={m.id} role="user"><p className="font-bold">{m.text}</p></Bubble>
              : <Bubble key={m.id} role="bot"><AnswerView a={m.answer!} isAr={isAr} onAsk={send} onStart={id => requireCitizen(`/services/${id}/apply`, p => router.push(p))} /></Bubble>)}
            {!services && <p role="status" className="flex items-center gap-2 text-xs font-bold text-slate-400"><Loader2 size={14} className="animate-spin" aria-hidden />{t('جارٍ تحميل دليل الخدمات…', 'Loading the service guide…')}</p>}
          </div>

          {messages.length === 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestions.map(s => <button key={s} type="button" onClick={() => send(s)} disabled={!services} className="px-3 py-1.5 rounded-full bg-white ring-1 ring-slate-200 text-xs font-black text-slate-700 hover:ring-[#470D67] disabled:opacity-40">{s}</button>)}
            </div>
          )}

          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2 p-3 border-t bg-white">
            <label htmlFor="assistant-input" className="sr-only">{t('اكتب سؤالك', 'Type your question')}</label>
            <input id="assistant-input" ref={inputRef} value={input} onChange={e => setInput(e.target.value)} maxLength={300} autoComplete="off"
              placeholder={t('مثال: ما رسوم رخصة البناء؟', 'e.g. What are the building permit fees?')}
              className="min-w-0 flex-1 h-11 rounded-xl bg-slate-100 px-3 font-bold text-sm outline-none focus:ring-2 focus:ring-[#470D67]" />
            <button type="submit" disabled={!input.trim() || !services} aria-label={t('إرسال', 'Send')} className="size-11 shrink-0 rounded-xl bg-[#470D67] text-white flex items-center justify-center disabled:opacity-40">
              <Send size={18} className={cn(isAr && '-scale-x-100')} aria-hidden />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'bot'; children: React.ReactNode }) {
  return (
    <div className={cn('flex', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed', role === 'user' ? 'bg-[#470D67] text-white rounded-ee-md' : 'bg-white ring-1 ring-slate-200 text-slate-800 rounded-es-md')}>
        <span className="sr-only">{role === 'user' ? 'أنت: ' : 'المساعد: '}</span>{children}
      </div>
    </div>
  );
}

function AnswerView({ a, isAr, onAsk, onStart }: { a: AssistantAnswer; isAr: boolean; onAsk: (q: string) => void; onStart: (serviceId: string) => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const name = (s: Service) => (isAr ? s.title : s.titleEn || s.title);
  const chip = 'px-3 py-1.5 rounded-full bg-slate-100 text-xs font-black text-slate-700 hover:bg-[#470D67] hover:text-white text-start';

  switch (a.kind) {
    case 'greeting':
      return <p className="font-bold">{t('أهلاً بك! عن أي خدمة تود أن تسأل؟', 'Welcome! Which service would you like to ask about?')}</p>;

    case 'track':
      return (
        <div className="space-y-2 min-w-[240px]">
          <p className="font-bold">{t('أدخل رقم المعاملة للاستعلام عن حالتها:', 'Enter the transaction number to check its status:')}</p>
          <TrackLookup isAr={isAr} initialRef={a.ref || ''} compact autoSubmit={!!a.ref} />
        </div>
      );

    case 'list':
      if (!a.services.length) return <p className="font-bold">{t('لا توجد خدمات منشورة على البوابة حالياً.', 'There are no services published on the portal right now.')}</p>;
      return (
        <div className="space-y-2">
          <p className="font-bold">{t(`هذه بعض الخدمات المتاحة (${a.services.length}):`, `Some of the available services (${a.services.length}):`)}</p>
          <div className="flex flex-wrap gap-1.5">{a.services.slice(0, 8).map(s => <button key={s.id} type="button" onClick={() => onAsk(name(s))} className={chip}>{name(s)}</button>)}</div>
          <Link href="/catalog" className="inline-block text-xs font-black text-[#005751] underline">{t('عرض دليل الخدمات كاملاً', 'See the full catalogue')}</Link>
        </div>
      );

    case 'choose':
      return (
        <div className="space-y-2">
          <p className="font-bold">{t('وجدت أكثر من خدمة مشابهة، أيها تقصد؟', 'I found several similar services. Which one do you mean?')}</p>
          <div className="flex flex-col gap-1.5">{a.services.map(s => <button key={s.id} type="button" onClick={() => onAsk(name(s))} className={chip}>{name(s)}</button>)}</div>
        </div>
      );

    case 'faq':
      return <div className="space-y-1"><p className="font-black">{a.q}</p><p className="font-medium">{a.a}</p><Link href="/faqs" className="text-xs font-black text-[#005751] underline">{t('الأسئلة الشائعة', 'FAQs')}</Link></div>;

    case 'unknown':
      return (
        <div className="space-y-2">
          <p className="font-bold">{t('لم أجد إجابة دقيقة لسؤالك في دليل الخدمات. جرّب كتابة اسم الخدمة، أو تواصل معنا:', "I couldn't find an exact answer in the service guide. Try the service name, or contact us:")}</p>
          <div className="flex flex-wrap gap-1.5">
            <a href={`tel:${CONTACT.callCenter}`} className={cn(chip, 'inline-flex items-center gap-1')}><Phone size={12} aria-hidden />{CONTACT.callCenter}</a>
            <a href={`https://wa.me/968${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className={cn(chip, 'inline-flex items-center gap-1')}><MessageCircle size={12} aria-hidden />{t('واتساب', 'WhatsApp')}</a>
          </div>
        </div>
      );

    case 'service': {
      const g = a.guide;
      const show = (i: Intent) => a.intents.includes(i) || a.intents.includes('overview');
      return (
        <div className="space-y-2.5">
          <p className="font-black text-[#470D67]">{g.title}</p>
          {show('documents') && (
            <div>
              <p className="flex items-center gap-1.5 font-black text-xs text-slate-500"><ListChecks size={13} aria-hidden />{t('المستندات المطلوبة', 'Required documents')}</p>
              {g.documents.length
                ? <ul className="list-disc ps-5 font-medium">{g.documents.map((d, i) => <li key={i}>{d.label}{!d.required && ` (${t('اختياري', 'optional')})`}</li>)}</ul>
                : <p className="font-medium">{t('لا يلزم إرفاق مستندات.', 'No documents need to be uploaded.')}</p>}
              {g.linked.length > 0 && <p className="text-xs font-bold text-emerald-700">{t('البيانات الشخصية وبيانات السجل التجاري تُجلب تلقائياً.', 'Personal and CR data are fetched automatically.')}</p>}
            </div>
          )}
          {show('conditions') && (
            <div>
              <p className="flex items-center gap-1.5 font-black text-xs text-slate-500"><ShieldCheck size={13} aria-hidden />{t('الاشتراطات', 'Conditions')}</p>
              {g.conditions.length ? <ul className="list-disc ps-5 font-medium">{g.conditions.map((c, i) => <li key={i}>{c}</li>)}</ul> : <p className="font-medium">{t('لا توجد اشتراطات خاصة.', 'No special conditions.')}</p>}
            </div>
          )}
          {show('fees') && <p className="flex items-start gap-1.5"><BadgeCent size={15} className="shrink-0 mt-0.5 text-emerald-600" aria-hidden /><span><span className="font-black">{t('الرسوم: ', 'Fees: ')}</span>{g.fees || t('تُحدد عند مراجعة الطلب.', 'set when the request is reviewed.')}</span></p>}
          {show('duration') && <p className="flex items-start gap-1.5"><Clock size={15} className="shrink-0 mt-0.5 text-[#008E91]" aria-hidden /><span><span className="font-black">{t('المدة التقديرية: ', 'Estimated time: ')}</span>{g.duration || t('حسب طبيعة الطلب.', 'depends on the request.')}</span></p>}
          {a.intents.includes('apply') && !a.intents.includes('overview') && (
            <p className="font-medium">{g.isExternal ? t('تُقدَّم هذه الخدمة عبر منصة خارجية.', 'This service is provided on an external platform.') : t('سجّل الدخول عبر ثقة، ثم وافق على الاشتراطات، وأرفق المستندات، وأكمل النموذج لتحصل على رقم المعاملة.', 'Sign in with Thiqa, accept the conditions, attach the documents and complete the form to get your transaction number.')}</p>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Link href={`/services/${a.service.id}`} className="h-8 px-3 rounded-lg bg-slate-100 text-xs font-black text-slate-700 flex items-center">{t('دليل الخدمة', 'Service guide')}</Link>
            {g.isExternal
              ? <a href={a.service.linkUrl} target="_blank" rel="noopener noreferrer" className="h-8 px-3 rounded-lg bg-[#005751] text-white text-xs font-black flex items-center gap-1">{t('الانتقال للخدمة', 'Open service')}<ExternalLink size={12} aria-hidden /></a>
              : <button type="button" onClick={() => onStart(a.service.id)} className="h-8 px-3 rounded-lg bg-[#005751] text-white text-xs font-black flex items-center gap-1"><Fingerprint size={13} aria-hidden />{t('ابدأ الخدمة', 'Start service')}</button>}
          </div>
          {!a.intents.includes('overview') && (
            <div className="flex flex-wrap gap-1.5">
              {(['documents', 'fees', 'duration', 'conditions'] as Intent[]).filter(i => !a.intents.includes(i)).map(i => (
                <button key={i} type="button" onClick={() => onAsk({ documents: t('والمستندات المطلوبة؟', 'And the documents?'), fees: t('وكم الرسوم؟', 'And the fees?'), duration: t('وكم المدة؟', 'And how long?'), conditions: t('وما الاشتراطات؟', 'And the conditions?'), apply: '', overview: '' }[i])} className={chip}>
                  {{ documents: t('المستندات', 'Documents'), fees: t('الرسوم', 'Fees'), duration: t('المدة', 'Duration'), conditions: t('الاشتراطات', 'Conditions'), apply: '', overview: '' }[i]}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
  }
}
