'use server';
/**
 * @fileOverview An AI assistant that suggests optimal arrangements and placements of windows in a 3D environment.
 *
 * - aiSpatialLayoutAssistant - A function that handles the AI spatial layout suggestion process.
 * - AISpatialLayoutAssistantInput - The input type for the aiSpatialLayoutAssistant function.
 * - AISpatialLayoutAssistantOutput - The return type for the aiSpatialLayoutAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AISpatialLayoutAssistantInputSchema = z.object({
  openWindows: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the window.'),
        contentSummary: z
          .string()
          .describe(
            'A brief summary of the content displayed in the window (e.g., "Email client showing unread messages", "Video tutorial on React hooks", "Code editor with current project file").'
          ),
        currentPosition: z.object({
          x: z.number().describe('Current X coordinate in 3D space.'),
          y: z.number().describe('Current Y coordinate in 3D space.'),
          z: z.number().describe('Current Z coordinate in 3D space.'),
        }),
        currentRotation: z.object({
          x: z.number().describe('Current X rotation in radians.'),
          y: z.number().describe('Current Y rotation in radians.'),
          z: z.number().describe('Current Z rotation in radians.'),
        }),
        currentScale: z.object({
          x: z.number().describe('Current X scale factor.'),
          y: z.number().describe('Current Y scale factor.'),
          z: z.number().describe('Current Z scale factor.'),
        }),
      })
    )
    .describe('A list of all currently open windows with their details.'),
  userContext: z
    .object({
      currentTask: z
        .string()
        .optional()
        .describe(
          'A description of the user\'s current task or goal (e.g., "writing code", "watching a lecture", "managing emails").'
        ),
      gazeTargetWindowId: z
        .string()
        .optional()
        .describe('The ID of the window the user is currently gazing at.'),
    })
    .describe('Information about the user\'s current focus and activity.'),
  environmentProperties: z
    .object({
      environmentType: z
        .string()
        .describe('The type of the 3D environment (e.g., "office", "forest", "abstract space").'),
      availableSpaceDescription: z
        .string()
        .describe(
          'A textual description of the available 3D space for window placement (e.g., "a large open area directly in front of the user", "a curved wall spanning the user\'s field of view").'
        ),
    })
    .describe('Properties of the immersive 3D environment.'),
});
export type AISpatialLayoutAssistantInput = z.infer<
  typeof AISpatialLayoutAssistantInputSchema
>;

const AISpatialLayoutAssistantOutputSchema = z.object({
  suggestedLayout: z
    .array(
      z.object({
        id: z.string().describe('The unique identifier of the window.'),
        suggestedPosition: z.object({
          x: z.number().describe('Suggested X coordinate in 3D space.'),
          y: z.number().describe('Suggested Y coordinate in 3D space.'),
          z: z.number().describe('Suggested Z coordinate in 3D space.'),
        }),
        suggestedRotation: z
          .object({
            x: z.number().describe('Suggested X rotation in radians.'),
            y: z.number().describe('Suggested Y rotation in radians.'),
            z: z.number().describe('Suggested Z rotation in radians.'),
          })
          .optional()
          .describe(
            'Optional: Suggested rotation for the window. If not provided, current rotation can be maintained.'
          ),
        suggestedScale: z
          .object({
            x: z.number().describe('Suggested X scale factor.'),
            y: z.number().describe('Suggested Y scale factor.'),
            z: z.number().describe('Suggested Z scale factor.'),
          })
          .optional()
          .describe(
            'Optional: Suggested scale for the window. If not provided, current scale can be maintained.'
          ),
        reasoningForPlacement: z
          .string()
          .describe('A brief explanation for this specific window\'s suggested placement and transformations.'),
      })
    )
    .describe('An array of suggested layouts for each open window.'),
  overallReasoning: z
    .string()
    .describe('An overall explanation for the suggested layout strategy and why it is optimal.'),
});
export type AISpatialLayoutAssistantOutput = z.infer<
  typeof AISpatialLayoutAssistantOutputSchema
>;

export async function aiSpatialLayoutAssistant(
  input: AISpatialLayoutAssistantInput
): Promise<AISpatialLayoutAssistantOutput> {
  return aiSpatialLayoutAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSpatialLayoutAssistantPrompt',
  input: {schema: AISpatialLayoutAssistantInputSchema},
  output: {schema: AISpatialLayoutAssistantOutputSchema},
  prompt: `You are an AI Spatial Layout Assistant for an immersive 3D environment called Immersion Canvas.
Your goal is to suggest optimal arrangements and placements for open windows to help the user efficiently organize their workspace and maintain focus on relevant tasks.

Consider the following information:

### Open Windows:
{{#each openWindows}}
- ID: {{{id}}}
  Content Summary: {{{contentSummary}}}
  Current Position: (x:{{{currentPosition.x}}}, y:{{{currentPosition.y}}}, z:{{{currentPosition.z}}})
  Current Rotation: (x:{{{currentRotation.x}}}, y:{{{currentRotation.y}}}, z:{{{currentRotation.z}}})
  Current Scale: (x:{{{currentScale.x}}}, y:{{{currentScale.y}}}, z:{{{currentScale.z}}})
{{/each}}

### User Context:
  Current Task: {{{userContext.currentTask}}}
  Gaze Target Window ID: {{{userContext.gazeTargetWindowId}}}

### Environment Properties:
  Environment Type: {{{environmentProperties.environmentType}}}
  Available Space Description: {{{environmentProperties.availableSpaceDescription}}}

Based on the content of each window, the user's current context (task and gaze), and the available 3D space, suggest an optimal layout for the open windows. Prioritize windows most relevant to the user's current task or gaze.

Provide a detailed reasoning for your overall layout strategy, and specific reasoning for each window's suggested placement.

Your response MUST be a JSON object conforming to the AISpatialLayoutAssistantOutputSchema. Remember to provide all required fields in the output schema, including 'overallReasoning' and 'reasoningForPlacement' for each window.
`,
});

const aiSpatialLayoutAssistantFlow = ai.defineFlow(
  {
    name: 'aiSpatialLayoutAssistantFlow',
    inputSchema: AISpatialLayoutAssistantInputSchema,
    outputSchema: AISpatialLayoutAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI spatial layout assistant failed to provide an output.');
    }
    return output;
  }
);
