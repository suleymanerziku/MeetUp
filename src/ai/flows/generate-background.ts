// src/ai/flows/generate-background.ts
'use server';

/**
 * @fileOverview AI-powered virtual background generator for video calls.
 *
 * - generateBackground - A function that generates a virtual background based on a text prompt.
 * - GenerateBackgroundInput - The input type for the generateBackground function.
 * - GenerateBackgroundOutput - The return type for the generateBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBackgroundInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired virtual background.'),
});
export type GenerateBackgroundInput = z.infer<typeof GenerateBackgroundInputSchema>;

const GenerateBackgroundOutputSchema = z.object({
  backgroundDataUri: z
    .string()
    .describe(
      'The generated virtual background as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateBackgroundOutput = z.infer<typeof GenerateBackgroundOutputSchema>;

export async function generateBackground(input: GenerateBackgroundInput): Promise<GenerateBackgroundOutput> {
  return generateBackgroundFlow(input);
}

const generateBackgroundPrompt = ai.definePrompt({
  name: 'generateBackgroundPrompt',
  input: {schema: GenerateBackgroundInputSchema},
  output: {schema: GenerateBackgroundOutputSchema},
  prompt: `Generate a virtual background based on the following description: {{{prompt}}}. The background should be suitable for use in a video call.`, // Changed template string
});

const generateBackgroundFlow = ai.defineFlow(
  {
    name: 'generateBackgroundFlow',
    inputSchema: GenerateBackgroundInputSchema,
    outputSchema: GenerateBackgroundOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {backgroundDataUri: media!.url};
  }
);
