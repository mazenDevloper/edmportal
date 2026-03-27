"use server";

import {
  aiSpatialLayoutAssistant,
  type AISpatialLayoutAssistantInput,
  type AISpatialLayoutAssistantOutput,
} from '@/ai/flows/ai-spatial-layout-assistant-flow';
import { z } from 'zod';

const InputSchema = z.object({
  openWindows: z.array(z.any()),
  userContext: z.object({
    currentTask: z.string().optional(),
    gazeTargetWindowId: z.string().optional(),
  }),
  environmentProperties: z.object({
    environmentType: z.string(),
    availableSpaceDescription: z.string(),
  }),
});

export async function getAISuggestions(input: AISpatialLayoutAssistantInput): Promise<AISpatialLayoutAssistantOutput> {
  // Validate input against the schema expected by the AI flow
  const validatedInput = InputSchema.parse(input);

  try {
    const result = await aiSpatialLayoutAssistant(validatedInput);
    return result;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    throw new Error('Failed to get AI layout suggestions.');
  }
}
