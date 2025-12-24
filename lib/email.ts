import { Resend } from "resend";

// Initialize Resend client
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  metadata?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 * @param options - Email options
 * @returns Promise with send result
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();

    // Validate that at least html or text is provided
    if (!options.html && !options.text) {
      throw new Error("Either html or text content must be provided");
    }

    // Get default from address from environment or use Resend default
    const from =
      options.from ||
      process.env.RESEND_FROM_EMAIL ||
      process.env.RESEND_FROM ||
      "onboarding@resend.dev";

    const emailData: Parameters<typeof resend.emails.send>[0] = {
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      ...(options.html && { html: options.html }),
      ...(options.text && { text: options.text }),
      ...(options.replyTo && {
        reply_to: Array.isArray(options.replyTo)
          ? options.replyTo
          : [options.replyTo],
      }),
      ...(options.cc && {
        cc: Array.isArray(options.cc) ? options.cc : [options.cc],
      }),
      ...(options.bcc && {
        bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc],
      }),
      ...(options.tags && { tags: options.tags }),
      ...(options.metadata && { headers: options.metadata }),
    };

    const result = await resend.emails.send(emailData);

    // Handle Resend API response
    if (result.error) {
      return {
        success: false,
        error:
          typeof result.error === "string"
            ? result.error
            : result.error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send a simple text email
 */
export async function sendTextEmail(
  to: string | string[],
  subject: string,
  text: string,
  options?: Omit<SendEmailOptions, "to" | "subject" | "text">
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject,
    text,
    ...options,
  });
}

/**
 * Send a simple HTML email
 */
export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: Omit<SendEmailOptions, "to" | "subject" | "html">
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject,
    html,
    ...options,
  });
}

