'use server';
/**
 * @fileOverview Suggests a service provider based on user preferences.
 *
 * - suggestServiceProvider - A function that suggests a service provider.
 * - SuggestServiceProviderInput - The input type for the suggestServiceProvider function.
 * - SuggestServiceProviderOutput - The return type for the suggestServiceProvider function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestServiceProviderInputSchema = z.object({
  preferences: z.string().describe('The user preferences for a service provider.'),
});
export type SuggestServiceProviderInput = z.infer<typeof SuggestServiceProviderInputSchema>;

const SuggestServiceProviderOutputSchema = z.object({
  providerName: z.string().describe('The name of the suggested service provider.'),
  providerDescription: z.string().describe('A description of the suggested service provider.'),
});
export type SuggestServiceProviderOutput = z.infer<typeof SuggestServiceProviderOutputSchema>;

export async function suggestServiceProvider(input: SuggestServiceProviderInput): Promise<SuggestServiceProviderOutput> {
  return suggestServiceProviderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestServiceProviderPrompt',
  input: {
    schema: z.object({
      preferences: z.string().describe('The user preferences for a service provider.'),
    }),
  },
  output: {
    schema: z.object({
      providerName: z.string().describe('The name of the suggested service provider.'),
      providerDescription: z.string().describe('A description of the suggested service provider.'),
    }),
  },
  prompt: `You are a service provider recommendation expert. Based on the user preferences, suggest the best service provider. Return the name of the provider and a short description.

User Preferences: {{{preferences}}}`,
});

const suggestServiceProviderFlow = ai.defineFlow<
  typeof SuggestServiceProviderInputSchema,
  typeof SuggestServiceProviderOutputSchema
>(
  {
    name: 'suggestServiceProviderFlow',
    inputSchema: SuggestServiceProviderInputSchema,
    outputSchema: SuggestServiceProviderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
