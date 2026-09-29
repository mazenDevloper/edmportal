import { Service, ServiceFlow } from './types';
import { FAQS } from './footer-pages';
import { buildServiceGuide, normalizeArabic, ServiceGuide } from './service-guide';
import { looksLikeReference } from './service-visibility';

/*
 * Rule-based service assistant. It answers only from the portal's own data (public services,
 * their flows and the FAQs) — nothing is generated, so it can't invent fees or documents.
 */

export type Intent = 'documents' | 'fees' | 'duration' | 'conditions' | 'apply' | 'overview';

export type AssistantAnswer =
  | { kind: 'service'; service: Service; guide: ServiceGuide; intents: Intent[] }
  | { kind: 'choose'; services: Service[] }
  | { kind: 'faq'; q: string; a: string }
  | { kind: 'track'; ref: string | null }
  | { kind: 'list'; services: Service[] }
  | { kind: 'greeting' }
  | { kind: 'unknown' };

const INTENTS: [Intent, RegExp][] = [
  ['documents', /مستند|وثائق|اوراق|ورق|ملفات|ملف|مرفق|متطلبات|المطلوب|احتاج|يلزم|document|paper|file|require|need/],
  ['fees', /رسوم|رسم|تكلفه|تكاليف|سعر|بكم|مبلغ|مجاني|fee|cost|price|pay|charge|free/],
  ['duration', /مده|وقت|متي|يستغرق|تستغرق|كم يوم|ايام|ساعات|سرعه|duration|how long|time|days|when/],
  ['conditions', /شروط|شرط|اشتراط|اهليه|يحق|مؤهل|condition|eligib|rule/],
  ['apply', /كيف|طريقه|اقدم|تقديم|اطلب|ابدا|خطوات|apply|how do|how to|start|steps/],
];

const STOP = new Set([
  'ما', 'ماهي', 'هي', 'هو', 'في', 'من', 'على', 'عن', 'الى', 'الي', 'او', 'و', 'هل', 'كم', 'كيف', 'متي', 'لي', 'انا', 'اريد', 'ابغي', 'ابي', 'ممكن', 'لو', 'سمحت',
  'خدمه', 'الخدمه', 'خدمات', 'طلب', 'الطلب', 'مستندات', 'المستندات', 'المطلوبه', 'المطلوب', 'رسوم', 'الرسوم', 'مده', 'المده', 'شروط', 'الشروط', 'اشتراطات', 'الاشتراطات', 'تقديم', 'اقدم', 'علي', 'لخدمه', 'بخدمه',
  'the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'is', 'what', 'how', 'do', 'i', 'my', 'need', 'fees', 'fee', 'service', 'request', 'documents', 'long', 'does', 'it', 'take', 'much', 'cost', 'apply', 'and',
]);

/** Arabic words with common prefixes removed, so "للترخيص" and "الترخيص" both match "ترخيص" */
const stem = (w: string) => w.replace(/^(وال|بال|كال|فال|لل|ال|و|ب|ل)(?=\S{3,})/, '');
const tokens = (text: string) => normalizeArabic(text).split(' ').filter(w => w.length > 1 && !STOP.has(w)).map(stem).filter(w => w.length > 1 && !STOP.has(w));

const titleTokens = (s: Service) => new Set([...tokens(s.title), ...tokens(s.titleEn || '')]);

/** Title words shared by many services ("رخصة", "بناء") count less than distinctive ones ("هدم") */
function scoreService(q: string[], s: Service, df: Map<string, number>): number {
  const title = titleTokens(s);
  const body = new Set([...tokens(s.description || ''), ...tokens(s.category || '')]);
  let score = 0;
  q.forEach(w => {
    if (title.has(w)) score += 2 + 2 / (df.get(w) || 1);
    else if ([...title].some(t => t.length > 3 && (t.startsWith(w) || w.startsWith(t)))) score += 2;
    else if (body.has(w)) score += 1;
  });
  return score;
}

export interface AssistantContext {
  services: Service[];
  flows: ServiceFlow[];
  isAr: boolean;
  lastServiceId: string | null;
}

export function answer(question: string, ctx: AssistantContext): AssistantAnswer {
  const q = normalizeArabic(question);
  if (!q) return { kind: 'unknown' };

  const ref = looksLikeReference(question);
  if (ref || /حاله (ال)?(طلب|معامل)|تتبع|متابعه (ال)?(طلب|معامل)|رقم (ال)?معامله|track|status/.test(q)) return { kind: 'track', ref };

  if (/^(مرحبا|اهلا|السلام|هلا|صباح|مساء|hi|hello|hey)\b/.test(q) && q.split(' ').length <= 4) return { kind: 'greeting' };
  if (/(ما|وش|ايش|شو) (هي )?(ال)?خدمات|قائمه (ال)?خدمات|list (of )?services|what services/.test(q)) return { kind: 'list', services: ctx.services };

  const intents = INTENTS.filter(([, re]) => re.test(q)).map(([i]) => i);
  const qTokens = tokens(question);
  const df = new Map<string, number>();
  ctx.services.forEach(s => titleTokens(s).forEach(w => df.set(w, (df.get(w) || 0) + 1)));
  const ranked = ctx.services
    .map(s => ({ s, score: scoreService(qTokens, s, df) }))
    .filter(r => r.score >= 2)
    .sort((a, b) => b.score - a.score);

  const guideFor = (s: Service) => buildServiceGuide(s, ctx.flows.find(f => f.serviceId === s.id || f.id === s.id) || null, ctx.isAr);

  if (ranked.length) {
    const top = ranked[0];
    // Too close to call: let the person pick
    const close = ranked.filter(r => r.score >= top.score - 0.5).slice(0, 4);
    if (close.length > 1) return { kind: 'choose', services: close.map(r => r.s) };
    return { kind: 'service', service: top.s, guide: guideFor(top.s), intents: intents.length ? intents : ['overview'] };
  }

  // Follow-up about the service we were just talking about ("and the fees?")
  const last = ctx.services.find(s => s.id === ctx.lastServiceId);
  if (last && intents.length) return { kind: 'service', service: last, guide: guideFor(last), intents };

  const faq = bestFaq(question, ctx.isAr);
  if (faq) return faq;
  return { kind: 'unknown' };
}

function bestFaq(question: string, isAr: boolean): AssistantAnswer | null {
  const q = tokens(question);
  if (!q.length) return null;
  let best: { score: number; i: number } = { score: 0, i: -1 };
  FAQS.forEach((f, i) => {
    const words = new Set([...tokens(f.q.ar), ...tokens(f.q.en)]);
    const score = q.filter(w => words.has(w) || [...words].some(t => t.length > 3 && (t.startsWith(w) || w.startsWith(t)))).length / q.length;
    if (score > best.score) best = { score, i };
  });
  if (best.score < 0.5) return null;
  const f = FAQS[best.i];
  return { kind: 'faq', q: isAr ? f.q.ar : f.q.en, a: isAr ? f.a.ar : f.a.en };
}
