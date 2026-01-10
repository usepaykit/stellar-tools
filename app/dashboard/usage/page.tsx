"use client";

import * as React from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Package, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UsageRecord = {
  id: string;
  customerId: string;
  productId: string;
  balance: number;
  consumed: number;
  granted: number;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
  };
};

const mockUsageRecords: UsageRecord[] = [
  {
    id: "usage_1",
    customerId: "cus_1",
    productId: "prod_1",
    balance: 1000,
    consumed: 250,
    granted: 1000,
    createdAt: new Date("2024-12-20"),
    updatedAt: new Date("2024-12-22"),
    customer: {
      id: "cus_1",
      name: "John Doe",
      email: "john.doe@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
  {
    id: "usage_2",
    customerId: "cus_2",
    productId: "prod_2",
    balance: 5000,
    consumed: 3200,
    granted: 5000,
    createdAt: new Date("2024-12-18"),
    updatedAt: new Date("2024-12-22"),
    customer: {
      id: "cus_2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
    },
    product: {
      id: "prod_2",
      name: "Enterprise Plan",
    },
  },
  {
    id: "usage_3",
    customerId: "cus_3",
    productId: "prod_1",
    balance: 2000,
    consumed: 150,
    granted: 2000,
    createdAt: new Date("2024-12-15"),
    updatedAt: new Date("2024-12-21"),
    customer: {
      id: "cus_3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
    },
    product: {
      id: "prod_1",
      name: "Premium Plan",
    },
  },
  {
    id: "usage_4",
    customerId: "cus_4",
    productId: "prod_3",
    balance: 10000,
    consumed: 8500,
    granted: 10000,
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-22"),
    customer: {
      id: "cus_4",
      name: "Alice Williams",
      email: "alice.williams@example.com",
    },
    product: {
      id: "prod_3",
      name: "Business Plan",
    },
  },
  {
    id: "usage_5",
    customerId: "cus_5",
    productId: "prod_2",
    balance: 3000,
    consumed: 2800,
    granted: 3000,
    createdAt: new Date("2024-12-12"),
    updatedAt: new Date("2024-12-20"),
    customer: {
      id: "cus_5",
      name: "Charlie Brown",
      email: "charlie.brown@example.com",
    },
    product: {
      id: "prod_2",
      name: "Enterprise Plan",
    },
  },
];

const columns: ColumnDef<UsageRecord>[] = [
  {
    accessorKey: "meteredBilling",
    header: "Metered Billing",
    cell: ({ row }) => {
      const record = row.original;
      const usagePercentage = (record.consumed / record.granted) * 100;
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {record.consumed.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-sm">
              / {record.granted.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <span className="text-muted-foreground text-xs">
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer) return <span className="text-muted-foreground">N/A</span>;
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{customer.name}</span>
          <span className="text-muted-foreground text-sm">
            {customer.email}
          </span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const product = row.original.product;
      return (
        <div className="flex items-center gap-2">
          <Package className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{product?.name || "Unknown Product"}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <span className="text-sm">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );
    },
    enableSorting: true,
  },
];

export default function UsagePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter records based on search query
  const filteredRecords = React.useMemo(() => {
    if (!searchQuery.trim()) return mockUsageRecords;

    const query = searchQuery.toLowerCase();
    return mockUsageRecords.filter(
      (record) =>
        record.customer?.name.toLowerCase().includes(query) ||
        record.customer?.email.toLowerCase().includes(query) ||
        record.product?.name.toLowerCase().includes(query) ||
        record.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const tableActions: TableAction<UsageRecord>[] = [
    {
      label: "View Product",
      onClick: (record) => {
        router.push(`/dashboard/products/${record.productId}`);
      },
    },
    {
      label: "View Customer",
      onClick: (record) => {
        router.push(`/dashboard/customers/${record.customerId}`);
      },
    },
    {
      label: "View Payment",
      onClick: (record) => {
        router.push(
          `/dashboard/transactions?customer=${record.customerId}&paymentId=x`
        );
      },
    },
    {
      label: "Revoke",
      onClick: (record) => {
        console.log("Revoke usage record:", record.id);
        // Add your revoke logic here
      },
      variant: "destructive",
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Usage</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Monitor metered billing and usage records
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="max-w-md">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder="Search by customer, email, product, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Table */}
            <DataTable
              columns={columns}
              data={filteredRecords}
              actions={tableActions}
              onRowClick={(row) => {
                // Navigate to customer page
                router.push(`/dashboard/usage/${row.id}`);
              }}
            />
          </div>
        </DashboardSidebarInset>
      </DashboardSidebar>
    </div>
  );
}
