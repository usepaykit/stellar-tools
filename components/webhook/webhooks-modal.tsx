"use client";

import React from "react";

import { postWebhook } from "@/actions/webhook";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextAreaField, TextField } from "@/components/input-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { Network, WebhookEvent } from "@/db";
import { useCopy } from "@/hooks/use-copy";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import * as RHF from "react-hook-form";
import { z } from "zod";

import { CodeBlock } from "../code-block";
import { Curl, TypeScript } from "../icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const getWebhookHandlerTypeScript = (
  secret: string
) => /* ts */ `import { NextRequest, NextResponse } from 'next/server';
import { StellarTools } from '@stellartools/core';

const stellar = new StellarTools({
  apiKey: process.env.STELLAR_API_KEY!,
  debug: false,
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stellar-signature');

  if (!signature) {
    return NextResponse.json( { error: 'Missing signature' }, { status: 401 });
  }

  // Verify webhook signature
  const isValid = stellar.webhook.verifySignature(
    body,
    signature,
    '${secret}'
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle different event types
  switch (event.type) {
    case 'customer.created':
      await handleCustomerCreated(event.data);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(event.data);
      break;
    case 'customer.deleted':
      await handleCustomerDeleted(event.data);
      break;
    case 'checkout.created':
      await handleCheckoutCreated(event.data);
      break;
    case 'payment.pending':
      await handlePaymentPending(event.data);
      break;
    case 'payment.confirmed':
      await handlePaymentConfirmed(event.data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(event.data);
      break;
    case 'refund.created':
      await handleRefundCreated(event.data);
      break;
    case 'refund.succeeded':
      await handleRefundSucceeded(event.data);
      break;
    case 'refund.failed':
      await handleRefundFailed(event.data);
      break;
    default:
      console.log('Unhandled event:', event.type);
  }

  return NextResponse.json({ received: true });
}
`;

// prettier-ignore
const WEBHOOK_CURL_EXAMPLE = /* sh */ `
curl -X POST https://your-domain.com/api/webhooks \\
  -H "Content-Type: application/json" \\
  -H "stellar-signature: t=1735000000,v1=abc123..." \\
  -d '{
    "id": "evt_123",
    "type": "payment.confirmed",
    "created": 1735000000,
    "data": {
      "id": "pay_123",
      "amount": 100,
      "assetCode": "USDC",
      "status": "confirmed",
      "transactionHash": "abc123...",
      "customerId": "cus_123"
    }
  }'

# Available webhook events:
# - customer.created
# - customer.updated
# - customer.deleted
# - checkout.created
# - payment.pending
# - payment.confirmed
# - payment.failed
# - refund.created
# - refund.succeeded
# - refund.failed
`;

const schema = z.object({
  destinationName: z.string().regex(/^[a-z0-9-]+$/),
  endpointUrl: z.url().refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message: "Endpoint URL must use HTTPS protocol",
    }
  ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  events: z.array(z.string()).min(1, "Please select at least one event"),
});

interface WebhooksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  environment: Network;
}

const WEBHOOK_EVENTS = [
  { id: "customer.created", label: "Customer Created" },
  { id: "customer.updated", label: "Customer Updated" },
  { id: "customer.deleted", label: "Customer Deleted" },
  { id: "checkout.created", label: "Checkout Created" },
  { id: "payment.pending", label: "Payment Pending" },
  { id: "payment.confirmed", label: "Payment Confirmed" },
  { id: "payment.failed", label: "Payment Failed" },
  { id: "refund.created", label: "Refund Created" },
  { id: "refund.succeeded", label: "Refund Succeeded" },
  { id: "refund.failed", label: "Refund Failed" },
] as const satisfies { id: WebhookEvent[number]; label: string }[];

