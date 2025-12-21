"use client";

import * as React from "react";

import {
  FileUploadPicker,
  type FileWithPreview,
} from "@/components/file-upload-picker";
import { TextAreaField, TextField } from "@/components/input-picker";
import { PricePicker } from "@/components/price-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as RHF from "react-hook-form";
import { z } from "zod";
import Image from "next/image";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  images: z.array(z.any()).transform((val) => val as FileWithPreview[]),
  billingCycle: z.enum(["one-time", "recurring"]),
  recurringInterval: z.number().min(1).optional(),
  recurringPeriod: z.enum(["day", "week", "month", "year"]).optional(),
  pricingModel: z.enum(["fixed", "tiered", "usage"]),
  price: z.object({
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Price must be greater than 0"
      ),
    asset: z.string().min(1, "Asset is required"),
  }),
  phoneNumberEnabled: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ProductFormData) => Promise<void> | void;
}

export function ProductsModal({
  open,
  onOpenChange,
  onSubmit,
}: ProductsModalProps) {
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
      price: {
        amount: "",
        asset: "XLM",
      },
      phoneNumberEnabled: false,
    },
  });

  const billingCycle = form.watch("billingCycle");
  const [unitQuantity, setUnitQuantity] = React.useState(1);

  // Watch all form fields for real-time preview
  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");
  const watchedImages = form.watch("images");
  const watchedPrice = form.watch("price");
  const watchedRecurringPeriod = form.watch("recurringPeriod");
  const watchedPhoneNumberEnabled = form.watch("phoneNumberEnabled");

  // Calculate total
  const unitPrice = parseFloat(watchedPrice?.amount || "0") || 0;
  const total = unitPrice * unitQuantity;

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        console.log("Product data:", data);
        toast.success("Product created successfully!");
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={form.handleSubmit(handleSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Add product"
        )}
      </Button>
    </div>
  );

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a product"
      footer={footer}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <RHF.Controller
              control={form.control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Name of the product or service, visible to customers.
                    </p>
                  </div>
                  <TextField
                    {...field}
                    id="name"
                    value={field.value}
                    label={null}
                    placeholder="Enter product name"
                    error={error?.message}
                    className="shadow-none"
                  />
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <RHF.Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Appears at checkout, on the customer portal, and in quotes.
                    </p>
                  </div>
                  <TextAreaField
                    {...field}
                    id="description"
                    value={field.value || ""}
                    label={null}
                    placeholder="Enter product description"
                    error={fieldState.error?.message}
                    className="min-h-[100px] shadow-none"
                  />
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <div>
              <Label className="text-sm font-medium">Image</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Appears at checkout. JPEG, PNG, or WEBP under 2MB.
              </p>
            </div>
            <RHF.Controller
              control={form.control}
              name="images"
              render={({ field }) => (
                <FileUploadPicker
                  value={field.value}
                  onFilesChange={field.onChange}
                  dropzoneMaxSize={2 * 1024 * 1024}
                  dropzoneMultiple={false}
                  dropzoneAccept={{ "image/*": [] }}
                  className="shadow-none"
                  description="Upload product image"
                />
              )}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Pricing</Label>
              <RHF.Controller
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recurring" id="recurring" />
                      <Label
                        htmlFor="recurring"
                        className="cursor-pointer font-normal"
                      >
                        Recurring
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label
                        htmlFor="one-time"
                        className="cursor-pointer font-normal"
                      >
                        One-off
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            <div className="space-y-2">
              <RHF.Controller
                control={form.control}
                name="price"
                render={({ field }) => {
                  const priceError = form.formState.errors.price;
                  const errorMessage =
                    priceError?.amount?.message ||
                    priceError?.asset?.message ||
                    priceError?.message;

                  return (
                    <div className="space-y-2">
                      
                      <PricePicker
                        id="price"
                        value={field.value}
                        onChange={field.onChange}
                        assets={["XLM", "USDC"]}
                        isLoading={isSubmitting}
                        error={errorMessage}
                        disabled={isSubmitting}
                        placeholder="0.00"
                         label={"Amount"}
                        className="shadow-none!"
                      />
                    </div>
                  );
                }}
              />
            </div>
            {billingCycle === "recurring" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Billing period</Label>
                <RHF.Controller
                  control={form.control}
                  name="recurringPeriod"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full shadow-none">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-between space-x-2 pt-2 border-t border-border">
              <div className="space-y-0.5">
                <Label htmlFor="phone-number-enabled" className="cursor-pointer">
                  Require phone number
                </Label>
                <p className="text-muted-foreground text-xs">
                  Customers must provide a phone number to purchase
                </p>
              </div>
              <RHF.Controller
                control={form.control}
                name="phoneNumberEnabled"
                render={({ field }) => (
                  <Switch
                    id="phone-number-enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <Card className="sticky top-6 shadow-none bg-muted/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Preview</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimate totals based on pricing model, unit quantity, and tax.
                    </p>
                  </div>
                </div>

                {/* Product Preview */}
                {(watchedName || watchedImages?.[0]) && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    {watchedImages?.[0] && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                        <Image
                          src={watchedImages[0].preview || URL.createObjectURL(watchedImages[0])}
                          alt={watchedName || "Product"}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {watchedName && (
                      <div>
                        <h4 className="font-semibold text-base">{watchedName}</h4>
                        {watchedDescription && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {watchedDescription}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Pricing Preview */}
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Unit quantity</Label>
                    <input
                      type="number"
                      min="1"
                      value={unitQuantity}
                      onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 1)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {unitQuantity} × {watchedPrice?.amount || "0.00"}{" "}
                        {watchedPrice?.asset || "XLM"}
                      </span>
                      <span className="font-medium">
                        {total.toFixed(2)} {watchedPrice?.asset || "XLM"}
                      </span>
                    </div>
                    {billingCycle === "recurring" && (
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <div>
                          <p className="text-sm font-medium">
                            Total per{" "}
                            {watchedRecurringPeriod === "month"
                              ? "month"
                              : watchedRecurringPeriod === "year"
                                ? "year"
                                : watchedRecurringPeriod === "week"
                                  ? "week"
                                  : watchedRecurringPeriod === "day"
                                    ? "day"
                                    : "period"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Billed at the start of the period
                          </p>
                        </div>
                        <span className="text-lg font-semibold">
                          {total.toFixed(2)} {watchedPrice?.asset || "XLM"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone Number Requirement */}
                {watchedPhoneNumberEnabled && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Phone number required
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Customers must provide a phone number to complete purchase
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FullScreenModal>
  );
}

