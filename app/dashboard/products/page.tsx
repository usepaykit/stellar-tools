"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import {
  FileUploadPicker,
  type FileWithPreview,
} from "@/components/file-upload-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
import {
  NumberPicker,
  TextAreaField,
  TextField,
} from "@/components/input-picker";
import { MarkdownPicker } from "@/components/markdown-picker";
import { PricePicker } from "@/components/price-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Column, ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  HelpCircle,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

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

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  images: z.array(z.any()).transform((val) => val as FileWithPreview[]),
  billingCycle: z.enum(["one-time", "recurring", "metered"]),
  recurringInterval: z.number().min(1).optional(),
  recurringPeriod: z.enum(["day", "week", "month", "year"]).optional(),
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

  unit: z.string().optional(),
  unitsPerCredit: z.number().min(1).default(1).optional(),
  unitDivisor: z.number().min(1).optional(),
  creditsGranted: z.number().min(0).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

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
    pricing: {
      amount: "160.00",
      asset: "USD",
      isRecurring: true,
      period: "month",
    },
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
];

const SortableHeader = ({
  column,
  title,
}: {
  column: Column<Product, unknown>;
  title: string;
}) => {
  const isSorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      className="hover:text-foreground -mx-2 h-8 gap-2 font-semibold"
      onClick={() => column.toggleSorting(isSorted === "asc")}
    >
      {title}
      {isSorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </Button>
  );
};

