import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @param from - Sender email (optional, defaults to env variable or Resend default)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
) {
  try {
    const result = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to,
      subject,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to send email"
    );
  }
}
