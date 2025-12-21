"use client";

import { useState } from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { ProductsModal } from "@/components/products/products-modal";
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
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>("Created");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeProducts = mockProducts.filter((p) => p.status === "active");
  const archivedProducts = mockProducts.filter((p) => p.status === "archived");

  const filteredProducts = selectedStatus
    ? mockProducts.filter((p) => p.status === selectedStatus)
    : mockProducts;

  // Table actions
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
        onOpenChange={setIsModalOpen}
        onSubmit={async (data) => {
          console.log("Product created:", data);
          // Add your API call here
        }}
      />
    </div>
  );
}