const StatCard = ({
  label,
  count,
  icon: Icon,
  active,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  active?: boolean;
}) => (
  <Card className="shadow-none">
    <CardContent className="flex items-center justify-between p-5">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{count}</p>
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${active ? "bg-primary/10" : "bg-muted/50"}`}
      >
        <Icon
          className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
    </CardContent>
  </Card>
);

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3 py-1">
        <div className="bg-muted/50 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
          <Package className="text-muted-foreground h-4 w-4" />
        </div>
        <div className="font-medium">{row.original.name}</div>
      </div>
    ),
  },
  {
    accessorKey: "pricing",
    header: ({ column }) => <SortableHeader column={column} title="Pricing" />,
    cell: ({ row }) => {
      const p = row.original.pricing;
      return (
        <div className="flex flex-col py-1">
          <div className="font-semibold">
            ${p.amount} {p.asset}
          </div>
          {p.isRecurring && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <RefreshCw className="h-3 w-3" /> <span>Per {p.period}</span>
            </div>
          )}
        </div>
      );
    },
    sortingFn: (rowA, rowB) =>
      parseFloat(rowA.original.pricing.amount) -
      parseFloat(rowB.original.pricing.amount),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title="Created" />,
    cell: ({ row }) => (
      <div className="text-muted-foreground font-medium">
        {row.original.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </div>
    ),
  },
];

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = React.useState(
    searchParams.get("active") === "true"
  );
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(
    null
  );

  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(
    null
  );

  const stats = React.useMemo(
    () => ({
      all: mockProducts.length,
      active: mockProducts.filter((p) => p.status === "active").length,
      archived: mockProducts.filter((p) => p.status === "archived").length,
    }),
    []
  );

  const handleModalChange = React.useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set("active", "true");
        router.replace(
          `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
        );
      } else {
        params.delete("active");
        router.replace(
          `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
        );
        setEditingProduct(null);
      }
      setIsModalOpen(value);
    },
    [searchParams, router]
  );

  const tableActions: TableAction<Product>[] = [
    {
      label: "Edit",
      onClick: (p) => {
        setEditingProduct(p);
        handleModalChange(true);
      },
    },
    {
      label: "Archive",
      onClick: (p) => console.log("Archive", p),
      variant: "destructive",
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-8 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Product catalog
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Manage and organize your product offerings
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  handleModalChange(true);
                }}
                className="gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Create product
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard label="All" count={stats.all} icon={Package} />
              <StatCard
                label="Active"
                count={stats.active}
                icon={Package}
                active
              />
              <StatCard
                label="Archived"
                count={stats.archived}
                icon={Archive}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {selectedStatus && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                    Status: <span className="capitalize">{selectedStatus}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedStatus(null)}
                    />
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" /> Columns
                </Button>
              </div>
            </div>

            <div className="border-border/50 overflow-hidden rounded-lg border">
              <DataTable
                columns={columns}
                data={mockProducts}
                actions={tableActions}
                enableBulkSelect
              />
            </div>

            <ProductsModal
              open={isModalOpen}
              onOpenChange={handleModalChange}
              editingProduct={editingProduct}
            />
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}

// --- Main Page Component ---

export default function ProductsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ProductsPageContent />
    </React.Suspense>
  );
}

// --- Modal Component ---

function ProductsModal({
  open,
  onOpenChange,
  editingProduct,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  editingProduct?: Product | null;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLearnMoreOpen, setIsLearnMoreOpen] = React.useState(false);
  const isEditMode = !!editingProduct;

  const form = RHF.useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      billingCycle: "recurring",
      recurringPeriod: "month",
      price: { amount: "", asset: "XLM" },
      phoneNumberEnabled: false,
      unitDivisor: 1,
      unitsPerCredit: 1,
      creditsGranted: 0,
    },
  });

  // Reset form when modal opens/closes or editingProduct changes
  React.useEffect(() => {
    if (open && editingProduct) {
      // Pre-populate form with product data
      form.reset({
        name: editingProduct.name,
        description: "",
        images: [],
        billingCycle: editingProduct.pricing.isRecurring
          ? "recurring"
          : "one-time",
        recurringPeriod:
          (editingProduct.pricing.period as
            | "day"
            | "week"
            | "month"
            | "year") || "month",
        price: {
          amount: editingProduct.pricing.amount,
          asset: editingProduct.pricing.asset,
        },
        phoneNumberEnabled: false,
      });
    } else if (open && !editingProduct) {
      // Reset to defaults for create mode
      form.reset({
        name: "",
        description: "",
        images: [],
        billingCycle: "recurring",
        recurringPeriod: "month",
        price: { amount: "", asset: "XLM" },
        phoneNumberEnabled: false,
      });
    }
  }, [open, editingProduct, form]);

  const watched = form.watch();
  const total = parseFloat(watched.price?.amount) || 0;

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    console.log({ data, isEditMode, editingProduct });
    await new Promise((r) => setTimeout(r, 1000)); // Simulate API
    toast.success(
      isEditMode ? "Product updated successfully!" : "Product created!"
    );
    form.reset();
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <FullScreenModal
        open={open}
        onOpenChange={onOpenChange}
        title={isEditMode ? "Edit product" : "Add a product"}
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              {isEditMode ? "Update product" : "Add product"}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <RHF.Controller
              control={form.control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  id="name"
                  label="Name"
                  error={error?.message}
                  placeholder="e.g. Premium Subscription"
                  className="shadow-none"
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
                  placeholder="Describe your product..."
                  className="shadow-none"
                />
              )}
            />

            <RHF.Controller
              control={form.control}
              name="images"
              render={({ field }) => (
                <FileUploadPicker
                  value={field.value}
                  onFilesChange={field.onChange}
                  dropzoneMultiple={false}
                  dropzoneAccept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
                  }}
                />
              )}
            />

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Pricing Model</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1.5 px-2 py-1 text-xs"
                  onClick={() => setIsLearnMoreOpen(true)}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Learn about metered billing
                </Button>
              </div>
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
                      <Label htmlFor="recurring" className="font-normal">
                        Recurring
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label htmlFor="one-time" className="font-normal">
                        One-off
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="metered" id="metered" />
                      <Label htmlFor="metered" className="font-normal">
                        Metered (Credits)
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />

              {watched.billingCycle === "metered" && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      Credit Configuration
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      Define how usage is measured and converted to credits
                    </p>
                  </div>

                  <RHF.Controller
                    control={form.control}
                    name="unit"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value || ""}
                        id="unit"
                        label="Unit Label"
                        placeholder="e.g., tokens, MB, requests, minutes"
                        helpText="Display name for your unit (can be anything)"
                        error={error?.message}
                      />
                    )}
                  />

                  <RHF.Controller
                    control={form.control}
                    name="unitDivisor"
                    render={({ field, fieldState: { error } }) => (
                      <NumberPicker
                        {...field}
                        value={field.value || 1}
                        id="unitDivisor"
                        label="Unit Divisor"
                        helpText="Converts raw data (e.g., bytes) to your unit"
                        error={error?.message}
                      />
                    )}
                  />

                  <RHF.Controller
                    control={form.control}
                    name="unitsPerCredit"
                    render={({ field, fieldState: { error } }) => (
                      <NumberPicker
                        {...field}
                        value={field.value || 1}
                        id="unitsPerCredit"
                        label="Units per Credit"
                        helpText="How many units equal 1 credit?"
                        error={error?.message}
                      />
                    )}
                  />

                  <RHF.Controller
                    control={form.control}
                    name="creditsGranted"
                    render={({ field, fieldState: { error } }) => (
                      <NumberPicker
                        {...field}
                        value={field.value || 0}
                        id="creditsGranted"
                        label="Credits Granted"
                        placeholder="e.g., 1000"
                        helpText="Initial credits included with this product"
                        error={error?.message}
                      />
                    )}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <RHF.Controller
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <PricePicker
                      id="price"
                      className="flex-1"
                      value={field.value}
                      onChange={field.onChange}
                      assets={["XLM", "USDC"]}
                      error={form.formState.errors.price?.amount?.message}
                    />
                  )}
                />

                {watched.billingCycle == "recurring" && (
                  <RHF.Controller
                    control={form.control}
                    name="recurringPeriod"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="mt-2.5 h-12 w-[150px]">
                          <SelectValue />
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
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <RHF.Controller
                control={form.control}
                name="phoneNumberEnabled"
                render={({ field }) => (
                  <div className="flex w-full items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="phoneNumberEnabled"
                        className="flex flex-col items-start gap-1"
                      >
                        Require phone number
                        <p className="text-muted-foreground text-xs">
                          Customers must provide a phone number
                        </p>
                      </Label>
                    </div>

                    <Switch
                      id="phoneNumberEnabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <Card className="bg-muted/30 sticky top-6 shadow-none">
              <CardContent className="space-y-6 p-6">
                <h3 className="text-lg font-semibold">Preview</h3>

                {watched.images?.[0] && (
                  <div className="relative aspect-video overflow-hidden rounded-lg border">
                    <Image
                      src={
                        watched.images[0].preview ||
                        URL.createObjectURL(watched.images[0])
                      }
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-base font-bold">
                    {watched.name || "Product Name"}
                  </h4>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {watched.description || "No description provided."}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Total Price
                    </span>
                    <span className="font-bold">
                      {total.toFixed(2)} {watched.price.asset}
                    </span>
                  </div>
                  {watched.billingCycle === "recurring" && (
                    <p className="text-muted-foreground mt-1 text-right text-xs">
                      Billed every {watched.recurringPeriod}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FullScreenModal>

      <FullScreenModal
        open={isLearnMoreOpen}
        onOpenChange={setIsLearnMoreOpen}
        title="Understanding Metered Billing"
        size="full"
        footer={
          <Button onClick={() => setIsLearnMoreOpen(false)}>Got it</Button>
        }
      >
        <MarkdownPicker
          content={
            /* html */ `
## What is metered billing?

Metered billing charges customers based on their actual usage. Think pay-as-you-go: upload storage, API calls, AI tokens, processing time, anything measurable.

---

## Unit Label

A human-friendly name for what you're measuring. This can be anything: "tokens", "megabytes", "API calls", "minutes", "images", whatever makes sense for your service.

**Example:** "MB" for file storage, "tokens" for AI usage

---

## Unit Divisor

Converts raw measurements into your chosen unit. For example, if you're measuring file storage and raw data comes in bytes, set this to 1,048,576 to convert bytes to megabytes.

**Common divisors:**
- File count: 1 (or leave as default)
- Kilobytes: 1,024
- Megabytes: 1,048,576
- Gigabytes: 1,073,741,824

---

## Units per Credit

How many units equal one credit. If you set this to 10, then every 10 units costs 1 credit.

**Example:** Set to 5 means uploading 50MB costs 10 credits (50 / 5)

---

## Credits Granted

The number of credits customers get when they purchase this product. They'll spend these credits as they use your service.

**Example:** Grant 1,000 credits = 5,000 units if unitsPerCredit is 5
`
          }
        />
      </FullScreenModal>
    </>
  );
}
