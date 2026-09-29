'use server';
/**
 * @fileOverview Municipal translation with open-source models (no Gemini).
 *
 * - translateToEnglish - Arabic → English (kept for existing callers).
 * - translateText      - Either direction, with tone and the municipality glossary.
 * - translateBatch     - Many strings in one call (used for "translate the whole page").
 *
 * Order: open-weight LLM (meaning-based, glossary + tone) → LibreTranslate (literal fallback)
 * → the original text, so a missing or failing engine never breaks a page.
 * Configure with OPEN_LLM_URL / OPEN_LLM_MODEL and/or LIBRETRANSLATE_URL (see src/ai/open-llm.ts).
 */

import { GLOSSARY } from '@/lib/identity/tokens';
import { cacheGet, cacheSet, chat, libreTranslate, providers } from '@/ai/open-llm';

type Lang = 'ar' | 'en';
type Tone = 'official' | 'friendly' | 'concise';

const LANG_NAME: Record<Lang, string> = { ar: 'Modern Standard Arabic', en: 'English' };
const TONE_HINT: Record<Tone, string> = {
  official: 'formal government register, precise and neutral',
  friendly: 'clear, warm and citizen-friendly while staying professional',
  concise: 'short and direct, suitable for buttons, labels and headings',
};

const glossaryBlock = () => GLOSSARY.map(g => `- "${g.ar}" ⇄ "${g.en}"`).join('\n');

// Meaning first: the model is told to translate intent and register, not word by word
const instructions = (source: Lang, target: Lang, tone: Tone) => `You are the official translator of Dhofar Municipality (Sultanate of Oman).
Translate from ${LANG_NAME[source]} to ${LANG_NAME[target]}.
Translate the MEANING and INTENT, not word by word: first understand what the text asks, tells or promises the reader,
then write it the way a native ${LANG_NAME[target]} speaker in a government office would naturally say it.
Adapt idioms, honorifics and sentence order; never produce literal calques.
Tone: ${TONE_HINT[tone]}.
Always use this terminology exactly:
${glossaryBlock()}
Rules: keep numbers, dates, URLs, e-mail addresses, codes (e.g. QR, GIS, UMS-01, SL-00482) and line breaks unchanged.
Do not add explanations, quotes or notes.`;

export async function translateToEnglish(input: { text: string }) {
  return translateText({ text: input.text, source: 'ar', target: 'en' });
}

export async function translateText(input: { text: string; source?: Lang; target?: Lang; tone?: Tone }) {
  const source = input.source ?? 'ar';
  const target = input.target ?? (source === 'ar' ? 'en' : 'ar');
  if (!input.text.trim() || source === target) return { translatedText: input.text };
  const { translations } = await translateBatch({ texts: [input.text], source, target, tone: input.tone });
  return { translatedText: translations[0] };
}

export async function translateBatch(input: { texts: string[]; source?: Lang; target?: Lang; tone?: Tone }) {
  const source = input.source ?? 'ar';
  const target = input.target ?? (source === 'ar' ? 'en' : 'ar');
  const tone = input.tone ?? 'official';
  const texts = input.texts.map(t => t ?? '');
  const key = (t: string) => `${source}>${target}:${tone}:${t}`;

  // Only strings that need work: non-empty and not cached
  const todo = Array.from(new Set(texts.filter(t => t.trim() && cacheGet(key(t)) === undefined)));
  if (todo.length && source !== target) {
    const done = await engineTranslate(todo, source, target, tone);
    todo.forEach((t, i) => { if (done[i] && done[i] !== t) cacheSet(key(t), done[i]); });
  }
  return { translations: texts.map(t => (t.trim() ? cacheGet(key(t)) ?? t : t)) };
}

async function engineTranslate(texts: string[], source: Lang, target: Lang, tone: Tone): Promise<string[]> {
  if (providers.llm) {
    try { return await llmTranslate(texts, source, target, tone); }
    catch (e) { console.warn('[translate] LLM failed, trying LibreTranslate:', (e as Error).message); }
  }
  if (providers.libre) {
    try { return await libreTranslate(texts, source, target); }
    catch (e) { console.warn('[translate] LibreTranslate failed:', (e as Error).message); }
  }
  // No engine: keep the original text rather than failing the page
  return texts;
}

async function llmTranslate(texts: string[], source: Lang, target: Lang, tone: Tone): Promise<string[]> {
  const out = await chat([
    { role: 'system', content: instructions(source, target, tone) },
    { role: 'user', content: `Translate each string in this JSON array. Reply with a JSON object {"translations": [...]} holding exactly ${texts.length} strings in the same order.\n\n${JSON.stringify(texts)}` },
  ], { json: true, temperature: 0.2, maxTokens: Math.min(4096, 200 + texts.join(' ').length * 3) });
  const list: unknown = out?.translations;
  if (!Array.isArray(list)) throw new Error('No translations array');
  // Guard against a model returning a different length
  return texts.map((t, i) => (typeof list[i] === 'string' && list[i].trim() ? list[i] : t));
}
