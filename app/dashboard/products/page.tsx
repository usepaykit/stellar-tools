"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Archive,
  Download,
  Package,
  Plus,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";

import * as React from "react";

import {
  FileUploadPicker,
  type FileWithPreview,
} from "@/components/file-upload-picker";
import { TextAreaField, TextField } from "@/components/input-picker";
import { PricePicker } from "@/components/price-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
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


type Product = {
  id: string;
  name: string;
  pricing: {
    amount: string;
    asset: string;
    isRecurring?: boolean;
    period?: string;
  };
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

const mockProducts: Product[] = [
  {
    id: "1",
    name: "35",
    pricing: { amount: "35.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-12-11"),
    updatedAt: new Date("2024-12-11"),
  },
  {
    id: "2",
    name: "Mailboxes",
    pricing: { amount: "160.00", asset: "USD", isRecurring: true, period: "month" },
    status: "active",
    createdAt: new Date("2024-11-21"),
    updatedAt: new Date("2024-11-21"),
  },
  {
    id: "3",
    name: "Domains",
    pricing: { amount: "95.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-19"),
    updatedAt: new Date("2024-11-19"),
  },
  {
    id: "4",
    name: "Mailboxes-Harry",
    pricing: { amount: "361.40", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-17"),
    updatedAt: new Date("2024-11-17"),
  },
  {
    id: "5",
    name: "21",
    pricing: { amount: "21.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-10"),
    updatedAt: new Date("2024-11-10"),
  },
  {
    id: "6",
    name: "domains",
    pricing: { amount: "68.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-07"),
    updatedAt: new Date("2024-11-07"),
  },
  {
    id: "7",
    name: "Umar Payment",
    pricing: { amount: "500.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-06"),
    updatedAt: new Date("2024-11-06"),
  },
  {
    id: "8",
    name: "50",
    pricing: { amount: "50.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-04"),
    updatedAt: new Date("2024-11-04"),
  },
  {
    id: "9",
    name: "40 domains",
    pricing: { amount: "40.00", asset: "USD" },
    status: "active",
    createdAt: new Date("2024-11-03"),
    updatedAt: new Date("2024-11-03"),
  },
];

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


// Column definitions
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by name ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Name</span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3 py-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-medium text-foreground">{row.original.name}</div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "pricing",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by pricing ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Pricing</span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const pricing = row.original.pricing;
      return (
        <div className="flex flex-col gap-1 py-1">
          <div className="font-semibold text-foreground">
            ${pricing.amount} {pricing.asset}
          </div>
          {pricing.isRecurring && pricing.period && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span className="font-medium">Per {pricing.period}</span>
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = parseFloat(rowA.original.pricing.amount);
      const b = parseFloat(rowB.original.pricing.amount);
      return a - b;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by created date ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Created</span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="text-muted-foreground py-1 font-medium">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by updated date ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Updated</span>
          {isSorted === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.updatedAt;
      return (
        <div className="text-muted-foreground py-1 font-medium">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      );
    },
    enableSorting: true,
  },
];

export default function ProductPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>("Created");
  
  const activeParam = searchParams.get("active");
  const [isModalOpen, setIsModalOpen] = useState(activeParam === "true");

  useEffect(() => {
    if (activeParam === "true") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("active");
      const newUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeProducts = mockProducts.filter((p) => p.status === "active");
  const archivedProducts = mockProducts.filter((p) => p.status === "archived");

  const filteredProducts = selectedStatus
    ? mockProducts.filter((p) => p.status === selectedStatus)
    : mockProducts;

  const tableActions: TableAction<Product>[] = [
    {
      label: "Edit",
      onClick: (product) => {
        console.log("Edit product:", product);
      },
    },
    {
      label: "Duplicate",
      onClick: (product) => {
        console.log("Duplicate product:", product);
      },
    },
    {
      label: "Archive",
      onClick: (product) => {
        console.log("Archive product:", product);
      },
      variant: "destructive",
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Product catalog</h1>
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    Manage and organize your product offerings
                  </p>
                </div>
                <Button className="gap-2 shadow-sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create product
                </Button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">All</p>
                        <p className="text-3xl font-bold tracking-tight">{mockProducts.length}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                        <p className="text-3xl font-bold tracking-tight">
                          {activeProducts.length}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Archived</p>
                        <p className="text-3xl font-bold tracking-tight">
                          {archivedProducts.length}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                        <Archive className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Actions */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedDate && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/80"
                    >
                      {selectedDate}
                      <Plus className="h-3 w-3" />
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-secondary transition-colors"
                        aria-label="Remove date filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedStatus && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/80"
                    >
                      Status
                      <button
                        onClick={() => setSelectedStatus(null)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-secondary transition-colors"
                        aria-label="Remove status filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="ml-1 capitalize">{selectedStatus}</span>
                    </Badge>
                  )}
                  {(selectedDate || selectedStatus) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(null);
                        setSelectedStatus(null);
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50 hover:bg-accent shadow-none"
                  >
                    <Download className="h-4 w-4" />
                    Export prices
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50 hover:bg-accent shadow-none"
                  >
                    <Download className="h-4 w-4" />
                    Export products
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-border/50 hover:bg-accent shadow-none"
                  >
                    <Settings className="h-4 w-4" />
                    Edit columns
                  </Button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-lg border border-border/50">
              <DataTable
                columns={columns}
                data={filteredProducts}
                enableBulkSelect={true}
                actions={tableActions}
                rowClassName="hover:bg-muted/30 transition-colors border-b border-border/30"
                cellClassName="py-4"
                headClassName="font-semibold"
              />
            </div>
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      {/* Products Modal */}
      <ProductsModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          // Clean up query parameter when modal closes
          if (!open) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("active");
            const newUrl = params.toString() 
              ? `${window.location.pathname}?${params.toString()}`
              : window.location.pathname;
            router.replace(newUrl);
          }
        }}
        onSubmit={async (data) => {
          console.log("Product created:", data);
          // Add your API call here
        }}
      />
    </div>
  );
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
