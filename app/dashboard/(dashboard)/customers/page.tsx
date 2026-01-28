"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { Column, ColumnDef } from "@tanstack/react-table";
import * as RHF from "react-hook-form";
import { z } from "zod";
// @ts-expect-error - papaparse has no types in this workspace
import Papa from "papaparse";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, CloudUpload, Plus, Trash2, X } from "lucide-react";

import { postCustomers, putCustomer, retrieveCustomers } from "@/actions/customers";
import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import type { FileWithPreview } from "@/components/file-upload-picker";
import { FileUploadPicker } from "@/components/file-upload-picker";
import { FullScreenModal } from "@/components/fullscreen-modal";
import {
  PhoneNumber,
  PhoneNumberPicker,
  phoneNumberFromString,
  phoneNumberToString,
} from "@/components/phone-number-picker";
import { SelectPicker } from "@/components/select-picker";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { Customer } from "@/db";
import { useInvalidateOrgQuery, useOrgQuery } from "@/hooks/use-org-query";
import { cn, truncate } from "@/lib/utils";

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
      className="-mx-1 flex items-center gap-2 rounded-sm px-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    header: ({ column }) => (
      <SortableHeader column={column} label="Created" ariaLabelPrefix="Sort by created date" />
    ),
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
                  <Button
                  className="gap-2 shadow-none"
                  variant="outline"
                  onClick={() => setIsImportCsvOpen(true)}
                >
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

      return await postCustomers([
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
                  <PhoneNumberPicker
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

type CsvRow = Record<string, string>;

const CSV_MAP_NONE = "__none__";

const MAPS_TO_VALUES = ["name", "email", "phone", "metadata"] as const;
const SINGLE_USE_MAPS_TO = ["name", "email", "phone"] as const;

const mappingRowSchema = z.object({
  csvKey: z.string().min(1, "CSV column is required"),
  mapsTo: z.enum([CSV_MAP_NONE, ...MAPS_TO_VALUES]),
  metadataKey: z.string().optional(),
});

const csvMappingSchema = z.object({
  mappings: z.array(mappingRowSchema),
});

type CsvMappingFormData = z.infer<typeof csvMappingSchema>;
type MapsToOption = CsvMappingFormData["mappings"][number]["mapsTo"];

type MappingEntry = { csvKey: string; mapsTo: string; metadataKey?: string };

const MAPS_TO_ITEMS: { value: string; label: string }[] = [
  { value: CSV_MAP_NONE, label: "Don't map" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "metadata", label: "Metadata" },
];

function applyMappingsToRow(
  row: CsvRow,
  list: MappingEntry[]
): { name: string; email: string; phoneRaw: string; metadataRecord: Record<string, string> } {
  const mapVal = (r: CsvRow, key: string) => String(r[key] ?? "").trim();
  let name = "";
  let email = "";
  let phoneRaw = "";
  const metadataRecord: Record<string, string> = {};
  for (const m of list) {
    const v = mapVal(row, m.csvKey);
    if (m.mapsTo === "name") name = v;
    else if (m.mapsTo === "email") email = v;
    else if (m.mapsTo === "phone") phoneRaw = v;
    else if (m.mapsTo === "metadata" && v) {
      const key = (m.metadataKey || m.csvKey).trim() || m.csvKey;
      metadataRecord[key] = v;
    }
  }
  return { name, email, phoneRaw, metadataRecord };
}

function parseRowToCustomerPayload(
  row: CsvRow,
  list: MappingEntry[]
): Omit<Customer, "id" | "organizationId" | "environment"> | null {
  const { name, email, phoneRaw, metadataRecord } = applyMappingsToRow(row, list);
  const parsed = customerSchema.safeParse({
    name: name || undefined,
    email: email || undefined,
    phoneNumber: { number: phoneRaw || "", countryCode: "US" },
    metadata: Object.entries(metadataRecord).map(([key, value]) => ({ key, value })),
  });
  if (!parsed.success) return null;
  const phoneString = parsed.data.phoneNumber?.number
    ? phoneNumberToString(parsed.data.phoneNumber as PhoneNumber)
    : "";
  return {
    name: parsed.data.name ?? "",
    email: parsed.data.email ?? "",
    phone: phoneString,
    walletAddresses: null,
    metadata: metadataRecord,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function parseCsvFile(file: File): Promise<{ headers: string[]; rows: CsvRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
      const headers = result.meta.fields ?? [];
      const rows = (result.data ?? []).filter((row: CsvRow) =>
        Object.keys(row).some((k) => String(row[k] ?? "").trim() !== "")
      );
      resolve({ headers, rows });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
}

export function ImportCsvModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invalidate = useInvalidateOrgQuery();
  const [csvFile, setCsvFile] = useState<FileWithPreview | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);

  const mappingForm = RHF.useForm<CsvMappingFormData>({
    resolver: zodResolver(csvMappingSchema),
    defaultValues: { mappings: [] },
  });

  const { fields, append, remove } = RHF.useFieldArray({
    control: mappingForm.control,
    name: "mappings",
  });

  React.useEffect(() => {
    if (headers.length > 0) {
      mappingForm.reset({
        mappings: headers.map((h) => ({ csvKey: h, mapsTo: CSV_MAP_NONE, metadataKey: h })),
      });
    } else {
      mappingForm.reset({ mappings: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when headers change
  }, [headers]);

  const handleFilesChange = useCallback(
    async (files: FileWithPreview[]) => {
      const file = files[0];
      if (!file) {
        setCsvFile(null);
        setHeaders([]);
        setParsedRows([]);
        return;
      }
      setCsvFile(file);
      try {
        const { headers: h, rows } = await parseCsvFile(file);
        setHeaders(h);
        setParsedRows(rows);
      } catch {
        toast.error("Could not parse CSV. Ensure the file is valid UTF-8 CSV.");
      }
    },
    []
  );

  const importMutation = useMutation({
    mutationFn: async (data: CsvMappingFormData) => {
      const list = data.mappings as MappingEntry[];
      const payloads = parsedRows
        .map((row) => parseRowToCustomerPayload(row, list))
        .filter((p): p is NonNullable<typeof p> => p != null);
      if (payloads.length === 0) {
        throw new Error("No valid rows. Map Name and Email to CSV columns and ensure rows pass validation.");
      }
      await postCustomers(payloads);
    },
    onSuccess: () => {
      invalidate(["customers"]);
      toast.success(`Imported ${parsedRows.length} customer(s) from CSV.`);
      onOpenChange(false);
      resetState();
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Import failed.");
    },
  });

  const resetState = useCallback(() => {
    setCsvFile(null);
    setHeaders([]);
    setParsedRows([]);
    mappingForm.reset({ mappings: [] });
  }, [mappingForm]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetState();
      onOpenChange(next);
    },
    [onOpenChange, resetState]
  );

  const mappings = mappingForm.watch("mappings");
  const mappingsKey = JSON.stringify(mappings ?? []);

  type MappedPreviewRow = Record<string, string>;
  const { mappedPreviewRows, mappedPreviewColumns } = React.useMemo(() => {
    const list = JSON.parse(mappingsKey) as MappingEntry[];
    const columns: ColumnDef<MappedPreviewRow>[] = [];
    const seen = new Set<string>();
    const addCol = (id: string, label: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      columns.push({
        accessorKey: id,
        header: label,
        cell: ({ row }) => (
          <div
            className="text-muted-foreground max-w-[200px] truncate"
            title={String(row.original[id] ?? "")}
          >
            {String(row.original[id] ?? "")}
          </div>
        ),
      });
    };
    const hasMetadataMapping = list.some((m) => m.mapsTo === "metadata");
    for (const m of list) {
      if (m.mapsTo === "name") addCol("name", "Name");
      else if (m.mapsTo === "email") addCol("email", "Email");
      else if (m.mapsTo === "phone") addCol("phone", "Phone");
    }
    if (hasMetadataMapping) {
      columns.push({
        id: "metadata",
        header: "Metadata",
        cell: ({ row }) => {
          const meta: Record<string, string> = {};
          for (const [k, v] of Object.entries(row.original)) {
            if (k.startsWith("meta:") && v) meta[k.slice(5)] = v;
          }
          if (Object.keys(meta).length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          const json = JSON.stringify(meta, null, 2);
          return (
            <div className="border-border bg-muted/30 max-h-[88px] min-w-[120px] max-w-[200px] overflow-auto rounded-md border px-2 py-1.5">
              <pre className="text-muted-foreground font-mono text-xs leading-relaxed whitespace-pre" role="presentation">
                {json}
              </pre>
            </div>
          );
        },
      });
    }
    const rows: MappedPreviewRow[] = parsedRows.map((csvRow) => {
      const { name, email, phoneRaw, metadataRecord } = applyMappingsToRow(csvRow, list);
      const out: MappedPreviewRow = { name, email, phone: phoneRaw };
      for (const [key, value] of Object.entries(metadataRecord)) {
        if (value) out[`meta:${key}`] = value;
      }
      return out;
    });
    return { mappedPreviewRows: rows, mappedPreviewColumns: columns };
  }, [parsedRows, mappingsKey]);

  const { validCount, invalidCount, hasName, hasEmail, metadataKeys } = React.useMemo(() => {
    const list = JSON.parse(mappingsKey) as MappingEntry[];
    let valid = 0;
    const metaKeys = new Set<string>();
    for (const m of list) {
      if (m.mapsTo === "metadata") metaKeys.add(m.metadataKey || m.csvKey);
    }
    for (const row of parsedRows) {
      if (parseRowToCustomerPayload(row, list) != null) valid += 1;
    }
    return {
      validCount: valid,
      invalidCount: parsedRows.length - valid,
      hasName: list.some((m) => m.mapsTo === "name"),
      hasEmail: list.some((m) => m.mapsTo === "email"),
      metadataKeys: Array.from(metaKeys),
    };
  }, [parsedRows, mappingsKey]);

  const csvColumns: ColumnDef<CsvRow>[] = React.useMemo(
    () =>
      headers.map((h) => ({
        accessorKey: h,
        header: h,
        cell: ({ row }) => (
          <div className="text-muted-foreground max-w-[200px] truncate" title={String(row.original[h] ?? "")}>
            {String(row.original[h] ?? "")}
          </div>
        ),
      })),
    [headers]
  );
  const canImport =
    !!csvFile && parsedRows.length > 0 && (hasName || hasEmail) && !importMutation.isPending;

  const handleAddMapping = useCallback(() => {
    append({ csvKey: headers[0] ?? "", mapsTo: CSV_MAP_NONE, metadataKey: "" });
  }, [headers, append]);

  return (
    <FullScreenModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Import customers from CSV"
      description="Upload a CSV, map columns to customer fields and metadata, then import."
      size="full"
      showCloseButton
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="shadow-none">
            Cancel
          </Button>
          <Button
            type="button"
            className="shadow-none"
            disabled={!canImport}
            isLoading={importMutation.isPending}
            onClick={() => mappingForm.handleSubmit((data) => importMutation.mutate(data))()}
          >
            Import {parsedRows.length > 0 ? `(${parsedRows.length} rows)` : ""}
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-8">
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="min-w-0 space-y-4 lg:min-w-[280px]">
            <h3 className="text-lg font-semibold">1. Upload CSV</h3>
            <FileUploadPicker
              value={csvFile ? [csvFile] : []}
              onFilesChange={handleFilesChange}
              placeholder="Drag & drop a CSV here or click to select"
              description="Header row required. Supports name, email, phone and custom columns for metadata."
              label="CSV file"
              dropzoneAccept={{
                "text/csv": [".csv"],
                "application/vnd.ms-excel": [".csv"],
                "text/plain": [".csv"],
              }}
              dropzoneMaxFiles={1}
              dropzoneMultiple={false}
            />
          </div>
          <div className="min-w-0 space-y-4 overflow-hidden lg:min-w-[280px]">
            <h3 className="text-lg font-semibold">3. Preview</h3>
            {mappedPreviewColumns.length > 0 ? (
              <>
                <p className="text-muted-foreground text-sm">
                  Mapped result — updates in real time as you change the mapping below.
                </p>
                <div className="min-w-0 max-h-[min(50vh,28rem)] overflow-auto rounded-lg border border-border">
                  <DataTable
                    columns={mappedPreviewColumns}
                    data={mappedPreviewRows}
                    emptyMessage="No rows parsed."
                    enableBulkSelect={false}
                  />
                </div>
              </>
            ) : (
              <div className="min-w-0 max-h-[min(50vh,28rem)] overflow-auto rounded-lg border border-border">
                <DataTable
                  columns={csvColumns}
                  data={parsedRows}
                  emptyMessage="No rows parsed. Upload a CSV and set mappings to see the mapped preview."
                  enableBulkSelect={false}
                />
              </div>
            )}
          </div>
        </div>
        {headers.length > 0 && (
          <>
            <Separator />
            <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">2. Map columns</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Map each CSV column to a customer field or to a metadata key. Use &quot;Metadata&quot; and set a
                    key to store values in the customer metadata object.
                  </p>
                </div>
                <div className="border-border min-w-0 max-h-[min(40vh,24rem)] overflow-auto rounded-lg border">
                  <table className="w-full min-w-[420px] table-fixed border-collapse text-left">
                    <thead>
                      <tr className="border-border border-b bg-muted/50">
                        <th className="text-muted-foreground w-[28%] px-4 py-3 text-xs font-medium uppercase tracking-wider">
                          CSV column
                        </th>
                        <th className="text-muted-foreground w-[28%] px-4 py-3 text-xs font-medium uppercase tracking-wider">
                          Maps to
                        </th>
                        <th className="text-muted-foreground w-[28%] px-4 py-3 text-xs font-medium uppercase tracking-wider">
                          Metadata key
                        </th>
                        <th className="w-[16%] px-2 py-3" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const list = (mappings ?? []) as MappingEntry[];
                        const singleUseUsedByOther = new Set(
                          list
                            .map((m, j) => (j !== index ? m.mapsTo : null))
                            .filter((v): v is string => v != null && SINGLE_USE_MAPS_TO.includes(v as (typeof SINGLE_USE_MAPS_TO)[number]))
                        );
                        const mapsToItems = MAPS_TO_ITEMS.map((item) => ({
                          ...item,
                          disabled:
                            item.value !== CSV_MAP_NONE &&
                            item.value !== "metadata" &&
                            singleUseUsedByOther.has(item.value),
                        }));
                        const csvKeyUsedByOther = new Set(
                          list.filter((_, j) => j !== index).map((m) => m.csvKey)
                        );
                        const csvKeyItems = headers.map((h) => ({
                          value: h,
                          label: h,
                          disabled: csvKeyUsedByOther.has(h),
                        }));
                        const showMetadataKey = mappingForm.watch(`mappings.${index}.mapsTo`) === "metadata";
                        return (
                          <tr key={field.id} className="border-border border-b last:border-b-0">
                            <td className="px-4 py-2 align-middle">
                              <SelectPicker
                                id={`mapping-csvKey-${index}`}
                                value={mappingForm.watch(`mappings.${index}.csvKey`)}
                                onChange={(v) => mappingForm.setValue(`mappings.${index}.csvKey`, v)}
                                items={csvKeyItems}
                                placeholder="Column…"
                              />
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <SelectPicker
                                id={`mapping-mapsTo-${index}`}
                                value={mappingForm.watch(`mappings.${index}.mapsTo`)}
                                onChange={(v) => {
                                  mappingForm.setValue(`mappings.${index}.mapsTo`, v as MapsToOption);
                                  if (v === "metadata") {
                                    const csvKey = mappingForm.getValues(`mappings.${index}.csvKey`);
                                    const meta = mappingForm.getValues(`mappings.${index}.metadataKey`);
                                    if (!meta?.trim()) mappingForm.setValue(`mappings.${index}.metadataKey`, csvKey);
                                  }
                                }}
                                items={mapsToItems}
                                placeholder="Field…"
                              />
                            </td>
                            <td className="px-4 py-2 align-middle">
                              {showMetadataKey ? (
                                <SelectPicker
                                  id={`mapping-metadataKey-${index}`}
                                  value={
                                    (mappingForm.watch(`mappings.${index}.metadataKey`) ||
                                      mappingForm.watch(`mappings.${index}.csvKey`) ||
                                      headers[0]) ??
                                    ""
                                  }
                                  onChange={(v) => mappingForm.setValue(`mappings.${index}.metadataKey`, v)}
                                  items={headers.map((h) => ({ value: h, label: h }))}
                                  placeholder="Key…"
                                />
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2 align-middle">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="shrink-0 shadow-none"
                                aria-label="Remove mapping"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="border-border border-t p-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMapping}
                      className="w-full shadow-none"
                      disabled={headers.length === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add mapping
                    </Button>
                  </div>
                </div>
              </div>
              <div className="min-w-0 space-y-4">
                <h3 className="text-lg font-semibold">Import summary</h3>
                <Card className="border-border overflow-hidden shadow-none">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm font-medium">Rows</p>
                      <p className="text-sm">
                        <span className="font-medium">{parsedRows.length}</span> total
                        {parsedRows.length > 0 && (
                          <>
                            {" · "}
                            <span className={validCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                              {validCount} valid
                            </span>
                            {invalidCount > 0 && (
                              <>
                                {" · "}
                                <span className="text-muted-foreground">{invalidCount} skipped</span>
                              </>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm font-medium">Required fields</p>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          {hasName ? (
                            <Check className="text-emerald-600 h-4 w-4 shrink-0" aria-hidden />
                          ) : (
                            <X className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                          )}
                          <span>Name mapped</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {hasEmail ? (
                            <Check className="text-emerald-600 h-4 w-4 shrink-0" aria-hidden />
                          ) : (
                            <X className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                          )}
                          <span>Email mapped</span>
                        </li>
                      </ul>
                    </div>
                    {metadataKeys.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-sm font-medium">Metadata keys</p>
                        <p className="text-sm">
                          {metadataKeys.join(", ")}
                        </p>
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Tips</p>
                      <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
                        <li>Map <strong className="text-foreground">Name</strong> and <strong className="text-foreground">Email</strong> for rows to be imported.</li>
                        <li>Use <strong className="text-foreground">Metadata</strong> for custom fields (e.g. company, plan).</li>
                        <li>Skipped rows fail validation (e.g. invalid email or missing required fields).</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </FullScreenModal>
  );
}
