import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param email - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 */
export async function sendEmail(email: string, subject: string, html: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject,
      html,
    });
    console.log("Email sent successfully:", result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
