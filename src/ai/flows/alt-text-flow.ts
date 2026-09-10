'use server';
/**
 * @fileOverview AI Alt-Text generator for municipal images.
 *
 * - generateAltText - Analyzes an image and returns descriptive alt text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AltTextInputSchema = z.object({
  photoDataUri: z.string().describe("The image data URI to describe."),
  language: z.enum(['ar', 'en']).default('ar'),
});

const AltTextOutputSchema = z.object({
  altText: z.string().describe("A descriptive alt text for the image."),
});

export async function generateAltText(input: { photoDataUri: string, language: 'ar' | 'en' }) {
  return altTextFlow(input);
}

const altTextFlow = ai.defineFlow(
  {
    name: 'altTextFlow',
    inputSchema: AltTextInputSchema,
    outputSchema: AltTextOutputSchema,
  },
  async (input) => {
    const prompt = `You are an accessibility expert. Generate a concise, descriptive alt-text for this image for the Dhofar Municipality portal.
    The description should be in ${input.language === 'ar' ? 'Arabic' : 'English'}.
    Focus on the main subject, setting (if it's Dhofar/Salalah), and key visual elements.
    Image: {{media url=photoDataUri}}`;

    const { output } = await ai.generate({
      prompt: [
        { text: prompt },
        { media: { url: input.photoDataUri } }
      ],
      output: { schema: AltTextOutputSchema }
    });

    return output!;
  }
);
