"use client";

import React from "react";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import * as RHF from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextAreaField, TextField } from "@/components/input-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CodeBlock } from "../code-block";
import { TypeScript, Curl } from "../icon";
import { toast } from "@/components/ui/toast";

const schema = z.object({
  destinationName: z
    .string()
    .min(1, "Destination name is required")
    .min(3, "Destination name must be at least 3 characters")
    .max(100, "Destination name must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Destination name can only contain lowercase letters, numbers, and hyphens"
    ),
  endpointUrl: z
    .string()
    .min(1, "Endpoint URL is required")
    .url("Please enter a valid URL")
    .refine(
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
    )
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          return parsedUrl.hostname.length > 0;
        } catch {
          return false;
        }
      },
      {
        message: "Please enter a valid domain name",
      }
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  events: z
    .array(z.string())
    .min(1, "Please select at least one event"),
});

interface WebhooksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEBHOOK_EVENTS = [
  { id: "customer.created", label: "Customer Created" },
  { id: "invoice.created", label: "Invoice Created" },
  { id: "payment.succeded", label: "Payment Succeeded" },
  { id: "payment.failed", label: "Payment Failed" },
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]["id"];

export function WebHooksModal({ open, onOpenChange }: WebhooksModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

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

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setIsSubmitting(false);
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
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Log to console
      console.log("Webhook destination created:", {
        destinationName: data.destinationName,
        endpointUrl: data.endpointUrl,
        description: data.description,
        events: data.events,
        createdAt: new Date().toISOString(),
      });

      // Show success toast
      toast.success(
        "Webhook destination created successfully",
        {
          description: `${data.destinationName} is now configured to receive events.`,
        } as Parameters<typeof toast.success>[1]
      );

      // Reset form and close modal
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create webhook destination:", error);
      toast.error("Failed to create webhook destination");
    } finally {
      setIsSubmitting(false);
    }
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
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
      description="Tell StellarToo where to send events and give your destination a helpful description."
      footer={footer}
      dialogClassName="flex" 
     
    >

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <form
          ref={formRef}
          id="webhook-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 space-y-6 min-w-0"
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
                className="h-auto py-1 px-2 text-xs shadow-none"
              >
                {events.length === WEBHOOK_EVENTS.length
                  ? "Deselect all"
                  : "Select all"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
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
                          className="text-sm font-medium cursor-pointer"
                        >
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {error?.message && (
                    <p className="text-sm text-destructive" role="alert">
                      {error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </form>

        {/* Code Examples Section */}
        <div className="flex-1 space-y-6 min-w-0 lg:max-w-2xl">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Code Examples</h3>
              <p className="text-sm text-muted-foreground">
                Here are examples of how to handle webhook events in your application.
              </p>
            </div>

            <Tabs defaultValue="typescript" className="w-full">
              <TabsList className="w-fit">
                <TabsTrigger 
                  value="typescript" 
                  className="px-4 py-2 min-w-[120px] data-[state=active]:shadow-none"
                >
                  <TypeScript className="w-4 h-4" />
                  TypeScript
                </TabsTrigger>
                <TabsTrigger 
                  value="curl" 
                  className="px-4 py-2 min-w-[120px] data-[state=active]:shadow-none"
                >
                  <Curl className="w-4 h-4" />
                  cURL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typescript" className="mt-4">
                <div className="space-y-2">
                  <Label>TypeScript Example</Label>
                  <CodeBlock
                    language="typescript"
                    filename="webhook-handler.ts"
                    maxHeight="400px"
                  >
{`import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@stellar/webhooks';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stellar-signature');

  // Verify webhook signature
  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.STELLAR_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  const event = JSON.parse(body);

  // Handle different event types
  switch (event.type) {
    case 'customer_created':
      await handleCustomerCreated(event.data);
      break;
    case 'invoice_created':
      await handleInvoiceCreated(event.data);
      break;
    case 'payment_succeded':
      await handlePaymentSucceeded(event.data);
      break;
    case 'payment_failed':
      await handlePaymentFailed(event.data);
      break;
    default:
      console.log('Unknown event type:', event.type);
  }

  return NextResponse.json({ received: true });
}

async function handleCustomerCreated(data: any) {
  // Your customer creation logic
  console.log('Customer created:', data);
}

async function handleInvoiceCreated(data: any) {
  // Your invoice creation logic
  console.log('Invoice created:', data);
}

async function handlePaymentSucceeded(data: any) {
  // Your payment success logic
  console.log('Payment succeeded:', data);
}

async function handlePaymentFailed(data: any) {
  // Your payment failure logic
  console.log('Payment failed:', data);
}`}
                  </CodeBlock>
                </div>
              </TabsContent>

            <TabsContent value="curl" className="mt-4">
              <div className="space-y-2">
                <Label>cURL Example</Label>
                <CodeBlock
                  language="bash"
                  maxHeight="400px"
                >
{`# Test webhook endpoint with cURL
curl -X POST https://your-endpoint.com/api/webhooks/stellar \\
  -H "Content-Type: application/json" \\
  -H "Stellar-Signature: your_signature_here" \\
  -d '{
    "id": "evt_1234567890",
    "type": "customer_created",
    "created": 1640995200,
    "data": {
      "id": "cus_1234567890",
      "email": "customer@example.com",
      "name": "John Doe"
    }
  }'

# Example webhook payload structure
# {
#   "id": "evt_1234567890",
#   "type": "payment_succeded",
#   "created": 1640995200,
#   "data": {
#     "payment_id": "pay_1234567890",
#     "amount": 1000,
#     "currency": "USD",
#     "customer_id": "cus_1234567890"
#   }
# }`}
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
