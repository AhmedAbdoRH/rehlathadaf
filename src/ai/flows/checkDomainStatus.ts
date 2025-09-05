'use server';
/**
 * @fileOverview A flow to check the status of a website.
 *
 * - checkDomainStatus - A function that checks if a domain is online.
 * - CheckDomainStatusInput - The input type for the checkDomainStatus function.
 * - CheckDomainStatusOutput - The return type for the checkDomainStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckDomainStatusInputSchema = z.object({
  domainName: z.string().describe('The domain name to check.'),
});
export type CheckDomainStatusInput = z.infer<typeof CheckDomainStatusInputSchema>;

const CheckDomainStatusOutputSchema = z.object({
  isOnline: z.boolean().describe('Whether the domain is online or not.'),
});
export type CheckDomainStatusOutput = z.infer<
  typeof CheckDomainStatusOutputSchema
>;

export async function checkDomainStatus(
  input: CheckDomainStatusInput
): Promise<CheckDomainStatusOutput> {
  return checkDomainStatusFlow(input);
}

const checkDomainStatusFlow = ai.defineFlow(
  {
    name: 'checkDomainStatusFlow',
    inputSchema: CheckDomainStatusInputSchema,
    outputSchema: CheckDomainStatusOutputSchema,
  },
  async ({domainName}) => {
    try {
      // Prepend http:// if no protocol is present.
      const url = domainName.startsWith('http') ? domainName : `http://${domainName}`;
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) }); // 5 second timeout
      return {
        isOnline: response.ok,
      };
    } catch (error) {
      console.error(`Error checking domain ${domainName}:`, error);
      return {
        isOnline: false,
      };
    }
  }
);
