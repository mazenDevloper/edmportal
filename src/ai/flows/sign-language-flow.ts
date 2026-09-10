'use server';
/**
 * @fileOverview Oman Sign Language (OSL) Assistant.
 * Generates textual descriptions of signs and can trigger video generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const OSLInputSchema = z.object({
  text: z.string().describe("The text or concept to explain in Oman Sign Language."),
  language: z.enum(['ar', 'en']).default('ar'),
});

const OSLOutputSchema = z.object({
  description: z.string().describe("A step-by-step textual description of how to sign this in OSL."),
  videoPrompt: z.string().describe("A specialized prompt for generating a video of this sign."),
});

export async function explainInSignLanguage(input: { text: string, language: 'ar' | 'en' }) {
  return oslFlow(input);
}

const oslFlow = ai.defineFlow(
  {
    name: 'oslFlow',
    inputSchema: OSLInputSchema,
    outputSchema: OSLOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert in Oman Sign Language (OSL). 
    Explain how to sign the following concept: "${input.text}".
    Provide a step-by-step description in ${input.language === 'ar' ? 'Arabic' : 'English'}.
    Also, provide a detailed video generation prompt for a virtual assistant signing this clearly.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: OSLOutputSchema }
    });

    return output!;
  }
);

export async function generateSignVideo(videoPrompt: string) {
  // Uses Veo to generate a visual signing reference
  let { operation } = await ai.generate({
    model: googleAI.model('veo-2.0-generate-001'),
    prompt: `A clear, medium shot of a person signing in Oman Sign Language against a neutral background: ${videoPrompt}`,
    config: {
      durationSeconds: 5,
      aspectRatio: '16:9',
    },
  });

  if (!operation) throw new Error('Operation failed');

  while (!operation.done) {
    operation = await ai.checkOperation(operation);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (operation.error) throw new Error(operation.error.message);
  
  const video = operation.output?.message?.content.find((p) => !!p.media);
  return video?.media?.url;
}
