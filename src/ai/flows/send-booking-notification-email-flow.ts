'use server';
/**
 * @fileOverview A Genkit flow to send a booking notification email to a service provider.
 * This flow uses nodemailer to send actual emails.
 *
 * - sendBookingNotificationEmail - A function that handles the email notification process.
 * - SendBookingNotificationEmailInput - The input type for the function.
 * - SendBookingNotificationEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/ai-instance'; // Ensure this path is correct
import {z} from 'genkit';
import nodemailer from 'nodemailer';

const SendBookingNotificationEmailInputSchema = z.object({
  providerEmail: z.string().email().describe('The email address of the service provider.'),
  customerName: z.string().describe('The name of the customer who made the booking.'),
  businessName: z.string().describe('The name of the service provider\'s business.'),
  serviceDetails: z.string().describe('A summary of the booked services, including names, durations, and prices.'),
  appointmentDateTime: z.string().describe('The date and time of the appointment, formatted as a string (e.g., "July 20, 2024 at 2:00 PM").'),
});
export type SendBookingNotificationEmailInput = z.infer<typeof SendBookingNotificationEmailInputSchema>;

const SendBookingNotificationEmailOutputSchema = z.object({
  status: z.string().describe('The status of the email notification (e.g., "Email sent successfully." or "Failed to send email.").'),
  messageId: z.string().optional().describe('The message ID if the email was sent successfully.'),
  error: z.string().optional().describe('Error message if email sending failed.'),
  sentEmailContent: z.string().optional().describe('The content of the email that was attempted to be sent.'),
});
export type SendBookingNotificationEmailOutput = z.infer<typeof SendBookingNotificationEmailOutputSchema>;

export async function sendBookingNotificationEmail(input: SendBookingNotificationEmailInput): Promise<SendBookingNotificationEmailOutput> {
  return sendBookingNotificationEmailFlow(input);
}

const emailPrompt = ai.definePrompt({
  name: 'sendBookingNotificationEmailPrompt',
  input: {schema: SendBookingNotificationEmailInputSchema},
  // Output schema for the prompt itself to generate subject and body
  output: {schema: z.object({ emailSubject: z.string(), emailBody: z.string() })}, 
  prompt: `
Generate an email subject and body for a new booking notification.

Booking Details:
Provider Business: {{businessName}}
Customer Name: {{customerName}}
Appointment Date & Time: {{appointmentDateTime}}
Services Booked:
{{{serviceDetails}}}

The email should be professional and clearly inform the provider about the new booking.
The subject should be concise and informative, like "New Booking Confirmation for {{businessName}}".
The body should start with "Dear {{businessName}}," and include all the booking details.
End with "Regards, Bookify Platform".
`,
});

const sendBookingNotificationEmailFlow = ai.defineFlow(
  {
    name: 'sendBookingNotificationEmailFlow',
    inputSchema: SendBookingNotificationEmailInputSchema,
    outputSchema: SendBookingNotificationEmailOutputSchema,
  },
  async (input) => {
    // Check for necessary environment variables for nodemailer
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
      console.error('SMTP environment variables are not fully configured.');
      return {
        status: 'Email sending not configured. Missing SMTP environment variables.',
        sentEmailContent: 'Email not generated due to configuration issues.',
      };
    }
    
    // Generate the email content using the prompt
    const { output: promptOutput } = await emailPrompt(input);
    const emailSubject = promptOutput?.emailSubject || `New Booking for ${input.businessName}`;
    const emailBody = promptOutput?.emailBody || `Dear ${input.businessName},\n\nYou have a new booking from ${input.customerName} on ${input.appointmentDateTime} for:\n${input.serviceDetails}\n\nRegards,\nBookify Platform`;

    // Create a nodemailer transporter
    // User needs to set these environment variables:
    // SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Bookify Platform" <${SMTP_FROM_EMAIL}>`,
      to: input.providerEmail,
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'), // Simple conversion of newlines to <br> for HTML email
      text: emailBody,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      return {
        status: 'Email sent successfully.',
        messageId: info.messageId,
        sentEmailContent: emailBody,
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        status: 'Failed to send email.',
        error: error.message || 'Unknown error occurred during email sending.',
        sentEmailContent: emailBody, // Still return the content that was attempted
      };
    }
  }
);
