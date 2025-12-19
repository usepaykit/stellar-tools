"use client";

import { useState } from "react";

import { DashboardSidebarInset } from "@/components/dashboard/app-sidebar-inset";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DataTable, TableAction } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { truncate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

// Customer type definition
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

// Column definitions
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

// Filter mapping
const filterMap: Record<number, string> = {
  0: "All",
  1: "First-time customers",
  2: "Recent customers",
};

// Filter options (numeric indices)
const filterOptions = [0, 1, 2];

export default function CustomersPage() {
  const [selectedFilter, setSelectedFilter] = useState<number>(0);
  const router = useRouter();

  // Handle row click to navigate to customer detail page
  const handleRowClick = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}`);
  };

  // Table actions
  const tableActions: TableAction<Customer>[] = [
    {
      label: "Create invoice",
      onClick: (customer) => {
        console.log("Create invoice for:", customer);
        // Add your create invoice logic here
      },
    },
    {
      label: "Create subscription",
      onClick: (customer) => {
        console.log("Create subscription for:", customer);
        // Add your create subscription logic here
      },
    },
  ];

  return (
    <div className="w-full">
      <DashboardSidebar>
        <DashboardSidebarInset>
          <div className="flex flex-col gap-6 p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Customers</h1>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add customer
                </Button>
              </div>

              {/* Filter Pills */}
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

            {/* Data Table */}
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
    </div>
  );
}
