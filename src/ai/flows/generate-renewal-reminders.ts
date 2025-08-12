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
  prompt: `أنت مساعد ذكاء اصطناعي متخصص في إنشاء رسائل تذكير شخصية عبر البريد الإلكتروني لتجديد النطاقات.

  بالنظر إلى القائمة التالية من النطاقات ومعلومات تجديدها، قم بإنشاء تذكير شخصي عبر البريد الإلكتروني لكل نطاق.
  يجب أن تتضمن كل رسالة بريد إلكتروني اسم العميل واسم النطاق وتاريخ التجديد والرصيد المستحق (إن وجد) وتذكيرًا ودودًا بتجديد نطاقهم.
  إذا كان النطاق متأخرًا عن السداد، فيجب أن يذكر التذكير أيضًا حالة التأخير ويحث العميل على اتخاذ إجراء فوري.

  إليك معلومات النطاق والعميل:
  {{#each domains}}
  اسم النطاق: {{{domainName}}}
  تاريخ التجديد: {{{renewalDate}}}
  اسم العميل: {{{clientName}}}
  البريد الإلكتروني للعميل: {{{clientEmail}}}
  الرصيد المستحق: {{{outstandingBalance}}}
  متأخر عن السداد: {{#if isPastDue}}نعم{{else}}لا{{/if}}
  \n
  {{/each}}

  قم بإنشاء تذكيرات بريد إلكتروني مخصصة لكل نطاق، مصممة خصيصًا للعميل وتفاصيل النطاق.
  يجب أن تكون رسائل التذكير موجزة ومهنية وموجهة نحو الإجراء.
  تأكد من تضمين جميع المعلومات الضرورية بطريقة ودية ومفيدة.

  يجب أن يكون الإخراج عبارة عن مصفوفة JSON من الكائنات، حيث يحتوي كل كائن على domainName و clientEmail و reminderMessage.
  تأكد من أن reminderMessage مقنعة وتتضمن جميع المعلومات الموضحة أعلاه.
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
