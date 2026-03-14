import { Column, Heading, Row, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/email-layout";

export interface SubscriptionStartedEmailProps {
  organizationName: string;
  organizationLogo?: string | null;
  productName: string;
  amount: string;
  assetCode: string;
  currentPeriodEnd: string;
  customerEmail?: string;
}

export function SubscriptionStartedEmail({
  organizationName,
  organizationLogo,
  productName,
  amount,
  assetCode,
  currentPeriodEnd,
  customerEmail,
}: SubscriptionStartedEmailProps) {
  return (
    <EmailLayout
      preview={`Whops! You just got a new subscriber 🎉`}
      organizationName={organizationName}
      organizationLogo={organizationLogo}
    >
      <Heading className="text-foreground m-0 mb-2 text-2xl font-bold">Whops! New subscriber 🚀</Heading>
      <Text className="text-muted-foreground mt-0 mb-6">
        Someone just subscribed to <span className="text-foreground font-semibold">{productName}</span>. Recurring
        revenue is the best kind — nice work!
      </Text>

      <Section className="bg-muted mb-6 rounded-lg px-5 py-4">
        <Row className="mb-2">
          <Column className="text-muted-foreground w-[120px] text-xs font-medium tracking-wide uppercase">Plan</Column>
          <Column className="text-foreground text-sm font-medium">{productName}</Column>
        </Row>
        <Row className="mb-2">
          <Column className="text-muted-foreground w-[120px] text-xs font-medium tracking-wide uppercase">
            Amount
          </Column>
          <Column className="text-foreground text-sm font-semibold">
            {amount} {assetCode}
          </Column>
        </Row>
        <Row className="mb-2">
          <Column className="text-muted-foreground w-[120px] text-xs font-medium tracking-wide uppercase">
            Renews
          </Column>
          <Column className="text-foreground text-sm">{currentPeriodEnd}</Column>
        </Row>
        {customerEmail && (
          <Row>
            <Column className="text-muted-foreground w-[120px] text-xs font-medium tracking-wide uppercase">
              Customer
            </Column>
            <Column className="text-muted-foreground text-sm">{customerEmail}</Column>
          </Row>
        )}
      </Section>

      <Text className="text-muted-foreground m-0 text-sm">
        Payments will be collected automatically each period. Sit back and let it run.
      </Text>
    </EmailLayout>
  );
}

export default SubscriptionStartedEmail;
