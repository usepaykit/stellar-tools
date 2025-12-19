"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import * as RHF from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TextField, TextAreaField } from "@/components/input-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import {
  FileUploadPicker,
  type FileWithPreview,
} from "@/components/file-upload-picker";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  images: z.array(z.any()).transform((val) => val as FileWithPreview[]),
  billingCycle: z.enum(["one-time", "recurring"]),
  recurringInterval: z.number().min(1).optional(),
  recurringPeriod: z.enum(["day", "week", "month", "year"]).optional(),
  pricingModel: z.enum(["fixed", "tiered", "usage"]),
  price: z.number().min(1, "Price must be at least $1"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function OnboardingProject() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = RHF.useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      billingCycle: "recurring",
      recurringInterval: 1,
      recurringPeriod: "month",
      pricingModel: "fixed",
      price: 1,
    },
  });

  const billingCycle = form.watch("billingCycle");

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Submitting:", data);

      toast.success("Product created!");
      router.push(`/dashboard/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[600px] flex flex-col items-center">
        {/* Header Section */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Image
            src="/images/logo-light.png"
            alt="Logo"
            width={50}
            height={50}
            className="mb-6 rounded-md object-contain"
            priority
          />
          <h1 className="text-3xl font-normal tracking-tight mb-2">
            Your first product
          </h1>
          <p className="text-muted-foreground">
            Setup your first digital product to get started.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit((data) => onSubmit(data))}
          className="w-full space-y-6"
        >
          <Card className="border-none shadow-none">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-normal">Product Information</h2>
                <p className="text-sm text-muted-foreground">
                  Basic details about your product.
                </p>
              </div>

              <RHF.Controller
                control={form.control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    id={field.name}
                    value={field.value?.toString() as string}
                    label="Name"
                    placeholder="Enter product name"
                    error={error?.message}
                    className="shadow-none"
                  />
                )}
              />

              <RHF.Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <TextAreaField
                    {...field}
                    id={field.name}
                    value={field.name.toString()}
                    label="Description"
                    placeholder="Enter product description"
                    error={fieldState.error?.message}
                    className="min-h-[120px] shadow-none"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-normal">Media</h2>
                <p className="text-sm text-muted-foreground">
                  Enhance the product page with visual media.
                </p>
              </div>

              <RHF.Controller
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FileUploadPicker
                    value={field.value}
                    onFilesChange={field.onChange}
                    dropzoneMaxSize={10 * 1024 * 1024}
                    dropzoneMultiple={false}
                    dropzoneAccept={{ "image/*": [] }}
                    className="shadow-none"
                    description="Up to 10MB each. 16:9 ratio recommended for optimal display."
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1">
                <h2 className="text-lg font-normal">Pricing</h2>
                <p className="text-sm text-muted-foreground">
                  Set your billing cycle and model.
                </p>
              </div>

              <RHF.Controller
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label
                        htmlFor="one-time"
                        className="font-normal cursor-pointer"
                      >
                        One-time purchase
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recurring" id="recurring" />
                      <Label
                        htmlFor="recurring"
                        className="font-normal cursor-pointer"
                      >
                        Recurring subscription
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />

              {billingCycle === "recurring" && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm">Every</span>
                  <RHF.Controller
                    control={form.control}
                    name="recurringInterval"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        id={field.name}
                        value={field.value?.toString() as string}
                        onChange={(e) => field.onChange(e.toString())}
                        className="w-20 shadow-none"
                        label={null}
                        error={error?.message}
                      />
                    )}
                  />
                  <RHF.Controller
                    control={form.control}
                    name="recurringPeriod"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-32 shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Days</SelectItem>
                          <SelectItem value="week">Weeks</SelectItem>
                          <SelectItem value="month">Months</SelectItem>
                          <SelectItem value="year">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {/* Pricing Model */}
              <div className="space-y-2">
                <Label>Pricing Model</Label>
                <RHF.Controller
                  control={form.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full shadow-none">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed price</SelectItem>
                        <SelectItem value="tiered">Tiered pricing</SelectItem>
                        <SelectItem value="usage">Usage-based</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label>Price</Label>
                <RHF.Controller
                  control={form.control}
                  name="price"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <InputGroup
                        className={cn(
                          "shadow-none",
                          fieldState.error && "border-destructive"
                        )}
                      >
                        <InputGroupAddon>
                          <InputGroupText>$</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          value={field.value || ""}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                        />
                      </InputGroup>
                      {fieldState.error && (
                        <p className="text-xs text-destructive">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting
                  up...
                </>
              ) : (
                "Setup →"
              )}
            </Button>
          </div>

          <div className="flex justify-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/dashboard/${id}/configure`}
              className="hover:text-foreground"
            >
              Configure manually
            </Link>
            <span>·</span>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${id}`)}
              className="hover:text-foreground"
            >
              Skip onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
