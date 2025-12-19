"use client";

import { FullScreenModal } from "@/components/fullscreen-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import * as RHF from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextAreaField, TextField } from "@/components/input-picker";

const schema = z.object({
  destinationName: z.string().min(3),
  endpointUrl: z.url(),
  description: z.string().optional(),
  events: z.array(z.string()).min(1),
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
  const form = RHF.useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      destinationName: "",
      endpointUrl: "https://",
      description: "",
      events: [] as string[],
    },
  });

  const events = form.watch("events");

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
        <Button type="submit" className="gap-2">
          Create destination
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
    >
      <form
        onSubmit={form.handleSubmit((data) => console.log(data))}
        className="space-y-8"
      >
        <div className="space-y-6 max-w-2xl">
          <RHF.Controller
            control={form.control}
            name="destinationName"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id="destination-name"
                label="Destination name"
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
                  <div className="flex flex-col gap-4">
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
        </div>
      </form>
    </FullScreenModal>
  );
}

export default WebHooksModal;
