'use server';
/**
 * @fileOverview A Genkit flow to send a booking notification email to a service provider.
 * This flow simulates email sending for demonstration purposes.
 *
 * - sendBookingNotificationEmail - A function that handles the email notification process.
 * - SendBookingNotificationEmailInput - The input type for the function.
 * - SendBookingNotificationEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/ai-instance'; // Ensure this path is correct
import {z} from 'genkit';

const SendBookingNotificationEmailInputSchema = z.object({
  providerEmail: z.string().email().describe('The email address of the service provider.'),
  customerName: z.string().describe('The name of the customer who made the booking.'),
  businessName: z.string().describe('The name of the service provider\'s business.'),
  serviceDetails: z.string().describe('A summary of the booked services, including names, durations, and prices.'),
  appointmentDateTime: z.string().describe('The date and time of the appointment, formatted as a string (e.g., "July 20, 2024 at 2:00 PM").'),
});
export type SendBookingNotificationEmailInput = z.infer<typeof SendBookingNotificationEmailInputSchema>;

const SendBookingNotificationEmailOutputSchema = z.object({
  status: z.string().describe('The status of the email notification (e.g., "Email notification simulated successfully.").'),
  simulatedEmailContent: z.string().optional().describe('The content of the simulated email.'),
});
export type SendBookingNotificationEmailOutput = z.infer<typeof SendBookingNotificationEmailOutputSchema>;

export async function sendBookingNotificationEmail(input: SendBookingNotificationEmailInput): Promise<SendBookingNotificationEmailOutput> {
  return sendBookingNotificationEmailFlow(input);
}

const emailPrompt = ai.definePrompt({
  name: 'sendBookingNotificationEmailPrompt',
  input: {schema: SendBookingNotificationEmailInputSchema},
  // Output schema for the prompt itself can be simpler if the flow constructs the final output
  output: {schema: z.object({ emailBody: z.string() })}, 
  prompt: `
Subject: New Booking Confirmation for {{businessName}}

Dear {{businessName}},

You have a new booking!

Customer: {{customerName}}
Appointment Date & Time: {{appointmentDateTime}}

Services Booked:
{{{serviceDetails}}}

Please log in to your dashboard to view the full details and manage this appointment.

Regards,
Bookify Platform
`,
});

const sendBookingNotificationEmailFlow = ai.defineFlow(
  {
    name: 'sendBookingNotificationEmailFlow',
    inputSchema: SendBookingNotificationEmailInputSchema,
    outputSchema: SendBookingNotificationEmailOutputSchema,
  },
  async (input) => {
    console.log(`Simulating email sending to: ${input.providerEmail}`);
    
    // Generate the email content using the prompt
    const { output: promptOutput } = await emailPrompt(input);
    const emailContent = promptOutput?.emailBody || "Could not generate email content.";

    console.log('Simulated Email Content:\n', emailContent);

    // In a real application, you would integrate with an email service here.
    // For example, using Nodemailer, SendGrid, Mailgun, etc.
    // await emailService.send({
    //   to: input.providerEmail,
    //   subject: `New Booking Confirmation for ${input.businessName}`,
    //   html: emailContent, // or text: emailContent
    // });

    return {
      status: 'Email notification simulated successfully.',
      simulatedEmailContent: emailContent,
    };
  }
);
