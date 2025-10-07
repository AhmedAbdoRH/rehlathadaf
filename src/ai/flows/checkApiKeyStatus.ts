'use server';
/**
 * @fileOverview A flow to check the status of a Google AI API key.
 *
 * - checkApiKeyStatus - A function that checks if an API key is valid.
 * - CheckApiKeyStatusInput - The input type for the checkApiKeyStatus function.
 * - CheckApiKeyStatusOutput - The return type for the checkApiKeyStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckApiKeyStatusInputSchema = z.object({
  apiKey: z.string().describe('The API key to check.'),
});
export type CheckApiKeyStatusInput = z.infer<typeof CheckApiKeyStatusInputSchema>;

const CheckApiKeyStatusOutputSchema = z.object({
  isWorking: z.boolean().describe('Whether the API key is working or not.'),
});
export type CheckApiKeyyStatusOutput = z.infer<
  typeof CheckApiKeyStatusOutputSchema
>;

export async function checkApiKeyStatus(
  input: CheckApiKeyStatusInput
): Promise<CheckApiKeyyStatusOutput> {
  return checkApiKeyStatusFlow(input);
}

const checkApiKeyStatusFlow = ai.defineFlow(
  {
    name: 'checkApiKeyStatusFlow',
    inputSchema: CheckApiKeyStatusInputSchema,
    outputSchema: CheckApiKeyStatusOutputSchema,
  },
  async ({apiKey}) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
      const response = await fetch(url, { method: 'GET' });
      return {
        isWorking: response.ok,
      };
    } catch (error) {
      console.error(`Error checking API key:`, error);
      return {
        isWorking: false,
      };
    }
  }
);
