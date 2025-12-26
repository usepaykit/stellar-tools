"use client";

import * as React from "react";
import { useState } from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FullScreenModal } from "@/components/fullscreen-modal";
import { TextField } from "@/components/input-picker";
import {
  PhoneNumberPicker,
  phoneNumberToString,
} from "@/components/phone-number-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { truncate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as RHF from "react-hook-form";
import { z } from "zod";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletAddress: string;
  createdAt: Date;
};

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Manan Trivedi",
    email: "manan@bricxlabs.com",
    phone: "+1 234-567-8900",
    walletAddress: "GABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234567890",
    createdAt: new Date("2024-12-18T14:56:00"),
  },
  {
    id: "2",
    name: "Kevin Isaac",
    email: "aravind@zephony.com",
    phone: "+1 234-567-8901",
    walletAddress: "GZYXWVUTSRQPONMLKJIHGFEDCBA98765432109876543210",
    createdAt: new Date("2024-12-18T12:46:00"),
  },
  {
    id: "3",
    name: "Dilara Cossette",
    email: "dilara@fip.agency",
    phone: "+1 234-567-8902",
    walletAddress: "G1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    createdAt: new Date("2024-12-18T08:04:00"),
  },
  {
    id: "4",
    name: "Rhys McCormack",
    email: "rhysmccormack.business@gmail.com",
    phone: "+1 234-567-8903",
    walletAddress: "G9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210",
    createdAt: new Date("2024-12-18T06:48:00"),
  },
  {
    id: "5",
    name: "Sebastian Galvez",
    email: "Alejandro@leadrsglobal.com",
    phone: "+1 234-567-8904",
    walletAddress: "GABCD1234567890EFGHIJKLMNOPQRSTUVWXYZ1234567890",
    createdAt: new Date("2024-12-18T05:25:00"),
  },
];

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          variant={"ghost"}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label={`Sort by name ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Customer</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown
              className="ml-1 h-4 w-4 opacity-50"
              aria-hidden="true"
            />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant={"ghost"}
          aria-label={`Sort by email ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Email</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown
              className="ml-1 h-4 w-4 opacity-50"
              aria-hidden="true"
            />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.email}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.phone}</div>
    ),
  },
  {
    accessorKey: "walletAddress",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant={"ghost"}
          aria-label={`Sort by wallet address ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Wallet Address</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown
              className="ml-1 h-4 w-4 opacity-50"
              aria-hidden="true"
            />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-muted-foreground font-mono text-sm">
        {truncate(row.original.walletAddress)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
          aria-label={`Sort by created date ${isSorted === "asc" ? "descending" : "ascending"}`}
        >
          <span>Created</span>
          {isSorted === "asc" ? (
            <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-1 h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpDown
              className="ml-1 h-4 w-4 opacity-50"
              aria-hidden="true"
            />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="text-muted-foreground">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          {date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
      );
    },
    enableSorting: true,
  },
];

const filterMap: Record<number, string> = {
  0: "All",
  1: "First-time customers",
  2: "Recent customers",
};

const filterOptions = [0, 1, 2];

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email(),
  phoneNumber: z.object({
    number: z.string(),
    countryCode: z.string().min(1, "Country code is required"),
  }),
  metadata: z
    .array(
      z.object({
        key: z.string().min(1, "Key is required"),
        value: z.string(),
      })
    )
    .default([])
    .optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [selectedFilter, setSelectedFilter] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const handleRowClick = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}`);
  };

  const tableActions: TableAction<Customer>[] = [
    {
      label: "Create invoice",
      onClick: (customer) => {
        console.log("Create invoice for:", customer);
      },
    },
    {
      label: "Create subscription",
      onClick: (customer) => {
        console.log("Create subscription for:", customer);
      },
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Customers</h1>
                <Button
                  className="gap-2 shadow-none"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add customer
                </Button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {filterOptions.map((filterIndex) => (
                  <Button
                    key={filterIndex}
                    onClick={() => setSelectedFilter(filterIndex)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                      selectedFilter === filterIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {filterMap[filterIndex]}
                  </Button>
                ))}
              </div>
            </div>

            <DataTable
              columns={columns}
              data={mockCustomers}
              enableBulkSelect={true}
              actions={tableActions}
              onRowClick={handleRowClick}
            />
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      <CustomerModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}

type CustomerForModal = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, string>;
};

export function CustomerModal({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerForModal | null;
}) {
  const isEditMode = !!customer;
  const form = RHF.useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: { number: "", countryCode: "US" },
      metadata: [],
    },
  });

  const { fields, append, remove } = RHF.useFieldArray({
    control: form.control,
    name: "metadata",
  });

  React.useEffect(() => {
    if (open && customer) {
      let phoneNumber = { number: "", countryCode: "US" };
      if (customer.phone) {
        const phoneMatch = customer.phone.match(/\+?(\d+)\s*(.+)/);
        if (phoneMatch) {
          phoneNumber = {
            countryCode: phoneMatch[1] === "1" ? "US" : phoneMatch[1],
            number: phoneMatch[2].replace(/\D/g, ""),
          };
        }
      }

      const metadataArray = customer.metadata
        ? Object.entries(customer.metadata).map(([key, value]) => ({
            key,
            value: value || "",
          }))
        : [];

      form.reset({
        name: customer.name || "",
        email: customer.email || "",
        phoneNumber,
        metadata: metadataArray,
      });
    } else if (open && !customer) {
      form.reset({
        name: "",
        email: "",
        phoneNumber: { number: "", countryCode: "US" },
        metadata: [],
      });
    }
  }, [open, customer, form]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const phoneString = data.phoneNumber.number
        ? phoneNumberToString(data.phoneNumber)
        : "";

      const metadataRecord = (data.metadata || []).reduce(
        (acc, item) => {
          if (item.key) {
            acc[item.key] = item.value || "";
          }
          return acc;
        },
        {} as Record<string, string>
      );

      console.log("Creating customer:", {
        name: data.name,
        email: data.email || undefined,
        phone: phoneString || undefined,
        metadata: metadataRecord,
      });

      toast.success(
        isEditMode
          ? "Customer updated successfully"
          : "Customer created successfully",
        {
          description: isEditMode
            ? `${data.name} has been updated.`
            : `${data.name} has been added to your customers.`,
        } as Parameters<typeof toast.success>[1]
      );

      form.reset();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error("Failed to create customer", {
        description: errorMessage,
      } as Parameters<typeof toast.error>[1]);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !form.formState.isSubmitting) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditMode ? "Edit customer" : "Create customer"}
      description={
        isEditMode
          ? "Update customer information"
          : "Add a new customer to your organization"
      }
      size="full"
      showCloseButton={true}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="shadow-none"
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="shadow-none"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update customer"
                : "Create customer"}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col gap-8"
      >
        <div className="flex flex-1 gap-8 overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Basic Information</h3>
              <p className="text-muted-foreground text-sm">
                Enter the customer&apos;s basic contact information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <RHF.Controller
                control={form.control}
                name="name"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    id="name"
                    value={field.value}
                    onChange={field.onChange}
                    label="Name"
                    error={error?.message || null}
                    placeholder="John Doe"
                    className="w-full shadow-none"
                    required
                  />
                )}
              />

              <RHF.Controller
                control={form.control}
                name="email"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    id="email"
                    type="email"
                    value={field.value || ""}
                    onChange={field.onChange}
                    label="Email"
                    error={error?.message || null}
                    placeholder="john@example.com"
                    className="w-full shadow-none"
                  />
                )}
              />
            </div>

            <RHF.Controller
              control={form.control}
              name="phoneNumber"
              render={({ field, fieldState: { error } }) => (
                <PhoneNumberPicker
                  id="phone"
                  value={field.value}
                  onChange={field.onChange}
                  label="Phone number"
                  error={error?.message || null}
                  groupClassName="w-full shadow-none"
                />
              )}
            />
          </div>

          <Separator orientation="vertical" className="h-auto" />

          <div className="flex-1 space-y-6 overflow-y-auto">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Metadata</h3>
              <p className="text-muted-foreground text-sm">
                Add custom key-value pairs to store additional information about
                this customer.
              </p>
            </div>

            <Card className="shadow-none">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {fields.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      No metadata entries. Click &quot;Add metadata&quot; to add
                      one.
                    </div>
                  ) : (
                    fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <div className="grid flex-1 grid-cols-2 gap-3">
                          <RHF.Controller
                            control={form.control}
                            name={`metadata.${index}.key`}
                            render={({
                              field: fieldProps,
                              fieldState: { error },
                            }) => (
                              <TextField
                                id={`metadata-key-${index}`}
                                value={fieldProps.value || ""}
                                onChange={fieldProps.onChange}
                                label="Key"
                                error={error?.message || null}
                                placeholder="e.g., company"
                                className="w-full shadow-none"
                              />
                            )}
                          />
                          <RHF.Controller
                            control={form.control}
                            name={`metadata.${index}.value`}
                            render={({
                              field: fieldProps,
                              fieldState: { error },
                            }) => (
                              <TextField
                                id={`metadata-value-${index}`}
                                value={fieldProps.value || ""}
                                onChange={fieldProps.onChange}
                                label="Value"
                                error={error?.message || null}
                                placeholder="e.g., Acme Inc"
                                className="w-full shadow-none"
                              />
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mt-5 shrink-0 shadow-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ key: "", value: "" })}
                    className="w-full shadow-none"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add metadata
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
}
