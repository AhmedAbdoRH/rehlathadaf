'use server';

/**
 * @fileOverview AI-powered email reminder generator for domain renewals.
 *
 * - generateRenewalReminders - A function to generate personalized email reminders for domain renewals.
 * - GenerateRenewalRemindersInput - The input type for the generateRenewalReminders function.
 * - GenerateRenewalRemindersOutput - The return type for the generateRenewalReminders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRenewalRemindersInputSchema = z.object({
  domains: z.array(
    z.object({
      domainName: z.string().describe('The name of the domain.'),
      renewalDate: z.string().describe('The renewal date of the domain (YYYY-MM-DD).'),
      clientName: z.string().describe('The name of the client.'),
      clientEmail: z.string().describe('The email address of the client.'),
      outstandingBalance: z.number().describe('The outstanding balance of the client.'),
      isPastDue: z.boolean().describe('Whether the domain is past due.'),
    })
  ).describe('An array of domain objects with renewal information.'),
});
export type GenerateRenewalRemindersInput = z.infer<typeof GenerateRenewalRemindersInputSchema>;

const GenerateRenewalRemindersOutputSchema = z.object({
  reminders: z.array(
    z.object({
      domainName: z.string().describe('The name of the domain.'),
      clientEmail: z.string().describe('The email address of the client.'),
      reminderMessage: z.string().describe('The personalized email reminder message.'),
    })
  ).describe('An array of reminder messages for each domain.'),
});
export type GenerateRenewalRemindersOutput = z.infer<typeof GenerateRenewalRemindersOutputSchema>;

export async function generateRenewalReminders(input: GenerateRenewalRemindersInput): Promise<GenerateRenewalRemindersOutput> {
  return generateRenewalRemindersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRenewalRemindersPrompt',
  input: {schema: GenerateRenewalRemindersInputSchema},
  output: {schema: GenerateRenewalRemindersOutputSchema},
  prompt: `You are an AI assistant specializing in generating personalized email reminders for domain renewals.

  Given the following list of domains and their renewal information, create a personalized email reminder for each domain.
  Each email should include the client's name, domain name, renewal date, outstanding balance (if any), and a friendly reminder to renew their domain.
  If a domain is past due, the reminder should also mention the overdue status and urge the client to take immediate action.

  Here's the domain and client information:
  {{#each domains}}
  Domain Name: {{{domainName}}}
  Renewal Date: {{{renewalDate}}}
  Client Name: {{{clientName}}}
  Client Email: {{{clientEmail}}}
  Outstanding Balance: {{{outstandingBalance}}}
  Past Due: {{#if isPastDue}}Yes{{else}}No{{/if}}
  \n
  {{/each}}

  Generate personalized email reminders for each domain, tailored to the client and domain specifics.
  The reminder messages should be concise, professional, and action-oriented.
  Make sure to include all necessary information in a friendly and helpful manner.

  Output should be a JSON array of objects, where each object contains the domainName, clientEmail, and reminderMessage.
  Make sure the reminderMessage is compelling and includes all the information described above.
  `, 
});

const generateRenewalRemindersFlow = ai.defineFlow(
  {
    name: 'generateRenewalRemindersFlow',
    inputSchema: GenerateRenewalRemindersInputSchema,
    outputSchema: GenerateRenewalRemindersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
