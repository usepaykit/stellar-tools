"use client";

import * as React from "react";
import { useState } from "react";

import { postCustomers, putCustomer, retrieveCustomers } from "@/actions/customers";
import { CodeBlock } from "@/components/code-block";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { FileUpload, FileWithPreview } from "@/components/file-upload";
import { FullScreenModal } from "@/components/fullscreen-modal";
import {
  type PhoneNumber,
  PhoneNumberField,
  phoneNumberFromString,
  phoneNumberToString,
} from "@/components/phone-number-field";
import { SelectField } from "@/components/select-field";
import { TextField } from "@/components/text-field";
import { Timeline } from "@/components/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { Customer } from "@/db";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { cn, truncate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, CloudUpload, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import * as RHF from "react-hook-form";
import { z } from "zod";

function SortableHeader({
  column,
  label,
  ariaLabelPrefix,
}: {
  column: Column<Customer, unknown>;
  label: string;
  ariaLabelPrefix: string;
}) {
  const isSorted = column.getIsSorted();
  return (
    <Button
      className="hover:text-foreground focus-visible:ring-ring -mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      aria-label={`${ariaLabelPrefix} ${isSorted === "asc" ? "descending" : "ascending"}`}
    >
      <span>{label}</span>
      {isSorted === "asc" ? (
        <ArrowUp className="ml-1 h-4 w-4" aria-hidden />
      ) : isSorted === "desc" ? (
        <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" aria-hidden />
      )}
    </Button>
  );
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Customer" ariaLabelPrefix="Sort by name" />,
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <SortableHeader column={column} label="Email" ariaLabelPrefix="Sort by email" />,
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div className="text-muted-foreground">{row.original.phone}</div>,
  },
  {
    accessorKey: "walletAddress",
    header: ({ column }) => (
      <SortableHeader column={column} label="Wallet Address" ariaLabelPrefix="Sort by wallet address" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground font-mono text-sm">
        {truncate(row.original.walletAddresses?.[0]?.address ?? "-")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Created" ariaLabelPrefix="Sort by created date" />,
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
  const searchParams = useSearchParams();
  const [selectedFilter, setSelectedFilter] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(searchParams.get("mode") === "create");
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const router = useRouter();

  const { data: customers, isLoading: isLoadingCustomers } = useOrgQuery(["customers"], () => retrieveCustomers());

  const handleRowClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
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
                <div className="flex items-center gap-2">
                  <Button className="gap-2 shadow-none" variant="outline" onClick={() => setIsImportCsvOpen(true)}>
                    <CloudUpload className="h-4 w-4" />
                    Import CSV
                  </Button>
                  <Button className="gap-2 shadow-none" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add customer
                  </Button>
                </div>
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
              data={customers ?? []}
              enableBulkSelect={true}
              actions={tableActions}
              onRowClick={handleRowClick}
              isLoading={isLoadingCustomers}
            />
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>

      <CustomerModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      <ImportCsvModal open={isImportCsvOpen} onOpenChange={setIsImportCsvOpen} />
    </div>
  );
}

export function CustomerModal({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Partial<Customer> | null;
}) {
  const invalidate = useInvalidateOrgQuery();

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
      const phoneNumber = customer.phone ? phoneNumberFromString(customer.phone) : undefined;

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

  const putCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const phoneString = data.phoneNumber.number ? phoneNumberToString(data.phoneNumber) : "";

      const metadataRecord = (data.metadata || []).reduce(
        (acc, item) => {
          if (item.key) {
            acc[item.key] = item.value || "";
          }
          return acc;
        },
        {} as Record<string, string>
      );

      if (isEditMode) {
        return await putCustomer(customer!.id!, {
          name: data.name,
          email: data.email,
          phone: phoneString,
          metadata: metadataRecord,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const [result] = await postCustomers([
        {
          name: data.name,
          email: data.email,
          phone: phoneString,
          walletAddresses: null,
          metadata: metadataRecord,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      return result;
    },
    onSuccess: (customer) => {
      invalidate(isEditMode ? ["customers", customer?.id] : ["customers"]);
      invalidate(["customer-events", customer?.id]);

      toast.success(isEditMode ? "Customer updated successfully" : "Customer created successfully");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(isEditMode ? "Failed to update customer" : "Failed to create customer");
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !form.formState.isSubmitting) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: CustomerFormData) => {
    putCustomerMutation.mutate(data);
  };

  return (
    <FullScreenModal
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditMode ? "Edit customer" : "Create customer"}
      description={isEditMode ? "Update customer information" : "Add a new customer to your organization"}
      size="full"
      showCloseButton
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
            isLoading={putCustomerMutation.isPending}
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="gap-2 shadow-none"
            disabled={putCustomerMutation.isPending}
          >
            {isEditMode ? "Update customer" : "Create customer"}
          </Button>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col gap-8">
        <div className="flex flex-1 gap-8 overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Basic Information</h3>
              <p className="text-muted-foreground text-sm">Enter the customer’s basic contact information.</p>
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
              render={({ field, fieldState: { error } }) => {
                const phoneValue: PhoneNumber = {
                  number: field.value?.number || "",
                  countryCode: field.value?.countryCode || "US",
                };

                return (
                  <PhoneNumberField
                    id="phone"
                    value={phoneValue}
                    onChange={field.onChange}
                    label="Phone number"
                    error={(error as any)?.number?.message}
                    groupClassName="w-full shadow-none"
                  />
                );
              }}
            />
          </div>

          <Separator orientation="vertical" className="h-auto" />

          <div className="flex-1 space-y-6 overflow-y-auto">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Metadata</h3>
              <p className="text-muted-foreground text-sm">
                Add custom key-value pairs to store additional information about this customer.
              </p>
            </div>

            <Card className="shadow-none">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {fields.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      No metadata entries. Click &quot;Add metadata&quot; to add one.
                    </div>
                  ) : (
                    fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-3 rounded-lg border p-4">
                        <div className="grid flex-1 grid-cols-2 gap-3">
                          <RHF.Controller
                            control={form.control}
                            name={`metadata.${index}.key`}
                            render={({ field: fieldProps, fieldState: { error } }) => (
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
                            render={({ field: fieldProps, fieldState: { error } }) => (
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

type MappingTarget = "name" | "email" | "phone" | "metadata" | "none";

interface ColumnMapping {
  csvHeader: string;
  target: MappingTarget;
  metadataKey?: string;
}

const transformRow = (row: Record<string, string>, mappings: ColumnMapping[]) => {
  return mappings.reduce(
    (acc, m) => {
      const value = row[m.csvHeader]?.trim();
      if (!value || m.target === "none") return acc;
      if (m.target === "metadata") {
        acc.metadata[m.metadataKey || m.csvHeader] = value;
      } else {
        acc[m.target] = value;
      }
      return acc;
    },
    { metadata: {} } as Record<MappingTarget, any>
  );
};

export function ImportCsvModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [csvFile, setCsvFile] = React.useState<FileWithPreview | null>(null);
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mappings, setMappings] = React.useState<ColumnMapping[]>([]);
  const [viewMetadata, setViewMetadata] = React.useState<null | Record<string, unknown>>(null);

  const onUpload = React.useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    setCsvFile(file as FileWithPreview);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        const cols = r.meta.fields || [];
        setHeaders(cols);
        setRawRows(r.data as any[]);
        setMappings(
          cols.map((h) => ({
            csvHeader: h,
            target: h.toLowerCase().includes("email")
              ? "email"
              : h.toLowerCase().includes("name")
                ? "name"
                : "metadata",
            metadataKey: h,
          }))
        );
      },
    });
  }, []);

  const schemaLogic = React.useMemo(() => {
    return mappings.reduce((acc, m) => {
      if (m.target !== "none" && (m.target === "metadata" || m.target !== m.csvHeader)) {
        acc[m.csvHeader] = { from: "CSV", to: m.target === "metadata" ? `meta.${m.metadataKey}` : m.target };
      }
      return acc;
    }, {} as any);
  }, [mappings]);

  const previewData = React.useMemo(() => rawRows.map((row) => transformRow(row, mappings)), [rawRows, mappings]);

  const PREVIEW_COLS = React.useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Phone" },
      {
        accessorKey: "metadata",
        header: "Metadata",
        cell: ({ row }: any) => {
          const meta = row.original.metadata;
          if (!meta || !Object.keys(meta).length) return <span className="opacity-20">—</span>;
          return (
            <button
              onClick={() => setViewMetadata(meta)}
              className="bg-muted hover:bg-primary/5 hover:text-primary hover:border-primary/20 max-w-[150px] cursor-pointer truncate rounded border border-transparent px-2 py-1 font-mono text-[10px] transition-colors"
            >
              {JSON.stringify(meta)}
            </button>
          );
        },
      },
    ],
    []
  );

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const importCustomersMutation = useMutation({
    mutationFn: async () =>
      postCustomers(
        previewData.map((row) => ({
          name: row.name,
          email: row.email,
          phone: row.phone,
          metadata: row.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          walletAddresses: null,
        })),
        undefined,
        undefined,
        { source: "CSV Import" }
      ),
    onSuccess: () => {
      toast.success(`${previewData.length} customers imported successfully`);
      onOpenChange(false);
    },
  });

  return (
    <FullScreenModal
      open={open}
      onOpenChange={onOpenChange}
      title="Import Customers"
      description="Map CSV columns to system fields or shrink them into metadata."
      size="full"
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-muted-foreground/60 text-[10px] font-black tracking-widest uppercase">
            {rawRows.length} Rows Detected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!rawRows.length}
              isLoading={importCustomersMutation.isPending}
              onClick={() => importCustomersMutation.mutate()}
            >
              {importCustomersMutation.isPending ? "Importing..." : "Import Data"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid h-full grid-cols-1 gap-10 pb-10 lg:grid-cols-2">
        <div className="space-y-10">
          <CsvImportSection label="1. Data Source">
            <FileUpload
              value={csvFile ? [csvFile] : []}
              onFilesChange={onUpload}
              dropzoneMultiple={false}
              placeholder="Drag & drop a CSV here or click to select"
              dropzoneAccept={{ "text/csv": [".csv"] }}
            />
          </CsvImportSection>

          {headers.length > 0 && (
            <CsvImportSection label="2. Field Mapping">
              <div className="bg-card divide-border/50 divide-y overflow-hidden rounded-xl border shadow-xs">
                {mappings.map((m, i) => (
                  <div
                    key={m.csvHeader}
                    className="hover:bg-muted/10 flex items-center gap-6 px-5 py-3 transition-colors"
                  >
                    <span className="text-foreground/80 flex-1 truncate text-sm font-medium">{m.csvHeader}</span>
                    <ArrowRight className="text-muted-foreground/30 size-3" />
                    <div className="flex flex-2 items-center gap-3">
                      <SelectField
                        id={`mapping-target-${i}`}
                        value={m.target}
                        triggerClassName="w-40 h-9 bg-background shadow-none"
                        onChange={(val) => updateMapping(i, { target: val as any })}
                        items={[
                          { label: "Name", value: "name" },
                          { label: "Email", value: "email" },
                          { label: "Phone", value: "phone" },
                          { label: "Metadata", value: "metadata" },
                          { label: "Ignore", value: "none" },
                        ]}
                      />
                      {m.target === "metadata" ? (
                        <InputGroup className="bg-background h-9 w-44 shadow-none">
                          <InputGroupInput
                            value={m.metadataKey}
                            placeholder="Key..."
                            className="font-mono text-xs"
                            onChange={(e) => updateMapping(i, { metadataKey: e.target.value })}
                          />
                        </InputGroup>
                      ) : (
                        m.target !== "none" && (
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground/60 h-9 border-none px-4 text-[10px] font-bold tracking-tight uppercase"
                          >
                            System Field
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CsvImportSection>
          )}
        </div>

        <div className="space-y-10">
          <CsvImportSection label="3. System Preview">
            <div className="bg-background overflow-hidden rounded-xl border shadow-xs">
              <ScrollArea className="h-[280px] w-full">
                <div className="**:table:min-w-full!">
                  <DataTable
                    columns={PREVIEW_COLS}
                    data={previewData}
                    isLoading={false}
                    className="border-0 shadow-none"
                  />
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </CsvImportSection>

          <CsvImportSection label="4. Logic Validation">
            <div className="bg-muted/10 min-h-[160px] rounded-xl border p-6">
              <Timeline
                items={Object.keys(schemaLogic).length ? [1] : []}
                renderItem={() => ({ title: "Schema Transformation", date: "Rules", data: { $changes: schemaLogic } })}
                emptyMessage="Mappings are 1:1. No transformations needed."
              />
            </div>
          </CsvImportSection>
        </div>
      </div>

      <Dialog open={!!viewMetadata} onOpenChange={() => setViewMetadata(null)} modal>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Metadata Preview</DialogTitle>
            <DialogDescription>Raw object mapping for the selected row.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 mt-4 overflow-hidden">
            <CodeBlock language="json" showCopyButton>
              {JSON.stringify(viewMetadata, null, 2)}
            </CodeBlock>
          </div>
        </DialogContent>
      </Dialog>
    </FullScreenModal>
  );
}

function CsvImportSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">{label}</h4>
      {children}
    </section>
  );
}