export function WebHooksModal({
  open,
  onOpenChange,
  organizationId,
  environment,
}: WebhooksModalProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const [webhookSecret, setWebhookSecret] = React.useState<string>("");
  const { copied, handleCopy } = useCopy();

  // Generate webhook secret when modal opens
  React.useEffect(() => {
    if (open) {
      const secret = `whsec_${nanoid(32)}`;
      setWebhookSecret(secret);
    }
  }, [open]);

  const handleCopySecret = async () => {
    if (webhookSecret) {
      await handleCopy({
        text: webhookSecret,
        message: "Webhook secret copied to clipboard",
      });
    }
  };

  const form = RHF.useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      destinationName: "",
      endpointUrl: "",
      description: "",
      events: [] as string[],
    },
  });

  const events = form.watch("events");

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await postWebhook(organizationId, {
        name: data.destinationName,
        url: data.endpointUrl,
        description: data.description || undefined,
        events: data.events as WebhookEvent[],
        environment,
      });
    },
    onSuccess: (webhook) => {
      // Invalidate and refetch webhooks
      queryClient.invalidateQueries({
        queryKey: ["webhooks", organizationId, environment],
      });
      toast.success("Webhook destination created successfully", {
        description: `${webhook.name} is now configured to receive events.`,
      } as Parameters<typeof toast.success>[1]);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Failed to create webhook destination:", error);
      toast.error("Failed to create webhook destination", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      } as Parameters<typeof toast.error>[1]);
    },
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSelectAll = () => {
    if (events.length === WEBHOOK_EVENTS.length) {
      form.setValue("events", []);
    } else {
      form.setValue(
        "events",
        WEBHOOK_EVENTS.map((e) => e.id)
      );
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    createWebhookMutation.mutate(data);
  };

  const footer = (
    <div className="flex w-full justify-between">
      <Button
        type="button"
        variant="ghost"
        onClick={() => onOpenChange(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => form.handleSubmit(onSubmit)()}
          className="gap-2"
          disabled={createWebhookMutation.isPending}
        >
          {createWebhookMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create destination"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Configure destination"
      description="Tell StellarTools where to send events and give your destination a helpful description."
      footer={footer}
      dialogClassName="flex"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <form
          ref={formRef}
          id="webhook-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="min-w-0 flex-1 space-y-6"
        >
          <RHF.Controller
            control={form.control}
            name="destinationName"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="destination-name"
                label="Destination name"
                className="shadow-none"
                error={error?.message}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="endpointUrl"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="endpoint-url"
                label="Endpoint URL"
                className="shadow-none"
                error={error?.message}
              />
            )}
          />

          <RHF.Controller
            control={form.control}
            name="description"
            render={({ field, fieldState: { error } }) => (
              <TextAreaField
                {...field}
                value={field.value as string}
                id="description"
                label="Description"
                error={error?.message}
                className="shadow-none"
              />
            )}
          />

          {/* Events Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Events</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-auto px-2 py-1 text-xs shadow-none"
              >
                {events.length === WEBHOOK_EVENTS.length
                  ? "Deselect all"
                  : "Select all"}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Choose which events this webhook should listen to.
            </p>
            <RHF.Controller
              control={form.control}
              name="events"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-2">
                  <div className="flex flex-col gap-3">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <Checkbox
                          id={event.id}
                          checked={field.value.includes(event.id)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...field.value, event.id]
                              : field.value.filter(
                                  (id: string) => id !== event.id
                                );
                            field.onChange(newValue);
                          }}
                        />
                        <Label
                          htmlFor={event.id}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {error?.message && (
                    <p className="text-destructive text-sm" role="alert">
                      {error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </form>
        <div className="min-w-0 flex-1 space-y-6 lg:max-w-2xl">
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <div className="flex items-center gap-2">
              <div className="bg-muted border-border flex-1 rounded-md border p-3 shadow-none">
                <code className="font-mono text-sm break-all">
                  {webhookSecret}
                </code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopySecret}
                className="shrink-0 shadow-none"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Use this secret to verify webhook signatures. Keep it secure and
              never expose it in client-side code.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Code Examples</h3>
            <p className="text-muted-foreground text-sm">
              Here are examples of how to handle webhook events in your
              application.
            </p>
          </div>

          <Tabs defaultValue="typescript" className="w-full">
            <TabsList className="w-fit">
              <TabsTrigger
                value="typescript"
                className="min-w-[120px] px-4 py-2 data-[state=active]:shadow-none"
              >
                <TypeScript className="h-4 w-4" />
                TypeScript
              </TabsTrigger>
              <TabsTrigger
                value="curl"
                className="min-w-[120px] px-4 py-2 data-[state=active]:shadow-none"
              >
                <Curl className="h-4 w-4" />
                cURL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="typescript" className="mt-4">
              <div className="space-y-2">
                <Label>TypeScript Example</Label>
                <CodeBlock
                  language="typescript"
                  filename="app/api/webhooks/route.ts"
                  maxHeight="400px"
                >
                  {getWebhookHandlerTypeScript(webhookSecret)}
                </CodeBlock>
              </div>
            </TabsContent>

            <TabsContent value="curl" className="mt-4">
              <div className="space-y-2">
                <Label>cURL Example</Label>
                <CodeBlock language="bash" maxHeight="400px">
                  {WEBHOOK_CURL_EXAMPLE}
                </CodeBlock>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FullScreenModal>
  );
}

export default WebHooksModal;
