import { Resend as ResendClient } from "resend";

const resend = new ResendClient(process.env.RESEND_API_KEY);

export const sendEmail = async (email: string, subject: string, react: React.ReactNode) => {
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject,
    react,
  });
  return result;
};
