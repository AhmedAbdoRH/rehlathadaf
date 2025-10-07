'use server';
/**
 * @fileOverview A flow to check the status of a Google AI API key.
 *
 * - checkApiKeyStatus - A function that checks if an API key is valid.
 * - CheckApiKeyStatusInput - The input type for the checkApiKeyStatus function.
 * - CheckApiKeyyStatusOutput - The return type for the checkApiKeyStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

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
    try {
      // Create a temporary Genkit instance with the provided API key
      const tempAi = genkit({
        plugins: [googleAI({apiKey})],
      });

      // Make a simple, low-cost request to validate the key
      const response = await tempAi.generate({
        model: 'gemini-1.0-pro',
        prompt: 'test',
        config: {
          maxOutputTokens: 1,
        },
      });

      // If we get a response, the key is working.
      return {
        isWorking: !!response.text,
      };
    } catch (error) {
      // Any error during generation means the key is likely invalid or has issues.
      console.error(`Error checking API key ending with ...${apiKey.slice(-4)}:`, error);
      return {
        isWorking: false,
      };
    }
  }
);
