import { Resend as ResendClient } from "resend";

const resend = new ResendClient(process.env.RESEND_API_KEY);

export class Resend {
  constructor() {}

  async sendEmail(email: string, subject: string, html: string) {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject,
      html,
    });

    return result;
  }
}
