import { MeteredFirstPurchaseEmail } from "@/emails/metered-first-purchase";
import { PaymentConfirmedEmail } from "@/emails/payment-confirmed";
import { PaymentFirstPurchaseEmail } from "@/emails/payment-first-purchase";
import { SubscriptionStartedEmail } from "@/emails/subscription-started";

import { EmailApi } from "./email";

const emailApi = new EmailApi();

const subjects: Record<string, string> = {
  "payment.confirmed": "Whops! You just got paid 💸",
  "payment.first_purchase": "Whops! You just made a sale 🎉",
  "subscription.started": "Whops! You just got a new subscriber 🎉",
  "metered.first_purchase": "Whops! You just made a metered sale 🎉",
};

export async function sendEmailEvent(event: any): Promise<void> {
  const subject = subjects[event.type];

  let react: React.ReactNode;

  switch (event.type) {
    case "payment.confirmed": {
      const { merchantEmail: _, ...props } = event.payload;
      react = PaymentConfirmedEmail(props);
      break;
    }
    case "payment.first_purchase": {
      const { merchantEmail: _, ...props } = event.payload;
      react = PaymentFirstPurchaseEmail(props);
      break;
    }
    case "subscription.started": {
      const { merchantEmail: _, ...props } = event.payload;
      react = SubscriptionStartedEmail(props);
      break;
    }
    case "metered.first_purchase": {
      const { merchantEmail: _, ...props } = event.payload;
      react = MeteredFirstPurchaseEmail(props);
      break;
    }
  }

  await emailApi.sendEmail(event.payload.merchantEmail, subject, react);
}
