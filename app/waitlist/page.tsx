"use client";

import { postWaitlist } from "@/actions/waitlist";
import { AuroraBackground } from "@/components/aurora-background";
import { GitHub } from "@/components/icon";
import {
  type PhoneNumber,
  PhoneNumberPicker,
  phoneNumberToString,
} from "@/components/phone-number-picker";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.email(),
  phoneNumber: z
    .object({
      number: z.string(),
      countryCode: z.string().min(1, "Country code is required"),
    })
    .optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export default function WaitlistPage() {
  const waitlistMutation = useMutation({
    mutationFn: postWaitlist,
    onSuccess: () => {
      toast.success("You've been added to the waitlist!");
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to join waitlist. Please try again.");
    },
  });

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
      phoneNumber: { number: "", countryCode: "US" },
    },
  });

  const onSubmit = (data: WaitlistFormData) => {
    waitlistMutation.mutate({
      email: data.email,
      phoneNumber: data.phoneNumber ? phoneNumberToString(data.phoneNumber) : undefined,
    });
  };

  return (
    <AuroraBackground>
      <div className="bg-background min-h-screen">
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="from-foreground to-foreground/70 bg-linear-to-b bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                Join the Waitlist
              </h1>
              <p className="text-muted-foreground text-base">
                Be among the first to know when we launch
              </p>
            </div>

            <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      id="email"
                      label="Email"
                      placeholder="name@example.com"
                      error={error?.message || null}
                      value={field.value}
                      onChange={field.onChange}
                      className="shadow-none"
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="phoneNumber"
                  render={({ field, fieldState: { error } }) => {
                    const phoneValue: PhoneNumber = {
                      number: field.value?.number || "",
                      countryCode: field.value?.countryCode || "US",
                    };

                    return (
                      <PhoneNumberPicker
                        id="phoneNumber"
                        label="Phone Number (Optional)"
                        value={phoneValue}
                        onChange={field.onChange}
                        error={(error as any)?.number?.message || error?.message || null}
                        groupClassName="w-full shadow-none"
                      />
                    );
                  }}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={waitlistMutation.isPending}
                  isLoading={waitlistMutation.isPending}
                  size="lg"
                >
                  {waitlistMutation.isPending ? "Joining" : "Join Waitlist"}
                </Button>
              </form>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2">
              <Link
                href="https://github.com/usepaykit/stellar-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
              >
                <GitHub className="size-6" />
                GitHub
              </Link>
              <Link
                href="https://discord.gg/xnpSgBwMgC"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
              >
                <svg
                  width="25px"
                  height="25px"
                  viewBox="0 -28.5 256 256"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  preserveAspectRatio="xMidYMid"
                >
                  <g>
                    <path
                      d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                      fill="currentColor"
                      fillRule="nonzero"
                    ></path>
                  </g>
                </svg>
                Discord
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
