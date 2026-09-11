'use server';
/**
 * @fileOverview AI Translation Assistant for municipal content.
 *
 * - translateToEnglish - Translates Arabic text to English using Genkit.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslationInputSchema = z.object({
  text: z.string().describe("The Arabic text to translate to English."),
});

const TranslationOutputSchema = z.object({
  translatedText: z.string().describe("The English translation."),
});

export async function translateToEnglish(input: { text: string }) {
  return translationFlow(input);
}

const translationFlow = ai.defineFlow(
  {
    name: 'translationFlow',
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a professional translator for the Dhofar Municipality. 
      Translate the following Arabic text to formal English: "${input.text}".
      Keep the tone official and professional.`,
      output: { schema: TranslationOutputSchema }
    });

    return output!;
  }
);
