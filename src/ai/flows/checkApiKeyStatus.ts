'use server';
/**
 * @fileOverview
 * A realistic Gemini API key validator.
 * This version simulates the same type of request a chatbot would send,
 * so only truly working keys will pass (not just valid ones).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CheckApiKeyStatusInputSchema = z.object({
  apiKey: z.string().describe('The Gemini API key to check.'),
});
export type CheckApiKeyStatusInput = z.infer<typeof CheckApiKeyStatusInputSchema>;

const CheckApiKeyStatusOutputSchema = z.object({
  isWorking: z.boolean().describe('Whether the API key is truly working in chatbot context.'),
  statusCode: z.number().optional(),
  message: z.string().optional(),
});
export type CheckApiKeyStatusOutput = z.infer<typeof CheckApiKeyStatusOutputSchema>;

export async function checkApiKeyStatus(
  input: CheckApiKeyStatusInput
): Promise<CheckApiKeyStatusOutput> {
  return checkApiKeyStatusFlow(input);
}

const checkApiKeyStatusFlow = ai.defineFlow(
  {
    name: 'checkApiKeyStatusFlow',
    inputSchema: CheckApiKeyStatusInputSchema,
    outputSchema: CheckApiKeyStatusOutputSchema,
  },
  async ({ apiKey }) => {
    const GEMINI_MODEL = 'gemini-2.5-flash';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    try {
      // نرسل طلب بنفس طريقة البوت الحقيقي
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'اختبار اتصال API للدردشة' }],
            },
          ],
        }),
      });

      const data = await response.json();

      // ✅ تحقق واقعي: لازم يرجع candidates مع output text
      if (response.ok && Array.isArray(data?.candidates) && data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          isWorking: true,
          statusCode: response.status,
          message: 'API key works properly in chatbot context.',
        };
      }

      // ❌ مفتاح غير شغال فعليًا
      return {
        isWorking: false,
        statusCode: response.status,
        message: data?.error?.message || 'API key not functional in chatbot context.',
      };
    } catch (error: any) {
      console.error(`Error validating key ending with ...${apiKey.slice(-4)}:`, error);
      return {
        isWorking: false,
        message: 'Network or unexpected error occurred.',
      };
    }
  }
);
