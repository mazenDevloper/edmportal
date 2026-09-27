'use server';
/**
 * @fileOverview AI translation for municipal content.
 *
 * - translateToEnglish - Arabic → English (kept for existing callers).
 * - translateText      - Either direction, with tone and the municipality glossary.
 * - translateBatch     - Many strings in one call (used for "translate the whole page").
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GLOSSARY } from '@/lib/identity/tokens';

type Lang = 'ar' | 'en';
type Tone = 'official' | 'friendly' | 'concise';

const LANG_NAME: Record<Lang, string> = { ar: 'Modern Standard Arabic', en: 'English' };
const TONE_HINT: Record<Tone, string> = {
  official: 'formal government register, precise and neutral',
  friendly: 'clear, warm and citizen-friendly while staying professional',
  concise: 'short and direct, suitable for buttons, labels and headings',
};

const glossaryBlock = () =>
  GLOSSARY.map(g => `- "${g.ar}" ⇄ "${g.en}"`).join('\n');

const instructions = (source: Lang, target: Lang, tone: Tone) => `You are the official translator of Dhofar Municipality (Sultanate of Oman).
Translate from ${LANG_NAME[source]} to ${LANG_NAME[target]}.
Tone: ${TONE_HINT[tone]}.
Always use this terminology exactly:
${glossaryBlock()}
Rules: keep numbers, dates, URLs, e-mail addresses, codes (e.g. QR, GIS, UMS-01) and line breaks unchanged.
Do not add explanations, quotes or notes — return only the translation.`;

const TranslationInputSchema = z.object({ text: z.string() });
const TranslationOutputSchema = z.object({ translatedText: z.string() });

export async function translateToEnglish(input: { text: string }) {
  return translateText({ text: input.text, source: 'ar', target: 'en' });
}

export async function translateText(input: { text: string; source?: Lang; target?: Lang; tone?: Tone }) {
  const source = input.source ?? 'ar';
  const target = input.target ?? (source === 'ar' ? 'en' : 'ar');
  if (!input.text.trim() || source === target) return { translatedText: input.text };
  return translationFlow({ text: input.text, source, target, tone: input.tone ?? 'official' });
}

export async function translateBatch(input: { texts: string[]; source?: Lang; target?: Lang; tone?: Tone }) {
  const source = input.source ?? 'ar';
  const target = input.target ?? (source === 'ar' ? 'en' : 'ar');
  const texts = input.texts.map(t => t ?? '');
  if (!texts.some(t => t.trim())) return { translations: texts };
  return batchFlow({ texts, source, target, tone: input.tone ?? 'official' });
}

const translationFlow = ai.defineFlow(
  {
    name: 'translationFlow',
    inputSchema: TranslationInputSchema.extend({ source: z.enum(['ar', 'en']), target: z.enum(['ar', 'en']), tone: z.enum(['official', 'friendly', 'concise']) }),
    outputSchema: TranslationOutputSchema,
  },
  async ({ text, source, target, tone }) => {
    const { output } = await ai.generate({
      prompt: `${instructions(source, target, tone)}\n\nText:\n${text}`,
      output: { schema: TranslationOutputSchema },
    });
    return output!;
  }
);

const batchFlow = ai.defineFlow(
  {
    name: 'translationBatchFlow',
    inputSchema: z.object({ texts: z.array(z.string()), source: z.enum(['ar', 'en']), target: z.enum(['ar', 'en']), tone: z.enum(['official', 'friendly', 'concise']) }),
    outputSchema: z.object({ translations: z.array(z.string()) }),
  },
  async ({ texts, source, target, tone }) => {
    const { output } = await ai.generate({
      prompt: `${instructions(source, target, tone)}
You receive a JSON array of strings. Return a JSON array "translations" with exactly ${texts.length} items, translated in the same order. Empty strings stay empty.

${JSON.stringify(texts)}`,
      output: { schema: z.object({ translations: z.array(z.string()) }) },
    });
    const translations = output?.translations ?? [];
    // Guard against a model returning a different length
    return { translations: texts.map((t, i) => (t.trim() ? translations[i] ?? t : t)) };
  }
);
